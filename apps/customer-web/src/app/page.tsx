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

// Order status labels for the customer-facing "Track my order" lookup —
// same underlying DeliveryStatus enum the admin Orders tab uses
// (SCHEDULED/PREPPING/DELIVERED/SKIPPED/CANCELLED), just worded for a
// customer audience in Vietnamese.
const DICTIONARY = {
  vi: {
    // Navigation
    nav_menu: "Thực đơn",
    nav_order: "Giao ngay",
    nav_sub: "Gói Hội viên",
    nav_dashboard: "Cá nhân",
    btn_signin: "Đăng nhập",
    btn_logout: "Đăng xuất",

    // Menu
    menu_title: "Thực đơn Dinh dưỡng",
    menu_subtitle: "Thực đơn giàu Protein chuẩn Gourmet được thiết kế bởi đầu bếp chuyên nghiệp để tối ưu mục tiêu dinh dưỡng của bạn.",
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
    auth_desc: "Tham gia Fortify Kitchen để đặt món và theo dõi gói hội viên dễ dàng.",
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
    dash_subtitle: "Quản lý đơn hàng, theo dõi giao hàng và số dư gói hội viên của bạn.",
    dash_orders_title: "Lịch sử đơn hàng",
    dash_orders_empty: "Bạn chưa có đơn hàng nào.",
    dash_subs_title: "Gói hội viên đang hoạt động",
    dash_subs_empty: "Bạn chưa đăng ký gói hội viên nào.",
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
    SCHEDULED: "Đã đặt",
    PREPPING: "Đang chuẩn bị",
    DELIVERED: "Hoàn thành",
    SKIPPED: "Đã bỏ qua",
    CANCELLED: "Đã huỷ",
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
                {lang === "vi" ? "Giao cơm & Gói hội viên dinh dưỡng cao cấp tại Việt Nam" : "Vietnam's Premium Meal Delivery & Subscription"}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight">
                {lang === "vi" ? (
                  <>Tiếp năng lượng với <span className="text-primary">Dinh dưỡng Gourmet</span></>
                ) : (
                  <>Fuel Your Body with <span className="text-primary">Gourmet Nutrition</span></>
                )}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                {lang === "vi"
                  ? "Salad hữu cơ, cơm tô giàu protein và nước ép tươi được chuẩn bị bởi đầu bếp chuyên nghiệp, giao tận nơi tại TP. Hồ Chí Minh. Thanh toán linh hoạt bằng Tiền mặt (COD) hoặc Chuyển khoản."
                  : "Expertly crafted organic salads, high-protein bowls, and fresh cold-pressed juices delivered straight to your door in Ho Chi Minh City. Pay easily via Cash on Delivery (COD) or Transfer."}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-md hover:bg-primary/90 transition-all cursor-pointer text-sm"
                >
                  {lang === "vi" ? "Khám phá Thực đơn" : "Explore Menu"}
                </button>
                <button
                  onClick={() => setActiveTab("subscriptions")}
                  className="border border-border bg-muted/20 hover:bg-muted font-semibold px-8 py-3.5 rounded-md transition-all cursor-pointer text-sm"
                >
                  {lang === "vi" ? "Xem các Gói hội viên" : "Meal Subscription plans"}
                </button>
              </div>
            </div>
            <div className="relative h-80 sm:h-96 w-full rounded-2xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center shadow-xl">
              <div className="absolute inset-0 bg-primary/5" />
              <div className="text-center space-y-2 p-8 z-10">
                <FontAwesomeIcon icon={faUtensils} className="h-16 w-16 text-primary mx-auto opacity-70" />
                <h3 className="text-lg font-bold font-heading">
                  {lang === "vi" ? "Nguyên liệu Sạch & Tươi ngon" : "Clean & Fresh Ingredients Only"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {lang === "vi"
                    ? "Mỗi bữa ăn được đóng gói hút chân không và làm lạnh để giữ trọn vẹn dinh dưỡng."
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
                  {lang === "vi" ? "Đang tải thực đơn dinh dưỡng..." : "Loading nutritious menu..."}
                </span>
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <FontAwesomeIcon icon={faInfoCircle} className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground font-medium">
                  {lang === "vi" ? "Không tìm thấy món ăn nào trong danh mục này." : "No menu items found in this category."}
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

        {/* TAB 1.5: ORDER NOW — in-stock items only, ready today, no account
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
                    <p className="text-xs font-bold text-foreground text-center">{lang === "vi" ? "Quét mã VietQR để thanh toán" : "Scan VietQR Code to Pay"}</p>
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
                        ? "Vui lòng chuyển khoản đúng số tiền và nội dung chuyển khoản để đơn hàng được xác nhận tự động."
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
                        {lang === "vi" ? "Hiện chưa có món nào sẵn sàng giao ngay trong danh mục này." : "No ready dishes currently available in this category."}
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
                                  {lang === "vi" ? "Thêm" : "Add"}
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
                          <span className="truncate pr-2">{l.menuItem.flavor} ×{l.qty}</span>
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

            {/* Track my order — self-serve status check by phone. There's
                no SMS/push notification connected yet, so this is how a
                customer finds out staff accepted or completed their order. */}
            <div className="max-w-md mx-auto mt-16 pt-10 border-t border-border">
              <h3 className="text-center text-sm font-bold font-heading mb-1">
                {lang === "vi" ? "Theo dõi đơn hàng của bạn" : "Track Your Orders"}
              </h3>
              <p className="text-center text-xs text-muted-foreground mb-5">
                {lang === "vi"
                  ? "Nhập số điện thoại đã dùng để đặt hàng để xem trạng thái mới nhất."
                  : "Enter the phone number used during checkout to check the latest status."}
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
                  {lang === "vi" ? "Không tìm thấy đơn hàng nào với số điện thoại này." : "No orders found with this phone number."}
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
                      {ORDER_STATUS_LABELS[lang][o.deliveryStatus] || o.deliveryStatus}
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
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">
                {lang === "vi" ? "Gói đăng ký của bạn" : "Your Subscriptions"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === "vi"
                  ? "Nhập số điện thoại đã đăng ký với Fortify Kitchen để xem số dư Protein còn lại và lịch giao sắp tới."
                  : "Enter your registered phone number to check remaining Protein balance and upcoming delivery schedules."}
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

                  {sub.upcomingDeliveries?.length > 0 && (
                    <div className="pt-4 border-t border-border/50 space-y-2">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-3.5 w-3.5 text-primary" /> {lang === "vi" ? "Lịch giao sắp tới" : "Upcoming Deliveries"}
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
                            {lang === "vi" ? "Hoãn" : "Postpone"}
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
                {lang === "vi" ? `Chào mừng trở lại, ${user.firstName}` : `Welcome back, ${user.firstName}`}
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
                        {lang === "vi" ? "Đang tải đơn hàng..." : "Retrieving orders..."}
                      </span>
                    </div>
                  ) : myOrders.length === 0 ? (
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
                        {lang === "vi" ? "Đăng ký các gói hàng ngày/tuần" : "Subscribe to daily/weekly plans"}
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
                                {lang === "vi" ? "Hộp cơm dinh dưỡng" : "Chef Meal Box"}
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
                              {lang === "vi" ? "Giá mỗi chu kỳ: " : "Cycle Price: "} <span className="font-semibold text-foreground">{formatVND(sub.pricePerCycle)}</span>
                            </div>
                            <div>
                              {lang === "vi" ? "Giao hàng tiếp theo: " : "Next Delivery: "}{" "}
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
                              {sub.status === "ACTIVE" ? (lang === "vi" ? "Tạm dừng" : "Pause") : (lang === "vi" ? "Kích hoạt lại" : "Resume")}
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
                          {lang === "vi" ? "Thay đổi" : "Change"}
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
                        {paymentMethod === "CASH_ON_DELIVERY" ? (lang === "vi" ? "Đặt hàng (COD)" : "Order Now (COD)") : (lang === "vi" ? "Tiếp tục thanh toán" : "Proceed to Payment")}
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
            <div className="text-sm font-bold text-foreground font-heading">
              {lang === "vi" ? "FortifyKitchen Việt Nam" : "FortifyKitchen Vietnam"}
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "Gói dinh dưỡng cao cấp, thực đơn Protein chuẩn gourmet được chế biến từ nguyên liệu tươi sạch bởi đầu bếp chuyên nghiệp để phục vụ mục tiêu sức khỏe của bạn."
                : "Premium gourmet protein meal prep subscriptions prepared by professional chefs to help you achieve your fitness goals."}
            </p>
            <div className="space-y-2">
              <p>
                <strong>{lang === "vi" ? "Khu vực phục vụ:" : "Service Area:"}</strong> {lang === "vi" ? "Thành phố Hồ Chí Minh, Việt Nam" : "Ho Chi Minh City, Vietnam"}
              </p>
              <p>
                <strong>Hotline & Zalo:</strong> [Số điện thoại liên hệ]
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
            <div className="flex flex-col gap-2 font-medium">
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:underline cursor-pointer transition-colors"
              >
                {lang === "vi" ? "➔ Điều khoản sử dụng dịch vụ" : "➔ Terms of Service"}
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:underline cursor-pointer transition-colors"
              >
                {lang === "vi" ? "➔ Chính sách bảo mật thông tin" : "➔ Privacy Policy"}
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-left text-primary hover:underline cursor-pointer transition-colors"
              >
                {lang === "vi" ? "➔ Chính sách thanh toán & Hoàn tiền" : "➔ Payment & Refund Policy"}
              </button>
            </div>
          </div>

          {/* Column 3: Secure Payments & Social Channels */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-foreground font-heading">
              {lang === "vi" ? "Thanh toán & Liên hệ mạng xã hội" : "Payments & Social Channels"}
            </div>
            <p className="leading-relaxed">
              {lang === "vi"
                ? "Chúng tôi hỗ trợ giao hàng thu tiền tận nơi (COD) và Chuyển khoản VietQR tiện lợi. Liên hệ ngay để được tư vấn thực đơn phù hợp nhất."
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
            setActiveTab("dashboard");
          }} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4 text-center">
            <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 mx-auto text-emerald-500" />
            <h3 className="text-base font-bold font-heading">
              {lang === "vi" ? "Đặt hàng thành công!" : "Order Placed Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "vi"
                ? "Đơn hàng của bạn đã được ghi nhận. Vui lòng hoàn tất thanh toán chuyển khoản qua VietQR bên dưới."
                : "Your order has been recorded. Please complete the bank transfer via VietQR below."}
            </p>

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

            <button
              onClick={() => {
                setCheckoutResult(null);
                setCartOpen(false);
                setActiveTab("dashboard");
              }}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              {lang === "vi" ? "Tôi đã chuyển khoản / Đóng" : "I have transferred / Close"}
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
