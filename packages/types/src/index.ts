export type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number; // Snapshot of price at time of order
  notes?: string;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  deliveryFee: number;
  notes?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "CANCELLED"
  | "EXPIRED";

export type SubscriptionFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Subscription {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  startDate: Date;
  endDate?: Date;
  nextDeliveryDate: Date;
  pricePerCycle: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL" | "STRIPE" | "CASH_ON_DELIVERY";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
