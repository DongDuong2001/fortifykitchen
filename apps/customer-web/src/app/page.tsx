"use client";

import * as React from "react";
import { useApp } from "../providers/app-context";
import { useToast } from "@fortifykitchen/ui";
import { MenuItem, Protein } from "@fortifykitchen/types";
import { getMenuItemLabel, PROTEIN_LABELS, translateApiError, calculateOrderTotal } from "@fortifykitchen/shared";
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
  faCalendarAlt,
  faWallet,
  faLeaf,
  faHeart,
  faFlask,
  faQuoteLeft,
  faShieldHalved,
  faPhone,
  faComment,
  faGift
} from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { formatGrams } from "@fortifykitchen/shared";

// Order status labels for the customer-facing "Track my order" lookup —
// same unified OrderStatus enum the admin Orders tab uses
// (PENDING_CONFIRMATION/CONFIRMED/PREPARING/OUT_FOR_DELIVERY/COMPLETED/
// CANCELLED), just worded for a customer audience.
const DICTIONARY = {
  vi: {
    // Navigation
    nav_home: "Trang chủ",
    nav_menu: "Thực đơn",
    nav_order: "Giao ngay",
    nav_wallet: "Ví",
    nav_sub: "Giao định kỳ",
    nav_calculator: "Tính calo",
    nav_dashboard: "Cá nhân",
    btn_signin: "Đăng nhập",
    btn_logout: "Đăng xuất",

    // Menu
    menu_title: "Thực đơn Dinh dưỡng",
    menu_subtitle: "Bữa ăn giàu protein, macro rõ ràng trên từng nhãn — sous-vide mềm mọng, không bao giờ khô.",
    filter_all: "Tất cả",
    filter_BEEF: "Thịt Bò",
    filter_CHICKEN: "Thịt Gà",
    filter_SHRIMP: "Tôm",
    filter_PORK: "Thịt Heo",
    filter_FISH: "Thịt Cá",
    filter_VEGAN: "Món Chay",
    unit_stock: "sẵn có",
    btn_add_cart: "Thêm vào giỏ",
    btn_out_of_stock: "Hết hàng",
    protein_level: "Protein",

    // Subscriptions
    sub_title: "Gói Hội viên Protein",
    sub_subtitle: "Đăng ký gói hội viên định kỳ để nhận hạn mức Protein với mức chiết khấu cực tốt, linh hoạt điều phối giao bữa ăn hàng tuần.",
    sub_days: "ngày",
    sub_credit: "Hạn mức Protein",
    sub_pricing: "Giá trị gói",
    sub_per_kg: "Tương đương",
    sub_accepts: "Chấp nhận COD",
    btn_subscribe: "Đăng ký gói hội viên",
    txt_sub_disclaim: "Gói hội viên định kỳ sẽ được kích hoạt bởi nhân viên của chúng tôi sau khi xác minh thông tin. Vui lòng liên hệ hotline để được hỗ trợ nhanh nhất.",

    // Cart Drawer
    cart_title: "Giỏ hàng của bạn",
    cart_empty: "Giỏ hàng của bạn đang trống.",
    cart_subtotal: "Tạm tính",
    cart_discount: "Giảm giá",
    cart_shipping: "Phí vận chuyển",
    cart_total: "Tổng thanh toán",
    cart_coupon: "Mã giảm giá",
    cart_apply: "Áp dụng",
    cart_applied: "Đã áp dụng mã",
    cart_invalid_coupon: "Mã giảm giá không hợp lệ",
    cart_notes: "Ghi chú đơn hàng",
    cart_payment: "Phương thức thanh toán",
    cart_cod: "Thanh toán khi nhận hàng (COD)",
    cart_vietqr: "VietQR Chuyển khoản (Có mã QR)",
    cart_address: "Địa chỉ nhận hàng",
    cart_province: "Tỉnh / Thành phố",
    cart_ward: "Phường / Xã",
    cart_street: "Số nhà, tên đường...",
    cart_agree: "Tôi đồng ý với",
    cart_terms: "Điều khoản sử dụng & Chính sách bảo mật",
    btn_checkout: "Đặt hàng ngay",

    // Order Success Modal
    success_title: "Đặt hàng thành công!",
    success_desc: "Cảm ơn bạn đã lựa chọn Fortify Kitchen.",
    success_cod_desc: "Đơn hàng của bạn đã được ghi nhận thành công và sẽ được giao sớm nhất có thể. Vui lòng thanh toán tiền mặt khi nhận hàng.",
    success_vietqr_desc: "Vui lòng quét mã QR dưới đây hoặc chuyển khoản ngân hàng để thanh toán cho đơn hàng.",
    bank_name: "Ngân hàng",
    bank_acc: "Số tài khoản",
    bank_holder: "Chủ tài khoản",
    bank_amount: "Số tiền",
    bank_memo: "Nội dung chuyển khoản",
    btn_done: "Tôi đã chuyển khoản / Đóng",

    // Auth & Modals
    auth_login_title: "Đăng nhập tài khoản",
    auth_register_title: "Đăng ký thành viên mới",
    auth_desc: "Tham gia Fortify Kitchen để đặt món và theo dõi đơn hàng dễ dàng.",
    auth_coupon_hint: "🎁 Đăng ký tài khoản ngay hôm nay để nhận mã giảm giá WELCOME10 giảm 10% cho đơn hàng đầu tiên!",
    auth_email: "Địa chỉ Email",
    auth_password: "Mật khẩu",
    auth_first: "Tên",
    auth_last: "Họ",
    auth_phone: "Số điện thoại",
    auth_address: "Địa chỉ giao hàng",
    btn_submit_login: "Đăng nhập",
    btn_submit_register: "Đăng ký & Đồng ý Điều khoản",
    auth_toggle_to_register: "Chưa có tài khoản? Đăng ký ngay",
    auth_toggle_to_login: "Đã có tài khoản? Đăng nhập ngay",

    // Dashboard
    dash_title: "Bảng điều khiển cá nhân",
    dash_subtitle: "Quản lý đơn hàng, theo dõi giao hàng và số dư ví, gói định kỳ của bạn.",
    dash_orders_title: "Lịch sử đơn hàng",
    dash_orders_empty: "Bạn chưa có đơn hàng nào.",
    dash_subs_title: "Gói định kỳ đang hoạt động",
    dash_subs_empty: "Bạn chưa có gói giao định kỳ nào.",
    dash_balance: "Số dư Protein",
    dash_status: "Trạng thái",
    dash_delivery_date: "Ngày giao",
    dash_payment: "Thanh toán",
    order_id: "Mã đơn hàng",
    status_label: "Trạng thái giao",
    order_title: "Sẵn sàng giao ngay",
    order_subtitle: "Đặt món ăn dinh dưỡng chế biến sẵn, giao nóng hổi trong 30-45 phút, không cần đăng ký tài khoản.",
    txt_order_ready: "Đơn hàng giao ngay của bạn đã được tiếp nhận và đang được đầu bếp chuẩn bị.",
    txt_order_scheduled: "Đơn hàng của bạn đã được lên lịch thành công.",
    txt_total: "Tổng cộng",
    btn_order_more: "Đặt thêm món",
    txt_your_order: "Đơn hàng của bạn",
    txt_empty_cart: "Giỏ hàng giao nhanh của bạn đang trống.",
    placeholder_name: "Họ và tên của bạn",
    placeholder_phone: "Số điện thoại của bạn",
    placeholder_notes: "Ghi chú (tùy chọn)",
    payment_cod: "Tiền mặt (COD)",
    payment_vietqr: "VietQR chuyển khoản",
  },
  en: {
    // Navigation
    nav_home: "Home",
    nav_menu: "Menu",
    nav_order: "Order Now",
    nav_wallet: "Wallet",
    nav_sub: "Meal subscriptions",
    nav_calculator: "Calculator",
    nav_dashboard: "Dashboard",
    btn_signin: "Sign In",
    btn_logout: "Logout",

    // Menu
    menu_title: "Nutritional Menu",
    menu_subtitle: "High-protein meals with the macros on every label — sous-vide, never dry.",
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
    sub_title: "Protein Memberships",
    sub_subtitle: "Join a recurring membership for a bulk protein balance at deep discounts, with flexible weekly delivery scheduling.",
    sub_days: "days",
    sub_credit: "Protein Balance",
    sub_pricing: "Membership Price",
    sub_per_kg: "Equivalent to",
    sub_accepts: "COD Accepted",
    btn_subscribe: "Buy Membership",
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
    auth_coupon_hint: "🎁 Register today to receive coupon WELCOME10 for 10% off your first order!",
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
    dash_subtitle: "Manage your orders, track deliveries, and check your wallet and subscription balances.",
    dash_orders_title: "Order History",
    dash_orders_empty: "You have no order history yet.",
    dash_subs_title: "Active subscriptions",
    dash_subs_empty: "You have no active subscriptions yet.",
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
    PENDING_CONFIRMATION: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chuẩn bị",
    OUT_FOR_DELIVERY: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã huỷ",
  },
  en: {
    PENDING_CONFIRMATION: "Awaiting confirmation",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    OUT_FOR_DELIVERY: "Out for delivery",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  }
};

const ORDER_STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

// Wallet top-up plan benefits — cumulative by voucherPercent tier (each tier
// keeps every perk from the tier below it, plus one new one), per the
// business's own framing: 5%=Pro, 10%=Max, 15%=Pro Max, 20%=Pro Max Ultra.
// This is deliberately code-driven rather than pulled from the admin-entered
// `plan.description` field, so the sales copy on this page stays consistent
// and reviewed regardless of what staff type into the plan's free-text
// description in the admin dashboard.
function getPlanBenefits(voucherPercent: number, lang: "vi" | "en"): { icon: typeof faWallet; text: string }[] {
  const benefits: { icon: typeof faWallet; text: string }[] = [
    {
      icon: faTag,
      text:
        lang === "vi"
          ? `Mọi đơn hàng tự động giảm ${voucherPercent}%, không cần nhớ mã giảm giá.`
          : `Every order is automatically ${voucherPercent}% off — no code to remember.`,
    },
  ];
  if (voucherPercent === 5) {
    benefits.push({
      icon: faGift,
      text:
        lang === "vi"
          ? "Thỉnh thoảng bạn sẽ nhận được món quà nhỏ bất ngờ từ bếp Fortify Kitchen."
          : "Every now and then, expect a little surprise gift from our kitchen.",
    });
  }
  if (voucherPercent === 10 || voucherPercent === 15) {
    benefits.push({
      icon: faGift,
      text:
        lang === "vi"
          ? "Quà tặng ghé thăm thường xuyên hơn, và đôi lúc có cả món đặc biệt miễn phí."
          : "Gifts show up more often, plus the occasional free special dish.",
    });
  }
  if (voucherPercent === 20) {
    benefits.push({
      icon: faGift,
      text:
        lang === "vi"
          ? "Quà tặng cho mọi đơn hàng, và đôi lúc có cả món đặc biệt miễn phí."
          : "Gifts with every order, plus the occasional free special dish.",
    });
  }
  if (voucherPercent >= 15) {
    benefits.push({
      icon: faUtensils,
      text:
        lang === "vi"
          ? "Thoải mái tự chọn khẩu vị và gia giảm nguyên liệu đúng ý bạn cho từng phần ăn."
          : "Customize the flavor and adjust ingredients exactly how you like, for every meal.",
    });
  }
  if (voucherPercent >= 20) {
    benefits.push({
      icon: faMagic,
      text:
        lang === "vi"
          ? "Được chế biến phần ăn riêng theo yêu cầu, cùng đồ ăn và quà tặng miễn phí thường xuyên."
          : "Get meals custom-prepped just for you, plus free food and gifts on a regular basis.",
    });
  }
  return benefits;
}

export default function CustomerPortal() {
  const {
    user,
    token,
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
    clearCart,
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

  // Tab State: "home" | "menu" | "order-now" | "calculator" | "subscriptions" | "dashboard"
  const [activeTab, setActiveTab] = React.useState<"home" | "menu" | "order-now" | "calculator" | "wallet" | "subscriptions" | "dashboard">("home");

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

  // Address states
  const [orderNowProvince, setOrderNowProvince] = React.useState("");
  const [orderNowWard, setOrderNowWard] = React.useState("");
  const [orderNowStreet, setOrderNowStreet] = React.useState("");
  const [orderNowAgreeTerms, setOrderNowAgreeTerms] = React.useState(false);
  const [orderNowPaymentMethod, setOrderNowPaymentMethod] = React.useState("CASH_ON_DELIVERY");
  const [orderNowDiscountCode, setOrderNowDiscountCode] = React.useState("");
  const [orderNowVerifiedDiscount, setOrderNowVerifiedDiscount] = React.useState<{ type: string; amount: number } | null>(null);
  const [orderNowDiscountCodeStatus, setOrderNowDiscountCodeStatus] = React.useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [orderNowDiscountCodeError, setOrderNowDiscountCodeError] = React.useState<string | null>(null);

  // Custom ordering states
  const [orderFlowType, setOrderFlowType] = React.useState<"standard" | "custom">("standard");
  const [customOrderProtein, setCustomOrderProtein] = React.useState("chicken");
  const [customOrderSize, setCustomOrderSize] = React.useState<number>(150);
  const [customOrderCarb, setCustomOrderCarb] = React.useState("rice");
  const [customOrderToppings, setCustomOrderToppings] = React.useState<string[]>([]);
  const [customOrderSauce, setCustomOrderSauce] = React.useState("sesame");
  const [customOrderDeliveryDate, setCustomOrderDeliveryDate] = React.useState("");
  const [customOrderQty, setCustomOrderQty] = React.useState<number>(1);
  const [showCheckoutReview, setShowCheckoutReview] = React.useState(false);

  const [checkoutProvince, setCheckoutProvince] = React.useState("79"); // Ho Chi Minh City only
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

  // Wallet balance for the logged-in customer — populated from /customers/me
  // (see the "Sync checkout address when user logs in" effect below, which
  // now also reads walletBalance). Drives the WALLET checkout option, the
  // "Buy a Plan" balance display, and the low-balance banner.
  const [walletBalance, setWalletBalance] = React.useState<number>(0);
  // Recurring membership discount from the customer's current
  // SubscriptionPlan (also populated from /customers/me) - applies
  // automatically to every order until planDiscountEndsAt, no code to type.
  // Replaces the earlier single-use plan-purchase voucher entirely.
  const [planDiscountPercent, setPlanDiscountPercent] = React.useState<number>(0);
  const [planDiscountEndsAt, setPlanDiscountEndsAt] = React.useState<string | null>(null);

  // SubscriptionPlan catalog — buying a tier opens a PENDING bank-transfer
  // top-up (see docs/plan-and-credit-design.md). Public to browse, login
  // required to buy.
  const [subscriptionPlans, setSubscriptionPlans] = React.useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = React.useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = React.useState<string | null>(null);
  const [planPurchaseResult, setPlanPurchaseResult] = React.useState<any | null>(null);

  // Pay-from-wallet on an UNPAID/DEPOSIT Subscription — see the phone-lookup
  // and dashboard subscription views below.
  const [payingSubscriptionId, setPayingSubscriptionId] = React.useState<string | null>(null);

  // In-app low-balance notifications (wallet + subscription pools) — see
  // GET /notifications/me. Dismissal is session-only (plain component
  // state, not persisted) so the banner resurfaces on the next visit if
  // still true.
  const [notifications, setNotifications] = React.useState<any | null>(null);
  const [dismissedBanners, setDismissedBanners] = React.useState<string[]>([]);

  // Custom plan request — the consultation-first flow: a customer with
  // specific requests/preferences submits this instead of self-checking-out
  // a subscription (subscriptions are always staff-created, see above).
  // Staff review it in the admin dashboard's Custom Plan Requests tab and
  // either build a matching Subscription or decline.
  const [cprName, setCprName] = React.useState("");
  const [cprPhone, setCprPhone] = React.useState("");
  const [cprProteins, setCprProteins] = React.useState<Protein[]>([]);
  const [cprEstimatedGrams, setCprEstimatedGrams] = React.useState("");
  const [cprIntervalDays, setCprIntervalDays] = React.useState("");
  const [cprBudget, setCprBudget] = React.useState("");
  const [cprNotes, setCprNotes] = React.useState("");
  const [isCprSubmitting, setIsCprSubmitting] = React.useState(false);
  const [cprSubmitted, setCprSubmitted] = React.useState(false);
  const [cprError, setCprError] = React.useState<string | null>(null);

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
  // Guest checkout (no login) — name + phone collected in the cart drawer.
  const [checkoutGuestName, setCheckoutGuestName] = React.useState("");
  const [checkoutGuestPhone, setCheckoutGuestPhone] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH_ON_DELIVERY");
  const [discountCode, setDiscountCode] = React.useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);
  // Two-step cart drawer: review cart -> checkout details. Reset to "cart"
  // whenever the drawer closes so it always reopens on the review step.
  const [checkoutStep, setCheckoutStep] = React.useState<"cart" | "details">("cart");
  React.useEffect(() => {
    if (!isCartOpen) setCheckoutStep("cart");
  }, [isCartOpen]);
  // Checkout failures (e.g. "this discount code has already been used") were
  // previously only surfaced via a global toast, which sits at the same
  // z-index as this cart drawer's own backdrop and could be easy to miss
  // while the drawer is open - this inline banner guarantees the customer
  // sees why "Đặt hàng" didn't go through.
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  // Live preview of whatever's typed in discountCode - lets the customer see
  // the discount actually land (and see a clear "invalid code" state)
  // before placing the order, instead of finding out only after submitting.
  // GET /discounts/verify stays public (usable before login), but when a
  // token is present the API also checks per-customer redemption history,
  // so "already used" shows up here too - not just after a failed checkout.
  // Full active/date-window enforcement is still re-checked server-side at
  // order creation regardless (this preview is not the source of truth).
  const [verifiedDiscount, setVerifiedDiscount] = React.useState<{ type: string; amount: number } | null>(null);
  const [discountCodeStatus, setDiscountCodeStatus] = React.useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [discountCodeError, setDiscountCodeError] = React.useState<string | null>(null);

  // Custom Bowl Calculator States
  const [customProtein, setCustomProtein] = React.useState<string>("chicken");
  const [customSize, setCustomSize] = React.useState<number>(150);
  const [customCarb, setCustomCarb] = React.useState<string>("rice");
  const [customToppings, setCustomToppings] = React.useState<string[]>(["broccoli"]);
  const [customSauce, setCustomSauce] = React.useState<string>("sesame");

  React.useEffect(() => {
    if (customProtein !== "chicken") {
      setCustomSize(150);
    }
  }, [customProtein]);

  // Menu Catalog State
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [selectedProtein, setSelectedProtein] = React.useState<Protein | "">("");
  const [selectedProteinOrderNow, setSelectedProteinOrderNow] = React.useState<Protein | "">("");
  const [isLoadingMenu, setIsLoadingMenu] = React.useState(true);

  // User Dashboard State
  const [myOrders, setMyOrders] = React.useState<any[]>([]);
  const [mySubscriptions, setMySubscriptions] = React.useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = React.useState(false);
  // Sub-navigation within the private dashboard tab — Overview / Orders /
  // Subscriptions each get their own screen instead of everything stacked
  // into one long page.
  const [dashboardSection, setDashboardSection] = React.useState<"overview" | "orders" | "subscriptions">("overview");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch Menu on load
  React.useEffect(() => {
    async function loadCatalog() {
      const mockMenuItems: MenuItem[] = [
        // Gà (CHICKEN) - 7 flavors x 2 sizes (150g: 25k, 250g: 42k)
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
        // Bò (BEEF) - 1 flavor x 150g (50k)
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
        // Tôm (SHRIMP) - 3 flavors x 150g (50k)
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
        setIsLoadingMenu(true);
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

  // Wallet is only a valid checkout option while logged in — if the
  // customer logs out mid-checkout, fall back to COD rather than leaving an
  // unusable selection active.
  React.useEffect(() => {
    if (!user && paymentMethod === "WALLET") {
      setPaymentMethod("CASH_ON_DELIVERY");
    }
  }, [user, paymentMethod]);

  // SubscriptionPlan catalog — public, no login needed to browse.
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
    loadPlans();
  }, [API_URL]);

  // Low-balance notifications — wallet + subscription pools, customer-web
  // banner. Only meaningful while logged in.
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

  // Load dashboard data when activeTab becomes dashboard
  React.useEffect(() => {
    if (activeTab === "dashboard" && user) {
      loadDashboard();
    }
  }, [activeTab, user, loadDashboard]);

  // Debounced live preview for the main cart's discount code field.
  React.useEffect(() => {
    const code = discountCode.trim();
    if (!code) {
      setVerifiedDiscount(null);
      setDiscountCodeStatus("idle");
      return;
    }
    setDiscountCodeStatus("checking");
    const timer = setTimeout(() => {
      // Passing the token (when logged in) lets the API also catch "you've
      // already used this code" right here in the preview, instead of only
      // surfacing it after a full checkout attempt is rejected.
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

  // Same debounced live preview for the Order Now flow's discount code field.
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
  // Mirror the server pricing engine so the cart shows the same automatic
  // discounts it will charge: 10% per-protein for >=1kg, plus order spend
  // tiers. Without this the cart total wouldn't match the amount charged.
  const cartPricing = calculateOrderTotal(
    cart.map((i) => ({
      menuItemId: i.menuItem.id,
      protein: i.menuItem.protein as any,
      flavor: i.menuItem.flavor,
      sizeGrams: i.menuItem.sizeGrams,
      unitPrice: i.menuItem.price,
      qty: i.quantity,
    })),
  );
  const bulkDiscountAmount = Math.max(cartTotal - cartPricing.finalTotal, 0);
  // Member + typed-code discounts stack on the post-bulk subtotal, matching
  // OrdersService.createForCustomer.
  const planDiscountAmountCart = hasActivePlanDiscount ? (cartPricing.lineSubtotal * planDiscountPercent) / 100 : 0;
  const discountCodeAmountRaw = verifiedDiscount
    ? Math.max(verifiedDiscount.type === "PERCENTAGE" ? (cartPricing.lineSubtotal * verifiedDiscount.amount) / 100 : verifiedDiscount.amount, 0)
    : 0;
  const combinedDiscountAmount = Math.min(discountCodeAmountRaw + planDiscountAmountCart, cartPricing.finalTotal);
  const discountCodeAmount = Math.min(discountCodeAmountRaw, cartPricing.finalTotal);
  const checkoutFinalTotal = Math.max(cartPricing.finalTotal - combinedDiscountAmount, 0) + 30000;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPass, lang);
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
    const success = await signup(
      {
        email: signupEmail,
        password: signupPass,
        firstName: signupFirst,
        lastName: signupLast,
        phone: signupPhone,
        address: signupAddress,
        city: signupCity,
        postalCode: "70000",
      },
      lang,
    );
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
    setCheckoutError(null);

    // Guest checkout — no login required. Posts to the same public endpoint
    // the storefront uses; the server derives IMMEDIATE vs SCHEDULED
    // fulfillment from live stock, so a made-to-order item schedules the
    // whole order ~24h out (the prep notice above sets that expectation).
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
      // placeOrder already fires a toast, but that sits at the same
      // z-index as this drawer's own backdrop and can be easy to miss
      // while the drawer is open - show it inline too so a rejected
      // discount code (or any other failure) is impossible to miss.
      setCheckoutError(result.message || (lang === "vi" ? "Không thể xử lý đơn hàng. Vui lòng thử lại." : "Couldn't process your order. Please try again."));
      return;
    }
    if (result) {
      // Explicit refresh rather than relying on the activeTab-change effect
      // below: the cart can be opened from ANY tab (including while already
      // sitting on "dashboard"), in which case setActiveTab("dashboard") is
      // a no-op and the effect never re-fires - leaving the just-placed
      // order missing from "My Orders" until the customer manually switches
      // tabs or reloads the page.
      loadDashboard();
      setDiscountCode("");
      if (paymentMethod === "BANK_TRANSFER") {
        setCheckoutResult(result);
      } else {
        setCartOpen(false);
        setActiveTab("dashboard");
      }
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

  const handlePostponeMyDelivery = (orderId: string) => {
    requestConfirm(
      "Hoãn lần giao này? Số lượng sẽ được bảo lưu, lịch giao sau đó sẽ dời lại một chu kỳ.",
      async () => {
        try {
          const res = await fetch(
            `${API_URL}/subscriptions/public/${orderId}/postpone?phone=${encodeURIComponent(lookupPhone.trim())}`,
            { method: "POST" },
          );
          if (res.ok) {
            handleLookupSubscription({ preventDefault: () => {} } as React.FormEvent);
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
      },
    );
  };

  const doPauseSubscription = async (id: string, nextStatus: "ACTIVE" | "PAUSED") => {
    try {
      const token = localStorage.getItem("fk_token");
      const res = await fetch(`${API_URL}/subscriptions/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        toast({
          title:
            nextStatus === "PAUSED"
              ? lang === "vi"
                ? "Đã tạm dừng gói"
                : "Subscription paused"
              : lang === "vi"
                ? "Đã kích hoạt lại gói"
                : "Subscription resumed",
          type: "success",
        });
        loadDashboard();
      } else {
        toast({
          title: translateApiError(
            result?.message,
            lang,
            lang === "vi" ? "Không thể cập nhật trạng thái gói lúc này" : "Could not update the subscription right now",
          ),
          type: "error",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again",
        type: "error",
      });
    }
  };

  // Pausing stops upcoming deliveries from being generated — worth a
  // confirmation, unlike resuming (which is always safe to do immediately).
  const handlePauseSubscription = (id: string, currentStatus: string) => {
    if (currentStatus === "ACTIVE") {
      requestConfirm(
        lang === "vi"
          ? "Tạm dừng gói này? Các lần giao sắp tới sẽ không được tạo cho đến khi bạn kích hoạt lại."
          : "Pause this subscription? Upcoming deliveries won't be generated until you resume it.",
        () => doPauseSubscription(id, "PAUSED"),
        { confirmLabel: lang === "vi" ? "Tạm dừng" : "Pause", title: lang === "vi" ? "Tạm dừng gói" : "Pause subscription" },
      );
    } else {
      doPauseSubscription(id, "ACTIVE");
    }
  };

  // Buy a SubscriptionPlan tier — opens a PENDING bank-transfer top-up (no
  // instant credit; staff reconcile the transfer, see
  // docs/plan-and-credit-design.md). Requires login, same gate the cart
  // checkout uses.
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

  // Pay a UNPAID/DEPOSIT Subscription in full from wallet balance — never
  // partial (design decision: wallet covers 100% or the customer arranges a
  // fresh bank transfer instead). 400s with a short-balance message if the
  // wallet can't fully cover it.
  const handlePayFromWallet = async (subscriptionId: string) => {
    setPayingSubscriptionId(subscriptionId);
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
        toast({
          title: translateApiError(
            result?.message,
            lang,
            lang === "vi" ? "Không thể thanh toán bằng Ví. Vui lòng kiểm tra số dư và thử lại." : "Couldn't pay from your wallet. Check your balance and try again.",
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
      setPayingSubscriptionId(null);
    }
  };

  const toggleCprProtein = (p: Protein) => {
    setCprProteins((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSubmitCustomPlanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCprError(null);
    if (!cprName.trim() || !cprPhone.trim()) {
      setCprError(lang === "vi" ? "Vui lòng nhập tên và số điện thoại" : "Please enter your name and phone number");
      return;
    }
    if (cprProteins.length === 0) {
      setCprError(lang === "vi" ? "Vui lòng chọn ít nhất 1 loại protein" : "Please select at least one protein");
      return;
    }
    setIsCprSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/custom-plan-requests/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: cprName.trim(),
          phone: cprPhone.trim(),
          desiredProteins: cprProteins,
          estimatedTotalGrams: cprEstimatedGrams ? Number(cprEstimatedGrams) * 1000 : undefined,
          preferredIntervalDays: cprIntervalDays ? Number(cprIntervalDays) : undefined,
          budgetHint: cprBudget ? Number(cprBudget) : undefined,
          notes: cprNotes.trim() || undefined,
        }),
      });
      if (res.ok) {
        setCprSubmitted(true);
        setCprName("");
        setCprPhone("");
        setCprProteins([]);
        setCprEstimatedGrams("");
        setCprIntervalDays("");
        setCprBudget("");
        setCprNotes("");
      } else {
        const result = await res.json().catch(() => null);
        setCprError(
          translateApiError(
            result?.message,
            lang,
            lang === "vi" ? "Không thể gửi yêu cầu lúc này" : "Could not submit your request right now",
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setCprError(lang === "vi" ? "Lỗi kết nối — vui lòng thử lại" : "Connection error — please try again");
    } finally {
      setIsCprSubmitting(false);
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

  const orderNowDiscountAmount = orderNowVerifiedDiscount
    ? Math.min(
        Math.max(
          orderNowVerifiedDiscount.type === "PERCENTAGE" ? (orderNowTotal * orderNowVerifiedDiscount.amount) / 100 : orderNowVerifiedDiscount.amount,
          0,
        ),
        orderNowTotal,
      )
    : 0;
  // Applies for a logged-in customer using Order Now too, matching the
  // server's phone-based customer lookup on the public endpoint.
  const orderNowPlanDiscountAmount = hasActivePlanDiscount ? (orderNowTotal * planDiscountPercent) / 100 : 0;
  const orderNowCombinedDiscountAmount = Math.min(orderNowDiscountAmount + orderNowPlanDiscountAmount, orderNowTotal);

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
        const customPrice = calculateCustomOrderPrice();
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

  // Calculator constants
  const PROTEIN_OPTIONS = [
    { 
      id: "chicken", 
      label: "Ức gà (Chicken)", 
      sizes: {
        150: { pro: 37, carb: 0, fat: 3, kcal: 175, price: 25000 },
        250: { pro: 61, carb: 0, fat: 5, kcal: 290, price: 42000 }
      }
    },
    { 
      id: "beef", 
      label: "Thịt bò (Beef)", 
      sizes: {
        150: { pro: 35, carb: 0, fat: 12, kcal: 250, price: 50000 }
      }
    },
    { 
      id: "shrimp", 
      label: "Tôm thẻ (Shrimp)", 
      sizes: {
        150: { pro: 32, carb: 0, fat: 2, kcal: 150, price: 50000 }
      }
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

  const calculateCustomMacros = () => {
    const pOpt = PROTEIN_OPTIONS.find((x) => x.id === customProtein) || PROTEIN_OPTIONS[0];
    const p = pOpt.sizes[customSize as 150 | 250] || pOpt.sizes[150];
    const c = CARB_OPTIONS.find((x) => x.id === customCarb) || CARB_OPTIONS[0];
    const s = SAUCE_OPTIONS.find((x) => x.id === customSauce) || SAUCE_OPTIONS[0];
    
    let proVal = p.pro + c.pro + s.pro;
    let carbVal = p.carb + c.carb + s.carb;
    let fatVal = p.fat + c.fat + s.fat;
    let kcalVal = p.kcal + c.kcal + s.kcal;
    let priceVal = 10000 + p.price + c.price + s.price; // 10k base prep cost

    for (const t of customToppings) {
      const topOpt = TOPPING_OPTIONS.find((x) => x.id === t);
      if (topOpt) {
        proVal += topOpt.pro;
        carbVal += topOpt.carb;
        fatVal += topOpt.fat;
        kcalVal += topOpt.kcal;
        priceVal += topOpt.price;
      }
    }

    return {
      pro: parseFloat(proVal.toFixed(1)),
      carb: parseFloat(carbVal.toFixed(1)),
      fat: parseFloat(fatVal.toFixed(1)),
      kcal: Math.round(kcalVal),
      price: priceVal,
    };
  };

  // Mirrors calculateCustomMacros' price formula (10k base prep cost +
  // protein/carb/sauce/toppings), but reads the Order Now flow's own
  // customOrder* selection state rather than the "build a bowl" section's.
  const calculateCustomOrderPrice = () => {
    const pOpt = PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein) || PROTEIN_OPTIONS[0];
    const p = pOpt.sizes[customOrderSize as 150 | 250] || pOpt.sizes[150];
    const c = CARB_OPTIONS.find((x) => x.id === customOrderCarb) || CARB_OPTIONS[0];
    const s = SAUCE_OPTIONS.find((x) => x.id === customOrderSauce) || SAUCE_OPTIONS[0];
    let priceVal = 10000 + p.price + c.price + s.price;

    for (const t of customOrderToppings) {
      const topOpt = TOPPING_OPTIONS.find((x) => x.id === t);
      if (topOpt) priceVal += topOpt.price;
    }

    return priceVal;
  };

  const handleAddCustomBowl = () => {
    const macros = calculateCustomMacros();
    const pLabel = PROTEIN_OPTIONS.find((x) => x.id === customProtein)?.label.split(" (")[0] || "";
    const cLabel = CARB_OPTIONS.find((x) => x.id === customCarb)?.label.split(" (")[0] || "";
    
    const customBowlItem: MenuItem = {
      id: `custom-${Date.now()}`,
      flavor: lang === "vi" ? `Bowl Tự Chọn (${pLabel} ${customSize}g + ${cLabel})` : `Custom Bowl (${pLabel} ${customSize}g + ${cLabel})`,
      protein: (customProtein.toUpperCase()) as Protein,
      price: macros.price,
      sizeGrams: customSize,
      isAvailable: true,
      description: lang === "vi" 
        ? `Đĩa tự chọn: ${pLabel} ${customSize}g, ${cLabel}, Ăn kèm: ${customToppings.map(t => TOPPING_OPTIONS.find(x => x.id === t)?.label.split(" (")[0]).join(", ")}, Xốt: ${SAUCE_OPTIONS.find(x => x.id === customSauce)?.label.split(" (")[0]}.`
        : `Custom plate: ${pLabel} ${customSize}g, ${cLabel}, Toppings: ${customToppings.join(", ")}, Sauce: ${customSauce}.`,
      stockQuantity: 99,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addToCart(customBowlItem, 1, undefined, lang);
    toast({
      title: lang === "vi" ? "Đã thêm đĩa ăn tự chọn!" : "Custom bowl added to cart!",
      type: "success"
    });
  };

  const groupedMenu = proteinsPresent
    .filter((p) => !selectedProtein || p === selectedProtein)
    .map((protein) => ({
      protein,
      dishes: groupByFlavor(filteredMenu.filter((item) => item.protein === protein)),
    }));

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 pb-20 md:pb-0">
      {/* 1. HEADER */}
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

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-[0.1em] uppercase text-secondary">
            <button
              onClick={() => setActiveTab("home")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "home" ? "text-foreground font-semibold" : "text-secondary"
              }`}
            >
              {t("nav_home")}
              {activeTab === "home" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "menu" ? "text-foreground font-semibold" : "text-secondary"
              }`}
            >
              {t("nav_menu")}
              {activeTab === "menu" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("calculator")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "calculator" ? "text-foreground font-semibold" : "text-secondary"
              }`}
            >
              {t("nav_calculator")}
              {activeTab === "calculator" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "wallet" ? "text-foreground font-bold" : "text-secondary"
              }`}
            >
              {t("nav_wallet")}
              {activeTab === "wallet" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                activeTab === "subscriptions" ? "text-foreground font-bold" : "text-secondary"
              }`}
            >
              {t("nav_sub")}
              {activeTab === "subscriptions" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
              )}
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`hover:text-foreground transition-colors py-2 relative cursor-pointer ${
                  activeTab === "dashboard" ? "text-foreground font-semibold" : "text-secondary"
                }`}
              >
                {t("nav_dashboard")}
                {activeTab === "dashboard" && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[3px] bg-primary rounded-full" />
                )}
              </button>
            )}
          </nav>

          <div className="flex items-center gap-6">
            {/* Premium Minimal Language Switcher */}
            <div className="hidden md:flex items-center gap-2 text-[9px] tracking-[0.2em] font-medium text-secondary font-sans select-none shrink-0 border border-border/40 rounded-full px-3 py-1 bg-card/45">
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
              className="relative p-2.5 hover:text-primary text-foreground transition-colors cursor-pointer rounded-full hover:bg-card/40"
            >
              <FontAwesomeIcon icon={faShoppingBag} className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-primary rounded-full" />
              )}
            </button>

            {/* Auth / Profile Area */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setActiveTab("dashboard")}
                    className="flex items-center gap-2 cursor-pointer border border-border/40 rounded-full py-1.5 px-3.5 bg-card/30 hover:bg-card/80 transition-all text-xs font-medium"
                  >
                    <FontAwesomeIcon icon={faUser} className="h-2.5 w-2.5 text-primary" />
                    <span>{user.firstName}</span>
                  </div>
                  <button
                    onClick={() => logout(lang)}
                    className="p-2 rounded-full hover:text-primary text-secondary transition-colors cursor-pointer"
                    title={t("btn_logout")}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModal("login")}
                  className="border border-border/60 hover:border-foreground text-foreground text-xs font-semibold py-1.5 px-4.5 rounded-full bg-transparent transition-all duration-300 flex items-center gap-2 cursor-pointer font-sans"
                >
                  <FontAwesomeIcon icon={faUser} className="h-2.5 w-2.5 text-secondary" />
                  <span>{t("btn_signin")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* IN-APP LOW-BALANCE BANNER — wallet balance low and/or a
          Subscription pool running low, from GET /notifications/me.
          Dismissal is session-only (not persisted). */}
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
                      ? `Gói "${p.packageName}" của bạn sắp hết ${PROTEIN_LABELS[p.protein as Protein] || p.protein} (còn ${formatGrams(p.remainingGrams)}).`
                      : `Your "${p.packageName}" plan is running low on ${PROTEIN_LABELS[p.protein as Protein] || p.protein} (${formatGrams(p.remainingGrams)} left).`}
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

      {/* 2. HERO SECTION (Apple, Linear, Aesop inspired) */}
      {activeTab === "home" && (
        <section className="relative bg-background pt-16 pb-24 lg:pt-24 lg:pb-36 overflow-hidden border-b border-border/10">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 space-y-10 text-left">
              <div className="inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.25em] font-medium text-secondary">
                <span className="h-1.5 w-1.5 bg-primary rounded-full shrink-0" />
                Fortify Kitchen · Tri kỷ dinh dưỡng chuẩn xác
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-[4.75rem] font-normal tracking-tight font-heading leading-[1.02] text-foreground">
                {lang === "vi" ? (
                  <>Sức khỏe khởi từ <br /><span className="font-italic italic font-light text-primary">sự thấu cảm.</span></>
                ) : (
                  <>Wellness begins with <br /><span className="font-italic italic font-light text-primary">compassion.</span></>
                )}
              </h1>

              <p className="text-sm sm:text-base text-secondary/90 leading-relaxed max-w-xl font-sans font-light">
                {lang === "vi"
                  ? "Chúng tôi tái định nghĩa trải nghiệm ẩm thực lành mạnh với sự chính xác tuyệt đối từ công thức chế biến nấu chậm (sous-vide) khép kín. Mỗi đĩa ăn là sự kết hợp hoàn hảo giữa chỉ số macros rõ ràng và hương vị nguyên bản ngọt mọng tự nhiên, đồng hành chân thành cùng hành trình sức khỏe của riêng bạn."
                  : "We redefine nutritious dining with absolute precision through closed-loop sous-vide slow-cooking. Every dish achieves the perfect balance of clear macronutrients and tender, succulent flavor, accompanying you personally on your journey."}
              </p>

              <div className="flex flex-wrap gap-4 items-center pt-2">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="bg-primary hover:bg-[#95260f] text-primary-foreground font-semibold text-xs py-4 px-9 rounded-full tracking-widest uppercase transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md active:scale-98"
                >
                  {lang === "vi" ? "Khám phá thực đơn" : "Explore menu"}
                </button>
                <button
                  onClick={() => setActiveTab("subscriptions")}
                  className="border border-border/80 hover:border-foreground text-foreground font-semibold text-xs py-4 px-9 rounded-full tracking-widest uppercase bg-transparent transition-all duration-300 cursor-pointer hover:bg-card/30 active:scale-98"
                >
                  {lang === "vi" ? "Xem gói định kỳ" : "View subscriptions"}
                </button>
              </div>

              {/* Social Proof Line (Editorial style) */}
              <div className="pt-8 border-t border-border/30 max-w-lg">
                <p className="text-xs text-secondary/80 leading-relaxed font-sans font-light">
                  {lang === "vi"
                    ? "Chế độ dinh dưỡng cân bằng đang đồng hành cùng hơn 2,000+ thành viên tại TP. Hồ Chí Minh năng động mỗi ngày."
                    : "Balanced nutrition is powering over 2,000+ active members in Ho Chi Minh City daily."}
                </p>
              </div>
            </div>

            {/* Right Asymmetrical Composition Column (Aesop-like organic layout) */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[400px] lg:max-w-full aspect-[4/5] rounded-[16px] overflow-hidden border border-border/40 bg-card p-4 shadow-sm transition-all duration-500 hover:shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"
                  alt="Premium nutritious plate"
                  className="w-full h-full object-cover rounded-[8px]"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. MAIN CONTENTS */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* TAB 0: HOME / LANDING PAGE */}
        {activeTab === "home" && (
          <div className="space-y-16 sm:space-y-20">
            {/* Trust Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { icon: faFlask, text: lang === "vi" ? "Sous-vide, không bao giờ khô" : "Sous-vide, never dry" },
                { icon: faLeaf, text: lang === "vi" ? "Nông sản chuẩn VietGAP" : "VietGAP produce" },
                { icon: faHeart, text: lang === "vi" ? "Macros rõ ràng trên nhãn" : "Macros on every label" },
                { icon: faTruck, text: lang === "vi" ? "Giao nội thành TP.HCM" : "HCMC inner-city delivery" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground leading-snug">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Featured Menu Section */}
            <div className="space-y-10 text-center">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] block">
                  {lang === "vi" ? "Nổi Bật" : "Featured"}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">{lang === "vi" ? "Món ăn nổi bật hôm nay" : "Signature Bowls Today"}</h2>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  {lang === "vi" ? "Những sự kết hợp hoàn hảo giữa hương vị tinh tế và chỉ số dinh dưỡng tối ưu." : "The perfect pairings between exquisite flavors and optimized nutritional profiles."}
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {menuItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="aspect-[4/3] w-full overflow-hidden bg-muted/20 border-b border-border/40 relative">
                        <img src={item.imageUrl} alt={getMenuItemLabel(item)} className="w-full h-full object-cover" />
                        <span className="absolute top-4 right-4 bg-primary text-primary-foreground font-mono text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
                          {t(`filter_${item.protein}` as any)}
                        </span>
                      </div>
                      <div className="p-6 text-left space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-bold font-heading">{getMenuItemLabel(item)}</h3>
                          <span className="text-sm font-bold text-primary">{formatVND(item.price)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 pt-2">
                      <button
                        onClick={() => addToCart(item, 1, undefined, lang)}
                        className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold py-3 px-4 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                        {lang === "vi" ? "Thêm vào giỏ" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="bg-primary hover:bg-[#95260f] text-primary-foreground font-semibold text-xs py-4 px-9 rounded-full tracking-widest uppercase transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md"
                >
                  {lang === "vi" ? "Xem toàn bộ thực đơn" : "View Entire Menu"}
                </button>
              </div>
            </div>

            {/* Why Fortify — Canonical Pillars */}
            <div className="bg-muted/10 border border-border/20 rounded-3xl p-8 sm:p-12 space-y-8">
              <div className="text-center space-y-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] block">
                  {lang === "vi" ? "Giá Trị Cốt Lõi" : "Our Core Values"}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
                  {lang === "vi" ? "Tại sao chọn Fortify Kitchen?" : "Why Fortify Kitchen?"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  {lang === "vi" ? "Những tiêu chuẩn tạo nên sự khác biệt trong từng phần ăn" : "The standards that define every gourmet prep we serve"}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Pillar 1: Sous-vide */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FontAwesomeIcon icon={faFlask} className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      {lang === "vi" ? "Phương pháp Sous-vide" : "Sous-vide Method"}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === "vi"
                        ? "Phương pháp nấu chậm chân không giữ độ ẩm tự nhiên của nguyên liệu và hạn chế thất thoát chất dinh dưỡng."
                        : "Vacuum slow-cooking maintains natural moisture of ingredients and limits nutrient loss."}
                    </p>
                  </div>
                </div>

                {/* Pillar 2: Organic */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <FontAwesomeIcon icon={faLeaf} className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      {lang === "vi" ? "Nông Sản Chuẩn VietGAP" : "VietGAP Standard Crops"}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === "vi"
                        ? "Sử dụng rau củ từ các nhà cung cấp đạt chuẩn VietGAP tại Đà Lạt và được nhập mới mỗi ngày."
                        : "Sourced from VietGAP-certified suppliers in Dalat with fresh daily arrivals."}
                    </p>
                  </div>
                </div>

                {/* Pillar 3: Macros */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/5 flex items-center justify-center text-rose-500 transition-colors group-hover:bg-rose-500 group-hover:text-white">
                    <FontAwesomeIcon icon={faHeart} className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      {lang === "vi" ? "Định Lượng Dinh Dưỡng" : "Precise Macros"}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === "vi"
                        ? "Thông tin hàm lượng calo, protein, carb và fat được định lượng rõ ràng cho từng phần ăn."
                        : "Calories, protein, carb, and fat metrics are clearly calculated and measured per serving."}
                    </p>
                  </div>
                </div>

                {/* Pillar 4: Transparent */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all shadow-xs group">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                    <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      {lang === "vi" ? "Minh Bạch Thông Tin" : "Transparent Info"}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === "vi"
                        ? "Các phần ăn được cam kết chế biến không chất bảo quản nhân tạo và công khai chi tiết nguyên liệu sử dụng."
                        : "Meals are prepared without artificial preservatives and are served with detailed ingredient labels."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sous-vide Story */}
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] block">
                  {lang === "vi" ? "Phương Pháp Chế Biến" : "The Kitchen Method"}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">
                  {lang === "vi"
                    ? "Tại sao lại áp dụng nấu chậm chân không?"
                    : "The science behind precision sous-vide."}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === "vi"
                    ? "Ở nhiệt độ nấu thông thường, thớ cơ của thịt bò hoặc thịt gà có xu hướng co rút và mất nước, làm giảm độ mọng nước và độ ẩm tự nhiên của thực phẩm. Phương pháp nấu chậm chân không (Sous-vide) làm chín thực phẩm trong bể nước được điều khiển nhiệt độ chính xác. Kỹ thuật này giúp món ăn chín đều từ trong ra ngoài, giữ được độ ẩm tự nhiên cũng như các chất dinh dưỡng hòa tan có trong nguyên liệu."
                    : "Traditional high-temperature cooking causes protein fibers to contract and lose moisture. The low-temperature vacuum method (Sous-vide) cooks ingredients evenly in a precise temperature-controlled water bath. This technique preserves the natural moisture and soluble nutrients of the food."}
                </p>
              </div>

              <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-muted/20 border border-border/40 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800"
                  alt={lang === "vi" ? "Quy trình chế biến sous-vide tại bếp Fortify Kitchen" : "Sous-vide precision cooking workflow at Fortify Kitchen"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Mission / Quote Callout */}
            <div className="border border-border/70 bg-card rounded-3xl p-8 sm:p-10 shadow-warm relative overflow-hidden flex gap-5 sm:gap-6 items-start max-w-4xl mx-auto">
              <FontAwesomeIcon icon={faQuoteLeft} className="h-8 w-8 text-primary/20 shrink-0 mt-1" />
              <div className="space-y-4">
                <p className="text-base sm:text-lg text-foreground font-heading italic leading-relaxed">
                  {lang === "vi"
                    ? "Chúng tôi tập trung nghiên cứu và chuẩn hóa các khẩu phần ăn ngon miệng, đảm bảo đầy đủ hàm lượng dinh dưỡng thiết yếu và tính tiện lợi cho cuộc sống năng động."
                    : "We focus on designing and standardizing delicious meals that guarantee essential nutritional requirements and convenience for active lifestyles."}
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-8 bg-secondary/40" />
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest font-sans">
                    {lang === "vi" ? "Đội ngũ Phát triển Fortify Kitchen" : "Fortify Kitchen Development Team"}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Testimonial */}
            <div className="bg-[#D4EFE4]/30 border border-[#D4EFE4]/70 p-12 rounded-3xl space-y-8 text-center max-w-4xl mx-auto">
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#2F4A3C]">
                {lang === "vi" ? "Đánh giá từ khách hàng" : "Customer Testimonials"}
              </span>
              <p className="text-xl sm:text-2xl font-light italic leading-relaxed text-[#2F4A3C] font-heading">
                {lang === "vi"
                  ? "\u201cĂn uống lành mạnh chưa bao giờ dễ dàng và mọng nước đến thế! Ức gà nấu sous-vide của Fortify Kitchen mềm ngọt như tan trong miệng, vượt xa mọi quán ăn healthy mình từng thử.\u201d"
                  : "\u201cHealthy eating has never been this effortless and juicy! The sous-vide chicken from Fortify Kitchen melts in your mouth. It goes way beyond any healthy diner I\u2019ve ever tried.\u201d"}
              </p>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#2F4A3C]">Minh Anh</p>
                <p className="text-[10px] text-[#2F4A3C]/70">{lang === "vi" ? "Hội viên 6 tháng · Quận 1, TP. HCM" : "6-month member · District 1, HCMC"}</p>
              </div>
            </div>

            {/* Final CTA Band */}
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-10 sm:p-14 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">
                {lang === "vi" ? "Sẵn sàng ăn sạch mỗi tuần?" : "Ready to eat clean every week?"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                {lang === "vi"
                  ? "Khám phá thực đơn đầy đủ với macro rõ ràng, nguyên liệu sạch và hương vị mọng nước từ sous-vide."
                  : "Explore our full menu with clear macros, clean ingredients, and juicy sous-vide flavor."}
              </p>
              <button
                onClick={() => setActiveTab("menu")}
                className="bg-primary hover:bg-[#95260f] text-primary-foreground font-semibold text-xs py-4 px-9 rounded-full tracking-widest uppercase transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md active:scale-98"
              >
                {lang === "vi" ? "Khám phá thực đơn" : "Explore Menu"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 0.5: FOOD CALORIES CALCULATOR */}
        {activeTab === "calculator" && (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
                {lang === "vi" ? "Thiết kế đĩa ăn & Tính Macro" : "Custom Plate Macro Calculator"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === "vi" 
                  ? "Tự chọn nguồn đạm, tinh bột phức và xốt để tính lượng Calories, Protein, Carbs và Fat tức thời." 
                  : "Select your protein, complex carbs, and clean sauces to calculate live Calories, Protein, Carbs and Fat values."}
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-start">
              {/* Selector Columns */}
              <div className="lg:col-span-8 space-y-8">
                {/* 1. Protein Selection */}
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">1</span>
                    {lang === "vi" ? "Chọn Nguồn Đạm (Protein)" : "Select Protein"}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {PROTEIN_OPTIONS.map((opt) => {
                      const sizeSpecs = opt.sizes[customSize as 150 | 250] || opt.sizes[150];
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setCustomProtein(opt.id)}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            customProtein === opt.id
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                              : "border-border bg-card hover:bg-muted"
                          }`}
                        >
                          <span className="text-xs font-bold font-heading">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-1">
                            {sizeSpecs.pro}g Pro · {sizeSpecs.fat}g Fat · {sizeSpecs.kcal} kcal
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1.5. Portion Size Selection */}
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">1.5</span>
                    {lang === "vi" ? "Chọn Định Lượng (Portion)" : "Select Portion"}
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCustomSize(150)}
                      className={`px-6 py-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        customSize === 150
                          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      150g
                    </button>
                    <button
                      disabled={customProtein !== "chicken"}
                      onClick={() => setCustomSize(250)}
                      className={`px-6 py-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        customSize === 250
                          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      250g {customProtein !== "chicken" && (lang === "vi" ? "(Chỉ có cho Gà)" : "(Chicken only)")}
                    </button>
                  </div>
                </div>

                {/* 2. Carb Selection */}
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">2</span>
                    {lang === "vi" ? "Chọn Tinh Bột (Carbohydrates)" : "Select Carbohydrates"}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {CARB_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setCustomCarb(opt.id)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          customCarb === opt.id
                            ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="text-xs font-bold font-heading">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono mt-1">
                          {opt.carb}g Carb · {opt.kcal} kcal
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Toppings Selection */}
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">3</span>
                    {lang === "vi" ? "Chọn Rau củ & Topping ăn kèm" : "Select Sides & Toppings"}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {TOPPING_OPTIONS.map((opt) => {
                      const isSelected = customToppings.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (isSelected) {
                              setCustomToppings(customToppings.filter((t) => t !== opt.id));
                            } else {
                              setCustomToppings([...customToppings, opt.id]);
                            }
                          }}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                              : "border-border bg-card hover:bg-muted"
                          }`}
                        >
                          <span className="text-xs font-bold font-heading">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-1">
                            +{opt.kcal} kcal · +{formatVND(opt.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Sauce Selection */}
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold font-heading flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">4</span>
                    {lang === "vi" ? "Chọn Xốt Dinh Dưỡng" : "Select Clean Sauce"}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {SAUCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setCustomSauce(opt.id)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          customSauce === opt.id
                            ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="text-xs font-bold font-heading">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono mt-1">
                          +{opt.kcal} kcal
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculator Live Panel */}
              <div className="lg:col-span-4 border border-border/80 bg-card rounded-2xl p-6 space-y-6 shadow-sm sticky top-24">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em] font-sans">
                    {lang === "vi" ? "Bảng chỉ số dinh dưỡng" : "Macros Dashboard"}
                  </span>
                  <h3 className="text-lg font-bold font-heading">
                    {lang === "vi" ? "Đĩa Ăn Tự Chọn" : "Your Custom Plate"}
                  </h3>
                </div>

                <div className="border-t border-border/30 pt-4 flex flex-col gap-3 font-mono text-xs text-secondary">
                  <div className="flex justify-between items-center">
                    <span className="tracking-wider">PROTEIN</span>
                    <span className="font-bold text-foreground">{calculateCustomMacros().pro}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="tracking-wider">CARBS</span>
                    <span className="font-bold text-foreground">{calculateCustomMacros().carb}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="tracking-wider">FAT</span>
                    <span className="font-bold text-foreground">{calculateCustomMacros().fat}g</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2">
                    <span className="tracking-wider font-bold">CALORIES</span>
                    <span className="font-bold text-primary text-base">{calculateCustomMacros().kcal} kcal</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2">
                    <span className="tracking-wider font-bold">{lang === "vi" ? "GIÁ TIỀN" : "PRICE"}</span>
                    <span className="font-bold text-foreground text-sm">{formatVND(calculateCustomMacros().price)}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddCustomBowl}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                  {lang === "vi" ? "Thêm Combo vào giỏ" : "Add Combo to Cart"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 0.7: ABOUT US */}

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
                  {lang === "vi" ? "Đang tải thực đơn dinh dưỡng..." : "Loading nutritious menu..."}
                </span>
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <FontAwesomeIcon icon={faInfoCircle} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground font-medium">
                  {lang === "vi" ? "Chưa có món trong danh mục này. Hãy xem danh mục khác hoặc món nổi bật hôm nay." : "Nothing in this category yet. Try another category or see today's signature bowls."}
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
                                <span
                                  className={`absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                                    (selected.stockQuantity ?? 0) > 0
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {(selected.stockQuantity ?? 0) > 0
                                    ? lang === "vi"
                                      ? `Còn ${selected.stockQuantity} phần · giao ngay`
                                      : `${selected.stockQuantity} ready now`
                                    : lang === "vi"
                                      ? "Đặt trước · 24h"
                                      : "Made to order · 24h"}
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

                            <div className="px-6 pb-6 pt-3">
                              <button
                                onClick={() => addToCart(selected, 1, undefined, lang)}
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

        {/* TAB 1.5: ORDER NOW — supports Standard flow (today's menu) and Custom flow (outside menu, 24h advance) */}
        {activeTab === "order-now" && (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-6 space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">{t("order_title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("order_subtitle")}
              </p>
            </div>

            {/* Segmented Flow Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1 bg-muted/40 border border-border/40 rounded-xl">
                <button
                  type="button"
                  onClick={() => readyNowItems.length > 0 && setOrderFlowType("standard")}
                  disabled={readyNowItems.length === 0}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderFlowType === "standard"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                  {lang === "vi" ? "Giao Ngay (Hôm nay)" : "Order Today's Menu"}
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFlowType("custom")}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderFlowType === "custom"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-secondary hover:text-foreground"
                  }`}
                >
                  <FontAwesomeIcon icon={faMagic} className="h-3.5 w-3.5" />
                  {lang === "vi" ? "Đặt Theo Yêu Cầu (Custom)" : "Custom Order Request"}
                </button>
              </div>
            </div>

            {orderNowResult ? (
              <div className="max-w-md mx-auto border border-border bg-card rounded-2xl p-6 text-center space-y-5 shadow-sm">
                <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 mx-auto text-emerald-500" />
                <h3 className="text-sm font-bold font-heading">{t("success_title")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {orderNowResult.fulfillmentType === "IMMEDIATE"
                    ? (lang === "vi" ? "Đơn hàng của bạn đang được chuẩn bị để giao ngay lập tức." : "Your order is prepping for immediate delivery.")
                    : (lang === "vi" 
                        ? `Yêu cầu đặt trước đã được gửi. Đơn hàng dự kiến giao vào ngày ${new Date(orderNowResult.deliveryDate).toLocaleDateString("vi-VN")}.`
                        : `Pre-order request submitted. Delivery scheduled for ${new Date(orderNowResult.deliveryDate).toLocaleDateString("en-US")}.`
                      )}
                </p>

                {orderNowResult.systemNotes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left leading-relaxed animate-in fade-in duration-200">
                    <p className="font-semibold mb-0.5">{lang === "vi" ? "Thông báo hệ thống:" : "System notification:"}</p>
                    <p>{orderNowResult.systemNotes}</p>
                  </div>
                )}

                {/* Shared Order Lifecycle Progress Log */}
                <div className="border border-border/60 bg-muted/15 rounded-xl p-4 text-left space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block border-b border-border/40 pb-1">
                    {lang === "vi" ? "Cập nhật đơn hàng" : "Order updates"}
                  </span>
                  
                  <div className="space-y-4 pt-1">
                    <div className="flex gap-3 relative">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                        <div className="w-[1.5px] h-6 bg-border/80" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{lang === "vi" ? "Đã gửi đơn hàng" : "Submitted"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {lang === "vi" ? "Đã nhận đơn — chúng tôi đã gửi xác nhận cho bạn qua SMS/Zalo." : "Order received — we've sent your confirmation by SMS/Zalo."}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 relative">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">●</span>
                        <div className="w-[1.5px] h-6 bg-border/40" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{lang === "vi" ? "Đang chờ duyệt" : "Pending Confirmation"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {lang === "vi" ? "Quản lý đang kiểm tra nguyên liệu & nhân viên bếp xác nhận." : "Waiting for kitchen manager approval."}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 relative">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="h-5 w-5 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center text-[10px]">3</span>
                        <div className="w-[1.5px] h-6 bg-border/40" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">{lang === "vi" ? "Đã xác nhận & Chế biến" : "Confirmed & Prepping"}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="h-5 w-5 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center text-[10px]">4</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">{lang === "vi" ? "Đã giao hàng" : "Delivered"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("txt_total")}</span>
                  <p className="text-lg font-bold text-primary">{formatVND(orderNowResult.total)}</p>
                </div>

                {orderNowResult.paymentMethod === "BANK_TRANSFER" && (
                  <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-3 text-left">
                    <p className="text-xs font-bold text-foreground text-center">{lang === "vi" ? "Quét mã VietQR để thanh toán" : "Scan VietQR Code to Pay"}</p>
                    <div className="bg-white p-2.5 rounded-lg border border-border w-40 h-40 mx-auto flex items-center justify-center">
                      <img
                        src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${orderNowResult.total}&addInfo=FK${orderNowResult.id.slice(0, 8)}&accountName=FORTIFY%20KITCHEN`}
                        alt="VietQR Payment Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOrderNowResult(null);
                    setOrderNowName("");
                    setOrderNowPhone("");
                    setOrderNowAddress("");
                    setOrderNowNotes("");
                    setOrderNowProvince("");
                    setOrderNowWard("");
                    setOrderNowStreet("");
                    setOrderNowDiscountCode("");
                    setOrderNowAgreeTerms(false);
                  }}
                  className="w-full text-xs font-bold py-2.5 rounded-xl border border-border hover:bg-muted cursor-pointer transition-colors"
                >
                  {t("btn_order_more")}
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Columns (Order items standard or form picker custom) */}
                <div className="lg:col-span-2 space-y-6 text-left">
                  {orderFlowType === "standard" ? (
                    <>
                      {/* Standard flow content */}
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
                        {["BEEF", "CHICKEN", "SHRIMP"].map((protein) => {
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
                          <p className="text-xs text-muted-foreground font-semibold">
                            {lang === "vi" ? "Bếp đang chuẩn bị mẻ mới — chưa có món giao ngay. Quay lại sau ít phút nhé." : "Kitchen's between batches — nothing ready to deliver now. Check back in a few minutes."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {groupByFlavor(filteredReadyNowItems).map((dish) => {
                            const dishKey = `${dish.protein}::${dish.flavor}`;
                            const selected = getSelectedSize(dish);
                            const inCart = orderNowCart.find((l) => l.menuItem.id === selected.id);
                            return (
                              <div key={dishKey} className="border border-border bg-card rounded-xl p-4 space-y-3 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-sm font-bold font-heading truncate">{dish.flavor}</h4>
                                    <span className="text-xs font-bold text-primary shrink-0">{formatVND(selected.price)}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{selected.description}</p>
                                </div>
                                
                                <div className="space-y-3 pt-2">
                                  {dish.sizes.length > 1 && (
                                    <div className="flex gap-1.5">
                                      {dish.sizes.map((size) => (
                                        <button
                                          key={size.id}
                                          type="button"
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
                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {selected.stockQuantity} {t("unit_stock")}
                                    </span>
                                    {inCart ? (
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => updateOrderNowQty(selected.id, inCart.qty - 1)}
                                          className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer"
                                        >
                                          <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{inCart.qty}</span>
                                        <button
                                          type="button"
                                          onClick={() => updateOrderNowQty(selected.id, inCart.qty + 1)}
                                          disabled={inCart.qty >= selected.stockQuantity}
                                          className="h-6 w-6 flex items-center justify-center rounded border border-border hover:bg-muted cursor-pointer disabled:opacity-30"
                                        >
                                          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => addToOrderNowCart(selected)}
                                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer"
                                      >
                                        {lang === "vi" ? "Thêm" : "Add"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Custom order flow picker */}
                      <div className="flex gap-3 bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl text-amber-800 text-xs mb-6 text-left">
                        <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{lang === "vi" ? "Lưu ý Đặt Món Theo Yêu Cầu (24h trước)" : "Custom Order Requirement (24h in advance)"}</p>
                          <p className="mt-0.5 opacity-90 leading-relaxed text-[11px]">
                            {lang === "vi"
                              ? "Món ăn đặt ngoài thực đơn có sẵn cần tối thiểu 24 giờ chuẩn bị để đảm bảo nguyên liệu tươi sống được tuyển chọn và tẩm ướp chuẩn kỹ nghệ sous-vide."
                              : "Custom orders outside our standard list require at least 24 hours of preparation to guarantee the finest fresh ingredients and perfect sous-vide marination."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* 1. Custom Protein */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                            {lang === "vi" ? "1. Chọn Nguồn Đạm (Protein)" : "1. Select Protein"}
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {PROTEIN_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCustomOrderProtein(opt.id)}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                  customOrderProtein === opt.id
                                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                    : "border-border bg-card hover:bg-muted"
                                }`}
                              >
                                <span className="text-xs font-bold font-heading">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 1.5. Custom Portion Size */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                            {lang === "vi" ? "1.5 Chọn Định Lượng (Portion)" : "1.5 Select Portion"}
                          </label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setCustomOrderSize(150)}
                              className={`px-6 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                customOrderSize === 150
                                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                  : "border-border bg-card hover:bg-muted"
                              }`}
                            >
                              150g
                            </button>
                            <button
                              type="button"
                              disabled={customOrderProtein !== "chicken"}
                              onClick={() => setCustomOrderSize(250)}
                              className={`px-6 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                customOrderSize === 250
                                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                  : "border-border bg-card hover:bg-muted"
                              }`}
                            >
                              250g {customOrderProtein !== "chicken" && (lang === "vi" ? "(Chỉ có cho Gà)" : "(Chicken only)")}
                            </button>
                          </div>
                        </div>

                        {/* 2. Custom Carbs */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                            {lang === "vi" ? "2. Chọn Tinh Bột (Carbohydrates)" : "2. Select Carbohydrates"}
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {CARB_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCustomOrderCarb(opt.id)}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                  customOrderCarb === opt.id
                                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                    : "border-border bg-card hover:bg-muted"
                                }`}
                              >
                                <span className="text-xs font-bold font-heading">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Custom Toppings */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                            {lang === "vi" ? "3. Chọn Rau Củ & Toppings" : "3. Select Sides & Toppings"}
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {TOPPING_OPTIONS.map((opt) => {
                              const isSelected = customOrderToppings.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setCustomOrderToppings((prev) =>
                                      isSelected ? prev.filter((t) => t !== opt.id) : [...prev, opt.id]
                                    );
                                  }}
                                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                      : "border-border bg-card hover:bg-muted"
                                  }`}
                                >
                                  <span className="text-xs font-bold font-heading">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 4. Custom Sauce */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                            {lang === "vi" ? "4. Chọn Xốt" : "4. Select Sauce"}
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {SAUCE_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCustomOrderSauce(opt.id)}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                  customOrderSauce === opt.id
                                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                    : "border-border bg-card hover:bg-muted"
                                }`}
                              >
                                <span className="text-xs font-bold font-heading">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 5. Custom Order Delivery Date Picker (24h in advance enforced) */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                              {lang === "vi" ? "Thời gian giao hàng (Dự kiến)" : "Delivery Date (Scheduled)"}
                            </label>
                            <input
                              type="date"
                              required
                              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                              value={customOrderDeliveryDate}
                              onChange={(e) => setCustomOrderDeliveryDate(e.target.value)}
                              className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground cursor-pointer font-bold font-mono"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                              {lang === "vi" ? "Số lượng phần ăn" : "Quantity"}
                            </label>
                            <div className="flex items-center gap-3 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setCustomOrderQty(prev => Math.max(1, prev - 1))}
                                className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                              >
                                <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-extrabold w-8 text-center font-mono">{customOrderQty}</span>
                              <button
                                type="button"
                                onClick={() => setCustomOrderQty(prev => prev + 1)}
                                className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                              >
                                <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column (Cart review standard or live macro custom + checkout details form) */}
                <div className="space-y-4">
                  {orderFlowType === "standard" ? (
                    <div className="border border-border bg-card rounded-2xl p-6 space-y-4 shadow-sm text-left">
                      <h3 className="text-sm font-bold font-heading">{t("txt_your_order")}</h3>
                      {orderNowCart.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("txt_empty_cart")}</p>
                      ) : (
                        <div className="space-y-2">
                          {orderNowCart.map((l) => (
                            <div key={l.menuItem.id} className="flex justify-between text-xs">
                              <span className="truncate pr-2">{l.menuItem.flavor} ×{l.qty}</span>
                              <span className="font-semibold shrink-0">{formatVND(l.menuItem.price * l.qty)}</span>
                            </div>
                          ))}
                          {hasActivePlanDiscount && (
                            <div className="flex justify-between text-xs font-semibold text-emerald-600 pt-1 border-t border-border/50">
                              <span>{lang === "vi" ? `Ưu đãi thành viên (${planDiscountPercent}%)` : `Member discount (${planDiscountPercent}%)`}</span>
                              <span>-{formatVND(orderNowPlanDiscountAmount)}</span>
                            </div>
                          )}
                          {orderNowDiscountAmount > 0 && (
                            <div className={`flex justify-between text-xs font-semibold text-emerald-600 ${hasActivePlanDiscount ? "" : "pt-1 border-t border-border/50"}`}>
                              <span>
                                {t("cart_discount")} ({orderNowDiscountCode.trim().toUpperCase()})
                              </span>
                              <span>-{formatVND(orderNowDiscountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/50">
                            <span>{t("txt_total")}</span>
                            <span className="text-primary">{formatVND(orderNowTotal - orderNowCombinedDiscountAmount)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Live custom macros panel */
                    <div className="border border-border bg-card rounded-2xl p-6 space-y-4 shadow-sm text-left">
                      <h3 className="text-sm font-bold font-heading">
                        {lang === "vi" ? "Chỉ số Dinh dưỡng Ước tính" : "Estimated Meal Nutrition"}
                      </h3>

                      <div className="flex flex-col gap-3 font-mono text-xs text-secondary">
                        <div className="flex justify-between items-center">
                          <span className="tracking-wider">PROTEIN</span>
                          <span className="font-bold text-foreground">
                            {((
                              ((PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein)?.sizes[customOrderSize as 150 | 250]?.pro || 37) +
                              (CARB_OPTIONS.find((x) => x.id === customOrderCarb)?.pro || 0) +
                              (SAUCE_OPTIONS.find((x) => x.id === customOrderSauce)?.pro || 0) +
                              customOrderToppings.reduce((acc, t) => acc + (TOPPING_OPTIONS.find(x => x.id === t)?.pro || 0), 0)) * customOrderQty
                            ).toFixed(0))}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="tracking-wider">CARBS</span>
                          <span className="font-bold text-foreground">
                            {((
                              ((PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein)?.sizes[customOrderSize as 150 | 250]?.carb || 0) +
                              (CARB_OPTIONS.find((x) => x.id === customOrderCarb)?.carb || 0) +
                              (SAUCE_OPTIONS.find((x) => x.id === customOrderSauce)?.carb || 0) +
                              customOrderToppings.reduce((acc, t) => acc + (TOPPING_OPTIONS.find(x => x.id === t)?.carb || 0), 0)) * customOrderQty
                            ).toFixed(0))}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="tracking-wider">FAT</span>
                          <span className="font-bold text-foreground">
                            {((
                              ((PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein)?.sizes[customOrderSize as 150 | 250]?.fat || 0) +
                              (CARB_OPTIONS.find((x) => x.id === customOrderCarb)?.fat || 0) +
                              (SAUCE_OPTIONS.find((x) => x.id === customOrderSauce)?.fat || 0) +
                              customOrderToppings.reduce((acc, t) => acc + (TOPPING_OPTIONS.find(x => x.id === t)?.fat || 0), 0)) * customOrderQty
                            ).toFixed(0))}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2">
                          <span className="tracking-wider font-bold">CALORIES</span>
                          <span className="font-bold text-primary text-base">
                            {Math.round(
                              ((PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein)?.sizes[customOrderSize as 150 | 250]?.kcal || 175) +
                              (CARB_OPTIONS.find((x) => x.id === customOrderCarb)?.kcal || 0) +
                              (SAUCE_OPTIONS.find((x) => x.id === customOrderSauce)?.kcal || 0) +
                              customOrderToppings.reduce((acc, t) => acc + (TOPPING_OPTIONS.find(x => x.id === t)?.kcal || 0), 0)) * customOrderQty
                            )} kcal
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/20 pt-3 mt-2">
                          <span className="tracking-wider font-bold">{lang === "vi" ? "ĐƠN GIÁ ƯỚC TÍNH" : "ESTIMATED TOTAL"}</span>
                          <span className="font-bold text-foreground text-sm">
                            {formatVND(calculateCustomOrderPrice() * customOrderQty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer checkout details form */}
                  <div className="border border-border bg-card rounded-2xl p-6 space-y-4 shadow-sm text-left">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      {lang === "vi" ? "Thông tin nhận hàng" : "Delivery Details"}
                    </span>
                    <form onSubmit={(e) => { e.preventDefault(); setShowCheckoutReview(true); }} className="space-y-3.5">
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

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <FontAwesomeIcon icon={faTag} className="h-3 w-3" /> {t("cart_coupon")}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. WELCOME10"
                        value={orderNowDiscountCode}
                        onChange={(e) => setOrderNowDiscountCode(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                      />
                      {orderNowDiscountCodeStatus === "valid" && (
                        <p className="text-[9px] text-emerald-600 font-medium mt-1">
                          {lang === "vi"
                            ? `✓ Đã áp dụng: giảm ${formatVND(orderNowDiscountAmount)}`
                            : `✓ Applied: ${formatVND(orderNowDiscountAmount)} off`}
                        </p>
                      )}
                      {orderNowDiscountCodeStatus === "invalid" && (
                        <p className="text-[9px] text-red-500 font-medium mt-1">
                          {orderNowDiscountCodeError || (lang === "vi" ? "Mã giảm giá không hợp lệ hoặc đã hết hạn" : "This code is invalid or has expired")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
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

                      {orderNowError && <p className="text-[10px] text-red-500 leading-normal">{orderNowError}</p>}
                      <button
                        type="submit"
                        disabled={
                          (orderFlowType === "standard" && orderNowCart.length === 0) ||
                          !orderNowAgreeTerms
                        }
                        className="w-full bg-primary text-primary-foreground text-xs font-bold py-3 rounded-xl hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {t("btn_checkout")}
                      </button>
                    </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ORDER CHECKOUT SUMMARY REVIEW DIALOG MODAL */}
            {showCheckoutReview && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="absolute inset-0 cursor-pointer" onClick={() => setShowCheckoutReview(false)} />
                <div className="relative w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl p-6 z-10 space-y-5 text-left">
                  <div className="text-center pb-2 border-b border-border/40">
                    <h3 className="text-sm font-extrabold font-heading text-foreground uppercase tracking-wider">
                      {lang === "vi" ? "XÁC NHẬN THÔNG TIN ĐƠN HÀNG" : "REVIEW YOUR ORDER"}
                    </h3>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "Người nhận" : "Receiver"}</span>
                      <p className="font-bold text-foreground">{orderNowName} ({orderNowPhone})</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "Địa chỉ giao hàng" : "Delivery Address"}</span>
                      <p className="text-foreground leading-relaxed">
                        {orderNowStreet ? `${orderNowStreet}, ` : ""}
                        {orderNowWard && orderNowProvince
                          ? getWardsByDistrictCode(orderNowWard.slice(0, 5))?.find((w: any) => w.code === orderNowWard)?.name || orderNowWard
                          : ""}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "Hình thức giao" : "Fulfillment Window"}</span>
                      <p className="font-bold text-primary flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 shrink-0" />
                        {orderFlowType === "standard"
                          ? (lang === "vi" ? "Giao hàng ngay hôm nay" : "Immediate delivery today")
                          : (lang === "vi" ? `Giao sau 24h vào ngày ${new Date(customOrderDeliveryDate).toLocaleDateString("vi-VN")}` : `Scheduled after 24h on ${new Date(customOrderDeliveryDate).toLocaleDateString("en-US")}`)}
                      </p>
                    </div>

                    <div className="space-y-1.5 border-t border-border/30 pt-3">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{lang === "vi" ? "Chi tiết phần ăn" : "Meal Details"}</span>
                      <div className="space-y-1 bg-muted/20 p-2.5 rounded-lg border border-border/30">
                        {orderFlowType === "standard" ? (
                          orderNowCart.map((l) => (
                            <div key={l.menuItem.id} className="flex justify-between font-mono text-[11px]">
                              <span>{l.menuItem.flavor} ×{l.qty}</span>
                              <span>{formatVND(l.menuItem.price * l.qty)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="leading-relaxed">
                              {lang === "vi" ? `Đĩa Custom: ${PROTEIN_OPTIONS.find((x) => x.id === customOrderProtein)?.label.split(" (")[0]} ${customOrderSize}g` : `Custom ${customOrderProtein} ${customOrderSize}g`}<br />
                              <span className="text-[10px] text-muted-foreground">
                                + {CARB_OPTIONS.find((x) => x.id === customOrderCarb)?.label.split(" (")[0]} <br />
                                + Sides: {customOrderToppings.map(t => TOPPING_OPTIONS.find(x => x.id === t)?.label.split(" (")[0]).join(", ") || "None"} <br />
                                + Xốt: {SAUCE_OPTIONS.find(x => x.id === customOrderSauce)?.label.split(" (")[0]}
                              </span>
                            </span>
                            <span className="font-bold whitespace-nowrap pt-0.5">×{customOrderQty}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-border/40">
                      <span>{lang === "vi" ? "TỔNG THANH TOÁN" : "GRAND TOTAL"}</span>
                      <span className="text-primary text-base">
                        {formatVND(orderFlowType === "standard" ? orderNowTotal : calculateCustomOrderPrice() * customOrderQty)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => setShowCheckoutReview(false)}
                      className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer border border-border transition-colors font-heading"
                    >
                      {lang === "vi" ? "Chỉnh sửa" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitOrderNow()}
                      disabled={isSubmittingOrderNow}
                      className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingOrderNow && <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />}
                      {lang === "vi" ? "Xác nhận & Đặt" : "Place Order"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Track my order — self-serve status check by phone. */}
            <div className="max-w-md mx-auto mt-16 pt-10 border-t border-border">
              <h3 className="text-center text-sm font-bold font-heading mb-1">
                {lang === "vi" ? "Theo dõi trạng thái đơn hàng" : "Track Your Orders"}
              </h3>
              <p className="text-center text-xs text-muted-foreground mb-5">
                {lang === "vi"
                  ? "Nhập số điện thoại của bạn để xem tiến độ giao hàng & nhật ký thông báo Zalo/SMS."
                  : "Enter the phone number used during checkout to check the latest delivery status."}
              </p>
              <form onSubmit={handleTrackOrders} className="flex gap-2 mb-6">
                <input
                  type="tel"
                  required
                  placeholder={lang === "vi" ? "Số điện thoại của bạn" : "Your phone number"}
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
                  {lang === "vi" ? "Tra cứu" : "Track"}
                </button>
              </form>

              {trackingError && <p className="text-center text-xs text-red-500 mb-4">{trackingError}</p>}

              {hasTracked && !isTrackingLoading && !trackingError && trackedOrders.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {lang === "vi" ? "Không có đơn nào với số này. Kiểm tra lại số, hoặc đặt đơn đầu tiên của bạn." : "No orders under this number. Double-check it, or place your first order."}
                </p>
              )}

              <div className="space-y-4 text-left">
                {trackedOrders.map((o: any) => (
                  <div key={o.id} className="border border-border bg-card rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3 border-b border-border/40 pb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {(o.items || []).map((i: any) => `${i.flavor} ×${i.qty}`).join(", ")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(o.deliveryDate).toLocaleDateString("vi-VN")} · {formatVND(o.total)}
                        </p>
                        {o.systemNotes && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 mt-1.5 leading-relaxed">
                            {o.systemNotes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap uppercase tracking-wider ${
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

                    {/* Step-by-step progress tracker for active orders */}
                    <div className="space-y-3 pt-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">{lang === "vi" ? "Nhật ký Zalo/SMS đã gửi:" : "Zalo/SMS Notifications Log:"}</span>
                      
                      <div className="space-y-2 border-l border-border/60 pl-3.5 ml-1">
                        {/* Submitted notification (sent at creation time) */}
                        <div className="relative">
                          <span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                          <p className="text-[11px] font-semibold text-foreground">{lang === "vi" ? "Đã gửi đơn hàng" : "Order Submitted"}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                            {lang === "vi" 
                              ? `Báo nhận đơn gửi tới Zalo số ${o.phone}. Đơn hàng có mã FK${o.id.slice(0,8).toUpperCase()}.` 
                              : `Order received SMS dispatched to ${o.phone}. Ref: FK${o.id.slice(0,8).toUpperCase()}.`}
                          </p>
                        </div>

                        {/* Confirmed notification (sent when status is PREPPING, SHIPPED, or DELIVERED) */}
                        {(o.deliveryStatus === "PREPPING" || o.deliveryStatus === "SHIPPED" || o.deliveryStatus === "DELIVERED") && (
                          <div className="relative pt-1.5">
                            <span className="absolute -left-[19px] top-3 h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="text-[11px] font-semibold text-foreground">{lang === "vi" ? "Đã xác nhận & Chế biến" : "Confirmed & Prepping"}</p>
                            <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                              {lang === "vi" 
                                ? "Báo duyệt & chuẩn bị nguyên liệu đã gửi tới Zalo." 
                                : "Order confirmed and kitchen preparation notification sent."}
                            </p>
                          </div>
                        )}

                        {/* Out for delivery notification (sent when status is SHIPPED or DELIVERED) */}
                        {(o.deliveryStatus === "SHIPPED" || o.deliveryStatus === "DELIVERED") && (
                          <div className="relative pt-1.5">
                            <span className="absolute -left-[19px] top-3 h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="text-[11px] font-semibold text-foreground">{lang === "vi" ? "Đang giao hàng" : "Out for Delivery"}</p>
                            <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                              {lang === "vi" 
                                ? "Tài xế nhận đơn thành công, tin nhắn kèm link bản đồ theo dõi hành trình gửi tới số điện thoại." 
                                : "Delivery dispatch notification containing live tracking link sent."}
                            </p>
                          </div>
                        )}

                        {/* Delivered notification (sent when status is DELIVERED) */}
                        {o.deliveryStatus === "DELIVERED" && (
                          <div className="relative pt-1.5">
                            <span className="absolute -left-[19px] top-3 h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="text-[11px] font-semibold text-foreground">{lang === "vi" ? "Đã giao hàng thành công" : "Delivered"}</p>
                            <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                              {lang === "vi" 
                                ? "Đơn hàng đã được tài xế bàn giao thành công. SMS cám ơn đã gửi." 
                                : "Handover successful. Thank you notification dispatched."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 whitespace-nowrap ${ORDER_STATUS_BADGE_CLASS[o.status] || "bg-amber-50 text-amber-700 border-amber-200"}`}
                    >
                      {ORDER_STATUS_LABELS[lang][o.status] || o.status}
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
        {activeTab === "wallet" && (
          <div className="max-w-3xl mx-auto mb-16">
              <div className="text-center mb-8 space-y-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                  {lang === "vi" ? "Ví & nạp ví" : "Wallet & top-up"}
                </h2>
                <p className="text-sm text-foreground/70 max-w-xl mx-auto">
                  {lang === "vi"
                    ? "Nạp tiền vào Ví Fortify Kitchen để nhận thêm ưu đãi thành viên. Dùng số dư ví để thanh toán đơn lẻ, hoặc cho gói giao định kỳ do đội ngũ chúng tôi thiết lập — vẫn là gà sous vide mềm, giàu đạm bạn đã quen, chỉ rẻ hơn mỗi tuần."
                    : "Top up your Fortify Kitchen wallet to unlock a member discount. Use the balance to pay for one-off meals, or for a recurring meal subscription we set up for you — same tender, high-protein sous vide meals you already love, just cheaper every week."}
                </p>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold px-4 py-2 rounded-full">
                  <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {lang === "vi"
                      ? "Đặt món nhẹ nhàng thôi, ví sẽ thanh toán giúp bạn, khỏi lo gì hết nha!"
                      : "Order away, no stress — your wallet's got your back on payment!"}
                  </span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto mb-8 grid sm:grid-cols-3 gap-3">
                {[
                  { n: "1", vi: ["Nạp ví", "Mua gói nạp — nhận số dư cùng ưu đãi thành viên."], en: ["Top up your wallet", "Buy a pack — get credit plus a member discount."] },
                  { n: "2", vi: ["Đặt món", "Thanh toán bằng ví hoặc khi nhận hàng."], en: ["Order meals", "Pay with wallet or cash on delivery."] },
                  { n: "3", vi: ["Giao định kỳ", "Tuỳ chọn giao hàng tuần, trừ vào ví của bạn."], en: ["Go recurring", "Optional weekly deliveries, paid from your wallet."] },
                ].map((step) => (
                  <div key={step.n} className="border border-border bg-card rounded-xl p-4 text-left shadow-sm">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {step.n}
                    </span>
                    <p className="text-sm font-bold mt-2">{lang === "vi" ? step.vi[0] : step.en[0]}</p>
                    <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">
                      {lang === "vi" ? step.vi[1] : step.en[1]}
                    </p>
                  </div>
                ))}
              </div>

              {user ? (
                <div className="max-w-md mx-auto mb-8 border border-primary/20 bg-primary/5 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faWallet} className="h-3 w-3" />
                        {lang === "vi" ? "Số dư ví" : "Wallet balance"}
                      </span>
                      <p className="text-3xl font-extrabold font-heading text-primary mt-1">{formatVND(walletBalance)}</p>
                    </div>
                    {hasActivePlanDiscount && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {lang === "vi" ? `Ưu đãi ${planDiscountPercent}%` : `Member ${planDiscountPercent}% off`}
                      </span>
                    )}
                  </div>
                  {hasActivePlanDiscount && (
                    <p className="text-[11px] text-primary mt-3 leading-relaxed">
                      {lang === "vi"
                        ? `Đang giảm ${planDiscountPercent}% mọi đơn đến hết ${new Date(planDiscountEndsAt!).toLocaleDateString("vi-VN")} · dùng cho món lẻ hoặc gói định kỳ.`
                        : `${planDiscountPercent}% off every order until ${new Date(planDiscountEndsAt!).toLocaleDateString("en-US")} · spend on meals or a subscription.`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="max-w-sm mx-auto mb-8 text-center py-5 px-5 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-foreground/70">
                    {lang === "vi" ? "Đăng nhập để xem số dư ví và nạp ví." : "Log in to see your wallet balance and top up."}
                  </p>
                  <button
                    onClick={() => setAuthModal("login")}
                    className="mt-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs px-5 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    {t("btn_signin")}
                  </button>
                </div>
              )}

              {user && hasActivePlanDiscount && (
                <div className="max-w-lg mx-auto mb-6 text-center py-3 px-5 border border-amber-200 bg-amber-50 rounded-xl">
                  <p className="text-xs text-amber-700">
                    {lang === "vi"
                      ? `Bạn đang có ưu đãi từ gói hiện tại đến hết ngày ${new Date(planDiscountEndsAt!).toLocaleDateString("vi-VN")}. Vui lòng liên hệ đội ngũ Fortify Kitchen nếu muốn nâng cấp gói trước hạn.`
                      : `You already have an active plan discount until ${new Date(planDiscountEndsAt!).toLocaleDateString("en-US")}. Please contact our team if you'd like to upgrade early.`}
                  </p>
                </div>
              )}

              {isLoadingPlans ? (
                <div className="flex justify-center py-10">
                  <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : subscriptionPlans.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-foreground/70">
                    {lang === "vi" ? "Chưa có gói nạp nào. Trong lúc chờ, bạn có thể đặt món lẻ từ thực đơn." : "No top-up packs available yet. Meanwhile, you can order individual meals from the menu."}
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {subscriptionPlans.map((plan) => {
                    // "Max Plan" (the 10% tier) is the deliberate middle
                    // upsell — featured so a first-time buyer isn't stuck
                    // comparing 4 equally-weighted cards with no steer.
                    const isFeatured = plan.voucherPercent === 10;
                    const benefits = getPlanBenefits(plan.voucherPercent || 0, lang);
                    return (
                      <div
                        key={plan.id}
                        className={`relative border rounded-2xl p-6 space-y-4 flex flex-col bg-card ${
                          isFeatured ? "border-2 border-primary shadow-md" : "border-border shadow-sm"
                        }`}
                      >
                        {isFeatured && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">
                            {lang === "vi" ? "Phổ biến nhất" : "Most popular"}
                          </span>
                        )}
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-base font-bold font-heading">{plan.name}</h4>
                          {plan.voucherPercent > 0 && (
                            <span className="text-[10px] font-black tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                              {lang === "vi" ? `-${plan.voucherPercent}% mọi đơn` : `-${plan.voucherPercent}% every order`}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-extrabold font-heading text-primary">{formatVND(plan.price)}</p>
                        <ul className="space-y-2.5 flex-1">
                          {benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed">
                              <FontAwesomeIcon icon={b.icon} className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                              <span>{b.text}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleBuyPlan(plan)}
                          disabled={purchasingPlanId === plan.id || hasActivePlanDiscount}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {purchasingPlanId === plan.id ? (
                            <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5" />
                              {lang === "vi" ? "Nạp ví ngay" : "Top up now"}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
        )}

        {activeTab === "subscriptions" && (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">
                {lang === "vi" ? "Gói giao định kỳ của bạn" : "Your meal subscriptions"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === "vi"
                  ? "Giao hàng định kỳ do đội ngũ chúng tôi thiết lập, trừ vào số dư ví của bạn. Nhập số điện thoại đã đăng ký để xem hạn mức protein còn lại và lịch giao sắp tới."
                  : "Recurring deliveries we set up for you, paid from your wallet. Enter your registered phone number to see your remaining protein balance and upcoming deliveries."}
              </p>
            </div>

            <form onSubmit={handleLookupSubscription} className="max-w-md mx-auto flex gap-2 mb-10">
              <input
                type="tel"
                required
                placeholder={lang === "vi" ? "Số điện thoại của bạn" : "Your phone number"}
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
                {lang === "vi" ? "Tra cứu" : "Lookup"}
              </button>
            </form>

            {lookupError && (
              <p className="text-center text-xs text-red-500 mb-8">{lookupError}</p>
            )}

            {hasLookedUp && !isLookupLoading && !lookupError && myPoolSubscriptions.length === 0 && (
              <div className="max-w-md mx-auto text-center py-10 border border-dashed border-border rounded-xl">
                <FontAwesomeIcon icon={faInfoCircle} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  {lang === "vi" ? "Không tìm thấy gói đăng ký nào với số điện thoại này." : "No subscriptions found associated with this phone number."}
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
                          ? `Giao ${formatGrams(sub.deliveryAmountGrams)} mỗi ${sub.deliveryIntervalDays} ngày`
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
                                ? `còn ${formatGrams(p.remainingGrams)} / ${formatGrams(p.totalGrams)}`
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

                  {/* Pay in full from wallet — no split payment (design
                      decision): either the wallet fully covers totalPrice,
                      or the customer arranges a fresh bank transfer
                      instead. Requires login since pay-from-wallet is a JWT
                      + ownership-checked action. */}
                  {(sub.paymentStatus === "UNPAID" || sub.paymentStatus === "DEPOSIT") && (
                    <div className="pt-4 border-t border-border/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {lang === "vi" ? "Trạng thái thanh toán: " : "Payment status: "}
                          <span className="font-bold text-amber-600">{sub.paymentStatus}</span>
                        </span>
                        <span className="font-bold text-foreground">{formatVND(sub.totalPrice)}</span>
                      </div>
                      {user ? (
                        <button
                          onClick={() => handlePayFromWallet(sub.id)}
                          disabled={payingSubscriptionId === sub.id}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] font-bold py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {payingSubscriptionId === sub.id ? (
                            <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5" />
                              {lang === "vi" ? "Thanh toán trọn gói bằng Ví" : "Pay in full from wallet"}
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => setAuthModal("login")}
                          className="w-full border border-border text-[11px] font-bold py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        >
                          {lang === "vi" ? "Đăng nhập để thanh toán bằng Ví" : "Log in to pay from wallet"}
                        </button>
                      )}
                    </div>
                  )}

                  {sub.upcomingOrders?.length > 0 && (
                    <div className="pt-4 border-t border-border/50 space-y-2">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-3.5 w-3.5 text-primary" /> {lang === "vi" ? "Lịch giao sắp tới" : "Upcoming Deliveries"}
                      </h4>
                      {sub.upcomingOrders.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(d.deliveryDate).toLocaleDateString("vi-VN")} —{" "}
                            {d.items.map((i: any) => `${i.flavor} ×${i.qty}`).join(", ")}
                          </span>
                          <button
                            onClick={() => handlePostponeMyDelivery(d.id)}
                            className="text-[10px] font-bold px-2 py-1 rounded border border-border hover:bg-muted cursor-pointer shrink-0"
                          >
                            {lang === "vi" ? "Hoãn" : "Postpone"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Plan Request — the consultation-first path: since
                subscriptions are always staff-created (see the header note
                above), a customer with specific requests/preferences submits
                this instead. Staff review it in the admin dashboard and
                either build a matching Subscription or decline. */}
            <div className="max-w-2xl mx-auto mt-16 pt-12 border-t border-border/60">
              <div className="text-center mb-8 space-y-3">
                <h2 className="text-2xl font-extrabold tracking-tight font-heading">
                  {lang === "vi" ? "Cần gói theo macro của bạn?" : "Want a plan built around your macros?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {lang === "vi"
                    ? "Cho chúng tôi biết sở thích và nhu cầu của bạn — đội ngũ Fortify Kitchen sẽ tư vấn và thiết kế gói phù hợp trước khi triển khai."
                    : "Tell us your preferences — the Fortify Kitchen team will consult with you and build a matching plan before it goes live."}
                </p>
              </div>

              {cprSubmitted ? (
                <div className="text-center py-10 border border-dashed border-emerald-200 bg-emerald-50 rounded-xl">
                  <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm font-bold text-emerald-700">
                    {lang === "vi" ? "Đã gửi yêu cầu!" : "Request submitted!"}
                  </p>
                  <p className="text-xs text-emerald-700/80 mt-1">
                    {lang === "vi"
                      ? "Chúng tôi sẽ liên hệ với bạn sớm để tư vấn gói phù hợp."
                      : "We'll reach out soon to consult on a plan that fits."}
                  </p>
                  <button
                    onClick={() => setCprSubmitted(false)}
                    className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {lang === "vi" ? "Gửi yêu cầu khác" : "Submit another request"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitCustomPlanRequest} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder={lang === "vi" ? "Họ và tên" : "Full name"}
                      value={cprName}
                      onChange={(e) => setCprName(e.target.value)}
                      className="bg-input border border-border focus:border-primary text-sm py-2.5 px-3.5 rounded-lg outline-none text-foreground"
                    />
                    <input
                      type="tel"
                      required
                      placeholder={lang === "vi" ? "Số điện thoại" : "Phone number"}
                      value={cprPhone}
                      onChange={(e) => setCprPhone(e.target.value)}
                      className="bg-input border border-border focus:border-primary text-sm py-2.5 px-3.5 rounded-lg outline-none text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {lang === "vi" ? "Protein mong muốn" : "Desired proteins"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["CHICKEN", "BEEF", "SHRIMP"] as Protein[]).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => toggleCprProtein(p)}
                          className={`text-xs font-bold px-3.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                            cprProteins.includes(p)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-input border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          {PROTEIN_LABELS[p] || p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {lang === "vi" ? "Tổng khối lượng (kg)" : "Total weight (kg)"}
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        placeholder={lang === "vi" ? "Tuỳ chọn" : "Optional"}
                        value={cprEstimatedGrams}
                        onChange={(e) => setCprEstimatedGrams(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-sm py-2.5 px-3.5 rounded-lg outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {lang === "vi" ? "Chu kỳ giao (ngày)" : "Delivery cadence (days)"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder={lang === "vi" ? "Tuỳ chọn" : "Optional"}
                        value={cprIntervalDays}
                        onChange={(e) => setCprIntervalDays(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-sm py-2.5 px-3.5 rounded-lg outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {lang === "vi" ? "Ngân sách (VNĐ)" : "Budget (VND)"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={lang === "vi" ? "Tuỳ chọn" : "Optional"}
                        value={cprBudget}
                        onChange={(e) => setCprBudget(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-sm py-2.5 px-3.5 rounded-lg outline-none text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {lang === "vi" ? "Ghi chú / sở thích riêng" : "Notes / specific preferences"}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={lang === "vi" ? "Ví dụ: muốn tăng cơ, ít tinh bột, giao 3 lần/tuần buổi sáng..." : "e.g. muscle gain, low carb, deliver 3x/week in the morning..."}
                      value={cprNotes}
                      onChange={(e) => setCprNotes(e.target.value)}
                      className="w-full bg-input border border-border focus:border-primary text-sm py-2.5 px-3.5 rounded-lg outline-none text-foreground resize-none"
                    />
                  </div>

                  {cprError && <p className="text-xs text-red-500">{cprError}</p>}

                  <button
                    type="submit"
                    disabled={isCprSubmitting}
                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isCprSubmitting && <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />}
                    {lang === "vi" ? "Gửi yêu cầu tư vấn" : "Submit request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER DASHBOARD */}
        {activeTab === "dashboard" && user && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                {lang === "vi" ? `Chào mừng trở lại, ${user.firstName}` : `Welcome back, ${user.firstName}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("dash_subtitle")}
              </p>
            </div>

            {/* Sub-navigation — Overview / Orders / Subscriptions each get
                their own screen instead of everything stacked into one
                long, cramped page. */}
            <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
              {(
                [
                  { key: "overview", label: lang === "vi" ? "Tổng quan" : "Overview", icon: faUser },
                  {
                    key: "orders",
                    label: `${t("dash_orders_title")}${myOrders.length ? ` (${myOrders.length})` : ""}`,
                    icon: faShoppingBag,
                  },
                  {
                    key: "subscriptions",
                    label: `${t("nav_sub")}${mySubscriptions.length ? ` (${mySubscriptions.length})` : ""}`,
                    icon: faMagic,
                  },
                ] as const
              ).map((tabItem) => (
                <button
                  key={tabItem.key}
                  onClick={() => setDashboardSection(tabItem.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                    dashboardSection === tabItem.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FontAwesomeIcon icon={tabItem.icon} className="h-3.5 w-3.5" />
                  {tabItem.label}
                </button>
              ))}
            </div>

            {isLoadingDashboard ? (
              <div className="py-10 text-center">
                <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <span className="text-xs text-muted-foreground">
                  {lang === "vi" ? "Đang tải..." : "Loading..."}
                </span>
              </div>
            ) : (
              <>
                {/* OVERVIEW — quick-glance summary + shortcuts into the
                    other two sub-tabs, so the customer isn't dropped into a
                    wall of every order/subscription at once. */}
                {dashboardSection === "overview" && (
                  <div className="space-y-8">
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="border border-border bg-card rounded-2xl p-5 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faWallet} className="h-3 w-3" />
                          {lang === "vi" ? "Số dư Ví" : "Wallet Balance"}
                        </span>
                        <p className="text-xl font-bold text-primary mt-1.5">{formatVND(walletBalance)}</p>
                        <button
                          onClick={() => setActiveTab("subscriptions")}
                          className="mt-2 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {lang === "vi" ? "Nạp thêm →" : "Top up →"}
                        </button>
                      </div>

                      <div className="border border-border bg-card rounded-2xl p-5 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faShoppingBag} className="h-3 w-3" />
                          {t("dash_orders_title")}
                        </span>
                        <p className="text-xl font-bold mt-1.5">{myOrders.length}</p>
                        <button
                          onClick={() => setDashboardSection("orders")}
                          className="mt-2 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {lang === "vi" ? "Xem tất cả →" : "View all →"}
                        </button>
                      </div>

                      <div className="border border-border bg-card rounded-2xl p-5 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faMagic} className="h-3 w-3" />
                          {t("nav_sub")}
                        </span>
                        <p className="text-xl font-bold mt-1.5">{mySubscriptions.length}</p>
                        <button
                          onClick={() => setDashboardSection("subscriptions")}
                          className="mt-2 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {lang === "vi" ? "Xem tất cả →" : "View all →"}
                        </button>
                      </div>
                    </div>

                    {myOrders.length === 0 && mySubscriptions.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl">
                        <p className="text-xs text-muted-foreground">{t("dash_orders_empty")}</p>
                        <button
                          onClick={() => setActiveTab("menu")}
                          className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          {lang === "vi" ? "Khám phá Thực đơn và đặt món ngay" : "Browse Menu and order now"}
                        </button>
                      </div>
                    ) : (
                      myOrders.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                            {lang === "vi" ? "Đơn hàng gần nhất" : "Most recent order"}
                            <button
                              onClick={() => setDashboardSection("orders")}
                              className="text-[11px] font-bold text-primary hover:underline cursor-pointer normal-case tracking-normal"
                            >
                              {lang === "vi" ? "Xem tất cả →" : "View all →"}
                            </button>
                          </h3>
                          <div className="border border-border bg-card rounded-2xl p-5 flex items-center justify-between gap-3 shadow-sm">
                            <div className="min-w-0">
                              <div className="text-xs font-mono font-semibold text-foreground/80 truncate">{myOrders[0].id}</div>
                              <div className="text-[11px] text-muted-foreground mt-1 truncate">
                                {(myOrders[0].items || []).map((i: any) => i.flavor).join(", ")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs bg-muted/60 text-muted-foreground font-bold px-3 py-1 rounded-full border border-border">
                                {formatVND(myOrders[0].total)}
                              </span>
                              <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full border border-primary/20">
                                {myOrders[0].status}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* ORDERS — full order history, full width now that it's
                    not squeezed into a 2/3 column next to subscriptions. */}
                {dashboardSection === "orders" && (
                  <div>
                    {myOrders.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl">
                        <p className="text-xs text-muted-foreground">{t("dash_orders_empty")}</p>
                        <button
                          onClick={() => setActiveTab("menu")}
                          className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          {lang === "vi" ? "Khám phá Thực đơn và đặt món ngay" : "Browse Menu and order now"}
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-3xl space-y-6">
                        {myOrders.map((order) => (
                          <div key={order.id} className="border border-border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border/50">
                              <div>
                                <div className="text-xs text-muted-foreground font-semibold">{t("order_id")}</div>
                                <div className="text-xs font-mono font-semibold text-foreground/80">{order.id}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs bg-muted/60 text-muted-foreground font-bold px-3 py-1 rounded-full border border-border">
                                  {formatVND(order.total)}
                                </span>
                                <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full border border-primary/20">
                                  {order.status}
                                </span>
                              </div>
                            </div>

                            {/* List order items */}
                            <div className="space-y-3.5">
                              {(order.items || []).map((i: any) => (
                                <div key={i.id} className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-foreground/90">
                                    {i.flavor || "Gourmet Dish"} <span className="text-muted-foreground font-normal">x {i.qty}</span>
                                  </span>
                                  <span className="text-muted-foreground font-medium">{formatVND(i.unitPrice * i.qty)}</span>
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
                                  { key: "PENDING", label: lang === "vi" ? "Đã nhận" : "Received", icon: faClock },
                                  { key: "CONFIRMED", label: lang === "vi" ? "Đã xác nhận" : "Confirmed", icon: faCheckCircle },
                                  { key: "PREPARING", label: lang === "vi" ? "Đang nấu" : "Preparing", icon: faUtensils },
                                  { key: "DELIVERED", label: lang === "vi" ? "Đã giao" : "Delivered", icon: faTruck },
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
                                {lang === "vi" ? `Giao tới: ${order.deliveryAddress}` : `Shipped to: ${order.deliveryAddress}`}
                              </span>
                              <span className="font-semibold text-foreground/80">
                                {lang === "vi"
                                  ? `Thanh toán: ${order.payment?.method === "BANK_TRANSFER" ? "VietQR CK" : "Ship COD"} (${order.payment?.status === "PAID" ? "Đã trả" : "Chưa trả"})`
                                  : `Payment: ${order.payment?.method === "BANK_TRANSFER" ? "VietQR CK" : "Ship COD"} (${order.payment?.status === "PAID" ? "Paid" : "Unpaid"})`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBSCRIPTIONS — full width now too. */}
                {dashboardSection === "subscriptions" && (
                  <div>
                    {mySubscriptions.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-border rounded-xl bg-muted/10">
                        <p className="text-xs text-muted-foreground">{t("dash_subs_empty")}</p>
                        <button
                          onClick={() => setActiveTab("subscriptions")}
                          className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          {lang === "vi" ? "Đăng ký các gói hàng ngày/tuần" : "Subscribe to daily/weekly plans"}
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-2xl space-y-4">
                        {mySubscriptions.map((sub) => (
                          <div key={sub.id} className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-black tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                  {lang === "vi" ? `${sub.deliveryIntervalDays} ngày/lần` : `Every ${sub.deliveryIntervalDays}d`}
                                </span>
                                <h4 className="text-sm font-bold font-heading mt-1.5">{sub.packageName}</h4>
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
                                {lang === "vi" ? "Tổng giá trị gói: " : "Package price: "} <span className="font-semibold text-foreground">{formatVND(sub.totalPrice)}</span>
                              </div>
                              <div>
                                {lang === "vi" ? "Bắt đầu: " : "Started: "}{" "}
                                <span className="font-semibold text-foreground">
                                  {new Date(sub.startDate).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                            </div>

                            {(sub.pools || []).length > 0 && (
                              <div className="space-y-1.5">
                                {sub.pools.map((pool: any) => (
                                  <div key={pool.id} className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground font-medium">{pool.protein}</span>
                                    <span className="font-semibold text-foreground">
                                      {(pool.remainingGrams / 1000).toFixed(1)}kg / {(pool.totalGrams / 1000).toFixed(1)}kg{" "}
                                      {lang === "vi" ? "còn lại" : "left"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Pay in full from wallet — no split payment, see
                                docs/plan-and-credit-design.md. This view is
                                already logged-in (/subscriptions/me), so no
                                extra auth gate is needed here. */}
                            {(sub.paymentStatus === "UNPAID" || sub.paymentStatus === "DEPOSIT") && (
                              <div className="pt-3 border-t border-border/50 space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>{lang === "vi" ? "Cần thanh toán:" : "Payment due:"}</span>
                                  <span className="font-bold text-foreground">{formatVND(sub.totalPrice)}</span>
                                </div>
                                <button
                                  onClick={() => handlePayFromWallet(sub.id)}
                                  disabled={payingSubscriptionId === sub.id}
                                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-extrabold py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                  {payingSubscriptionId === sub.id ? (
                                    <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faWallet} className="h-3 w-3" />
                                      {lang === "vi" ? "Thanh toán bằng Ví" : "Pay from Wallet"}
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            <div className="pt-3 border-t border-border/50 flex gap-2">
                              <button
                                onClick={() => handlePauseSubscription(sub.id, sub.status)}
                                className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground text-[10px] font-extrabold py-2 px-3 rounded-lg border border-border transition-colors cursor-pointer"
                              >
                                {sub.status === "ACTIVE" ? (lang === "vi" ? "Tạm dừng" : "Pause") : (lang === "vi" ? "Kích hoạt lại" : "Resume")}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* 4. CART SLIDE-OVER PANEL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-background border-l border-border shadow-2xl flex flex-col z-10">
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

            {/* Scrollable content: items/summary + checkout form + action */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-4">
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
              ) : checkoutStep === "cart" ? (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="flex items-center gap-4 p-3 border border-border bg-card rounded-xl relative"
                    >
                      <div className="h-16 w-16 bg-muted/40 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-border">
                        {item.menuItem.imageUrl ? (
                          <img
                            src={item.menuItem.imageUrl}
                            alt={getMenuItemLabel(item.menuItem)}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{getMenuItemLabel(item.menuItem)}</h4>
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
                        onClick={() => removeFromCart(item.menuItem.id, lang)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground font-medium">
                  {lang === "vi" ? `${cartCount} món trong giỏ hàng` : `${cartCount} item(s) in your cart`}
                </div>
              )}
            </div>

            {/* Cart Footer / Checkout Form */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-border bg-muted/15 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("cart_subtotal")}</span>
                    <span>{formatVND(cartTotal)}</span>
                  </div>
                  {bulkDiscountAmount > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-emerald-600">
                      <span>{lang === "vi" ? "Ưu đãi mua nhiều" : "Bulk discount"}</span>
                      <span>-{formatVND(bulkDiscountAmount)}</span>
                    </div>
                  )}
                  {hasActivePlanDiscount && (
                    <div className="flex justify-between text-xs font-semibold text-emerald-600">
                      <span>{lang === "vi" ? `Ưu đãi thành viên (${planDiscountPercent}%)` : `Member discount (${planDiscountPercent}%)`}</span>
                      <span>-{formatVND(planDiscountAmountCart)}</span>
                    </div>
                  )}
                  {discountCodeAmount > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-emerald-600">
                      <span>
                        {t("cart_discount")} ({discountCode.trim().toUpperCase()})
                      </span>
                      <span>-{formatVND(discountCodeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("cart_shipping")}</span>
                    <span>{formatVND(30000)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-base font-bold border-t border-border/50 pt-2.5">
                    <span>{t("cart_total")}</span>
                    <span className="text-primary text-lg">{formatVND(checkoutFinalTotal)}</span>
                  </div>
                </div>

                {cart.some((item) => (item.menuItem.stockQuantity ?? 0) <= 0) && (
                  <div className="flex items-start gap-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2.5 leading-relaxed">
                    <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      {lang === "vi"
                        ? "Đơn có món cần chuẩn bị (đặt trước). Chúng tôi cần khoảng 24 giờ để chuẩn bị và sẽ giao vào ngày hôm sau."
                        : "Your order includes a made-to-order item. We need about 24 hours to prepare it, so this order will be delivered the next day."}
                    </span>
                  </div>
                )}

                {checkoutStep === "cart" && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("details")}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
                  >
                    {lang === "vi" ? "Tiến hành thanh toán →" : "Checkout →"}
                  </button>
                )}

                {checkoutStep === "details" && (
                  <>
                <button
                  type="button"
                  onClick={() => setCheckoutStep("cart")}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  ← {lang === "vi" ? "Quay lại giỏ hàng" : "Back to cart"}
                </button>
                {/* Checkout Form */}
                <form
                  onSubmit={handleCheckout}
                  // This form has several plain <input>s (street address,
                  // notes, discount code) — without this, pressing Enter in
                  // ANY of them submits the whole form and places the order
                  // immediately, skipping payment-method confirmation
                  // entirely. Block Enter-triggered submission from inputs;
                  // the actual "Thanh toán" button still submits normally.
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.target as any).tagName === "INPUT") {
                      e.preventDefault();
                    }
                  }}
                  className="space-y-3 pt-1"
                >
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {lang === "vi" ? "Thông tin giao hàng" : "Delivery details"}
                  </p>
                  {!user && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder={lang === "vi" ? "Tên của bạn" : "Your name"}
                        value={checkoutGuestName}
                        onChange={(e) => setCheckoutGuestName(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-2.5 rounded-lg outline-none text-foreground"
                      />
                      <input
                        type="tel"
                        required
                        placeholder={lang === "vi" ? "Số điện thoại" : "Phone number"}
                        value={checkoutGuestPhone}
                        onChange={(e) => setCheckoutGuestPhone(e.target.value)}
                        className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-2.5 rounded-lg outline-none text-foreground"
                      />
                    </div>
                  )}
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
                          {lang === "vi" ? "Thay đổi" : "Change"}
                        </button>
                      </div>
                      <p className="text-xs text-foreground font-semibold leading-relaxed pt-1">{checkoutAddress}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3" /> {t("cart_address")} · {lang === "vi" ? "TP. Hồ Chí Minh" : "Ho Chi Minh City"}
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
                          {getProvinces()
                            .filter((p: any) => p.code === "79")
                            .map((p: any) => (
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
                      placeholder={lang === "vi" ? "Ví dụ: Gửi bảo vệ..." : "e.g. Please leave at the front desk"}
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
                    {discountCodeStatus === "valid" && (
                      <p className="text-[9px] text-emerald-600 font-medium mt-1">
                        {lang === "vi" ? `✓ Đã áp dụng: giảm ${formatVND(discountCodeAmount)}` : `✓ Applied: ${formatVND(discountCodeAmount)} off`}
                      </p>
                    )}
                    {discountCodeStatus === "invalid" && (
                      <p className="text-[9px] text-red-500 font-medium mt-1">
                        {discountCodeError || (lang === "vi" ? "Mã giảm giá không hợp lệ hoặc đã hết hạn" : "This code is invalid or has expired")}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border/50" />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {t("cart_payment")}
                    </label>
                    <div className={`grid ${user ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
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
                      {/* WALLET — an account-only option (Customer.walletBalance),
                          only shown once logged in. Greyed out/warns if the
                          balance can't fully cover the cart total, since the
                          API rejects a WALLET order outright when short. */}
                      {user && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("WALLET")}
                          disabled={walletBalance < checkoutFinalTotal}
                          className={`py-2 px-3 border text-xs font-semibold rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            paymentMethod === "WALLET"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5 shrink-0" />
                            {lang === "vi" ? "Ví" : "Wallet"}
                          </span>
                          <span className="text-[9px] font-normal text-muted-foreground">{formatVND(walletBalance)}</span>
                        </button>
                      )}
                    </div>
                    {user && walletBalance < checkoutFinalTotal && (
                      <p className="text-[9px] text-amber-600 font-medium mt-1">
                        {lang === "vi"
                          ? "Số dư Ví không đủ để thanh toán trọn đơn này."
                          : "Wallet balance isn't enough to cover this order in full."}
                      </p>
                    )}
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

                  {checkoutError && <p className="text-[10px] text-red-500 leading-normal font-medium">{checkoutError}</p>}

                  <div className="flex justify-between items-baseline text-sm font-bold pt-1">
                    <span>{t("cart_total")}</span>
                    <span className="text-primary text-base">{formatVND(checkoutFinalTotal)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isSubmittingOrder ||
                      !checkoutAgreeTerms ||
                      !checkoutAddress ||
                      (paymentMethod === "WALLET" && walletBalance < checkoutFinalTotal)
                    }
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingOrder ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                        {paymentMethod === "CASH_ON_DELIVERY"
                          ? (lang === "vi" ? "Đặt hàng (COD)" : "Order Now (COD)")
                          : paymentMethod === "WALLET"
                          ? (lang === "vi" ? "Thanh toán bằng Ví" : "Pay with Wallet")
                          : (lang === "vi" ? "Tiếp tục thanh toán" : "Proceed to Payment")}
                      </>
                    )}
                  </button>
                </form>
                  </>
                )}
              </div>
            )}
            </div>
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
                    placeholder="••••••••"
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
                    {lang === "vi" ? "Ghi nhớ mật khẩu" : "Remember password"}
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
                    {lang === "vi" ? "Chưa có tài khoản? " : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => setAuthModal("signup")}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      {lang === "vi" ? "Đăng ký ngay" : "Register here"}
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
                    placeholder={lang === "vi" ? "Tối thiểu 6 ký tự" : "Minimum 6 characters"}
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
                    placeholder={lang === "vi" ? "Ví dụ: 0901234567" : "e.g. 0901234567"}
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
                    placeholder={lang === "vi" ? "Ví dụ: 123 Đồng Khởi" : "e.g. 123 Dong Khoi St"}
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
                    {lang === "vi" ? "Đã có tài khoản? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => setAuthModal("login")}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      {lang === "vi" ? "Đăng nhập tại đây" : "Sign in instead"}
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
            <div className="flex items-center gap-2 text-sm font-bold text-foreground font-heading">
              <img 
                src="/logo.png" 
                alt="Fortify Kitchen Logo" 
                className="h-7 w-7 object-contain rounded-full"
              />
              <span>{lang === "vi" ? "FortifyKitchen Việt Nam" : "FortifyKitchen Vietnam"}</span>
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "Gói dinh dưỡng cao cấp, thực đơn Protein chuẩn gourmet được chế biến từ nguyên liệu tươi sạch bởi đầu bếp chuyên nghiệp để phục vụ mục tiêu sức khỏe của bạn."
                : "Premium gourmet protein meal prep subscriptions prepared by professional chefs to help you achieve your fitness goals."}
            </p>
            <div className="space-y-2.5">
              <p className="flex items-start gap-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary/80 h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>{lang === "vi" ? "Khu vực phục vụ:" : "Service Area:"}</strong> {lang === "vi" ? "Thành phố Hồ Chí Minh, Việt Nam" : "Ho Chi Minh City, Vietnam"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <FontAwesomeIcon icon={faPhone} className="text-primary/80 h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Hotline & Zalo:</strong> [Số điện thoại liên hệ]
                </span>
              </p>
            </div>
          </div>

          {/* Column 2: Legal / Policies */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-foreground font-heading">
              {lang === "vi" ? "Chính sách & Quy định" : "Policies & Regulations"}
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "Các điều khoản sử dụng và chính sách hoạt động của cửa hàng chúng tôi:"
                : "Our store's usage terms and operational policies:"}
            </p>
            <div className="flex flex-col gap-2.5 font-medium">
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:text-primary/80 cursor-pointer transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="h-3 w-3 text-primary/60 shrink-0" />
                <span>{lang === "vi" ? "Điều khoản sử dụng dịch vụ" : "Terms of Service"}</span>
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:text-primary/80 cursor-pointer transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3 text-primary/60 shrink-0" />
                <span>{lang === "vi" ? "Chính sách bảo mật thông tin" : "Privacy Policy"}</span>
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:text-primary/80 cursor-pointer transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCreditCard} className="h-3 w-3 text-primary/60 shrink-0" />
                <span>{lang === "vi" ? "Chính sách thanh toán & Hoàn tiền" : "Payment & Refund Policy"}</span>
              </button>
            </div>
          </div>

          {/* Column 3: Secure Payments & Social Channels */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-foreground font-heading">
              {lang === "vi" ? "Thanh toán & Liên hệ" : "Payments & Contact"}
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "Chúng tôi hỗ trợ giao hàng thu tiền tận ước (COD) và Chuyển khoản VietQR tiện lợi. Kết nối ngay để được tư vấn thực đơn phù hợp."
                : "We support convenient Cash on Delivery (COD) and VietQR bank transfers. Connect now for menu consultations."}
            </p>
            
            {/* Social Connect circular buttons */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://zalo.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors shadow-xs"
                title="Zalo Chat"
              >
                <FontAwesomeIcon icon={faComment} className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors shadow-xs"
                title="Facebook"
              >
                <FontAwesomeIcon icon={faFacebook} className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors shadow-xs"
                title="Instagram"
              >
                <FontAwesomeIcon icon={faInstagram} className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-border/40 text-center text-[10px] text-muted-foreground">
          <p>© 2026 FortifyKitchen Việt Nam. {lang === "vi" ? "Tất cả các quyền được bảo lưu." : "All rights reserved."}</p>
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
                {lang === "vi" ? "1. Quy định chung" : "1. General Regulations"}
              </h4>
              <p>
                {lang === "vi"
                  ? "Chào mừng bạn đến với Fortify Kitchen. Khi sử dụng dịch vụ của chúng tôi (bao gồm đặt hàng trực tiếp, đăng ký gói hội viên định kỳ hoặc quản trị vận hành), bạn đồng ý cam kết tuân thủ các điều khoản này."
                  : "Welcome to Fortify Kitchen. By using our services (including guest checkout, subscribing to recurring plans, or admin operations), you agree to comply with these terms."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "2. Thu thập & Sử dụng Thông tin cá nhân" : "2. Personal Data Collection & Usage"}
              </h4>
              <p>
                {lang === "vi"
                  ? "Chúng tôi thu thập các thông tin như Họ tên, Số điện thoại, Địa chỉ giao hàng và Ghi chú nhằm mục đích xử lý đơn hàng, điều phối vận chuyển và xác minh thanh toán. Đối với thành viên đăng ký tài khoản, chúng tôi lưu trữ Email và thông tin đăng nhập để cá nhân hóa trải nghiệm và cung cấp các chính sách ưu đãi (coupon)."
                  : "We collect details like Full Name, Phone Number, Delivery Address, and Notes to process orders, coordinate shipping, and verify payments. For registered members, we store Email and login credentials to personalize experiences and offer promotional coupons."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "3. Chính sách Thanh toán" : "3. Payment Policy"}
              </h4>
              <p>
                {lang === "vi"
                  ? "Chúng tôi chấp nhận thanh toán COD (tiền mặt khi nhận hàng) và Chuyển khoản ngân hàng trực tuyến (qua VietQR). Khách hàng có trách nhiệm thực hiện đúng nội dung chuyển khoản được cung cấp tại màn hình xác nhận đơn hàng để đảm bảo giao dịch được đối soát tự động thành công."
                  : "We accept COD (Cash on Delivery) and online Bank Transfer via VietQR. Customers are responsible for entering the exact transfer reference code provided during checkout to facilitate automated confirmation."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "4. Cam kết Bảo mật" : "4. Data Security & Integrity"}
              </h4>
              <p>
                {lang === "vi"
                  ? "Fortify Kitchen cam kết bảo mật tuyệt đối dữ liệu cá nhân của khách hàng và nhân viên vận hành. Chúng tôi không mua bán, chia sẻ thông tin cho bất kỳ bên thứ ba nào, ngoại trừ mục đích điều phối giao hàng với các đơn vị vận chuyển đối tác."
                  : "Fortify Kitchen is committed to securing customer and operational personal data. We do not sell or share information with third parties, except for logistical coordination with delivery partners."}
              </p>
              <h4 className="font-bold text-foreground text-sm">
                {lang === "vi" ? "5. Thay đổi Điều khoản" : "5. Amendments to Terms"}
              </h4>
              <p>
                {lang === "vi"
                  ? "Chúng tôi có quyền sửa đổi các điều khoản này bất kỳ lúc nào để phù hợp với quy định của pháp luật và nhu cầu vận hành thực tế. Bản cập nhật mới nhất sẽ luôn được hiển thị công khai trên website."
                  : "We reserve the right to amend these terms at any time to align with legal guidelines and operational requirements. The latest version will always be publicly posted on the website."}
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10 mt-4 shrink-0"
            >
              {lang === "vi" ? "Đóng" : "Close"}
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
            setActiveTab(user ? "dashboard" : "menu");
          }} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4 text-center">
            <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 mx-auto text-emerald-500" />
            <h3 className="text-base font-bold font-heading">
              {lang === "vi" ? "Đặt hàng thành công!" : "Order Placed Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {checkoutResult.paymentMethod === "CASH_ON_DELIVERY"
                ? lang === "vi"
                  ? `Đơn của bạn đang được chuẩn bị. Chúng tôi sẽ liên hệ xác nhận và giao vào ${new Date(checkoutResult.deliveryDate).toLocaleDateString("vi-VN")}. Thanh toán khi nhận hàng.`
                  : `Your order is being prepared. We'll contact you to confirm and deliver on ${new Date(checkoutResult.deliveryDate).toLocaleDateString("en-US")}. Pay on delivery.`
                : lang === "vi"
                  ? "Đơn hàng của bạn đã được ghi nhận. Vui lòng hoàn tất thanh toán chuyển khoản qua VietQR bên dưới."
                  : "Your order has been recorded. Please complete the bank transfer via VietQR below."}
            </p>

            {checkoutResult.paymentMethod === "BANK_TRANSFER" && (
            <div className="border border-border bg-muted/25 rounded-xl p-4 space-y-3 text-left">
              <p className="text-xs font-bold text-foreground text-center">
                {lang === "vi" ? "Quét mã VietQR để thanh toán" : "Scan VietQR to Complete Payment"}
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
                  <span>{lang === "vi" ? "Ngân hàng:" : "Bank:"}</span>
                  <span className="font-bold text-foreground">MB Bank</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Số tài khoản:" : "Account Number:"}</span>
                  <span className="font-bold text-foreground font-mono">19035678901234</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Chủ tài khoản:" : "Account Holder:"}</span>
                  <span className="font-bold text-foreground uppercase">FORTIFY KITCHEN</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Số tiền:" : "Amount:"}</span>
                  <span className="font-bold text-primary font-mono">{formatVND(checkoutResult.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Nội dung chuyển khoản:" : "Transfer Reference:"}</span>
                  <span className="font-bold text-primary font-mono">FK{checkoutResult.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>
            )}

            <button
              onClick={() => {
                setCheckoutResult(null);
                setCartOpen(false);
                setActiveTab(user ? "dashboard" : "menu");
              }}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              {checkoutResult.paymentMethod === "CASH_ON_DELIVERY"
                ? lang === "vi" ? "Xong" : "Done"
                : lang === "vi" ? "Tôi đã chuyển khoản / Đóng" : "I have transferred / Close"}
            </button>
          </div>
        </div>
      )}

      {/* PLAN PURCHASE PENDING — bank-transfer instructions for a
          SubscriptionPlan top-up. No instant credit: the wallet is only
          credited once staff confirm the transfer arrived (status stays
          PENDING until then). Reuses the same bank account shown at
          checkout. */}
      {planPurchaseResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setPlanPurchaseResult(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4 text-center">
            <FontAwesomeIcon icon={faClock} className="h-10 w-10 mx-auto text-amber-500" />
            <h3 className="text-base font-bold font-heading">
              {lang === "vi" ? "Đang chờ chuyển khoản" : "Awaiting Bank Transfer"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "vi"
                ? `Bạn đã đăng ký mua gói "${planPurchaseResult.planName}". Vui lòng chuyển khoản theo thông tin bên dưới — số dư Ví sẽ được cộng ngay khi đội ngũ Fortify Kitchen xác nhận đã nhận được tiền.`
                : `You've requested the "${planPurchaseResult.planName}" plan. Please transfer the amount below — your wallet will be credited once our team confirms the transfer arrived.`}
            </p>

            <div className="border border-border bg-muted/25 rounded-xl p-4 space-y-3 text-left">
              <p className="text-xs font-bold text-foreground text-center">
                {lang === "vi" ? "Quét mã VietQR để chuyển khoản" : "Scan VietQR to Transfer"}
              </p>
              <div className="bg-white p-2 rounded-lg border border-border w-40 h-40 mx-auto flex items-center justify-center">
                <img
                  src={`https://img.vietqr.io/image/MB-19035678901234-compact.png?amount=${planPurchaseResult.amount}&addInfo=FK${planPurchaseResult.id.slice(0, 8)}&accountName=FORTIFY%20KITCHEN`}
                  alt="VietQR Payment Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Ngân hàng:" : "Bank:"}</span>
                  <span className="font-bold text-foreground">MB Bank</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Số tài khoản:" : "Account Number:"}</span>
                  <span className="font-bold text-foreground font-mono">19035678901234</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Chủ tài khoản:" : "Account Holder:"}</span>
                  <span className="font-bold text-foreground uppercase">FORTIFY KITCHEN</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Số tiền:" : "Amount:"}</span>
                  <span className="font-bold text-primary font-mono">{formatVND(planPurchaseResult.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "vi" ? "Nội dung chuyển khoản:" : "Transfer Reference:"}</span>
                  <span className="font-bold text-primary font-mono">FK{planPurchaseResult.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
              <div className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 text-center leading-normal">
                {lang === "vi"
                  ? "Trạng thái: Đang chờ xác nhận (PENDING). Ví sẽ được cộng tiền sau khi đội ngũ xác nhận đã nhận được chuyển khoản."
                  : "Status: PENDING confirmation. Your wallet will be credited once our team confirms the transfer arrived."}
              </div>
            </div>

            <button
              onClick={() => setPlanPurchaseResult(null)}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              {lang === "vi" ? "Đã hiểu / Đóng" : "Got it / Close"}
            </button>
          </div>
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setConfirmState(null)} />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold font-heading">
              {confirmState.title || (lang === "vi" ? "Xác nhận" : "Confirm")}
            </h3>
            <p className="text-xs text-muted-foreground">{confirmState.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted cursor-pointer"
              >
                {lang === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/95 cursor-pointer"
              >
                {confirmState.confirmLabel || (lang === "vi" ? "Xác nhận" : "Confirm")}
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
          onClick={() => setActiveTab("wallet")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === "wallet" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <FontAwesomeIcon icon={faWallet} className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">{t("nav_wallet")}</span>
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
