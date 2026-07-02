# Trade/Swap Offer Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a platform-facilitated trade/swap flow where buyers can propose item swaps (with optional cash sweetener) on trade-enabled listings, with full status lifecycle and dual-leg shipping tracking.

**Architecture:** New `TradeOffer` model linked one-to-one to a `Conversation` of type `TRADE`. Six tRPC procedures manage the lifecycle. A `ProposeTradeModal` on the product page initiates offers. A `TradeOfferCard` renders above the chat thread in the inbox. A `/dashboard/trades` page lists all offers.

**Tech Stack:** Next.js 15, tRPC, Prisma (PostgreSQL on EC2), HeroUI, Vitest (node env), @iconify/react solar icons, AES256E2EE for message encryption

**Spec:** `docs/superpowers/specs/2026-06-03-trade-swap-design.md`

---

## File Map

**Create:**
- `prisma/migrations/20260603000001_add_trade_offer/migration.sql`
- `lib/trade-action.ts`
- `server/routers/trade.ts`
- `components/product/propose-trade-modal.tsx`
- `components/dashboard/inbox/trade-offer-card.tsx`
- `app/(dashboard)/dashboard/trades/page.tsx`
- `__tests__/lib/trade-action.test.ts`
- `__tests__/lib/trade-offer.test.ts`
- `__tests__/components/trade-offer-card.test.ts`

**Modify:**
- `prisma/schema.prisma`
- `server/index.ts`
- `server/routers/product.ts`
- `server/routers/chat.ts`
- `components/dashboard/organizations/products/create/product-creation.tsx`
- `components/dashboard/organizations/products/create/product-pricing-form.tsx`
- `components/product-layout/product-view-item.tsx`
- `app/(main)/products/[product]/page.tsx`
- `components/dashboard/inbox/messaging-chat-inbox.tsx`
- `components/dashboard/inbox/messaging-chat-window.tsx`
- `components/sidebar/dashboard/sidebar-items.tsx`

---

### Task 1: Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260603000001_add_trade_offer/migration.sql`

- [ ] **Step 1: Edit `prisma/schema.prisma` — add tradeEnabled to Product**

Find the `Product` model. After the `isHighRisk` field (around line 313), add:

```prisma
tradeEnabled             Boolean   @default(false)
```

- [ ] **Step 2: Add TRADE to ConversationType enum**

Find `enum ConversationType` and add `TRADE` as a new value:

```prisma
enum ConversationType {
  DIRECT
  GROUP
  SUPPORT
  ORDER
  ORGANIZATION
  TRADE
}
```

- [ ] **Step 3: Add 5 new values to NotificationType enum**

Find `enum NotificationType` and add after `MESSAGE_READ`:

```prisma
  TRADE_OFFER_RECEIVED
  TRADE_OFFER_ACCEPTED
  TRADE_OFFER_DECLINED
  TRADE_OFFER_SHIPPED
  TRADE_OFFER_COMPLETED
```

- [ ] **Step 4: Add TradeOfferStatus enum (new, after NotificationType)**

```prisma
enum TradeOfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELLED
  SHIPPING
  COMPLETED
  EXPIRED
  DISPUTED
}
```

- [ ] **Step 5: Add TradeOffer model (after the OrgConversation model)**

```prisma
model TradeOffer {
  id                      String           @id @default(cuid())
  conversationId          String           @unique
  proposerId              String
  recipientId             String
  requestedProductId      String
  offeredProductId        String?
  cashAmount              Decimal?
  cashFromProposer        Boolean          @default(true)
  status                  TradeOfferStatus @default(PENDING)

  proposerTrackingNumber  String?
  recipientTrackingNumber String?
  proposerShippedAt       DateTime?
  recipientShippedAt      DateTime?

  expiresAt               DateTime?
  completedAt             DateTime?
  cancelledAt             DateTime?

  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt

  conversation            Conversation     @relation(fields: [conversationId], references: [id])
  proposer                User             @relation("TradeProposer", fields: [proposerId], references: [id])
  recipient               User             @relation("TradeRecipient", fields: [recipientId], references: [id])
  requestedProduct        Product          @relation("RequestedProduct", fields: [requestedProductId], references: [id])
  offeredProduct          Product?         @relation("OfferedProduct", fields: [offeredProductId], references: [id])

  @@index([proposerId])
  @@index([recipientId])
  @@index([status])
  @@map("trade_offer")
}
```

- [ ] **Step 6: Add tradeOffer relation to Conversation model**

In the `Conversation` model, add after `orgConversation OrgConversation?`:

```prisma
  tradeOffer      TradeOffer?
```

- [ ] **Step 7: Add TradeOffer relations to Product model**

In the `Product` model, add after `fraudReports FraudReport[]`:

```prisma
  tradeOfferRequests  TradeOffer[] @relation("RequestedProduct")
  tradeOffersMade     TradeOffer[] @relation("OfferedProduct")
```

- [ ] **Step 8: Add TradeOffer relations to User model**

In the `User` model, add after `messageReceipts MessageReceipt[]`:

```prisma
  tradeOffersProposed TradeOffer[] @relation("TradeProposer")
  tradeOffersReceived TradeOffer[] @relation("TradeRecipient")
```

- [ ] **Step 9: Create migration directory and SQL**

```bash
mkdir -p /path/to/mdfld-web/prisma/migrations/20260603000001_add_trade_offer
```

Create `prisma/migrations/20260603000001_add_trade_offer/migration.sql`:

```sql
-- AddColumn
ALTER TABLE "product" ADD COLUMN "tradeEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "TradeOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'SHIPPING', 'COMPLETED', 'EXPIRED', 'DISPUTED');

-- AlterEnum: ConversationType
ALTER TYPE "ConversationType" ADD VALUE 'TRADE';

-- AlterEnum: NotificationType (each ADD VALUE must be a separate statement)
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_DECLINED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_SHIPPED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_COMPLETED';

-- CreateTable
CREATE TABLE "trade_offer" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "requestedProductId" TEXT NOT NULL,
    "offeredProductId" TEXT,
    "cashAmount" DECIMAL(65,30),
    "cashFromProposer" BOOLEAN NOT NULL DEFAULT true,
    "status" "TradeOfferStatus" NOT NULL DEFAULT 'PENDING',
    "proposerTrackingNumber" TEXT,
    "recipientTrackingNumber" TEXT,
    "proposerShippedAt" TIMESTAMP(3),
    "recipientShippedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trade_offer_conversationId_key" ON "trade_offer"("conversationId");
CREATE INDEX "trade_offer_proposerId_idx" ON "trade_offer"("proposerId");
CREATE INDEX "trade_offer_recipientId_idx" ON "trade_offer"("recipientId");
CREATE INDEX "trade_offer_status_idx" ON "trade_offer"("status");

-- AddForeignKey
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_requestedProductId_fkey" FOREIGN KEY ("requestedProductId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_offeredProductId_fkey" FOREIGN KEY ("offeredProductId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

- [ ] **Step 10: Run prisma generate**

```bash
cd /path/to/mdfld-web && npx prisma generate
```

Expected: "Generated Prisma Client" with no errors. If errors appear, check schema syntax.

- [ ] **Step 11: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260603000001_add_trade_offer/
git commit -m "feat: add TradeOffer schema, migration, and enum values"
```

---

### Task 2: `resolveTradeOfferActions` pure helper + tests

**Files:**
- Create: `lib/trade-action.ts`
- Create: `__tests__/lib/trade-action.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/trade-action.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { resolveTradeOfferActions } from "@/lib/trade-action";

describe("resolveTradeOfferActions", () => {
  it("recipient + PENDING: can accept and decline", () => {
    const actions = resolveTradeOfferActions("recipient", "PENDING", false);
    expect(actions.canAccept).toBe(true);
    expect(actions.canDecline).toBe(true);
    expect(actions.canCancel).toBe(false);
    expect(actions.canUploadTracking).toBe(false);
  });

  it("proposer + PENDING: can only cancel", () => {
    const actions = resolveTradeOfferActions("proposer", "PENDING", false);
    expect(actions.canAccept).toBe(false);
    expect(actions.canDecline).toBe(false);
    expect(actions.canCancel).toBe(true);
    expect(actions.canUploadTracking).toBe(false);
  });

  it("either party + ACCEPTED: can upload tracking when not yet uploaded", () => {
    const p = resolveTradeOfferActions("proposer", "ACCEPTED", false);
    const r = resolveTradeOfferActions("recipient", "ACCEPTED", false);
    expect(p.canUploadTracking).toBe(true);
    expect(r.canUploadTracking).toBe(true);
    expect(p.hasUploaded).toBe(false);
  });

  it("either party + ACCEPTED: canUploadTracking false when already uploaded", () => {
    const actions = resolveTradeOfferActions("proposer", "ACCEPTED", true);
    expect(actions.canUploadTracking).toBe(false);
    expect(actions.hasUploaded).toBe(true);
  });

  it("SHIPPING behaves the same as ACCEPTED for upload tracking", () => {
    const actions = resolveTradeOfferActions("recipient", "SHIPPING", false);
    expect(actions.canUploadTracking).toBe(true);
  });

  it("COMPLETED: no actions", () => {
    const actions = resolveTradeOfferActions("proposer", "COMPLETED", true);
    expect(actions.canAccept).toBe(false);
    expect(actions.canDecline).toBe(false);
    expect(actions.canCancel).toBe(false);
    expect(actions.canUploadTracking).toBe(false);
  });

  it("DECLINED: no actions for either party", () => {
    const p = resolveTradeOfferActions("proposer", "DECLINED", false);
    const r = resolveTradeOfferActions("recipient", "DECLINED", false);
    expect(p.canCancel).toBe(false);
    expect(r.canDecline).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /path/to/mdfld-web && npx vitest run __tests__/lib/trade-action.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/trade-action'"

- [ ] **Step 3: Implement `lib/trade-action.ts`**

```typescript
export type TradeViewerRole = "proposer" | "recipient";

export interface TradeOfferActions {
  canAccept: boolean;
  canDecline: boolean;
  canCancel: boolean;
  canUploadTracking: boolean;
  hasUploaded: boolean;
}

export function resolveTradeOfferActions(
  viewerRole: TradeViewerRole,
  status: string,
  viewerHasUploaded: boolean,
): TradeOfferActions {
  const none: TradeOfferActions = {
    canAccept: false,
    canDecline: false,
    canCancel: false,
    canUploadTracking: false,
    hasUploaded: false,
  };

  if (status === "PENDING") {
    if (viewerRole === "recipient") return { ...none, canAccept: true, canDecline: true };
    if (viewerRole === "proposer") return { ...none, canCancel: true };
    return none;
  }

  if (status === "ACCEPTED" || status === "SHIPPING") {
    return {
      ...none,
      canUploadTracking: !viewerHasUploaded,
      hasUploaded: viewerHasUploaded,
    };
  }

  return none;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run __tests__/lib/trade-action.test.ts
```

Expected: 7 passing

- [ ] **Step 5: Commit**

```bash
git add lib/trade-action.ts __tests__/lib/trade-action.test.ts
git commit -m "feat: resolveTradeOfferActions pure helper with tests"
```

---

### Task 3: `tradeRouter` — proposeOffer + tests

**Files:**
- Create: `server/routers/trade.ts`
- Create: `__tests__/lib/trade-offer.test.ts`

- [ ] **Step 1: Write failing tests for proposeOffer**

Create `__tests__/lib/trade-offer.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const {
  mockProductFindUnique,
  mockTradeOfferFindFirst,
  mockTradeOfferCreate,
  mockConversationCreate,
  mockNotificationCreate,
  mockTransaction,
} = vi.hoisted(() => {
  const convCreate = vi.fn().mockResolvedValue({ id: "conv-1" });
  const offerCreate = vi.fn().mockResolvedValue({ id: "offer-1", conversationId: "conv-1" });
  return {
    mockProductFindUnique: vi.fn(),
    mockTradeOfferFindFirst: vi.fn().mockResolvedValue(null),
    mockTradeOfferCreate: offerCreate,
    mockConversationCreate: convCreate,
    mockNotificationCreate: vi.fn().mockResolvedValue({}),
    mockTransaction: vi.fn().mockImplementation(async (fn: any) =>
      fn({ conversation: { create: convCreate }, tradeOffer: { create: offerCreate } })
    ),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findUnique: mockProductFindUnique },
    tradeOffer: { findFirst: mockTradeOfferFindFirst, create: mockTradeOfferCreate },
    conversation: { create: mockConversationCreate },
    notification: { create: mockNotificationCreate },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/redis", () => ({
  publishMessage: vi.fn(),
  publishMessageStatus: vi.fn(),
  publishTypingStatus: vi.fn(),
  cacheMessage: vi.fn(),
  setUserPresence: vi.fn(),
  redis: null,
}));
vi.mock("@/lib/aes-e2ee", () => ({
  AES256E2EE: {
    encryptForConversation: vi.fn().mockReturnValue({ "user-1": "enc", "seller-1": "enc" }),
  },
}));

import { createCallerFactory } from "@/server/trpc";
import { tradeRouter } from "@/server/routers/trade";

const createCaller = createCallerFactory(tradeRouter);

const buyerCtx = {
  req: {} as any,
  res: {} as any,
  session: { session: {} as any, user: { id: "user-1", name: "Buyer" } } as any,
  user: { id: "user-1", name: "Buyer" } as any,
  prisma: {
    product: { findUnique: mockProductFindUnique },
    tradeOffer: { findFirst: mockTradeOfferFindFirst },
    notification: { create: mockNotificationCreate },
    $transaction: mockTransaction,
  } as any,
};

const tradeEnabledProduct = {
  id: "product-1",
  tradeEnabled: true,
  seller: { userId: "seller-1", organizationId: null },
};

const offeredProduct = {
  id: "offered-1",
  tradeEnabled: true,
  seller: { userId: "user-1" },
};

describe("trade.proposeOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTradeOfferFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: any) =>
      fn({
        conversation: { create: vi.fn().mockResolvedValue({ id: "conv-1" }) },
        tradeOffer: {
          create: vi.fn().mockResolvedValue({ id: "offer-1", conversationId: "conv-1" }),
        },
      })
    );
  });

  it("succeeds with a straight item swap", async () => {
    mockProductFindUnique
      .mockResolvedValueOnce(tradeEnabledProduct)
      .mockResolvedValueOnce(offeredProduct);
    const caller = createCaller(buyerCtx);
    const result = await caller.proposeOffer({
      requestedProductId: "product-1",
      offeredProductId: "offered-1",
    });
    expect(result).toHaveProperty("conversationId");
    expect(result).toHaveProperty("tradeOfferId");
  });

  it("succeeds with cash-only offer", async () => {
    mockProductFindUnique.mockResolvedValueOnce(tradeEnabledProduct);
    const caller = createCaller(buyerCtx);
    const result = await caller.proposeOffer({
      requestedProductId: "product-1",
      cashAmount: 25,
    });
    expect(result).toHaveProperty("conversationId");
  });

  it("succeeds with item + cash sweetener", async () => {
    mockProductFindUnique
      .mockResolvedValueOnce(tradeEnabledProduct)
      .mockResolvedValueOnce(offeredProduct);
    const caller = createCaller(buyerCtx);
    const result = await caller.proposeOffer({
      requestedProductId: "product-1",
      offeredProductId: "offered-1",
      cashAmount: 10,
    });
    expect(result).toHaveProperty("tradeOfferId");
  });

  it("throws BAD_REQUEST when tradeEnabled is false", async () => {
    mockProductFindUnique.mockResolvedValueOnce({
      ...tradeEnabledProduct,
      tradeEnabled: false,
    });
    const caller = createCaller(buyerCtx);
    await expect(
      caller.proposeOffer({ requestedProductId: "product-1", cashAmount: 10 })
    ).rejects.toThrow(TRPCError);
  });

  it("throws BAD_REQUEST when proposer is the seller", async () => {
    mockProductFindUnique.mockResolvedValueOnce({
      ...tradeEnabledProduct,
      seller: { userId: "user-1" }, // same as buyerCtx.user.id
    });
    const caller = createCaller(buyerCtx);
    await expect(
      caller.proposeOffer({ requestedProductId: "product-1", cashAmount: 10 })
    ).rejects.toThrow(TRPCError);
  });

  it("throws BAD_REQUEST when neither item nor cash provided", async () => {
    mockProductFindUnique.mockResolvedValueOnce(tradeEnabledProduct);
    const caller = createCaller(buyerCtx);
    await expect(
      caller.proposeOffer({ requestedProductId: "product-1" })
    ).rejects.toThrow(TRPCError);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

Expected: FAIL — "Cannot find module '@/server/routers/trade'"

- [ ] **Step 3: Implement `server/routers/trade.ts` — proposeOffer only**

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { AES256E2EE } from "@/lib/aes-e2ee";

export const tradeRouter = createTRPCRouter({
  proposeOffer: protectedProcedure
    .input(
      z.object({
        requestedProductId: z.string(),
        offeredProductId: z.string().optional(),
        cashAmount: z.number().nonnegative().optional(),
        message: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.offeredProductId && (!input.cashAmount || input.cashAmount <= 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must offer an item or a cash amount greater than 0",
        });
      }

      const requestedProduct = await ctx.prisma.product.findUnique({
        where: { id: input.requestedProductId },
        include: { seller: { select: { userId: true, organizationId: true } } },
      });

      if (!requestedProduct) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (!(requestedProduct as any).tradeEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This listing does not accept trade offers",
        });
      }

      if (requestedProduct.seller.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot propose a trade on your own listing",
        });
      }

      if (input.offeredProductId) {
        const offeredProduct = await ctx.prisma.product.findUnique({
          where: { id: input.offeredProductId },
          include: { seller: { select: { userId: true } } },
        });
        if (!offeredProduct || offeredProduct.seller.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only offer products you own",
          });
        }
      }

      const existingOffer = await ctx.prisma.tradeOffer.findFirst({
        where: {
          proposerId: ctx.user.id,
          requestedProductId: input.requestedProductId,
          status: "PENDING",
        },
      });

      if (existingOffer) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending trade offer on this listing",
        });
      }

      const recipientId = requestedProduct.seller.userId!;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [conversation, tradeOffer] = await ctx.prisma.$transaction(async (tx: any) => {
        const conv = await tx.conversation.create({
          data: {
            type: "TRADE",
            participants: {
              create: [
                { userId: ctx.user.id, role: "admin" },
                { userId: recipientId, role: "member" },
              ],
            },
          },
        });

        const offer = await tx.tradeOffer.create({
          data: {
            conversationId: conv.id,
            proposerId: ctx.user.id,
            recipientId,
            requestedProductId: input.requestedProductId,
            offeredProductId: input.offeredProductId ?? null,
            cashAmount: input.cashAmount ?? null,
            expiresAt,
          },
        });

        return [conv, offer];
      });

      if (input.message) {
        const participantIds = [ctx.user.id, recipientId];
        const encryptedVersions = AES256E2EE.encryptForConversation(
          input.message,
          ctx.user.id,
          participantIds,
        );
        await ctx.prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: ctx.user.id,
            content: JSON.stringify(encryptedVersions),
            type: "TEXT",
            status: "SENT",
          },
        });
      }

      await ctx.prisma.notification.create({
        data: {
          userId: recipientId,
          type: "TRADE_OFFER_RECEIVED",
          title: `New trade offer from ${ctx.user.name}`,
          content: "You have a new trade offer on your listing",
          metadata: {
            tradeOfferId: tradeOffer.id,
            conversationId: conversation.id,
            proposerName: ctx.user.name,
          },
        },
      });

      return { tradeOfferId: tradeOffer.id, conversationId: conversation.id };
    }),
});
```

Add `mockMessageCreate` to the `vi.hoisted` block alongside the others:

```typescript
mockMessageCreate: vi.fn().mockResolvedValue({ id: "msg-1" }),
```

Add `message: { create: mockMessageCreate }` to both the `vi.mock("@/lib/prisma")` prisma object and to `buyerCtx.prisma`.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

Expected: 6 passing

- [ ] **Step 5: Commit**

```bash
git add server/routers/trade.ts __tests__/lib/trade-offer.test.ts
git commit -m "feat: tradeRouter proposeOffer with tests"
```

---

### Task 4: `respondToOffer` + `cancelOffer` + tests

**Files:**
- Modify: `server/routers/trade.ts`
- Modify: `__tests__/lib/trade-offer.test.ts`

- [ ] **Step 1: Add respondToOffer + cancelOffer tests**

Append to `__tests__/lib/trade-offer.test.ts`:

```typescript
const {
  mockTradeOfferFindUnique,
  mockTradeOfferUpdate,
} = vi.hoisted(() => ({
  mockTradeOfferFindUnique: vi.fn(),
  mockTradeOfferUpdate: vi.fn().mockResolvedValue({ id: "offer-1", status: "ACCEPTED" }),
}));
// Add these to the vi.mock("@/lib/prisma") prisma object:
// tradeOffer: { ..., findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate }

const recipientCtx = {
  ...buyerCtx,
  session: { session: {} as any, user: { id: "seller-1", name: "Seller" } } as any,
  user: { id: "seller-1", name: "Seller" } as any,
  prisma: { ...buyerCtx.prisma, tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate, findFirst: mockTradeOfferFindFirst }, notification: { create: mockNotificationCreate } } as any,
};

describe("trade.respondToOffer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recipient can accept — status becomes ACCEPTED", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1",
      recipientId: "seller-1",
      proposerId: "user-1",
      status: "PENDING",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "ACCEPTED" });
    const caller = createCaller(recipientCtx);
    const result = await caller.respondToOffer({ tradeOfferId: "offer-1", response: "ACCEPTED" });
    expect(result.status).toBe("ACCEPTED");
  });

  it("recipient can decline — status becomes DECLINED", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1",
      recipientId: "seller-1",
      proposerId: "user-1",
      status: "PENDING",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "DECLINED" });
    const caller = createCaller(recipientCtx);
    const result = await caller.respondToOffer({ tradeOfferId: "offer-1", response: "DECLINED" });
    expect(result.status).toBe("DECLINED");
  });

  it("proposer cannot call respondToOffer", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1",
      recipientId: "seller-1",
      proposerId: "user-1",
      status: "PENDING",
    });
    const caller = createCaller(buyerCtx); // buyer is the proposer
    await expect(
      caller.respondToOffer({ tradeOfferId: "offer-1", response: "ACCEPTED" })
    ).rejects.toThrow(TRPCError);
  });
});

describe("trade.cancelOffer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("proposer can cancel PENDING offer", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1",
      proposerId: "user-1",
      recipientId: "seller-1",
      status: "PENDING",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "CANCELLED" });
    const caller = createCaller({
      ...buyerCtx,
      prisma: {
        ...buyerCtx.prisma,
        tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate },
      } as any,
    });
    const result = await caller.cancelOffer({ tradeOfferId: "offer-1" });
    expect(result.status).toBe("CANCELLED");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

Expected: FAIL on new tests — "is not a function" for respondToOffer/cancelOffer

- [ ] **Step 3: Add respondToOffer + cancelOffer to `server/routers/trade.ts`**

Inside the `createTRPCRouter({...})`, after `proposeOffer`, add:

```typescript
  respondToOffer: protectedProcedure
    .input(
      z.object({
        tradeOfferId: z.string(),
        response: z.enum(["ACCEPTED", "DECLINED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.tradeOffer.findUnique({
        where: { id: input.tradeOfferId },
      });

      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });

      if (offer.recipientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the recipient can respond" });
      }

      if (offer.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Offer is no longer pending" });
      }

      const updated = await ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: { status: input.response },
      });

      const notificationType =
        input.response === "ACCEPTED" ? "TRADE_OFFER_ACCEPTED" : "TRADE_OFFER_DECLINED";

      await ctx.prisma.notification.create({
        data: {
          userId: offer.proposerId,
          type: notificationType,
          title: input.response === "ACCEPTED" ? "Trade offer accepted!" : "Trade offer declined",
          content:
            input.response === "ACCEPTED"
              ? "Your trade offer was accepted. Time to ship!"
              : "Your trade offer was declined.",
          metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
        },
      });

      return updated;
    }),

  cancelOffer: protectedProcedure
    .input(z.object({ tradeOfferId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.tradeOffer.findUnique({
        where: { id: input.tradeOfferId },
      });

      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });

      if (offer.proposerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the proposer can cancel" });
      }

      if (offer.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending offers can be cancelled" });
      }

      return ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    }),
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

Expected: all tests passing

- [ ] **Step 5: Commit**

```bash
git add server/routers/trade.ts __tests__/lib/trade-offer.test.ts
git commit -m "feat: tradeRouter respondToOffer and cancelOffer"
```

---

### Task 5: `uploadTracking` + tests

**Files:**
- Modify: `server/routers/trade.ts`
- Modify: `__tests__/lib/trade-offer.test.ts`

- [ ] **Step 1: Add uploadTracking tests**

Append to `__tests__/lib/trade-offer.test.ts`:

```typescript
describe("trade.uploadTracking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("proposer upload sets SHIPPING status", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1",
      proposerId: "user-1",
      recipientId: "seller-1",
      status: "ACCEPTED",
      proposerTrackingNumber: null,
      recipientTrackingNumber: null,
      conversationId: "conv-1",
    });
    mockTradeOfferUpdate.mockResolvedValue({
      id: "offer-1",
      status: "SHIPPING",
      proposerTrackingNumber: "TRACK123",
    });
    const caller = createCaller({
      ...buyerCtx,
      prisma: {
        ...buyerCtx.prisma,
        tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate },
        notification: { create: mockNotificationCreate },
      } as any,
    });
    const result = await caller.uploadTracking({
      tradeOfferId: "offer-1",
      trackingNumber: "TRACK123",
    });
    expect(result.status).toBe("SHIPPING");
  });

  it("when both legs uploaded, status becomes COMPLETED", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1",
      proposerId: "user-1",
      recipientId: "seller-1",
      status: "SHIPPING",
      proposerTrackingNumber: "TRACK123",   // proposer already uploaded
      recipientTrackingNumber: null,
      conversationId: "conv-1",
    });
    mockTradeOfferUpdate.mockResolvedValue({
      id: "offer-1",
      status: "COMPLETED",
      proposerTrackingNumber: "TRACK123",
      recipientTrackingNumber: "TRACK456",
    });
    const caller = createCaller({
      ...buyerCtx,
      user: { id: "seller-1", name: "Seller" } as any,
      session: { session: {} as any, user: { id: "seller-1", name: "Seller" } } as any,
      prisma: {
        ...buyerCtx.prisma,
        tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate },
        notification: { create: mockNotificationCreate },
      } as any,
    });
    const result = await caller.uploadTracking({
      tradeOfferId: "offer-1",
      trackingNumber: "TRACK456",
    });
    expect(result.status).toBe("COMPLETED");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

Expected: FAIL on uploadTracking tests

- [ ] **Step 3: Add uploadTracking to `server/routers/trade.ts`**

```typescript
  uploadTracking: protectedProcedure
    .input(
      z.object({
        tradeOfferId: z.string(),
        trackingNumber: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.tradeOffer.findUnique({
        where: { id: input.tradeOfferId },
      });

      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });

      const isProposer = offer.proposerId === ctx.user.id;
      const isRecipient = offer.recipientId === ctx.user.id;

      if (!isProposer && !isRecipient) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant in this trade" });
      }

      if (offer.status !== "ACCEPTED" && offer.status !== "SHIPPING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tracking can only be uploaded once the offer is accepted",
        });
      }

      const trackingUpdate = isProposer
        ? { proposerTrackingNumber: input.trackingNumber, proposerShippedAt: new Date() }
        : { recipientTrackingNumber: input.trackingNumber, recipientShippedAt: new Date() };

      const proposerTracking = isProposer
        ? input.trackingNumber
        : offer.proposerTrackingNumber;
      const recipientTracking = isRecipient
        ? input.trackingNumber
        : offer.recipientTrackingNumber;

      const bothShipped = !!proposerTracking && !!recipientTracking;

      const updated = await ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: {
          ...trackingUpdate,
          status: bothShipped ? "COMPLETED" : "SHIPPING",
          ...(bothShipped && { completedAt: new Date() }),
        },
      });

      const otherId = isProposer ? offer.recipientId : offer.proposerId;

      await ctx.prisma.notification.create({
        data: {
          userId: otherId,
          type: bothShipped ? "TRADE_OFFER_COMPLETED" : "TRADE_OFFER_SHIPPED",
          title: bothShipped ? "Trade complete!" : "Your trade partner has shipped",
          content: bothShipped
            ? "Both items have shipped. Trade complete!"
            : `${ctx.user.name} has shipped their item.`,
          metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
        },
      });

      if (bothShipped) {
        await ctx.prisma.notification.create({
          data: {
            userId: ctx.user.id,
            type: "TRADE_OFFER_COMPLETED",
            title: "Trade complete!",
            content: "Both items have shipped. Trade complete!",
            metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
          },
        });
      }

      return updated;
    }),
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

Expected: all tests passing

- [ ] **Step 5: Commit**

```bash
git add server/routers/trade.ts __tests__/lib/trade-offer.test.ts
git commit -m "feat: tradeRouter uploadTracking with dual-leg completion"
```

---

### Task 6: `getMyOffers` + `getOfferByConversation` + tests

**Files:**
- Modify: `server/routers/trade.ts`
- Modify: `__tests__/lib/trade-offer.test.ts`

- [ ] **Step 1: Add query tests**

Append to `__tests__/lib/trade-offer.test.ts`:

```typescript
const { mockTradeOfferFindMany, mockConversationParticipantFindUnique } = vi.hoisted(() => ({
  mockTradeOfferFindMany: vi.fn().mockResolvedValue([
    { id: "offer-1", proposerId: "user-1", status: "PENDING" },
    { id: "offer-2", recipientId: "user-1", status: "ACCEPTED" },
  ]),
  mockConversationParticipantFindUnique: vi.fn().mockResolvedValue({ userId: "user-1" }),
}));

describe("trade.getMyOffers", () => {
  it("returns offers for current user as both proposer and recipient", async () => {
    mockTradeOfferFindMany.mockResolvedValue([
      { id: "offer-1", proposerId: "user-1" },
      { id: "offer-2", recipientId: "user-1" },
    ]);
    const caller = createCaller({
      ...buyerCtx,
      prisma: {
        ...buyerCtx.prisma,
        tradeOffer: { findMany: mockTradeOfferFindMany },
      } as any,
    });
    const result = await caller.getMyOffers();
    expect(mockTradeOfferFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ proposerId: "user-1" }, { recipientId: "user-1" }],
        },
      }),
    );
    expect(result).toHaveLength(2);
  });
});

describe("trade.getOfferByConversation", () => {
  it("returns trade offer for a participant", async () => {
    mockConversationParticipantFindUnique.mockResolvedValue({ userId: "user-1" });
    mockTradeOfferFindUnique.mockResolvedValue({ id: "offer-1", conversationId: "conv-1" });
    const caller = createCaller({
      ...buyerCtx,
      prisma: {
        ...buyerCtx.prisma,
        conversationParticipant: { findUnique: mockConversationParticipantFindUnique },
        tradeOffer: { findUnique: mockTradeOfferFindUnique },
      } as any,
    });
    const result = await caller.getOfferByConversation({ conversationId: "conv-1" });
    expect(result).toHaveProperty("id", "offer-1");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

- [ ] **Step 3: Add queries to `server/routers/trade.ts`**

```typescript
  getMyOffers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.tradeOffer.findMany({
      where: {
        OR: [{ proposerId: ctx.user.id }, { recipientId: ctx.user.id }],
      },
      include: {
        requestedProduct: { select: { id: true, title: true, price: true, images: true } },
        offeredProduct: { select: { id: true, title: true, price: true, images: true } },
        proposer: { select: { id: true, name: true, image: true } },
        recipient: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getOfferByConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ctx.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      return ctx.prisma.tradeOffer.findUnique({
        where: { conversationId: input.conversationId },
        include: {
          requestedProduct: { select: { id: true, title: true, price: true, images: true } },
          offeredProduct: { select: { id: true, title: true, price: true, images: true } },
          proposer: { select: { id: true, name: true, image: true } },
          recipient: { select: { id: true, name: true, image: true } },
        },
      });
    }),
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run __tests__/lib/trade-offer.test.ts
```

Expected: all 13 cases passing

- [ ] **Step 5: Commit**

```bash
git add server/routers/trade.ts __tests__/lib/trade-offer.test.ts
git commit -m "feat: tradeRouter getMyOffers and getOfferByConversation"
```

---

### Task 7: Register tradeRouter + expose tradeEnabled + add getMyListings

**Files:**
- Modify: `server/index.ts`
- Modify: `server/routers/product.ts`

- [ ] **Step 1: Register tradeRouter in `server/index.ts`**

Add import:

```typescript
import { tradeRouter } from "./routers/trade";
```

Add to `appRouter`:

```typescript
export const appRouter = createTRPCRouter({
  chat: chatRouter,
  user: userRouter,
  notification: notificationRouter,
  organization: organizationRouter,
  admin: adminRouter,
  stripe: stripeRouter,
  product: productRouter,
  cart: cartRouter,
  order: orderRouter,
  review: reviewRouter,
  return: returnRouter,
  trade: tradeRouter,   // ADD THIS
});
```

- [ ] **Step 2: Add `tradeEnabled` to `createProductSchema` in `server/routers/product.ts`**

In `createProductSchema` (around line 32), after the `shipsFromCountry` field, add:

```typescript
  tradeEnabled: z.boolean().default(false),
```

In the `ctx.prisma.product.create` data block (where all the schema fields are mapped to Prisma), add:

```typescript
  tradeEnabled: input.tradeEnabled,
```

- [ ] **Step 3: Add `getMyListings` query to product router**

Add after the `getBySellerProfile` procedure in `server/routers/product.ts`:

```typescript
  getMyListings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.product.findMany({
      where: {
        seller: { userId: ctx.user.id },
        isActive: true,
      },
      select: { id: true, title: true, price: true, images: true },
      orderBy: { createdAt: "desc" },
    });
  }),
```

- [ ] **Step 4: Run full test suite to verify no regressions**

```bash
npx vitest run
```

Expected: all previously passing tests still pass + the new trade tests pass

- [ ] **Step 5: Commit**

```bash
git add server/index.ts server/routers/product.ts
git commit -m "feat: register tradeRouter, add tradeEnabled to product, add getMyListings"
```

---

### Task 8: Listing form — tradeEnabled toggle

**Files:**
- Modify: `components/dashboard/organizations/products/create/product-creation.tsx`
- Modify: `components/dashboard/organizations/products/create/product-pricing-form.tsx`

- [ ] **Step 1: Add `tradeEnabled` to `ProductFormData`**

In `product-creation.tsx`, the `ProductFormData` interface (around line 35) currently ends with `shipsFromCountry`. Add:

```typescript
  tradeEnabled: boolean;
```

In the `useEffect` or initial state where `formData` is initialized (around line 150 where `isActive: true` is set), add:

```typescript
  tradeEnabled: false,
```

In the `ctx.prisma.product.create` call (within `product-creation.tsx` where the tRPC mutation is called, look for `trpc.product.create.useMutation`), the `mutate()` call passes form data. Add `tradeEnabled: formData.tradeEnabled ?? false` to the mutation input.

- [ ] **Step 2: Add Switch to `product-pricing-form.tsx`**

Add `Switch` to the import from `@heroui/react`:

```typescript
import { Input, Card, CardBody, RadioGroup, Radio, Select, SelectItem, Switch } from "@heroui/react";
```

At the bottom of the form (just before the closing `</form>`), add:

```tsx
        <div className="col-span-12 border-t border-zinc-700 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small font-medium text-default-700">Accept trade offers</p>
              <p className="text-xs text-default-400 mt-0.5">
                Allow buyers to propose item swaps or cash offers for this listing
              </p>
            </div>
            <Switch
              isSelected={data.tradeEnabled ?? false}
              onValueChange={(val) => onUpdate({ tradeEnabled: val })}
              size="sm"
            />
          </div>
        </div>
```

- [ ] **Step 3: Run vitest to verify no regressions**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/organizations/products/create/product-creation.tsx \
        components/dashboard/organizations/products/create/product-pricing-form.tsx
git commit -m "feat: add tradeEnabled toggle to product listing form"
```

---

### Task 9: Product page — Propose Trade button

**Files:**
- Modify: `components/product-layout/product-view-item.tsx`
- Modify: `app/(main)/products/[product]/page.tsx`

- [ ] **Step 1: Add `tradeEnabled` prop and Propose Trade button to `product-view-item.tsx`**

Find the props interface for `ProductViewInfo` (look for where `sellerId?: string` was added). Add:

```typescript
  tradeEnabled?: boolean;
```

Find where `sellerId` is destructured from props. Add `tradeEnabled` alongside it.

Find the "Message Seller" secondary CTA button (the full-width bordered button at the bottom of the CTAs). After it, add:

```tsx
{tradeEnabled && (sellerAction === "message" || sellerAction === "guest") && (
  <Button
    variant="bordered"
    size="lg"
    fullWidth
    startContent={<Icon icon="solar:transfer-horizontal-linear" width={18} />}
    onPress={() => {
      if (sellerAction === "guest") {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      } else {
        setTradeModalOpen(true);
      }
    }}
  >
    Propose Trade
  </Button>
)}
```

Add state at the top of the component (alongside existing state):

```typescript
const [tradeModalOpen, setTradeModalOpen] = React.useState(false);
```

Add the `ProposeTradeModal` at the bottom of the return, alongside the existing report modal:

```tsx
{tradeModalOpen && (
  <ProposeTradeModal
    isOpen={tradeModalOpen}
    onClose={() => setTradeModalOpen(false)}
    requestedProductId={id}
    requestedProductName={name}
    requestedProductImage={images[0]}
  />
)}
```

Import `ProposeTradeModal` at the top:

```typescript
import ProposeTradeModal from "@/components/product/propose-trade-modal";
```

- [ ] **Step 2: Pass `tradeEnabled` from the product page**

In `app/(main)/products/[product]/page.tsx`, in the `productViewItem` object (around where `sellerId: p.seller?.userId` was added), add:

```typescript
    tradeEnabled: p.tradeEnabled ?? false,
```

- [ ] **Step 3: Run vitest**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add components/product-layout/product-view-item.tsx \
        app/(main)/products/[product]/page.tsx
git commit -m "feat: add Propose Trade button to product page"
```

---

### Task 10: `ProposeTradeModal` component

**Files:**
- Create: `components/product/propose-trade-modal.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Spinner,
  Image,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";

interface ProposeTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestedProductId: string;
  requestedProductName: string;
  requestedProductImage?: string;
}

export default function ProposeTradeModal({
  isOpen,
  onClose,
  requestedProductId,
  requestedProductName,
  requestedProductImage,
}: ProposeTradeModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [offeredProductId, setOfferedProductId] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState<string>("");
  const [message, setMessage] = useState("");

  const { data: myListings = [], isLoading: listingsLoading } =
    trpc.product.getMyListings.useQuery();

  const proposeOffer = trpc.trade.proposeOffer.useMutation({
    onSuccess: (data) => {
      toast.success("Trade offer sent!");
      onClose();
      router.push(`/dashboard/inbox?conversation=${data.conversationId}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const selectedListing = myListings.find((l: any) => l.id === offeredProductId);
  const cash = parseFloat(cashAmount) || 0;
  const canProceed = !!offeredProductId || cash > 0;

  const handleSubmit = () => {
    proposeOffer.mutate({
      requestedProductId,
      offeredProductId: offeredProductId ?? undefined,
      cashAmount: cash > 0 ? cash : undefined,
      message: message.trim() || undefined,
    });
  };

  const handleClose = () => {
    setStep(1);
    setOfferedProductId(null);
    setCashAmount("");
    setMessage("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose} size="md">
      <ModalContent>
        <ModalHeader>
          {step === 1 ? "Propose a Trade" : "Confirm Your Offer"}
        </ModalHeader>

        <ModalBody>
          {step === 1 && (
            <div className="flex flex-col gap-4">
              {listingsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : myListings.length === 0 ? (
                <p className="text-sm text-default-500">
                  You have no active listings. You can still make a cash offer below.
                </p>
              ) : (
                <Select
                  label="Item to offer"
                  labelPlacement="outside"
                  placeholder="Select one of your listings"
                  selectedKeys={offeredProductId ? [offeredProductId] : []}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    setOfferedProductId(val === "cash_only" ? null : val);
                  }}
                  classNames={{
                    label: "text-small font-medium text-default-700",
                  }}
                >
                  <>
                    <SelectItem key="cash_only">Cash only (no item)</SelectItem>
                    {myListings.map((l: any) => (
                      <SelectItem key={l.id}>{l.title}</SelectItem>
                    ))}
                  </>
                </Select>
              )}

              <Input
                label="Cash sweetener (optional)"
                labelPlacement="outside"
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onValueChange={setCashAmount}
                startContent={
                  <span className="text-default-400 text-small pointer-events-none">£</span>
                }
                classNames={{
                  label: "text-small font-medium text-default-700",
                }}
              />

              <Textarea
                label="Message (optional)"
                labelPlacement="outside"
                placeholder="Add context about your offer..."
                value={message}
                onValueChange={setMessage}
                minRows={2}
                classNames={{
                  label: "text-small font-medium text-default-700",
                }}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {selectedListing ? (
                  <div className="flex flex-col items-center gap-1 flex-1 text-center">
                    <Image
                      src={selectedListing.images?.[0] || "/placeholder-product.jpg"}
                      alt={selectedListing.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <p className="text-xs text-default-600 line-clamp-2">{selectedListing.title}</p>
                    <p className="text-xs font-medium">£{Number(selectedListing.price).toFixed(2)}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 flex-1 text-center">
                    <div className="w-20 h-20 rounded-lg bg-default-100 flex items-center justify-center">
                      <Icon icon="solar:dollar-minimalistic-linear" width={32} className="text-default-400" />
                    </div>
                    <p className="text-xs text-default-600">Cash offer</p>
                    <p className="text-xs font-medium">£{cash.toFixed(2)}</p>
                  </div>
                )}

                <Icon icon="solar:transfer-horizontal-linear" width={24} className="text-default-400 flex-shrink-0" />

                <div className="flex flex-col items-center gap-1 flex-1 text-center">
                  <Image
                    src={requestedProductImage || "/placeholder-product.jpg"}
                    alt={requestedProductName}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <p className="text-xs text-default-600 line-clamp-2">{requestedProductName}</p>
                </div>
              </div>

              {cash > 0 && selectedListing && (
                <p className="text-xs text-center text-default-500">
                  including £{cash.toFixed(2)} cash sweetener
                </p>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 1 ? (
            <>
              <Button variant="flat" onPress={handleClose}>Cancel</Button>
              <Button
                color="primary"
                isDisabled={!canProceed}
                onPress={() => setStep(2)}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="flat" onPress={() => setStep(1)}>Back</Button>
              <Button
                color="primary"
                isLoading={proposeOffer.isPending}
                onPress={handleSubmit}
              >
                Send Offer
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 2: Run vitest**

```bash
npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add components/product/propose-trade-modal.tsx
git commit -m "feat: ProposeTradeModal two-step offer flow"
```

---

### Task 11: `TradeOfferCard` component + tests

**Files:**
- Create: `components/dashboard/inbox/trade-offer-card.tsx`
- Create: `__tests__/components/trade-offer-card.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/trade-offer-card.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TradeOfferCard from "@/components/dashboard/inbox/trade-offer-card";

vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    trade: {
      respondToOffer: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      cancelOffer: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      uploadTracking: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const baseOffer = {
  id: "offer-1",
  proposerId: "user-1",
  recipientId: "seller-1",
  status: "PENDING",
  cashAmount: null,
  offeredProductId: "prod-offered",
  requestedProductId: "prod-requested",
  conversationId: "conv-1",
  proposerTrackingNumber: null,
  recipientTrackingNumber: null,
  requestedProduct: { id: "prod-requested", title: "Mbappe Sticker", price: 15, images: [] },
  offeredProduct: { id: "prod-offered", title: "Ronaldo Sticker", price: 12, images: [] },
  proposer: { id: "user-1", name: "Buyer" },
  recipient: { id: "seller-1", name: "Seller" },
};

describe("TradeOfferCard", () => {
  it("recipient sees Accept and Decline when PENDING", () => {
    render(<TradeOfferCard offer={baseOffer as any} currentUserId="seller-1" />);
    expect(screen.getByText("Accept")).toBeDefined();
    expect(screen.getByText("Decline")).toBeDefined();
  });

  it("proposer sees Cancel when PENDING", () => {
    render(<TradeOfferCard offer={baseOffer as any} currentUserId="user-1" />);
    expect(screen.getByText("Cancel Offer")).toBeDefined();
    expect(screen.queryByText("Accept")).toBeNull();
  });

  it("shows Upload Tracking button when ACCEPTED", () => {
    render(
      <TradeOfferCard
        offer={{ ...baseOffer, status: "ACCEPTED" } as any}
        currentUserId="user-1"
      />,
    );
    expect(screen.getByText("Upload Tracking")).toBeDefined();
  });

  it("shows Trade Complete banner when COMPLETED", () => {
    render(
      <TradeOfferCard
        offer={{ ...baseOffer, status: "COMPLETED" } as any}
        currentUserId="user-1"
      />,
    );
    expect(screen.getByText("Trade Complete")).toBeDefined();
    expect(screen.queryByText("Upload Tracking")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run __tests__/components/trade-offer-card.test.ts
```

- [ ] **Step 3: Create `components/dashboard/inbox/trade-offer-card.tsx`**

```tsx
"use client";

import React, { useState } from "react";
import { Button, Chip, Image, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import { resolveTradeOfferActions } from "@/lib/trade-action";
import type { TradeViewerRole } from "@/lib/trade-action";

interface TradeProduct {
  id: string;
  title: string;
  price: number | string;
  images: string[];
}

interface TradeOfferData {
  id: string;
  proposerId: string;
  recipientId: string;
  status: string;
  cashAmount: number | string | null;
  offeredProductId: string | null;
  requestedProductId: string;
  conversationId: string;
  proposerTrackingNumber: string | null;
  recipientTrackingNumber: string | null;
  requestedProduct: TradeProduct;
  offeredProduct: TradeProduct | null;
  proposer: { id: string; name: string };
  recipient: { id: string; name: string };
}

interface TradeOfferCardProps {
  offer: TradeOfferData;
  currentUserId: string;
  onUpdate?: () => void;
}

const STATUS_CHIP: Record<string, { color: "warning" | "primary" | "secondary" | "success" | "danger" | "default"; label: string }> = {
  PENDING:   { color: "warning",   label: "Pending" },
  ACCEPTED:  { color: "primary",   label: "Accepted" },
  SHIPPING:  { color: "secondary", label: "Shipping" },
  COMPLETED: { color: "success",   label: "Complete" },
  DECLINED:  { color: "danger",    label: "Declined" },
  CANCELLED: { color: "default",   label: "Cancelled" },
  EXPIRED:   { color: "default",   label: "Expired" },
  DISPUTED:  { color: "danger",    label: "Disputed" },
};

export default function TradeOfferCard({ offer, currentUserId, onUpdate }: TradeOfferCardProps) {
  const [trackingInput, setTrackingInput] = useState("");
  const [showTrackingInput, setShowTrackingInput] = useState(false);

  const viewerRole: TradeViewerRole =
    offer.proposerId === currentUserId ? "proposer" : "recipient";

  const viewerHasUploaded =
    viewerRole === "proposer"
      ? !!offer.proposerTrackingNumber
      : !!offer.recipientTrackingNumber;

  const actions = resolveTradeOfferActions(viewerRole, offer.status, viewerHasUploaded);

  const respondMutation = trpc.trade.respondToOffer.useMutation({
    onSuccess: () => { toast.success("Response sent"); onUpdate?.(); },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.trade.cancelOffer.useMutation({
    onSuccess: () => { toast.success("Offer cancelled"); onUpdate?.(); },
    onError: (e) => toast.error(e.message),
  });

  const trackingMutation = trpc.trade.uploadTracking.useMutation({
    onSuccess: () => { toast.success("Tracking uploaded!"); setShowTrackingInput(false); onUpdate?.(); },
    onError: (e) => toast.error(e.message),
  });

  const chip = STATUS_CHIP[offer.status] ?? { color: "default", label: offer.status };
  const cash = offer.cashAmount ? Number(offer.cashAmount) : 0;

  return (
    <div className="border-b border-zinc-800 px-4 py-3 bg-zinc-950">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-default-500 uppercase tracking-wide">Trade Offer</span>
        <Chip color={chip.color} size="sm" variant="flat">{chip.label}</Chip>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {offer.offeredProduct ? (
          <div className="flex flex-col items-center gap-1 flex-1 text-center min-w-0">
            <Image
              src={offer.offeredProduct.images?.[0] || "/placeholder-product.jpg"}
              alt={offer.offeredProduct.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <p className="text-xs text-default-600 line-clamp-1">{offer.offeredProduct.title}</p>
            <p className="text-xs font-medium">£{Number(offer.offeredProduct.price).toFixed(2)}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 flex-1 text-center">
            <div className="w-16 h-16 rounded-lg bg-default-100 flex items-center justify-center">
              <Icon icon="solar:dollar-minimalistic-linear" width={28} className="text-default-400" />
            </div>
            <p className="text-xs text-default-600">Cash offer</p>
            <p className="text-xs font-medium">£{cash.toFixed(2)}</p>
          </div>
        )}

        <Icon icon="solar:transfer-horizontal-linear" width={20} className="text-default-400 flex-shrink-0" />

        <div className="flex flex-col items-center gap-1 flex-1 text-center min-w-0">
          <Image
            src={offer.requestedProduct.images?.[0] || "/placeholder-product.jpg"}
            alt={offer.requestedProduct.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <p className="text-xs text-default-600 line-clamp-1">{offer.requestedProduct.title}</p>
          <p className="text-xs font-medium">£{Number(offer.requestedProduct.price).toFixed(2)}</p>
        </div>
      </div>

      {cash > 0 && offer.offeredProduct && (
        <p className="text-xs text-center text-default-400 mb-2">+ £{cash.toFixed(2)} cash sweetener</p>
      )}

      {offer.status === "COMPLETED" ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <Icon icon="solar:check-circle-bold" width={16} className="text-success" />
          <span className="text-sm font-medium text-success">Trade Complete</span>
        </div>
      ) : (
        <div className="flex gap-2 mt-2">
          {actions.canAccept && (
            <Button
              size="sm"
              color="success"
              variant="flat"
              isLoading={respondMutation.isPending}
              onPress={() => respondMutation.mutate({ tradeOfferId: offer.id, response: "ACCEPTED" })}
            >
              Accept
            </Button>
          )}
          {actions.canDecline && (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              isLoading={respondMutation.isPending}
              onPress={() => respondMutation.mutate({ tradeOfferId: offer.id, response: "DECLINED" })}
            >
              Decline
            </Button>
          )}
          {actions.canCancel && (
            <Button
              size="sm"
              variant="flat"
              isLoading={cancelMutation.isPending}
              onPress={() => cancelMutation.mutate({ tradeOfferId: offer.id })}
            >
              Cancel Offer
            </Button>
          )}
          {actions.canUploadTracking && !showTrackingInput && (
            <Button
              size="sm"
              color="primary"
              onPress={() => setShowTrackingInput(true)}
            >
              Upload Tracking
            </Button>
          )}
          {actions.hasUploaded && !actions.canUploadTracking && (
            <div className="flex items-center gap-1 text-xs text-success">
              <Icon icon="solar:check-circle-bold" width={14} />
              Tracking uploaded
            </div>
          )}
        </div>
      )}

      {showTrackingInput && (
        <div className="flex gap-2 mt-2">
          <Input
            size="sm"
            placeholder="Tracking number"
            value={trackingInput}
            onValueChange={setTrackingInput}
            className="flex-1"
          />
          <Button
            size="sm"
            color="primary"
            isLoading={trackingMutation.isPending}
            isDisabled={!trackingInput.trim()}
            onPress={() =>
              trackingMutation.mutate({ tradeOfferId: offer.id, trackingNumber: trackingInput.trim() })
            }
          >
            Submit
          </Button>
          <Button size="sm" variant="flat" onPress={() => setShowTrackingInput(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run __tests__/components/trade-offer-card.test.ts
```

Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/inbox/trade-offer-card.tsx \
        __tests__/components/trade-offer-card.test.ts
git commit -m "feat: TradeOfferCard component with action buttons"
```

---

### Task 12: Inbox extensions

**Files:**
- Modify: `components/dashboard/inbox/messaging-chat-inbox.tsx`
- Modify: `components/dashboard/inbox/messaging-chat-window.tsx`

- [ ] **Step 1: Add trade status chip in `messaging-chat-inbox.tsx`**

Add `Chip` to the `@heroui/react` import line.

Inside the conversation list rendering (in the `ListboxItem` content, just after the `<div className="text-small text-default-400 flex-shrink-0 ml-2">` time block), add a trade chip:

```tsx
{conversation.type === "TRADE" && (conversation as any).tradeOffer && (
  <Chip
    size="sm"
    variant="flat"
    color={
      (conversation as any).tradeOffer.status === "PENDING"    ? "warning"
      : (conversation as any).tradeOffer.status === "ACCEPTED" ? "primary"
      : (conversation as any).tradeOffer.status === "SHIPPING" ? "secondary"
      : (conversation as any).tradeOffer.status === "COMPLETED"? "success"
      : "default"
    }
    className="text-tiny ml-1"
  >
    {(conversation as any).tradeOffer.status === "PENDING"    ? "Pending"
    : (conversation as any).tradeOffer.status === "ACCEPTED"  ? "Accepted"
    : (conversation as any).tradeOffer.status === "SHIPPING"  ? "Shipping"
    : (conversation as any).tradeOffer.status === "COMPLETED" ? "Complete"
    : (conversation as any).tradeOffer.status}
  </Chip>
)}
```

Note: the `chat.conversations` query does not yet return `tradeOffer` data. Update the `chatRouter.conversations` query in `server/routers/chat.ts` to include the trade offer on TRADE conversations by adding this after the `orgConvMap` lookup block:

```typescript
// Fetch trade offers for TRADE conversations
const tradeConvIds = conversations
  .filter((c: any) => c.type === "TRADE")
  .map((c: any) => c.id);

const tradeOffers = tradeConvIds.length > 0
  ? await ctx.prisma.tradeOffer.findMany({
      where: { conversationId: { in: tradeConvIds } },
      select: { conversationId: true, status: true, id: true },
    })
  : [];

const tradeOfferMap = new Map(tradeOffers.map((o: any) => [o.conversationId, o]));
```

Then in the `conversationsWithDecrypted` map, add:

```typescript
const tradeOffer = tradeOfferMap.get(conversation.id);
if (tradeOffer) {
  result.tradeOffer = tradeOffer;
}
```

- [ ] **Step 2: Add TradeOfferCard to `messaging-chat-window.tsx`**

Add import at the top:

```typescript
import TradeOfferCard from "./trade-offer-card";
```

Inside the returned JSX (in the main `return (<div ref={ref} {...props}>...)` block), after `<MessagingChatHeader ... />` and before the `<ScrollShadow>` message list, add:

```tsx
{currentConversation?.type === "TRADE" && conversationId && (
  <TradeOfferWindowLoader
    conversationId={conversationId}
    currentUserId={currentUserId || ""}
  />
)}
```

Add the loader component inline in the same file (before the main component):

```tsx
function TradeOfferWindowLoader({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const { data: offer } = trpc.trade.getOfferByConversation.useQuery(
    { conversationId },
    { enabled: !!conversationId },
  );

  if (!offer) return null;

  return <TradeOfferCard offer={offer as any} currentUserId={currentUserId} />;
}
```

- [ ] **Step 3: Run vitest**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/inbox/messaging-chat-inbox.tsx \
        components/dashboard/inbox/messaging-chat-window.tsx \
        server/routers/chat.ts
git commit -m "feat: inbox trade status chips and TradeOfferCard in chat window"
```

---

### Task 13: Dashboard trades page + sidebar link

**Files:**
- Create: `app/(dashboard)/dashboard/trades/page.tsx`
- Modify: `components/sidebar/dashboard/sidebar-items.tsx`

- [ ] **Step 1: Create `app/(dashboard)/dashboard/trades/page.tsx`**

```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner, Tabs, Tab, Button, Chip, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { trpc } from "@/lib/trpc-client";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

function TradeRow({ offer, currentUserId }: { offer: any; currentUserId: string }) {
  const router = useRouter();
  const isProposer = offer.proposerId === currentUserId;
  const otherUser = isProposer ? offer.recipient : offer.proposer;

  const STATUS_COLOR: Record<string, "warning" | "primary" | "secondary" | "success" | "danger" | "default"> = {
    PENDING: "warning", ACCEPTED: "primary", SHIPPING: "secondary",
    COMPLETED: "success", DECLINED: "danger", CANCELLED: "default", EXPIRED: "default",
  };

  return (
    <div className="flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
      <Avatar src={otherUser?.image} name={otherUser?.name} size="sm" />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {offer.offeredProduct ? (
          <img
            src={offer.offeredProduct.images?.[0] || "/placeholder-product.jpg"}
            alt={offer.offeredProduct.title}
            className="w-10 h-10 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-default-100 flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:dollar-minimalistic-linear" width={16} className="text-default-400" />
          </div>
        )}
        <Icon icon="solar:transfer-horizontal-linear" width={14} className="text-default-400 flex-shrink-0" />
        <img
          src={offer.requestedProduct.images?.[0] || "/placeholder-product.jpg"}
          alt={offer.requestedProduct.title}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-default-600 line-clamp-1">{otherUser?.name}</p>
          <p className="text-xs text-default-400">
            {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <Chip
        size="sm"
        variant="flat"
        color={STATUS_COLOR[offer.status] ?? "default"}
      >
        {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
      </Chip>

      <Button
        size="sm"
        variant="flat"
        onPress={() => router.push(`/dashboard/inbox?conversation=${offer.conversationId}`)}
      >
        View
      </Button>
    </div>
  );
}

export default function TradesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { data: offers = [], isLoading } = trpc.trade.getMyOffers.useQuery();

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/login");
  }, [session, isPending, router]);

  if (isPending || typeof window === "undefined") {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentUserId = session?.user?.id || "";
  const received = offers.filter((o: any) => o.recipientId === currentUserId);
  const sent = offers.filter((o: any) => o.proposerId === currentUserId);

  return (
    <SidebarWrapper>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Trades</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Tabs aria-label="Trade tabs" fullWidth>
            <Tab key="received" title={`Received (${received.length})`}>
              {received.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="solar:transfer-horizontal-linear" width={48} className="mx-auto mb-3 text-default-300" />
                  <p className="text-default-500 mb-4">No trade offers received yet</p>
                  <Button variant="flat" onPress={() => router.push("/shop")}>Browse Listings</Button>
                </div>
              ) : (
                received.map((o: any) => (
                  <TradeRow key={o.id} offer={o} currentUserId={currentUserId} />
                ))
              )}
            </Tab>
            <Tab key="sent" title={`Sent (${sent.length})`}>
              {sent.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="solar:transfer-horizontal-linear" width={48} className="mx-auto mb-3 text-default-300" />
                  <p className="text-default-500 mb-4">You haven&apos;t sent any trade offers yet</p>
                  <Button variant="flat" onPress={() => router.push("/shop")}>Browse Listings</Button>
                </div>
              ) : (
                sent.map((o: any) => (
                  <TradeRow key={o.id} offer={o} currentUserId={currentUserId} />
                ))
              )}
            </Tab>
          </Tabs>
        )}
      </div>
    </SidebarWrapper>
  );
}
```

- [ ] **Step 2: Add Trades link to sidebar**

In `components/sidebar/dashboard/sidebar-items.tsx`, after the inbox entry (around line 99):

```typescript
        {
          key: "trades",
          href: "/dashboard/trades",
          icon: "solar:transfer-horizontal-linear",
          title: "Trades",
        },
```

- [ ] **Step 3: Run vitest**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/dashboard/trades/page.tsx \
        components/sidebar/dashboard/sidebar-items.tsx
git commit -m "feat: dashboard trades page and sidebar link"
```

---

### Task 14: Full test suite + final commit

**Files:** No new files — verification only

- [ ] **Step 1: Run full test suite**

```bash
cd /path/to/mdfld-web && npx vitest run
```

Expected: all previously passing tests still pass, new tests all pass. The 2 pre-existing failures in `adminProductMutations.test.ts` (ADMIN role on deleteProduct/updateProduct) are unrelated — they are pre-existing and should remain as the only failures.

- [ ] **Step 2: TypeScript build check**

```bash
npx tsc --noEmit
```

Expected: only the pre-existing TS2589 deep instantiation error in `team/app.tsx`. No new errors.

- [ ] **Step 3: Stage and commit all remaining changes in one shot**

```bash
git add -A
git status  # review what's staged — ensure no plan/spec docs are included
git commit -m "feat: trade/swap offer flow — full feature complete"
```

Note: Do NOT include docs/superpowers/plans/ or docs/superpowers/specs/ in the commit.
