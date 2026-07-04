import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { MenuItem } from "@fortifykitchen/types";
import { Decimal } from "@fortifykitchen/database";

@Injectable()
export class MenuService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(categoryId?: string): Promise<MenuItem[]> {
    const items = await this.db.client.menuItem.findMany({
      where: categoryId ? { categoryId, isAvailable: true } : { isAvailable: true },
      orderBy: { name: "asc" },
    });

    return items.map((item) => this.mapMenuItem(item));
  }

  async findAllAdmin(): Promise<MenuItem[]> {
    const items = await this.db.client.menuItem.findMany({
      orderBy: { name: "asc" },
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
    // Check if category exists
    const category = await this.db.client.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
    }

    const item = await this.db.client.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: new Decimal(dto.price),
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    return this.mapMenuItem(item);
  }

  async update(id: string, dto: CreateMenuItemDto): Promise<MenuItem> {
    await this.findOne(id);

    const category = await this.db.client.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
    }

    const item = await this.db.client.menuItem.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: new Decimal(dto.price),
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    return this.mapMenuItem(item);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db.client.menuItem.delete({
      where: { id },
    });
  }

  private mapMenuItem(item: any): MenuItem {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.imageUrl ?? undefined,
      categoryId: item.categoryId,
      isAvailable: item.isAvailable,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
