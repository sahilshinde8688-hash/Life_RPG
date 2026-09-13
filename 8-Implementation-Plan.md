# Life RPG — Implementation Plan

Phase alignment: see `0-README-Master-Index.md`. This is the only document in the suite that also tells you **which tool to install, where to get it free, and how to keep it free for the life of the project** — everything else defines *what* to build; this defines *how to actually go do it without spending money*.

Build order is bottom-up on purpose: a reliable data + auth foundation, then the deterministic game engine, then the AI layer on top, then polish. Don't start with AI — the deterministic system must work standalone first (TRD §1).

## Master Timeline

| Phase | Suggested days | Deliverable | Detailed in |
|---|---|---|---|
| 0 | — (before Day 1) | This 8-document suite | All 8 docs |
| 1 | Day 1–2 | Repo, skeleton apps, CI, cloud accounts live | TRD §2 |
| 2 | Day 2–3 | Auth working, RLS on | Backend Schema §2, API Spec §2 |
| 3 | Day 3–5 | Quest CRUD | API Spec §3 |
| 4 | Day 5–7 | XP/level/attribute/streak engine | Backend Schema §2, ERD §Phase 4 |
| 5 | Day 7–8 | Shop/inventory/achievements | ERD §Phase 5, API Spec §5 |
| 6 | Day 8–10 | UI polish, animations, a11y, responsive | UI/UX Spec (whole doc) |
| 7 | Day 10–12 | AI Quest Planner, Coach, adaptive difficulty | API Spec §6 |
| 8 | Day 12–13 | Security hardening pass | TRD §3.2–3.3 |
| 9 | Day 13–14 | Test suites | This doc §Phase 9 |
| 10 | Day 14–15 | Deploy + record video | This doc §Phase 10 |

---

## Phase 0 — Specification & Planning
**Tasks:** Finalize this document suite; commit it to the repo's `/docs` folder on day one so the "≥3 chronological commits" requirement starts honestly, with real planning history rather than a single dump commit.

**Tools & free access:**
| Tool | Purpose | Free access |
|---|---|---|
| GitHub | Repo, version history, Actions CI | Free unlimited public repos — sign up at github.com |
| Mermaid (used throughout this suite) | Diagrams-as-code | Free, renders natively in GitHub's Markdown viewer — no separate tool needed |
| Excalidraw (optional) | Freehand architecture sketches | Free at excalidraw.com, no signup required |

---

## Phase 1 — Foundation & Infrastructure
**Tasks:** Scaffold Next.js frontend + FastAPI backend; connect both to a shared Supabase project; set up `.env.example`; get CI running on push.

**Tools & free access:**
| Tool | Purpose | How to get it free, and keep it free |
|---|---|---|
| **Node.js + npm** | Frontend tooling | Free, open-source — install from nodejs.org |
| **Python 3.11+** | FastAPI backend | Free, open-source |
| **Supabase** | Postgres + Auth + RLS | Sign up free at supabase.com (GitHub OAuth is fastest). Free tier: 500MB database, 50,000 monthly active users, 1GB file storage, 5GB egress, up to 2 active projects. **The one catch:** a free project auto-pauses after 7 days with no API requests and must be manually resumed from the dashboard. Set up the keep-alive workaround in Phase 10 before you forget about it. |
| **Vercel** | Frontend hosting | Sign up free at vercel.com (GitHub OAuth). Hobby tier is free *forever* for personal/non-commercial projects — no time limit, no credit card. ~100GB bandwidth and ~1M function invocations/month, which is far more than a hackathon MVP needs. |
| **Render** | FastAPI backend hosting | Sign up free at render.com, no card required for the free path. Free web services get 512MB RAM/0.1 CPU and spin down after ~15 minutes idle (30–60s cold start on the next request) — fine for a demo, just budget for it in your video timing. |
| **GitHub Actions** | CI | Free minutes on public repositories |
| **GitHub Student Developer Pack** | Bundle of extra credit, if eligible | Apply once at education.github.com/pack with your college email or a dated student ID (~72hr review). As a currently-enrolled B.Tech student this is worth claiming regardless of whether you use every perk — it includes GitHub Pro, JetBrains' full IDE suite (~$289/yr value), ~$200 DigitalOcean credit, ~$100 Azure credit, and MongoDB Atlas credit, any of which extend your runway if you outgrow the free tiers above. Note: new sign-ups for the free Copilot Student plan were paused in April 2026 — pack members who join now get Copilot Free instead; the rest of the pack is unaffected. |

**Alternative DB path** worth knowing (see TRD §2): **Neon** (neon.com) has no time limit and no credit card requirement on its free tier (0.5GB storage, 100 compute-hours/month), and its "scale to zero" behavior auto-resumes on the next request rather than requiring a manual dashboard resume like Supabase — meaningfully lower-maintenance if your app might go quiet between a submission date and a judging date.

---

## Phase 2 — Identity, Auth & Isolation
**Tasks:** Wire Supabase Auth into the Next.js frontend; write JWT verification middleware in FastAPI; write and test the first RLS policies.

**Tools & free access:**
| Tool | Purpose |
|---|---|
| Supabase client SDK (`@supabase/supabase-js`) | Free, open-source npm package |
| `python-jose` or `pyjwt` | Free, open-source — verifies Supabase JWTs in FastAPI |
| Thunder Client (VS Code extension) or Postman free tier | Manually test auth endpoints without writing a frontend first |

**Acceptance test:** create two test accounts, confirm account A's token cannot fetch account B's `/me` or any B-owned quest.

---

## Phase 3 — Quest Management Engine
**Tasks:** Quest CRUD endpoints, category seed data, state-machine enforcement.

**Tools & free access:**
| Tool | Purpose |
|---|---|
| SQLAlchemy or Prisma-equivalent for Python (SQLModel) | Free, open-source ORM/typed-query layer over the Supabase Postgres connection string |
| Alembic | Free, open-source — database migrations, so your schema changes are version-controlled alongside code |

---

## Phase 4 — RPG Progression Engine
**Tasks:** Implement the reward-calculation function (Backend Schema §2), the XP curve, attribute mapping table, mastery-percent calculation, streak + recovery-quest logic. This is pure backend logic — no new external tool is required.

**Tools & free access:**
| Tool | Purpose |
|---|---|
| `pytest` | Free, open-source — unit-test the XP curve and reward formula in isolation before wiring them to any endpoint |

---

## Phase 5 — Economy & Rewards
**Tasks:** Shop catalog, purchase transaction (atomic ledger insert + inventory insert), achievements evaluation.

**Tools & free access:** No new tools — same Postgres/FastAPI stack. Write the purchase flow as a single database transaction (`BEGIN ... COMMIT`) so a crash mid-purchase never leaves Gold deducted without the item granted, or vice versa.

---

## Phase 6 — Experience Layer (UI/UX Polish)
**Tasks:** Build the dashboard, quest board, character, shop screens; wire the micro-interactions from the UI/UX Spec; implement the reduced-motion toggle; do a full keyboard-navigation pass.

**Tools & free access:**
| Tool | Purpose | Free access |
|---|---|---|
| Figma | Design mockups before coding them | Free "Starter" plan — sign up at figma.com, no card required |
| Framer Motion | React animation library | Free, open-source npm package |
| Tailwind CSS | Styling | Free, open-source |
| Google Fonts | Typography | Free, no attribution required |
| Lucide (`lucide-react`) | Icon set | Free, open-source |
| WAVE or axe DevTools browser extension | Accessibility contrast/structure checks | Free browser extensions |

---

## Phase 7 — Intelligence Layer (AI)
**Tasks:** Context Builder, Gemini API integration with structured-output request, schema validator, adaptive-difficulty scoring.

**Tools & free access:**
| Tool | Purpose | How to get it free |
|---|---|---|
| **Google AI Studio / Gemini API** | LLM calls for the Quest Planner and Coach | Go to aistudio.google.com, sign in with any Google account, click "Get API key." No credit card required. Free tier is a genuine ongoing free tier (not a trial): Flash/Flash-Lite models with per-minute, per-day, and token-per-minute caps (Google publishes the current numbers on its rate-limits page — check `ai.google.dev/gemini-api/docs/rate-limits`, since exact figures shift as Google adjusts capacity). Keep the key **only** in your FastAPI backend's environment variables — never in frontend code, per TRD §6. |
| `pydantic` | Free, open-source — defines the JSON schema Gemini's output must match, and validates it before it ever reaches the database | |
| Claude API (optional, future upgrade path) | Stronger reasoning once the product grows past what Gemini's free tier comfortably covers | Check current pricing, rate limits, and any trial credit directly at docs.claude.com — don't build against remembered numbers, since they change |

**Why Gemini first and not Claude for the MVP:** the free tier is real and ongoing rather than a time-boxed trial, which matters for a project you need to keep demonstrably working for weeks. Rate-limit the `/ai/*` endpoints per user in your own backend regardless of which provider you use, so one user's testing doesn't exhaust the shared daily quota (TRD §3.3, OWASP LLM10).

---

## Phase 8 — Security & Enterprise Hardening
**Tasks:** Audit every `PATCH` route for field whitelisting; verify BOLA checks on every ID-bearing route with two real test accounts; add per-user rate limiting to AI routes; review RLS policies against the ERD.

**Tools & free access:**
| Tool | Purpose | Free access |
|---|---|---|
| OWASP ZAP | Automated basic API security scanning | Free, open-source, download from zaproxy.org |
| `npm audit` / `pip-audit` | Dependency vulnerability scanning | Free, built into your existing package managers |
| `slowapi` | Rate limiting for FastAPI | Free, open-source |

---

## Phase 9 — Testing & QA
**Tasks:** Unit tests (XP/level/Gold/streak/attribute math), integration tests (create → complete → purchase → refresh), a deliberate BOLA test (account A vs. account B), and one full end-to-end run.

**Tools & free access:**
| Tool | Purpose | Free access |
|---|---|---|
| `pytest` | Unit + integration tests (backend) | Free, open-source |
| Vitest or Jest | Unit tests (frontend) | Free, open-source |
| Playwright | End-to-end browser testing | Free, open-source; also runs free inside GitHub Actions on public repos |

**Non-negotiable E2E script:** signup → create quest → complete quest → confirm level-up math → purchase item → refresh the page → confirm every piece of state survived the refresh (this is the exact scenario the problem statement's disqualification rule on "fake data persistence" is checking for).

---

## Phase 10 — Deployment, Observability & Launch
**Tasks:** Deploy frontend to Vercel, backend to Render, confirm the production Supabase project is the one actually wired in (not a dev project), set up a keep-alive ping, record the walkthrough video.

**Tools & free access:**
| Tool | Purpose | Free access |
|---|---|---|
| Vercel | Production frontend hosting | As Phase 1 — free forever for this use case |
| Render | Production backend hosting | As Phase 1 |
| **GitHub Actions scheduled workflow** (recommended) | Keep-alive ping to prevent the Supabase 7-day pause | Free on public repos — a `schedule:` cron trigger that runs a `curl` against your Supabase project on a sub-7-day interval (e.g. every 3 days). GitHub's own integration for this became available on the free plan starting April 2026. |
| UptimeRobot (alternative) | Same keep-alive purpose, no code required | Free tier supports up to 50 monitors, pinging every 5 minutes |
| OBS Studio | Screen-record the 90–180 second walkthrough video | Free, open-source, obsproject.com |
| YouTube (unlisted) or a repo-hosted file | Host the video publicly without requiring login to view | Free — verify the "unlisted" link truly requires no sign-in before submitting, since the problem statement disqualifies a video that "requires login authorization to view" |

**Final deployment checklist** (mirrors the problem statement's zero-tolerance rules):
- [ ] GitHub repo is public, ≥3 chronological commits, backend code present
- [ ] `.env.example` committed with every variable named, none populated with real secrets
- [ ] Production Supabase project connected (not a stale dev project)
- [ ] Live frontend URL loads without crashing
- [ ] Live backend API responds (check `/docs` route FastAPI generates automatically)
- [ ] No unhandled console errors on a basic click-through
- [ ] Data persists across a hard refresh
- [ ] Video is 90–180 seconds, under 100MB, publicly viewable with no login
- [ ] Keep-alive ping configured so the app is still live when a judge checks it in three weeks, not just today

## Consolidated Free-Tool Stack (one table, everything above)

| Layer | Tool | Cost |
|---|---|---|
| Frontend hosting | Vercel Hobby | $0, ongoing |
| Backend hosting | Render Free | $0, ongoing (cold starts after idle) |
| Database + Auth | Supabase Free | $0, ongoing (pauses after 7-day inactivity — mitigated) |
| AI | Google Gemini API free tier | $0, ongoing (rate-limited) |
| Design | Figma Starter | $0, ongoing |
| CI/CD | GitHub Actions (public repo) | $0, ongoing |
| Testing | pytest / Vitest / Playwright | $0, open-source |
| Monitoring/keep-alive | GitHub Actions cron or UptimeRobot | $0, ongoing |
| Extra credit (if eligible) | GitHub Student Developer Pack | $0, one-time verification, multi-year value |

Every tool on this list has a genuinely ongoing free tier as of the research behind this plan — none require a credit card to start, and none are time-boxed trials except where explicitly marked. Free-tier terms do shift over time (Supabase's own pause policy tightened once already in 2026), so re-check the provider's pricing page before a long gap in active development.
