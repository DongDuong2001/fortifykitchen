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

export default function AdminDashboard() {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any | null>(null);

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
  const [deliveryView, setDeliveryView] = React.useState<"all" | "upcoming">("all");
  const [deliveryGroupBy, setDeliveryGroupBy] = React.useState<"week" | "month">("week");
  const [upcomingGroups, setUpcomingGroups] = React.useState<any[]>([]);
  // Deliveries tab filters — apply to both "Tất cả" (grouped by day) and
  // "Sắp tới" (grouped by week/month) views.
  const [deliverySourceFilter, setDeliverySourceFilter] = React.useState<"ALL" | "ORDER" | "SUBSCRIPTION">("ALL");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = React.useState<(typeof DELIVERY_STATUS_OPTIONS)[number] | "ALL">("ALL");
  const [deliverySearch, setDeliverySearch] = React.useState("");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [discounts, setDiscounts] = React.useState<any[]>([]);

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

  // --- Subscription form state (volume-based: one or more protein pools +
  // a delivery cadence — flavor is chosen per-delivery, not at purchase) ---
  const [subModal, setSubModal] = React.useState<"create" | null>(null);
  const [subDetailId, setSubDetailId] = React.useState<string | null>(null);
  const [subDetailDeliveries, setSubDetailDeliveries] = React.useState<any[]>([]);
  const [isSubDetailLoading, setIsSubDetailLoading] = React.useState(false);
  const [topUpModal, setTopUpModal] = React.useState<{ subId: string; protein: Protein; grams: number } | null>(null);
  const [subCustomerId, setSubCustomerId] = React.useState("");
  const [subPackageName, setSubPackageName] = React.useState("");
  const [subPools, setSubPools] = React.useState<{ protein: Protein; kg: number }[]>([]);
  const [subPoolProtein, setSubPoolProtein] = React.useState<Protein>("CHICKEN");
  const [subPoolKg, setSubPoolKg] = React.useState(10);
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

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      if (section === "dashboard") {
        const [resStats, resMenu] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`, { headers }),
          fetch(`${API_URL}/menu/admin`, { headers }),
        ]);
        if (resStats.ok) {
          const result = await resStats.json();
          setStats(result.data);
        }
        if (resMenu.ok) setMenuItems((await resMenu.json()).data || []);
      } else if (section === "orders") {
        const [resOrders, resCustomers, resMenu] = await Promise.all([
          fetch(`${API_URL}/orders`, { headers }),
          fetch(`${API_URL}/customers`, { headers }),
          fetch(`${API_URL}/menu/admin`, { headers }),
        ]);
        if (resOrders.ok) setOrders((await resOrders.json()).data || []);
        if (resCustomers.ok) setCustomers((await resCustomers.json()).data || []);
        if (resMenu.ok) {
          const menuData = (await resMenu.json()).data || [];
          setMenuItems(menuData);
          if (menuData.length > 0) setOrderSelectedMenuItemId((prev) => prev || menuData[0].id);
        }
      } else if (section === "customers") {
        const res = await fetch(`${API_URL}/customers`, { headers });
        if (res.ok) {
          const result = await res.json();
          setCustomers(result.data || []);
        }
      } else if (section === "deliveries") {
        // Pull the rolling 7-day-ahead window forward before displaying,
        // so newly-due subscription occurrences show up without staff
        // having to wait for some external cron to run.
        await fetch(`${API_URL}/subscriptions/sync-deliveries`, { method: "POST", headers });
        if (deliveryView === "upcoming") {
          const res = await fetch(`${API_URL}/deliveries/upcoming?groupBy=${deliveryGroupBy}`, { headers });
          if (res.ok) setUpcomingGroups((await res.json()).data || []);
        } else {
          const res = await fetch(`${API_URL}/deliveries/unified`, { headers });
          if (res.ok) setDeliveries((await res.json()).data || []);
        }
      } else if (section === "menu") {
        const [resMenu, resCat] = await Promise.all([
          fetch(`${API_URL}/menu/admin`, { headers }),
          fetch(`${API_URL}/categories`),
        ]);
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
        if (res.ok) setMenuItems((await res.json()).data || []);
      } else if (section === "subscriptions") {
        const [resSubs, resCustomers, resMenu] = await Promise.all([
          fetch(`${API_URL}/subscriptions`, { headers }),
          fetch(`${API_URL}/customers`, { headers }),
          fetch(`${API_URL}/menu/admin`, { headers }),
        ]);
        if (resSubs.ok) setSubscriptions((await resSubs.json()).data || []);
        if (resCustomers.ok) setCustomers((await resCustomers.json()).data || []);
        if (resMenu.ok) {
          const menuData = (await resMenu.json()).data || [];
          setMenuItems(menuData);
        }
      } else if (section === "discounts") {
        const res = await fetch(`${API_URL}/discounts`, { headers });
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
  }, [token, section, API_URL, deliveryView, deliveryGroupBy]);

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
  }, [token, section, prepDate, API_URL]);

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
        alert(result.message || "Invalid credentials");
        return;
      }

      const loggedUser = result.data.user;
      if (loggedUser.role === "CUSTOMER") {
        alert("Access Denied: Only admin staff profiles can log in.");
        return;
      }

      setToken(result.data.accessToken);
      setUser(loggedUser);
      localStorage.setItem("fka_token", result.data.accessToken);
      localStorage.setItem("fka_user", JSON.stringify(loggedUser));
    } catch (err) {
      console.error(err);
      alert("Could not connect to authentication server");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fka_token");
    localStorage.removeItem("fka_user");
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Xóa đơn hàng này?")) return;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
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
        alert(error.message || "Failed to save customer");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Xóa khách hàng này? Đơn hàng/gói đăng ký liên quan sẽ không bị xóa.")) return;
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
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
    if (!orderCustomerId) { alert("Vui lòng chọn khách hàng"); return; }
    if (orderLineItems.length === 0) { alert("Vui lòng thêm ít nhất 1 món"); return; }
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
        alert(error.message || "Failed to save order");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Subscription pool builder + schedule/price preview ---
  const addSubPool = () => {
    if (subPoolKg <= 0) return;
    setSubPools((prev) => {
      const existing = prev.find((p) => p.protein === subPoolProtein);
      if (existing) {
        return prev.map((p) => (p.protein === subPoolProtein ? { ...p, kg: p.kg + subPoolKg } : p));
      }
      return [...prev, { protein: subPoolProtein, kg: subPoolKg }];
    });
    setSubPoolKg(10);
  };

  const subTotalGrams = subPools.reduce((sum, p) => sum + p.kg * 1000, 0);
  const subSchedulePreview =
    subTotalGrams > 0 && subDeliveryAmountGrams > 0 && subDeliveryIntervalDays > 0
      ? generateVolumeSchedule(subStartDate, subDeliveryAmountGrams, subDeliveryIntervalDays, subTotalGrams)
      : [];
  const subPricing =
    subPools.length > 0
      ? calculatePoolPricing(
          subPools.map((p) => ({ protein: p.protein, totalGrams: p.kg * 1000 })),
          menuItems.filter((m) => m.isAvailable),
        )
      : null;

  const resetSubForm = () => {
    setSubCustomerId("");
    setSubPackageName("");
    setSubPools([]);
    setSubPoolProtein("CHICKEN");
    setSubPoolKg(10);
    setSubDeliveryAmountGrams(1000);
    setSubDeliveryIntervalDays(1);
    setSubStartDate(getLocalDateString());
    setSubPaymentStatus("UNPAID");
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCustomerId) { alert("Vui lòng chọn khách hàng"); return; }
    if (!subPackageName.trim()) { alert("Vui lòng nhập tên gói"); return; }
    if (subPools.length === 0) { alert("Vui lòng thêm ít nhất 1 loại protein"); return; }
    try {
      const payload = {
        customerId: subCustomerId,
        packageName: subPackageName,
        pools: subPools.map((p) => ({ protein: p.protein, totalGrams: Math.round(p.kg * 1000) })),
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
        alert(error.message || "Failed to create subscription");
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

  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm("Xóa gói đăng ký này? Toàn bộ lịch giao hàng sẽ bị xóa.")) return;
    try {
      const res = await fetch(`${API_URL}/subscriptions/${subId}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
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
        alert(error.message || "Failed to top up pool");
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

  const handleMarkDelivered = async (entry: any) => {
    if (!confirm("Xác nhận đã giao? Số lượng sẽ được trừ vào gói đăng ký.")) return;
    if (entry.source === "ORDER") {
      return handleUpdateUnifiedStatus(entry, "DELIVERED");
    }
    try {
      const res = await fetch(`${API_URL}/deliveries/${entry.id}/deliver`, { method: "POST", headers: authHeaders() });
      if (res.ok) loadData();
      else {
        const error = await res.json();
        alert(error.message || "Failed to mark delivered");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostponeDelivery = async (entry: any) => {
    if (entry.source !== "SUBSCRIPTION") return;
    if (!confirm("Hoãn lần giao này? Toàn bộ lịch còn lại sẽ dời sau một chu kỳ, số lượng được bảo lưu.")) return;
    try {
      const res = await fetch(`${API_URL}/deliveries/${entry.id}/postpone`, { method: "POST", headers: authHeaders() });
      if (res.ok) loadData();
      else {
        const error = await res.json();
        alert(error.message || "Failed to postpone delivery");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDelivery = async (entry: any) => {
    if (entry.source === "ORDER") {
      alert("Xóa đơn hàng lẻ trong tab Orders dispatcher.");
      return;
    }
    if (!confirm("Xóa lần giao này?")) return;
    try {
      const res = await fetch(`${API_URL}/deliveries/${entry.id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
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
        alert(error.message || "Failed to save menu item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Menu Item
  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
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
        alert(error.message || "Failed to adjust stock");
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
        alert(error.message || "Failed to add stock");
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
        alert(error.message || "Failed to create discount code");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;
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
  };

  const formatVND = (num: number) => {
    return `${num.toLocaleString()} ₫`;
  };

  // Shared filter predicate for the Deliveries tab — applies identically to
  // the "Tất cả" (day-grouped) and "Sắp tới" (week/month-grouped) views so
  // filtering doesn't behave differently depending on which grouping mode
  // is active.
  const matchesDeliveryFilters = (d: any): boolean => {
    if (deliverySourceFilter !== "ALL" && d.source !== deliverySourceFilter) return false;
    if (deliveryStatusFilter !== "ALL" && d.status !== deliveryStatusFilter) return false;
    if (deliverySearch.trim() && !d.customerName?.toLowerCase().includes(deliverySearch.trim().toLowerCase())) return false;
    return true;
  };

  // Groups the flat "Tất cả" delivery list by calendar day (local time) so
  // staff can see everything due on a given date at a glance, instead of
  // scrolling one long table — same grouping shape as the "Sắp tới" view's
  // week/month groups, just at day granularity.
  const filteredDeliveriesAll = deliveries.filter(matchesDeliveryFilters);
  const deliveryDayGroups = (() => {
    const map = new Map<string, any[]>();
    for (const d of filteredDeliveriesAll) {
      const key = getLocalDateString(new Date(d.scheduledDate));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries())
      .map(([date, entries]) => ({
        date,
        entries,
        totalGrams: entries.reduce((s, e) => s + (e.totalGrams || 0), 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // oldest day first
  })();

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

        <div className="p-4 border-t border-border mt-auto hidden md:block">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                        value: menuItems.filter((m) => (m.stockQuantity ?? 0) > 0).length,
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
                    <button
                      onClick={() => { resetOrderForm(); setOrderModal("create"); }}
                      className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1 hover:opacity-90 transition-smooth shadow-warm cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Tạo đơn hàng
                    </button>
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

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/50 pb-3">
                            <th className="pb-3 font-semibold">Ngày giao</th>
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
                          {orders
                            .filter((o) => {
                              if (orderViewTab === "completed") return o.deliveryStatus === "DELIVERED";
                              if (orderViewTab === "cancelled") return o.deliveryStatus === "CANCELLED";
                              // "current" = anything not completed/cancelled
                              if (o.deliveryStatus === "DELIVERED" || o.deliveryStatus === "CANCELLED") return false;
                              if (orderStatusFilter !== "ALL" && o.deliveryStatus !== orderStatusFilter) return false;
                              if (orderFulfillmentFilter !== "ALL" && o.fulfillmentType !== orderFulfillmentFilter) return false;
                              if (orderSearch.trim() && !o.customerName?.toLowerCase().includes(orderSearch.trim().toLowerCase())) return false;
                              return true;
                            })
                            .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
                            .map((o) => (
                            <tr
                              key={o.id}
                              onClick={() => setOrderDetailView(o)}
                              className="border-b border-border/20 last:border-0 align-top cursor-pointer hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-4 text-muted-foreground">
                                {new Date(o.deliveryDate).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="py-4">
                                <div className="font-bold">{o.customerName}</div>
                                {o.notes && <div className="text-[10px] text-muted-foreground italic truncate">&quot;{o.notes}&quot;</div>}
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
                          {customers.map((c) => (
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
                          onChange={(e) => setDeliveryGroupBy(e.target.value as "week" | "month")}
                          className="text-[10px] font-bold px-2 py-1.5 rounded-md border border-border bg-background cursor-pointer"
                        >
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
                  </div>

                  {deliveryView === "all" ? (
                    <div className="space-y-6">
                      {deliveryDayGroups.length === 0 ? (
                        <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                          Không có lịch giao nào khớp bộ lọc
                        </div>
                      ) : (
                        deliveryDayGroups.map((group) => (
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
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {upcomingGroups
                        .map((group) => ({ ...group, entries: group.entries.filter(matchesDeliveryFilters) }))
                        .filter((group) => group.entries.length > 0).length === 0 ? (
                        <div className="border border-dashed border-border rounded-lg py-16 text-center text-xs text-muted-foreground">
                          Không có lịch giao nào khớp bộ lọc
                        </div>
                      ) : (
                        upcomingGroups
                          .map((group) => ({ ...group, entries: group.entries.filter(matchesDeliveryFilters) }))
                          .filter((group) => group.entries.length > 0)
                          .map((group) => (
                          <div key={group.key} className="border border-border bg-card rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">{group.key}</h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {group.entries.length} lần giao ·{" "}
                                {formatGrams(group.entries.reduce((s: number, e: any) => s + (e.totalGrams || 0), 0))}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {group.entries.map((d: any) => (
                                <div
                                  key={`${d.source}-${d.id}`}
                                  className="flex items-center justify-between text-xs py-2 border-b border-border/20 last:border-0"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-muted-foreground font-mono shrink-0">
                                      {new Date(d.scheduledDate).toLocaleDateString("vi-VN")}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                        d.source === "SUBSCRIPTION"
                                          ? "bg-primary/10 text-primary border-primary/20"
                                          : "bg-muted text-muted-foreground border-border"
                                      }`}
                                    >
                                      {d.source === "SUBSCRIPTION" ? "Gói" : "Đơn"}
                                    </span>
                                    <span className="font-bold truncate">{d.customerName}</span>
                                  </div>
                                  <span className="font-mono text-muted-foreground shrink-0">{formatGrams(d.totalGrams)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
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
                          {dishes.map((dish) => {
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
                                      {items.map((item) => (
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
                    {subscriptions.map((sub) => {
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
                          {discounts.map((d) => (
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
                  Khối lượng mua theo protein (kg)
                </label>
                <div className="flex gap-2">
                  <select
                    value={subPoolProtein}
                    onChange={(e) => setSubPoolProtein(e.target.value as Protein)}
                    className="flex-1 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
                    {PROTEIN_OPTIONS.map((p) => (
                      <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={subPoolKg}
                    onChange={(e) => setSubPoolKg(Number(e.target.value))}
                    className="w-24 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSubPool}
                    className="bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold px-4 rounded-lg border border-border cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>

                {subPools.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {subPools.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs items-center">
                        <span>{PROTEIN_LABELS[p.protein]} — {p.kg}kg</span>
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

                {subPricing && subPricing.missingProteins.length > 0 && (
                  <p className="text-[11px] text-red-500">
                    Chưa có món khả dụng cho: {subPricing.missingProteins.join(", ")}
                  </p>
                )}
                {subPricing && subPricing.missingProteins.length === 0 && subPools.length > 0 && (
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
    </div>
  );
}
