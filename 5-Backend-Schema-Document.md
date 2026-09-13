# Life RPG — Backend Schema Document

Phase alignment: see `0-README-Master-Index.md`. This document defines *business rules and module boundaries*; exact table columns live in `6-Database-ERD.md`.

## 1. Modular Monolith — Module Map

A full microservices split is explicitly out of scope for the MVP (see PRD §9). One FastAPI codebase, cleanly separated into modules that only talk to each other through domain events:

```
API Gateway (FastAPI routers)
      │
 ┌────┴─────┬─────────────┬─────────────┬───────────┐
 │           │             │             │           │
Identity   Quest        RPG Engine    Economy       AI
Module     Module       Module        Module        Module
 │           │             │             │           │
 └───────────┴──────┬──────┴─────────────┴───────────┘
                     │
              Domain Event Bus (in-process)
                     │
        ┌────────────┼─────────────┐
        ↓            ↓             ↓
   XP Engine   Streak Engine   Achievement Engine
        │
        ↓
     Wallet Ledger → Notification
```

Example cascade: `QUEST_COMPLETED` triggers, in order — XP awarded → Gold awarded → attribute updated → streak updated → achievements evaluated → notification generated → analytics event recorded. Each step is its own listener, so adding a new consequence (e.g. a weekly-campaign tally) never touches the Quest module's own code.

## 2. Module Rules by Phase

### Phase 2 — Identity Module
- Supabase Auth issues the JWT; FastAPI verifies it against Supabase's public key (JWKS) on every request — never trusts a client-supplied user ID in the request body.
- Every table that stores user-owned data carries a `user_id` foreign key, and every query filters by the *authenticated* `user_id`, never one read from the request payload.
- Row-Level Security policies exist as a second, independent layer (see ERD §4) — a bug in the FastAPI filter should still be caught by Postgres.

### Phase 3 — Quest Module
- State machine: `DRAFT → ACTIVE → IN_PROGRESS → COMPLETED → ARCHIVED`, with `PAUSED`, `FAILED`, `CANCELLED` as branches off `ACTIVE` (see App Flow §4 for the diagram).
- Server-side validation: title non-empty and length-bounded, difficulty must be one of the defined enum values, deadline (if present) must not be in the past at creation time.
- A quest can only transition to `COMPLETED` from `ACTIVE` or `IN_PROGRESS`, and only by its owner.

### Phase 4 — RPG Engine Module
**Server-side reward calculation** (never trust a client-supplied reward number):

```
final_reward = base_reward(difficulty)
             × duration_modifier(estimated_duration)
             × complexity_modifier(category)
             × user_progression_modifier(current_level)
```

| Difficulty | Base XP | Base Gold |
|---|---|---|
| Trivial | 10 | 5 |
| Easy | 25 | 10 |
| Medium | 50 | 25 |
| Hard | 90 | 45 |
| Epic | 150 | 75 |

- **XP curve:** cumulative `total_xp_to_reach(level) = 100 × level^1.8`; `level` is derived from `total_xp`, never stored redundantly in a way that can drift out of sync.
- **Attribute mapping:** every quest category maps to one primary + optional secondary attribute (e.g. "Study DSA" → Intellect primary +5, Focus secondary +2). This mapping table is data, not hardcoded logic, so new categories can be added without a deploy.
- **Mastery bars:** a per-skill-area progress percentage, separate from level — weighted more heavily in the UI than raw level (see PRD §2 and UI/UX Spec §3.3) because it is the more direct competence signal.
- **Streaks:** incrementing counter on consecutive-day activity; a missed day does **not** simply reset to zero silently — it unlocks a Recovery Quest (see PRD §2, principle 3).

### Phase 5 — Economy Module
- **Ledger, not balance:** `gold_transactions` and `xp_transactions` are append-only. A user's Gold balance is `SUM(amount)` over their rows, computed at read time (or cached and invalidated on write — never treated as the source of truth).
- **Purchase validation:** `POST /shop/:id/purchase` recomputes the current balance server-side, rejects if insufficient, and — if sufficient — inserts the negative ledger row and the inventory row inside a single database transaction (both succeed or both fail; no partial state).
- **Field whitelisting (OWASP API3 — Broken Object Property Level Authorization):** every `PATCH` endpoint declares an explicit allow-list of fields it accepts. A request body containing `xp`, `gold`, or `level` directly is either rejected outright or silently ignored — it is never blind-bound onto the model.

### Phase 7 — AI Module
- **Context Builder** assembles a sanitized summary only: level, streak, attribute values, recent completion/miss counts, and the user's stated objective. It never passes raw database rows or other users' data to the model.
- **Structured output only:** the Gemini response is requested against a defined JSON schema and passed through a **Schema Validator** before touching the database; a response that fails validation is retried once, then falls back to a template quest set rather than inserting garbage.
- **Rate limiting:** AI endpoints are limited per user (e.g. N requests per hour) both to prevent abuse and to protect the shared Gemini free-tier daily quota (OWASP LLM10 — Unbounded Consumption).
- **Hard boundary:** the AI module has no write access to `xp_transactions`, `gold_transactions`, `users`, or `auth` tables. Its only write path is inserting `DRAFT` quests and `ai_recommendations` rows.

### Phase 8 — Security Rules (cross-cutting, formalized)
- BOLA check on every object-ID-bearing endpoint: authenticated? → object exists? → object belongs to caller? → caller has permission for this action? → proceed.
- Never rely solely on "does `user_id` on the row match the session" once any role/org hierarchy exists later — that check alone is known to miss hierarchy-based cases (an org admin needing to view a team member's quest, for instance). Add explicit policy checks before introducing roles.
- No endpoint ever accepts `xp`, `gold`, `level`, or `role` as client-writable input, under any endpoint, at any phase.

## 3. Event Catalog

| Event | Emitted by | Consumed by |
|---|---|---|
| `QUEST_COMPLETED` | Quest Module | XP Engine, Streak Engine, Achievement Engine, Notification |
| `LEVEL_UP` | RPG Engine | Notification, Analytics |
| `STREAK_UPDATED` | Streak Engine | Notification, Achievement Engine |
| `REWARD_PURCHASED` | Economy Module | Notification, Analytics |
| `AI_RECOMMENDATION_CREATED` | AI Module | Notification |

## 4. Business Events Logged for Observability
`QUEST_CREATED`, `QUEST_COMPLETED`, `LEVEL_UP`, `REWARD_PURCHASED`, `STREAK_UPDATED`, `AI_RECOMMENDATION_CREATED` — each logged with `user_id`, `request_id`, `event`, `timestamp`, `result`, feeding the North Star and secondary metrics defined in the PRD.
