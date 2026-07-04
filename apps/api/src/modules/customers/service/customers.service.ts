import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { CustomerProfile } from "@fortifykitchen/types";

@Injectable()
export class CustomersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<CustomerProfile[]> {
    const list = await this.db.client.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list.map((c) => ({
      ...c,
      preferences: c.preferences ? (c.preferences as Record<string, any>) : undefined,
    }));
  }

  async findOneByUserId(userId: string): Promise<CustomerProfile> {
    const customer = await this.db.client.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer profile not found for user ID ${userId}`);
    }

    return {
      ...customer,
      preferences: customer.preferences ? (customer.preferences as Record<string, any>) : undefined,
    };
  }

  async updateByUserId(userId: string, dto: UpdateCustomerDto): Promise<CustomerProfile> {
    const customer = await this.findOneByUserId(userId);

    const updated = await this.db.client.customer.update({
      where: { id: customer.id },
      data: {
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        preferences: dto.preferences ?? undefined,
      },
    });

    return {
      ...updated,
      preferences: updated.preferences ? (updated.preferences as Record<string, any>) : undefined,
    };
  }
}
