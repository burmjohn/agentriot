# Content taxonomy assignment ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated replace-all taxonomy assignment for content records
at `POST /api/v1/ingest/content-taxonomy`.

**Architecture:** Mirror the existing ingestion route pattern, but reuse the
admin content taxonomy write semantics instead of creating a new mutation model.
Add a dedicated `content-taxonomy-assignment` service, a single route that
reuses current auth and response envelopes, and focused route and service tests
that prove idempotent replace-all behavior, validation, and clear-all support.
Update the API discovery page so the machine-surface index reflects the new
content taxonomy mutation route.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL,
Better Auth, Vitest

---

## File structure

- Create: `lib/ingestion/content-taxonomy-assignment.ts`
- Create: `app/api/v1/ingest/content-taxonomy/route.ts`
- Create: `tests/content-taxonomy-assignment-service.test.ts`
- Create: `tests/content-taxonomy-assignment-route.test.ts`
- Modify: `app/api/page.tsx`

### Task 0: create the implementation branch

**Files:**
- Modify: none

- [ ] **Step 1: Branch from current `main`**

Run: `git checkout -b phase-2-content-taxonomy-assignment`
Expected: branch created from `main`

- [ ] **Step 2: Push the branch and set upstream**

Run: `git push -u origin phase-2-content-taxonomy-assignment`
Expected: branch published and tracking `origin/phase-2-content-taxonomy-assignment`

### Task 1: add the service contract and transactional replace-all mutation

**Files:**
- Create: `tests/content-taxonomy-assignment-service.test.ts`
- Create: `lib/ingestion/content-taxonomy-assignment.ts`
- Reuse: `lib/admin/relation-writes.ts`
- Reuse: `db/schema/content-graph.ts`

- [ ] **Step 1: Write the failing service test**

```ts
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const replaceJoinRows = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  contentItems: {
    id: "content_items.id",
    name: "content_items",
  },
  taxonomyTerms: {
    id: "taxonomy_terms.id",
    scope: "taxonomy_terms.scope",
    name: "taxonomy_terms",
  },
  contentTaxonomyTerms: {
    contentItemId: "content_taxonomy_terms.content_item_id",
    taxonomyTermId: "content_taxonomy_terms.taxonomy_term_id",
    name: "content_taxonomy_terms",
  },
  ingestionEvents: {
    id: "ingestion_events.id",
    payloadHash: "ingestion_events.payload_hash",
    createdRecordId: "ingestion_events.created_record_id",
    status: "ingestion_events.status",
    apiKeyId: "ingestion_events.api_key_id",
    idempotencyKey: "ingestion_events.idempotency_key",
    name: "ingestion_events",
  },
}));

vi.mock("@/lib/admin/relation-writes", () => ({
  replaceJoinRows,
}));

function queueSelectResults(results: unknown[]) {
  db.select.mockImplementation(() => {
    const next = results.shift();
    return {
      from() {
        return {
          where() {
            return {
              limit: vi.fn().mockResolvedValue(next),
            };
          },
        };
      },
    };
  });
}

function buildExpectedPayloadHash() {
  return createHash("sha256")
    .update(
      JSON.stringify({
        contentId: "content-1",
        taxonomyTermIds: ["term-1", "term-2"],
      }),
    )
    .digest("hex");
}

describe("content taxonomy assignment service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("replaces the content taxonomy joins transactionally", async () => {
    queueSelectResults([
      [{ id: "content-1" }],
      [
        { id: "term-1", scope: "content" },
        { id: "term-2", scope: "content" },
      ],
      [],
    ]);
    db.transaction.mockImplementation(async (callback) => callback(db as never));

    const { assignContentTaxonomy } = await import("@/lib/ingestion/content-taxonomy-assignment");

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          taxonomyTermIds: ["term-2", "term-1", "term-2"],
        },
      }),
    ).resolves.toEqual({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: ["term-1", "term-2"],
      replayed: false,
    });
  });

  it("accepts an empty array to clear taxonomy assignments", async () => {
    queueSelectResults([[{ id: "content-1" }], [], []]);
    db.transaction.mockImplementation(async (callback) => callback(db as never));

    const { assignContentTaxonomy } = await import("@/lib/ingestion/content-taxonomy-assignment");

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          taxonomyTermIds: [],
        },
      }),
    ).resolves.toEqual({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: [],
      replayed: false,
    });
  });
});
```

- [ ] **Step 2: Run the service test to verify it fails**

Run: `pnpm test -- tests/content-taxonomy-assignment-service.test.ts`
Expected: FAIL because `@/lib/ingestion/content-taxonomy-assignment` does not
exist yet

- [ ] **Step 3: Write the minimal service implementation**

```ts
import { and, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { contentItems, contentTaxonomyTerms, ingestionEvents, taxonomyTerms } from "@/db/schema";
import { replaceJoinRows } from "@/lib/admin/relation-writes";

export type ContentTaxonomyAssignmentPayload = {
  contentId: string;
  taxonomyTermIds: string[];
};

const allowedPayloadKeys = new Set(["contentId", "taxonomyTermIds"]);

function normalizeTaxonomyIds(ids: string[]) {
  return [...new Set(ids)].sort();
}

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
}

export async function assignContentTaxonomy(...) {
  // implement the same idempotency flow as the existing ingesters:
  // normalize -> verify content -> verify terms -> hash -> replay lookup ->
  // replaceJoinRows + ingestion event transaction -> replay fallback
}
```

- [ ] **Step 4: Extend coverage to replay, conflict, invalid scope, missing
content, and unknown field handling**

Run: `pnpm test -- tests/content-taxonomy-assignment-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the service slice**

```bash
git add tests/content-taxonomy-assignment-service.test.ts lib/ingestion/content-taxonomy-assignment.ts
git commit -m "Add content taxonomy assignment service"
```

### Task 2: add the API route contract

**Files:**
- Create: `tests/content-taxonomy-assignment-route.test.ts`
- Create: `app/api/v1/ingest/content-taxonomy/route.ts`
- Reuse: `lib/ingestion/auth.ts`
- Reuse: `lib/api/public-read.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const assignContentTaxonomy = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/content-taxonomy-assignment", () => ({
  assignContentTaxonomy,
}));

describe("content taxonomy assignment route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("assigns taxonomy for a valid content mutation request", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignContentTaxonomy.mockResolvedValue({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: ["term-1", "term-2"],
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
        method: "POST",
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
        body: JSON.stringify({
          contentId: "content-1",
          taxonomyTermIds: ["term-2", "term-1"],
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        kind: "content-taxonomy",
        contentId: "content-1",
        taxonomyTermIds: ["term-1", "term-2"],
        replayed: false,
      },
      meta: {
        entity: "ingest:content-taxonomy",
        version: "v1",
      },
    });
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `pnpm test -- tests/content-taxonomy-assignment-route.test.ts`
Expected: FAIL because `@/app/api/v1/ingest/content-taxonomy/route` does not
exist yet

- [ ] **Step 3: Write the route implementation**

```ts
import { buildErrorEnvelope, jsonOk } from "@/lib/api/public-read";
import { authenticateIngestionRequest } from "@/lib/ingestion/auth";
import { assignContentTaxonomy } from "@/lib/ingestion/content-taxonomy-assignment";

export async function POST(request: Request) {
  // mirror the existing ingestion route shape:
  // auth -> idempotency key -> parse JSON -> call service -> stable envelope
}
```

- [ ] **Step 4: Run the route tests and auth regression suite**

Run: `pnpm test -- tests/content-taxonomy-assignment-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the route slice**

```bash
git add tests/content-taxonomy-assignment-route.test.ts app/api/v1/ingest/content-taxonomy/route.ts
git commit -m "Add content taxonomy assignment route"
```

### Task 3: update API discovery and run the full gate

**Files:**
- Modify: `app/api/page.tsx`

- [ ] **Step 1: Add the mutation route to API discovery**

```tsx
{
  href: "/api/v1/ingest/content-taxonomy",
  title: "Content taxonomy assignment",
  detail: "Authenticated replace-all publishing for content taxonomy joins.",
  method: "POST",
}
```

- [ ] **Step 2: Update the “Planned next” copy**

```tsx
detail="The read API is live. The next deferred platform work is broader taxonomy assignment and relation mutation, not another create-only catalog endpoint."
```

- [ ] **Step 3: Run the focused mutation gate**

Run: `pnpm test -- tests/content-taxonomy-assignment-service.test.ts tests/content-taxonomy-assignment-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 4: Run the full repo gate**

Run: `pnpm lint && pnpm test && pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 5: Commit the finished contract and push**

```bash
git add app/api/page.tsx tests/content-taxonomy-assignment-service.test.ts tests/content-taxonomy-assignment-route.test.ts lib/ingestion/content-taxonomy-assignment.ts app/api/v1/ingest/content-taxonomy/route.ts
git commit -m "Finish content taxonomy assignment contract"
git push
```

## Self-review

- Spec coverage:
  - route added: Task 2
  - required `content:write` auth: Task 2
  - required `Idempotency-Key`: Task 2
  - replace-all content taxonomy mutation: Task 1
  - explicit unknown-field rejection: Task 1
  - API discovery update: Task 3
- Placeholder scan:
  - commands, file paths, and commit messages are explicit
  - only the mirrored service and route bodies need to be filled in from the
    already-established ingestion pattern during execution
- Type consistency:
  - `assignContentTaxonomy`, `ContentTaxonomyAssignmentPayload`, and
    `replaceJoinRows` match the current helper naming in the repo
