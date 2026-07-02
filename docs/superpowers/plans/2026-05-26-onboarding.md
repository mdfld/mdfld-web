# Onboarding — New User Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing onboarding system with a 5-step welcome wizard, buyer/seller dashboard checklists with deep links, profile completeness tooltips, and step auto-detection hooks.

**Architecture:** Progressive disclosure — a lightweight wizard on first login collects avatar/bio and role preference, then incremental checklist panels and contextual hints in the dashboard and settings guide users to completion. All state persists in `user.onboardingState` via the existing `/api/onboarding` route. Steps auto-complete when users naturally take each action.

**Tech Stack:** Next.js 14 (App Router), TypeScript, HeroUI, Vitest, tRPC, better-auth, Prisma

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `types/onboarding.ts` | Modify | Add `sellerOptIn`, update `SellerStepId`, add `href` to `ChecklistStep`, add `'seller-nudge'` to `TourPageId` |
| `app/api/onboarding/route.ts` | Modify | Handle `sellerOptIn` in GET/PATCH |
| `contexts/onboarding-context.tsx` | Modify | Expose `sellerOptIn` and `setSellerOptIn` |
| `components/onboarding/welcome-modal.tsx` | Modify | Add slides 4 (profile setup) and 5 (role multi-select) |
| `app/(dashboard)/layout.tsx` | Modify | Render `WelcomeModalController` — client wrapper that gates modal on `shouldShowTour('signup')` |
| `components/onboarding/welcome-modal-controller.tsx` | Create | Thin client component: reads context, manages `isOpen`, renders `WelcomeModal` |
| `components/onboarding/checklist-panel.tsx` | Modify | Render "Go →" deep links per step; update `list-product` lock logic |
| `components/onboarding/seller-nudge-card.tsx` | Create | Dismissible "Want to sell?" card for buyer-only users |
| `components/onboarding/tax-tier-banner.tsx` | Create | Amber banner shown when seller earnings cross $500 |
| `app/(dashboard)/dashboard/page.tsx` | Modify | Render seller checklist, nudge card, and tax tier banner |
| `components/dashboard/settings/profile-completeness-bar.tsx` | Create | Extracted completeness bar — pure component, easy to test |
| `components/dashboard/settings/profile-setting.tsx` | Modify | Remove website field; render completeness bar; add field hints; hook `completeStep` on save |
| `__tests__/api/onboarding.test.ts` | Modify | Add `sellerOptIn` GET/PATCH tests |
| `__tests__/lib/onboarding-types.test.ts` | Create | Test constants: `BUYER_CHECKLIST` hrefs, `SELLER_CHECKLIST` steps, `EMPTY_ONBOARDING_STATE` shape |
| `__tests__/components/profile-completeness-bar.test.ts` | Create | Test percentage logic |
| `__tests__/components/seller-nudge-card.test.ts` | Create | Test render and dismiss |
| `__tests__/components/tax-tier-banner.test.ts` | Create | Test render |

---

## Task 1: Update `types/onboarding.ts`

**Files:**
- Modify: `types/onboarding.ts`
- Create: `__tests__/lib/onboarding-types.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/onboarding-types.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  EMPTY_ONBOARDING_STATE,
  BUYER_CHECKLIST,
  SELLER_CHECKLIST,
} from "@/types/onboarding";

describe("EMPTY_ONBOARDING_STATE", () => {
  it("has sellerOptIn as false", () => {
    expect(EMPTY_ONBOARDING_STATE.sellerOptIn).toBe(false);
  });

  it("has empty buyer, seller, and tours arrays", () => {
    expect(EMPTY_ONBOARDING_STATE.buyer).toEqual([]);
    expect(EMPTY_ONBOARDING_STATE.seller).toEqual([]);
    expect(EMPTY_ONBOARDING_STATE.tours).toEqual([]);
  });
});

describe("BUYER_CHECKLIST", () => {
  it("every step has an href", () => {
    for (const step of BUYER_CHECKLIST) {
      expect(step.href).toBeTruthy();
    }
  });

  it("complete-profile href points to profile settings", () => {
    const step = BUYER_CHECKLIST.find((s) => s.id === "complete-profile")!;
    expect(step.href).toBe("/dashboard/settings?tab=profile");
  });
});

describe("SELLER_CHECKLIST", () => {
  it("contains payout-details step (not payout-method)", () => {
    const ids = SELLER_CHECKLIST.map((s) => s.id);
    expect(ids).toContain("payout-details");
    expect(ids).not.toContain("payout-method");
  });

  it("list-product is the last step", () => {
    expect(SELLER_CHECKLIST[SELLER_CHECKLIST.length - 1].id).toBe("list-product");
  });

  it("org-logo is marked optional", () => {
    const step = SELLER_CHECKLIST.find((s) => s.id === "org-logo")!;
    expect(step.optional).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/lib/onboarding-types.test.ts
```

Expected: all 6 tests fail.

- [ ] **Step 3: Update `types/onboarding.ts`**

Replace the entire file:

```ts
export interface OnboardingState {
  buyer: BuyerStepId[];
  seller: SellerStepId[];
  tours: TourPageId[];
  sellerOptIn: boolean;
}

export type BuyerStepId =
  | 'verify-email'
  | 'complete-profile'
  | 'browse-shop'
  | 'first-wishlist'
  | 'understand-auth'
  | 'place-order';

export type SellerStepId =
  | 'org-name-bio'
  | 'org-logo'
  | 'payout-details'
  | 'return-policy'
  | 'list-product';

export type TourPageId =
  | 'signup'
  | 'dashboard'
  | 'bag'
  | 'checkout'
  | 'returns'
  | 'connect'
  | 'org-setup'
  | 'org-profile'
  | 'seller-nudge';

export interface ChecklistStep {
  id: BuyerStepId | SellerStepId;
  label: string;
  optional?: boolean;
  href?: string;
}

export interface TourStep {
  selector: string;
  title: string;
  body: string;
}

export interface TourDefinition {
  pageId: TourPageId;
  steps: TourStep[];
}

export const BUYER_CHECKLIST: ChecklistStep[] = [
  { id: 'verify-email',     label: 'Verify Email',                   href: '/dashboard/settings?tab=account' },
  { id: 'complete-profile', label: 'Complete Your Profile',          href: '/dashboard/settings?tab=profile' },
  { id: 'browse-shop',      label: 'Browse the Shop',                href: '/shop' },
  { id: 'first-wishlist',   label: 'Save a Boot to Wishlist',        href: '/shop' },
  { id: 'understand-auth',  label: 'Learn How Authentication Works', href: '/shop' },
  { id: 'place-order',      label: 'Place Your First Order',         href: '/shop', optional: true },
];

export const SELLER_CHECKLIST: ChecklistStep[] = [
  { id: 'org-name-bio',   label: 'Add Store Name & Bio',      href: '/dashboard/organization/settings' },
  { id: 'org-logo',       label: 'Upload Logo / Banner',      href: '/dashboard/organization/settings', optional: true },
  { id: 'payout-details', label: 'Add Payout Details',        href: '/dashboard/organization/settings?tab=payout' },
  { id: 'return-policy',  label: 'Set Return Policy',         href: '/dashboard/organization/settings?tab=policy' },
  { id: 'list-product',   label: 'List Your First Product',   href: '/dashboard/organization/listings' },
];

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  buyer: [],
  seller: [],
  tours: [],
  sellerOptIn: false,
};
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/lib/onboarding-types.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Run full suite — ensure no regressions**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all existing tests pass. The `onboarding-tours.test.ts` `REQUIRED_TOUR_IDS` list doesn't include `'seller-nudge'` so that test still passes. If `onboarding.test.ts` fails because GET now returns `sellerOptIn: false`, fix those assertions in the next task.

- [ ] **Step 6: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add types/onboarding.ts __tests__/lib/onboarding-types.test.ts && git commit -m "feat: update onboarding types — add sellerOptIn, payout-details, hrefs, seller-nudge tour id"
```

---

## Task 2: Update API Route for `sellerOptIn`

**Files:**
- Modify: `app/api/onboarding/route.ts`
- Modify: `__tests__/api/onboarding.test.ts`

- [ ] **Step 1: Add failing tests for `sellerOptIn`**

Append to `__tests__/api/onboarding.test.ts` (add after the existing PATCH describe block):

```ts
describe("GET /api/onboarding — sellerOptIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns sellerOptIn: false when absent from stored state", async () => {
    const existing = { buyer: [], seller: [], tours: [] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: existing } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(data.sellerOptIn).toBe(false);
  });

  it("returns sellerOptIn: true when set in stored state", async () => {
    const existing = { buyer: [], seller: [], tours: [], sellerOptIn: true };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: existing } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(data.sellerOptIn).toBe(true);
  });
});

describe("PATCH /api/onboarding — sellerOptIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets sellerOptIn to true when patched", async () => {
    const current = { buyer: [], seller: [], tours: [], sellerOptIn: false };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    const res = await PATCH(makeRequest("PATCH", { sellerOptIn: true }) as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: [], seller: [], tours: [], sellerOptIn: true },
        },
      }),
    );
  });

  it("does not unset sellerOptIn when not included in patch body", async () => {
    const current = { buyer: [], seller: [], tours: [], sellerOptIn: true };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { tour: "dashboard" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: [], seller: [], tours: ["dashboard"], sellerOptIn: true },
        },
      }),
    );
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/api/onboarding.test.ts
```

Expected: the 4 new tests fail. Existing tests may also fail since GET no longer returns `sellerOptIn`.

- [ ] **Step 3: Update `app/api/onboarding/route.ts`**

Replace the entire file:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPTY_ONBOARDING_STATE } from "@/types/onboarding";
import type { OnboardingState } from "@/types/onboarding";

function parseState(raw: unknown): OnboardingState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ONBOARDING_STATE };
  const s = raw as Partial<OnboardingState>;
  return {
    buyer: Array.isArray(s.buyer) ? s.buyer : [],
    seller: Array.isArray(s.seller) ? s.seller : [],
    tours: Array.isArray(s.tours) ? s.tours : [],
    sellerOptIn: typeof s.sellerOptIn === "boolean" ? s.sellerOptIn : false,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingState: true },
  });

  return NextResponse.json(parseState(user?.onboardingState));
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { step, stepType, tour, sellerOptIn } = body as {
    step?: string;
    stepType?: "buyer" | "seller";
    tour?: string;
    sellerOptIn?: boolean;
  };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingState: true },
  });

  const state = parseState(user?.onboardingState);

  if (step && stepType === "buyer" && !state.buyer.includes(step as any)) {
    state.buyer = [...state.buyer, step as any];
  }
  if (step && stepType === "seller" && !state.seller.includes(step as any)) {
    state.seller = [...state.seller, step as any];
  }
  if (tour && !state.tours.includes(tour as any)) {
    state.tours = [...state.tours, tour as any];
  }
  if (sellerOptIn === true) {
    state.sellerOptIn = true;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingState: state as any },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Update existing GET tests that assert `{ buyer: [], seller: [], tours: [] }`**

In `__tests__/api/onboarding.test.ts`, find the test "returns empty state when user has no onboardingState" and update its assertion:

```ts
expect(data).toEqual({ buyer: [], seller: [], tours: [], sellerOptIn: false });
```

Also update "returns existing state when present" — its `existing` object doesn't have `sellerOptIn`, so after `parseState` it will be `false`. The response will include `sellerOptIn: false`. Update the expected value to include `sellerOptIn: false`.

- [ ] **Step 5: Run tests — expect all pass**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/api/onboarding.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add app/api/onboarding/route.ts __tests__/api/onboarding.test.ts && git commit -m "feat: onboarding API handles sellerOptIn in GET and PATCH"
```

---

## Task 3: Update `OnboardingContext` — expose `sellerOptIn` and `setSellerOptIn`

**Files:**
- Modify: `contexts/onboarding-context.tsx`

No unit test for the context itself (it's a React context — test it through components that consume it). Verify via TypeScript compilation.

- [ ] **Step 1: Update `contexts/onboarding-context.tsx`**

Replace the interface and provider. Key changes: add `sellerOptIn` computed from `state.sellerOptIn`, add `setSellerOptIn` action.

```ts
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { EMPTY_ONBOARDING_STATE } from "@/types/onboarding";
import type { OnboardingState } from "@/types/onboarding";

interface OnboardingContextValue {
  state: OnboardingState;
  isLoading: boolean;
  completeStep: (id: string, stepType: "buyer" | "seller") => Promise<void>;
  markTourSeen: (pageId: string) => Promise<void>;
  shouldShowTour: (pageId: string) => boolean;
  setSellerOptIn: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const noopValue: OnboardingContextValue = {
  state: { ...EMPTY_ONBOARDING_STATE },
  isLoading: false,
  completeStep: async () => {},
  markTourSeen: async () => {},
  shouldShowTour: () => false,
  setSellerOptIn: async () => {},
};

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === "true";
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState>({ ...EMPTY_ONBOARDING_STATE });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data: OnboardingState) => setState(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const completeStep = useCallback(
    async (id: string, stepType: "buyer" | "seller") => {
      setState((prev) => {
        if ((prev[stepType] as string[]).includes(id)) return prev;
        return { ...prev, [stepType]: [...prev[stepType], id as any] };
      });
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: id, stepType }),
      });
    },
    [],
  );

  const markTourSeen = useCallback(
    async (pageId: string) => {
      setState((prev) => {
        if ((prev.tours as string[]).includes(pageId)) return prev;
        return { ...prev, tours: [...prev.tours, pageId as any] };
      });
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour: pageId }),
      });
    },
    [],
  );

  const shouldShowTour = useCallback(
    (pageId: string) => !isLoading && isAuthenticated && !state.tours.includes(pageId as any),
    [isLoading, isAuthenticated, state.tours],
  );

  const setSellerOptIn = useCallback(async () => {
    setState((prev) => ({ ...prev, sellerOptIn: true }));
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerOptIn: true }),
    });
  }, []);

  if (!enabled) {
    return (
      <OnboardingContext.Provider value={noopValue}>
        {children}
      </OnboardingContext.Provider>
    );
  }

  return (
    <OnboardingContext.Provider value={{ state, isLoading, completeStep, markTourSeen, shouldShowTour, setSellerOptIn }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/ayoola/mdfld-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors related to `onboarding-context.tsx`.

- [ ] **Step 3: Run full suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add contexts/onboarding-context.tsx && git commit -m "feat: onboarding context exposes sellerOptIn state and setSellerOptIn action"
```

---

## Task 4: `SellerNudgeCard` component

**Files:**
- Create: `components/onboarding/seller-nudge-card.tsx`
- Create: `__tests__/components/seller-nudge-card.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/seller-nudge-card.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { SellerNudgeCard } from "@/components/onboarding/seller-nudge-card";

describe("SellerNudgeCard", () => {
  it("renders the heading", () => {
    const result = SellerNudgeCard({ onGetStarted: vi.fn(), onDismiss: vi.fn() });
    expect(JSON.stringify(result)).toContain("Want to sell on MDFLD");
  });

  it("renders a Get started button", () => {
    const result = SellerNudgeCard({ onGetStarted: vi.fn(), onDismiss: vi.fn() });
    expect(JSON.stringify(result)).toContain("Get started");
  });

  it("renders a Dismiss option", () => {
    const result = SellerNudgeCard({ onGetStarted: vi.fn(), onDismiss: vi.fn() });
    expect(JSON.stringify(result)).toContain("Dismiss");
  });
});
```

- [ ] **Step 2: Run test — expect failures**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/components/seller-nudge-card.test.ts
```

Expected: 3 failures — module not found.

- [ ] **Step 3: Create `components/onboarding/seller-nudge-card.tsx`**

```tsx
"use client";

import React from "react";
import { Button } from "@heroui/react";

interface SellerNudgeCardProps {
  onGetStarted: () => void;
  onDismiss: () => void;
}

export function SellerNudgeCard({ onGetStarted, onDismiss }: SellerNudgeCardProps) {
  return (
    <div className="border border-dashed border-divider rounded-xl p-4 bg-content1">
      <p className="text-sm font-semibold mb-1">Want to sell on MDFLD?</p>
      <p className="text-xs text-default-500 mb-3">
        Set up a store and start listing your boots.
      </p>
      <div className="flex items-center gap-3">
        <Button size="sm" color="primary" onPress={onGetStarted}>
          Get started
        </Button>
        <button
          className="text-xs text-default-400 hover:text-default-600 transition-colors"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/components/seller-nudge-card.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add components/onboarding/seller-nudge-card.tsx __tests__/components/seller-nudge-card.test.ts && git commit -m "feat: add SellerNudgeCard component"
```

---

## Task 5: `TaxTierBanner` component

**Files:**
- Create: `components/onboarding/tax-tier-banner.tsx`
- Create: `__tests__/components/tax-tier-banner.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/tax-tier-banner.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TaxTierBanner } from "@/components/onboarding/tax-tier-banner";

describe("TaxTierBanner", () => {
  it("renders the tax information required heading", () => {
    const result = TaxTierBanner({});
    expect(JSON.stringify(result)).toContain("Tax information required");
  });

  it("mentions payouts are paused", () => {
    const result = TaxTierBanner({});
    expect(JSON.stringify(result)).toContain("paused");
  });

  it("lists the three required fields", () => {
    const str = JSON.stringify(TaxTierBanner({}));
    expect(str).toContain("Legal name");
    expect(str).toContain("Business address");
    expect(str).toContain("EIN");
  });
});
```

- [ ] **Step 2: Run test — expect failures**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/components/tax-tier-banner.test.ts
```

Expected: 3 failures — module not found.

- [ ] **Step 3: Create `components/onboarding/tax-tier-banner.tsx`**

```tsx
"use client";

import React from "react";
import { Icon } from "@iconify/react";

export function TaxTierBanner(_props: Record<string, never>) {
  const items = [
    { label: "Legal name",       href: "/dashboard/organization/settings?tab=tax" },
    { label: "Business address", href: "/dashboard/organization/settings?tab=tax" },
    { label: "EIN or SSN (Tax ID)", href: "/dashboard/organization/settings?tab=tax" },
  ];

  return (
    <div className="border border-warning rounded-xl p-4 bg-warning-50 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon="lucide:alert-triangle" className="text-warning" width={16} />
        <p className="text-sm font-semibold text-warning-700">Tax information required</p>
      </div>
      <p className="text-xs text-warning-700 mb-3">
        You've reached $500 in sales this year. US law requires you to complete your tax
        info before your next payout.
      </p>
      <ul className="space-y-1 mb-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-warning-700">
              <Icon icon="lucide:circle" className="text-warning-300" width={12} />
              {item.label}
            </span>
            <a href={item.href} className="text-warning-600 hover:underline text-xs">
              Go →
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-warning-600">Payouts are paused until this is complete.</p>
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/components/tax-tier-banner.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add components/onboarding/tax-tier-banner.tsx __tests__/components/tax-tier-banner.test.ts && git commit -m "feat: add TaxTierBanner component"
```

---

## Task 6: Update `ChecklistPanel` — action links + lock logic

**Files:**
- Modify: `components/onboarding/checklist-panel.tsx`

- [ ] **Step 1: Update `components/onboarding/checklist-panel.tsx`**

Replace the file with the updated version that (a) renders "Go →" links on incomplete steps and (b) updates the `isUnlocked` lock logic for `list-product` to use `payout-details` instead of `payout-method`:

```tsx
"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useOnboarding } from "@/contexts/onboarding-context";
import { BUYER_CHECKLIST, SELLER_CHECKLIST } from "@/types/onboarding";
import type { ChecklistStep } from "@/types/onboarding";

interface ChecklistPanelProps {
  type: "buyer" | "seller";
}

export function ChecklistPanel({ type }: ChecklistPanelProps) {
  const { state } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);

  const steps: ChecklistStep[] = type === "buyer" ? BUYER_CHECKLIST : SELLER_CHECKLIST;
  const completed = (type === "buyer" ? state.buyer : state.seller) as string[];

  function isUnlocked(stepId: string): boolean {
    if (type === "buyer") return true;
    if (stepId === "org-name-bio" || stepId === "org-logo") return true;
    if (stepId === "payout-details" || stepId === "return-policy") {
      return completed.includes("org-name-bio");
    }
    if (stepId === "list-product") {
      return completed.includes("payout-details") && completed.includes("return-policy");
    }
    return true;
  }

  const requiredSteps = steps.filter((s) => !s.optional);
  const requiredCompleted = requiredSteps.filter((s) => completed.includes(s.id));
  const allRequiredDone = requiredCompleted.length === requiredSteps.length;

  if (allRequiredDone) return null;

  const progress = Math.round((requiredCompleted.length / requiredSteps.length) * 100);

  return (
    <div
      className="bg-content1 border border-divider rounded-xl p-4 mb-4"
      data-onboarding="checklist-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">
            {type === "buyer" ? "Get started on MDFLD" : "Set up your store"}
          </h3>
          <p className="text-xs text-default-500">
            {requiredCompleted.length} of {requiredSteps.length} steps complete
          </p>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
        >
          <Icon icon={collapsed ? "lucide:chevron-down" : "lucide:chevron-up"} />
        </Button>
      </div>

      <div className="w-full bg-default-100 rounded-full h-1.5 mb-3">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!collapsed && (
        <ul className="space-y-2">
          {steps.map((step) => {
            const done = completed.includes(step.id);
            const unlocked = isUnlocked(step.id);
            return (
              <li
                key={step.id}
                className={`flex items-center justify-between text-sm ${!unlocked ? "opacity-40" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <Icon
                    icon={done ? "lucide:check-circle" : unlocked ? "lucide:circle" : "lucide:lock"}
                    className={done ? "text-success" : "text-default-400"}
                    width={16}
                  />
                  <span className={done ? "line-through text-default-400" : ""}>
                    {step.label}
                    {step.optional && (
                      <span className="ml-1 text-xs text-default-400">(bonus)</span>
                    )}
                  </span>
                </span>
                {!done && unlocked && step.href && (
                  <Link
                    href={step.href}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Go →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/ayoola/mdfld-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Run full suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add components/onboarding/checklist-panel.tsx && git commit -m "feat: checklist panel adds Go links and updates list-product lock to payout-details"
```

---

## Task 7: `ProfileCompletenessBar` + settings page updates

**Files:**
- Create: `components/dashboard/settings/profile-completeness-bar.tsx`
- Create: `__tests__/components/profile-completeness-bar.test.ts`
- Modify: `components/dashboard/settings/profile-setting.tsx`

- [ ] **Step 1: Write failing tests for completeness bar**

Create `__tests__/components/profile-completeness-bar.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeCompleteness } from "@/components/dashboard/settings/profile-completeness-bar";

describe("computeCompleteness", () => {
  it("returns 0 when all fields empty", () => {
    expect(computeCompleteness({ imageUrl: "/avatars/1.png", bio: "", location: "", bannerUrl: "" })).toBe(0);
  });

  it("counts custom upload avatar (https URL) as 25%", () => {
    expect(computeCompleteness({ imageUrl: "https://utfs.io/f/abc123", bio: "", location: "", bannerUrl: "" })).toBe(25);
  });

  it("does not count auto-assigned template avatar (/avatars/N.png)", () => {
    expect(computeCompleteness({ imageUrl: "/avatars/3.png", bio: "", location: "", bannerUrl: "" })).toBe(0);
  });

  it("counts bio as 25%", () => {
    expect(computeCompleteness({ imageUrl: "", bio: "Football boot collector", location: "", bannerUrl: "" })).toBe(25);
  });

  it("counts location as 25%", () => {
    expect(computeCompleteness({ imageUrl: "", bio: "", location: "Atlanta, GA", bannerUrl: "" })).toBe(25);
  });

  it("counts banner as 25%", () => {
    expect(computeCompleteness({ imageUrl: "", bio: "", location: "", bannerUrl: "https://utfs.io/f/banner" })).toBe(25);
  });

  it("returns 100 when all fields complete", () => {
    expect(computeCompleteness({
      imageUrl: "https://utfs.io/f/abc",
      bio: "Some bio",
      location: "Atlanta, GA",
      bannerUrl: "https://utfs.io/f/banner",
    })).toBe(100);
  });

  it("returns 50 for bio + location", () => {
    expect(computeCompleteness({ imageUrl: "/avatars/1.png", bio: "Bio", location: "ATL", bannerUrl: "" })).toBe(50);
  });
});
```

- [ ] **Step 2: Run test — expect failures**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/components/profile-completeness-bar.test.ts
```

Expected: all 8 fail — module not found.

- [ ] **Step 3: Create `components/dashboard/settings/profile-completeness-bar.tsx`**

```tsx
"use client";

import React from "react";

interface CompletenessInput {
  imageUrl?: string;
  bio?: string;
  location?: string;
  bannerUrl?: string;
}

export function computeCompleteness({ imageUrl, bio, location, bannerUrl }: CompletenessInput): number {
  let score = 0;
  if (imageUrl?.startsWith("https://")) score += 25;
  if (bio?.trim()) score += 25;
  if (location?.trim()) score += 25;
  if (bannerUrl?.trim()) score += 25;
  return score;
}

interface ProfileCompletenessBarProps {
  imageUrl?: string;
  bio?: string;
  location?: string;
  bannerUrl?: string;
}

export function ProfileCompletenessBar({ imageUrl, bio, location, bannerUrl }: ProfileCompletenessBarProps) {
  const pct = computeCompleteness({ imageUrl, bio, location, bannerUrl });
  const isComplete = pct === 100;

  return (
    <div className={`border rounded-xl p-3 mb-4 ${isComplete ? "border-success bg-success-50" : "border-divider bg-content2"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold">Profile completeness</span>
        <span className={`text-xs font-semibold ${isComplete ? "text-success" : "text-default-500"}`}>
          {pct}%{isComplete && " ✓"}
        </span>
      </div>
      <div className="w-full bg-default-100 rounded-full h-1.5 mb-1">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${pct >= 75 ? "bg-success" : "bg-warning"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!isComplete && (
        <p className="text-xs text-default-400">
          {pct < 50
            ? "Add a bio and location to strengthen your profile."
            : "Almost there — add a banner to complete your profile."}
        </p>
      )}
      {isComplete && (
        <p className="text-xs text-success">"Complete your profile" step marked done in your checklist.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/components/profile-completeness-bar.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 5: Update `components/dashboard/settings/profile-setting.tsx`**

Three changes: (a) remove `website` from the form, (b) add `ProfileCompletenessBar`, (c) call `completeStep` after successful save.

Remove `website` from `formData` state:
```ts
// Before
const [formData, setFormData] = React.useState({
  location: "",
  bio: "",
  website: "",
});

// After
const [formData, setFormData] = React.useState({
  location: "",
  bio: "",
});
```

Add import at top of file:
```ts
import { ProfileCompletenessBar } from "@/components/dashboard/settings/profile-completeness-bar";
import { useOnboarding } from "@/contexts/onboarding-context";
```

Add `useOnboarding` inside the component (after the existing hooks):
```ts
const { completeStep } = useOnboarding();
```

Update `handleUpdateProfile` to remove website diff check and add `completeStep` call:
```ts
const handleUpdateProfile = async () => {
  try {
    setIsLoading(true);
    setUpdateError(null);

    const updateData: any = {};
    if (formData.bio !== session?.user?.bio) {
      updateData.bio = formData.bio || null;
    }
    if (formData.location !== session?.user?.location) {
      updateData.location = formData.location || null;
    }

    if (Object.keys(updateData).length === 0) {
      setSuccessMessage("No changes to save");
      return;
    }

    await authClient.updateUser(updateData);
    refetchSession();
    setSuccessMessage("Profile updated successfully!");

    if (formData.bio && formData.location) {
      await completeStep("complete-profile", "buyer");
    }
  } catch (error) {
    setUpdateError(
      error instanceof Error
        ? error.message
        : "Failed to update profile. Please try again.",
    );
  } finally {
    setIsLoading(false);
  }
};
```

Update `useEffect` that syncs session to remove website:
```ts
React.useEffect(() => {
  if (session?.user) {
    setFormData({
      location: session.user.location || "",
      bio: session.user.bio || "",
    });
    // ... rest unchanged
  }
}, [session]);
```

Add `ProfileCompletenessBar` at the top of the JSX return, inside the `<div ref={ref}>`, before the Profile section:
```tsx
<ProfileCompletenessBar
  imageUrl={avatarUrl}
  bio={formData.bio}
  location={formData.location}
  bannerUrl={bannerUrl}
/>
```

Add "recommended" hints to Bio and Location fields. For Bio, wrap the label:
```tsx
<div className="flex items-center gap-2 mb-1">
  <p className="text-default-700 text-base font-medium">Biography</p>
  {!formData.bio && (
    <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full">recommended</span>
  )}
</div>
<p className="text-default-400 mt-0 text-sm font-normal">
  Tell us a bit about yourself.
</p>
<Textarea
  className="mt-2"
  classNames={{ input: cn("min-h-[115px]") }}
  placeholder="e.g., Boot collector based in Atlanta. Specialising in Nike CTR360 and adidas Predator."
  value={formData.bio}
  onChange={handleInputChange("bio")}
  classNames={{
    input: cn("min-h-[115px]"),
    inputWrapper: !formData.bio ? "border-warning border-dashed" : "",
  }}
/>
{!formData.bio && (
  <p className="text-xs text-default-400 mt-1">Profiles with a bio get more trust from buyers.</p>
)}
```

For Location:
```tsx
<div className="flex items-center gap-2 mb-1">
  <p className="text-default-700 text-base font-medium">Location</p>
  {!formData.location && (
    <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full">recommended</span>
  )}
</div>
<p className="text-default-400 mt-0 text-sm font-normal">
  Set your current location.
</p>
<Input
  className="mt-2"
  placeholder="e.g Buenos Aires, Argentina"
  value={formData.location}
  onChange={handleInputChange("location")}
  classNames={{
    inputWrapper: !formData.location ? "border-warning border-dashed" : "",
  }}
/>
{!formData.location && (
  <p className="text-xs text-default-400 mt-1">Helps buyers know where their order ships from.</p>
)}
```

Delete the entire Website section (the `<div>` containing `<p>Website</p>`, its description, and the `Input`).

- [ ] **Step 6: Verify TypeScript**

```bash
cd /Users/ayoola/mdfld-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 7: Run full suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add components/dashboard/settings/profile-completeness-bar.tsx components/dashboard/settings/profile-setting.tsx __tests__/components/profile-completeness-bar.test.ts && git commit -m "feat: profile settings — completeness bar, field hints, auto-complete step, remove website field"
```

---

## Task 8: Enhanced `WelcomeModal` — slides 4 and 5

**Files:**
- Modify: `components/onboarding/welcome-modal.tsx`

- [ ] **Step 1: Replace `components/onboarding/welcome-modal.tsx`**

```tsx
"use client";

import React, { useState } from "react";
import { Button, Modal, ModalContent, ModalBody, Textarea } from "@heroui/react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { PROFILE_TEMPLATES } from "@/lib/profile-templates";
import { authClient } from "@/lib/auth-client";
import { cn } from "@heroui/react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTRO_SLIDES = [
  {
    title: "Welcome to MDFLD.",
    body: "Every boot on this platform is verified authentic — no counterfeits, no guesswork.",
  },
  {
    title: "Buy, track, and sell.",
    body: "Browse authenticated boots, track your orders, or set up a store and start selling.",
  },
  {
    title: "Let's get you started.",
    body: "Your dashboard has everything you need. Complete a few steps to unlock the full experience.",
  },
];

const TOTAL_SLIDES = 5;

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [slide, setSlide] = useState(0);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>("");
  const [bio, setBio] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<"buyer" | "seller">>(
    new Set(["buyer"])
  );
  const [isSaving, setIsSaving] = useState(false);
  const { markTourSeen, setSellerOptIn } = useOnboarding();

  const toggleRole = (role: "buyer" | "seller") => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const handleNext = async () => {
    if (slide === 3) {
      if (selectedAvatarUrl || bio.trim()) {
        try {
          const update: Record<string, string> = {};
          if (selectedAvatarUrl) update.image = selectedAvatarUrl;
          if (bio.trim()) update.bio = bio.trim();
          await authClient.updateUser(update);
        } catch {
          // non-blocking — user can update profile later
        }
      }
    }
    setSlide((s) => s + 1);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      if (selectedRoles.has("seller")) {
        await setSellerOptIn();
      }
      await markTourSeen("signup");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await markTourSeen("signup");
    onClose();
  };

  const canFinish = selectedRoles.size > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} size="sm" hideCloseButton>
      <ModalContent>
        <ModalBody className="py-8 px-6">
          <p className="text-xs text-default-400 mb-4 text-center">
            {slide + 1} / {TOTAL_SLIDES}
          </p>

          {/* Slides 0–2: intro */}
          {slide <= 2 && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">{INTRO_SLIDES[slide].title}</h2>
              <p className="text-default-600 text-sm mb-6">{INTRO_SLIDES[slide].body}</p>
              <div className="flex justify-center gap-1.5 mb-6">
                {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === slide ? "bg-primary" : "bg-default-200"}`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center">
                <Button size="sm" variant="light" onPress={handleSkip}>
                  Skip
                </Button>
                <Button size="sm" color="primary" onPress={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Slide 3: profile setup */}
          {slide === 3 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center">Set up your profile</h2>
              <p className="text-xs text-default-500 mb-4 text-center">
                Pick an icon or upload your own in Settings later.
              </p>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {PROFILE_TEMPLATES.map((url) => (
                  <button
                    key={url}
                    onClick={() => setSelectedAvatarUrl(url)}
                    className={cn(
                      "rounded-full overflow-hidden border-2 transition-all aspect-square",
                      selectedAvatarUrl === url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-default-300",
                    )}
                  >
                    <img src={url} alt="avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Short bio (optional)"
                value={bio}
                onValueChange={setBio}
                minRows={2}
                classNames={{ input: "text-sm" }}
                className="mb-4"
              />
              <div className="flex justify-between items-center">
                <Button size="sm" variant="light" onPress={() => setSlide((s) => s + 1)}>
                  Skip
                </Button>
                <Button size="sm" color="primary" onPress={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Slide 4: role selection */}
          {slide === 4 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center">What brings you here?</h2>
              <p className="text-xs text-default-500 mb-4 text-center">Select all that apply</p>
              <div className="space-y-3 mb-6">
                {(["buyer", "seller"] as const).map((role) => {
                  const selected = selectedRoles.has(role);
                  return (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "w-full text-left rounded-xl border-2 p-3 transition-all",
                        selected ? "border-primary bg-primary-50" : "border-divider",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {role === "buyer" ? "🛒 I'm here to buy" : "🏪 I also want to sell"}
                          </p>
                          <p className="text-xs text-default-500">
                            {role === "buyer"
                              ? "Browse & buy verified authentic gear"
                              : "Set up a store & list your boots"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                            selected ? "bg-primary border-primary" : "border-default-300",
                          )}
                        >
                          {selected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between items-center">
                <Button size="sm" variant="light" onPress={() => setSlide((s) => s - 1)}>
                  Back
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleFinish}
                  isDisabled={!canFinish}
                  isLoading={isSaving}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/ayoola/mdfld-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Run full suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add components/onboarding/welcome-modal.tsx && git commit -m "feat: welcome modal adds profile setup (slide 4) and role multi-select (slide 5)"
```

---

## Task 9: Wire `WelcomeModal` to dashboard layout

**Files:**
- Create: `components/onboarding/welcome-modal-controller.tsx`
- Modify: `app/(dashboard)/layout.tsx`

The layout is a server component. `WelcomeModal` needs a client wrapper that reads `shouldShowTour` from the context.

- [ ] **Step 1: Create `components/onboarding/welcome-modal-controller.tsx`**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { useOnboarding } from "@/contexts/onboarding-context";

export function WelcomeModalController() {
  const { shouldShowTour, isLoading } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && shouldShowTour("signup")) {
      setIsOpen(true);
    }
  }, [isLoading, shouldShowTour]);

  if (!isOpen) return null;

  return <WelcomeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
```

- [ ] **Step 2: Update `app/(dashboard)/layout.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WelcomeModalController } from "@/components/onboarding/welcome-modal-controller";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <>
      {children}
      <WelcomeModalController />
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/ayoola/mdfld-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Run full suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add components/onboarding/welcome-modal-controller.tsx app/\(dashboard\)/layout.tsx && git commit -m "feat: wire WelcomeModal to dashboard layout via WelcomeModalController"
```

---

## Task 10: Update dashboard page — seller checklist, nudge card, tax banner

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Update `app/(dashboard)/dashboard/page.tsx`**

Add imports at the top:

```tsx
import { SellerNudgeCard } from "@/components/onboarding/seller-nudge-card";
import { TaxTierBanner } from "@/components/onboarding/tax-tier-banner";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useRouter } from "next/navigation";
```

`useOnboarding` is already imported. Add `useRouter` for the nudge card navigation.

Inside the component, after the existing `useOnboarding` destructure, add:

```tsx
const { shouldShowTour, markTourSeen, state } = useOnboarding();
const router = useRouter();

const taxTierReached = (session?.user as any)?.taxTierReached === true;
```

Replace the `<ChecklistPanel type="buyer" />` section:

```tsx
{/* Tax tier banner — shown above everything if seller hit $500 */}
{taxTierReached && <TaxTierBanner />}

<EmailCheckBanner />
<WelcomeHero />

{/* Buyer checklist */}
<ChecklistPanel type="buyer" />

{/* Seller checklist — shown if opted in */}
{state.sellerOptIn && <ChecklistPanel type="seller" />}

{/* Seller nudge — shown if not opted in and not dismissed */}
{!state.sellerOptIn && !state.tours.includes("seller-nudge" as any) && (
  <SellerNudgeCard
    onGetStarted={async () => {
      await (useOnboarding as any)().setSellerOptIn();
      router.push("/dashboard/organization/settings");
    }}
    onDismiss={async () => {
      await markTourSeen("seller-nudge");
    }}
  />
)}
```

**Note:** the `onGetStarted` callback above has a hook-in-callback anti-pattern. Fix it by destructuring `setSellerOptIn` at the top of the component instead:

```tsx
const { shouldShowTour, markTourSeen, state, setSellerOptIn } = useOnboarding();
```

Then:

```tsx
{!state.sellerOptIn && !state.tours.includes("seller-nudge" as any) && (
  <SellerNudgeCard
    onGetStarted={async () => {
      await setSellerOptIn();
      router.push("/dashboard/organization/settings");
    }}
    onDismiss={async () => {
      await markTourSeen("seller-nudge");
    }}
  />
)}
```

The full updated JSX return body (inside `<SidebarWrapper>`):

```tsx
<SidebarWrapper>
  <div className="flex-1 overflow-y-auto">
    {taxTierReached && <div className="p-4 pb-0"><TaxTierBanner /></div>}
    <EmailCheckBanner />
    <WelcomeHero />
    <div className="px-4">
      <ChecklistPanel type="buyer" />
      {state.sellerOptIn && <ChecklistPanel type="seller" />}
      {!state.sellerOptIn && !state.tours.includes("seller-nudge" as any) && (
        <SellerNudgeCard
          onGetStarted={async () => {
            await setSellerOptIn();
            router.push("/dashboard/organization/settings");
          }}
          onDismiss={() => markTourSeen("seller-nudge")}
        />
      )}
    </div>
    <div className="p-4 pb-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveOrders />
        <WishlistSpotlight />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders />
        <ReturnsSection />
      </div>
    </div>
  </div>
</SidebarWrapper>
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/ayoola/mdfld-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Run full suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add app/\(dashboard\)/dashboard/page.tsx && git commit -m "feat: dashboard renders seller checklist, nudge card, and tax tier banner"
```

---

## Task 11: Auto-detect buyer steps at action points

**Files:**
- Modify: shop page — `browse-shop` and `understand-auth`
- Modify: wishlist mutation handler — `first-wishlist`
- Modify: order confirmation page — `place-order`
- Modify: auth email-verified callback — `verify-email`

Find each file path before editing:

```bash
find /Users/ayoola/mdfld-web/app -name "page.tsx" | xargs grep -l "shop\|wishlist\|order.*confirm\|email.*verif" 2>/dev/null | head -10
```

- [ ] **Step 1: `browse-shop` + `understand-auth` in shop page**

In the shop page component (wherever the product listing renders), add to the client component that first mounts:

```tsx
const { completeStep, state } = useOnboarding();

useEffect(() => {
  if (!state.buyer.includes("browse-shop")) {
    completeStep("browse-shop", "buyer");
  }
}, []); // fires once on mount
```

In the product detail page component, add:

```tsx
useEffect(() => {
  if (!state.buyer.includes("understand-auth")) {
    completeStep("understand-auth", "buyer");
  }
}, []);
```

- [ ] **Step 2: `first-wishlist` in wishlist add handler**

Find the wishlist mutation or button handler. After a successful add-to-wishlist call:

```tsx
if (!state.buyer.includes("first-wishlist")) {
  await completeStep("first-wishlist", "buyer");
}
```

- [ ] **Step 3: `place-order` on order confirmation**

Find the order confirmation page. In its `useEffect` or on mount:

```tsx
useEffect(() => {
  if (!state.buyer.includes("place-order")) {
    completeStep("place-order", "buyer");
  }
}, []);
```

- [ ] **Step 4: `verify-email` in email verification callback**

Find the email verification success handler (usually a page the user lands on after clicking the email link). On mount when verification succeeds:

```tsx
useEffect(() => {
  if (verificationSucceeded && !state.buyer.includes("verify-email")) {
    completeStep("verify-email", "buyer");
  }
}, [verificationSucceeded]);
```

- [ ] **Step 5: Run full suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all pass.

- [ ] **Step 6: Commit all auto-detection hooks**

```bash
cd /Users/ayoola/mdfld-web && git add -p && git commit -m "feat: auto-detect buyer onboarding steps at browse-shop, understand-auth, first-wishlist, place-order, verify-email"
```

---

## Task 12: Enable onboarding in production env

**Files:**
- `.env.local` (local) / production env vars

- [ ] **Step 1: Verify the flag**

```bash
grep "ONBOARDING_ENABLED" /Users/ayoola/mdfld-web/.env.local 2>/dev/null || echo "not set"
```

- [ ] **Step 2: Set in `.env.local` for local testing**

Add to `.env.local`:
```
NEXT_PUBLIC_ONBOARDING_ENABLED=true
```

- [ ] **Step 3: Set in production**

On the EC2 server, add `NEXT_PUBLIC_ONBOARDING_ENABLED=true` to the `.env.local` or environment and restart the Next.js process.

- [ ] **Step 4: Run full suite one final time**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run
```

Expected: all tests pass.

---

## Self-Review Checklist

- [x] **spec § 1 wizard** → Tasks 8, 9 (WelcomeModal + controller + layout)
- [x] **spec § 2 state** → Task 1 (types) + Task 2 (API) + Task 3 (context)
- [x] **spec § 3a buyer checklist links** → Task 6 (ChecklistPanel "Go →")
- [x] **spec § 3b seller checklist panel** → Task 10 (dashboard page)
- [x] **spec § 3c nudge card** → Tasks 4, 10
- [x] **spec § 3d tax tier banner** → Tasks 5, 10
- [x] **spec § 4a website removal** → Task 7
- [x] **spec § 4b completeness bar** → Task 7
- [x] **spec § 4c field hints** → Task 7
- [x] **spec § 4d auto-complete step** → Task 7
- [x] **spec § 5 auto-detection map** → Task 11
- [x] **spec env flag** → Task 12
