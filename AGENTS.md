<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Agent Riot — Project Knowledge Base

**Project**: Agent Riot — AI agent/orchestrator/skill catalog and ingestion platform  
**Stack**: Next.js 16.2.1 + React 19.2.4 + TypeScript + Tailwind CSS 4 + Drizzle ORM + PostgreSQL  
**Package Manager**: pnpm 10.33.0 (enforced in `packageManager` field)  
**Dev Port**: 3011 (avoids port 3000 collisions)

---

## Quick Reference

| Task | Where to Look | Notes |
|------|---------------|-------|
| Add a page | `app/**/page.tsx` | App Router convention |
| Add an API | `app/api/v1/**/route.ts` | Versioned API under `/api/v1/` |
| Database schema | `db/schema/*.ts` | Drizzle table definitions |
| Ingestion logic | `lib/ingestion/` | Content ingestion services |
| Admin logic | `lib/admin/` | Admin-only operations |
| Public API logic | `lib/public/` | Public read endpoints |
| Tests | `tests/*.test.ts` | Unit tests with Vitest |
| E2E tests | `tests/e2e/*.spec.ts` | Playwright with Page Objects |

---

## Project Structure

```
./
├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── api/v1/       # Versioned API routes
│   ├── admin/        # Admin panel routes
│   ├── agents/       # Agent catalog pages
│   ├── prompts/      # Prompt catalog pages
│   ├── skills/       # Skill catalog pages
│   ├── tutorials/    # Tutorial pages
│   ├── articles/     # Article pages
│   ├── search/       # Search page
│   ├── sign-in/      # Auth pages
│   ├── _components/  # Private components (underscore prefix)
│   ├── feed.json/    # SEO: JSON feed route
│   ├── feed.xml/     # SEO: RSS feed route
│   ├── llms.txt/     # SEO: LLM-friendly text
│   ├── robots.ts     # SEO: robots.txt generator
│   └── sitemap.ts    # SEO: sitemap.xml generator
├── lib/              # Business logic
│   ├── admin/        # Admin operations
│   ├── api/          # Shared API utilities
│   ├── auth/         # Better Auth configuration
│   ├── content/      # Content utilities
│   ├── ingestion/    # Ingestion services (agents, prompts, skills, tutorials)
│   ├── public/       # Public read logic
│   └── seo/          # SEO utilities
├── db/               # Database (Drizzle ORM)
│   ├── schema/       # Table definitions
│   ├── index.ts      # Database client
│   └── seed.ts       # Seed script
├── tests/            # Test files
│   ├── *.test.ts     # Unit tests (Vitest)
│   └── e2e/          # E2E tests (Playwright)
├── docs/             # Documentation and specs
│   └── superpowers/  # Feature specs and plans
├── drizzle/          # Drizzle migrations
└── public/           # Static assets
```

---

## Non-Standard Patterns

### `_components/` Directory
Components prefixed with underscore are **private/internal** to their parent route segment. Not a standard Next.js convention but used here to indicate "do not import from outside this route."

### Dual Playwright Configs
- `playwright.config.ts` — Public site E2E (port 3011)
- `playwright.admin.config.ts` — Admin E2E (port 3012, isolated DB)

Admin tests run against a separate database (`agentriot_admin_e2e`) to avoid polluting main test data.

### No `middleware.ts`
Auth is handled at the route level via Better Auth, not Next.js middleware. This is intentional — middleware adds edge runtime complexity.

### SEO Routes as Directories
Static SEO files are implemented as directory-based route handlers:
- `feed.json/route.ts` — JSON feed
- `feed.xml/route.ts` — RSS feed  
- `llms.txt/route.ts` — LLM-friendly content list
- `robots.ts` — robots.txt (file, not directory)
- `sitemap.ts` — sitemap.xml (file, not directory)

### Content Graph Architecture
The platform manages a **content graph** with these entity types:
- **agents** — AI agents
- **prompts** — Reusable prompts
- **skills** — Agent capabilities
- **tutorials** — Educational content
- **articles** — Editorial content
- **taxonomy** — Tags and categories with graph relations

All ingest through `/api/v1/ingest/*` endpoints.

---

## Conventions

### Path Alias
- `@/*` → project root (configured in `tsconfig.json` and `vitest.config.ts`)

### Naming
- Unit tests: `*.test.ts` in `tests/`
- E2E tests: `*.spec.ts` in `tests/e2e/`
- Admin E2E: `admin-*.spec.ts` (excluded from main Playwright config)
- Database tables: plural, snake_case (e.g., `agents`, `taxonomy_terms`)
- Drizzle schema files: domain-based (e.g., `schema/agents.ts`, `schema/taxonomy.ts`)

### Database
- Strict mode enabled in Drizzle config
- Migrations in `./drizzle` directory
- Seed script: `db/seed.ts`

### TypeScript
- Strict mode enabled
- Target: ES2017
- Path alias `@/*` maps to project root

---

## Commands

```bash
# Development
pnpm dev              # Start dev server on port 3011

# Build
pnpm build            # Production build
pnpm start            # Start production server

# Code quality
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript check

# Tests
pnpm test             # Unit tests (Vitest)
pnpm test:e2e         # E2E tests (Playwright, port 3011)
pnpm test:e2e:admin   # Admin E2E tests (Playwright, port 3012)
pnpm test:e2e:headed  # E2E with visible browser

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
```

---

## Anti-Patterns (Explicit Rules)

From `DESIGN.md` and spec documents:

- **Never render dead "No items found" boxes on homepage**
- **Do not let hero sections drift into giant posters with no content**
- **Do not bury entire product behind hamburger-only navigation**
- **Do not treat mobile as "desktop but stacked"**
- **Do not invent parallel schemas, admin systems, or route policies outside this spec**
- **Do not dump vague bullets in TODOs**
- **Do not expose secrets in collection tables**
- **Do not jump straight into implementation without defining contracts**

---

## Notable Technical Debt

- `as never` casts in `lib/admin/relation-writes.ts` (lines 16, 19) — suppressing type errors rather than proper typing

---

## Missing Infrastructure

- **No CI/CD** — No `.github/workflows/`, `Dockerfile`, or `docker-compose.yml`
- **No coverage setup** in Vitest config
- **No staging environment** configuration

This is currently local-dev only.
