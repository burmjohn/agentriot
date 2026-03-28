# TODOS

## Platform

### Public read API for content graph

**What:** Add a public read API over the shared content graph after phase 1.

**Why:** This unlocks machine consumption, external integrations, and a cleaner
AI-agent-friendly surface once the data model is stable.

**Context:** Phase 1 intentionally defers API work until the shared graph,
public routes, and manual editorial workflow prove the schema in real use.
Start from the stable entity and relation queries already powering the public
site instead of designing the API in parallel.

**Effort:** L
**Priority:** P2
**Depends on:** Stable graph schema, stable browse routes, proven manual
publishing workflow

### Authenticated ingestion API for machine publishing

**What:** Add an authenticated ingestion API for trusted machine-authored
publishing after phase 1.

**Why:** This unlocks structured automation, faster freshness workflows, and
the long-term agent-friendly publishing model without forcing phase 1 to lock
the wrong schema too early.

**Context:** Phase 1 intentionally uses admin-first manual publishing so the
content model, relation rules, and editorial workflow can prove themselves in
real use. Build ingestion on top of those proven flows rather than in parallel.

**Effort:** L
**Priority:** P2
**Depends on:** Stable graph schema, proven admin publishing flow, trust policy
design

### API key management for trusted publishers

**What:** Add API key issuance, scoping, revocation, and usage tracking for
trusted automation publishers.

**Why:** Machine publishing becomes unsafe and messy without a first-class key
management layer once ingestion is real.

**Context:** Phase 1 keeps auth admin-only and skips machine publishing
entirely. This should land with or right after the ingestion API so automation
is introduced with explicit trust boundaries instead of ad hoc secrets.

**Effort:** M
**Priority:** P2
**Depends on:** Ingestion API, trust policy, admin surface expansion

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
