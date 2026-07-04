"use client";

import * as React from "react";
import { useApp } from "../providers/app-context";
import { MenuItem, Category } from "@fortifykitchen/types";
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
} from "lucide-react";

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

  // Tab State: "menu" | "subscriptions" | "dashboard"
  const [activeTab, setActiveTab] = React.useState<"menu" | "subscriptions" | "dashboard">("menu");

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
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
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
        const [resCat, resMenu] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/menu`),
        ]);
        if (resCat.ok && resMenu.ok) {
          const catData = await resCat.json();
          const menuData = await resMenu.json();
          setCategories(catData.data || []);
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

  const handleSubscribe = async (frequency: "DAILY" | "WEEKLY" | "MONTHLY", price: number) => {
    if (!user) {
      setAuthModal("login");
      return;
    }
    try {
      const token = localStorage.getItem("fk_token");
      const res = await fetch(`${API_URL}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          frequency,
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Start tomorrow
          pricePerCycle: price,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert(`Successfully subscribed to ${frequency} plan! Price: ${price.toLocaleString()} ₫ per cycle.`);
        setActiveTab("dashboard");
      } else {
        alert(result.message || "Failed to create subscription");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating subscription");
    }
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

  const filteredMenu = selectedCategory
    ? menuItems.filter((item) => item.categoryId === selectedCategory)
    : menuItems;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("menu")}>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Utensils className="h-5 w-5" />
            </div>
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
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-border bg-radial from-secondary/40 via-transparent to-transparent">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full border border-border bg-muted/40 text-xs text-primary font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Vietnam&apos;s Premium Meal Delivery & Subscription
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight">
                Fuel Your Body with <span className="text-primary bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Gourmet Nutrition</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                Expertly crafted organic salads, high-protein bowls, and fresh cold-pressed juices delivered straight to your door in Ho Chi Minh City. Pay easily via **Cash on Delivery (COD)**.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer text-sm"
                >
                  Explore Menu
                </button>
                <button
                  onClick={() => setActiveTab("subscriptions")}
                  className="border border-border bg-muted/20 hover:bg-muted font-semibold px-8 py-3.5 rounded-full transition-all cursor-pointer text-sm"
                >
                  Meal Subscription plans
                </button>
              </div>
            </div>
            <div className="relative h-80 sm:h-96 w-full rounded-2xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
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

              {/* Minimal Category Filter */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedCategory === ""
                      ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "bg-muted/40 border-border hover:bg-muted"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10"
                        : "bg-muted/40 border-border hover:bg-muted"
                    }`}
                  >
                    {cat.name}
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMenu.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between border border-border hover:border-primary/50 bg-card rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div>
                      {/* Image placeholder with premium styling */}
                      <div className="h-48 w-full bg-muted/40 flex items-center justify-center border-b border-border overflow-hidden relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="object-cover h-full w-full group-hover:scale-105 transition-all duration-300"
                          />
                        ) : (
                          <Utensils className="h-12 w-12 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-200" />
                        )}
                        <span className="absolute top-4 right-4 bg-background/90 text-primary text-xs font-extrabold px-3 py-1.5 rounded-full border border-border">
                          {formatVND(item.price)}
                        </span>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-bold font-heading mb-2 leading-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-border/30 mt-4">
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEAL SUBSCRIPTIONS */}
        {activeTab === "subscriptions" && (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">
                Weekly & Monthly Meal Subscriptions
              </h2>
              <p className="text-sm text-muted-foreground">
                Set and forget. Select a plan and frequency, and receive fresh healthy chef-crafted meals daily at your office or residence. Skip or pause anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Daily Plan */}
              <div className="border border-border bg-card rounded-2xl p-8 flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-lg shadow-sm">
                <div>
                  <div className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase mb-2">Daily Trial</div>
                  <h3 className="text-2xl font-bold font-heading mb-4">Daily Power</h3>
                  <div className="text-3xl font-black font-heading text-primary mb-6">
                    {formatVND(80000)} <span className="text-xs text-muted-foreground font-normal">/ day</span>
                  </div>
                  <ul className="space-y-3.5 text-xs text-muted-foreground mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      1 Chef-designed healthy meal per day
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Delivered hot before 12:00 PM
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Perfect for trying out our service
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleSubscribe("DAILY", 80000)}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/95 transition-all text-xs cursor-pointer shadow-md shadow-primary/10"
                >
                  Subscribe Plan (Daily)
                </button>
              </div>

              {/* Weekly Plan */}
              <div className="border border-primary bg-card rounded-2xl p-8 flex flex-col justify-between relative hover:shadow-xl transition-all shadow-md">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-black tracking-wider uppercase py-1.5 px-4 rounded-full shadow-md">
                  Most Popular
                </div>
                <div>
                  <div className="text-xs font-extrabold tracking-wider text-primary uppercase mb-2">Office Classic</div>
                  <h3 className="text-2xl font-bold font-heading mb-4">Weekly Balance</h3>
                  <div className="text-3xl font-black font-heading text-primary mb-6">
                    {formatVND(450000)} <span className="text-xs text-muted-foreground font-normal">/ cycle</span>
                  </div>
                  <ul className="space-y-3.5 text-xs text-muted-foreground mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      5 Gourmet lunch meals (Mon-Fri)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Includes 1 fresh cold-pressed juice/week
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Free delivery in District 1, 3, Binh Thanh
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Flexible pausing & menu selection
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleSubscribe("WEEKLY", 450000)}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/95 transition-all text-xs cursor-pointer shadow-md shadow-primary/10"
                >
                  Subscribe Plan (Weekly)
                </button>
              </div>

              {/* Monthly Plan */}
              <div className="border border-border bg-card rounded-2xl p-8 flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-lg shadow-sm">
                <div>
                  <div className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase mb-2">Committed Fitness</div>
                  <h3 className="text-2xl font-bold font-heading mb-4">Monthly Lifestyle</h3>
                  <div className="text-3xl font-black font-heading text-primary mb-6">
                    {formatVND(1650000)} <span className="text-xs text-muted-foreground font-normal">/ cycle</span>
                  </div>
                  <ul className="space-y-3.5 text-xs text-muted-foreground mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      20 Gourmet lunch meals (Mon-Fri, 4 weeks)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Includes 4 fresh cold-pressed juices
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Free delivery all districts
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Priority custom meal requests
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleSubscribe("MONTHLY", 1650000)}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/95 transition-all text-xs cursor-pointer shadow-md shadow-primary/10"
                >
                  Subscribe Plan (Monthly)
                </button>
              </div>
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
                            alt={item.menuItem.name}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <Utensils className="h-6 w-6 text-muted-foreground/30" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{item.menuItem.name}</h4>
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
    </div>
  );
}
