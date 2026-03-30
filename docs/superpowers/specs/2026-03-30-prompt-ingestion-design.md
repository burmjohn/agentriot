# AgentRiot prompt ingestion design

Date: March 30, 2026
Project: AgentRiot
Scope: Authenticated create-only ingestion for prompt library records

## Goal

Add the next authenticated ingestion surface after agent ingestion:
`POST /api/v1/ingest/prompts`.

This slice lets trusted publishers create prompt records through the existing
API key flow without widening the branch into skill ingestion, prompt relation
writes, or prompt taxonomy writes.

## Product decision

Prompt ingestion ships before skill ingestion.

This is the right next move because:

- prompts are the next self-contained directory entity already modeled in the
  product
- the admin prompt editor already proves the field set and validation rules
- the current ingestion stack can be reused with minimal new infrastructure
- skill ingestion can follow the same pattern after this path is stable

## Scope

This slice adds:

- `POST /api/v1/ingest/prompts`
- API key auth using the existing bearer-token flow
- required scope: `prompts:write`
- required `Idempotency-Key` header
- create-only ingestion for prompt records
- ingestion-event recording for replay and conflict handling

This slice does not add:

- prompt updates
- skill ingestion
- taxonomy assignment through ingestion
- prompt-to-agent or prompt-to-skill relation writes through ingestion
- public documentation beyond route discovery and contract coverage

## Payload contract

The request body is JSON and follows the existing admin prompt model.

Supported fields:

- `title` required
- `slug` optional
- `status` required
- `shortDescription` optional
- `fullDescription` optional
- `promptBody` required
- `providerCompatibility` optional
- `variablesSchema` optional
- `exampleOutput` optional
- `externalId` optional

`status` reuses the existing publication status enum:

- `draft`
- `review`
- `scheduled`
- `published`
- `archived`

The route accepts only this contract. Fields outside this contract are treated
as invalid input.

## Route behavior

### Authentication

The route uses the existing ingestion authentication flow:

- bearer token required
- API key must be valid
- API key must not be revoked
- API key must not be expired
- API key must include `prompts:write`

### Idempotency

The route requires an `Idempotency-Key` header.

Behavior matches content and agent ingestion:

- first successful request returns `201`
- exact replay returns `200` with `replayed: true`
- same idempotency key with different payload returns `409`
- missing idempotency key returns `400`

The payload hash is computed from the normalized prompt payload plus
`externalId`.

### Success envelope

The route returns the existing detail envelope shape with:

- `entity: "ingest:prompt"`
- `data.kind: "prompt"`
- `data.id`
- `data.slug`
- `data.status`
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
2. The route authenticates the API key with `prompts:write`.
3. The service normalizes the payload using the existing prompt input rules.
4. The service computes a canonical payload hash.
5. The service checks for an existing ingestion event with the same API key and
   idempotency key.
6. If a matching event exists, the service returns the replay result or
   conflict.
7. If not, the service creates the prompt and the ingestion event in one
   transaction.
8. The route returns `201` for first create or `200` for replay.

## Architecture

### Service shape

Add a dedicated service instead of overloading the agent or content ingestion
module.

Create:

- `lib/ingestion/prompt-ingestion.ts`

Responsibilities:

- normalize prompt payload
- compute canonical payload hash
- check idempotency state
- create prompt record
- write ingestion event
- return replay or created result

This keeps content, agent, and prompt ingestion parallel instead of growing one
generic ingestion file that mixes different entity contracts.

### Shared reuse

Reuse existing infrastructure where it already fits:

- `authenticateIngestionRequest()` for auth
- `normalizePromptInput()` for validation and normalization
- the `prompts` table for record creation
- `ingestion_events` for replay tracking
- `buildDetailEnvelope()`, `buildErrorEnvelope()`, and `jsonOk()` for stable
  responses

### Slug behavior

The service must preserve the same slug guarantees as admin writes:

- use the normalized slug candidate
- ensure uniqueness before insert
- return the final persisted slug in the response

Use the existing prompt slug helper from the admin CMS layer so admin and
ingestion remain consistent.

## Testing

### Unit and integration

Add focused tests for:

- prompt payload normalization integration
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
- `401` invalid or revoked key
- `403` insufficient scope
- `409` replay payload mismatch

No Playwright work is required in this slice because the surface is API-only.

## Success criteria

This slice is done when:

- trusted publishers can create prompt records with
  `POST /api/v1/ingest/prompts`
- the route uses the same auth and envelope conventions as existing ingestion
  routes
- idempotent replay and conflict behavior match content and agent ingestion
- the full verification gate is green

## Follow-on work

If this slice lands cleanly, skill ingestion can reuse the same shape rather
than inventing a different publishing contract.
