# Prompt relations ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an idempotent `POST /api/v1/ingest/prompt-relations` endpoint that replaces prompt-to-agent and prompt-to-skill joins in one transaction.

**Architecture:** Reuse the existing ingestion contract and relation-write helpers. Implement one service that validates and normalizes the full payload, applies both join-table replacements atomically, and records the ingestion event for replay and conflict handling.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Vitest

---

## File map

- Create: `lib/ingestion/prompt-relations-ingestion.ts`
- Create: `app/api/v1/ingest/prompt-relations/route.ts`
- Create: `tests/prompt-relations-ingestion-service.test.ts`
- Create: `tests/prompt-relations-ingestion-route.test.ts`
- Modify: `app/api/page.tsx`

## Task 1: Write the service contract tests

**Files:**
- Create: `tests/prompt-relations-ingestion-service.test.ts`
- Reference: `lib/ingestion/agent-relations-ingestion.ts`

- [ ] **Step 1: Write the failing test file for the service**

Add tests for:

- success with both relation families
- clearing all relation families
- unknown field rejection
- non-object payload rejection
- missing prompt
- missing agent
- missing skill
- replay
- idempotency conflict
- duplicate-id normalization

- [ ] **Step 2: Run the service tests and verify they fail**

Run:

```bash
pnpm test -- tests/prompt-relations-ingestion-service.test.ts
```

Expected:

- FAIL because `@/lib/ingestion/prompt-relations-ingestion` does not exist yet

## Task 2: Implement the service

**Files:**
- Create: `lib/ingestion/prompt-relations-ingestion.ts`
- Reference: `lib/ingestion/agent-relations-ingestion.ts`
- Reference: `lib/admin/relation-writes.ts`

- [ ] **Step 1: Implement payload typing and normalization**

Add:

- `PromptRelationsPayload`
- allowed payload key set
- `assertNoUnknownFields()`
- `normalizePayload()`
- `buildPayloadHash()`

- [ ] **Step 2: Implement lookup and validation helpers**

Add helpers to:

- find existing ingestion events
- validate prompt existence
- validate agent existence
- validate skill existence
- build replay result

- [ ] **Step 3: Implement the transactional relation replacement**

Inside one `db.transaction(...)`:

- replace `agent_prompts` from the prompt side
- replace `skill_prompts` from the prompt side
- insert `ingestion_events`

- [ ] **Step 4: Implement the exported service function**

Export:

- `assignPromptRelations({ apiKeyId, idempotencyKey, payload })`

Behavior:

- validate
- normalize
- replay if prior event exists
- write transaction
- recover deterministic replay on unique-idempotency race

- [ ] **Step 5: Run the service tests and verify they pass**

Run:

```bash
pnpm test -- tests/prompt-relations-ingestion-service.test.ts
```

Expected:

- PASS

## Task 3: Write the route tests

**Files:**
- Create: `tests/prompt-relations-ingestion-route.test.ts`

- [ ] **Step 1: Write the failing route tests**

Cover:

- success
- replay
- missing idempotency key
- invalid JSON
- unauthorized request
- insufficient-scope request
- stable error envelope from service failures

- [ ] **Step 2: Run the route tests and verify they fail**

Run:

```bash
pnpm test -- tests/prompt-relations-ingestion-route.test.ts
```

Expected:

- FAIL because `app/api/v1/ingest/prompt-relations/route.ts` does not exist yet

## Task 4: Implement the route

**Files:**
- Create: `app/api/v1/ingest/prompt-relations/route.ts`
- Reference: `app/api/v1/ingest/agent-relations/route.ts`

- [ ] **Step 1: Implement JSON parsing and idempotency header handling**

Match the existing ingestion route behavior:

- `parseJsonBody()`
- `getIdempotencyKey()`

- [ ] **Step 2: Implement the POST handler**

Requirements:

- authenticate with `prompts:write`
- enforce `Idempotency-Key`
- call `assignPromptRelations()`
- return `201` for first apply
- return `200` for replay
- return stable error envelopes

- [ ] **Step 3: Run the route tests and verify they pass**

Run:

```bash
pnpm test -- tests/prompt-relations-ingestion-route.test.ts
```

Expected:

- PASS

## Task 5: Update API discovery

**Files:**
- Modify: `app/api/page.tsx`

- [ ] **Step 1: Add the route card**

Add a POST-only card for:

- `/api/v1/ingest/prompt-relations`

Copy should describe it as authenticated replace-all relation mutation for
prompt to agent and skill graph links.

- [ ] **Step 2: Update the planned-next copy**

Change the copy so the page reflects:

- prompt relation mutation is now live
- skill relation mutation is next

- [ ] **Step 3: Run lint to verify the page update is clean**

Run:

```bash
pnpm lint
```

Expected:

- PASS

## Task 6: Run the full gate

**Files:**
- Verify all files above

- [ ] **Step 1: Run the targeted tests**

Run:

```bash
pnpm test -- tests/prompt-relations-ingestion-service.test.ts tests/prompt-relations-ingestion-route.test.ts
```

Expected:

- PASS

- [ ] **Step 2: Run the full unit and integration suite**

Run:

```bash
pnpm test
```

Expected:

- PASS

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected:

- PASS

- [ ] **Step 4: Run build**

Run:

```bash
pnpm build
```

Expected:

- PASS

- [ ] **Step 5: Run typecheck after build**

Run:

```bash
pnpm typecheck
```

Expected:

- PASS

Note: run `build` and `typecheck` sequentially, not in parallel, because this
repo has a known `.next/types` race otherwise.

## Task 7: Commit the slice

**Files:**
- Create: `lib/ingestion/prompt-relations-ingestion.ts`
- Create: `app/api/v1/ingest/prompt-relations/route.ts`
- Create: `tests/prompt-relations-ingestion-service.test.ts`
- Create: `tests/prompt-relations-ingestion-route.test.ts`
- Modify: `app/api/page.tsx`

- [ ] **Step 1: Commit the feature branch**

Run:

```bash
git add lib/ingestion/prompt-relations-ingestion.ts \
  app/api/v1/ingest/prompt-relations/route.ts \
  tests/prompt-relations-ingestion-service.test.ts \
  tests/prompt-relations-ingestion-route.test.ts \
  app/api/page.tsx
git commit -m "Add prompt relations ingestion"
```

- [ ] **Step 2: Push the branch and open the PR**

Run:

```bash
git push origin <feature-branch>
gh pr create --base main --head <feature-branch> --title "Add prompt relations ingestion"
```

Expected:

- branch pushed
- PR created
