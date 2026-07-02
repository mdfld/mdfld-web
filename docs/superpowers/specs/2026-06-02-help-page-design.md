# Help Page — Design Spec
**Date:** 2026-06-02
**Status:** Approved

---

## Overview

A public `/help` page for MDFLD. Buyers, sellers, and prospective users can find answers without logging in. The dashboard "Help & Information" sidebar button routes here.

---

## Route & Access

- **URL:** `/help`
- **Layout:** Main site layout (public navbar + footer) — same as `/shop`, `/about`
- **Auth required:** No — fully public
- **Dashboard link:** Sidebar "Help & Information" button updated to `router.push("/help")`

---

## Layout

**Hero section**
- Heading: "How can we help?"
- Subheading: "Answers for buyers, sellers, and everything in between"
- Search input below the heading — client-side, searches across all sections

**Tab pills**
- Five tabs: Buying · Selling · Authentication · Returns · Contact
- Active tab highlighted in primary teal (`bg-primary`)
- On mobile: pills scroll horizontally (`overflow-x: auto`, `whitespace-nowrap`), no wrapping

**Accordion Q&As**
- Rendered from the active tab's questions
- Each item: question row (click to expand) + answer body
- Only one item open at a time (closing others on open is optional — default: multiple can be open)
- Active/open item has teal border (`border-primary`)

**Search behaviour**
- As user types, filter Q&As across ALL sections (not just active tab)
- Show results grouped by section with a section label above each group
- When search is active, tab pills are hidden (results replace them)
- Clear search → returns to tabbed view, restores last active tab
- No results state: "No results for [query] — try a different term or contact us"

**Still need help? strip**
- Below the accordion on every tab
- Text: "Still need help? Our team usually responds within 24 hours."
- Button: "Contact us →" links to `/contact`

---

## Content Structure

All Q&As live in `lib/help-content.ts`. Shape:

```ts
export interface HelpQuestion {
  q: string;
  a: string; // plain text, may include line breaks
}

export interface HelpSection {
  id: string;
  label: string;
  questions: HelpQuestion[];
}

export const HELP_CONTENT: HelpSection[] = [ ... ]
```

### Section: Buying (5 questions)
1. How do I find items?
2. What does "Verified Authentic" mean?
3. How does checkout work?
4. What payment methods are accepted?
5. Is my payment information secure?

### Section: Selling (5 questions)
1. How do I create a store?
2. How do I list an item?
3. What are MDFLD's fees?
4. When and how do I get paid?
5. What happens after my item sells?

### Section: Authentication (4 questions)
1. What does "Verified Authentic" mean?
2. How does the verification process work?
3. What items can be verified?
4. What if a buyer disputes authenticity?

### Section: Returns (4 questions)
1. What is MDFLD's return policy?
2. How do I open a return request?
3. How long does a return take to process?
4. What if my item arrives damaged or not as described?

### Section: Contact (3 questions)
1. How do I contact support?
2. What is the typical response time?
3. I have a dispute — what do I do?

---

## Components

| File | Purpose |
|---|---|
| `lib/help-content.ts` | All Q&A content — single source of truth |
| `app/(main)/help/page.tsx` | Server component, renders `HelpPage` |
| `components/help/help-page.tsx` | Client component — search state, active tab state, accordion state |

`HelpPage` is the only client component needed. The page wrapper can be a server component since all data comes from the static content file.

---

## Mobile

- Tab pills: `overflow-x: auto` container, pills use `flex-shrink: 0`
- Accordion items: full width, tap to expand
- Search bar: full width, stays in hero
- No layout changes below the hero — single column throughout

---

## Connections to Existing Code

- **Dashboard sidebar** (`components/sidebar/dashboard/app.tsx`): "Help & Information" button gets `onPress={() => router.push("/help")}` — currently has no handler
- **Navbar** (`components/Navbar.tsx`): Add "Help" link to main nav (optional, low priority)
- **No new API routes** — all content is static

---

## Out of Scope

- CMS-backed content (hardcoded for now, can migrate later)
- Search analytics / tracking what users search for
- Article ratings ("Was this helpful?")
- Docs page — not needed at this stage
