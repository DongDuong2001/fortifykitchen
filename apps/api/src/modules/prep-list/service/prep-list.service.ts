import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service";
import { Protein } from "@fortifykitchen/database";

interface PrepLineItem {
  protein: Protein;
  flavor: string;
  sizeGrams: number;
  qty: number;
}

interface PrepAggregate {
  protein: Protein;
  flavor: string;
  sizeGrams: number;
  portions: number;
  totalGrams: number;
}

const PROTEIN_ORDER: Record<string, number> = { CHICKEN: 0, BEEF: 1, SHRIMP: 2 };

@Injectable()
export class PrepListService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Aggregates every line item across Orders (deliveryDate === date) and
   * Deliveries (scheduledDate === date, status SCHEDULED/PREPPING) into a
   * per-dish prep sheet — how many portions of each protein/flavor/size
   * combo the kitchen needs to prep for that day, and the total grams.
   * Ported from the original app's PrepListPage.jsx aggregation logic.
   */
  async getPrepList(dateStr: string) {
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const [orders, deliveries] = await Promise.all([
      this.db.client.order.findMany({
        where: { deliveryDate: { gte: dayStart, lte: dayEnd } },
        include: { items: true },
      }),
      this.db.client.delivery.findMany({
        where: {
          scheduledDate: { gte: dayStart, lte: dayEnd },
          status: { in: ["SCHEDULED", "PREPPING"] },
        },
        include: { items: true },
      }),
    ]);

    const aggregation = new Map<string, PrepAggregate>();

    const processLineItems = (items: PrepLineItem[]) => {
      for (const item of items) {
        const key = `${item.protein}|${item.flavor}|${item.sizeGrams}`;
        const existing = aggregation.get(key);
        if (existing) {
          existing.portions += item.qty;
          existing.totalGrams += item.qty * item.sizeGrams;
        } else {
          aggregation.set(key, {
            protein: item.protein,
            flavor: item.flavor,
            sizeGrams: item.sizeGrams,
            portions: item.qty,
            totalGrams: item.qty * item.sizeGrams,
          });
        }
      }
    };

    for (const order of orders) processLineItems(order.items);
    for (const delivery of deliveries) processLineItems(delivery.items);

    const prepItems = Array.from(aggregation.values()).sort(
      (a, b) =>
        (PROTEIN_ORDER[a.protein] ?? 3) - (PROTEIN_ORDER[b.protein] ?? 3) ||
        a.flavor.localeCompare(b.flavor) ||
        a.sizeGrams - b.sizeGrams,
    );

    const totalPortions = prepItems.reduce((s, i) => s + i.portions, 0);
    const totalGrams = prepItems.reduce((s, i) => s + i.totalGrams, 0);

    return { date: dateStr, prepItems, totalPortions, totalGrams };
  }
}
