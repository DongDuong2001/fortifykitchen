"use client";

import * as React from "react";
import { useApp } from "../providers/app-context";
import { useToast } from "@fortifykitchen/ui";
import { MenuItem, Protein } from "@fortifykitchen/types";
import { getMenuItemLabel, PROTEIN_LABELS } from "@fortifykitchen/shared";
import {
  ShoppingBag,
  User as UserIcon,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  Truck,
  Utensils,
  Info,
  Lock,
  LogOut,
  Sparkles,
  MapPin,
  Tag,
  CreditCard,
  Check,
  Search,
  CalendarClock,
} from "lucide-react";
import { formatGrams } from "@fortifykitchen/shared";

// Order status labels for the customer-facing "Track my order" lookup —
// same underlying DeliveryStatus enum the admin Orders tab uses
// (SCHEDULED/PREPPING/DELIVERED/SKIPPED/CANCELLED), just worded for a
// customer audience in Vietnamese.
const ORDER_STATUS_LABELS_VI: Record<string, string> = {
  SCHEDULED: "Đã đặt",
  PREPPING: "Đang chuẩn bị",
  DELIVERED: "Hoàn thành",
  SKIPPED: "Đã bỏ qua",
  CANCELLED: "Đã huỷ",
};

export default function CustomerPortal() {
  const {
    user,
    cart,
    cartCount,
    cartTotal,
    isCartOpen,
    setCartOpen,
    login,
    signup,
    logout,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    placeOrder,
  } = useApp();
  const { toast } = useToast();

  // In-app replacement for window.confirm — used for the one destructive
  // customer-facing action (postponing a subscription delivery) instead of
  // a native browser dialog.
  const [confirmState, setConfirmState] = React.useState<{
    title?: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = React.useCallback(
    (message: string, onConfirm: () => void, opts?: { title?: string; confirmLabel?: string }) => {
      setConfirmState({ message, onConfirm, title: opts?.title, confirmLabel: opts?.confirmLabel });
    },
    [],
  );

  // Tab State: "menu" | "order-now" | "subscriptions" | "dashboard"
  const [activeTab, setActiveTab] = React.useState<"menu" | "order-now" | "subscriptions" | "dashboard">("menu");

  // "Order Now" — in-stock items only, ready today with no login required.
  // This is a separate, self-contained flow from the regular cart/checkout
  // above (which requires an account) since in-stock orders should be as
  // frictionless as possible: just name + phone + address, like the
  // subscription phone-lookup view. Server still re-verifies stock and
  // decides IMMEDIATE vs SCHEDULED — this is just what the UI shows before
  // submitting.
  const [orderNowCart, setOrderNowCart] = React.useState<{ menuItem: MenuItem; qty: number }[]>([]);
  const [orderNowName, setOrderNowName] = React.useState("");
  const [orderNowPhone, setOrderNowPhone] = React.useState("");
  const [orderNowAddress, setOrderNowAddress] = React.useState("");
  const [orderNowNotes, setOrderNowNotes] = React.useState("");
  const [isSubmittingOrderNow, setIsSubmittingOrderNow] = React.useState(false);
  const [orderNowResult, setOrderNowResult] = React.useState<any | null>(null);
  const [orderNowError, setOrderNowError] = React.useState<string | null>(null);

  // "Track my order" — self-serve status check by phone number, the
  // customer-facing counterpart to the admin's Accept/Complete workflow.
  // There's no SMS/push notification service connected yet, so this lookup
  // is how a customer finds out their order moved to "Đang chuẩn bị" or
  // "Hoàn thành" rather than a message arriving automatically.
  const [trackPhone, setTrackPhone] = React.useState("");
  const [trackedOrders, setTrackedOrders] = React.useState<any[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = React.useState(false);
  const [trackingError, setTrackingError] = React.useState<string | null>(null);
  const [hasTracked, setHasTracked] = React.useState(false);

  // My Subscription (volume-based) lookup state — subscriptions are set up
  // by staff (see /subscriptions being ADMIN/MANAGER/STAFF-only), so
  // there's no self-checkout here yet. This is a read + postpone view keyed
  // off the phone number staff already have on file, since there's no
  // customer login system wired to the new backend.
  const [lookupPhone, setLookupPhone] = React.useState("");
  const [myPoolSubscriptions, setMyPoolSubscriptions] = React.useState<any[]>([]);
  const [isLookupLoading, setIsLookupLoading] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [hasLookedUp, setHasLookedUp] = React.useState(false);

  // Auth Modals State
  const [authModal, setAuthModal] = React.useState<"login" | "signup" | null>(null);
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPass, setLoginPass] = React.useState("");

  // Signup fields
  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPass, setSignupPass] = React.useState("");
  const [signupFirst, setSignupFirst] = React.useState("");
  const [signupLast, setSignupLast] = React.useState("");
  const [signupPhone, setSignupPhone] = React.useState("");
  const [signupAddress, setSignupAddress] = React.useState("");
  const signupCity = "Ho Chi Minh City";

  // Checkout Form State
  const [checkoutAddress, setCheckoutAddress] = React.useState("");
  const [checkoutNotes, setCheckoutNotes] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH_ON_DELIVERY");
  const [discountCode, setDiscountCode] = React.useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);

  // Menu Catalog State
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [selectedProtein, setSelectedProtein] = React.useState<Protein | "">("");
  const [isLoadingMenu, setIsLoadingMenu] = React.useState(true);

  // User Dashboard State
  const [myOrders, setMyOrders] = React.useState<any[]>([]);
  const [mySubscriptions, setMySubscriptions] = React.useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = React.useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch Menu on load
  React.useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoadingMenu(true);
        const resMenu = await fetch(`${API_URL}/menu`);
        if (resMenu.ok) {
          const menuData = await resMenu.json();
          setMenuItems(menuData.data || []);
        }
      } catch (err) {
        console.error("Failed to load menu catalog", err);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadCatalog();
  }, [API_URL]);

  // Sync checkout address when user logs in
  React.useEffect(() => {
    if (user) {
      // Fetch customer profile
      fetch(`${API_URL}/customers/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("fk_token")}` },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) {
            setCheckoutAddress(result.data.address);
          }
        })
        .catch(console.error);
    }
  }, [user, API_URL]);

  const loadDashboard = React.useCallback(async () => {
    try {
      setIsLoadingDashboard(true);
      const token = localStorage.getItem("fk_token");
      const [resOrders, resSubs] = await Promise.all([
        fetch(`${API_URL}/orders/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/subscriptions/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resOrders.ok && resSubs.ok) {
        const orderData = await resOrders.json();
        const subsData = await resSubs.json();
        setMyOrders(orderData.data || []);
        setMySubscriptions(subsData.data || []);
      }
    } catch (e) {
      console.error("Error loading dashboard", e);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [API_URL]);

  // Load dashboard data when activeTab becomes dashboard
  React.useEffect(() => {
    if (activeTab === "dashboard" && user) {
      loadDashboard();
    }
  }, [activeTab, user, loadDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPass);
    if (success) {
      setAuthModal(null);
      setLoginEmail("");
      setLoginPass("");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signup({
      email: signupEmail,
      password: signupPass,
      firstName: signupFirst,
      lastName: signupLast,
      phone: signupPhone,
      address: signupAddress,
      city: signupCity,
      postalCode: "70000",
    });
    if (success) {
      setAuthModal(null);
      setSignupEmail("");
      setSignupPass("");
      setSignupFirst("");
      setSignupLast("");
      setSignupPhone("");
      setSignupAddress("");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModal("login");
      return;
    }
    setIsSubmittingOrder(true);
    const result = await placeOrder(checkoutAddress, paymentMethod, checkoutNotes, discountCode);
    setIsSubmittingOrder(false);
    if (result) {
      setCartOpen(false);
      setActiveTab("dashboard");
    }
  };

  // Volume subscriptions are set up by staff (see the admin dashboard's
  // Subscriptions tab) — there's no self-checkout for a brand new
  // subscription here yet. This looks up existing ones by phone number
  // (no customer login system exists on the new backend) so a customer can
  // check their remaining balance and postpone today's delivery themselves.
  const handleLookupSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;
    setIsLookupLoading(true);
    setLookupError(null);
    setHasLookedUp(true);
    try {
      const res = await fetch(`${API_URL}/subscriptions/public?phone=${encodeURIComponent(lookupPhone.trim())}`);
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setMyPoolSubscriptions(result?.data || []);
      } else {
        setLookupError(result?.message || "Không thể tra cứu lúc này");
        setMyPoolSubscriptions([]);
      }
    } catch (err) {
      console.error(err);
      setLookupError("Lỗi kết nối — vui lòng thử lại");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handlePostponeMyDelivery = (deliveryId: string) => {
    requestConfirm(
      "Hoãn lần giao này? Số lượng sẽ được bảo lưu, lịch giao sau đó sẽ dời lại một chu kỳ.",
      async () => {
        try {
          const res = await fetch(
            `${API_URL}/subscriptions/public/${deliveryId}/postpone?phone=${encodeURIComponent(lookupPhone.trim())}`,
            { method: "POST" },
          );
          if (res.ok) {
            handleLookupSubscription({ preventDefault: () => {} } as React.FormEvent);
          } else {
            const result = await res.json().catch(() => null);
            toast({ title: result?.message || "Không thể hoãn lần giao này", type: "error" });
          }
        } catch (err) {
          console.error(err);
        }
      },
    );
  };

  const handlePauseSubscription = async (id: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem("fk_token");
      const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const res = await fetch(`${API_URL}/subscriptions/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadDashboard();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatVND = (num: number) => {
    return `${num.toLocaleString()} ₫`;
  };

  // Items with live stock ready right now — the storefront's Order Now tab
  // only ever shows these, so a normal Order Now checkout should always
  // resolve IMMEDIATE server-side (barring a stock race with another
  // customer, which the server handles by falling back to SCHEDULED).
  const readyNowItems = menuItems.filter((m) => (m.stockQuantity ?? 0) > 0);

  const addToOrderNowCart = (item: MenuItem) => {
    setOrderNowCart((prev) => {
      const maxQty = item.stockQuantity ?? 0;
      const idx = prev.findIndex((l) => l.menuItem.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: Math.min(updated[idx].qty + 1, maxQty) };
        return updated;
      }
      return [...prev, { menuItem: item, qty: Math.min(1, maxQty) }];
    });
  };

  const updateOrderNowQty = (itemId: string, qty: number) => {
    setOrderNowCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.menuItem.id !== itemId);
      return prev.map((l) => (l.menuItem.id === itemId ? { ...l, qty } : l));
    });
  };

  const orderNowTotal = orderNowCart.reduce((s, l) => s + l.menuItem.price * l.qty, 0);

  const handleSubmitOrderNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNowCart.length === 0 || !orderNowName.trim() || !orderNowPhone.trim()) return;
    setIsSubmittingOrderNow(true);
    setOrderNowError(null);
    try {
      const res = await fetch(`${API_URL}/orders/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orderNowName.trim(),
          phone: orderNowPhone.trim(),
          address: orderNowAddress.trim() || undefined,
          notes: orderNowNotes.trim() || undefined,
          items: orderNowCart.map((l) => ({ menuItemId: l.menuItem.id, qty: l.qty })),
        }),
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setOrderNowResult(result.data);
        setOrderNowCart([]);
      } else {
        setOrderNowError(result?.message || "Không thể đặt hàng lúc này");
      }
    } catch (err) {
      console.error(err);
      setOrderNowError("Lỗi kết nối — vui lòng thử lại");
    } finally {
      setIsSubmittingOrderNow(false);
    }
  };

  const handleTrackOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackPhone.trim()) return;
    setIsTrackingLoading(true);
    setTrackingError(null);
    setHasTracked(true);
    try {
      const res = await fetch(`${API_URL}/orders/public?phone=${encodeURIComponent(trackPhone.trim())}`);
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setTrackedOrders(result?.data || []);
      } else {
        setTrackingError(result?.message || "Không thể tra cứu lúc này");
        setTrackedOrders([]);
      }
    } catch (err) {
      console.error(err);
      setTrackingError("Lỗi kết nối — vui lòng thử lại");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const filteredMenu = selectedProtein
    ? menuItems.filter((item) => item.protein === selectedProtein)
    : menuItems;

  const proteinsPresent = (Object.keys(PROTEIN_LABELS) as Protein[]).filter((p) =>
    menuItems.some((item) => item.protein === p)
  );

  // Groups same-flavor menu items (e.g. "Gà xá xíu 150g" + "Gà xá xíu 250g")
  // into one dish card with a portion-size toggle, instead of listing each
  // size as its own separate card. `sizeFilter` lets a caller (Order Now)
  // restrict which underlying MenuItems count toward a group, e.g. only
  // ones currently in stock.
  function groupByFlavor(items: MenuItem[]) {
    const map = new Map<string, { protein: Protein; flavor: string; sizes: MenuItem[] }>();
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

  // Which size (menuItemId) is currently selected per dish group, keyed by
  // "protein::flavor" — defaults to the smallest available size when unset.
  const [selectedSizeByDish, setSelectedSizeByDish] = React.useState<Record<string, string>>({});

  function getSelectedSize(dish: { protein: Protein; flavor: string; sizes: MenuItem[] }): MenuItem {
    const key = `${dish.protein}::${dish.flavor}`;
    const selectedId = selectedSizeByDish[key];
    return dish.sizes.find((s) => s.id === selectedId) ?? dish.sizes[0];
  }

  const groupedMenu = proteinsPresent
    .filter((p) => !selectedProtein || p === selectedProtein)
    .map((protein) => ({
      protein,
      dishes: groupByFlavor(filteredMenu.filter((item) => item.protein === protein)),
    }));

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("menu")}>
            <img src="/logo.png" alt="Fortify Kitchen" className="h-10 w-10 rounded-md object-contain" />
            <span className="text-xl font-bold tracking-tight font-heading">
              Fortify<span className="text-primary">Kitchen</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => setActiveTab("menu")}
              className={`hover:text-primary transition-colors py-2 relative ${
                activeTab === "menu" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              Browse Menu
            </button>
            <button
              onClick={() => setActiveTab("order-now")}
              className={`hover:text-primary transition-colors py-2 relative ${
                activeTab === "order-now" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              Order Now
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`hover:text-primary transition-colors py-2 relative ${
                activeTab === "subscriptions" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              Meal Subscriptions
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`hover:text-primary transition-colors py-2 relative ${
                  activeTab === "dashboard" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                }`}
              >
                My Dashboard
              </button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full border border-border bg-muted/30 hover:bg-muted transition-all cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div
                  onClick={() => setActiveTab("dashboard")}
                  className="hidden sm:flex items-center gap-2 cursor-pointer border border-border rounded-full py-1.5 px-3 bg-muted/20 hover:bg-muted/50 transition-all"
                >
                  <UserIcon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">{user.firstName}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-full border border-border bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModal("login")}
                className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-5 rounded-full hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="h-4 w-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      {activeTab !== "dashboard" && (
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-border bg-secondary/20">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full border border-border bg-muted/40 text-xs text-primary font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Vietnam&apos;s Premium Meal Delivery & Subscription
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight">
                Fuel Your Body with <span className="text-primary">Gourmet Nutrition</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                Expertly crafted organic salads, high-protein bowls, and fresh cold-pressed juices delivered straight to your door in Ho Chi Minh City. Pay easily via **Cash on Delivery (COD)**.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-md hover:bg-primary/90 transition-all cursor-pointer text-sm"
                >
                  Explore Menu
                </button>
                <button
                  onClick={() => setActiveTab("subscriptions")}
                  className="border border-border bg-muted/20 hover:bg-muted font-semibold px-8 py-3.5 rounded-md transition-all cursor-pointer text-sm"
                >
                  Meal Subscription plans
                </button>
              </div>
            </div>
            <div className="relative h-80 sm:h-96 w-full rounded-2xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center shadow-xl">
              <div className="absolute inset-0 bg-primary/5" />
              <div className="text-center space-y-2 p-8 z-10">
                <Utensils className="h-16 w-16 text-primary mx-auto opacity-70 animate-bounce" />
                <h3 className="text-lg font-bold font-heading">Clean & Fresh Ingredients Only</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Every meal is vacuum-packed and chilled to preserve high nutrient profiles.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. MAIN CONTENTS */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* TAB 1: MENU CATALOG */}
        {activeTab === "menu" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                  Browse Fresh Dishes
                </h2>
                <p className="text-sm text-muted-foreground">
                  Order healthy individual dishes delivered in under 45 minutes
                </p>
              </div>

              {/* Protein Filter */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setSelectedProtein("")}
                  className={`px-4 py-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                    selectedProtein === ""
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted/40 border-border hover:bg-muted"
                  }`}
                >
                  All Items
                </button>
                {proteinsPresent.map((protein) => (
                  <button
                    key={protein}
                    onClick={() => setSelectedProtein(protein)}
                    className={`px-4 py-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                      selectedProtein === protein
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-muted/40 border-border hover:bg-muted"
                    }`}
                  >
                    {PROTEIN_LABELS[protein]}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {isLoadingMenu ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-semibold">Loading nutritious menu...</span>
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No menu items found in this category.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedMenu.map(({ protein, dishes }) => (
                  <div key={protein} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-muted-foreground">
                        {PROTEIN_LABELS[protein]}
                      </h3>
                      <span className="text-xs font-mono text-muted-foreground">({dishes.length})</span>
                      <div className="flex-1 border-t border-border" />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {dishes.map((dish) => {
                        const dishKey = `${dish.protein}::${dish.flavor}`;
                        const selected = getSelectedSize(dish);
                        return (
                          <div
                            key={dishKey}
                            className="group flex flex-col justify-between border border-border hover:border-primary/50 bg-card rounded-lg overflow-hidden transition-all"
                          >
                            <div>
                              {/* Image placeholder with premium styling */}
                              <div className="h-48 w-full bg-muted/40 flex items-center justify-center border-b border-border overflow-hidden relative">
                                {selected.imageUrl ? (
                                  <img
                                    src={selected.imageUrl}
                                    alt={getMenuItemLabel(selected)}
                                    className="object-cover h-full w-full group-hover:scale-105 transition-all duration-300"
                                  />
                                ) : (
                                  <Utensils className="h-12 w-12 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-200" />
                                )}
                                <span className="absolute top-4 right-4 bg-background/90 text-primary text-xs font-extrabold px-3 py-1.5 rounded-md border border-border font-mono">
                                  {formatVND(selected.price)}
                                </span>
                              </div>

                              <div className="p-6">
                                <h3 className="text-lg font-bold font-heading mb-2 leading-tight group-hover:text-primary transition-colors">
                                  {dish.flavor}
                                </h3>
                                {selected.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                                    {selected.description}
                                  </p>
                                )}
                                {dish.sizes.length > 1 && (
                                  <div className="flex gap-1.5">
                                    {dish.sizes.map((size) => (
                                      <button
                                        key={size.id}
                                        onClick={() =>
                                          setSelectedSizeByDish((prev) => ({ ...prev, [dishKey]: size.id }))
                                        }
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                                          selected.id === size.id
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "bg-muted/40 border-border hover:bg-muted"
                                        }`}
                                      >
                                        {size.sizeGrams}g
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-6 pt-0 border-t border-border/30 mt-4">
                              <button
                                onClick={() => addToCart(selected)}
                                className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold py-3 px-4 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="h-4 w-4" />
                                Add to Order
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 1.5: ORDER NOW — in-stock items only, ready today, no account
            needed. Separate from the cart/checkout flow above on purpose:
            this should be the fastest possible path to a hot meal. */}
        {activeTab === "order-now" && (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">Sẵn sàng giao ngay</h2>
              <p className="text-sm text-muted-foreground">
                Những món dưới đây đã được chuẩn bị sẵn — đặt và nhận trong ngày, không cần chờ chuẩn bị.
              </p>
            </div>

            {orderNowResult ? (
              <div className="max-w-md mx-auto border border-border bg-card rounded-2xl p-6 text-center space-y-3 shadow-sm">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                <h3 className="text-sm font-bold font-heading">Đặt hàng thành công!</h3>
                <p className="text-xs text-muted-foreground">
                  {orderNowResult.fulfillmentType === "IMMEDIATE"
                    ? "Đơn của bạn đã sẵn sàng — giao ngay hôm nay."
                    : "Một vài món cần chuẩn bị — đơn của bạn đã được lên lịch."}
                </p>
                <p className="text-sm font-bold text-primary">{formatVND(orderNowResult.total)}</p>
                <button
                  onClick={() => {
                    setOrderNowResult(null);
                    setOrderNowName("");
                    setOrderNowPhone("");
                    setOrderNowAddress("");
                    setOrderNowNotes("");
                  }}
                  className="text-xs font-bold px-4 py-2 rounded-lg border border-border hover:bg-muted cursor-pointer"
                >
                  Đặt thêm đơn khác
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {isLoadingMenu ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : readyNowItems.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border rounded-xl">
                      <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Hiện chưa có món nào sẵn sàng giao ngay.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {groupByFlavor(readyNowItems).map((dish) => {
                        const dishKey = `${dish.protein}::${dish.flavor}`;
                        const selected = getSelectedSize(dish);
                        const inCart = orderNowCart.find((l) => l.menuItem.id === selected.id);
                        return (
                          <div key={dishKey} className="border border-border bg-card rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold font-heading truncate">{dish.flavor}</h4>
                              </div>
                              <span className="text-xs font-bold text-primary shrink-0">{formatVND(selected.price)}</span>
                            </div>
                            {dish.sizes.length > 1 && (
                              <div className="flex gap-1.5">
                                {dish.sizes.map((size) => (
                                  <button
                                    key={size.id}
                                    onClick={() => setSelectedSizeByDish((prev) => ({ ...prev, [dishKey]: size.id }))}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                                      selected.id === size.id
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "bg-muted/40 border-border hover:bg-muted"
                                    }`}
                                  >
                                    {size.sizeGrams}g
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {selected.stockQuantity} sẵn có
                              </span>
                              {inCart ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateOrderNowQty(selected.id, inCart.qty - 1)}
                                    className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="text-xs font-bold w-4 text-center">{inCart.qty}</span>
                                  <button
                                    onClick={() => updateOrderNowQty(selected.id, inCart.qty + 1)}
                                    disabled={inCart.qty >= selected.stockQuantity}
                                    className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer disabled:opacity-30"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToOrderNowCart(selected)}
                                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer"
                                >
                                  Thêm
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-border bg-card rounded-2xl p-6 space-y-4 h-fit shadow-sm">
                  <h3 className="text-sm font-bold font-heading">Đơn hàng của bạn</h3>
                  {orderNowCart.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Chưa có món nào — chọn từ danh sách bên trái.</p>
                  ) : (
                    <div className="space-y-2">
                      {orderNowCart.map((l) => (
                        <div key={l.menuItem.id} className="flex justify-between text-xs">
                          <span className="truncate pr-2">{l.menuItem.flavor} ×{l.qty}</span>
                          <span className="font-semibold shrink-0">{formatVND(l.menuItem.price * l.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/50">
                        <span>Tổng cộng</span>
                        <span className="text-primary">{formatVND(orderNowTotal)}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitOrderNow} className="space-y-3 pt-2 border-t border-border/50">
                    <input
                      type="text"
                      required
                      placeholder="Họ và tên"
                      value={orderNowName}
                      onChange={(e) => setOrderNowName(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Số điện thoại"
                      value={orderNowPhone}
                      onChange={(e) => setOrderNowPhone(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Địa chỉ giao hàng"
                      value={orderNowAddress}
                      onChange={(e) => setOrderNowAddress(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                    <textarea
                      placeholder="Ghi chú (tuỳ chọn)"
                      value={orderNowNotes}
                      onChange={(e) => setOrderNowNotes(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none resize-none"
                      rows={2}
                    />
                    {orderNowError && <p className="text-[10px] text-red-500">{orderNowError}</p>}
                    <button
                      type="submit"
                      disabled={orderNowCart.length === 0 || isSubmittingOrderNow}
                      className="w-full bg-primary text-primary-foreground text-xs font-bold py-3 rounded-xl hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingOrderNow && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Đặt hàng ngay
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Track my order — self-serve status check by phone. There's
                no SMS/push notification connected yet, so this is how a
                customer finds out staff accepted or completed their order. */}
            <div className="max-w-md mx-auto mt-16 pt-10 border-t border-border">
              <h3 className="text-center text-sm font-bold font-heading mb-1">Theo dõi đơn hàng của bạn</h3>
              <p className="text-center text-xs text-muted-foreground mb-5">
                Nhập số điện thoại đã dùng để đặt hàng để xem trạng thái mới nhất.
              </p>
              <form onSubmit={handleTrackOrders} className="flex gap-2 mb-6">
                <input
                  type="tel"
                  required
                  placeholder="Số điện thoại của bạn"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  className="flex-1 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
                <button
                  type="submit"
                  disabled={isTrackingLoading}
                  className="bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground font-bold px-4 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 text-xs"
                >
                  {isTrackingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Tra cứu
                </button>
              </form>

              {trackingError && <p className="text-center text-xs text-red-500 mb-4">{trackingError}</p>}

              {hasTracked && !isTrackingLoading && !trackingError && trackedOrders.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Không tìm thấy đơn hàng nào với số điện thoại này.
                </p>
              )}

              <div className="space-y-3">
                {trackedOrders.map((o: any) => (
                  <div key={o.id} className="border border-border bg-card rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {(o.items || []).map((i: any) => `${i.flavor} ×${i.qty}`).join(", ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(o.deliveryDate).toLocaleDateString("vi-VN")} · {formatVND(o.total)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 whitespace-nowrap ${
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
                      {ORDER_STATUS_LABELS_VI[o.deliveryStatus] || o.deliveryStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY VOLUME SUBSCRIPTION (staff set these up — this is a
            phone-number lookup so a customer can check their remaining
            balance per protein and postpone today's delivery themselves) */}
        {activeTab === "subscriptions" && (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">Gói đăng ký của bạn</h2>
              <p className="text-sm text-muted-foreground">
                Nhập số điện thoại đã đăng ký với Fortify Kitchen để xem số lượng còn lại và lịch giao sắp tới. Gói đăng ký
                mới được thiết lập bởi đội ngũ Fortify Kitchen — liên hệ để bắt đầu một gói.
              </p>
            </div>

            <form onSubmit={handleLookupSubscription} className="max-w-md mx-auto flex gap-2 mb-10">
              <input
                type="tel"
                required
                placeholder="Số điện thoại của bạn"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className="flex-1 bg-background border border-border focus:border-primary text-sm py-3 px-4 rounded-lg outline-none"
              />
              <button
                type="submit"
                disabled={isLookupLoading}
                className="bg-primary text-primary-foreground font-bold px-5 rounded-lg hover:bg-primary/95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Tra cứu
              </button>
            </form>

            {lookupError && (
              <p className="text-center text-xs text-red-500 mb-8">{lookupError}</p>
            )}

            {hasLookedUp && !isLookupLoading && !lookupError && myPoolSubscriptions.length === 0 && (
              <div className="max-w-md mx-auto text-center py-10 border border-dashed border-border rounded-xl">
                <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Không tìm thấy gói đăng ký nào với số điện thoại này.
                </p>
              </div>
            )}

            <div className="max-w-2xl mx-auto space-y-6">
              {myPoolSubscriptions.map((sub) => (
                <div key={sub.id} className="border border-border bg-card rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-sm font-bold font-heading">{sub.packageName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Giao {formatGrams(sub.deliveryAmountGrams)} mỗi {sub.deliveryIntervalDays} ngày
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                        sub.status === "ACTIVE"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {sub.pools.map((p: any) => {
                      const pct = p.totalGrams > 0 ? Math.max(0, Math.min(100, (p.remainingGrams / p.totalGrams) * 100)) : 0;
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">{PROTEIN_LABELS[p.protein as Protein] || p.protein}</span>
                            <span className="text-muted-foreground">
                              còn {formatGrams(p.remainingGrams)} / {formatGrams(p.totalGrams)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {sub.upcomingDeliveries?.length > 0 && (
                    <div className="pt-4 border-t border-border/50 space-y-2">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-primary" /> Lịch giao sắp tới
                      </h4>
                      {sub.upcomingDeliveries.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(d.scheduledDate).toLocaleDateString("vi-VN")} —{" "}
                            {d.items.map((i: any) => `${i.flavor} ×${i.qty}`).join(", ")}
                          </span>
                          <button
                            onClick={() => handlePostponeMyDelivery(d.id)}
                            className="text-[10px] font-bold px-2 py-1 rounded border border-border hover:bg-muted cursor-pointer shrink-0"
                          >
                            Hoãn
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER DASHBOARD */}
        {activeTab === "dashboard" && user && (
          <div>
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                Welcome back, {user.firstName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Track your active orders and manage subscription deliveries in Vietnam
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Left 2 Cols: Orders list */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Order History & Live Status
                  </h3>

                  {isLoadingDashboard ? (
                    <div className="py-10 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground">Retrieving orders...</span>
                    </div>
                  ) : myOrders.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl">
                      <p className="text-xs text-muted-foreground">You haven&apos;t placed any food orders yet.</p>
                      <button
                        onClick={() => setActiveTab("menu")}
                        className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Browse Menu and order now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {myOrders.map((order) => (
                        <div key={order.id} className="border border-border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border/50">
                            <div>
                              <div className="text-xs text-muted-foreground font-semibold">Order ID</div>
                              <div className="text-xs font-mono font-semibold text-foreground/80">{order.id}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs bg-muted/60 text-muted-foreground font-bold px-3 py-1 rounded-full border border-border">
                                {formatVND(order.totalAmount)}
                              </span>
                              <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full border border-primary/20">
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* List order items */}
                          <div className="space-y-3.5">
                            {order.items.map((i: any) => (
                              <div key={i.id} className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-foreground/90">
                                  {i.menuItem?.name || "Gourmet Dish"} <span className="text-muted-foreground font-normal">x {i.quantity}</span>
                                </span>
                                <span className="text-muted-foreground font-medium">{formatVND(i.price * i.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Live Step Progress Indicator for COD/Shipment */}
                          <div>
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                              Delivery Progress
                            </div>
                            <div className="grid grid-cols-4 gap-2 relative">
                              {/* Horizontal connecting line */}
                              <div className="absolute top-3.5 left-8 right-8 h-0.5 bg-border -z-10" />

                              {[
                                { key: "PENDING", label: "Received", icon: Clock },
                                { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
                                { key: "PREPARING", label: "Preparing", icon: Utensils },
                                { key: "DELIVERED", label: "Delivered", icon: Truck },
                              ].map((step) => {
                                const statuses = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
                                const currentIdx = statuses.indexOf(order.status);
                                const targetIdx = statuses.indexOf(step.key === "DELIVERED" ? "DELIVERED" : step.key);
                                const isPassed = currentIdx >= targetIdx;

                                return (
                                  <div key={step.key} className="flex flex-col items-center text-center">
                                    <div
                                      className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                                        isPassed
                                          ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/15"
                                          : "bg-muted border-border text-muted-foreground"
                                      }`}
                                    >
                                      <step.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold mt-2 text-muted-foreground">{step.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Shipment details */}
                          <div className="pt-4 border-t border-border/50 text-[11px] text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              Shipped to: {order.deliveryAddress}
                            </span>
                            <span className="font-semibold text-foreground/80">
                              Payment: {order.payment?.method} ({order.payment?.status})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Active subscriptions */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Meal Subscriptions
                  </h3>

                  {isLoadingDashboard ? (
                    <div className="py-6 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    </div>
                  ) : mySubscriptions.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-border rounded-xl bg-muted/10">
                      <p className="text-xs text-muted-foreground">You do not have any active subscriptions.</p>
                      <button
                        onClick={() => setActiveTab("subscriptions")}
                        className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Subscribe to daily/weekly plans
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mySubscriptions.map((sub) => (
                        <div key={sub.id} className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-black tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                {sub.frequency}
                              </span>
                              <h4 className="text-sm font-bold font-heading mt-1.5">Chef Meal Box</h4>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                sub.status === "ACTIVE"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-amber-50 border-amber-200 text-amber-700"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground space-y-1">
                            <div>
                              Cycle Price: <span className="font-semibold text-foreground">{formatVND(sub.pricePerCycle)}</span>
                            </div>
                            <div>
                              Next Delivery:{" "}
                              <span className="font-semibold text-foreground">
                                {new Date(sub.nextDeliveryDate).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-border/50 flex gap-2">
                            <button
                              onClick={() => handlePauseSubscription(sub.id, sub.status)}
                              className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-[10px] font-extrabold py-2 px-3 rounded-lg border border-border transition-colors cursor-pointer"
                            >
                              {sub.status === "ACTIVE" ? "Pause" : "Resume"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. CART SLIDE-OVER PANEL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-background border-l border-border shadow-2xl flex flex-col justify-between z-10">
            {/* Cart Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/15">
              <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Your Nutritious Cart
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">Your cart is empty.</p>
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      setActiveTab("menu");
                    }}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Start browsing fresh meals
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="flex items-center gap-4 p-3 border border-border bg-card/50 rounded-xl relative"
                    >
                      <div className="h-16 w-16 bg-muted/40 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-border">
                        {item.menuItem.imageUrl ? (
                          <img
                            src={item.menuItem.imageUrl}
                            alt={getMenuItemLabel(item.menuItem)}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <Utensils className="h-6 w-6 text-muted-foreground/30" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{getMenuItemLabel(item.menuItem)}</h4>
                        <div className="text-xs text-primary font-bold mt-1">
                          {formatVND(item.menuItem.price)}
                        </div>

                        {/* Adjust quantities */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1)}
                            className="p-1 rounded bg-secondary hover:bg-muted border border-border shrink-0 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1)}
                            className="p-1 rounded bg-secondary hover:bg-muted border border-border shrink-0 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer / Checkout Form */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-border bg-muted/15 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatVND(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Shipping Fee (Vietnam standard)</span>
                    <span>{formatVND(30000)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-border/50 pt-2.5">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatVND(cartTotal + 30000)}</span>
                  </div>
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleCheckout} className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Delivery Address (Vietnam)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123 Dong Khoi St, District 1, HCMC"
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      Order Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please leave at the front desk"
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Discount Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FORTIFY10"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                        className={`py-2 px-3 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          paymentMethod === "CASH_ON_DELIVERY"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5 shrink-0" />
                        Ship COD
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("STRIPE")}
                        className={`py-2 px-3 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          paymentMethod === "STRIPE"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        Online Pay
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingOrder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Complete Order (COD)
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. AUTH MODALS */}
      {authModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setAuthModal(null)} />
          <div className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold font-heading">
                {authModal === "login" ? "Sign In to Your Profile" : "Register a New Profile"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Join FortifyKitchen to place orders and manage meals.
              </p>
            </div>

            {authModal === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
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
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                >
                  Sign In
                </button>
                <div className="text-center pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthModal("signup")}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Register here
                    </button>
                  </span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={signupFirst}
                      onChange={(e) => setSignupFirst(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={signupLast}
                      onChange={(e) => setSignupLast(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={signupPass}
                    onChange={(e) => setSignupPass(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0901234567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Address</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Dong Khoi St, District 1"
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                >
                  Create Account
                </button>
                <div className="text-center pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthModal("login")}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Sign in instead
                    </button>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. FOOTER */}
      <footer className="border-t border-border bg-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-muted-foreground space-y-4">
          <p className="font-semibold text-foreground/80">FortifyKitchen Vietnam - Gourmet Nutrition Subscriptions</p>
          <p>Address: Ho Chi Minh City, Vietnam. COD Payment standard applied.</p>
          <p>© 2026 FortifyKitchen. All rights reserved.</p>
        </div>
      </footer>

      {/* In-app confirm dialog — replaces window.confirm(). */}
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
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer"
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
