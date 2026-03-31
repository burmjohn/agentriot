# Prompt taxonomy assignment ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated replace-all taxonomy assignment for prompt records
at `POST /api/v1/ingest/prompt-taxonomy`.

**Architecture:** Mirror the agent taxonomy assignment ingestion route, but
target the prompt taxonomy join model and the `prompts:write` scope. Add a
dedicated `prompt-taxonomy-assignment` service, a single route that reuses
current auth and response envelopes, and focused route and service tests that
prove idempotent replace-all behavior, validation, and clear-all support.
Update the API discovery page so the machine-surface index reflects the new
prompt taxonomy mutation route.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL,
Better Auth, Vitest

---

## File structure

- Create: `lib/ingestion/prompt-taxonomy-assignment.ts`
- Create: `app/api/v1/ingest/prompt-taxonomy/route.ts`
- Create: `tests/prompt-taxonomy-assignment-service.test.ts`
- Create: `tests/prompt-taxonomy-assignment-route.test.ts`
- Modify: `app/api/page.tsx`

## Tasks

### Task 1: add the service contract and transactional replace-all mutation

**Files:**
- Create: `tests/prompt-taxonomy-assignment-service.test.ts`
- Create: `lib/ingestion/prompt-taxonomy-assignment.ts`
- Reuse: `lib/admin/relation-writes.ts`
- Reuse: `db/schema/content-graph.ts`

- [ ] Write the failing service test for happy path, clear-all, replay,
  conflict, wrong scope, missing prompt, invalid payload, and non-object JSON.
- [ ] Run `pnpm test -- tests/prompt-taxonomy-assignment-service.test.ts` and
  verify it fails because the service does not exist yet.
- [ ] Implement the minimal service using `promptTaxonomyTerms`,
  `ingestionEvents`, and `replaceJoinRows()`.
- [ ] Run `pnpm test -- tests/prompt-taxonomy-assignment-service.test.ts` and
  make it pass.
- [ ] Commit the service slice.

### Task 2: add the API route contract

**Files:**
- Create: `tests/prompt-taxonomy-assignment-route.test.ts`
- Create: `app/api/v1/ingest/prompt-taxonomy/route.ts`
- Reuse: `lib/ingestion/auth.ts`
- Reuse: `lib/api/public-read.ts`

- [ ] Write the failing route test for success, replay, missing idempotency
  key, invalid JSON, invalid payload, unauthorized, forbidden, and conflict.
- [ ] Run `pnpm test -- tests/prompt-taxonomy-assignment-route.test.ts` and
  verify it fails because the route does not exist yet.
- [ ] Implement the minimal route using the existing ingestion route shape and
  `requiredScope: "prompts:write"`.
- [ ] Run `pnpm test -- tests/prompt-taxonomy-assignment-route.test.ts` and
  make it pass.
- [ ] Commit the route slice.

### Task 3: update machine-surface discovery

**Files:**
- Modify: `app/api/page.tsx`

- [ ] Add the new POST-only route card for `/api/v1/ingest/prompt-taxonomy`.
- [ ] Update the “Planned next” copy so it now points at skill taxonomy
  assignment plus broader relation mutation.
- [ ] Run `pnpm lint` to verify the page change is clean.
- [ ] Commit the API discovery update.

### Task 4: run the branch gate

**Files:**
- Modify: none

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm typecheck` after build to avoid the known `.next/types` race.
- [ ] Review `git diff --stat main...HEAD` and verify the branch contains only
  the intended route, service, tests, and API discovery changes.
- [ ] Commit any review hardening if needed.

### Task 5: publish the branch for review

**Files:**
- Modify: none

- [ ] Push the branch with `git push`.
- [ ] Open a PR against `main` titled `Add prompt taxonomy assignment ingestion`.
- [ ] Include the verification commands in the PR body.
