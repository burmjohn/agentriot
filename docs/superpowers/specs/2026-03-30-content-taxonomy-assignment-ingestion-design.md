# AgentRiot content taxonomy assignment ingestion design

Date: March 30, 2026
Project: AgentRiot
Scope: Authenticated replace-all taxonomy assignment for content records

## Goal

Add the first graph-mutation ingestion surface after the create-only entity and
taxonomy ingesters: `POST /api/v1/ingest/content-taxonomy`.

This slice lets trusted publishers replace the taxonomy term assignments for a
single content record through the existing API key flow without widening the
branch into agent, prompt, or skill mutation.

## Product decision

Content-only taxonomy assignment ships before broader relation mutation.

This is the right next move because:

- it proves the first real graph-mutation path on the smallest useful surface
- content already has a stable admin taxonomy workflow to mirror
- it reuses the existing `content_taxonomy_terms` join model directly
- it keeps the branch narrow enough to review cleanly before expanding to other
  entity types

## Scope

This slice adds:

- `POST /api/v1/ingest/content-taxonomy`
- API key auth using the existing bearer-token flow
- required scope: `content:write`
- required `Idempotency-Key` header
- replace-all taxonomy assignment for a single content record
- ingestion-event recording for replay and conflict handling
- explicit rejection of unknown payload fields

This slice does not add:

- agent taxonomy assignment
- prompt taxonomy assignment
- skill taxonomy assignment
- taxonomy term creation
- cross-entity relation writes

## Payload contract

The request body is JSON.

Supported fields:

- `contentId` required
- `taxonomyTermIds` required, array of taxonomy term IDs

The route accepts only this contract. Fields outside this contract are treated
as invalid input.

Behavior rules:

- duplicate `taxonomyTermIds` are deduped before write
- an empty array is valid and clears the content record’s taxonomy joins
- all referenced taxonomy terms must exist
- all referenced taxonomy terms must have `scope = content`

## Route behavior

### Authentication

The route uses the existing ingestion authentication flow:

- bearer token required
- API key must be valid
- API key must not be revoked
- API key must not be expired
- API key must include `content:write`

### Idempotency

The route requires an `Idempotency-Key` header.

Behavior mirrors the existing ingestion surfaces:

- first successful request returns `200`
- exact replay returns `200` with `replayed: true`
- same idempotency key with different normalized payload returns `409`
- missing idempotency key returns `400`

The payload hash is computed from the normalized mutation payload:

- `contentId`
- sorted, deduped `taxonomyTermIds`

### Success envelope

The route returns the existing detail envelope shape with:

- `entity: "ingest:content-taxonomy"`
- `data.kind: "content-taxonomy"`
- `data.contentId`
- `data.taxonomyTermIds`
- `data.replayed`

### Error envelope

The route reuses the existing stable error envelope and status mapping:

- invalid JSON -> `400`
- invalid payload -> `400`
- missing API key -> `401`
- invalid API key -> `401`
- revoked API key -> `401`
- expired API key -> `401`
- insufficient scope -> `403`
- idempotency conflict -> `409`

Additional validation failures also use stable `400` responses:

- missing content record
- unknown taxonomy term IDs
- taxonomy term scope mismatch

## Data flow

1. The route parses JSON and checks `Idempotency-Key`.
2. The route authenticates the API key with `content:write`.
3. The service rejects unknown payload fields.
4. The service normalizes and dedupes `taxonomyTermIds`.
5. The service verifies the content record exists.
6. The service verifies all submitted taxonomy terms exist and all have
   `scope = content`.
7. The service computes a canonical payload hash.
8. The service checks for an existing ingestion event with the same API key and
   idempotency key.
9. If a matching event exists, the service returns the replay result or
   conflict.
10. If not, the service replaces the join rows and writes the ingestion event
    in one transaction.
11. The route returns `200`.

## Architecture

### Service shape

Add a dedicated service instead of overloading the create-only ingesters.

Create:

- `lib/ingestion/content-taxonomy-assignment.ts`

Responsibilities:

- reject unknown payload fields
- normalize and dedupe `taxonomyTermIds`
- verify content existence
- verify taxonomy term existence and `scope = content`
- compute canonical payload hash
- check idempotency state
- replace join rows in a transaction
- write ingestion event
- return replay or applied result

### Shared reuse

Reuse existing infrastructure where it already fits:

- `authenticateIngestionRequest()` for auth
- `replaceJoinRows()` for transactional join replacement
- `content_taxonomy_terms` for join storage
- `ingestion_events` for replay tracking
- `buildDetailEnvelope()`, `buildErrorEnvelope()`, and `jsonOk()` for stable
  responses

### Write semantics

This endpoint uses replace-all semantics, not incremental mutation.

That is intentional. It mirrors the existing admin “Save taxonomy” behavior and
keeps the surface deterministic:

- one request describes the full desired content taxonomy state
- replay is tied to the normalized request payload, not whatever the DB looks
  like later
- clearing taxonomy is explicit through `taxonomyTermIds: []`

## Testing

### Unit and integration

Add focused tests for:

- unknown-field rejection
- taxonomy ID deduping
- first assignment behavior
- exact replay behavior
- replay conflict behavior
- missing content handling
- unknown taxonomy term handling
- taxonomy scope mismatch handling
- clear-all behavior with an empty array

### Route coverage

Add route tests for:

- `200` successful assignment
- `200` replay
- `400` invalid JSON
- `400` missing idempotency key
- `400` invalid payload
- `401` invalid or revoked key
- `403` insufficient scope
- `409` replay payload mismatch

No Playwright work is required in this slice because the surface is API-only.

## Success criteria

This slice is done when:

- trusted publishers can replace content taxonomy assignments with
  `POST /api/v1/ingest/content-taxonomy`
- the route uses the same auth and envelope conventions as existing ingestion
  routes
- idempotent replay and conflict behavior match the other ingestion surfaces
- the full verification gate is green

## Follow-on work

If this slice lands cleanly, the next mutation roadmap expands to:

- taxonomy assignment for agents
- taxonomy assignment for prompts
- taxonomy assignment for skills
- later cross-entity relation mutation
