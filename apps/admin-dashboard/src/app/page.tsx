"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faShoppingBag,
  faSignOutAlt,
  faUtensils,
  faPlus,
  faTrashAlt,
  faEdit,
  faCalendarAlt,
  faTag,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATE_OPTIONS,
} from "@fortifykitchen/shared";
import type { Protein, CustomPlanRequestStatus, OrderStatus } from "@fortifykitchen/types";
import { useToast } from "@fortifykitchen/ui";

import DashboardSection from "@/features/dashboard/DashboardSection";
import OrdersSection from "@/features/orders/OrdersSection";
import MenuSection from "@/features/menu/MenuSection";
import InventorySection from "@/features/inventory/InventorySection";
import SubscriptionsSection from "@/features/subscriptions/SubscriptionsSection";
import CustomPlanRequestsSection from "@/features/custom-plan-requests/CustomPlanRequestsSection";
import PrepListSection from "@/features/prep-list/PrepListSection";
import CustomersSection from "@/features/customers/CustomersSection";
import DiscountsSection from "@/features/discounts/DiscountsSection";
import SubscriptionPlansSection from "@/features/subscription-plans/SubscriptionPlansSection";
import HomeFramesSection from "@/features/home-frames/HomeFramesSection";

// Unified Shopee-style order status — shared by one-off orders and
// subscription-generated orders alike (see OrderStatus in
// @fortifykitchen/types). ORDER_STATUS_LABELS (imported above from
// packages/shared) has the Vietnamese display strings for each.

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
  const [lang, setLang] = React.useState<"vi" | "en">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("fortifykitchen_admin_lang") as "vi" | "en") || "vi";
    }
    return "vi";
  });
  const [activeGroup, setActiveGroup] = React.useState<
    "operations" | "sales" | "products" | "subscriptions" | "marketing"
  >("operations");
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fortifykitchen_admin_lang", lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const NAVIGATION_GROUPS = React.useMemo(() => [
    { id: "operations", label: lang === "vi" ? "Vận hành" : "Operations", icon: faThLarge, defaultSection: "dashboard" },
    { id: "sales", label: lang === "vi" ? "Doanh thu & Khách" : "Sales & Customers", icon: faShoppingBag, defaultSection: "orders" },
    { id: "products", label: lang === "vi" ? "Thực đơn & Kho" : "Catalog & Stock", icon: faUtensils, defaultSection: "menu" },
    { id: "subscriptions", label: lang === "vi" ? "Gói hội viên" : "Membership Subs", icon: faCalendarAlt, defaultSection: "subscriptions" },
    { id: "marketing", label: lang === "vi" ? "Tiếp thị & Banner" : "Marketing & Ads", icon: faTag, defaultSection: "discounts" },
  ], [lang]);

  const SUB_TABS = React.useMemo(() => ({
    operations: [
      { id: "dashboard", label: lang === "vi" ? "Tổng quan" : "Dashboard Overview" },
      { id: "prep-list", label: lang === "vi" ? "Danh sách chuẩn bị" : "Prep List" },
    ],
    sales: [
      { id: "orders", label: lang === "vi" ? "Điều phối đơn hàng" : "Orders dispatcher" },
      { id: "customers", label: lang === "vi" ? "Khách hàng" : "Customers" },
    ],
    products: [
      { id: "menu", label: lang === "vi" ? "Quản lý thực đơn" : "Menu Catalog Manager" },
      { id: "inventory", label: lang === "vi" ? "Kho hàng" : "Inventory" },
    ],
    subscriptions: [
      { id: "subscriptions", label: lang === "vi" ? "Gói đăng ký" : "Subscriptions" },
      { id: "custom-plan-requests", label: lang === "vi" ? "Yêu cầu gói tùy chỉnh" : "Custom Plan Requests" },
      { id: "subscription-plans", label: lang === "vi" ? "Cấu hình gói dịch vụ" : "Subscription Plans" },
    ],
    marketing: [
      { id: "discounts", label: lang === "vi" ? "Mã khuyến mãi" : "Promotional Codes" },
      { id: "home-frames", label: lang === "vi" ? "Banner trang chủ" : "Home Banners" },
    ],
  }), [lang]);

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

  const getSectionLabel = React.useCallback(() => {
    for (const group of Object.values(SUB_TABS)) {
      const match = group.find((tab) => tab.id === section);
      if (match) return match.label;
    }
    return section.replace("-", " ");
  }, [section, SUB_TABS]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

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
  const [customPlanRequests, setCustomPlanRequests] = React.useState<any[]>([]);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [discounts, setDiscounts] = React.useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = React.useState<any[]>([]);
  const [pendingTopUps, setPendingTopUps] = React.useState<any[]>([]);
  const [lowBalance, setLowBalance] = React.useState<any>({ poolsLow: [], walletsLow: [], totalCount: 0 });
  const [homeFrames, setHomeFrames] = React.useState<any[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = React.useState(false);

  // Confirmation dialog
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

  const checkOffline = React.useCallback((responses: (any)[]) => {
    const offline = responses.some((r) => r === null);
    setIsOffline(offline);
    return offline;
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data needed by feature components
      const [
        resStats, resOrders, resCustomers, resMenu, resCategories,
        resSubs, resCustomPlans, resDiscounts, resSubPlans, resPending, resHomeFrames, resLowBalance
      ] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }).catch(() => null),
        fetch(`${API_URL}/orders`, { headers }).catch(() => null),
        fetch(`${API_URL}/customers`, { headers }).catch(() => null),
        fetch(`${API_URL}/menu/admin`, { headers }).catch(() => null),
        fetch(`${API_URL}/categories`).catch(() => null),
        fetch(`${API_URL}/subscriptions`, { headers }).catch(() => null),
        fetch(`${API_URL}/custom-plan-requests`, { headers }).catch(() => null),
        fetch(`${API_URL}/discounts`, { headers }).catch(() => null),
        fetch(`${API_URL}/subscription-plans`, { headers }).catch(() => null),
        fetch(`${API_URL}/subscription-plan-purchases/pending`, { headers }).catch(() => null),
        fetch(`${API_URL}/home-frames/admin`, { headers }).catch(() => null),
        fetch(`${API_URL}/notifications/low-balance`, { headers }).catch(() => null),
      ]);

      if (checkOffline([resStats, resOrders, resCustomers, resMenu, resCategories, resSubs, resCustomPlans, resDiscounts, resSubPlans, resPending, resHomeFrames, resLowBalance])) return;
      if (handleUnauthorized([resStats, resOrders, resCustomers, resMenu, resCategories, resSubs, resCustomPlans, resDiscounts, resSubPlans, resPending, resHomeFrames, resLowBalance])) return;

      if (resStats && resStats.ok) {
        const result = await resStats.json();
        setStats(result.data);
      }
      if (resOrders && resOrders.ok) setOrders((await resOrders.json()).data || []);
      if (resCustomers && resCustomers.ok) setCustomers((await resCustomers.json()).data || []);
      if (resMenu && resMenu.ok) setMenuItems((await resMenu.json()).data || []);
      if (resCategories && resCategories.ok) setCategories((await resCategories.json()).data || []);
      if (resSubs && resSubs.ok) setSubscriptions((await resSubs.json()).data || []);
      if (resCustomPlans && resCustomPlans.ok) setCustomPlanRequests((await resCustomPlans.json()).data || []);
      if (resDiscounts && resDiscounts.ok) setDiscounts((await resDiscounts.json()).data || []);
      if (resSubPlans && resSubPlans.ok) setSubscriptionPlans((await resSubPlans.json()).data || []);
      if (resPending && resPending.ok) setPendingTopUps((await resPending.json()).data || []);
      if (resHomeFrames && resHomeFrames.ok) setHomeFrames((await resHomeFrames.json()).data || []);
      if (resLowBalance && resLowBalance.ok) {
        const result = await resLowBalance.json();
        setLowBalance(result.data || { poolsLow: [], walletsLow: [], totalCount: 0 });
      }
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL, handleUnauthorized, checkOffline]);

  // Push Notification & Polling states
  const prevOrdersCount = React.useRef<number | null>(null);
  const prevPendingTopUpsCount = React.useRef<number | null>(null);
  const prevCustomRequestsCount = React.useRef<number | null>(null);

  const triggerPushNotification = React.useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
      try {
        new window.Notification(title, {
          body,
          icon: "/logo.png"
        });
      } catch (err) {
        console.error("Failed to trigger Notification API:", err);
      }
    }
  }, []);

  // Request browser notification permission
  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (window.Notification.permission === "default") {
        window.Notification.requestPermission();
      }
    }
  }, []);

  // Polling loop: silently reload data in background every 20 seconds
  React.useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => {
      loadData();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [token, loadData]);

  // Change detectors to push alerts on new entries
  React.useEffect(() => {
    if (prevOrdersCount.current !== null && orders.length > prevOrdersCount.current) {
      triggerPushNotification(
        lang === "vi" ? "Đơn hàng mới!" : "New Order!",
        lang === "vi" ? `Hệ thống vừa nhận thêm đơn hàng mới.` : `A new order has been received.`
      );
    }
    prevOrdersCount.current = orders.length;
  }, [orders.length, lang, triggerPushNotification]);

  React.useEffect(() => {
    if (prevPendingTopUpsCount.current !== null && pendingTopUps.length > prevPendingTopUpsCount.current) {
      triggerPushNotification(
        lang === "vi" ? "Yêu cầu nạp ví mới!" : "New Wallet Top-Up!",
        lang === "vi" ? `Có giao dịch chuyển khoản chờ xác nhận.` : `A new bank transfer requires confirmation.`
      );
    }
    prevPendingTopUpsCount.current = pendingTopUps.length;
  }, [pendingTopUps.length, lang, triggerPushNotification]);

  React.useEffect(() => {
    if (prevCustomRequestsCount.current !== null && customPlanRequests.length > prevCustomRequestsCount.current) {
      triggerPushNotification(
        lang === "vi" ? "Yêu cầu gói tùy chọn mới!" : "New Custom Plan Request!",
        lang === "vi" ? `Có yêu cầu thiết kế gói ăn mới từ khách hàng.` : `A customer submitted a custom plate request.`
      );
    }
    prevCustomRequestsCount.current = customPlanRequests.length;
  }, [customPlanRequests.length, lang, triggerPushNotification]);

  // Fetch data when authenticated or section changes
  React.useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, section, loadData]);

  // Prep List: refetches on its own whenever the section is active or the
  // selected date changes (a second dimension loadData() doesn't handle).
  React.useEffect(() => {
    // PrepListSection manages its own data fetching
  }, []);

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
          description: discountDescription.trim() || undefined,
          usageLimit: discountUsageLimit.trim() ? Number(discountUsageLimit) : undefined,
        }),
      });

      if (res.ok) {
        setDiscountCode("");
        setDiscountAmount(10);
        setDiscountDescription("");
        setDiscountUsageLimit("");
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
  const oneOffOrders = orders.filter((o) => o.source !== "SUBSCRIPTION");
  // Count per status for the tab badges (over all one-off orders).
  const orderStatusCounts = ORDER_STATUS_OPTIONS.reduce(
    (acc, s) => ({ ...acc, [s]: oneOffOrders.filter((o) => o.status === s).length }),
    {} as Record<string, number>,
  );
  // One tab per status is the primary filter — an order jumps to its status's
  // tab the instant staff advance it (handleUpdateOrderStatus refetches).
  const filteredOrders = oneOffOrders
    .filter((o) => {
      if (orderViewTab !== "ALL" && o.status !== orderViewTab) return false;
      if (orderFulfillmentFilter !== "ALL" && o.fulfillmentType !== orderFulfillmentFilter) return false;
      if (orderSearch.trim() && !o.customerName?.toLowerCase().includes(orderSearch.trim().toLowerCase())) return false;
      // Optional secondary date narrowing (off by default): "upcoming" hides
      // today; a typed date matches that calendar day only.
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
  const subOrderStatusCounts = ORDER_STATUS_OPTIONS.reduce(
    (acc, s) => ({ ...acc, [s]: subscriptionOrders.filter((o) => o.status === s).length }),
    {} as Record<string, number>,
  );
  const filteredSubscriptionOrders = subscriptionOrders
    .filter((d) => {
      if (subOrderViewTab !== "ALL" && d.status !== subOrderViewTab) return false;
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
              {getSectionLabel()}
            </h2>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={() => setLang((l) => (l === "vi" ? "en" : "vi"))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-[10px] font-bold bg-muted/40 hover:bg-muted transition-colors cursor-pointer select-none"
          >
            <span className={lang === "vi" ? "text-primary" : "text-muted-foreground"}>VI</span>
            <span className="text-border">|</span>
            <span className={lang === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
          </button>
        </header>

        {/* Offline notification banner */}
        {isOffline && (
          <div className="bg-destructive/15 border-b border-destructive/20 text-destructive text-xs py-2 px-6 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200 shrink-0">
            <span className="font-semibold">
              {lang === "vi" ? "Không thể kết nối đến máy chủ. Đang thử kết nối lại..." : "Cannot connect to server. Retrying connection..."}
            </span>
            <button
              onClick={() => loadData()}
              className="underline hover:text-destructive/80 font-bold cursor-pointer"
            >
              {lang === "vi" ? "Thử lại ngay" : "Retry now"}
            </button>
          </div>
        )}

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
                <DashboardSection
                  lang={lang}
                  stats={stats}
                  menuItems={menuItems}
                  lowBalance={lowBalance}
                  formatVND={formatVND}
                  setSection={setSection}
                />
              )}

{/* SECTION B: ORDERS DISPATCHER */}
              {section === "orders" && (
                <OrdersSection
                  token={token}
                  API_URL={API_URL}
                  orders={orders}
                  customers={customers}
                  menuItems={menuItems}
                  categories={categories}
                  lang={lang}
                  section={section}
                  setOrders={setOrders}
                  setCustomers={setCustomers}
                  setMenuItems={setMenuItems}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                  requestConfirm={requestConfirm}
                  toast={toast}
                />
              )}

{/* SECTION: CUSTOMERS */}
              {section === "customers" && (
                <CustomersSection
                  customers={customers}
                  customersPage={customersPage}
                  setCustomersPage={setCustomersPage}
                  resetCustomerForm={resetCustomerForm}
                  setCustomerModal={setCustomerModal}
                  handleEditCustomerTrigger={handleEditCustomerTrigger}
                  handleDeleteCustomer={handleDeleteCustomer}
                  lang={lang}
                  section={section}
                  formatVND={formatVND}
                />
              )}

              {/* SECTION C: MENU CATALOG MANAGER */}
              {section === "menu" && (
                <MenuSection
                  token={token}
                  API_URL={API_URL}
                  menuItems={menuItems}
                  categories={categories}
                  lang={lang}
                  section={section}
                  setMenuItems={setMenuItems}
                  setCategories={setCategories}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                  requestConfirm={requestConfirm}
                />
              )}

              {/* SECTION C.5: INVENTORY — two sub-tabs: Monitor (what's
                  currently in stock — no status indicator needed, being
                  listed here already means available) and Add Stock
                  (restocking a dish is what makes it available; see the
                  isAvailable-forcing rule in MenuService). Separate from
                  the Menu Catalog Manager's protein-grouped edit view. */}
              {section === "inventory" && (
                <InventorySection
                  menuItems={menuItems}
                  inventorySubTab={inventorySubTab}
                  setInventorySubTab={setInventorySubTab}
                  inventorySort={inventorySort}
                  setInventorySort={setInventorySort}
                  inventoryPageByProtein={inventoryPageByProtein}
                  setInventoryPageByProtein={setInventoryPageByProtein}
                  addStockItemId={addStockItemId}
                  setAddStockItemId={setAddStockItemId}
                  addStockQty={addStockQty}
                  setAddStockQty={setAddStockQty}
                  isAddingStock={isAddingStock}
                  adjustingStockId={adjustingStockId}
                  setAdjustingStockId={setAdjustingStockId}
                  handleAdjustStock={handleAdjustStock}
                  handleAddStock={handleAddStock}
                  lang={lang}
                  token={token}
                  API_URL={API_URL}
                />
              )}

              {/* SECTION D: SUBSCRIBER DIRECTORY */}
              {section === "subscriptions" && (
                <SubscriptionsSection
                  token={token}
                  API_URL={API_URL}
                  subscriptions={subscriptions}
                  customers={customers}
                  menuItems={menuItems}
                  lang={lang}
                  section={section}
                  setSubscriptions={setSubscriptions}
                  setCustomers={setCustomers}
                  setMenuItems={setMenuItems}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                  requestConfirm={requestConfirm}
                />
              )}

{/* SECTION: CUSTOM PLAN REQUESTS — customer-submitted asks for
                  a plan outside the standard catalog, always starting as a
                  consultation request (never a self-serve Subscription).
                  Staff review here, annotate, and either build a matching
                  Subscription ("Tạo gói từ yêu cầu này" → pre-fills the
                  Subscription form above and links back on save) or
                  decline. */}
              {section === "custom-plan-requests" && (
                <CustomPlanRequestsSection
                  token={token}
                  API_URL={API_URL}
                  customPlanRequests={customPlanRequests}
                  customers={customers}
                  menuItems={menuItems}
                  lang={lang}
                  section={section}
                  setCustomPlanRequests={setCustomPlanRequests}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                  requestConfirm={requestConfirm}
                />
              )}

{/* SECTION: PREP LIST */}
              {section === "prep-list" && (
                <PrepListSection
                  token={token}
                  API_URL={API_URL}
                  prepDate={prepDate}
                  setPrepDate={setPrepDate}
                  prepData={prepData}
                  isPrepLoading={isPrepLoading}
                  prepError={prepError}
                  lang={lang}
                  section={section}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                />
              )}

              {/* SECTION E: PROMOTIONAL CODES */}
              {section === "discounts" && (
                <DiscountsSection
                  token={token}
                  API_URL={API_URL}
                  discounts={discounts}
                  lang={lang}
                  section={section}
                  setDiscounts={setDiscounts}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                  requestConfirm={requestConfirm}
                />
              )}

              {/* SECTION F: SUBSCRIPTION PLANS (wallet top-up catalog + pending queue) */}
              {section === "subscription-plans" && (
                <SubscriptionPlansSection
                  token={token}
                  API_URL={API_URL}
                  subscriptionPlans={subscriptionPlans}
                  pendingTopUps={pendingTopUps}
                  lang={lang}
                  section={section}
                  setSubscriptionPlans={setSubscriptionPlans}
                  setPendingTopUps={setPendingTopUps}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                  requestConfirm={requestConfirm}
                />
              )}

{/* HOME FRAMES MANAGER */}
              {section === "home-frames" && (
                <HomeFramesSection
                  token={token}
                  API_URL={API_URL}
                  homeFrames={homeFrames}
                  lang={lang}
section={section}
                  setHomeFrames={setHomeFrames}
                  loadData={loadData}
                  handleUnauthorized={handleUnauthorized}
                  checkOffline={checkOffline}
                  requestConfirm={requestConfirm}
                />
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
              {orderDetailView.type && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
                  {orderDetailView.type === "IMMEDIATE_DELIVERY" ? "Giao ngay" : "Pre-order"}
                </span>
              )}
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

            {orderDetailView.systemNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold mb-0.5">Lưu ý hệ thống:</p>
                <p>{orderDetailView.systemNotes}</p>
              </div>
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
