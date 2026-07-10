import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateCustomPlanRequestDto } from "../dto/create-custom-plan-request.dto";
import { UpdateCustomPlanRequestDto } from "../dto/update-custom-plan-request.dto";
import { normalizePhone } from "../../../common/utils/phone.util";
import { CustomPlanRequest } from "@fortifykitchen/types";
import { CustomPlanRequestStatus } from "@fortifykitchen/database";

type RawRequest = {
  id: string;
  customerId: string | null;
  customerName: string;
  phone: string | null;
  desiredProteins: string[];
  estimatedTotalGrams: number | null;
  preferredIntervalDays: number | null;
  budgetHint: number | null;
  notes: string | null;
  status: string;
  adminNotes: string | null;
  matchedSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CustomPlanRequestsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateCustomPlanRequestDto): Promise<CustomPlanRequest> {
    let customerId = dto.customerId;
    // If a phone number matches an existing Customer, link the request to
    // them even if the caller didn't pass customerId explicitly (mirrors
    // the "reuse existing customer by phone" pattern used by public order
    // and subscription creation).
    if (!customerId && dto.phone) {
      const existing = await this.db.client.customer.findFirst({ where: { phone: normalizePhone(dto.phone) } });
      if (existing) customerId = existing.id;
    }

    const request = await this.db.client.customPlanRequest.create({
      data: {
        customerId,
        customerName: dto.customerName,
        phone: dto.phone ? normalizePhone(dto.phone) : undefined,
        desiredProteins: dto.desiredProteins ?? [],
        estimatedTotalGrams: dto.estimatedTotalGrams,
        preferredIntervalDays: dto.preferredIntervalDays,
        budgetHint: dto.budgetHint,
        notes: dto.notes,
        status: CustomPlanRequestStatus.PENDING,
      },
    });
    return this.mapRequest(request);
  }

  async findAll(status?: CustomPlanRequestStatus): Promise<CustomPlanRequest[]> {
    const list = await this.db.client.customPlanRequest.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });
    return list.map((r) => this.mapRequest(r));
  }

  async findOne(id: string): Promise<CustomPlanRequest> {
    const request = await this.db.client.customPlanRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Custom plan request with ID ${id} not found`);
    }
    return this.mapRequest(request);
  }

  async findForPhone(phone: string): Promise<CustomPlanRequest[]> {
    const normalized = normalizePhone(phone);
    const list = await this.db.client.customPlanRequest.findMany({
      where: { phone: normalized },
      orderBy: { createdAt: "desc" },
    });
    return list.map((r) => this.mapRequest(r));
  }

  async findForUser(userId: string): Promise<CustomPlanRequest[]> {
    const customer = await this.db.client.customer.findFirst({ where: { userId } });
    if (!customer) return [];
    const list = await this.db.client.customPlanRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });
    return list.map((r) => this.mapRequest(r));
  }

  async update(id: string, dto: UpdateCustomPlanRequestDto): Promise<CustomPlanRequest> {
    await this.findOne(id);
    const request = await this.db.client.customPlanRequest.update({
      where: { id },
      data: { status: dto.status, adminNotes: dto.adminNotes },
    });
    return this.mapRequest(request);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db.client.customPlanRequest.delete({ where: { id } });
  }

  private mapRequest(r: RawRequest): CustomPlanRequest {
    return {
      id: r.id,
      customerId: r.customerId ?? undefined,
      customerName: r.customerName,
      phone: r.phone ?? undefined,
      desiredProteins: r.desiredProteins as CustomPlanRequest["desiredProteins"],
      estimatedTotalGrams: r.estimatedTotalGrams ?? undefined,
      preferredIntervalDays: r.preferredIntervalDays ?? undefined,
      budgetHint: r.budgetHint ?? undefined,
      notes: r.notes ?? undefined,
      status: r.status as CustomPlanRequest["status"],
      adminNotes: r.adminNotes ?? undefined,
      matchedSubscriptionId: r.matchedSubscriptionId ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
