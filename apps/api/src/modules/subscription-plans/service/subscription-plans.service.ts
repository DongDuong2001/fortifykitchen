import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateSubscriptionPlanDto } from "../dto/create-subscription-plan.dto";
import { UpdateSubscriptionPlanDto } from "../dto/update-subscription-plan.dto";
import { Decimal, PaymentMethod, PaymentStatus } from "@fortifykitchen/database";
import { SubscriptionPlan } from "@fortifykitchen/types";

type RawPlan = {
  id: string;
  name: string;
  price: number;
  voucherPercent: number;
  description: string | null;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.db.client.subscriptionPlan.create({
      data: {
        name: dto.name,
        price: dto.price,
        voucherPercent: dto.voucherPercent ?? 0,
        description: dto.description,
        features: dto.features ?? [],
        isActive: dto.isActive ?? true,
      },
    });
    return this.mapPlan(plan);
  }

  // Staff view — every plan, active or not.
  async findAll(): Promise<SubscriptionPlan[]> {
    const list = await this.db.client.subscriptionPlan.findMany({ orderBy: { price: "asc" } });
    return list.map((p: any) => this.mapPlan(p));
  }

  // Storefront view — only what a customer can actually buy right now.
  async findActive(): Promise<SubscriptionPlan[]> {
    const list = await this.db.client.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    return list.map((p: any) => this.mapPlan(p));
  }

  async findOne(id: string): Promise<SubscriptionPlan> {
    const plan = await this.db.client.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return this.mapPlan(plan);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    await this.findOne(id);
    const plan = await this.db.client.subscriptionPlan.update({
      where: { id },
      data: {
        name: dto.name,
        price: dto.price,
        voucherPercent: dto.voucherPercent,
        description: dto.description,
        features: dto.features,
        isActive: dto.isActive,
      },
    });
    return this.mapPlan(plan);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db.client.subscriptionPlan.delete({ where: { id } });
  }

  // Customer-initiated: "I want to buy this tier." Doesn't touch the wallet
  // yet — it just opens a PENDING Payment row for staff to reconcile against
  // the bank transfer they receive (decided: "they will transfer to our
  // bank, and we will top it up" — no automatic/instant top-up).
  async purchase(planId: string, userId: string) {
    const plan = await this.db.client.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`Subscription plan with ID ${planId} not found`);
    }

    let customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) {
      const user = await this.db.client.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException("No customer profile found for this account");
      }
      customer = await this.db.client.customer.create({
        data: {
          userId: user.id,
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        },
      });
    }

    const payment = await this.db.client.payment.create({
      data: {
        customerId: customer.id,
        subscriptionPlanId: plan.id,
        amount: new Decimal(plan.price),
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      },
    });

    return this.mapPayment(payment, plan.name);
  }

  // Staff queue — every plan-purchase Payment still waiting on a bank
  // transfer to be reconciled.
  async findPendingPurchases() {
    const list = await this.db.client.payment.findMany({
      where: { subscriptionPlanId: { not: null }, status: PaymentStatus.PENDING },
      orderBy: { createdAt: "asc" },
    });
    if (list.length === 0) return [];

    const customerIds = [...new Set(list.map((p: any) => p.customerId).filter((id): id is string => !!id))];
    const planIds = [...new Set(list.map((p: any) => p.subscriptionPlanId).filter((id): id is string => !!id))];
    const [customers, plans] = await Promise.all([
      this.db.client.customer.findMany({ where: { id: { in: customerIds } } }),
      this.db.client.subscriptionPlan.findMany({ where: { id: { in: planIds } } }),
    ]);
    const customerNameById = new Map(customers.map((c: any) => [c.id, c.name]));
    const planNameById = new Map(plans.map((p: any) => [p.id, p.name]));

    return list.map((p: any) => ({
      ...this.mapPayment(p, p.subscriptionPlanId ? (planNameById.get(p.subscriptionPlanId) as string) : undefined),
      customerName: p.customerId ? customerNameById.get(p.customerId) : undefined,
    }));
  }

  // Staff confirms the bank transfer actually landed — THIS is the moment
  // the wallet balance and voucher actually get created, never at purchase
  // time (decided: manual top-up, not instant/automatic).
  async confirmPurchase(paymentId: string) {
    const payment = await this.db.client.payment.findUnique({ where: { id: paymentId } });
    if (!payment || !payment.subscriptionPlanId) {
      throw new NotFoundException(`Plan purchase with ID ${paymentId} not found`);
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment ${paymentId} is already ${payment.status}, not PENDING`);
    }
    if (!payment.customerId) {
      throw new BadRequestException(`Payment ${paymentId} has no customer attached`);
    }

    const plan = await this.db.client.subscriptionPlan.findUnique({ where: { id: payment.subscriptionPlanId } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan for payment ${paymentId} no longer exists`);
    }

    const amount = Number(payment.amount);

    const updated = await this.db.client.$transaction(async (tx) => {
      const confirmed = await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.COMPLETED },
      });

      const customerUpdate: { walletBalance: { increment: number }; planDiscountPercent?: number; currentPlanId: string } = {
        walletBalance: { increment: amount },
        // Purely informational (see Customer.currentPlanId doc comment) —
        // tracks which tier this balance came from so the wallet page can
        // show its name/benefits. Always overwritten here regardless of
        // voucherPercent, since even a 0%-voucher tier is still "the plan
        // they bought."
        currentPlanId: plan.id,
      };

      // Sets (not stacks/accumulates) the recurring discount — a fresh
      // self-serve purchase is only reachable once the previous one's
      // balance has been spent down to 0 (see the purchase() guard above),
      // so there's never an existing discount to preserve or compare
      // against here. Indefinite — no expiry date; it just stays in effect
      // until walletBalance runs out again (see Customer.planDiscountPercent
      // doc comment). Approved upgrade requests also route through here
      // (see approveUpgradeRequest), where this line does the same "sets
      // the new tier" job even though some of the resulting balance came
      // from the customer's pre-existing leftover credit, not just this
      // Payment's amount.
      if (plan.voucherPercent > 0) {
        customerUpdate.planDiscountPercent = plan.voucherPercent;
      }

      await tx.customer.update({
        where: { id: payment.customerId! },
        data: customerUpdate,
      });

      return confirmed;
    });

    return this.mapPayment(updated, plan.name);
  }

  // Staff rejects a pending purchase (e.g. duplicate, wrong amount received,
  // never actually arrived) — no wallet credit, no voucher.
  async rejectPurchase(paymentId: string) {
    const payment = await this.db.client.payment.findUnique({ where: { id: paymentId } });
    if (!payment || !payment.subscriptionPlanId) {
      throw new NotFoundException(`Plan purchase with ID ${paymentId} not found`);
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment ${paymentId} is already ${payment.status}, not PENDING`);
    }
    const updated = await this.db.client.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
    });
    return this.mapPayment(updated);
  }

  // Customer-initiated: "I already have a plan discount (walletBalance > 0),
  // but I want to move to a higher tier now instead of waiting to run out."
  // Normally purchase() blocks this outright (one active plan at a time) —
  // this is the self-serve ask instead of "contact our team." Doesn't touch
  // the wallet or the request itself; staff review and approve/decline (see
  // approveUpgradeRequest, which prorates against the leftover balance).
  // Deliberately does NOT validate that requestedPlan is a strictly "higher"
  // tier than whatever plan the customer originally bought — Customer only
  // stores the resulting planDiscountPercent, not which SubscriptionPlan
  // produced it, so there's nothing reliable to compare against here. Staff
  // make that call when they review the request.
  async requestUpgrade(userId: string, requestedPlanId: string, notes?: string) {
    const plan = await this.db.client.subscriptionPlan.findUnique({ where: { id: requestedPlanId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`Subscription plan with ID ${requestedPlanId} not found`);
    }

    let customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) {
      const user = await this.db.client.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException("No customer profile found for this account");
      }
      customer = await this.db.client.customer.create({
        data: {
          userId: user.id,
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        },
      });
    }

    const existingPending = await this.db.client.planUpgradeRequest.findFirst({
      where: { customerId: customer.id, status: "PENDING" },
    });
    if (existingPending) {
      throw new BadRequestException("You already have a pending plan upgrade request. Please wait for staff to review it.");
    }

    const request = await this.db.client.planUpgradeRequest.create({
      data: {
        customerId: customer.id,
        requestedPlanId: plan.id,
        notes,
      },
    });

    return this.mapUpgradeRequest(request, customer.name, plan.name);
  }

  // Customer's own view of their upgrade-request history.
  async findMyUpgradeRequests(userId: string) {
    let customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) {
      const user = await this.db.client.user.findUnique({ where: { id: userId } });
      if (!user) {
        return [];
      }
      customer = await this.db.client.customer.create({
        data: {
          userId: user.id,
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        },
      });
    }
    const list = await this.db.client.planUpgradeRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });
    const planIds = [...new Set(list.map((r: any) => r.requestedPlanId))];
    const plans = await this.db.client.subscriptionPlan.findMany({ where: { id: { in: planIds } } });
    const planNameById = new Map(plans.map((p: any) => [p.id, p.name]));
    return list.map((r: any) => this.mapUpgradeRequest(r, customer.name, planNameById.get(r.requestedPlanId) as string));
  }

  // Staff queue — every upgrade request still awaiting review.
  async findPendingUpgradeRequests() {
    const list = await this.db.client.planUpgradeRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (list.length === 0) return [];

    const customerIds = [...new Set(list.map((r: any) => r.customerId))];
    const planIds = [...new Set(list.map((r: any) => r.requestedPlanId))];
    const [customers, plans] = await Promise.all([
      this.db.client.customer.findMany({ where: { id: { in: customerIds } } }),
      this.db.client.subscriptionPlan.findMany({ where: { id: { in: planIds } } }),
    ]);
    const customerNameById = new Map(customers.map((c: any) => [c.id, c.name]));
    const planNameById = new Map(plans.map((p: any) => [p.id, p.name]));

    return list.map((r: any) =>
      this.mapUpgradeRequest(r, customerNameById.get(r.customerId) as string, planNameById.get(r.requestedPlanId) as string),
    );
  }

  // Staff approves — this does NOT credit the wallet itself. It creates the
  // same kind of PENDING Payment purchase() would (deliberately bypassing
  // the one-active-discount guard, since staff have now explicitly signed
  // off), so confirmPurchase() remains the one place that ever actually
  // credits walletBalance / sets the new discount tier, once the customer's
  // bank transfer for the new tier lands.
  //
  // PRORATED: the customer's current walletBalance is credit already sitting
  // there from their existing plan, so they don't pay for the new tier from
  // scratch — only the shortfall. E.g. they have 1,000,000đ left and the new
  // tier costs 3,000,000đ, they transfer 2,000,000đ; once staff confirm that
  // transfer, confirmPurchase() increments the existing 1,000,000đ by that
  // 2,000,000đ, landing exactly on the new tier's full price. If their
  // leftover balance already covers the new tier's price (moving to a
  // cheaper/equal tier for the voucherPercent, say), amount floors at 0 — a
  // free "confirm" with no transfer needed, still going through the same
  // queue so confirmPurchase() sets the new discount tier.
  async approveUpgradeRequest(requestId: string) {
    const request = await this.db.client.planUpgradeRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Plan upgrade request with ID ${requestId} not found`);
    }
    if (request.status !== "PENDING") {
      throw new BadRequestException(`Upgrade request ${requestId} is already ${request.status}, not PENDING`);
    }

    const plan = await this.db.client.subscriptionPlan.findUnique({ where: { id: request.requestedPlanId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`Subscription plan for upgrade request ${requestId} no longer exists`);
    }

    const customer = await this.db.client.customer.findUnique({ where: { id: request.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer for upgrade request ${requestId} no longer exists`);
    }

    // Snapshot the shortfall at approval time — if the customer spends more
    // from their wallet between now and staff confirming the transfer, the
    // amount owed doesn't retroactively change (same as any other pending
    // Payment amount never moving once opened).
    const proratedAmount = Math.max(plan.price - customer.walletBalance, 0);

    const updated = await this.db.client.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: {
          customerId: request.customerId,
          subscriptionPlanId: plan.id,
          amount: new Decimal(proratedAmount),
          method: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.PENDING,
        },
      });

      return tx.planUpgradeRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED", paymentId: payment.id },
      });
    });

    return this.mapUpgradeRequest(updated, undefined, plan.name);
  }

  // Staff declines — e.g. not actually eligible, wrong tier requested.
  async declineUpgradeRequest(requestId: string, adminNotes?: string) {
    const request = await this.db.client.planUpgradeRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Plan upgrade request with ID ${requestId} not found`);
    }
    if (request.status !== "PENDING") {
      throw new BadRequestException(`Upgrade request ${requestId} is already ${request.status}, not PENDING`);
    }
    const updated = await this.db.client.planUpgradeRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED", adminNotes },
    });
    return this.mapUpgradeRequest(updated);
  }

  private mapUpgradeRequest(
    r: {
      id: string;
      customerId: string;
      requestedPlanId: string;
      notes: string | null;
      status: string;
      adminNotes: string | null;
      paymentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    customerName?: string,
    requestedPlanName?: string,
  ) {
    return {
      id: r.id,
      customerId: r.customerId,
      customerName,
      requestedPlanId: r.requestedPlanId,
      requestedPlanName,
      notes: r.notes ?? undefined,
      status: r.status,
      adminNotes: r.adminNotes ?? undefined,
      paymentId: r.paymentId ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapPlan(p: RawPlan): SubscriptionPlan {
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      voucherPercent: p.voucherPercent,
      description: p.description ?? undefined,
      features: p.features ?? [],
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private mapPayment(
    p: {
      id: string;
      orderId: string | null;
      subscriptionId: string | null;
      customerId: string | null;
      subscriptionPlanId: string | null;
      amount: Decimal;
      method: PaymentMethod;
      status: PaymentStatus;
      transactionId: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    planName?: string,
  ) {
    return {
      id: p.id,
      orderId: p.orderId ?? undefined,
      subscriptionId: p.subscriptionId ?? undefined,
      customerId: p.customerId ?? undefined,
      subscriptionPlanId: p.subscriptionPlanId ?? undefined,
      planName,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      transactionId: p.transactionId ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
