"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingBag,
  faUser,
  faSignOutAlt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { MenuItem, Protein } from "@fortifykitchen/types";
import { PROTEIN_LABELS, translateApiError, formatGrams } from "@fortifykitchen/shared";
import { useApp } from "@/providers/app-context";
import { useToast } from "@fortifykitchen/ui";
import HomeSection from "@/features/home/HomeSection";
import MenuSection from "@/features/menu/MenuSection";
import OrderNowSection from "@/features/order-now/OrderNowSection";
import CalculatorSection from "@/features/calculator/CalculatorSection";
import WalletSection from "@/features/wallet/WalletSection";
import SubscriptionsSection from "@/features/subscriptions/SubscriptionsSection";
import DashboardSection from "@/features/dashboard/DashboardSection";
import CartDrawer from "@/features/cart/CartDrawer";
import AuthModal from "@/features/auth/AuthModal";
import Footer from "@/features/shared/Footer";
import PrivacyModal from "@/features/shared/PrivacyModal";
import VietQRModal from "@/features/shared/VietQRModal";
import MobileNav from "@/features/shared/MobileNav";
import { DICTIONARY } from "@/constants/dictionary";
import { formatVND, calculateCustomOrderPrice } from "@/lib/utils";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

const PROTEIN_OPTIONS = [
  {
    id: "chicken",
    label: "Ức gà (Chicken)",
    sizes: {
      150: { pro: 37, carb: 0, fat: 3, kcal: 175, price: 25000 },
      250: { pro: 61, carb: 0, fat: 5, kcal: 290, price: 42000 },
    },
  },
  {
    id: "beef",
    label: "Thịt bò (Beef)",
    sizes: {
      150: { pro: 35, carb: 0, fat: 12, kcal: 250, price: 50000 },
    },
  },
  {
    id: "shrimp",
    label: "Tôm thẻ (Shrimp)",
    sizes: {
      150: { pro: 32, carb: 0, fat: 2, kcal: 150, price: 50000 },
    },
  },
];

const CARB_OPTIONS = [
  { id: "rice", label: "Gạo lứt (Brown Rice)", pro: 4, carb: 45, fat: 1.5, kcal: 210, price: 10000 },
  { id: "potato", label: "Khoai lang (Sweet Potato)", pro: 2, carb: 26, fat: 0.2, kcal: 115, price: 12000 },
  { id: "noodle", label: "Bún lứt (Brown Rice Noodles)", pro: 3, carb: 40, fat: 1, kcal: 180, price: 10000 },
];

const TOPPING_OPTIONS = [
  { id: "broccoli", label: "Bông cải xanh (Broccoli)", pro: 2.5, carb: 6, fat: 0.3, kcal: 35, price: 5000 },
  { id: "egg", label: "Trứng luộc (Boiled Egg)", pro: 6, carb: 0.6, fat: 5, kcal: 70, price: 8000 },
  { id: "mushroom", label: "Nấm hương (Shiitake)", pro: 2, carb: 5, fat: 0.2, kcal: 30, price: 7000 },
];

const SAUCE_OPTIONS = [
  { id: "sesame", label: "Xốt mè rang (Sesame)", pro: 1, carb: 5, fat: 6, kcal: 78, price: 5000 },
  { id: "citrus", label: "Xốt cam chua ngọt (Citrus)", pro: 0, carb: 10, fat: 0, kcal: 40, price: 5000 },
  { id: "spicy", label: "Xốt tương cay (Spicy Soy)", pro: 0.5, carb: 4, fat: 0.5, kcal: 22, price: 5000 },
];

export default function CustomerPortal() {
  const {
    user,
    token,
    cart,
    cartCount,
    isCartOpen,
    setCartOpen,
    login,
    signup,
    logout,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    placeOrder,
    clearCart,
  } = useApp();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"home" | "menu" | "order-now" | "calculator" | "wallet" | "subscriptions" | "dashboard">("home");

  const [orderNowCart, setOrderNowCart] = React.useState<{ menuItem: MenuItem; qty: number }[]>([]);
  const [orderNowName, setOrderNowName] = React.useState("");
  const [orderNowPhone, setOrderNowPhone] = React.useState("");
  const [orderNowAddress, setOrderNowAddress] = React.useState("");
  const [orderNowNotes, setOrderNowNotes] = React.useState("");
  const [isSubmittingOrderNow, setIsSubmittingOrderNow] = React.useState(false);
  const [orderNowResult, setOrderNowResult] = React.useState<{ id: string; total: number; paymentMethod: string; deliveryDate: string; fulfillmentType: string; systemNotes?: string; items: any[] } | null>(null);
  const [orderNowError, setOrderNowError] = React.useState<string | null>(null);

  const [orderNowProvince, setOrderNowProvince] = React.useState("");
  const [orderNowWard, setOrderNowWard] = React.useState("");
  const [orderNowStreet, setOrderNowStreet] = React.useState("");
  const [orderNowAgreeTerms, setOrderNowAgreeTerms] = React.useState(false);
  const [orderNowPaymentMethod, setOrderNowPaymentMethod] = React.useState("CASH_ON_DELIVERY");
  const [orderNowDiscountCode, setOrderNowDiscountCode] = React.useState("");
  const [orderNowVerifiedDiscount, setOrderNowVerifiedDiscount] = React.useState<{ type: string; amount: number } | null>(null);
  const [orderNowDiscountCodeStatus, setOrderNowDiscountCodeStatus] = React.useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [orderNowDiscountCodeError, setOrderNowDiscountCodeError] = React.useState<string | null>(null);

  const [orderFlowType, setOrderFlowType] = React.useState<"standard" | "custom">("standard");
  const [customOrderProtein, setCustomOrderProtein] = React.useState("chicken");
  const [customOrderSize, setCustomOrderSize] = React.useState<number>(150);
  const [customOrderCarb, setCustomOrderCarb] = React.useState("rice");
  const [customOrderToppings, setCustomOrderToppings] = React.useState<string[]>([]);
  const [customOrderSauce, setCustomOrderSauce] = React.useState("sesame");
  const [customOrderDeliveryDate, setCustomOrderDeliveryDate] = React.useState("");
  const [customOrderQty, setCustomOrderQty] = React.useState<number>(1);

  const [checkoutProvince, setCheckoutProvince] = React.useState("79");
  const [checkoutStreet, setCheckoutStreet] = React.useState("");
  const [checkoutAgreeTerms, setCheckoutAgreeTerms] = React.useState(false);
  const [checkoutResult, setCheckoutResult] = React.useState<{ id: string; total: number; paymentMethod: string; deliveryDate: string } | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);

  const [showWalletPlans, setShowWalletPlans] = React.useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = React.useState<string | null>(null);
  const [upgradeRequestNotes, setUpgradeRequestNotes] = React.useState("");
  const [isSubmittingUpgradeRequest, setIsSubmittingUpgradeRequest] = React.useState(false);
  const [myUpgradeRequests] = React.useState<{ id: string; status: string; requestedPlanName?: string }[]>([]);
  const [payFromWalletError, setPayFromWalletError] = React.useState<{ id: string; title: string; description?: string } | null>(null);

  const [lang, setLang] = React.useState<"vi" | "en">("vi");

  React.useEffect(() => {
    const savedLang = localStorage.getItem("fk_lang");
    if (savedLang === "vi" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  const changeLang = (newLang: "vi" | "en") => {
    setLang(newLang);
    localStorage.setItem("fk_lang", newLang);
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  React.useEffect(() => {
    async function loadCatalog() {
      const mockMenuItems: MenuItem[] = [
        ...[
          "cay Hàn Quốc",
          "muối ớt",
          "phô mai",
          "sốt thái",
          "teriyaki",
          "tiêu đen",
          "xá xíu"
        ].flatMap((flavor) => [
          {
            id: `mock-chicken-150-${flavor.replace(/\s+/g, "-")}`,
            flavor,
            protein: "CHICKEN" as Protein,
            price: 25000,
            sizeGrams: 150,
            isAvailable: true,
            description: `Ức gà sous-vide mọng nước vị ${flavor} thơm ngon.`,
            stockQuantity: 99,
            imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: `mock-chicken-250-${flavor.replace(/\s+/g, "-")}`,
            flavor,
            protein: "CHICKEN" as Protein,
            price: 42000,
            sizeGrams: 250,
            isAvailable: true,
            description: `Ức gà sous-vide mọng nước vị ${flavor} phần lớn 250g.`,
            stockQuantity: 99,
            imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ]),
        {
          id: "mock-beef-150-herb",
          flavor: "herb",
          protein: "BEEF" as Protein,
          price: 50000,
          sizeGrams: 150,
          isAvailable: true,
          description: "Thịt bò Úc mềm mại ướp hương thảo hảo hạng.",
          stockQuantity: 99,
          imageUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...[
          "herb",
          "muối ớt",
          "sốt thái"
        ].map((flavor) => ({
          id: `mock-shrimp-150-${flavor.replace(/\s+/g, "-")}`,
          flavor,
          protein: "SHRIMP" as Protein,
          price: 50000,
          sizeGrams: 150,
          isAvailable: true,
          description: `Tôm thẻ tươi giòn vị ${flavor}.`,
          stockQuantity: 99,
          imageUrl: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=800",
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      ];

      try {
        const resMenu = await fetch(`${API_URL}/menu`).catch(() => null);
        if (resMenu && resMenu.ok) {
          const menuData = await resMenu.json();
          setMenuItems(menuData.data && menuData.data.length > 0 ? menuData.data : mockMenuItems);
        } else {
          setMenuItems(mockMenuItems);
        }
      } catch {
        setMenuItems(mockMenuItems);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadCatalog();
  }, [API_URL]);

  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [selectedProtein, setSelectedProtein] = React.useState<Protein | "">("");
  const [selectedProteinOrderNow, setSelectedProteinOrderNow] = React.useState<Protein | "">("");
  const [isLoadingMenu, setIsLoadingMenu] = React.useState(true);

  const [walletBalance, setWalletBalance] = React.useState<number>(0);
  const [planDiscountPercent, setPlanDiscountPercent] = React.useState<number>(0);
  const [planDiscountEndsAt, setPlanDiscountEndsAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      fetch(`${API_URL}/customers/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("fk_token")}` },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) {
            setCheckoutAddress(result.data.address);
            setWalletBalance(result.data.walletBalance ?? 0);
            setPlanDiscountPercent(result.data.planDiscountPercent ?? 0);
            setPlanDiscountEndsAt(result.data.planDiscountEndsAt ?? null);
          }
        })
        .catch(console.error);
    } else {
      setWalletBalance(0);
      setPlanDiscountPercent(0);
      setPlanDiscountEndsAt(null);
    }
  }, [user, API_URL]);

  // Checkout states - must be declared before useEffects that use them
  const [checkoutAddress, setCheckoutAddress] = React.useState("");
  const [checkoutNotes, setCheckoutNotes] = React.useState("");
  const [checkoutGuestName, setCheckoutGuestName] = React.useState("");
  const [checkoutGuestPhone, setCheckoutGuestPhone] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH_ON_DELIVERY");
  const [discountCode, setDiscountCode] = React.useState("");
  const [discountCodeStatus, setDiscountCodeStatus] = React.useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [discountCodeError, setDiscountCodeError] = React.useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);
  const [checkoutStep, setCheckoutStep] = React.useState<"cart" | "details">("cart");
  // Silence unused state warnings (used in useEffect callbacks)
  void discountCodeStatus;
  void discountCodeError;
  React.useEffect(() => {
    if (!isCartOpen) setCheckoutStep("cart");
  }, [isCartOpen]);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user && paymentMethod === "WALLET") {
      setPaymentMethod("CASH_ON_DELIVERY");
    }
  }, [user, paymentMethod]);

  const [subscriptionPlans, setSubscriptionPlans] = React.useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = React.useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = React.useState<string | null>(null);
  const [planPurchaseResult, setPlanPurchaseResult] = React.useState<any | null>(null);
  const [homeFrames, setHomeFrames] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadPlans() {
      try {
        setIsLoadingPlans(true);
        const res = await fetch(`${API_URL}/subscription-plans/public`).catch(() => null);
        if (res && res.ok) {
          const result = await res.json().catch(() => null);
          setSubscriptionPlans(result?.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingPlans(false);
      }
    }
    async function loadHomeFrames() {
      try {
        const res = await fetch(`${API_URL}/home-frames`).catch(() => null);
        if (res && res.ok) {
          const result = await res.json().catch(() => null);
          // Only show active banners
          setHomeFrames((result?.data || []).filter((f: any) => f.isActive));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPlans();
    loadHomeFrames();
  }, [API_URL]);

  const [notifications, setNotifications] = React.useState<any | null>(null);
  const [dismissedBanners, setDismissedBanners] = React.useState<string[]>([]);

  const loadNotifications = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("fk_token");
      const res = await fetch(`${API_URL}/notifications/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (res && res.ok) {
        const result = await res.json().catch(() => null);
        setNotifications(result?.data || null);
      }
    } catch (err) {
      console.error(err);
    }
  }, [API_URL]);

  React.useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications(null);
      setDismissedBanners([]);
    }
  }, [user, loadNotifications]);

  const [myOrders, setMyOrders] = React.useState<any[]>([]);
  const [mySubscriptions, setMySubscriptions] = React.useState<any[]>([]);

  const [isLoadingDashboard, setIsLoadingDashboard] = React.useState(false);
  const [dashboardSection, setDashboardSection] = React.useState<"overview" | "orders" | "subscriptions">("overview");

  const loadDashboard = React.useCallback(async () => {
    try {
      setIsLoadingDashboard(true);
      const token = localStorage.getItem("fk_token");
      const [resOrders, resSubs] = await Promise.all([
        fetch(`${API_URL}/orders/me`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/subscriptions/me`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);
      if (resOrders && resSubs && resOrders.ok && resSubs.ok) {
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

  React.useEffect(() => {
    if (activeTab === "dashboard" && user) {
      loadDashboard();
    }
  }, [activeTab, user, loadDashboard]);

  React.useEffect(() => {
    const code = discountCode.trim();
    if (!code) {
      setVerifiedDiscount(null);
      setDiscountCodeStatus("idle");
      return;
    }
    setDiscountCodeStatus("checking");
    const timer = setTimeout(() => {
      fetch(`${API_URL}/discounts/verify?code=${encodeURIComponent(code)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then(async (res) => {
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error(body?.message);
          return body;
        })
        .then((result) => {
          setVerifiedDiscount({ type: result.data.type, amount: Number(result.data.amount) });
          setDiscountCodeStatus("valid");
          setDiscountCodeError(null);
        })
        .catch((err) => {
          setVerifiedDiscount(null);
          setDiscountCodeStatus("invalid");
          setDiscountCodeError(translateApiError(err?.message, lang, ""));
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [discountCode, API_URL, token, lang]);

  React.useEffect(() => {
    const code = orderNowDiscountCode.trim();
    if (!code) {
      setOrderNowVerifiedDiscount(null);
      setOrderNowDiscountCodeStatus("idle");
      return;
    }
    setOrderNowDiscountCodeStatus("checking");
    const timer = setTimeout(() => {
      fetch(`${API_URL}/discounts/verify?code=${encodeURIComponent(code)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then(async (res) => {
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error(body?.message);
          return body;
        })
        .then((result) => {
          setOrderNowVerifiedDiscount({ type: result.data.type, amount: Number(result.data.amount) });
          setOrderNowDiscountCodeStatus("valid");
          setOrderNowDiscountCodeError(null);
        })
        .catch((err) => {
          setOrderNowVerifiedDiscount(null);
          setOrderNowDiscountCodeStatus("invalid");
          setOrderNowDiscountCodeError(translateApiError(err?.message, lang, ""));
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [orderNowDiscountCode, API_URL, token, lang]);

const hasActivePlanDiscount = planDiscountPercent > 0 && !!planDiscountEndsAt && new Date(planDiscountEndsAt) > new Date();
   
  // Move verifiedDiscount state declaration BEFORE the calculations that use it
  const [verifiedDiscount, setVerifiedDiscount] = React.useState<{ type: string; amount: number } | null>(null);

  const [trackPhone, setTrackPhone] = React.useState("");
  const [trackedOrders, setTrackedOrders] = React.useState<any[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = React.useState(false);
  const [trackingError, setTrackingError] = React.useState<string | null>(null);
  const [hasTracked, setHasTracked] = React.useState(false);

  const [lookupPhone, setLookupPhone] = React.useState("");
  const [myPoolSubscriptions, setMyPoolSubscriptions] = React.useState<any[]>([]);
  const [isLookupLoading, setIsLookupLoading] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [hasLookedUp, setHasLookedUp] = React.useState(false);

  // Wrap setActiveTab to match component prop type
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab as "home" | "menu" | "order-now" | "calculator" | "wallet" | "subscriptions" | "dashboard");
  };

  const [authModal, setAuthModal] = React.useState<"login" | "signup" | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!user) {
      if (!checkoutGuestName.trim() || !checkoutGuestPhone.trim()) {
        setCheckoutError(lang === "vi" ? "Vui lòng nhập tên và số điện thoại." : "Please enter your name and phone number.");
        return;
      }
      setIsSubmittingOrder(true);
      const guestPayload: any = {
        name: checkoutGuestName.trim(),
        phone: checkoutGuestPhone.trim(),
        address: checkoutAddress.trim() || undefined,
        notes: checkoutNotes.trim() || undefined,
        paymentMethod,
        items: cart.map((l) => ({ menuItemId: l.menuItem.id, qty: l.quantity })),
      };
      if (discountCode.trim()) guestPayload.discountCode = discountCode.trim();
      const guestRes = await fetch(`${API_URL}/orders/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestPayload),
      }).catch(() => null);
      setIsSubmittingOrder(false);
      if (!guestRes) {
        setCheckoutError(lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again");
        return;
      }
      const guestResult = await guestRes.json().catch(() => null);
      if (!guestRes.ok) {
        setCheckoutError(
          translateApiError(guestResult?.message, lang, lang === "vi" ? "Không thể đặt hàng. Vui lòng thử lại." : "Couldn't place your order. Please try again."),
        );
        return;
      }
      clearCart();
      setDiscountCode("");
      setCheckoutGuestName("");
      setCheckoutGuestPhone("");
      setCartOpen(false);
      // Confirmation screen for both COD and bank transfer; the modal shows
      // VietQR details only when the order is a bank transfer.
      setCheckoutResult(guestResult.data ?? guestResult);
      return;
    }

    setIsSubmittingOrder(true);
    const result = await placeOrder(checkoutAddress, paymentMethod, checkoutNotes, discountCode, lang);
    setIsSubmittingOrder(false);
    if (result && result.success === false) {
      setCheckoutError(result.message || (lang === "vi" ? "Không thể xử lý đơn hàng. Vui lòng thử lại." : "Couldn't process your order. Please try again."));
      return;
    }
    if (result) {
      loadDashboard();
      setDiscountCode("");
      // Always show the confirmation modal — same as the guest checkout
      // flow above. Previously this only fired for BANK_TRANSFER, so a
      // logged-in customer paying COD or by Wallet got nothing but a toast
      // and the cart/tab just silently changed. The modal closes to
      // cartOpen=false + activeTab="dashboard" on dismiss.
      setCheckoutResult(result);
    }
  };

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
        setLookupError(
          translateApiError(result?.message, lang, lang === "vi" ? "Không thể tra cứu lúc này" : "Could not look this up right now"),
        );
        setMyPoolSubscriptions([]);
      }
    } catch (err) {
      console.error(err);
      setLookupError(lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again");
    } finally {
      setIsLookupLoading(false);
    }
  };

  // Logged-in customers see their own subscription(s) automatically — no
  // phone typed in, so this hits the JWT-guarded /subscriptions/me route
  // (already enriched with upcomingOrders, same shape the phone lookup
  // returns) instead of the public phone-based one.
  const fetchMySubscriptions = async () => {
    setIsLookupLoading(true);
    setLookupError(null);
    setHasLookedUp(true);
    try {
      const token = localStorage.getItem("fk_token");
      const res = await fetch(`${API_URL}/subscriptions/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setMyPoolSubscriptions(result?.data || []);
      } else {
        setLookupError(
          translateApiError(result?.message, lang, lang === "vi" ? "Không thể tải gói của bạn lúc này" : "Could not load your plan right now"),
        );
        setMyPoolSubscriptions([]);
      }
    } catch (err) {
      console.error(err);
      setLookupError(lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handlePostponeMyDelivery = (orderId: string) => {
    const confirmed = window.confirm(
      lang === "vi"
        ? "Hoãn lần giao này? Số lượng sẽ được bảo lưu, lịch giao sau đó sẽ dời lại một chu kỳ."
        : "Postpone this delivery? The quantity will be preserved, and the next delivery schedule will shift by one cycle."
    );
    if (!confirmed) return;
    
    (async () => {
      try {
          const res = await fetch(
            `${API_URL}/subscriptions/public/${orderId}/postpone?phone=${encodeURIComponent(lookupPhone.trim())}`,
            { method: "POST" },
          );
          if (res.ok) {
            if (user) {
              fetchMySubscriptions();
            } else {
              handleLookupSubscription({ preventDefault: () => {} } as React.FormEvent);
            }
          } else {
            const result = await res.json().catch(() => null);
            toast({
              title: translateApiError(
                result?.message,
                lang,
                lang === "vi" ? "Không thể hoãn lần giao này" : "Could not postpone this delivery",
              ),
              type: "error",
            });
          }
        } catch (err) {
          console.error(err);
        }
      })();
  };

  const handleBuyPlan = async (plan: any) => {
    if (!user) {
      setAuthModal("login");
      return;
    }
    setPurchasingPlanId(plan.id);
    try {
      const token = localStorage.getItem("fk_token");
      const res = await fetch(`${API_URL}/subscription-plans/public/${plan.id}/purchase`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setPlanPurchaseResult(result?.data);
      } else {
        toast({
          title: translateApiError(
            result?.message,
            lang,
            lang === "vi" ? "Không thể mua gói này lúc này" : "Could not purchase this plan right now",
          ),
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again",
        type: "error",
      });
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const [payingSubscriptionId, setPayingSubscriptionId] = React.useState<string | null>(null);

  const handlePayFromWallet = async (subscriptionId: string) => {
    setPayingSubscriptionId(subscriptionId);
    setPayFromWalletError(null);
    try {
      const token = localStorage.getItem("fk_token");
      const res = await fetch(`${API_URL}/subscriptions/${subscriptionId}/pay-from-wallet`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        toast({
          title: lang === "vi" ? "Thanh toán thành công" : "Payment successful",
          description:
            lang === "vi"
              ? "Đã thanh toán trọn gói bằng số dư Ví."
              : "Subscription fully paid from your wallet balance.",
          type: "success",
        });
        loadDashboard();
        loadNotifications();
        if (lookupPhone.trim()) {
          handleLookupSubscription({ preventDefault: () => {} } as React.FormEvent);
        }
        fetch(`${API_URL}/customers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((rr) => {
            if (rr.success && rr.data) setWalletBalance(rr.data.walletBalance ?? 0);
          })
          .catch(() => {});
      } else {
        const isShortBalance = /wallet balance is insufficient/i.test(result?.message || "");
        const title = translateApiError(
          result?.message,
          lang,
          lang === "vi" ? "Không thể thanh toán bằng Ví. Vui lòng kiểm tra số dư và thử lại." : "Couldn't pay from your wallet. Check your balance and try again.",
        );
        const description = isShortBalance
          ? lang === "vi"
            ? "Vào mục Số dư tài khoản để nạp thêm, sau đó quay lại thanh toán."
            : "Top up in the Account Credit section, then come back and try paying again."
          : undefined;
        toast({ title, description, type: "error" });
        setPayFromWalletError({ id: subscriptionId, title, description });
      }
    } catch (err) {
      console.error(err);
      const title = lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again";
      toast({ title, type: "error" });
      setPayFromWalletError({ id: subscriptionId, title });
    } finally {
      setPayingSubscriptionId(null);
    }
  };

  const handleSubmitUpgradeRequest = async () => {
    if (!selectedUpgradePlanId || !user?.id) return;
    setIsSubmittingUpgradeRequest(true);
    try {
      const token = localStorage.getItem("fk_token");
      const res = await fetch(`${API_URL}/wallet/upgrade-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetPlanId: selectedUpgradePlanId,
          notes: upgradeRequestNotes.trim() || undefined,
        }),
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        toast({
          title: lang === "vi" ? "Gửi yêu cầu thành công" : "Request submitted",
          description: lang === "vi" ? "Đội ngũ sẽ xem xét và liên hệ sớm." : "Our team will review and reach out soon.",
          type: "success",
        });
        setShowWalletPlans(false);
        setSelectedUpgradePlanId(null);
        setUpgradeRequestNotes("");
        loadDashboard();
      } else {
        toast({
          title: lang === "vi" ? "Gửi yêu cầu thất bại" : "Failed to submit request",
          description: result?.message || (lang === "vi" ? "Vui lòng thử lại." : "Please try again."),
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: lang === "vi" ? "Lỗi kết nối" : "Connection error",
        type: "error",
      });
    } finally {
      setIsSubmittingUpgradeRequest(false);
    }
  };

  const readyNowItems = menuItems.filter((m) => (m.stockQuantity ?? 0) > 0);

  const handleSubmitOrderNow = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((orderFlowType === "standard" && orderNowCart.length === 0) || !orderNowName.trim() || !orderNowPhone.trim()) return;
    setIsSubmittingOrderNow(true);
    setOrderNowError(null);
    try {
      const payload: any = {
        name: orderNowName.trim(),
        phone: orderNowPhone.trim(),
        address: orderNowAddress.trim() || undefined,
        notes: orderNowNotes.trim() || undefined,
        paymentMethod: orderNowPaymentMethod,
      };

      if (orderFlowType === "standard") {
        payload.items = orderNowCart.map((l) => ({ menuItemId: l.menuItem.id, qty: l.qty }));
      } else {
        const customPrice = calculateCustomOrderPrice(
          customOrderProtein,
          customOrderSize,
          customOrderCarb,
          customOrderSauce,
          customOrderToppings
        );
        const pLabel = PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein)?.label.split(" (")[0] || "";
        const cLabel = CARB_OPTIONS.find((x) => x.id === customOrderCarb)?.label.split(" (")[0] || "";
        const sLabel = SAUCE_OPTIONS.find((x) => x.id === customOrderSauce)?.label.split(" (")[0] || "";
        const tLabels = customOrderToppings.map(t => TOPPING_OPTIONS.find(x => x.id === t)?.label.split(" (")[0]).join(", ");
        
        const flavorName = lang === "vi"
          ? `Tự chọn: ${pLabel} ${customOrderSize}g`
          : `Custom: ${customOrderProtein} ${customOrderSize}g`;
          
        payload.items = [
          {
            qty: customOrderQty,
            protein: customOrderProtein.toUpperCase(),
            flavor: `${flavorName} + ${cLabel} + Toppings: ${tLabels || "None"} + ${sLabel}`,
            sizeGrams: customOrderSize,
            unitPrice: customPrice,
          }
        ];
        payload.deliveryDate = customOrderDeliveryDate;
      }

      if (orderNowDiscountCode.trim()) {
        payload.discountCode = orderNowDiscountCode.trim();
      }

      const res = await fetch(`${API_URL}/orders/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);
      if (!res) {
        setOrderNowError(lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again");
        return;
      }
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setOrderNowResult(result.data);
        setOrderNowCart([]);
        setOrderNowDiscountCode("");
      } else {
        setOrderNowError(
          translateApiError(result?.message, lang, lang === "vi" ? "Không thể đặt hàng. Vui lòng kiểm tra kết nối và thử lại." : "Couldn't place your order. Check your connection and try again."),
        );
      }
    } catch (err) {
      console.error(err);
      setOrderNowError(lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again");
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
        setTrackingError(
          translateApiError(result?.message, lang, lang === "vi" ? "Không thể tra cứu lúc này" : "Could not look this up right now"),
        );
        setTrackedOrders([]);
      }
    } catch (err) {
      console.error(err);
      setTrackingError(lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab("home")}>
            <img
              src="/logo.png"
              alt="Fortify Kitchen Logo"
              className="h-10 w-10 object-contain rounded-full transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-normal tracking-tight font-heading text-foreground select-none">
              Fortify<span className="font-sans font-light tracking-wide text-primary ml-0.5">Kitchen</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground">
            <button
              onClick={() => setActiveTab("home")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "home" ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {t("nav_home", lang)}
              {activeTab === "home" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "menu" ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {t("nav_menu", lang)}
              {activeTab === "menu" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("calculator")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "calculator" ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {t("nav_calculator", lang)}
              {activeTab === "calculator" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "wallet" ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {t("nav_wallet", lang)}
              {activeTab === "wallet" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "subscriptions" ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {t("nav_sub", lang)}
              {activeTab === "subscriptions" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                  activeTab === "dashboard" ? "text-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {t("nav_dashboard", lang)}
                {activeTab === "dashboard" && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
                )}
              </button>
            )}
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-[9px] tracking-[0.2em] font-medium text-muted-foreground font-sans select-none shrink-0 border border-border/40 rounded-full px-3 py-1 bg-card/45">
              <button
                type="button"
                onClick={() => changeLang("vi")}
                className={`hover:text-foreground transition-colors cursor-pointer ${
                  lang === "vi" ? "text-primary font-bold" : ""
                }`}
              >
                VI
              </button>
              <span className="text-border/40">|</span>
              <button
                type="button"
                onClick={() => changeLang("en")}
                className={`hover:text-foreground transition-colors cursor-pointer ${
                  lang === "en" ? "text-primary font-bold" : ""
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 hover:text-primary text-foreground transition-colors cursor-pointer rounded-full hover:bg-black/5"
            >
              <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-primary rounded-full" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setActiveTab("dashboard")}
                    className="flex items-center gap-2 cursor-pointer border border-border/40 rounded-full py-1.5 px-3.5 bg-black/5 hover:bg-black/10 transition-all text-xs font-medium text-foreground"
                  >
                    <FontAwesomeIcon icon={faUser} className="h-2.5 w-2.5 text-primary" />
                    <span>{user.firstName}</span>
                  </div>
                  <button
                    onClick={() => logout(lang)}
                    className="p-2 rounded-full hover:text-primary text-muted-foreground transition-colors cursor-pointer"
                    title={t("btn_logout", lang)}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModal("login")}
                  className="border border-border/80 hover:border-primary/60 text-foreground hover:text-primary text-xs font-semibold py-1.5 px-4.5 rounded-full bg-card hover:bg-muted/30 transition-all duration-300 flex items-center gap-2 cursor-pointer font-sans"
                >
                  <FontAwesomeIcon icon={faUser} className="h-2.5 w-2.5 text-primary" />
                  <span>{t("btn_signin", lang)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {user &&
        notifications &&
        (notifications.walletLow || (notifications.poolsLow && notifications.poolsLow.length > 0)) && (
          <div className="max-w-7xl mx-auto px-6 pt-4 space-y-2">
            {notifications.walletLow && !dismissedBanners.includes("wallet") && (
              <div className="flex items-start justify-between gap-3 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4 shrink-0" />
                  {lang === "vi"
                    ? `Số dư Ví của bạn đang thấp (còn ${formatVND(notifications.walletBalance)}). Nạp thêm gói để tiếp tục thanh toán bằng Ví.`
                    : `Your wallet balance is running low (${formatVND(notifications.walletBalance)} left). Buy a plan to top up.`}
                </span>
                <button
                  onClick={() => setDismissedBanners((prev) => [...prev, "wallet"])}
                  className="text-amber-700/70 hover:text-amber-900 font-bold shrink-0 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}
            {(notifications.poolsLow || []).map((p: any) => {
              const key = `pool:${p.subscriptionId}:${p.protein}`;
              if (dismissedBanners.includes(key)) return null;
              return (
                <div
                  key={key}
                  className="flex items-start justify-between gap-3 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3"
                >
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4 shrink-0" />
                    {lang === "vi"
                      ? `Gói "${p.packageName}" của bạn sắp hết ${PROTEIN_LABELS[p.protein as keyof typeof PROTEIN_LABELS] || p.protein} (còn ${formatGrams(p.remainingGrams)}).`
                      : `Your "${p.packageName}" plan is running low on ${PROTEIN_LABELS[p.protein as keyof typeof PROTEIN_LABELS] || p.protein} (${formatGrams(p.remainingGrams)} left).`}
                  </span>
                  <button
                    onClick={() => setDismissedBanners((prev) => [...prev, key])}
                    className="text-amber-700/70 hover:text-amber-900 font-bold shrink-0 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === "home" && <HomeSection lang={lang} menuItems={menuItems} setActiveTab={handleSetActiveTab} addToCart={addToCart} homeFrames={homeFrames} />}
        {activeTab === "menu" && <MenuSection lang={lang} menuItems={menuItems} isLoadingMenu={isLoadingMenu} selectedProtein={selectedProtein} setSelectedProtein={setSelectedProtein} addToCart={addToCart} />}
        {activeTab === "calculator" && <CalculatorSection lang={lang} />}
        {activeTab === "order-now" && (
          <OrderNowSection
            lang={lang}
            menuItems={menuItems}
            orderNowCart={orderNowCart}
            setOrderNowCart={setOrderNowCart}
            orderNowName={orderNowName}
            setOrderNowName={setOrderNowName}
            orderNowPhone={orderNowPhone}
            setOrderNowPhone={setOrderNowPhone}
            orderNowAddress={orderNowAddress}
            setOrderNowAddress={setOrderNowAddress}
            orderNowNotes={orderNowNotes}
            setOrderNowNotes={setOrderNowNotes}
            orderNowResult={orderNowResult}
            setOrderNowResult={setOrderNowResult}
            isSubmittingOrderNow={isSubmittingOrderNow}
            orderNowError={orderNowError}
            setOrderNowError={setOrderNowError}
            orderFlowType={orderFlowType}
            setOrderFlowType={setOrderFlowType}
            readyNowItems={readyNowItems}
            selectedProteinOrderNow={selectedProteinOrderNow}
            setSelectedProteinOrderNow={setSelectedProteinOrderNow}
            isLoadingMenu={isLoadingMenu}
            orderNowDiscountCode={orderNowDiscountCode}
            setOrderNowDiscountCode={setOrderNowDiscountCode}
            orderNowVerifiedDiscount={orderNowVerifiedDiscount}
            orderNowDiscountCodeStatus={orderNowDiscountCodeStatus}
            orderNowDiscountCodeError={orderNowDiscountCodeError}
            hasActivePlanDiscount={hasActivePlanDiscount}
            planDiscountPercent={planDiscountPercent}
            orderNowPaymentMethod={orderNowPaymentMethod}
            setOrderNowPaymentMethod={setOrderNowPaymentMethod}
            orderNowProvince={orderNowProvince}
            setOrderNowProvince={setOrderNowProvince}
            orderNowWard={orderNowWard}
            setOrderNowWard={setOrderNowWard}
            orderNowStreet={orderNowStreet}
            setOrderNowStreet={setOrderNowStreet}
            orderNowAgreeTerms={orderNowAgreeTerms}
            setOrderNowAgreeTerms={setOrderNowAgreeTerms}
            customOrderProtein={customOrderProtein}
            setCustomOrderProtein={setCustomOrderProtein}
            customOrderSize={customOrderSize}
            setCustomOrderSize={setCustomOrderSize}
            customOrderCarb={customOrderCarb}
            setCustomOrderCarb={setCustomOrderCarb}
            customOrderToppings={customOrderToppings}
            setCustomOrderToppings={setCustomOrderToppings}
            customOrderSauce={customOrderSauce}
            setCustomOrderSauce={setCustomOrderSauce}
            customOrderDeliveryDate={customOrderDeliveryDate}
            setCustomOrderDeliveryDate={setCustomOrderDeliveryDate}
            customOrderQty={customOrderQty}
            setCustomOrderQty={setCustomOrderQty}
            handleSubmitOrderNow={handleSubmitOrderNow}
          />
        )}
        {activeTab === "wallet" && (
          <WalletSection
            lang={lang}
            user={user}
            walletBalance={walletBalance}
            planDiscountPercent={planDiscountPercent}
            planDiscountEndsAt={planDiscountEndsAt}
            subscriptionPlans={subscriptionPlans}
            isLoadingPlans={isLoadingPlans}
            purchasingPlanId={purchasingPlanId}
            planPurchaseResult={planPurchaseResult}
            setPlanPurchaseResult={setPlanPurchaseResult}
            handleBuyPlan={handleBuyPlan}
            setShowWalletPlans={setShowWalletPlans}
            showWalletPlans={showWalletPlans}
            selectedUpgradePlanId={selectedUpgradePlanId}
            setSelectedUpgradePlanId={setSelectedUpgradePlanId}
            upgradeRequestNotes={upgradeRequestNotes}
            setUpgradeRequestNotes={setUpgradeRequestNotes}
            isSubmittingUpgradeRequest={isSubmittingUpgradeRequest}
            handleSubmitUpgradeRequest={handleSubmitUpgradeRequest}
            myUpgradeRequests={myUpgradeRequests}
          />
        )}
        {activeTab === "subscriptions" && (
          <SubscriptionsSection
            lang={lang}
            user={user}
            mySubscriptions={mySubscriptions}
            lookupPhone={lookupPhone}
            setLookupPhone={setLookupPhone}
            myPoolSubscriptions={myPoolSubscriptions}
            isLookupLoading={isLookupLoading}
            lookupError={lookupError}
            hasLookedUp={hasLookedUp}
            handleLookupSubscription={handleLookupSubscription}
            handlePostponeMyDelivery={handlePostponeMyDelivery}
            handlePayFromWallet={handlePayFromWallet}
            payingSubscriptionId={payingSubscriptionId}
            payFromWalletError={payFromWalletError}
            setAuthModal={setAuthModal}
            walletBalance={walletBalance}
            planDiscountPercent={planDiscountPercent}
            planDiscountEndsAt={planDiscountEndsAt}
            subscriptionPlans={subscriptionPlans}
            isLoadingPlans={isLoadingPlans}
            purchasingPlanId={purchasingPlanId}
            showWalletPlans={showWalletPlans}
            setShowWalletPlans={setShowWalletPlans}
            selectedUpgradePlanId={selectedUpgradePlanId}
            setSelectedUpgradePlanId={setSelectedUpgradePlanId}
            upgradeRequestNotes={upgradeRequestNotes}
            setUpgradeRequestNotes={setUpgradeRequestNotes}
            isSubmittingUpgradeRequest={isSubmittingUpgradeRequest}
            handleSubmitUpgradeRequest={handleSubmitUpgradeRequest}
            myUpgradeRequests={myUpgradeRequests}
            handleBuyPlan={handleBuyPlan}
          />
        )}
        {activeTab === "dashboard" && (
          <DashboardSection
            lang={lang}
            user={user}
            myOrders={myOrders}
            mySubscriptions={mySubscriptions}
            isLoadingDashboard={isLoadingDashboard}
            dashboardSection={dashboardSection}
            setDashboardSection={setDashboardSection}
            trackPhone={trackPhone}
            setTrackPhone={setTrackPhone}
            trackedOrders={trackedOrders}
            isTrackingLoading={isTrackingLoading}
            trackingError={trackingError}
            hasTracked={hasTracked}
            handleTrackOrders={handleTrackOrders}
            setAuthModal={setAuthModal}
          />
        )}
      </main>

      <CartDrawer
        lang={lang}
        isCartOpen={isCartOpen}
        setCartOpen={setCartOpen}
        cart={cart}
        cartCount={cartCount}
        removeFromCart={removeFromCart}
        updateCartQuantity={updateCartQuantity}
        checkoutStep={checkoutStep}
        setCheckoutStep={setCheckoutStep}
        hasActivePlanDiscount={hasActivePlanDiscount}
        planDiscountPercent={planDiscountPercent}
        verifiedDiscount={verifiedDiscount}
        checkoutNotes={checkoutNotes}
        setCheckoutNotes={setCheckoutNotes}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        checkoutAgreeTerms={checkoutAgreeTerms}
        setCheckoutAgreeTerms={setCheckoutAgreeTerms}
        isSubmittingOrder={isSubmittingOrder}
        checkoutError={checkoutError}
        handleCheckout={handleCheckout}
        checkoutProvince={checkoutProvince}
        setCheckoutProvince={setCheckoutProvince}
        checkoutStreet={checkoutStreet}
        setCheckoutStreet={setCheckoutStreet}
      />

      <AuthModal lang={lang} authModal={authModal} setAuthModal={setAuthModal} login={login} signup={signup} />
      <PrivacyModal lang={lang} showPrivacyModal={showPrivacyModal} setShowPrivacyModal={setShowPrivacyModal} />
      <VietQRModal lang={lang} checkoutResult={checkoutResult} setCheckoutResult={setCheckoutResult} setCartOpen={setCartOpen} setActiveTab={handleSetActiveTab} clearCart={clearCart} setDiscountCode={setDiscountCode} />
      <MobileNav lang={lang} activeTab={activeTab} setActiveTab={handleSetActiveTab} user={user} setAuthModal={setAuthModal} />
      <Footer lang={lang} setShowPrivacyModal={setShowPrivacyModal} />
    </div>
  );
}