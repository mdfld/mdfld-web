# MDFLD Onboarding Flow — Design Spec
**Date:** 2026-03-31
**Branch:** `feature/onboarding` → deployed to `beta.mdfld.co`

---

## Overview

A contextual onboarding system for beta.mdfld.co that guides new users through MDFLD's key flows using spotlight/tooltip tours and progress checklists. Users do not choose a role at signup — onboarding is context-triggered based on which pages and features they access.

---

## Architecture

### Pattern
- **Spotlight tours** — auto-start on first visit for new users; re-triggerable via a "?" button for existing users
- **Progress checklists** — persistent panel on Dashboard (buyer) and Org Setup (seller), visible until all steps complete

### Components

#### 1. DB — `onboardingState` JSON column on `User`
Added via Prisma migration. Stores completed step IDs and seen tour IDs.

```json
{
  "buyer": ["verify-email", "browse-shop"],
  "seller": [],
  "tours": ["dashboard", "bag"]
}
```

#### 2. API Routes
- `GET /api/onboarding` — returns the current user's `onboardingState`
- `PATCH /api/onboarding` — accepts `{ step?: string, stepType?: 'buyer' | 'seller', tour?: string }` and appends to the appropriate array. `stepType` is required when `step` is provided.

#### 3. `OnboardingProvider` (React context)
Wraps the app at the layout level. Fetches state on mount, exposes:

| Method | Description |
|---|---|
| `state` | Current `onboardingState` object |
| `completeStep(id)` | Marks a buyer or seller checklist step done, PATCHes API |
| `markTourSeen(pageId)` | Records a tour as viewed, PATCHes API |
| `shouldShowTour(pageId)` | Returns `true` if user is new and tour hasn't been seen |

#### 4. `onboarding-tours.config.ts`
Single config file defining every tour — page ID, element selectors to spotlight, tooltip copy, step order. Adding a new tour requires only editing this file; no page component changes needed.

#### 5. Feature Flag
`NEXT_PUBLIC_ONBOARDING_ENABLED=true` env var. When `false`, `OnboardingProvider` renders children only (no-op). Allows the feature to be merged to `main` and toggled off until production-ready.

---

## Data Model

```prisma
model User {
  // ... existing fields
  onboardingState Json? @default("{\"buyer\":[],\"seller\":[],\"tours\":[]}")
}
```

---

## Page Flows

### 1. Post Sign-Up
**Trigger:** Immediately after account creation, before redirect to dashboard.
**Type:** 3-slide welcome modal (not a spotlight tour — no page elements to highlight yet)

| Slide | Content |
|---|---|
| 1 | "Welcome to MDFLD. Every boot on this platform is verified authentic." |
| 2 | "Browse, buy, and track your orders — or set up a store and start selling." |
| 3 | "Let's get you started." → CTA: "Go to Dashboard" |

Skippable at any point. Completion sets `tours.signup = true`.

---

### 2. Dashboard Home — Buyer Checklist
**Trigger:** First dashboard visit.

**Spotlight tour (auto-starts first, then checklist renders):**
1. Spotlight nav → "Your orders, returns, and wishlist live here"
2. Spotlight checklist panel → "Complete these to get the most out of MDFLD"
3. Spotlight settings → "Manage your account and notifications here"

**Buyer checklist steps (in order):**

| ID | Step | Auto-complete trigger |
|---|---|---|
| `verify-email` | Verify Email | Email verification link clicked |
| `complete-profile` | Complete Your Profile | Profile save action |
| `browse-shop` | Browse the Shop | First visit to `/shop` |
| `first-wishlist` | Save a Boot to Wishlist | First wishlist add |
| `understand-auth` | Learn How Authentication Works | Bag/Checkout spotlight tour completed |
| `place-order` | Place Your First Order *(bonus)* | First order placed |

Checklist panel collapses once all non-bonus steps complete. "?" button always available to re-trigger tour.

---

### 3. Bag / Checkout
**Trigger:** First time user adds an item to bag or lands on `/checkout`.

**Spotlight tour (2 steps):**
1. Spotlight auth badge on item → "Every item ships with a verified authentic certificate"
2. Spotlight buyer protection note → "Your purchase is protected — full refund if authentication fails"

Completing a purchase auto-marks `place-order` in buyer checklist.

---

### 4. Returns
**Trigger:** First visit to `/dashboard/returns`.

**Spotlight tour (2 steps):**
1. Spotlight returns policy summary → "Returns accepted within 3 days of delivery if item differs from listing"
2. Spotlight initiate return button → "Start a return here — our team reviews every case within 48 hours"

---

### 5. Connect / Inbox
**Trigger:** First visit to `/dashboard/inbox`.

**Spotlight tour (2 steps):**
1. Spotlight conversation list → "Message sellers directly about listings, sizing, or condition"
2. Spotlight response time indicator → "Sellers are expected to respond within 24 hours"

---

### 6. Organization Setup — Seller Checklist
**Trigger:** When a user initiates org creation (not shown to all users).

**Seller checklist steps (sequential unlock):**

| ID | Step | Notes |
|---|---|---|
| `org-name-bio` | Add Store Name & Bio | Required first |
| `org-logo` | Upload Logo / Banner | Optional — does not block progression |
| `payout-method` | Set Up Payout Method | Unlocks after `org-name-bio` |
| `return-policy` | Set Return Policy | Unlocks after `org-name-bio` |
| `list-product` | List Your First Product | Final step — unlocks after payout + policy |

Checklist renders in the org setup sidebar and persists in the org dashboard until complete.

---

### 7. Organization Profile / Storefront
**Trigger:** First time a seller views their own storefront preview.

**Spotlight tour (2 steps):**
1. Spotlight storefront header → "This is what buyers see when they visit your store"
2. Spotlight listings section → "Your active listings appear here — keep them accurate and up to date"

Viewing this page is tracked as `tours.org-profile = true` — not a checklist step but used to confirm the seller has previewed their storefront.

---

## Spotlight Tour UI

- Dim overlay behind all non-spotlighted elements
- Highlighted element receives a visible ring/glow
- Tooltip positioned adjacent to element (auto-flips if near viewport edge)
- Controls: Back / Next / Skip tour
- Keyboard: arrow keys to navigate, Escape to skip
- "?" button fixed in bottom-right of each tour-enabled page — re-triggers tour on click

---

## Testing Branch

- Branch: `feature/onboarding`
- Deployed to: `beta.mdfld.co`
- Feature flag: `NEXT_PUBLIC_ONBOARDING_ENABLED=true` set in beta environment only
- Production (`mdfld.co`) keeps flag `false` until onboarding is approved for launch

---

## Out of Scope

- Shop / Browse page (no tour — discovery is self-evident)
- Product Detail Page tour (auth badge explained via bag/checkout tour instead)
- Orders page tour
- Wishlist page tour
- Dashboard Settings tour
- Admin panel onboarding
- Mobile-specific layout adjustments (handled separately)
