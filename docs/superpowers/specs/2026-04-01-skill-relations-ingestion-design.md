# Skill relations ingestion design

## Summary

Add a skill-only relation mutation endpoint:

- `POST /api/v1/ingest/skill-relations`

The endpoint replaces both skill relation families in one request:

- `agent_skills`
- `skill_prompts`

This is the final missing symmetric relation-mutation slice across the
agent, prompt, and skill graph. It keeps the machine publishing surface aligned
with the related agents and related prompts already visible on skill detail
pages.

## Why this slice

The ingestion API can already:

- create skill records
- assign taxonomy to skills
- mutate content relations
- mutate agent relations
- mutate prompt relations

It still cannot mutate skill-to-agent and skill-to-prompt joins through the
machine publishing surface. That means automated publishers still need the
admin UI to complete a full skill record.

## Scope

This design covers:

- skill-only relation mutation

It does not cover:

- skill-to-content mutation
- taxonomy writes
- record creation or update
- a generic graph mutation endpoint for all entity types

## Route contract

### Route

- `POST /api/v1/ingest/skill-relations`

### Auth

- bearer API key required
- required scope: `skills:write`

### Headers

- `Idempotency-Key` required

### Request body

The request body must be a JSON object with exactly these fields:

- `skillId: string`
- `agentIds: string[]`
- `promptIds: string[]`

Unknown top-level fields are rejected with `400 invalid_payload`.

### Normalization rules

- all IDs must be non-empty strings
- duplicate IDs are deduped
- normalized arrays are sorted before hashing and write
- empty arrays are valid and mean "clear this relation family"

### Success response

The endpoint returns a stable success envelope:

```json
{
  "data": {
    "kind": "skill-relations",
    "skillId": "skill-uuid",
    "agentIds": ["agent-a", "agent-b"],
    "promptIds": ["prompt-a"],
    "replayed": false
  },
  "meta": {
    "entity": "ingest:skill-relations",
    "version": "v1"
  }
}
```

Replay returns the same shape with `replayed: true`.

## Validation rules

Before writing anything, the service must verify:

- the skill record exists
- every submitted agent exists
- every submitted prompt exists

Validation failure returns a stable error envelope with a typed code.

Expected error classes:

- `invalid_json`
- `invalid_payload`
- `missing_idempotency_key`
- `missing_api_key`
- `invalid_api_key`
- `insufficient_scope`
- `skill_not_found`
- `agent_not_found`
- `prompt_not_found`
- `idempotency_conflict`
- `idempotency_missing_record`

## Write semantics

The endpoint is replace-all, not patch.

For a given `skillId`, the submitted payload becomes the full desired state
for:

- `agent_skills`
- `skill_prompts`

The write must happen in a single transaction:

1. replace `agent_skills` for the skill side
2. replace `skill_prompts` for the skill side
3. insert the ingestion event

If any step fails, the whole mutation rolls back.

## Idempotency behavior

The endpoint follows the same model as the existing ingestion routes.

### First successful request

- writes relations
- inserts an ingestion event
- returns `201`

### Exact replay

- same `apiKeyId`
- same `Idempotency-Key`
- same normalized payload hash
- returns `200` with `replayed: true`

### Same idempotency key, different payload

- returns `409 idempotency_conflict`

### Race on unique idempotency constraint

If two requests hit concurrently and the unique idempotency insert races, the
service reloads the winning ingestion event and returns the normal replay
result when the normalized payload matches.

## Data model impact

No schema change is required.

This endpoint reuses existing join tables:

- `agent_skills`
- `skill_prompts`

It also reuses:

- `ingestion_events`
- `replaceJoinRows()`

## Implementation shape

### New service

Create:

- `lib/ingestion/skill-relations-ingestion.ts`

Responsibilities:

- reject non-object payloads
- reject unknown top-level fields
- normalize and dedupe relation arrays
- verify skill, agent, and prompt existence
- compute payload hash
- load prior idempotent event
- replace both join families in one transaction
- insert the ingestion event
- handle replay and conflict semantics

### New route

Create:

- `app/api/v1/ingest/skill-relations/route.ts`

Responsibilities:

- parse JSON safely
- enforce `Idempotency-Key`
- authenticate with `skills:write`
- delegate to the service
- return stable envelopes

### Existing file update

Modify:

- `app/api/page.tsx`

Changes:

- add the POST-only route card for `skill-relations`
- update the "Planned next" copy so it points at broader graph mutation work
  after the symmetric relation slices are complete

## Testing strategy

### Service tests

Add:

- `tests/skill-relations-ingestion-service.test.ts`

Cover:

- successful replace of both relation families
- clearing all relations with empty arrays
- duplicate ID normalization
- unexpected field rejection
- non-object payload rejection
- missing skill
- missing agent
- missing prompt
- replay on unique-index race
- conflict on mismatched payload hash

### Route tests

Add:

- `tests/skill-relations-ingestion-route.test.ts`

Cover:

- unauthorized request
- successful write
- replay `200`
- conflict `409`
- missing `Idempotency-Key`
- invalid JSON
- invalid-payload from non-object body

## Success criteria

This slice is complete when:

1. trusted publishers can replace skill-to-agent and skill-to-prompt graph
   links through the ingestion API
2. writes are atomic and idempotent
3. the API discovery page documents the route accurately
4. service and route contract tests cover the mutation surface
