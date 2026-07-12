# Homepage Redesign Spec — merge About into Home

> Implementation brief for an AI agent (or developer). Goal: collapse the
> duplicated **Home** and **About Us** tabs into **one** scrolling homepage,
> remove the standalone About tab, de-duplicate the brand pillars, and lift the
> visual polish. Scope is `apps/customer-web/src/app/page.tsx` only. No backend
> changes. Keep everything **bilingual (VI/EN)** via the existing
> `lang === "vi" ? … : …` pattern and reuse existing components/tokens.

## 0. Context (why this change)

The Home tab and the About tab both present the same three brand pillars —
**sous-vide**, **organic / VietGAP crops**, **precise macros** — plus a
sous-vide story that repeats a third time. Visitors get déjà-vu; maintainers
edit the same message in two places. Tell the story **once**.

Current locations in `page.tsx`:
- Home content: `{activeTab === "home" && (…)}` — hero block (~line 1836) and the
  main home content (~line 1902): 3 "commitment" cards (Organic / Sous-vide /
  Macros), "Signature Bowls Today", plus additional feature blocks.
- About content: `{activeTab === "about" && (…)}` (~line 2213): Mission header,
  quote callout, 4 "Core Values" pillars (Sous-vide / VietGAP / Macros /
  Transparent Info), and a "Split Story" sous-vide section with image.

## 1. Decisions (do these)

1. **One homepage.** All of the below renders under `activeTab === "home"`.
2. **Delete the About tab entirely**: remove `{activeTab === "about" && (…)}`
   block, the `nav_about` desktop + mobile nav entries, and the `"about"` value
   from the `activeTab` union type. Salvage its good content (mission line, quote
   callout, sous-vide story, the better pillar copy) into the home flow.
3. **One canonical pillar block.** Delete the Home "commitment cards" and reuse a
   single "Why Fortify" pillar section (4 pillars, from About's copy). The
   sous-vide message appears at most twice total: once as a pillar, once as the
   deeper story section.
4. Preserve every existing CTA target (`setActiveTab("menu")`,
   `setActiveTab("order-now")` is gone — use `"menu"`, `setActiveTab("wallet")`
   / `"subscriptions"` as relevant).

## 2. Target page structure (top → bottom)

Render in this order inside the single home view:

1. **Hero** (reuse existing). Full-bleed section, `h1`, sub-line, two CTAs
   (primary → Menu, secondary → Meal subscriptions). Keep the current hero — it's
   the strongest asset; it now owns the top of the only page.
2. **Trust strip** (small, optional). One row of 3–4 short proofs
   (e.g. "Macros on every label", "Sous-vide, never dry", "VietGAP produce",
   "Giao nội thành TP.HCM"). Icon + one line each. Keep it thin.
3. **Signature Bowls Today** (reuse existing "Món ăn nổi bật hôm nay"). Pull the
   current featured-bowls grid up high — product before philosophy. Ends with a
   "Xem toàn bộ thực đơn / View full menu" button → `setActiveTab("menu")`.
4. **Why Fortify — the canonical pillars** (from About's "Core Values"). One
   4-card grid: Sous-vide Method · VietGAP Crops · Precise Macros · Transparent
   Info. Reuse About's card markup and copy verbatim (it's the better version).
   This is the ONLY place the pillars appear.
5. **Sous-vide story** (from About's "Split Story"). Two-column: text left,
   image right (keep the Unsplash image or swap for a real photo). Reuse copy.
6. **Mission / quote callout** (from About). The italic quote in the bordered
   card + "Fortify Kitchen Development Team" attribution — a single editorial
   beat near the bottom that gives the brand a voice.
7. **Final CTA band.** One centered block: headline + primary button → Menu.
   (e.g. "Sẵn sàng ăn sạch mỗi tuần? / Ready to eat clean every week?").
8. **Footer** (reuse existing).

Delete/merge, do not duplicate: the old Home "commitment cards" (superseded by
#4), and any home feature block that restates a pillar.

## 3. Visual / polish guidance

- **One vertical rhythm.** Use a consistent section wrapper (e.g.
  `py-16 sm:py-20`, `max-w-7xl mx-auto px-6`) so it reads as one designed page,
  not stacked fragments. Alternate section backgrounds sparingly
  (`bg-background` vs `bg-muted/10`) to separate beats.
- **Section headers** get a small uppercase eyebrow (`text-[10px] tracking-wider
  text-primary`) + an `h2` (`text-3xl sm:text-4xl font-extrabold font-heading`),
  matching the existing About header pattern.
- **Reuse tokens only**: `--primary`, `border-border`, `bg-card`,
  `text-muted-foreground`, `rounded-2xl`, `font-heading`. No new colors, no new
  deps. Keep Tabler/FontAwesome icons already imported (`faFlask`, `faLeaf`,
  `faHeart`, `faShieldHalved`, etc.).
- **Imagery**: prefer a real dish photo in the hero and the sous-vide story;
  keep the fallback pattern already used elsewhere.
- **Motion**: keep the existing `animate-in fade-in` on section mount; don't add
  scroll libraries.

## 4. Accessibility (must pass)

- Body copy ≥ 12px; the pillar descriptions are currently `text-[11px]` — bump to
  12px. Line-height ≥ 1.6.
- Every image has a meaningful `alt`.
- CTAs are `<button>`/`<a>` with ≥44px touch height on mobile.
- Don't encode meaning in color alone (pillar icons keep their text labels).
- Contrast: avoid muted text on tinted cards below WCAG AA; darken if needed.

## 5. Navigation changes

- Remove `nav_about` from the desktop `<nav>` and the mobile bottom nav.
- Remove `nav_about` dictionary keys (or leave unused — but prefer removing).
- Remove `"about"` from the `activeTab` state union type.
- Optional nicety: if you keep an "About" affordance, make it an in-page anchor
  that scrolls to the "Why Fortify" section rather than a separate tab.

## 6. Constraints

- Single file: `apps/customer-web/src/app/page.tsx`.
- Bilingual: every user-facing string uses `lang === "vi" ? … : …`.
- No new npm dependencies; no backend/schema changes.
- Keep the file compiling: after edits, run
  `pnpm --filter customer-web build` and a lint pass. Verify no dangling
  references to the removed `"about"` tab or `nav_about`.

## 7. Acceptance criteria

- [ ] Only one content tab tells the brand story; the About tab is gone from nav
      and code, and nothing references `activeTab === "about"`.
- [ ] The brand pillars (sous-vide / VietGAP / macros / transparency) appear in
      exactly one canonical block; the sous-vide message is not repeated 3×.
- [ ] Homepage reads top-to-bottom as one flow: Hero → Trust → Today's bowls →
      Why Fortify → Sous-vide story → Mission quote → Final CTA → Footer.
- [ ] Fully bilingual; no hardcoded single-language strings introduced.
- [ ] `customer-web` builds and lints clean; no unused `about`/`nav_about`
      leftovers.
- [ ] Pillar body text ≥ 12px; images have alt text.

## 8. Suggested implementation order (small, safe steps)

1. Add the new home sections (pillars, story, quote, final CTA) into the
   `activeTab === "home"` block, reusing About's markup/copy.
2. Remove the old Home "commitment cards" duplicate.
3. Delete the `activeTab === "about"` block.
4. Remove About nav entries + the `"about"` union member + `nav_about` keys.
5. Build + lint; fix any dangling references. Verify bilingual rendering.
