import { describe, it, expect, vi } from "vitest";
import { OrdersService } from "./orders.service";
import { OrderFulfillmentType } from "@fortifykitchen/database";

// Fake DatabaseService exposing just menuItem.findUnique, keyed by id, with
// a fixed stockQuantity per id — enough to drive resolveFulfillment()
// without a real Prisma client.
function makeFakeDb(stockById: Record<string, number>) {
  return {
    client: {
      menuItem: {
        findUnique: vi.fn(({ where: { id } }: any) =>
          stockById[id] !== undefined ? { id, stockQuantity: stockById[id] } : null,
        ),
      },
    },
  } as any;
}

describe("OrdersService.resolveFulfillment", () => {
  it("resolves IMMEDIATE when every line item has enough stock", async () => {
    const service = new OrdersService(makeFakeDb({ a: 10, b: 5 }));
    const result = await (service as any).resolveFulfillment([
      { menuItemId: "a", qty: 2 },
      { menuItemId: "b", qty: 5 },
    ]);
    expect(result.fulfillmentType).toBe(OrderFulfillmentType.IMMEDIATE);
  });

  it("resolves SCHEDULED when even one line item is short — no partial/split fulfillment", async () => {
    const service = new OrdersService(makeFakeDb({ a: 10, b: 3 }));
    const result = await (service as any).resolveFulfillment([
      { menuItemId: "a", qty: 2 },
      { menuItemId: "b", qty: 5 }, // short by 2
    ]);
    expect(result.fulfillmentType).toBe(OrderFulfillmentType.SCHEDULED);
  });

  it("resolves SCHEDULED when a referenced menu item doesn't exist at all", async () => {
    const service = new OrdersService(makeFakeDb({ a: 10 }));
    const result = await (service as any).resolveFulfillment([{ menuItemId: "missing", qty: 1 }]);
    expect(result.fulfillmentType).toBe(OrderFulfillmentType.SCHEDULED);
  });

  it("sums quantities for the same menu item appearing in multiple lines before checking stock", async () => {
    const service = new OrdersService(makeFakeDb({ a: 10 }));
    const result = await (service as any).resolveFulfillment([
      { menuItemId: "a", qty: 6 },
      { menuItemId: "a", qty: 6 }, // combined 12 > stock of 10
    ]);
    expect(result.fulfillmentType).toBe(OrderFulfillmentType.SCHEDULED);
    expect(result.requiredByMenuItem.get("a")).toBe(12);
  });
});
