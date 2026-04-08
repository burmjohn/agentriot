# Latest stack upgrade and code review

## TL;DR
> **Summary**: Upgrade Agent Riot to the latest stable major versions in controlled slices, freezing exact target versions first, then moving runtime/tooling, framework, styling, auth/data, and test harness separately with rollback gates after each slice. Perform a focused code review that only fixes upgrade blockers, deprecated APIs, and compatibility hazards exposed by the version changes.
> **Deliverables**:
> - Frozen version matrix for direct dependencies, devDependencies, Node, pnpm, and PostgreSQL support assumptions
> - Updated `package.json`, lockfile, config files, and any required compatibility code changes
> - Green baseline and post-upgrade verification across lint, typecheck, build, unit tests, public E2E, and admin E2E
> - Upgrade-blocker review findings resolved or explicitly documented
> **Effort**: Large
> **Parallel**: YES - 3 waves
> **Critical Path**: 1 → 2 → 3 → 5 → 6 → 7 → 8 → 9

## Context
### Original Request
Create a plan to make sure all packages and tech are on the latest versions and review the code.

### Interview Summary
- Upgrade target: latest stable majors.
- Review depth: upgrade blockers first.
- Scope includes direct dependencies, direct devDependencies, and core runtime/tooling used by the repo.
- Scope excludes implementation in this session.

### Metis Review (gaps addressed)
- Freeze exact target versions before changing anything; “latest stable” must become a dated matrix.
- Treat missing direct CLI ownership as a blocker: `vitest` is used by scripts/config but is not declared in `package.json:15,32-42`.
- Resolve Better Auth adapter ambiguity before bumping auth packages: `@better-auth/drizzle-adapter` is installed while `lib/auth.ts:1-14` imports `better-auth/adapters/drizzle`.
- Refresh the lockfile after every upgrade slice, not once at the end.
- Keep code review tightly scoped to upgrade blockers, deprecated APIs, and compatibility hazards.

### Oracle Review (architecture risks addressed)
- Isolate four compatibility bands: runtime/tooling, framework, styling, auth/data, and test harness.
- Treat auth and data as separate rollback surfaces even though they interact.
- Explicitly gate `/sign-in`, admin CRUD flows, public read routes, and both Playwright configs after each relevant slice.
- Stop on unexpected SQL churn, auth/session regressions, or test-harness failures before continuing.

## Work Objectives
### Core Objective
Bring the repo to the latest stable major versions for all direct packages and core tooling while preserving public site, admin, auth, data, and test behavior.

### Deliverables
- Updated dependency and tooling versions in `package.json` and `pnpm-lock.yaml`
- Updated compatibility code in framework/auth/data/test configuration hotspots
- Evidence bundle proving baseline and post-upgrade behavior
- Short blocker-review report covering deprecated APIs, hidden dependency reliance, and held-back packages if any

### Definition of Done (verifiable conditions with commands)
- `pnpm install` exits 0 on a clean checkout.
- `pnpm lint` exits 0.
- `pnpm typecheck` exits 0.
- `pnpm build` exits 0.
- `pnpm test` exits 0.
- `pnpm test:e2e` exits 0.
- `pnpm test:e2e:admin` exits 0.
- `pnpm db:migrate` exits 0 on the configured local DB.
- `pnpm db:seed` exits 0 on the configured local DB.
- No direct dependency used by a script or config is missing from `package.json`.
- Any package intentionally not moved to latest stable major is listed in evidence with reason and blocker.

### Must Have
- Exact target versions frozen before upgrades start.
- Per-slice rollback point after each upgrade band.
- Code review limited to upgrade blockers and deprecations.
- Manual verification of sign-in, public graph, and admin browser flows after relevant slices.

### Must NOT Have
- No opportunistic refactors unrelated to compatibility.
- No schema redesign unless forced by upstream migration requirements.
- No CI rollout, infra redesign, or unrelated tech-debt cleanup.
- No silent package additions; every new direct dependency must be justified by a script/config owner.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after using existing repo tooling (`pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, `pnpm test:e2e:admin`)
- QA policy: every task includes command-level happy-path and failure/edge checks.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- Baseline rule: capture pre-upgrade outputs before modifying dependencies.
- Rollback rule: create a commit at the end of every slice; if a slice fails its gate, revert only that slice before investigating.

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: foundation and freeze
- Task 1: freeze target matrix and baseline evidence
- Task 2: normalize tool ownership and runtime/package-manager pins

Wave 2: package upgrade slices
- Task 3: framework band (Next/React/TypeScript/eslint-config-next/@types)
- Task 4: styling band (Tailwind/PostCSS/CSS pipeline)
- Task 5: auth band (Better Auth + route/session compatibility)
- Task 6: data band (Drizzle/postgres/DB scripts)
- Task 7: test harness band (Vitest/Playwright/tsx/config)

Wave 3: stabilization and documentation
- Task 8: upgrade-blocker code review and targeted fixes
- Task 9: docs, environment requirements, and final dependency reconciliation

### Dependency Matrix (full, all tasks)
| Task | Blocks | Blocked By |
|------|--------|------------|
| 1 | 2-9 | none |
| 2 | 3-9 | 1 |
| 3 | 5,7,8,9 | 2 |
| 4 | 8,9 | 3 |
| 5 | 6,8,9 | 3 |
| 6 | 7,8,9 | 5 |
| 7 | 8,9 | 3,6 |
| 8 | 9,F1-F4 | 4,5,6,7 |
| 9 | F1-F4 | 8 |

### Agent Dispatch Summary
| Wave | Task Count | Categories |
|------|------------|------------|
| 1 | 2 | deep, unspecified-high |
| 2 | 5 | deep, unspecified-high, visual-engineering |
| 3 | 2 | unspecified-high, writing |
| Final | 4 | oracle, unspecified-high, deep |

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Freeze the target matrix and baseline the repo

  **What to do**: Create a dated version matrix for all direct dependencies, devDependencies, Node, pnpm, and PostgreSQL assumptions. Use `pnpm outdated --format json`, `node -v`, `pnpm -v`, and package-registry lookups to freeze exact targets before any edits. Run the full current baseline (`lint`, `typecheck`, `build`, `test`, `test:e2e`, `test:e2e:admin`) and capture results, including failures, in evidence. Record current blockers such as missing direct `vitest` ownership and auth adapter ambiguity.
  **Must NOT do**: Do not change package versions or code in this task. Do not start fixing failures here.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: establishes the exact upgrade contract and gates all downstream work.
  - Skills: [`systematic-debugging`] - needed to classify baseline failures and distinguish repo issues from upgrade issues.
  - Omitted: [`docs-writer`] - no repo docs edits yet.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2,3,4,5,6,7,8,9] | Blocked By: []

  **References**:
  - Pattern: `package.json:5-42` - current direct package and script surface.
  - Pattern: `README.md:31-149` - declared local requirements and verification commands.
  - Pattern: `AGENTS.md:135-190` - known commands, anti-patterns, and missing infrastructure.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `.sisyphus/evidence/task-1-version-matrix.json` exists and lists current version, target version, and upgrade band for every direct package plus Node and pnpm.
  - [ ] `.sisyphus/evidence/task-1-baseline.txt` exists and contains exit codes/output for `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, and `pnpm test:e2e:admin`.
  - [ ] `.sisyphus/evidence/task-1-blockers.txt` exists and explicitly records missing direct CLI ownership and auth-adapter ambiguity.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Baseline captured successfully
    Tool: Bash
    Steps: Run `node -v`, `pnpm -v`, `pnpm outdated --format json || true`, then the full verification command set; save outputs to task-1 evidence files.
    Expected: Evidence files exist, commands and exit codes are recorded, and target matrix is frozen before any package change.
    Evidence: .sisyphus/evidence/task-1-version-matrix.json

  Scenario: Missing-owner or pre-existing failure is surfaced, not ignored
    Tool: Bash
    Steps: Validate evidence includes a blocker section; specifically search for `vitest` and Better Auth adapter notes in `task-1-blockers.txt`.
    Expected: Known blockers are explicitly documented; downstream work does not proceed on undocumented ambiguity.
    Evidence: .sisyphus/evidence/task-1-blockers-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: [none]

- [x] 2. Normalize tool ownership and runtime/package-manager pins

  **What to do**: Ensure every CLI used by scripts/config is a direct dependency or devDependency. Add explicit ownership for missing tools (`vitest`, `drizzle-kit`, and any other script-owned package found in Task 1), pin Node/pnpm requirements via repo-visible version metadata if absent, and make clean-install behavior reproducible. Refresh the lockfile after only these changes.
  **Must NOT do**: Do not upgrade framework/auth/data packages yet. Do not mix unrelated code changes into this slice.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: package-manager and script ownership changes are high leverage but relatively contained.
  - Skills: [`test-driven-development`] - use command-first verification before broad upgrades.
  - Omitted: [`requesting-code-review`] - formal review comes after stabilization.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [3,4,5,6,7,8,9] | Blocked By: [1]

  **References**:
  - Pattern: `package.json:6-19` - scripts that define required CLI ownership.
  - Pattern: `vitest.config.ts:1-14` - direct import proving `vitest` must be declared.
  - Pattern: `drizzle.config.ts:1-15` - `drizzle-kit` config proving direct CLI ownership is required.
  - Pattern: `README.md:31-35` - current stated Node/pnpm requirements.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `package.json` directly declares every CLI used by scripts and config imports.
  - [ ] Clean install from a fresh dependency state completes with `pnpm install` exit 0.
  - [ ] Updated Node/pnpm requirements are recorded in repo-visible config or docs and match the chosen target matrix.
  - [ ] `pnpm lint` and `pnpm typecheck` still exit 0 after the lockfile refresh.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Clean install is reproducible
    Tool: Bash
    Steps: Remove install artifacts for the branch workspace as appropriate, run `pnpm install`, then `pnpm lint && pnpm typecheck`.
    Expected: Install succeeds without relying on global CLIs or hidden transitive packages.
    Evidence: .sisyphus/evidence/task-2-clean-install.txt

  Scenario: Missing tool ownership fails loudly before fix
    Tool: Bash
    Steps: Compare Task 1 blockers with post-fix package.json ownership; if a script-owned CLI is still absent, record the mismatch and fail the task.
    Expected: Zero unresolved script-owned CLI gaps remain.
    Evidence: .sisyphus/evidence/task-2-clean-install-error.txt
  ```

  **Commit**: YES | Message: `chore(upgrade): normalize tooling ownership and runtime pins` | Files: [`package.json`, `pnpm-lock.yaml`, `README.md` or version metadata files]

- [x] 3. Upgrade the framework band together

  **What to do**: Upgrade `next`, `react`, `react-dom`, `eslint-config-next`, `typescript`, `@types/react`, `@types/react-dom`, and `@types/node` to the frozen target majors. Reconcile breaking changes in app router behavior, `next typegen`, ESLint integration, and any Next config changes required by the new major.
  **Must NOT do**: Do not touch Better Auth, Drizzle, or Playwright in this task except for compatibility fixes strictly required by the framework bump.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: this is the highest-risk compatibility slice.
  - Skills: [`systematic-debugging`] - necessary for framework regression triage.
  - Omitted: [`docs-writer`] - documentation updates belong later.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [4,5,7,8,9] | Blocked By: [2]

  **References**:
  - Pattern: `package.json:21-42` - current framework and typing versions.
  - Pattern: `next.config.ts:1-7` - `serverExternalPackages` compatibility hotspot.
  - Pattern: `tsconfig.json:2-42` - module resolution, JSX, Next plugin, and generated types include paths.
  - Pattern: `README.md:140-149` - required verification set.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Framework-band packages match the frozen Task 1 matrix.
  - [ ] `pnpm typecheck`, `pnpm lint`, and `pnpm build` exit 0.
  - [ ] No unresolved deprecation errors remain in framework config or route typing.
  - [ ] A rollback commit exists before moving to Task 4.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Framework build and type pipeline passes
    Tool: Bash
    Steps: Run `pnpm typecheck && pnpm lint && pnpm build` after the framework bump.
    Expected: All commands exit 0 and no framework-specific config errors remain.
    Evidence: .sisyphus/evidence/task-3-framework-band.txt

  Scenario: Deprecated or removed Next config/API is caught
    Tool: Bash
    Steps: If build or typecheck fails on Next/React/TypeScript integration, capture the exact failure and block progression until fixed.
    Expected: Any breakage is recorded and resolved inside this task; none is deferred silently.
    Evidence: .sisyphus/evidence/task-3-framework-band-error.txt
  ```

  **Commit**: YES | Message: `chore(upgrade): move framework band to latest majors` | Files: [`package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, related framework-compat files]

- [x] 4. Upgrade the styling band and verify CSS pipeline compatibility

  **What to do**: Upgrade Tailwind/PostCSS-related packages in line with the frozen matrix, then verify global styles, Tailwind plugin wiring, and any CSS pipeline assumptions. Fix only upgrade-induced styling/config breakage.
  **Must NOT do**: Do not redesign visual UI or restyle pages beyond compatibility fixes.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: styling pipeline regressions are easiest to catch with browser verification.
  - Skills: [`systematic-debugging`] - needed if PostCSS/Tailwind behavior changes.
  - Omitted: [`frontend-design`] - this is compatibility, not redesign.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [8,9] | Blocked By: [3]

  **References**:
  - Pattern: `package.json:33-40` - current Tailwind/PostCSS dev dependencies.
  - Pattern: `postcss.config.mjs:1-7` - current plugin wiring.
  - Pattern: `app/globals.css` - primary CSS entrypoint to verify after the bump.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Tailwind/PostCSS packages match the frozen matrix.
  - [ ] `pnpm build` exits 0 with the updated styling stack.
  - [ ] Home page and one public detail page render with expected styles and no CSS pipeline errors.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Public styling renders after upgrade
    Tool: Playwright
    Steps: Start the app, open `/` and one public detail route such as `/agents` or `/articles`, inspect for missing styles and console errors, take screenshots.
    Expected: Styled layout loads; no broken CSS import or plugin errors appear.
    Evidence: .sisyphus/evidence/task-4-styling-band.png

  Scenario: CSS pipeline failure is surfaced
    Tool: Bash
    Steps: Run `pnpm build` immediately after the styling bump and capture any PostCSS/Tailwind plugin errors before further tasks proceed.
    Expected: Either clean build or explicit captured failure resolved within this task.
    Evidence: .sisyphus/evidence/task-4-styling-band-error.txt
  ```

  **Commit**: YES | Message: `chore(upgrade): move styling band to latest majors` | Files: [`package.json`, `pnpm-lock.yaml`, `postcss.config.mjs`, `app/globals.css` if needed]

- [x] 5. Upgrade Better Auth and harden auth compatibility hotspots

  **What to do**: Resolve the adapter ambiguity, upgrade `better-auth` and `@better-auth/drizzle-adapter` according to the frozen matrix, then reconcile auth route, client/server session access, env expectations, and any required Next integration changes. Confirm sign-in and admin session guard flows still behave correctly.
  **Must NOT do**: Do not change auth product behavior, allowlist policy, or password policy except when required by upstream compatibility.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: auth failures cut across route handlers, server components, env config, and DB adapter behavior.
  - Skills: [`systematic-debugging`] - necessary for route/session regression isolation.
  - Omitted: [`docs-writer`] - docs updates come in Task 9.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [6,8,9] | Blocked By: [3]

  **References**:
  - Pattern: `lib/auth.ts:1-42` - current Better Auth construction and drizzle adapter use.
  - Pattern: `app/api/auth/[...all]/route.ts:1-4` - Next route handler bridge.
  - Pattern: `lib/auth/server.ts:1-25` - session and redirect behavior.
  - Pattern: `lib/env.ts:11-39` - auth URL/secret/env contract.
  - Pattern: `next.config.ts:3-5` - `serverExternalPackages` Better Auth hotspot.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Auth-band packages match the frozen matrix.
  - [ ] `/sign-in` loads and admin sign-in flow succeeds with seeded allowed credentials.
  - [ ] Protected admin route still redirects unauthenticated users to `/sign-in`.
  - [ ] `pnpm build`, `pnpm typecheck`, and `pnpm test:e2e:admin` exit 0.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Auth flow works after upgrade
    Tool: Playwright
    Steps: Start admin test stack, open `/sign-in`, complete the seeded admin auth flow, then navigate to `/admin`.
    Expected: Session is created, admin route loads, and no auth integration errors appear.
    Evidence: .sisyphus/evidence/task-5-auth-band.png

  Scenario: Unauthenticated admin access still redirects
    Tool: Playwright
    Steps: Open `/admin` in a fresh browser context without signing in.
    Expected: Redirect lands on `/sign-in` and protected content is not shown.
    Evidence: .sisyphus/evidence/task-5-auth-band-error.png
  ```

  **Commit**: YES | Message: `chore(upgrade): move auth band to latest majors` | Files: [`package.json`, `pnpm-lock.yaml`, `lib/auth.ts`, `lib/auth/server.ts`, `app/api/auth/[...all]/route.ts`, `lib/env.ts`, `next.config.ts`]

- [x] 6. Upgrade the data band and preserve DB script behavior

  **What to do**: Upgrade `drizzle-orm`, add or upgrade `drizzle-kit` as a direct owner, upgrade `postgres`, and reconcile connection/config behavior, migration execution, seed execution, and schema compatibility. If upstream changes generate SQL churn, review it explicitly and stop unless it is required and understood.
  **Must NOT do**: Do not accept unexplained migration diffs. Do not redesign schema names or data model relationships.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: ORM/driver/config changes can silently affect auth and migrations.
  - Skills: [`systematic-debugging`] - needed for migration and connection failures.
  - Omitted: [`test-driven-development`] - database script verification is command-first, not unit-first.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [7,8,9] | Blocked By: [5]

  **References**:
  - Pattern: `db/index.ts:1-25` - postgres-js client and drizzle initialization.
  - Pattern: `drizzle.config.ts:1-15` - migration config and default DB URL.
  - Pattern: `db/schema/index.ts` - schema barrel expected by drizzle.
  - Pattern: `README.md:72-90` - migration and seed workflow.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Data-band packages match the frozen matrix.
  - [ ] `pnpm db:migrate` exits 0 on a clean local DB.
  - [ ] `pnpm db:seed` exits 0 after migration.
  - [ ] No unexpected SQL diff is accepted without explanation in evidence.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Migration and seed pipeline works
    Tool: Bash
    Steps: Run `pnpm db:migrate && pnpm db:seed` against the configured local database and save logs.
    Expected: Both commands exit 0 and seeded data is ready for app/tests.
    Evidence: .sisyphus/evidence/task-6-data-band.txt

  Scenario: Unexpected migration churn is blocked
    Tool: Bash
    Steps: If upgrading Drizzle/driver causes generated SQL or snapshot changes, diff them and capture rationale before allowing the task to pass.
    Expected: Unexplained SQL churn fails the task and is documented.
    Evidence: .sisyphus/evidence/task-6-data-band-error.txt
  ```

  **Commit**: YES | Message: `chore(upgrade): move data band to latest majors` | Files: [`package.json`, `pnpm-lock.yaml`, `db/index.ts`, `drizzle.config.ts`, `db/schema/**`, `drizzle/**` if intentionally changed]

- [x] 7. Upgrade the test harness and make verification reproducible

  **What to do**: Upgrade `@playwright/test`, `vitest`, `tsx`, and any test-only companions to the frozen matrix. Reconcile config differences, browser test startup behavior, seeded DB assumptions, reporters, and any harness API changes. Keep the harness isolated from app logic fixes unless a harness break exposes an actual upgrade blocker.
  **Must NOT do**: Do not rewrite broad test coverage. Do not add unrelated new test suites.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: harness issues are technical but bounded once app/data are stable.
  - Skills: [`playwright-expert`] - needed for Playwright config and browser-runner regressions.
  - Omitted: [`frontend-design`] - no UI redesign.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [8,9] | Blocked By: [3,6]

  **References**:
  - Pattern: `vitest.config.ts:1-14` - current unit test config.
  - Pattern: `playwright.config.ts:3-29` - public browser test startup.
  - Pattern: `playwright.admin.config.ts:3-37` - admin browser test startup and isolated DB setup.
  - Test: `tests/e2e/admin-auth.spec.ts` - admin auth smoke anchor.
  - Test: `tests/e2e/public-graph.spec.ts` - public graph smoke anchor.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `pnpm test` exits 0.
  - [ ] `pnpm test:e2e` exits 0.
  - [ ] `pnpm test:e2e:admin` exits 0.
  - [ ] Playwright and Vitest configs remain aligned with the upgraded package APIs.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Full test harness passes
    Tool: Bash
    Steps: Run `pnpm test && pnpm test:e2e && pnpm test:e2e:admin` after harness upgrades.
    Expected: All three commands exit 0.
    Evidence: .sisyphus/evidence/task-7-test-harness.txt

  Scenario: Public/admin harness failures are isolated
    Tool: Bash
    Steps: If one Playwright config fails and the other passes, capture which config, startup command, and route failed before proceeding.
    Expected: Harness-specific failures are documented and fixed in this task rather than misattributed to unrelated slices.
    Evidence: .sisyphus/evidence/task-7-test-harness-error.txt
  ```

  **Commit**: YES | Message: `chore(upgrade): move test harness to latest majors` | Files: [`package.json`, `pnpm-lock.yaml`, `vitest.config.ts`, `playwright.config.ts`, `playwright.admin.config.ts`, test helpers if required]

- [x] 8. Perform the upgrade-blocker code review and remediate compatibility hazards

  **What to do**: Review only the hotspot files and warnings exposed by Tasks 1-7. Fix deprecated APIs, implicit dependency reliance, type suppressions or config mismatches that now block the upgraded stack. Produce a short evidence report listing what was fixed, what remains, and why any remaining issue is non-blocking.
  **Must NOT do**: Do not broaden into general refactoring, UI polish, or unrelated architecture cleanup.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requires judgment across framework/auth/data/test seams while staying tightly scoped.
  - Skills: [`requesting-code-review`] - helpful for final blocker-focused review discipline.
  - Omitted: [`docs-writer`] - docs come after blocker remediation.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [9,F1,F2,F3,F4] | Blocked By: [4,5,6,7]

  **References**:
  - Pattern: `next.config.ts:1-7` - Next compatibility hotspot.
  - Pattern: `lib/auth.ts:1-42` - Better Auth hotspot.
  - Pattern: `lib/auth/server.ts:1-25` - session/redirect hotspot.
  - Pattern: `db/index.ts:1-25` - data-layer hotspot.
  - Pattern: `playwright.admin.config.ts:19-29` - startup pipeline hotspot.
  - Pattern: `vitest.config.ts:1-14` - direct test CLI hotspot.
  - Pattern: `AGENTS.md:178-188` - existing technical-debt and infrastructure notes.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `.sisyphus/evidence/task-8-blocker-review.md` exists and lists blocker findings, fixes, and any consciously deferred non-blockers.
  - [ ] No deprecated or incompatible API usage remains in the hotspot files unless documented with a hold-back reason.
  - [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` still exit 0 after blocker fixes.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Blocker review produces actionable output
    Tool: Bash
    Steps: Re-run hotspot-focused grep/search and the core verification commands after fixes; summarize findings in task-8 evidence.
    Expected: Evidence clearly distinguishes fixed blockers from acceptable non-blockers.
    Evidence: .sisyphus/evidence/task-8-blocker-review.md

  Scenario: Hidden blocker remains after review
    Tool: Bash
    Steps: If core verification fails after the review pass, capture the failure and keep the task open until it is either fixed or explicitly tied to a held-back package with rationale.
    Expected: No unresolved blocker is silently passed to final verification.
    Evidence: .sisyphus/evidence/task-8-blocker-review-error.txt
  ```

  **Commit**: YES | Message: `fix(upgrade): remove upgrade blockers and deprecated usage` | Files: [hotspot config/auth/data/test files changed by review]

- [ ] 9. Reconcile docs, environment requirements, and final dependency state

  **What to do**: Update docs and setup instructions to match the upgraded stack, including Node/pnpm requirements, any changed local setup commands, and any intentionally held-back packages. Reconcile `package.json`, `pnpm-lock.yaml`, and setup docs so a new contributor can install and run the repo from scratch. Then run the full verification set one final time.
  **Must NOT do**: Do not add CI/CD or deployment work. Do not claim unsupported environments.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: this task is mostly reconciliation, docs accuracy, and final verification reporting.
  - Skills: [`docs-writer`] - needed for precise markdown and setup documentation updates.
  - Omitted: [`frontend-design`] - not a UI task.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [F1,F2,F3,F4] | Blocked By: [8]

  **References**:
  - Pattern: `README.md:29-149` - setup, run, and verification instructions.
  - Pattern: `package.json:5-42` - package manager and scripts.
  - Pattern: `AGENTS.md:135-190` - commands and infrastructure notes.

  **Acceptance Criteria** (agent-executable only):
  - [ ] README/setup docs reflect the upgraded Node/pnpm/dependency requirements.
  - [ ] Any held-back package is documented with reason and blocker.
  - [ ] Final full verification set exits 0.
  - [ ] `.sisyphus/evidence/task-9-final-verification.txt` exists with command outputs.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Fresh setup instructions match reality
    Tool: Bash
    Steps: Follow the updated local install/build/test instructions in a clean branch workspace and record outputs.
    Expected: Instructions are sufficient to install, migrate, seed, and verify the repo without hidden steps.
    Evidence: .sisyphus/evidence/task-9-final-verification.txt

  Scenario: Documentation lags actual stack changes
    Tool: Bash
    Steps: Compare updated docs against current `package.json`, scripts, and runtime requirements; capture mismatches if any remain.
    Expected: Zero doc-to-repo mismatches remain.
    Evidence: .sisyphus/evidence/task-9-final-verification-error.txt
  ```

  **Commit**: YES | Message: `docs(upgrade): reconcile setup and verification docs` | Files: [`README.md`, `AGENTS.md` if needed, `package.json`, `pnpm-lock.yaml`]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright because public/admin/auth flows are user-facing)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commit once per task; do not batch multiple upgrade slices into one commit.
- Required checkpoint commits after Tasks 2, 3, 5, 6, 7, 8, and 9.
- If a slice fails its gate, revert only that slice’s commit(s) before retrying.
- Keep `pnpm-lock.yaml` synchronized with every package update commit.

## Success Criteria
- Exact target versions are frozen, implemented, and verified.
- Public site, admin auth, admin CRUD/browser flows, and public API flows still work.
- No script-owned CLI is missing from direct dependencies.
- No unexplained SQL churn or auth/session regression ships.
- Full verification set passes on the upgraded stack.
