# Spark Study — Remaining Work to Make This Usable

This repo currently runs and builds, but it behaves like a **UI prototype**:

- All decks/cards/stats are **hard-coded + kept only in React state** (refresh loses everything)
- There’s only **one route** (`/`) plus a 404
- Features like “auto-save”, “version history”, “recovery for 30 days”, “spaced review” are **UI text**, not real persistence/logic

Below is the checklist to turn it into a usable system.

---


## 1) Define the product minimum (so development is not random)

- [x] Decide the target: **single-user local app** (no accounts)
- [x] Confirm core workflows to support:
  - [x] Create/edit decks
  - [x] Create/edit cards
  - [x] Study session (show next due cards)
  - [x] Mark results (know/again)
  - [x] View progress

---

## 2) Persistence (required for “usable”)

Pick one path:

### Option A — Local-only (fastest MVP)

- [ ] Persist decks/cards/settings in `localStorage` or IndexedDB
- [ ] Add schema + migrations (at least version your stored data)
- [ ] Load persisted state on startup; handle corruption/reset

### Option B — Cloud sync (real product)

- [ ] Choose backend (Supabase/Firebase/custom API)
- [ ] Implement auth (email/password, OAuth, etc.)
- [ ] Store decks/cards/study events in DB
- [ ] Implement sync + conflict handling (at least “last write wins”)

---

## 3) Real data model + state management

Right now, cards/decks are arrays in one component.

- [ ] Create types for Deck/Card/StudyEvent/Settings
- [ ] Add IDs that are stable (UUID) and not derived from array length
- [ ] Separate UI state (selected deck/card, dialogs) from domain state (decks/cards)
- [ ] Move data logic out of the big page component into a small data layer (hooks/services)

---

## 4) Deck + card management UX (CRUD completeness)

Currently you can add decks/cards and edit the selected card, but key flows are missing.

- [ ] Rename deck
- [ ] Delete deck (and what happens to its cards)
- [ ] Move card to another deck
- [ ] Edit card tags (not just auto-generated)
- [ ] Duplicate card
- [ ] Confirm unsaved changes on navigation (if using explicit save)

---

## 5) Study logic (make “spaced repetition” real)

The UI suggests spaced review, but the app doesn’t schedule cards.

- [ ] Define scheduling algorithm (simple Leitner boxes is fine for MVP)
- [ ] Track per-card review state: due date, interval, ease/box, last reviewed
- [ ] “Due today” should be computed from data, not a counter
- [ ] Study queue: pick next due card + allow deck filtering
- [ ] Record study events (for stats + graphs)

---

## 6) Version history / recovery (currently only UI text)

You have Undo/Redo in-memory, but it’s limited and not persisted.

- [ ] Decide what “version history” means:
  - [ ] Per-card edit history? whole app snapshots? audit log?
- [ ] Persist history if you want “restore after refresh”
- [ ] Implement trash/recovery rules if you want “30 days” (or remove that claim)

---

## 7) Settings + theming correctness

Dark mode currently toggles a class manually; `next-themes` is installed but unused.

- [x] Persist theme preference
- [x] Switch to `next-themes` and remove manual theme logic
- [x] Add basic settings: study session length, new card defaults, etc.

---

## 8) Routing / app structure

Today everything is inside one huge page component.

- [ ] Split into routes (minimal set):
  - [ ] `/` dashboard (optional)
  - [ ] `/decks/:id` deck view
  - [ ] `/study` study session
  - [ ] `/settings` settings
- [ ] Add a real navigation component (you already have a `NavLink` helper)

---

## 9) Error handling + resilience

- [ ] Add an error boundary around the app shell
- [ ] Validate user input (empty deck name, huge card text, etc.)
- [ ] Handle “no decks” / “no cards” empty states cleanly

---

## 10) Accessibility + keyboard support

The UI _mentions_ keyboard navigation, but shortcuts are not implemented.

- [ ] Implement actual shortcuts (N new card, F flip, Ctrl/Cmd+Z/Y)
- [ ] Ensure focus management for dialogs (delete confirmation)
- [ ] Add labels/aria where needed; verify tab order

---

## 11) Testing (beyond the example test)

- [ ] Add unit tests for scheduling (pure functions)
- [ ] Add component tests for core flows (create/edit/study)
- [ ] Add at least one “persistence load/save” test

---

## 12) Security + maintenance

- [ ] Address `npm audit` findings (start with high severity)
- [ ] Decide on secrets handling if you add a backend (env vars, `.env`, etc.)
- [ ] Add basic CI (lint + test + build) on GitHub Actions

---

## 13) Docs + onboarding

README is currently empty.

- [ ] Update README with: what this app is, how to run, how data is stored, how to deploy
- [ ] Add screenshots or a short usage guide

---

## Suggested MVP path (minimal “usable” baseline)

If you want the quickest path to a usable single-user app:

- [ ] Implement Local-only persistence (Section 2 Option A)
- [ ] Implement a simple Leitner scheduling model (Section 5)
- [ ] Finish CRUD basics (rename/delete deck, edit tags, move card) (Section 4)
- [ ] Persist theme + implement real shortcuts (Sections 7 + 10)
