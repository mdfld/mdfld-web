# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a contextual onboarding system for beta.mdfld.co featuring spotlight tours (auto-start for new users, re-triggerable for returning users) and progress checklists (buyer dashboard + seller org setup), controlled by a feature flag.

**Architecture:** An `OnboardingProvider` React context wraps the app, reading/writing a `onboardingState` JSON column on the User model via two API endpoints. A single `onboarding-tours.config.ts` file defines all tour steps; page components call `useOnboarding()` to trigger tours and mark checklist steps complete.

**Tech Stack:** Next.js 14 App Router, React context, Prisma (PostgreSQL), TypeScript, Vitest, HeroUI, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `onboardingState Json?` to `User` model |
| `types/onboarding.ts` | Create | All TS types for onboarding state, tour steps, checklist items |
| `lib/onboarding-tours.config.ts` | Create | Tour step definitions for all 7 pages |
| `app/api/onboarding/route.ts` | Create | `GET` + `PATCH` API handlers |
| `contexts/onboarding-context.tsx` | Create | `OnboardingProvider` + `useOnboarding` hook |
| `components/onboarding/spotlight-tour.tsx` | Create | Spotlight overlay + tooltip with Back/Next/Skip |
| `components/onboarding/checklist-panel.tsx` | Create | Progress checklist panel (buyer + seller) |
| `components/onboarding/welcome-modal.tsx` | Create | 3-slide welcome modal (post-signup) |
| `components/onboarding/tour-trigger.tsx` | Create | Fixed "?" button to re-trigger tour |
| `app/providers.tsx` | Modify | Wrap with `OnboardingProvider` |
| `app/(auth)/auth/signup/page.tsx` | Modify | Show `WelcomeModal` after account creation |
| `app/(dashboard)/dashboard/page.tsx` | Modify | Add buyer `ChecklistPanel` + dashboard spotlight tour |
| `app/(main)/shop/page.tsx` | Modify | Auto-complete `browse-shop` step on first visit |
| `app/(main)/bag/page.tsx` | Modify | Add bag spotlight tour |
| `app/(main)/checkout/page.tsx` | Modify | Complete `understand-auth` + `place-order` on purchase |
| `app/(dashboard)/dashboard/returns/page.tsx` | Modify | Add returns spotlight tour |
| `app/(dashboard)/dashboard/connect/page.tsx` | Modify | Add connect/inbox spotlight tour |
| `app/(dashboard)/dashboard/organization/` | Modify | Add seller `ChecklistPanel` to org setup pages |
| `app/(main)/orgs/[organization]/page.tsx` | Modify | Add org profile spotlight tour |
| `__tests__/lib/onboarding-tours.test.ts` | Create | Validates tour config shape and completeness |
| `__tests__/api/onboarding.test.ts` | Create | Tests GET + PATCH API handler logic |

---

## Task 1: Prisma Schema + TypeScript Types

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `types/onboarding.ts`

- [ ] **Step 1: Add `onboardingState` column to User model in schema**

In `prisma/schema.prisma`, add after `stripeCustomerId`:

```prisma
onboardingState Json? @default("{\"buyer\":[],\"seller\":[],\"tours\":[]}")
```

The `User` model block should now include:
```prisma
stripeCustomerId    String?  @unique
onboardingState     Json?    @default("{\"buyer\":[],\"seller\":[],\"tours\":[]}")
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/ayoola/mdfld-web
npx prisma migrate dev --name add_onboarding_state
```

Expected: `The following migration(s) have been created and applied...` — no errors.

- [ ] **Step 3: Create `types/onboarding.ts`**

```typescript
export interface OnboardingState {
  buyer: string[];   // completed buyer step IDs
  seller: string[];  // completed seller step IDs
  tours: string[];   // seen tour page IDs
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
  | 'payout-method'
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
  | 'org-profile';

export interface ChecklistStep {
  id: BuyerStepId | SellerStepId;
  label: string;
  optional?: boolean;
}

export interface TourStep {
  selector: string;       // CSS selector for the element to spotlight
  title: string;
  body: string;
}

export interface TourDefinition {
  pageId: TourPageId;
  steps: TourStep[];
}

export const BUYER_CHECKLIST: ChecklistStep[] = [
  { id: 'verify-email',     label: 'Verify Email' },
  { id: 'complete-profile', label: 'Complete Your Profile' },
  { id: 'browse-shop',      label: 'Browse the Shop' },
  { id: 'first-wishlist',   label: 'Save a Boot to Wishlist' },
  { id: 'understand-auth',  label: 'Learn How Authentication Works' },
  { id: 'place-order',      label: 'Place Your First Order', optional: true },
];

export const SELLER_CHECKLIST: ChecklistStep[] = [
  { id: 'org-name-bio',   label: 'Add Store Name & Bio' },
  { id: 'org-logo',       label: 'Upload Logo / Banner', optional: true },
  { id: 'payout-method',  label: 'Set Up Payout Method' },
  { id: 'return-policy',  label: 'Set Return Policy' },
  { id: 'list-product',   label: 'List Your First Product' },
];

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  buyer: [],
  seller: [],
  tours: [],
};
```

- [ ] **Step 4: Commit**

```bash
git checkout -b feature/onboarding
git add prisma/schema.prisma prisma/migrations/ types/onboarding.ts
git commit -m "feat: add onboardingState to User model and onboarding types"
```

---

## Task 2: Tour Config

**Files:**
- Create: `lib/onboarding-tours.config.ts`
- Create: `__tests__/lib/onboarding-tours.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/onboarding-tours.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { TOURS } from "@/lib/onboarding-tours.config";
import type { TourPageId } from "@/types/onboarding";

const REQUIRED_TOUR_IDS: TourPageId[] = [
  'dashboard', 'bag', 'returns', 'connect', 'org-setup', 'org-profile',
];

describe("onboarding-tours.config", () => {
  it("exports a TOURS array", () => {
    expect(Array.isArray(TOURS)).toBe(true);
  });

  it("includes all required page tours", () => {
    const ids = TOURS.map((t) => t.pageId);
    for (const required of REQUIRED_TOUR_IDS) {
      expect(ids).toContain(required);
    }
  });

  it("every tour has at least one step", () => {
    for (const tour of TOURS) {
      expect(tour.steps.length).toBeGreaterThan(0);
    }
  });

  it("every step has a non-empty selector, title, and body", () => {
    for (const tour of TOURS) {
      for (const step of tour.steps) {
        expect(step.selector.trim().length).toBeGreaterThan(0);
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(step.body.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("all pageIds are unique", () => {
    const ids = TOURS.map((t) => t.pageId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/onboarding-tours.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/onboarding-tours.config'`

- [ ] **Step 3: Create `lib/onboarding-tours.config.ts`**

```typescript
import type { TourDefinition } from "@/types/onboarding";

export const TOURS: TourDefinition[] = [
  {
    pageId: 'dashboard',
    steps: [
      {
        selector: '[data-onboarding="dashboard-nav"]',
        title: 'Your hub',
        body: 'Your orders, returns, and wishlist live here.',
      },
      {
        selector: '[data-onboarding="checklist-panel"]',
        title: 'Getting started',
        body: 'Complete these steps to get the most out of MDFLD.',
      },
      {
        selector: '[data-onboarding="dashboard-settings"]',
        title: 'Account settings',
        body: 'Manage your account and notification preferences here.',
      },
    ],
  },
  {
    pageId: 'bag',
    steps: [
      {
        selector: '[data-onboarding="auth-badge"]',
        title: 'Verified Authentic',
        body: 'Every item ships with a verified authentic certificate.',
      },
      {
        selector: '[data-onboarding="buyer-protection"]',
        title: 'Buyer protection',
        body: 'Your purchase is protected — full refund if authentication fails.',
      },
    ],
  },
  {
    pageId: 'checkout',
    steps: [
      {
        selector: '[data-onboarding="auth-badge"]',
        title: 'Verified Authentic',
        body: 'Every item on MDFLD has been verified authentic before sale.',
      },
      {
        selector: '[data-onboarding="buyer-protection"]',
        title: 'You\'re protected',
        body: 'Full refund guaranteed if authentication fails after delivery.',
      },
    ],
  },
  {
    pageId: 'returns',
    steps: [
      {
        selector: '[data-onboarding="returns-policy"]',
        title: 'Return policy',
        body: 'Returns accepted within 3 days of delivery if the item differs from its listing.',
      },
      {
        selector: '[data-onboarding="returns-cta"]',
        title: 'Start a return',
        body: 'Our team reviews every return case within 48 hours.',
      },
    ],
  },
  {
    pageId: 'connect',
    steps: [
      {
        selector: '[data-onboarding="conversation-list"]',
        title: 'Direct messaging',
        body: 'Message sellers directly about listings, sizing, or condition.',
      },
      {
        selector: '[data-onboarding="response-time"]',
        title: 'Response time',
        body: 'Sellers are expected to respond within 24 hours.',
      },
    ],
  },
  {
    pageId: 'org-setup',
    steps: [
      {
        selector: '[data-onboarding="org-checklist"]',
        title: 'Set up your store',
        body: 'Complete these steps to go live on MDFLD.',
      },
      {
        selector: '[data-onboarding="org-name-field"]',
        title: 'Store identity',
        body: 'This is the first thing buyers see — make it count.',
      },
    ],
  },
  {
    pageId: 'org-profile',
    steps: [
      {
        selector: '[data-onboarding="storefront-header"]',
        title: 'Your storefront',
        body: 'This is what buyers see when they visit your store.',
      },
      {
        selector: '[data-onboarding="listings-section"]',
        title: 'Your listings',
        body: 'Active listings appear here — keep them accurate and up to date.',
      },
    ],
  },
];

export function getTour(pageId: string): TourDefinition | undefined {
  return TOURS.find((t) => t.pageId === pageId);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/onboarding-tours.test.ts
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding-tours.config.ts __tests__/lib/onboarding-tours.test.ts
git commit -m "feat: add onboarding tour config with all 7 page tours"
```

---

## Task 3: API Routes

**Files:**
- Create: `app/api/onboarding/route.ts`
- Create: `__tests__/api/onboarding.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/api/onboarding.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const mockSession = { user: { id: "user-1" } };

const makeRequest = (method: string, body?: object) =>
  new Request("http://localhost/api/onboarding", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("GET /api/onboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    expect(res.status).toBe(401);
  });

  it("returns empty state when user has no onboardingState", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: null } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ buyer: [], seller: [], tours: [] });
  });

  it("returns existing state when present", async () => {
    const existing = { buyer: ["verify-email"], seller: [], tours: ["dashboard"] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: existing } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(data).toEqual(existing);
  });
});

describe("PATCH /api/onboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/onboarding/route");
    const res = await PATCH(makeRequest("PATCH", { step: "browse-shop", stepType: "buyer" }) as any);
    expect(res.status).toBe(401);
  });

  it("appends a buyer step to the buyer array", async () => {
    const current = { buyer: ["verify-email"], seller: [], tours: [] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    const res = await PATCH(makeRequest("PATCH", { step: "browse-shop", stepType: "buyer" }) as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: ["verify-email", "browse-shop"], seller: [], tours: [] },
        },
      }),
    );
  });

  it("does not duplicate an already-completed buyer step", async () => {
    const current = { buyer: ["verify-email", "browse-shop"], seller: [], tours: [] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { step: "browse-shop", stepType: "buyer" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: ["verify-email", "browse-shop"], seller: [], tours: [] },
        },
      }),
    );
  });

  it("appends a seller step to the seller array", async () => {
    const current = { buyer: [], seller: [], tours: [] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { step: "org-name-bio", stepType: "seller" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: [], seller: ["org-name-bio"], tours: [] },
        },
      }),
    );
  });

  it("appends a tour to the tours array", async () => {
    const current = { buyer: [], seller: [], tours: [] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { tour: "dashboard" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { onboardingState: { buyer: [], seller: [], tours: ["dashboard"] } },
      }),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/api/onboarding.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/onboarding/route'`

- [ ] **Step 3: Create `app/api/onboarding/route.ts`**

```typescript
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
  const { step, stepType, tour } = body as {
    step?: string;
    stepType?: "buyer" | "seller";
    tour?: string;
  };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingState: true },
  });

  const state = parseState(user?.onboardingState);

  if (step && stepType === "buyer" && !state.buyer.includes(step)) {
    state.buyer = [...state.buyer, step];
  }
  if (step && stepType === "seller" && !state.seller.includes(step)) {
    state.seller = [...state.seller, step];
  }
  if (tour && !state.tours.includes(tour)) {
    state.tours = [...state.tours, tour];
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingState: state },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/api/onboarding.test.ts
```

Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/api/onboarding/route.ts __tests__/api/onboarding.test.ts
git commit -m "feat: add onboarding GET and PATCH API routes"
```

---

## Task 4: OnboardingProvider + useOnboarding Hook

**Files:**
- Create: `contexts/onboarding-context.tsx`

- [ ] **Step 1: Create `contexts/onboarding-context.tsx`**

```typescript
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
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
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
      const array = stepType === "buyer" ? state.buyer : state.seller;
      if (array.includes(id)) return;
      setState((prev) => ({
        ...prev,
        [stepType]: [...prev[stepType], id],
      }));
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: id, stepType }),
      });
    },
    [state],
  );

  const markTourSeen = useCallback(
    async (pageId: string) => {
      if (state.tours.includes(pageId)) return;
      setState((prev) => ({ ...prev, tours: [...prev.tours, pageId] }));
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour: pageId }),
      });
    },
    [state.tours],
  );

  const shouldShowTour = useCallback(
    (pageId: string) => !isLoading && isAuthenticated && !state.tours.includes(pageId),
    [isLoading, isAuthenticated, state.tours],
  );

  return (
    <OnboardingContext.Provider value={{ state, isLoading, completeStep, markTourSeen, shouldShowTour }}>
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

- [ ] **Step 2: Commit**

```bash
git add contexts/onboarding-context.tsx
git commit -m "feat: add OnboardingProvider context and useOnboarding hook"
```

---

## Task 5: SpotlightTour Component

**Files:**
- Create: `components/onboarding/spotlight-tour.tsx`

- [ ] **Step 1: Create `components/onboarding/spotlight-tour.tsx`**

```typescript
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/react";
import type { TourStep } from "@/types/onboarding";

interface SpotlightTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function SpotlightTour({ steps, onComplete, onSkip }: SpotlightTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const current = steps[currentIndex];

  const measureTarget = useCallback(() => {
    const el = document.querySelector(current.selector);
    if (el) setTargetRect(el.getBoundingClientRect());
  }, [current.selector]);

  useEffect(() => {
    measureTarget();
    window.addEventListener("resize", measureTarget);
    return () => window.removeEventListener("resize", measureTarget);
  }, [measureTarget]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentIndex < steps.length - 1) setCurrentIndex((i) => i + 1);
        else onComplete();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, steps.length, onComplete, onSkip]);

  const PADDING = 8;
  const spotlightStyle = targetRect
    ? {
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
        borderRadius: 8,
      }
    : null;

  // Position tooltip below target, flip up if near bottom
  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        top: targetRect.bottom + PADDING + 12,
        left: Math.min(targetRect.left, window.innerWidth - 320),
        width: 300,
        zIndex: 10001,
      }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, zIndex: 10001 };

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[9999]"
        onClick={onSkip}
        aria-hidden
      />
      {/* Spotlight cutout */}
      {spotlightStyle && (
        <div
          className="fixed z-[10000] ring-2 ring-primary ring-offset-0 pointer-events-none"
          style={{ position: "fixed", ...spotlightStyle }}
        />
      )}
      {/* Tooltip */}
      <div
        className="bg-content1 border border-divider rounded-xl shadow-lg p-4 z-[10001]"
        style={tooltipStyle}
        role="dialog"
        aria-label={current.title}
      >
        <p className="text-xs text-default-500 mb-1">
          {currentIndex + 1} / {steps.length}
        </p>
        <h3 className="font-semibold text-sm mb-1">{current.title}</h3>
        <p className="text-sm text-default-600 mb-3">{current.body}</p>
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="light" onPress={onSkip}>
            Skip
          </Button>
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <Button size="sm" variant="flat" onPress={() => setCurrentIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              color="primary"
              onPress={() => {
                if (currentIndex < steps.length - 1) setCurrentIndex((i) => i + 1);
                else onComplete();
              }}
            >
              {currentIndex < steps.length - 1 ? "Next" : "Done"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/spotlight-tour.tsx
git commit -m "feat: add SpotlightTour overlay and tooltip component"
```

---

## Task 6: ChecklistPanel Component

**Files:**
- Create: `components/onboarding/checklist-panel.tsx`

- [ ] **Step 1: Create `components/onboarding/checklist-panel.tsx`**

```typescript
"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
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
  const completed = type === "buyer" ? state.buyer : state.seller;

  // Determine which steps are currently unlocked (seller steps are sequential)
  function isUnlocked(stepId: string): boolean {
    if (type === "buyer") return true;
    if (stepId === "org-name-bio" || stepId === "org-logo") return true;
    if (stepId === "payout-method" || stepId === "return-policy") {
      return completed.includes("org-name-bio");
    }
    if (stepId === "list-product") {
      return completed.includes("payout-method") && completed.includes("return-policy");
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
      className="bg-content1 border border-divider rounded-xl p-4 mb-6"
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

      {/* Progress bar */}
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
                className={`flex items-center gap-2 text-sm ${!unlocked ? "opacity-40" : ""}`}
              >
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/checklist-panel.tsx
git commit -m "feat: add ChecklistPanel component for buyer and seller flows"
```

---

## Task 7: WelcomeModal + TourTrigger Components

**Files:**
- Create: `components/onboarding/welcome-modal.tsx`
- Create: `components/onboarding/tour-trigger.tsx`

- [ ] **Step 1: Create `components/onboarding/welcome-modal.tsx`**

```typescript
"use client";

import React, { useState } from "react";
import { Button, Modal, ModalContent, ModalBody } from "@heroui/react";
import { useOnboarding } from "@/contexts/onboarding-context";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
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
    cta: "Go to Dashboard",
  },
];

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [slide, setSlide] = useState(0);
  const { markTourSeen } = useOnboarding();

  const current = SLIDES[slide];

  const handleClose = async () => {
    await markTourSeen("signup");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" hideCloseButton>
      <ModalContent>
        <ModalBody className="py-8 px-6 text-center">
          <p className="text-xs text-default-400 mb-4">
            {slide + 1} / {SLIDES.length}
          </p>
          <h2 className="text-xl font-bold mb-2">{current.title}</h2>
          <p className="text-default-600 text-sm mb-6">{current.body}</p>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mb-6">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === slide ? "bg-primary" : "bg-default-200"}`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Button size="sm" variant="light" onPress={handleClose}>
              Skip
            </Button>
            {slide < SLIDES.length - 1 ? (
              <Button size="sm" color="primary" onPress={() => setSlide((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" color="primary" onPress={handleClose}>
                {current.cta}
              </Button>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 2: Create `components/onboarding/tour-trigger.tsx`**

```typescript
"use client";

import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface TourTriggerProps {
  onTrigger: () => void;
}

export function TourTrigger({ onTrigger }: TourTriggerProps) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-md"
      onPress={onTrigger}
      aria-label="Replay tour"
    >
      <Icon icon="lucide:help-circle" width={18} />
    </Button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/welcome-modal.tsx components/onboarding/tour-trigger.tsx
git commit -m "feat: add WelcomeModal and TourTrigger components"
```

---

## Task 8: Wire OnboardingProvider + Feature Flag

**Files:**
- Modify: `app/providers.tsx`
- Modify: `app/(auth)/auth/signup/page.tsx`

- [ ] **Step 1: Add `OnboardingProvider` to `app/providers.tsx`**

Read the current `providers.tsx`. Add the import and wrap the children:

```typescript
import { OnboardingProvider } from "@/contexts/onboarding-context";
```

Inside the `return`, wrap `{children}` with `OnboardingProvider`:

```typescript
<TRPCProvider>
  <HeroUIProvider navigate={router.push}>
    <NextThemesProvider {...themeProps}>
      <OnboardingProvider>
        {children}
      </OnboardingProvider>
      <ToastProvider placement="bottom-right" />
      <Toaster ... />
    </NextThemesProvider>
  </HeroUIProvider>
</TRPCProvider>
```

- [ ] **Step 2: Wrap with feature flag**

Update `contexts/onboarding-context.tsx` — add at the top of `OnboardingProvider`:

```typescript
if (process.env.NEXT_PUBLIC_ONBOARDING_ENABLED !== "true") {
  return <>{children}</>;
}
```

- [ ] **Step 3: Add env var to `.env.local`**

Add this line to `.env.local`:

```
NEXT_PUBLIC_ONBOARDING_ENABLED=true
```

- [ ] **Step 4: Update `app/(auth)/auth/signup/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import SignUpFormFrameless from "@/components/signupForm/app";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { useOnboarding } from "@/contexts/onboarding-context";

export default function SignupPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const { shouldShowTour } = useOnboarding();

  const handleSignupSuccess = () => {
    setShowWelcome(true);
  };

  return (
    <>
      <SignUpFormFrameless onSuccess={handleSignupSuccess} />
      {showWelcome && (
        <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      )}
    </>
  );
}
```

> **Note:** Check `SignUpFormFrameless` for an `onSuccess` prop or equivalent callback. If it doesn't exist, add one: find where the signup API call succeeds (look for the router.push or success toast) and call `onSuccess()` there.

- [ ] **Step 5: Commit**

```bash
git add app/providers.tsx contexts/onboarding-context.tsx app/\(auth\)/auth/signup/page.tsx .env.local
git commit -m "feat: wire OnboardingProvider into app, add feature flag, trigger WelcomeModal on signup"
```

---

## Task 9: Dashboard — Buyer Checklist + Spotlight Tour

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Add checklist and tour to `app/(dashboard)/dashboard/page.tsx`**

Add imports at the top:

```typescript
import { ChecklistPanel } from "@/components/onboarding/checklist-panel";
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";
import { useState } from "react";
```

Inside the `Dashboard` function, after the existing hooks, add:

```typescript
const { shouldShowTour, markTourSeen } = useOnboarding();
const [tourActive, setTourActive] = useState(false);
const tour = getTour("dashboard");

useEffect(() => {
  if (session && shouldShowTour("dashboard")) {
    setTourActive(true);
  }
}, [session, shouldShowTour]);

const handleTourEnd = async () => {
  setTourActive(false);
  await markTourSeen("dashboard");
};
```

In the JSX, before the existing dashboard content (after the loading check), insert:

```tsx
<ChecklistPanel type="buyer" />
```

Add the data attribute to the existing nav sidebar wrapper — find the `<SidebarWrapper>` and add `data-onboarding="dashboard-nav"` to the outermost wrapper element it renders, or to a wrapping div here.

After the main content, add:

```tsx
{tourActive && tour && (
  <SpotlightTour
    steps={tour.steps}
    onComplete={handleTourEnd}
    onSkip={handleTourEnd}
  />
)}
<TourTrigger onTrigger={() => setTourActive(true)} />
```

- [ ] **Step 2: Add `data-onboarding` attributes**

In `components/sidebar/dashboard/app.tsx` (or wherever the nav sidebar renders), add:

```tsx
data-onboarding="dashboard-nav"
```

to the outermost nav wrapper element.

In `app/(dashboard)/dashboard/settings/page.tsx` (or the settings link in the sidebar), add:

```tsx
data-onboarding="dashboard-settings"
```

to the settings link/button element.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: add buyer checklist and spotlight tour to dashboard"
```

---

## Task 10: Auto-Complete Steps — Shop Visit + Wishlist Add

**Files:**
- Modify: `app/(main)/shop/page.tsx`
- Modify: `hooks/use-cart.ts` or wherever wishlist adds are dispatched (check `app/api/wishlist/route.ts` caller)

- [ ] **Step 1: Auto-complete `browse-shop` in `app/(main)/shop/page.tsx`**

`ShopPage` is a server component — wrap it in a client component for the effect. Create `app/(main)/shop/shop-onboarding.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useOnboarding } from "@/contexts/onboarding-context";

export function ShopOnboarding() {
  const { completeStep } = useOnboarding();
  useEffect(() => {
    completeStep("browse-shop", "buyer");
  }, [completeStep]);
  return null;
}
```

Then in `app/(main)/shop/page.tsx`, add:

```typescript
import { ShopOnboarding } from "./shop-onboarding";
```

And in the JSX:

```tsx
export default function ShopPage() {
  return (
    <>
      <ShopOnboarding />
      <ProductsPageClient />
    </>
  );
}
```

Make `ShopPage` a client component:

```typescript
"use client";
```

Remove the `export const metadata` (metadata can't be exported from client components) — move it to a separate `layout.tsx` for the shop route if needed, or remove it for now.

- [ ] **Step 2: Auto-complete `first-wishlist` on wishlist add**

Find where the wishlist POST is called in the client. Check `app/api/wishlist/route.ts` — the POST is called from somewhere. Search:

```bash
grep -r "api/wishlist" /Users/ayoola/mdfld-web/components --include="*.tsx" -l
```

In the component that calls `POST /api/wishlist`, after a successful response, add:

```typescript
const { completeStep } = useOnboarding();
// ...after successful wishlist add:
completeStep("first-wishlist", "buyer");
```

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/shop/page.tsx app/\(main\)/shop/shop-onboarding.tsx
git commit -m "feat: auto-complete browse-shop and first-wishlist checklist steps"
```

---

## Task 11: Bag + Checkout Tours

**Files:**
- Modify: `app/(main)/bag/page.tsx`
- Modify: `app/(main)/checkout/page.tsx`

- [ ] **Step 1: Add tour to `app/(main)/bag/page.tsx`**

Add at the top of the `Bag` component:

```typescript
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";
import { useState, useEffect } from "react";
```

Inside the component:

```typescript
const { shouldShowTour, markTourSeen } = useOnboarding();
const [tourActive, setTourActive] = useState(false);
const tour = getTour("bag");

useEffect(() => {
  if (shouldShowTour("bag")) setTourActive(true);
}, [shouldShowTour]);

const handleTourEnd = async () => {
  setTourActive(false);
  await markTourSeen("bag");
};
```

Add `data-onboarding="auth-badge"` to the authentication badge element in the bag item card.
Add `data-onboarding="buyer-protection"` to the buyer protection note element.

At the end of the JSX:

```tsx
{tourActive && tour && (
  <SpotlightTour steps={tour.steps} onComplete={handleTourEnd} onSkip={handleTourEnd} />
)}
<TourTrigger onTrigger={() => setTourActive(true)} />
```

- [ ] **Step 2: Add tour + complete steps in `app/(main)/checkout/page.tsx`**

Apply the same pattern as bag (tour for `"checkout"` page ID). Additionally, after a successful order placement (find the success handler — look for where the order confirmation redirect or success toast fires), add:

```typescript
const { completeStep, markTourSeen } = useOnboarding();
// after order success:
await completeStep("understand-auth", "buyer");
await completeStep("place-order", "buyer");
```

Add `data-onboarding="auth-badge"` and `data-onboarding="buyer-protection"` attributes to the checkout page elements.

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/bag/page.tsx app/\(main\)/checkout/page.tsx
git commit -m "feat: add spotlight tours to bag and checkout, complete auth and order steps"
```

---

## Task 12: Returns + Connect Tours

**Files:**
- Modify: `app/(dashboard)/dashboard/returns/page.tsx`
- Modify: `app/(dashboard)/dashboard/connect/page.tsx`

- [ ] **Step 1: Add tour to `app/(dashboard)/dashboard/returns/page.tsx`**

Read the current file first. Add imports:

```typescript
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";
import { useState, useEffect } from "react";
```

Inside the component:

```typescript
const { shouldShowTour, markTourSeen } = useOnboarding();
const [tourActive, setTourActive] = useState(false);
const tour = getTour("returns");

useEffect(() => {
  if (shouldShowTour("returns")) setTourActive(true);
}, [shouldShowTour]);

const handleTourEnd = async () => {
  setTourActive(false);
  await markTourSeen("returns");
};
```

Add to the JSX:
- `data-onboarding="returns-policy"` on the policy summary element
- `data-onboarding="returns-cta"` on the initiate return button

At the bottom of the JSX:

```tsx
{tourActive && tour && (
  <SpotlightTour steps={tour.steps} onComplete={handleTourEnd} onSkip={handleTourEnd} />
)}
<TourTrigger onTrigger={() => setTourActive(true)} />
```

- [ ] **Step 2: Apply the same pattern to `app/(dashboard)/dashboard/connect/page.tsx`**

Follow the identical pattern above using `getTour("connect")`.

Add:
- `data-onboarding="conversation-list"` on the conversation list container
- `data-onboarding="response-time"` on the response time indicator element

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/dashboard/returns/page.tsx app/\(dashboard\)/dashboard/connect/page.tsx
git commit -m "feat: add spotlight tours to returns and connect/inbox pages"
```

---

## Task 13: Org Setup — Seller Checklist + Tour

**Files:**
- Modify: `app/(dashboard)/dashboard/organization/` (root page)

- [ ] **Step 1: Read the org setup page**

```bash
cat /Users/ayoola/mdfld-web/app/\(dashboard\)/dashboard/organization/page.tsx
```

Identify the main layout wrapper — this is where the seller `ChecklistPanel` goes.

- [ ] **Step 2: Add seller checklist and spotlight tour**

Add imports:

```typescript
import { ChecklistPanel } from "@/components/onboarding/checklist-panel";
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";
import { useState, useEffect } from "react";
```

Add inside the component:

```typescript
const { shouldShowTour, markTourSeen } = useOnboarding();
const [tourActive, setTourActive] = useState(false);
const tour = getTour("org-setup");

useEffect(() => {
  if (shouldShowTour("org-setup")) setTourActive(true);
}, [shouldShowTour]);

const handleTourEnd = async () => {
  setTourActive(false);
  await markTourSeen("org-setup");
};
```

Insert `<ChecklistPanel type="seller" />` near the top of the page content.

Add `data-onboarding="org-checklist"` to the checklist panel wrapper and `data-onboarding="org-name-field"` to the store name input.

Add tour rendering and `<TourTrigger>` at the bottom of the JSX.

- [ ] **Step 3: Auto-complete seller steps as forms are saved**

For each seller checklist step, find the form submit handler that saves that data and call `completeStep` after success:

- Store name/bio form → `completeStep("org-name-bio", "seller")`
- Logo/banner upload → `completeStep("org-logo", "seller")`
- Payout method saved → `completeStep("payout-method", "seller")`
- Return policy saved → `completeStep("return-policy", "seller")`
- First product listed → `completeStep("list-product", "seller")`

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/dashboard/organization/
git commit -m "feat: add seller checklist and spotlight tour to org setup"
```

---

## Task 14: Org Profile Tour

**Files:**
- Modify: `app/(main)/orgs/[organization]/organization-profile-content.tsx`

- [ ] **Step 1: Add tour to the org profile content component**

Read the file first:

```bash
cat /Users/ayoola/mdfld-web/app/\(main\)/orgs/\[organization\]/organization-profile-content.tsx | head -40
```

Add imports:

```typescript
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";
import { useState, useEffect } from "react";
```

Add inside the component (this only fires if the viewing user IS the org owner — check for that condition before showing the tour):

```typescript
const { shouldShowTour, markTourSeen } = useOnboarding();
const [tourActive, setTourActive] = useState(false);
const tour = getTour("org-profile");

useEffect(() => {
  if (isOwner && shouldShowTour("org-profile")) {
    setTourActive(true);
    markTourSeen("org-profile");
  }
}, [isOwner, shouldShowTour]);

const handleTourEnd = () => setTourActive(false);
```

Add `data-onboarding="storefront-header"` to the org header/banner element and `data-onboarding="listings-section"` to the listings grid container.

At the end of JSX:

```tsx
{tourActive && tour && (
  <SpotlightTour steps={tour.steps} onComplete={handleTourEnd} onSkip={handleTourEnd} />
)}
{isOwner && <TourTrigger onTrigger={() => setTourActive(true)} />}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(main\)/orgs/\[organization\]/organization-profile-content.tsx
git commit -m "feat: add spotlight tour to org profile page for store owners"
```

---

## Task 15: Run Full Test Suite + Beta Branch Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All existing tests pass + new onboarding tests pass. Zero failures.

- [ ] **Step 2: Verify feature flag works — disable then re-enable**

In `.env.local`, temporarily set `NEXT_PUBLIC_ONBOARDING_ENABLED=false`, start dev server, verify no onboarding UI appears. Re-enable.

```bash
NEXT_PUBLIC_ONBOARDING_ENABLED=false npx next dev
```

Expected: App loads normally, no tours, no checklists, no modal.

- [ ] **Step 3: Verify `.superpowers/` is gitignored**

```bash
grep -r ".superpowers" /Users/ayoola/mdfld-web/.gitignore
```

If not present, add it:

```bash
echo ".superpowers/" >> /Users/ayoola/mdfld-web/.gitignore
git add .gitignore
git commit -m "chore: gitignore .superpowers brainstorm artifacts"
```

- [ ] **Step 4: Final commit and push to beta**

```bash
git push -u origin feature/onboarding
```

Then in the Vercel dashboard, configure `beta.mdfld.co` to deploy from the `feature/onboarding` branch with `NEXT_PUBLIC_ONBOARDING_ENABLED=true` set in the beta environment variables.
