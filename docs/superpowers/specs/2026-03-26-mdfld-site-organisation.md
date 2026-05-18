# MDFLD Site Organisation — Design Spec
**Date:** 2026-03-26
**Branch:** feature/admin-rbac-mor

---

## 1. Homepage

### 1.1 HeroSection
- Replace 4 category cards (OUTERWEAR, FOOTWEAR, ACCESSORIES, ARCHIVE) with: **Kits, Boots, Accessories, Goalkeeper**
- Images (copy to `/public/categories/`):
  - Kits → `/Users/ayoola/Desktop/MDFLD/Kits Image.jpeg`
  - Boots → `/Users/ayoola/Desktop/MDFLD/Boots Image.jpg`
  - Accessories → `/Users/ayoola/Desktop/MDFLD/Accessories Image.jpg`
  - Goalkeeper → `/Users/ayoola/Desktop/MDFLD/Goalkeeper Image.webp`
- Each "Explore" button links to `/shop` with the appropriate category query param:
  - Kits → `/shop?category=JERSEYS`
  - Boots → `/shop?category=BOOTS`
  - Accessories → `/shop?category=ACCESSORIES`
  - Goalkeeper → `/shop?category=GOALKEEPER_GLOVES`

### 1.2 Join the Community Section
- Update to include 3 CTAs:
  - **Mdfld FC** — links to Discord: `https://discord.gg/pW87DDjZ`
  - **2025 Mdfld Cup** — links to MDFLD Instagram: `https://www.instagram.com/mdfldmarketplace/`
  - **Follow us on Instagram** — links to `https://www.instagram.com/mdfldmarketplace/`
- Remove any blue line/border in this section

### 1.3 Featured/Boosted Section
- Rename "Sale" label to **"Featured Drops"**
- Products displayed are admin-marked featured products (new `isFeatured` boolean on Product model)
- Display rotates through featured products every 12hrs (client-side interval or server-side timestamp bucketing)
- Admin panel gets a toggle to mark/unmark products as featured

### 1.4 Hide Reviews/Testimonials
- Hide the Testimonials section from the homepage (comment out, not delete)

### 1.5 "Shop All" Links
- Any button/link with "Shop All" intent that currently points to `/` or `/home` should point to `/shop`

---

## 2. Footer

### 2.1 Social Icons
- Remove: Facebook, YouTube
- Add: LinkedIn (`https://www.linkedin.com/in/ayoolamorakinyo/`), Discord (`https://discord.gg/pW87DDjZ`)
- Keep: Instagram (`https://www.instagram.com/mdfldmarketplace/`), X (`https://x.com/mdfldmp`)

### 2.2 Logo
- Copy `mdfld-logo-v2.png` from Desktop to `/public/mdfld-logo-v2.png`
- Add to footer brand column above the tagline

### 2.3 Newsletter
- Wire existing subscribe form to `POST /api/newsletter`
- `/api/newsletter` sends an email to `ayoola@mdfld.co` containing the subscriber's email address
- Uses same email transport as `/api/contact`

### 2.4 Account Column
- Remove "Addresses" link from the Account nav column

---

## 3. Brands/Teams Pages

- Add a client-side search input at the top of `/brands` and `/orgs/[organization]` pages
- Filters results by name as user types (no API call, filters already-loaded list)

---

## 4. About Page

### 4.1 Stats (Live Counters)
All three dynamic stats use a count-up animation on mount and fetch from API:

| Stat heading | Data source | API endpoint |
|---|---|---|
| Caps | Lifetime total sales count | `/api/meta/salesCount` (new) |
| Active Players | Registered user count | `/api/meta/userCount` (existing) |
| Verified Products | Live product count | `/api/meta/productCount` (existing) |
| Countries Served | Static | Static "150+" |

- New `/api/meta/salesCount` endpoint: queries `Order` table for total completed order count
- Count-up animation: increments from 0 to final value over ~1.5s on page load

### 4.2 Values
- Update "Fair for Sellers" card copy to **"Fair for EVERYONE"**

### 4.3 Team
Replace current team with:
| Name | Role |
|---|---|
| Ayoola Morakinyo | Founder & CEO |
| Kayla Bloom | Co-Founder & CMO |
| Ryan Walden | Board Advisor |
| Aman Rathore | Lead Engineer |

### 4.4 Copy
- Ensure "MDFLD" is capitalised consistently throughout the page (no "Mdfld")

---

## 5. Product Page — Report/Flag Button

### 5.1 UI
- Add a "Report" button (using `material-symbols:flag-outline` Iconify icon) below the main product actions
- Clicking opens a modal with:
  - Heading: "Report this listing"
  - Optional textarea: "Why does this seem suspicious?" (max 500 chars)
  - Submit and Cancel buttons

### 5.2 API
- `POST /api/products/[id]/report`
- Increments `flagCount` on the Product record
- Creates a `ProductReport` record with: productId, userId (if authenticated), reason, timestamp
- Sends email notification to `ayoola@mdfld.co` with product ID, reporter info, and reason

### 5.3 Prisma Schema
```prisma
// Add to Product model:
flagCount    Int            @default(0)
reports      ProductReport[]

model ProductReport {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  userId    String?
  reason    String?
  createdAt DateTime @default(now())
}
```

### 5.4 Admin Panel
- Add `flagCount` column to the admin products table
- Sortable so admins can surface the most-flagged products

---

## 6. Contact Page

### 6.1 Email Delivery Fix
- Audit `/api/contact` route — verify SMTP credentials are present in `.env` and the send call is correctly awaited
- Fix any broken email transport so form submissions deliver to `support@mdfld.co`

### 6.2 Location
- Update sidebar location from "London, UK" to **Atlanta, GA**
- Remove any displayed hours/timeframe

---

## 7. Out of Scope
- "Chicken/" team photos — deferred
- Seller boost payments (Option C) — deferred until traction
- Join the Community as a dedicated page — exists as section only
