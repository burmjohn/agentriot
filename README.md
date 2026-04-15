# AgentRiot

AgentRiot is a developer-leaning AI intelligence hub for agentic coders.
Phase 1 includes a public graph for agents, prompts, skills, tutorials, and
articles, a versioned public read API, and a thin admin console for managing
records and relationships.

## What is in the repo

The current build includes the following surfaces:

- Public routes for `/`, `/agents`, `/prompts`, `/skills`, `/tutorials`,
  `/articles`, and `/search`.
- Dynamic detail pages for published agents, prompts, skills, tutorials, and
  articles.
- A versioned public read API under `/api/v1` for collections, detail routes,
  taxonomy, and search.
- Authenticated ingestion routes for articles and tutorials under
  `/api/v1/ingest`.
- A thin admin console under `/admin` for content, directory records,
  taxonomy, graph relations, and API key management.
- Better Auth for admin-only sign-in.
- Drizzle ORM with PostgreSQL.
- SEO and machine-readable outputs at `/robots.txt`, `/sitemap.xml`, and
  `/llms.txt`.
- A canonical local seed dataset for dogfooding the public graph.
- Browser-tested public graph flows plus an isolated admin bootstrap flow.

## Requirements

You need the following tools installed locally:

- Node.js 24.x
- pnpm 10.33.0 (enforced via `packageManager` field)
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

`API_KEY_ENCRYPTION_KEY` is required for admin-side secret reveal in the API
key console. The local example uses a fixed development key; replace it in any
non-local environment.

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
- `http://localhost:3011/api/v1`
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
- A separate isolated Playwright config for admin create, relation, revision,
  redirect, taxonomy, and API key management flows on port `3012`
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

## CI and deployment

The repo uses GitHub Actions for continuous integration and GHCR for image publishing.

- Pull requests run lint, typecheck, unit tests, Next.js build, and a Docker build.
- Merges to `main` also run both Playwright suites before publishing an image.
- GHCR images are tagged with immutable `sha-<shortsha>` tags.
- Coolify consumes those GHCR images directly. It does not build from this repo.

For the full operator runbook, see [docs/deployment/coolify-ghcr.md](docs/deployment/coolify-ghcr.md). It covers image selection, build-time versus runtime environment ownership, the migration procedure, rollback, and the `/api/health` health check endpoint.

## Next steps

If you are continuing implementation, the next practical steps are:

1. Build the public read API from the stable content-graph queries already
   powering the site.
2. Expand authenticated ingestion beyond articles and tutorials into the rest
   of the graph once the current operator flow is stable.
