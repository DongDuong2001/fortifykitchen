# Design: Subscription Plans, Wallet, and Autonomous Ordering (v4 — confirmed, ready to build)

Status: **implemented** — Prisma schema, API, admin-dashboard, and
customer-web are all built on `feature/unify-orders-subscriptions`. Needs a
real `pnpm db:push && pnpm db:generate` run (and a fresh look at the admin
dashboard/customer-web UI in a browser) once this branch reaches a machine
with DB/network access — see CLAUDE.md's "Verifying without a live
DB/network" note.

v4 correction: your last message drops the whole "self-serve, build-your-
own autonomous plan straight from wallet balance" idea from v2/v3. That
was a misreading on my part — a premade/wallet plan is **one-off ordering
only**. Autonomous/everyday delivery **always** goes through the request
flow (the existing Custom Plan Request), which is exactly the "custom
plan must be consulted" rule from your very first message in this thread.
Net effect: this version is simpler than v2/v3, and barely touches the
already-built Subscription/SubscriptionPool machinery at all.

---

## The model

1. **`SubscriptionPlan`** (merged catalog, unchanged from v3) — price
   tiers. Buying one credits **wallet balance**, and grants a **percentage
   discount voucher** tied to the tier's spend amount (decided: e.g. the
   1.5M tier grants 5% off, the 3M tier grants 10% off — exact tiers/rates
   are an admin-configurable field on each `SubscriptionPlan`, not
   hardcoded). Vouchers plug into the existing `Discount` model
   (`type: PERCENTAGE`, `amount`), auto-generated/assigned to the customer
   on purchase rather than a generic public code.
2. **Wallet balance** (`Customer.walletBalance`) — an optional full-payment
   funding source for anything the customer pays for: a one-off order
   (`PaymentMethod.WALLET`, pay at placement) or a staff-built Subscription
   from an approved Custom Plan Request. Either use case requires the
   wallet to **fully** cover the amount — no splitting a payment between
   wallet + bank transfer; if the balance is short, the customer tops up
   first (wallet) or just pays the whole thing by bank transfer instead
   (wallet untouched). It does *not*, by itself, grant any
   autonomous/recurring delivery capability — having a balance doesn't let
   a customer self-serve a recurring plan, it just can be spent toward one
   once staff approve/build it. Never goes negative (decided) — any
   wallet-funded payment is rejected outright if `walletBalance` is short,
   no admin override to dip below 0.
3. **Autonomous/everyday delivery** — always starts as a request (existing
   `CustomPlanRequest`, unchanged), reviewed by staff, who then build a
   `Subscription` + `SubscriptionPool` for the customer — exactly the
   mechanism that's already shipped. No new self-serve path for this.

Worked example, matching what you described: customer requests "1kg
chicken every day for 30 days." Staff (or the request flow) compute the
cost — 30 × 1kg × price/kg ≈ 4,000,000đ. Customer funds that amount (from
existing wallet balance, a fresh top-up, or bank transfer — same
`paymentStatus` UNPAID → PAID flow subscriptions already use). Once
funded, staff create the `Subscription` with a `SubscriptionPool` sized to
that 4,000,000đ / equivalent grams. **Deduction happens exactly as already
built**: each day's `Order`, once marked `COMPLETED`
(`OrdersService.markCompleted`), deducts that occurrence's grams from
`SubscriptionPool.remainingGrams` — so the customer's balance visibly
drops after each successful delivery, not before. No change needed to
this part of the code at all.

---

## What this drops from v3

- §3 "Self-serve autonomous delivery request" — **gone**. There is no
  wallet-funded, staff-free way to set up recurring delivery.
- "Pay-as-you-go, deduct at generation time" — **gone**. Deduction stays
  at `COMPLETED`, against a pool, exactly as already implemented.
- The `fundingMode: POOL | WALLET` split on `Subscription` — **gone**,
  since there's now only one way autonomous delivery gets funded (the
  existing pool mechanism). `Subscription` needs no schema changes.

## What's actually new (smaller list now)

1. `SubscriptionPlan` catalog + purchase flow (§1).
2. `Customer.walletBalance` + `PaymentMethod.WALLET` for one-off orders
   (§2).
3. Low-balance notification — now two distinct, smaller things instead of
   the v3 pay-as-you-go trigger:
   - **Wallet balance low** (for one-off ordering): notify when it drops
     below some threshold.
   - **Subscription pool running low** (for an existing autonomous plan):
     notify when `SubscriptionPool.remainingGrams` gets low relative to
     `deliveryAmountGrams` (e.g. fewer than N deliveries' worth left) —
     this is arguably useful *today*, independent of anything wallet-
     related, and was always implicitly missing (admin currently has to
     notice a pool is nearly empty by looking).
   Both stay in-app only (dashboard badge + customer-web banner), per your
   earlier answer.
4. Swap-today's-protein action on an existing pool-funded plan (unchanged
   from v1/v2, still useful, still small).

---

## Decisions log (all resolved)

- **Low-balance threshold**: pool-running-low notice fires at "fewer than
  3 deliveries' worth of grams remaining" (same shape applies to the
  wallet-balance-low notice too — under 3 typical orders' worth).
- **Custom Plan Request funding**: no split/partial funding. Paid **one
  way or the other, in full** — wallet only if `walletBalance` fully
  covers `subscription.totalPrice` (top up first if short), or a fresh
  bank transfer for the whole amount with the wallet untouched. Never
  both on one Subscription.
- **Wallet floor**: never negative, no admin override.
- **Vouchers**: percentage-off, tiered by `SubscriptionPlan` spend amount,
  via the existing `Discount` model.
- **Account requirement**: buying a `SubscriptionPlan` or paying via
  wallet requires a logged-in account; Custom Plan Request and the
  existing subscription lookup stay phone-only, unchanged.

---

## Status: implemented

Prisma schema → API → admin dashboard → customer-web are all built, one
commit per completed piece:
- `feat(db): add SubscriptionPlan catalog, wallet balance, and WALLET payment method`
- `feat(api): add SubscriptionPlan module — catalog, purchase, staff reconciliation`
- `feat(api): pay one-off orders from wallet balance`
- `feat(api): fund a Subscription in full from wallet balance`
- `feat(api): add low-balance notifications for wallet and subscription pools`
- `feat(admin-dashboard): add Subscription Plans catalog, wallet top-up queue, and low-balance alerts`
- `feat(customer-web): add wallet, plan purchases, and low-balance banner`

Not yet done: a real `pnpm db:push && pnpm db:generate` run against a live
database (the agent sandbox this was built in has no DB/network access —
see CLAUDE.md), and a manual click-through in a browser.
