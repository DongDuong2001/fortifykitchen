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
