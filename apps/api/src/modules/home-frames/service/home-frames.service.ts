import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { CreateHomeFrameDto } from "../dto/create-home-frame.dto";
import { UpdateHomeFrameDto } from "../dto/update-home-frame.dto";
import { HomeFrame } from "@fortifykitchen/types";

@Injectable()
export class HomeFramesService {
  constructor(private readonly db: DatabaseService) {}

  async findAllActive(): Promise<HomeFrame[]> {
    const list = await this.db.client.homeFrame.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return list as unknown as HomeFrame[];
  }

  async findAllAdmin(): Promise<HomeFrame[]> {
    const list = await this.db.client.homeFrame.findMany({
      orderBy: { order: "asc" },
    });
    return list as unknown as HomeFrame[];
  }

  async findOne(id: string): Promise<HomeFrame> {
    const item = await this.db.client.homeFrame.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Home frame with ID ${id} not found`);
    }
    return item as unknown as HomeFrame;
  }

  async create(dto: CreateHomeFrameDto): Promise<HomeFrame> {
    const created = await this.db.client.homeFrame.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    return created as unknown as HomeFrame;
  }

  async update(id: string, dto: UpdateHomeFrameDto): Promise<HomeFrame> {
    await this.findOne(id);
    const updated = await this.db.client.homeFrame.update({
      where: { id },
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        order: dto.order,
        isActive: dto.isActive,
      },
    });
    return updated as unknown as HomeFrame;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db.client.homeFrame.delete({
      where: { id },
    });
  }
}
