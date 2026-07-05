import { describe, it, expect, vi } from "vitest";
import { MenuService } from "./menu.service";

// A minimal fake standing in for DatabaseService — only implements the
// menuItem/category methods MenuService actually calls. This is a plain
// unit test (no real Prisma/DB), targeting the stock/availability coupling
// rule specifically: having stock > 0 must always force isAvailable = true,
// since the public /menu endpoint filters on isAvailable only, and this was
// the exact bug fixed earlier this project ("restocking silently didn't
// make the dish orderable again").
function makeFakeDb(existing?: Record<string, unknown>) {
  const menuItem = {
    create: vi.fn((args: any) => ({ id: "new-id", createdAt: new Date(), updatedAt: new Date(), ...args.data })),
    update: vi.fn((args: any) => ({
      id: args.where.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(existing ?? {}),
      ...args.data,
    })),
    findUnique: vi.fn(() => existing ?? null),
  };
  return { client: { menuItem, category: { findUnique: vi.fn(() => null) } } } as any;
}

describe("MenuService stock/availability coupling", () => {
  it("create(): forces isAvailable true when stockQuantity > 0, even if isAvailable wasn't passed", async () => {
    const service = new MenuService(makeFakeDb());
    const item = await service.create({
      protein: "CHICKEN",
      flavor: "Garlic",
      sizeGrams: 250,
      price: 65000,
      stockQuantity: 10,
    } as any);
    expect(item.isAvailable).toBe(true);
  });

  it("create(): respects an explicit isAvailable=false when stock is 0", async () => {
    const service = new MenuService(makeFakeDb());
    const item = await service.create({
      protein: "CHICKEN",
      flavor: "Garlic",
      sizeGrams: 250,
      price: 65000,
      stockQuantity: 0,
      isAvailable: false,
    } as any);
    expect(item.isAvailable).toBe(false);
  });

  it("update(): forces isAvailable true when the resulting stock is > 0", async () => {
    const existing = {
      id: "m1",
      protein: "CHICKEN",
      flavor: "Garlic",
      sizeGrams: 250,
      price: 65000,
      isAvailable: false,
      categoryId: null,
      description: null,
      imageUrl: null,
      stockQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = new MenuService(makeFakeDb(existing));
    const item = await service.update("m1", {
      protein: "CHICKEN",
      flavor: "Garlic",
      sizeGrams: 250,
      price: 65000,
      stockQuantity: 15,
    } as any);
    expect(item.isAvailable).toBe(true);
  });

  it("adjustStock(): a positive delta that brings stock above 0 flips isAvailable to true", async () => {
    const existing = {
      id: "m1",
      protein: "CHICKEN",
      flavor: "Garlic",
      sizeGrams: 250,
      price: 65000,
      isAvailable: false,
      categoryId: null,
      description: null,
      imageUrl: null,
      stockQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = new MenuService(makeFakeDb(existing));
    const item = await service.adjustStock("m1", { delta: 5 } as any);
    expect(item.stockQuantity).toBe(5);
    expect(item.isAvailable).toBe(true);
  });

  it("adjustStock(): rejects a delta that would take stock negative", async () => {
    const existing = {
      id: "m1",
      protein: "CHICKEN",
      flavor: "Garlic",
      sizeGrams: 250,
      price: 65000,
      isAvailable: true,
      categoryId: null,
      description: null,
      imageUrl: null,
      stockQuantity: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = new MenuService(makeFakeDb(existing));
    await expect(service.adjustStock("m1", { delta: -5 } as any)).rejects.toThrow();
  });
});
