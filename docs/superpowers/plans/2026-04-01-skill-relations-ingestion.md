# Skill relations ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an idempotent `POST /api/v1/ingest/skill-relations` endpoint
that replaces skill-to-agent and skill-to-prompt joins in one transaction.

**Architecture:** Reuse the existing ingestion contract and relation-write
helpers. Implement one service that validates and normalizes the full payload,
applies both join-table replacements atomically, and records the ingestion
event for replay and conflict handling.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL,
Vitest

---

## File map

- Create: `lib/ingestion/skill-relations-ingestion.ts`
- Create: `app/api/v1/ingest/skill-relations/route.ts`
- Create: `tests/skill-relations-ingestion-service.test.ts`
- Create: `tests/skill-relations-ingestion-route.test.ts`
- Modify: `app/api/page.tsx`

## Task 1: write the service contract tests

**Files:**
- Create: `tests/skill-relations-ingestion-service.test.ts`
- Reference: `lib/ingestion/prompt-relations-ingestion.ts`

- [ ] **Step 1: Write the failing test file for the service**

Add tests for:

- success with both relation families
- clearing all relation families
- unknown field rejection
- non-object payload rejection
- missing skill
- missing agent
- missing prompt
- replay
- idempotency conflict
- duplicate-id normalization

- [ ] **Step 2: Run the service tests and verify they fail**

Run:

```bash
pnpm test -- tests/skill-relations-ingestion-service.test.ts
```

Expected:

- FAIL because `@/lib/ingestion/skill-relations-ingestion` does not exist yet

## Task 2: implement the service

**Files:**
- Create: `lib/ingestion/skill-relations-ingestion.ts`
- Reference: `lib/ingestion/prompt-relations-ingestion.ts`
- Reference: `lib/admin/relation-writes.ts`

- [ ] **Step 1: Implement payload typing and normalization**

Add:

- `SkillRelationsPayload`
- allowed payload key set
- `assertNoUnknownFields()`
- `normalizePayload()`
- `buildPayloadHash()`

- [ ] **Step 2: Implement lookup and validation helpers**

Add helpers to:

- find existing ingestion events
- validate skill existence
- validate agent existence
- validate prompt existence
- build replay result

- [ ] **Step 3: Implement the transactional relation replacement**

Inside one `db.transaction(...)`:

- replace `agent_skills` from the skill side
- replace `skill_prompts` from the skill side
- insert `ingestion_events`

- [ ] **Step 4: Implement the exported service function**

Export:

- `assignSkillRelations({ apiKeyId, idempotencyKey, payload })`

Behavior:

- validate
- normalize
- replay if prior event exists
- write transaction
- recover deterministic replay on unique-idempotency race

- [ ] **Step 5: Run the service tests and verify they pass**

Run:

```bash
pnpm test -- tests/skill-relations-ingestion-service.test.ts
```

Expected:

- PASS

## Task 3: write the route tests

**Files:**
- Create: `tests/skill-relations-ingestion-route.test.ts`

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
pnpm test -- tests/skill-relations-ingestion-route.test.ts
```

Expected:

- FAIL because `app/api/v1/ingest/skill-relations/route.ts` does not exist yet

## Task 4: implement the route

**Files:**
- Create: `app/api/v1/ingest/skill-relations/route.ts`
- Reference: `app/api/v1/ingest/prompt-relations/route.ts`

- [ ] **Step 1: Implement JSON parsing and idempotency header handling**

Match the existing ingestion route behavior:

- `parseJsonBody()`
- `getIdempotencyKey()`

- [ ] **Step 2: Implement the POST handler**

Requirements:

- authenticate with `skills:write`
- enforce `Idempotency-Key`
- call `assignSkillRelations()`
- return `201` for first apply
- return `200` for replay
- return stable error envelopes

- [ ] **Step 3: Run the route tests and verify they pass**

Run:

```bash
pnpm test -- tests/skill-relations-ingestion-route.test.ts
```

Expected:

- PASS

## Task 5: update API discovery

**Files:**
- Modify: `app/api/page.tsx`

- [ ] **Step 1: Add the route card**

Add a POST-only card for:

- `/api/v1/ingest/skill-relations`

Copy should describe it as authenticated replace-all relation mutation for
skill to agent and prompt graph links.

- [ ] **Step 2: Update the planned-next copy**

Change the copy so the page reflects:

- skill relation mutation is now live
- broader graph mutation is the next platform step

- [ ] **Step 3: Run lint to verify the page update is clean**

Run:

```bash
pnpm lint
```

Expected:

- PASS

## Task 6: run the full gate

**Files:**
- Verify all files above

- [ ] **Step 1: Run the targeted tests**

Run:

```bash
pnpm test -- tests/skill-relations-ingestion-service.test.ts tests/skill-relations-ingestion-route.test.ts
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

- [ ] **Step 5: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected:

- PASS

## Task 7: ship the branch

**Files:**
- Verify all files above

- [ ] **Step 1: Commit the slice**

Run:

```bash
git add app/api/page.tsx app/api/v1/ingest/skill-relations/route.ts lib/ingestion/skill-relations-ingestion.ts tests/skill-relations-ingestion-route.test.ts tests/skill-relations-ingestion-service.test.ts
git commit -m "Add skill relations ingestion"
```

Expected:

- commit created with the route, service, tests, and API discovery update

- [ ] **Step 2: Push the feature branch**

Run:

```bash
git push -u origin <feature-branch>
```

Expected:

- remote branch created or updated

- [ ] **Step 3: Open the pull request**

Include:

- the route and service summary
- verification commands
- note that this completes the symmetric relation-mutation surface across
  agents, prompts, and skills
