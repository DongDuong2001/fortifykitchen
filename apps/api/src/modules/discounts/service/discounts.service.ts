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
    return list.map((item) => ({
      ...item,
      amount: Number(item.amount),
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
      },
    });

    return {
      ...created,
      amount: Number(created.amount),
    };
  }

  async verify(code: string) {
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

    return {
      ...discount,
      amount: Number(discount.amount),
    };
  }

  // A customer's own personal voucher (Discount.customerId set, issued
  // automatically on a SubscriptionPlan purchase — see
  // SubscriptionPlansService.confirmPurchase) was previously invisible on
  // customer-web: nothing surfaced the code, so it could never actually be
  // applied without staff reading it out of the admin dashboard. This
  // powers auto-filling the checkout discount code field with the
  // customer's own still-valid voucher, if they have one - never a public
  // code, which stays opt-in/manually typed.
  async findMyActive(userId: string) {
    const customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) return null;

    const now = new Date();
    const discount = await this.db.client.discount.findFirst({
      where: {
        customerId: customer.id,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      // Soonest-expiring first, in the unlikely case more than one is
      // active at once (e.g. two plan purchases before either was used).
      orderBy: { endsAt: "asc" },
    });
    if (!discount) return null;

    return { ...discount, amount: Number(discount.amount) };
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
