# Recurring plan discount + merge with custom order flow

## Summary

Replaces the old single-use discount voucher issued on plan purchase with a real recurring perk, merges in the custom-order (build-your-own-bowl) flow from `ui-testing`, and fixes a few bugs found along the way — including a couple that were already sitting in the custom-order code before this merge.

## What changed

### Recurring plan discount (replaces the old voucher)

Buying a plan used to generate a one-time `Discount` code the customer had to type in at checkout, and it vanished the moment it was used once. Per the business decision that a plan discount should apply to *every* order for the life of the plan, this is now:

- `Customer.planDiscountPercent` / `planDiscountEndsAt` set directly when staff confirm a plan purchase (`SubscriptionPlansService.confirmPurchase`) — no more per-purchase `Discount` row.
- Applied automatically and silently on every order (`OrdersService.createForCustomer`) until it lapses — nothing to type, nothing to redeem, nothing that goes stale after one use.
- Stacks additively with a manually-typed discount code and the automatic tier discount, clamped so the combined discount never exceeds the order subtotal.
- A customer can't self-serve buy a new plan while a discount is still active — `SubscriptionPlansService.purchase()` now rejects with a "contact our team to upgrade" message instead of silently overwriting or stacking plans.
- Customer-web: wallet card shows the active discount + expiry, plan cards are disabled with an explanatory banner while one is active, and the old auto-fill-a-voucher-code UI is gone.
- Admin-dashboard: new "Ưu đãi gói" column so staff can see who has an active discount without querying the DB.

### Merged `ui-testing` (custom order flow)

Integrated the dual ordering path (standard cart vs. custom bowl builder) and the checkout review dialog. One real conflict: `createForCustomer`'s param list — kept both the widened `items: any[]` (for menuItemId-less custom items) and the widened `customer` param (plan discount fields).

While verifying the merge, found and fixed a few pre-existing bugs in the custom-order code that only show up under `tsc --noEmit` (not in Next dev mode):
- Two unclosed `<div>` tags (custom-bowl macros panel, payment-method section).
- `calculateCustomOrderPrice()` was called in three places but never defined — added it, mirroring the existing `calculateCustomMacros()` pricing formula against the Order Now flow's own selection state. Worth a sanity check that the price it produces matches what was intended.
- `handleSubmitOrderNow` was only ever called with zero arguments but required an event param and called `.preventDefault()` unconditionally — would've thrown the moment someone clicked "Confirm" in the review modal.
- The Order Now payment-method selector (COD / VietQR) had been dropped entirely by the rework of that form section, even though the state was still referenced elsewhere — restored it.

### Checkout error handling (found during manual testing post-merge)

Testing an already-used discount code surfaced two more issues:
- A rejected checkout (e.g. "this code has already been used") only showed a toast, which sits at the same z-index as the cart drawer's backdrop and was easy to miss — clicking "Đặt hàng" looked like it did nothing. Added an inline red error message directly in the checkout form now, on top of the toast.
- The discount-code live preview (`GET /discounts/verify`) never checked per-customer redemption history, so it showed "✓ Đã áp dụng" for a code the customer had already used, only failing later at actual order placement. The preview now sends the auth token when logged in, and the API checks redemption history too, so "already used" shows up immediately while typing the code instead of after a failed checkout.

## Testing

- `apps/customer-web`, `apps/admin-dashboard`, `packages/types`, `packages/shared` all typecheck clean (`npx tsc --noEmit`).
- `apps/api` / `packages/database` weren't typecheckable in the sandbox this was built in (no Prisma client generation there) — **please run a full build/typecheck before merging**.
- Manually walked through: applying a fresh discount code, re-trying an already-used code (now rejected inline immediately), placing a COD order, and the plan-purchase-blocked-while-active guard.

## Before merging

- Run `pnpm db:push && pnpm db:generate` — the plan discount fields need the Prisma client regenerated.
- Please sanity-check `calculateCustomOrderPrice()` — see note above — since I derived it from an existing formula rather than being able to confirm the intended pricing rules directly.
- Would appreciate a look at the restored payment-method selector to make sure it still fits the custom-order layout as intended.
