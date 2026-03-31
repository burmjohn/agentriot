# TODOS

This file tracks work that is still not implemented on `main`. It no longer
lists backlog items that already shipped, such as the public read API,
authenticated ingestion endpoints, API key management, or taxonomy-assignment
ingestion.

## Platform

### Graph relation mutation ingestion

**What:** Add authenticated relation-mutation endpoints that replace related
graph links in one request, starting with content relations
(`content_agents`, `content_prompts`, and `content_skills`) and then extending
the same pattern to agents, prompts, and skills.

**Why:** Machine publishing is still asymmetric. Records and taxonomy can be
published through the API, but related graph links still require manual admin
editing. That leaves the machine surface incomplete.

**Context:** The create-only ingesters and the taxonomy-assignment ingesters
are already live. The next clean step is replace-all relation mutation with the
same idempotency, scoped auth, and transaction rules used elsewhere in the
ingestion surface.

**Effort:** L
**Priority:** P1
**Depends on:** Stable ingestion API, replace-all join-table helpers, proven
graph query shape on public detail pages

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
