- April 15, 2026: The runtime container contract stays stateless when the final
  Docker stage uses `CMD ["pnpm", "start"]`; database migrations must run as a
  separate operational step instead of during container startup.
- April 15, 2026: A root `.dockerignore` can safely exclude local agent folders,
  test artifacts, docs, screenshots, and repo metadata for this app because the
  Docker build only needs application source, config, `public/`, and lockfiles;
  the resulting build context dropped to about 1.32 MB in verification.
- April 15, 2026: The CI validate lane can keep the three URL variables in the
  workflow-level `env` block; that scope reaches `pnpm typecheck` and
  `pnpm build`, so the fast PR gate stays explicit without duplicating per-step
  environment wiring.
- April 15, 2026: The main-only Playwright GitHub Actions jobs need job-level
  localhost URL overrides (`PLAYWRIGHT_BASE_URL`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_APP_URL`, and `BETTER_AUTH_URL`) so each suite boots against its
  own CI-local port instead of the shared placeholder domain.
- April 15, 2026: The admin Playwright suite depends on `dropdb` and `createdb`,
  so each PostgreSQL-backed E2E job must install `postgresql-client` on the
  runner before Playwright starts the web server.
- April 15, 2026: The GHCR publish lane can stay artifact-only by giving only
  the `publish-image` job `packages: write`, generating tags with
  `docker/metadata-action` using `type=sha,prefix=sha-`, and writing the chosen
  image reference plus digest to both job outputs and `$GITHUB_STEP_SUMMARY` for
  the Coolify handoff.
