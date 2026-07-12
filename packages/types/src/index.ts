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
  // Spendable balance in whole VND, topped up by buying a SubscriptionPlan
  // and spent on wallet-paid orders or in full toward a staff-built
  // Subscription. Never negative. See docs/plan-and-credit-design.md.
  walletBalance: number;
  // Recurring membership discount from the customer's current
  // SubscriptionPlan, applied automatically to every order until
  // planDiscountEndsAt — replaces the earlier single-use plan-purchase
  // voucher design. A customer can only hold one plan's discount at a
  // time (see SubscriptionPlansService.purchase's guard).
  planDiscountPercent: number;
  planDiscountEndsAt?: Date;
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
  type?: "IMMEDIATE_DELIVERY" | "PRE_ORDER";
  systemNotes?: string;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  subtotal: number;
  discountAmount: number;
  // Snapshot of the Discount.code redeemed on this order, if any — stacks
  // additively with the automatic tier discount (both folded into
  // discountAmount). See DiscountRedemption in schema.prisma.
  discountCode?: string;
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
  | "BANK_TRANSFER"
  | "WALLET"; // paid from Customer.walletBalance

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

// Also doubles as the wallet top-up ledger — a SubscriptionPlan purchase
// creates a row here (customerId + subscriptionPlanId set, orderId/
// subscriptionId undefined) that starts PENDING until staff confirm the
// bank transfer, which is what actually credits walletBalance and issues
// the voucher. See docs/plan-and-credit-design.md.
export interface Payment {
  id: string;
  orderId?: string;
  subscriptionId?: string;
  customerId?: string;
  subscriptionPlanId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// A purchasable price tier (e.g. 1,500,000đ, 3,000,000đ) — buying one
// credits Customer.walletBalance by `price` and issues a percentage-off
// Discount voucher sized by `voucherPercent`. Never grants autonomous/
// recurring delivery by itself — that always goes through a
// CustomPlanRequest. See docs/plan-and-credit-design.md.
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  voucherPercent: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Coupon-style code. A public code (customerId undefined) or a voucher
// auto-issued to one customer when they buy a SubscriptionPlan (customerId
// set).
export interface Discount {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  amount: number;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  customerId?: string;
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

