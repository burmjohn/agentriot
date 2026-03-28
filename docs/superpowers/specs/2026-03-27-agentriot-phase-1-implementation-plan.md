# AgentRiot phase 1 implementation plan

This plan translates the approved AgentRiot product and design work into a
buildable phase 1. It keeps the broad public launch, but reduces operational
scope so the first implementation proves the public product before building a
larger internal platform around it.

## What this plan does

Phase 1 delivers a broad public launch with five public surfaces:

- homepage
- articles
- tutorials
- agents
- prompts
- skills

Under the hood, phase 1 also delivers:

- one shared content graph
- one thin admin for manual editorial publishing
- Postgres-backed search
- core SEO and machine-readable outputs
- full test scaffolding for graph behavior and critical browse flows

This plan does **not** try to build the full API, ingestion, audit, and ops
surface in the same pass.

## Step 0 outcome

Scope challenge result: **scope reduced per recommendation**.

The product remains broad on the public side, but phase 1 cuts the highest-risk
infrastructure and operations work:

- no public read API in phase 1
- no ingestion API in phase 1
- no API key management UI in phase 1
- no audit console in phase 1
- no redirect management UI in phase 1
- no public user accounts in phase 1

This is still the complete phase 1 for the public product. It is not the full
platform roadmap.

## Approved implementation decisions

These decisions came out of the engineering review and are now part of the
plan:

- broad public launch, reduced operational scope
- explicit deferred backlog in both this plan and `TODOS.md`
- shared content graph from day one
- Better Auth as the single auth system from day one
- admin-first publishing in phase 1
- Postgres-backed search in phase 1
- admin-only auth in phase 1
- shared taxonomy system with scopes
- shared slug and redirect policy
- thin admin focused on content operations
- Vitest plus Playwright in phase 1
- shared test contracts for graph behavior
- rich canonical fixtures, not toy fixtures
- section-based homepage aggregation with cache boundaries
- bounded related-content query shapes for detail pages

## Architecture

Phase 1 should be built around one shared graph. This is the product.

### Core model

Use these primary entity groups:

- `content_items`
  - articles and tutorials share one content engine
- `agents`
- `prompts`
- `skills`
- `taxonomy_terms`
  - shared tags and categories with scoped usage
- `redirects`
  - shared slug history and canonical routing support

Use explicit join tables for cross-links:

- `content_agents`
- `content_prompts`
- `content_skills`
- `agent_prompts`
- `agent_skills`
- `skill_prompts`

### Data flow

```text
ADMIN EDITOR
    │
    ├── create / edit entity
    ├── assign scoped taxonomy
    ├── connect related entities
    └── publish
          │
          v
POSTGRES
    │
    ├── shared content graph tables
    ├── slug + redirect policy
    ├── scoped taxonomy
    └── relation joins
          │
          v
PUBLIC APP ROUTES
    │
    ├── homepage section queries
    ├── collection pages
    ├── detail pages
    ├── search
    └── SEO + machine-readable outputs
```

### Routing model

Use one shared slug and redirect policy for all entity types.

Rules:

- slugs are generated consistently per route scope
- slug history is preserved
- canonical routing is enforced
- redirect behavior is handled centrally, not per section

### Taxonomy model

Use one shared taxonomy system with explicit scopes:

- `content`
- `agent`
- `prompt`
- `skill`

This avoids duplicating category logic and keeps browsing behavior consistent.

### Search model

Search in phase 1 is Postgres-backed.

Requirements:

- indexed full-text search or equivalent ranking strategy
- basic filtering by entity type and scoped taxonomy
- empty states
- stable public route at `/search`

No dedicated search infrastructure in phase 1.

## Public surface plan

### Information architecture

Phase 1 needs clear hierarchy per surface. Broad launch only works if each page
answers one question at a time instead of shouting every content type at once.

#### Homepage hierarchy

The homepage must answer this sequence:

1. What is AgentRiot?
2. What changed right now that matters?
3. What should I explore next?
4. How do I move through the graph?

Homepage structure:

```text
HOME
│
├── Hero
│   ├── Product promise
│   └── Primary browse actions
│
├── Signal strip
│   └── Fast scan across current updates
│
├── Lead story
│   ├── Main current update
│   └── Related jump points
│
├── Discovery blocks
│   ├── Featured agents
│   ├── Model news
│   ├── Prompts
│   ├── Skills
│   └── Tutorials and articles
│
└── Browse support
    ├── Trending topics
    └── Recently updated
```

#### Collection page hierarchy

Collection pages must answer this sequence:

1. What is this section for?
2. How do I narrow it fast?
3. Which result should I open first?

Collection structure:

```text
COLLECTION PAGE
│
├── Section identity
│   ├── Title
│   └── Short explanation
│
├── Filters and scoped taxonomy
│
├── Primary result grid or list
│
└── Supporting states
    ├── Empty
    ├── Sparse
    └── Pagination or continuation
```

#### Detail page hierarchy

Detail pages must answer this sequence:

1. What is this thing?
2. Why does it matter?
3. How do I use it?
4. Where do I go next?

Detail structure:

```text
DETAIL PAGE
│
├── Identity block
│   ├── Title
│   ├── Summary
│   └── Metadata
│
├── Main content
│   ├── Explanation / body
│   ├── Prompt or workflow block where relevant
│   └── Examples / features / prerequisites
│
└── Related graph navigation
    ├── Related agents
    ├── Related prompts
    ├── Related skills
    └── Related tutorials or articles
```

#### Admin hierarchy

Admin must stay operational, not decorative.

Admin structure:

```text
ADMIN
│
├── Sign in
├── Content list
├── Edit form
├── Relation editing
└── Publish / draft controls
```

### Homepage

The homepage is utility-led and modular.

Build these sections:

1. compact hero
2. signal strip
3. lead story block
4. featured agents
5. model news
6. prompts
7. skills
8. tutorials and articles
9. trending topics
10. recently updated

Performance requirement:

- homepage data must be assembled from explicit section queries
- each section query must have bounded shape
- use cache boundaries and publish-time revalidation

Sparse-state rule:

- all primary homepage sections remain visible even when inventory is light
- sparse sections use designed "coming into focus" states instead of disappearing
- sparse states must include one useful item if available, a short explanation
  of what belongs here, and a primary next action into that section
- phase 1 must not render dead "No items found" boxes on the homepage

### Shared content engine

Articles and tutorials share one content engine with:

- shared editor model
- shared status flow
- shared SEO fields
- route-specific presentation differences

### Directory surfaces

Agents, prompts, and skills each get:

- browse page
- detail page
- shared card language
- related-content sections

Every detail page must show graph navigation into at least two other entity
types.

## Admin plan

Admin is a thin content operations tool in phase 1.

Auth provider:

- Better Auth
- phase 1 scope is admin and editor sign-in only
- future public accounts, if they happen, should extend the same auth system
  instead of introducing a second auth stack

Build:

- sign in for admins and editors
- CRUD for content
- CRUD for agents
- CRUD for prompts
- CRUD for skills
- taxonomy assignment
- relation editing
- publish and draft workflow
- verification status editing where relevant

Do not build:

- dashboard analytics
- API key management UI
- audit console
- redirect management UI
- usage summary views
- rich settings center

## SEO and machine-readable outputs

Phase 1 must include:

- canonical metadata
- per-route SEO metadata
- XML sitemap
- `robots.txt`
- `llms.txt`
- structured data where appropriate
- machine-readable content visibility in HTML

This is part of the product, not polish.

## Interaction state coverage

Every public and admin flow needs specified loading, empty, error, success, and
partial states. Engineers should not invent these during implementation.

| Feature | Loading | Empty / sparse | Error | Success | Partial |
|---|---|---|---|---|---|
| Homepage sections | skeleton blocks per section, not full-page spinner | section remains visible with "coming into focus" copy, one useful item if possible, and a browse CTA | section-level fallback message, rest of homepage still loads | fresh section content with updated metadata | some sections load, one fails gracefully |
| Collection pages | inline skeleton grid/list | warm zero-result state with filter reset action and example topics | inline error with retry and route-safe fallback | results visible with active filters and counts | partial results if one filter source fails |
| Detail pages | identity block loads first, body and related blocks stream in | related-content area explains no linked items yet | detail route shows recoverable error, not blank page | full detail page with related graph links | main content loads, related blocks degrade gracefully |
| Search | query-preserving loading state | "no results" with suggested alternate queries and top topics | inline error and retry with query retained | ranked mixed-entity results | result groups load unevenly without breaking page |
| Admin list views | table/list skeletons | empty state with primary create action | inline error banner with retry | list refreshes with saved change feedback | stale data warning if one dependent fetch fails |
| Admin edit flows | field-level pending states on save/publish | n/a | field and form-level validation plus recoverable save failure | saved / published confirmation with updated status | draft saved but relation or media sub-step failed |

## User journey and emotional arc

The plan must support both first-visit clarity and repeat-use efficiency.

| Step | User does | User feels | Plan must support |
|---|---|---|---|
| 1 | Lands on homepage | skeptical, curious | immediate product promise and visible live signal |
| 2 | Scans lead story and signal strip | oriented or overwhelmed | clear hierarchy and compact metadata |
| 3 | Opens a section or detail page | evaluating usefulness | fast comprehension, practical summaries, strong metadata |
| 4 | Jumps through related graph links | intrigued if useful, annoyed if dead ends | every detail page links into at least two other entity types |
| 5 | Returns later | wants speed, not re-explanation | predictable navigation, dense browse pages, updated timestamps |

Time-horizon requirement:

- first 5 seconds: understand what the product is and why it is current
- first 5 minutes: successfully discover one useful thing and one related thing
- long-term: trust the site as a repeat discovery habit, not a one-time browse

## AI slop prevention rules

The implementation must follow these design constraints:

- no generic SaaS three-column feature grid as the homepage first impression
- no card mosaic hero
- no centered-everything marketing layout
- no purple or violet default AI branding
- no decorative blobs or filler gradients
- cards only where cards are the interaction, not as default layout filler
- homepage first viewport must read like a composition, not a dashboard dump
- section headings must say what the area does, not generic vibe copy

Specific visual guardrails from the approved design:

- use a developer-leaning hybrid style, not editorial-magazine styling
- typography does the branding work: readable sans body, stronger headline
  treatment, mono accent for labels and metadata
- calm surface, dense signal
- compact metadata-rich cards inside spacious page rhythm

## Design system alignment

`DESIGN.md` is now the working design-system anchor for implementation.

The design spec at
`docs/superpowers/specs/2026-03-27-agentriot-design-system-design.md`
remains the higher-level rationale, and `DESIGN.md` translates that rationale
into implementation-ready rules.

Implementation must encode:

- neutral-first palette with one controlled accent
- balanced light and dark themes from day one
- mono accent usage for labels, tags, dates, and prompt-adjacent UI
- utility-led homepage behavior
- modular homepage, stricter collection pages, practical detail pages

## Responsive and accessibility requirements

Responsive behavior must be intentional per surface.

Desktop:

- homepage uses modular section rhythm with denser side-by-side composition
- collection pages prioritize fast scan density
- detail pages place identity and metadata above practical content blocks

Tablet:

- homepage modules reflow into fewer columns without losing signal strip and
  lead story priority
- filters move into a compact but persistent control area

Mobile:

- homepage keeps the hero short and moves directly into current signal
- signal strip becomes a swipe-safe stacked sequence, not tiny unreadable cells
- collection pages prioritize search, filter access, then results
- detail pages keep title, summary, metadata, main action, then body
- public navigation uses a compact sticky header with brand and search entry,
  plus horizontally scrollable section chips for key destinations instead of a
  buried hamburger-only pattern

Accessibility requirements:

- keyboard-reachable navigation, search, filters, tabs, and prompt copy actions
- minimum 44px touch targets
- semantic landmarks for header, nav, main, aside, footer
- color contrast sufficient in both themes
- screen-reader naming for icon-only actions
- visible focus states that match the high-trust design language

## Implementation phases

### Phase 1A: foundation

- bootstrap Next.js app with App Router
- configure TypeScript and Tailwind
- set up PostgreSQL and Drizzle
- set up Better Auth for admin-only auth
- create shared layout shells for public and admin
- establish design tokens and theme scaffolding

### Phase 1B: graph schema and shared systems

- implement core tables and join tables
- implement scoped taxonomy system
- implement shared slug and redirect policy
- implement seed and fixture strategy
- implement graph query utilities

### Phase 1C: thin admin

- admin auth flow
- CRUD for content, agents, prompts, and skills
- relation editing
- draft and publish flow
- verification state support

### Phase 1D: public routes

- homepage
- article and tutorial listings and detail routes
- agents browse and detail routes
- prompts browse and detail routes
- skills browse and detail routes
- search route

### Phase 1E: SEO and machine outputs

- metadata wiring
- sitemap generation
- robots
- llms
- structured data
- canonical and redirect behavior

### Phase 1F: quality gate

- bootstrap Vitest and Playwright
- implement shared test contracts
- implement canonical fixtures
- cover critical admin and public browse flows
- responsive and accessibility pass

## Test plan summary

Phase 1 testing is not optional. The product risk is cross-surface behavior.

### Required test layers

- Vitest for graph logic, slug rules, taxonomy rules, metadata generation,
  relation helpers
- Playwright for admin publishing and public browse flows

### Coverage diagram

```text
CODE PATH COVERAGE
===========================
[+] Shared graph logic
    │
    ├── [REQ] taxonomy scope rules
    ├── [REQ] slug generation + history + redirect policy
    ├── [REQ] relation mapping across entity types
    └── [REQ] SEO metadata generation per entity type

[+] Admin publishing flows
    │
    ├── [REQ] sign in → create content → relate entities → publish
    ├── [REQ] edit entity → change taxonomy/relations → verify public update
    ├── [REQ] draft stays private
    └── [REQ] slug change preserves routing behavior

[+] Public browse flows
    │
    ├── [REQ] homepage → lead story → related entity navigation
    ├── [REQ] browse directory → filter by taxonomy → open detail page
    ├── [REQ] search across mixed entity types
    └── [REQ] zero-result and sparse-state behavior

[+] Prompt and interaction UX
    │
    ├── [REQ] copy prompt block feedback
    ├── [REQ] prompt compatibility rendering
    └── [REQ] long content and multi-related-entity layouts
```

### Failure modes

| Codepath | Real failure mode | Test required | Error handling required | User impact if missed |
|---|---|---|---|---|
| Homepage section queries | one section query fails and breaks the full homepage | yes | yes, section fallback | silent blank or 500 |
| Related-content queries | relation explosion causes slow detail routes | yes | yes, bounded query shape | slow pages |
| Slug changes | stale route or broken canonical path | yes | yes, redirect policy | dead links, SEO damage |
| Draft publishing flow | unpublished content leaks publicly | yes | yes | trust break |
| Search | wrong entity ranking or empty results on valid query | yes | yes | product feels useless |
| Taxonomy filters | cross-scope filters show wrong records | yes | yes | browse corruption |
| Copy prompt action | copy button silently fails | yes | yes, feedback state | UX distrust |

Critical gaps flagged: **0**, assuming these requirements stay in phase 1.

## What already exists

There is almost no existing product code.

What exists today:

- `DESIGN.md` as the implementation-ready design system anchor
- approved design system spec at
  `docs/superpowers/specs/2026-03-27-agentriot-design-system-design.md`
- approved `/office-hours` design doc in `~/.gstack/projects/...`
- approved `/plan-eng-review` decisions captured in this plan

Reuse status:

- reuse the approved design language directly
- reuse the graph-first product framing directly
- do not invent parallel schemas, admin systems, or route policies outside this
  plan

## NOT in scope

These items were considered and explicitly deferred from phase 1:

- public read API
  - defer until the graph and public routes are stable
- ingestion API
  - defer until the manual editorial workflow proves the schema
- API key management
  - defer until a trusted machine publisher exists
- audit console
  - defer until there is meaningful operational activity to inspect
- redirect management UI
  - defer until shared slug policy exists and manual redirects become a real
    editing need
- public accounts, saved items, favorites, personalization
  - defer until anonymous public usage proves repeat behavior, but keep Better
    Auth as the foundation from day one
- rich admin dashboards and stats
  - defer until content operations produce enough data to justify them

## Deferred backlog triggers

Use these triggers to decide when deferred work moves back in:

- Add public read API after the content graph and public browse routes are
  stable and external consumers are real, not hypothetical.
- Add ingestion API after at least one full manual editorial cycle proves the
  schema, relation rules, and publish workflow.
- Add API key management after the first trusted automation publisher exists.
- Add redirect management UI after editors need to manage slug changes without
  touching the database directly.
- Add audit views after content operations become multi-user enough that action
  history matters in practice.
- Add public accounts after anonymous usage proves that saving, following, or
  personalization would change retention.

## TODOS.md plan

After this plan is approved, create `TODOS.md` and add deferred items one at a
time with the trigger context above. Do not dump vague bullets. Each TODO must
state the work, why it matters, and what unlocks it.

## Parallelization strategy

This plan has real parallelization opportunities once the foundation is in
place.

### Dependency table

| Step | Modules touched | Depends on |
|---|---|---|
| Foundation setup | app/, db/, config/ | — |
| Graph schema and shared systems | db/, lib/, admin/ | Foundation setup |
| Thin admin | admin/, app/admin/, lib/ | Graph schema and shared systems |
| Public routes | app/, components/, lib/ | Graph schema and shared systems |
| SEO and machine outputs | app/, lib/ | Public routes |
| Test scaffolding and fixtures | tests/, e2e/, db/, lib/ | Graph schema and shared systems |

### Parallel lanes

- Lane A: Foundation setup → Graph schema and shared systems
- Lane B: Thin admin
- Lane C: Public routes → SEO and machine outputs
- Lane D: Test scaffolding and fixtures

### Execution order

Launch Lane A first.

After Lane A lands:

- launch Lane B + Lane C + Lane D in parallel

Then merge:

- Lane B
- Lane C
- Lane D

Finish with:

- final integration pass across admin publish flow, homepage composition, and
  tests

### Conflict flags

- Lanes B, C, and D all touch `lib/`, so coordination is required.
- Lanes B and D both depend on relation and slug helpers, so shared contracts
  must be agreed before parallel work starts.

## Lake score

Recommendations choosing the complete option: 12/12

## Completion summary

- Step 0: Scope Challenge — scope reduced per recommendation
- Architecture Review: 5 issues found
- Code Quality Review: 3 issues found
- Test Review: diagram produced, 14 required paths identified
- Performance Review: 2 issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: 0 items proposed yet, to be added after plan approval
- Failure modes: 0 critical gaps flagged
- Outside voice: skipped
- Parallelization: 4 lanes, 3 parallel after foundation / 1 initial sequential

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 24 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score: 7/10 → 9/10, 9 decisions |

**UNRESOLVED:** 0

**VERDICT:** ENG + DESIGN CLEARED — ready to implement.
