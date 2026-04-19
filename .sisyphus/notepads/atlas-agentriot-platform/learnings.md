

## Task 5 Join the Riot and documentation surfaces notes (April 19, 2026)
- Created `/join` page with hero section, 5-step onboarding flow, prominent copyable prompt block (CopyBlock component), API endpoint reference cards, safety guidance, and doc cross-links.
- Created `/join/claim` page with API key claim form (extracted to client component `claim-form.tsx` to keep page server-rendered with noindex metadata), optional email field, explanation of claim process, and success state.
- Created `/docs/install` page with step-by-step connection guide, curl examples in CopyBlock, response format, authentication explanation, and endpoint reference.
- Created `/docs/post-updates` page with structured update payload format, allowed/forbidden content lists with visual indicators, rate limit rules, and moderation policy.
- Created `/docs/claim-agent` page with visual step timeline, what claiming means, why it matters (recovery, trust, management, notifications), and CTA to claim form.
- Created `/agent-instructions` page with full copyable system prompt, protocol reference, what AgentRiot is, how to join, auth/posting details, allowed/forbidden posts, privacy guidance, formatting expectations, rate limits, and onboarding prompt locations.
- Created `/about` page with three pillars (news, software directory, agent profiles), "Join the Riot" explanation, how public updates work, privacy/safety expectations, and coverage areas.
- New component: `components/ui/copy-block.tsx` — client component with copy-to-clipboard functionality, label, and visual feedback (COPY/COPIED states).
- All pages use `buildMetadata()` for indexable public pages and `buildNoindexMetadata()` for `/join/claim`.
- All pages use the dark editorial design system: NavShell, PillButton, PillTag, FeatureCard, StoryStreamTile/StoryStreamRailItem where appropriate.
- Strong internal linking: every doc page links back to `/join` and cross-links to other docs. `/join` links to all three docs and `/agent-instructions`.
- Removed stale test files in `tests/agents/` that referenced non-existent API routes and agent pages from future tasks.
- Fixed type error in `lib/agents/repository.ts` where `record.software` could be null.
- Build passes (`pnpm build`), typecheck clean (`pnpm typecheck`).
- Evidence screenshots saved: `.sisyphus/evidence/task-5-join-flow.png`, `task-5-docs-safety.png`, `task-5-claim-form.png`.

## Task 6 agent registration/claim/profile notes (April 19, 2026)
- Agent auth/runtime helpers now live under `lib/agents/` with separate files for repository contracts, runtime service logic, and typed payload/result models.
- Registration now slugifies from `name`, blocks reserved route words before suffixing, appends numeric suffixes for duplicates, and returns a one-time `agrt_...` key while only storing the SHA-256 hash plus an 8-character prefix.
- `agents.primarySoftwareId` was relaxed to nullable in the schema so Task 6 can publish public profiles immediately even when `primarySoftwareSlug` is omitted.
- Public agent profiles are dynamic App Router pages at `app/agents/[slug]/page.tsx`, use `buildMetadata`, `buildCanonical`, and `buildAgentProfileJsonLd`, and hard-hide banned agents with `notFound()`.
- The profile page renders the design-system StoryStream timeline using `StoryStreamRailItem` and falls back to an empty-state card when no updates exist yet.
- `createDefaultAgentService()` now supports an `AGENTRIOT_FILE_STORE_PATH` env override that swaps in a JSON-backed repository for local curl verification when the shared Postgres databases are unavailable.
- Task 6 tests live in `tests/agents/` and cover registration success, duplicate slugs, reserved slugs, valid claim, invalid claim, revoked claim, active profile rendering, and banned-agent 404 behavior.
- Task 6 evidence files: `.sisyphus/evidence/task-6-register.txt` and `.sisyphus/evidence/task-6-claim-reject.txt`.

## Task 7 agent updates/feed notes (April 19, 2026)
- Added `lib/updates/` with a dedicated update service, typed payload/result models, feed pagination helpers, and reusable global-feed signal classification.
- Extended the shared agent repositories (database, memory, and file-backed) to persist `agent_updates`, update `agents.lastPostedAt`, list global-feed rows, and keep per-agent profile timelines sorted newest-first.
- Added `app/api/agents/[slug]/updates/route.ts` with `X-API-Key` auth, payload validation, per-agent one-update-per-hour throttling, and `isFeedVisible` derived from `GLOBAL_FEED_SIGNAL_TYPES`.
- Added `/feed` as a public StoryStream rail with offset-style pagination, CollectionPage JSON-LD, and high-signal copy that explicitly excludes profile-only `status`, `minor_release`, `bugfix`, and `prompt_update` events.
- Added `/agents/[slug]/updates/[updateSlug]` as a public permalink page with article metadata, JSON-LD, full `whatChanged` copy, skills/tools pills, and optional public-link CTA.
- Updated `/agents/[slug]` so the profile timeline links to update permalinks and continues showing all updates, including profile-only ones.
- Added `tests/updates/` coverage for the posting API, feed filtering, profile timeline rendering, and update permalink rendering.
- Evidence files saved: `.sisyphus/evidence/task-7-feed-routing.txt`, `.sisyphus/evidence/task-7-rate-limit.txt`, and `.sisyphus/evidence/task-7-payload-guardrails.txt`.

## Task 8 curated news and software directory notes (April 19, 2026)
- Added `lib/news/` and `lib/software/` repositories, types, cached index exports, and local seed datasets so the content surfaces can render even when shared DB content is unavailable during local development.
- Created `/news` with a featured-story hero, editorial secondary story grid, and explicit cross-links into `/software` and `/agents`.
- Created `/news/[slug]` with article metadata, canonical handling, JSON-LD, structured body copy, plus related software and related agent links driven by content/tag matching.
- Created `/software` with category-filtered directory browsing and noindex metadata for filtered query states to avoid weak duplicate taxonomy pages.
- Created `/software/[slug]` with software metadata, JSON-LD, official/docs/download links, linked agents using the software, and related news coverage.
- Added `tests/content/pages.test.ts` to cover news/software rendering, article metadata, linked agents/news, filtered-directory noindex behavior, and 404 handling.
- Evidence screenshots saved: `.sisyphus/evidence/task-8-news-page.png` and `.sisyphus/evidence/task-8-software-links.png`.

## Task 9 editorial homepage and connected public IA notes (April 19, 2026)
- Redesigned `/` as an SEO-first editorial homepage with a massive "AGENTRIOT" display headline, three-pillar cards (AI/Agent News, Software Directory, Agent Profiles), featured news module, featured software module, recent agent activity feed, and a prominent "Join the Riot" CTA.
- Updated `lib/app-info.ts` APP_DESCRIPTION to be product-focused: "The public discovery platform for the agent ecosystem. News, software directory, and real agent profiles — all in one editorial stream."
- Created `components/home/pillar-card.tsx` with accent color top border, large number watermark, tag, headline, and deck for each pillar.
- Created `components/home/news-card.tsx` for featured editorial news articles with tag, headline, deck, publishedAt, and author.
- Created `components/home/software-card.tsx` for software directory highlights with tag, category, name, and description.
- Homepage uses `buildMetadata` with platform description, `buildOrganizationJsonLd` for structured data, and strong internal linking to `/news`, `/software`, `/agents`, `/feed`, `/join`, `/about`, and `/agent-instructions`.
- Feed module pulls live data via `getPublicGlobalFeedPage(1, 4)` and renders `StoryStreamRailItem` components with a fallback empty-state CTA when no updates exist.
- Added `tests/home/page.test.ts` with 4 tests covering module rendering, feed items, internal links, and SEO metadata.
- Fixed `tests/app-info.test.ts` expected description to match the updated APP_DESCRIPTION.
- Evidence files saved: `.sisyphus/evidence/task-9-homepage.png` and `.sisyphus/evidence/task-9-home-links.txt`.
