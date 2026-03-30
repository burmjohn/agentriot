# AgentRiot taxonomy ingestion design

Date: March 30, 2026
Project: AgentRiot
Scope: Authenticated create-only ingestion for shared taxonomy terms

## Goal

Add the next authenticated ingestion surface after skill ingestion:
`POST /api/v1/ingest/taxonomy`.

This slice lets trusted publishers create shared taxonomy terms through the
existing API key flow without widening the branch into relation writes, term
updates, or sort-order management.

## Product decision

Taxonomy ingestion ships as the first graph-enrichment slice after the
self-contained entity ingesters.

This is the right next move because:

- `taxonomy:write` already exists in the API key scope model
- taxonomy already has a dedicated admin normalization path and uniqueness rules
- the schema already models `taxonomy` as an ingestion target
- this enables machine publishing of the term catalog without yet mutating
  entity relationships

## Scope

This slice adds:

- `POST /api/v1/ingest/taxonomy`
- API key auth using the existing bearer-token flow
- required scope: `taxonomy:write`
- required `Idempotency-Key` header
- create-only ingestion for taxonomy terms
- ingestion-event recording for replay and conflict handling
- explicit rejection of unknown payload fields

This slice does not add:

- taxonomy term updates
- taxonomy assignment to content, agents, prompts, or skills
- sort-order mutation through ingestion
- public documentation beyond route discovery and contract coverage

## Payload contract

The request body is JSON and follows the existing admin taxonomy model.

Supported fields:

- `scope` required
- `kind` required
- `label` required
- `slug` optional
- `description` optional
- `externalId` optional

`scope` reuses the shared taxonomy scope enum:

- `content`
- `agent`
- `prompt`
- `skill`

`kind` reuses the shared taxonomy kind enum:

- `category`
- `tag`
- `type`

The route accepts only this contract. Fields outside this contract are treated
as invalid input.

## Route behavior

### Authentication

The route uses the existing ingestion authentication flow:

- bearer token required
- API key must be valid
- API key must not be revoked
- API key must not be expired
- API key must include `taxonomy:write`

### Idempotency

The route requires an `Idempotency-Key` header.

Behavior matches content, agent, prompt, and skill ingestion:

- first successful request returns `201`
- exact replay returns `200` with `replayed: true`
- same idempotency key with different payload returns `409`
- missing idempotency key returns `400`

The payload hash is computed from the normalized taxonomy payload plus
`externalId`.

### Success envelope

The route returns the existing detail envelope shape with:

- `entity: "ingest:taxonomy"`
- `data.kind: "taxonomy"`
- `data.id`
- `data.slug`
- `data.scope`
- `data.taxonomyKind`
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

## Data flow

1. The route parses JSON and checks `Idempotency-Key`.
2. The route authenticates the API key with `taxonomy:write`.
3. The service rejects unknown payload fields.
4. The service normalizes the payload using the existing taxonomy input rules.
5. The service computes a canonical payload hash.
6. The service checks for an existing ingestion event with the same API key and
   idempotency key.
7. If a matching event exists, the service returns the replay result or
   conflict.
8. If not, the service creates the taxonomy term and ingestion event in one
   transaction.
9. The route returns `201` for first create or `200` for replay.

## Architecture

### Service shape

Add a dedicated service instead of overloading the existing entity ingesters.

Create:

- `lib/ingestion/taxonomy-ingestion.ts`

Responsibilities:

- reject unknown taxonomy payload fields
- normalize taxonomy payload
- compute canonical payload hash
- check idempotency state
- create taxonomy term
- write ingestion event
- return replay or created result

This keeps content, agent, prompt, skill, and taxonomy ingestion parallel
instead of growing one generic ingestion file that mixes different contracts.

### Shared reuse

Reuse existing infrastructure where it already fits:

- `authenticateIngestionRequest()` for auth
- `normalizeTaxonomyInput()` for validation and normalization
- `ensureUniqueTaxonomySlug()` for scope+kind-aware slug uniqueness
- the `taxonomy_terms` table for record creation
- `ingestion_events` for replay tracking
- `buildDetailEnvelope()`, `buildErrorEnvelope()`, and `jsonOk()` for stable
  responses

### Slug behavior

The service must preserve the same slug guarantees as admin writes:

- use the normalized slug candidate
- ensure uniqueness within the same `scope` and `kind`
- return the final persisted slug in the response

## Testing

### Unit and integration

Add focused tests for:

- unknown-field rejection
- taxonomy payload normalization integration
- payload hash stability
- first create behavior
- exact replay behavior
- replay conflict behavior
- missing created-record handling for corrupted idempotency state
- scope enforcement through auth

### Route coverage

Add route tests for:

- `201` create
- `200` replay
- `400` invalid JSON
- `400` missing idempotency key
- `400` unknown fields
- `401` invalid or revoked key
- `403` insufficient scope
- `409` replay payload mismatch

No Playwright work is required in this slice because the surface is API-only.

## Success criteria

This slice is done when:

- trusted publishers can create taxonomy terms with
  `POST /api/v1/ingest/taxonomy`
- the route uses the same auth and envelope conventions as existing ingestion
  routes
- idempotent replay and conflict behavior match the other ingestion surfaces
- the full verification gate is green

## Follow-on work

If this slice lands cleanly, the next ingestion roadmap moves from graph term
creation into graph mutation, specifically taxonomy assignment and later
relation writes for published entities.
