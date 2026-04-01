# TODOS

This file tracks the major product and platform work that is still not
implemented on `main`. It does not repeat backlog items that already shipped,
such as the public read API, authenticated ingestion endpoints, taxonomy
assignment ingestion, or the symmetric relation-mutation endpoints.

## Platform

### Atomic content publish ingestion

**What:** Add an authenticated atomic content publish endpoint that can create
or update a content record and replace its taxonomy and related graph links in
one request.

**Why:** Machine publishing is still fragmented. The API can already create
content, assign taxonomy, and replace content relations, but automated
publishers still have to orchestrate multiple calls to fully publish one
article or tutorial.

**Context:** The next approved design is
`POST /api/v1/ingest/content-publish`, an atomic upsert-style workflow that
reuses the existing content normalization, redirect policy, taxonomy joins,
relation joins, revision snapshots, and ingestion idempotency model.

**Effort:** L
**Priority:** P1
**Depends on:** Stable content ingestion primitives, replace-all join-table
helpers, redirect sync helpers, content revision snapshots, and the existing
content graph query shape

### Atomic publish workflows for agents, prompts, and skills

**What:** Extend the atomic publish pattern beyond content so trusted machine
publishers can upsert agents, prompts, and skills with taxonomy and relation
state in one request.

**Why:** The machine surface is still lower-level than the admin UI for the
directory entities. Content is the right place to prove the pattern, but the
platform is not truly complete until the other graph entities can be published
atomically too.

**Context:** Do not start with a generic multi-entity publish endpoint. Build
the content atomic publish flow first, then decide whether entity-specific
atomic publish routes or a higher-level abstraction are the right follow-on.

**Effort:** L
**Priority:** P2
**Depends on:** Content publish ingestion landed and stable, relation mutation
and taxonomy assignment patterns already proven for non-content entities

### Broader graph mutation beyond symmetric relation slices

**What:** Add the next layer of graph-aware publishing after the symmetric
relation endpoints are complete, for example richer publish workflows or more
composed mutation surfaces.

**Why:** The graph primitives are now strong, but there is still a gap between
"all low-level mutation pieces exist" and "machine publishers can express a
full editorial workflow in one request."

**Context:** This should come after content atomic publish clarifies what a
good higher-level machine publishing contract looks like. Do not jump straight
to a generic everything-endpoint without learning from the first atomic flow.

**Effort:** L
**Priority:** P2
**Depends on:** Atomic content publish ingestion and validation from real usage

### Redirect management UI for editors

**What:** Add an editor-facing redirect management UI on top of the shared slug
and redirect policy.

**Why:** Once editors start renaming and reorganizing content, manual redirect
control becomes necessary to protect SEO, route trust, and content operations.

**Context:** Phase 1 includes the shared slug and redirect policy but
intentionally skips the management UI. Build this only after real editorial
slug changes make manual inspection and override flows necessary.

**Effort:** M
**Priority:** P2
**Depends on:** Shared slug policy implemented, active editorial slug changes,
enough content volume to justify a UI

### Public accounts, saved items, and basic personalization

**What:** Add public user accounts, saved items, and lightweight
personalization on top of Better Auth after phase 1.

**Why:** If anonymous usage proves repeat behavior, this becomes the cleanest
path to retention features without changing the auth foundation.

**Context:** Phase 1 keeps the public site anonymous and fully crawlable, but
Better Auth is already the long-term auth foundation. Only pull this into scope
once usage data shows users want to save, follow, or return to the same
entities repeatedly.

**Effort:** L
**Priority:** P3
**Depends on:** Real anonymous usage, retention signals, stable Better Auth
admin/editor foundation

### Audit log view for content operations

**What:** Add an audit log view and basic change-history tools for content
operations.

**Why:** Once multiple editors or automated publishers exist, change history
becomes necessary for trust, debugging, and operational clarity.

**Context:** Phase 1 keeps admin thin and skips audit UI entirely. This should
come back only after content changes become frequent enough that people need to
inspect who changed what and when.

**Effort:** M
**Priority:** P3
**Depends on:** Richer admin usage, multiple editors or automation, stable
publishing workflows
