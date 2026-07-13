import type { LineItem } from "@fortifykitchen/types";

/**
 * Pricing engine for Fortify Kitchen — ported 1:1 from the original app's
 * src/lib/pricing.js. Implements the exact 2-tier discount system:
 *
 * 1. Per-protein 1kg rule: if total grams of a single protein (across ALL
 *    flavors/sizes) >= 1000g, every line item of that protein gets 10% off.
 *
 * 2. Order-level tiered discount on post-meat-discount subtotal:
 *    - >= 3,000,000 VND → 10% off
 *    - >= 1,500,000 VND → 5% off
 *    - else → no additional discount
 *    Tiers do NOT stack (10% replaces 5%, not added on top).
 *
 * This same function prices both one-off Orders and — by multiplying each
 * line item's qty by deliveriesPlanned first — whole Subscription packages,
 * so a monthly plan delivered daily is priced as one bulk order instead of
 * delivery-by-delivery (which would rarely hit the weight/spend thresholds).
 *
 * Regression test:
 *   8× chicken xá xíu 150g (25,000đ) + 4× beef herb 150g (50,000đ)
 *   → Chicken total grams: 8 × 150 = 1,200g >= 1000 → 10% off
 *   → Chicken line: 8 × 25,000 = 200,000 × 0.9 = 180,000
 *   → Beef total grams: 4 × 150 = 600g < 1000 → no discount
 *   → Beef line: 4 × 50,000 = 200,000
 *   → Subtotal: 380,000 < 1,500,000 → no order-level discount
 *   → TOTAL: 380,000 VND ✓
 */

export interface LineItemDetail extends LineItem {
  lineTotal: number;
  discounted: boolean;
}

export interface OrderTotalResult {
  proteinGrams: Record<string, number>;
  proteinDiscounts: Record<string, boolean>;
  lineDetails: LineItemDetail[];
  lineSubtotal: number;
  orderDiscountTier: string | null;
  orderDiscountPercent: number;
  orderDiscountAmount: number;
  finalTotal: number;
}

export function calculateOrderTotal(lineItems: LineItem[]): OrderTotalResult {
  // Step 1 — total grams per protein across ALL flavors/sizes
  const proteinGrams: Record<string, number> = {};
  for (const item of lineItems) {
    if (!proteinGrams[item.protein]) {
      proteinGrams[item.protein] = 0;
    }
    proteinGrams[item.protein] += item.sizeGrams * item.qty;
  }

  // Step 2 — 10% off any protein whose combined weight >= 1000g
  const proteinDiscounts: Record<string, boolean> = {};
  for (const protein of Object.keys(proteinGrams)) {
    proteinDiscounts[protein] = proteinGrams[protein] >= 1000;
  }

  let lineSubtotal = 0;
  const lineDetails: LineItemDetail[] = [];
  for (const item of lineItems) {
    let lineTotal = item.unitPrice * item.qty;
    const discounted = proteinGrams[item.protein] >= 1000;
    if (discounted) {
      lineTotal = lineTotal * 0.9;
    }
    lineSubtotal += lineTotal;
    lineDetails.push({
      ...item,
      lineTotal,
      discounted,
    });
  }

  // Step 3 — order-level tiered discount on the POST-meat-discount subtotal
  // Tiers do NOT stack: 10% replaces 5%, not added on top
  let finalTotal: number;
  let orderDiscountTier: string | null = null;
  let orderDiscountPercent = 0;

  if (lineSubtotal >= 3_000_000) {
    orderDiscountTier = "≥ 3,000,000đ";
    orderDiscountPercent = 10;
    finalTotal = lineSubtotal * 0.9;
  } else if (lineSubtotal >= 1_500_000) {
    orderDiscountTier = "≥ 1,500,000đ";
    orderDiscountPercent = 5;
    finalTotal = lineSubtotal * 0.95;
  } else {
    finalTotal = lineSubtotal;
  }

  const orderDiscountAmount = lineSubtotal - finalTotal;

  return {
    proteinGrams,
    proteinDiscounts,
    lineDetails,
    lineSubtotal,
    orderDiscountTier,
    orderDiscountPercent,
    orderDiscountAmount,
    finalTotal,
  };
}

/**
 * Prices a volume subscription's protein pools by reusing the exact same
 * discount engine as one-off orders. The customer picks a portion SIZE
 * (e.g. 150g, 250g — a real MenuItem SKU) and a portion COUNT for each
 * protein they buy, e.g. "30 portions of 150g chicken + 20 portions of
 * 250g chicken" — not a raw kilogram figure. Each (protein, sizeGrams)
 * combo is priced at that exact MenuItem's real unit price × qty, then fed
 * into calculateOrderTotal as ordinary line items, so the existing
 * >=1000g-per-protein 10% rule and the order-level spend-tier discount
 * both apply exactly as they do for regular orders — bulk-buying a pool
 * is, after all, exactly the kind of purchase those discounts were
 * designed to reward. Flavor is still chosen per-delivery, not here.
 */
export interface PoolPortionInput {
  protein: import("@fortifykitchen/types").Protein;
  sizeGrams: number;
  qty: number;
}

export function calculatePoolPricing(
  portions: PoolPortionInput[],
  availableMenuItems: { protein: string; price: number; sizeGrams: number }[],
): OrderTotalResult & { missingCombos: string[] } {
  const missingCombos: string[] = [];
  const lineItems: LineItem[] = [];

  for (const portion of portions) {
    const menuItem = availableMenuItems.find(
      (m) => m.protein === portion.protein && m.sizeGrams === portion.sizeGrams,
    );
    if (!menuItem) {
      missingCombos.push(`${portion.protein} ${portion.sizeGrams}g`);
      continue;
    }

    lineItems.push({
      protein: portion.protein,
      flavor: "(gói khối lượng)",
      sizeGrams: portion.sizeGrams,
      unitPrice: menuItem.price,
      qty: portion.qty,
    });
  }

  const result = calculateOrderTotal(lineItems);
  return { ...result, missingCombos };
}

/**
 * Format a number as VND currency, e.g. "380,000 đ". Deliberately not
 * routed through formatCurrency() in packages/utils — that uses
 * Intl's `currency` style (which renders "₫380,000" or similar ISO
 * formatting); this matches the exact display convention the original app
 * used for Vietnamese staff.
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + " đ";
}
