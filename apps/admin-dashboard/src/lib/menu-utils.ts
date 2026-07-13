import type { Protein } from "@fortifykitchen/types";

// Groups same-flavor menu items (e.g. "xá xíu 150g" + "xá xíu 250g") into
// one dish card with a portion-size toggle, instead of one card per exact
// protein+flavor+size row — matches the same grouping used on customer-web.
function groupMenuByFlavor(items: any[]) {
  const map = new Map<string, { protein: Protein; flavor: string; sizes: any[] }>();
  for (const item of items) {
    const key = `${item.protein}::${item.flavor}`;
    if (!map.has(key)) map.set(key, { protein: item.protein, flavor: item.flavor, sizes: [] });
    map.get(key)!.sizes.push(item);
  }
  for (const dish of map.values()) {
    dish.sizes.sort((a, b) => a.sizeGrams - b.sizeGrams);
  }
  return Array.from(map.values()).sort((a, b) => a.flavor.localeCompare(b.flavor));
}

// Slices an already-filtered/sorted array down to one page's worth of rows.
// Every list view in this console loads its full (already small-ish, staff-
// facing) dataset up front — client-side slicing keeps pagination
// consistent with the existing tab/search/status filters, which all operate
// on the full in-memory list before this runs.
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// Clamps a requested page number into [1, totalPages] so switching tabs/
// filters (which can shrink the result set) never strands the view on a
// page that no longer has any rows.
function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export { groupMenuByFlavor, paginate, clampPage };
