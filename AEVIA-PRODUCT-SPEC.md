# Aevia — Product Build Spec (Consolidated)

**Consolidated from `DASHBOARD-PRODUCT-SPEC` v2, v3 and v4.**

## How to read this document

- **Implementation status (below)** records what has actually been built and where the product deliberately differs from the specification. Nothing in the specification was deleted; where the status section and a later section disagree, the status section describes the shipped behavior and the section remains the longer-term target.
- **Part 1 (Sections 0–59)** are the **authoritative specification** (originally v4 — "data-integrity and scheduling semantics hardened"). They are reproduced unchanged except for this header and the status section.
- **Appendix A** preserves wording from **v3** that v4 restated or replaced.
- **Appendix B** preserves wording from **v2** that v3/v4 restated, expanded or replaced (including the original simple data model and freeze rules).
- **If an appendix ever conflicts with Sections 0–59, Sections 0–59 win.** The appendices exist so that no earlier decision, rationale or phrasing is lost, not to add requirements.
- Section numbers in the appendices match the section numbers in the main specification.

## Version history

| Version | Focus |
|---|---|
| v2 | First complete spec: five pages, simple habit/task/goal model, simple freeze-token rule, simple data model. |
| v3 | Added historical schedule integrity: schedule versions, materialized obligations, freeze grace windows, proration, finalization job. |
| v4 | Hardened data integrity and scheduling semantics: persistence/timezone contract, consents, week-setting versions, obligation generation contract, check-in edit policy, hard-deletion workflow, JSON/CSV export contract. |

---

## Implementation status (what is built today)

This section was added after the first release was built. It is a record of shipped behavior, not new requirements.

### Stack as built
Next.js 16 (App Router, Turbopack) on Node, React 19, Tailwind v4 with shadcn/ui; Better Auth (email and password); Neon Postgres through Drizzle ORM; Stripe for payments. Server actions perform every write and re-check the signed-in user and ownership each time. Data for the dashboard is loaded once in the shared dashboard layout, so switching tabs does not refetch.

### Pages
| Spec page | Status |
|---|---|
| Today (§6) | Built. Habits grouped by Morning / Afternoon / Evening / Anytime, tasks for the day, week strip for reviewing or fixing past days, a "not done yesterday" prompt, progress ring, streak and freeze-token cards. |
| Habits (§7–11) | Built as a monthly grid with month navigation, trend line, per-habit consistency, current and best streak. The separate Weekly and Monthly views (§10–11) are **not built**. |
| Tasks (§14) | Built as a weekly planner with per-day columns, copy-yesterday, and an "Up next" list. Recurring tasks (§15) and task metrics beyond completion counts (§17) are **not built**. |
| Goals (§18–19) | **Removed from the product by decision.** The data model and UI were built, then deleted. |
| Insights (§20–27) | Built: overall consistency chart with habit and range filters, this week, change vs last week, best streak, needs attention, leaderboard (day / week / month), top streaks. Mindset insights (§27) are **not built**. |
| Mindset tracking (§16) | **Removed from the product by decision.** |
| Board | **Added, not in the original spec.** Kanban board with To do / In progress / Done, drag and drop plus arrow buttons, notes on cards. |
| Settings (§28) | Account, billing, appearance, and data export / account deletion. |

### Habits
- Frequency: **every day**, **specific weekdays**, or **N times a week** (any of the chosen days). Weekly-period and monthly-period frequencies (§8) are **not built**.
- A habit can belong to a part of the day (morning, afternoon, evening) or be "anytime".
- The scheduling model is the simple one from Appendix B. Schedule versions and materialized obligations (§8, Appendix A) are **not built**; a habit's days and target apply to its whole history, and a habit's own start date (the day it was created, in the user's calendar) limits what counts toward stats.
- Deleting a habit hides it immediately and removes it for good after one day, so the delete can be undone.

### Streaks and freeze tokens (§12–13 as built)
- Streaks count consecutive scheduled days completed; today being unticked does not break a streak. "N times a week" habits count consecutive weeks that met the target and are shown in weeks.
- A finished week (Sunday to Saturday) with **80% or better** consistency earns one freeze token. At most **3** are held at once.
- A token is spent by freezing a missed day within the last **14 days**. A frozen day neither counts as done nor breaks the streak, and is left out of consistency. Completing the habit later, or unfreezing, gives the token back. "N times a week" habits cannot be frozen.
- The token balance is replayed from history rather than stored, so it cannot drift from the data.

### Theme (§5 as built)
The accent color, background color and text color are all user-chosen, each from presets or a color wheel, applied instantly and saved to the account. Surfaces, borders and muted text derive from the chosen background and text colors, and the interface warns when contrast is low. Habit colors can match the accent. Light backgrounds are supported. The separate light/dark/system modes in §5.1 are **not built**; the base theme is dark and the user adjusts colors directly.

### Account, billing and data
- Sign-up with email and password. Password-reset emails are sent through Resend from `noreply@aevia.live` (the link expires after an hour); email verification is off.
- **Billing:** $2 a month, paid through Stripe Checkout. A subscriber's price is locked in for as long as the subscription stays active; the price for new customers may change, and someone who cancels and resubscribes pays the then-current price. The dashboard is locked until the subscription is active (past-due stays open while Stripe retries). The Stripe billing portal handles card changes, invoices and cancellation. Payments are non-refundable (stated in the Terms, on the pricing card, on the subscribe page and on Stripe Checkout), except where the law requires otherwise. Individual accounts can be marked complimentary.
- **Consent:** creating an account requires agreeing to the Terms of Service and Privacy Policy. The server refuses sign-up without it and records the document, version (`lib/legal.ts`) and time for each. The records are part of the export and are deleted with the account.
- **Export:** a JSON download of everything stored about the user (§45); the CSV exports in §45 are **not built**.
- **Deletion:** the user can delete their account from Settings with their password. The Stripe subscription is cancelled first, then all data is removed (§44's staged workflow is simplified to a single confirmed step).
- **Undo:** an Undo message follows ticking a habit, completing or deleting a task, deleting a habit and deleting a board card.

### Not built yet
Recurring tasks, mindset tracking, weekly and monthly habit views, schedule versioning, CSV export, and a production deployment.

---

# PART 1 — Authoritative Specification


**Spec version: v4 — data-integrity and scheduling semantics hardened**

## 0. Purpose

Build an original productivity dashboard that recreates the **core functionality and overall information architecture** of Dashbit while using our **own branding, copy, components, visual details, and implementation**.

The product should preserve the parts that make the reference experience effective:

- a compact top navigation
- a focused five-page dashboard
- dense but readable cards
- strong charting and progress visualization
- fast daily check-ins
- habit streaks and freeze tokens
- weekly task planning
- lightweight goal tracking
- insights derived from user behavior

The dashboard should feel visually similar in **page composition and density**, but it must not be a pixel-for-pixel clone.

The biggest visual differentiator is that the entire accent system is **user-customizable**.

The supplied reference screenshots should be treated as the authoritative guide for **macro page layout**. Where this specification and an older rough layout description conflict, follow the detailed page layout contracts in Sections 7, 9, 14, 19, 20–23, and 48.

---

# 1. Product Principles

## 1.1 Core promise

A single place to:

- track habits
- plan weekly tasks
- maintain goals
- log daily mindset
- see progress and consistency over time

The product should turn very small amounts of input into rich feedback.

Example:

- user checks off habits
- user checks off tasks
- user logs energy/focus/motivation
- app automatically calculates streaks, consistency, trends, comparisons, and weak areas

The product should feel useful within seconds of opening it.

## 1.2 What this product is not

For v1, do **not** add:

- AI assistant
- chatbot
- calendar integrations
- finance tracking
- project management
- team collaboration
- social feed
- community features
- complex document systems
- note-taking
- file storage
- Google Calendar
- Plaid
- external automation
- broad "life OS" functionality

The product succeeds by being focused.

---

# 2. Recommended Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui where useful
- Framer Motion for micro-interactions
- Recharts for dashboard charts
- Lucide icons

## Authentication

Use **Better Auth**.

Initial auth methods:

- email + password
- email verification
- forgot password
- reset password

Optional after MVP:

- Google OAuth
- passkeys
- two-factor authentication

Use Better Auth's Next.js integration.

The authenticated application lives under:

```txt
/app
```

Auth routes live under:

```txt
/api/auth/[...all]
```

Use route protection appropriate for Next.js 16.

## Database

Use:

- Neon Postgres
- Drizzle ORM
- Drizzle Kit migrations
- Neon serverless driver

Recommended architecture:

```txt
Next.js
    ↓
Server Actions / Route Handlers
    ↓
Drizzle ORM
    ↓
Neon Postgres
```

Do not expose direct database access to the browser.

## Deployment

- Vercel
- Neon

---

# 3. Primary Navigation

The authenticated app has five main product pages:

```txt
Today
Habits
Tasks
Goals
Insights
```

There is also:

```txt
Settings
```

Desktop navigation should use a compact pill-style navigation component near the top center of the dashboard.

Example:

```txt
[ Today | Habits | Tasks | Goals | Insights ]
```

The current page uses the selected accent color.

Settings is accessed through a small icon button on the upper-right.

On mobile, use a bottom navigation bar or compact responsive equivalent.

---

# 4. Global Dashboard Layout

## Desktop shell

The reference screenshots establish the desired **page hierarchy and density**. Preserve that hierarchy closely while using original styling details.

Shared desktop shell:

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ PAGE TITLE                  [ Today Habits Tasks Goals Insights ]      ⚙     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              PAGE CONTENT                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Rules:

- page title stays upper-left
- primary navigation stays visually centered
- settings stays upper-right
- header height remains compact and consistent across all five pages
- primary content begins directly beneath the header with minimal wasted vertical space
- dashboard should use nearly the full desktop viewport width
- content should feel intentionally wide rather than constrained like a marketing site

Recommended desktop container:

```txt
width: min(100% - 32px, 1600px)
margin-inline: auto
```

On ultrawide displays, cap the content width so charts and grids remain readable.

## Navigation pill

Use a single rounded navigation container with five equal/near-equal items:

```txt
[ Today | Habits | Tasks | Goals | Insights ]
```

Each item contains:

- icon
- label
- active state

The active state uses the user's accent color. Inactive states remain subdued.

Do not use a conventional sidebar for desktop v1.

## Card system

Cards should use:

- large rounded corners
- very low-contrast borders
- dark elevated surfaces in dark mode
- restrained shadows
- dense information without visual clutter
- strong alignment
- consistent internal padding

Reference surface hierarchy:

```txt
page background
  ↓
primary panel
  ↓
nested card / data cell
  ↓
accent visualization
```

## Layout fidelity rule

The reference product may be used as the source of truth for **macro layout**, including:

- relative placement of major panels
- chart-to-card hierarchy
- wide desktop proportions
- number of columns
- information density
- order of sections

Do not copy exact:

- pixels
- typography
- component styling
- icon set
- spacing values
- copy
- branding

The goal is **structurally familiar, visually original**.

---

# 5. Customizable Theme System

This is a major product requirement.

Users can choose the accent color used throughout the dashboard.

## 5.1 Theme modes

Support:

- Dark
- Light
- System

Dark should be the strongest default experience.

## 5.2 Accent color

Provide preset accent colors such as:

- Cyan
- Emerald
- Blue
- Violet
- Pink
- Orange
- Red
- Lime

Also support a custom color picker.

Example:

```txt
Accent Color

○ Cyan
○ Emerald
○ Blue
● Violet
○ Pink
○ Orange

Custom: [ #8B5CF6 ]
```

## 5.3 Accent color must affect

The selected accent should automatically propagate to:

- active navigation state
- progress rings
- progress bars
- chart primary series
- completed habit indicators
- selected dates
- selected filters
- buttons
- badges
- streak indicators where appropriate
- hover focus states
- glowing chart highlights
- toggle controls

## 5.4 Theme implementation

Use CSS variables.

Example conceptual tokens:

```css
--background
--surface
--surface-elevated
--border
--text-primary
--text-secondary
--text-muted

--accent
--accent-hover
--accent-soft
--accent-border
--accent-glow
```

Do not hardcode turquoise/cyan into individual components.

Every accent-dependent component must consume theme tokens.

Store theme preferences per user.

---

# 6. Page 1 — Today

## Purpose

Today is the fastest interaction surface in the app.

A user should be able to open the app, complete today's habits, see progress, and leave within approximately 30 seconds.

## Main layout

```txt
TODAY

                 78%
                TODAY

          TUESDAY 30 SEPTEMBER
             7 / 9 completed

          3 freeze tokens available


┌──────────────────────┐    ┌──────────────────────┐
│ ✓ Wake up early   🔥3 │    │ ✓ Meditation     🔥1 │
└──────────────────────┘    └──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│ ✓ Gym             🔥3 │    │ ✓ Read           🔥2 │
└──────────────────────┘    └──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│ ○ Plan tomorrow   🔥0 │    │ ○ Journal        🔥0 │
└──────────────────────┘    └──────────────────────┘
```

## Required functionality

- show current date
- show habits due today
- show number completed
- show completion percentage
- mark habit completed
- undo completion
- show current streak
- show remaining freeze tokens
- update completion ring instantly
- optimistic UI where safe
- persist changes immediately

## Habit state

Possible states:

```txt
pending
completed
frozen
missed
not_scheduled
```

Today only displays habits scheduled for today.

## Completion ring

Example:

```txt
7 / 9 = 77.78%
```

Render as:

```txt
78%
TODAY
```

Round only for display.

---

# 7. Page 2 — Habits

## Purpose

Habits is the visual center of the product. It should feel like a high-density behavioral dashboard, not a list of habit cards.

## Exact desktop page composition

Use this hierarchy:

```txt
HABITS                         [ centered global nav ]                    ⚙

┌─────────────────────────────────────────────────────────────────────────────┐
│ SEPTEMBER 2026                                               ◀        ▶    │
│ 7/9 habits done today                                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ accent progress line ━━━━━━━━━━━━━━━━━━━━━━━━━   │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐  ┌──────┐
│       DAILY              WEEKLY              MONTHLY              │  │ + New│
└──────────────────────────────────────────────────────────────────┘  └──────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TREND          [ line/area trend chart across current period ]       AVG   │
├──────────────┬───────────────────────────────────────────────────┬──────────┤
│ HABIT        │ 1  2  3  4  5 ... 15 ... 30                     │ STATS    │
├──────────────┼───────────────────────────────────────────────────┼──────────┤
│ Wake Early   │ ●  ●  ○  ●  ...                                  │ 80% ...  │
│ Meditation   │ ○  ●  ●  ○  ...                                  │ 67% ...  │
│ Gym          │ ●  ○  ●  ●  ...                                  │ 80% ...  │
│ ...          │                                                   │          │
└──────────────┴───────────────────────────────────────────────────┴──────────┘
```

## Top month summary panel

Show:

- month + year
- today's completed / due count
- previous/next period buttons at far right
- thin accent progress rule across the bottom of the panel

The progress rule represents today's completion ratio.

## View switcher row

Use one broad segmented control:

```txt
DAILY | WEEKLY | MONTHLY
```

Place the primary `+ New Habit` action to its right on desktop.

The selected segment should feel prominent and fill with the user's accent color or accent-tinted surface.

---

# 8. Habit Creation


Each habit includes:

```txt
Name
Description optional
Icon optional
Color
Frequency
Start date
Optional end date
Status
```

## Frequency types

Support:

### Daily

```txt
Every day
```

### Specific weekdays

Example:

```txt
Mon
Wed
Fri
```

### Times per week

Example:

```txt
3 times per week
```

### Weekly

Example:

```txt
1 time per week
```

### Monthly

Example:

```txt
4 times per month
```

The habit engine must distinguish between:

- calendar/date-based obligations
- count-based period targets

## Historical schedule integrity — required

**Never recalculate historical habit obligations from the habit's current schedule.**

A habit's schedule is versioned with effective dates. Every schedule change creates a new immutable schedule version instead of overwriting the prior version.

Example:

```txt
Habit: Gym

Version 1
effective 01 Sep → 20 Sep
Daily

Version 2
effective 21 Sep → open-ended
Mon / Wed / Fri
```

Historical analytics for 01–20 Sep must continue to use Version 1 forever.

The application must also materialize scoring units called **habit obligations**. These are the canonical historical source for:

- scheduled occurrences
- missed occurrences
- consistency
- streaks
- freeze usage
- needs-attention calculations
- charts

There are two obligation types:

```txt
DATE
PERIOD
```

### DATE obligation

Used for:

- daily habits
- specific-weekday habits

Example:

```txt
Gym — 2026-09-14 — target 1
```

### PERIOD obligation

Used for count-based schedules such as:

```txt
Gym — 3 times per week
Read — 4 times per month
```

Example:

```txt
Gym
period: 2026-09-14 → 2026-09-20
target_count: 3
```

Check-ins contribute toward the obligation covering their logical local date.

## Schedule edit behavior

Schedule edits are versioned and may never reinterpret an already-started count-based scoring period.

### Date-based schedules

For `daily` and `weekdays` habits, a schedule change may become effective on a logical local date.

Default:

```txt
Today, in the schedule version's timezone
```

If today's DATE obligation already has a check-in or has entered finalization/freeze processing, require:

```txt
Apply starting tomorrow
```

When the edit becomes effective:

1. close the current schedule version the day before the new version's `effective_from`;
2. create the replacement immutable version;
3. preserve past/finalized obligations unchanged;
4. delete/regenerate only future, unfinalized DATE obligations at or after the effective date;
5. generate obligations from the replacement version.

### Count-based schedules — boundary-only edits in MVP

For `weekly_count` and `monthly_count`, **do not support same-period frequency/target changes in MVP**.

Default effective date:

```txt
weekly_count  → first day after the current weekly period ends
monthly_count → first day of the next calendar month
```

The UI must explicitly tell the user:

```txt
This change will apply next week.
```

or:

```txt
This change will apply next month.
```

The existing PERIOD obligation remains owned entirely by the old schedule version and is allowed to finish normally. No PERIOD obligation may span two schedule versions.

At the boundary:

1. close the old schedule version at its period end;
2. create the new schedule version at the next period start;
3. preserve the old PERIOD obligation unchanged;
4. generate the next PERIOD obligation from the new version.

Same-period obligation splitting is intentionally out of scope for MVP.

### Lifecycle changes are different from schedule edits

Pause/archive/end actions may still take effect mid-period. If one of those lifecycle actions truncates an **open** count-based PERIOD obligation:

- shorten that obligation to the final active local date;
- recompute and persist its prorated target using the partial-period rule;
- recompute its exact deadline timestamp;
- never modify a finalized obligation;
- never move existing check-ins to another schedule version.

## Count-based check-in semantics — MVP contract

For count-based habits:

- one check-in equals one completed occurrence;
- a user may record **at most one check-in per habit per local calendar date**;
- multiple same-day completions are not supported in MVP;
- extra completions above the period target are stored but do not carry into the next period;
- period completion is capped at 100% for consistency calculations;
- overachievement may be displayed separately but never increases the next period's progress.

This means:

```txt
Target: Gym 3x/week
Mon ✓
Wed ✓
Fri ✓
Sat ✓

Period result: 4 completions / target 3
Consistency contribution: 100%
Carryover to next week: 0
```

## Partial first/final periods

If a count-based habit begins or ends partway through a weekly/monthly period, prorate the target deterministically:

```txt
prorated_target = ceil(base_target × active_days / total_days_in_period)
```

Then clamp it to:

```txt
minimum 1
maximum base_target
maximum active_days
```

Example:

```txt
3x/week habit starts Friday
3 active days remain in a 7-day week
ceil(3 × 3 / 7) = 2
first-period target = 2
```

The same proration rule applies when a pause, archive, explicit end date, or similar lifecycle action ends a count-based schedule partway through a period. Normal count-based frequency/target edits do not use proration because they take effect only at the next period boundary in MVP.

## Habit actions

Allow:

- create
- edit
- pause
- resume
- archive
- restore
- permanently delete through an explicit destructive flow

Prefer archive over destructive deletion.

## Pause semantics

Pausing is effective on a logical local date.

Default:

```txt
pause effective today
```

Rules:

- obligations before the pause date remain historical truth;
- no new obligations are scheduled during the paused interval;
- a pause never converts missed obligations into completed ones;
- if a pause starts partway through a count-based period, that final active period is prorated using the partial-period rule;
- resuming creates a new schedule version effective on the resume date;
- paused dates are excluded from the scheduled denominator.

## Archive semantics

Archiving behaves like an indefinite pause plus hiding the habit from active UI.

Rules:

- archived habits remain visible in historical analytics for periods in which they were active;
- archiving does not erase check-ins, obligations, streak history, or freeze records;
- no new obligations are generated while archived;
- restoring does **not** backfill obligations for the archived interval;
- restoring creates a new active schedule version from the restore date forward.

## Permanent deletion semantics

Permanent deletion is intentionally harder to access than archive.

When permanently deleting a habit:

- delete the habit's schedule versions, obligations, and check-ins;
- historical analytics are recalculated without that habit;
- preserve the account-level freeze ledger for audit/balance integrity;
- any freeze transaction that referenced the deleted habit keeps its amount/type/reason, while `habit_id` becomes null (`ON DELETE SET NULL`);
- require explicit confirmation explaining that historical charts may change.

---

# 9. Habit Daily Grid

The daily view should closely preserve the reference page's macro composition.

## Single integrated analytics panel

The trend chart and grid should live inside **one large framed panel**, not separate unrelated cards.

Structure:

```txt
┌──────────────────────────────────────────────────────────────────────────┐
│ • TREND      ──●──●──●──●──●──●──────────────                  AVG 74% │
├────────────┬───────────────────────────────────────────────┬─────────────┤
│ HABIT      │ 1   2   3   4   5   ...   30                │ STATS       │
├────────────┼───────────────────────────────────────────────┼─────────────┤
│ • Wake     │ ✓   ✓   ○   ✓   ...                          │ 80% 🔥3 ★6 │
│ • Meditate │ ○   ✓   ✓   ○   ...                          │ 67% 🔥1 ★3 │
│ • Gym      │ ✓   ○   ✓   ✓   ...                          │ 80% 🔥3 ★7 │
└────────────┴───────────────────────────────────────────────┴─────────────┘
```

## Left habit column

Keep the habit-name column visually stable and easy to scan.

Each row contains:

- small habit color marker
- habit name
- optional icon

On horizontally scrollable layouts, keep this column sticky when practical.

## Day grid

Each scheduled date uses a circular state control.

Visual states:

```txt
completed      = filled accent circle + check
pending        = outlined neutral circle
frozen         = distinct freeze icon/state
not scheduled  = muted/empty/non-interactive state
today          = subtle accent glow or column highlight
future         = visible but disabled where relevant
```

The glow around today's completed cells may use `--accent-glow`.

Do not make glow excessive.

## Right stats column

Preserve a narrow stats column on the right. Show at minimum:

- consistency percentage
- current streak
- best streak

Use iconography that differs from the reference implementation while preserving the same informational role.

## Trend visualization

The trend chart occupies the full width above the day columns and aligns horizontally with the dates below.

Display:

- overall completion trend
- average badge/value on the right
- today's marker when in range

The primary line/fill uses the current accent color.

---

# 10. Habit Weekly View

Aggregate habit performance by week.

Example:

```txt
Week 1   82%
Week 2   76%
Week 3   91%
Week 4   84%
```

Show:

- completion %
- target completion
- trend
- streak context

This should answer:

> How consistent have I been week-to-week?

---

# 11. Habit Monthly View

Monthly mode should emphasize longer-term consistency.

Possible layout:

```txt
Jan  72%
Feb  81%
Mar  76%
Apr  88%
May  91%
```

Support month and year filters.

---

# 12. Streak System


Streaks are calculated from immutable **habit obligations**, never from the habit's current schedule.

## Date-based habits

For daily/specific-weekday habits, one scheduled DATE obligation represents one streak opportunity.

Example:

A Mon/Wed/Fri habit should not lose a streak on Tuesday because Tuesday has no obligation.

A streak increments when the DATE obligation ends as:

```txt
completed
```

A frozen obligation preserves the existing streak but does not increment it.

A missed obligation breaks the streak once its freeze grace window closes.

## Count-based habits

For habits such as:

```txt
Gym 3x/week
```

one PERIOD obligation represents one streak opportunity.

The streak represents consecutive successful target periods, not consecutive calendar days.

Example:

```txt
Week 1: target 3, completed 3 → streak 1
Week 2: target 3, completed 4 → streak 2
Week 3: target 3, completed 2 → missed/freeze decision
```

### When a count-based period becomes successful

A count-based PERIOD obligation is **never finalized early** in MVP.

While the period is open:

```txt
completed_count >= target_count
```

means the UI may display:

```txt
Target met
```

but the obligation remains `open` until its persisted `deadline_at` is reached. This avoids schedule-version conflicts, preserves the ability to correct check-ins during the active period, and keeps overachievement history accurate.

At the period deadline:

- target met → finalize as `completed`;
- target unmet → enter `missed_pending_freeze` and begin the persisted freeze grace window.

No finalized PERIOD obligation may later have its period boundaries or target changed.

### Extra check-ins

Extra check-ins after the target is met are allowed and remain part of history, but:

- completion percentage is capped at 100%;
- no extra streak credit is awarded;
- no carryover occurs.

## Best streak

Track the highest historical run of streak-preserving obligations.

Definitions:

- `completed` obligation → increments streak
- `frozen` obligation → preserves streak without incrementing it
- `missed` obligation → resets streak
- `excluded` obligation → ignored entirely

## Current/open period display

An unfinished current weekly/monthly period does not break a streak before its deadline.

Display its state as one of:

```txt
On track
Target met
At risk
```

Do not report it as missed while the period is still open.

## Check-in edit and late-entry policy — MVP

Check-ins are editable only while their obligation is still mutable.

### DATE obligations

- While the logical day is still open, the user may add or remove that day's check-in.
- At the local day deadline, a DATE obligation with a check-in finalizes as `completed` and locks.
- If no check-in exists, it enters `missed_pending_freeze`.
- During the persisted freeze grace window, the user may add the missing check-in; doing so resolves the obligation as `completed` without spending a freeze token.
- Once the grace window expires and the obligation becomes `frozen` or `missed`, no check-in may be added, removed, or changed in MVP.

### PERIOD obligations

- Check-ins whose logical dates fall inside the currently open period may be added or removed until the period deadline.
- If the target is unmet at the period deadline, the obligation enters `missed_pending_freeze`.
- During the freeze grace window, the user may add legitimate backdated check-ins for dates inside that period, subject to the one-check-in-per-habit-per-local-day rule.
- If those late check-ins bring the period to target before `grace_expires_at`, finalize as `completed` and do not spend a token.
- After `grace_expires_at`, a `frozen` or `missed` period is locked.

### Locked history

For MVP, finalized `completed`, `frozen`, and `missed` obligations are immutable through ordinary UI mutations.

Do not silently recalculate rewards, freeze ledger entries, or old streaks after a locked obligation. A future administrative/history-correction feature may implement explicit ledger reconciliation, but that is out of scope for MVP.

---

# 13. Freeze Tokens


Freeze tokens preserve an existing streak when a scheduled obligation is not completed.

## Wallet rules

MVP rules:

```txt
Starting balance: 1 token
Maximum balance: 3 tokens
```

## Deterministic earning rule

Replace the earlier ambiguous "7 consecutive successful habit-days" idea with this rule:

> At the end of each completed user-local week, award **1 freeze token** when the user's habit consistency for that week is at least **80%**, there were at least **3 scheduled habit obligations** contributing to that week, and the wallet is below the maximum balance.

Rules:

- award at most one token per completed local week;
- do not award if there was insufficient habit data;
- frozen obligations do not count as completed for the 80% threshold;
- the token award is recorded exactly once using a unique earning key containing the persisted reward period boundaries, e.g. `weekly:2026-09-21:2026-09-27`;
- earning logic must be idempotent.

This threshold belongs in configuration so it can be changed later.

## Freeze deadline contract

Every obligation that can enter freeze handling must persist an exact `grace_expires_at timestamptz` when it first becomes `missed_pending_freeze`.

Freeze behavior is also snapshotted at that moment. Persist:

```txt
freeze_mode_at_miss = manual | automatic
```

Rules:

- calculate the obligation's local deadline using the schedule version's timezone and persisted period boundaries;
- persist `deadline_at timestamptz` on the obligation when it is materialized;
- when a miss is detected, set `grace_expires_at = deadline_at + interval '24 hours'`;
- when the obligation first enters `missed_pending_freeze`, copy the user's current `freeze_mode` into `freeze_mode_at_miss`;
- set `freeze_mode_at_miss` exactly once and never rewrite it;
- changing the user's global `freeze_mode` affects only obligations that enter a grace window afterward;
- an obligation already inside a grace window continues using its snapshotted mode;
- never recompute an existing grace deadline from the user's current timezone, current preferences, or deployment clock;
- retries and scheduled jobs read the persisted timestamp;
- changing timezone or week-start preference never changes an existing obligation's deadline or grace expiry.

The 24-hour grace duration is an absolute elapsed duration after the persisted deadline, which keeps behavior deterministic across DST changes.

## Freeze modes

Support two user preferences:

```txt
Manual (default)
Automatic
```

### Manual mode

When an obligation closes unmet with `freeze_mode_at_miss = manual`:

1. mark it `missed_pending_freeze`;
2. start a **24-hour grace window** measured from the local end of the obligation period;
3. allow the user to spend one freeze token during that window;
4. if used, change the obligation to `frozen` and preserve the streak;
5. if not used by the end of the grace window, finalize it as `missed` and break the streak.

During the grace period, UI should show:

```txt
Streak at risk
Use 1 freeze?
```

Do not silently show a final broken streak before the grace period ends.

### Automatic mode

When an obligation closes unmet with `freeze_mode_at_miss = automatic`:

1. mark it `missed_pending_freeze`;
2. preserve the same 24-hour grace window used by manual mode;
3. allow a legitimate late check-in to resolve the obligation before a token is spent;
4. at `grace_expires_at`, if the obligation is still unmet and balance > 0, consume exactly one token and finalize as `frozen`;
5. if balance = 0, finalize as `missed`.

Automatic mode therefore automates the decision **at grace expiry**, not at the initial miss deadline.

Example:

```txt
Global setting when Monday is missed: manual
Monday obligation freeze_mode_at_miss: manual

User changes global setting Tuesday morning: automatic

Monday obligation remains manual.
Future missed obligations snapshot automatic.
```

## Date-based habits

One freeze covers one missed DATE obligation.

## Count-based habits

One freeze covers one failed PERIOD obligation, regardless of whether the target was missed by one or several check-ins.

Example:

```txt
Gym 3x/week
completed 2/3
→ one freeze preserves the weekly streak
```

A freeze does not fabricate the missing completion. The period remains analytically incomplete.

## Analytics treatment

Frozen obligations:

- preserve streak continuity;
- do not enter the completion numerator;
- do remain in the scheduled denominator;
- should be visually distinct from both completed and missed obligations.

## Freeze transaction integrity

Every balance change creates a ledger transaction.

Never modify balance without a corresponding transaction.

Use idempotency keys for:

- weekly earnings
- automatic freeze use
- manual freeze use

This prevents duplicate awards/charges during retries.

---

# 14. Page 3 — Tasks

## Purpose

Tasks is a weekly planning surface rather than a full project-management tool. The desktop layout should remain visually ambitious and chart-heavy.

## Exact desktop page composition

Use two large panels across the top, followed by a seven-column weekly board.

```txt
TASK TRACKER                 [ centered global nav ]                     ⚙

┌───────────────────────────────────┐ ┌──────────────────────────────────────┐
│ WEEK STARTING                     │ │ MINDSET TRACKER                      │
│ [06 Sep – 12 Sep 2026]   ◀ Week ▶ │ │ Energy • Focus • Motivation          │
│                                   │ │                                      │
│        OVERALL PROGRESS           │ │        multi-line weekly chart       │
│  ▅   █   ▃   ▅   ▆   ▏   ▏       │ │                                      │
│  Su  Mo  Tu  We  Th  Fr  Sa  77% │ │                                      │
└───────────────────────────────────┘ └──────────────────────────────────────┘

┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Sunday  │ Monday  │ Tuesday │Wednesday│Thursday │ Friday  │Saturday │
│  67%    │  100%   │  50%    │  67%    │  100%   │   —     │   —     │
│  ring   │  ring   │  ring   │  ring   │  ring   │  ring   │  ring   │
│ tasks   │ tasks   │ tasks   │ tasks   │ tasks   │ tasks   │ tasks   │
│ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │ + Add   │
│ mindset │ mindset │ mindset │ mindset │ mindset │ mindset │ mindset │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

## Top-left weekly progress panel

Include:

- week range chip/label
- previous week button
- `This week` control
- next week button
- seven compact daily completion bars
- overall weekly progress ring
- `completed / total` count

Approximate desktop width allocation:

```txt
weekly progress: 47–49%
mindset chart:   51–53%
```

## Top-right mindset panel

Use one large multi-series line chart for:

- Energy
- Focus
- Motivation

Show a compact legend in the upper-left of the card.

## Seven-column board

Desktop must show all seven days simultaneously when viewport width allows.

Each day column contains:

1. weekday
2. date
3. circular completion ring
4. `TASKS` label
5. task cards
6. `+ Add task`
7. optional `Copy yesterday's list` action
8. collapsed/compact mindset area
9. completed/not-completed counts

The selected/current day receives a subtle accent border/background treatment.

Completed task text may use a line-through and reduced contrast.

---

# 15. Recurring Tasks


Recurring tasks require a recurrence-series model plus materialized occurrences/exceptions. Do not represent recurrence solely with a string on a normal task row.

## Task model terminology

Use:

```txt
task_series       = recurrence definition/template
task_occurrence   = one logical dated task instance
```

A one-off task is simply a `task_occurrence` with no `series_id`.

## MVP recurrence options

```txt
None
Daily
Weekdays
Weekly
Specific weekdays
Monthly
```

## Series fields

A recurrence series stores:

```txt
title
description
priority
recurrence_type
interval
weekdays optional
month_day optional
start_date
end_date optional
timezone
monthly_overflow_policy
created_at
updated_at
```

## Materialization strategy

Do not pre-create an unlimited future.

Materialize occurrences:

- lazily when a requested date range is loaded; and/or
- in a small rolling horizon, e.g. the next 60 days.

Once an occurrence is materialized and falls in the past, treat it as historical truth.

## Occurrence state

Each occurrence has:

```txt
pending
completed
skipped
```

Also store:

```txt
original_date
scheduled_date
is_exception
completed_at
```

`original_date` preserves where the recurrence engine originally placed it.

`scheduled_date` may change when the user moves only that occurrence.

## Editing recurrence

When editing a recurring task, explicitly ask for scope when relevant:

```txt
This occurrence only
This and future occurrences
```

Rules:

### This occurrence only

Create/update an exception on that occurrence only.

Allowed changes include:

- title
- description
- priority
- scheduled date
- skip

### This and future occurrences

Do not rewrite recurrence history.

Instead:

1. end the old series the day before the selected occurrence's original date;
2. create a new series effective from that selected occurrence onward;
3. preserve historical occurrences from the old series;
4. regenerate only future pending occurrences.

For recurrence-pattern changes, use **This and future** rather than mutating the whole historical series.

Cosmetic template fields may optionally offer `Entire series`, but this must not reinterpret past dates or completion history.

## Moving one occurrence

If a recurring task scheduled for Tuesday is moved to Thursday:

- retain `original_date = Tuesday`;
- set `scheduled_date = Thursday`;
- mark the occurrence `is_exception = true`;
- do not generate a duplicate Tuesday occurrence.

## Skipping

Skipping a recurring occurrence:

- marks that occurrence `skipped`;
- does not count as completed;
- does not count in task completion denominator for productivity metrics unless the product later explicitly chooses otherwise;
- prevents regeneration of the same occurrence.

## Monthly overflow rule

For monthly recurrence on days 29–31, MVP uses:

```txt
monthly_overflow_policy = last_day
```

Examples:

```txt
31 Jan → 28 Feb (or 29 in leap year)
31 Mar → 30 Apr
```

Do not silently skip short months.

## Timezone rule for recurrence

A recurrence series stores the IANA timezone in effect when the series is created.

Date-only recurrence is resolved as local logical dates in that timezone.

Changing the account timezone later does not rewrite historical occurrence dates.

When a user changes timezone, existing recurring series continue using their stored timezone unless the product explicitly offers a future-series migration flow.

---

# 16. Mindset Tracking

Users can log three daily values:

```txt
Energy
Focus
Motivation
```

Use an integer scale:

```txt
1–5
```

Only one mindset entry exists per user per date.

Users can edit today's value and historical values.

## Task page chart

Display weekly lines for:

```txt
Energy
Focus
Motivation
```

These lines may use secondary semantic colors instead of the global accent where necessary for readability.

The primary dashboard accent remains user-configurable.

---

# 17. Task Completion Metrics

Daily task completion:

```txt
completed tasks / tasks scheduled
```

Weekly task completion:

```txt
completed scheduled tasks / total scheduled tasks
```

If no tasks exist for a day:

```txt
completion percentage = null
```

Do not display a misleading 0%.

---

# 18. Page 4 — Goals

## Purpose

Goals should remain intentionally lightweight.

Do not turn them into projects.

## Areas of Life

Seed default areas:

```txt
Health & Fitness
Career Growth
Finances & Wealth
Relationships
Romance & Love
Spirituality
Home
Adventure & Travel
Fun & Hobbies
Community
```

Users may:

- rename default areas
- hide areas
- create custom areas
- choose area color/icon

## Goal fields

```txt
title
description optional
lifeAreaId
status
priority
progress
startDate optional
targetDate optional
position
createdAt
updatedAt
```

## Status

```txt
Not Started
In Progress
Completed
Paused
```

## Progress

MVP:

```txt
0–100%
```

manual adjustment.

Later, goals may optionally derive progress from connected habits.

Do not build linked-goal automation in the first milestone.

---

# 19. Goal Page Layout

Preserve the reference page's vertical hierarchy.

## Exact desktop composition

```txt
GOALS                       [ centered global nav ]                      ⚙

┌───────────────────────────────────────────────────────────────────────────┐
│  [progress ring 1/3]    GOALS ACHIEVED                                   │
│                         Mastering 10 areas                                │
└───────────────────────────────────────────────────────────────────────────┘

AREAS OF LIFE
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Health     │ │ Career     │ │ Finance    │ │Relations   │ │ Romance    │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│Spirituality│ │ Home       │ │ Travel     │ │ Hobbies    │ │ Community  │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘

TOP PRIORITIES
┌───────────────────────────────────────────────────────────────────────────┐
│ Goal title                                                           pin │
│ [IN PROGRESS]                                                            │
│ AREA                                                                     │
│ 90 days left                                                             │
│ ███████████████████░░░░░░░░░░                                           │
└───────────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ Another priority goal ...                                                │
└───────────────────────────────────────────────────────────────────────────┘

ALL GOALS
...
```

## Summary panel

Use one full-width, relatively shallow panel. The progress ring sits on the left and summary text sits beside it.

## Areas of Life grid

On large desktop, target a 5-column x 2-row grid for the ten default life areas.

Each life-area card shows:

- icon
- area name
- number of goals
- number achieved

Keep these cards compact; they are filters/entry points, not feature panels.

## Priority goal cards

Priority cards span almost the full content width and remain vertically compact.

Each shows:

- goal title
- status chip
- life area
- days remaining when target date exists
- full-width progress bar near the bottom
- pin/unpin control on the upper-right

Below:

```txt
ALL GOALS
```

Allow filters by:

- area
- status
- priority

---

# 20. Page 5 — Insights


Insights should make simple tracking data feel valuable. The page should feel like a polished analytics dashboard rather than a report.

## Exact desktop page composition

```txt
INSIGHTS                    [ centered global nav ]                      ⚙

┌───────────────────────────────────────────────────────────────────────────┐
│ OVERALL CONSISTENCY                                  [Overall▼][30 days▼] │
│ 74%                                                                       │
│                                                                           │
│                 large accent area/line chart                              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ THIS WEEK      │ │ VS LAST WEEK   │ │ BEST STREAK    │ │ NEEDS ATTENTION│
│ 78%            │ │ +5 pts         │ │ 14 days        │ │ Meditation     │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘

┌──────────────────────────────────┐ ┌──────────────────────────────────────┐
│ HABIT LEADERBOARD                │ │ TOP STREAKS                          │
│ [D] [W] [M]                      │ │                                      │
│ Wake Early   █████████ 80%       │ │ No Social Media  ███████      4d     │
│ Gym          █████████ 80%       │ │ Wake Early       █████        3d     │
│ Journal      █████████ 80%       │ │ Gym              █████        3d     │
└──────────────────────────────────┘ └──────────────────────────────────────┘
```

## Main consistency chart

The first panel should dominate the page visually.

Include:

- metric label upper-left
- large percentage directly beneath it
- scope filter upper-right
- time-range filter upper-right
- large smooth line/area visualization occupying most of the panel
- hover tooltip
- highlighted selected point and guide line
- date labels along the bottom

### MVP scope filters

```txt
Overall
Habits
Tasks
```

**Do not include Goals in the consistency chart for MVP.**

Goal progress is manually editable and the current MVP does not define expected progress velocity or daily goal obligations. Treating that as "consistency" would be misleading.

A future Goals analytics mode may be added only after goal progress history/expected-progress semantics are explicitly defined.

### Time ranges

```txt
7 days
30 days
90 days
6 months
1 year
All time
```

Use an area/line chart. The line and fill gradient derive from the user's accent color.

---

# 21. Insight Summary Cards

Immediately under the main chart, render **four equal-width cards in one desktop row**:

```txt
THIS WEEK | VS LAST WEEK | BEST STREAK | NEEDS ATTENTION
```

Each card should be shallow, centered, and visually quieter than the main chart.

Cards should update according to active filter where sensible.

---

# 22. Habit Leaderboard

The lower-left Insights panel is the personal habit leaderboard.

Rank active habits by consistency.

Example:

```txt
Wake Early     ██████████  90%
Gym            █████████   84%
Reading        ████████    79%
Meditation     ██████      61%
```

Provide a compact period switcher in the panel header:

```txt
D | W | M
```

Each row contains:

- rank/medal-like marker
- habit name
- horizontal progress bar
- completion percentage

Use the accent color for the primary progress bar.

This leaderboard is personal, not social.

---

# 23. Top Streaks

The lower-right Insights panel lists top streaks with a visual horizontal magnitude indicator.

Example:

```txt
No Social Media    ████████    28d
Reading            █████       16d
Gym                ███          9d
```

Each row contains:

- rank marker/icon
- habit name
- compact bar
- duration aligned right

Allow current and historical best streaks.

---

# 24. Needs Attention

Determine the habit with the lowest recent consistency among habits that have sufficient scheduled opportunities.

Do not classify a newly created habit with one data point as "needs attention."

Suggested threshold:

```txt
at least 5 scheduled opportunities
```

Default recent period:

```txt
last 30 days
```

---

# 25. Consistency Calculations


All habit analytics must use materialized `habit_obligations` tied to immutable schedule versions.

Never reconstruct the denominator from `habits.frequency_type` as it exists today.

## Habit consistency

### DATE obligations

For a date range:

```txt
completed DATE obligations
/
all scheduled DATE obligations
```

### PERIOD obligations

For each weekly/monthly count period:

```txt
period_ratio = min(completed_count, target_count) / target_count
```

Aggregate by summing completed-equivalent units and target units across obligations.

Equivalent formulation:

```txt
sum(min(completed_count, target_count))
/
sum(target_count)
```

Frozen obligations do not count as completed.

Paused/archived dates with no obligation do not enter the denominator.

Partial periods use the prorated target stored on the obligation when the obligation is materialized or legitimately truncated while still open.

## Analytics range-boundary rule

Use one deterministic rule for PERIOD obligations in filtered analytics:

> A PERIOD obligation belongs to the analytics bucket/range containing its `period_end` logical date.

Therefore:

- a weekly/monthly PERIOD obligation is included in a requested range only when `period_end` falls inside that range;
- it is never fractionally split across arbitrary analytics filter boundaries;
- an open PERIOD obligation whose `period_end` is in the future is excluded from finalized consistency metrics;
- DATE obligations are included by their single logical date (`period_start = period_end`).

Example:

```txt
Monthly obligation: 01 Sep → 30 Sep
Filter: last 7 days = 24 Sep → 30 Sep
Result: include the obligation because period_end = 30 Sep
```

For a daily time-series chart, a finalized PERIOD obligation emits its period ratio on `period_end`. It contributes no denominator on earlier days in that period. Weekly/monthly chart granularities also bucket PERIOD obligations by `period_end`.

This rule keeps range math deterministic and avoids pretending that a count-based period target was evenly distributed across each day.

## Task completion

For a date range:

```txt
completed task occurrences
/
(completed + pending + missed/uncompleted due task occurrences)
```

Explicitly skipped recurring occurrences are excluded from the denominator.

Future occurrences are excluded.

## Overall consistency

Initial MVP formula:

```txt
Habit consistency = 70% weight
Task completion   = 30% weight
```

Only include dimensions with available data.

Example:

If user has habits but no task occurrences in the range:

```txt
Overall = Habit consistency
```

If user has tasks but no habit obligations:

```txt
Overall = Task completion
```

Do not penalize users for modules they do not use.

## Goals

Goals are **not** part of MVP overall consistency and do not have an Insights consistency filter.

The Goals page may still show:

- current progress
- completion status
- target date
- top priorities

A future goal analytics system should first introduce explicit `goal_progress_events` or snapshots plus a definition of expected progress before placing goals into the consistency chart.

Store all formulas in a clearly isolated analytics service so they can be versioned later.

---

# 26. Week-over-Week

Calculate:

```txt
current week consistency
-
previous week consistency
```

Display percentage-point difference.

Example:

```txt
78% - 73% = +5 points
```

Avoid mathematically ambiguous reporting.

---

# 27. Mindset Insights

Insights should include a mindset chart when sufficient data exists.

Support:

```txt
Energy
Focus
Motivation
```

Potential later insights:

```txt
Your task completion is highest on high-focus days.
```

Do not build causal claims in v1.

If correlations are added later, phrase them as associations.

---

# 28. Settings

## Account

- name
- email
- password
- avatar optional
- logout
- delete account

## Appearance

- dark / light / system
- accent preset
- custom accent color
- reduced motion toggle

## Preferences

- timezone
- week starts Sunday/Monday
- date format
- 12/24 hour time

## Habits

- freeze behavior
- streak display
- archived habits

## Notifications

Eventually:

- daily reminder
- evening reminder
- task reminder
- habit reminder

## Data

- export data as JSON or a ZIP of per-dataset CSV files
- delete all productivity data
- delete account using the irreversible account-deletion flow in Section 44

---

# 29. Authentication UX

Use Better Auth.

## Pages

```txt
/login
/signup
/forgot-password
/reset-password
/verify-email
```

## Login

Fields:

```txt
Email
Password
```

Actions:

```txt
Sign in
Forgot password?
Create account
```

## Signup

Fields:

```txt
Name
Email
Password
Confirm password
```

Require explicit acceptance of the current Terms of Service and Privacy Policy.

At signup:

- display or link the exact document versions being accepted;
- persist one immutable consent record for Terms and one for Privacy;
- store the accepted document version and exact `timestamptz` acceptance time;
- never rely only on a boolean such as `accepted_terms = true`.

If either document is materially updated later, the product may require re-consent. Store a new consent row rather than overwriting historical acceptance.

## Session behavior

- secure session cookies
- protect `/app/**`
- redirect authenticated users away from login/signup
- redirect unauthenticated users to login
- restore intended destination after login where practical

---

# 30. Onboarding

After signup, show a very short onboarding process.

## Step 1 — Welcome

Explain:

```txt
Track the things you want to become consistent at.
```

## Step 2 — Choose accent

Let the user personalize the dashboard immediately.

## Step 3 — Create first habits

Suggest:

```txt
Exercise
Read
Meditate
Journal
Sleep on time
Drink water
```

Allow skip.

## Step 4 — Optional first goal

Allow skip.

## Step 5 — Dashboard

Open Today.

The onboarding must take less than ~2 minutes.

---

# 31. Database Model


Use Drizzle with Neon Postgres.

Better Auth manages its required authentication tables.

Application tables reference the authenticated Better Auth user ID.

## Persistence and timezone contract — required

Use these semantics consistently:

```txt
User timezone: IANA identifier, e.g. America/New_York
Logical tracking day: Postgres DATE
Audit/event timestamp: Postgres TIMESTAMPTZ
```

Rules:

- all day/week/month boundaries are calculated in the user's relevant IANA timezone;
- habit check-in dates are stored as logical local `date`, not UTC-midnight timestamps;
- task scheduled dates are logical local `date` values;
- audit fields such as `created_at`, `updated_at`, `completed_at`, and ledger timestamps use `timestamptz`;
- changing a user's timezone never rewrites past logical dates;
- immutable habit schedule versions snapshot the timezone used for that schedule version;
- weekly count-based schedule versions also snapshot `week_starts_on`;
- account-level week-boundary settings are effective-dated and never retroactively rewrite an already-started reward/scoring week;
- recurring task series store their own timezone;
- DST must not create duplicate or missing logical tracking dates;
- the server, not the browser alone, is authoritative for date-boundary calculations.

## User Preferences

```txt
user_preferences
- id
- user_id unique
- theme_mode
- accent_color
- week_starts_on
- timezone               -- IANA string
- date_format
- reduced_motion
- freeze_mode            -- manual | automatic
- onboarding_completed
- created_at timestamptz
- updated_at timestamptz
```

`user_preferences.week_starts_on` is the current UI preference. Historical week-boundary semantics are stored separately.

## User Week Settings Versions

Use an effective-dated history for week boundaries used by freeze rewards and newly created weekly schedules.

```txt
user_week_settings_versions
- id
- user_id
- effective_from date
- effective_to date nullable
- week_starts_on          -- sunday | monday
- timezone                -- IANA timezone snapshot
- created_at timestamptz
```

Rules:

- ranges for one user may not overlap;
- changing week start is not retroactive;
- a change becomes effective at the **next boundary of the currently active account week**;
- already-started account weeks keep their existing boundary definition;
- weekly freeze earning uses the version effective for that reward period;
- idempotency keys include the materialized reward period start/end, e.g. `weekly:2026-10-05:2026-10-11`;
- when the preference change takes effect, active `weekly_count` habits receive replacement schedule versions at that same boundary so their future weekly obligations use the new week start;
- existing/finalized obligations are never rebucketed.

## User Consents

Store auditable acceptance of legal documents independently from mutable account preferences.

```txt
user_consents
- id
- user_id
- document_type          -- terms | privacy
- document_version
- accepted_at timestamptz
- created_at timestamptz
```

Rules:

- signup creates one row for the accepted Terms version and one row for the accepted Privacy version;
- `document_version` identifies the exact published document, for example `2026-09-30`;
- historical consent rows are immutable;
- re-consent creates a new row rather than replacing an earlier row;
- enforce uniqueness for `user_id + document_type + document_version`.

## Habits

The `habits` table stores identity/presentation and current lifecycle state. It is **not** the historical source of schedule truth.

```txt
habits
- id
- user_id
- name
- description nullable
- icon nullable
- color nullable
- lifecycle_status       -- active | paused | archived
- position
- deleted_at nullable
- created_at timestamptz
- updated_at timestamptz
```

## Habit Schedule Versions

```txt
habit_schedule_versions
- id
- habit_id
- effective_from date
- effective_to date nullable
- frequency_type         -- daily | weekdays | weekly_count | monthly_count
- target_count nullable
- timezone               -- IANA timezone snapshot
- week_starts_on nullable -- sunday | monday; required for weekly_count, ignored otherwise
- created_at timestamptz
```

Constraints:

- schedule-version effective ranges for one habit must not overlap;
- once a version has historical/finalized obligations, do not mutate its scheduling fields;
- `weekly_count` versions must persist the `week_starts_on` value used to form their boundaries;
- changing the user's current week-start preference never mutates an existing schedule version;
- changes create a new version.

## Habit Schedule Days

Used only for schedule versions that require explicit weekdays.

```txt
habit_schedule_days
- id
- schedule_version_id
- weekday                 -- 0–6 or explicit enum; pick one convention and document it
```

Unique:

```txt
schedule_version_id + weekday
```

## Habit Obligations

Canonical scoring units for historical analytics.

```txt
habit_obligations
- id
- habit_id
- schedule_version_id
- obligation_type        -- date | period
- period_start date
- period_end date
- target_count
- state                  -- open | completed | missed_pending_freeze | frozen | missed | excluded
- deadline_at timestamptz
- grace_expires_at timestamptz nullable
- freeze_mode_at_miss    -- manual | automatic; null until first miss
- finalized_at timestamptz nullable
- created_at timestamptz
- updated_at timestamptz
```

For a DATE obligation:

```txt
period_start = period_end = obligation date
target_count = 1
```

For a weekly/monthly count habit:

```txt
period_start / period_end = local scoring period
target_count = materialized target, including any proration
```

`deadline_at` is the exact instant immediately after the obligation's final logical local date in the schedule version's timezone. Persist it at materialization time; do not repeatedly derive it later from current preferences.

`grace_expires_at` remains null while the obligation is open/completed. Set it exactly once when the obligation first enters `missed_pending_freeze`.

`freeze_mode_at_miss` remains null until the obligation first enters `missed_pending_freeze`. At that transition, snapshot the user's current freeze mode and never update it afterward. Grace-window resolution must use this stored value rather than the user's current preference.

Unique recommendation:

```txt
habit_id + schedule_version_id + period_start + period_end
```

## Obligation generation contract

Obligation materialization must not depend on a background job having run successfully.

Implement these idempotent domain operations:

```txt
ensureHabitObligationsForRange(habitId, startDate, endDate)
ensureObligationsThrough(userId, throughDate)
```

`ensureHabitObligationsForRange(...)`:

- reads immutable schedule versions overlapping the requested logical-date range;
- creates every missing DATE/PERIOD obligation deterministically;
- calculates and persists `target_count`, `period_start`, `period_end`, `deadline_at`, timezone snapshot semantics, and weekly boundary semantics;
- uses uniqueness constraints/upserts so retries cannot create duplicates;
- never mutates a finalized historical obligation.

`ensureObligationsThrough(...)` is a convenience wrapper that ensures obligations exist through the requested local date for all relevant habits.

Required call sites:

- immediately after a new schedule version is created;
- before recording a habit check-in if the covering obligation is missing;
- before finalizing due obligations;
- before serving analytics for a range that may contain unmaterialized historical obligations;
- opportunistically when the user opens Today/Habits.

If a user was inactive for months or a scheduled worker failed, the next relevant request must deterministically backfill missing obligations from immutable schedule versions before calculating analytics or streaks.

Finalization may never assume that missing obligations mean "nothing was scheduled."

## Habit Check-ins

```txt
habit_check_ins
- id
- habit_id
- obligation_id
- user_id
- date                    -- logical local date
- created_at timestamptz
- updated_at timestamptz
```

One check-in equals one real completion.

Unique:

```txt
habit_id + date
```

A freeze is **not** a check-in.

## Freeze Wallets

```txt
freeze_wallets
- id
- user_id unique
- balance
- updated_at timestamptz
```

Enforce:

```txt
0 <= balance <= configured maximum
```

## Freeze Transactions

```txt
freeze_transactions
- id
- user_id
- habit_id nullable       -- ON DELETE SET NULL
- obligation_id nullable -- ON DELETE SET NULL
- amount                  -- +1 earned, -1 used
- type                    -- earned | used | admin_adjustment
- reason
- idempotency_key unique
- created_at timestamptz
```

Balance must equal the ledger result, or be transactionally maintained from it.

## Task Series

Recurring template/definition.

```txt
task_series
- id
- user_id
- title
- description nullable
- priority nullable
- recurrence_type
- interval
- start_date date
- end_date date nullable
- timezone
- month_day nullable
- monthly_overflow_policy nullable
- created_at timestamptz
- updated_at timestamptz
```

## Task Series Weekdays

```txt
task_series_weekdays
- id
- series_id
- weekday
```

Unique:

```txt
series_id + weekday
```

## Task Occurrences

Used for both one-off tasks and materialized recurring instances.

```txt
task_occurrences
- id
- user_id
- series_id nullable
- title
- description nullable
- priority nullable
- original_date date
- scheduled_date date
- status                  -- pending | completed | skipped
- position
- is_exception
- completed_at timestamptz nullable
- created_at timestamptz
- updated_at timestamptz
```

For one-off tasks:

```txt
series_id = null
original_date = scheduled_date
```

Recommended uniqueness for recurring instances:

```txt
series_id + original_date
```

## Mindset Check-ins

```txt
mindset_check_ins
- id
- user_id
- date
- energy
- focus
- motivation
- created_at timestamptz
- updated_at timestamptz
```

Unique:

```txt
user_id + date
```

## Life Areas

```txt
life_areas
- id
- user_id
- name
- icon nullable
- color nullable
- is_default
- hidden
- position
- created_at timestamptz
- updated_at timestamptz
```

## Goals

```txt
goals
- id
- user_id
- life_area_id
- title
- description nullable
- status
- priority
- progress
- start_date date nullable
- target_date date nullable
- position
- created_at timestamptz
- updated_at timestamptz
```

Do not derive a historical goal chart from the current `progress` value.

---

# 32. Recommended Indexes


```txt
habits(user_id, lifecycle_status)
habit_schedule_versions(habit_id, effective_from, effective_to)
habit_obligations(habit_id, period_start, period_end)
habit_obligations(state, period_end)
habit_check_ins(user_id, date)
habit_check_ins(habit_id, date)
freeze_transactions(user_id, created_at)
user_consents(user_id, document_type, accepted_at)
task_series(user_id, start_date, end_date)
task_occurrences(user_id, scheduled_date)
task_occurrences(series_id, original_date)
mindset_check_ins(user_id, date)
goals(user_id, status)
goals(user_id, life_area_id)
life_areas(user_id)
```

Use uniqueness constraints where described above.

For schedule-version ranges, enforce non-overlap in application logic and, if practical, with a Postgres exclusion constraint/range strategy.

---

# 33. Server Architecture

Prefer server-side business logic.

Suggested organization:

```txt
src/
  app/
    (auth)/
    app/
      today/
      habits/
      tasks/
      goals/
      insights/
      settings/
    api/
      auth/
  components/
    dashboard/
    habits/
    tasks/
    goals/
    insights/
    charts/
    ui/
  db/
    schema/
    index.ts
  lib/
    auth.ts
    auth-client.ts
    analytics/
    habits/
    streaks/
    freezes/
    tasks/
    goals/
    theme/
  actions/
    habits.ts
    tasks.ts
    goals.ts
    mindset.ts
    settings.ts
```

Keep analytics calculations outside React components.

React should render data, not define business rules.

---

# 34. Mutation Rules

All date-sensitive mutations must resolve the authoritative logical date on the server using the relevant IANA timezone. Never accept a client-computed "today" as authoritative for streaks, obligation finalization, recurrence, or freeze deadlines.

Schedule edits, freeze use, wallet changes, and late check-in resolution that touch multiple rows must run transactionally.

Before a habit check-in mutation:

1. resolve the authoritative logical date and applicable schedule version;
2. call the obligation-ensure process for that date/range;
3. load the covering obligation;
4. reject the mutation if the obligation is locked/finalized under the late-entry policy;
5. if the obligation is `missed_pending_freeze`, verify `now < grace_expires_at` before accepting a late check-in;
6. reconcile obligation state transactionally if the new check-in resolves the miss.

Every mutation must:

1. resolve the authenticated user
2. validate input
3. verify ownership
4. perform database operation
5. revalidate affected pages/data
6. return typed result

Never trust client-provided:

```txt
userId
ownership
streak
completion percentage
freeze balance
```

Calculate these server-side.

Use Zod or another robust validation layer.

---

# 35. Streak Engine


Build streak logic as an isolated domain service operating on materialized obligations.

Suggested functions:

```txt
getActiveScheduleVersion()
ensureHabitObligationsForRange()
ensureObligationsThrough()
resolveObligationForDate()
calculateProratedTarget()
recordHabitCheckIn()
finalizeDueObligations()
calculateCurrentStreak()
calculateBestStreak()
calculateConsistency()
applyFreeze()
awardWeeklyFreezeIfEligible()
```

## Critical invariant

These functions must never ask:

```txt
What is the habit's schedule today?
```

when evaluating an old period.

They must ask:

```txt
What obligation/schedule version was effective for that historical period?
```

## Finalization job

Create an idempotent server process that finalizes due obligations.

It may run:

- opportunistically when the user opens the app;
- through a scheduled server job;
- both, as long as processing is idempotent.

It must:

1. determine the local dates/ranges that require processing;
2. call `ensureObligationsThrough(...)` / `ensureHabitObligationsForRange(...)` first so missing rows cannot hide scheduled work;
3. find open obligations whose persisted `deadline_at` has passed;
4. finalize obligations that met target as `completed`;
5. move unmet obligations to `missed_pending_freeze`, persisting `grace_expires_at` and `freeze_mode_at_miss` exactly once;
6. resolve expired grace windows using `freeze_mode_at_miss`, never the user's current preference: auto-freeze automatic obligations when balance permits, otherwise finalize as `missed`;
7. award weekly freeze tokens when eligible exactly once using the effective-dated account week settings.

Write unit tests before relying on streak output in UI.

Important test cases:

- daily habit
- specific weekdays
- schedule edit daily → Mon/Wed/Fri
- historical analytics after schedule edit
- 3x/week target
- 4x/month target
- one check-in per local day
- overachievement with no carryover
- partial first week
- partial first month
- pause mid-period
- archive + restore
- manual freeze grace window
- automatic freeze mode
- insufficient freeze balance
- freeze ledger idempotency
- timezone boundary
- timezone change without history rewrite
- archived habit
- future dates
- no check-ins
- leap day
- DST transitions
- week-start preferences
- week-start preference change at next boundary
- count-based schedule edit deferred to next period boundary
- obligation generation after months of inactivity
- obligation generation after failed/missed scheduled job
- analytics range beginning mid-PERIOD obligation
- late DATE check-in during grace
- late PERIOD check-in during grace
- rejected mutation after grace expiry
- persisted grace deadline across DST/retry

---

# 36. Analytics Service


Prefer deriving analytics from canonical records rather than mutable counters.

Canonical sources:

```txt
habit_schedule_versions
habit_obligations
habit_check_ins
task_occurrences
mindset_check_ins
goals (current-state only for MVP)
```

Analytics functions:

```txt
getDailyCompletion()
getWeeklyCompletion()
getHabitConsistency()
getOverallConsistency()
getWeekOverWeekChange()
getTopHabits()
getNeedsAttentionHabit()
getCurrentStreaks()
getBestStreak()
getMindsetTrend()
getTaskCompletionTrend()
```

## Historical-schedule invariant

Habit analytics must use stored obligations/schedule versions, never regenerate old expectations from the current habit configuration.

## Needs-attention eligibility

A habit may be considered only when it has enough comparable historical data. Use thresholds and lookback windows by obligation type instead of one universal count.

### DATE-based habits

```txt
Lookback: 30 days
Minimum: 5 finalized DATE obligations
```

### Weekly count-based habits

```txt
Lookback: 8 completed weeks
Minimum: 3 finalized weekly PERIOD obligations
```

### Monthly count-based habits

```txt
Lookback: 6 completed months
Minimum: 3 finalized monthly PERIOD obligations
```

For each eligible habit, compute consistency over its applicable lookback window and select the lowest value.

Because the windows differ by schedule type, the UI should expose the evaluated period in a tooltip/detail view rather than implying every habit was measured over the same 30-day denominator.

Open/incomplete current periods do not count toward the minimum and do not qualify a habit early.

## Goal analytics

For MVP, goals are current-state only.

Do not expose a Goals consistency time series until a future schema adds immutable progress events/snapshots and defines expected progress semantics.

Add caching only when real performance data shows it is necessary.

---

# 37. Charts

Use Recharts.

Required chart types:

## Today

- progress ring

## Habits

- consistency line/area chart
- optional mini trend sparklines

## Tasks

- daily completion bar chart
- weekly completion ring
- energy/focus/motivation line chart

## Goals

- progress ring
- horizontal progress bars

## Insights

- large consistency area chart
- habit leaderboard bars
- streak bars/cards
- mindset line chart

Charts should animate subtly on first render.

Respect reduced-motion preference.

---

# 38. Chart Theme Rules

Charts inherit user theme.

Primary data series:

```txt
var(--accent)
```

Area fill:

```txt
accent → transparent gradient
```

Grid lines:

```txt
var(--border)
```

Labels:

```txt
var(--text-muted)
```

Tooltips:

```txt
var(--surface-elevated)
```

Never write chart components that assume a fixed cyan/teal accent.

For multi-series charts, derive accessible companion colors while preserving sufficient contrast.

---

# 39. Responsive Behavior

Desktop is the primary experience, but all features must remain usable on mobile.

## Today

Desktop:

```txt
2-column habit cards
```

Mobile:

```txt
1-column list
```

## Habits

The grid may horizontally scroll on mobile.

Keep habit labels sticky on the left if practical.

## Tasks

Do not display seven tiny columns on phones.

Mobile should show:

```txt
date carousel
+
single selected day
```

## Goals

Life-area cards become a horizontal or wrapped grid.

Priority cards remain stacked.

## Insights

Charts stack vertically.

Summary metric cards use a 2x2 layout.

---

# 40. Accessibility

Required:

- keyboard navigation
- visible focus states
- semantic controls
- labels for icon-only buttons
- accessible chart summaries
- adequate text contrast
- color is never the only indicator of state
- reduced-motion support
- touch targets at least ~44px where appropriate

Habit completion should use icon/state changes in addition to color.

---

# 41. Empty States

Every module needs purposeful empty states.

Examples:

## Habits

```txt
No habits yet.

Create something you want to become consistent at.

[ Create habit ]
```

## Tasks

```txt
Nothing planned for today.

[ Add task ]
```

## Goals

```txt
No goals yet.

Pick something worth moving toward.

[ Create goal ]
```

## Insights

```txt
Keep tracking.

Insights will appear once there is enough activity.
```

Never fabricate analytics from insufficient data.

---

# 42. Loading States

Use skeletons matching the final component geometry.

Avoid generic centered spinners for full dashboard pages.

Examples:

- chart skeleton
- metric-card skeleton
- grid skeleton
- task-card skeleton

---

# 43. Error Handling

User-facing errors should be concise.

Example:

```txt
We couldn't save that habit. Try again.
```

Do not expose raw database or server errors.

Log operational details server-side.

---

# 44. Delete Behavior


Use confirmation dialogs for destructive operations.

## Habits

Default destructive-looking action should be:

```txt
Archive habit
```

Archive preserves all historical data and analytics.

Permanent deletion must be placed behind an explicit secondary flow and explain:

```txt
This permanently removes the habit's check-ins and historical obligations.
Past analytics may change.
```

On permanent deletion:

- cascade habit schedule versions, obligations, and check-ins;
- preserve freeze ledger entries with nullable habit/obligation references;
- recompute affected analytics on next load.

## Recurring tasks

Deleting a recurring task occurrence must ask whether to:

```txt
Skip/delete this occurrence only
End this and future occurrences
```

Do not silently erase historical occurrences.

## Account deletion

Account deletion is an irreversible hard-deletion workflow for MVP. Do not use soft deletion as the permanent source of truth for deleted accounts.

When a user confirms account deletion:

1. Immediately revoke all active Better Auth sessions.
2. Mark the account as deletion-pending only if Better Auth requires a staged deletion flow.
3. Delete all user-owned application data, including:
   - user preferences and user week-setting versions;
   - immutable consent records;
   - habits, schedule versions, schedule days, obligations, and check-ins;
   - freeze wallet and freeze transactions;
   - one-off tasks, recurrence series, recurrence weekdays, and task occurrences;
   - mindset check-ins;
   - life areas and goals;
   - export jobs and generated export files;
   - notification preferences;
   - onboarding state;
   - any other application records keyed to the user.
4. Delete the Better Auth user/account records through its supported deletion mechanism.
5. Delete all generated export files immediately.

Operational logs may be retained for no more than 30 days only when required for security, abuse prevention, or infrastructure debugging. Such logs:

- must contain the minimum user-identifying information necessary;
- must not be used for product analytics after account deletion;
- must be removed automatically when the retention window expires.

Database backups may temporarily contain deleted records as part of normal encrypted backup rotation. For MVP:

- deleted accounts are never restored from backup for account-recovery purposes;
- deleted records expire naturally with the backup-retention window;
- documentation must disclose: "Deleted account data may remain in encrypted infrastructure backups for up to 30 days before expiring through normal backup rotation."

After applicable operational-log and backup-retention windows expire, deletion is irreversible.

---

# 45. Data Export

Provide authenticated JSON and CSV exports of the user's canonical data as it exists at export time.

Recommended v1 formats:

```txt
JSON
CSV
```

## JSON export

JSON export is one structured UTF-8 JSON document.

Recommended filename:

```txt
aevia-data-export-YYYY-MM-DD.json
```

## CSV export

Do not combine unrelated datasets into one mixed CSV. Generate a separate UTF-8 CSV file per dataset and package them into:

```txt
aevia-data-export-YYYY-MM-DD.zip
```

The ZIP should contain:

```txt
/habits.csv
/habit_schedule_versions.csv
/habit_obligations.csv
/habit_check_ins.csv
/freeze_transactions.csv
/tasks.csv
/task_occurrences.csv
/mindset_check_ins.csv
/life_areas.csv
/goals.csv
/preferences.csv
```

`tasks.csv` contains task-series/template records. One-off tasks and materialized recurring instances are exported in `task_occurrences.csv`; one-off rows have a blank `series_id`. If specific-weekday recurrence is present, include its weekday values in `tasks.csv` in a documented reconstructable form or add `task_series_weekdays.csv` to the ZIP.

`profile.csv` may be included when profile export is supported.

CSV rules:

- the first row contains column headers;
- logical dates use ISO `YYYY-MM-DD` format;
- timestamps use ISO 8601 UTC values;
- nullable values are blank, not the literal string `null`;
- IDs and foreign keys are included so relationships can be reconstructed;
- archived or deleted data is included only when it still exists in canonical storage;
- values reflect a consistent snapshot of the user's data at export time.

Export security and lifecycle rules:

- generation requires an authenticated user;
- every query is scoped to that authenticated user;
- only that user's records may appear in the export;
- download URLs and generated files are temporary;
- temporary exports expire and are deleted automatically;
- all outstanding export files are deleted immediately when the user deletes their account.

---

# 46. Performance Targets

Aim for:

- fast dashboard navigation
- immediate optimistic habit completion
- no unnecessary full-page reloads
- minimal client JavaScript where possible
- server-side data loading by default
- charts client-rendered only where needed

Avoid fetching each dashboard card independently if one server query can efficiently provide the full page model.

---

# 47. Security Requirements

- all application queries scoped to authenticated user
- no client-controlled user ownership
- input validation
- secure auth cookies
- CSRF-safe auth handling through supported Better Auth patterns
- rate-limit sensitive auth flows where appropriate
- secrets only in environment variables
- no database credentials exposed to client bundles
- use prepared/parameterized queries through Drizzle
- destructive actions require explicit confirmation
- consent records are immutable and preserve the accepted legal-document version and timestamp
- data exports require authentication, strict per-user scoping, temporary download access, and automatic expiry
- account deletion revokes sessions before removing user-owned data and authentication records
- operational logs and encrypted backups follow the deletion-retention limits in Section 44

---

# 48. UI Direction

## Reference-calibrated composition

The supplied product screenshots are the target for **macro composition and information hierarchy**. Codex should preserve the same general page rhythm while implementing an original design system.

Shared characteristics to preserve:

- page title upper-left
- pill navigation upper-center
- settings upper-right
- very wide desktop canvas
- large rounded panels
- subtle borders
- dark low-contrast surfaces
- strong use of progress rings
- smooth line/area charts
- compact metric cards
- dense but highly aligned tables/grids
- minimal decorative content
- data visualization as a primary visual element

## Page-by-page layout contract

### Today

```txt
header
centered completion ring
date + completed count + freeze balance
2-column habit checklist
```

### Habits

```txt
header
month summary panel
segmented Daily/Weekly/Monthly + New Habit
one integrated trend + calendar grid + stats panel
```

### Tasks

```txt
header
top-left weekly progress | top-right mindset chart
7 simultaneous day columns underneath
```

### Goals

```txt
header
full-width goals-achieved summary
5x2 life-area grid
stacked full-width top-priority goal cards
all goals below
```

### Insights

```txt
header
dominant full-width consistency chart
4 equal summary cards
2-column lower row: habit leaderboard | top streaks
```

## Originality requirements

Create our own:

- brand
- wordmark/logo
- font pairing
- exact radii
- icon treatment
- card padding
- button styling
- chart tooltip styling
- micro-animations
- copy
- empty states
- theme presets

Do not reproduce the screenshots pixel-for-pixel.

The finished app should make the reference inspiration obvious at the **product-layout level** but look unmistakably like a separate product.

## Accent customization rule

The reference screenshots use cyan/teal heavily. In our implementation, that color is only the default preset. Every component must render correctly with a different selected accent.

A user changing the accent must immediately update:

- active nav item
- selected segmented tabs
- main chart lines/fills
- progress rings
- progress bars
- habit completion circles
- current-day highlight
- buttons
- badges
- relevant glows
- focus rings

Secondary semantic series such as `Energy`, `Focus`, and `Motivation` may retain distinct non-accent colors for readability.

---

# 49. Design Personality

Target:

```txt
focused
premium
calm
analytical
modern
slightly futuristic
```

Avoid:

```txt
cartoonish
overly gamified
corporate SaaS
neon cyberpunk
excessive gradients
excessive glassmorphism
```

The customizable accent should provide personality without making the UI noisy.

---

# 50. Interaction Details

Use subtle motion for:

- habit completion
- progress rings
- tab switching
- cards appearing
- chart transitions
- accordion/dialog opening
- drag/reorder
- hover states

Example habit completion:

```txt
tap checkbox
→ checkbox fills
→ tiny scale animation
→ progress ring increments
→ streak updates if applicable
```

Avoid confetti after every action.

Milestone celebrations may use stronger feedback.

---

# 51. MVP Build Order

## Phase 1 — Foundation

Build:

- Next.js application
- Tailwind
- Drizzle
- Neon
- Better Auth
- protected app shell
- global navigation
- theme system
- customizable accent
- settings persistence

Success:

User can create an account, sign in, change accent color, refresh, and retain preferences.

## Phase 2 — Habits

Build:

- habit schema
- create/edit/archive
- schedules
- daily check-ins
- daily grid
- Today screen
- completion ring

Success:

A user can create scheduled habits and accurately track them by date.

## Phase 3 — Streak Engine

Build:

- current streak
- best streak
- consistency
- freeze wallet
- freeze transactions
- tests

Success:

All schedule types produce correct streak results.

## Phase 4 — Tasks

Build:

- weekly task planner
- daily task cards
- completion
- moving/reordering
- recurrence
- previous-day copy
- daily/weekly progress

Success:

User can manage one week of tasks fluidly.

## Phase 5 — Mindset

Build:

- daily energy
- focus
- motivation
- task-page line chart

Success:

User can log daily values and inspect weekly trends.

## Phase 6 — Goals

Build:

- life areas
- goals
- priorities
- progress
- target dates
- filters

Success:

User can organize lightweight goals across life categories.

## Phase 7 — Insights

Build:

- overall consistency
- primary chart
- filters
- week-over-week
- best streak
- needs attention
- habit leaderboard
- top streaks
- mindset trends

Success:

Insights are calculated from real canonical data and require no manual analytics entry.

## Phase 8 — Polish

Build:

- mobile layouts
- loading states
- empty states
- keyboard accessibility
- animation polish
- error handling
- export
- account deletion
- performance work

---

# 52. MVP Acceptance Checklist

The MVP is ready when:

- [ ] User can sign up with Better Auth
- [ ] User can log in and out
- [ ] Sessions persist correctly
- [ ] App routes are protected
- [ ] Data is stored in Neon
- [ ] Accent color can be customized
- [ ] Accent persists per user
- [ ] Dark/light/system themes work
- [ ] User can create/edit/archive habits
- [ ] Habit schedules work correctly
- [ ] Schedule edits create effective-dated versions rather than rewriting history
- [ ] Historical obligations remain unchanged after schedule edits
- [ ] Count-based habits support exactly one check-in per local day in MVP
- [ ] Partial weekly/monthly periods use deterministic proration
- [ ] Today only shows habits due today
- [ ] Habit completion updates immediately
- [ ] Daily completion percentage is correct
- [ ] Current streak calculation is correct
- [ ] Best streak calculation is correct
- [ ] Freeze behavior is correct
- [ ] Manual and automatic freeze modes are deterministic
- [ ] Freeze mode is snapshotted per obligation when its grace window begins
- [ ] Freeze ledger operations are idempotent
- [ ] Habit daily grid works
- [ ] Weekly/monthly habit views work
- [ ] User can create/edit/delete tasks
- [ ] Weekly task planner works
- [ ] Task completion metrics are correct
- [ ] Recurring tasks use series + occurrence semantics
- [ ] Recurring task edits preserve historical occurrences
- [ ] Monthly 29th–31st recurrence follows last-day overflow policy
- [ ] Mindset tracking works
- [ ] User can create life areas
- [ ] User can create goals
- [ ] Goal progress works
- [ ] Top priorities work
- [ ] Overall consistency works using Habits + Tasks only for MVP
- [ ] Goals are not exposed as a consistency chart filter
- [ ] Week-over-week comparison works
- [ ] Needs-attention logic works
- [ ] Habit leaderboard works
- [ ] Top streaks work
- [ ] Insights charts work
- [ ] Mobile layout is usable
- [ ] Loading and empty states exist
- [ ] IANA timezone semantics are used consistently
- [ ] Changing timezone does not rewrite past logical dates
- [ ] Pause/archive/restore semantics preserve historical analytics
- [ ] No cross-user data leakage is possible
- [ ] No analytics are fabricated when data is insufficient
- [ ] Signup stores immutable Terms and Privacy consent versions with timestamps
- [ ] CSV export produces a temporary per-dataset ZIP with reconstructable relationships
- [ ] Account deletion revokes sessions and hard-deletes all user-owned application data and export files

---

# 53. Testing Requirements


## Unit tests

Prioritize:

### Habit scheduling / integrity

- schedule resolution by version
- daily schedule
- specific weekdays
- weekly count targets
- monthly count targets
- schedule edit preserving old obligations
- future obligation regeneration only
- partial-period target proration
- one check-in per local date
- overachievement without carryover
- pause semantics
- archive/restore semantics

### Streak / freeze

- current streak
- best streak
- count-period streaks
- manual freeze grace period
- automatic freeze
- freeze-mode snapshot remains unchanged when the global preference changes during grace
- frozen obligation preserving but not incrementing streak
- weekly freeze earning threshold
- freeze wallet max
- transaction idempotency

### Time

- IANA timezone boundaries
- logical dates vs `timestamptz`
- timezone change does not rewrite past dates
- DST spring-forward
- DST fall-back
- leap day
- week-start preferences

### Recurring tasks

- daily recurrence
- weekday recurrence
- specific-weekday recurrence
- monthly 29/30/31 overflow
- materialization idempotency
- move one occurrence
- skip one occurrence
- edit this occurrence only
- edit this-and-future via series split
- historical completion preserved after series edit

### Analytics

- habit consistency from obligations
- frozen obligations excluded from completion numerator
- skipped tasks excluded from denominator
- overall consistency with habits only
- overall consistency with tasks only
- weighted overall consistency with both
- week-over-week metrics
- needs-attention eligibility threshold

## Integration tests

Test:

- Better Auth signup/login/session ownership
- Terms and Privacy consent version persistence
- schedule-version creation on habit edit
- obligation generation/finalization
- habit check-in
- freeze ledger transaction + wallet update in one transaction
- recurring-task occurrence materialization
- task completion
- goal update
- theme persistence
- authenticated export scoping and temporary-file expiry
- account deletion session revocation and user-data cascade

## E2E

Core flow:

```txt
signup
→ onboarding
→ create habit
→ complete habit
→ edit habit schedule
→ verify old history remains unchanged
→ create recurring task
→ move one occurrence
→ log mindset
→ create goal
→ visit Insights
```

---

# 54. Seed / Demo Data

Create a development seed command.

Seed:

```txt
8 habits
30–60 days of habit history
tasks across 2 weeks
14 days of mindset logs
10 life areas
5 goals
```

This is essential for developing the analytics pages.

Use deterministic seed data.

Do not rely on random values that make screenshot regression difficult.

---

# 55. Suggested Initial Habits

For onboarding/demo only:

```txt
Wake up early
Exercise
Meditate
Read
Eat healthy
Plan tomorrow
Journal
No social media
```

Users are not required to keep them.

---

# 56. Important Product Rule

The app should maximize this loop:

```txt
SMALL INPUT
    ↓
CHECK OFF HABITS / TASKS
    ↓
DATA ACCUMULATES
    ↓
VISUAL PROGRESS
    ↓
INSIGHTS
    ↓
MOTIVATION TO RETURN
```

Avoid adding features that increase data-entry burden without strengthening this loop.

---

# 57. Future Features — Explicitly Not MVP

Do not build these until the core product is working.

Possible later additions:

- native mobile app
- widgets
- push notifications
- social accountability
- shared challenges
- goal-to-habit linking
- smart recommendations
- calendar integration
- Apple Health
- Google Fit / Health Connect
- richer reports
- goal progress-event history and goal analytics
- yearly review
- personal records
- achievements
- import from other habit apps
- advanced recurrence rules

AI should only be considered later if there is a clear feature that genuinely benefits from it.

---

# 58. Codex Implementation Rules

When implementing this spec:

1. Build in phases.
2. Do not invent additional product scope.
3. Keep business rules outside UI components.
4. Write streak/frequency tests before polishing streak UI.
5. Use database migrations for every schema change.
6. Never trust a user ID provided by the client.
7. Reuse a central theme token system.
8. Never hardcode the default accent into feature components.
9. Optimize desktop first without breaking mobile.
10. Keep the interface visually original.
11. Prefer simple, robust implementations over clever abstractions.
12. Do not add AI.
13. Do not add integrations unless this spec is explicitly revised.
14. Use canonical database records as the source of truth for analytics.
15. Document any necessary deviation from this spec before implementing it.

---

# 59. Definition of Success

The final product should feel like:

> A polished, highly visual personal consistency dashboard that combines habits, weekly tasks, lightweight goals, and behavioral insights.

It should preserve the strengths of the reference product:

- fast check-ins
- visible consistency
- attractive charts
- clear page hierarchy
- high information density
- streak motivation
- minimal friction

while establishing its own identity through:

- original UI details
- original brand
- original copy
- user-customizable accent colors
- clean responsive behavior
- strong implementation quality

The product should be simple enough to explain in one sentence:

> Track your habits, tasks, and goals — and see whether you're actually becoming more consistent.



---

# APPENDIX A — Preserved v3 Wording

Wording from **v3** that v4 restated or replaced. Shown for history; superseded by the same-numbered sections above.


### v3 · 8. Habit Creation › Schedule edit behavior


When a user changes frequency or schedule:

1. close the currently active schedule version the day before the new version becomes effective;
2. create a new schedule version with `effective_from`;
3. preserve all past/finalized obligations unchanged;
4. delete/regenerate only **future, unfinalized** obligations covered by the changed schedule;
5. generate new obligations from the new version.

Default schedule-edit effective date:

```txt
Today, in the user's timezone
```

If the current day already has a completed/frozen check-in, require the user to choose:

```txt
Apply starting tomorrow
```

rather than silently reinterpreting today's history.


### v3 · 8. Habit Creation › Partial first/final periods


If a count-based habit begins or ends partway through a weekly/monthly period, prorate the target deterministically:

```txt
prorated_target = ceil(base_target × active_days / total_days_in_period)
```

Then clamp it to:

```txt
minimum 1
maximum base_target
maximum active_days
```

Example:

```txt
3x/week habit starts Friday
3 active days remain in a 7-day week
ceil(3 × 3 / 7) = 2
first-period target = 2
```

The same proration rule applies when a pause, archive, or schedule change ends a count-based schedule partway through a period.


### v3 · 12. Streak System › When a count-based period becomes successful


A period becomes successful as soon as:

```txt
completed_count >= target_count
```

At that point its state may finalize as `completed` immediately because later activity cannot make it unsuccessful.

If the target has not been reached, the period remains `open` until the local period boundary passes.

At period close:

- target met → `completed`
- target unmet → freeze workflow begins


### v3 · 13. Freeze Tokens › Deterministic earning rule


Replace the earlier ambiguous "7 consecutive successful habit-days" idea with this rule:

> At the end of each completed user-local week, award **1 freeze token** when the user's habit consistency for that week is at least **80%**, there were at least **3 scheduled habit obligations** contributing to that week, and the wallet is below the maximum balance.

Rules:

- award at most one token per completed local week;
- do not award if there was insufficient habit data;
- frozen obligations do not count as completed for the 80% threshold;
- the token award is recorded exactly once using a unique earning key such as `weekly:2026-09-21`;
- earning logic must be idempotent.

This threshold belongs in configuration so it can be changed later.


### v3 · 13. Freeze Tokens › Manual mode


When an obligation closes unmet:

1. mark it `missed_pending_freeze`;
2. start a **24-hour grace window** measured from the local end of the obligation period;
3. allow the user to spend one freeze token during that window;
4. if used, change the obligation to `frozen` and preserve the streak;
5. if not used by the end of the grace window, finalize it as `missed` and break the streak.

During the grace period, UI should show:

```txt
Streak at risk
Use 1 freeze?
```

Do not silently show a final broken streak before the grace period ends.


### v3 · 13. Freeze Tokens › Automatic mode


When an obligation closes unmet:

- if balance > 0, consume exactly one token immediately and finalize as `frozen`;
- if balance = 0, finalize as `missed`.


### v3 · 15. Recurring Tasks › This and future occurrences


Do not rewrite recurrence history.

Instead:

1. end the old series the day before the selected occurrence's original date;
2. create a new series effective from that selected occurrence onward;
3. preserve historical occurrences from the old series;
4. regenerate only future uncompleted/unfinalized occurrences.

For recurrence-pattern changes, use **This and future** rather than mutating the whole historical series.

Cosmetic template fields may optionally offer `Entire series`, but this must not reinterpret past dates or completion history.


### v3 · 25. Consistency Calculations › PERIOD obligations


For each weekly/monthly count period:

```txt
period_ratio = min(completed_count, target_count) / target_count
```

Aggregate by summing completed-equivalent units and target units across obligations.

Equivalent formulation:

```txt
sum(min(completed_count, target_count))
/
sum(target_count)
```

Frozen obligations do not count as completed.

Paused/archived dates with no obligation do not enter the denominator.

Partial periods use the prorated target stored on the obligation at creation/finalization time.


### v3 · 28. Settings › Data


- export data
- delete all productivity data
- delete account

---


### v3 · 29. Authentication UX › Signup


Fields:

```txt
Name
Email
Password
Confirm password
```

Require acceptance of terms/privacy.


### v3 · 34. Mutation Rules


All date-sensitive mutations must resolve the authoritative logical date on the server using the relevant IANA timezone. Never accept a client-computed "today" as authoritative for streaks, obligation finalization, recurrence, or freeze deadlines.

Schedule edits, freeze use, and wallet changes that touch multiple rows must run transactionally.

Every mutation must:

1. resolve the authenticated user
2. validate input
3. verify ownership
4. perform database operation
5. revalidate affected pages/data
6. return typed result

Never trust client-provided:

```txt
userId
ownership
streak
completion percentage
freeze balance
```

Calculate these server-side.

Use Zod or another robust validation layer.

---


### v3 · 35. Streak Engine



Build streak logic as an isolated domain service operating on materialized obligations.

Suggested functions:

```txt
getActiveScheduleVersion()
materializeHabitObligations()
resolveObligationForDate()
calculateProratedTarget()
recordHabitCheckIn()
finalizeDueObligations()
calculateCurrentStreak()
calculateBestStreak()
calculateConsistency()
applyFreeze()
awardWeeklyFreezeIfEligible()
```


### v3 · 35. Streak Engine › Finalization job


Create an idempotent server process that finalizes due obligations.

It may run:

- opportunistically when the user opens the app;
- through a scheduled server job;
- both, as long as processing is idempotent.

It must:

1. find obligations whose local deadline has passed;
2. mark successful count-based periods completed;
3. enter manual freeze grace state or auto-use freeze as configured;
4. finalize expired grace windows as missed;
5. award weekly freeze tokens when eligible exactly once.

Write unit tests before relying on streak output in UI.

Important test cases:

- daily habit
- specific weekdays
- schedule edit daily → Mon/Wed/Fri
- historical analytics after schedule edit
- 3x/week target
- 4x/month target
- one check-in per local day
- overachievement with no carryover
- partial first week
- partial first month
- pause mid-period
- archive + restore
- manual freeze grace window
- automatic freeze mode
- insufficient freeze balance
- freeze ledger idempotency
- timezone boundary
- timezone change without history rewrite
- archived habit
- future dates
- no check-ins
- leap day
- DST transitions
- week-start preferences

---


### v3 · 36. Analytics Service › Needs-attention eligibility


A habit may be considered only when it has enough historical obligation data.

Default:

```txt
at least 5 finalized obligations
```

For count-based weekly/monthly habits, one finalized period counts as one obligation for eligibility.


### v3 · 44. Delete Behavior › Account deletion


Account deletion must remove or anonymize application data as appropriate and terminate active Better Auth sessions.

---


### v3 · 45. Data Export


Provide a basic export.

Recommended v1 formats:

```txt
JSON
CSV
```

Export:

- habits
- habit check-ins
- tasks
- goals
- mindset logs

---



---

# APPENDIX B — Preserved v2 Wording

Wording from **v2** that v3/v4 restated, expanded or replaced. Shown for history; superseded by the same-numbered sections above.


### v2 · 8. Habit Creation › Monthly


Example:

```txt
4 times per month
```

The habit engine must distinguish between:

- calendar-based scheduling
- count-based targets


### v2 · 8. Habit Creation › Habit actions


Allow:

- create
- edit
- archive
- restore
- delete
- pause

Prefer archive over destructive deletion.

---


### v2 · 12. Streak System › Current streak


A streak increments when a scheduled obligation is successfully satisfied.

The streak system must understand the habit's schedule.

Example:

A Mon/Wed/Fri habit should not lose a streak on Tuesday.


### v2 · 12. Streak System › Best streak


Track the highest historical streak.


### v2 · 12. Streak System › Missed scheduled day


If a required habit occurrence is missed:

```txt
current streak → 0
```

unless a freeze is applied.


### v2 · 12. Streak System › Count-based habits


For habits such as:

```txt
Gym 3x/week
```

the streak represents successful target periods, not consecutive calendar days.

Example:

```txt
Week 1: 3/3 → streak 1
Week 2: 4/3 → streak 2
Week 3: 2/3 → streak broken
```

Clearly distinguish daily streaks from weekly target streaks in UI copy.

---


### v2 · 13. Freeze Tokens


Freeze tokens preserve a streak after a missed required occurrence.


### v2 · 13. Freeze Tokens › MVP rule


Start with:

```txt
Maximum freeze tokens held: 3
```

Suggested earning mechanic:

```txt
7 consecutive successful habit-days across the account
→ earn 1 freeze token
```

This rule must be isolated in configuration so it can be adjusted later.


### v2 · 13. Freeze Tokens › Freeze behavior


When a streak-breaking event occurs:

1. determine whether user has a freeze token
2. if yes, allow freeze usage
3. create freeze transaction
4. preserve streak
5. visually mark date as frozen, not completed

A frozen day must never count as an actual completed habit.


### v2 · 13. Freeze Tokens › Data integrity


Do not simply set:

```txt
completed = true
```

for frozen events.

Freezes must remain analytically distinct.

---


### v2 · 15. Recurring Tasks


MVP recurrence options:

```txt
None
Daily
Weekdays
Weekly
Specific weekdays
Monthly
```

Use recurrence rules rather than pre-creating unlimited future database rows.

Materialize task instances only when necessary.

---


### v2 · 20. Page 5 — Insights › Exact desktop page composition


```txt
INSIGHTS                    [ centered global nav ]                      ⚙

┌───────────────────────────────────────────────────────────────────────────┐
│ OVERALL CONSISTENCY                                  [Overall▼][30 days▼] │
│ 74%                                                                       │
│                                                                           │
│                 large accent area/line chart                              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ THIS WEEK      │ │ VS LAST WEEK   │ │ BEST STREAK    │ │ NEEDS ATTENTION│
│ 78%            │ │ +5%            │ │ 14 days        │ │ Meditation     │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘

┌──────────────────────────────────┐ ┌──────────────────────────────────────┐
│ HABIT LEADERBOARD                │ │ TOP STREAKS                          │
│ [D] [W] [M]                      │ │                                      │
│ Wake Early   █████████ 80%       │ │ No Social Media  ███████      4d     │
│ Gym          █████████ 80%       │ │ Wake Early       █████        3d     │
│ Journal      █████████ 80%       │ │ Gym              █████        3d     │
└──────────────────────────────────┘ └──────────────────────────────────────┘
```


### v2 · 20. Page 5 — Insights › Main consistency chart


The first panel should dominate the page visually.

Include:

- metric label upper-left
- large overall percentage directly beneath it
- scope filter upper-right
- time-range filter upper-right
- large smooth line/area visualization occupying most of the panel
- hover tooltip
- highlighted selected point and guide line
- date labels along the bottom

Filters:

```txt
Overall
Habits
Tasks
Goals
```

Time ranges:

```txt
7 days
30 days
90 days
6 months
1 year
All time
```

Use an area/line chart. The line and fill gradient derive from the user's accent color.

---


### v2 · 25. Consistency Calculations › Habit consistency


For a date range:

```txt
completed required occurrences
/
scheduled required occurrences
```

Frozen occurrences do not count as completed.


### v2 · 25. Consistency Calculations › Overall consistency


Initial MVP formula:

```txt
Habit consistency = 70% weight
Task completion   = 30% weight
```

Only include dimensions with available data.

Example:

If user has habits but no tasks:

```txt
Overall = Habit consistency
```

Do not penalize users for modules they do not use.

Store the formula in a clearly isolated analytics service so it can be changed later.

---


### v2 · 28. Settings › Data


- export data
- delete all productivity data
- delete account

---


### v2 · 29. Authentication UX › Signup


Fields:

```txt
Name
Email
Password
Confirm password
```

Require acceptance of terms/privacy.


### v2 · 31. Database Model


Use Drizzle with Neon Postgres.

Better Auth manages its required authentication tables.

Application tables should reference the authenticated user ID.


### v2 · 31. Database Model › User Preferences


```txt
user_preferences
- id
- user_id unique
- theme_mode
- accent_color
- week_starts_on
- timezone
- date_format
- reduced_motion
- onboarding_completed
- created_at
- updated_at
```


### v2 · 31. Database Model › Habits


```txt
habits
- id
- user_id
- name
- description nullable
- icon nullable
- color nullable
- frequency_type
- target_count nullable
- start_date
- end_date nullable
- status
- position
- created_at
- updated_at
```


### v2 · 31. Database Model › Habit Schedule Days


```txt
habit_schedule_days
- id
- habit_id
- weekday
```

Unique:

```txt
habit_id + weekday
```


### v2 · 31. Database Model › Habit Check-ins


```txt
habit_check_ins
- id
- habit_id
- user_id
- date
- state
- created_at
- updated_at
```

State:

```txt
completed
frozen
```

No row means no positive check-in.

Unique:

```txt
habit_id + date
```


### v2 · 31. Database Model › Freeze Wallet


```txt
freeze_wallets
- id
- user_id unique
- balance
- updated_at
```


### v2 · 31. Database Model › Freeze Transactions


```txt
freeze_transactions
- id
- user_id
- habit_id nullable
- date nullable
- amount
- type
- reason
- created_at
```

Types:

```txt
earned
used
admin_adjustment
```


### v2 · 31. Database Model › Tasks


```txt
tasks
- id
- user_id
- title
- description nullable
- date
- completed
- completed_at nullable
- priority nullable
- position
- recurrence_rule nullable
- recurrence_group_id nullable
- created_at
- updated_at
```


### v2 · 31. Database Model › Mindset Check-ins


```txt
mindset_check_ins
- id
- user_id
- date
- energy
- focus
- motivation
- created_at
- updated_at
```

Unique:

```txt
user_id + date
```


### v2 · 31. Database Model › Life Areas


```txt
life_areas
- id
- user_id
- name
- icon nullable
- color nullable
- is_default
- hidden
- position
- created_at
- updated_at
```


### v2 · 31. Database Model › Goals


```txt
goals
- id
- user_id
- life_area_id
- title
- description nullable
- status
- priority
- progress
- start_date nullable
- target_date nullable
- position
- created_at
- updated_at
```

---


### v2 · 32. Recommended Indexes


```txt
habits(user_id, status)
habit_check_ins(user_id, date)
habit_check_ins(habit_id, date)
tasks(user_id, date)
mindset_check_ins(user_id, date)
goals(user_id, status)
goals(user_id, life_area_id)
life_areas(user_id)
```

Use uniqueness constraints where described above.

---


### v2 · 35. Streak Engine


Build streak logic as an isolated service.

Suggested functions:

```txt
isHabitScheduledForDate()
getScheduledOccurrences()
calculateCurrentStreak()
calculateBestStreak()
calculateConsistency()
calculatePeriodTargetStatus()
applyFreeze()
```

Write unit tests before relying on the streak system in UI.

Important test cases:

- daily habit
- specific weekdays
- 3x/week target
- timezone boundary
- freeze
- archived habit
- habit created mid-period
- future dates
- no check-ins
- leap day
- daylight-saving changes
- week start preferences

---


### v2 · 36. Analytics Service


Do not maintain many analytics values as mutable counters unless necessary.

Prefer deriving them from canonical records.

Analytics functions:

```txt
getDailyCompletion()
getWeeklyCompletion()
getHabitConsistency()
getOverallConsistency()
getWeekOverWeekChange()
getTopHabits()
getNeedsAttentionHabit()
getCurrentStreaks()
getBestStreak()
getMindsetTrend()
getTaskCompletionTrend()
```

Add caching only when real performance data shows it is necessary.

---


### v2 · 44. Delete Behavior


Use confirmation dialogs for destructive operations.

Prefer:

```txt
archive habit
```

over deletion.

Account deletion must remove or anonymize application data as appropriate and terminate sessions.

---


### v2 · 45. Data Export


Provide a basic export.

Recommended v1 formats:

```txt
JSON
CSV
```

Export:

- habits
- habit check-ins
- tasks
- goals
- mindset logs

---


### v2 · 52. MVP Acceptance Checklist


The MVP is ready when:

- [ ] User can sign up with Better Auth
- [ ] User can log in and out
- [ ] Sessions persist correctly
- [ ] App routes are protected
- [ ] Data is stored in Neon
- [ ] Accent color can be customized
- [ ] Accent persists per user
- [ ] Dark/light/system themes work
- [ ] User can create/edit/archive habits
- [ ] Habit schedules work correctly
- [ ] Today only shows habits due today
- [ ] Habit completion updates immediately
- [ ] Daily completion percentage is correct
- [ ] Current streak calculation is correct
- [ ] Best streak calculation is correct
- [ ] Freeze behavior is correct
- [ ] Habit daily grid works
- [ ] Weekly/monthly habit views work
- [ ] User can create/edit/delete tasks
- [ ] Weekly task planner works
- [ ] Task completion metrics are correct
- [ ] Recurring tasks work
- [ ] Mindset tracking works
- [ ] User can create life areas
- [ ] User can create goals
- [ ] Goal progress works
- [ ] Top priorities work
- [ ] Overall consistency works
- [ ] Week-over-week comparison works
- [ ] Needs-attention logic works
- [ ] Habit leaderboard works
- [ ] Top streaks work
- [ ] Insights charts work
- [ ] Mobile layout is usable
- [ ] Loading and empty states exist
- [ ] No cross-user data leakage is possible
- [ ] No analytics are fabricated when data is insufficient

---


### v2 · 53. Testing Requirements › Unit tests


Prioritize:

- schedule resolution
- consistency calculations
- streak calculations
- freeze logic
- week boundaries
- recurrence rules
- timezone handling
- overall consistency
- week-over-week metrics


### v2 · 53. Testing Requirements › Integration tests


Test:

- auth
- ownership
- habit creation/check-in
- task completion
- goal update
- theme persistence


### v2 · 53. Testing Requirements › E2E


Core flow:

```txt
signup
→ onboarding
→ create habit
→ complete habit
→ create task
→ complete task
→ log mindset
→ create goal
→ visit Insights
```

---
