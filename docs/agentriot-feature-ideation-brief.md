# AgentRiot feature ideation brief

AgentRiot is a developer-leaning AI intelligence hub for agentic coders.
The product combines a public publishing surface, a connected content graph,
and a machine-readable API layer. This document is meant to give another agent
enough context to propose useful features and product ideas without having to
reverse-engineer the codebase first.

## Product summary

AgentRiot helps agentic coders discover the models, agents, prompts, skills,
and tutorials worth using now by combining current AI news with a structured,
high-trust intelligence hub.

The current product is not just a blog and not just a directory. It is a
connected graph of:

- articles
- tutorials
- agents
- prompts
- skills
- taxonomy terms

The core product thesis is that these records become more useful when they are
linked together. A user should be able to move from a news item to a related
agent, from an agent to a related prompt, and from a prompt to a related skill
or tutorial without hitting dead ends.

## Target user

The primary user is an agentic coder or AI builder who is trying to keep up
with useful AI changes without living in X, GitHub trending, newsletters, and
Discord all day.

The practical pain is fragmented discovery:

- too much low-signal noise
- too many disconnected sources
- useful prompts, workflows, repos, and writeups get buried
- current tools do not connect editorial signal with structured discovery very
  well

## Current product shape

### Public site

The public site already exists and includes:

- `/`
- `/articles`
- `/tutorials`
- `/agents`
- `/prompts`
- `/skills`
- `/search`
- `/about`
- `/api`

Each main entity also has a detail page. Detail pages surface related graph
links, taxonomy, and metadata.

### Admin

The admin console already exists and includes:

- content CRUD
- agent CRUD
- prompt CRUD
- skill CRUD
- taxonomy CRUD
- API key management
- relation editing
- content revision history

Auth is admin-only through Better Auth. There are no public user accounts yet.

### Machine-readable outputs

These are already implemented:

- public read API under `/api/v1`
- ingestion API under `/api/v1/ingest`
- `llms.txt`
- `robots.txt`
- `sitemap.xml`
- RSS feed
- JSON feed

### Ingestion coverage already shipped

Create-only ingestion is already supported for:

- articles
- tutorials
- agents
- prompts
- skills
- taxonomy

Replace-all taxonomy assignment ingestion is already supported for:

- content
- agents
- prompts
- skills

### Testing and quality

The repo is not a sketch. It already has:

- unit and integration coverage with Vitest
- public browser coverage with Playwright
- admin browser coverage with Playwright
- seeded local data for dogfooding the graph

The project is developed locally on port `3011`.

## Current architecture

The application is a Next.js App Router project backed by PostgreSQL and
Drizzle ORM.

Key stack choices:

- Next.js
- PostgreSQL
- Drizzle ORM
- Better Auth
- Tailwind CSS
- shadcn/ui
- Vitest
- Playwright

The content graph is modeled explicitly in the database. Important join tables
already exist for cross-entity relationships, including:

- `content_agents`
- `content_prompts`
- `content_skills`
- `agent_prompts`
- `agent_skills`
- `skill_prompts`

The current ingestion design philosophy is consistent:

- scoped API key auth
- explicit idempotency with `Idempotency-Key`
- replace-all mutation semantics for assignment endpoints
- stable JSON envelopes
- explicit validation and rejection of unknown fields

## What is already true about the product

Any proposed feature ideas should assume these are already true:

- the product is broad, not a single-surface MVP
- the content graph is the moat
- the public API already exists
- machine publishing already exists
- admin operators can already manage records manually
- public pages are crawlable and server-rendered
- design direction is already set and should not be reinvented from scratch

## What is not implemented yet

This is the real current gap list, not the original historical roadmap.

### Highest-priority platform gap

The biggest unfinished platform feature is:

- atomic content publish ingestion

Today the API can create content, assign content taxonomy, and replace content
relations, but it still requires multiple machine calls to fully publish a
single article or tutorial. That means the machine layer is still more
primitive than the editorial workflow it is trying to support.

The expected next implementation slice is:

- `POST /api/v1/ingest/content-publish`

That should upsert one content record and replace all of its current graph
state in one transaction:

- content fields
- content taxonomy
- related agents
- related prompts
- related skills

Later, that atomic publish pattern can expand to agents, prompts, and skills.

### Other deferred items

Still not implemented:

- atomic publish workflows for agents, prompts, and skills
- broader graph mutation beyond the symmetric relation endpoints
- redirect management UI
- public accounts
- saved items
- personalization
- audit log view

These are deferred on purpose. They are not missing by accident.

## Product constraints for ideation

Another agent should not propose features as if this were a blank slate. Use
these constraints:

### Keep the graph central

Feature ideas are more useful if they deepen the graph rather than create a
totally separate product island.

Good examples:

- better ways to discover connected records
- stronger related-entity workflows
- graph-aware recommendation surfaces
- editorial tooling that improves graph density or trust
- API features that make machine publishing more complete

Weak examples:

- generic community features with no graph tie-in
- abstract dashboards that do not improve discovery
- random SaaS add-ons that do not help users find or use AI resources

### Respect the current product tone

AgentRiot is:

- developer-leaning
- utility-first
- structured
- editorial, but not a magazine
- public-facing, but not a generic marketing site

Feature ideas should fit that product feel.

### Avoid duplicating what already exists

Do not pitch these as if they are new:

- basic CRUD for content and directories
- public collections and detail pages
- public read API
- API key management
- create-only ingestion
- taxonomy assignment ingestion
- search
- feeds and machine-readable outputs

## High-value ideation areas

If another agent is trying to generate useful ideas, these are the best places
to explore:

### 1. Graph completion

How can AgentRiot make cross-entity linking denser, easier, and more valuable?

Examples:

- relation mutation ingestion
- suggested related records in admin
- confidence scoring for machine-suggested links
- graph-health diagnostics

### 2. Editorial intelligence

How can the product help operators publish higher-signal content?

Examples:

- stale-record detection
- "recently changed in the AI world" editorial queues
- source attribution workflows
- publish checklists for graph completeness

### 3. Discovery improvements

How can users find better things faster?

Examples:

- stronger search ranking
- browse-by-workflow or browse-by-use-case
- “what changed this week” surfaces
- comparison views between similar agents or prompts

### 4. Machine publishing maturity

How can the machine-facing product become more complete and more trustworthy?

Examples:

- relation mutation endpoints
- ingestion dry-run mode
- publish previews
- richer idempotency inspection
- ingestion diagnostics in admin

### 5. Trust and freshness

How can users know what is current and what is stale?

Examples:

- verification states
- freshness scoring
- “last checked” visibility
- editorial confidence signals

## What a good feature idea looks like

A good feature proposal for this project should answer:

1. Which user problem does it solve?
2. Why is it a better fit for AgentRiot than for a generic content site?
3. How does it make the graph stronger, denser, or more useful?
4. Does it fit the current admin, API, and public architecture?
5. Is it phase-appropriate, or is it premature?

## Suggested prompt for another agent

You can give another agent something like this:

> You are helping evolve AgentRiot, a developer-leaning AI intelligence hub
> for agentic coders. The product already has public browse/detail pages,
> admin CRUD, a public read API, create-only ingestion for core entities,
> taxonomy assignment ingestion, and API key management. The main unfinished
> platform gap is graph relation mutation ingestion. Generate feature ideas
> that build on the current product instead of restarting it. Prioritize ideas
> that strengthen discovery, graph density, machine publishing, trust, or
> editorial usefulness. Separate ideas into: near-term product wins, mid-term
> platform improvements, and speculative but high-upside bets.

## Bottom line

AgentRiot is already a functioning product with a real graph, a real admin, a
real API, and a machine publishing surface.

The next ideas should not be "what should this app be?" They should be "what
makes this graph more useful, more current, and harder to replace?"
