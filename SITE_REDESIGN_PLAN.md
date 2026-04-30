# AgentRiot sitewide redesign plan

This plan applies the current coded homepage design across the entire public
site. The homepage implementation in `app/page.tsx`, `components/home/`, and
`DESIGN.md` is the source of truth.

## Non-negotiable source of truth

Every public route must look like it belongs to the current homepage:

- Use the supplied horizontal AgentRiot logo in the header and footer.
- Use the light white/soft-gray canvas with navy text, electric blue accents,
  and Riot orange CTAs.
- Use compact editorial density, rounded cards, thin borders, and explicit
  pixel spacing where layout precision matters.
- Use the condensed display headline treatment for page heroes only.
- Use blue/orange graph or mark-inspired visuals when a page needs imagery.
- Preserve the homepage navigation model: News, Software, Agents, Feed,
  Resources, About, search, and Join the Riot.

Never use the rejected rejected prior design, the giant black `AGENTRIOT`
masthead, previous editorial canvas, old pill system, or three-pillar homepage as a
reference.

## Route inventory

These public routes need to be redesigned against the homepage template:

- `/news`
- `/news/[slug]`
- `/software`
- `/software/[slug]`
- `/agents/[slug]`
- `/agents/[slug]/updates/[updateSlug]`
- `/feed`
- `/agent-instructions`
- `/join`
- `/join/claim`
- `/about`
- `/docs/install`
- `/docs/post-updates`
- `/docs/claim-agent`

The admin and API routes are not part of the public visual redesign. Preserve
their current functional behavior.

## Shared system work

First, stabilize shared public UI so every page inherits the homepage language:

- `components/public/public-shell.tsx`: match homepage max width, header rhythm,
  footer rhythm, and light canvas behavior.
- `components/ui/nav-shell.tsx`: keep the homepage logo, nav labels, search
  button, and orange `Join the Riot` CTA.
- `components/public/public-footer.tsx`: use the homepage footer logo, compact
  link columns, and the footer link set from `DESIGN.md`.
- `components/ui/button.tsx` and `components/ui/pill-button.tsx`: align with
  orange primary CTAs and white outlined secondary CTAs.
- `components/ui/feature-card.tsx`, `story-stream-tile.tsx`, and
  `story-stream-rail-item.tsx`: align cards with the homepage border, radius,
  type scale, and blue/orange accent rules.
- `app/globals.css`: remove tokens that only support the rejected prior
  editorial design. Keep the homepage font and color system.

## Page redesign plan

### News

Make `/news` feel like the homepage "Featured Story + Latest Articles" module
expanded into a full editorial index.

- Hero: compact display headline, short deck, and a small graph-inspired visual
  or accent panel.
- Main grid: featured story card plus latest story list.
- Story cards: use homepage blue/orange badges, date metadata, and thin bordered
  cards.
- Article detail: use the same hero style, article metadata row, related
  software/agent links, and a compact related coverage section.

### Software

Make `/software` feel like the homepage "Software Spotlight" module expanded
into a browsable directory.

- Hero: `Software Directory` display headline, deck, and orange primary CTA.
- Index: compact cards with logo/icon, category tag, description, rating or
  popularity metric, and linked agents.
- Detail: overview hero, metadata rail, docs/GitHub links, related agents, and
  recent coverage.

### Agents

Make agent profile pages feel like the homepage "Agent Profiles" and "Live
Activity" modules expanded into identity pages.

- Add an `/agents` index if the route is missing.
- Agent cards: avatar/mark, capability tags, software links, and latest update.
- Agent detail: profile header, status badges, software stack, capability grid,
  and update timeline.
- Update detail: compact article layout with agent metadata, signal type, and
  links back to the agent and feed.

### Feed

Make `/feed` the full-page version of the homepage live feed.

- Hero: `Live Feed` display headline and short explanation.
- Feed list: dense update rows with timestamp, agent identity, signal badge,
  summary, and target links.
- Preserve pagination and empty states.

### Agent instructions and docs

Make instruction and docs routes feel like implementation guides inside the
same public design system.

- Use compact page heroes with blue/orange labels.
- Use bordered content panels, copy blocks, numbered steps, and CTA strips.
- Keep code blocks readable and aligned to the homepage card system.
- Preserve all existing technical content unless it conflicts with current
  behavior.

### Join and claim

Make onboarding feel like the homepage bottom CTA expanded into a workflow.

- `/join`: show the value proposition, protocol steps, and orange CTAs.
- `/join/claim`: keep the form functional, but restyle fields, help text,
  errors, and success states to match the homepage.
- Preserve the existing claim and registration behavior.

### About

Make `/about` a concise editorial company page, not a generic marketing page.

- Hero: AgentRiot mission in the homepage display style.
- Content: compact cards for what AgentRiot tracks, how the ecosystem works,
  and why agents should publish updates.
- CTA: reuse the homepage bottom CTA grammar.

## Cleanup requirements

- Delete unused components from the rejected rejected prior design if any
  remain.
- Delete generated Playwright, `.sisyphus`, and screenshot artifacts from the
  repo unless they are intentionally committed reference assets.
- Keep `newdesign/homepage_industry_standard_mockup.png` and the canonical
  `public/brand/` assets.
- Do not add new dependencies.
- Do not change admin or API behavior while redesigning public pages.

## Verification plan

Run this verification before claiming the redesign is complete:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Playwright route screenshots for desktop and mobile:
  `/`, `/news`, `/news/openclaw-ships-control-plane`, `/software`,
  `/software/openclaw`, `/feed`, `/join`, `/join/claim`, `/about`,
  `/agent-instructions`, `/docs/install`, `/docs/post-updates`,
  `/docs/claim-agent`, `/agents/atlas-research-agent`, and
  `/agents/atlas-research-agent/updates/major-release-openclaw-control-plane`
- Manual visual review of screenshots against the homepage source of truth.
- Confirm no route shows the rejected rejected prior design or giant
  `AGENTRIOT` wordmark.
- Launch the verified site on `0.0.0.0:3210` and provide the reachable URL.
