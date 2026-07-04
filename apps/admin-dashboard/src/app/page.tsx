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
  Lock,
} from "lucide-react";

export default function AdminDashboard() {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any | null>(null);

  // Authentication Fields
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPass, setLoginPass] = React.useState("");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Section State: "dashboard" | "orders" | "menu" | "subscriptions" | "discounts"
  const [section, setSection] = React.useState<"dashboard" | "orders" | "menu" | "subscriptions" | "discounts">("dashboard");

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
  const [discounts, setDiscounts] = React.useState<any[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = React.useState(false);

  // Form Modals State
  const [menuModal, setMenuModal] = React.useState<"create" | "edit" | null>(null);
  const [editingMenuItemId, setEditingMenuItemId] = React.useState<string | null>(null);
  const [menuItemName, setMenuItemName] = React.useState("");
  const [menuItemDesc, setMenuItemDesc] = React.useState("");
  const [menuItemPrice, setMenuItemPrice] = React.useState(100000);
  const [menuItemImage, setMenuItemImage] = React.useState("");
  const [menuItemCatId, setMenuItemCatId] = React.useState("");
  const [menuItemAvailable, setMenuItemAvailable] = React.useState(true);

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
        const res = await fetch(`${API_URL}/dashboard/stats`, { headers });
        if (res.ok) {
          const result = await res.json();
          setStats(result.data);
        }
      } else if (section === "orders") {
        const res = await fetch(`${API_URL}/orders`, { headers });
        if (res.ok) {
          const result = await res.json();
          setOrders(result.data || []);
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
      } else if (section === "subscriptions") {
        const res = await fetch(`${API_URL}/subscriptions`, { headers });
        if (res.ok) {
          const result = await res.json();
          setSubscriptions(result.data || []);
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
  }, [token, section, API_URL]);

  // Fetch data when authenticated or section changes
  React.useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, section, loadData]);

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

  // Manage Order Statuses (e.g. COD collections)
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create or Update Menu Item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: menuItemName,
        description: menuItemDesc,
        price: Number(menuItemPrice),
        imageUrl: menuItemImage || undefined,
        categoryId: menuItemCatId,
        isAvailable: menuItemAvailable,
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
    setMenuItemName(item.name);
    setMenuItemDesc(item.description);
    setMenuItemPrice(item.price);
    setMenuItemImage(item.imageUrl || "");
    setMenuItemCatId(item.categoryId);
    setMenuItemAvailable(item.isAvailable);
    setMenuModal("edit");
  };

  const resetMenuForm = () => {
    setEditingMenuItemId(null);
    setMenuItemName("");
    setMenuItemDesc("");
    setMenuItemPrice(100000);
    setMenuItemImage("");
    setMenuItemAvailable(true);
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

  // Render Login state if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-border bg-card shadow-xl rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-md">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold font-heading">Administrative console</h1>
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
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Utensils className="h-4.5 w-4.5" />
            </div>
            <span className="font-bold tracking-tight font-heading text-sm">Fortify Console</span>
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
            { id: "orders", label: "Orders dispatcher", icon: ShoppingBag },
            { id: "menu", label: "Menu Catalog Manager", icon: Utensils },
            { id: "subscriptions", label: "Subscriber Directory", icon: Calendar },
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

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
          <h2 className="font-extrabold tracking-tight font-heading text-base capitalize">
            {section.replace("-", " ")}
          </h2>
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
                      { label: "Total Revenue (VND)", value: formatVND(stats.totalRevenue), icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                      { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: Calendar, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                      { label: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
                      { label: "Total Food Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                    ].map((item, idx) => (
                      <div key={idx} className="border border-border bg-card rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                          <div className="text-xl font-extrabold font-heading">{item.value}</div>
                        </div>
                        <div className={`p-3 rounded-full border ${item.color}`}>
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
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentOrders?.map((o: any) => (
                            <tr key={o.id} className="border-b border-border/20 last:border-0">
                              <td className="py-3.5 font-bold">{o.customerName}</td>
                              <td className="py-3.5 font-semibold text-primary">{formatVND(o.totalAmount)}</td>
                              <td className="py-3.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  {o.status}
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
                <div className="border border-border bg-card rounded-2xl p-6 shadow-sm animate-in fade-in duration-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border/50 pb-3">
                          <th className="pb-3 font-semibold">Order ID</th>
                          <th className="pb-3 font-semibold">Customer Details</th>
                          <th className="pb-3 font-semibold">Address / Notes</th>
                          <th className="pb-3 font-semibold">Amount / Method</th>
                          <th className="pb-3 font-semibold">Order Status</th>
                          <th className="pb-3 font-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-b border-border/20 last:border-0 align-top">
                            <td className="py-4 font-mono text-[10px] font-semibold text-muted-foreground max-w-[80px] truncate" title={o.id}>
                              {o.id}
                            </td>
                            <td className="py-4">
                              <div className="font-bold">{o.customerName}</div>
                              <div className="text-[10px] text-muted-foreground">{o.customerPhone}</div>
                            </td>
                            <td className="py-4 max-w-[200px]">
                              <div className="truncate" title={o.deliveryAddress}>{o.deliveryAddress}</div>
                              {o.notes && <div className="text-[10px] text-muted-foreground italic truncate">&quot;{o.notes}&quot;</div>}
                            </td>
                            <td className="py-4">
                              <div className="font-bold text-primary">{formatVND(o.totalAmount)}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {o.payment?.method} ({o.payment?.status})
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                {o.status}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, "CONFIRMED")}
                                  className="py-1 px-2 border border-border bg-background hover:bg-muted text-[10px] font-bold rounded cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, "PREPARING")}
                                  className="py-1 px-2 border border-border bg-background hover:bg-muted text-[10px] font-bold rounded cursor-pointer"
                                >
                                  Prep
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, "DELIVERED")}
                                  className="py-1 px-2 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-[10px] font-bold rounded cursor-pointer"
                                  title="Mark Delivered & Collect COD Cash"
                                >
                                  COD Deliver
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {menuItems.map((item) => (
                      <div key={item.id} className="border border-border bg-card rounded-2xl p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="font-bold font-heading text-sm truncate">{item.name}</h4>
                            <span className="text-xs font-bold text-primary shrink-0">{formatVND(item.price)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${item.isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {item.isAvailable ? "Available" : "Out of Stock"}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-border/30 mt-4">
                          <button
                            onClick={() => handleEditMenuItemTrigger(item)}
                            className="flex-1 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="py-1.5 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION D: SUBSCRIBER DIRECTORY */}
              {section === "subscriptions" && (
                <div className="border border-border bg-card rounded-2xl p-6 shadow-sm animate-in fade-in duration-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border/50 pb-3">
                          <th className="pb-3 font-semibold">Subscriber</th>
                          <th className="pb-3 font-semibold">Phone Number</th>
                          <th className="pb-3 font-semibold">Frequency Plan</th>
                          <th className="pb-3 font-semibold">Cycle price</th>
                          <th className="pb-3 font-semibold">Next Delivery</th>
                          <th className="pb-3 font-semibold">Schedule Status</th>
                          <th className="pb-3 font-semibold text-center">Manage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub) => (
                          <tr key={sub.id} className="border-b border-border/20 last:border-0">
                            <td className="py-3.5 font-bold">{sub.customerName || "Customer"}</td>
                            <td className="py-3.5 text-muted-foreground">{sub.customerPhone}</td>
                            <td className="py-3.5">
                              <span className="text-[10px] font-extrabold tracking-wider bg-muted py-0.5 px-2 rounded border border-border">
                                {sub.frequency}
                              </span>
                            </td>
                            <td className="py-3.5 font-bold text-primary">{formatVND(sub.pricePerCycle)}</td>
                            <td className="py-3.5 text-muted-foreground">
                              {new Date(sub.nextDeliveryDate).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  sub.status === "ACTIVE"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-amber-50 border-amber-200 text-amber-700"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-center">
                              <button
                                onClick={() => {
                                  const next = sub.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
                                  handleUpdateOrderStatus(sub.id, next); // updates subscription status
                                  // Wait, updateOrderStatus updates orders, we need updateSub status:
                                  fetch(`${API_URL}/subscriptions/${sub.id}/status`, {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ status: next }),
                                  }).then(() => loadData());
                                }}
                                className="py-1 px-2 border.border bg-background hover:bg-muted text-[10px] font-bold rounded cursor-pointer"
                              >
                                {sub.status === "ACTIVE" ? "Pause" : "Resume"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Tofu Quinoa Bowl"
                  value={menuItemName}
                  onChange={(e) => setMenuItemName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ingredients and macros profile details..."
                  value={menuItemDesc}
                  onChange={(e) => setMenuItemDesc(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none resize-none"
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
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                  <select
                    value={menuItemCatId}
                    onChange={(e) => setMenuItemCatId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none"
                  >
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
    </div>
  );
}
