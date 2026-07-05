import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { AdjustStockDto } from "../dto/adjust-stock.dto";
import { MenuItem } from "@fortifykitchen/types";

@Injectable()
export class MenuService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(categoryId?: string): Promise<MenuItem[]> {
    const items = await this.db.client.menuItem.findMany({
      where: categoryId ? { categoryId, isAvailable: true } : { isAvailable: true },
      orderBy: [{ protein: "asc" }, { flavor: "asc" }, { sizeGrams: "asc" }],
    });

    return items.map((item) => this.mapMenuItem(item));
  }

  async findAllAdmin(): Promise<MenuItem[]> {
    const items = await this.db.client.menuItem.findMany({
      orderBy: [{ protein: "asc" }, { flavor: "asc" }, { sizeGrams: "asc" }],
    });

    return items.map((item) => this.mapMenuItem(item));
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.db.client.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    return this.mapMenuItem(item);
  }

  async create(dto: CreateMenuItemDto): Promise<MenuItem> {
    if (dto.categoryId) {
      const category = await this.db.client.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }
    }

    const item = await this.db.client.menuItem.create({
      data: {
        protein: dto.protein,
        flavor: dto.flavor,
        sizeGrams: dto.sizeGrams,
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        categoryId: dto.categoryId,
        description: dto.description,
        imageUrl: dto.imageUrl,
        stockQuantity: dto.stockQuantity ?? 0,
      },
    });

    return this.mapMenuItem(item);
  }

  async update(id: string, dto: CreateMenuItemDto): Promise<MenuItem> {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.db.client.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }
    }

    const item = await this.db.client.menuItem.update({
      where: { id },
      data: {
        protein: dto.protein,
        flavor: dto.flavor,
        sizeGrams: dto.sizeGrams,
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        categoryId: dto.categoryId ?? null,
        description: dto.description,
        imageUrl: dto.imageUrl,
        // Only touch stockQuantity if the caller actually sent one — the
        // admin's edit-item form and the dedicated stock-adjust endpoint
        // (adjustStock below) are two different workflows and shouldn't
        // stomp on each other.
        ...(dto.stockQuantity !== undefined ? { stockQuantity: dto.stockQuantity } : {}),
      },
    });

    return this.mapMenuItem(item);
  }

  // Dedicated stock-adjustment path for the admin Stock tab — set an
  // absolute count (physical recount) or apply a signed delta (kitchen just
  // finished a batch, or spoilage/waste). Kept separate from the general
  // update() so quick stock changes don't require resending the whole item
  // form.
  async adjustStock(id: string, dto: AdjustStockDto): Promise<MenuItem> {
    const existing = await this.findOne(id);

    let nextQuantity: number;
    if (dto.set !== undefined) {
      nextQuantity = dto.set;
    } else if (dto.delta !== undefined) {
      nextQuantity = existing.stockQuantity + dto.delta;
    } else {
      throw new BadRequestException("Must provide either `set` or `delta`");
    }

    if (nextQuantity < 0) {
      throw new BadRequestException("Stock quantity cannot go below 0");
    }

    const item = await this.db.client.menuItem.update({
      where: { id },
      data: { stockQuantity: nextQuantity },
    });

    return this.mapMenuItem(item);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db.client.menuItem.delete({
      where: { id },
    });
  }

  private mapMenuItem(item: {
    id: string;
    protein: string;
    flavor: string;
    sizeGrams: number;
    price: number;
    isAvailable: boolean;
    categoryId: string | null;
    description: string | null;
    imageUrl: string | null;
    stockQuantity: number;
    createdAt: Date;
    updatedAt: Date;
  }): MenuItem {
    return {
      id: item.id,
      protein: item.protein as MenuItem["protein"],
      flavor: item.flavor,
      sizeGrams: item.sizeGrams,
      price: item.price,
      isAvailable: item.isAvailable,
      categoryId: item.categoryId ?? undefined,
      description: item.description ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
      stockQuantity: item.stockQuantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
