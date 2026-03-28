# AgentRiot design system

This document is the design source of truth for AgentRiot. It turns the
approved design spec into implementation-ready rules so you can make visual
decisions consistently as the product grows.

AgentRiot is a developer-leaning AI intelligence hub for agentic coders. The
product must feel current, useful, and high-trust. It is not an editorial
publication, and it is not an admin dashboard. The right feeling is a polished
discovery console with calm surfaces and dense signal.

## Core principle

Use this rule everywhere:

**Calm surface, dense signal.**

The page must stay visually controlled while each section carries useful
information. Users should feel they can scan quickly without losing trust.

## Product posture

Design every surface around these truths:

- the homepage is utility-led, not manifesto-led
- the graph between content types is the product
- metadata matters
- broad launch only works if every section feels curated, not thin
- empty and error states are part of the experience, not implementation debris

## Brand feeling

The product should feel:

- technical
- current
- slightly playful
- high-trust
- fast to scan

The product should not feel:

- editorial-magazine
- enterprise admin
- generic SaaS marketing
- neon cyberpunk AI

## Typography

Typography carries most of the brand.

Use a three-role type system:

- **Body:** a readable sans for long-form copy and dense UI text
- **Headlines:** a sharper sans with more character and stronger weight
- **Accent:** a mono face for labels, metadata, tags, timestamps, and
  prompt-adjacent UI

Recommended type pairing:

- **Headlines and body:** `Manrope`
- **Accent mono:** `IBM Plex Mono`

If `Manrope` is not the right fit in implementation, the fallback direction is
still the same: one clean sans with enough personality to avoid startup-generic
feel, plus one technical mono accent.

Rules:

- don't use Inter as the primary brand typeface
- don't use monospace for the whole interface
- use mono where structure matters
- keep headings compact and high-contrast
- keep metadata small but legible

## Color system

Use a neutral-first palette with one controlled accent.

Base palette:

- `--bg`: `#f6f6f4`
- `--surface`: `#fbfbfa`
- `--surface-2`: `#f0f1ed`
- `--text`: `#1d1f1f`
- `--text-muted`: `#636764`
- `--border`: `#d8ddd8`

Dark mode:

- `--bg-dark`: `#121514`
- `--surface-dark`: `#181c1b`
- `--surface-2-dark`: `#202524`
- `--text-dark`: `#eef2ef`
- `--text-muted-dark`: `#a4ada7`
- `--border-dark`: `#313735`

Accent:

- `--accent`: `#7be0c3`
- `--accent-strong`: `#27c197`

Rules:

- use the accent sparingly
- accent is for links, active states, selected filters, and featured markers
- no purple default gradients
- no decorative color noise
- dark mode must feel like a serious research console, not a gamer skin

## Layout rules

AgentRiot uses three layout modes.

### Homepage

The homepage is modular and varied.

The user should understand:

1. what AgentRiot is
2. what changed now
3. what to open next

Use this sequence:

1. compact hero
2. signal strip
3. lead story
4. discovery blocks
5. browse support

The hero must stay short. Do not let the page drift into a giant poster with no
usable content visible.

### Collection pages

Collection pages are stricter and denser.

They need:

- section identity
- scoped filters
- fast-scanning result grids or lists
- clear zero-result states

These pages are browse surfaces, not editorial layouts.

### Detail pages

Detail pages are practical and modular.

The user should understand:

1. what this is
2. why it matters
3. how to use it
4. where to go next

Every detail page needs:

- identity block
- summary
- metadata row
- main content
- related graph navigation

## Homepage section rules

Keep these sections on the homepage:

- hero
- signal strip
- lead story
- featured agents
- model news
- prompts
- skills
- tutorials and articles
- trending topics
- recently updated

Sparse-state rule:

- all top-level sections remain visible
- sparse sections use designed "coming into focus" states
- never render dead "No items found" boxes on the homepage
- if a section is sparse, show one useful item if possible and one action into
  the section

## Card rules

Cards are not the default layout primitive. Cards exist only when the card is
the interaction.

Card rules:

- keep cards compact
- every card must carry useful metadata
- titles must say something real
- body copy must stay short
- related-count or verification metadata is valuable

Do not use:

- ornamental icon circles
- fat card mosaics as a substitute for composition
- decorative shadows to fake depth

## Metadata language

Metadata is part of the product identity.

Use mono styling for:

- tags
- dates
- verification labels
- compatibility markers
- entity type labels
- section markers

Metadata should feel precise and useful, not ornamental.

## Mobile navigation

Mobile navigation must stay public-product friendly.

Use:

- a compact sticky top bar
- brand at left
- search entry as a primary action
- horizontally scrollable section chips for core destinations

Do not bury the entire product behind a hamburger-only pattern.

## Interaction states

Every significant UI feature needs loading, empty, error, success, and partial
states.

Rules:

- use section-level skeletons instead of full-page spinners when possible
- empty states need context and one useful next action
- partial failure should not take down the whole page
- admin saves need field-level and form-level feedback
- copy actions need visible success feedback

## Accessibility

Accessibility requirements are first-class.

You must support:

- visible focus states
- semantic landmarks
- keyboard navigation for search, filters, tabs, and copy actions
- minimum 44px touch targets
- sufficient contrast in both themes
- readable line lengths
- screen-reader labels for icon-only actions

## Responsive behavior

Do not treat mobile as "desktop but stacked."

Rules by viewport:

- **Desktop:** use the full modular rhythm and side-by-side composition
- **Tablet:** reduce columns, preserve hierarchy, keep filters accessible
- **Mobile:** shorten the hero, move quickly into live signal, prioritize
  search and section chips before deep browsing

## AI slop blacklist

Avoid these patterns:

- purple or violet AI gradients
- generic three-column feature grids
- icon circles as decoration
- centered-everything layouts
- decorative blobs
- cookie-cutter landing-page section rhythm
- a dashboard-card mosaic as the homepage first impression
- vague hero copy

If a layout feels like any other AI-generated startup page, it is wrong.

## Component vocabulary

The first implementation should establish these reusable parts:

- metadata row
- content card
- featured entity card
- scoped filter bar
- related-content section
- copyable prompt block
- section header with utility CTA
- sparse-state block
- empty-state block
- status badge

## Trust details

Trust is earned at the pixel level.

Show these clearly where relevant:

- updated date
- verified state
- compatibility
- source context
- related count
- whether something is a prompt, agent, skill, article, or tutorial

## What not to optimize for

Do not optimize for:

- splashy hero animation over clarity
- maximal color usage
- decorative gradients
- oversized cards
- inspirational copy with weak action
- fancy interactions that hide the graph

## Implementation note

When design and utility conflict, utility wins. When utility and trust conflict,
trust wins.

The goal is not just that AgentRiot looks good. The goal is that a technical
user opens the site and immediately feels that someone cared.

## Next steps

Use this file together with
`docs/superpowers/specs/2026-03-27-agentriot-phase-1-implementation-plan.md`
and
`docs/superpowers/specs/2026-03-27-agentriot-design-system-design.md`
during implementation. If implementation decisions diverge from this document,
update this file in the same change.
