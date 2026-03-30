# AgentRiot skill ingestion design

Date: March 30, 2026
Project: AgentRiot
Scope: Authenticated create-only ingestion for skill directory records

## Goal

Add the next authenticated ingestion surface after prompt ingestion:
`POST /api/v1/ingest/skills`.

This slice lets trusted publishers create skill records through the existing
API key flow without widening the branch into skill relation writes, taxonomy
writes, or update behavior.

## Product decision

Skill ingestion ships as the next deferred ingestion slice.

This is the right next move because:

- skills are the last major self-contained directory entity already modeled in
  the product
- the admin skill editor already proves the field set and validation rules
- the current ingestion stack can be reused with minimal new infrastructure
- this completes the core create-only ingestion coverage across content,
  agents, prompts, and skills

## Scope

This slice adds:

- `POST /api/v1/ingest/skills`
- API key auth using the existing bearer-token flow
- required scope: `skills:write`
- required `Idempotency-Key` header
- create-only ingestion for skill records
- ingestion-event recording for replay and conflict handling
- explicit rejection of unknown payload fields

This slice does not add:

- skill updates
- taxonomy assignment through ingestion
- skill-to-agent or skill-to-prompt relation writes through ingestion
- public documentation beyond route discovery and contract coverage

## Payload contract

The request body is JSON and follows the existing admin skill model.

Supported fields:

- `title` required
- `slug` optional
- `status` required
- `shortDescription` optional
- `longDescription` optional
- `websiteUrl` optional
- `githubUrl` optional
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
- API key must include `skills:write`

### Idempotency

The route requires an `Idempotency-Key` header.

Behavior matches content, agent, and prompt ingestion:

- first successful request returns `201`
- exact replay returns `200` with `replayed: true`
- same idempotency key with different payload returns `409`
- missing idempotency key returns `400`

The payload hash is computed from the normalized skill payload plus
`externalId`.

### Success envelope

The route returns the existing detail envelope shape with:

- `entity: "ingest:skill"`
- `data.kind: "skill"`
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
2. The route authenticates the API key with `skills:write`.
3. The service rejects unknown payload fields.
4. The service normalizes the payload using the existing skill input rules.
5. The service computes a canonical payload hash.
6. The service checks for an existing ingestion event with the same API key and
   idempotency key.
7. If a matching event exists, the service returns the replay result or
   conflict.
8. If not, the service creates the skill and the ingestion event in one
   transaction.
9. The route returns `201` for first create or `200` for replay.

## Architecture

### Service shape

Add a dedicated service instead of overloading the prompt or agent ingestion
module.

Create:

- `lib/ingestion/skill-ingestion.ts`

Responsibilities:

- reject unknown skill payload fields
- normalize skill payload
- compute canonical payload hash
- check idempotency state
- create skill record
- write ingestion event
- return replay or created result

This keeps content, agent, prompt, and skill ingestion parallel instead of
growing one generic ingestion file that mixes different entity contracts.

### Shared reuse

Reuse existing infrastructure where it already fits:

- `authenticateIngestionRequest()` for auth
- `normalizeSkillInput()` for validation and normalization
- the `skills` table for record creation
- `ingestion_events` for replay tracking
- `buildDetailEnvelope()`, `buildErrorEnvelope()`, and `jsonOk()` for stable
  responses

### Slug behavior

The service must preserve the same slug guarantees as admin writes:

- use the normalized slug candidate
- ensure uniqueness before insert
- return the final persisted slug in the response

Use the existing skill slug helper from the admin CMS layer so admin and
ingestion remain consistent.

## Testing

### Unit and integration

Add focused tests for:

- unknown-field rejection
- skill payload normalization integration
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

- trusted publishers can create skill records with
  `POST /api/v1/ingest/skills`
- the route uses the same auth and envelope conventions as existing ingestion
  routes
- idempotent replay and conflict behavior match the other ingestion surfaces
- the full verification gate is green

## Follow-on work

If this slice lands cleanly, the remaining ingestion roadmap shifts from
entity creation to richer graph mutation, such as taxonomy assignment,
relation writes, or update semantics.
