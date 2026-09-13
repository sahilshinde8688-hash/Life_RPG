# Life RPG — UI/UX Design Specification

Phase alignment: see `0-README-Master-Index.md`.

## 1. Design Philosophy

The problem statement explicitly penalizes "lazy, overly generic designs, default unstyled components, or poor visual hierarchy." Theme is creative freedom, but **pick one and commit** — the spec below assumes a default reference direction (a dark, high-contrast "modern fantasy / soft-cyberpunk hybrid": deep navy/charcoal background, one saturated accent color for XP, a second for Gold, serif display type for headings against a clean sans body face) purely so every component below has concrete values. Swap the token values in §2 to re-skin into lo-fi study room, 16-bit dungeon, or pure minimalism — the structure underneath does not change.

Three non-negotiables regardless of theme:
1. **Thematic cohesion** — "Quests" not "Tasks," "Gold" not "Points," consistently, everywhere, including error messages.
2. **Tactile feedback** — every state change (checkmark, level-up, purchase) gets a deliberate micro-interaction, never an instant silent update.
3. **Perceived speed** — optimistic UI + skeleton loaders so remote persistence never feels like a lag.

## 2. Design System Tokens (reference values — restyle freely)

| Token | Reference value | Notes |
|---|---|---|
| `--bg-base` | `#0F1220` | Deep neutral background |
| `--bg-surface` | `#1A1E30` | Card/panel background |
| `--accent-xp` | `#7C5CFF` | XP bars, progress, intellect-family accents |
| `--accent-gold` | `#F5B841` | Gold currency, currency icons |
| `--accent-danger` | `#FF5C7A` | Streak-broken, insufficient-funds states |
| `--text-primary` | `#F2F1FA` | Body/heading text on dark surfaces |
| `--radius-card` | `12px` | Consistent card corner radius |
| `--motion-standard` | `220ms cubic-bezier(0.4,0,0.2,1)` | Default transition |
| `--motion-reduced` | `1ms` | Applied app-wide when `prefers-reduced-motion` or the in-app toggle is set |
| Type — display | Serif or slab, 28–40px | Headings, level-up numerals |
| Type — body | Clean sans, 14–16px | Everything else |

## 3. Core Screens

### 3.1 Dashboard — the "5 questions" framework
The dashboard must answer these five things at a glance, in this priority order, without requiring a scroll on a 375px-wide screen:

| # | Question | Element |
|---|---|---|
| 1 | Who am I? | Level + title badge ("LV 12 · The Builder") |
| 2 | How am I progressing? | XP progress bar (current / next-level threshold) |
| 3 | What should I do now? | Today's 2–3 highlighted quests |
| 4 | How am I doing? | Streak indicator (🔥 N days) |
| 5 | What am I becoming? | Mini attribute trend row (↑ / → / ↓ per attribute) |

Ten unrelated stat cards is the anti-pattern this avoids — group by these 5 questions, not by data availability.

### 3.2 Quest Board
List/board of quests grouped by status (Active / In Progress / Completed today). Each quest card shows: title, category icon, difficulty badge, XP/Gold preview, and a single primary "Complete" action. Empty-state illustration + one-line prompt when no quests exist yet (never a bare blank screen).

### 3.3 Character
Level, XP bar, 5 attribute bars, and — the priority element per the research in the PRD — **mastery bars per skill area** (e.g. "DSA 78%, Writing 62%, Fitness 41%") shown *above* the raw level number, not below it, since it's the more direct competence signal.

### 3.4 Shop / Inventory
Shop: grid of purchasable cosmetics (frames, themes, titles, effects) with price in Gold; greyed-out state (not hidden) for items the user can't yet afford, with the shortfall shown ("Need 320 more Gold"). Inventory: owned items with an "Equip" toggle; equipped state is visually distinct.

### 3.5 AI Coach
Chat-like single-turn recommendation card, not an open-ended chatbot: shows the sanitized context it used (e.g. "Intellect trending up, Focus down this week") and one concrete suggested action with an "Add to quests" button that inserts it as a DRAFT quest.

## 4. Micro-Interaction Specifications

### Quest completion (target: ~900ms total)
1. `0ms` — Tap/click registers; checkbox fills, card gets a subtle scale-up (1.0 → 1.03 → 1.0)
2. `100ms` — "+XP" and "+Gold" text floats upward and fades (`--motion-standard`)
3. `300ms` — XP progress bar animates toward its new position
4. `500ms` — Attribute value increments with a brief highlight pulse
5. `900ms` — Card either dims (if archived) or moves to the "Completed today" group

### Level-up sequence (target: ~2.5s, skippable)
1. Screen dims slightly (overlay, `z-index` above content but **never trapping keyboard focus** — see §5, SC 2.4.11)
2. Character silhouette/glow pulses
3. New level number reveals with the display typeface
4. Reward reveal (any level-up bonus)
5. Single "Continue" button, focus is programmatically moved to it immediately on overlay open

An **Animations: On / Reduced** toggle is mandatory, not optional — reduced mode collapses every sequence above to a single instant state change plus a static confirmation toast.

## 5. Accessibility Specification (WCAG 2.2 AA)

| Requirement | Implementation note |
|---|---|
| 2.4.11 Focus Not Obscured (AA) | Level-up overlay and any sticky header/toast must never fully cover the currently focused element |
| 2.5.8 Target Size Minimum (AA) | Quest checkboxes and shop buttons ≥ 24×24px effective touch target on mobile |
| 2.5.7 Dragging Movements (AA) | If quest reordering uses drag, provide an equivalent "Move up / Move down" button pair |
| 3.2.6 Consistent Help (A) | AI Coach entry point stays in the same on-screen position across every page |
| 3.3.7 Redundant Entry (A) | Multi-step signup/quest-creation wizards never re-ask for information already given |
| 3.3.8 Accessible Authentication Minimum (AA) | If a CAPTCHA is ever added for the demo, it must have a non-cognitive-test alternative |
| Full keyboard operability | Tab / Shift+Tab / Enter / Space / Escape / Arrow keys all functional everywhere |
| Visible focus state | Every interactive element has a non-color-only focus indicator |
| Contrast | Body text ≥ 4.5:1, large text ≥ 3:1 against its background token |
| No color-only status | Streak/level/status changes are paired with an icon or text label, not color alone |

Note: 4.1.1 Parsing (strict HTML validity) was removed from WCAG in the 2.2 revision — modern browsers/assistive tech handle this already, so it is not a separate checklist item.

## 6. Responsive Breakpoints

| Breakpoint | Width | Layout change |
|---|---|---|
| Mobile | < 640px | Single column, bottom-anchored primary actions |
| Tablet | 640–1024px | Two-column dashboard, collapsible side nav |
| Desktop | > 1024px | Three-column dashboard, persistent side nav |

## 7. Component List by Phase

| Phase | New components |
|---|---|
| 2 | Auth forms, protected-route wrapper |
| 3 | Quest card, quest form, status filter tabs |
| 4 | XP bar, attribute bar, mastery bar, streak badge, level-up overlay |
| 5 | Shop grid item, inventory item, purchase confirm modal |
| 6 | Dashboard shell, skeleton loaders, reduced-motion toggle, empty states |
| 7 | AI Coach card, quest-plan review list |
