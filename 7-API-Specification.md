# Life RPG — API Specification

Phase alignment: see `0-README-Master-Index.md`. Framework: **FastAPI**, which auto-generates interactive OpenAPI docs at `/docs` from this same contract — keep the two in sync rather than maintaining them separately.

## 1. Conventions

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <Supabase JWT>` on every route except `/auth/register` and `/auth/login`
- Standard error envelope:
  ```json
  { "error": { "code": "INSUFFICIENT_FUNDS", "message": "Not enough Gold for this purchase." } }
  ```
- Rate-limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) are present on all `/ai/*` endpoints (Phase 8 hardening, OWASP LLM10).
- Every `PATCH` route documents its field allow-list explicitly in this spec — anything not listed is rejected, not ignored silently, so the client gets a clear 422 rather than silent data loss.

## 2. Phase 2 — Identity

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Delegates to Supabase Auth; creates a matching `profiles` row on success |
| POST | `/auth/login` | Delegates to Supabase Auth |
| POST | `/auth/logout` | Invalidates the session |
| GET | `/me` | Returns the caller's own profile — never accepts a target user ID |

**Security note:** `/me` and every subsequent authenticated route derive the user identity solely from the verified JWT, never from a request parameter or body field.

## 3. Phase 3 — Quests

| Method | Path | Notes |
|---|---|---|
| GET | `/quests` | List caller's own quests; filterable by `status`, `category` |
| POST | `/quests` | Create; server validates non-empty title, valid difficulty enum |
| GET | `/quests/:id` | 403/404 if not owned by caller |
| PATCH | `/quests/:id` | Allow-list: `title`, `description`, `category_id`, `deadline`, `estimated_duration`, `recurrence`. **Never**: `status` (use the dedicated transition routes below), `xp`, `gold` |
| DELETE | `/quests/:id` | Soft-delete preferred (set `ARCHIVED`) over hard delete, to preserve completion history |
| POST | `/quests/:id/complete` | The one route allowed to transition to `COMPLETED`; triggers the full reward cascade (Backend Schema §1) |

**Example — complete a quest:**
```
POST /api/v1/quests/f3a1.../complete
→ 200
{
  "quest_id": "f3a1...",
  "xp_awarded": 50,
  "gold_awarded": 25,
  "attribute_deltas": { "intellect": 5, "focus": 2 },
  "level_up": false,
  "streak": { "current": 15 }
}
```
Note the response contains the numbers the client should render — the client never computes or supplies them.

## 4. Phase 4 — Progression

| Method | Path | Notes |
|---|---|---|
| GET | `/progress` | Level, cumulative XP, XP-to-next-level, history summary |
| GET | `/attributes` | All 5 attributes with current value + `mastery_percent` |
| GET | `/streak` | Current/longest streak, recovery-quest status if a day was missed |

## 5. Phase 5 — Economy

| Method | Path | Notes |
|---|---|---|
| GET | `/shop` | Catalog of purchasable items |
| POST | `/shop/:id/purchase` | Server recomputes Gold balance from the ledger before allowing; 402-style error on insufficient funds |
| GET | `/inventory` | Owned items |
| PATCH | `/inventory/:id` | Allow-list: `equipped` only |
| GET | `/achievements` | Definitions + caller's earned status |

## 6. Phase 7 — Intelligence Layer

| Method | Path | Notes |
|---|---|---|
| POST | `/ai/quest-plan` | Input: free-text goal + timeframe. Output: structured, schema-validated set of DRAFT quests |
| POST | `/ai/daily-coach` | Input: none (server builds context). Output: one sanitized-context-based recommendation |
| POST | `/ai/progress-analysis` | Weekly/period summary in natural language, grounded only in the sanitized context |
| POST | `/ai/difficulty-recommendation` | Input: quest category. Output: suggested difficulty based on recent completion/failure rate |

**Example — quest plan request:**
```json
{ "goal": "Prepare for my DSA exam", "timeframe_days": 30 }
```
**Response (schema-validated before storage):**
```json
{
  "proposed_quests": [
    { "title": "Arrays practice", "category": "coding", "difficulty": "medium", "estimated_duration_min": 45 },
    { "title": "Strings practice", "category": "coding", "difficulty": "medium", "estimated_duration_min": 45 }
  ],
  "status": "DRAFT"
}
```
All returned quests are inserted as `DRAFT` — the user activates them explicitly (App Flow §7).

## 7. Standard Error Codes

| Code | HTTP status | Meaning |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired JWT |
| `FORBIDDEN` | 403 | Valid session, but not the resource owner |
| `NOT_FOUND` | 404 | Resource doesn't exist (or isn't the caller's — see BOLA note below) |
| `VALIDATION_ERROR` | 422 | Field failed validation or is not on a `PATCH` allow-list |
| `INSUFFICIENT_FUNDS` | 402-style custom | Purchase attempted without enough Gold |
| `ALREADY_COMPLETED` | 409 | Duplicate quest-completion attempt |
| `AI_RATE_LIMITED` | 429 | Per-user AI call limit exceeded |
| `AI_SCHEMA_INVALID` | 502-style custom | Model output failed schema validation after retry |

**BOLA note:** decide deliberately whether "not yours" returns 403 or 404 and apply it consistently — mixing the two across endpoints is itself an information leak (403 confirms existence, 404 doesn't).

## 8. Security Notes Recap (see TRD §3.2–3.3 for full rationale)
- Every ID-bearing route performs the ownership chain: authenticated → exists → owned by caller → permitted for this action.
- Every `PATCH` route enforces its documented allow-list server-side, not just in frontend form logic.
- `/ai/*` routes are rate-limited per user and never accept or return a path that writes directly to `xp_transactions` or `gold_transactions`.
