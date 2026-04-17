# Agent Riot Code Review Remediation Plan

## TL;DR
> **Summary**: Fix all issues identified in the full-code-review audit, organized by severity and remediation phases
> **Deliverables**: Fixed code for all C-1, H-1, H-2, H-3, and M-1 through M-13 issues
> **Effort**: Large
> **Parallel**: YES - issues grouped by subsystem
> **Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

## Context
### Original Request
Fix all issues found in the code review.

### Source Audit
All findings come from `.sisyphus/evidence/repo-audit/09-final-review-report.md`

## Work Objectives
### Core Objective
Fix all Critical, High, and Medium severity issues from the code review, organized by remediation phase.

### Deliverables
- Fixed authorization bypass in admin server actions (C-1)
- Fixed sign-in redirect loop (H-1)
- Fixed taxonomy term exposure (H-2)
- Added CI workflow (H-3)
- Fixed all Medium priority issues (M-1 through M-13)
- Fixed Low priority issues (L-1, L-2)
- All verification commands passing

### Definition of Done
- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm build` passes
- `pnpm test:e2e` passes
- `pnpm test:e2e:admin` passes

## Execution Strategy

### Phase 1: Security-Critical (Do First)

#### Fix C-1: Admin server actions bypass allowlist check
**File**: `app/admin/actions.ts:75-82`
**Issue**: `requireAdminUserId()` checks only session presence, not allowlist membership
**Fix**: Add `isAdminEmailAllowed()` check matching `requireAdminSession()`

#### Fix H-1: Sign-in redirect loop for disallowed sessions
**File**: `app/sign-in/page.tsx:7-12`
**Issue**: Redirects any session to `/admin`, which bounces disallowed sessions back
**Fix**: Add allowlist check before redirect or show error page

### Phase 2: Trust Boundary Consistency

#### Fix M-1: Proxy-trust validation for x-forwarded-for
**File**: `lib/ingestion/auth.ts:133-142`
**Issue**: Stores client-spoofable IP without proxy-trust validation
**Fix**: Add trusted proxy validation or document requirement

#### Fix M-3: Normalize unknown-field handling
**Files**: `lib/ingestion/*-ingestion.ts` (prompt, skill, taxonomy, content, agent)
**Issue**: Inconsistent rejection vs stripping of unknown fields
**Fix**: Standardize behavior across all ingestion targets

#### Fix M-4: Align bootstrap completion checks
**Files**: `scripts/deploy/bootstrap.ts`, `scripts/deploy/bootstrap-status.ts`
**Issue**: `runBootstrap()` checks key presence, `getBootstrapStatus()` checks value
**Fix**: Use consistent semantics (value check)

### Phase 3: Public Surface Contracts

#### Fix H-2: Taxonomy term exposure without published backing
**File**: `lib/public/hub.ts:246-259`
**Issue**: Returns all terms without join to published content
**Fix**: Add published-record join or client-side filter

#### Fix M-5: Normalize term parameter
**Files**: `app/[kind]/page.tsx` collection pages
**Issue**: API routes trim with `normalizeOptionalParam()`; pages pass raw
**Fix**: Add normalization to page loaders

#### Fix M-6: Tutorial taxonomy chip routing
**File**: `lib/public/presentation.ts` (getPublicTaxonomyHref)
**Issue**: Sends all content scope terms to `/articles`
**Fix**: Accept content kind parameter for correct routing

#### Fix M-7: SQL wildcard enumeration in search
**File**: `lib/public/hub.ts` (searchPublishedGraph)
**Issue**: Wraps input in `%${query}%` without escaping `%` or `_`
**Fix**: Escape wildcards or use literal search

### Phase 4: SEO/Crawl Consistency

#### Fix M-8: Respect canonicalUrl in sitemap/feeds
**Files**: `app/sitemap.ts`, `lib/public/feeds.ts`
**Issue**: Detail pages support canonicalUrl; sitemap/feeds ignore it
**Fix**: Use canonicalUrl when present

#### Fix M-9: Fix /api page content
**File**: `app/api/page.tsx`
**Issue**: Page drifted from expected heading/robots.txt link
**Fix**: Align content with test expectations

#### Fix L-1: Consistent cache headers
**Files**: `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`
**Issue**: Feeds set cache-control; others don't
**Fix**: Add consistent cache headers

#### Fix L-2: Broader crawl policy
**File**: `app/robots.ts`
**Issue**: Only disallows /admin and /api/auth
**Fix**: Add broader policy if desired

### Phase 5: Operational Verification

#### Fix H-3: Create CI workflow
**New file**: `.github/workflows/ci.yml`
**Issue**: No CI gate exists
**Fix**: Create GitHub Actions workflow for verification

#### Fix M-10: Node engine requirement
**File**: `package.json`
**Issue**: Requires Node 24.x but running on 22.22.2
**Fix**: Adjust requirement or upgrade runtime

#### Fix M-11: Add coverage reporting
**File**: `vitest.config.ts`
**Issue**: No coverage config
**Fix**: Add coverage reporter and thresholds

#### Fix M-12: Isolated database for public Playwright
**File**: `playwright.config.ts`
**Issue**: Uses shared database
**Fix**: Add isolated DB creation like admin config

#### Fix M-13: Parameterize admin Playwright credentials
**File**: `playwright.admin.config.ts`
**Issue**: Hard-coded localhost credentials
**Fix**: Use environment variables

### Phase 6: Schema/Runtime Alignment

#### Fix M-2: Ingestion status lifecycle
**Files**: `db/schema/content-graph.ts`, `lib/ingestion/`
**Issue**: Schema defines accepted/applied/rejected; runtime only writes applied
**Fix**: Implement full lifecycle or narrow schema

## TODOs

- [x] Fix C-1: Add allowlist check to admin server actions
- [x] Fix H-1: Fix sign-in redirect loop for disallowed sessions
- [x] Fix M-1: Add proxy-trust validation for x-forwarded-for
- [x] Fix M-4: Align bootstrap completion checks
- [x] Fix H-2: Fix taxonomy term exposure
- [x] Fix M-5: Normalize term parameter in collection pages
- [x] Fix M-6: Fix tutorial taxonomy chip routing
- [x] Fix M-7: Escape SQL wildcards in search
- [x] Fix M-3: Normalize unknown-field handling
- [x] Fix M-8: Respect canonicalUrl in sitemap/feeds
- [x] Fix M-9: Fix /api page content
- [x] Fix L-1/L-2: Cache headers and crawl policy
- [x] Fix H-3: Create CI workflow
- [x] Fix M-10: Fix Node engine requirement
- [x] Fix M-11: Add coverage reporting
- [x] Fix M-12: Add isolated DB to public Playwright
- [x] Fix M-13: Parameterize admin Playwright credentials
- [x] Fix M-2: Fix ingestion status lifecycle

## Final Verification Wave
- [x] F1. Verification: All commands pass (lint, typecheck, test, build, e2e, e2e:admin)
- [x] F2. Code Quality: No new TypeScript errors or warnings
- [x] F3. Manual QA: Spot-check fixed issues
- [x] F4. Scope Fidelity: All issues from audit addressed

## Success Criteria
- All Critical and High issues fixed
- All Medium issues fixed or documented with reason
- All verification commands pass
- No regressions in existing functionality
