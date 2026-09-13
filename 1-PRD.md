# Life RPG — Product Requirements Document (PRD)

Phase alignment: see `0-README-Master-Index.md` for the shared Phase 0–10 table used across the whole suite.

## 1. Problem Statement

Traditional to-do lists and habit trackers fail because real-world payoff is slow: studying, exercising, and building skills take months to show results, while games give instant, visible progress. Life RPG closes that gap by translating real actions into a persistent character-progression system — not a to-do list with a coat of paint, but a **Personal Progress Operating System**.

```
REAL-LIFE GOAL → QUEST → ACTION → VERIFIED COMPLETION →
XP + GOLD + ATTRIBUTE GROWTH → LEVEL / MASTERY → REWARDS →
PERSONALIZED NEXT QUEST → CONTINUED BEHAVIOR
```

## 2. Product Principles (evidence-based, not decorative)

A 2024 meta-analysis of 35 gamification interventions (Li et al., *Educational Technology Research and Development*, 2,500 participants) found gamification produces a small but real lift in intrinsic motivation (Hedges' g = 0.257), a meaningful lift in perceived autonomy (g = 0.638), a large lift in perceived relatedness (g = 1.776) — and only a minimal lift in perceived **competence** (g = 0.277). A follow-up qualitative review of 31 studies traced most failures to two causes: gamification that didn't make users feel more skilled, and gamification that removed choice rather than adding it.

Three principles follow directly, and every feature below is judged against them:

1. **Weight Mastery over Level.** A raw level number is a weak competence signal. A per-skill mastery bar ("DSA 78%") is a direct one — treat it as a first-class feature, not a footnote.
2. **Preserve autonomy.** Never force a single fixed quest path or make a mechanic mandatory. Users choose their own quests and can opt out of secondary mechanics (e.g. streaks) without being penalized out of the core loop.
3. **Recover, don't punish.** A missed day should unlock a Recovery Quest, not erase progress outright — loss-aversion mechanics (Habitica's HP-loss-per-miss model) trade retention for anxiety; this product deliberately does not copy that.

## 3. Target Users

| Persona | Need |
|---|---|
| **The Builder** — student/self-improver juggling study, gym, and habits | Wants visible, immediate proof that effort is compounding |
| **The Judge/Evaluator** (hackathon/competition context) | Needs to see, within 2 minutes, that the RPG mechanics are real, persistent, and non-trivial to fake |

## 4. Competitive Positioning

| | **Habitica** | **Finch** | **Life RPG (this product)** |
|---|---|---|---|
| Task model | Habits / Dailies / To-Dos, 3 distinct reward logics | Goals feed a companion | Quests with difficulty-scaled server-calculated reward |
| Stat block | HP, MP, XP, Gold | Companion mood/energy | XP (mastery-weighted), Gold, 5 attributes, streak |
| Miss penalty | **HP loss** (loss aversion) | Soft | **Recovery Quest** (no punitive loss) |
| Difficulty adaptation | **None** — user self-reports difficulty | None | **Server-side adaptive difficulty engine** (Phase 7) |
| Monetization | Gold→gems (capped), gem purchases, no pay-to-win stats | Freemium | MVP: fully virtual/cosmetic economy, no real-money layer |

**The real differentiator is not theme.** "Cyberpunk vs. cozy" is cosmetic and won't move a judge who has seen ten reskinned to-do apps. **Server-side adaptive difficulty is a genuine gap in Habitica** (it has none) and is the one claim in this PRD worth building the demo around.

## 5. Success Metrics

**North Star Metric:** Meaningful Quest Completion Rate = completed meaningful quests ÷ active planned quests (not login count).

| Metric | What it tells you |
|---|---|
| Activation | % of users completing 1 quest within their first session |
| D1 / D7 retention | Do they come back? |
| Streak retention | % maintaining a 7-day streak |
| Time-to-Level-5 | Is early progression paced correctly? |
| Gold earned vs. spent | Is the economy balanced? |
| AI recommendation acceptance rate | Is the Intelligence Layer actually useful, or ignored? |

## 6. Feature Scope by Phase

| Phase | Ships | Acceptance Criteria |
|---|---|---|
| **0** | This document suite | PRD, TRD, App Flow, UI/UX, Backend Schema, ERD, API Spec, Implementation Plan all exist and cross-reference the same phase numbers |
| **1** | Repo, Next.js + FastAPI skeletons, Supabase project, CI | `git clone` → app boots locally with one documented command |
| **2** | Signup, login, logout, session, protected routes | User A's JWT cannot read User B's `/me` data (403/404) |
| **3** | Quest CRUD, categories, difficulty, recurrence | Create → Read → Update → Delete → Complete → Archive all work; empty title rejected client- and server-side |
| **4** | XP engine, non-linear levels, 5 attributes, mastery bars, streaks + recovery quest | Reward for a quest is **never** client-supplied; refresh preserves all state |
| **5** | Gold ledger, shop, inventory, achievements | Purchase without sufficient Gold is rejected server-side; duplicate purchase can't double-spend |
| **6** | Dashboard, quest board, character, shop screens; animations; responsive; keyboard nav | App is usable end-to-end via Tab/Enter/Space alone; passes a basic contrast check |
| **7** | AI Quest Planner, AI Daily Coach, adaptive difficulty | AI output is schema-validated before it ever reaches the database; AI cannot write XP/Gold directly |
| **8** | BOLA checks, field whitelisting, rate limiting | `PATCH /quests/:id` with a spoofed `{"xp": 999999}` field is silently dropped, not applied |
| **9** | Unit/integration/security/E2E test suites | Signup → create quest → complete → level up → purchase → refresh → data persists, automated |
| **10** | Live URL, monitoring, demo video | Public repo, ≥3 chronological commits, live link, 90–180s video, all reachable without login |

## 7. Business Model Evolution (not part of the MVP build — context for the "enterprise" framing)

| Stage | Audience | What's added |
|---|---|---|
| B2C (MVP) | Individual users | Quests, progression, basic AI, free cosmetics |
| Education | Institutions | Academic quests, skill-attribute mapping, cohort analytics |
| Enterprise | Organizations | Teams, SSO, RBAC, admin analytics (aggregate only — no default visibility into an individual's private quests) |

## 8. Zero-Tolerance Requirements (from the problem statement — non-negotiable)

- Public GitHub repo, ≥3 chronological commits, backend code included
- No `localStorage`-only persistence — a real backend + database is mandatory
- Live deployment must not be broken or crash on load at judging time
- No unhandled runtime exceptions / blank-screen crashes
- 90–180 second video, hosted publicly, under 100MB, no login required to view

## 9. Non-Goals for the MVP

Real-money marketplace, cryptocurrency, multiplayer battles, native mobile apps, 20-agent AI systems, microservices, blockchain, a full social network. These add complexity without moving the judged criteria.

## 10. Sources
Li et al. (2024), *Educational Technology Research and Development* — gamification meta-analysis. Habitica feature documentation (cross-checked). Problem statement PDF (uploaded).
