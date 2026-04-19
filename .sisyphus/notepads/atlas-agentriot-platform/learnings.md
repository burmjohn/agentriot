# AgentRiot Platform - Learnings & Conventions

## Project Context
- Greenfield Next.js App Router project
- Design source: DESIGN.md (The Verge-inspired dark editorial)
- Product source: AgentRiot_V2_Project_Plan.md
- Database: PostgreSQL on 192.168.0.25, user agentriot/agentriot
- Dev DB: agentriot_dev, Test DB: agentriot_test

## Stack Decisions (to be verified)
- Next.js (stable, verified from official sources)
- React + React DOM (stable)
- TypeScript (stable)
- Tailwind CSS v4
- Drizzle ORM + Drizzle Kit
- PostgreSQL (pg driver)
- Vitest (unit tests)
- Playwright (e2e tests)
- shadcn/ui

## Design Tokens (from DESIGN.md)
- Canvas: #131313 (dark only, no light mode)
- Primary accent: #3cffd0 (Jelly Mint)
- Secondary accent: #5200ff (Verge Ultraviolet)
- Surface: #2d2d2d
- Text primary: #ffffff
- Text secondary: #949494
- Border: 1px hairlines (white, mint, purple)
- Radius scale: 2px, 3px, 4px, 20px, 24px, 30px, 40px, 50%
- Typography: Manuka (display, 60px+), PolySans (UI), PolySans Mono (labels/timestamps, UPPERCASE only)
- No gradients, no shadows for elevation, no light mode

## Content Boundaries (locked)
- Self-service public content: agents, agent_updates only
- Admin-managed: news, software
- No public software submissions in v1
- No public news publishing in v1

## Route Inventory
### Public (indexable)
- /, /news, /news/[slug], /software, /software/[slug]
- /agents, /agents/[slug], /agents/[slug]/updates/[slug]
- /feed, /join, /join/claim
- /docs/install, /docs/post-updates, /docs/claim-agent
- /agent-instructions, /about

### Admin (noindex)
- /admin, /admin/news, /admin/software, /admin/agents
- /admin/moderation, /admin/api-keys, /admin/activity

### API
- /api/agents/register, /api/agents/claim
- /api/agents/[slug]/updates
- /api/admin/*

## Admin Auth Contract
- Internal-only, single-role admin auth
- Seeded dev/test fixture: admin@agentriot.local / agentriot-admin-dev
- No public user accounts in v1

## Agent Update Payload Contract (v1)
- title: max 80 chars
- summary: max 240 chars
- whatChanged: max 500 chars
- skillsTools: up to 5 tags
- one optional approved public link

## Signal Taxonomy
- Global feed eligible: major_release, launch, funding, partnership, milestone, research
- Profile-only: status, minor_release, bugfix, prompt_update

## Moderation Rules
- Banned agents: return 404, removed from sitemaps, posting blocked
- Posting-restricted: profile stays public, update creation returns 403

## Implementation Skills for Atlas/Sisyphus
- shadcn, shadcn-ui
- vercel-react-best-practices
- frontend-design
- test-driven-development
- playwright-expert
- requesting-code-review
- Context7 + web search for package verification
