# Content publish ingestion design

## Summary

Add an atomic content publishing endpoint:

- `POST /api/v1/ingest/content-publish`

The endpoint upserts a single content record and replaces its connected graph
state in one request:

- content record fields
- content taxonomy assignment
- related agents
- related prompts
- related skills

This is the next step after the symmetric relation-mutation endpoints. It turns
the machine surface from a set of low-level ingestion primitives into a real
content publishing workflow.

## Why this slice

The ingestion API can already:

- create article and tutorial records
- assign content taxonomy
- replace content relations

That still leaves machine publishers orchestrating multiple API calls to fully
publish one content record. The current surface is correct, but fragmented.

An atomic content publish endpoint fixes that by letting a publisher send the
full desired content state once and rely on one transaction, one idempotency
envelope, and one success result.

## Scope

This design covers:

- one content-only atomic publish endpoint
- upsert behavior for one article or tutorial per request
- replace-all taxonomy and relation writes inside the same transaction

It does not cover:

- bulk publishing of multiple content records
- agent, prompt, or skill atomic publish
- generic multi-entity publishing
- partial patch semantics

## Route contract

### Route

- `POST /api/v1/ingest/content-publish`

### Auth

- bearer API key required
- required scope: `content:write`

### Headers

- `Idempotency-Key` required

### Request body

The request body must be a JSON object with exactly these top-level fields:

- `kind: "article" | "tutorial"`
- `title: string`
- `slug?: string | null`
- `subtype?: string | null`
- `status: "draft" | "review" | "scheduled" | "published" | "archived"`
- `excerpt?: string | null`
- `body?: string | null`
- `heroImageUrl?: string | null`
- `canonicalUrl?: string | null`
- `seoTitle?: string | null`
- `seoDescription?: string | null`
- `publishedAt?: string | null`
- `scheduledFor?: string | null`
- `externalId?: string | null`
- `taxonomyTermIds: string[]`
- `agentIds: string[]`
- `promptIds: string[]`
- `skillIds: string[]`

Unknown top-level fields are rejected with `400 invalid_payload`.

### Target resolution

The service resolves the target content record in this order:

1. use `externalId` when provided and matched through prior ingestion history
2. otherwise fall back to `slug + kind`

Resolution outcomes:

- no match: create a new record
- one match: update the existing record
- multiple conflicting matches: reject with `409 ambiguous_target`

If `externalId` resolves to one record and normalized `slug + kind` resolves to
a different record, reject the request with `409 ambiguous_target`.

### Normalization rules

- content fields use the existing `normalizeContentInput()` rules
- `slug` falls back to the normalized title when omitted
- all relation arrays must contain only non-empty string IDs
- duplicate IDs are deduped
- normalized arrays are sorted before hashing and write
- empty arrays are valid and mean "clear this assignment family"

### Success response

The endpoint returns a stable success envelope:

```json
{
  "data": {
    "kind": "content-publish",
    "operation": "created",
    "contentId": "content-uuid",
    "contentKind": "article",
    "slug": "latest-agent-release-notes",
    "status": "published",
    "taxonomyTermIds": ["taxonomy-a"],
    "agentIds": ["agent-a"],
    "promptIds": ["prompt-a"],
    "skillIds": ["skill-a"],
    "replayed": false
  },
  "meta": {
    "entity": "ingest:content-publish",
    "version": "v1"
  }
}
```

`operation` is one of:

- `created`
- `updated`

Replay returns the same shape with `replayed: true`.

## Validation rules

Before writing anything, the service must verify:

- `kind` is a supported content kind
- content fields pass `normalizeContentInput()`
- every submitted taxonomy term exists
- every submitted taxonomy term has `scope = content`
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
- `taxonomy_not_found`
- `invalid_taxonomy_scope`
- `agent_not_found`
- `prompt_not_found`
- `skill_not_found`
- `ambiguous_target`
- `idempotency_conflict`
- `idempotency_missing_record`

## Write semantics

The endpoint is upsert for the content record and replace-all for assignment
families.

For a given request, the submitted payload becomes the full desired state for:

- the content record itself
- `content_taxonomy_terms`
- `content_agents`
- `content_prompts`
- `content_skills`

The write must happen in a single transaction:

1. resolve create versus update target
2. create or update the content record
3. if updating and the slug changes, sync redirects with the shared slug policy
4. replace `content_taxonomy_terms`
5. replace `content_agents`
6. replace `content_prompts`
7. replace `content_skills`
8. write a content revision snapshot
9. insert the ingestion event

If any step fails, the whole publish rolls back.

## Idempotency behavior

The endpoint follows the same idempotency model as the rest of the ingestion
surface.

### First successful request

- writes the full content state
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

No schema change is required for the first slice.

This endpoint reuses:

- `content_items`
- `content_taxonomy_terms`
- `content_agents`
- `content_prompts`
- `content_skills`
- `content_revisions`
- `ingestion_events`
- `replaceJoinRows()`
- `normalizeContentInput()`
- content slug and redirect helpers

## Implementation shape

### New service

Create:

- `lib/ingestion/content-publish-ingestion.ts`

Responsibilities:

- reject non-object payloads
- reject unknown top-level fields
- normalize content input and assignment arrays
- resolve the target by `externalId` or `slug + kind`
- verify taxonomy scope and related record existence
- compute payload hash
- load prior idempotent event
- create or update the content record
- sync redirects when an update changes the slug
- replace taxonomy and relation joins in one transaction
- write a content revision snapshot
- insert the ingestion event
- handle replay and conflict semantics

### New route

Create:

- `app/api/v1/ingest/content-publish/route.ts`

Responsibilities:

- parse JSON safely
- enforce `Idempotency-Key`
- authenticate with `content:write`
- delegate to the service
- return stable envelopes

### Existing file updates

Modify:

- `app/api/page.tsx`

Changes:

- add the POST-only route card for `content-publish`
- update the "Planned next" copy so it points at the next broader publish
  workflow after the first atomic content endpoint lands

## Testing strategy

### Service tests

Add:

- `tests/content-publish-ingestion-service.test.ts`

Cover:

- create path with taxonomy and relations
- update path with taxonomy and relations
- clearing all assignment families with empty arrays
- duplicate ID normalization
- unexpected field rejection
- non-object payload rejection
- invalid taxonomy scope
- missing taxonomy term
- missing related agent
- missing related prompt
- missing related skill
- ambiguous target resolution
- replay on unique-index race
- conflict on mismatched payload hash
- redirect sync on slug change during update

### Route tests

Add:

- `tests/content-publish-ingestion-route.test.ts`

Cover:

- unauthorized request
- successful create
- successful replay
- conflict `409`
- missing `Idempotency-Key`
- invalid JSON
- invalid-payload from non-object body

## Success criteria

This slice is complete when:

1. trusted publishers can fully publish one article or tutorial in one request
2. content record writes, taxonomy, and relations are atomic
3. update behavior is explicit and replay-safe
4. slug changes reuse the shared redirect policy
5. the API discovery page documents the route accurately
6. service and route contract tests cover the new publish workflow
