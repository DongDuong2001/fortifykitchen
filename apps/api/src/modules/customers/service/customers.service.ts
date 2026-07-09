import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateCustomerDto } from "../dto/create-customer.dto";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { normalizePhone } from "../../../common/utils/phone.util";
import { parsePagination } from "../../../common/utils/pagination.util";
import { Customer } from "@fortifykitchen/types";

@Injectable()
export class CustomersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(page?: string, limit?: string): Promise<Customer[]> {
    const { skip, take } = parsePagination(page, limit);
    const list = await this.db.client.customer.findMany({
      orderBy: { createdAt: "desc" },
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });
    return list.map((c) => this.mapCustomer(c));
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.db.client.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.mapCustomer(customer);
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = await this.db.client.customer.create({
      data: {
        name: dto.name,
        // Normalized so staff-entered numbers match however a customer
        // types their own phone back on the storefront (see phone.util.ts).
        phone: dto.phone ? normalizePhone(dto.phone) : dto.phone,
        zalo: dto.zalo,
        address: dto.address,
        notes: dto.notes,
      },
    });

    return this.mapCustomer(customer);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    await this.findOne(id);

    const customer = await this.db.client.customer.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone ? normalizePhone(dto.phone) : dto.phone,
        zalo: dto.zalo,
        address: dto.address,
        notes: dto.notes,
      },
    });

    return this.mapCustomer(customer);
  }

  // Deleting a customer does NOT cascade-delete their orders/subscriptions —
  // those records are orphaned (customerId set to null via the schema's
  // onDelete: SetNull) but keep their denormalized customerName snapshot,
  // matching the original app's behavior.
  async remove(id: string): Promise<{ linkedOrders: number; linkedSubscriptions: number }> {
    await this.findOne(id);

    const [linkedOrders, linkedSubscriptions] = await Promise.all([
      this.db.client.order.count({ where: { customerId: id } }),
      this.db.client.subscription.count({ where: { customerId: id } }),
    ]);

    await this.db.client.customer.delete({ where: { id } });

    return { linkedOrders, linkedSubscriptions };
  }

  async findByUserId(userId: string): Promise<Customer> {
    const customer = await this.db.client.customer.findFirst({
      where: { userId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer for user ID ${userId} not found`);
    }
    return this.mapCustomer(customer);
  }

  private mapCustomer(customer: {
    id: string;
    userId: string | null;
    name: string;
    phone: string | null;
    zalo: string | null;
    address: string | null;
    notes: string | null;
    walletBalance: number;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return {
      id: customer.id,
      userId: customer.userId ?? undefined,
      name: customer.name,
      phone: customer.phone ?? undefined,
      zalo: customer.zalo ?? undefined,
      address: customer.address ?? undefined,
      notes: customer.notes ?? undefined,
      walletBalance: customer.walletBalance,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
