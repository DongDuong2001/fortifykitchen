"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faShoppingBag,
  faUsers,
  faSignOutAlt,
  faUtensils,
  faPlus,
  faTrashAlt,
  faEdit,
  faDollarSign,
  faCalendarAlt,
  faTag,
  faSpinner,
  faTruck,
  faChevronLeft,
  faChevronRight,
  faBox,
  faInfoCircle,
  faWallet,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
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
  ORDER_STATUS_LABELS,
} from "@fortifykitchen/shared";
import type { Protein, CustomPlanRequestStatus, OrderStatus } from "@fortifykitchen/types";
import { useToast } from "@fortifykitchen/ui";

const PROTEIN_OPTIONS: Protein[] = ["CHICKEN", "BEEF", "SHRIMP"];
const PAYMENT_STATE_OPTIONS = ["UNPAID", "DEPOSIT", "PAID"] as const;
// Unified Shopee-style order status — shared by one-off orders and
// subscription-generated orders alike (see OrderStatus in
// @fortifykitchen/types). ORDER_STATUS_LABELS (imported above from
// packages/shared) has the Vietnamese display strings for each.
const ORDER_STATUS_OPTIONS = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;
// Badge color per status — used everywhere an order/subscription-order row
// renders its current status (Orders tab, Orders from Subscriptions,
// dashboard recent orders, order detail modal).
const ORDER_STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

// Custom Plan Request lifecycle — customer submits (PENDING), staff
// consults and either annotates it (REVIEWED), links it to a real
// Subscription (MATCHED — set automatically when a Subscription is created
// with this request's id), or turns it down (DECLINED).
const CUSTOM_PLAN_REQUEST_STATUS_OPTIONS: CustomPlanRequestStatus[] = ["PENDING", "REVIEWED", "MATCHED", "DECLINED"];
const CUSTOM_PLAN_REQUEST_STATUS_LABELS: Record<CustomPlanRequestStatus, string> = {
  PENDING: "Chờ tư vấn",
  REVIEWED: "Đã xem xét",
  MATCHED: "Đã ghép gói",
  DECLINED: "Từ chối",
};
const CUSTOM_PLAN_REQUEST_STATUS_BADGE_CLASS: Record<CustomPlanRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REVIEWED: "bg-blue-50 text-blue-700 border-blue-200",
  MATCHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
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
      <span className="text-[11px] text-muted-foreground ">
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
        <span className="text-[11px]  text-muted-foreground px-1.5">
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
    | "custom-plan-requests"
    | "customers"
    | "discounts"
    | "subscription-plans"
    | "prep-list"
    | "home-frames"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Grouped Navigation Tabs State
  const [activeGroup, setActiveGroup] = React.useState<
    "operations" | "sales" | "products" | "subscriptions" | "marketing"
  >("operations");

  const NAVIGATION_GROUPS = React.useMemo(() => [
    { id: "operations", label: "Operations", icon: faThLarge, defaultSection: "dashboard" },
    { id: "sales", label: "Sales & Customers", icon: faShoppingBag, defaultSection: "orders" },
    { id: "products", label: "Catalog & Stock", icon: faUtensils, defaultSection: "menu" },
    { id: "subscriptions", label: "Membership Subs", icon: faCalendarAlt, defaultSection: "subscriptions" },
    { id: "marketing", label: "Marketing & Ads", icon: faTag, defaultSection: "discounts" },
  ], []);

  const SUB_TABS = React.useMemo(() => ({
    operations: [
      { id: "dashboard", label: "Dashboard Overview" },
      { id: "prep-list", label: "Prep List" },
    ],
    sales: [
      { id: "orders", label: "Orders dispatcher" },
      { id: "customers", label: "Customers" },
    ],
    products: [
      { id: "menu", label: "Menu Catalog Manager" },
      { id: "inventory", label: "Inventory" },
    ],
    subscriptions: [
      { id: "subscriptions", label: "Subscriptions" },
      { id: "custom-plan-requests", label: "Custom Plan Requests" },
      { id: "subscription-plans", label: "Subscription Plans" },
    ],
    marketing: [
      { id: "discounts", label: "Promotional Codes" },
      { id: "home-frames", label: "Home Banners" },
    ],
  }), []);

  React.useEffect(() => {
    // Automatically switch activeGroup if section is changed via internal redirection
    for (const group of NAVIGATION_GROUPS) {
      const match = SUB_TABS[group.id as keyof typeof SUB_TABS].find((tab) => tab.id === section);
      if (match) {
        setActiveGroup(group.id as any);
        break;
      }
    }
  }, [section, NAVIGATION_GROUPS, SUB_TABS]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

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
  const [orders, setOrders] = React.useState<any[]>([]); // every Order row — both source: ONE_OFF and source: SUBSCRIPTION
  const [menuItems, setMenuItems] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<any[]>([]);
  const [customPlanRequests, setCustomPlanRequests] = React.useState<any[]>([]);
  // Draft admin-notes text per Custom Plan Request row, keyed by id — lets
  // staff type a note without saving on every keystroke; "Lưu" commits it.
  const [cprNoteDrafts, setCprNoteDrafts] = React.useState<Record<string, string>>({});
  const [cprStatusFilter, setCprStatusFilter] = React.useState<"ALL" | CustomPlanRequestStatus>("ALL");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [discounts, setDiscounts] = React.useState<any[]>([]);
  // --- Subscription Plans (wallet top-up catalog) + pending top-ups queue ---
  const [subscriptionPlans, setSubscriptionPlans] = React.useState<any[]>([]);
  const [pendingTopUps, setPendingTopUps] = React.useState<any[]>([]);
  // Row id currently mid-flight on Confirm/Reject, so a double-click can't
  // double-fire the request while it's in progress.
  const [processingTopUpId, setProcessingTopUpId] = React.useState<string | null>(null);
  // Staff-wide low-balance summary (wallet + subscription pool) shown as a
  // Dashboard alert widget — same shape as the inventory alerts above it.
  const [lowBalance, setLowBalance] = React.useState<any>({ poolsLow: [], walletsLow: [], totalCount: 0 });
  // --- Home Frames State ---
  const [homeFrames, setHomeFrames] = React.useState<any[]>([]);
  const [homeFramesPage, setHomeFramesPage] = React.useState(1);
  const [homeFrameModal, setHomeFrameModal] = React.useState<"create" | "edit" | null>(null);
  const [editingHomeFrameId, setEditingHomeFrameId] = React.useState<string | null>(null);
  const [homeFrameTitle, setHomeFrameTitle] = React.useState("");
  const [homeFrameImageUrl, setHomeFrameImageUrl] = React.useState("");
  const [homeFrameLinkUrl, setHomeFrameLinkUrl] = React.useState("");
  const [homeFrameOrder, setHomeFrameOrder] = React.useState(0);
  const [homeFrameIsActive, setHomeFrameIsActive] = React.useState(true);
  const [isSavingHomeFrame, setIsSavingHomeFrame] = React.useState(false);
  const [homeFrameImagePreview, setHomeFrameImagePreview] = React.useState<string>("");
  const [isHomeFrameUploading, setIsHomeFrameUploading] = React.useState(false);

  // --- Pagination state — one page counter per list view. Every list here
  // is small-ish and already loaded in full for client-side tab/search
  // filtering, so pagination is a display-only slice (see paginate()) that
  // clamps back to a valid page whenever a filter shrinks the result set.
  const [ordersPage, setOrdersPage] = React.useState(1);
  const [subOrdersPage, setSubOrdersPage] = React.useState(1);
  const [customersPage, setCustomersPage] = React.useState(1);
  const [subscriptionsPage, setSubscriptionsPage] = React.useState(1);
  const [customPlanRequestsPage, setCustomPlanRequestsPage] = React.useState(1);
  const [discountsPage, setDiscountsPage] = React.useState(1);
  const [subscriptionPlansPage, setSubscriptionPlansPage] = React.useState(1);
  const [pendingTopUpsPage, setPendingTopUpsPage] = React.useState(1);
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
  // "Current" holds everything still in flight (PENDING_CONFIRMATION through
  // OUT_FOR_DELIVERY); moving an order to COMPLETED drops it out of Current
  // and into the Completed tab. Cancelled orders get their own tab too so
  // they don't linger in either working view.
  const [orderViewTab, setOrderViewTab] = React.useState<"current" | "completed" | "cancelled">("current");
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<"ALL" | (typeof ORDER_STATUS_OPTIONS)[number]>("ALL");
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
  const [subOrderStatusFilter, setSubOrderStatusFilter] = React.useState<"ALL" | (typeof ORDER_STATUS_OPTIONS)[number]>("ALL");
  const [subOrderSearch, setSubOrderSearch] = React.useState("");
  const [subOrderDateFilter, setSubOrderDateFilter] = React.useState(getLocalDateString());
  const [subOrderDateMode, setSubOrderDateMode] = React.useState<"date" | "upcoming">("date");

  // Jump back to page 1 whenever a filter/tab/search change would otherwise
  // leave the paginated table showing a stale, filter-mismatched page.
  React.useEffect(() => {
    setOrdersPage(1);
  }, [orderViewTab, orderStatusFilter, orderFulfillmentFilter, orderSearch, orderDateFilter, orderDateMode]);

  React.useEffect(() => {
    setSubOrdersPage(1);
  }, [subOrderViewTab, subOrderStatusFilter, subOrderSearch, subOrderDateFilter, subOrderDateMode]);

  React.useEffect(() => {
    setCustomPlanRequestsPage(1);
  }, [cprStatusFilter]);

  // --- Subscription form state (volume-based: one or more protein pools +
  // a delivery cadence — flavor is chosen per-delivery, not at purchase) ---
  const [subModal, setSubModal] = React.useState<"create" | null>(null);
  // Set when the create-subscription form was opened from a specific
  // CustomPlanRequest ("Tạo gói từ yêu cầu này") — included in the create
  // payload so the backend marks that request MATCHED and links it to the
  // new Subscription. Left null for an ordinary from-scratch subscription.
  const [subLinkedCustomPlanRequestId, setSubLinkedCustomPlanRequestId] = React.useState<string | null>(null);
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
  const [menuItemImagePreview, setMenuItemImagePreview] = React.useState("");
  const [menuItemUploading, setMenuItemUploading] = React.useState(false);
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

  // --- Subscription Plan (wallet top-up tier) form state — one form does
  // double duty for create and edit, same as the Promotional Codes form,
  // distinguished by editingSubPlanId being set or null. ---
  const [editingSubPlanId, setEditingSubPlanId] = React.useState<string | null>(null);
  const [subPlanName, setSubPlanName] = React.useState("");
  const [subPlanPrice, setSubPlanPrice] = React.useState(1500000);
  const [subPlanVoucherPercent, setSubPlanVoucherPercent] = React.useState(5);
  const [subPlanDescription, setSubPlanDescription] = React.useState("");
  const [subPlanIsActive, setSubPlanIsActive] = React.useState(true);
  const [isSavingSubPlan, setIsSavingSubPlan] = React.useState(false);

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
    (responses: ({ status: number } | null)[]) => {
      if (responses.some((r) => r && r.status === 401)) {
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
        const [resStats, resMenu, resLowBalance] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`, { headers }).catch(() => null),
          fetch(`${API_URL}/menu/admin`, { headers }).catch(() => null),
          fetch(`${API_URL}/notifications/low-balance`, { headers }).catch(() => null),
        ]);
        if (handleUnauthorized([resStats, resMenu, resLowBalance])) return;
        if (resStats && resStats.ok) {
          const result = await resStats.json();
          setStats(result.data);
        }
        if (resMenu && resMenu.ok) setMenuItems((await resMenu.json()).data || []);
        if (resLowBalance && resLowBalance.ok) {
          const result = await resLowBalance.json();
          setLowBalance(result.data || { poolsLow: [], walletsLow: [], totalCount: 0 });
        }
      } else if (section === "orders") {
        // `orders` now covers every Order row regardless of source
        // (ONE_OFF or SUBSCRIPTION, per the unified Shopee-style model) —
        // no separate deliveries endpoint needed anymore. Pull the rolling
        // upcoming window forward first so newly-due subscription
        // occurrences show up without waiting on an external cron.
        await fetch(`${API_URL}/subscriptions/sync-orders`, { method: "POST", headers }).catch(() => null);
        const [resOrders, resCustomers, resMenu] = await Promise.all([
          fetch(`${API_URL}/orders`, { headers }).catch(() => null),
          fetch(`${API_URL}/customers`, { headers }).catch(() => null),
          fetch(`${API_URL}/menu/admin`, { headers }).catch(() => null),
        ]);
        if (handleUnauthorized([resOrders, resCustomers, resMenu])) return;
        if (resOrders && resOrders.ok) setOrders((await resOrders.json()).data || []);
        if (resCustomers && resCustomers.ok) setCustomers((await resCustomers.json()).data || []);
        if (resMenu && resMenu.ok) {
          const menuData = (await resMenu.json()).data || [];
          setMenuItems(menuData);
          if (menuData.length > 0) setOrderSelectedMenuItemId((prev) => prev || menuData[0].id);
        }
      } else if (section === "customers") {
        const res = await fetch(`${API_URL}/customers`, { headers }).catch(() => null);
        if (handleUnauthorized([res])) return;
        if (res && res.ok) {
          const result = await res.json();
          setCustomers(result.data || []);
        }
      } else if (section === "custom-plan-requests") {
        const res = await fetch(`${API_URL}/custom-plan-requests`, { headers }).catch(() => null);
        if (handleUnauthorized([res])) return;
        if (res && res.ok) setCustomPlanRequests((await res.json()).data || []);
      } else if (section === "menu") {
        const [resMenu, resCat] = await Promise.all([
          fetch(`${API_URL}/menu/admin`, { headers }).catch(() => null),
          fetch(`${API_URL}/categories`).catch(() => null),
        ]);
        if (handleUnauthorized([resMenu])) return;
        if (resMenu && resCat && resMenu.ok && resCat.ok) {
          const menuData = await resMenu.json();
          const catData = await resCat.json();
          setMenuItems(menuData.data || []);
          setCategories(catData.data || []);
          if (catData.data?.length > 0) {
            setMenuItemCatId(catData.data[0].id);
          }
        }
      } else if (section === "inventory") {
        const res = await fetch(`${API_URL}/menu/admin`, { headers }).catch(() => null);
        if (handleUnauthorized([res])) return;
        if (res && res.ok) setMenuItems((await res.json()).data || []);
      } else if (section === "subscriptions") {
        const [resSubs, resCustomers, resMenu] = await Promise.all([
          fetch(`${API_URL}/subscriptions`, { headers }).catch(() => null),
          fetch(`${API_URL}/customers`, { headers }).catch(() => null),
          fetch(`${API_URL}/menu/admin`, { headers }).catch(() => null),
        ]);
        if (handleUnauthorized([resSubs, resCustomers, resMenu])) return;
        if (resSubs && resSubs.ok) setSubscriptions((await resSubs.json()).data || []);
        if (resCustomers && resCustomers.ok) setCustomers((await resCustomers.json()).data || []);
        if (resMenu && resMenu.ok) {
          const menuData = (await resMenu.json()).data || [];
          setMenuItems(menuData);
        }
      } else if (section === "discounts") {
        const res = await fetch(`${API_URL}/discounts`, { headers }).catch(() => null);
        if (handleUnauthorized([res])) return;
        if (res && res.ok) {
          const result = await res.json();
          setDiscounts(result.data || []);
        }
      } else if (section === "subscription-plans") {
        const [resPlans, resPending] = await Promise.all([
          fetch(`${API_URL}/subscription-plans`, { headers }).catch(() => null),
          fetch(`${API_URL}/subscription-plan-purchases/pending`, { headers }).catch(() => null),
        ]);
        if (handleUnauthorized([resPlans, resPending])) return;
        if (resPlans && resPlans.ok) setSubscriptionPlans((await resPlans.json()).data || []);
        if (resPending && resPending.ok) setPendingTopUps((await resPending.json()).data || []);
      } else if (section === "home-frames") {
        const res = await fetch(`${API_URL}/home-frames/admin`, { headers }).catch(() => null);
        if (handleUnauthorized([res])) return;
        if (res && res.ok) {
          const result = await res.json();
          setHomeFrames(result.data || []);
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
        }).catch(() => null);
        if (!res) {
          if (!cancelled) setPrepError("Network error — is the API reachable?");
          return;
        }
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

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadData();
      else {
        const error = await res.json().catch(() => null);
        toast({ title: error?.message || "Failed to update order status", type: "error" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostponeOrder = (orderId: string) => {
    requestConfirm("Hoãn đơn này? Toàn bộ lịch còn lại sẽ dời sau một chu kỳ, số lượng được bảo lưu.", async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}/postpone`, { method: "POST", headers: authHeaders() });
        if (res.ok) loadData();
        else {
          const error = await res.json().catch(() => null);
          toast({ title: error?.message || "Failed to postpone order", type: "error" });
        }
      } catch (e) {
        console.error(e);
      }
    });
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
    setSubLinkedCustomPlanRequestId(null);
  };

  // Opens the create-subscription form pre-filled from a customer's custom
  // plan request — the consultation-first flow required by the business:
  // customers ask for a custom plan, staff review it here, then build the
  // actual Subscription (this form) with customPlanRequestId set so the
  // request gets linked + marked MATCHED automatically.
  const handleOpenSubFromCustomPlanRequest = (req: any) => {
    resetSubForm();
    if (req.customerId) setSubCustomerId(req.customerId);
    setSubPackageName(`Gói riêng - ${req.customerName}`);
    if (req.desiredProteins?.length) {
      setSubPools(
        req.desiredProteins.map((protein: Protein) => ({
          protein,
          sizeGrams: 150,
          qty: Math.max(1, Math.round((req.estimatedTotalGrams || 4500) / 150 / req.desiredProteins.length)),
        })),
      );
    }
    if (req.preferredIntervalDays) setSubDeliveryIntervalDays(req.preferredIntervalDays);
    setSubLinkedCustomPlanRequestId(req.id);
    setSubModal("create");
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
        ...(subLinkedCustomPlanRequestId ? { customPlanRequestId: subLinkedCustomPlanRequestId } : {}),
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

  // --- Custom Plan Requests: staff review queue for customer-submitted
  // "I want something custom" asks. Creation is always customer-initiated
  // (public form on customer-web); staff can only review/annotate/decline
  // here, or match one by building a Subscription from it (see
  // handleOpenSubFromCustomPlanRequest above).
  const handleUpdateCustomPlanRequest = async (id: string, updates: { status?: string; adminNotes?: string }) => {
    try {
      const res = await fetch(`${API_URL}/custom-plan-requests/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) loadData();
      else {
        const error = await res.json().catch(() => null);
        toast({ title: error?.message || "Failed to update request", type: "error" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomPlanRequest = (id: string) => {
    requestConfirm(
      "Xóa yêu cầu tư vấn gói riêng này?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/custom-plan-requests/${id}`, { method: "DELETE", headers: authHeaders() });
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
      const res = await fetch(`${API_URL}/orders/subscription/${subId}`, { headers: authHeaders() });
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

  // Create or Update Menu Item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    // The Save button is disabled while menuItemUploading is true, but that
    // only blocks a click on the button itself — pressing Enter in any text
    // field inside the form still fires this submit handler natively,
    // bypassing the disabled button entirely. Without this guard, an
    // Enter-key submit mid-upload sends the payload with imageUrl still
    // empty (the upload hasn't resolved into menuItemImage yet), silently
    // saving the item with no image even though the upload itself succeeds
    // moments later.
    if (menuItemUploading) {
      toast({ title: "Đang tải ảnh lên, vui lòng đợi trước khi lưu.", type: "default" });
      return;
    }
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
        let message = "Failed to save menu item";
        try {
          const error = await res.json();
          message = error.message || message;
        } catch {
          // Response body wasn't JSON (e.g. proxy/server error page) —
          // fall back to the status text so the admin still sees *something*.
          message = `${message} (${res.status} ${res.statusText})`;
        }
        toast({ title: message, type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Lỗi kết nối khi lưu món ăn", type: "error" });
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
    setMenuItemImagePreview(item.imageUrl || "");
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
    setMenuItemImagePreview("");
    setMenuItemUploading(false);
    setMenuItemAvailable(true);
    setMenuItemStock(0);
  };

  // Upload a selected file to POST /upload/image and store the returned
  // Cloudinary URL in menuItemImage. A local object-URL is used as the
  // instant preview so the admin sees the image before the upload round-trip
  // completes.
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Show a local preview immediately — no waiting for the server
    const localPreview = URL.createObjectURL(file);
    setMenuItemImagePreview(localPreview);
    setMenuItemUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        // Every API response is wrapped by the global TransformInterceptor
        // as { success, message, data: <result> } — the upload controller's
        // actual { url, publicId } return value lives at .data, not at the
        // top level. Reading .url directly here was always undefined,
        // silently leaving menuItemImage unset (the visible preview was
        // just the local blob URL, unrelated to this).
        const body = await res.json();
        const url = body?.data?.url;
        // data.url is the Cloudinary secure_url — store it so it's sent
        // in the menu-item create/update payload.
        setMenuItemImage(url);
      } else {
        const error = await res.json();
        toast({ title: error.message || "Upload ảnh thất bại", type: "error" });
        // Roll back the preview on failure
        setMenuItemImagePreview(menuItemImage);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Lỗi kết nối khi upload ảnh", type: "error" });
      setMenuItemImagePreview(menuItemImage);
    } finally {
      setMenuItemUploading(false);
      // Revoke the temporary object URL to free memory
      URL.revokeObjectURL(localPreview);
    }
  };

  // --- Home Frames Handlers ---
  const resetHomeFrameForm = () => {
    setEditingHomeFrameId(null);
    setHomeFrameTitle("");
    setHomeFrameImageUrl("");
    setHomeFrameLinkUrl("");
    setHomeFrameOrder(0);
    setHomeFrameIsActive(true);
    setHomeFrameImagePreview("");
  };

  const handleSaveHomeFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeFrameImageUrl.trim()) {
      toast({ title: "Ảnh khung không được để trống", type: "error" });
      return;
    }
    try {
      setIsSavingHomeFrame(true);
      const payload = {
        title: homeFrameTitle || undefined,
        imageUrl: homeFrameImageUrl,
        linkUrl: homeFrameLinkUrl || undefined,
        order: Number(homeFrameOrder),
        isActive: homeFrameIsActive,
      };
      const url = homeFrameModal === "edit" ? `${API_URL}/home-frames/${editingHomeFrameId}` : `${API_URL}/home-frames`;
      const method = homeFrameModal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setHomeFrameModal(null);
        resetHomeFrameForm();
        loadData();
        toast({ title: "Đã lưu khung ảnh thành công", type: "success" });
      } else {
        const error = await res.json();
        toast({ title: error.message || "Không thể lưu khung ảnh", type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Có lỗi xảy ra khi lưu", type: "error" });
    } finally {
      setIsSavingHomeFrame(false);
    }
  };

  const handleDeleteHomeFrame = (id: string) => {
    requestConfirm(
      "Bạn chắc chắn muốn xóa khung ảnh này khỏi trang chủ?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/home-frames/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          if (res.ok) {
            loadData();
            toast({ title: "Đã xóa khung ảnh", type: "success" });
          } else {
            toast({ title: "Không thể xóa khung ảnh", type: "error" });
          }
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" }
    );
  };

  const handleHomeFrameImageUpload = async (file: File) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setHomeFrameImagePreview(localPreview);
    setIsHomeFrameUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const body = await res.json();
        const url = body?.data?.url;
        setHomeFrameImageUrl(url);
      } else {
        const error = await res.json();
        toast({ title: error.message || "Upload ảnh thất bại", type: "error" });
        setHomeFrameImagePreview("");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Lỗi kết nối khi upload ảnh", type: "error" });
      setHomeFrameImagePreview("");
    } finally {
      setIsHomeFrameUploading(false);
      URL.revokeObjectURL(localPreview);
    }
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

  // --- Subscription Plans (wallet top-up catalog) ---
  const resetSubPlanForm = () => {
    setEditingSubPlanId(null);
    setSubPlanName("");
    setSubPlanPrice(1500000);
    setSubPlanVoucherPercent(5);
    setSubPlanDescription("");
    setSubPlanIsActive(true);
  };

  const handleEditSubPlanTrigger = (plan: any) => {
    setEditingSubPlanId(plan.id);
    setSubPlanName(plan.name);
    setSubPlanPrice(plan.price);
    setSubPlanVoucherPercent(plan.voucherPercent ?? 0);
    setSubPlanDescription(plan.description || "");
    setSubPlanIsActive(plan.isActive);
  };

  // Create or update a price tier — same form serves both, distinguished by
  // editingSubPlanId (mirrors the Menu Item / Home Frame create-vs-edit
  // pattern elsewhere in this console).
  const handleSaveSubscriptionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSubPlan(true);
      const payload = {
        name: subPlanName,
        price: Number(subPlanPrice),
        voucherPercent: Number(subPlanVoucherPercent),
        description: subPlanDescription || undefined,
        isActive: subPlanIsActive,
      };
      const url = editingSubPlanId ? `${API_URL}/subscription-plans/${editingSubPlanId}` : `${API_URL}/subscription-plans`;
      const method = editingSubPlanId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetSubPlanForm();
        loadData();
        toast({ title: editingSubPlanId ? "Đã cập nhật gói nạp" : "Đã tạo gói nạp mới", type: "success" });
      } else {
        const error = await res.json().catch(() => ({}));
        toast({ title: error.message || "Không thể lưu gói nạp", type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Lỗi kết nối khi lưu gói nạp", type: "error" });
    } finally {
      setIsSavingSubPlan(false);
    }
  };

  const handleDeleteSubscriptionPlan = (id: string) => {
    requestConfirm(
      "Bạn chắc chắn muốn xóa gói nạp này?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/subscription-plans/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            if (editingSubPlanId === id) resetSubPlanForm();
            loadData();
          } else {
            const error = await res.json().catch(() => ({}));
            toast({ title: error.message || "Không thể xóa gói nạp", type: "error" });
          }
        } catch (e) {
          console.error(e);
        }
      },
      { variant: "destructive" },
    );
  };

  // --- Pending wallet top-ups queue ---
  const handleConfirmTopUp = async (id: string) => {
    try {
      setProcessingTopUpId(id);
      const res = await fetch(`${API_URL}/subscription-plan-purchases/${id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Đã xác nhận chuyển khoản — ví khách hàng đã được cộng tiền", type: "success" });
        loadData();
      } else {
        const error = await res.json().catch(() => ({}));
        toast({ title: error.message || "Không thể xác nhận giao dịch", type: "error" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Lỗi kết nối khi xác nhận giao dịch", type: "error" });
    } finally {
      setProcessingTopUpId(null);
    }
  };

  const handleRejectTopUp = (id: string) => {
    requestConfirm(
      "Từ chối giao dịch nạp ví này? Ví khách hàng sẽ không được cộng tiền.",
      async () => {
        try {
          setProcessingTopUpId(id);
          const res = await fetch(`${API_URL}/subscription-plan-purchases/${id}/reject`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            toast({ title: "Đã từ chối giao dịch", type: "default" });
            loadData();
          } else {
            const error = await res.json().catch(() => ({}));
            toast({ title: error.message || "Không thể từ chối giao dịch", type: "error" });
          }
        } catch (e) {
          console.error(e);
        } finally {
          setProcessingTopUpId(null);
        }
      },
      { variant: "destructive" },
    );
  };

  const formatVND = (num: number) => {
    return `${num.toLocaleString()} ₫`;
  };

  // One-off Orders — filtered + sorted the same way the table below used to
  // do inline, pulled out here so it can be paginated. `orders` now holds
  // every Order row (both source: ONE_OFF and source: SUBSCRIPTION, per the
  // unified model) so this list narrows to ONE_OFF; subscription-sourced
  // rows are shown separately below in "Orders from Subscriptions".
  const filteredOrders = orders
    .filter((o) => o.source !== "SUBSCRIPTION")
    .filter((o) => {
      if (orderViewTab === "completed") return o.status === "COMPLETED";
      if (orderViewTab === "cancelled") return o.status === "CANCELLED";
      if (o.status === "COMPLETED" || o.status === "CANCELLED") return false;
      if (orderStatusFilter !== "ALL" && o.status !== orderStatusFilter) return false;
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
  // separate from the one-off Orders filters above. Derived from the same
  // `orders` state, narrowed to source: SUBSCRIPTION.
  const subscriptionOrders = orders.filter((o) => o.source === "SUBSCRIPTION");
  const filteredSubscriptionOrders = subscriptionOrders
    .filter((d) => {
      if (subOrderViewTab === "completed") return d.status === "COMPLETED";
      if (subOrderViewTab === "cancelled") return d.status === "CANCELLED";
      if (d.status === "COMPLETED" || d.status === "CANCELLED") return false;
      if (subOrderStatusFilter !== "ALL" && d.status !== subOrderStatusFilter) return false;
      if (subOrderSearch.trim() && !d.customerName?.toLowerCase().includes(subOrderSearch.trim().toLowerCase())) return false;
      if (subOrderDateMode === "upcoming") {
        if (isToday(d.deliveryDate)) return false;
      } else if (subOrderDateFilter && getLocalDateString(new Date(d.deliveryDate)) !== subOrderDateFilter) {
        return false;
      }
      return true;
    })
    // Sorted ascending by delivery date (oldest first) before being
    // bucketed into day-groups below, matching the one-off Orders sort.
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  const subOrderDayGroups = groupEntriesByDate(filteredSubscriptionOrders, (d) => d.deliveryDate, "day");
  const subOrdersTotalPages = Math.ceil(subOrderDayGroups.length / CARD_PAGE_SIZE) || 1;
  const pagedSubOrderDayGroups = paginate(subOrderDayGroups, clampPage(subOrdersPage, subOrdersTotalPages), CARD_PAGE_SIZE);

  // Custom Plan Requests — newest first (API already returns them that
  // way), narrowed by the status filter tab.
  const filteredCustomPlanRequests = customPlanRequests.filter(
    (r) => cprStatusFilter === "ALL" || r.status === cprStatusFilter,
  );
  const customPlanRequestsTotalPages = Math.ceil(filteredCustomPlanRequests.length / PAGE_SIZE) || 1;
  const pagedCustomPlanRequests = paginate(
    filteredCustomPlanRequests,
    clampPage(customPlanRequestsPage, customPlanRequestsTotalPages),
    PAGE_SIZE,
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
              {isLoggingIn ? <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" /> : "Sign In to Admin Portal"}
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
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 md:relative md:flex md:w-64 border-r border-border bg-card flex flex-col shrink-0">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Fortify Kitchen" className="h-8 w-8 rounded-md object-contain" />
                <span className="font-semibold tracking-tight font-heading text-sm">Fortify Console</span>
              </div>
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 text-xs font-semibold">
              {NAVIGATION_GROUPS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveGroup(item.id as any);
                    setSection(item.defaultSection as any);
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full text-left py-2.5 px-3.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeGroup === item.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-border mt-auto hidden md:block space-y-2.5">
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="w-full text-left text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="h-3.5 w-3.5 shrink-0" />
                Privacy & Operating Terms
              </button>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span className="truncate max-w-[120px] font-semibold">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </>
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
              {sidebarOpen ? <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" /> : <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />}
            </button>
            <h2 className="font-extrabold tracking-tight font-heading text-base capitalize truncate">
              {section.replace("-", " ")}
            </h2>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-6 overflow-y-auto bg-muted/20">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 gap-2">
              <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Syncing workspace...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Horizontal Sub-Tabs Bar */}
              <div className="flex border-b border-border gap-2 pb-px overflow-x-auto">
                {SUB_TABS[activeGroup].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSection(tab.id as any)}
                    className={`py-2 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      section === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-8">
              {/* SECTION A: DASHBOARD OVERVIEW */}
              {section === "dashboard" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Total Revenue (VND)", value: formatVND(stats.totalRevenue), icon: faDollarSign },
                      { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: faCalendarAlt },
                      { label: "Total Customers", value: stats.totalCustomers, icon: faUsers },
                      { label: "Total Food Orders", value: stats.totalOrders, icon: faShoppingBag },
                    ].map((item, idx) => (
                      <div key={idx} className="border border-border bg-card rounded-lg p-6 flex items-center justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ">{item.label}</span>
                          <div className="text-xl font-semibold font-heading">{item.value}</div>
                        </div>
                        <div className="p-3 rounded-md border border-primary/20 bg-primary/10 text-primary">
                          <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
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
                        icon: faShoppingBag,
                        urgent: (stats.ordersAwaitingAcceptance || 0) > 0,
                      },
                      {
                        label: "In Preparation",
                        value: stats.ordersInPreparation || 0,
                        icon: faUtensils,
                      },
                      {
                        label: "Out of Stock Dishes",
                        value: (stats.outOfStockItems || []).length,
                        icon: faBox,
                        urgent: (stats.outOfStockItems || []).length > 0,
                      },
                      {
                        label: "Low Stock Dishes",
                        value: (stats.lowStockItems || []).length,
                        icon: faBox,
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
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ">{item.label}</span>
                          <div className="text-xl font-semibold font-heading">{item.value}</div>
                        </div>
                        <div
                          className={`p-3 rounded-md border ${
                            item.urgent
                              ? "border-amber-300 bg-amber-100 text-amber-700"
                              : "border-primary/20 bg-primary/10 text-primary"
                          }`}
                        >
                          <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
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
                        icon: faTruck,
                      },
                      {
                        label: "Nearing Depletion",
                        value: stats.subscriptionsNearingDepletion || 0,
                        icon: faUtensils,
                      },
                      {
                        label: "Delivered This Month",
                        value: formatGrams(stats.gramsDeliveredThisMonth || 0),
                        icon: faCalendarAlt,
                      },
                      {
                        label: "Deliveries This Week",
                        value: stats.deliveriesThisWeek || 0,
                        icon: faShoppingBag,
                      },
                      {
                        label: "Dishes Ready Now",
                        value: stats.dishesReadyNow ?? menuItems.filter((m) => (m.stockQuantity ?? 0) > 0).length,
                        icon: faUtensils,
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="border border-border bg-card rounded-lg p-6 flex items-center justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ">{item.label}</span>
                          <div className="text-xl font-semibold font-heading">{item.value}</div>
                        </div>
                        <div className="p-3 rounded-md border border-primary/20 bg-primary/10 text-primary">
                          <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
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

                  {/* Low-balance alerts — customer wallets running low and
                      subscription pools nearing depletion (fewer than ~3
                      deliveries' worth left). In-app only, per
                      docs/plan-and-credit-design.md. */}
                  {(lowBalance.totalCount || 0) > 0 && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setSection("customers")}
                        className="w-full text-left border border-amber-300 bg-amber-50 rounded-lg p-4 flex items-center justify-between hover:opacity-90 transition-smooth cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-md border border-amber-300 bg-amber-100 text-amber-700">
                            <FontAwesomeIcon icon={faWallet} className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-amber-800">
                            {lowBalance.totalCount} cảnh báo số dư thấp cần chú ý
                          </span>
                        </div>
                      </button>
                      <div className="grid gap-6 sm:grid-cols-2">
                        {(lowBalance.walletsLow || []).length > 0 && (
                          <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
                            <h3 className="text-sm font-bold font-heading mb-3 text-amber-800">Ví khách hàng sắp cạn</h3>
                            <ul className="space-y-1.5 text-xs">
                              {lowBalance.walletsLow.map((w: any) => (
                                <li key={w.customerId} className="flex justify-between text-amber-700">
                                  <span>{w.customerName}</span>
                                  <span className="font-bold">{formatVND(w.walletBalance)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(lowBalance.poolsLow || []).length > 0 && (
                          <div className="border border-rose-200 bg-rose-50 rounded-2xl p-6">
                            <h3 className="text-sm font-bold font-heading mb-3 text-rose-800">Gói ăn sắp hết lượng</h3>
                            <ul className="space-y-1.5 text-xs">
                              {lowBalance.poolsLow.map((p: any) => (
                                <li key={p.subscriptionId} className="flex justify-between text-rose-700 gap-2">
                                  <span>
                                    {p.customerName} · {p.packageName} · {PROTEIN_LABELS[p.protein as Protein] || p.protein}
                                  </span>
                                  <span className="font-bold whitespace-nowrap">{formatGrams(p.remainingGrams)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Orders List */}
                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold font-heading mb-4">Recent Incoming Orders</h3>
                    {/* Mobile cards view */}
                    <div className="md:hidden space-y-3">
                      {stats.recentOrders?.map((o: any) => (
                        <div key={o.id} className="border border-border bg-muted/10 p-4 rounded-xl space-y-2.5 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-foreground">{o.customerName}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                            <span className="font-bold text-primary">{formatVND(o.total)}</span>
                          </div>
                          <div className="flex gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                o.fulfillmentType === "IMMEDIATE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {o.fulfillmentType === "IMMEDIATE" ? "Ready Now" : "Needs Prep"}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                              {ORDER_STATUS_LABELS[o.status as OrderStatus] || o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table view */}
                    <div className="hidden md:block overflow-x-auto">
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
                                  {o.status}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-sm font-bold font-heading">Orders ({orders.length})</h3>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> Tạo đơn hàng
                      </button>
                    </div>
                  </div>

                  {/* Current / Completed / Cancelled — the status dropdown
                      walks an order through PENDING_CONFIRMATION →
                      CONFIRMED → PREPARING → OUT_FOR_DELIVERY → COMPLETED;
                      reaching COMPLETED drops it out of Current into the
                      Completed tab here. */}
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
                        {ORDER_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                        ))}
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
                          <h4 className="text-xs font-bold  uppercase tracking-wider">
                            {formatGroupKeyLabel(group.key, "day")}
                          </h4>
                          <span className="text-[10px] text-muted-foreground ">{group.entries.length} đơn</span>
                        </div>
                        {/* Mobile cards view */}
                        <div className="md:hidden space-y-3">
                          {group.entries.map((o: any) => (
                            <div
                              key={o.id}
                              onClick={() => setOrderDetailView(o)}
                              className="border border-border bg-muted/10 p-4 rounded-xl space-y-3 text-xs cursor-pointer hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-foreground">{o.customerName}</div>
                                  <div className="text-[10px] text-muted-foreground mt-1 flex flex-col gap-0.5">
                                    {o.deliveryAddress && <span>📍 {o.deliveryAddress}</span>}
                                    <span>💳 {o.paymentMethod === "BANK_TRANSFER" ? "VietQR CK" : "Ship COD"}</span>
                                  </div>
                                </div>
                                <span className="font-bold text-primary">{formatVND(o.total)}</span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                                    o.fulfillmentType === "IMMEDIATE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {o.fulfillmentType === "IMMEDIATE" ? "Ready Now" : "Needs Prep"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${ORDER_STATUS_BADGE_CLASS[o.status as string] || "bg-amber-50 text-amber-700 border-amber-200"}`}
                                >
                                  {ORDER_STATUS_LABELS[o.status as OrderStatus] || o.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between border-t border-border/40 pt-2.5" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1">
                                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Thanh toán</span>
                                  <select
                                    value={o.paymentStatus}
                                    onChange={(e) => handleUpdateOrderPaymentStatus(o.id, e.target.value)}
                                    className="text-[10px] font-bold px-2 py-1 rounded border border-border bg-background cursor-pointer"
                                  >
                                    {PAYMENT_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={o.status}
                                    onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                    className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                                  >
                                    {ORDER_STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleEditOrderTrigger(o)}
                                    className="text-muted-foreground hover:text-primary p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                                    title="Edit"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(o.id)}
                                    className="text-muted-foreground hover:text-red-500 p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                                    title="Delete"
                                  >
                                    <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop table view */}
                        <div className="hidden md:block overflow-x-auto">
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
                                  style={{ contentVisibility: 'auto' }}
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
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${ORDER_STATUS_BADGE_CLASS[o.status as string] || "bg-amber-50 text-amber-700 border-amber-200"}`}
                                    >
                                      {ORDER_STATUS_LABELS[o.status as OrderStatus] || o.status}
                                    </span>
                                  </td>
                                  <td className="py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                      <select
                                        value={o.status}
                                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                        className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                                      >
                                        {ORDER_STATUS_OPTIONS.map((s) => (
                                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => handleEditOrderTrigger(o)}
                                        className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0"
                                        title="Edit"
                                      >
                                        <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOrder(o.id)}
                                        className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                                        title="Delete"
                                      >
                                        <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
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

                  {/* Orders generated from Subscriptions — same Order model
                      and same status lifecycle as the one-off rows above,
                      just tagged source: SUBSCRIPTION and shown as their own
                      group so staff can still tell at a glance which orders
                      came from a subscription pool. Moving one to COMPLETED
                      deducts the delivered amount from the subscription's
                      pool server-side (see OrdersService.markCompleted). */}
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
                        {ORDER_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                        ))}
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
                          <h4 className="text-xs font-bold  uppercase tracking-wider">
                            {formatGroupKeyLabel(group.key, "day")}
                          </h4>
                          <span className="text-[10px] text-muted-foreground ">{group.entries.length} đơn</span>
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
                                  <td className="py-4  text-muted-foreground">{formatGrams(d.totalGrams)}</td>
                                  <td className="py-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${ORDER_STATUS_BADGE_CLASS[d.status as string] || "bg-amber-50 text-amber-700 border-amber-200"}`}
                                    >
                                      {ORDER_STATUS_LABELS[d.status as OrderStatus] || d.status}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                      <select
                                        value={d.status}
                                        onChange={(e) => handleUpdateOrderStatus(d.id, e.target.value)}
                                        className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                                      >
                                        {ORDER_STATUS_OPTIONS.map((s) => (
                                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                                        ))}
                                      </select>
                                      {d.status !== "COMPLETED" && d.status !== "CANCELLED" && (
                                        <button
                                          onClick={() => handlePostponeOrder(d.id)}
                                          title="Hoãn đơn này (bảo lưu số lượng)"
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-sm font-bold font-heading">Customers ({customers.length})</h3>
                    <button
                      onClick={() => { resetCustomerForm(); setCustomerModal("create"); }}
                      className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> Thêm khách hàng
                    </button>
                  </div>

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                    {/* Mobile cards view */}
                    <div className="md:hidden space-y-3">
                      {paginate(customers, clampPage(customersPage, Math.ceil(customers.length / PAGE_SIZE) || 1), PAGE_SIZE).map((c) => (
                        <div key={c.id} className="border border-border bg-muted/10 p-4 rounded-xl space-y-2.5 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-foreground">{c.name}</p>
                              <p className="text-muted-foreground mt-0.5">SĐT: {c.phone || "—"}</p>
                              <p className="text-muted-foreground">Zalo: {c.zalo || "—"}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleEditCustomerTrigger(c)}
                                className="text-muted-foreground hover:text-primary p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                              >
                                <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.id)}
                                className="text-muted-foreground hover:text-red-500 p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                              >
                                <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground bg-background p-2 rounded-lg border border-border/40">
                            <span className="font-semibold text-foreground">Địa chỉ:</span> {c.address || "—"}
                          </div>
                          <div className="flex items-center justify-between text-[11px] bg-primary/5 border border-primary/20 p-2 rounded-lg">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faWallet} className="h-3 w-3 text-primary" /> Số dư ví:
                            </span>
                            <span className="font-bold text-primary">{formatVND(c.walletBalance || 0)}</span>
                          </div>
                          {c.planDiscountPercent > 0 && c.planDiscountEndsAt && new Date(c.planDiscountEndsAt) > new Date() && (
                            <div className="flex items-center justify-between text-[11px] bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                              <span className="font-semibold text-foreground">Ưu đãi gói:</span>
                              <span className="font-bold text-emerald-700">
                                {c.planDiscountPercent}% — đến {new Date(c.planDiscountEndsAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desktop table view */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/50 pb-3">
                            <th className="pb-3 font-semibold">Tên</th>
                            <th className="pb-3 font-semibold">SĐT</th>
                            <th className="pb-3 font-semibold">Zalo</th>
                            <th className="pb-3 font-semibold">Địa chỉ</th>
                            <th className="pb-3 font-semibold text-right">Số dư ví</th>
                            <th className="pb-3 font-semibold">Ưu đãi gói</th>
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
                              <td className="py-3.5 text-right font-bold text-primary">{formatVND(c.walletBalance || 0)}</td>
                              <td className="py-3.5">
                                {c.planDiscountPercent > 0 && c.planDiscountEndsAt && new Date(c.planDiscountEndsAt) > new Date() ? (
                                  <span className="font-bold text-emerald-700">
                                    {c.planDiscountPercent}% đến {new Date(c.planDiscountEndsAt).toLocaleDateString("vi-VN")}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3.5">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEditCustomerTrigger(c)}
                                    className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomer(c.id)}
                                    className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                                  >
                                    <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
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

              {/* SECTION C: MENU CATALOG MANAGER */}
              {section === "menu" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-sm font-bold font-heading">Menu Items Catalog</h3>
                    <button
                      onClick={() => {
                        resetMenuForm();
                        setMenuModal("create");
                      }}
                      className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> Add Menu Item
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
                          <h4 className="text-xs font-bold  uppercase tracking-wider text-muted-foreground">
                            {PROTEIN_LABELS[protein]}
                          </h4>
                          <span className="text-[10px]  text-muted-foreground">({dishes.length})</span>
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
                                    <span className="text-xs font-bold text-primary shrink-0 ">{formatVND(item.price)}</span>
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
                                      className={`text-[10px] font-bold  px-1.5 py-0.5 rounded ${
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
                                    <FontAwesomeIcon icon={faEdit} className="h-3 w-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMenuItem(item.id)}
                                    className="py-1.5 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer"
                                  >
                                    <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
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
                                <h4 className="text-xs font-bold  uppercase tracking-wider text-muted-foreground">
                                  {PROTEIN_LABELS[protein]}
                                </h4>
                                <span className="text-[10px]  text-muted-foreground">({items.length})</span>
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
                                          <td className="py-3  font-bold">{item.stockQuantity ?? 0}</td>
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
                          {isAddingStock ? <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" /> : <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-sm font-bold font-heading">Subscriptions ({subscriptions.length})</h3>
                    <button
                      onClick={() => { resetSubForm(); setSubModal("create"); }}
                      className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> Tạo gói đăng ký
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
                                    <span className=" text-muted-foreground">
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
                              <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
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

              {/* SECTION: CUSTOM PLAN REQUESTS — customer-submitted asks for
                  a plan outside the standard catalog, always starting as a
                  consultation request (never a self-serve Subscription).
                  Staff review here, annotate, and either build a matching
                  Subscription ("Tạo gói từ yêu cầu này" → pre-fills the
                  Subscription form above and links back on save) or
                  decline. */}
              {section === "custom-plan-requests" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-sm font-bold font-heading">
                      Custom Plan Requests ({filteredCustomPlanRequests.length})
                    </h3>
                    <select
                      value={cprStatusFilter}
                      onChange={(e) => setCprStatusFilter(e.target.value as typeof cprStatusFilter)}
                      className="text-[11px] font-bold px-2 py-2 rounded border border-border bg-background cursor-pointer"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      {CUSTOM_PLAN_REQUEST_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{CUSTOM_PLAN_REQUEST_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  {pagedCustomPlanRequests.length === 0 ? (
                    <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                      Chưa có yêu cầu tư vấn gói riêng nào
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {pagedCustomPlanRequests.map((r: any) => (
                        <div key={r.id} className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-sm">{r.customerName}</p>
                              <p className="text-[11px] text-muted-foreground">{r.phone || "—"}</p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${CUSTOM_PLAN_REQUEST_STATUS_BADGE_CLASS[r.status as CustomPlanRequestStatus]}`}
                            >
                              {CUSTOM_PLAN_REQUEST_STATUS_LABELS[r.status as CustomPlanRequestStatus] || r.status}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 bg-muted/30 border border-border/50 rounded-lg p-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Protein mong muốn:</span>
                              <span className="font-semibold text-right">
                                {(r.desiredProteins || []).map((p: Protein) => PROTEIN_LABELS[p] || p).join(", ") || "—"}
                              </span>
                            </div>
                            {r.estimatedTotalGrams != null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Khối lượng ước tính:</span>
                                <span className="font-semibold">{formatGrams(r.estimatedTotalGrams)}</span>
                              </div>
                            )}
                            {r.preferredIntervalDays != null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Chu kỳ mong muốn:</span>
                                <span className="font-semibold">{formatIntervalLabel(r.preferredIntervalDays)}</span>
                              </div>
                            )}
                            {r.budgetHint != null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ngân sách tham khảo:</span>
                                <span className="font-semibold">{formatVND(r.budgetHint)}</span>
                              </div>
                            )}
                            {r.notes && (
                              <div className="pt-1 border-t border-border/40 text-primary italic">&quot;{r.notes}&quot;</div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Ghi chú nội bộ
                            </label>
                            <div className="flex gap-2">
                              <textarea
                                rows={2}
                                value={cprNoteDrafts[r.id] ?? r.adminNotes ?? ""}
                                onChange={(e) => setCprNoteDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                className="flex-1 bg-background border border-border focus:border-primary text-xs py-2 px-2.5 rounded-lg outline-none resize-none"
                              />
                              <button
                                onClick={() => handleUpdateCustomPlanRequest(r.id, { adminNotes: cprNoteDrafts[r.id] ?? r.adminNotes ?? "" })}
                                className="text-[10px] font-bold px-2.5 rounded-md border border-border hover:bg-muted cursor-pointer whitespace-nowrap"
                              >
                                Lưu
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                            <select
                              value={r.status}
                              onChange={(e) => handleUpdateCustomPlanRequest(r.id, { status: e.target.value })}
                              className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                            >
                              {CUSTOM_PLAN_REQUEST_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{CUSTOM_PLAN_REQUEST_STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1.5">
                              {r.status !== "MATCHED" && (
                                <button
                                  onClick={() => handleOpenSubFromCustomPlanRequest(r)}
                                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer whitespace-nowrap"
                                >
                                  Tạo gói từ yêu cầu này
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteCustomPlanRequest(r.id)}
                                className="text-muted-foreground hover:text-red-500 p-1.5 cursor-pointer bg-card border border-border rounded-lg"
                                title="Xóa"
                              >
                                <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <PaginationControls
                    page={customPlanRequestsPage}
                    totalPages={customPlanRequestsTotalPages}
                    totalItems={filteredCustomPlanRequests.length}
                    pageSize={PAGE_SIZE}
                    onChange={setCustomPlanRequestsPage}
                  />
                </div>
              )}

              {/* SECTION: PREP LIST */}
              {section === "prep-list" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                        <FontAwesomeIcon icon={faUtensils} className="h-4 w-4 text-primary" />
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
                      <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Đang tổng hợp...</span>
                    </div>
                  ) : prepData.prepItems.length === 0 ? (
                    <div className="border border-dashed border-border rounded-lg py-20 text-center">
                      <FontAwesomeIcon icon={faUtensils} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
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
                                <th className="px-4 py-3 font-semibold  uppercase tracking-wide text-muted-foreground">Món</th>
                                <th className="px-4 py-3 font-semibold  uppercase tracking-wide text-muted-foreground text-center">Phần</th>
                                <th className="px-4 py-3 font-semibold  uppercase tracking-wide text-muted-foreground text-right">Tổng gram</th>
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
                                    <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md font-bold ">
                                      {item.portions}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold ">
                                    {item.totalGrams.toLocaleString()}g
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-primary/30 bg-primary/5">
                                <td className="px-4 py-3 font-bold">Tổng cộng</td>
                                <td className="px-4 py-3 text-center font-bold ">{prepData.totalPortions}</td>
                                <td className="px-4 py-3 text-right font-bold ">
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
                                  <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4 mx-auto" />
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

              {/* SECTION F: SUBSCRIPTION PLANS (wallet top-up catalog + pending queue) */}
              {section === "subscription-plans" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {/* Catalog management — mirrors the Promotional Codes
                      create-form-plus-list layout, extended with edit
                      support (a plan can be retired via isActive rather
                      than only deleted). */}
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="border border-border bg-card rounded-2xl p-6 shadow-sm h-fit">
                      <h3 className="text-sm font-bold font-heading mb-4">
                        {editingSubPlanId ? "Chỉnh sửa gói nạp" : "Tạo gói nạp mới"}
                      </h3>
                      <form onSubmit={handleSaveSubscriptionPlan} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên gói</label>
                          <input
                            type="text"
                            required
                            placeholder="vd: Gói 1.5 triệu"
                            value={subPlanName}
                            onChange={(e) => setSubPlanName(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Giá (VND)</label>
                            <input
                              type="number"
                              required
                              min={0}
                              value={subPlanPrice}
                              onChange={(e) => setSubPlanPrice(Number(e.target.value))}
                              className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Voucher (%)</label>
                            <input
                              type="number"
                              required
                              min={0}
                              max={100}
                              value={subPlanVoucherPercent}
                              onChange={(e) => setSubPlanVoucherPercent(Number(e.target.value))}
                              className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mô tả (tùy chọn)</label>
                          <textarea
                            rows={2}
                            value={subPlanDescription}
                            onChange={(e) => setSubPlanDescription(e.target.value)}
                            className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none resize-none"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subPlanIsActive}
                            onChange={(e) => setSubPlanIsActive(e.target.checked)}
                            className="h-3.5 w-3.5 cursor-pointer"
                          />
                          Đang hoạt động (hiển thị cho khách hàng)
                        </label>

                        <div className="flex gap-2">
                          {editingSubPlanId && (
                            <button
                              type="button"
                              onClick={resetSubPlanForm}
                              className="flex-1 border border-border hover:bg-muted text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer"
                            >
                              Hủy
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isSavingSubPlan}
                            className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
                          >
                            {isSavingSubPlan ? "Đang lưu..." : editingSubPlanId ? "Lưu thay đổi" : "Tạo gói nạp"}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="lg:col-span-2 border border-border bg-card rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold font-heading mb-4">Danh mục gói nạp ({subscriptionPlans.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border/50 pb-2">
                              <th className="pb-3 font-semibold">Tên gói</th>
                              <th className="pb-3 font-semibold">Giá</th>
                              <th className="pb-3 font-semibold">Voucher</th>
                              <th className="pb-3 font-semibold text-center">Trạng thái</th>
                              <th className="pb-3 font-semibold text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginate(
                              subscriptionPlans,
                              clampPage(subscriptionPlansPage, Math.ceil(subscriptionPlans.length / PAGE_SIZE) || 1),
                              PAGE_SIZE,
                            ).map((p: any) => (
                              <tr key={p.id} className="border-b border-border/20 last:border-0">
                                <td className="py-3.5 font-bold">{p.name}</td>
                                <td className="py-3.5 font-bold text-primary">{formatVND(p.price)}</td>
                                <td className="py-3.5 text-muted-foreground">{p.voucherPercent}%</td>
                                <td className="py-3.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                                      p.isActive
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-muted text-muted-foreground border-border"
                                    }`}
                                  >
                                    {p.isActive ? "Hoạt động" : "Đã ẩn"}
                                  </span>
                                </td>
                                <td className="py-3.5">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => handleEditSubPlanTrigger(p)}
                                      className="text-muted-foreground hover:text-primary cursor-pointer bg-transparent border-0"
                                    >
                                      <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubscriptionPlan(p.id)}
                                      className="text-muted-foreground hover:text-red-500 cursor-pointer bg-transparent border-0"
                                    >
                                      <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {subscriptionPlans.length === 0 && (
                        <div className="border border-dashed border-border rounded-lg py-12 text-center text-xs text-muted-foreground">
                          Chưa có gói nạp nào
                        </div>
                      )}
                      <PaginationControls
                        page={subscriptionPlansPage}
                        totalPages={Math.ceil(subscriptionPlans.length / PAGE_SIZE) || 1}
                        totalItems={subscriptionPlans.length}
                        pageSize={PAGE_SIZE}
                        onChange={setSubscriptionPlansPage}
                      />
                    </div>
                  </div>

                  {/* Pending top-ups queue — bank transfers awaiting staff
                      reconciliation. Confirming credits the customer's
                      wallet + issues the tier's voucher; rejecting leaves
                      the wallet untouched. Card-queue layout mirrors Custom
                      Plan Requests. */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold font-heading">Chờ xác nhận chuyển khoản ({pendingTopUps.length})</h3>
                    {pendingTopUps.length === 0 ? (
                      <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                        Không có giao dịch nạp ví nào đang chờ xác nhận
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {paginate(
                          pendingTopUps,
                          clampPage(pendingTopUpsPage, Math.ceil(pendingTopUps.length / PAGE_SIZE) || 1),
                          PAGE_SIZE,
                        ).map((t: any) => (
                          <div key={t.id} className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-sm">{t.customerName}</p>
                                <p className="text-[11px] text-muted-foreground">{t.planName}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200">
                                Chờ xác nhận
                              </span>
                            </div>

                            <div className="text-xs space-y-1 bg-muted/30 border border-border/50 rounded-lg p-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Số tiền:</span>
                                <span className="font-bold text-primary">{formatVND(t.amount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ngày tạo:</span>
                                <span className="font-semibold">{new Date(t.createdAt).toLocaleString("vi-VN")}</span>
                              </div>
                              {t.transactionId && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Mã giao dịch:</span>
                                  <span className="font-semibold">{t.transactionId}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                              <button
                                onClick={() => handleConfirmTopUp(t.id)}
                                disabled={processingTopUpId === t.id}
                                className="flex-1 text-[11px] font-bold px-2.5 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" /> Xác nhận
                              </button>
                              <button
                                onClick={() => handleRejectTopUp(t.id)}
                                disabled={processingTopUpId === t.id}
                                className="flex-1 text-[11px] font-bold px-2.5 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <FontAwesomeIcon icon={faTimes} className="h-3 w-3" /> Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <PaginationControls
                      page={pendingTopUpsPage}
                      totalPages={Math.ceil(pendingTopUps.length / PAGE_SIZE) || 1}
                      totalItems={pendingTopUps.length}
                      pageSize={PAGE_SIZE}
                      onChange={setPendingTopUpsPage}
                    />
                  </div>
                </div>
              )}

              {/* HOME FRAMES MANAGER */}
              {section === "home-frames" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold font-heading">Quản lý Banners/Khung ảnh Trang chủ</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cập nhật và sắp xếp các khung hình quảng cáo sẽ xuất hiện trên trang chủ khách hàng.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        resetHomeFrameForm();
                        setHomeFrameModal("create");
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-smooth font-heading"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
                      Thêm Banner Mới
                    </button>
                  </div>

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/60 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                            <th className="pb-3.5 w-24">Hình ảnh</th>
                            <th className="pb-3.5">Tiêu đề (Tùy chọn)</th>
                            <th className="pb-3.5">Đường dẫn liên kết</th>
                            <th className="pb-3.5 text-center">Thứ tự</th>
                            <th className="pb-3.5 text-center">Trạng thái</th>
                            <th className="pb-3.5 text-center w-24">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-medium">
                          {homeFrames.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                Chưa có banner nào được tạo. Nhấn &quot;Thêm Banner Mới&quot; để bắt đầu.
                              </td>
                            </tr>
                          ) : (
                            paginate(homeFrames, homeFramesPage, PAGE_SIZE).map((frame: any) => (
                              <tr key={frame.id} className="hover:bg-muted/10 transition-colors">
                                <td className="py-3.5">
                                  <img
                                    src={frame.imageUrl}
                                    alt={frame.title || "Banner"}
                                    className="h-12 w-20 rounded-md object-cover border border-border bg-muted"
                                  />
                                </td>
                                <td className="py-3.5 font-semibold text-foreground">
                                  {frame.title || <span className="text-muted-foreground italic font-normal">Không có</span>}
                                </td>
                                <td className="py-3.5 text-muted-foreground break-all">
                                  {frame.linkUrl || <span className="text-muted-foreground/50 italic">Không có</span>}
                                </td>
                                <td className="py-3.5 text-center font-bold">
                                  {frame.order}
                                </td>
                                <td className="py-3.5 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      frame.isActive
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                  >
                                    {frame.isActive ? "Hoạt động" : "Tạm ẩn"}
                                  </span>
                                </td>
                                <td className="py-3.5 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingHomeFrameId(frame.id);
                                        setHomeFrameTitle(frame.title || "");
                                        setHomeFrameImageUrl(frame.imageUrl);
                                        setHomeFrameImagePreview(frame.imageUrl);
                                        setHomeFrameLinkUrl(frame.linkUrl || "");
                                        setHomeFrameOrder(frame.order);
                                        setHomeFrameIsActive(frame.isActive);
                                        setHomeFrameModal("edit");
                                      }}
                                      className="text-primary hover:text-primary/80 p-1.5 cursor-pointer transition-colors"
                                      title="Chỉnh sửa"
                                    >
                                      <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteHomeFrame(frame.id)}
                                      className="text-red-500 hover:text-red-600 p-1.5 cursor-pointer transition-colors"
                                      title="Xóa"
                                    >
                                      <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      page={homeFramesPage}
                      totalPages={Math.ceil(homeFrames.length / PAGE_SIZE) || 1}
                      totalItems={homeFrames.length}
                      pageSize={PAGE_SIZE}
                      onChange={setHomeFramesPage}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </main>
      </div>

      {/* 3. MENU CREATE/EDIT DIALOG MODAL */}
      {menuModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setMenuModal(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl p-8 z-10 space-y-6">
            <div className="text-center pb-1 border-b border-border/40">
              <h3 className="text-lg font-bold font-heading text-foreground">
                {menuModal === "create" ? "Thêm món mới" : "Chỉnh sửa món"}
              </h3>
              <p className="text-[11px] text-foreground/50 mt-0.5">{menuModal === "create" ? "Điền thông tin để thêm món vào thực đơn" : "Cập nhật thông tin món ăn"}</p>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Protein</label>
                  <select
                    value={menuItemProtein}
                    onChange={(e) => setMenuItemProtein(e.target.value as Protein)}
                    className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors"
                  >
                    {PROTEIN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {PROTEIN_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Khối lượng (gram)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={menuItemSizeGrams}
                    onChange={(e) => setMenuItemSizeGrams(Number(e.target.value))}
                    className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Hương vị / Tên món</label>
                <input
                  type="text"
                  required
                  placeholder="vd: xá xíu, sốt cam, rang muối..."
                  value={menuItemFlavor}
                  onChange={(e) => setMenuItemFlavor(e.target.value)}
                  className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground placeholder:text-foreground/30 py-2.5 px-3 rounded-lg outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Giá (VND)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={menuItemPrice}
                    onChange={(e) => setMenuItemPrice(Number(e.target.value))}
                    className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Danh mục (tùy chọn)</label>
                  <select
                    value={menuItemCatId}
                    onChange={(e) => setMenuItemCatId(e.target.value)}
                    className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors"
                  >
                    <option value="">— Không chọn —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Ảnh sản phẩm (tùy chọn)</label>

                {/* Image Preview */}
                {(menuItemImagePreview || menuItemImage) && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-foreground/15 bg-foreground/5">
                    <img
                      src={menuItemImagePreview || menuItemImage}
                      alt="Preview ảnh sản phẩm"
                      className="w-full h-full object-cover"
                    />
                    {menuItemUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <FontAwesomeIcon icon={faSpinner} className="text-white text-2xl animate-spin" />
                      </div>
                    )}
                    {!menuItemUploading && (
                      <button
                        type="button"
                        onClick={() => { setMenuItemImage(""); setMenuItemImagePreview(""); }}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                )}

                {/* Upload zone */}
                <label
                  className={`flex flex-col items-center justify-center gap-1.5 w-full border-2 border-dashed rounded-xl py-4 px-4 transition-all text-xs font-semibold
                    ${
                      menuItemUploading
                        ? "border-primary/30 text-foreground/30 cursor-not-allowed bg-foreground/[0.02]"
                        : "border-foreground/25 hover:border-primary hover:bg-primary/5 hover:text-primary text-foreground/50 cursor-pointer bg-white"
                    }`
                  }
                >
                  {menuItemUploading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-base" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>{menuItemImage ? "Thay ảnh khác" : "Nhấn để tải ảnh lên"}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={menuItemUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                <p className="text-[10px] text-foreground/40">
                  Hỗ trợ: JPG, PNG, WEBP, GIF · Tối đa 5 MB
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">
                  Tồn kho (suất đã sẵn sàng)
                </label>
                <input
                  type="number"
                  min={0}
                  value={menuItemStock}
                  onChange={(e) => setMenuItemStock(Number(e.target.value))}
                  className="w-full bg-white border border-foreground/20 focus:border-primary text-xs text-foreground py-2.5 px-3 rounded-lg outline-none transition-colors"
                />
                <p className="text-[10px] text-foreground/40">
                  0 = cần chế biến trước khi giao. Dùng nút +/− trên thẻ món để điều chỉnh nhanh hàng ngày.
                </p>
              </div>

              <div className="flex items-center gap-2.5 bg-foreground/[0.03] border border-foreground/10 rounded-lg px-3 py-2.5">
                <input
                  type="checkbox"
                  id="avail"
                  checked={menuItemAvailable}
                  onChange={(e) => setMenuItemAvailable(e.target.checked)}
                  className="rounded border-foreground/30 text-primary focus:ring-primary h-4 w-4 accent-primary"
                />
                <label htmlFor="avail" className="text-xs font-semibold text-foreground/70 select-none cursor-pointer">
                  Hiển thị trong thực đơn (Active)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMenuModal(null)}
                  className="flex-1 bg-white hover:bg-foreground/5 text-foreground/70 hover:text-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-foreground/20"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={menuItemUploading}
                  className="flex-2 flex-grow-[2] bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/20"
                >
                  {menuModal === "create" ? "Thêm món" : "Lưu thay đổi"}
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
                className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${ORDER_STATUS_BADGE_CLASS[orderDetailView.status as string] || "bg-amber-50 text-amber-700 border-amber-200"}`}
              >
                {ORDER_STATUS_LABELS[orderDetailView.status as OrderStatus] || orderDetailView.status}
              </span>
              {orderDetailView.source === "SUBSCRIPTION" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-muted text-muted-foreground whitespace-nowrap">
                  Gói đăng ký: {orderDetailView.packageName || "—"}
                </span>
              )}
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
                  <span className=" text-muted-foreground">{formatVND(i.unitPrice * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span className="">{formatVND(orderDetailView.subtotal)}</span>
              </div>
              {orderDetailView.discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Giảm giá</span>
                  <span className="">−{formatVND(orderDetailView.discountAmount)}</span>
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
                <FontAwesomeIcon icon={faEdit} className="h-3.5 w-3.5" /> Sửa đơn hàng
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
                            <FontAwesomeIcon icon={faTrashAlt} className="h-3 w-3" />
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
          <div className="absolute inset-0 cursor-pointer" onClick={() => { setSubModal(null); resetSubForm(); }} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8">
            <div className="text-center">
              <h3 className="text-lg font-bold font-heading">Tạo gói đăng ký</h3>
              {subLinkedCustomPlanRequestId && (
                <p className="text-[11px] text-primary font-semibold mt-1">
                  Đang tạo từ yêu cầu tư vấn gói riêng — sẽ tự động đánh dấu &quot;Đã ghép gói&quot; khi lưu
                </p>
              )}
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
                          <FontAwesomeIcon icon={faTrashAlt} className="h-3 w-3" />
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  onClick={() => { setSubModal(null); resetSubForm(); }}
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
              <div className="py-10 text-center"><FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
            ) : subDetailDeliveries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Chưa có lần giao nào được tạo</p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {subDetailDeliveries.map((d: any) => (
                  <div key={d.id} className="border border-border rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{new Date(d.deliveryDate).toLocaleDateString("vi-VN")}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-muted">{ORDER_STATUS_LABELS[d.status as OrderStatus] || d.status}</span>
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

      {/* HOME FRAME CREATE/EDIT DIALOG MODAL */}
      {homeFrameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setHomeFrameModal(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl p-8 z-10 space-y-6 text-left">
            <div className="text-center pb-1 border-b border-border/40">
              <h3 className="text-lg font-bold font-heading text-foreground">
                {homeFrameModal === "create" ? "Thêm Banner Mới" : "Chỉnh sửa Banner"}
              </h3>
              <p className="text-[11px] text-foreground/50 mt-0.5">
                {homeFrameModal === "create" ? "Thiết lập thông tin cho banner quảng cáo mới" : "Cập nhật thông tin banner quảng cáo"}
              </p>
            </div>

            <form onSubmit={handleSaveHomeFrame} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tiêu đề (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giảm giá mùa hè"
                  value={homeFrameTitle}
                  onChange={(e) => setHomeFrameTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Đường dẫn liên kết (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: /menu hoặc link ngoài"
                  value={homeFrameLinkUrl}
                  onChange={(e) => setHomeFrameLinkUrl(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min={0}
                    value={homeFrameOrder}
                    onChange={(e) => setHomeFrameOrder(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none font-bold"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pb-2 select-none">
                    <input
                      type="checkbox"
                      checked={homeFrameIsActive}
                      onChange={(e) => setHomeFrameIsActive(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Kích hoạt hiển thị</span>
                  </label>
                </div>
              </div>

              {/* Upload section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Hình ảnh Banner</label>
                
                <div className="flex gap-4 items-start">
                  <div className="relative h-28 w-48 border border-border rounded-xl bg-background overflow-hidden flex items-center justify-center shrink-0">
                    {homeFrameImagePreview ? (
                      <>
                        <img src={homeFrameImagePreview} alt="Preview" className="h-full w-full object-cover" />
                        {isHomeFrameUploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 text-center px-4">
                        Chưa chọn ảnh (hoặc điền link trực tiếp bên dưới)
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-border hover:bg-muted text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm bg-background select-none">
                      <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 text-muted-foreground" />
                      Tải ảnh lên
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleHomeFrameImageUpload(file);
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Chấp nhận PNG, JPG, GIF. Dung lượng tối đa 5MB. Ảnh sẽ được tự động đồng bộ lên Cloudinary.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground/80 block uppercase">Hoặc dán URL trực tiếp</span>
                  <input
                    type="text"
                    required
                    placeholder="https://..."
                    value={homeFrameImageUrl}
                    onChange={(e) => {
                      setHomeFrameImageUrl(e.target.value);
                      setHomeFrameImagePreview(e.target.value);
                    }}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2 px-3 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setHomeFrameModal(null)}
                  className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer border border-border transition-colors font-heading"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingHomeFrame || isHomeFrameUploading}
                  className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-50 text-primary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors font-heading"
                >
                  {isSavingHomeFrame ? "Đang lưu..." : "Lưu banner"}
                </button>
              </div>
            </form>
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
