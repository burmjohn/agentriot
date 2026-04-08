# Task 8 blocker review

This report captures the targeted compatibility review for the Task 8 hotspot
files. The review stayed scoped to upgrade blockers, deprecated APIs,
implicit dependency reliance, type suppressions, and config mismatches exposed
by Tasks 1-7.

## Files reviewed

The following files were reviewed against the upgraded stack and the local
Next.js 16 docs bundle:

- `next.config.ts`
- `lib/auth.ts`
- `lib/auth/server.ts`
- `db/index.ts`
- `playwright.admin.config.ts`
- `vitest.config.ts`
- `lib/admin/relation-writes.ts`

## Fixed blockers

One compatibility hazard was remediated.

- **`lib/admin/relation-writes.ts`**
  - Replaced the documented `as never` suppressions with generic helper types.
  - The helper now preserves the delete and insert contract structurally,
    instead of forcing Drizzle calls through unsafe casts.
  - This removes an upgrade-risky suppression point in a shared admin and
    ingestion write path.

## Reviewed with no code change required

These hotspot files were reviewed and did not need changes because they already
match the upgraded stack behavior.

- **`next.config.ts`**: `serverExternalPackages` uses the stable Next.js config
  name and keeps the Better Auth externalization required by the current auth
  setup.
- **`lib/auth.ts`**: uses the extracted
  `@better-auth/drizzle-adapter` package and remains compatible with Better
  Auth 1.6.0.
- **`lib/auth/server.ts`**: already uses `await headers()` and keeps
  `redirect()` outside any `try/catch`, which matches current Next.js app
  router guidance.
- **`db/index.ts`**: existing `postgres(..., { prepare: false })` and Drizzle
  client wiring remain compatible with the upgraded data stack.
- **`playwright.admin.config.ts`**: admin E2E bootstrap still uses an isolated
  database, explicit app URL, and deterministic startup sequence.
- **`vitest.config.ts`**: direct `vitest/config` ownership is explicit and the
  config shape remains compatible with Vitest 4.1.3.

## Deferred non-blockers

One reviewed issue remains non-blocking.

- **Node engine warning in this workspace**: verification still emits the known
  `engines.node = 24.x` warning because the current environment is running
  Node `22.22.2`. This is not caused by the reviewed hotspot files, and
  `pnpm lint`, `pnpm typecheck`, and `pnpm build` still exit 0.

## Verification evidence

The blocker fix was validated without broadening scope beyond the required
checks.

- `lsp_diagnostics lib/admin/relation-writes.ts`: clean
- `pnpm lint`: passed
- `pnpm typecheck`: passed
- `pnpm build`: passed

## Summary

Task 8 found one real upgrade hazard in the hotspot set: unsafe `as never`
casts in the shared relation write helper. That blocker was fixed. No other
deprecated or incompatible API usage remained in the reviewed hotspot files.
