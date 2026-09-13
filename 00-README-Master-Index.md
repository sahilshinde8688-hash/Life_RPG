# LIFE RPG — Enterprise MVP Specification Suite
### Master Index & Phase Framework

This suite turns the uploaded problem statement + blueprint + research brief into eight execution-ready documents. All eight are phase-aligned: **Phase 3 in the PRD, the TRD, the API Spec, the ERD, and the Implementation Plan all describe the same slice of the build** (the Quest Engine). Read a phase "horizontally" across documents when you sit down to build it.

| File | Purpose |
|---|---|
| `1-PRD.md` | Product vision, positioning, success metrics, feature scope by phase |
| `2-TRD.md` | Architecture, tech stack decisions, non-functional requirements |
| `3-App-Flow-Document.md` | User journeys, screen inventory, state machines |
| `4-UI-UX-Design-Specification.md` | Design system, micro-interactions, accessibility spec |
| `5-Backend-Schema-Document.md` | Domain modules, business rules, event architecture |
| `6-Database-ERD.md` | Entity-relationship diagram, table definitions, RLS policies |
| `7-API-Specification.md` | Versioned REST contract, request/response shapes, security notes |
| `8-Implementation-Plan.md` | Day-by-day build plan **with the exact free tools to use and how to keep them free** |

---

## The Master Phase Table (identical in every document)

| # | Phase | Core Question It Answers |
|---|---|---|
| 0 | Specification & Planning | What are we building, for whom, and why? |
| 1 | Foundation & Infrastructure | What is the skeleton the rest gets built on? |
| 2 | Identity, Auth & Isolation | Who is the user — and is their data safe from every other user? |
| 3 | Quest Management Engine | Can a user create, track, and complete real-life tasks as quests? |
| 4 | RPG Progression Engine | Does completing a quest visibly grow the character? |
| 5 | Economy & Rewards | What can the user do with what they've earned? |
| 6 | Experience Layer (UI/UX) | Does it feel alive, tactile, cohesive, and accessible? |
| 7 | Intelligence Layer (AI) | Does the system personalize and adapt to the user? |
| 8 | Security & Enterprise Hardening | Can it survive an adversarial user or a judge trying to break it? |
| 9 | Testing & QA | Is every claim above provably true? |
| 10 | Deployment, Observability & Launch | Is it live, monitored, and reachable weeks later without babysitting? |

## Locked architecture decisions (referenced everywhere below)

These were chosen once, here, and reused consistently across all eight documents so nothing contradicts itself:

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion → deployed on **Vercel**
- **Backend API:** **FastAPI** (Python) — owns all game logic, ledger writes, and AI orchestration → deployed on **Render**
- **Auth + Database:** **Supabase** (Postgres + Auth + Row-Level Security) — the frontend uses the Supabase client for signup/login; the JWT it issues is verified by FastAPI on every request
- **AI provider:** **Google Gemini API** (free tier) called only from FastAPI, never from the browser
- **Non-linear XP curve:** `total_xp_to_reach(level) = 100 × level^1.8`, cumulative total stored per user, soft-capped past level ~45
- **Ledger principle:** XP and Gold are never stored as a mutable balance column — every change is an append-only transaction row; the balance is a computed sum

Where a document offers an alternative (e.g. Neon + Better Auth instead of Supabase), it is flagged explicitly as an alternative, not a silent substitution.

## What this suite deliberately does not do
Per the problem statement's own scope discipline and the blueprint's "don't build" list: no real-money marketplace, no multiplayer battles, no native mobile apps, no microservices, no blockchain. One modular monolith, hardened and polished, beats a sprawling half-built platform.
