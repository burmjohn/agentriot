# Content relations ingestion design

## Summary

Add a content-only relation mutation endpoint:

- `POST /api/v1/ingest/content-relations`

The endpoint replaces all three content relation families in one request:

- `content_agents`
- `content_prompts`
- `content_skills`

This is the next machine-publishing step after create-only entity ingestion and
taxonomy-assignment ingestion. It closes the current asymmetry where the admin
UI can build a fuller graph than the public ingestion surface.

## Why this slice

The current ingestion API can:

- create content records
- create agents, prompts, skills, and taxonomy terms
- assign taxonomy to content, agents, prompts, and skills

It cannot yet mutate cross-entity graph links.

That matters because content detail pages already depend on all three related
content strips:

- related agents
- related prompts
- related skills

If a machine publisher can create a content item but cannot attach those graph
links, the API is still weaker than the admin interface.

## Scope

This design covers one endpoint only:

- content-only relation mutation

It does not cover:

- agent relation mutation
- prompt relation mutation
- skill relation mutation
- taxonomy writes
- record creation or update
- generic graph mutation across all entity types

## Route contract

### Route

- `POST /api/v1/ingest/content-relations`

### Auth

- bearer API key required
- required scope: `content:write`

### Headers

- `Idempotency-Key` required

### Request body

The request body must be a JSON object with exactly these fields:

- `contentId: string`
- `agentIds: string[]`
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
    "kind": "content-relations",
    "contentId": "content-uuid",
    "agentIds": ["agent-a", "agent-b"],
    "promptIds": ["prompt-a"],
    "skillIds": ["skill-a", "skill-b"],
    "replayed": false
  },
  "meta": {
    "entity": "ingest:content-relations",
    "version": "v1"
  }
}
```

Replay returns the same shape with `replayed: true`.

## Validation rules

Before writing anything, the service must verify:

- the content record exists
- every submitted agent exists
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
- `content_not_found`
- `agent_not_found`
- `prompt_not_found`
- `skill_not_found`
- `idempotency_conflict`
- `idempotency_missing_record`

## Write semantics

The endpoint is replace-all, not patch.

For a given `contentId`, the submitted payload becomes the full desired state
for:

- `content_agents`
- `content_prompts`
- `content_skills`

The write must happen in a single transaction:

1. replace `content_agents`
2. replace `content_prompts`
3. replace `content_skills`
4. insert the ingestion event

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

- `content_agents`
- `content_prompts`
- `content_skills`

It also reuses:

- `ingestion_events`
- `replaceJoinRows()`

## Implementation shape

### New service

Create:

- `lib/ingestion/content-relations-ingestion.ts`

Responsibilities:

- reject non-object payloads
- reject unknown top-level fields
- normalize and dedupe all three relation arrays
- verify content, agent, prompt, and skill existence
- compute payload hash
- load prior idempotent event
- replace all three join families in one transaction
- insert the ingestion event
- handle replay and conflict semantics

### New route

Create:

- `app/api/v1/ingest/content-relations/route.ts`

Responsibilities:

- parse JSON safely
- enforce `Idempotency-Key`
- authenticate with `content:write`
- delegate to the service
- return stable envelopes

### Existing file update

Modify:

- `app/api/page.tsx`

Changes:

- add the POST-only route card for `content-relations`
- update the “Planned next” copy so it points to broader graph mutation after
  this content slice

## Testing strategy

### Service tests

Add:

- `tests/content-relations-ingestion-service.test.ts`

Cover:

- successful replace of all three relation families
- clearing all relations with empty arrays
- duplicate ID normalization
- unknown field rejection
- non-object payload rejection
- content missing
- missing agent
- missing prompt
- missing skill
- exact idempotent replay
- duplicate idempotency key with different payload
- concurrent unique-index replay path

### Route tests

Add:

- `tests/content-relations-ingestion-route.test.ts`

Cover:

- happy path
- replay returns `200`
- missing `Idempotency-Key`
- invalid JSON
- unauthorized request
- revoked or insufficient-scope key
- service-level validation error envelope

## Non-goals

This endpoint does not:

- infer related records automatically
- validate that linked records are published
- mutate reverse relations outside the content join tables
- replace taxonomy
- create records

## Follow-on work

Once this slice proves out, the same replace-all relation mutation pattern can
expand to:

- `agent-relations`
- `prompt-relations`
- `skill-relations`

That work should reuse the same design principles, not invent a second
mutation model.
