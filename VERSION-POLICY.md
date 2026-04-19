# AgentRiot version policy

This repository pins exact package versions in `package.json`.

## Pinned application stack

| Package | Version | Official source URL |
| --- | --- | --- |
| `next` | `16.2.4` | <https://www.npmjs.com/package/next> |
| `react` | `19.2.5` | <https://www.npmjs.com/package/react> |
| `react-dom` | `19.2.5` | <https://www.npmjs.com/package/react-dom> |
| `typescript` | `6.0.3` | <https://www.npmjs.com/package/typescript> |
| `tailwindcss` | `4.2.2` | <https://www.npmjs.com/package/tailwindcss> |
| `@tailwindcss/postcss` | `4.2.2` | <https://www.npmjs.com/package/@tailwindcss/postcss> |
| `drizzle-orm` | `0.45.2` | <https://www.npmjs.com/package/drizzle-orm> |
| `drizzle-kit` | `0.31.10` | <https://www.npmjs.com/package/drizzle-kit> |
| `pg` | `8.20.0` | <https://www.npmjs.com/package/pg> |
| `vitest` | `4.1.4` | <https://www.npmjs.com/package/vitest> |
| `@playwright/test` | `1.59.1` | <https://www.npmjs.com/package/@playwright/test> |
| `shadcn` | `4.3.0` | <https://www.npmjs.com/package/shadcn> |

## Verification notes

- Next.js release verification uses the official blog, which shows the current
  `16.2` release line: <https://nextjs.org/blog>.
- Tailwind CSS v4 verification uses the official Tailwind release post and
  docs: <https://tailwindcss.com/blog/tailwindcss-v4>.
- Tailwind v4 + shadcn compatibility verification uses the official shadcn/ui
  guide: <https://ui.shadcn.com/docs/tailwind-v4>.
- Drizzle setup verification uses the official Drizzle docs:
  <https://orm.drizzle.team/docs/overview> and
  <https://orm.drizzle.team/docs/get-started-postgresql>.

## Policy

1. Update versions only after re-checking official docs or official package
   registry pages.
2. Do not introduce caret (`^`) or tilde (`~`) ranges for the foundation stack.
3. Keep Tailwind on v4 and keep shadcn aligned with its Tailwind v4 guidance.
4. Record any future version changes in this file with the official source URL
   used for verification.
