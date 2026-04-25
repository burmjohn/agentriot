# Public Shell Component — Task 3 Learnings

## What was done
- Created `components/public/public-shell.tsx` as a shared wrapper for all public pages.
- Wrapped the entire app with `<ThemeProvider>` in `app/layout.tsx` so theme context is available everywhere.
- Added `<ThemeToggle />` to `NavShell` in both desktop (next to CTA) and mobile drawer (next to close button).
- Migrated all 16 public pages from manual `NavShell` + `PublicFooter` imports to the unified `PublicShell`.

## Pages migrated
1. `app/page.tsx`
2. `app/feed/page.tsx`
3. `app/news/page.tsx`
4. `app/news/[slug]/page.tsx`
5. `app/software/page.tsx`
6. `app/software/[slug]/page.tsx`
7. `app/agents/page.tsx`
8. `app/agents/[slug]/page.tsx`
9. `app/agents/[slug]/updates/[updateSlug]/page.tsx`
10. `app/about/page.tsx`
11. `app/join/page.tsx`
12. `app/join/claim/page.tsx`
13. `app/agent-instructions/page.tsx`
14. `app/docs/install/page.tsx`
15. `app/docs/post-updates/page.tsx`
16. `app/docs/claim-agent/page.tsx`

## Key design decisions
- **Shared component approach** (not route groups) to avoid any URL changes.
- **Optional `mainClassName` prop** on `PublicShell` to preserve per-page layout differences (e.g., `max-w-[1100px]` on agent update pages, `flex flex-col gap-12` on news slug pages).
- **Forward NavShell props** (`links`, `ctaLabel`, `ctaHref`) so active-link highlighting and CTA customization still work per-page.
- **Admin pages untouched** — `app/admin/login/page.tsx` and other admin routes do not import `PublicShell`.

## Accessibility
- Skip link targets `#main-content` on the `<main>` element.
- Every public route now renders exactly one `<main>` landmark.
- Theme toggle is keyboard accessible (button element with aria-label).

## TypeScript verification
- `pnpm typecheck` passes cleanly for all touched files.
- Pre-existing errors in `tests/design-system.test.ts` (regex flag compatibility) are unrelated to this task.

## Pattern for future public pages
Any new public page should:
1. Import `PublicShell` from `@/components/public/public-shell`.
2. Pass custom `links`/`ctaLabel`/`ctaHref` if the nav needs active-state highlighting.
3. Pass custom `mainClassName` if the page needs non-default max-width, flex layout, or vertical padding.
4. Export `metadata` as usual (do not remove page-level metadata exports).

---

# Public UI Primitives — Task 4 Learnings

## What was done
Rebuilt 6 existing public-facing UI primitives + created 1 new primitive to use semantic theme tokens instead of hard-coded dark-only colors.

## Files modified
| File | Changes |
|------|---------|
| `components/ui/nav-shell.tsx` | `bg-[#131313]` → `bg-canvas`, `text-white` → `text-foreground`, `border-white/10` → `border-border`, `hover:text-[#3860be]` → `hover:text-deep-link` |
| `components/public/public-footer.tsx` | `border-white/10` → `border-border`, `text-white` → `text-foreground`, `text-secondary-gray` → `text-secondary-text`, `text-muted-text` → `text-muted-foreground` |
| `components/ui/pill-button.tsx` | `bg-[#2d2d2d] text-[#e9e9e9]` (secondary) → `bg-surface text-muted-foreground` |
| `components/ui/story-stream-tile.tsx` | `bg-[#131313] border-white text-white` (dark/feature) → `bg-canvas border-border text-foreground` |
| `components/ui/story-stream-rail-item.tsx` | `text-[#949494]` → `text-secondary-text`, `bg-[#131313] border-white` → `bg-canvas border-border`, `text-[#3cffd0]` → `text-mint`, `text-white` → `text-foreground`, deck → `text-muted-foreground` |
| `components/ui/pill-tag.tsx` | `bg-[#2d2d2d] text-[#e9e9e9]` (slate) → `bg-surface text-muted-foreground` |

## New file
- `components/public/empty-state.tsx` — reusable empty-state with semantic tokens, warm editorial copy, optional icon + primary action via PillButton

## Token mapping reference
| Hard-coded | Semantic Token | Dark | Light |
|---|---|---|---|
| `#131313` | `bg-canvas` | #131313 | #ffffff |
| `#2d2d2d` | `bg-surface` | #2d2d2d | #f5f5f5 |
| `text-white` | `text-foreground` | #ffffff | #131313 |
| `#949494` | `text-secondary-text` | #949494 | #666666 |
| `#e9e9e9` | `text-muted-foreground` | #e9e9e9 | #888888 |
| `border-white/10` | `border-border` | rgba(255,255,255,0.16) | rgba(0,0,0,0.10) |
| `#3860be` | `text-deep-link` | #3860be | #3860be |
| `#3cffd0` | `text-mint` | #3cffd0 | #3cffd0 |

## Key decisions
- **Accent colors stay hard-coded**: Mint (`#3cffd0`), ultraviolet (`#5200ff`), yellow, pink, orange, white — these are saturated brand colors, not theme-dependent.
- **Secondary/slate variants use semantic tokens**: These are surface-level UI elements that should adapt to light/dark mode.
- **Hover states kept as-is**: `rgba(255,255,255,0.2)` hover on pill buttons preserves exact dark-mode backward compatibility.
- **Backward compatibility maintained**: No props changed, no APIs modified, no admin pages affected.

## Verification
- `pnpm eslint` on all 7 files: 0 errors (1 pre-existing warning in story-stream-rail-item.tsx for `_hideSpine`)
- `pnpm tsc --noEmit`: 0 new errors in touched files (pre-existing errors only in `tests/design-system.test.ts`)
- LSP diagnostics: clean on all 7 files

---

# Homepage Redesign — Task 5 Learnings

## What was done
Rebuilt `app/page.tsx` as an Editorial Command Center using semantic theme tokens.

## Changes
- Replaced all hard-coded dark-only color classes with semantic tokens:
  - `text-white` → `text-foreground` (theme-aware)
  - `text-secondary-gray` → `text-secondary-text` (theme-aware)
  - `text-muted-text` → `text-muted-foreground` (via EmptyState component)
  - Removed `border-white/10` usage (StoryStreamTile now uses `border-border`)
- Hero section: Anton wordmark at `text-display-hero` (107px), kicker in `text-label-light`, primary + secondary CTAs
- Discovery grid: 3 color-block accent tiles (ultraviolet/yellow/mint) linking to /software, /agents, /news
- All 5 pathways (/feed, /join, /news, /software, /agents) visible in first viewport
- Activity section: inline section header with semantic tokens + StoryStreamRail with feed items
- Empty feed: uses `EmptyState` component with contextual copy and action to `/join`
- Featured News section: preserved, redesigned with semantic tokens, inline section header
- Avoided `SectionHeader` component because it still uses hard-coded `text-white` / `text-secondary-gray`

## Verification
- `pnpm build`: passes (0 errors, all 35 routes generated)
- `pnpm typecheck`: 0 new errors in `app/page.tsx` (all 67 errors are pre-existing in `tests/design-system.test.ts`)

---

# F3 manual QA v4 learnings

## What was verified
- Use the styled dev server on `http://localhost:3004` when `localhost:3000`
  serves stale Turbopack chunks. The `3004` server rendered the current public
  redesign with CSS, theme provider JavaScript, and working screenshots.
- Dark-mode QA must explicitly set `agentriot-theme` to `dark`; light-mode white
  canvas is expected by the design contract.
- The theme toggle cycles `system` → `light` → `dark` → `system`, persists in
  `localStorage` under `agentriot-theme`, and keeps the selected mode after
  reload.
- Mobile navigation exposes `aria-label="Open navigation menu"` and
  `aria-label="Close navigation menu"`; the outside page strip and Escape key
  close the drawer.

## Re-review decisions
- Dynamic agent detail 404s are seeded-data dependent and should not be treated
  as public redesign bugs during F3 unless test data is installed.
- JSON-LD/script warnings can trigger the Next.js dev overlay, but they were
  explicitly excluded from F3 v4 redesign blockers.
- Soft-shadow checks should look for persistent computed `box-shadow` with blur
  greater than `2px`; hover ring utilities with zero blur are acceptable.

---

# Theme Architecture — Task 2 Verification

## What was done
Theme system was already implemented in previous sessions. Verified and refined:
1. `app/layout.tsx`: inline no-flash script reads `localStorage.agentriot-theme` before hydration; sets `class` and `data-theme` on `<html>`; wraps app with `<ThemeProvider>`; uses `suppressHydrationWarning`
2. `app/globals.css`: `:root` provides full light-safe defaults; `.dark` and `[data-theme="dark"]` provide dark overrides; `@media (prefers-color-scheme: dark)` sets dark defaults when no manual theme exists
3. `components/ui/theme-provider.tsx`: React context with `system` | `light` | `dark`; listens to `matchMedia('prefers-color-scheme: dark')` changes; applies class + data-theme; **removed** localStorage entry when `system` is selected (per DESIGN.md preference)
4. `components/ui/theme-toggle.tsx`: client component cycles `system` → `light` → `dark` → `system`; uses `Monitor`, `Sun`, `Moon` icons; accessible `aria-label` containing `Theme`; visible focus via `focus-visible:outline-focus-cyan`
5. `components/ui/nav-shell.tsx`: imports `ThemeToggle` from `@/components/ui/theme-toggle` (fixed path); renders toggle in desktop nav and mobile drawer

## Playwright verification results
- System dark (no localStorage): `dark` class, `data-theme="dark"`, canvas `#131313` ✅
- Toggle to light: `light` class, `data-theme="light"`, localStorage `"light"`, canvas `#fff` ✅
- Toggle to dark: `dark` class, `data-theme="dark"`, localStorage `"dark"`, canvas `#131313` ✅
- Toggle to system: localStorage removed (`null`), canvas `#131313` (system is dark) ✅
- Persisted light reload: `light` class survives reload, canvas `#fff` ✅

## Command verification
- `pnpm lint`: 0 errors (1 pre-existing warning in feature-card.tsx) ✅
- `pnpm typecheck`: 0 errors ✅
- `pnpm test`: 102/102 passed ✅

## Evidence files
- `.sisyphus/evidence/public-redesign/task-2-system-dark.json`
- `.sisyphus/evidence/public-redesign/task-2-light-persist.png`
- `.sisyphus/evidence/public-redesign/task-2-system-dark.png`

## Key refinement
Changed `theme-provider.tsx` to call `localStorage.removeItem('agentriot-theme')` when user selects `system`, rather than storing the string `"system"`. This matches DESIGN.md preference: "Prefer removing storage for `system`."
