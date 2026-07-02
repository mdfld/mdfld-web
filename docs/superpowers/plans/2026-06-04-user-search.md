# User Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `publicSearch` tRPC query and wire it into the nav search overlay as a live "People" section.

**Architecture:** New `publicProcedure` on the user router searches name/username (no email, no auth). The navbar debounces input and shows up to 5 user rows between the search input and the popular tags; clicking a row navigates to `/users/[username]`.

**Tech Stack:** tRPC publicProcedure, Prisma, React useState/useEffect (debounce via ref), Next.js router

---

## Files

| Action | Path |
|--------|------|
| Modify | `server/routers/user.ts` |
| Create | `__tests__/lib/user-public-search.test.ts` |
| Modify | `components/main-navbar/page.tsx` |

---

### Task 1: publicSearch procedure (TDD)

**Files:**
- Create: `__tests__/lib/user-public-search.test.ts`
- Modify: `server/routers/user.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/user-public-search.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const mockUserFindMany = vi.fn();

vi.hoisted(() => {
  return {};
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: mockUserFindMany,
    },
  },
}));

import { createCallerFactory } from "@/server/trpc";
import { userRouter } from "@/server/routers/user";

const createCaller = createCallerFactory(userRouter);

// publicSearch has no auth requirement — pass empty context
const publicCtx = { req: {} as any, res: {} as any, session: null, user: null, prisma: { user: { findMany: mockUserFindMany } } as any };

describe("user.publicSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns users matching name or username", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "u1", name: "Ayoola Test", username: "ayoola", image: null },
    ]);
    const caller = createCaller(publicCtx);
    const result = await caller.publicSearch({ query: "ayo" });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("ayoola");
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: "ayo", mode: "insensitive" } },
            { username: { contains: "ayo", mode: "insensitive" } },
          ]),
        }),
        take: 5,
      })
    );
  });

  it("does not expose email in results", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "u1", name: "Test User", username: "testuser", image: null },
    ]);
    const caller = createCaller(publicCtx);
    const result = await caller.publicSearch({ query: "test" });
    expect((result[0] as any).email).toBeUndefined();
  });

  it("rejects query shorter than 2 chars", async () => {
    const caller = createCaller(publicCtx);
    await expect(caller.publicSearch({ query: "a" })).rejects.toThrow();
  });

  it("returns empty array when no users found", async () => {
    mockUserFindMany.mockResolvedValue([]);
    const caller = createCaller(publicCtx);
    const result = await caller.publicSearch({ query: "zzz" });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/lib/user-public-search.test.ts
```

Expected: FAIL — `publicSearch` does not exist yet.

- [ ] **Step 3: Add publicSearch to the user router**

In `server/routers/user.ts`, add `publicProcedure` to the import on line 2:

```typescript
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc";
```

Then add `publicSearch` to the `userRouter` object, immediately before the existing `search` procedure:

```typescript
  publicSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(10).optional().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { username: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        take: input.limit,
      });
      return users;
    }),
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run __tests__/lib/user-public-search.test.ts
```

Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add __tests__/lib/user-public-search.test.ts server/routers/user.ts
git commit -m "feat: add user.publicSearch tRPC procedure"
```

---

### Task 2: Live People section in the search overlay

**Files:**
- Modify: `components/main-navbar/page.tsx`

- [ ] **Step 1: Add debounce state and query**

In `MainNavbar`, add directly after the `const [searchVal, setSearchVal] = useState('');` line:

```typescript
const [debouncedVal, setDebouncedVal] = React.useState('');
```

After the existing `useEffect` blocks (around line 208), add the debounce effect:

```typescript
useEffect(() => {
  const t = setTimeout(() => setDebouncedVal(searchVal), 300);
  return () => clearTimeout(t);
}, [searchVal]);
```

After the existing tRPC data hooks (around line 179), add the user search query:

```typescript
const { data: userResults = [], isFetching: userFetching } = trpc.user.publicSearch.useQuery(
  { query: debouncedVal },
  { enabled: debouncedVal.length >= 2 }
);
```

- [ ] **Step 2: Render the People section in the overlay**

In the search overlay JSX (inside `.nb-search-overlay` → `.nb-search-box`), locate the `<form>` block that ends around line 549. Immediately after the closing `</form>` tag and before the popular tags `<div>`, insert the People section:

```tsx
{debouncedVal.length >= 2 && (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
        People
      </span>
      {userFetching && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em' }}>
          Searching...
        </span>
      )}
    </div>
    {!userFetching && userResults.length === 0 && (
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: "'Barlow',sans-serif" }}>
        No users found
      </span>
    )}
    {userResults.map((u) => (
      <button
        key={u.id}
        onClick={() => {
          if (!u.username) return;
          router.push(`/users/${u.username}`);
          setSearchOpen(false);
          setSearchVal('');
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', background: 'transparent', border: 'none',
          padding: '8px 0', cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(0,212,182,0.15)',
          border: '1px solid rgba(0,212,182,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {u.image ? (
            <img src={u.image} alt={u.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 900, color: ACCENT }}>
              {(u.name ?? u.username ?? '?')[0].toUpperCase()}
            </span>
          )}
        </div>
        {/* Name + username */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {u.name ?? u.username}
          </div>
          {u.username && (
            <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>
              @{u.username}
            </div>
          )}
        </div>
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/ayoola/mdfld-web && npx tsc --noEmit 2>&1
```

Expected: only the pre-existing TS2589 in `team/app.tsx`. No new errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/mdfld-web && git add components/main-navbar/page.tsx
git commit -m "feat: live user search in nav overlay"
```

---

### Task 3: Full test suite verification

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/ayoola/mdfld-web && npx vitest run 2>&1
```

Expected: all previously passing tests still pass + 4 new tests pass. 2 pre-existing failures in `adminProductMutations.test.ts` are expected (ADMIN role RBAC).

- [ ] **Step 2: Confirm total count**

Expected: 196 pass, 2 fail (pre-existing).

- [ ] **Step 3: No action needed — sprint complete**

Both commits are already on `feature/admin-rbac-mor`. No additional commit needed unless tests revealed a fix.
