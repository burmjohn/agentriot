# AgentRiot

AgentRiot is a developer-leaning AI intelligence hub for agentic coders.
Phase 1 includes a public graph for agents, prompts, skills, tutorials, and
articles, plus a thin admin console for managing records and relationships.

## What is in the repo

The current build includes the following surfaces:

- Public routes for `/`, `/agents`, `/prompts`, `/skills`, `/tutorials`,
  `/articles`, and `/search`.
- Dynamic detail pages for published agents, prompts, skills, tutorials, and
  articles.
- A thin admin console under `/admin` for content, directory records,
  taxonomy, and graph relations.
- Better Auth for admin-only sign-in.
- Drizzle ORM with PostgreSQL.
- SEO and machine-readable outputs at `/robots.txt`, `/sitemap.xml`, and
  `/llms.txt`.
- A canonical local seed dataset for dogfooding the public graph.
- Browser-tested public graph flows plus an isolated admin bootstrap flow.

## Requirements

You need the following tools installed locally:

- Node.js 24.x
- pnpm 10.x
- PostgreSQL running on `localhost:5432`

The default local database URL is:

```bash
postgres://postgres:postgres@localhost:5432/agentriot
```

## Environment setup

Create a local env file before you start the app.

```bash
cp .env.example .env
```

The example env file pins the local app to port `3011` so it does not collide
with another project using `3000`.

Set `ADMIN_EMAIL_ALLOWLIST` to at least one email address if you want the
bootstrap admin signup flow to be available on `/sign-in`.

If `ADMIN_EMAIL_ALLOWLIST` is empty, sign-in still works for existing admins,
but new admin creation is disabled by design.

## Install dependencies

Install dependencies with pnpm.

```bash
pnpm install
```

## Initialize the database

Create the local database if it does not exist yet.

```bash
PGPASSWORD=postgres createdb -h localhost -U postgres agentriot
```

Run the existing migration.

```bash
pnpm db:migrate
```

Load the canonical fixture graph.

```bash
pnpm db:seed
```

The seed script creates published agents, prompts, skills, tutorials,
articles, taxonomy terms, and graph links so the public site is immediately
usable in local development.

## Run the app

Start the development server with:

```bash
pnpm dev
```

Then open the following routes:

- `http://localhost:3011/`
- `http://localhost:3011/search?q=repo`
- `http://localhost:3011/agents`
- `http://localhost:3011/articles`
- `http://localhost:3011/sign-in`

## Main scripts

Use these scripts during development:

```bash
pnpm dev
pnpm test
pnpm test:e2e
pnpm test:e2e:admin
pnpm lint
pnpm typecheck
pnpm build
pnpm db:migrate
pnpm db:seed
```

## Testing and verification

The repo currently uses:

- Vitest for unit-level checks
- Playwright for seeded public browser flows
- A separate isolated Playwright config for bootstrap admin auth on port `3012`
- Next.js build for route and metadata validation
- Seeded local data for smoke-testing the public graph

The full local verification set is:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm test:e2e:admin
```

## Next steps

If you are continuing implementation, the next practical steps are:

1. Add deeper admin E2E coverage for relation editing and taxonomy workflows.
2. Add media handling for content records.
3. Add deployment and production environment configuration when you move past local-only development.
