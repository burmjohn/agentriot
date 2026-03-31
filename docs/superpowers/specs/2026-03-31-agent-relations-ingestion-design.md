# Agent relations ingestion design

## Summary

Add an agent-only relation mutation endpoint:

- `POST /api/v1/ingest/agent-relations`

The endpoint replaces both agent relation families in one request:

- `agent_prompts`
- `agent_skills`

This is the next graph-mutation slice after content relations. It keeps the
machine publishing surface aligned with the graph links already visible on
agent detail pages.

## Why this slice

The ingestion API can already:

- create agent records
- assign taxonomy to agents
- mutate content relations

It still cannot mutate agent-to-prompt and agent-to-skill joins through the
machine publishing surface. That means automated publishers still need the
admin UI to complete a full agent record.

## Scope

This design covers:

- agent-only relation mutation

It does not cover:

- prompt relation mutation
- skill relation mutation
- agent-to-content mutation
- taxonomy writes
- record creation or update
- a generic graph mutation endpoint for all entity types

## Route contract

### Route

- `POST /api/v1/ingest/agent-relations`

### Auth

- bearer API key required
- required scope: `agents:write`

### Headers

- `Idempotency-Key` required

### Request body

The request body must be a JSON object with exactly these fields:

- `agentId: string`
- `promptIds: string[]`
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
    "kind": "agent-relations",
    "agentId": "agent-uuid",
    "promptIds": ["prompt-a", "prompt-b"],
    "skillIds": ["skill-a"],
    "replayed": false
  },
  "meta": {
    "entity": "ingest:agent-relations",
    "version": "v1"
  }
}
```

Replay returns the same shape with `replayed: true`.

## Validation rules

Before writing anything, the service must verify:

- the agent record exists
- every submitted prompt exists
- every submitted skill exists

Validation failure returns a stable error envelope with a typed code.

Expected error classes:

- `invalid_json`
- `invalid_payload`
- `missing_idempotency_key`
- `missing_api_key`
- `invalid_api_key`
- `insufficient_scope`
- `agent_not_found`
- `prompt_not_found`
- `skill_not_found`
- `idempotency_conflict`
- `idempotency_missing_record`

## Write semantics

The endpoint is replace-all, not patch.

For a given `agentId`, the submitted payload becomes the full desired state
for:

- `agent_prompts`
- `agent_skills`

The write must happen in a single transaction:

1. replace `agent_prompts`
2. replace `agent_skills`
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
- `agent_skills`

It also reuses:

- `ingestion_events`
- `replaceJoinRows()`

## Implementation shape

### New service

Create:

- `lib/ingestion/agent-relations-ingestion.ts`

Responsibilities:

- reject non-object payloads
- reject unknown top-level fields
- normalize and dedupe relation arrays
- verify agent, prompt, and skill existence
- compute payload hash
- load prior idempotent event
- replace both join families in one transaction
- insert the ingestion event
- handle replay and conflict semantics

### New route

Create:

- `app/api/v1/ingest/agent-relations/route.ts`

Responsibilities:

- parse JSON safely
- enforce `Idempotency-Key`
- authenticate with `agents:write`
- delegate to the service
- return stable envelopes

### Existing file update

Modify:

- `app/api/page.tsx`

Changes:

- add the POST-only route card for `agent-relations`
- update the “Planned next” copy so it points to the remaining relation
  mutation work after this agent slice

## Testing strategy

### Service tests

Add:

- `tests/agent-relations-ingestion-service.test.ts`

Cover:

- successful replace of both relation families
- clearing all relations with empty arrays
- duplicate ID normalization
- unknown field rejection
- non-object payload rejection
- missing agent
- missing prompt
- missing skill
- exact idempotent replay
- duplicate idempotency key with different payload
- concurrent unique-index replay path

### Route tests

Add:

- `tests/agent-relations-ingestion-route.test.ts`

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
- mutate reverse relations outside the agent join tables
- replace taxonomy
- create records

## Follow-on work

Once this slice proves out, the same replace-all relation mutation pattern can
expand to:

- `prompt-relations`
- `skill-relations`

That work should reuse this same model instead of introducing a second graph
mutation contract.
