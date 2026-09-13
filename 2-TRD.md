# Life RPG — Technical Requirements Document (TRD)

Phase alignment: see `0-README-Master-Index.md`. This document is the "how and why" behind the architecture; `8-Implementation-Plan.md` is the "how to actually get the tools."

## 1. Architecture Overview — 5 Layers

```
┌───────────────────────────────────────────────┐
│  EXPERIENCE LAYER (Next.js)                    │  Dashboard · Quests · Character · Shop · AI Coach UI
├───────────────────────────────────────────────┤
│  GAMIFICATION ENGINE (FastAPI)                 │  XP · Levels · Streaks · Attributes · Rewards
├───────────────────────────────────────────────┤
│  INTELLIGENCE LAYER (FastAPI → Gemini API)     │  Quest Generator · Adaptive Difficulty · Coach
├───────────────────────────────────────────────┤
│  APPLICATION API (FastAPI)                     │  Auth verification · Validation · Business rules
├───────────────────────────────────────────────┤
│  DATA LAYER (Supabase Postgres)                │  Users · Ledger tables · Events · RLS
└───────────────────────────────────────────────┘
```

The RPG rules live in the Gamification Engine, never in the UI — the frontend only renders what the backend computed.

## 2. Tech Stack Decision Matrix

| Concern | Chosen | Why | Alternative (documented, not default) |
|---|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion | Fast to ship, huge ecosystem, Vercel-native | — |
| Backend | **FastAPI (Python)** | Matches your established full-stack pattern; async, typed, auto-generates OpenAPI docs for free (satisfies the API Specification deliverable almost automatically) | Next.js API Routes (fine for smaller scope, but mixes concerns) |
| Auth | **Supabase Auth** | Bundled with Postgres + Row-Level Security under one free project; RLS makes "User A cannot access User B's data" enforceable at the database layer, not just in application code | Neon Postgres + **Better Auth** — Better Auth is the actively-maintained successor to NextAuth/Auth.js (Auth.js entered security-patch-only mode after a September 2025 maintainer handover); pick this path only if you want to own the schema without Supabase's bundled platform |
| Database | Supabase Postgres | Same project as Auth, RLS enforced via `auth.uid()` | Neon serverless Postgres (better cold-start/dormancy behavior — see §7) |
| AI provider | Google Gemini API (Flash / Flash-Lite, free tier) | Genuinely free with no expiry, called server-side only | Anthropic Claude API as a paid upgrade path once the product needs stronger reasoning — check current pricing/rate limits at the time of upgrading rather than assuming figures here, since they change |
| Frontend hosting | Vercel (Hobby) | Free forever for personal/non-commercial projects, zero-config Next.js support | — |
| Backend hosting | Render (Free web service) | No card required for the basic path; spins down after ~15 min idle | Fly.io |

**A note on "why not Railway":** Railway removed its unconditional free tier; new accounts get a one-time $5 trial credit that typically lasts days, not an ongoing free plan. It's a fine paid option later, but don't architect the MVP around it.

## 3. Non-Functional Requirements

### 3.1 Performance
- Optimistic UI on every quest-completion action: UI shows "✓ Complete" immediately, confirms with the server, and rolls back with a visible "⚠ Unable to save — retrying" state on failure.
- Perceived response time target: under 200ms for any in-app interaction; actual network round-trips are masked by optimistic updates and skeleton loaders.

### 3.2 Security (OWASP API Security Top 10, 2023 edition)
- **API1: Broken Object Level Authorization (BOLA)** is the #1 risk and the textbook example (`GET /quests/123`) is exactly this app's shape. A `session.user_id == resource.owner_id` equality check is necessary but **not sufficient** on its own — OWASP explicitly notes this "solves only a small subset" of BOLA; add policy/hierarchy-aware checks before any admin/org role exists.
- **API3: Broken Object Property Level Authorization** (formerly "Mass Assignment"): `PATCH /quests/:id` must use an explicit field allow-list. A client must never be able to set `{"xp": 999999}` and have it persist.
- PostgreSQL Row-Level Security is used as **defense-in-depth**, not the only mechanism — the FastAPI layer performs its own ownership checks even though RLS would also block a leak.

### 3.3 AI Security (OWASP Top 10 for LLM Applications, 2025 edition)
Use the 2025 edition, not the 2023 one the original blueprint cited — it's the current standard and directly shapes the AI Coach:
- **LLM01 Prompt Injection** — still #1; treat all quest-plan input as untrusted text, never as instructions to the system prompt.
- **LLM06 Excessive Agency** (expanded in 2025) — the governing rule for this whole product: **the AI recommends, the deterministic backend decides.** The AI response is never trusted to directly write XP, Gold, or permission changes.
- **LLM07 System Prompt Leakage** — don't let the Coach's system prompt be extractable via clever user questions.
- **LLM10 Unbounded Consumption** — rate-limit AI calls per user; this also protects your Gemini free-tier daily quota from a single user burning it.

### 3.4 Accessibility (WCAG 2.2 AA)
WCAG 2.2 became a W3C Recommendation in October 2023 and added 9 new success criteria; 6 land at Level A/AA and are directly relevant here:

| SC | Name | Why it matters for this app |
|---|---|---|
| 2.4.11 (AA) | Focus Not Obscured | A level-up overlay must not trap keyboard focus behind it |
| 2.5.8 (AA) | Target Size Minimum | Quest-checkbox and shop-button touch targets on mobile |
| 2.5.7 (AA) | Dragging Movements | Any drag-to-reorder quest list needs a non-drag alternative |
| 3.2.6 (A) | Consistent Help | The AI Coach entry point stays in the same position on every page |
| 3.3.7 (A) | Redundant Entry | Multi-step signup/quest wizards don't ask for the same info twice |
| 3.3.8 (AA) | Accessible Authentication Minimum | No CAPTCHA-only login with no alternative |

Full keyboard operability (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys) is required regardless of these additions, plus visible focus states, sufficient contrast, no color-only status indicators, and a reduced-motion setting.

### 3.5 Configuration
Twelve-Factor App config: all secrets and environment-specific values live in environment variables, never committed. Ship a complete `.env.example` with every variable named but unset.

## 4. Data Integrity Principle

Never store `user.xp = 2500` as a mutable field. Every XP or Gold change is an **append-only ledger row** (`xp_transactions`, `gold_transactions`); the displayed balance is `SUM(amount)` over that user's rows. This gives auditability, anti-cheat resistance, and a free activity history for analytics — see `6-Database-ERD.md` for the exact schema.

## 5. Non-linear XP Curve (verified formula)

`base × level^exponent` is the industry-standard shape (exponent typically 1.5–2.5; lower = gentler mobile-style curve, higher = steeper MMO-style late game).

- **Chosen values:** `base = 100`, `exponent = 1.8` → roughly 500 XP for level 5→6, ~12,000 XP for level 30→31 ("gentle early, steep late" — matches a productivity app where most churn happens early and the users who stay want the late game to feel earned).
- **Storage:** store **cumulative total XP** on the user record, not "XP within current level." Level is then a cheap inverse: `level = floor(log(total_xp / base) / log(exponent)) + 1`.
- **Soft cap:** past roughly level 40–50, flatten the curve (piecewise or log-softened) rather than letting the exponential run unbounded — an uncapped exponential eventually produces a "wall" that reads as unfair and drives quits.

## 6. AI Governance Boundary

```
Frontend → FastAPI AI endpoint → Context Builder (sanitized summary only)
→ Gemini API → Schema Validator → Business Rules Check → Recommendation
```
Never `Frontend → LLM → Database` directly. The AI sees a sanitized progress summary (level, streak, attribute values, recent completion/miss counts, stated objective) — never raw database access, never other users' data, never write access.

## 7. Dormancy & "long-lived free demo" risk

A judged deliverable may sit untouched for weeks between submission and review. Two free-tier behaviors matter here and are opposite in severity:
- **Supabase free projects pause after 7 days of inactivity** and must be manually resumed from the dashboard — if nobody visits during that gap, the live app goes offline until you notice and click resume.
- **Neon's free tier scales to zero after ~5 minutes idle but auto-resumes on the next request** (roughly 500ms wake) — no manual action needed.

Mitigation used in this plan (see Implementation Plan, Phase 10): a free scheduled ping (GitHub Actions cron or UptimeRobot, both free) hits the Supabase project at least once every 6 days to prevent the pause. Render's free backend also spins down after ~15 minutes idle with a 30–60s cold start on the next request — acceptable for a demo, but budget for it in the video.

## 8. Environments

`development` → `staging` → `production`, each with its own Supabase project (or at minimum its own `.env`) and its own Vercel/Render deployment target. Never point a local dev environment at the production database.
