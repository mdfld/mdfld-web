# User Search — Design Spec
**Date:** 2026-06-04

## Overview

Add live user/profile search to the existing nav search overlay. As a visitor or logged-in user types in the search bar, a "People" section appears inline showing matching profiles by name or username. Clicking a result navigates to that user's profile page.

## Backend

**New procedure:** `user.publicSearch` — `publicProcedure` on the existing user router.

```
Input:  { query: string (minLength 2), limit?: number (default 5, max 10) }
Output: Array<{ id, name, username, image }>
```

- Searches `name` and `username` fields only (no email — public endpoint, email must not be exposed)
- Case-insensitive `contains` match on both fields (OR)
- Returns at most 5 results by default
- No auth required
- The existing `user.search` protectedProcedure is unchanged (used by inbox/new-chat with email search)

## Frontend

**File:** `components/main-navbar/page.tsx`

**State additions:**
- `debouncedVal` — derived from `searchVal` with 300ms debounce (setTimeout ref pattern, no new dependency)

**Query:**
```ts
trpc.user.publicSearch.useQuery(
  { query: debouncedVal },
  { enabled: debouncedVal.length >= 2 }
)
```

**Overlay layout (top to bottom):**
1. Search input row (unchanged)
2. **People section** — renders only when `debouncedVal.length >= 2`
   - Loading: single faint "Searching..." line
   - Results: up to 5 user rows — avatar (initial fallback if no image) + display name + `@username`; full row clickable
   - No results: section hidden entirely
3. Popular tags (unchanged, always visible)

**On user result click:**
- `router.push('/users/' + username)`
- `setSearchOpen(false)`
- `setSearchVal('')`

## UX Details

- Debounce delay: 300ms
- Min query length: 2 characters
- Max results displayed: 5
- Avatar fallback: first character of name, uppercase, on the same teal accent background used elsewhere in the navbar
- No pagination — 5 results is the cap; users can refine their query to narrow down
- ESC still closes the overlay (existing behavior unchanged)
- Enter/submit still routes to `/shop?q=...` (existing behavior unchanged)

## What Is Not In Scope

- Product search results in the overlay (product search remains submit-only to /shop)
- Pagination or "see all" for user results
- Filtering by role, seller status, or other attributes
- Email search on the public endpoint
