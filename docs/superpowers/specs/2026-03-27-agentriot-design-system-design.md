# AgentRiot design system spec

This document defines the approved design direction for AgentRiot before any
implementation work begins. It captures the visual thesis, layout rules,
content patterns, and interaction principles for a developer-leaning AI
intelligence product aimed at agentic coders.

## Product framing

AgentRiot helps agentic coders discover the models, agents, prompts, skills,
and tutorials worth using now by combining current AI news with a structured,
high-trust intelligence hub.

The product is not an editorial publication. It is not an admin dashboard
either. The site needs to feel like a public-facing discovery console for
technical users. The design must support fast scanning, connected navigation,
and repeat usage from users who want signal over hype.

## Core design thesis

AgentRiot should feel like a polished AI discovery console with strong
typography, dense signal, and restrained visual styling.

The core rule is: calm surface, dense signal.

That means the interface must stay visually controlled at the page level while
making each content block highly informative. The site should feel current and
alive, but never noisy or gimmicky.

## Audience and product intent

The primary audience is agentic coders. These users care about what changed in
AI, what tools are worth trying, what prompts are usable, and what workflows
can improve their output today.

The design must reflect that audience:

- prioritize utility over brand theater
- show live, current content early
- surface metadata that helps technical users judge relevance quickly
- make it easy to move between articles, agents, skills, prompts, and
  tutorials
- preserve enough visual personality that the site feels curated instead of
  generic

## Design references and translation

Two reference directions shape this system.

Kilo is the main inspiration for typography mood, structured personality, and
practical content layouts. The useful part of that reference is not the
cookbook theme itself. The useful part is the way Kilo makes structured content
feel crafted through strong type, compact metadata, and practical sections.

Linear is the main inspiration for discipline, scanning efficiency, and
technical trust. The useful part of that reference is the predictability of
cards, labels, lists, and status patterns.

AgentRiot should combine those qualities. It should borrow Kilo's clarity and
structured personality, then apply it with more system discipline and less
thematic play.

## Visual personality

The visual system should be hybrid, but clearly developer-leaning.

This means:

- not editorial-publication styling
- not enterprise admin styling
- not glossy landing-page marketing
- not cyberpunk AI branding

The product should feel high-trust, technical, and slightly playful in specific
places such as section labels, metadata treatments, and content framing.

The base UI must remain restrained. Personality comes from typography, rhythm,
and naming, not from decorative excess.

## Typography system

Typography carries most of the brand identity.

The type system should use three roles:

1. A readable sans-serif for body copy and long-form content.
2. A sharper, more distinctive headline treatment for major titles and section
   headers.
3. A mono or system-style accent for metadata, tags, dates, section markers,
   prompt blocks, and technical labels.

The product must not be fully monospace. Mono is an accent language, not the
entire interface. It should reinforce structure in technical moments, such as
prompt metadata, verification states, timestamps, and taxonomy labels.

Headlines should feel crisp and modern. Body copy should remain easy to read in
both light and dark mode. Labels should feel prompt-adjacent and slightly
lab-like without becoming a gimmick.

## Color and theming

AgentRiot must support light mode and dark mode as first-class experiences from
day one.

The system should use a restrained, neutral-first palette with one controlled
accent color. The likely direction is a graphite and off-white base with a
single electric accent in the cyan, blue, or acid-lime family. The accent must
be used sparingly for focus states, highlights, links, active filters, and
featured markers.

Light mode should feel crisp, high-trust, and fast. Dark mode should feel like
a serious research console, not a neon gaming interface. Both modes must share
the same hierarchy, spacing, and layout behavior so the brand remains stable
across themes.

## Density and spacing

The page-level rhythm should be moderately spacious, but the content blocks
inside that structure should be compact and information-rich.

This split is important:

- homepage sections need breathing room
- cards need to stay compact
- collection pages need tighter scanning density
- detail pages need structured depth without visual bloat

The result should feel efficient, not cramped. Users should feel they can scan
quickly while still trusting the curation and structure.

## Layout model

The site should not use one layout rhythm everywhere.

Use three primary layout modes:

1. Homepage: modular and varied.
2. Directory and taxonomy pages: rectangular, grid-strict, and efficient.
3. Detail pages: modular again, with structured information sections.

This creates a useful rhythm across the product. The homepage feels alive and
curated. Browse pages feel fast and systematic. Detail pages feel practical and
crafted.

## Homepage direction

The homepage must be utility-led.

It should not spend the top of the page selling a vague future-of-AI story. It
should explain the product quickly, then show real signal immediately.

Recommended homepage order:

1. A short hero with a sharp headline and a concise explanation.
2. A compact signal bar that shows fresh updates.
3. One lead story or major current update.
4. Structured discovery sections for agents, model news, prompts, skills, and
   tutorials.
5. A recently updated or recently verified cross-site feed.
6. Trending topics or curated taxonomy navigation.

The approved headline direction is:

`Track what changed in AI. Find what to use next.`

The hero must stay compact. Real content needs to appear above the fold or
immediately below it.

## Homepage card behavior

Homepage cards must be compact, scannable, and metadata-forward.

Every card should surface at least one strong informational cue, such as:

- type
- category
- updated date
- verified state
- compatibility
- related content count

Cards must not look like generic blog teasers. Titles should state utility or
meaning clearly. Supporting text should stay short. Related links should be
prominent enough to reinforce the content graph.

## Collection and taxonomy pages

Directory and listing pages should use stricter grids, tighter filters, and
more operational browsing patterns than the homepage.

These pages should emphasize:

- predictable card structure
- strong filter bars
- compact metadata chips
- useful sorting and taxonomy affordances
- scan speed over visual drama

The goal is to help users compare options quickly. The page must feel like a
technical browse surface, not an editorial feed.

## Detail page patterns

Each content type should use the same design language, but different page
behavior.

### Skills

Skills should feel practical and structured. This content type can take the
most direct inspiration from the Kilo detail layouts.

Recommended structure:

- back link and section marker
- strong title and outcome summary
- compact metadata row
- structured sections such as Overview, How it works, Setup, Examples, and
  Related
- copy-friendly areas for prompts, commands, or reusable steps

### Agents

Agent pages should feel more like verified product records.

Recommended structure:

- title and short description
- metadata row with type, categories, pricing or licensing, and last verified
- feature list
- external links
- related prompts, skills, tutorials, and articles
- an optional use-cases section

### Prompts

Prompt pages should optimize for immediate use.

Recommended structure:

- title and short summary
- prompt type and compatibility
- large copyable prompt body
- optional variables and examples
- related agents, skills, and tutorials

### Articles and tutorials

Articles and tutorials should share one content engine, but not one visual
presentation.

Tutorials should foreground prerequisites, steps, and practical outcomes.
Articles should foreground freshness, source context, and why the update
matters. Both must surface related entities prominently so they feed the wider
content graph.

## Components and interaction patterns

The design system should prioritize reusable parts that support the discovery
model.

Core components include:

- content cards
- featured entity cards
- metadata rows
- taxonomy chips
- filter bars
- related-content strips
- copyable prompt blocks
- comparison tables
- status or verification badges
- skeletons and empty states

These parts should feel visually related, but they must support different
density levels depending on the page context.

## Content graph expression

The interface must constantly reveal connections between entities.

Users should be able to move from an article to a related agent, from an agent
to a related skill, from a skill to a related prompt, and from a prompt to a
related tutorial without friction. The graph should be visible through related
sections, metadata associations, and clear supporting navigation.

This is the core moat of the product. The design must make that system obvious.

## Accessibility and quality bar

The site must aim for strong accessibility and clarity from the beginning.

Requirements:

- readable contrast in both themes
- strong focus states
- keyboard-accessible navigation and filters
- clear heading hierarchy
- readable line lengths in long-form content
- copy interactions that provide clear feedback
- responsive layouts that preserve hierarchy on mobile

The design should feel refined, but the quality bar is functional. If a visual
choice hurts scanning, readability, or usability, the utility requirement wins.

## Non-goals

The design system must avoid these traps:

- generic AI purple gradients
- oversized manifesto-style heroes
- empty library surfaces with thin content
- overdesigned cards that hide metadata
- overly playful thematic gimmicks
- purely editorial layouts that weaken browse utility
- sterile enterprise dashboard styling

## Implementation guidance

Build the system in a way that lets the homepage, collection pages, and detail
pages share tokens and components while still expressing different densities and
rhythms.

The first implementation pass should prove:

- utility-led homepage hierarchy
- a compact metadata-rich card system
- a balanced light and dark theme
- one strong directory page pattern
- one strong skill detail page pattern

Those surfaces are enough to validate whether the design direction is working.

## Current limitations

This workspace is not a git repository as of March 27, 2026, so this spec
cannot be committed yet. Once the project is initialized as a repository, add
this document to the repo history before implementation continues.

