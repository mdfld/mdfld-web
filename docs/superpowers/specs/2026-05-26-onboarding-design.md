# Onboarding Design — New User Experience

**Date:** 2026-05-26
**Approach:** Progressive Disclosure

---

## Overview

New users sign up and are guided through a lightweight welcome wizard, then land in the dashboard where incremental checklists and contextual tooltips guide them to complete their account and (optionally) set up a seller store. Steps auto-complete when the user naturally takes each action — no manual "mark complete" buttons.

The entire system is gated by `NEXT_PUBLIC_ONBOARDING_ENABLED=true`. This must be set to `true` in production for anything here to fire.

---

## 1. Enhanced Welcome Wizard

**File:** `components/onboarding/welcome-modal.tsx`
**Triggered:** `app/(dashboard)/layout.tsx` — rendered once when `shouldShowTour("signup")` returns true.

The existing `WelcomeModal` is currently dead code (defined but never rendered). It gets mounted in the dashboard layout so it fires on the user's first dashboard visit regardless of which page they land on.

The SLIDES array is extended from 3 to 5:

| Slide | Title | Content | Changes |
|---|---|---|---|
| 1 | Welcome to MDFLD. | Verified authentic platform intro | Existing |
| 2 | Buy, track, and sell. | Platform overview | Existing |
| 3 | Let's get you started. | Checklist preview | Existing |
| 4 | Set up your profile. | Avatar picker + optional bio input | **New** |
| 5 | What brings you here? | Multi-select role selection | **New** |

**Slide 4 — Profile Setup:**
- Renders the `PROFILE_TEMPLATES` icon grid (reused from `ProfileSetting`)
- Optional bio textarea — skippable
- On "Next": calls `authClient.updateUser({ image, bio })` if values were entered
- On skip: advances without saving

**Slide 5 — Role Selection:**
- Two toggle cards: "I'm here to buy" and "I also want to sell"
- Multi-select — both can be selected simultaneously
- At least one must be selected to enable "Go to Dashboard"
- "I'm here to buy" is pre-selected by default
- On close: calls `PATCH /api/onboarding` with `sellerOptIn: true` if seller was selected, then `markTourSeen("signup")`

---

## 2. State — OnboardingState Type

**File:** `types/onboarding.ts`

Add `sellerOptIn: boolean` to `OnboardingState`:

```ts
export interface OnboardingState {
  buyer: BuyerStepId[];
  seller: SellerStepId[];
  tours: TourPageId[];
  sellerOptIn: boolean; // new
}

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  buyer: [],
  seller: [],
  tours: [],
  sellerOptIn: false, // new
};
```

**File:** `app/api/onboarding/route.ts`

- `parseState` updated to read `sellerOptIn` from stored JSON
- PATCH handler updated to accept `sellerOptIn: boolean` in request body
- `OnboardingContext` updated to expose `sellerOptIn` and a `setSellerOptIn` action

**Seller checklist steps** (updated — `payout-method` replaced with `payout-details`):

```ts
export type SellerStepId =
  | 'org-name-bio'
  | 'org-logo'
  | 'payout-details'   // replaces payout-method
  | 'return-policy'
  | 'list-product';

export const SELLER_CHECKLIST: ChecklistStep[] = [
  { id: 'org-name-bio',    label: 'Add Store Name & Bio' },
  { id: 'org-logo',        label: 'Upload Logo / Banner', optional: true },
  { id: 'payout-details',  label: 'Add Payout Details' },
  { id: 'return-policy',   label: 'Set Return Policy' },
  { id: 'list-product',    label: 'List Your First Product' },
];
```

**Lock logic update in `ChecklistPanel`:** `list-product` unlocks when both `payout-details` and `return-policy` are complete (previously `payout-method` + `return-policy`).

---

## 3. Dashboard Onboarding Surfaces

**File:** `app/(dashboard)/dashboard/page.tsx` and `components/onboarding/checklist-panel.tsx`

### 3a. Buyer Checklist — Action Links

Each `ChecklistStep` gets an optional `href` field. Checklist items render a "Go →" link for incomplete steps:

```ts
export interface ChecklistStep {
  id: BuyerStepId | SellerStepId;
  label: string;
  optional?: boolean;
  href?: string; // new — deep link to complete the step
}
```

| Step | href |
|---|---|
| verify-email | `/dashboard/settings?tab=account` |
| complete-profile | `/dashboard/settings?tab=profile` |
| browse-shop | `/shop` |
| first-wishlist | `/shop` |
| understand-auth | `/shop` |
| place-order | `/shop` |
| org-name-bio | `/dashboard/organization/settings` |
| payout-details | `/dashboard/organization/settings?tab=payout` |
| return-policy | `/dashboard/organization/settings?tab=policy` |
| list-product | `/dashboard/organization/listings` |

### 3b. Seller Checklist Panel

The dashboard page currently renders `<ChecklistPanel type="buyer" />` only. When `sellerOptIn` is true, also render `<ChecklistPanel type="seller" />` below the buyer panel.

### 3c. "Want to Sell?" Nudge Card

**Component:** `components/onboarding/seller-nudge-card.tsx` (new)

Shown when: `!sellerOptIn && !nudgeDismissed`

- Dashed border card below the buyer checklist
- "Want to sell on MDFLD?" heading + short copy
- "Get started" button: calls `setSellerOptIn(true)` and navigates to `/dashboard/organization/settings`
- "Dismiss" link: calls `markTourSeen('seller-nudge')` — reuses the existing tours array, persists across devices. Add `'seller-nudge'` to the `TourPageId` union.

### 3d. $500 Tax Tier Banner

**Component:** `components/onboarding/tax-tier-banner.tsx` (new)

Shown when: seller's calendar-year earnings cross $500.

- Amber warning banner at top of dashboard
- "Tax information required" heading
- Three checklist items: legal name, business address, EIN or SSN
- "Payouts are paused until this is complete" notice
- Each item links to a dedicated tax info form (designed in a future session alongside the payout flow)
- The $500 threshold is detected server-side on each order settlement and stored as a flag on the user/org record

---

## 4. Settings — Profile Tab

**File:** `components/dashboard/settings/profile-setting.tsx`

### 4a. Remove Website Field

The `website` field is removed entirely from:
- The form UI
- The `formData` state
- The `handleUpdateProfile` diff check
- The `authClient.updateUser()` call

Rationale: MDFLD does not want to encourage off-platform transactions.

### 4b. Profile Completeness Bar

A `ProfileCompletenessBar` component renders above the form fields. It calculates a percentage based on 4 fields:

| Field | Points |
|---|---|
| Avatar (actively changed — explicit template pick in settings or custom upload; auto-assigned random icon does not count) | 25% |
| Bio | 25% |
| Location | 25% |
| Banner | 25% |

Bar color: amber below 75%, green at 100%. All new users start at 0% since their auto-assigned avatar does not count until explicitly confirmed.

### 4c. Per-Field Hints

Bio and Location fields get onboarding hints when empty:
- Dashed amber border on the input
- "recommended" badge next to the label
- One-line micro-copy below the input explaining why it matters:
  - Bio: "Profiles with a bio get more trust from buyers."
  - Location: "Helps buyers know where their order ships from."

Hints disappear once the field has a value.

### 4d. Auto-Complete `complete-profile` Step

In `handleUpdateProfile()`, after a successful save, check:

```ts
if (formData.bio && formData.location) {
  completeStep('complete-profile', 'buyer');
}
```

---

## 5. Step Auto-Detection Map

All hooks call `completeStep(stepId, stepType)` from `OnboardingContext`. The context is already wired to the API and DB — no new infrastructure needed.

| Step | Trigger location | Event |
|---|---|---|
| `verify-email` | Auth callback / email-verified handler | Email verification confirmed |
| `complete-profile` | `handleUpdateProfile()` success | Bio + location both present after save |
| `browse-shop` | `useEffect` in shop page | First visit (state-gated) |
| `first-wishlist` | Wishlist mutation success handler | First item added |
| `understand-auth` | `useEffect` in product detail page | First product page view |
| `place-order` | Order confirmation page `useEffect` | Order confirmed |
| `org-name-bio` | Org settings save success | Name + bio saved |
| `org-logo` | Logo upload success callback | Logo uploaded |
| `return-policy` | Return policy save success | Policy saved |
| `list-product` | Product create/publish mutation success | First product published |

**Tax tier trigger** (medium effort — separate from the checklist system):
- On each order settlement, the server checks the seller's calendar-year earnings total
- If it crosses $500 for the first time, a `taxTierReached: true` flag is set on the org/user record
- Dashboard reads this flag to show the tax tier banner

---

## 6. Files Changed Summary

| File | Change |
|---|---|
| `types/onboarding.ts` | Add `sellerOptIn: boolean` to state; update `SellerStepId` and `SELLER_CHECKLIST`; add `href` to `ChecklistStep`; add `'seller-nudge'` to `TourPageId` |
| `app/api/onboarding/route.ts` | Handle `sellerOptIn` in GET/PATCH |
| `contexts/onboarding-context.tsx` | Expose `sellerOptIn` and `setSellerOptIn` |
| `components/onboarding/welcome-modal.tsx` | Add slides 4 and 5 |
| `app/(dashboard)/layout.tsx` | Render `WelcomeModal` gated by `shouldShowTour("signup")` |
| `app/(dashboard)/dashboard/page.tsx` | Render seller checklist panel when `sellerOptIn`; render seller nudge card |
| `components/onboarding/checklist-panel.tsx` | Render "Go →" links; update lock logic for `list-product` |
| `components/onboarding/seller-nudge-card.tsx` | New component |
| `components/onboarding/tax-tier-banner.tsx` | New component |
| `components/dashboard/settings/profile-setting.tsx` | Remove website field; add completeness bar; add field hints; add auto-detection hook |

---

## Out of Scope (Next Session)

- EasyPost shipping label integration
- Payout flow design (Stripe Connect Custom accounts)
- "Add payout details" form UI for sellers
- Tax info form UI (legal name, address, EIN/SSN)
- $500 threshold server-side detection implementation
