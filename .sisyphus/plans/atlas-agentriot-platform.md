# Atlas AgentRiot platform

## TL;DR
> **Summary**: Build AgentRiot as a single Next.js App Router application that treats public content as the product: news, software directory, agent profiles, agent updates, Join the Riot onboarding, and first-class documentation. The implementation must follow `DESIGN.md` as the visual source of truth and `AgentRiot_V2_Project_Plan.md` as the product/SEO/safety source of truth.
> **Deliverables**:
> - public editorial site with homepage, news, software, agents, updates, feed, about, docs, and Join the Riot
> - agent-first onboarding with prompt/skill endpoint, immediate public profile/update publishing, API-key claim flow, optional email association
> - admin operations for moderation, content ops, API key rotation, and activity review
> - SEO primitives: canonical strategy, metadata, robots, sitemap(s), JSON-LD, noindex matrix
> - concise Vitest + Playwright test coverage and evidence-driven verification
> **Effort**: XL
> **Parallel**: YES - 4 waves
> **Critical Path**: 1 → 2 → 3 → 4 → 5 → 6 → 9 → 10

## Context
### Original Request
Build a detailed Atlas plan for AgentRiot using the root requirements/design markdown as source of truth, Drizzle + PostgreSQL, the latest stable packages verified from official current sources, short concise tests, SEO-first architecture, and explicit use of appropriate skills including `shadcn`, `shadcn-ui`, and other applicable web/testing/review skills.

### Interview Summary
- `DESIGN.md` is the visual source of truth.
- `AgentRiot_V2_Project_Plan.md` is the product/scope source of truth.
- Repo is greenfield: there is no existing application code.
- Join the Riot must be agent-first, inspired by `journeychat.ai` and informed by `here.now`.
- The site should expose a website prompt and/or skill endpoint that an owner pastes into their agent.
- Agent self-registration should create a public profile immediately.
- Agent updates should also publish immediately in v1.
- Admin must be able to ban agents, restrict posting, revoke/rotate API keys, and moderate after publication.
- Phase one must include strong public documentation/install guidance similar to the reference sites.
- Owner claim flow should be API-key based; email is optional but encouraged.
- Admin access is internal-only and uses a dedicated admin auth path separate from agent ownership flows.
- Tests should be short, high-signal, and automated.

### Metis Review (gaps addressed)
- Locked content boundaries: self-service public content is only `agents` and `agent_updates`; `news` and `software` stay admin-managed in phase one.
- Locked moderation stance: publish-first for agent-owned content; admin-only publishing for news/software.
- Locked docs stance: docs are first-class phase-one product surfaces and repo-authored content, not a separate CMS project.
- Locked SEO stance: public content types are indexable surfaces; admin/search/filter/claim flows are noindex.
- Locked ownership stance: agent-first creation, later human claim via API key proof, optional email attachment, admin override tools.
- Added guardrails for slug redirects, key rotation, feed signal taxonomy, and anti-abuse throttles.

## Work Objectives
### Core Objective
Deliver a decision-complete implementation path for launching AgentRiot v1 as an SEO-first, design-led, agent-native public content platform.

### Deliverables
- Next.js App Router web app with route groups for public, admin, and API surfaces
- Drizzle + Postgres schema/migration plan for news, software, agents, updates, ownership, moderation, audit, and docs metadata
- public routes:
  - `/`
  - `/news`
  - `/news/[slug]`
  - `/software`
  - `/software/[slug]`
  - `/agents`
  - `/agents/[slug]`
  - `/agents/[slug]/updates/[slug]`
  - `/feed`
  - `/join`
  - `/join/claim`
  - `/docs/install`
  - `/docs/post-updates`
  - `/docs/claim-agent`
  - `/agent-instructions`
  - `/about`
- admin routes:
  - `/admin`
  - `/admin/news`
  - `/admin/software`
  - `/admin/agents`
  - `/admin/moderation`
  - `/admin/api-keys`
  - `/admin/activity`
- API routes for registration, claim, update posting, key rotation, moderation, and content operations
- internal admin auth contract for `/admin` with seeded dev/test credentials
- SEO infrastructure: metadata, structured data, canonical helpers, robots, sitemap index, per-entity sitemaps
- concise test suite and automated QA evidence

### Definition of Done (verifiable conditions with commands)
- `pnpm install` completes using versions verified from official current sources at implementation time.
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm test:e2e` passes.
- `pnpm build` succeeds.
- `curl -I http://localhost:3000/robots.txt` returns `200`.
- `curl -I http://localhost:3000/sitemap.xml` returns `200`.
- `curl -I http://localhost:3000/agents/test-agent` returns `200` after seeded registration.
- `curl -I http://localhost:3000/admin` returns a non-indexable admin response and emits noindex metadata.

### Must Have
- Use `DESIGN.md` for colors, typography hierarchy, spacing, border-radius rhythm, dark-only canvas, and editorial tone.
- Use `AgentRiot_V2_Project_Plan.md` for product boundaries and phase-one non-goals.
- Verify stable package versions through Context7 and official release notes/web search before scaffolding.
- Use Drizzle + PostgreSQL.
- Use the provided phase-one database contract unless the user changes it: host `192.168.0.25`, user `agentriot`, password `agentriot`, database names `agentriot_dev` and `agentriot_test`.
- Use Tailwind CSS v4 and `shadcn/ui`.
- Use short, focused tests.
- Keep software pages distinct from agent profiles.
- Keep news/editorial admin-managed only.
- Make About, Agent Instructions, Join, and docs pages first-class and indexable.
- Make Join the Riot agent-first with prompt/skill flow and website documentation.
- Make profile and post publishing public immediately for v1.
- Protect `/admin` with a single-role internal admin auth system; there are no public human user accounts in v1.
- Treat banned agents as hard-hidden public entities: return `404`, remove them from sitemaps, and noindex any fallback response if a restricted shell is used internally.
- Treat posting-restricted agents as still-public profiles whose posting API calls return `403`.
- Standardize v1 update payload shape: `title` max 80 chars, `summary` max 240 chars, `whatChanged` max 500 chars, up to 5 `skillsTools` tags, one optional approved public link.
- Standardize v1 admin auth: use one internal admin auth mechanism only, with seeded dev/test fixture `admin@agentriot.local` / `agentriot-admin-dev` for automated QA; executor may use the latest stable suitable auth library, but must not introduce public user auth in v1.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No comments, likes, reactions, social graph, DMs, marketplace, newsletter, or unrelated community features.
- No public software submissions in phase one.
- No public news publishing in phase one.
- No full custom profile site builder.
- No multilingual/i18n scope in phase one.
- No separate admin frontend or second app.
- No invented or substitute skill names beyond the installed library; use the real installed skills, including `vercel-react-best-practices`, where applicable.
- No outdated package assumptions from memory.
- No generic “add SEO later” tasking; SEO ships with each public surface.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after for app foundation + concise TDD within each feature slice where practical. Frameworks: Vitest, React Testing Library, Playwright.
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- Package verification policy: executor must verify exact stable versions for `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `drizzle-orm`, `drizzle-kit`, `pg`, `vitest`, `@playwright/test`, and `shadcn` CLI from official current sources before scaffold.

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: foundation + version verification + design tokens + schema/route contracts + SEO primitives  
Wave 2: docs/join/onboarding + agent registration/claim + updates/feed  
Wave 3: news + software + homepage + about/instructions  
Wave 4: admin operations + moderation + hardening + full test/evidence sweep

### Dependency Matrix (full, all tasks)
- 1 blocks 2, 3, 4, 5, 6, 7, 8, 9, 10
- 2 blocks 4, 5, 6, 7, 8, 9, 10
- 3 blocks 4, 5, 6, 7, 8, 9, 10
- 4 blocks 5, 6, 7, 8, 9, 10
- 5 blocks 6, 8, 9, 10
- 6 blocks 8, 9, 10
- 7 blocks 8, 9
- 8 blocks 10
- 9 blocks 10
- 10 blocks Final Verification Wave

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 4 tasks → deep, visual-engineering, deep, unspecified-high
- Wave 2 → 3 tasks → writing, deep, unspecified-high
- Wave 3 → 2 tasks → unspecified-high, visual-engineering
- Wave 4 → 1 task → deep

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Lock stack versions, scaffold the monolithic app, and record implementation skills

  **What to do**: Verify exact stable versions from official current sources using Context7 + release notes/web search, then scaffold a single Next.js App Router TypeScript app using pnpm, Tailwind CSS v4, Drizzle, PostgreSQL, Vitest, Playwright, and shadcn. Create the baseline repo structure for `app`, `components`, `lib`, `db`, `content`, `tests`, and `e2e`. Add an executor-facing `CLAUDE.md`/session guidance note or equivalent implementation note that explicitly tells Atlas/Sisyphus to use `shadcn`, `shadcn-ui`, `vercel-react-best-practices`, `frontend-design`, `test-driven-development`, `playwright-expert`, `requesting-code-review`, Context7, and web search where applicable.
  **Must NOT do**: Do not guess versions. Do not install betas/canaries unless the user explicitly re-approves. Do not add extra frameworks such as Prisma, Zustand, or a CMS unless this plan says to.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: locks package policy, repo foundation, and implementation-skill discipline for the whole project.
  - Skills: [`shadcn`, `shadcn-ui`, `vercel-react-best-practices`, `test-driven-development`, `requesting-code-review`] - `shadcn` and `shadcn-ui` for component setup/integration workflows, `vercel-react-best-practices` for modern Vercel/Next React patterns, TDD for concise tests, review for setup correctness.
  - Omitted: [`vercel-react-native-skills`] - Reason: React Native skill is not applicable to this web app.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2, 3, 4, 5, 6, 7, 8, 9, 10] | Blocked By: []

  **References** (executor has NO interview context - be exhaustive):
  - Product scope: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:99-116` - required stack and latest-stable policy.
  - Product summary: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:3-16` - public content site framing.
  - Design source of truth: `/mnt/botsserver/projects/agentriotv2/DESIGN.md:1-19` - editorial design direction.
  - External: `https://nextjs.org/blog` - stable release verification for Next.js.
  - External: `https://ui.shadcn.com/docs/tailwind-v4` - shadcn + Tailwind v4 current guidance.
  - External: `https://orm.drizzle.team/docs/overview` - Drizzle current docs.

  **Acceptance Criteria** (agent-executable only):
  - [ ] A version-verification note exists in the repo documenting exact chosen stable versions and official source URLs.
  - [ ] `pnpm install` completes successfully.
  - [ ] `pnpm lint && pnpm typecheck && pnpm test` all pass on the foundation scaffold.
  - [ ] The repo contains `app/`, `components/`, `lib/`, `db/`, `content/`, `tests/`, and `e2e/` directories.
  - [ ] The implementation guidance explicitly names required skills/tools for Atlas/Sisyphus.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Foundation commands pass
    Tool: Bash
    Steps: Run `pnpm lint && pnpm typecheck && pnpm test`
    Expected: All commands exit 0
    Evidence: .sisyphus/evidence/task-1-foundation.txt

  Scenario: Version policy is documented
    Tool: Bash
    Steps: Verify the version note contains official URLs for Next.js, Drizzle, Tailwind, shadcn, Vitest, and Playwright
    Expected: Each required package family has an official source URL and exact selected version
    Evidence: .sisyphus/evidence/task-1-version-policy.txt
  ```

  **Commit**: YES | Message: `chore(app): scaffold agentriot foundation` | Files: [package.json, pnpm-lock.yaml, app/**, lib/**, tests/**, e2e/**, version note]

- [x] 2. Implement the design system shell from `DESIGN.md`

  **What to do**: Translate `DESIGN.md` into app-level design tokens, typography fallbacks, radius scale, dark-only theme, layout primitives, buttons, tags, cards, and navigation rules. Create a reusable shell with the near-black canvas, hazard accents, flat borders, and StoryStream-friendly component primitives. Use open-source fallback fonts that preserve the intended feel unless licensed fonts are already available.
  **Must NOT do**: Do not introduce light mode. Do not add gradients or soft shadows. Do not use Manuka below hero scale. Do not make generic SaaS dashboards.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: design fidelity is core to the product and must be codified early.
  - Skills: [`frontend-design`, `shadcn-ui`] - translate the design system into production-grade web primitives using the requested component path.
  - Omitted: [`docs-writer`] - this task is implementation/UI, not documentation authoring.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [4, 5, 6, 7, 8, 9, 10] | Blocked By: [1]

  **References**:
  - Visual system: `/mnt/botsserver/projects/agentriotv2/DESIGN.md:3-97` - theme, palette, typography, principles.
  - Components: `/mnt/botsserver/projects/agentriotv2/DESIGN.md:99-200` - buttons, cards, nav, forms, timeline.
  - Layout: `/mnt/botsserver/projects/agentriotv2/DESIGN.md:201-300` - spacing, grid, responsive behavior.

  **Acceptance Criteria**:
  - [ ] Global layout renders on a dark-only canvas with no light mode toggle or fallback.
  - [ ] Shared UI primitives exist for headline cards, StoryStream tiles, pill buttons, tags, and editorial rails.
  - [ ] Typography fallback stack is documented in code for hero/display/UI/mono usage.
  - [ ] A smoke component test verifies primary shell rendering without regressions.

  **QA Scenarios**:
  ```
  Scenario: Home shell matches dark editorial baseline
    Tool: Playwright
    Steps: Open `/`, capture screenshot, inspect body background and hero region
    Expected: Dark canvas, pill CTA, editorial card primitives, no light mode surfaces
    Evidence: .sisyphus/evidence/task-2-design-shell.png

  Scenario: No forbidden visual patterns exist
    Tool: Playwright
    Steps: Inspect buttons/cards rendered on `/`
    Expected: No gradient backgrounds and no soft drop-shadow elevation on primary surfaces
    Evidence: .sisyphus/evidence/task-2-visual-guardrails.png
  ```

  **Commit**: YES | Message: `feat(ui): establish agentriot editorial design system` | Files: [app/globals.css, components/ui/**, app/layout.tsx, lib/design/**]

- [x] 3. Define database schemas, content boundaries, route contracts, and the concrete DB environment

  **What to do**: Implement Drizzle schema and migration contracts for `news_articles`, `software_entries`, `agents`, `agent_updates`, `agent_keys`, `agent_claims`, `moderation_actions`, `activity_events`, `redirects`, and `content_taxonomy`. Reserve docs as repo content plus metadata records if needed, not database-authored bodies. Lock route/slug rules and redirect behavior. Use the provided Postgres server contract exactly: host `192.168.0.25`, user `agentriot`, password `agentriot`, dev database `agentriot_dev`, test database `agentriot_test`.
  **Must NOT do**: Do not collapse software and agents into one table. Do not turn updates into full blog posts. Do not store docs in a CMS table for v1.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: data/domain boundaries drive all later work.
  - Skills: [`test-driven-development`] - write concise contract tests for schema rules and repository behavior.
  - Omitted: [`frontend-design`] - this is domain/data work.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [4, 5, 6, 7, 8, 9, 10] | Blocked By: [1]

  **References**:
  - Separation rule: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:71-86` - software pages vs agent profiles.
  - Agent fields: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:185-214` - structured profile requirements.
  - Update structure: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:217-247` - short structured updates.
  - Admin requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:427-463` - moderation/api-key ops.
  - User-provided DB contract captured in this plan: `/mnt/botsserver/projects/agentriotv2/.sisyphus/plans/atlas-agentriot-platform.md`
  - Drizzle config guidance: `https://orm.drizzle.team/docs/overview`

  **Acceptance Criteria**:
  - [ ] Drizzle migrations create separate tables for software, agents, updates, keys, claims, moderation, events, and redirects.
  - [ ] Schema tests prove software and agent identifiers are independent.
  - [ ] Update records support both global-feed-visible and profile-only signal classes.
  - [ ] Dev/test env contracts are documented exactly as host `192.168.0.25`, user `agentriot`, password `agentriot`, databases `agentriot_dev` and `agentriot_test`.

  **QA Scenarios**:
  ```
  Scenario: Schema migration succeeds
    Tool: Bash
    Steps: Run migration command against `agentriot_dev` on `192.168.0.25` using the documented credentials and inspect exit code
    Expected: All migrations apply successfully
    Evidence: .sisyphus/evidence/task-3-migrate.txt

  Scenario: Signal taxonomy works
    Tool: Bash
    Steps: Run unit tests covering `major_release` vs `status` visibility rules
    Expected: `major_release` is marked for global feed; `status` is profile-only
    Evidence: .sisyphus/evidence/task-3-signal-tests.txt
  ```

  **Commit**: YES | Message: `feat(db): add core content and ownership schema` | Files: [db/schema/**, db/migrations/**, tests/db/**]

- [x] 4. Build SEO primitives and indexability matrix before feature pages

  **What to do**: Implement shared metadata helpers, canonical URL utilities, structured data builders, `robots.ts`, `sitemap.ts`, sitemap index strategy, slug redirect handling, and an explicit index/noindex policy matrix. Use Next App Router metadata APIs directly. Prepare JSON-LD for organization, article, software/dataset-like listing page, profile/person-or-software-agent representation, and update/article-like microcontent. The Wave-1 deliverable is the metadata infrastructure plus testable policy helpers; route-specific noindex assertions for `/join/claim` and `/search` are deferred until those routes exist.
  **Must NOT do**: Do not add a third-party SEO abstraction layer. Do not leave noindex decisions implicit. Do not omit canonical support for slug changes.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: SEO is cross-cutting and needs careful contract work.
  - Skills: [`test-driven-development`, `requesting-code-review`] - validate helpers and indexability behavior.
  - Omitted: [`shadcn-ui`] - no component library work here.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [5, 6, 7, 8, 9, 10] | Blocked By: [1, 2, 3]

  **References**:
  - SEO requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:349-379` - metadata, canonical, sitemap, robots, internal linking.
  - Public SEO surfaces: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:366-376`
  - Next metadata docs: `https://nextjs.org/docs/app/building-your-application/optimizing/metadata`
  - Context7 reference used in planning: Next.js v16 metadata/robots support.

  **Acceptance Criteria**:
  - [ ] `robots.txt` and `sitemap.xml` resolve successfully in local dev.
  - [ ] Public content routes use canonical tags.
  - [ ] The metadata policy helper maps admin, claim, auth, search, and low-value filter route classes to noindex.
  - [ ] Structured data helpers exist for home, article, software, agent profile, and agent update routes.

  **QA Scenarios**:
  ```
  Scenario: SEO route assets respond
    Tool: Bash
    Steps: Run `curl -I http://localhost:3000/robots.txt && curl -I http://localhost:3000/sitemap.xml`
    Expected: Both endpoints return HTTP 200
    Evidence: .sisyphus/evidence/task-4-seo-assets.txt

  Scenario: Noindex policy helper is enforced
    Tool: Bash
    Steps: Run unit tests for the metadata policy helper covering `admin`, `claim`, `auth`, `search`, and `filter` route classes
    Expected: Each covered route class resolves to noindex in tests
    Evidence: .sisyphus/evidence/task-4-noindex.txt
  ```

  **Commit**: YES | Message: `feat(seo): add metadata, canonicals, and sitemap infrastructure` | Files: [app/robots.ts, app/sitemap.ts, lib/seo/**, tests/seo/**]

- [x] 5. Ship first-class documentation and Join the Riot onboarding surfaces

  **What to do**: Create `/join`, `/docs/install`, `/docs/post-updates`, `/docs/claim-agent`, `/agent-instructions`, and `/about` as indexable public documentation pages with strong internal linking. `/join` must include a prominent “copy prompt/instructions for my agent” flow, a skill endpoint reference, and exact onboarding steps. The docs should clearly explain safe posting, API key handling, rate limits, claim flow, optional email association, and what agents must not post.
  **Must NOT do**: Do not bury docs in a footer-only pattern. Do not make docs generic. Do not expose secrets or unsafe examples. Do not create a docs CMS.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: these pages are first-class documentation surfaces and must read clearly.
  - Skills: [`docs-writer`, `requesting-code-review`] - documentation quality is central here.
  - Omitted: [`frontend-design`] - use the shared design system, but the main risk is content clarity.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [6, 9, 10] | Blocked By: [1, 2, 3, 4]

  **References**:
  - Join the Riot requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:279-318`
  - Privacy/safety requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:321-346`
  - About page requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:382-399`
  - Agent instructions requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:402-424`
  - Reference pattern: `https://here.now`
  - Reference pattern: `https://journeychat.ai`

  **Acceptance Criteria**:
  - [ ] `/join`, `/docs/install`, `/docs/post-updates`, `/docs/claim-agent`, `/agent-instructions`, and `/about` render and are indexable.
  - [ ] `/join` contains a copyable prompt/instruction block and links to the skill/install path.
  - [ ] Docs explicitly state optional email policy, API-key claim model, one-update-per-hour limit, and public-safe posting guidance.
  - [ ] Docs cross-link to software pages, agent instructions, and About where relevant.

  **QA Scenarios**:
  ```
  Scenario: Join page supports agent-first onboarding
    Tool: Playwright
    Steps: Open `/join`, click the copy prompt control, verify prompt block and links to install/claim docs
    Expected: Copy control works and install/claim references are visible
    Evidence: .sisyphus/evidence/task-5-join-flow.png

  Scenario: Safety guidance is explicit
    Tool: Playwright
    Steps: Open `/agent-instructions` and `/docs/post-updates`
    Expected: Pages include “what agents should not post”, rate limit, and API key guidance sections
    Evidence: .sisyphus/evidence/task-5-docs-safety.png
  ```

  **Commit**: YES | Message: `feat(docs): add join flow and public agent documentation` | Files: [app/join/**, app/docs/**, app/agent-instructions/**, app/about/**, content/docs/**]

- [x] 6. Implement agent registration, public profile creation, and owner claim flow

  **What to do**: Create the API and UI flow for agent self-registration via prompt/skill instructions. Registration must return a one-time API key, create the public agent profile immediately, and store ownership state that can later be claimed by a human using API key proof plus optional email association. Add slug uniqueness, reserved word protection, key rotation, and recovery/admin override rules.
  **Must NOT do**: Do not require email at registration. Do not force manual approval before going public. Do not expose raw secret values after initial issuance except through explicit rotation/re-issue policy.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: ownership/auth contracts are the highest-risk backend workflow.
  - Skills: [`test-driven-development`, `requesting-code-review`] - contract-heavy workflow with security implications.
  - Omitted: [`docs-writer`] - docs already land in Task 5; this task focuses on behavior.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [7, 8, 9, 10] | Blocked By: [1, 2, 3, 4, 5]

  **References**:
  - Join positioning: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:286-317`
  - Admin API key management: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:442-447`
  - Ownership rules in plan context: `/mnt/botsserver/projects/agentriotv2/.sisyphus/plans/atlas-agentriot-platform.md`
  - Reference pattern: `https://journeychat.ai`

  **Acceptance Criteria**:
  - [ ] `POST /api/agents/register` with a valid payload returns `201` and a one-time API key.
  - [ ] A successful registration creates a public agent page at `/agents/[slug]`.
  - [ ] `POST /api/agents/claim` with valid API key proof succeeds and stores/associates email when provided.
  - [ ] Invalid claim/key requests return `401` or `403`.
  - [ ] Reserved slugs and duplicate names are rejected predictably.

  **QA Scenarios**:
  ```
  Scenario: Agent self-registration succeeds
    Tool: Bash
    Steps: POST a concrete registration payload to `/api/agents/register`, then GET the returned public slug
    Expected: Registration returns 201 and the profile page returns 200
    Evidence: .sisyphus/evidence/task-6-register.txt

  Scenario: Invalid claim is rejected
    Tool: Bash
    Steps: POST an invalid API key to `/api/agents/claim`
    Expected: API returns 401 or 403 and claim is not created
    Evidence: .sisyphus/evidence/task-6-claim-reject.txt
  ```

  **Commit**: YES | Message: `feat(agent-auth): add self-registration and claim flow` | Files: [app/api/agents/register/**, app/api/agents/claim/**, app/agents/[slug]/**, lib/agents/**, tests/agents/**]

- [x] 7. Implement agent updates, timeline archives, and the high-signal global feed

  **What to do**: Build the immediate-public update posting API, per-agent update archive/permalink pages, and `/feed` with explicit signal taxonomy. Enforce one automated update per hour per agent. Make `major_release`, `launch`, `funding`, `partnership`, `milestone`, and `research` eligible for `/feed`; keep `status`, `minor_release`, `bugfix`, and `prompt_update` on profile timelines only unless manually elevated later. Lock the v1 payload contract to `title` (max 80 chars), `summary` (max 240 chars), `whatChanged` (max 500 chars), up to 5 `skillsTools` entries, required timestamp, optional one approved public link, and no arbitrary rich-text body.
  **Must NOT do**: Do not create a long-form blogging platform. Do not let every event into the global feed. Do not omit permalinks/archive pages for updates.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: combines API behavior, public rendering, and product-signal rules.
  - Skills: [`test-driven-development`, `playwright-expert`] - concise route tests plus critical flow validation.
  - Omitted: [`shadcn-ui`] - shared primitives from Task 2 should already exist.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [8, 10] | Blocked By: [1, 2, 3, 4, 6]

  **References**:
  - Update requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:217-247`
  - Global feed requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:251-276`
  - UX rule: high-signal global feed vs fuller profile timeline.

  **Acceptance Criteria**:
  - [ ] Authenticated update posting returns `201` for valid payloads that satisfy the v1 field limits.
  - [ ] A second automated update within one hour returns `429`.
  - [ ] Global-feed-eligible signals appear on `/feed` and the profile timeline.
  - [ ] Profile-only signals appear on the profile timeline but not `/feed`.
  - [ ] Each update permalink has metadata/canonical/structured data.
  - [ ] Oversized payload fields are rejected with `400`.

  **QA Scenarios**:
  ```
  Scenario: Feed routing honors signal class
    Tool: Bash
    Steps: Seed one `major_release` update and one `status` update, then query rendered pages or service tests
    Expected: `major_release` appears on `/feed`; `status` does not
    Evidence: .sisyphus/evidence/task-7-feed-routing.txt

  Scenario: Rate limit blocks overposting
    Tool: Bash
    Steps: POST two updates for the same agent within one hour
    Expected: First request returns 201, second returns 429
    Evidence: .sisyphus/evidence/task-7-rate-limit.txt

  Scenario: Oversized update payload is rejected
    Tool: Bash
    Steps: POST an update whose `whatChanged` exceeds 500 characters
    Expected: API returns 400 and does not create a public update
    Evidence: .sisyphus/evidence/task-7-payload-guardrails.txt
  ```

  **Commit**: YES | Message: `feat(updates): add agent update publishing and global feed` | Files: [app/feed/**, app/agents/[slug]/updates/**, app/api/agents/[slug]/updates/**, lib/updates/**, tests/updates/**]

- [x] 8. Build the curated software directory and news surfaces

  **What to do**: Implement admin-managed software index/detail pages and news index/article pages with strong internal linking into agent profiles and other public surfaces. Use evergreen software detail pages and editorial article pages as indexable surfaces. Include category/tag/archive behavior only where it adds SEO value and keep low-value filter/search states noindex.
  **Must NOT do**: Do not open these surfaces to public self-submission. Do not create weak duplicate taxonomy pages. Do not link agents primarily off-site instead of to internal software pages.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: combines content modeling, public templates, and internal-link strategy.
  - Skills: [`frontend-design`, `docs-writer`] - editorial templates plus content clarity.
  - Omitted: [`playwright-expert`] - this is not primarily test infrastructure work.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [9, 10] | Blocked By: [1, 2, 3, 4, 6, 7]

  **References**:
  - News requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:132-152`
  - Software directory requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:155-183`
  - Homepage direction references software/news/agent activity linking: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:490-505`

  **Acceptance Criteria**:
  - [ ] `/news` and `/news/[slug]` render indexable editorial pages.
  - [ ] `/software` and `/software/[slug]` render indexable evergreen pages.
  - [ ] Software pages can list linked agents using that software.
  - [ ] News articles can internally link to software and agent pages.
  - [ ] Search/filter pages related to these surfaces are noindex if implemented.

  **QA Scenarios**:
  ```
  Scenario: Software pages link agents internally
    Tool: Playwright
    Steps: Open a seeded software detail page and inspect the linked agents section
    Expected: At least one agent card links to `/agents/[slug]`, not only to external URLs
    Evidence: .sisyphus/evidence/task-8-software-links.png

  Scenario: News article is crawl-ready
    Tool: Playwright
    Steps: Open a seeded article page
    Expected: Article page contains H1, canonical metadata, and internal links to software or agent surfaces
    Evidence: .sisyphus/evidence/task-8-news-page.png
  ```

  **Commit**: YES | Message: `feat(content): add software directory and editorial news surfaces` | Files: [app/news/**, app/software/**, lib/news/**, lib/software/**, tests/content/**]

- [x] 9. Compose the homepage and connected public IA around the three pillars

  **What to do**: Build `/` as an SEO-first editorial homepage that clearly communicates AgentRiot’s three pillars and Join the Riot CTA. It must include featured news, featured software, high-signal recent agent activity, strong explanatory copy, and internal links into the major public surfaces. Keep the design loud, editorial, and structured around `DESIGN.md`, especially the StoryStream/timeline rhythm.
  **Must NOT do**: Do not make the homepage a dashboard. Do not give equal weight to every module. Do not bury Join the Riot.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: this is the main branded public surface.
  - Skills: [`frontend-design`, `shadcn-ui`] - ensure distinctive, non-generic public design.
  - Omitted: [`docs-writer`] - homepage content should use the already established product copy direction.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [10] | Blocked By: [1, 2, 4, 5, 7, 8]

  **References**:
  - Homepage requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:490-505`
  - IA surfaces: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:467-487`
  - Design system: `/mnt/botsserver/projects/agentriotv2/DESIGN.md:3-30`, `/mnt/botsserver/projects/agentriotv2/DESIGN.md:148-200`

  **Acceptance Criteria**:
  - [ ] Homepage links directly to `/news`, `/software`, `/agents` or featured agent surfaces, and `/join`.
  - [ ] Homepage includes at least one featured news module, one featured software module, one recent activity module, and one Join the Riot CTA.
  - [ ] Homepage metadata explains the platform clearly for humans and crawlers.
  - [ ] Homepage visual layout uses the dark editorial design system and StoryStream-style rhythm.

  **QA Scenarios**:
  ```
  Scenario: Homepage supports the three-pillar pitch
    Tool: Playwright
    Steps: Open `/` and inspect hero + primary modules
    Expected: News, software, agent activity, and Join the Riot CTA are all visible above major scroll depth
    Evidence: .sisyphus/evidence/task-9-homepage.png

  Scenario: Homepage internal linking is strong
    Tool: Playwright
    Steps: Click through the primary homepage modules
    Expected: Each module navigates to an internal AgentRiot route, not an external destination
    Evidence: .sisyphus/evidence/task-9-home-links.txt
  ```

  **Commit**: YES | Message: `feat(home): compose editorial homepage and IA hubs` | Files: [app/page.tsx, components/home/**, tests/home/**]

- [ ] 10. Build admin operations, moderation controls, and release hardening

  **What to do**: Implement the admin area for content ops, moderation, API key rotation/revocation, recent activity review, and visibility/restriction controls. Protect `/admin` with one internal-only admin auth mechanism and seed the dev/test admin fixture exactly as `admin@agentriot.local` / `agentriot-admin-dev` so automated tests can log in deterministically. Ban/restrict actions must immediately affect public behavior, sitemap inclusion, and publishing rights. Ban = public profile returns `404`, agent is absent from sitemaps, and all posting is blocked. Restrict posting = profile stays public but update creation returns `403`. Add concise end-to-end smoke tests for registration, claim, update posting, docs visibility, admin restrictions, and SEO route assets.
  **Must NOT do**: Do not build a bloated back office. Do not omit audit logs. Do not leave banned agents publicly indexable.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: this ties together operational safety, publishing controls, and final hardening.
  - Skills: [`playwright-expert`, `requesting-code-review`, `test-driven-development`] - final behavior validation and concise coverage.
  - Omitted: [`frontend-design`] - use existing primitives and stay operational.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [F1, F2, F3, F4] | Blocked By: [1, 2, 3, 4, 5, 6, 7, 8, 9]

  **References**:
  - Admin requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:427-463`
  - Safety requirements: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:321-346`
  - SEO rules affected by moderation: `/mnt/botsserver/projects/agentriotv2/AgentRiot_V2_Project_Plan.md:349-379`
  - Admin auth contract and fixture: `/mnt/botsserver/projects/agentriotv2/.sisyphus/plans/atlas-agentriot-platform.md`

  **Acceptance Criteria**:
  - [ ] `/admin` requires admin auth and rejects unauthenticated access.
  - [ ] Seeded dev/test admin credentials `admin@agentriot.local` / `agentriot-admin-dev` can sign into `/admin` in automated QA.
  - [ ] Admin can ban an agent and that agent can no longer post updates.
  - [ ] Banned agents return `404`, are removed from sitemap output, and cannot publish.
  - [ ] Posting-restricted agents keep their public profile but update creation returns `403`.
  - [ ] Admin can rotate/revoke API keys and the old key stops working immediately.
  - [ ] Concise Playwright smoke suite covers registration, claim, posting, docs, and admin restriction behavior.
  - [ ] `pnpm build`, `pnpm test`, and `pnpm test:e2e` all pass.

  **QA Scenarios**:
  ```
  Scenario: Admin login works with seeded fixture
    Tool: Playwright
    Steps: Open `/admin`, sign in with `admin@agentriot.local` / `agentriot-admin-dev`
    Expected: Login succeeds and the admin dashboard loads
    Evidence: .sisyphus/evidence/task-10-admin-login.txt

  Scenario: Ban flow disables posting and indexing
    Tool: Playwright
    Steps: Sign into `/admin` with the seeded admin fixture, ban a seeded agent in `/admin/agents`, then attempt a new update post and inspect sitemap output
    Expected: Update post is rejected and the banned agent is absent from sitemap output
    Evidence: .sisyphus/evidence/task-10-ban-flow.txt

  Scenario: Final smoke suite passes
    Tool: Bash
    Steps: Run `pnpm test && pnpm test:e2e && pnpm build`
    Expected: All commands exit 0
    Evidence: .sisyphus/evidence/task-10-final-suite.txt
  ```

  **Commit**: YES | Message: `feat(admin): add moderation operations and final hardening` | Files: [app/admin/**, app/api/admin/**, tests/admin/**, e2e/**]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
  - Inputs: `.sisyphus/plans/atlas-agentriot-platform.md`, changed files, test outputs, and evidence files.
  - Invocation: run an `oracle` review against the final implementation diff and this plan.
  - Pass criteria: every required route, behavior, and guardrail in this plan is either present or explicitly justified as deferred by the user.
  - Evidence: `.sisyphus/evidence/f1-plan-compliance.md`
- [ ] F2. Code Quality Review — unspecified-high
  - Inputs: full implementation diff, lint/typecheck/test outputs.
  - Invocation: run an `unspecified-high` reviewer focused on maintainability, test quality, and unsafe shortcuts.
  - Pass criteria: no major code smell, no broken abstractions, no missing short-test coverage for critical flows.
  - Evidence: `.sisyphus/evidence/f2-code-quality.md`
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
  - Inputs: running app, seeded content, seeded admin fixture.
  - Invocation: run Playwright/manual QA for `/`, `/join`, `/docs/install`, `/agents/test-agent`, `/feed`, `/software/test-software`, `/news/test-article`, `/admin`.
  - Pass criteria: critical flows succeed, visuals match the dark editorial system, no blocking runtime errors, SEO assets respond.
  - Evidence: `.sisyphus/evidence/f3-manual-qa.md`
- [ ] F4. Scope Fidelity Check — deep
  - Inputs: final implementation, plan scope boundaries, and final route inventory.
  - Invocation: run a `deep` review for phase-one scope discipline.
  - Pass criteria: no comments/likes/marketplace/chat/multilingual/public software submission/public news publishing slipped into the build.
  - Evidence: `.sisyphus/evidence/f4-scope-fidelity.md`

## Commit Strategy
- Commit after every task listed above; do not batch more than one numbered task into a single commit.
- Keep commit messages aligned with the task-level messages in this plan.
- If a task naturally splits into two safe, reviewable slices, prefer two commits over one oversized commit, but do not merge task boundaries.
- Before each commit, run only the shortest verification needed to prove that task is complete.

## Success Criteria
- AgentRiot launches as a public content site first, not a dashboard-first app.
- The design clearly reflects `DESIGN.md` instead of generic startup UI patterns.
- About, docs, and agent instructions are as important and polished as the interactive flows.
- Software pages, news pages, agent profiles, and update permalinks are all crawlable/indexable with explicit metadata.
- Join the Riot works in an agent-native way: prompt/skill first, website-guided, API-key powered, human-claimable later.
- The product stays within phase-one scope and does not drift into social-network or marketplace complexity.
- Atlas/Sisyphus can execute the work without making fresh product decisions.
