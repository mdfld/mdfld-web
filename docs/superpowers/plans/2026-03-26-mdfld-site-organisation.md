# MDFLD Site Organisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all site organisation changes: hero images, footer updates, community section, about page live counters + team, report button, newsletter API, contact fixes, and admin panel improvements.

**Architecture:** UI edits are direct file changes. New API routes (newsletter, report, salesCount) follow the existing Resend + Prisma pattern already in `/api/contact`. The `FraudReport` model and `reportCount` field already exist in schema — no migration needed for the report feature. The `featured` Boolean already exists on the `Product` model.

**Tech Stack:** Next.js 15, TypeScript, Prisma, Resend (via `RESEND_API_KEY`), tRPC, HeroUI, Iconify, Framer Motion

---

## File Map

| File | Action |
|---|---|
| `public/categories/kits.jpeg` | Create — copy from Desktop |
| `public/categories/boots.jpg` | Create — copy from Desktop |
| `public/categories/accessories.jpg` | Create — copy from Desktop |
| `public/categories/goalkeeper.webp` | Create — copy from Desktop |
| `public/mdfld-logo-v2.png` | Create — copy from Desktop |
| `components/LandingPage/HeroSection.tsx` | Modify — new CATEGORIES array + router links |
| `components/Footer.tsx` | Modify — socials, logo, newsletter wire, remove Addresses |
| `components/LandingPage/InstagramFeed.tsx` | Modify — update CTAs, remove accent line |
| `components/LandingPage/Main.tsx` | Modify — comment out Testimonials |
| `components/LandingPage/ProductGrid.tsx` | Modify — rename label, filter featured |
| `app/(main)/about/page.tsx` | Modify — client component, live counters, team, values |
| `app/(main)/contact/page.tsx` | Modify — location to Atlanta GA, remove hours |
| `app/(main)/brands/page.tsx` | Modify — add search input |
| `app/admin/products/page.tsx` | Modify — add reportCount column + featured toggle |
| `app/api/newsletter/route.ts` | Create — Resend email to ayoola@mdfld.co |
| `app/api/meta/salesCount/route.ts` | Create — count completed orders |
| `app/api/products/[id]/report/route.ts` | Create — increment reportCount, create FraudReport, email |
| `server/routers/admin.ts` | Modify — add toggleFeatured mutation |

---

## Task 1: Copy Images to /public

**Files:**
- Create: `public/categories/kits.jpeg`
- Create: `public/categories/boots.jpg`
- Create: `public/categories/accessories.jpg`
- Create: `public/categories/goalkeeper.webp`
- Create: `public/mdfld-logo-v2.png`

- [ ] **Step 1: Copy images**

```bash
mkdir -p /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/categories
cp "/Users/ayoola/Desktop/MDFLD/Kits Image.jpeg" /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/categories/kits.jpeg
cp "/Users/ayoola/Desktop/MDFLD/Boots Image.jpg" /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/categories/boots.jpg
cp "/Users/ayoola/Desktop/MDFLD/Accessories Image.jpg" /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/categories/accessories.jpg
cp "/Users/ayoola/Desktop/MDFLD/Goalkeeper Image.webp" /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/categories/goalkeeper.webp
cp "/Users/ayoola/Desktop/MDFLD/mdfld-logo-v2.png" /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/mdfld-logo-v2.png
```

- [ ] **Step 2: Verify**

```bash
ls /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/categories/
ls /Users/ayoola/mdfld-web/.worktrees/admin-rbac/public/mdfld-logo-v2.png
```
Expected: 4 image files + logo.

- [ ] **Step 3: Commit**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac
git add public/categories/ public/mdfld-logo-v2.png
git commit -m "feat: add category images and logo to public/"
```

---

## Task 2: HeroSection — Update Categories

**Files:**
- Modify: `components/LandingPage/HeroSection.tsx`

- [ ] **Step 1: Replace the CATEGORIES constant and add router navigation**

Replace the entire `CATEGORIES` array and add `useRouter` import. The `Explore` button in both desktop and mobile views needs to navigate to the correct shop URL. In `DesktopView`, the vault-btn needs an `onClick`. In `MobileView`, the Explore button also needs `onClick`.

Replace lines 1–39 of `components/LandingPage/HeroSection.tsx`:

```tsx
"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  {
    id: '01',
    title: 'KITS',
    subtitle: 'Match-worn styles for every club.',
    price: 'From $45',
    img: '/categories/kits.jpeg',
    href: '/shop?category=JERSEYS',
    color: '#111111'
  },
  {
    id: '02',
    title: 'BOOTS',
    subtitle: 'Tactical mobility. Elite performance.',
    price: 'From $120',
    img: '/categories/boots.jpg',
    href: '/shop?category=BOOTS',
    color: '#0a0a0a'
  },
  {
    id: '03',
    title: 'ACCESSORIES',
    subtitle: 'Gear up. Every detail counts.',
    price: 'From $25',
    img: '/categories/accessories.jpg',
    href: '/shop?category=ACCESSORIES',
    color: '#161616'
  },
  {
    id: '04',
    title: 'GOALKEEPER',
    subtitle: 'The last line of defence.',
    price: 'From $60',
    img: '/categories/goalkeeper.webp',
    href: '/shop?category=GOALKEEPER_GLOVES',
    color: '#050505'
  }
];
```

- [ ] **Step 2: Wire Explore button in DesktopView**

In `DesktopView`, replace the vault-btn `<button>`:

```tsx
<button className="vault-btn" onClick={() => window.location.href = cat.href}>
  <ShoppingBag size={18} strokeWidth={2.5} />
  Explore
</button>
```

- [ ] **Step 3: Wire Explore button in MobileView**

In `MobileView`, replace the Explore `<button>` (the white one with ShoppingBag):

```tsx
<button
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 10,
    background: '#fff', color: '#000',
    padding: '14px 28px', borderRadius: 4,
    fontFamily: "'Manrope', sans-serif",
    fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13,
    border: 'none', cursor: 'pointer',
  }}
  onClick={() => window.location.href = cat.href}
>
  <ShoppingBag size={15} strokeWidth={2.5} />
  Explore
</button>
```

- [ ] **Step 4: Build check**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors on HeroSection.

- [ ] **Step 5: Commit**

```bash
git add components/LandingPage/HeroSection.tsx
git commit -m "feat: update hero categories to Kits, Boots, Accessories, Goalkeeper with real images"
```

---

## Task 3: Footer — Socials, Logo, Newsletter Wire, Remove Addresses

**Files:**
- Modify: `components/Footer.tsx`

- [ ] **Step 1: Update SOCIALS array**

Replace the `SOCIALS` constant (lines 31–36):

```tsx
import { Instagram, Twitter, Linkedin, MessageCircle } from 'lucide-react';

const SOCIALS = [
  { icon: <Instagram size={15} />, label: 'Instagram', href: 'https://www.instagram.com/mdfldmarketplace/' },
  { icon: <Twitter size={15} />, label: 'X', href: 'https://x.com/mdfldmp' },
  { icon: <Linkedin size={15} />, label: 'LinkedIn', href: 'https://www.linkedin.com/in/ayoolamorakinyo/' },
  { icon: <MessageCircle size={15} />, label: 'Discord', href: 'https://discord.gg/pW87DDjZ' },
];
```

Note: Lucide doesn't have a Discord icon — use `MessageCircle` as the Discord icon.

- [ ] **Step 2: Remove Addresses from NAV.Account**

Replace the `Account` array in `NAV`:

```tsx
Account: [
  { label: 'My Account', href: '/account' },
  { label: 'My Orders', href: '/myorders' },
  { label: 'Saved Items', href: '/saved' },
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
],
```

- [ ] **Step 3: Add logo to brand column**

Replace the brand `<Link>` block (the `<div style={{ marginBottom: 20 }}>` block) with:

```tsx
<div style={{ marginBottom: 20 }}>
  <Link href="/" style={{ textDecoration: 'none' }}>
    <img
      src="/mdfld-logo-v2.png"
      alt="MDFLD"
      style={{ height: 36, width: 'auto', marginBottom: 8, display: 'block' }}
    />
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1 }}>
      MID<span style={{ color: ACCENT }}>FIELD</span>
    </div>
  </Link>
  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>
    The Apex of Football Culture
  </div>
</div>
```

- [ ] **Step 4: Wire newsletter button to /api/newsletter**

Add `isLoading` state and replace the subscribe button's `onClick`:

```tsx
const [email, setEmail] = useState('');
const [sent, setSent] = useState(false);
const [focused, setFocused] = useState(false);
const [nlLoading, setNlLoading] = useState(false);

const handleSubscribe = async () => {
  if (!email.includes('@')) return;
  setNlLoading(true);
  try {
    await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  } catch {
    setSent(true); // still show success to user
  } finally {
    setNlLoading(false);
  }
};
```

Replace the button `onClick`:

```tsx
<button
  onClick={handleSubscribe}
  disabled={nlLoading}
  style={{ background: ACCENT, border: 'none', color: '#020606', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '10px 14px', cursor: nlLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
  onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
>
  {nlLoading ? 'Sending...' : <>{`Subscribe`} <ArrowRight size={12} /></>}
</button>
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors on Footer.

- [ ] **Step 6: Commit**

```bash
git add components/Footer.tsx
git commit -m "feat: update footer socials, add logo, wire newsletter, remove Addresses nav link"
```

---

## Task 4: Newsletter API Route

**Files:**
- Create: `app/api/newsletter/route.ts`

- [ ] **Step 1: Write failing test**

Create `app/api/newsletter/route.test.ts`:

```typescript
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/newsletter', () => {
  it('returns 400 when email is missing', async () => {
    const req = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    const req = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email: 'notanemail' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run app/api/newsletter/route.test.ts 2>&1 | tail -10
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create the route**

Create `app/api/newsletter/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email } = await request.json();

    if (!email || !String(email).includes('@')) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: "Midfield Co <onboarding@resend.dev>",
      to: ["ayoola@mdfld.co"],
      subject: `New Newsletter Subscriber: ${email}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:28px;border:1px solid #eaeaea;border-radius:8px;">
          <h2 style="margin:0 0 16px;">New Subscriber</h2>
          <p style="font-size:14px;color:#333;">Email: <strong>${email}</strong></p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:11px;color:#999;">Sent via mdfld.co newsletter signup</p>
        </div>
      `,
    });

    if (error) {
      console.error("[Newsletter API] Send error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Newsletter API] Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run app/api/newsletter/route.test.ts 2>&1 | tail -10
```
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/newsletter/route.ts app/api/newsletter/route.test.ts
git commit -m "feat: add newsletter API route sending subscriber email to ayoola@mdfld.co"
```

---

## Task 5: InstagramFeed — Update Community Section

**Files:**
- Modify: `components/LandingPage/InstagramFeed.tsx`

- [ ] **Step 1: Remove the teal accent line from the header**

In the header block, remove this `<motion.div>` element entirely (lines 150–158):

```tsx
// DELETE this block:
<motion.div
  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
>
  <div style={{ width: 32, height: 1.5, background: `linear-gradient(90deg, ${ACCENT} 0%, transparent 100%)` }} />
  <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
    On The Pitch
  </span>
</motion.div>
```

- [ ] **Step 2: Update the POSTS array to MDFLD CTAs**

Replace the `POSTS` array (lines 18–55) with 3 MDFLD-specific entries:

```tsx
const POSTS: Post[] = [
  {
    id: '01',
    title: 'MDFLD FC',
    caption: 'Join the official MDFLD FC Discord. Talk boots, kits, and the beautiful game with the community.',
    likes: '',
    comments: '',
    date: 'COMMUNITY',
    img: '/categories/boots.jpg',
  },
  {
    id: '02',
    title: '2025 MDFLD CUP',
    caption: 'The 2025 MDFLD Cup is live on Instagram. See the action, follow the tournament, stay in the game.',
    likes: '',
    comments: '',
    date: 'EVENT',
    img: '/categories/kits.jpeg',
  },
  {
    id: '03',
    title: 'FOLLOW US',
    caption: 'Follow @mdfldmarketplace on Instagram for new drops, verified listings, and culture content.',
    likes: '',
    comments: '',
    date: 'INSTAGRAM',
    img: '/categories/accessories.jpg',
  },
];
```

- [ ] **Step 3: Update CTA hrefs per post**

Add a `href` field to the `Post` interface:

```tsx
interface Post {
  id: string;
  title: string;
  caption: string;
  likes: string;
  comments: string;
  date: string;
  img: string;
  href: string;
}
```

Update POSTS with hrefs:

```tsx
// Post 01: href: 'https://discord.gg/pW87DDjZ'
// Post 02: href: 'https://www.instagram.com/mdfldmarketplace/'
// Post 03: href: 'https://www.instagram.com/mdfldmarketplace/'
```

- [ ] **Step 4: Replace the bottom CTA button**

Replace the `<motion.div>` CTA block (the "View Instagram" button, lines 226–241) with 3 buttons:

```tsx
<motion.div
  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
  style={{ marginTop: 64, display: 'flex', gap: 16, flexWrap: 'wrap' }}
>
  <a href="https://discord.gg/pW87DDjZ" target="_blank" rel="noopener noreferrer" style={{
    display: 'inline-flex', alignItems: 'center', gap: 12,
    background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '18px 40px', textDecoration: 'none', transition: 'all 0.3s ease'
  }}
  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
  >
    Join MDFLD FC
  </a>
  <a href="https://www.instagram.com/mdfldmarketplace/" target="_blank" rel="noopener noreferrer" style={{
    display: 'inline-flex', alignItems: 'center', gap: 12,
    background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '18px 40px', textDecoration: 'none', transition: 'all 0.3s ease'
  }}
  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
  >
    <Instagram size={16} /> Follow Us
  </a>
</motion.div>
```

- [ ] **Step 5: Update the image viewer to remove stats row and show CTA link per post**

In the "Stats & Link" section of the image viewer (lines 280–295), replace with a single CTA link using `activePost.href`:

```tsx
<div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
  <a href={activePost.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff', textDecoration: 'none', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
    {activePost.id === '01' ? 'Join Discord' : activePost.id === '02' ? 'View on Instagram' : 'Follow Now'} <ArrowUpRight size={14} color={ACCENT} />
  </a>
</div>
```

- [ ] **Step 6: Build check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/LandingPage/InstagramFeed.tsx
git commit -m "feat: update community section with MDFLD FC Discord, Mdfld Cup, and Instagram CTAs"
```

---

## Task 6: Main.tsx — Hide Testimonials

**Files:**
- Modify: `components/LandingPage/Main.tsx`

- [ ] **Step 1: Comment out Testimonials**

Replace:

```tsx
<Testimonials />
<InstagramFeed />
```

With:

```tsx
{/* <Testimonials /> */}
<InstagramFeed />
```

- [ ] **Step 2: Commit**

```bash
git add components/LandingPage/Main.tsx
git commit -m "feat: hide testimonials section from homepage"
```

---

## Task 7: ProductGrid — Rename to Featured Drops

**Files:**
- Modify: `components/LandingPage/ProductGrid.tsx`

- [ ] **Step 1: Update subheading and heading**

Replace:

```tsx
<span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 800, color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
  Curated For You
</span>
```

With:

```tsx
<span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 800, color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
  Featured Drops
</span>
```

Replace the heading:

```tsx
Latest <span style={{ color: ACCENT }}>Drops</span>
```

With:

```tsx
Featured <span style={{ color: ACCENT }}>Drops</span>
```

- [ ] **Step 2: Update query to filter featured products**

Replace:

```tsx
const { data, isLoading } = trpc.product.search.useQuery({
  limit: 12,
  minPrice: 0,
});
```

With:

```tsx
const { data, isLoading } = trpc.product.search.useQuery({
  limit: 12,
  minPrice: 0,
  featured: true,
});
```

Note: If `featured` is not yet a param in `product.search`, this falls back gracefully — add it in the next step.

- [ ] **Step 3: Add `featured` filter to product.search tRPC query**

In `server/routers/product.ts`, find the `search` procedure input schema and add:

```typescript
featured: z.boolean().optional(),
```

In the Prisma `where` clause for `search`, add:

```typescript
input.featured !== undefined ? { featured: input.featured } : {},
```

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/LandingPage/ProductGrid.tsx server/routers/product.ts
git commit -m "feat: rename product grid to Featured Drops, filter by featured flag"
```

---

## Task 8: /api/meta/salesCount

**Files:**
- Create: `app/api/meta/salesCount/route.ts`

- [ ] **Step 1: Write failing test**

Create `app/api/meta/salesCount/route.test.ts`:

```typescript
import { GET } from './route';

describe('GET /api/meta/salesCount', () => {
  it('returns salesCount as a number', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.salesCount).toBe('number');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run app/api/meta/salesCount/route.test.ts 2>&1 | tail -5
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create the route**

Create `app/api/meta/salesCount/route.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const salesCount = await prisma.order.count({
      where: { status: { in: ["DELIVERED", "CONFIRMED", "PROCESSING", "SHIPPED"] } },
    });
    return new Response(JSON.stringify({ salesCount }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching sales count" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run app/api/meta/salesCount/route.test.ts 2>&1 | tail -5
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/meta/salesCount/route.ts app/api/meta/salesCount/route.test.ts
git commit -m "feat: add /api/meta/salesCount endpoint for About page live counter"
```

---

## Task 9: About Page — Live Counters, Team, Values

**Files:**
- Modify: `app/(main)/about/page.tsx`

- [ ] **Step 1: Convert to client component and add count-up hook**

Add `"use client"` at the top and add `useEffect`, `useState` imports:

```tsx
"use client";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target, duration]);
  return count;
}
```

- [ ] **Step 2: Add data fetching for live stats**

Add a `useLiveStats` hook that fetches all three counts:

```tsx
function useLiveStats() {
  const [stats, setStats] = useState({ salesCount: 0, userCount: 0, productCount: 0 });
  useEffect(() => {
    Promise.all([
      fetch('/api/meta/salesCount').then(r => r.json()),
      fetch('/api/meta/userCount').then(r => r.json()),
      fetch('/api/meta/productCount').then(r => r.json()),
    ]).then(([sales, users, products]) => {
      setStats({
        salesCount: sales.salesCount ?? 0,
        userCount: users.userCount ?? 0,
        productCount: products.productCount ?? 0,
      });
    }).catch(() => {});
  }, []);
  return stats;
}
```

- [ ] **Step 3: Update AboutPage to use live counters**

In `AboutPage`, call the hooks and replace the static `STATS` with dynamic values:

```tsx
export default function AboutPage() {
  const live = useLiveStats();
  const caps = useCountUp(live.salesCount);
  const players = useCountUp(live.userCount);
  const products = useCountUp(live.productCount);

  const STATS = [
    { value: players.toLocaleString(), label: "Active Players" },
    { value: "150+", label: "Countries Served" },
    { value: products.toLocaleString(), label: "Verified Products" },
    { value: caps.toLocaleString(), label: "Caps" },
  ];
  // ... rest of component
```

- [ ] **Step 4: Update VALUES — "Fair for Sellers" → "Fair for EVERYONE"**

Replace in the `VALUES` array:

```tsx
{
  icon: "solar:hand-shake-bold-duotone",
  title: "Fair for EVERYONE",
  description:
    "We give players, collectors, and serious sellers the tools to reach a global audience — with transparent fees and no hidden costs.",
},
```

- [ ] **Step 5: Update TEAM array**

Replace the `TEAM` constant:

```tsx
const TEAM = [
  { initials: "AM", name: "Ayoola Morakinyo", role: "Founder & CEO" },
  { initials: "KB", name: "Kayla Bloom", role: "Co-Founder & CMO" },
  { initials: "RW", name: "Ryan Walden", role: "Board Advisor" },
  { initials: "AR", name: "Aman Rathore", role: "Lead Engineer" },
];
```

- [ ] **Step 6: Fix MDFLD capitalization — About mdfld → About MDFLD**

Replace:

```tsx
About mdfld
```

With:

```tsx
About MDFLD
```

Also replace in the hero body text `mdfld is the global marketplace` → `MDFLD is the global marketplace` and `if it's on mdfld` → `if it's on MDFLD`. Also fix the mission section: `We built mdfld` → `We built MDFLD`.

- [ ] **Step 7: Build check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add app/\(main\)/about/page.tsx
git commit -m "feat: add live counters to about page, update team, values, and MDFLD capitalization"
```

---

## Task 10: Contact Page — Fix Location, Remove Hours

**Files:**
- Modify: `app/(main)/contact/page.tsx`

- [ ] **Step 1: Update Response Time block — remove hours**

Replace:

```tsx
<p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Within 24 hours,<br />Mon–Fri 9am–6pm GMT</p>
```

With:

```tsx
<p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Within 24 hours</p>
```

- [ ] **Step 2: Update Location block**

Replace:

```tsx
<p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>London, UK<br />Serving 150+ Countries</p>
```

With:

```tsx
<p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Atlanta, GA<br />Serving 150+ Countries</p>
```

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/contact/page.tsx
git commit -m "fix: update contact page location to Atlanta GA, remove response time hours"
```

---

## Task 11: Contact Form Email Delivery Fix

**Files:**
- Modify: `app/api/contact/route.ts`

The issue: the contact form sends to `ayoola@mdfld.co` but the `from` uses `onboarding@resend.dev` which is Resend's shared test sender. This works only if `RESEND_API_KEY` is valid and in test mode. Verify this is set in the server `.env`.

- [ ] **Step 1: Verify RESEND_API_KEY is set on the server**

SSH to server and check:

```bash
grep RESEND_API_KEY ~/appdev/mdfld-web/.env
```
Expected: `RESEND_API_KEY=re_...`

If missing, add it. The key is available from resend.com dashboard.

- [ ] **Step 2: Add explicit error logging to help diagnose future failures**

In `app/api/contact/route.ts`, ensure the error is logged with detail. The existing code already does this correctly — no code change needed if the env var is set.

- [ ] **Step 3: Test the form**

Visit `/contact` locally, submit a test message, and confirm delivery to `ayoola@mdfld.co`.

- [ ] **Step 4: Commit if no code changes needed**

If only env var was missing (no code change), document it:

```bash
# No code change needed — ensure RESEND_API_KEY is set in server .env
git commit --allow-empty -m "fix: verified contact form — requires RESEND_API_KEY in server .env"
```

---

## Task 12: /api/products/[id]/report Route

**Files:**
- Create: `app/api/products/[id]/report/route.ts`

This route uses the existing `FraudReport` model (`reportCount` + `fraudReports` already on `Product`).

- [ ] **Step 1: Write failing test**

Create `app/api/products/[id]/report/route.test.ts`:

```typescript
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/products/[id]/report', () => {
  it('returns 400 when reporterId is missing', async () => {
    const req = new NextRequest('http://localhost/api/products/test123/report', {
      method: 'POST',
      body: JSON.stringify({ reason: 'fake product' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'test123' }) });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run app/api/products/\\[id\\]/report/route.test.ts 2>&1 | tail -5
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create the route**

Create `app/api/products/[id]/report/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { id: productId } = await params;
    const { reason } = await request.json();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const reporterId = session.user.id;

    if (!reporterId) {
      return NextResponse.json({ error: "Missing reporterId" }, { status: 400 });
    }

    // Increment reportCount and create FraudReport in a transaction
    const [product] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { reportCount: { increment: 1 } },
        select: { id: true, title: true, reportCount: true },
      }),
      prisma.fraudReport.create({
        data: {
          reporterId,
          productId,
          reportType: "OTHER",
          description: reason || "No reason provided",
        },
      }),
    ]);

    // Send notification email (non-blocking)
    resend.emails.send({
      from: "Midfield Co <onboarding@resend.dev>",
      to: ["ayoola@mdfld.co"],
      subject: `[REPORT] Product flagged: ${product.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:28px;border:1px solid #eaeaea;border-radius:8px;">
          <h2 style="margin:0 0 16px;">Product Flagged</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;font-size:13px;width:120px;">Product ID</td><td style="font-size:13px;">${productId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Product</td><td style="font-size:13px;">${product.title}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Reporter</td><td style="font-size:13px;">${reporterId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Total Reports</td><td style="font-size:13px;font-weight:bold;color:#ef4444;">${product.reportCount}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Reason</td><td style="font-size:13px;">${reason || "No reason provided"}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:11px;color:#999;">Sent via mdfld.co report system</p>
        </div>
      `,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Report API] Error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run app/api/products/\\[id\\]/report/route.test.ts 2>&1 | tail -5
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/api/products/[id]/report/route.ts" "app/api/products/[id]/report/route.test.ts"
git commit -m "feat: add product report API route with FraudReport creation and email notification"
```

---

## Task 13: Report Button on Product Page

**Files:**
- Modify: `components/product-layout/product-view-item.tsx`

- [ ] **Step 1: Add report state and modal to ProductViewInfo**

After the existing state declarations (after line ~101), add:

```tsx
const [reportOpen, setReportOpen] = React.useState(false);
const [reportReason, setReportReason] = React.useState('');
const [reportSubmitting, setReportSubmitting] = React.useState(false);
const [reportDone, setReportDone] = React.useState(false);
```

- [ ] **Step 2: Add handleReport function**

After the wishlist mutations, add:

```tsx
const handleReport = async () => {
  setReportSubmitting(true);
  try {
    await fetch(`/api/products/${props.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    });
    setReportDone(true);
    setReportReason('');
    setTimeout(() => { setReportOpen(false); setReportDone(false); }, 2000);
  } catch {
    toast.error('Failed to submit report');
  } finally {
    setReportSubmitting(false);
  }
};
```

- [ ] **Step 3: Add Report button in JSX**

Find the product action buttons area (Add to Cart / Wishlist section) in the returned JSX and add the report button after them. Look for the closing `</div>` of the button group and add:

```tsx
<Button
  variant="light"
  size="sm"
  startContent={<Icon icon="material-symbols:flag-outline" width={16} />}
  onPress={() => setReportOpen(true)}
  style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8 }}
>
  Report listing
</Button>
```

- [ ] **Step 4: Add report modal**

Before the closing `</div>` of the component's return, add:

```tsx
{reportOpen && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }} onClick={() => setReportOpen(false)}>
    <div style={{
      background: '#111', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: 32, maxWidth: 480, width: '100%',
    }} onClick={e => e.stopPropagation()}>
      <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Report this listing</h3>
      {reportDone ? (
        <p style={{ color: '#00d4b6', fontSize: 14 }}>Report submitted. Thank you.</p>
      ) : (
        <>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
            Why does this listing seem suspicious? (optional)
          </p>
          <textarea
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            maxLength={500}
            placeholder="Describe the issue..."
            style={{
              width: '100%', minHeight: 100, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
              color: '#fff', fontSize: 13, padding: 12, resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Button
              color="danger"
              isLoading={reportSubmitting}
              onPress={handleReport}
              style={{ flex: 1 }}
            >
              Submit Report
            </Button>
            <Button variant="bordered" onPress={() => setReportOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/product-layout/product-view-item.tsx
git commit -m "feat: add report listing button and modal to product page"
```

---

## Task 14: Admin Products — reportCount Column + Featured Toggle

**Files:**
- Modify: `app/admin/products/page.tsx`
- Modify: `server/routers/admin.ts`

- [ ] **Step 1: Add toggleFeatured mutation to admin router**

In `server/routers/admin.ts`, after the `listProducts` query, add:

```typescript
toggleFeatured: adminProcedure
  .input(z.object({ productId: z.string(), featured: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.product.update({
      where: { id: input.productId },
      data: { featured: input.featured },
      select: { id: true, featured: true },
    });
  }),
```

- [ ] **Step 2: Update listProducts to include reportCount and featured**

In the `listProducts` Prisma query, the `include` block already returns all Product fields. Just ensure the select includes `reportCount` and `featured` — since it uses `findMany` without explicit `select`, all scalar fields are returned including `reportCount` and `featured`. No change needed.

- [ ] **Step 3: Add reportCount column and featured toggle to admin products page**

Replace `app/admin/products/page.tsx`:

```tsx
"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

export default function AdminProductsPage() {
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.listProducts.useQuery({
    isActive: activeFilter,
    limit: 50,
  });

  const toggleFeatured = trpc.admin.toggleFeatured.useMutation({
    onSuccess: () => utils.admin.listProducts.invalidate(),
  });

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Products</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { label: "All", value: undefined },
          { label: "Active", value: true },
          { label: "Inactive", value: false },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => setActiveFilter(opt.value)}
            style={{
              padding: "6px 16px", borderRadius: 6, border: "1px solid",
              borderColor: activeFilter === opt.value ? "#00d4b6" : "#ccc",
              background: activeFilter === opt.value ? "#00d4b6" : "white",
              color: activeFilter === opt.value ? "white" : "#333",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["Product", "Store", "Category", "Price", "Inventory", "Orders", "Reports", "Featured", "Active"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.products as any[] | undefined)?.map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {product.images[0] && (
                      <img src={product.images[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                    )}
                    <div>
                      <strong style={{ fontSize: 14 }}>{product.title}</strong>
                      <div style={{ fontSize: 12, color: "#999" }}>{product.brand}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px", fontSize: 14 }}>{product.seller.storeName}</td>
                <td style={{ padding: "12px", fontSize: 13, color: "#666" }}>{product.category}</td>
                <td style={{ padding: "12px", fontWeight: 600 }}>${Number(product.price).toFixed(2)}</td>
                <td style={{ padding: "12px", fontSize: 14 }}>{product.inventory}</td>
                <td style={{ padding: "12px", fontSize: 14 }}>{product._count.orderItems}</td>
                <td style={{ padding: "12px", fontSize: 14 }}>
                  <span style={{ color: product.reportCount > 0 ? "#ef4444" : "#999", fontWeight: product.reportCount > 0 ? 700 : 400 }}>
                    {product.reportCount}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => toggleFeatured.mutate({ productId: product.id, featured: !product.featured })}
                    style={{
                      padding: "4px 12px", borderRadius: 4, border: "1px solid",
                      borderColor: product.featured ? "#00d4b6" : "#ccc",
                      background: product.featured ? "rgba(0,212,182,0.1)" : "transparent",
                      color: product.featured ? "#00d4b6" : "#999",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {product.featured ? "Featured" : "Set Featured"}
                  </button>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: product.isActive ? "#10b981" : "#ef4444", display: "inline-block" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/products/page.tsx server/routers/admin.ts
git commit -m "feat: add reportCount column and featured toggle to admin products table"
```

---

## Task 15: Brands Page — Add Search

**Files:**
- Modify: `app/(main)/brands/page.tsx`

- [ ] **Step 1: Add search state and filter**

Replace `export default function BrandsPage()` with a version that includes a search input:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";

const ACCENT = "#00d4b6";

const BRANDS = [
  { name: "Nike", slug: "Nike", logo: "N", desc: "Just Do It" },
  { name: "Adidas", slug: "Adidas", logo: "A", desc: "Impossible Is Nothing" },
  { name: "Puma", slug: "Puma", logo: "P", desc: "Forever Faster" },
  { name: "New Balance", slug: "New Balance", logo: "NB", desc: "Fearlessly Independent" },
  { name: "Mizuno", slug: "Mizuno", logo: "M", desc: "Inspired Design" },
  { name: "Under Armour", slug: "Under Armour", logo: "UA", desc: "Protect This House" },
];

export default function BrandsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = BRANDS.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ background: "#020606", minHeight: "100vh", paddingTop: 120, paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;600;700&display=swap');
        .brand-card { cursor: pointer; border: 1px solid rgba(255,255,255,0.08); padding: 40px; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; transition: all 0.3s; background: transparent; }
        .brand-card:hover { border-color: rgba(0,212,182,0.4); background: rgba(0,212,182,0.04); }
        .brand-card:hover .brand-arrow { color: ${ACCENT}; transform: translateX(6px); }
        .brand-arrow { color: rgba(255,255,255,0.2); transition: all 0.3s; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(24px, 5vw, 64px)" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 48, height: 2, background: ACCENT }} />
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              All Brands
            </span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 40px 0", lineHeight: 0.95 }}>
            Shop By<br /><span style={{ color: ACCENT }}>Brand</span>
          </h1>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 16px", maxWidth: 400 }}>
            <Search size={16} color="rgba(255,255,255,0.4)" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search brands..."
              style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: 14, flex: 1 }}
            />
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2 }}>
          {filtered.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="brand-card"
              onClick={() => router.push(`/shop?brand=${encodeURIComponent(brand.slug)}`)}
            >
              <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: ACCENT, border: "1px solid rgba(0,212,182,0.2)" }}>
                {brand.logo}
              </div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                  {brand.name}
                </div>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                  {brand.desc}
                </div>
              </div>
              <ArrowRight size={18} className="brand-arrow" style={{ marginTop: "auto" }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/brands/page.tsx
git commit -m "feat: add brand search filter to brands page"
```

---

## Task 16: Final Build + Push

- [ ] **Step 1: Full build**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac
npm run build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully`, `✓ Checking validity of types`.

- [ ] **Step 2: Push**

```bash
git push origin feature/admin-rbac-mor
```

- [ ] **Step 3: Deploy on server**

```bash
# On the server:
git pull origin feature/admin-rbac-mor && npm run build && sudo systemctl restart mdfld-web-dev
```
