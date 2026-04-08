# Stack Upgrade Learnings

## Conventions
- Use pnpm for package management
- Node 24.x and pnpm 10.x are current requirements
- All CLI tools used by scripts must be direct dependencies
- Better Auth uses `@better-auth/drizzle-adapter` package

## Blockers Identified
- vitest is used by scripts but not in package.json
- Auth adapter import pattern needs verification

## Patterns
- Framework band: next, react, react-dom, typescript, @types/*
- Styling band: tailwindcss, @tailwindcss/postcss, postcss
- Auth band: better-auth, @better-auth/drizzle-adapter
- Data band: drizzle-orm, drizzle-kit, postgres
- Test band: @playwright/test, vitest, tsx

## Task 1 baseline — April 8, 2026
- Current runtime: Node 22.22.2, pnpm 10.33.0.
- Key outdated direct packages: next 16.2.1 -> 16.2.2,
  eslint-config-next 16.2.1 -> 16.2.2, postgres 3.4.8 -> 3.4.9,
  better-auth 1.5.6 -> 1.6.0,
  @better-auth/drizzle-adapter 1.5.6 -> 1.6.0,
  @playwright/test 1.58.2 -> 1.59.1, eslint 9.39.4 -> 10.2.0,
  typescript 5.9.3 -> 6.0.2, and @types/node 20.19.37 -> 25.5.2.
- Blockers identified: vitest is only available as an unsaved transitive CLI,
  drizzle-kit is also not directly owned, the Better Auth drizzle adapter
  source is ambiguous, Node 22.22.2 is below the documented Node 24.x target,
  PostgreSQL version is not pinned, and both E2E suites are blocked by an
  existing process on port 3011.
- Baseline status: `pnpm lint`, `pnpm typecheck`, `pnpm build`, and
  `pnpm test` passed. `pnpm test:e2e` failed with `EADDRINUSE` on 3011.
  `pnpm test:e2e:admin` failed because another `next dev` server was already
  running on 3011.

## Task 2 tool ownership and clean install — April 8, 2026
- Added direct devDependency ownership for `vitest@4.1.2`,
  `drizzle-kit@0.31.10`, and `dotenv@17.3.1`. `dotenv` is required because
  `drizzle.config.ts` imports `dotenv/config` directly.
- Added `package.json` engine pins for Node `24.x` and pnpm `10.33.0`, while
  keeping `packageManager` pinned to `pnpm@10.33.0`.
- Pinned all direct dependencies and devDependencies to exact versions so a
  clean reinstall does not silently upgrade framework, auth, data, or tooling
  packages when the lockfile is regenerated.
- Clean install succeeded with `rm -rf node_modules pnpm-lock.yaml && pnpm install`.
  The only install issue was an expected engine warning because the current
  machine is still on Node `22.22.2` instead of the repo target `24.x`.
- Verification after the lockfile refresh passed: `pnpm lint` exit 0 and
  `pnpm typecheck` exit 0.
