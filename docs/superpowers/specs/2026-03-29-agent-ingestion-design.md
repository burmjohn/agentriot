# AgentRiot agent ingestion design

Date: March 29, 2026
Project: AgentRiot
Scope: Authenticated create-only ingestion for agent directory records

## Goal

Add the next authenticated ingestion surface after articles and tutorials:
`POST /api/v1/ingest/agents`.

This slice lets trusted publishers create agent records through the existing
API key flow without widening the branch into prompt and skill ingestion at the
same time.

## Product decision

Agent ingestion ships before prompt and skill ingestion.

This is the right next move because:

- agents are the richest non-content directory entity already modeled in the
  product
- the admin surface already proves the agent field set and validation rules
- the current ingestion stack can be reused with minimal new infrastructure
- prompts and skills can follow the same pattern after this path is stable

## Scope

This slice adds:

- `POST /api/v1/ingest/agents`
- API key auth using the existing bearer-token flow
- required scope: `agents:write`
- required `Idempotency-Key` header
- create-only ingestion for agent records
- ingestion-event recording for replay and conflict handling

This slice does not add:

- agent updates
- prompt ingestion
- skill ingestion
- taxonomy assignment through ingestion
- agent-to-prompt or agent-to-skill relation writes through ingestion
- public documentation beyond route discovery and contract coverage

## Payload contract

The request body is JSON and follows the existing admin agent model.

Supported fields:

- `title` required
- `slug` optional
- `status` required
- `shortDescription` optional
- `longDescription` optional
- `websiteUrl` optional
- `githubUrl` optional
- `pricingNotes` optional
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
- API key must include `agents:write`

### Idempotency

The route requires an `Idempotency-Key` header.

Behavior matches content ingestion:

- first successful request returns `201`
- exact replay returns `200` with `replayed: true`
- same idempotency key with different payload returns `409`
- missing idempotency key returns `400`

The payload hash is computed from the normalized agent payload plus
`externalId`.

### Success envelope

The route returns the existing detail envelope shape with:

- `entity: "ingest:agent"`
- `data.kind: "agent"`
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
2. The route authenticates the API key with `agents:write`.
3. The service normalizes the payload using the existing agent input rules.
4. The service computes a canonical payload hash.
5. The service checks for an existing ingestion event with the same API key and
   idempotency key.
6. If a matching event exists, the service returns the replay result or
   conflict.
7. If not, the service creates the agent and the ingestion event in one
   transaction.
8. The route returns `201` for first create or `200` for replay.

## Architecture

### Service shape

Add a dedicated service instead of overloading the content ingestion module.

Create:

- `lib/ingestion/agent-ingestion.ts`

Responsibilities:

- normalize agent payload
- compute canonical payload hash
- check idempotency state
- create agent record
- write ingestion event
- return replay or created result

This keeps content ingestion and agent ingestion parallel instead of creating
one large generic ingestion file.

### Shared reuse

Reuse existing infrastructure where it already fits:

- `authenticateIngestionRequest()` for auth
- `normalizeAgentInput()` for validation and normalization
- the `agents` table for record creation
- `ingestion_events` for replay tracking
- `buildDetailEnvelope()`, `buildErrorEnvelope()`, and `jsonOk()` for stable
  responses

### Slug behavior

The service must preserve the same slug guarantees as admin writes:

- use the normalized slug candidate
- ensure uniqueness before insert
- return the final persisted slug in the response

If there is no existing dedicated helper for unique agent slugs, add one in the
same place the admin flow currently resolves agent slugs so route and admin
stay consistent.

## Testing

### Unit and integration

Add focused tests for:

- agent payload normalization integration
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

- trusted publishers can create agent records with `POST /api/v1/ingest/agents`
- the route uses the same auth and envelope conventions as existing ingestion
  routes
- idempotent replay and conflict behavior match content ingestion
- the full verification gate is green

## Follow-on work

If this slice lands cleanly, the next ingestion expansion can reuse the same
shape for prompts and skills rather than inventing a second pattern.
