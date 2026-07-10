"use client";

import * as React from "react";
import { useToast } from "@fortifykitchen/ui";
import { MenuItem, User } from "@fortifykitchen/types";
import { getMenuItemLabel, translateApiError } from "@fortifykitchen/shared";

type Lang = "vi" | "en";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  login: (email: string, password: string, lang?: Lang) => Promise<boolean>;
  signup: (data: any, lang?: Lang) => Promise<boolean>;
  logout: (lang?: Lang) => void;
  addToCart: (item: MenuItem, qty?: number, notes?: string, lang?: Lang) => void;
  removeFromCart: (itemId: string, lang?: Lang) => void;
  updateCartQuantity: (itemId: string, qty: number, lang?: Lang) => void;
  clearCart: () => void;
  placeOrder: (address: string, method: string, notes?: string, discountCode?: string, lang?: Lang) => Promise<any>;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = React.useState(false);
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Hydrate auth and cart on mount
  React.useEffect(() => {
    const savedToken = localStorage.getItem("fk_token");
    const savedUser = localStorage.getItem("fk_user");
    const savedCart = localStorage.getItem("fk_cart");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
        localStorage.removeItem("fk_cart");
      }
    }
  }, []);

  // Save cart to localstorage whenever it changes
  React.useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("fk_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("fk_cart");
    }
  }, [cart]);

  const login = async (email: string, password: string, lang: Lang = "vi"): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);
      if (!res) {
        throw new Error("Connection failed");
      }

      const result = await res.json();
      if (!res.ok) {
        toast({
          title: lang === "vi" ? "Đăng nhập thất bại" : "Login Failed",
          description: translateApiError(
            result.message,
            lang,
            lang === "vi" ? "Email hoặc mật khẩu không đúng." : "Invalid credentials",
          ),
          type: "error",
        });
        return false;
      }

      setToken(result.data.accessToken);
      setUser(result.data.user);
      localStorage.setItem("fk_token", result.data.accessToken);
      localStorage.setItem("fk_user", JSON.stringify(result.data.user));

      toast({
        title: lang === "vi" ? "Chào mừng trở lại" : "Welcome Back",
        description:
          lang === "vi" ? `Đã đăng nhập với tên ${result.data.user.firstName}` : `Logged in as ${result.data.user.firstName}`,
        type: "success",
      });
      return true;
    } catch (error) {
      console.error(error);
      toast({
        title: lang === "vi" ? "Lỗi đăng nhập" : "Login Error",
        description: lang === "vi" ? "Không thể kết nối đến máy chủ — vui lòng thử lại." : "Could not connect to authentication server",
        type: "error",
      });
      return false;
    }
  };

  const signup = async (data: any, lang: Lang = "vi"): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => null);
      if (!res) {
        throw new Error("Connection failed");
      }

      const result = await res.json();
      if (!res.ok) {
        toast({
          title: lang === "vi" ? "Đăng ký thất bại" : "Registration Failed",
          description: translateApiError(
            result.message,
            lang,
            lang === "vi" ? "Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin." : "Failed to create account",
          ),
          type: "error",
        });
        return false;
      }

      setToken(result.data.accessToken);
      setUser(result.data.user);
      localStorage.setItem("fk_token", result.data.accessToken);
      localStorage.setItem("fk_user", JSON.stringify(result.data.user));

      toast({
        title: lang === "vi" ? "Tạo tài khoản thành công" : "Account Created",
        description: lang === "vi" ? "Chào mừng bạn đến với Fortify Kitchen!" : "Welcome to FortifyKitchen!",
        type: "success",
      });
      return true;
    } catch (error) {
      console.error(error);
      toast({
        title: lang === "vi" ? "Lỗi đăng ký" : "Signup Error",
        description: lang === "vi" ? "Không thể kết nối đến máy chủ — vui lòng thử lại." : "Could not connect to authentication server",
        type: "error",
      });
      return false;
    }
  };

  const logout = (lang: Lang = "vi") => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fk_token");
    localStorage.removeItem("fk_user");
    toast({
      title: lang === "vi" ? "Đã đăng xuất" : "Logged Out",
      description: lang === "vi" ? "Bạn đã đăng xuất thành công." : "You have successfully signed out.",
      type: "default",
    });
  };

  const addToCart = (menuItem: MenuItem, qty = 1, notes?: string, lang: Lang = "vi") => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.menuItem.id === menuItem.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        return updated;
      }
      return [...prev, { menuItem, quantity: qty, notes }];
    });

    toast({
      title: lang === "vi" ? "Đã thêm vào giỏ" : "Added to Cart",
      description: lang === "vi" ? `Đã thêm ${getMenuItemLabel(menuItem)}.` : `${getMenuItemLabel(menuItem)} added.`,
      type: "success",
    });
  };

  const removeFromCart = (itemId: string, lang: Lang = "vi") => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== itemId));
    toast({
      title: lang === "vi" ? "Đã xóa khỏi giỏ" : "Removed from Cart",
      description: lang === "vi" ? "Món đã được xóa." : "Item removed.",
      type: "default",
    });
  };

  const updateCartQuantity = (itemId: string, qty: number, lang: Lang = "vi") => {
    if (qty <= 0) {
      removeFromCart(itemId, lang);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.menuItem.id === itemId ? { ...item, quantity: qty } : item)),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (
    deliveryAddress: string,
    paymentMethod: string,
    notes?: string,
    discountCode?: string,
    lang: Lang = "vi",
  ): Promise<any> => {
    if (!token) {
      toast({
        title: lang === "vi" ? "Cần đăng nhập" : "Checkout Required",
        description: lang === "vi" ? "Vui lòng đăng nhập để đặt hàng." : "Please log in to place an order.",
        type: "error",
      });
      return null;
    }

    // discountCode is optional and blank-stripped here (not just left as
    // "") so an empty checkout field doesn't get sent as a literal empty
    // string discount code lookup — CreateOrderDto validates it as an
    // optional string, and the API stacks it additively with the automatic
    // tier discount (see OrdersService.createForCustomer).
    const trimmedDiscountCode = discountCode?.trim() || undefined;

    try {
      // CreateOrderDto requires `qty` (not `quantity`) per line item, and a
      // required `deliveryDate` — this previously sent neither, so every
      // checkout 400'd against the API's strict validation. If the item is
      // in live stock the server treats it as an immediate order and
      // overrides this to "now" anyway; tomorrow is just a safe default for
      // the scheduled-prep case.
      const orderItems = cart.map((item) => ({
        menuItemId: item.menuItem.id,
        qty: item.quantity,
      }));
      const deliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          deliveryDate,
          deliveryAddress,
          notes,
          paymentMethod,
          discountCode: trimmedDiscountCode,
        }),
      }).catch(() => null);
      if (!res) {
        throw new Error("Connection failed");
      }

      const result = await res.json();
      if (!res.ok) {
        toast({
          title: lang === "vi" ? "Đặt hàng thất bại" : "Order Failed",
          description: translateApiError(
            result.message,
            lang,
            lang === "vi" ? "Không thể xử lý đơn hàng. Vui lòng thử lại." : "Failed to process order",
          ),
          type: "error",
        });
        return null;
      }

      toast({
        title: lang === "vi" ? "Đặt hàng thành công!" : "Order Placed!",
        description:
          lang === "vi"
            ? paymentMethod === "BANK_TRANSFER"
              ? "Vui lòng chuyển khoản theo hướng dẫn để hoàn tất."
              : "Đơn hàng của bạn đã được ghi nhận (thanh toán khi nhận hàng)."
            : paymentMethod === "BANK_TRANSFER"
              ? "Please complete the bank transfer to confirm your order."
              : "Your order has been received (Cash on Delivery).",
        type: "success",
      });

      clearCart();
      return result.data;
    } catch (error) {
      console.error(error);
      toast({
        title: lang === "vi" ? "Lỗi thanh toán" : "Checkout Error",
        description: lang === "vi" ? "Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại." : "An error occurred while placing order",
        type: "error",
      });
      return null;
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
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
        clearCart,
        placeOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
