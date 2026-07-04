"use client";

import * as React from "react";
import { useToast } from "@fortifykitchen/ui";
import { MenuItem, User } from "@fortifykitchen/types";

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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: any) => Promise<boolean>;
  logout: () => void;
  addToCart: (item: MenuItem, qty?: number, notes?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  placeOrder: (address: string, method: string, notes?: string, code?: string) => Promise<any>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          type: "error",
        });
        return false;
      }

      setToken(result.data.accessToken);
      setUser(result.data.user);
      localStorage.setItem("fk_token", result.data.accessToken);
      localStorage.setItem("fk_user", JSON.stringify(result.data.user));

      toast({
        title: "Welcome Back",
        description: `Logged in as ${result.data.user.firstName}`,
        type: "success",
      });
      return true;
    } catch (error) {
      console.error(error);
      toast({
        title: "Login Error",
        description: "Could not connect to authentication server",
        type: "error",
      });
      return false;
    }
  };

  const signup = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        toast({
          title: "Registration Failed",
          description: result.message || "Failed to create account",
          type: "error",
        });
        return false;
      }

      setToken(result.data.accessToken);
      setUser(result.data.user);
      localStorage.setItem("fk_token", result.data.accessToken);
      localStorage.setItem("fk_user", JSON.stringify(result.data.user));

      toast({
        title: "Account Created",
        description: "Welcome to FortifyKitchen!",
        type: "success",
      });
      return true;
    } catch (error) {
      console.error(error);
      toast({
        title: "Signup Error",
        description: "Could not connect to authentication server",
        type: "error",
      });
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fk_token");
    localStorage.removeItem("fk_user");
    toast({
      title: "Logged Out",
      description: "You have successfully signed out.",
      type: "default",
    });
  };

  const addToCart = (menuItem: MenuItem, qty = 1, notes?: string) => {
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
      title: "Added to Cart",
      description: `${menuItem.name} added.`,
      type: "success",
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== itemId));
    toast({
      title: "Removed from Cart",
      description: "Item removed.",
      type: "default",
    });
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
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
  ): Promise<any> => {
    if (!token) {
      toast({
        title: "Checkout Required",
        description: "Please log in to place an order.",
        type: "error",
      });
      return null;
    }

    try {
      const orderItems = cart.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        notes: item.notes,
      }));

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          deliveryAddress,
          notes,
          paymentMethod,
          discountCode,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast({
          title: "Order Failed",
          description: result.message || "Failed to process order",
          type: "error",
        });
        return null;
      }

      toast({
        title: "Order Placed!",
        description: `Your order has been received (COD).`,
        type: "success",
      });

      clearCart();
      return result.data;
    } catch (error) {
      console.error(error);
      toast({
        title: "Checkout Error",
        description: "An error occurred while placing order",
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
