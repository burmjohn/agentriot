# GitHub CI, GHCR publishing, and Coolify image handoff

## TL;DR
> **Summary**: Move the repo from "no CI + Coolify source Dockerfile builds"
> to "GitHub Actions validates the repo, publishes immutable GHCR images from
> protected `main`, and Coolify consumes those images as the only deployable
> artifact."
> **Deliverables**:
> - a stateless runtime image contract for deployment
> - a GitHub Actions workflow that validates PRs and gates main-only publish
> - GHCR image publishing with immutable SHA tags
> - documented Coolify runtime, migration, and rollback handoff
> **Effort**: Medium
> **Parallel**: YES - 2 waves
> **Critical Path**: 2 → 3 → 4 → 5 → 6

## Context
### Original Request
Set this repository up to use GitHub for CI so Docker images are built there,
then have Coolify deploy from those built images.

### Interview Summary
- Registry: GHCR
- GitHub scope: build and push only; no deploy trigger from GitHub
- Heavy E2E policy: run only on `main`
- Production image gate: protected `main` only

### Metis Review (gaps addressed)
- Eliminated dual artifact paths by making GHCR the only deployable artifact
  contract
- Chose immutable `sha-<shortsha>` tags as the production handoff unit
- Chose operator-run migrations outside normal container startup
- Chose to remove stale source-build repo config rather than leave conflicting
  Coolify instructions in place
- Deferred Next.js standalone output and multi-arch publishing to avoid scope
  creep in the first pass

## Work Objectives
### Core Objective
Create a repo-backed delivery contract where pull requests get fast validation,
`main` gets deeper validation plus image publication, and Coolify consumes the
published GHCR image instead of rebuilding source.

### Deliverables
- `.dockerignore` and a deployment-safe `Dockerfile`
- `.github/workflows/ci.yml` with PR validation, main-only E2E, and GHCR publish
- removal of stale repo-side source-build Coolify config
- deployment runbook covering GitHub variables, Coolify runtime env, migration
  procedure, image selection, and rollback

### Definition of Done (verifiable conditions with commands)
- `docker build -t agentriot:ci .` succeeds from repo root
- `grep -n 'CMD \["pnpm", "start"\]' Dockerfile` returns a match
- `test -f .github/workflows/ci.yml` succeeds
- `grep -n 'pnpm lint' .github/workflows/ci.yml` returns a match
- `grep -n 'pnpm typecheck' .github/workflows/ci.yml` returns a match
- `grep -n 'pnpm build' .github/workflows/ci.yml` returns a match
- `grep -n 'pnpm test' .github/workflows/ci.yml` returns a match
- `grep -n 'pnpm test:e2e' .github/workflows/ci.yml` returns a match
- `grep -n 'pnpm test:e2e:admin' .github/workflows/ci.yml` returns a match
- `grep -n 'docker/build-push-action@v7' .github/workflows/ci.yml` returns a
  match
- `grep -n 'type=sha' .github/workflows/ci.yml` returns a match
- `test ! -f coolify.json` succeeds
- `grep -n '/api/health' README.md docs/deployment/coolify-ghcr.md` returns a
  match

### Must Have
- PR workflow runs lint, typecheck, unit tests, Next build, and Docker build
  without publishing images
- `main` workflow runs both Playwright suites before any GHCR publish step
- GHCR publish job uses minimal permissions and no Coolify webhook/API call
- Runtime image starts the app only; it does not auto-run DB migrations
- Repo docs define exact ownership for build-time variables vs runtime secrets
- Coolify deploy contract points at GHCR image tags, not repo source builds

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No GitHub-triggered deploy webhook, API call, or Coolify mutation
- No `latest` tag as the production contract
- No runtime secrets passed as Docker build args
- No silent support for both source-build and GHCR deploy models in parallel
- No Next.js standalone migration, multi-arch, SBOM/signing, or staging system
  added in this first pass

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after using existing repo commands and shell assertions
- QA policy: every task includes at least one happy-path and one failure/edge
  verification scenario
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: task 1 (container contract), task 2 (workflow scaffold), task 3
(validate job)

Wave 2: task 4 (main-only E2E gates), task 5 (GHCR publish), task 6
(Coolify handoff docs + stale config removal)

### Dependency Matrix (full, all tasks)
| Task | Depends on | Blocks |
|---|---|---|
| 1 | none | 6, F1-F4 |
| 2 | none | 3, 4, 5, F1-F4 |
| 3 | 2 | 4, 5, F1-F4 |
| 4 | 2, 3 | 5, F1-F4 |
| 5 | 2, 3, 4 | 6, F1-F4 |
| 6 | 1, 5 | F1-F4 |
| F1-F4 | 1-6 | completion |

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 3 tasks → `unspecified-high`, `unspecified-high`,
  `unspecified-high`
- Wave 2 → 3 tasks → `unspecified-high`, `unspecified-high`, `writing`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Make the runtime image stateless and trim Docker build context

  **What to do**: Add a root `.dockerignore` that excludes generated and local
  development artifacts (`.git/`, `.next/`, `node_modules/`, `.sisyphus/`,
  `playwright-report/`, `test-results/`, `.gstack/`, `.playwright-mcp/`, and
  other non-runtime build outputs). Update `Dockerfile` so the final `CMD`
  starts the app with `pnpm start` only. Keep the existing multi-stage layout,
  Node 24 base image, pnpm pin, `.next` copy strategy, and exposed port 3000.
  Do not adopt Next.js standalone output in this pass.

  **Must NOT do**: Do not add `latest`-specific runtime behavior, do not pass
  runtime secrets as `ARG`, do not add multi-arch or distroless changes, and do
  not leave `pnpm migrate && pnpm start` in the final container command.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: touches deploy artifact contract and
    Docker behavior that all later CI work depends on
  - Skills: `[]` - No extra skill is required beyond careful file editing and
    verification
  - Omitted: [`test-driven-development`] - Not needed because this is workflow
    and container contract work, not application feature logic

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 6, F1-F4 |
  Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `Dockerfile:1-39` - current multi-stage image, Node/pnpm pin, and
    legacy runtime command to replace
  - API/Type: `package.json:5-25` - authoritative Node, pnpm, build, migrate,
    start, and test commands
  - API/Type: `next.config.ts:1-7` - confirms standalone output is not currently
    enabled and should remain deferred in this pass
  - Test: `app/api/health/route.ts:1-41` - existing health endpoint that the
    deployment runbook should continue using
  - Test: `tests/health-route.test.ts:16-46` - current health route contract and
    failure behavior

  **Acceptance Criteria** (agent-executable only):
  - [ ] `test -f .dockerignore`
  - [ ] `grep -n 'CMD \["pnpm", "start"\]' Dockerfile`
  - [ ] `! grep -n 'pnpm migrate && pnpm start' Dockerfile`
  - [ ] `docker build -t agentriot:ci .`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Build the deployable image successfully
    Tool: Bash
    Steps: Run `docker build -t agentriot:ci .` from repo root.
    Expected: Build completes successfully and emits a final image tag
      `agentriot:ci`.
    Evidence: .sisyphus/evidence/task-1-container-contract.log

  Scenario: Verify the legacy migration-on-startup contract is gone
    Tool: Bash
    Steps: Run `grep -n 'pnpm migrate && pnpm start' Dockerfile`.
    Expected: Command returns no matches and a non-zero exit code.
    Evidence: .sisyphus/evidence/task-1-container-contract-no-migrate.txt
  ```

  **Commit**: YES | Message: `build(container): make runtime image stateless` |
  Files: `Dockerfile`, `.dockerignore`

- [x] 2. Create the GitHub Actions workflow scaffold and shared CI environment

  **What to do**: Create `.github/workflows/ci.yml` as the single workflow for
  PR validation, main-only E2E, and main-only GHCR publish. Add triggers for
  `pull_request` and `push` to `main`, set workflow-level concurrency to cancel
  superseded runs on the same ref, and define shared env values for Node 24,
  pnpm 10.33.0, and the required build-time URLs. Use repository variables for
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, and `BETTER_AUTH_URL`; if the
  workflow needs a non-secret fallback for CI-only validation, use the same
  public placeholder domain from `.env.example`, not localhost. Keep write
  permissions out of the top-level workflow.

  **Must NOT do**: Do not split this into multiple workflows in the first pass,
  do not add any Coolify API call, and do not define package write permissions
  at the workflow root.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: establishes the top-level CI contract
    and shared workflow policy used by all later jobs
  - Skills: `[]` - Native workflow editing is sufficient
  - Omitted: [`docs-writer`] - This task is workflow authoring, not
    documentation

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4, 5, F1-F4 |
  Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `.github/workflows/` - directory exists and is currently empty;
    this workflow becomes the repo CI entrypoint
  - API/Type: `package.json:5-25` - authoritative engine and script contract for
    workflow commands
  - API/Type: `.env.example:3-20` - required non-local env variable names and
    the public placeholder domain to reuse for CI fallback values
  - API/Type: `lib/env.ts:11-39` - env schema showing build-time URL variables
    and localhost defaults that must not leak into publishable images
  - External: `https://github.com/docker/build-push-action` - canonical GitHub
    Action for Docker builds used later in the workflow

  **Acceptance Criteria** (agent-executable only):
  - [ ] `test -f .github/workflows/ci.yml`
  - [ ] `grep -n 'pull_request:' .github/workflows/ci.yml`
  - [ ] `grep -n 'push:' .github/workflows/ci.yml`
  - [ ] `grep -n 'concurrency:' .github/workflows/ci.yml`
  - [ ] `grep -n 'NEXT_PUBLIC_SITE_URL' .github/workflows/ci.yml`
  - [ ] `grep -n 'BETTER_AUTH_URL' .github/workflows/ci.yml`
  - [ ] `! grep -n '^permissions:.*write' .github/workflows/ci.yml`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Confirm the workflow is wired for both PRs and main pushes
    Tool: Bash
    Steps: Run `grep -n 'pull_request:' .github/workflows/ci.yml && grep -n 'push:' .github/workflows/ci.yml && grep -n 'main' .github/workflows/ci.yml`.
    Expected: All three patterns are present in the workflow file.
    Evidence: .sisyphus/evidence/task-2-workflow-scaffold.txt

  Scenario: Confirm no global write permission exists
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('.github/workflows/ci.yml').read_text()
header = text.split('\njobs:\n', 1)[0]
assert 'packages: write' not in header
print('ok')
PY`.
    Expected: The workflow header contains no package write permission; any write permission is job-scoped only.
    Evidence: .sisyphus/evidence/task-2-workflow-permissions.txt
  ```

  **Commit**: YES | Message: `ci(workflow): add shared workflow scaffold` |
  Files: `.github/workflows/ci.yml`

- [x] 3. Implement the fast validation job for pull requests and main pushes

  **What to do**: In `.github/workflows/ci.yml`, add a `validate` job that
  checks out the repo, sets up Node 24 with pnpm 10.33.0, installs dependencies
  with `pnpm install --frozen-lockfile`, and then runs exactly these commands in
  order: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and
  `docker build -t agentriot:ci .`. The same job must run for PRs and pushes to
  `main`. Keep it publish-free. Build-time URL env must be available to
  `pnpm typecheck` and `pnpm build`, because `lib/env.ts` defaults are only safe
  for local development.

  **Must NOT do**: Do not add Playwright to this job, do not publish images, do
  not skip the Docker build, and do not reorder the commands so the cheapest
  checks run after the expensive ones.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: defines the fast feedback contract
    that every contributor will hit on PRs
  - Skills: `[]` - Standard workflow editing and shell verification only
  - Omitted: [`playwright-expert`] - Playwright is intentionally excluded from
    this fast path

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5, F1-F4 |
  Blocked By: 2

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `package.json:10-25` - exact repo scripts to call in CI
  - API/Type: `scripts/typecheck.ts:65-79` - shows `pnpm typecheck` runs `next
    typegen` before `tsc --noEmit`, so the job must provide app env values
  - API/Type: `vitest.config.ts:4-14` - unit test scope is `tests/**/*.test.ts`
  - API/Type: `Dockerfile:1-39` - validation job must prove the deploy artifact
    can build on CI runners
  - API/Type: `lib/env.ts:12-39` - build/typecheck env variables required in CI

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n 'pnpm lint' .github/workflows/ci.yml`
  - [ ] `grep -n 'pnpm typecheck' .github/workflows/ci.yml`
  - [ ] `grep -n 'pnpm test' .github/workflows/ci.yml`
  - [ ] `grep -n 'pnpm build' .github/workflows/ci.yml`
  - [ ] `grep -n 'docker build -t agentriot:ci .' .github/workflows/ci.yml`
  - [ ] `grep -n 'validate:' .github/workflows/ci.yml`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Verify the validate job contains the full fast-check command chain
    Tool: Bash
    Steps: Run `grep -n 'pnpm lint' .github/workflows/ci.yml && grep -n 'pnpm typecheck' .github/workflows/ci.yml && grep -n 'pnpm test' .github/workflows/ci.yml && grep -n 'pnpm build' .github/workflows/ci.yml && grep -n 'docker build -t agentriot:ci .' .github/workflows/ci.yml`.
    Expected: Every command is present in the workflow file exactly once in the validate path.
    Evidence: .sisyphus/evidence/task-3-validate-job.txt

  Scenario: Verify PR validation does not publish images
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('.github/workflows/ci.yml').read_text()
start = text.index('validate:')
tail = text[start:]
markers = [m for m in ('\n  e2e-public:', '\n  e2e-admin:', '\n  publish-image:') if m in tail]
end = min((tail.index(m) for m in markers), default=len(tail))
segment = tail[:end]
for forbidden in ('docker/login-action', 'docker/build-push-action', 'packages: write'):
    assert forbidden not in segment, forbidden
print('ok')
PY`.
    Expected: The `validate` job contains no registry login, no push step, and no package write permission.
    Evidence: .sisyphus/evidence/task-3-validate-no-publish.txt
  ```

  **Commit**: YES | Message: `ci(validate): add pull request validation job` |
  Files: `.github/workflows/ci.yml`

- [x] 4. Add main-only Playwright gates with PostgreSQL-backed public and admin jobs

  **What to do**: In `.github/workflows/ci.yml`, add two jobs that run only on
  `push` events for `refs/heads/main`: `e2e-public` and `e2e-admin`. Both jobs
  must depend on `validate`, use an Ubuntu runner with a PostgreSQL service
  container on port 5432, install `postgresql-client` before Playwright runs,
  and reuse the same Node/pnpm/dependency installation pattern as `validate`.
  `e2e-public` runs `pnpm test:e2e`. `e2e-admin` runs `pnpm test:e2e:admin` and
  must stay serial because the repo config forces `workers: 1`. Both jobs must
  receive build/runtime URL env values that point at the job-local app URL, just
  like the local Playwright configs do.

  **Must NOT do**: Do not run either Playwright job on PRs, do not publish from
  these jobs, do not remove the isolated admin database behavior, and do not run
  the admin suite in parallel.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: CI + database service + Playwright
    orchestration is a multi-system workflow change
  - Skills: `[]` - Standard workflow work; no repo code changes outside config
    are required
  - Omitted: [`playwright-expert`] - Existing Playwright configs already define
    the correct local app contracts and should be reused, not redesigned

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5, F1-F4 |
  Blocked By: 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `playwright.config.ts:3-37` - public Playwright port, env shaping,
    migrate/seed/dev startup, and CI reporter behavior
  - Pattern: `playwright.admin.config.ts:3-37` - isolated admin DB, port 3012,
    serial worker model, and `dropdb`/`createdb` dependency on postgres client
  - API/Type: `package.json:20-24` - exact Playwright commands to call
  - API/Type: `.env.example:3-20` - env variable names still required when the
    app boots inside Playwright jobs
  - Test: `README.md:129-149` - existing documented verification contract already
    includes both Playwright suites

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n 'e2e-public:' .github/workflows/ci.yml`
  - [ ] `grep -n 'e2e-admin:' .github/workflows/ci.yml`
  - [ ] `grep -n 'pnpm test:e2e' .github/workflows/ci.yml`
  - [ ] `grep -n 'pnpm test:e2e:admin' .github/workflows/ci.yml`
  - [ ] `grep -n 'postgres' .github/workflows/ci.yml`
  - [ ] `grep -n 'postgresql-client' .github/workflows/ci.yml`
  - [ ] `grep -n 'refs/heads/main' .github/workflows/ci.yml`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Confirm main-only E2E jobs are present and database-backed
    Tool: Bash
    Steps: Run `grep -n 'pnpm test:e2e' .github/workflows/ci.yml && grep -n 'pnpm test:e2e:admin' .github/workflows/ci.yml && grep -n 'postgresql-client' .github/workflows/ci.yml`.
    Expected: Both Playwright commands and the postgres client install step are present.
    Evidence: .sisyphus/evidence/task-4-e2e-jobs.txt

  Scenario: Confirm Playwright jobs do not run on PRs
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('.github/workflows/ci.yml').read_text()
for job in ('e2e-public:', 'e2e-admin:'):
    start = text.index(job)
    tail = text[start:]
    next_jobs = [m for m in ('\n  publish-image:', '\n  e2e-admin:') if m in tail[1:]]
    end = min([tail[1:].index(m) + 1 for m in next_jobs], default=len(tail))
    segment = tail[:end]
    assert "github.event_name == 'push'" in segment
    assert "github.ref == 'refs/heads/main'" in segment
print('ok')
PY`.
    Expected: Each E2E job is explicitly restricted to push events on `main`.
    Evidence: .sisyphus/evidence/task-4-e2e-main-only.txt
  ```

  **Commit**: YES | Message: `ci(e2e): gate main publishes behind playwright jobs` |
  Files: `.github/workflows/ci.yml`

- [x] 5. Publish immutable GHCR images from `main` only after all gates pass

  **What to do**: In `.github/workflows/ci.yml`, add a `publish-image` job that
  runs only on `push` to `main`, depends on `validate`, `e2e-public`, and
  `e2e-admin`, and is the only job with `packages: write`. Use
  `docker/login-action@v4` with `GITHUB_TOKEN`, `docker/setup-buildx-action@v4`,
  `docker/metadata-action@v6`, and `docker/build-push-action@v7`. Publish to
  `ghcr.io/<owner>/agentriot` with immutable SHA tags only using the metadata
  action `type=sha` strategy with a `sha-` prefix. Do not emit `latest`. Record
  the resulting image reference and digest in the job summary or explicit step
  output so operators can copy the exact artifact into Coolify.

  **Must NOT do**: Do not publish on PRs, do not trigger Coolify, do not expose
  a PAT when `GITHUB_TOKEN` is enough, and do not make `main` or `latest` the
  production handoff contract.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: registry publishing is the critical
    production artifact step and must be exact
  - Skills: `[]` - The job is a standard GH Actions + Docker publishing change
  - Omitted: [`ship`] - This task is CI configuration, not a user-requested git
    shipping workflow

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6, F1-F4 |
  Blocked By: 2, 3, 4

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `Dockerfile:1-39` - the publish job builds the exact deployable
    artifact defined here
  - API/Type: `package.json:2-9` - image name should stay aligned with repo/app
    identity and pinned engine expectations
  - API/Type: `lib/env.ts:12-39` - publish job must provide explicit build-time
    URL values so the resulting image does not bake localhost defaults
  - External: `https://github.com/docker/login-action` - canonical registry
    login action for GHCR auth
  - External: `https://github.com/docker/metadata-action` - canonical tag/label
    generation action for SHA-tag publishing
  - External: `https://github.com/docker/build-push-action` - canonical Docker
    build/push action for GHCR publishing

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n 'docker/login-action@v4' .github/workflows/ci.yml`
  - [ ] `grep -n 'docker/setup-buildx-action@v4' .github/workflows/ci.yml`
  - [ ] `grep -n 'docker/metadata-action@v6' .github/workflows/ci.yml`
  - [ ] `grep -n 'docker/build-push-action@v7' .github/workflows/ci.yml`
  - [ ] `grep -n 'packages: write' .github/workflows/ci.yml`
  - [ ] `grep -n 'type=sha' .github/workflows/ci.yml`
  - [ ] `! grep -n 'latest' .github/workflows/ci.yml`
  - [ ] `! grep -n 'COOLIFY' .github/workflows/ci.yml`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Confirm publish uses the expected GHCR action chain
    Tool: Bash
    Steps: Run `grep -n 'docker/login-action@v4' .github/workflows/ci.yml && grep -n 'docker/setup-buildx-action@v4' .github/workflows/ci.yml && grep -n 'docker/metadata-action@v6' .github/workflows/ci.yml && grep -n 'docker/build-push-action@v7' .github/workflows/ci.yml`.
    Expected: All four actions appear in the publish job.
    Evidence: .sisyphus/evidence/task-5-ghcr-actions.txt

  Scenario: Confirm publish stays artifact-only and never deploys
    Tool: Bash
    Steps: Run `! grep -n 'COOLIFY\|webhook\|curl' .github/workflows/ci.yml`.
    Expected: No match appears, proving GitHub stops at image publication.
    Evidence: .sisyphus/evidence/task-5-no-deploy-hook.txt
  ```

  **Commit**: YES | Message: `ci(release): publish immutable ghcr images` |
  Files: `.github/workflows/ci.yml`

- [x] 6. Replace repo-side source-build guidance with a GHCR-to-Coolify runbook

  **What to do**: Remove `coolify.json` so the repo no longer advertises a
  source-build deployment model that conflicts with GHCR publishing. Update
  `README.md` and add `docs/deployment/coolify-ghcr.md` to document the new
  contract: GitHub validates and publishes images, Coolify pulls a GHCR image by
  immutable `sha-<shortsha>` tag, GitHub repository variables provide build-time
  public URLs, and Coolify runtime env provides `DATABASE_URL`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `API_KEY_ENCRYPTION_KEY`,
  `ADMIN_EMAIL_ALLOWLIST`, and matching public URL values. The runbook must also
  define the migration procedure: before first cutover and before any
  schema-changing release, run `pnpm migrate` once against the target image and
  runtime env, then start the app normally with `pnpm start`. Document rollback
  as selecting the previous immutable GHCR SHA tag.

  **Must NOT do**: Do not leave `coolify.json` behind as stale source of truth,
  do not instruct operators to deploy `latest`, do not claim GitHub deploys the
  app, and do not leave migration ownership implicit.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: this task is primarily operator-facing
    documentation and handoff clarity
  - Skills: [`docs-writer`] - Needed to keep README and deployment doc language
    precise and operationally clear
  - Omitted: [`frontend-design`] - No UI work is involved

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: F1-F4 | Blocked By:
  1, 5

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `coolify.json:1-12` - stale source-build config to remove because it
    conflicts with the new GHCR artifact contract
  - Pattern: `README.md:43-63` - current env setup section that needs deployment
    ownership clarification
  - Pattern: `README.md:129-160` - current verification and next-steps sections
    that need CI/deploy updates
  - API/Type: `.env.example:3-20` - authoritative env variable names for docs
  - API/Type: `lib/env.ts:12-39` - documents why explicit build-time URL values
    and runtime auth URL values both matter
  - Test: `app/api/health/route.ts:7-40` - exact HTTP health endpoint to use in
    the runbook and Coolify health checks
  - Test: `tests/health-route.test.ts:16-46` - proves the expected `200` and
    `503` health behaviors the runbook should describe

  **Acceptance Criteria** (agent-executable only):
  - [ ] `test ! -f coolify.json`
  - [ ] `test -f docs/deployment/coolify-ghcr.md`
  - [ ] `grep -n 'GHCR' README.md docs/deployment/coolify-ghcr.md`
  - [ ] `grep -n 'sha-' README.md docs/deployment/coolify-ghcr.md`
  - [ ] `grep -n 'pnpm migrate' README.md docs/deployment/coolify-ghcr.md`
  - [ ] `grep -n '/api/health' README.md docs/deployment/coolify-ghcr.md`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Confirm the repo no longer claims Coolify builds from source
    Tool: Bash
    Steps: Run `test ! -f coolify.json` and `grep -R -n 'build_pack.*dockerfile\|base_directory' README.md docs .github || true`.
    Expected: `coolify.json` is absent and no repo doc still instructs Coolify to build this repo directly.
    Evidence: .sisyphus/evidence/task-6-no-source-build.txt

  Scenario: Confirm the runbook defines image, migration, health, and rollback contracts
    Tool: Bash
    Steps: Run `grep -n 'sha-' docs/deployment/coolify-ghcr.md && grep -n 'pnpm migrate' docs/deployment/coolify-ghcr.md && grep -n '/api/health' docs/deployment/coolify-ghcr.md && grep -n 'rollback' docs/deployment/coolify-ghcr.md`.
    Expected: All four operator contract items are documented explicitly.
    Evidence: .sisyphus/evidence/task-6-runbook-contract.txt
  ```

  **Commit**: YES | Message: `docs(deploy): document ghcr coolify handoff` |
  Files: `README.md`, `docs/deployment/coolify-ghcr.md`, `coolify.json`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated
> results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval
> before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user
> feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
  - Tool: `task(subagent_type="oracle")`
  - Steps: Ask Oracle to audit the implemented diff and final repo state against
    `.sisyphus/plans/github-ci-ghcr-coolify.md`, verifying tasks 1-6, file
    paths, acceptance criteria, and defaults applied.
  - Expected: `PASS` with zero critical plan deviations.
- [ ] F2. Code Quality Review — unspecified-high
  - Tool: `task(category="unspecified-high")`
  - Steps: Ask a reviewer agent to inspect changed files for CI safety,
    workflow correctness, shell robustness, and documentation accuracy, with
    emphasis on GitHub Actions gating and migration/runbook clarity.
  - Expected: `PASS` with zero critical correctness or maintainability issues.
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
  - Tool: `task(category="unspecified-high")`
  - Steps: Execute all repo-side verification commands from tasks 1-6,
    including Docker build, grep/python workflow assertions, and documentation
    contract checks. If any UI/HTTP smoke check is added during implementation,
    also verify `/api/health` behavior with the documented contract.
  - Expected: `PASS` with every acceptance criterion and QA scenario reproduced
    successfully.
- [ ] F4. Scope Fidelity Check — deep
  - Tool: `task(category="deep")`
  - Steps: Review the final diff for out-of-scope additions such as auto-deploy
    hooks, `latest` production tags, multi-arch build work, standalone Next.js
    migration, or retained source-build Coolify config.
  - Expected: `PASS` with zero scope creep beyond this plan.

## Commit Strategy
- Task 1 → `build(container): make runtime image stateless`
- Task 2 → `ci(workflow): add shared workflow scaffold`
- Task 3 → `ci(validate): add pull request validation job`
- Task 4 → `ci(e2e): gate main publishes behind playwright jobs`
- Task 5 → `ci(release): publish immutable ghcr images`
- Task 6 → `docs(deploy): document ghcr coolify handoff`

## Success Criteria
- Repo state makes GitHub the single CI authority and GHCR the single
  deployable artifact source
- Merge-to-main can only publish after static checks and both Playwright suites
  pass
- Operators can deploy or roll back in Coolify by selecting an immutable GHCR
  image reference using the documented runbook
- No repo file continues to instruct Coolify to rebuild source from this repo
