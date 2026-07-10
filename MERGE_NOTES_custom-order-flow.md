# Merge: custom order flow + recurring plan discount

Merged your `ui-testing` work (via `feature/unify-orders-subscriptions`) with my recurring plan discount redesign. Branch is up to date locally now — nothing pushed yet, just wanted to get this integrated and verified before we both keep building on it.

## What came from each side

**Your branch** (5 commits): the dual ordering path in Order Now — standard cart vs. custom bowl builder — plus the checkout review dialog, and the API support for optional `menuItemId` + custom protein/carb/sauce/topping fields on public orders.

**My branch** (10 commits): replaced the old single-use discount voucher with a recurring per-customer discount (`Customer.planDiscountPercent` / `planDiscountEndsAt`) that auto-applies to every order until it expires, instead of a one-time code.

## The one real conflict

Both branches touched `createForCustomer`'s parameter list in `orders.service.ts` — you widened `items` to `any[]` for custom items, I widened `customer` to carry the plan discount fields. Kept both side by side, no logic lost.

## Bugs I found in the incoming code (fixed, flagging so you know what changed)

These only show up under `tsc --noEmit`, not in Next dev mode, so they were probably invisible while building:

- Two `<div>` tags in the new Order Now section (custom-bowl macros panel, and the payment-method wrapper) were never closed — pure JSX syntax errors.
- `calculateCustomOrderPrice()` is called in three places but was never defined anywhere. I added it, mirroring the existing `calculateCustomMacros()` pricing formula (10k base prep cost + protein/carb/sauce/toppings price) against the Order Now flow's own state. Worth double-checking the price this produces matches what you intended.
- `handleSubmitOrderNow` is only ever called with zero arguments (from the checkout-review modal's Confirm button) but its signature required an event and called `.preventDefault()` unconditionally — would've thrown at runtime the moment someone clicked Confirm. Made the param optional.
- Your rework of the Order Now form **dropped the Cash-on-Delivery / VietQR payment method selector** even though the state (`orderNowPaymentMethod`) is still read elsewhere. I restored the original selector UI rather than invent something new — please sanity-check it still fits your new layout.

## Still to do

- Run `pnpm db:push && pnpm db:generate` wherever you have real DB access — the plan discount fields need the Prisma client regenerated.
- `apps/api` and `packages/database` can't be typechecked in my sandbox (no Prisma client generation there), so please run a full build/typecheck on your machine before we trust this completely.
- Everything else (`customer-web`, `admin-dashboard`, `packages/types`, `packages/shared`) typechecks clean.
