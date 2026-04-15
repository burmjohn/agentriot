# Deploy AgentRiot from GHCR to Coolify

This runbook describes how to deploy AgentRiot using images built and published by GitHub Actions, then consumed by Coolify.

## Overview

GitHub Actions is the single source of truth for CI. Every merge to `main` runs lint, typecheck, unit tests, Next.js build, both Playwright suites, and then publishes an immutable Docker image to the GitHub Container Registry (GHCR).

Coolify does not build from this repository. It pulls a published GHCR image and starts it.

## Image selection contract

Use immutable `sha-<shortsha>` tags from GHCR. These tags never change after publication, so the artifact you select in Coolify is exactly what passed all gates on `main`.

- Image path: `ghcr.io/<owner>/agentriot`
- Tag format: `sha-<shortsha>` (for example, `sha-7d3f9a2`)
- Do not use `latest` as a deployable tag. It is not part of this contract.

## Environment ownership

### Build-time variables (GitHub repository variables)

The following values are baked into the image at build time. Set them as repository variables in GitHub so the CI workflow can inject them during `docker build`:

- `NEXT_PUBLIC_SITE_URL` — canonical public site URL
- `NEXT_PUBLIC_APP_URL` — public app URL used by some client code
- `BETTER_AUTH_URL` — public URL used by Better Auth callbacks

These must point to the real public domain of the deployed app.

### Runtime secrets (Coolify environment)

The following values are provided by Coolify at container startup and are not baked into the image:

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — long random secret for auth
- `BETTER_AUTH_URL` — public URL for auth callbacks (must match the build-time value)
- `API_KEY_ENCRYPTION_KEY` — exactly 32 characters
- `ADMIN_EMAIL_ALLOWLIST` — comma-separated list of admin emails allowed to bootstrap access
- `NEXT_PUBLIC_SITE_URL` — must match the build-time value
- `NEXT_PUBLIC_APP_URL` — must match the build-time value

## Migration procedure

The container image starts the app with `pnpm start`. It does not run migrations automatically.

Before the first cutover to GHCR images, and before any schema-changing release, run migrations once against the target image and its runtime environment:

1. In Coolify, start a one-off command against the deployed service using the same image and environment.
2. Run:
   ```bash
   pnpm migrate
   ```
3. After the migration succeeds, start the app normally with `pnpm start`.

For routine releases that do not change the schema, start the app directly.

## Rollback procedure

If a release behaves unexpectedly, roll back by selecting the previous immutable `sha-<shortsha>` tag in Coolify and redeploying. Because every tag is immutable, the previous image is exactly the same artifact that was running before.

## Health check

Configure Coolify to use the following health check endpoint:

```
/api/health
```

- Returns `200` when the database is reachable.
- Returns `503` when the database is unavailable.

Use this endpoint for container health checks so Coolify can detect when the app is ready to serve traffic.
