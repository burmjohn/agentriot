# AgentRiot API Key Management Design

Date: 2026-03-28
Project: AgentRiot
Scope: Expanded admin-only API key management for trusted publishers and operators

## Goal

Add a real admin surface for API key management now that authenticated ingestion routes exist.
Admins need to be able to create, reveal, edit, revoke, reactivate, and inspect keys without
falling back to direct database work.

This is an internal operational feature. It is not a public self-service system.

## Product Decision

AgentRiot will ship an expanded API key management console, not a minimal one.

That means:

- all scopes are available from the admin UI, including `admin:*`
- keys are editable after creation for scopes and expiry
- admins can revoke and reactivate keys
- secrets are shown after creation and can be revealed again later
- last-used metadata is visible in the UI

## Security Tradeoff

Supporting later reveal means the system cannot remain one-way-only for key storage.

The auth path will continue to use:

- `key_prefix`
- `key_hash`

But phase 2 will also store an encrypted copy of the full secret so admins can reveal it later.

This is a deliberate tradeoff:

- stronger usability for trusted internal operators
- weaker security than one-time reveal only

For this project stage, that tradeoff is acceptable because:

- the UI is admin-only
- key creation is for trusted publishers and operators
- there is no public self-service key issuance

If the security bar rises later, the system can move back toward one-time reveal and rotation-heavy
workflows.

## User Surface

### Admin list page

Add `/admin/api-keys` with:

- newest-first list
- state badges: `active`, `revoked`, `expired`, `expiring soon`
- visible metadata: label, prefix, scopes, created date, expiry, creator, last used at, last used IP
- filters for:
  - active
  - revoked
  - expired
  - expiring soon
  - includes `admin:*`

### Create page

Add `/admin/api-keys/new` with:

- label
- optional description
- multi-select scopes
- optional expiry

On create:

- generate a new secret
- store hash + prefix + encrypted secret
- show the full secret in the success state
- make it clear this is a sensitive value

### Detail page

Add `/admin/api-keys/[id]` with:

- editable label
- editable description
- editable scopes
- editable expiry
- revoke action
- reactivate action
- reveal secret action
- usage metadata
- strong visual treatment for `admin:*`

## Behavior Rules

### Create

- keys are created only by authenticated admins
- the secret is generated server-side
- the cleartext secret is never shown in list views
- the create response exposes the secret once immediately after creation

### Reveal

- reveal is explicit, never automatic
- the secret is not inline by default on the detail page
- reveal requires an authenticated admin session

### Edit

- admins can edit:
  - label
  - description
  - scopes
  - expiry
- editing scopes or expiry takes effect immediately for future auth checks

### Revoke / reactivate

- revoked keys fail ingestion auth immediately
- expired keys fail ingestion auth immediately
- reactivated keys become valid again if not expired and otherwise correctly scoped

### Danger handling

- `admin:*` keys get stronger warning copy on create and edit
- revoke actions require explicit confirmation
- reveal actions should use obvious sensitive-state styling

## Architecture

### Data model

Extend `api_keys` with encrypted secret storage.

Keep existing auth-critical fields:

- `key_prefix`
- `key_hash`
- `scopes`
- `expires_at`
- `revoked_at`
- `last_used_at`
- `last_used_ip`

Add only what is necessary to support reveal and admin metadata.

### Services

Create a focused admin service layer for API key management:

- create key
- update key
- revoke key
- reactivate key
- reveal key
- list keys with computed status

Keep ingestion auth verification logic where it already belongs:

- `lib/ingestion/api-keys.ts`
- `lib/ingestion/auth.ts`

Add encryption behind a single interface so the storage strategy is isolated and replaceable.

## Routes

Add admin-only routes:

- `/admin/api-keys`
- `/admin/api-keys/new`
- `/admin/api-keys/[id]`

No public API-key routes in this slice.

## Testing

### Unit and integration

- encryption and decryption helpers
- key status calculation
- input validation for create and edit flows
- create/edit/revoke/reactivate/reveal admin actions
- ingestion auth behavior against revoked and expired keys after updates

### E2E

Add Playwright coverage for:

- create key
- reveal secret
- edit scopes and expiry
- revoke key
- reactivate key
- verify ingestion auth rejects revoked keys

## Out of scope

Not included in this slice:

- audit timeline
- key rotation assistant
- usage analytics dashboard
- IP allowlists
- per-key rate limits
- public self-service key issuance

## Implementation notes

- keep all routes server-rendered and admin-only
- use Better Auth admin session checks
- do not expose secrets in collection tables
- prefer explicit confirmation states over clever inline mutation

## Success criteria

This slice is done when:

- admins can create keys from the UI
- admins can reveal keys later
- admins can edit scopes and expiry
- admins can revoke and reactivate keys
- ingestion auth respects those state changes immediately
- tests cover the operational and auth-critical paths
