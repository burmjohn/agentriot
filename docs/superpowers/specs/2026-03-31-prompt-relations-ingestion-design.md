# Prompt relations ingestion design

## Summary

Add a prompt-only relation mutation endpoint:

- `POST /api/v1/ingest/prompt-relations`

The endpoint replaces both prompt relation families in one request:

- `agent_prompts`
- `skill_prompts`

This is the next graph-mutation slice after agent relations. It keeps the
machine publishing surface aligned with the graph links already visible on
prompt detail pages.

## Why this slice

The ingestion API can already:

- create prompt records
- assign taxonomy to prompts
- mutate content relations
- mutate agent relations

It still cannot mutate prompt-to-agent and prompt-to-skill joins through the
machine publishing surface. That means automated publishers still need the
admin UI to complete a full prompt record.

## Scope

This design covers:

- prompt-only relation mutation

It does not cover:

- skill relation mutation
- prompt-to-content mutation
- taxonomy writes
- record creation or update
- a generic graph mutation endpoint for all entity types

## Route contract

### Route

- `POST /api/v1/ingest/prompt-relations`

### Auth

- bearer API key required
- required scope: `prompts:write`

### Headers

- `Idempotency-Key` required

### Request body

The request body must be a JSON object with exactly these fields:

- `promptId: string`
- `agentIds: string[]`
- `skillIds: string[]`

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
    "kind": "prompt-relations",
    "promptId": "prompt-uuid",
    "agentIds": ["agent-a", "agent-b"],
    "skillIds": ["skill-a"],
    "replayed": false
  },
  "meta": {
    "entity": "ingest:prompt-relations",
    "version": "v1"
  }
}
```

Replay returns the same shape with `replayed: true`.

## Validation rules

Before writing anything, the service must verify:

- the prompt record exists
- every submitted agent exists
- every submitted skill exists

Validation failure returns a stable error envelope with a typed code.

Expected error classes:

- `invalid_json`
- `invalid_payload`
- `missing_idempotency_key`
- `missing_api_key`
- `invalid_api_key`
- `insufficient_scope`
- `prompt_not_found`
- `agent_not_found`
- `skill_not_found`
- `idempotency_conflict`
- `idempotency_missing_record`

## Write semantics

The endpoint is replace-all, not patch.

For a given `promptId`, the submitted payload becomes the full desired state
for:

- `agent_prompts`
- `skill_prompts`

The write must happen in a single transaction:

1. replace `agent_prompts` for the prompt side
2. replace `skill_prompts` for the prompt side
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
service should reload the winning ingestion event and return the normal replay
result when the normalized payload matches.

## Data model impact

No schema change is required.

This endpoint reuses existing join tables:

- `agent_prompts`
- `skill_prompts`

It also reuses:

- `ingestion_events`
- `replaceJoinRows()`

## Implementation shape

### New service

Create:

- `lib/ingestion/prompt-relations-ingestion.ts`

Responsibilities:

- reject non-object payloads
- reject unknown top-level fields
- normalize and dedupe relation arrays
- verify prompt, agent, and skill existence
- compute payload hash
- load prior idempotent event
- replace both join families in one transaction
- insert the ingestion event
- handle replay and conflict semantics

### New route

Create:

- `app/api/v1/ingest/prompt-relations/route.ts`

Responsibilities:

- parse JSON safely
- enforce `Idempotency-Key`
- authenticate with `prompts:write`
- delegate to the service
- return stable envelopes

### Existing file update

Modify:

- `app/api/page.tsx`

Changes:

- add the POST-only route card for `prompt-relations`
- update the “Planned next” copy so it points to the remaining relation
  mutation work after this prompt slice

## Testing strategy

### Service tests

Add:

- `tests/prompt-relations-ingestion-service.test.ts`

Cover:

- successful replace of both relation families
- clearing all relations with empty arrays
- duplicate ID normalization
- unknown field rejection
- non-object payload rejection
- missing prompt
- missing agent
- missing skill
- exact idempotent replay
- duplicate idempotency key with different payload
- concurrent unique-index replay path

### Route tests

Add:

- `tests/prompt-relations-ingestion-route.test.ts`

Cover:

- happy path
- replay returns `200`
- missing `Idempotency-Key`
- invalid JSON
- unauthorized request
- insufficient-scope request
- service-level validation error envelope

## Non-goals

This endpoint does not:

- infer related records automatically
- validate that linked records are published
- mutate reverse relations outside the prompt join tables
- replace taxonomy
- create records

## Follow-on work

Once this slice lands, the last symmetric relation-mutation endpoint is:

- `skill-relations`

After that, the machine publishing surface will cover create-only ingestion,
taxonomy assignment, and relation mutation across the main graph entity types.
