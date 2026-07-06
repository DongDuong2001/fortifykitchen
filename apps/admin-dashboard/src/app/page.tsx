"use client";

import * as React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  LogOut,
  Utensils,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  Tag,
  Loader2,
  Truck,
  PanelLeftClose,
  PanelLeftOpen,
  ChefHat,
  Package,
  Info,
} from "lucide-react";
import {
  PROTEIN_LABELS,
  getMenuItemLabel,
  calculateOrderTotal,
  calculatePoolPricing,
  formatIntervalLabel,
  generateVolumeSchedule,
  formatGrams,
  DELIVERY_AMOUNT_PRESETS_GRAMS,
  DELIVERY_FREQUENCY_PRESETS,
} from "@fortifykitchen/shared";
import type { Protein } from "@fortifykitchen/types";
import { useToast } from "@fortifykitchen/ui";

const PROTEIN_OPTIONS: Protein[] = ["CHICKEN", "BEEF", "SHRIMP"];
const PAYMENT_STATE_OPTIONS = ["UNPAID", "DEPOSIT", "PAID"] as const;
const DELIVERY_STATUS_OPTIONS = ["SCHEDULED", "PREPPING", "DELIVERED", "SKIPPED", "CANCELLED"] as const;

// Orders tab-specific labels for the shared DeliveryStatus enum — reusing
// the same underlying values as the Deliveries tab (SCHEDULED/PREPPING/
// DELIVERED) but with wording that matches the Orders workflow: a fresh
// order is "Ordered", accepting it moves it to "Preparing", and finishing
// it marks it "Completed". Kept local to this component (not in
// packages/shared) so it doesn't affect the Deliveries tab's own labels.
const ORDER_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Ordered",
  PREPPING: "Preparing",
  DELIVERED: "Completed",
  SKIPPED: "Skipped",
  CANCELLED: "Cancelled",
};

// `new Date().toISOString().split("T")[0]` computes the UTC calendar date,
// not the user's local one — for Vietnam (UTC+7) that's wrong for roughly
// the first 7 hours of every local day (it shows yesterday). This builds
// the date string from local Y/M/D getters instead.
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Whether a date (string or Date) falls on today's local calendar day —
// backs the Orders tab's "Sắp tới" (upcoming) filter mode.
function isToday(date: string | Date): boolean {
  return getLocalDateString(new Date(date)) === getLocalDateString();
}

// Single shared grouping routine used everywhere a list of dated entries
// (orders, subscription-generated deliveries, or the two merged) needs to
// be bucketed by day / ISO week / month. Having exactly one implementation
// — computed client-side, in the browser's local timezone — is what keeps
// every list view (Orders, Orders from Subscriptions, Deliveries "Tất cả",
// Deliveries "Sắp tới") agreeing on where one day ends and the next
// begins, instead of some views grouping server-side and others
// client-side with slightly different date math.
function groupEntriesByDate<T>(
  entries: T[],
  getDate: (entry: T) => string | Date,
  groupBy: "day" | "week" | "month",
): { key: string; entries: T[] }[] {
  const map = new Map<string, T[]>();
  for (const entry of entries) {
    const d = new Date(getDate(entry));
    let key: string;
    if (groupBy === "day") {
      key = getLocalDateString(d);
    } else if (groupBy === "month") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      // ISO-ish week key: year + week number (Mon-start)
      const dayNum = (d.getDay() + 6) % 7;
      const thursday = new Date(d);
      thursday.setDate(d.getDate() - dayNum + 3);
      const firstThursday = new Date(thursday.getFullYear(), 0, 4);
      const weekNum =
        1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
      key = `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return Array.from(map.entries())
    .map(([key, groupEntries]) => ({ key, entries: groupEntries }))
    .sort((a, b) => a.key.localeCompare(b.key)); // oldest first
}

// Formats a Deliveries "Sắp tới" group key (shaped differently depending on
// the selected granularity — "YYYY-MM-DD" for day, "YYYY-Www" for week,
// "YYYY-MM" for month) into a readable Vietnamese heading, so the upcoming
// view reads the same way the "Tất cả" tab's day headings do rather than
// showing the raw grouping key.
function formatGroupKeyLabel(key: string, groupBy: "day" | "week" | "month"): string {
  if (groupBy === "day") {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  if (groupBy === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  }
  // week key looks like "2026-W27"
  const [y, w] = key.split("-W");
  return `Tuần ${w} · ${y}`;
}

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

function PaginationControls({
  page,
  totalPages,
  onChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalItems === 0 || totalPages <= 1) return null;
  const safePage = clampPage(page, totalPages);
  const rangeStart = (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between gap-3 pt-3 flex-wrap">
      <span className="text-[11px] text-muted-foreground font-mono">
        {rangeStart}–{rangeEnd} / {totalItems}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onChange(safePage - 1)}
          className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          ‹ Trước
        </button>
        <span className="text-[11px] font-mono text-muted-foreground px-1.5">
          Trang {safePage}/{totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onChange(safePage + 1)}
          className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Sau ›
        </button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;
const CARD_PAGE_SIZE = 8; // for grid-of-cards views (Subscriptions, day/week groups)

export default function AdminDashboard() {
  const { toast } = useToast();
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any | null>(null);

  // In-app replacement for window.confirm — every destructive/important
  // action routes through requestConfirm() instead, which opens the same
  // styled modal used elsewhere in this console rather than a native
  // browser dialog. onConfirm runs only if the user clicks the confirm
  // button; dismissing (backdrop click / Hủy) just closes it.
  const [confirmState, setConfirmState] = React.useState<{
    title?: string;
    message: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = React.useCallback(
    (
      message: string,
      onConfirm: () => void,
      opts?: { title?: string; confirmLabel?: string; variant?: "default" | "destructive" },
    ) => {
      setConfirmState({ message, onConfirm, title: opts?.title, confirmLabel: opts?.confirmLabel, variant: opts?.variant });
    },
    [],
  );

  // Authentication Fields
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPass, setLoginPass] = React.useState("");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Section State
  const [section, setSection] = React.useState<
    | "dashboard"
    | "orders"
    | "menu"
    | "inventory"
    | "subscriptions"
    | "deliveries"
    | "customers"
    | "discounts"
    | "prep-list"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Inventory tab: two sub-views — Monitor (currently in-stock dishes only,
  // no status badge needed since being listed here already means
  // available) and Add Stock (restock an existing dish; doing so is what
  // makes it available — see the isAvailable-forcing rule in the API).
  const [inventorySubTab, setInventorySubTab] = React.useState<"monitor" | "add">("monitor");
  const [inventorySort, setInventorySort] = React.useState<"stock-asc" | "stock-desc" | "name">("stock-desc");
  const [addStockItemId, setAddStockItemId] = React.useState("");
  const [addStockQty, setAddStockQty] = React.useState(10);
  const [isAddingStock, setIsAddingStock] = React.useState(false);

  // Prep List state
  const [prepDate, setPrepDate] = React.useState(getLocalDateString());
  const [prepData, setPrepData] = React.useState<{
    prepItems: { protein: Protein; flavor: string; sizeGrams: number; portions: number; totalGrams: number }[];
    totalPortions: number;
    totalGrams: number;
  }>({ prepItems: [], totalPortions: 0, totalGrams: 0 });
  const [isPrepLoading, setIsPrepLoading] = React.useState(false);
  const [prepError, setPrepError] = React.useState<string | null>(null);

  // Dashboard Stats & Lists
  const [stats, setStats] = React.useState<any>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [orders, setOrders] = React.useState<any[]>([]);
  const [menuItems, setMenuItems] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<any[]>([]);
  const [deliveries, setDeliveries] = React.useState<any[]>([]); // unified Order+Subscription entries
  // Subscription-generated deliveries shown as their own group within the
  // Orders tab (they're backed by the Delivery model, not Order, but still
  // need to be visible/actionable — accepted, completed, cancelled — right
  // alongside one-off orders). Filtered client-side from the same unified
  // endpoint the Deliveries tab already uses.
  const [subscriptionOrders, setSubscriptionOrders] = React.useState<any[]>([]);
  const [deliveryView, setDeliveryView] = React.useState<"all" | "upcoming">("all");
  const [deliveryGroupBy, setDeliveryGroupBy] = React.useState<"day" | "week" | "month">("day");
  // Deliveries tab filters — apply to both "Tất cả" (grouped by day) and
  // "Sắp tới" (grouped by week/month) views.
  const [deliverySourceFilter, setDeliverySourceFilter] = React.useState<"ALL" | "ORDER" | "SUBSCRIPTION">("ALL");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = React.useState<(typeof DELIVERY_STATUS_OPTIONS)[number] | "ALL">("ALL");
  const [deliverySearch, setDeliverySearch] = React.useState("");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [discounts, setDiscounts] = React.useState<any[]>([]);

  // --- Pagination state — one page counter per list view. Every list here
  // is small-ish and already loaded in full for client-side tab/search
  // filtering, so pagination is a display-only slice (see paginate()) that
  // clamps back to a valid page whenever a filter shrinks the result set.
  const [ordersPage, setOrdersPage] = React.useState(1);
  const [subOrdersPage, setSubOrdersPage] = React.useState(1);
  const [customersPage, setCustomersPage] = React.useState(1);
  const [deliveriesAllPage, setDeliveriesAllPage] = React.useState(1);
  const [deliveriesUpcomingPage, setDeliveriesUpcomingPage] = React.useState(1);
  const [subscriptionsPage, setSubscriptionsPage] = React.useState(1);
  const [discountsPage, setDiscountsPage] = React.useState(1);
  const [menuPageByProtein, setMenuPageByProtein] = React.useState<Record<string, number>>({});
  const [inventoryPageByProtein, setInventoryPageByProtein] = React.useState<Record<string, number>>({});

  // Loading States
  const [isLoading, setIsLoading] = React.useState(false);

  // --- Customers form state ---
  const [customerModal, setCustomerModal] = React.useState<"create" | "edit" | null>(null);
  const [editingCustomerId, setEditingCustomerId] = React.useState<string | null>(null);
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerZalo, setCustomerZalo] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");

  // --- Order form state ---
  const [orderModal, setOrderModal] = React.useState<"create" | "edit" | null>(null);
  const [editingOrderId, setEditingOrderId] = React.useState<string | null>(null);
  // Read-only detail view — clicking anywhere on an order row (outside the
  // interactive controls) opens this instead of requiring the small Edit
  // icon to see the full order.
  const [orderDetailView, setOrderDetailView] = React.useState<any | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [orderCustomerId, setOrderCustomerId] = React.useState("");
  const [orderDeliveryDate, setOrderDeliveryDate] = React.useState(getLocalDateString());
  const [orderPaymentStatus, setOrderPaymentStatus] = React.useState<(typeof PAYMENT_STATE_OPTIONS)[number]>("UNPAID");
  const [orderLineItems, setOrderLineItems] = React.useState<any[]>([]);
  const [orderSelectedMenuItemId, setOrderSelectedMenuItemId] = React.useState("");
  const [orderAddQty, setOrderAddQty] = React.useState(1);

  // --- Orders tab: workflow view + filters ---
  // "Current" holds everything still in flight (Ordered/Preparing/Skipped);
  // hitting Complete moves an order to DELIVERED, which drops it out of
  // Current and into the Completed tab. Cancelled orders get their own tab
  // too so they don't linger in either working view.
  const [orderViewTab, setOrderViewTab] = React.useState<"current" | "completed" | "cancelled">("current");
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<"ALL" | "SCHEDULED" | "PREPPING" | "SKIPPED">("ALL");
  const [orderFulfillmentFilter, setOrderFulfillmentFilter] = React.useState<"ALL" | "IMMEDIATE" | "SCHEDULED">("ALL");
  const [orderSearch, setOrderSearch] = React.useState("");
  // Typeable date filter — a plain "YYYY-MM-DD" string that drives an
  // <input type="date">. Defaults to today so the Orders view opens showing
  // just what's due today; typing/picking any other date narrows to that
  // exact day; clearing it (via the "Tất cả" button) shows every date.
  const [orderDateFilter, setOrderDateFilter] = React.useState(getLocalDateString());
  // Extra quick mode alongside the date input — "Sắp tới" (upcoming) shows
  // everything that isn't today (future or overdue), ignoring the specific
  // date picked above. Picking a date (or "Tất cả") switches back to "date".
  const [orderDateMode, setOrderDateMode] = React.useState<"date" | "upcoming">("date");

  // --- Orders from Subscriptions: its own independent workflow view +
  // filters, separate from the one-off Orders filters above — filtering or
  // switching tabs on one table no longer touches the other.
  const [subOrderViewTab, setSubOrderViewTab] = React.useState<"current" | "completed" | "cancelled">("current");
  const [subOrderStatusFilter, setSubOrderStatusFilter] = React.useState<"ALL" | "SCHEDULED" | "PREPPING" | "SKIPPED">("ALL");
  const [subOrderSearch, setSubOrderSearch] = React.useState("");
  const [subOrderDateFilter, setSubOrderDateFilter] = React.useState(getLocalDateString());
  const [subOrderDateMode, setSubOrderDateMode] = React.useState<"date" | "upcoming">("date");

  // Deliveries tab: same typeable date filter, applied to both "Tất cả" and
  // "Sắp tới" views (see matchesDeliveryFilters). Defaults to empty — those
  // two views already have their own today/upcoming scoping, so the date
  // filter here is an optional extra narrowing rather than a default.
  const [deliveryDateFilter, setDeliveryDateFilter] = React.useState("");

  // Jump back to page 1 whenever a filter/tab/search change would otherwise
  // leave the paginated table showing a stale, filter-mismatched page.
  React.useEffect(() => {
    setOrdersPage(1);
  }, [orderViewTab, orderStatusFilter, orderFulfillmentFilter, orderSearch, orderDateFilter, orderDateMode]);

  React.useEffect(() => {
    setSubOrdersPage(1);
  }, [subOrderViewTab, subOrderStatusFilter, subOrderSearch, subOrderDateFilter, subOrderDateMode]);

  React.useEffect(() => {
    setDeliveriesAllPage(1);
    setDeliveriesUpcomingPage(1);
  }, [deliverySourceFilter, deliveryStatusFilter, deliverySearch, deliveryGroupBy, deliveryDateFilter]);

  // --- Subscription form state (volume-based: one or more protein pools +
  // a delivery cadence — flavor is chosen per-delivery, not at purchase) ---
  const [subModal, setSubModal] = React.useState<"create" | null>(null);
  const [subDetailId, setSubDetailId] = React.useState<string | null>(null);
  const [subDetailDeliveries, setSubDetailDeliveries] = React.useState<any[]>([]);
  const [isSubDetailLoading, setIsSubDetailLoading] = React.useState(false);
  const [topUpModal, setTopUpModal] = React.useState<{ subId: string; protein: Protein; grams: number } | null>(null);
  const [subCustomerId, setSubCustomerId] = React.useState("");
  const [subPackageName, setSubPackageName] = React.useState("");
  const [subPools, setSubPools] = React.useState<{ protein: Protein; sizeGrams: number; qty: number }[]>([]);
  const [subPoolProtein, setSubPoolProtein] = React.useState<Protein>("CHICKEN");
  const [subPoolSizeGrams, setSubPoolSizeGrams] = React.useState(150);
  const [subPoolQty, setSubPoolQty] = React.useState(10);
  const [subDeliveryAmountGrams, setSubDeliveryAmountGrams] = React.useState(1000);
  const [subDeliveryIntervalDays, setSubDeliveryIntervalDays] = React.useState(1);
  const [subStartDate, setSubStartDate] = React.useState(getLocalDateString());
  const [subPaymentStatus, setSubPaymentStatus] = React.useState<(typeof PAYMENT_STATE_OPTIONS)[number]>("UNPAID");

  // Form Modals State
  const [menuModal, setMenuModal] = React.useState<"create" | "edit" | null>(null);
  const [editingMenuItemId, setEditingMenuItemId] = React.useState<string | null>(null);
  const [menuItemProtein, setMenuItemProtein] = React.useState<Protein>("CHICKEN");
  const [menuItemFlavor, setMenuItemFlavor] = React.useState("");
  const [menuItemSizeGrams, setMenuItemSizeGrams] = React.useState(150);
  const [menuItemPrice, setMenuItemPrice] = React.useState(25000);
  const [menuItemImage, setMenuItemImage] = React.useState("");
  const [menuItemCatId, setMenuItemCatId] = React.useState("");
  const [menuItemAvailable, setMenuItemAvailable] = React.useState(true);
  const [menuItemStock, setMenuItemStock] = React.useState(0);
  // Per-card "adjusting" flag so a stock +/- click can't be double-fired
  // while its request is in flight.
  const [adjustingStockId, setAdjustingStockId] = React.useState<string | null>(null);
  // Which size (menuItemId) is showing per dish card in the Menu Catalog
  // Manager, keyed by "protein::flavor" — same-flavor items with different
  // sizeGrams are grouped into one card with a size toggle rather than
  // listed as separate cards. Defaults to the smallest size when unset.
  const [menuSelectedSizeByDish, setMenuSelectedSizeByDish] = React.useState<Record<string, string>>({});

  // Discount Form State
  const [discountCode, setDiscountCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountAmount, setDiscountAmount] = React.useState(10);
  const [discountStarts, setDiscountStarts] = React.useState("2026-07-04T00:00:00Z");
  const [discountEnds, setDiscountEnds] = React.useState("2026-12-31T23:59:59Z");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Hydrate auth
  React.useEffect(() => {
    const savedToken = localStorage.getItem("fka_token");
    const savedUser = localStorage.getItem("fka_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fka_token");
    localStorage.removeItem("fka_user");
  }, []);

  // Any request can come back 401 if the saved token is missing, expired, or
  // (one-time case) was issued before a JWT signing fix and is no longer
  // valid — in every case the right move is the same: drop the stale
  // session and send the user back to the login screen, rather than
  // silently rendering empty data. Returns true if it fired, so callers can
  // bail out of the rest of their response handling.
  const handleUnauthorized = React.useCallback(
    (responses: { status: number }[]) => {
      if (responses.some((r) => r.status === 401)) {
        handleLogout();
        toast({ title: "Your session has expired — please log in again.", type: "error" });
        return true;
      }
      return false;
    },
    [handleLogout, toast],
  );

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      if (section === "dashboard") {
        const [resStats, resMenu] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`, { headers }),
          fetch(`${API_URL}/menu/admin`, { headers }),
        ]);
        if (handleUnauthorized([resStats, resMenu])) return;
        if (resStats.ok) {
          const result = await resStats.json();
          setStats(result.data);
        }
        if (resMenu.ok) setMenuItems((await resMenu.json()).data || []);
      } else if (section === "orders") {
        const [resOrders, resCustomers, resMenu, resUnified] = await Promise.all([
          fetch(`${API_URL}/orders`, { headers }),
          fetch(`${API_URL}/customers`, { headers }),
          fetch(`${API_URL}/menu/admin`, { headers }),
          fetch(`${API_URL}/deliveries/unified`, { headers }),
        ]);
        if (handleUnauthorized([resOrders, resCustomers, resMenu, resUnified])) return;
        if (resOrders.ok) setOrders((await resOrders.json()).data || []);
        if (resCustomers.ok) setCustomers((await resCustomers.json()).data || []);
        if (resMenu.ok) {
          const menuData = (await resMenu.json()).data || [];
          setMenuItems(menuData);
          if (menuData.length > 0) setOrderSelectedMenuItemId((prev) => prev || menuData[0].id);
        }
        if (resUnified.ok) {
          const unified = (await resUnified.json()).data || [];
          setSubscriptionOrders(unified.filter((e: any) => e.source === "SUBSCRIPTION"));
        }
      } else if (section === "customers") {
        const res = await fetch(`${API_URL}/customers`, { headers });
        if (handleUnauthorized([res])) return;
        if (res.ok) {
          const result = await res.json();
          setCustomers(result.data || []);
        }
      } else if (section === "deliveries") {
        // Pull the rolling 7-day-ahead window forward before displaying,
        // so newly-due subscription occurrences show up without staff
        // having to wait for some external cron to run. Both "Tất cả" and
        // "Sắp tới" are now derived client-side from this one unified list
        // (see filteredUpcomingGroups) so both views group by the exact
        // same day/week/month logic — no more risk of the two tabs
        // disagreeing about where a day boundary falls.
        await fetch(`${API_URL}/subscriptions/sync-deliveries`, { method: "POST", headers });
        const res = await fetch(`${API_URL}/deliveries/unified`, { headers });
        if (handleUnauthorized([res])) return;
        if (res.ok) setDeliveries((await res.json()).data || []);
      } else if (section === "menu") {
        const [resMenu, resCat] = await Promise.all([
          fetch(`${API_URL}/menu/admin`, { headers }),
          fetch(`${API_URL}/categories`),
        ]);
        if (handleUnauthorized([resMenu])) return;
        if (resMenu.ok && resCat.ok) {
          const menuData = await resMenu.json();
          const catData = await resCat.json();
          setMenuItems(menuData.data || []);
          setCategories(catData.data || []);
          if (catData.data?.length > 0) {
            setMenuItemCatId(catData.data[0].id);
          }
        }
      } else if (section === "inventory") {
        const res = await fetch(`${API_URL}/menu/admin`, { headers });
        if (handleUnauthorized([res])) return;
        if (res.ok) setMenuItems((await res.json()).data || []);
      } else if (section === "subscriptions") {
        const [resSubs, resCustomers, resMenu] = await Promise.all([
          fetch(`${API_URL}/subscriptions`, { headers }),
          fetch(`${API_URL}/customers`, { headers }),
          fetch(`${API_URL}/menu/admin`, { headers }),
        ]);
        if (handleUnauthorized([resSubs, resCustomers, resMenu])) return;
        if (resSubs.ok) setSubscriptions((await resSubs.json()).data || []);
        if (resCustomers.ok) setCustomers((await resCustomers.json()).data || []);
        if (resMenu.ok) {
          const menuData = (await resMenu.json()).data || [];
          setMenuItems(menuData);
        }
      } else if (section === "discounts") {
        const res = await fetch(`${API_URL}/discounts`, { headers });
        if (handleUnauthorized([res])) return;
        if (res.ok) {
          const result = await res.json();
          setDiscounts(result.data || []);
        }
      }
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setIsLoading(false);
    }
  }, [token, section, API_URL, handleUnauthorized]);

  // Fetch data when authenticated or section changes
  React.useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, section, loadData]);

  // Prep List: refetches on its own whenever the section is active or the
  // selected date changes (a second dimension loadData() doesn't handle).
  React.useEffect(() => {
    if (!token || section !== "prep-list") return;
    let cancelled = false;
    (async () => {
      setIsPrepLoading(true);
      setPrepError(null);
      try {
        const res = await fetch(`${API_URL}/prep-list?date=${prepDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.status === 401) {
          handleUnauthorized([res]);
          return;
        }
        if (res.ok) {
          setPrepData(result?.data || { prepItems: [], totalPortions: 0, totalGrams: 0 });
        } else {
          console.error("Prep list request failed", res.status, result);
          setPrepError(result?.message || `Request failed (HTTP ${res.status})`);
          setPrepData({ prepItems: [], totalPortions: 0, totalGrams: 0 });
        }
      } catch (e) {
        console.error("Error fetching prep list", e);
        if (!cancelled) setPrepError("Network error — is the API reachable?");
      } finally {
        if (!cancelled) setIsPrepLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, section, prepDate, API_URL, handleUnauthorized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoggingIn(true);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast({ title: result.message || "Invalid credentials", type: "error" });
        return;
      }

      const loggedUser = result.data.user;
      if (loggedUser.role === "CUSTOMER") {
        toast({ title: "Access Denied: Only admin staff profiles can log in.", type: "error" });
        return;
      }

      setToken(result.data.accessToken);
      setUser(loggedUser);
      localStorage.setItem("fka_token", result.data.accessToken);
      localStorage.setItem("fka_user", JSON.stringify(loggedUser));
    } catch (err) {
      console.error(err);
      toast({ title: "Could not connect to authentication server", type: "error" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const authHeaders = React.useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  const handleUpdateOrderDeliveryStatus = async (orderId: string, deliveryStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/delivery-status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ deliveryStatus }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderPaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/payment-status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ paymentStatus }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    requestConfirm(
      "Xóa đơn hàng này?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/orders/${orderId}`, { method: "DELETE", headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" },
    );
  };

  // --- Customers CRUD ---
  const resetCustomerForm = () => {
    setEditingCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerZalo("");
    setCustomerAddress("");
    setCustomerNotes("");
  };

  const handleEditCustomerTrigger = (c: any) => {
    setEditingCustomerId(c.id);
    setCustomerName(c.name || "");
    setCustomerPhone(c.phone || "");
    setCustomerZalo(c.zalo || "");
    setCustomerAddress(c.address || "");
    setCustomerNotes(c.notes || "");
    setCustomerModal("edit");
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: customerName,
        phone: customerPhone || undefined,
        zalo: customerZalo || undefined,
        address: customerAddress || undefined,
        notes: customerNotes || undefined,
      };
      const url = customerModal === "edit" ? `${API_URL}/customers/${editingCustomerId}` : `${API_URL}/customers`;
      const method = customerModal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        setCustomerModal(null);
        resetCustomerForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to save customer", type: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    requestConfirm(
      "Xóa khách hàng này? Đơn hàng/gói đăng ký liên quan sẽ không bị xóa.",
      async () => {
        try {
          const res = await fetch(`${API_URL}/customers/${id}`, { method: "DELETE", headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" },
    );
  };

  // --- Order line-item builder (shared UX pattern with Subscriptions) ---
  const addOrderLineItem = () => {
    const menuItem = menuItems.find((m) => m.id === orderSelectedMenuItemId);
    if (!menuItem || orderAddQty <= 0) return;
    setOrderLineItems((prev) => {
      const existing = prev.find((l) => l.menuItemId === orderSelectedMenuItemId);
      if (existing) {
        return prev.map((l) => (l.menuItemId === orderSelectedMenuItemId ? { ...l, qty: l.qty + orderAddQty } : l));
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          protein: menuItem.protein,
          flavor: menuItem.flavor,
          sizeGrams: menuItem.sizeGrams,
          unitPrice: menuItem.price,
          qty: orderAddQty,
        },
      ];
    });
    setOrderAddQty(1);
  };

  const orderPricing = orderLineItems.length > 0 ? calculateOrderTotal(orderLineItems) : null;

  const resetOrderForm = () => {
    setEditingOrderId(null);
    setOrderCustomerId("");
    setOrderDeliveryDate(getLocalDateString());
    setOrderPaymentStatus("UNPAID");
    setOrderLineItems([]);
  };

  const handleEditOrderTrigger = (o: any) => {
    setEditingOrderId(o.id);
    setOrderCustomerId(o.customerId || "");
    setOrderDeliveryDate(o.deliveryDate?.split("T")[0] || getLocalDateString());
    setOrderPaymentStatus(o.paymentStatus || "UNPAID");
    setOrderLineItems((o.items || []).map((i: any) => ({ ...i })));
    setOrderModal("edit");
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCustomerId) { toast({ title: "Vui lòng chọn khách hàng", type: "error" }); return; }
    if (orderLineItems.length === 0) { toast({ title: "Vui lòng thêm ít nhất 1 món", type: "error" }); return; }
    try {
      const payload = {
        customerId: orderCustomerId,
        deliveryDate: orderDeliveryDate,
        paymentStatus: orderPaymentStatus,
        items: orderLineItems.map((l) => ({ menuItemId: l.menuItemId, qty: l.qty })),
      };
      const url = orderModal === "edit" ? `${API_URL}/orders/${editingOrderId}` : `${API_URL}/orders`;
      const method = orderModal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        setOrderModal(null);
        resetOrderForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to save order", type: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Subscription pool builder + schedule/price preview ---
  // Sizes available for the currently-selected protein, drawn from real
  // available MenuItem SKUs (e.g. 150g, 250g) — no free-typed kilograms.
  const subPoolAvailableSizes = Array.from(
    new Set(
      menuItems
        .filter((m) => m.isAvailable && m.protein === subPoolProtein)
        .map((m) => m.sizeGrams as number),
    ),
  ).sort((a, b) => a - b);

  const addSubPool = () => {
    if (subPoolQty <= 0 || !subPoolSizeGrams) return;
    setSubPools((prev) => {
      const existing = prev.find((p) => p.protein === subPoolProtein && p.sizeGrams === subPoolSizeGrams);
      if (existing) {
        return prev.map((p) =>
          p.protein === subPoolProtein && p.sizeGrams === subPoolSizeGrams
            ? { ...p, qty: p.qty + subPoolQty }
            : p,
        );
      }
      return [...prev, { protein: subPoolProtein, sizeGrams: subPoolSizeGrams, qty: subPoolQty }];
    });
    setSubPoolQty(10);
  };

  const subTotalGrams = subPools.reduce((sum, p) => sum + p.sizeGrams * p.qty, 0);
  const subSchedulePreview =
    subTotalGrams > 0 && subDeliveryAmountGrams > 0 && subDeliveryIntervalDays > 0
      ? generateVolumeSchedule(subStartDate, subDeliveryAmountGrams, subDeliveryIntervalDays, subTotalGrams)
      : [];
  const subPricing =
    subPools.length > 0
      ? calculatePoolPricing(
          subPools.map((p) => ({ protein: p.protein, sizeGrams: p.sizeGrams, qty: p.qty })),
          menuItems.filter((m) => m.isAvailable),
        )
      : null;

  const resetSubForm = () => {
    setSubCustomerId("");
    setSubPackageName("");
    setSubPools([]);
    setSubPoolProtein("CHICKEN");
    setSubPoolSizeGrams(150);
    setSubPoolQty(10);
    setSubDeliveryAmountGrams(1000);
    setSubDeliveryIntervalDays(1);
    setSubStartDate(getLocalDateString());
    setSubPaymentStatus("UNPAID");
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCustomerId) { toast({ title: "Vui lòng chọn khách hàng", type: "error" }); return; }
    if (!subPackageName.trim()) { toast({ title: "Vui lòng nhập tên gói", type: "error" }); return; }
    if (subPools.length === 0) { toast({ title: "Vui lòng thêm ít nhất 1 loại protein", type: "error" }); return; }
    try {
      // Group flat (protein, sizeGrams, qty) entries back into one pool per
      // protein with a list of portion selections, matching the API's DTO.
      const poolsByProtein = new Map<Protein, { sizeGrams: number; qty: number }[]>();
      for (const p of subPools) {
        const list = poolsByProtein.get(p.protein) ?? [];
        list.push({ sizeGrams: p.sizeGrams, qty: p.qty });
        poolsByProtein.set(p.protein, list);
      }
      const payload = {
        customerId: subCustomerId,
        packageName: subPackageName,
        pools: Array.from(poolsByProtein.entries()).map(([protein, portions]) => ({ protein, portions })),
        deliveryAmountGrams: subDeliveryAmountGrams,
        deliveryIntervalDays: subDeliveryIntervalDays,
        startDate: subStartDate,
        paymentStatus: subPaymentStatus,
      };
      const res = await fetch(`${API_URL}/subscriptions`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        setSubModal(null);
        resetSubForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to create subscription", type: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubStatus = async (subId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/subscriptions/${subId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubscription = (subId: string) => {
    requestConfirm(
      "Xóa gói đăng ký này? Toàn bộ lịch giao hàng sẽ bị xóa.",
      async () => {
        try {
          const res = await fetch(`${API_URL}/subscriptions/${subId}`, { method: "DELETE", headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" },
    );
  };

  const handleOpenSubDetail = async (subId: string) => {
    setSubDetailId(subId);
    setIsSubDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/subscriptions/${subId}/deliveries`, { headers: authHeaders() });
      if (res.ok) setSubDetailDeliveries((await res.json()).data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubDetailLoading(false);
    }
  };

  const handleTopUpPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpModal) return;
    try {
      const res = await fetch(`${API_URL}/subscriptions/${topUpModal.subId}/top-up`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ protein: topUpModal.protein, grams: Math.round(topUpModal.grams) }),
      });
      if (res.ok) {
        setTopUpModal(null);
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to top up pool", type: "error" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Deliveries (unified Order + Subscription entries) ---
  // Subscription-generated entries route through /deliveries/:id/..., while
  // one-off Order entries route through /orders/:id/delivery-status — the
  // unified list is tagged by `source` so we can dispatch correctly.
  const handleUpdateUnifiedStatus = async (entry: any, status: string) => {
    try {
      if (entry.source === "ORDER") {
        const res = await fetch(`${API_URL}/orders/${entry.id}/delivery-status`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ deliveryStatus: status }),
        });
        if (res.ok) loadData();
      } else {
        const res = await fetch(`${API_URL}/deliveries/${entry.id}/status`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ status }),
        });
        if (res.ok) loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkDelivered = (entry: any) => {
    requestConfirm("Xác nhận đã giao? Số lượng sẽ được trừ vào gói đăng ký.", async () => {
      if (entry.source === "ORDER") {
        await handleUpdateUnifiedStatus(entry, "DELIVERED");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/deliveries/${entry.id}/deliver`, { method: "POST", headers: authHeaders() });
        if (res.ok) loadData();
        else {
          const error = await res.json();
          toast({ title: error.message || "Failed to mark delivered", type: "error" });
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handlePostponeDelivery = (entry: any) => {
    if (entry.source !== "SUBSCRIPTION") return;
    requestConfirm("Hoãn lần giao này? Toàn bộ lịch còn lại sẽ dời sau một chu kỳ, số lượng được bảo lưu.", async () => {
      try {
        const res = await fetch(`${API_URL}/deliveries/${entry.id}/postpone`, { method: "POST", headers: authHeaders() });
        if (res.ok) loadData();
        else {
          const error = await res.json();
          toast({ title: error.message || "Failed to postpone delivery", type: "error" });
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleDeleteDelivery = (entry: any) => {
    if (entry.source === "ORDER") {
      toast({ title: "Xóa đơn hàng lẻ trong tab Orders dispatcher.", type: "default" });
      return;
    }
    requestConfirm(
      "Xóa lần giao này?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/deliveries/${entry.id}`, { method: "DELETE", headers: authHeaders() });
          if (res.ok) loadData();
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" },
    );
  };

  // Create or Update Menu Item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        protein: menuItemProtein,
        flavor: menuItemFlavor,
        sizeGrams: Number(menuItemSizeGrams),
        price: Number(menuItemPrice),
        imageUrl: menuItemImage || undefined,
        categoryId: menuItemCatId || undefined,
        isAvailable: menuItemAvailable,
        stockQuantity: Number(menuItemStock),
      };

      const url = menuModal === "edit" ? `${API_URL}/menu/${editingMenuItemId}` : `${API_URL}/menu`;
      const method = menuModal === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMenuModal(null);
        resetMenuForm();
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to save menu item", type: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Menu Item
  const handleDeleteMenuItem = (itemId: string) => {
    requestConfirm(
      "Are you sure you want to delete this menu item?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/menu/${itemId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            loadData();
          }
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" },
    );
  };

  const handleEditMenuItemTrigger = (item: any) => {
    setEditingMenuItemId(item.id);
    setMenuItemProtein(item.protein);
    setMenuItemFlavor(item.flavor);
    setMenuItemSizeGrams(item.sizeGrams);
    setMenuItemPrice(item.price);
    setMenuItemImage(item.imageUrl || "");
    setMenuItemCatId(item.categoryId || "");
    setMenuItemAvailable(item.isAvailable);
    setMenuItemStock(item.stockQuantity ?? 0);
    setMenuModal("edit");
  };

  const resetMenuForm = () => {
    setEditingMenuItemId(null);
    setMenuItemProtein("CHICKEN");
    setMenuItemFlavor("");
    setMenuItemSizeGrams(150);
    setMenuItemPrice(25000);
    setMenuItemImage("");
    setMenuItemAvailable(true);
    setMenuItemStock(0);
  };

  // Quick +/- stock adjust from the catalog card — hits the dedicated
  // PATCH /menu/:id/stock endpoint (delta) rather than resending the whole
  // item form, and optimistically updates the local list so the card
  // doesn't wait on a full reload to reflect the change.
  const handleAdjustStock = async (itemId: string, delta: number) => {
    if (adjustingStockId) return;
    setAdjustingStockId(itemId);
    try {
      const res = await fetch(`${API_URL}/menu/${itemId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        const updated = (await res.json()).data;
        setMenuItems((prev) => prev.map((m) => (m.id === itemId ? { ...m, stockQuantity: updated.stockQuantity } : m)));
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to adjust stock", type: "error" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdjustingStockId(null);
    }
  };

  // "Add Stock" sub-tab of Inventory — restocking a dish is what makes it
  // available to customers (see the isAvailable-forcing rule server-side),
  // so this is the primary "bring a dish online" action, distinct from
  // creating a brand-new menu item (that's still Menu Catalog Manager).
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStockItemId || addStockQty <= 0) return;
    setIsAddingStock(true);
    try {
      const res = await fetch(`${API_URL}/menu/${addStockItemId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ delta: addStockQty }),
      });
      if (res.ok) {
        const updated = (await res.json()).data;
        setMenuItems((prev) => prev.map((m) => (m.id === addStockItemId ? { ...m, stockQuantity: updated.stockQuantity, isAvailable: updated.isAvailable } : m)));
        setAddStockQty(10);
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to add stock", type: "error" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingStock(false);
    }
  };

  // Create Discount Code
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/discounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: discountCode.toUpperCase(),
          type: discountType,
          amount: Number(discountAmount),
          isActive: true,
          startsAt: new Date(discountStarts).toISOString(),
          endsAt: new Date(discountEnds).toISOString(),
        }),
      });

      if (res.ok) {
        setDiscountCode("");
        setDiscountAmount(10);
        loadData();
      } else {
        const error = await res.json();
        toast({ title: error.message || "Failed to create discount code", type: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiscount = (id: string) => {
    requestConfirm(
      "Are you sure you want to delete this discount code?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/discounts/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            loadData();
          }
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" },
    );
  };

  const formatVND = (num: number) => {
    return `${num.toLocaleString()} ₫`;
  };

  // One-off Orders — filtered + sorted the same way the table below used to
  // do inline, pulled out here so it can be paginated.
  const filteredOrders = orders
    .filter((o) => {
      if (orderViewTab === "completed") return o.deliveryStatus === "DELIVERED";
      if (orderViewTab === "cancelled") return o.deliveryStatus === "CANCELLED";
      if (o.deliveryStatus === "DELIVERED" || o.deliveryStatus === "CANCELLED") return false;
      if (orderStatusFilter !== "ALL" && o.deliveryStatus !== orderStatusFilter) return false;
      if (orderFulfillmentFilter !== "ALL" && o.fulfillmentType !== orderFulfillmentFilter) return false;
      if (orderSearch.trim() && !o.customerName?.toLowerCase().includes(orderSearch.trim().toLowerCase())) return false;
      // "Sắp tới" (upcoming) mode ignores the date input and shows
      // everything not today (future or overdue); otherwise fall back to
      // the typeable date filter — empty string means "Tất cả" (no date
      // narrowing), any other value matches only that exact calendar day.
      if (orderDateMode === "upcoming") {
        if (isToday(o.deliveryDate)) return false;
      } else if (orderDateFilter && getLocalDateString(new Date(o.deliveryDate)) !== orderDateFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  // Grouped by delivery date — same day-card pattern the Deliveries tab
  // uses, via the same shared groupEntriesByDate helper, so "grouped by
  // date" means the same thing everywhere in this console.
  const orderDayGroups = groupEntriesByDate(filteredOrders, (o) => o.deliveryDate, "day");
  const ordersTotalPages = Math.ceil(orderDayGroups.length / CARD_PAGE_SIZE) || 1;
  const pagedOrderDayGroups = paginate(orderDayGroups, clampPage(ordersPage, ordersTotalPages), CARD_PAGE_SIZE);

  // Orders from Subscriptions: filtered by its own independent
  // Current/Completed/Cancelled tab + search + status filter — entirely
  // separate from the one-off Orders filters above.
  const filteredSubscriptionOrders = subscriptionOrders
    .filter((d) => {
      if (subOrderViewTab === "completed") return d.status === "DELIVERED";
      if (subOrderViewTab === "cancelled") return d.status === "CANCELLED";
      if (d.status === "DELIVERED" || d.status === "CANCELLED") return false;
      if (subOrderStatusFilter !== "ALL" && d.status !== subOrderStatusFilter) return false;
      if (subOrderSearch.trim() && !d.customerName?.toLowerCase().includes(subOrderSearch.trim().toLowerCase())) return false;
      if (subOrderDateMode === "upcoming") {
        if (isToday(d.scheduledDate)) return false;
      } else if (subOrderDateFilter && getLocalDateString(new Date(d.scheduledDate)) !== subOrderDateFilter) {
        return false;
      }
      return true;
    })
    // Sorted ascending by scheduled date (oldest first) before being
    // bucketed into day-groups below, matching the one-off Orders sort.
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  const subOrderDayGroups = groupEntriesByDate(filteredSubscriptionOrders, (d) => d.scheduledDate, "day");
  const subOrdersTotalPages = Math.ceil(subOrderDayGroups.length / CARD_PAGE_SIZE) || 1;
  const pagedSubOrderDayGroups = paginate(subOrderDayGroups, clampPage(subOrdersPage, subOrdersTotalPages), CARD_PAGE_SIZE);

  // Shared filter predicate for the Deliveries tab — applies identically to
  // the "Tất cả" (day-grouped) and "Sắp tới" (week/month-grouped) views so
  // filtering doesn't behave differently depending on which grouping mode
  // is active.
  const matchesDeliveryFilters = (d: any): boolean => {
    if (deliverySourceFilter !== "ALL" && d.source !== deliverySourceFilter) return false;
    if (deliveryStatusFilter !== "ALL" && d.status !== deliveryStatusFilter) return false;
    if (deliverySearch.trim() && !d.customerName?.toLowerCase().includes(deliverySearch.trim().toLowerCase())) return false;
    // Typeable date filter — empty means no date narrowing; applies
    // identically to both "Tất cả" and "Sắp tới" views.
    if (deliveryDateFilter && getLocalDateString(new Date(d.scheduledDate)) !== deliveryDateFilter) return false;
    return true;
  };

  // Groups the flat "Tất cả" delivery list by calendar day (local time) so
  // staff can see everything due on a given date at a glance, instead of
  // scrolling one long table — same grouping shape as the "Sắp tới" view's
  // week/month groups, just at day granularity.
  const filteredDeliveriesAll = deliveries.filter(matchesDeliveryFilters);
  const deliveryDayGroups = groupEntriesByDate(filteredDeliveriesAll, (d) => d.scheduledDate, "day").map((g) => ({
    date: g.key,
    entries: g.entries,
    totalGrams: g.entries.reduce((s, e: any) => s + (e.totalGrams || 0), 0),
  }));
  const deliveriesAllTotalPages = Math.ceil(deliveryDayGroups.length / CARD_PAGE_SIZE) || 1;
  const pagedDeliveryDayGroups = paginate(
    deliveryDayGroups,
    clampPage(deliveriesAllPage, deliveriesAllTotalPages),
    CARD_PAGE_SIZE,
  );

  // "Sắp tới" (upcoming) view — derived from the exact same unified
  // `deliveries` list "Tất cả" uses (filtered to today-onward, non-terminal
  // status, plus the shared search/source/status filters), then bucketed
  // with the same groupEntriesByDate helper. Previously this view fetched
  // its own server-grouped data from a separate endpoint, which could
  // disagree with "Tất cả" about where a day boundary falls; computing both
  // from one shared list/function guarantees they always agree.
  const upcomingCutoff = new Date();
  upcomingCutoff.setHours(0, 0, 0, 0);
  const upcomingEntries = deliveries.filter(
    (d) =>
      new Date(d.scheduledDate) >= upcomingCutoff &&
      d.status !== "CANCELLED" &&
      d.status !== "DELIVERED" &&
      matchesDeliveryFilters(d),
  );
  const filteredUpcomingGroups = groupEntriesByDate(upcomingEntries, (d) => d.scheduledDate, deliveryGroupBy);
  const deliveriesUpcomingTotalPages = Math.ceil(filteredUpcomingGroups.length / CARD_PAGE_SIZE) || 1;
  const pagedUpcomingGroups = paginate(
    filteredUpcomingGroups,
    clampPage(deliveriesUpcomingPage, deliveriesUpcomingTotalPages),
    CARD_PAGE_SIZE,
  );

  // Render Login state if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-border bg-card shadow-xl rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Fortify Kitchen" className="h-14 w-14 rounded-md object-contain mx-auto" />
            <h1 className="text-xl font-semibold font-heading">Administrative console</h1>
            <p className="text-xs text-muted-foreground">Sign in to manage orders, subscriptions, and menu items.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="admin@fortifykitchen.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                placeholder="admin123"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
            >
              {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In to Admin Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-200">
      {/* 1. SIDEBAR */}
      {sidebarOpen && (
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Fortify Kitchen" className="h-8 w-8 rounded-md object-contain" />
            <span className="font-semibold tracking-tight font-heading text-sm">Fortify Console</span>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden text-muted-foreground hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 text-xs font-semibold">
          {[
            { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
            { id: "customers", label: "Customers", icon: Users },
            { id: "orders", label: "Orders dispatcher", icon: ShoppingBag },
            { id: "menu", label: "Menu Catalog Manager", icon: Utensils },
            { id: "inventory", label: "Inventory", icon: Package },
            { id: "subscriptions", label: "Subscriptions", icon: Calendar },
            { id: "deliveries", label: "Deliveries", icon: Truck },
            { id: "prep-list", label: "Prep List", icon: ChefHat },
            { id: "discounts", label: "Promotional Codes", icon: Tag },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as any)}
              className={`w-full text-left py-2.5 px-3.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                section === item.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto hidden md:block space-y-2.5">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="w-full text-left text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
          >
            <Info className="h-3.5 w-3.5 shrink-0" />
            Privacy & Operating Terms
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span className="truncate max-w-[120px] font-semibold">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      )}

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-md transition-colors cursor-pointer shrink-0"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <h2 className="font-extrabold tracking-tight font-heading text-base capitalize truncate">
              {section.replace("-", " ")}
            </h2>
          </div>
          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Database Connected (Vietnam Mode)
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Syncing workspace...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION A: DASHBOARD OVERVIEW */}
              {section === "dashboard" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Total Revenue (VND)", value: formatVND(stats.totalRevenue), icon: DollarSign },
                      { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: Calendar },
                      { label: "Total Customers", value: stats.totalCustomers, icon: Users },
                      { label: "Total Food Orders", value: stats.totalOrders, icon: ShoppingBag },
                    ].map((item, idx) => (
                      <div key={idx} className="border border-border bg-card rounded-lg p-6 flex items-center justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{item.label}</span>
                          <div className="text-xl font-semibold font-heading">{item.value}</div>
                        </div>
                        <div className="p-3 rounded-md border border-primary/20 bg-primary/10 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order-workflow KPIs — needs-attention counters, click through to Orders */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: "Awaiting Acceptance",
                        value: stats.ordersAwaitingAcceptance || 0,
                        icon: ShoppingBag,
                        urgent: (stats.ordersAwaitingAcceptance || 0) > 0,
                      },
                      {
                        label: "In Preparation",
                        value: stats.ordersInPreparation || 0,
                        icon: ChefHat,
                      },
                      {
                        label: "Out of Stock Dishes",
                        value: (stats.outOfStockItems || []).length,
                        icon: Package,
                        urgent: (stats.outOfStockItems || []).length > 0,
                      },
                      {
                        label: "Low Stock Dishes",
                        value: (stats.lowStockItems || []).length,
                        icon: Package,
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSection(item.label.includes("Stock") ? "inventory" : "orders")}
                        className={`text-left border rounded-lg p-6 flex items-center justify-between transition-smooth hover:opacity-90 cursor-pointer ${
                          item.urgent ? "border-amber-300 bg-amber-50" : "border-border bg-card"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{item.label}</span>
                          <div className="text-xl font-semibold font-heading">{item.value}</div>
                        </div>
                        <div
                          className={`p-3 rounded-md border ${
                            item.urgent
                              ? "border-amber-300 bg-amber-100 text-amber-700"
                              : "border-primary/20 bg-primary/10 text-primary"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Volume-subscription specific KPIs */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: "Outstanding Volume (kg)",
                        value: formatGrams(stats.outstandingVolumeGrams || 0),
                        icon: Truck,
                      },
                      {
                        label: "Nearing Depletion",
                        value: stats.subscriptionsNearingDepletion || 0,
                        icon: ChefHat,
                      },
                      {
                        label: "Delivered This Month",
                        value: formatGrams(stats.gramsDeliveredThisMonth || 0),
                        icon: Calendar,
                      },
                      {
                        label: "Deliveries This Week",
                        value: stats.deliveriesThisWeek || 0,
                        icon: ShoppingBag,
                      },
                      {
                        label: "Dishes Ready Now",
                        value: stats.dishesReadyNow ?? menuItems.filter((m) => (m.stockQuantity ?? 0) > 0).length,
                        icon: ChefHat,
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="border border-border bg-card rounded-lg p-6 flex items-center justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{item.label}</span>
                          <div className="text-xl font-semibold font-heading">{item.value}</div>
                        </div>
                        <div className="p-3 rounded-md border border-primary/20 bg-primary/10 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Inventory alerts — out-of-stock / low-stock dishes */}
                  {((stats.outOfStockItems || []).length > 0 || (stats.lowStockItems || []).length > 0) && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {(stats.outOfStockItems || []).length > 0 && (
                        <div className="border border-red-200 bg-red-50 rounded-2xl p-6">
                          <h3 className="text-sm font-bold font-heading mb-3 text-red-800">Out of Stock</h3>
                          <ul className="space-y-1.5 text-xs">
                            {stats.outOfStockItems.map((m: any) => (
                              <li key={m.id} className="flex justify-between text-red-700">
                                <span>{PROTEIN_LABELS[m.protein as Protein] || m.protein} {m.flavor} ({m.sizeGrams}g)</span>
                                <span className="font-bold">0</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(stats.lowStockItems || []).length > 0 && (
                        <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
                          <h3 className="text-sm font-bold font-heading mb-3 text-amber-800">Low Stock (≤5)</h3>
                          <ul className="space-y-1.5 text-xs">
                            {stats.lowStockItems.map((m: any) => (
                              <li key={m.id} className="flex justify-between text-amber-700">
                                <span>{PROTEIN_LABELS[m.protein as Protein] || m.protein} {m.flavor} ({m.sizeGrams}g)</span>
                                <span className="font-bold">{m.stockQuantity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Orders List */}
                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold font-heading mb-4">Recent Incoming Orders</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/50 pb-2">
                            <th className="pb-3 font-semibold">Customer</th>
                            <th className="pb-3 font-semibold">Amount</th>
                            <th className="pb-3 font-semibold">Fulfillment</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentOrders?.map((o: any) => (
                            <tr key={o.id} className="border-b border-border/20 last:border-0">
                              <td className="py-3.5 font-bold">{o.customerName}</td>
                              <td className="py-3.5 font-semibold text-primary">{formatVND(o.total)}</td>
                              <td className="py-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    o.fulfillmentType === "IMMEDIATE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {o.fulfillmentType === "IMMEDIATE" ? "Ready Now" : "Needs Prep"}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  {o.deliveryStatus}
                                </span>
                              </td>
                              <td className="py-3.5 text-muted-foreground">
                                {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: ORDERS DISPATCHER */}
              {section === "orders" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold font-heading">Orders ({orders.length})</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={orderDateFilter}
                        onChange={(e) => { setOrderDateFilter(e.target.value); setOrderDateMode("date"); }}
                        className="text-[11px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                      />
                      {orderDateFilter && orderDateMode === "date" && (
                        <button
                          onClick={() => setOrderDateFilter("")}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted cursor-pointer"
                        >
                          Tất cả
                        </button>
                      )}
                      <button
                        onClick={() => setOrderDateMode(orderDateMode === "upcoming" ? "date" : "upcoming")}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md border cursor-pointer ${orderDateMode === "upcoming" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted"}`}
                      >
                        Sắp tới
                      </button>
                      <button
                        onClick={() => { resetOrderForm(); setOrderModal("create"); }}
                        className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Tạo đơn hàng
                      </button>
                    </div>
                  </div>

                  {/* Current / Completed / Cancelled — accepting an order
                      moves it Ordered -> Preparing; marking it Completed
                      moves it to DELIVERED, which drops it out of Current
                      into the Completed tab here. */}
                  <div className="flex gap-2 border-b border-border">
                    {(
                      [
                        { id: "current", label: "Current" },
                        { id: "completed", label: "Completed" },
                        { id: "cancelled", label: "Cancelled" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setOrderViewTab(tab.id)}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                          orderViewTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Filters — only meaningful within Current, where more
                      than one status/fulfillment type can be mixed together. */}
                  {orderViewTab === "current" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search customer..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="text-xs px-3 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary w-48"
                      />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value as typeof orderStatusFilter)}
                        className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
                      >
                        <option value="ALL">All statuses</option>
                        <option value="SCHEDULED">Ordered</option>
                        <option value="PREPPING">Preparing</option>
                        <option value="SKIPPED">Skipped</option>
                      </select>
                      <select
                        value={orderFulfillmentFilter}
                        onChange={(e) => setOrderFulfillmentFilter(e.target.value as typeof orderFulfillmentFilter)}
                        className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
                      >
                        <option value="ALL">All fulfillment</option>
                        <option value="IMMEDIATE">Ready Now</option>
                        <option value="SCHEDULED">Needs Prep</option>
                      </select>
                    </div>
                  )}

                  {orderDayGroups.length === 0 ? (
                    <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                      Không có đơn hàng nào khớp bộ lọc
                    </div>
                  ) : (
                    pagedOrderDayGroups.map((group) => (
                      <div key={group.key} className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                            {formatGroupKeyLabel(group.key, "day")}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">{group.entries.length} đơn</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="text-muted-foreground border-b border-border/50 pb-3">
                                <th className="pb-3 font-semibold">Khách hàng</th>
                                <th className="pb-3 font-semibold">Số phần</th>
                                <th className="pb-3 font-semibold">Tổng tiền</th>
                                <th className="pb-3 font-semibold">Fulfillment</th>
                                <th className="pb-3 font-semibold">Thanh toán</th>
                                <th className="pb-3 font-semibold">Trạng thái</th>
                                <th className="pb-3 font-semibold text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.entries.map((o: any) => (
                                <tr
                                  key={o.id}
                                  onClick={() => setOrderDetailView(o)}
                                  className="border-b border-border/20 last:border-0 align-top cursor-pointer hover:bg-muted/30 transition-colors"
                                >
                                  <td className="py-4 text-xs">
                                    <div className="font-bold text-foreground">{o.customerName}</div>
                                    <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5 mt-1">
                                      {o.deliveryAddress && <span className="truncate max-w-[200px]" title={o.deliveryAddress}>📍 {o.deliveryAddress}</span>}
                                      <span>💳 {o.paymentMethod === "BANK_TRANSFER" ? "VietQR CK" : "Ship COD"}</span>
                                    </div>
                                    {o.notes && <div className="text-[10px] text-primary italic truncate mt-1.5">&quot;{o.notes}&quot;</div>}
                                  </td>
                                  <td className="py-4 text-muted-foreground">
                                    {(o.items || []).reduce((s: number, i: any) => s + i.qty, 0)}
                                  </td>
                                  <td className="py-4 font-bold text-primary">{formatVND(o.total)}</td>
                                  <td className="py-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                                        o.fulfillmentType === "IMMEDIATE"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}
                                    >
                                      {o.fulfillmentType === "IMMEDIATE" ? "Ready Now" : "Needs Prep"}
                                    </span>
                                  </td>
                                  <td className="py-4" onClick={(e) => e.stopPropagation()}>
                                    <select
                                      value={o.paymentStatus}
                                      onChange={(e) => handleUpdateOrderPaymentStatus(o.id, e.target.value)}
                                      className="text-[10px] font-bold px-2 py-1 rounded border border-border bg-background cursor-pointer"
                                    >
                                      {PAYMENT_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  <td className="py-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                                        o.deliveryStatus === "PREPPING"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : o.deliveryStatus === "DELIVERED"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : o.deliveryStatus === "CANCELLED"
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : o.deliveryStatus === "SKIPPED"
                                                ? "bg-muted text-muted-foreground border-border"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}
                                    >
                                      {ORDER_STATUS_LABELS[o.deliveryStatus] || o.deliveryStatus}
                                    </span>
                                  </td>
                                  <td className="py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                      {o.deliveryStatus === "SCHEDULED" && (
                                        <button
                                          onClick={() => handleUpdateOrderDeliveryStatus(o.id, "PREPPING")}
                                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer whitespace-nowrap"
                                        >
                                          Accept Order
                                        </button>
                                      )}
                                      {o.deliveryStatus === "PREPPING" && (
                                        <button
                                          onClick={() => handleUpdateOrderDeliveryStatus(o.id, "DELIVERED")}
                                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
                                        >
                                          Mark Completed
                                        </button>
                                      )}
                                      {(o.deliveryStatus === "SCHEDULED" || o.deliveryStatus === "PREPPING") && (
                                        <button
                                          onClick={() => handleUpdateOrderDeliveryStatus(o.id, "CANCELLED")}
                                          className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleEditOrderTrigger(o)}
                                        className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0"
                                        title="Edit"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOrder(o.id)}
                                        className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                  <PaginationControls
                    page={ordersPage}
                    totalPages={ordersTotalPages}
                    totalItems={orderDayGroups.length}
                    pageSize={CARD_PAGE_SIZE}
                    onChange={setOrdersPage}
                  />

                  {/* Orders generated from Subscriptions — a separate group
                      from the one-off Order rows above (these are Delivery
                      rows, not Order rows), so staff can still monitor and
                      action them from the Orders view. Accepting/completing/
                      cancelling and postponing route through the same
                      unified handlers the Deliveries tab uses; "Mark
                      Completed" goes through markDelivered, which deducts
                      the delivered amount from the subscription's pool. */}
                  <div className="flex justify-between items-center pt-4">
                    <h3 className="text-sm font-bold font-heading">
                      Orders from Subscriptions ({filteredSubscriptionOrders.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={subOrderDateFilter}
                        onChange={(e) => { setSubOrderDateFilter(e.target.value); setSubOrderDateMode("date"); }}
                        className="text-[11px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                      />
                      {subOrderDateFilter && subOrderDateMode === "date" && (
                        <button
                          onClick={() => setSubOrderDateFilter("")}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted cursor-pointer"
                        >
                          Tất cả
                        </button>
                      )}
                      <button
                        onClick={() => setSubOrderDateMode(subOrderDateMode === "upcoming" ? "date" : "upcoming")}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md border cursor-pointer ${subOrderDateMode === "upcoming" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted"}`}
                      >
                        Sắp tới
                      </button>
                    </div>
                  </div>

                  {/* Independent Current / Completed / Cancelled tab for
                      subscription-generated orders — separate state from
                      the one-off Orders tabs above, so switching one
                      doesn't affect the other. */}
                  <div className="flex gap-2 border-b border-border">
                    {(
                      [
                        { id: "current", label: "Current" },
                        { id: "completed", label: "Completed" },
                        { id: "cancelled", label: "Cancelled" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSubOrderViewTab(tab.id)}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                          subOrderViewTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {subOrderViewTab === "current" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search customer..."
                        value={subOrderSearch}
                        onChange={(e) => setSubOrderSearch(e.target.value)}
                        className="text-xs px-3 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary w-48"
                      />
                      <select
                        value={subOrderStatusFilter}
                        onChange={(e) => setSubOrderStatusFilter(e.target.value as typeof subOrderStatusFilter)}
                        className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
                      >
                        <option value="ALL">All statuses</option>
                        <option value="SCHEDULED">Ordered</option>
                        <option value="PREPPING">Preparing</option>
                        <option value="SKIPPED">Skipped</option>
                      </select>
                    </div>
                  )}

                  {subOrderDayGroups.length === 0 ? (
                    <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                      Không có đơn nào từ gói đăng ký khớp bộ lọc
                    </div>
                  ) : (
                    pagedSubOrderDayGroups.map((group) => (
                      <div key={group.key} className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                            {formatGroupKeyLabel(group.key, "day")}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">{group.entries.length} đơn</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="text-muted-foreground border-b border-border/50 pb-3">
                                <th className="pb-3 font-semibold">Khách hàng</th>
                                <th className="pb-3 font-semibold">Gói đăng ký</th>
                                <th className="pb-3 font-semibold">Khối lượng</th>
                                <th className="pb-3 font-semibold">Trạng thái</th>
                                <th className="pb-3 font-semibold text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.entries.map((d: any) => (
                                <tr key={d.id} className="border-b border-border/20 last:border-0 align-top">
                                  <td className="py-4">
                                    <div className="font-bold">{d.customerName}</div>
                                  </td>
                                  <td className="py-4 text-primary font-semibold">{d.packageName}</td>
                                  <td className="py-4 font-mono text-muted-foreground">{formatGrams(d.totalGrams)}</td>
                                  <td className="py-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                                        d.status === "PREPPING"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : d.status === "DELIVERED"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : d.status === "CANCELLED"
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : d.status === "SKIPPED"
                                                ? "bg-muted text-muted-foreground border-border"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}
                                    >
                                      {ORDER_STATUS_LABELS[d.status] || d.status}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                      {d.status === "SCHEDULED" && (
                                        <button
                                          onClick={() => handleUpdateUnifiedStatus(d, "PREPPING")}
                                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer whitespace-nowrap"
                                        >
                                          Accept Order
                                        </button>
                                      )}
                                      {d.status === "PREPPING" && (
                                        <button
                                          onClick={() => handleMarkDelivered(d)}
                                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
                                        >
                                          Mark Completed
                                        </button>
                                      )}
                                      {(d.status === "SCHEDULED" || d.status === "PREPPING") && (
                                        <button
                                          onClick={() => handleUpdateUnifiedStatus(d, "CANCELLED")}
                                          className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                      {(d.status === "SCHEDULED" || d.status === "PREPPING") && (
                                        <button
                                          onClick={() => handlePostponeDelivery(d)}
                                          title="Hoãn lần giao này (bảo lưu số lượng)"
                                          className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border hover:bg-muted cursor-pointer whitespace-nowrap"
                                        >
                                          Hoãn
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                  <PaginationControls
                    page={subOrdersPage}
                    totalPages={subOrdersTotalPages}
                    totalItems={subOrderDayGroups.length}
                    pageSize={CARD_PAGE_SIZE}
                    onChange={setSubOrdersPage}
                  />
                </div>
              )}

              {/* SECTION: CUSTOMERS */}
              {section === "customers" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold font-heading">Customers ({customers.length})</h3>
                    <button
                      onClick={() => { resetCustomerForm(); setCustomerModal("create"); }}
                      className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Thêm khách hàng
                    </button>
                  </div>

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/50 pb-3">
                            <th className="pb-3 font-semibold">Tên</th>
                            <th className="pb-3 font-semibold">SĐT</th>
                            <th className="pb-3 font-semibold">Zalo</th>
                            <th className="pb-3 font-semibold">Địa chỉ</th>
                            <th className="pb-3 font-semibold text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(customers, clampPage(customersPage, Math.ceil(customers.length / PAGE_SIZE) || 1), PAGE_SIZE).map((c) => (
                            <tr key={c.id} className="border-b border-border/20 last:border-0">
                              <td className="py-3.5 font-bold">{c.name}</td>
                              <td className="py-3.5 text-muted-foreground">{c.phone || "—"}</td>
                              <td className="py-3.5 text-muted-foreground">{c.zalo || "—"}</td>
                              <td className="py-3.5 text-muted-foreground truncate max-w-[200px]">{c.address || "—"}</td>
                              <td className="py-3.5">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEditCustomerTrigger(c)}
                                    className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomer(c.id)}
                                    className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      page={customersPage}
                      totalPages={Math.ceil(customers.length / PAGE_SIZE) || 1}
                      totalItems={customers.length}
                      pageSize={PAGE_SIZE}
                      onChange={setCustomersPage}
                    />
                  </div>
                </div>
              )}

              {/* SECTION: DELIVERIES */}
              {section === "deliveries" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-sm font-bold font-heading">
                      Deliveries {deliveryView === "all" ? `(${filteredDeliveriesAll.length})` : ""}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-md border border-border overflow-hidden text-[10px] font-bold">
                        <button
                          onClick={() => setDeliveryView("all")}
                          className={`px-3 py-1.5 cursor-pointer ${deliveryView === "all" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                        >
                          Tất cả
                        </button>
                        <button
                          onClick={() => setDeliveryView("upcoming")}
                          className={`px-3 py-1.5 cursor-pointer border-l border-border ${deliveryView === "upcoming" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                        >
                          Sắp tới
                        </button>
                      </div>
                      {deliveryView === "upcoming" && (
                        <select
                          value={deliveryGroupBy}
                          onChange={(e) => setDeliveryGroupBy(e.target.value as "day" | "week" | "month")}
                          className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                        >
                          <option value="day">Theo ngày</option>
                          <option value="week">Theo tuần</option>
                          <option value="month">Theo tháng</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Filters — apply to both views */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tìm khách hàng..."
                      value={deliverySearch}
                      onChange={(e) => setDeliverySearch(e.target.value)}
                      className="text-xs px-3 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary w-48"
                    />
                    <select
                      value={deliverySourceFilter}
                      onChange={(e) => setDeliverySourceFilter(e.target.value as typeof deliverySourceFilter)}
                      className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
                    >
                      <option value="ALL">Tất cả loại</option>
                      <option value="ORDER">Đơn lẻ</option>
                      <option value="SUBSCRIPTION">Gói đăng ký</option>
                    </select>
                    <select
                      value={deliveryStatusFilter}
                      onChange={(e) => setDeliveryStatusFilter(e.target.value as typeof deliveryStatusFilter)}
                      className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      {DELIVERY_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={deliveryDateFilter}
                      onChange={(e) => setDeliveryDateFilter(e.target.value)}
                      className="text-[11px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                    />
                    {deliveryDateFilter && (
                      <button
                        onClick={() => setDeliveryDateFilter("")}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted cursor-pointer"
                      >
                        Bỏ lọc ngày
                      </button>
                    )}
                  </div>

                  {deliveryView === "all" ? (
                    <div className="space-y-6">
                      {deliveryDayGroups.length === 0 ? (
                        <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                          Không có lịch giao nào khớp bộ lọc
                        </div>
                      ) : (
                        pagedDeliveryDayGroups.map((group) => (
                          <div key={group.date} className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                                {new Date(group.date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {group.entries.length} lần giao · {formatGrams(group.totalGrams)}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="text-muted-foreground border-b border-border/50 pb-3">
                                    <th className="pb-2 font-semibold">Loại</th>
                                    <th className="pb-2 font-semibold">Khách hàng</th>
                                    <th className="pb-2 font-semibold">Gói / Món</th>
                                    <th className="pb-2 font-semibold">Khối lượng</th>
                                    <th className="pb-2 font-semibold">Trạng thái</th>
                                    <th className="pb-2 font-semibold text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.entries.map((d: any) => (
                                    <tr key={`${d.source}-${d.id}`} className="border-b border-border/20 last:border-0">
                                      <td className="py-3">
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            d.source === "SUBSCRIPTION"
                                              ? "bg-primary/10 text-primary border-primary/20"
                                              : "bg-muted text-muted-foreground border-border"
                                          }`}
                                        >
                                          {d.source === "SUBSCRIPTION" ? "Gói đăng ký" : "Đơn lẻ"}
                                        </span>
                                      </td>
                                      <td className="py-3 font-bold">{d.customerName}</td>
                                      <td className="py-3 text-primary font-semibold">
                                        {d.packageName || d.items.map((i: any) => `${i.flavor}×${i.qty}`).join(", ")}
                                      </td>
                                      <td className="py-3 font-mono text-muted-foreground">{formatGrams(d.totalGrams)}</td>
                                      <td className="py-3">
                                        <select
                                          value={d.status}
                                          onChange={(e) => handleUpdateUnifiedStatus(d, e.target.value)}
                                          className="text-[10px] font-bold px-2 py-1 rounded border border-border bg-background cursor-pointer"
                                        >
                                          {DELIVERY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                      </td>
                                      <td className="py-3 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                          {d.status !== "DELIVERED" && d.status !== "CANCELLED" && (
                                            <button
                                              onClick={() => handleMarkDelivered(d)}
                                              title="Xác nhận đã giao"
                                              className="text-[10px] font-bold px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                                            >
                                              Đã giao
                                            </button>
                                          )}
                                          {d.source === "SUBSCRIPTION" && d.status !== "DELIVERED" && d.status !== "CANCELLED" && (
                                            <button
                                              onClick={() => handlePostponeDelivery(d)}
                                              title="Hoãn lần giao này (bảo lưu số lượng)"
                                              className="text-[10px] font-bold px-2 py-1 rounded border border-border hover:bg-muted cursor-pointer"
                                            >
                                              Hoãn
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteDelivery(d)}
                                            className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      )}
                      <PaginationControls
                        page={deliveriesAllPage}
                        totalPages={deliveriesAllTotalPages}
                        totalItems={deliveryDayGroups.length}
                        pageSize={CARD_PAGE_SIZE}
                        onChange={setDeliveriesAllPage}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredUpcomingGroups.length === 0 ? (
                        <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                          Không có lịch giao nào khớp bộ lọc
                        </div>
                      ) : (
                        pagedUpcomingGroups.map((group) => (
                          <div key={group.key} className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                                {formatGroupKeyLabel(group.key, deliveryGroupBy)}
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {group.entries.length} lần giao · {formatGrams(group.entries.reduce((s: number, e: any) => s + (e.totalGrams || 0), 0))}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="text-muted-foreground border-b border-border/50 pb-3">
                                    <th className="pb-2 font-semibold">Ngày giao</th>
                                    <th className="pb-2 font-semibold">Loại</th>
                                    <th className="pb-2 font-semibold">Khách hàng</th>
                                    <th className="pb-2 font-semibold">Gói / Món</th>
                                    <th className="pb-2 font-semibold">Khối lượng</th>
                                    <th className="pb-2 font-semibold">Trạng thái</th>
                                    <th className="pb-2 font-semibold text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.entries.map((d: any) => (
                                    <tr key={`${d.source}-${d.id}`} className="border-b border-border/20 last:border-0">
                                      <td className="py-3 text-muted-foreground">
                                        {new Date(d.scheduledDate).toLocaleDateString("vi-VN")}
                                      </td>
                                      <td className="py-3">
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            d.source === "SUBSCRIPTION"
                                              ? "bg-primary/10 text-primary border-primary/20"
                                              : "bg-muted text-muted-foreground border-border"
                                          }`}
                                        >
                                          {d.source === "SUBSCRIPTION" ? "Gói đăng ký" : "Đơn lẻ"}
                                        </span>
                                      </td>
                                      <td className="py-3 font-bold">{d.customerName}</td>
                                      <td className="py-3 text-primary font-semibold">
                                        {d.packageName || d.items.map((i: any) => `${i.flavor}×${i.qty}`).join(", ")}
                                      </td>
                                      <td className="py-3 font-mono text-muted-foreground">{formatGrams(d.totalGrams)}</td>
                                      <td className="py-3">
                                        <select
                                          value={d.status}
                                          onChange={(e) => handleUpdateUnifiedStatus(d, e.target.value)}
                                          className="text-[10px] font-bold px-2 py-1 rounded border border-border bg-background cursor-pointer"
                                        >
                                          {DELIVERY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                      </td>
                                      <td className="py-3 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                          {d.status !== "DELIVERED" && d.status !== "CANCELLED" && (
                                            <button
                                              onClick={() => handleMarkDelivered(d)}
                                              title="Xác nhận đã giao"
                                              className="text-[10px] font-bold px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                                            >
                                              Đã giao
                                            </button>
                                          )}
                                          {d.source === "SUBSCRIPTION" && d.status !== "DELIVERED" && d.status !== "CANCELLED" && (
                                            <button
                                              onClick={() => handlePostponeDelivery(d)}
                                              title="Hoãn lần giao này (bảo lưu số lượng)"
                                              className="text-[10px] font-bold px-2 py-1 rounded border border-border hover:bg-muted cursor-pointer"
                                            >
                                              Hoãn
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteDelivery(d)}
                                            className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      )}
                      <PaginationControls
                        page={deliveriesUpcomingPage}
                        totalPages={deliveriesUpcomingTotalPages}
                        totalItems={filteredUpcomingGroups.length}
                        pageSize={CARD_PAGE_SIZE}
                        onChange={setDeliveriesUpcomingPage}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SECTION C: MENU CATALOG MANAGER */}
              {section === "menu" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold font-heading">Menu Items Catalog</h3>
                    <button
                      onClick={() => {
                        resetMenuForm();
                        setMenuModal("create");
                      }}
                      className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add Menu Item
                    </button>
                  </div>

                  {PROTEIN_OPTIONS.filter((p) => menuItems.some((item) => item.protein === p)).map((protein) => {
                    const dishes = groupMenuByFlavor(menuItems.filter((item) => item.protein === protein));
                    const dishesTotalPages = Math.ceil(dishes.length / CARD_PAGE_SIZE) || 1;
                    const dishesPage = clampPage(menuPageByProtein[protein] ?? 1, dishesTotalPages);
                    const pagedDishes = paginate(dishes, dishesPage, CARD_PAGE_SIZE);
                    return (
                      <div key={protein} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                            {PROTEIN_LABELS[protein]}
                          </h4>
                          <span className="text-[10px] font-mono text-muted-foreground">({dishes.length})</span>
                          <div className="flex-1 border-t border-border/60" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          {pagedDishes.map((dish) => {
                            const dishKey = `${dish.protein}::${dish.flavor}`;
                            const selectedId = menuSelectedSizeByDish[dishKey];
                            const item = dish.sizes.find((s: any) => s.id === selectedId) ?? dish.sizes[0];
                            return (
                              <div key={dishKey} className="border border-border bg-card rounded-lg p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                                <div>
                                  <div className="flex justify-between items-start gap-3">
                                    <h4 className="font-semibold font-heading text-sm truncate">{item.flavor}</h4>
                                    <span className="text-xs font-bold text-primary shrink-0 font-mono">{formatVND(item.price)}</span>
                                  </div>

                                  {dish.sizes.length > 1 ? (
                                    <div className="flex gap-1 mt-2">
                                      {dish.sizes.map((size: any) => (
                                        <button
                                          key={size.id}
                                          onClick={() =>
                                            setMenuSelectedSizeByDish((prev) => ({ ...prev, [dishKey]: size.id }))
                                          }
                                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                            item.id === size.id
                                              ? "bg-primary border-primary text-primary-foreground"
                                              : "bg-muted/40 border-border hover:bg-muted"
                                          }`}
                                        >
                                          {size.sizeGrams}g
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mt-1.5">{item.sizeGrams}g</p>
                                  )}
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
                                  )}
                                  <div className="mt-2.5 flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${item.isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                      {item.isAvailable ? "Available" : "Hidden"}
                                    </span>
                                  </div>

                                  {/* Live stock — what's actually prepped and ready right now.
                                      0 means an order for this item needs prep (SCHEDULED). */}
                                  <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5">
                                    <span
                                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                        (item.stockQuantity ?? 0) > 0
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border border-amber-200"
                                      }`}
                                    >
                                      {(item.stockQuantity ?? 0) > 0 ? `${item.stockQuantity} sẵn có` : "Cần chuẩn bị"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleAdjustStock(item.id, -1)}
                                        disabled={adjustingStockId === item.id || (item.stockQuantity ?? 0) <= 0}
                                        className="h-5 w-5 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold disabled:opacity-30 cursor-pointer"
                                      >
                                        −
                                      </button>
                                      <button
                                        onClick={() => handleAdjustStock(item.id, 1)}
                                        disabled={adjustingStockId === item.id}
                                        className="h-5 w-5 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold disabled:opacity-30 cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-border/30 mt-3">
                                  <button
                                    onClick={() => handleEditMenuItemTrigger(item)}
                                    className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Edit2 className="h-3 w-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMenuItem(item.id)}
                                    className="py-1.5 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <PaginationControls
                          page={dishesPage}
                          totalPages={dishesTotalPages}
                          totalItems={dishes.length}
                          pageSize={CARD_PAGE_SIZE}
                          onChange={(p) => setMenuPageByProtein((prev) => ({ ...prev, [protein]: p }))}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SECTION C.5: INVENTORY — two sub-tabs: Monitor (what's
                  currently in stock — no status indicator needed, being
                  listed here already means available) and Add Stock
                  (restocking a dish is what makes it available; see the
                  isAvailable-forcing rule in MenuService). Separate from
                  the Menu Catalog Manager's protein-grouped edit view. */}
              {section === "inventory" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-sm font-bold font-heading">Inventory</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {menuItems.filter((m) => (m.stockQuantity ?? 0) > 0).length} of {menuItems.length} dishes currently in stock
                    </p>
                  </div>

                  <div className="flex gap-2 border-b border-border">
                    <button
                      onClick={() => setInventorySubTab("monitor")}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                        inventorySubTab === "monitor"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Monitor
                    </button>
                    <button
                      onClick={() => setInventorySubTab("add")}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                        inventorySubTab === "add"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Add Stock
                    </button>
                  </div>

                  {inventorySubTab === "monitor" && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <select
                          value={inventorySort}
                          onChange={(e) => setInventorySort(e.target.value as typeof inventorySort)}
                          className="text-[11px] font-bold px-2 py-1.5 rounded border border-border bg-background cursor-pointer"
                        >
                          <option value="stock-desc">Stock: high to low</option>
                          <option value="stock-asc">Stock: low to high</option>
                          <option value="name">Name (A–Z)</option>
                        </select>
                      </div>

                      {menuItems.filter((m) => (m.stockQuantity ?? 0) > 0).length === 0 ? (
                        <div className="border border-border bg-card rounded-2xl p-8 text-center text-xs text-muted-foreground shadow-sm">
                          Nothing in stock right now — use the Add Stock tab to bring dishes online.
                        </div>
                      ) : (
                        PROTEIN_OPTIONS.filter((p) =>
                          menuItems.some((m) => m.protein === p && (m.stockQuantity ?? 0) > 0),
                        ).map((protein) => {
                          const items = menuItems
                            .filter((m) => m.protein === protein && (m.stockQuantity ?? 0) > 0)
                            .sort((a, b) => {
                              if (inventorySort === "name") return a.flavor.localeCompare(b.flavor);
                              const diff = (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0);
                              return inventorySort === "stock-asc" ? diff : -diff;
                            });
                          const itemsTotalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
                          const itemsPage = clampPage(inventoryPageByProtein[protein] ?? 1, itemsTotalPages);
                          const pagedItems = paginate(items, itemsPage, PAGE_SIZE);
                          return (
                            <div key={protein} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                                  {PROTEIN_LABELS[protein]}
                                </h4>
                                <span className="text-[10px] font-mono text-muted-foreground">({items.length})</span>
                                <div className="flex-1 border-t border-border/60" />
                              </div>
                              <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead>
                                      <tr className="text-muted-foreground border-b border-border/50">
                                        <th className="pb-3 font-semibold">Dish</th>
                                        <th className="pb-3 font-semibold">Size</th>
                                        <th className="pb-3 font-semibold">Stock</th>
                                        <th className="pb-3 font-semibold text-right">Adjust</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pagedItems.map((item) => (
                                        <tr key={item.id} className="border-b border-border/20 last:border-0">
                                          <td className="py-3 font-bold">{item.flavor}</td>
                                          <td className="py-3 text-muted-foreground">{item.sizeGrams}g</td>
                                          <td className="py-3 font-mono font-bold">{item.stockQuantity ?? 0}</td>
                                          <td className="py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                onClick={() => handleAdjustStock(item.id, -1)}
                                                disabled={adjustingStockId === item.id || (item.stockQuantity ?? 0) <= 0}
                                                className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold disabled:opacity-30 cursor-pointer"
                                              >
                                                −
                                              </button>
                                              <button
                                                onClick={() => handleAdjustStock(item.id, 1)}
                                                disabled={adjustingStockId === item.id}
                                                className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold disabled:opacity-30 cursor-pointer"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <PaginationControls
                                  page={itemsPage}
                                  totalPages={itemsTotalPages}
                                  totalItems={items.length}
                                  pageSize={PAGE_SIZE}
                                  onChange={(p) => setInventoryPageByProtein((prev) => ({ ...prev, [protein]: p }))}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {inventorySubTab === "add" && (
                    <div className="max-w-md border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Pick a dish and add how many portions just came out of the kitchen. Adding stock makes the
                        dish available to customers right away.
                      </p>
                      <form onSubmit={handleAddStock} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dish</label>
                          <select
                            required
                            value={addStockItemId}
                            onChange={(e) => setAddStockItemId(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                          >
                            <option value="">— Select a dish —</option>
                            {PROTEIN_OPTIONS.map((protein) => {
                              const items = menuItems
                                .filter((m) => m.protein === protein)
                                .sort((a, b) => a.flavor.localeCompare(b.flavor) || a.sizeGrams - b.sizeGrams);
                              if (items.length === 0) return null;
                              return (
                                <optgroup key={protein} label={PROTEIN_LABELS[protein]}>
                                  {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.flavor} ({item.sizeGrams}g) — hiện có {item.stockQuantity ?? 0}
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Quantity to add
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={addStockQty}
                            onChange={(e) => setAddStockQty(Number(e.target.value))}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isAddingStock || !addStockItemId}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {isAddingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          Add to Inventory
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION D: SUBSCRIBER DIRECTORY */}
              {section === "subscriptions" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold font-heading">Subscriptions ({subscriptions.length})</h3>
                    <button
                      onClick={() => { resetSubForm(); setSubModal("create"); }}
                      className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Tạo gói đăng ký
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {paginate(subscriptions, clampPage(subscriptionsPage, Math.ceil(subscriptions.length / CARD_PAGE_SIZE) || 1), CARD_PAGE_SIZE).map((sub) => {
                      const totalRemaining = (sub.pools || []).reduce((s: number, p: any) => s + p.remainingGrams, 0);
                      const totalPurchased = (sub.pools || []).reduce((s: number, p: any) => s + p.totalGrams, 0);
                      const pct = totalPurchased > 0 ? Math.round((totalRemaining / totalPurchased) * 100) : 0;
                      return (
                        <div key={sub.id} className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-sm">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold font-heading truncate">{sub.packageName}</h4>
                              <p className="text-xs text-muted-foreground truncate">{sub.customerName || "Customer"}</p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                                sub.status === "ACTIVE"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : sub.status === "COMPLETED"
                                    ? "bg-primary/10 border-primary/20 text-primary"
                                    : "bg-amber-50 border-amber-200 text-amber-700"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {(sub.pools || []).map((p: any) => {
                              const poolPct = p.totalGrams > 0 ? Math.max(0, Math.min(100, (p.remainingGrams / p.totalGrams) * 100)) : 0;
                              return (
                                <div key={p.id} className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold">{PROTEIN_LABELS[p.protein as Protein] || p.protein}</span>
                                    <span className="font-mono text-muted-foreground">
                                      {formatGrams(p.remainingGrams)} / {formatGrams(p.totalGrams)} còn lại
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${poolPct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                            <div>
                              Giao {formatGrams(sub.deliveryAmountGrams)} / {formatIntervalLabel(sub.deliveryIntervalDays)}
                            </div>
                            <div className="text-right font-bold text-primary">{formatVND(sub.totalPrice)}</div>
                            <div>Thanh toán: {sub.paymentStatus}</div>
                            <div className="text-right">
                              {sub.postponedCount > 0 ? `Đã hoãn ${sub.postponedCount} lần` : `${pct}% còn lại`}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                            <button
                              onClick={() => handleOpenSubDetail(sub.id)}
                              className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-md cursor-pointer"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => setTopUpModal({ subId: sub.id, protein: sub.pools?.[0]?.protein || "CHICKEN", grams: 5000 })}
                              className="flex-1 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-[10px] font-bold rounded-md cursor-pointer"
                            >
                              Mua thêm
                            </button>
                            <button
                              onClick={() => handleUpdateSubStatus(sub.id, sub.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
                              className="py-1.5 px-3 border border-border bg-background hover:bg-muted text-[10px] font-bold rounded-md cursor-pointer"
                            >
                              {sub.status === "ACTIVE" ? "Tạm dừng" : "Tiếp tục"}
                            </button>
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              className="py-1.5 px-2 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {subscriptions.length === 0 && (
                      <div className="lg:col-span-2 border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                        Chưa có gói đăng ký nào
                      </div>
                    )}
                  </div>
                  <PaginationControls
                    page={subscriptionsPage}
                    totalPages={Math.ceil(subscriptions.length / CARD_PAGE_SIZE) || 1}
                    totalItems={subscriptions.length}
                    pageSize={CARD_PAGE_SIZE}
                    onChange={setSubscriptionsPage}
                  />
                </div>
              )}

              {/* SECTION: PREP LIST */}
              {section === "prep-list" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-primary" />
                        Prep List
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Tổng hợp nguyên liệu cần chuẩn bị</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground font-semibold">Ngày:</label>
                      <input
                        type="date"
                        value={prepDate}
                        onChange={(e) => setPrepDate(e.target.value)}
                        className="bg-background border border-border focus:border-primary text-xs py-2 px-3 rounded-md outline-none"
                      />
                    </div>
                  </div>

                  {prepError && (
                    <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-xs font-medium">
                      {prepError}
                    </div>
                  )}

                  {isPrepLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Đang tổng hợp...</span>
                    </div>
                  ) : prepData.prepItems.length === 0 ? (
                    <div className="border border-dashed border-border rounded-lg py-20 text-center">
                      <ChefHat className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">Không có gì cần chuẩn bị</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ngày {prepDate} không có đơn hàng hoặc giao hàng nào
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-border bg-card rounded-lg p-5">
                          <div className="text-3xl font-bold font-heading text-primary">{prepData.totalPortions}</div>
                          <div className="text-xs text-muted-foreground mt-1">Tổng phần</div>
                        </div>
                        <div className="border border-border bg-card rounded-lg p-5">
                          <div className="text-3xl font-bold font-heading text-primary">
                            {(prepData.totalGrams / 1000).toFixed(1)} kg
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Tổng khối lượng</div>
                        </div>
                      </div>

                      <div className="border border-border bg-card rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-muted/50 border-b border-border">
                                <th className="px-4 py-3 font-semibold font-mono uppercase tracking-wide text-muted-foreground">Món</th>
                                <th className="px-4 py-3 font-semibold font-mono uppercase tracking-wide text-muted-foreground text-center">Phần</th>
                                <th className="px-4 py-3 font-semibold font-mono uppercase tracking-wide text-muted-foreground text-right">Tổng gram</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prepData.prepItems.map((item, i) => (
                                <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-primary/5 transition-colors">
                                  <td className="px-4 py-3 font-semibold">
                                    <span
                                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                        item.protein === "CHICKEN"
                                          ? "bg-amber-400"
                                          : item.protein === "BEEF"
                                            ? "bg-red-400"
                                            : "bg-pink-400"
                                      }`}
                                    />
                                    {PROTEIN_LABELS[item.protein] || item.protein} {item.flavor}
                                    <span className="text-muted-foreground ml-1">({item.sizeGrams}g)</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md font-bold font-mono">
                                      {item.portions}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold font-mono">
                                    {item.totalGrams.toLocaleString()}g
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-primary/30 bg-primary/5">
                                <td className="px-4 py-3 font-bold">Tổng cộng</td>
                                <td className="px-4 py-3 text-center font-bold font-mono">{prepData.totalPortions}</td>
                                <td className="px-4 py-3 text-right font-bold font-mono">
                                  {prepData.totalGrams.toLocaleString()}g
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SECTION E: PROMOTIONAL CODES */}
              {section === "discounts" && (
                <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
                  {/* Create Discount code form */}
                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm h-fit">
                    <h3 className="text-sm font-bold font-heading mb-4">Generate Promo Code</h3>
                    <form onSubmit={handleCreateDiscount} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Promo Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. FORTIFY20"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Code Type</label>
                          <select
                            value={discountType}
                            onChange={(e: any) => setDiscountType(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                          >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (VND)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Discount Amount</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(Number(e.target.value))}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</label>
                          <input
                            type="datetime-local"
                            required
                            value={discountStarts.substring(0, 16)}
                            onChange={(e) => setDiscountStarts(new Date(e.target.value).toISOString())}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">End Date</label>
                          <input
                            type="datetime-local"
                            required
                            value={discountEnds.substring(0, 16)}
                            onChange={(e) => setDiscountEnds(new Date(e.target.value).toISOString())}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer"
                      >
                        Generate Code
                      </button>
                    </form>
                  </div>

                  {/* List discount codes */}
                  <div className="lg:col-span-2 border border-border bg-card rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold font-heading mb-4">Active Promo Codes catalog</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/50 pb-2">
                            <th className="pb-3 font-semibold">Code</th>
                            <th className="pb-3 font-semibold">Type</th>
                            <th className="pb-3 font-semibold">Value</th>
                            <th className="pb-3 font-semibold">Valid Period</th>
                            <th className="pb-3 font-semibold text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginate(discounts, clampPage(discountsPage, Math.ceil(discounts.length / PAGE_SIZE) || 1), PAGE_SIZE).map((d) => (
                            <tr key={d.id} className="border-b border-border/20 last:border-0">
                              <td className="py-3.5 font-bold tracking-wider">{d.code}</td>
                              <td className="py-3.5 text-muted-foreground">{d.type}</td>
                              <td className="py-3.5 font-bold text-primary">
                                {d.type === "PERCENTAGE" ? `${d.amount} %` : formatVND(d.amount)}
                              </td>
                              <td className="py-3.5 text-muted-foreground">
                                {new Date(d.startsAt).toLocaleDateString("vi-VN")} - {new Date(d.endsAt).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="py-3.5 text-center">
                                <button
                                  onClick={() => handleDeleteDiscount(d.id)}
                                  className="text-red-500 hover:text-red-600 p-1.5 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      page={discountsPage}
                      totalPages={Math.ceil(discounts.length / PAGE_SIZE) || 1}
                      totalItems={discounts.length}
                      pageSize={PAGE_SIZE}
                      onChange={setDiscountsPage}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 3. MENU CREATE/EDIT DIALOG MODAL */}
      {menuModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setMenuModal(null)} />
          <div className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading">
                {menuModal === "create" ? "Add New Dish to Menu" : "Edit Menu Dish Details"}
              </h3>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Protein</label>
                  <select
                    value={menuItemProtein}
                    onChange={(e) => setMenuItemProtein(e.target.value as Protein)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {PROTEIN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {PROTEIN_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Size (grams)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={menuItemSizeGrams}
                    onChange={(e) => setMenuItemSizeGrams(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Flavor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. xá xíu"
                  value={menuItemFlavor}
                  onChange={(e) => setMenuItemFlavor(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price (VND)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={menuItemPrice}
                    onChange={(e) => setMenuItemPrice(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category (optional)</label>
                  <select
                    value={menuItemCatId}
                    onChange={(e) => setMenuItemCatId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
                  value={menuItemImage}
                  onChange={(e) => setMenuItemImage(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Stock on hand (portions ready right now)
                </label>
                <input
                  type="number"
                  min={0}
                  value={menuItemStock}
                  onChange={(e) => setMenuItemStock(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  0 means orders for this dish need prep first. Use the +/− on the catalog card for quick day-to-day adjustments.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="avail"
                  checked={menuItemAvailable}
                  onChange={(e) => setMenuItemAvailable(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="avail" className="text-xs font-semibold text-muted-foreground select-none">
                  Available in Catalog (Active)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMenuModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER CREATE/EDIT DIALOG MODAL */}
      {customerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCustomerModal(null)} />
          <div className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading">
                {customerModal === "create" ? "Thêm khách hàng" : "Sửa thông tin khách hàng"}
              </h3>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên khách hàng</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SĐT</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Zalo</label>
                  <input
                    type="text"
                    value={customerZalo}
                    onChange={(e) => setCustomerZalo(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Địa chỉ</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ghi chú</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomerModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER CREATE/EDIT DIALOG MODAL */}
      {/* Read-only order detail — opened by clicking anywhere on an Orders
          row (see the onClick on <tr> above), so seeing the full order no
          longer requires the small Edit icon. */}
      {orderDetailView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setOrderDetailView(null)} />
          <div className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-5 my-8">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-lg font-bold font-heading">{orderDetailView.customerName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Giao {new Date(orderDetailView.deliveryDate).toLocaleDateString("vi-VN")}
                  {orderDetailView.createdAt && (
                    <> · Đặt lúc {new Date(orderDetailView.createdAt).toLocaleString("vi-VN")}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => setOrderDetailView(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                  orderDetailView.fulfillmentType === "IMMEDIATE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {orderDetailView.fulfillmentType === "IMMEDIATE" ? "Ready Now" : "Needs Prep"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                  orderDetailView.deliveryStatus === "PREPPING"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : orderDetailView.deliveryStatus === "DELIVERED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : orderDetailView.deliveryStatus === "CANCELLED"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : orderDetailView.deliveryStatus === "SKIPPED"
                          ? "bg-muted text-muted-foreground border-border"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {ORDER_STATUS_LABELS[orderDetailView.deliveryStatus] || orderDetailView.deliveryStatus}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-muted text-muted-foreground whitespace-nowrap">
                {orderDetailView.paymentStatus}
              </span>
            </div>

            <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Địa chỉ giao hàng:</span>
                <span className="font-semibold text-right max-w-[250px]">{orderDetailView.deliveryAddress || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Phương thức thanh toán:</span>
                <span className="font-semibold">{orderDetailView.paymentMethod === "BANK_TRANSFER" ? "VietQR Chuyển khoản" : "Ship COD (Tiền mặt)"}</span>
              </div>
            </div>

            <div className="border border-border rounded-lg divide-y divide-border/50">
              {(orderDetailView.items || []).map((i: any) => (
                <div key={i.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div>
                    <span className="font-bold">{i.flavor}</span>
                    <span className="text-muted-foreground"> · {i.sizeGrams}g × {i.qty}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{formatVND(i.unitPrice * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-mono">{formatVND(orderDetailView.subtotal)}</span>
              </div>
              {orderDetailView.discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Giảm giá</span>
                  <span className="font-mono">−{formatVND(orderDetailView.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-border/50">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVND(orderDetailView.total)}</span>
              </div>
            </div>

            {orderDetailView.notes && (
              <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">
                &quot;{orderDetailView.notes}&quot;
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOrderDetailView(null)}
                className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleEditOrderTrigger(orderDetailView);
                  setOrderDetailView(null);
                }}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" /> Sửa đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {orderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setOrderModal(null)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8">
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading">
                {orderModal === "create" ? "Tạo đơn hàng" : "Sửa đơn hàng"}
              </h3>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Khách hàng</label>
                  <select
                    required
                    value={orderCustomerId}
                    onChange={(e) => setOrderCustomerId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    <option value="">Chọn khách hàng</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày giao</label>
                  <input
                    type="date"
                    required
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trạng thái thanh toán</label>
                <select
                  value={orderPaymentStatus}
                  onChange={(e) => setOrderPaymentStatus(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                >
                  {PAYMENT_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="border border-border rounded-xl p-4 space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Món ăn</label>
                <div className="flex gap-2">
                  <select
                    value={orderSelectedMenuItemId}
                    onChange={(e) => setOrderSelectedMenuItemId(e.target.value)}
                    className="flex-1 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    <option value="">Chọn món</option>
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>{getMenuItemLabel(m)} — {formatVND(m.price)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={orderAddQty}
                    onChange={(e) => setOrderAddQty(Number(e.target.value))}
                    className="w-20 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={addOrderLineItem}
                    className="bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold px-4 rounded-lg border border-border cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>

                {orderLineItems.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {orderLineItems.map((l, idx) => (
                      <div key={idx} className="flex justify-between text-xs items-center">
                        <span>{PROTEIN_LABELS[l.protein as Protein] || l.protein} {l.flavor} ({l.sizeGrams}g) × {l.qty}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatVND(l.unitPrice * l.qty)}</span>
                          <button
                            type="button"
                            onClick={() => setOrderLineItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {orderPricing && (
                  <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tạm tính</span>
                      <span>{formatVND(orderPricing.lineSubtotal)}</span>
                    </div>
                    {orderPricing.orderDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Giảm giá</span>
                        <span>-{formatVND(orderPricing.orderDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-primary text-sm pt-1">
                      <span>Tổng cộng</span>
                      <span>{formatVND(orderPricing.finalTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Lưu đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION CREATE DIALOG MODAL */}
      {subModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSubModal(null)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8">
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading">Tạo gói đăng ký</h3>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Khách hàng</label>
                  <select
                    required
                    value={subCustomerId}
                    onChange={(e) => setSubCustomerId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    <option value="">Chọn khách hàng</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên gói</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gói tăng cơ 30 ngày"
                    value={subPackageName}
                    onChange={(e) => setSubPackageName(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="border border-border rounded-xl p-4 space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Mua theo số phần ăn (portion)
                </label>
                <div className="flex gap-2">
                  <select
                    value={subPoolProtein}
                    onChange={(e) => {
                      const protein = e.target.value as Protein;
                      setSubPoolProtein(protein);
                      const sizes = Array.from(
                        new Set(
                          menuItems
                            .filter((m) => m.isAvailable && m.protein === protein)
                            .map((m) => m.sizeGrams as number),
                        ),
                      ).sort((a, b) => a - b);
                      if (sizes.length > 0 && !sizes.includes(subPoolSizeGrams)) {
                        setSubPoolSizeGrams(sizes[0]);
                      }
                    }}
                    className="flex-1 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {PROTEIN_OPTIONS.map((p) => (
                      <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>
                    ))}
                  </select>
                  <select
                    value={subPoolSizeGrams}
                    onChange={(e) => setSubPoolSizeGrams(Number(e.target.value))}
                    className="w-28 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {subPoolAvailableSizes.length === 0 && <option value={subPoolSizeGrams}>{subPoolSizeGrams}g</option>}
                    {subPoolAvailableSizes.map((sz) => (
                      <option key={sz} value={sz}>{sz}g</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={subPoolQty}
                    onChange={(e) => setSubPoolQty(Number(e.target.value))}
                    placeholder="Số phần"
                    className="w-20 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSubPool}
                    className="bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold px-4 rounded-lg border border-border cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
                {subPoolAvailableSizes.length === 0 && (
                  <p className="text-[11px] text-red-500">
                    Chưa có món khả dụng cho {PROTEIN_LABELS[subPoolProtein]} — vui lòng thêm món trong Thực đơn trước.
                  </p>
                )}

                {subPools.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {subPools.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs items-center">
                        <span>{PROTEIN_LABELS[p.protein]} — {p.qty} phần x {p.sizeGrams}g</span>
                        <button
                          type="button"
                          onClick={() => setSubPools((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {subPricing && subPricing.missingCombos.length > 0 && (
                  <p className="text-[11px] text-red-500">
                    Chưa có món khả dụng cho: {subPricing.missingCombos.join(", ")}
                  </p>
                )}
                {subPricing && subPricing.missingCombos.length === 0 && subPools.length > 0 && (
                  <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tạm tính ({(subTotalGrams / 1000).toFixed(1)}kg)</span>
                      <span>{formatVND(subPricing.lineSubtotal)}</span>
                    </div>
                    {subPricing.orderDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Giảm giá trọn gói</span>
                        <span>-{formatVND(subPricing.orderDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-primary text-sm pt-1">
                      <span>Tổng giá gói</span>
                      <span>{formatVND(subPricing.finalTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mỗi lần giao</label>
                  <select
                    value={subDeliveryAmountGrams}
                    onChange={(e) => setSubDeliveryAmountGrams(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {DELIVERY_AMOUNT_PRESETS_GRAMS.map((g) => (
                      <option key={g} value={g}>{formatGrams(g)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tần suất giao</label>
                  <select
                    value={subDeliveryIntervalDays}
                    onChange={(e) => setSubDeliveryIntervalDays(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {DELIVERY_FREQUENCY_PRESETS.map((p) => (
                      <option key={p.days} value={p.days}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={subStartDate}
                    onChange={(e) => setSubStartDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              {subSchedulePreview.length > 0 && (
                <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  Lịch giao dự kiến: <span className="font-bold text-foreground">{subSchedulePreview.length}</span> lần giao,
                  mỗi {formatIntervalLabel(subDeliveryIntervalDays)} — kết thúc khoảng{" "}
                  <span className="font-bold text-foreground">
                    {new Date(subSchedulePreview[subSchedulePreview.length - 1].date).toLocaleDateString("vi-VN")}
                  </span>
                  . Chỉ 7 ngày đầu được tạo lịch giao ngay, phần còn lại tự động bổ sung dần.
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trạng thái thanh toán</label>
                <select
                  value={subPaymentStatus}
                  onChange={(e) => setSubPaymentStatus(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                >
                  {PAYMENT_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Tạo gói đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION DETAIL MODAL — delivery history for one subscription */}
      {subDetailId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSubDetailId(null)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading">Lịch sử giao hàng</h3>
              <button onClick={() => setSubDetailId(null)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                Đóng
              </button>
            </div>
            {isSubDetailLoading ? (
              <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
            ) : subDetailDeliveries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Chưa có lần giao nào được tạo</p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {subDetailDeliveries.map((d: any) => (
                  <div key={d.id} className="border border-border rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{new Date(d.scheduledDate).toLocaleDateString("vi-VN")}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-muted">{d.status}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {d.items.map((i: any) => `${PROTEIN_LABELS[i.protein as Protein] || i.protein} ${i.flavor} (${i.sizeGrams}g) ×${i.qty}`).join(", ")}
                    </div>
                    {d.notes && <div className="text-[10px] text-muted-foreground whitespace-pre-line">{d.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP-UP POOL MODAL */}
      {topUpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setTopUpModal(null)} />
          <div className="relative w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-sm font-bold font-heading">Mua thêm khối lượng</h3>
            <form onSubmit={handleTopUpPool} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Protein</label>
                <select
                  value={topUpModal.protein}
                  onChange={(e) => setTopUpModal({ ...topUpModal, protein: e.target.value as Protein })}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                >
                  {PROTEIN_OPTIONS.map((p) => (
                    <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thêm bao nhiêu kg</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={topUpModal.grams / 1000}
                  onChange={(e) => setTopUpModal({ ...topUpModal, grams: Number(e.target.value) * 1000 })}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTopUpModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer border border-border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY & OPERATING TERMS MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowPrivacyModal(false)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8 overflow-hidden max-h-[85vh] flex flex-col text-left">
            <div className="text-center pb-2 border-b border-border">
              <h3 className="text-lg font-bold font-heading">Chính sách Bảo mật & Điều khoản Sử dụng (Vận hành)</h3>
            </div>
            <div className="overflow-y-auto pr-2 space-y-4 text-xs text-muted-foreground leading-relaxed flex-1">
              <h4 className="font-bold text-foreground text-sm">1. Quy định chung đối với Nhân viên & Quản trị viên</h4>
              <p>
                Hệ thống admin-dashboard của Fortify Kitchen là công cụ nội bộ phục vụ mục đích vận hành, điều phối giao hàng và đối soát thanh toán. Tất cả người dùng có tài khoản quản trị (ADMIN, MANAGER, STAFF) phải tuân thủ nghiêm ngặt các quy định bảo mật này.
              </p>
              <h4 className="font-bold text-foreground text-sm">2. Quản lý thông tin khách hàng</h4>
              <p>
                Nhân viên tuyệt đối không được tự ý chia sẻ, xuất dữ liệu thông tin cá nhân khách hàng (số điện thoại, địa chỉ, đơn hàng) ra bên ngoài hệ thống khi chưa có sự đồng ý của quản lý cấp cao hoặc yêu cầu pháp lý từ cơ quan chức năng.
              </p>
              <h4 className="font-bold text-foreground text-sm">3. Kiểm tra và xác nhận thanh toán</h4>
              <p>
                Đối với các đơn hàng sử dụng VietQR chuyển khoản (BANK_TRANSFER), nhân viên có trách nhiệm đối soát thông tin giao dịch trên hệ thống ngân hàng liên kết trước khi thực hiện chuyển đổi trạng thái thanh toán sang &quot;PAID&quot;.
              </p>
              <h4 className="font-bold text-foreground text-sm">4. Cam kết bảo mật hệ thống</h4>
              <p>
                Tài khoản đăng nhập hệ thống quản trị là tài khoản cá nhân, tuyệt đối không chia sẻ mật khẩu hoặc dùng chung tài khoản với nhân viên khác để đảm bảo truy vết lịch sử vận hành chính xác.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 mt-4 shrink-0"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* In-app confirm dialog — replaces window.confirm() everywhere in
          this console (see requestConfirm above). */}
      {confirmState && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setConfirmState(null)} />
          <div className="relative w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-sm font-bold font-heading">{confirmState.title || "Xác nhận"}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{confirmState.message}</p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer border border-border"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmState.onConfirm;
                  setConfirmState(null);
                  action();
                }}
                className={`flex-1 text-xs font-bold py-2.5 rounded-xl cursor-pointer ${
                  confirmState.variant === "destructive"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-primary hover:bg-primary/95 text-primary-foreground"
                }`}
              >
                {confirmState.confirmLabel || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
