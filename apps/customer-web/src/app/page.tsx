"use client";

import * as React from "react";
import { useApp } from "../providers/app-context";
import { useToast } from "@fortifykitchen/ui";
import { MenuItem, Protein } from "@fortifykitchen/types";
import { getMenuItemLabel, PROTEIN_LABELS } from "@fortifykitchen/shared";
// @ts-expect-error - sub-vn lacks typings
import { getProvinces, getDistrictsByProvinceCode, getWardsByDistrictCode } from "sub-vn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingBag,
  faUser,
  faPlus,
  faMinus,
  faTrashAlt,
  faSpinner,
  faCheckCircle,
  faClock,
  faTruck,
  faUtensils,
  faInfoCircle,
  faQrcode,
  faSignOutAlt,
  faMagic,
  faMapMarkerAlt,
  faTag,
  faCreditCard,
  faCheck,
  faSearch,
  faCalendarAlt
} from "@fortawesome/free-solid-svg-icons";
import { formatGrams } from "@fortifykitchen/shared";

// Order status labels for the customer-facing "Track my order" lookup â€”
// same underlying DeliveryStatus enum the admin Orders tab uses
// (SCHEDULED/PREPPING/DELIVERED/SKIPPED/CANCELLED), just worded for a
// customer audience in Vietnamese.
const DICTIONARY = {
  vi: {
    // Navigation
    nav_menu: "Thá»±c Ä‘Æ¡n",
    nav_order: "Giao ngay",
    nav_sub: "GÃ³i Há»™i viÃªn",
    nav_dashboard: "CÃ¡ nhÃ¢n",
    btn_signin: "ÄÄƒng nháº­p",
    btn_logout: "ÄÄƒng xuáº¥t",

    // Menu
    menu_title: "Thá»±c Ä‘Æ¡n Dinh dÆ°á»¡ng",
    menu_subtitle: "Thá»±c Ä‘Æ¡n giÃ u Protein chuáº©n Gourmet Ä‘Æ°á»£c thiáº¿t káº¿ bá»Ÿi Ä‘áº§u báº¿p chuyÃªn nghiá»‡p Ä‘á»ƒ tá»‘i Æ°u má»¥c tiÃªu dinh dÆ°á»¡ng cá»§a báº¡n.",
    filter_all: "Táº¥t cáº£",
    filter_BEEF: "Thá»‹t BÃ²",
    filter_CHICKEN: "Thá»‹t GÃ ",
    filter_SHRIMP: "TÃ´m",
    filter_PORK: "Thá»‹t Heo",
    filter_FISH: "Thá»‹t CÃ¡",
    filter_VEGAN: "MÃ³n Chay",
    unit_stock: "sáºµn cÃ³",
    btn_add_cart: "ThÃªm vÃ o giá»",
    btn_out_of_stock: "Háº¿t hÃ ng",
    protein_level: "Protein",

    // Subscriptions
    sub_title: "GÃ³i Há»™i viÃªn Protein",
    sub_subtitle: "ÄÄƒng kÃ½ gÃ³i há»™i viÃªn Ä‘á»‹nh ká»³ Ä‘á»ƒ nháº­n háº¡n má»©c Protein vá»›i má»©c chiáº¿t kháº¥u cá»±c tá»‘t, linh hoáº¡t Ä‘iá»u phá»‘i giao bá»¯a Äƒn hÃ ng tuáº§n.",
    sub_days: "ngÃ y",
    sub_credit: "Háº¡n má»©c Protein",
    sub_pricing: "GiÃ¡ trá»‹ gÃ³i",
    sub_per_kg: "TÆ°Æ¡ng Ä‘Æ°Æ¡ng",
    sub_accepts: "Cháº¥p nháº­n COD",
    btn_subscribe: "ÄÄƒng kÃ½ gÃ³i há»™i viÃªn",
    txt_sub_disclaim: "GÃ³i há»™i viÃªn Ä‘á»‹nh ká»³ sáº½ Ä‘Æ°á»£c kÃ­ch hoáº¡t bá»Ÿi nhÃ¢n viÃªn cá»§a chÃºng tÃ´i sau khi xÃ¡c minh thÃ´ng tin. Vui lÃ²ng liÃªn há»‡ hotline Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£ nhanh nháº¥t.",

    // Cart Drawer
    cart_title: "Giá» hÃ ng cá»§a báº¡n",
    cart_empty: "Giá» hÃ ng cá»§a báº¡n Ä‘ang trá»‘ng.",
    cart_subtotal: "Táº¡m tÃ­nh",
    cart_discount: "Giáº£m giÃ¡",
    cart_shipping: "PhÃ­ váº­n chuyá»ƒn",
    cart_total: "Tá»•ng thanh toÃ¡n",
    cart_coupon: "MÃ£ giáº£m giÃ¡",
    cart_apply: "Ãp dá»¥ng",
    cart_applied: "ÄÃ£ Ã¡p dá»¥ng mÃ£",
    cart_invalid_coupon: "MÃ£ giáº£m giÃ¡ khÃ´ng há»£p lá»‡",
    cart_notes: "Ghi chÃº Ä‘Æ¡n hÃ ng",
    cart_payment: "PhÆ°Æ¡ng thá»©c thanh toÃ¡n",
    cart_cod: "Thanh toÃ¡n khi nháº­n hÃ ng (COD)",
    cart_vietqr: "VietQR Chuyá»ƒn khoáº£n (CÃ³ mÃ£ QR)",
    cart_address: "Äá»‹a chá»‰ nháº­n hÃ ng",
    cart_province: "Tá»‰nh / ThÃ nh phá»‘",
    cart_ward: "PhÆ°á»ng / XÃ£",
    cart_street: "Sá»‘ nhÃ , tÃªn Ä‘Æ°á»ng...",
    cart_agree: "TÃ´i Ä‘á»“ng Ã½ vá»›i",
    cart_terms: "Äiá»u khoáº£n sá»­ dá»¥ng & ChÃ­nh sÃ¡ch báº£o máº­t",
    btn_checkout: "Äáº·t hÃ ng ngay",

    // Order Success Modal
    success_title: "Äáº·t hÃ ng thÃ nh cÃ´ng!",
    success_desc: "Cáº£m Æ¡n báº¡n Ä‘Ã£ lá»±a chá»n Fortify Kitchen.",
    success_cod_desc: "ÄÆ¡n hÃ ng cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n thÃ nh cÃ´ng vÃ  sáº½ Ä‘Æ°á»£c giao sá»›m nháº¥t cÃ³ thá»ƒ. Vui lÃ²ng thanh toÃ¡n tiá»n máº·t khi nháº­n hÃ ng.",
    success_vietqr_desc: "Vui lÃ²ng quÃ©t mÃ£ QR dÆ°á»›i Ä‘Ã¢y hoáº·c chuyá»ƒn khoáº£n ngÃ¢n hÃ ng Ä‘á»ƒ thanh toÃ¡n cho Ä‘Æ¡n hÃ ng.",
    bank_name: "NgÃ¢n hÃ ng",
    bank_acc: "Sá»‘ tÃ i khoáº£n",
    bank_holder: "Chá»§ tÃ i khoáº£n",
    bank_amount: "Sá»‘ tiá»n",
    bank_memo: "Ná»™i dung chuyá»ƒn khoáº£n",
    btn_done: "TÃ´i Ä‘Ã£ chuyá»ƒn khoáº£n / ÄÃ³ng",

    // Auth & Modals
    auth_login_title: "ÄÄƒng nháº­p tÃ i khoáº£n",
    auth_register_title: "ÄÄƒng kÃ½ thÃ nh viÃªn má»›i",
    auth_desc: "Tham gia Fortify Kitchen Ä‘á»ƒ Ä‘áº·t mÃ³n vÃ  theo dÃµi gÃ³i há»™i viÃªn dá»… dÃ ng.",
    auth_coupon_hint: "ðŸŽ ÄÄƒng kÃ½ tÃ i khoáº£n ngay hÃ´m nay Ä‘á»ƒ nháº­n mÃ£ giáº£m giÃ¡ WELCOME10 giáº£m 10% cho Ä‘Æ¡n hÃ ng Ä‘áº§u tiÃªn!",
    auth_email: "Äá»‹a chá»‰ Email",
    auth_password: "Máº­t kháº©u",
    auth_first: "TÃªn",
    auth_last: "Há»",
    auth_phone: "Sá»‘ Ä‘iá»‡n thoáº¡i",
    auth_address: "Äá»‹a chá»‰ giao hÃ ng",
    btn_submit_login: "ÄÄƒng nháº­p",
    btn_submit_register: "ÄÄƒng kÃ½ & Äá»“ng Ã½ Äiá»u khoáº£n",
    auth_toggle_to_register: "ChÆ°a cÃ³ tÃ i khoáº£n? ÄÄƒng kÃ½ ngay",
    auth_toggle_to_login: "ÄÃ£ cÃ³ tÃ i khoáº£n? ÄÄƒng nháº­p ngay",

    // Dashboard
    dash_title: "Báº£ng Ä‘iá»u khiá»ƒn cÃ¡ nhÃ¢n",
    dash_subtitle: "Quáº£n lÃ½ Ä‘Æ¡n hÃ ng, theo dÃµi giao hÃ ng vÃ  sá»‘ dÆ° gÃ³i há»™i viÃªn cá»§a báº¡n.",
    dash_orders_title: "Lá»‹ch sá»­ Ä‘Æ¡n hÃ ng",
    dash_orders_empty: "Báº¡n chÆ°a cÃ³ Ä‘Æ¡n hÃ ng nÃ o.",
    dash_subs_title: "GÃ³i há»™i viÃªn Ä‘ang hoáº¡t Ä‘á»™ng",
    dash_subs_empty: "Báº¡n chÆ°a Ä‘Äƒng kÃ½ gÃ³i há»™i viÃªn nÃ o.",
    dash_balance: "Sá»‘ dÆ° Protein",
    dash_status: "Tráº¡ng thÃ¡i",
    dash_delivery_date: "NgÃ y giao",
    dash_payment: "Thanh toÃ¡n",
    order_id: "MÃ£ Ä‘Æ¡n hÃ ng",
    status_label: "Tráº¡ng thÃ¡i giao",
    order_title: "Sáºµn sÃ ng giao ngay",
    order_subtitle: "Äáº·t mÃ³n Äƒn dinh dÆ°á»¡ng cháº¿ biáº¿n sáºµn, giao nÃ³ng há»•i trong 30-45 phÃºt, khÃ´ng cáº§n Ä‘Äƒng kÃ½ tÃ i khoáº£n.",
    txt_order_ready: "ÄÆ¡n hÃ ng giao ngay cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c tiáº¿p nháº­n vÃ  Ä‘ang Ä‘Æ°á»£c Ä‘áº§u báº¿p chuáº©n bá»‹.",
    txt_order_scheduled: "ÄÆ¡n hÃ ng cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c lÃªn lá»‹ch thÃ nh cÃ´ng.",
    txt_total: "Tá»•ng cá»™ng",
    btn_order_more: "Äáº·t thÃªm mÃ³n",
    txt_your_order: "ÄÆ¡n hÃ ng cá»§a báº¡n",
    txt_empty_cart: "Giá» hÃ ng giao nhanh cá»§a báº¡n Ä‘ang trá»‘ng.",
    placeholder_name: "Há» vÃ  tÃªn cá»§a báº¡n",
    placeholder_phone: "Sá»‘ Ä‘iá»‡n thoáº¡i cá»§a báº¡n",
    placeholder_notes: "Ghi chÃº (tÃ¹y chá»n)",
    payment_cod: "Tiá»n máº·t (COD)",
    payment_vietqr: "VietQR chuyá»ƒn khoáº£n",
  },
  en: {
    // Navigation
    nav_menu: "Menu",
    nav_order: "Order Now",
    nav_sub: "Subscriptions",
    nav_dashboard: "Dashboard",
    btn_signin: "Sign In",
    btn_logout: "Logout",

    // Menu
    menu_title: "Nutritional Menu",
    menu_subtitle: "Chef-designed, gourmet protein-rich meals optimized for your health and nutrition goals.",
    filter_all: "All Proteins",
    filter_BEEF: "Beef",
    filter_CHICKEN: "Chicken",
    filter_SHRIMP: "Shrimp",
    filter_PORK: "Pork",
    filter_FISH: "Fish",
    filter_VEGAN: "Vegan",
    unit_stock: "in stock",
    btn_add_cart: "Add to Cart",
    btn_out_of_stock: "Out of Stock",
    protein_level: "Protein",

    // Subscriptions
    sub_title: "Protein Pool Subscriptions",
    sub_subtitle: "Subscribe to recurring plans for bulk protein credit at deep discounts, with flexible weekly meal delivery scheduling.",
    sub_days: "days",
    sub_credit: "Protein Credit",
    sub_pricing: "Plan Price",
    sub_per_kg: "Equivalent to",
    sub_accepts: "COD Accepted",
    btn_subscribe: "Subscribe Plan",
    txt_sub_disclaim: "Recurring memberships are manually activated by staff after info verification. Please contact support for assistance.",

    // Cart Drawer
    cart_title: "Your Cart",
    cart_empty: "Your cart is empty.",
    cart_subtotal: "Subtotal",
    cart_discount: "Discount",
    cart_shipping: "Shipping Fee",
    cart_total: "Total",
    cart_coupon: "Coupon Code",
    cart_apply: "Apply",
    cart_applied: "Coupon applied",
    cart_invalid_coupon: "Invalid coupon code",
    cart_notes: "Order Notes",
    cart_payment: "Payment Method",
    cart_cod: "Cash on Delivery (COD)",
    cart_vietqr: "VietQR Bank Transfer (with QR)",
    cart_address: "Delivery Address",
    cart_province: "Province / City",
    cart_ward: "Ward / Commune",
    cart_street: "Street address, home number...",
    cart_agree: "I agree to the",
    cart_terms: "Terms of Use & Privacy Policy",
    btn_checkout: "Checkout Now",

    // Order Success Modal
    success_title: "Order Placed Successfully!",
    success_desc: "Thank you for choosing Fortify Kitchen.",
    success_cod_desc: "Your order has been recorded and will be delivered shortly. Please pay cash upon arrival.",
    success_vietqr_desc: "Please scan the QR code below or use bank transfer to pay for your order.",
    bank_name: "Bank",
    bank_acc: "Account No.",
    bank_holder: "Account Name",
    bank_amount: "Amount",
    bank_memo: "Transfer Note",
    btn_done: "I have transferred / Close",

    // Auth & Modals
    auth_login_title: "Sign In to Your Profile",
    auth_register_title: "Register a New Profile",
    auth_desc: "Join Fortify Kitchen to place orders and manage meals.",
    auth_coupon_hint: "ðŸŽ Register today to receive coupon WELCOME10 for 10% off your first order!",
    auth_email: "Email Address",
    auth_password: "Password",
    auth_first: "First Name",
    auth_last: "Last Name",
    auth_phone: "Phone Number",
    auth_address: "Delivery Address",
    btn_submit_login: "Sign In",
    btn_submit_register: "Register & Agree to Terms",
    auth_toggle_to_register: "Don't have an account? Sign up",
    auth_toggle_to_login: "Already have an account? Sign in",

    // Dashboard
    dash_title: "My Dashboard",
    dash_subtitle: "Manage your orders, track active deliveries, and review package balances.",
    dash_orders_title: "Order History",
    dash_orders_empty: "You have no order history yet.",
    dash_subs_title: "Active Subscriptions",
    dash_subs_empty: "You have no active memberships.",
    dash_balance: "Protein Balance",
    dash_status: "Status",
    dash_delivery_date: "Delivery Date",
    dash_payment: "Payment",
    order_id: "Order ID",
    status_label: "Delivery Status",
    order_title: "Ready to Deliver",
    order_subtitle: "Order pre-prepared nutritious meals, delivered hot in 30-45 minutes, no account registration required.",
    txt_order_ready: "Your delivery order has been received and is being prepared by our chef.",
    txt_order_scheduled: "Your order has been successfully scheduled.",
    txt_total: "Total",
    btn_order_more: "Order More",
    txt_your_order: "Your Order",
    txt_empty_cart: "Your quick checkout cart is empty.",
    placeholder_name: "Your full name",
    placeholder_phone: "Your phone number",
    placeholder_notes: "Notes (optional)",
    payment_cod: "Cash on Delivery (COD)",
    payment_vietqr: "VietQR Bank Transfer",
  }
};

const ORDER_STATUS_LABELS: Record<"vi" | "en", Record<string, string>> = {
  vi: {
    SCHEDULED: "ÄÃ£ Ä‘áº·t",
    PREPPING: "Äang chuáº©n bá»‹",
    DELIVERED: "HoÃ n thÃ nh",
    SKIPPED: "ÄÃ£ bá» qua",
    CANCELLED: "ÄÃ£ huá»·",
  },
  en: {
    SCHEDULED: "Scheduled",
    PREPPING: "Prepping",
    DELIVERED: "Delivered",
    SKIPPED: "Skipped",
    CANCELLED: "Cancelled",
  }
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

  // In-app replacement for window.confirm â€” used for the one destructive
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

  // "Order Now" â€” in-stock items only, ready today with no login required.
  // This is a separate, self-contained flow from the regular cart/checkout
  // above (which requires an account) since in-stock orders should be as
  // frictionless as possible: just name + phone + address, like the
  // subscription phone-lookup view. Server still re-verifies stock and
  // decides IMMEDIATE vs SCHEDULED â€” this is just what the UI shows before
  // submitting.
  const [orderNowCart, setOrderNowCart] = React.useState<{ menuItem: MenuItem; qty: number }[]>([]);
  const [orderNowName, setOrderNowName] = React.useState("");
  const [orderNowPhone, setOrderNowPhone] = React.useState("");
  const [orderNowAddress, setOrderNowAddress] = React.useState("");
  const [orderNowNotes, setOrderNowNotes] = React.useState("");
  const [isSubmittingOrderNow, setIsSubmittingOrderNow] = React.useState(false);
  const [orderNowResult, setOrderNowResult] = React.useState<any | null>(null);
  const [orderNowError, setOrderNowError] = React.useState<string | null>(null);

  // Address states
  const [orderNowProvince, setOrderNowProvince] = React.useState("");
  const [orderNowWard, setOrderNowWard] = React.useState("");
  const [orderNowStreet, setOrderNowStreet] = React.useState("");
  const [orderNowAgreeTerms, setOrderNowAgreeTerms] = React.useState(false);
  const [orderNowPaymentMethod, setOrderNowPaymentMethod] = React.useState("CASH_ON_DELIVERY");

  const [checkoutProvince, setCheckoutProvince] = React.useState("");
  const [checkoutWard, setCheckoutWard] = React.useState("");
  const [checkoutStreet, setCheckoutStreet] = React.useState("");
  const [checkoutAgreeTerms, setCheckoutAgreeTerms] = React.useState(false);
  const [isEditingAddress, setIsEditingAddress] = React.useState(false);
  const [checkoutResult, setCheckoutResult] = React.useState<any | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [signupAgreeTerms, setSignupAgreeTerms] = React.useState(false);

  // Language translation State
  const [lang, setLang] = React.useState<"vi" | "en">("vi");

  // Read language preference from localStorage on mount
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

  const t = (key: keyof typeof DICTIONARY.vi) => {
    return DICTIONARY[lang][key] || DICTIONARY.vi[key] || key;
  };

  // Reconstruct Guest Address
  React.useEffect(() => {
    if (orderNowProvince && orderNowWard) {
      const p = getProvinces().find((x: any) => x.code === orderNowProvince);
      const districts = getDistrictsByProvinceCode(orderNowProvince);
      let foundWard: any = null;
      for (const d of districts) {
        const wList = getWardsByDistrictCode(d.code);
        const w = wList.find((x: any) => x.code === orderNowWard);
        if (w) {
          foundWard = w;
          break;
        }
      }
      if (p && foundWard) {
        const fullAddr = `${orderNowStreet.trim() ? orderNowStreet.trim() + ", " : ""}${foundWard.name}, ${p.name}`;
        setOrderNowAddress(fullAddr);
      }
    } else {
      setOrderNowAddress("");
    }
  }, [orderNowProvince, orderNowWard, orderNowStreet]);

  // Reconstruct Member Address
  React.useEffect(() => {
    if (checkoutProvince && checkoutWard) {
      const p = getProvinces().find((x: any) => x.code === checkoutProvince);
      const districts = getDistrictsByProvinceCode(checkoutProvince);
      let foundWard: any = null;
      for (const d of districts) {
        const wList = getWardsByDistrictCode(d.code);
        const w = wList.find((x: any) => x.code === checkoutWard);
        if (w) {
          foundWard = w;
          break;
        }
      }
      if (p && foundWard) {
        const fullAddr = `${checkoutStreet.trim() ? checkoutStreet.trim() + ", " : ""}${foundWard.name}, ${p.name}`;
        setCheckoutAddress(fullAddr);
      }
    }
  }, [checkoutProvince, checkoutWard, checkoutStreet]);

  // "Track my order" â€” self-serve status check by phone number, the
  // customer-facing counterpart to the admin's Accept/Complete workflow.
  // There's no SMS/push notification service connected yet, so this lookup
  // is how a customer finds out their order moved to "Äang chuáº©n bá»‹" or
  // "HoÃ n thÃ nh" rather than a message arriving automatically.
  const [trackPhone, setTrackPhone] = React.useState("");
  const [trackedOrders, setTrackedOrders] = React.useState<any[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = React.useState(false);
  const [trackingError, setTrackingError] = React.useState<string | null>(null);
  const [hasTracked, setHasTracked] = React.useState(false);

  // My Subscription (volume-based) lookup state â€” subscriptions are set up
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
  const [rememberMe, setRememberMe] = React.useState(false);

  // Restore saved credentials if remember me was enabled
  React.useEffect(() => {
    if (authModal === "login") {
      const savedEmail = localStorage.getItem("fk_remember_email");
      const savedPass = localStorage.getItem("fk_remember_pass");
      if (savedEmail) {
        setLoginEmail(savedEmail);
        setRememberMe(true);
      }
      if (savedPass) {
        setLoginPass(savedPass);
      }
    }
  }, [authModal]);

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
  const [selectedProteinOrderNow, setSelectedProteinOrderNow] = React.useState<Protein | "">("");
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
      if (rememberMe) {
        localStorage.setItem("fk_remember_email", loginEmail);
        localStorage.setItem("fk_remember_pass", loginPass);
      } else {
        localStorage.removeItem("fk_remember_email");
        localStorage.removeItem("fk_remember_pass");
      }
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
      if (paymentMethod === "BANK_TRANSFER") {
        setCheckoutResult(result);
      } else {
        setCartOpen(false);
        setActiveTab("dashboard");
      }
    }
  };

  // Volume subscriptions are set up by staff (see the admin dashboard's
  // Subscriptions tab) â€” there's no self-checkout for a brand new
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
        setLookupError(result?.message || "KhÃ´ng thá»ƒ tra cá»©u lÃºc nÃ y");
        setMyPoolSubscriptions([]);
      }
    } catch (err) {
      console.error(err);
      setLookupError("Lá»—i káº¿t ná»‘i â€” vui lÃ²ng thá»­ láº¡i");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handlePostponeMyDelivery = (deliveryId: string) => {
    requestConfirm(
      "HoÃ£n láº§n giao nÃ y? Sá»‘ lÆ°á»£ng sáº½ Ä‘Æ°á»£c báº£o lÆ°u, lá»‹ch giao sau Ä‘Ã³ sáº½ dá»i láº¡i má»™t chu ká»³.",
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
            toast({ title: result?.message || "KhÃ´ng thá»ƒ hoÃ£n láº§n giao nÃ y", type: "error" });
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
    return `${num.toLocaleString()} â‚«`;
  };

  // Items with live stock ready right now â€” the storefront's Order Now tab
  // only ever shows these, so a normal Order Now checkout should always
  // resolve IMMEDIATE server-side (barring a stock race with another
  // customer, which the server handles by falling back to SCHEDULED).
  const readyNowItems = menuItems.filter((m) => (m.stockQuantity ?? 0) > 0);
  const filteredReadyNowItems = selectedProteinOrderNow
    ? readyNowItems.filter((item) => item.protein === selectedProteinOrderNow)
    : readyNowItems;

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
          paymentMethod: orderNowPaymentMethod,
          items: orderNowCart.map((l) => ({ menuItemId: l.menuItem.id, qty: l.qty })),
        }),
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setOrderNowResult(result.data);
        setOrderNowCart([]);
      } else {
        setOrderNowError(result?.message || "KhÃ´ng thá»ƒ Ä‘áº·t hÃ ng lÃºc nÃ y");
      }
    } catch (err) {
      console.error(err);
      setOrderNowError("Lá»—i káº¿t ná»‘i â€” vui lÃ²ng thá»­ láº¡i");
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
        setTrackingError(result?.message || "KhÃ´ng thá»ƒ tra cá»©u lÃºc nÃ y");
        setTrackedOrders([]);
      }
    } catch (err) {
      console.error(err);
      setTrackingError("Lá»—i káº¿t ná»‘i â€” vui lÃ²ng thá»­ láº¡i");
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

  // Groups same-flavor menu items (e.g. "GÃ  xÃ¡ xÃ­u 150g" + "GÃ  xÃ¡ xÃ­u 250g")
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
  // "protein::flavor" â€” defaults to the smallest available size when unset.
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 pb-20 md:pb-0">
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
              {t("nav_menu")}
            </button>
            <button
              onClick={() => setActiveTab("order-now")}
              className={`hover:text-primary transition-colors py-2 relative ${
                activeTab === "order-now" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              {t("nav_order")}
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`hover:text-primary transition-colors py-2 relative ${
                activeTab === "subscriptions" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              {t("nav_sub")}
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`hover:text-primary transition-colors py-2 relative ${
                  activeTab === "dashboard" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                }`}
              >
                {t("nav_dashboard")}
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Toggle (hidden on mobile header) */}
            <div className="hidden md:flex items-center border border-border bg-muted/20 p-0.5 rounded-full text-[10px] font-bold select-none shrink-0">
              <button
                type="button"
                onClick={() => changeLang("vi")}
                className={`px-2 py-1 rounded-full transition-colors cursor-pointer ${
                  lang === "vi"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => changeLang("en")}
                className={`px-2 py-1 rounded-full transition-colors cursor-pointer ${
                  lang === "en"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full border border-border bg-muted/30 hover:bg-muted transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Profile Area (hidden on mobile header since it is in the bottom nav) */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setActiveTab("dashboard")}
                    className="flex items-center gap-2 cursor-pointer border border-border rounded-full py-1.5 px-3 bg-muted/20 hover:bg-muted/50 transition-all"
                  >
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">{user.firstName}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2.5 rounded-full border border-border bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
                    title={t("btn_logout")}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModal("login")}
                  className="bg-primary text-primary-foreground text-xs font-bold py-2.5 px-5 rounded-full hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5" />
                  {t("btn_signin")}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      {activeTab !== "dashboard" && (
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-border bg-secondary/20">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full border border-border bg-muted/40 text-xs text-primary font-semibold">
                <FontAwesomeIcon icon={faMagic} className="h-3.5 w-3.5" />
                {lang === "vi" ? "Giao cÆ¡m & GÃ³i há»™i viÃªn dinh dÆ°á»¡ng cao cáº¥p táº¡i Viá»‡t Nam" : "Vietnam's Premium Meal Delivery & Subscription"}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight">
                {lang === "vi" ? (
                  <>Tiáº¿p nÄƒng lÆ°á»£ng vá»›i <span className="text-primary">Dinh dÆ°á»¡ng Gourmet</span></>
                ) : (
                  <>Fuel Your Body with <span className="text-primary">Gourmet Nutrition</span></>
                )}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                {lang === "vi"
                  ? "Salad há»¯u cÆ¡, cÆ¡m tÃ´ giÃ u protein vÃ  nÆ°á»›c Ã©p tÆ°Æ¡i Ä‘Æ°á»£c chuáº©n bá»‹ bá»Ÿi Ä‘áº§u báº¿p chuyÃªn nghiá»‡p, giao táº­n nÆ¡i táº¡i TP. Há»“ ChÃ­ Minh. Thanh toÃ¡n linh hoáº¡t báº±ng Tiá»n máº·t (COD) hoáº·c Chuyá»ƒn khoáº£n."
                  : "Expertly crafted organic salads, high-protein bowls, and fresh cold-pressed juices delivered straight to your door in Ho Chi Minh City. Pay easily via Cash on Delivery (COD) or Transfer."}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-md hover:bg-primary/90 transition-all cursor-pointer text-sm"
                >
                  {lang === "vi" ? "KhÃ¡m phÃ¡ Thá»±c Ä‘Æ¡n" : "Explore Menu"}
                </button>
                <button
                  onClick={() => setActiveTab("subscriptions")}
                  className="border border-border bg-muted/20 hover:bg-muted font-semibold px-8 py-3.5 rounded-md transition-all cursor-pointer text-sm"
                >
                  {lang === "vi" ? "Xem cÃ¡c GÃ³i há»™i viÃªn" : "Meal Subscription plans"}
                </button>
              </div>
            </div>
            <div className="relative h-80 sm:h-96 w-full rounded-2xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center shadow-xl">
              <div className="absolute inset-0 bg-primary/5" />
              <div className="text-center space-y-2 p-8 z-10">
                <FontAwesomeIcon icon={faUtensils} className="h-16 w-16 text-primary mx-auto opacity-70" />
                <h3 className="text-lg font-bold font-heading">
                  {lang === "vi" ? "NguyÃªn liá»‡u Sáº¡ch & TÆ°Æ¡i ngon" : "Clean & Fresh Ingredients Only"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {lang === "vi"
                    ? "Má»—i bá»¯a Äƒn Ä‘Æ°á»£c Ä‘Ã³ng gÃ³i hÃºt chÃ¢n khÃ´ng vÃ  lÃ m láº¡nh Ä‘á»ƒ giá»¯ trá»n váº¹n dinh dÆ°á»¡ng."
                    : "Every meal is vacuum-packed and chilled to preserve high nutrient profiles."}
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
                  {t("menu_title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("menu_subtitle")}
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
                  {t("filter_all")}
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
                    {t(`filter_${protein}` as any)}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {isLoadingMenu ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FontAwesomeIcon icon={faSpinner} className="h-10 w-10 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-semibold">
                  {lang === "vi" ? "Äang táº£i thá»±c Ä‘Æ¡n dinh dÆ°á»¡ng..." : "Loading nutritious menu..."}
                </span>
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <FontAwesomeIcon icon={faInfoCircle} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground font-medium">
                  {lang === "vi" ? "KhÃ´ng tÃ¬m tháº¥y mÃ³n Äƒn nÃ o trong danh má»¥c nÃ y." : "No menu items found in this category."}
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedMenu.map(({ protein, dishes }) => (
                  <div key={protein} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-muted-foreground">
                        {t(`filter_${protein}` as any)}
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
                                    className="object-cover h-full w-full"
                                  />
                                ) : (
                                  <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 text-muted-foreground/30" />
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
                                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                                {t("btn_add_cart")}
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

        {/* TAB 1.5: ORDER NOW â€” in-stock items only, ready today, no account
            needed. Separate from the cart/checkout flow above on purpose:
            this should be the fastest possible path to a hot meal. */}
        {activeTab === "order-now" && (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">{t("order_title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("order_subtitle")}
              </p>
            </div>

            {orderNowResult ? (
              <div className="max-w-md mx-auto border border-border bg-card rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 mx-auto text-emerald-500" />
                <h3 className="text-sm font-bold font-heading">{t("success_title")}</h3>
                <p className="text-xs text-muted-foreground">
                  {orderNowResult.fulfillmentType === "IMMEDIATE"
                    ? t("txt_order_ready")
                    : t("txt_order_scheduled")}
                </p>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("txt_total")}</span>
                  <p className="text-lg font-bold text-primary">{formatVND(orderNowResult.total)}</p>
                </div>

                {orderNowResult.paymentMethod === "BANK_TRANSFER" && (
                  <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-3 text-left">
                    <p className="text-xs font-bold text-foreground text-center">{lang === "vi" ? "QuÃ©t mÃ£ VietQR Ä‘á»ƒ thanh toÃ¡n" : "Scan VietQR Code to Pay"}</p>
                    <div className="bg-white p-2.5 rounded-lg border border-border w-40 h-40 mx-auto flex items-center justify-center">
                      <img
                        src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${orderNowResult.total}&addInfo=FK${orderNowResult.id.slice(0, 8)}&accountName=FORTIFY%20KITCHEN`}
                        alt="VietQR Payment Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{t("bank_name")}:</span>
                        <span className="font-bold text-foreground">MB Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("bank_acc")}:</span>
                        <span className="font-bold text-foreground font-mono">19035678901234</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("bank_holder")}:</span>
                        <span className="font-bold text-foreground uppercase">FORTIFY KITCHEN</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("bank_amount")}:</span>
                        <span className="font-bold text-primary font-mono">{formatVND(orderNowResult.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("bank_memo")}:</span>
                        <span className="font-bold text-primary font-mono">FK{orderNowResult.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 text-center leading-normal">
                      {lang === "vi"
                        ? "Vui lÃ²ng chuyá»ƒn khoáº£n Ä‘Ãºng sá»‘ tiá»n vÃ  ná»™i dung chuyá»ƒn khoáº£n Ä‘á»ƒ Ä‘Æ¡n hÃ ng Ä‘Æ°á»£c xÃ¡c nháº­n tá»± Ä‘á»™ng."
                        : "Please transfer the exact amount and note to auto-confirm your order."}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setOrderNowResult(null);
                    setOrderNowName("");
                    setOrderNowPhone("");
                    setOrderNowAddress("");
                    setOrderNowNotes("");
                    setOrderNowProvince("");
                    setOrderNowWard("");
                    setOrderNowStreet("");
                    setOrderNowAgreeTerms(false);
                  }}
                  className="w-full text-xs font-bold py-2.5 rounded-xl border border-border hover:bg-muted cursor-pointer transition-colors"
                >
                  {t("btn_order_more")}
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {/* Protein Filter for Order Now */}
                  <div className="flex flex-wrap gap-2 mb-4 bg-muted/20 p-2 rounded-xl border border-border/40">
                    <button
                      type="button"
                      onClick={() => setSelectedProteinOrderNow("")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedProteinOrderNow === ""
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t("filter_all")}
                    </button>
                    {["BEEF", "CHICKEN", "SHRIMP", "PORK", "FISH", "VEGAN"].map((protein) => {
                      // Only show categories that have items in stock
                      const hasItems = readyNowItems.some((m) => m.protein === protein);
                      if (!hasItems) return null;
                      return (
                        <button
                          key={protein}
                          type="button"
                          onClick={() => setSelectedProteinOrderNow(protein as any)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedProteinOrderNow === protein
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-transparent text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {t(`filter_${protein}` as any)}
                        </button>
                      );
                    })}
                  </div>

                  {isLoadingMenu ? (
                    <div className="flex justify-center py-16">
                      <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredReadyNowItems.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border rounded-xl">
                      <FontAwesomeIcon icon={faInfoCircle} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {lang === "vi" ? "Hiá»‡n chÆ°a cÃ³ mÃ³n nÃ o sáºµn sÃ ng giao ngay trong danh má»¥c nÃ y." : "No ready dishes currently available in this category."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {groupByFlavor(filteredReadyNowItems).map((dish) => {
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
                                {selected.stockQuantity} {t("unit_stock")}
                              </span>
                              {inCart ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateOrderNowQty(selected.id, inCart.qty - 1)}
                                    className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer"
                                  >
                                    <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                                  </button>
                                  <span className="text-xs font-bold w-4 text-center">{inCart.qty}</span>
                                  <button
                                    onClick={() => updateOrderNowQty(selected.id, inCart.qty + 1)}
                                    disabled={inCart.qty >= selected.stockQuantity}
                                    className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer disabled:opacity-30"
                                  >
                                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToOrderNowCart(selected)}
                                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer"
                                >
                                  {lang === "vi" ? "ThÃªm" : "Add"}
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
                  <h3 className="text-sm font-bold font-heading">{t("txt_your_order")}</h3>
                  {orderNowCart.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("txt_empty_cart")}</p>
                  ) : (
                    <div className="space-y-2">
                      {orderNowCart.map((l) => (
                        <div key={l.menuItem.id} className="flex justify-between text-xs">
                          <span className="truncate pr-2">{l.menuItem.flavor} Ã—{l.qty}</span>
                          <span className="font-semibold shrink-0">{formatVND(l.menuItem.price * l.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/50">
                        <span>{t("txt_total")}</span>
                        <span className="text-primary">{formatVND(orderNowTotal)}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitOrderNow} className="space-y-3.5 pt-2 border-t border-border/50">
                    <input
                      type="text"
                      required
                      placeholder={t("placeholder_name")}
                      value={orderNowName}
                      onChange={(e) => setOrderNowName(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                    />
                    <input
                      type="tel"
                      required
                      placeholder={t("placeholder_phone")}
                      value={orderNowPhone}
                      onChange={(e) => setOrderNowPhone(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                    />
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          required
                          value={orderNowProvince}
                          onChange={(e) => {
                            setOrderNowProvince(e.target.value);
                            setOrderNowWard("");
                          }}
                          className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-2.5 rounded-lg outline-none cursor-pointer text-foreground"
                        >
                          <option value="">{t("cart_province")}</option>
                          {getProvinces().map((p: any) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <select
                          required
                          disabled={!orderNowProvince}
                          value={orderNowWard}
                          onChange={(e) => setOrderNowWard(e.target.value)}
                          className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-2.5 rounded-lg outline-none cursor-pointer text-foreground disabled:opacity-50"
                        >
                          <option value="">{t("cart_ward")}</option>
                          {orderNowProvince &&
                            getDistrictsByProvinceCode(orderNowProvince)
                              .flatMap((d: any) => getWardsByDistrictCode(d.code).map((w: any) => ({ ...w, district_name: d.name })))
                              .map((w: any) => (
                                <option key={w.code} value={w.code}>
                                  {w.name} ({w.district_name})
                                </option>
                              ))}
                        </select>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder={t("cart_street")}
                        value={orderNowStreet}
                        onChange={(e) => setOrderNowStreet(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                      />
                    </div>

                    <textarea
                      placeholder={t("placeholder_notes")}
                      value={orderNowNotes}
                      onChange={(e) => setOrderNowNotes(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground resize-none"
                      rows={2}
                    />

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t("cart_payment")}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOrderNowPaymentMethod("CASH_ON_DELIVERY")}
                          className={`py-2 px-3 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            orderNowPaymentMethod === "CASH_ON_DELIVERY"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          <FontAwesomeIcon icon={faCreditCard} className="h-3.5 w-3.5 shrink-0" />
                          {t("payment_cod")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderNowPaymentMethod("BANK_TRANSFER")}
                          className={`py-2 px-3 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            orderNowPaymentMethod === "BANK_TRANSFER"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          <FontAwesomeIcon icon={faQrcode} className="h-3.5 w-3.5 shrink-0" />
                          {t("payment_vietqr")}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-start gap-2 text-[10px] text-muted-foreground select-none cursor-pointer py-1 leading-normal">
                      <input
                        type="checkbox"
                        required
                        checked={orderNowAgreeTerms}
                        onChange={(e) => setOrderNowAgreeTerms(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        {t("cart_agree")}{" "}
                        <button
                          type="button"
                          onClick={() => setShowPrivacyModal(true)}
                          className="text-primary font-semibold hover:underline"
                        >
                          {t("cart_terms")}
                        </button>
                      </span>
                    </label>

                    {orderNowError && <p className="text-[10px] text-red-500">{orderNowError}</p>}
                    <button
                      type="submit"
                      disabled={orderNowCart.length === 0 || isSubmittingOrderNow || !orderNowAgreeTerms}
                      className="w-full bg-primary text-primary-foreground text-xs font-bold py-3 rounded-xl hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingOrderNow && <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />}
                      {t("btn_checkout")}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Track my order â€” self-serve status check by phone. There's
                no SMS/push notification connected yet, so this is how a
                customer finds out staff accepted or completed their order. */}
            <div className="max-w-md mx-auto mt-16 pt-10 border-t border-border">
              <h3 className="text-center text-sm font-bold font-heading mb-1">
                {lang === "vi" ? "Theo dÃµi Ä‘Æ¡n hÃ ng cá»§a báº¡n" : "Track Your Orders"}
              </h3>
              <p className="text-center text-xs text-muted-foreground mb-5">
                {lang === "vi"
                  ? "Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ dÃ¹ng Ä‘á»ƒ Ä‘áº·t hÃ ng Ä‘á»ƒ xem tráº¡ng thÃ¡i má»›i nháº¥t."
                  : "Enter the phone number used during checkout to check the latest status."}
              </p>
              <form onSubmit={handleTrackOrders} className="flex gap-2 mb-6">
                <input
                  type="tel"
                  required
                  placeholder={lang === "vi" ? "Sá»‘ Ä‘iá»‡n thoáº¡i cá»§a báº¡n" : "Your phone number"}
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  className="flex-1 bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                />
                <button
                  type="submit"
                  disabled={isTrackingLoading}
                  className="bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground font-bold px-4 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 text-xs"
                >
                  {isTrackingLoading ? <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" /> : <FontAwesomeIcon icon={faSearch} className="h-3.5 w-3.5" />}
                  {lang === "vi" ? "Tra cá»©u" : "Track"}
                </button>
              </form>

              {trackingError && <p className="text-center text-xs text-red-500 mb-4">{trackingError}</p>}

              {hasTracked && !isTrackingLoading && !trackingError && trackedOrders.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {lang === "vi" ? "KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng nÃ o vá»›i sá»‘ Ä‘iá»‡n thoáº¡i nÃ y." : "No orders found with this phone number."}
                </p>
              )}

              <div className="space-y-3">
                {trackedOrders.map((o: any) => (
                  <div key={o.id} className="border border-border bg-card rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {(o.items || []).map((i: any) => `${i.flavor} Ã—${i.qty}`).join(", ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(o.deliveryDate).toLocaleDateString("vi-VN")} Â· {formatVND(o.total)}
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
                      {ORDER_STATUS_LABELS[lang][o.deliveryStatus] || o.deliveryStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY VOLUME SUBSCRIPTION (staff set these up â€” this is a
            phone-number lookup so a customer can check their remaining
            balance per protein and postpone today's delivery themselves) */}
        {activeTab === "subscriptions" && (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">
                {lang === "vi" ? "GÃ³i Ä‘Äƒng kÃ½ cá»§a báº¡n" : "Your Subscriptions"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === "vi"
                  ? "Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ Ä‘Äƒng kÃ½ vá»›i Fortify Kitchen Ä‘á»ƒ xem sá»‘ dÆ° Protein cÃ²n láº¡i vÃ  lá»‹ch giao sáº¯p tá»›i."
                  : "Enter your registered phone number to check remaining Protein balance and upcoming delivery schedules."}
              </p>
            </div>

            <form onSubmit={handleLookupSubscription} className="max-w-md mx-auto flex gap-2 mb-10">
              <input
                type="tel"
                required
                placeholder={lang === "vi" ? "Sá»‘ Ä‘iá»‡n thoáº¡i cá»§a báº¡n" : "Your phone number"}
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className="flex-1 bg-input border border-border focus:border-primary text-sm py-3 px-4 rounded-lg outline-none text-foreground"
              />
              <button
                type="submit"
                disabled={isLookupLoading}
                className="bg-primary text-primary-foreground font-bold px-5 rounded-lg hover:bg-primary/95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLookupLoading ? <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" /> : <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />}
                {lang === "vi" ? "Tra cá»©u" : "Lookup"}
              </button>
            </form>

            {lookupError && (
              <p className="text-center text-xs text-red-500 mb-8">{lookupError}</p>
            )}

            {hasLookedUp && !isLookupLoading && !lookupError && myPoolSubscriptions.length === 0 && (
              <div className="max-w-md mx-auto text-center py-10 border border-dashed border-border rounded-xl">
                <FontAwesomeIcon icon={faInfoCircle} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  {lang === "vi" ? "KhÃ´ng tÃ¬m tháº¥y gÃ³i Ä‘Äƒng kÃ½ nÃ o vá»›i sá»‘ Ä‘iá»‡n thoáº¡i nÃ y." : "No subscriptions found associated with this phone number."}
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
                        {lang === "vi"
                          ? `Giao ${formatGrams(sub.deliveryAmountGrams)} má»—i ${sub.deliveryIntervalDays} ngÃ y`
                          : `Deliver ${formatGrams(sub.deliveryAmountGrams)} every ${sub.deliveryIntervalDays} days`}
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
                            <span className="font-semibold">{t(`filter_${p.protein}` as any)}</span>
                            <span className="text-muted-foreground">
                              {lang === "vi"
                                ? `cÃ²n ${formatGrams(p.remainingGrams)} / ${formatGrams(p.totalGrams)}`
                                : `remaining ${formatGrams(p.remainingGrams)} / ${formatGrams(p.totalGrams)}`}
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
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-3.5 w-3.5 text-primary" /> {lang === "vi" ? "Lá»‹ch giao sáº¯p tá»›i" : "Upcoming Deliveries"}
                      </h4>
                      {sub.upcomingDeliveries.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(d.scheduledDate).toLocaleDateString("vi-VN")} â€”{" "}
                            {d.items.map((i: any) => `${i.flavor} Ã—${i.qty}`).join(", ")}
                          </span>
                          <button
                            onClick={() => handlePostponeMyDelivery(d.id)}
                            className="text-[10px] font-bold px-2 py-1 rounded border border-border hover:bg-muted cursor-pointer shrink-0"
                          >
                            {lang === "vi" ? "HoÃ£n" : "Postpone"}
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
                {lang === "vi" ? `ChÃ o má»«ng trá»Ÿ láº¡i, ${user.firstName}` : `Welcome back, ${user.firstName}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("dash_subtitle")}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Left 2 Cols: Orders list */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5 text-primary" />
                    {t("dash_orders_title")}
                  </h3>

                  {isLoadingDashboard ? (
                    <div className="py-10 text-center">
                      <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground">
                        {lang === "vi" ? "Äang táº£i Ä‘Æ¡n hÃ ng..." : "Retrieving orders..."}
                      </span>
                    </div>
                  ) : myOrders.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl">
                      <p className="text-xs text-muted-foreground">{t("dash_orders_empty")}</p>
                      <button
                        onClick={() => setActiveTab("menu")}
                        className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        {lang === "vi" ? "KhÃ¡m phÃ¡ Thá»±c Ä‘Æ¡n vÃ  Ä‘áº·t mÃ³n ngay" : "Browse Menu and order now"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {myOrders.map((order) => (
                        <div key={order.id} className="border border-border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border/50">
                            <div>
                              <div className="text-xs text-muted-foreground font-semibold">{t("order_id")}</div>
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
                              {t("status_label")}
                            </div>
                            <div className="grid grid-cols-4 gap-2 relative">
                              {/* Horizontal connecting line */}
                              <div className="absolute top-3.5 left-8 right-8 h-0.5 bg-border -z-10" />

                              {[
                                { key: "PENDING", label: lang === "vi" ? "ÄÃ£ nháº­n" : "Received", icon: faClock },
                                { key: "CONFIRMED", label: lang === "vi" ? "ÄÃ£ xÃ¡c nháº­n" : "Confirmed", icon: faCheckCircle },
                                { key: "PREPARING", label: lang === "vi" ? "Äang náº¥u" : "Preparing", icon: faUtensils },
                                { key: "DELIVERED", label: lang === "vi" ? "ÄÃ£ giao" : "Delivered", icon: faTruck },
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
                                      <FontAwesomeIcon icon={step.icon} className="h-4 w-4" />
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
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3.5 w-3.5 text-primary shrink-0" />
                              {lang === "vi" ? `Giao tá»›i: ${order.deliveryAddress}` : `Shipped to: ${order.deliveryAddress}`}
                            </span>
                            <span className="font-semibold text-foreground/80">
                              {lang === "vi"
                                ? `Thanh toÃ¡n: ${order.payment?.method === "BANK_TRANSFER" ? "VietQR CK" : "Ship COD"} (${order.payment?.status === "PAID" ? "ÄÃ£ tráº£" : "ChÆ°a tráº£"})`
                                : `Payment: ${order.payment?.method === "BANK_TRANSFER" ? "VietQR CK" : "Ship COD"} (${order.payment?.status === "PAID" ? "Paid" : "Unpaid"})`}
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
                    <FontAwesomeIcon icon={faMagic} className="h-5 w-5 text-primary" />
                    {t("nav_sub")}
                  </h3>

                  {isLoadingDashboard ? (
                    <div className="py-6 text-center">
                      <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    </div>
                  ) : mySubscriptions.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-border rounded-xl bg-muted/10">
                      <p className="text-xs text-muted-foreground">{t("dash_subs_empty")}</p>
                      <button
                        onClick={() => setActiveTab("subscriptions")}
                        className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        {lang === "vi" ? "ÄÄƒng kÃ½ cÃ¡c gÃ³i hÃ ng ngÃ y/tuáº§n" : "Subscribe to daily/weekly plans"}
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
                              <h4 className="text-sm font-bold font-heading mt-1.5">
                                {lang === "vi" ? "Há»™p cÆ¡m dinh dÆ°á»¡ng" : "Chef Meal Box"}
                              </h4>
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
                              {lang === "vi" ? "GiÃ¡ má»—i chu ká»³: " : "Cycle Price: "} <span className="font-semibold text-foreground">{formatVND(sub.pricePerCycle)}</span>
                            </div>
                            <div>
                              {lang === "vi" ? "Giao hÃ ng tiáº¿p theo: " : "Next Delivery: "}{" "}
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
                              {sub.status === "ACTIVE" ? (lang === "vi" ? "Táº¡m dá»«ng" : "Pause") : (lang === "vi" ? "KÃ­ch hoáº¡t láº¡i" : "Resume")}
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
                <FontAwesomeIcon icon={faShoppingBag} className="h-5 w-5 text-primary" />
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
                  <FontAwesomeIcon icon={faShoppingBag} className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">Your cart is empty.</p>
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      setActiveTab("menu");
                    }}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {t("nav_menu")}
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
                          <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-muted-foreground/30" />
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
                            <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1)}
                            className="p-1 rounded bg-secondary hover:bg-muted border border-border shrink-0 cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
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
                    <span>{t("cart_subtotal")}</span>
                    <span>{formatVND(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("cart_shipping")}</span>
                    <span>{formatVND(30000)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-border/50 pt-2.5">
                    <span>{t("cart_total")}</span>
                    <span className="text-primary">{formatVND(cartTotal + 30000)}</span>
                  </div>
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleCheckout} className="space-y-3.5 pt-2">
                  {checkoutAddress && !isEditingAddress ? (
                    <div className="space-y-1 bg-muted/40 p-3 rounded-xl border border-border">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3" /> {t("cart_address")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingAddress(true);
                            setCheckoutAddress("");
                            setCheckoutProvince("");
                            setCheckoutWard("");
                            setCheckoutStreet("");
                          }}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {lang === "vi" ? "Thay Ä‘á»•i" : "Change"}
                        </button>
                      </div>
                      <p className="text-xs text-foreground font-semibold leading-relaxed pt-1">{checkoutAddress}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3" /> {t("cart_address")} (Vietnam)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          required
                          value={checkoutProvince}
                          onChange={(e) => {
                            setCheckoutProvince(e.target.value);
                            setCheckoutWard("");
                          }}
                          className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-2.5 rounded-lg outline-none cursor-pointer text-foreground"
                        >
                          <option value="">{t("cart_province")}</option>
                          {getProvinces().map((p: any) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <select
                          required
                          disabled={!checkoutProvince}
                          value={checkoutWard}
                          onChange={(e) => setCheckoutWard(e.target.value)}
                          className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-2.5 rounded-lg outline-none cursor-pointer text-foreground disabled:opacity-50"
                        >
                          <option value="">{t("cart_ward")}</option>
                          {checkoutProvince &&
                            getDistrictsByProvinceCode(checkoutProvince)
                              .flatMap((d: any) => getWardsByDistrictCode(d.code).map((w: any) => ({ ...w, district_name: d.name })))
                              .map((w: any) => (
                                <option key={w.code} value={w.code}>
                                  {w.name} ({w.district_name})
                                </option>
                              ))}
                        </select>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder={t("cart_street")}
                        value={checkoutStreet}
                        onChange={(e) => setCheckoutStreet(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      {t("cart_notes")}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === "vi" ? "VÃ­ dá»¥: Gá»­i báº£o vá»‡..." : "e.g. Please leave at the front desk"}
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FontAwesomeIcon icon={faTag} className="h-3 w-3" /> {t("cart_coupon")}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                    />
                    {!user && (
                      <p className="text-[9px] text-primary font-medium mt-1">{t("auth_coupon_hint")}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {t("cart_payment")}
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
                        <FontAwesomeIcon icon={faCreditCard} className="h-3.5 w-3.5 shrink-0" />
                        {t("payment_cod")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("BANK_TRANSFER")}
                        className={`py-2 px-3 border text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          paymentMethod === "BANK_TRANSFER"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <FontAwesomeIcon icon={faQrcode} className="h-3.5 w-3.5 shrink-0" />
                        {t("payment_vietqr")}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-[10px] text-muted-foreground select-none cursor-pointer py-1 leading-normal">
                    <input
                      type="checkbox"
                      required
                      checked={checkoutAgreeTerms}
                      onChange={(e) => setCheckoutAgreeTerms(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      {t("cart_agree")}{" "}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-primary font-semibold hover:underline"
                      >
                        {t("cart_terms")}
                      </button>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder || !checkoutAgreeTerms || !checkoutAddress}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingOrder ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                        {paymentMethod === "CASH_ON_DELIVERY" ? (lang === "vi" ? "Äáº·t hÃ ng (COD)" : "Order Now (COD)") : (lang === "vi" ? "Tiáº¿p tá»¥c thanh toÃ¡n" : "Proceed to Payment")}
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
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold font-heading">
                {authModal === "login" ? t("auth_login_title") : t("auth_register_title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                {t("auth_desc")}
              </p>
            </div>

            {authModal === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_email")}</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_password")}</label>
                  <input
                    type="password"
                    required
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                  />
                </div>
                <div className="flex items-center gap-2 select-none py-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer mt-0.5"
                  />
                  <label htmlFor="rememberMe" className="text-[10px] font-semibold text-muted-foreground cursor-pointer">
                    {lang === "vi" ? "Ghi nhá»› máº­t kháº©u" : "Remember password"}
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                >
                  {t("btn_submit_login")}
                </button>
                <div className="text-center pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    {lang === "vi" ? "ChÆ°a cÃ³ tÃ i khoáº£n? " : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => setAuthModal("signup")}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      {lang === "vi" ? "ÄÄƒng kÃ½ ngay" : "Register here"}
                    </button>
                  </span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_first")}</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={signupFirst}
                      onChange={(e) => setSignupFirst(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_last")}</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={signupLast}
                      onChange={(e) => setSignupLast(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_email")}</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_password")}</label>
                  <input
                    type="password"
                    required
                    placeholder={lang === "vi" ? "Tá»‘i thiá»ƒu 6 kÃ½ tá»±" : "Minimum 6 characters"}
                    value={signupPass}
                    onChange={(e) => setSignupPass(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_phone")}</label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "vi" ? "VÃ­ dá»¥: 0901234567" : "e.g. 0901234567"}
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_address")}</label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "vi" ? "VÃ­ dá»¥: 123 Äá»“ng Khá»Ÿi" : "e.g. 123 Dong Khoi St"}
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                    className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                  />
                </div>

                <label className="flex items-start gap-2 text-[10px] text-muted-foreground select-none cursor-pointer py-1 leading-normal">
                  <input
                    type="checkbox"
                    required
                    checked={signupAgreeTerms}
                    onChange={(e) => setSignupAgreeTerms(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    {t("cart_agree")}{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-primary font-semibold hover:underline"
                    >
                      {t("cart_terms")}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!signupAgreeTerms}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 disabled:opacity-50"
                >
                  {t("btn_submit_register")}
                </button>
                <div className="text-center pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    {lang === "vi" ? "ÄÃ£ cÃ³ tÃ i khoáº£n? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => setAuthModal("login")}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      {lang === "vi" ? "ÄÄƒng nháº­p táº¡i Ä‘Ã¢y" : "Sign in instead"}
                    </button>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. FOOTER */}
      <footer className="border-t border-border bg-card/60 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 text-xs text-muted-foreground">
          {/* Column 1: Brand & Contact Info */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-foreground font-heading">
              {lang === "vi" ? "FortifyKitchen Viá»‡t Nam" : "FortifyKitchen Vietnam"}
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "GÃ³i dinh dÆ°á»¡ng cao cáº¥p, thá»±c Ä‘Æ¡n Protein chuáº©n gourmet Ä‘Æ°á»£c cháº¿ biáº¿n tá»« nguyÃªn liá»‡u tÆ°Æ¡i sáº¡ch bá»Ÿi Ä‘áº§u báº¿p chuyÃªn nghiá»‡p Ä‘á»ƒ phá»¥c vá»¥ má»¥c tiÃªu sá»©c khá»e cá»§a báº¡n."
                : "Premium gourmet protein meal prep subscriptions prepared by professional chefs to help you achieve your fitness goals."}
            </p>
            <div className="space-y-2">
              <p>
                <strong>{lang === "vi" ? "Khu vá»±c phá»¥c vá»¥:" : "Service Area:"}</strong> {lang === "vi" ? "ThÃ nh phá»‘ Há»“ ChÃ­ Minh, Viá»‡t Nam" : "Ho Chi Minh City, Vietnam"}
              </p>
              <p>
                <strong>Hotline & Zalo:</strong> [Sá»‘ Ä‘iá»‡n thoáº¡i liÃªn há»‡]
              </p>
            </div>
          </div>

          {/* Column 2: Legal / Policies */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-foreground font-heading">
              {lang === "vi" ? "ChÃ­nh sÃ¡ch & Quy Ä‘á»‹nh" : "Policies & Regulations"}
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "CÃ¡c Ä‘iá»u khoáº£n sá»­ dá»¥ng vÃ  chÃ­nh sÃ¡ch hoáº¡t Ä‘á»™ng cá»§a cá»­a hÃ ng chÃºng tÃ´i:"
                : "Our store's usage terms and operational policies:"}
            </p>
            <div className="flex flex-col gap-2 font-medium">
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:underline cursor-pointer transition-colors"
              >
                {lang === "vi" ? "âž” Äiá»u khoáº£n sá»­ dá»¥ng dá»‹ch vá»¥" : "âž” Terms of Service"}
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:underline cursor-pointer transition-colors"
              >
                {lang === "vi" ? "âž” ChÃ­nh sÃ¡ch báº£o máº­t thÃ´ng tin" : "âž” Privacy Policy"}
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:underline cursor-pointer transition-colors"
              >
                {lang === "vi" ? "âž” ChÃ­nh sÃ¡ch thanh toÃ¡n & HoÃ n tiá»n" : "âž” Payment & Refund Policy"}
              </button>
            </div>
          </div>

          {/* Column 3: Secure Payments & Social Channels */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-foreground font-heading">
              {lang === "vi" ? "Thanh toÃ¡n & LiÃªn há»‡ máº¡ng xÃ£ há»™i" : "Payments & Social Channels"}
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "ChÃºng tÃ´i há»— trá»£ giao hÃ ng thu tiá»n táº­n nÆ¡i (COD) vÃ  Chuyá»ƒn khoáº£n VietQR tiá»‡n lá»£i. LiÃªn há»‡ ngay Ä‘á»ƒ Ä‘Æ°á»£c tÆ° váº¥n thá»±c Ä‘Æ¡n phÃ¹ há»£p nháº¥t."
                : "We support convenient Cash on Delivery (COD) and VietQR bank transfers. Contact us directly for menu consultations."}
            </p>
            
            {/* Social Connect buttons using text-based tags */}
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="https://zalo.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors text-[10px]"
              >
                Zalo Chat
              </a>
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors text-[10px]"
              >
                Facebook
              </a>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors text-[10px]"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-border/40 text-center text-[10px] text-muted-foreground">
          <p>Â© 2026 FortifyKitchen Viá»‡t Nam. {lang === "vi" ? "Táº¥t cáº£ cÃ¡c quyá»n Ä‘Æ°á»£c báº£o lÆ°u." : "All rights reserved."}</p>
        </div>
      </footer>

      {/* 7. PRIVACY & TERMS SITE-WIDE MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowPrivacyModal(false)} />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6 my-8 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="text-center pb-2 border-b border-border">
              <h3 className="text-lg font-bold font-heading">{t("cart_terms")}</h3>
            </div>
            <div className="overflow-y-auto pr-2 space-y-4 text-xs text-muted-foreground leading-relaxed flex-1">
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "1. Quy Ä‘á»‹nh chung" : "1. General Regulations"}
              </h4>
              <p>
                {lang === "vi"
                  ? "ChÃ o má»«ng báº¡n Ä‘áº¿n vá»›i Fortify Kitchen. Khi sá»­ dá»¥ng dá»‹ch vá»¥ cá»§a chÃºng tÃ´i (bao gá»“m Ä‘áº·t hÃ ng trá»±c tiáº¿p, Ä‘Äƒng kÃ½ gÃ³i há»™i viÃªn Ä‘á»‹nh ká»³ hoáº·c quáº£n trá»‹ váº­n hÃ nh), báº¡n Ä‘á»“ng Ã½ cam káº¿t tuÃ¢n thá»§ cÃ¡c Ä‘iá»u khoáº£n nÃ y."
                  : "Welcome to Fortify Kitchen. By using our services (including guest checkout, subscribing to recurring plans, or admin operations), you agree to comply with these terms."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "2. Thu tháº­p & Sá»­ dá»¥ng ThÃ´ng tin cÃ¡ nhÃ¢n" : "2. Personal Data Collection & Usage"}
              </h4>
              <p>
                {lang === "vi"
                  ? "ChÃºng tÃ´i thu tháº­p cÃ¡c thÃ´ng tin nhÆ° Há» tÃªn, Sá»‘ Ä‘iá»‡n thoáº¡i, Äá»‹a chá»‰ giao hÃ ng vÃ  Ghi chÃº nháº±m má»¥c Ä‘Ã­ch xá»­ lÃ½ Ä‘Æ¡n hÃ ng, Ä‘iá»u phá»‘i váº­n chuyá»ƒn vÃ  xÃ¡c minh thanh toÃ¡n. Äá»‘i vá»›i thÃ nh viÃªn Ä‘Äƒng kÃ½ tÃ i khoáº£n, chÃºng tÃ´i lÆ°u trá»¯ Email vÃ  thÃ´ng tin Ä‘Äƒng nháº­p Ä‘á»ƒ cÃ¡ nhÃ¢n hÃ³a tráº£i nghiá»‡m vÃ  cung cáº¥p cÃ¡c chÃ­nh sÃ¡ch Æ°u Ä‘Ã£i (coupon)."
                  : "We collect details like Full Name, Phone Number, Delivery Address, and Notes to process orders, coordinate shipping, and verify payments. For registered members, we store Email and login credentials to personalize experiences and offer promotional coupons."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "3. ChÃ­nh sÃ¡ch Thanh toÃ¡n" : "3. Payment Policy"}
              </h4>
              <p>
                {lang === "vi"
                  ? "ChÃºng tÃ´i cháº¥p nháº­n thanh toÃ¡n COD (tiá»n máº·t khi nháº­n hÃ ng) vÃ  Chuyá»ƒn khoáº£n ngÃ¢n hÃ ng trá»±c tuyáº¿n (qua VietQR). KhÃ¡ch hÃ ng cÃ³ trÃ¡ch nhiá»‡m thá»±c hiá»‡n Ä‘Ãºng ná»™i dung chuyá»ƒn khoáº£n Ä‘Æ°á»£c cung cáº¥p táº¡i mÃ n hÃ¬nh xÃ¡c nháº­n Ä‘Æ¡n hÃ ng Ä‘á»ƒ Ä‘áº£m báº£o giao dá»‹ch Ä‘Æ°á»£c Ä‘á»‘i soÃ¡t tá»± Ä‘á»™ng thÃ nh cÃ´ng."
                  : "We accept COD (Cash on Delivery) and online Bank Transfer via VietQR. Customers are responsible for entering the exact transfer reference code provided during checkout to facilitate automated confirmation."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "4. Cam káº¿t Báº£o máº­t" : "4. Data Security & Integrity"}
              </h4>
              <p>
                {lang === "vi"
                  ? "Fortify Kitchen cam káº¿t báº£o máº­t tuyá»‡t Ä‘á»‘i dá»¯ liá»‡u cÃ¡ nhÃ¢n cá»§a khÃ¡ch hÃ ng vÃ  nhÃ¢n viÃªn váº­n hÃ nh. ChÃºng tÃ´i khÃ´ng mua bÃ¡n, chia sáº» thÃ´ng tin cho báº¥t ká»³ bÃªn thá»© ba nÃ o, ngoáº¡i trá»« má»¥c Ä‘Ã­ch Ä‘iá»u phá»‘i giao hÃ ng vá»›i cÃ¡c Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn Ä‘á»‘i tÃ¡c."
                  : "Fortify Kitchen is committed to securing customer and operational personal data. We do not sell or share information with third parties, except for logistical coordination with delivery partners."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "5. Thay Ä‘á»•i Äiá»u khoáº£n" : "5. Amendments to Terms"}
              </h4>
              <p>
                {lang === "vi"
                  ? "ChÃºng tÃ´i cÃ³ quyá»n sá»­a Ä‘á»•i cÃ¡c Ä‘iá»u khoáº£n nÃ y báº¥t ká»³ lÃºc nÃ o Ä‘á»ƒ phÃ¹ há»£p vá»›i quy Ä‘á»‹nh cá»§a phÃ¡p luáº­t vÃ  nhu cáº§u váº­n hÃ nh thá»±c táº¿. Báº£n cáº­p nháº­t má»›i nháº¥t sáº½ luÃ´n Ä‘Æ°á»£c hiá»ƒn thá»‹ cÃ´ng khai trÃªn website."
                  : "We reserve the right to amend these terms at any time to align with legal guidelines and operational requirements. The latest version will always be publicly posted on the website."}
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 mt-4 shrink-0"
            >
              {lang === "vi" ? "ÄÃ³ng" : "Close"}
            </button>
          </div>
        </div>
      )}

      {/* 8. REGISTERED CHECKOUT SUCCESS VIETQR MODAL */}
      {checkoutResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => {
            setCheckoutResult(null);
            setCartOpen(false);
            setActiveTab("dashboard");
          }} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4 text-center">
            <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 mx-auto text-emerald-500" />
            <h3 className="text-base font-bold font-heading">
              {lang === "vi" ? "Äáº·t hÃ ng thÃ nh cÃ´ng!" : "Order Placed Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "vi"
                ? "ÄÆ¡n hÃ ng cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n. Vui lÃ²ng hoÃ n táº¥t thanh toÃ¡n chuyá»ƒn khoáº£n qua VietQR bÃªn dÆ°á»›i."
                : "Your order has been recorded. Please complete the bank transfer via VietQR below."}
            </p>

            <div className="border border-border bg-muted/25 rounded-xl p-4 space-y-3 text-left">
              <p className="text-xs font-bold text-foreground text-center">
                {lang === "vi" ? "QuÃ©t mÃ£ VietQR Ä‘á»ƒ thanh toÃ¡n" : "Scan VietQR to Complete Payment"}
              </p>
              <div className="bg-white p-2 rounded-lg border border-border w-40 h-40 mx-auto flex items-center justify-center">
                <img
                  src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${checkoutResult.total}&addInfo=FK${checkoutResult.id.slice(0, 8)}&accountName=FORTIFY%20KITCHEN`}
                  alt="VietQR Payment Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "NgÃ¢n hÃ ng:" : "Bank:"}</span>
                  <span className="font-bold text-foreground">MB Bank</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Sá»‘ tÃ i khoáº£n:" : "Account Number:"}</span>
                  <span className="font-bold text-foreground font-mono">19035678901234</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Chá»§ tÃ i khoáº£n:" : "Account Holder:"}</span>
                  <span className="font-bold text-foreground uppercase">FORTIFY KITCHEN</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Sá»‘ tiá»n:" : "Amount:"}</span>
                  <span className="font-bold text-primary font-mono">{formatVND(checkoutResult.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Ná»™i dung chuyá»ƒn khoáº£n:" : "Transfer Reference:"}</span>
                  <span className="font-bold text-primary font-mono">FK{checkoutResult.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutResult(null);
                setCartOpen(false);
                setActiveTab("dashboard");
              }}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              {lang === "vi" ? "TÃ´i Ä‘Ã£ chuyá»ƒn khoáº£n / ÄÃ³ng" : "I have transferred / Close"}
            </button>
          </div>
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setConfirmState(null)} />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold font-heading">
              {confirmState.title || (lang === "vi" ? "XÃ¡c nháº­n" : "Confirm")}
            </h3>
            <p className="text-xs text-muted-foreground">{confirmState.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted cursor-pointer"
              >
                {lang === "vi" ? "Há»§y" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/95 cursor-pointer"
              >
                {confirmState.confirmLabel || (lang === "vi" ? "XÃ¡c nháº­n" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex justify-around py-3 px-2 shadow-2xl">
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === "menu" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <FontAwesomeIcon icon={faUtensils} className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">{t("nav_menu")}</span>
        </button>
        <button
          onClick={() => setActiveTab("order-now")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${
            activeTab === "order-now" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <FontAwesomeIcon icon={faShoppingBag} className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">{t("nav_order")}</span>
        </button>
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === "subscriptions" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <FontAwesomeIcon icon={faCalendarAlt} className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">{t("nav_sub")}</span>
        </button>
        <button
          onClick={() => {
            if (user) {
              setActiveTab("dashboard");
            } else {
              setAuthModal("login");
            }
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === "dashboard" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <FontAwesomeIcon icon={faUser} className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">{user ? t("nav_dashboard") : t("btn_signin")}</span>
        </button>
      </div>
    </div>
  );
}




