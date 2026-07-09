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

// Customer is intentionally independent of User — there is no customer
// self-serve login today, staff track customers by name/phone/Zalo only.
// userId is optional so a customer portal can be added later.
export interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  zalo?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Protein = "CHICKEN" | "BEEF" | "SHRIMP";

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

// A sellable SKU: one protein + flavor + portion size combination
// (e.g. chicken / xá xíu / 150g). price is in whole VND (no subunit).
export interface MenuItem {
  id: string;
  protein: Protein;
  flavor: string;
  sizeGrams: number;
  price: number;
  isAvailable: boolean;
  categoryId?: string;
  // Optional customer-facing copy/photo — not used by the admin tool today
  // but needed by the customer-web storefront.
  description?: string;
  imageUrl?: string;
  // Portions prepped and ready right now — 0 means "needs prep" for this
  // SKU. Decremented when an Order using it is fulfilled IMMEDIATE.
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// The shape the pricing engine (packages/shared/pricing.ts) operates on —
// shared by Order line items and Subscription per-occurrence item
// snapshots. Carrying protein/flavor/sizeGrams/unitPrice as a snapshot
// (rather than just a menuItemId reference) protects historical records
// from later menu changes.
export interface LineItem {
  menuItemId?: string;
  protein: Protein;
  flavor: string;
  sizeGrams: number;
  unitPrice: number;
  qty: number;
}

// Payment state as tracked by staff for an Order or Subscription — mirrors
// the original 3-step Vietnamese flow (Chưa thanh toán / Đã cọc / Đã thanh
// toán). See PAYMENT_STATE_LABELS in packages/shared for display strings.
export type PaymentState = "UNPAID" | "DEPOSIT" | "PAID";

// Unified order lifecycle — modeled on the Shopee-style flow so both a
// one-off order and a subscription-generated occurrence share one set of
// stages instead of two parallel status enums. COMPLETED is the only status
// that ever triggers a SubscriptionPool deduction (see OrdersService).
export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

// Where an Order came from — a one-off order placed directly, or an
// occurrence materialized from a Subscription's volume schedule.
export type OrderSource = "ONE_OFF" | "SUBSCRIPTION";

export interface OrderItem extends LineItem {
  id: string;
  orderId: string;
}

// Whether an Order was fulfilled from ready-made stock (no prep needed) or
// needs the kitchen to prep it first. Computed server-side at order-creation
// time from each line item's MenuItem.stockQuantity — never client-set.
export type OrderFulfillmentType = "IMMEDIATE" | "SCHEDULED";

// Covers BOTH a one-off order and an occurrence materialized from a
// Subscription's volume schedule (subscriptionId set, source SUBSCRIPTION).
// See CustomPlanRequest for the discovery step that precedes a Subscription.
export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  deliveryDate: Date;
  paymentStatus: PaymentState;
  status: OrderStatus;
  fulfillmentType: OrderFulfillmentType;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  source: OrderSource;
  subscriptionId?: string;
  // Denormalized convenience field for subscription-sourced orders — not
  // stored on Order itself, populated by the API when joining Subscription.
  packageName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

// One protein's purchased balance within a volume subscription (e.g. "30kg
// CHICKEN, 12.4kg remaining"). remainingGrams only decreases when an Order
// containing items of this protein has its status marked COMPLETED.
export interface SubscriptionPool {
  id: string;
  subscriptionId: string;
  protein: Protein;
  totalGrams: number;
  remainingGrams: number;
  createdAt: Date;
  updatedAt: Date;
}

// Volume-based subscription: the customer buys a total weight per protein
// up front (see pools), then separately picks a delivery cadence
// (deliveryAmountGrams delivered every deliveryIntervalDays). The specific
// flavor for each occurrence is chosen closer to delivery time (see
// Order — subscription occurrences are just Orders with subscriptionId
// set) and only deducted from the matching pool once that Order's status
// is actually marked COMPLETED. Always staff-created — see
// CustomPlanRequest for the customer-facing "ask for a custom plan" flow.
export interface Subscription {
  id: string;
  customerId?: string;
  customerName: string;
  packageName: string;
  totalGrams: number;
  deliveryAmountGrams: number;
  deliveryIntervalDays: number;
  startDate: Date;
  totalPrice: number;
  paymentStatus: PaymentState;
  status: SubscriptionStatus;
  postponedCount: number;
  pools: SubscriptionPool[];
  createdAt: Date;
  updatedAt: Date;
}

export type CustomPlanRequestStatus = "PENDING" | "REVIEWED" | "MATCHED" | "DECLINED";

// A customer's ask for a plan outside the standard catalog. Always starts as
// a consultation request — never a binding order. Staff review it and, if
// they build a matching Subscription for the customer, link it back here via
// matchedSubscriptionId.
export interface CustomPlanRequest {
  id: string;
  customerId?: string;
  customerName: string;
  phone?: string;
  desiredProteins: Protein[];
  estimatedTotalGrams?: number;
  preferredIntervalDays?: number;
  budgetHint?: number;
  notes?: string;
  status: CustomPlanRequestStatus;
  adminNotes?: string;
  matchedSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ledger of actual payment transactions (future real payment processing) —
// distinct from Order.paymentStatus / Subscription.paymentStatus above,
// which are the simple staff-tracked status shown in the UI today.
export type PaymentMethod =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "PAYPAL"
  | "STRIPE"
  | "CASH_ON_DELIVERY"
  | "BANK_TRANSFER";

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

export interface HomeFrame {
  id: string;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

