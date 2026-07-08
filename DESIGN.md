---
version: alpha
name: Soumaki — Your Healthy Food Soulmate
description: Vietnamese healthy meal-prep & sous-vide bowl brand. Warm, romantic "soulmate" tone wrapped in a clean, cream-and-green, appetite-forward layout.

colors:
  primary: "#1E2016"
  secondary: "#7B8069"
  tertiary: "#B0361B"
  neutral: "#F0EBDA"
  surface: "#F8F3E1"
  border: "#E6DFCE"
  on-primary: "#F8F3E1"

typography:
  display:
    fontFamily: "Soumaki Sans, DM Sans"
    fontSize: 3.75rem
    fontWeight: 700
    letterSpacing: "-0.02em"

  h1:
    fontFamily: "Soumaki Sans, DM Sans"
    fontSize: 2.25rem
    fontWeight: 700

  body:
    fontFamily: "Soumaki Sans, DM Sans"
    fontSize: 1rem
    lineHeight: 1.7

  label:
    fontFamily: "Soumaki Sans, DM Sans"
    fontSize: 0.8rem
    fontWeight: 600
    letterSpacing: "0.08em"

rounded:
  sm: 8px
  md: 16px
  lg: 24px

spacing:
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px

components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 14px 28px

  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: 14px 28px

  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 20px
    borderColor: "{colors.border}"

  badge:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 4px 12px

  filter-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    borderColor: "{colors.border}"
    rounded: 999px
    padding: 8px 18px

---

# Overview

Soumaki is a Ho Chi Minh City healthy-bowl brand (dine-in, delivery, catering) built around sous-vide protein, macro-balanced bowls, and a distinctive brand conceit: Soumaki as your "healthy food soulmate." The 2024 rebrand (by Behalf Studio) leans fully into a dating/relationship metaphor — "tri kỷ," "chân ái," "sou-mates" — expressed through warm, romantic copywriting layered over a clean, nutrition-forward interface.

Visually the site reads as calm and appetite-first: a warm neutral canvas, a grounded deep-green brand color, a single warm accent reserved for action, generous whitespace, and food photography that carries most of the visual weight. Structure and step-based flows (build-your-own bowl, macro badges) keep the "healthy eating is simple" promise legible.

**Note on this file:** navigation, copy, page structure, content sections, and typography facts (custom "Soumaki Sans" typeface built on open-source DM Sans) are confirmed from the live site and the brand's rebrand case study. Exact hex values, spacing scale, and corner radii are best-effort estimates consistent with the brand's known cream/green/citrus palette and soft, food-forward visual style — treat them as a strong starting point to refine against the live site or brand assets.

---

# Brand Personality

- Warm
- Romantic (soulmate/relationship metaphor)
- Nourishing
- Trustworthy
- Playful
- Clean / uncluttered

The interface should feel like a caring partner, not a clinical nutrition app — playful "dating" language paired with straightforward macro data.

---

# Colors

- **Primary (`#1E2016`)**
  Deep Matcha Green. Headings, nav text, icon strokes, footer background.

- **Secondary (`#7B8069`)**
  Bamboo Sage Green. Supporting copy, metadata (macro labels), borders on secondary elements.

- **Tertiary (`#B0361B`)**
  Clay Red. The single accent color, reserved for primary CTAs ("Đặt ngay," "Đặt món ngay," "Tính calo ngay").

- **Neutral (`#F0EBDA`)**
  Rice Paper Warm Neutral. Page background — keeps long Vietnamese/English copy easy on the eyes.

- **Surface (`#F8F3E1`)**
  Warm Sand Cream. Bowl cards, testimonial cards, blog cards.

- **Border (`#E6DFCE`)**
  Rice Paper Border. Card outlines, dividers between sections.

---

# Typography

## Display

Soumaki Sans (custom, built on open-source DM Sans) — large hero statements like "Your healthy food soulmate."

## H1

Soumaki Sans Bold — section titles: "Build your own healthy bowl," "Sou-made bowls," "Nuôi dưỡng mối quan hệ lành mạnh với thực phẩm."

## Body

Soumaki Sans Regular — long-form Vietnamese/English copy, generous line-height for readability.

## Label / Eyebrow

Soumaki Sans SemiBold, uppercase, letter-spaced — small kicker labels above headings ("DỊCH VỤ CỦA SOUMAKI," "SÁNG TẠO THOẢ THÍCH VỚI MENU," "NÓI CÓ SÁCH, MÁCH CÓ CHỨNG").

---

# Components

## Buttons

**Primary button**
- Burnt-orange background, white text
- Medium radius, medium padding
- One per view — the only place the accent color appears

Examples: Đặt ngay · Đặt món ngay · Tính calo ngay · Khám phá ngay

**Secondary button**
- White background, deep-green text, thin border
- Used for lower-emphasis navigation-style actions

Examples: Ghé cửa hàng · Tìm hiểu thêm · Chọn món bạn yêu

## Cards

**Bowl card** (core commerce unit)
- White surface, large rounded corners, soft border
- Top-down flatlay food photo
- Bowl code name (e.g. "B1") + calorie count as the visual anchor
- Short ingredient list line
- Three macro badges: PROTEIN / CARBS / FAT
- "Tải phần ăn" download/order action on hover or below

**Service card** (homepage top: Ăn tại chỗ / Giao hàng / Catering)
- Minimal — icon or background image, heading, one-line description, single text link

**Testimonial card**
- Name, date, quote, source tag ("Customer from Google" / "Customer from Grabfood")

**News/blog card**
- Image, category tag pill, date, headline, "Đọc thêm" link

## Filters / Pills

Rounded pill tabs used for bowl filtering: Ít calo · Cân bằng · Giàu đạm · Chay. Active state uses primary-colored text/underline; inactive state is muted secondary.

## Step Flow

The "Build your own healthy bowl" section uses a 4-step horizontal flow (Đạm → Tinh bột → Ăn kèm → Xốt), each step numbered ("BƯỚC 1–4") and joined by a thin connecting line — a deliberate nod to the brand's "connection/soulmate" motif.

## Navigation

Top utility bar with store hours/address banner, then a minimal main nav with a language pill switcher (EN/VI) at the far right. No heavy CTA button in the nav itself — ordering actions live inline in page content instead.

Recommended items:
- Tính calories
- Thực đơn
- Về chúng tôi
- Catering
- Cửa hàng
- Blogs

## Badges

Small pill/rounded-rect tags for macro values and blog categories — neutral cream background, deep-green text.

---

# Imagery

Photography should prioritize:
- Top-down flatlay bowl shots on light or wood surfaces
- Visible sous-vide protein (sliced, glossy, never dry-looking)
- Fresh, colorful vegetables and grains
- Soft, natural light
- Occasional romantic/lifestyle shots reinforcing the "soulmate" narrative (shared meals, warm moments)

Avoid:
- Harsh studio lighting
- Oversaturated, artificial color grading
- Cluttered backgrounds that compete with the food

---

# Do's and Don'ts

**Do**
- Keep the accent color to one action per screen.
- Let food photography carry visual weight; keep UI chrome quiet.
- Pair nutrition facts (calories, macros) with warm, conversational copy.
- Use generous whitespace and soft rounded corners throughout.
- Keep the "soulmate/relationship" voice consistent in microcopy.

**Don't**
- Don't introduce a second accent color alongside the orange.
- Don't use harsh drop shadows — keep elevation soft and subtle.
- Don't mix button styles within the same view.
- Don't let nutrition data feel clinical — always frame it warmly.
- Don't overcrowd bowl cards; one clear photo, one clear number (calories) per card.

---

# Overall Experience

A visitor should come away feeling Soumaki is fresh, dependable, and a little romantic about healthy eating — someone who takes the guesswork out of macros while still making the experience feel personal. The interface should support fast decision-making (browse pre-made bowls by filter, or build-your-own step by step) without ever feeling like a spreadsheet.
