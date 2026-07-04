import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { Category } from "@fortifykitchen/types";

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Category[]> {
    const list = await this.db.client.category.findMany({
      orderBy: { name: "asc" },
    });
    return list.map(c => this.mapCategory(c));
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.db.client.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return this.mapCategory(category);
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.db.client.category.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: dto.slug }],
      },
    });

    if (existing) {
      throw new ConflictException("Category name or slug already exists");
    }

    const created = await this.db.client.category.create({
      data: dto,
    });
    return this.mapCategory(created);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db.client.category.delete({
      where: { id },
    });
  }

  private mapCategory(c: any): Category {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? undefined,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
