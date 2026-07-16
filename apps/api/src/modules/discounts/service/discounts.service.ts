import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateDiscountDto } from "../dto/create-discount.dto";
import { Decimal } from "@fortifykitchen/database";

@Injectable()
export class DiscountsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const list = await this.db.client.discount.findMany({
      orderBy: { startsAt: "desc" },
    });

    // Discount.customerId is a plain scalar, not a Prisma relation (kept
    // loose deliberately — see the model comment), so we can't `include` a
    // customer here. For any legacy customer-scoped rows (pre-migration
    // plan vouchers, or a hand-created one-off), do a single follow-up
    // lookup and attach the name so the admin list can show "Linked to
    // <customer name>" instead of a bare, meaningless customerId.
    const customerIds = [...new Set(list.map((d) => d.customerId).filter((id): id is string => !!id))];
    const customers = customerIds.length
      ? await this.db.client.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];
    const customerNameById = new Map(customers.map((c) => [c.id, c.name]));

    return list.map((item) => ({
      ...item,
      amount: Number(item.amount),
      customerName: item.customerId ? (customerNameById.get(item.customerId) ?? null) : null,
    }));
  }

  async create(dto: CreateDiscountDto) {
    const existing = await this.db.client.discount.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Discount code ${dto.code} already exists`);
    }

    const created = await this.db.client.discount.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        amount: new Decimal(dto.amount),
        isActive: dto.isActive,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        description: dto.description?.trim() || null,
        usageLimit: dto.usageLimit ?? null,
      },
    });

    return {
      ...created,
      amount: Number(created.amount),
    };
  }

  // userId is optional — this endpoint is intentionally public (usable
  // before login, e.g. a guest previewing a code) — but when the caller IS
  // logged in, the customer-web live-preview widget calls this with their
  // token so it can catch "you've already used this code" up front instead
  // of only discovering it after a full checkout attempt fails at order
  // creation (which was confusing: the preview showed the discount as
  // applied right up until the "Đặt hàng" click did nothing obvious).
  async verify(code: string, userId?: string) {
    const discount = await this.db.client.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      throw new NotFoundException(`Discount code ${code} not found`);
    }

    if (!discount.isActive) {
      throw new BadRequestException("Discount code is inactive");
    }

    const now = new Date();
    if (now < discount.startsAt) {
      throw new BadRequestException("Discount code has not started yet");
    }

    if (now > discount.endsAt) {
      throw new BadRequestException("Discount code has expired");
    }

    // Preview-only check — the real, race-safe claim happens atomically
    // inside OrdersService.create's transaction. This just lets the
    // customer-web live-preview widget say "out of uses" immediately while
    // typing, instead of only discovering it after a failed checkout.
    if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
      throw new BadRequestException(`Discount code "${code}" has reached its usage limit.`);
    }

    if (userId) {
      const customer = await this.db.client.customer.findFirst({ where: { userId } });
      if (customer) {
        if (discount.customerId && discount.customerId !== customer.id) {
          throw new BadRequestException(`Discount code "${code}" is not valid for your account`);
        }
        const alreadyUsed = await this.db.client.discountRedemption.findFirst({
          where: { discountId: discount.id, customerId: customer.id },
        });
        if (alreadyUsed) {
          throw new BadRequestException(`Discount code "${code}" has already been used on your account.`);
        }
      }
    }

    return {
      ...discount,
      amount: Number(discount.amount),
    };
  }

  async remove(id: string) {
    const discount = await this.db.client.discount.findUnique({ where: { id } });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    await this.db.client.discount.delete({
      where: { id },
    });
  }
}
