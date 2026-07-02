# MDFLD Email Templates Redesign

**Date:** 2026-06-02
**Scope:** Redesign all three transactional email templates in `lib/auth.ts`

---

## Goal

Replace the generic white-box email templates with on-brand MDFLD designs that feel premium, football-focused, and consistent with the app's dark aesthetic.

---

## Brand Tokens

| Token | Value |
|-------|-------|
| Accent | `#44cfcf` |
| Dark bg | `#0a0a0a` |
| Body bg | `#fafafa` |
| Body text | `#1a1a1a` |
| Muted text | `#888888` |
| Logo URL | `https://mdfld.co/mdfld-logo-v2.png` |
| Slogan | "Built for the beautiful game." |

---

## Layout (all three emails share this shell)

```
┌─────────────────────────────────────┐
│  DARK HEADER                        │  bg: #0a0a0a
│  [mdfld logo centered]              │  border-bottom: 2px solid #44cfcf
├─────────────────────────────────────┤
│  LIGHT BODY                         │  bg: #fafafa
│  Hi {firstName},                    │
│  [headline]                         │
│  [1-2 sentence copy]                │
│  [ #44cfcf CTA BUTTON ]             │
│  [raw URL fallback]                 │
│  ─────────────────────              │
│  [context section — see per-email]  │
├─────────────────────────────────────┤
│  DARK FOOTER                        │  bg: #0a0a0a
│  "Built for the beautiful game."    │  muted text
│  [security note if applicable]      │
└─────────────────────────────────────┘
```

- First name only extracted from `user.name` (split on space, take first), fallback to "there"
- CTA button: `#44cfcf` background, `#0a0a0a` text, bold, `border-radius: 4px`
- Max width: 600px, centered, no outer border

---

## Email 1: Welcome + Verify Email

**Subject:** `Welcome to MDFLD — verify your email`

**Headline:** You're on the pitch.

**Copy:** MDFLD is the marketplace built for football. Buy, sell, and authenticate boots, jerseys, and everything in between — all in one place. Verify your email to get started.

**CTA:** Verify Email

**Context section below CTA:**

```
What you can do on MDFLD:
• Browse boots, jerseys, memorobilia and more!
• List your own gear in minutes
• Connect with the football community
```

**Footer security note:** If you didn't create an account, you can safely ignore this email.

---

## Email 2: Password Reset

**Subject:** `Reset your MDFLD password`

**Headline:** Locked out? We've got you.

**Copy:** We received a request to reset your password. Click the button below — the link expires in 24 hours.

**CTA:** Reset Password

**Context section:** None (keep it minimal for security emails)

**Footer security note:** If you didn't request this, your account is safe. No action needed.

---

## Email 3: Email Change Confirmation

**Subject:** `Confirm your new email — MDFLD`

**Headline:** New details, same game.

**Copy:** You requested to change your MDFLD email to **{newEmail}**. Click below to confirm.

**CTA:** Confirm New Email

**Context section:** None (minimal for security emails)

**Footer security note:** If this wasn't you, ignore this email. Your current email stays active until confirmed.

---

## Implementation

All three templates live in `lib/auth.ts`:
- `sendResetPassword` callback (password reset)
- `sendVerificationEmail` callback (welcome + verify)
- `user.changeEmail.sendChangeEmailConfirmation` callback (email change)

Fix logo path from `/logo.png` (broken) to `/mdfld-logo-v2.png` across all three.

No new files, no new dependencies. HTML-only change inside existing callback strings.
