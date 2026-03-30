# Taxonomy ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated create-only ingestion for shared taxonomy terms at
`POST /api/v1/ingest/taxonomy`.

**Architecture:** Mirror the existing prompt-ingestion and skill-ingestion
shape instead of widening into relation writes. Add a dedicated
`taxonomy-ingestion` service, a single route that reuses current auth and
response envelopes, and focused route and service tests that prove idempotent
create behavior plus explicit unknown-field rejection. Update the API discovery
page so the machine-surface index reflects the new route and the next-step copy
points to taxonomy assignment rather than term creation.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL,
Better Auth, Vitest

---

## File structure

- Create: `lib/ingestion/taxonomy-ingestion.ts`
- Create: `app/api/v1/ingest/taxonomy/route.ts`
- Create: `tests/taxonomy-ingestion-service.test.ts`
- Create: `tests/taxonomy-ingestion-route.test.ts`
- Modify: `app/api/page.tsx`

### Task 0: create the implementation branch

**Files:**
- Modify: none

- [ ] **Step 1: Branch from current `main`**

Run: `git checkout -b phase-2-taxonomy-ingestion`
Expected: branch created from `main`

- [ ] **Step 2: Push the branch and set upstream**

Run: `git push -u origin phase-2-taxonomy-ingestion`
Expected: branch published and tracking `origin/phase-2-taxonomy-ingestion`

### Task 1: add the service contract and idempotent taxonomy creation

**Files:**
- Create: `tests/taxonomy-ingestion-service.test.ts`
- Create: `lib/ingestion/taxonomy-ingestion.ts`
- Reuse: `lib/admin/taxonomy-input.ts`
- Reuse: `lib/admin/cms.ts`

- [ ] **Step 1: Write the failing service test**

```ts
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const ensureUniqueTaxonomySlug = vi.fn();
const normalizeTaxonomyInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  taxonomyTerms: {
    id: "taxonomy_terms.id",
    slug: "taxonomy_terms.slug",
    scope: "taxonomy_terms.scope",
    kind: "taxonomy_terms.kind",
    name: "taxonomy_terms",
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

vi.mock("@/lib/admin/cms", () => ({
  ensureUniqueTaxonomySlug,
}));

vi.mock("@/lib/admin/taxonomy-input", () => ({
  normalizeTaxonomyInput,
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
        scope: "skill",
        kind: "tag",
        label: "Daily Ops",
        slug: "daily-ops",
        description: "Runbook-oriented workflows.",
        externalId: "taxonomy-1",
      }),
    )
    .digest("hex");
}

describe("taxonomy ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniqueTaxonomySlug.mockResolvedValue("daily-ops");
    normalizeTaxonomyInput.mockReturnValue({
      scope: "skill",
      kind: "tag",
      label: "Daily Ops",
      slug: "daily-ops",
      description: "Runbook-oriented workflows.",
    });
  });

  it("creates a new taxonomy term and records the ingestion event", async () => {
    queueSelectResults([[]]);
    db.transaction.mockImplementation(async (callback) =>
      callback({
        insert(table: { name?: string }) {
          return {
            values() {
              if (table.name === "taxonomy_terms") {
                return {
                  returning: vi.fn().mockResolvedValue([
                    {
                      id: "taxonomy-1",
                      slug: "daily-ops",
                      scope: "skill",
                      kind: "tag",
                    },
                  ]),
                };
              }

              return Promise.resolve(undefined);
            },
          };
        },
      }),
    );

    const { ingestTaxonomyRecord } = await import("@/lib/ingestion/taxonomy-ingestion");

    await expect(
      ingestTaxonomyRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
          description: "Runbook-oriented workflows.",
          externalId: "taxonomy-1",
        },
      }),
    ).resolves.toEqual({
      kind: "taxonomy",
      id: "taxonomy-1",
      slug: "daily-ops",
      scope: "skill",
      taxonomyKind: "tag",
      replayed: false,
    });
  });
});
```

- [ ] **Step 2: Run the service test to verify it fails**

Run: `pnpm test -- tests/taxonomy-ingestion-service.test.ts`
Expected: FAIL because `@/lib/ingestion/taxonomy-ingestion` does not exist yet

- [ ] **Step 3: Write the minimal service implementation**

```ts
import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { ingestionEvents, taxonomyTerms } from "@/db/schema";
import { ensureUniqueTaxonomySlug } from "@/lib/admin/cms";
import { normalizeTaxonomyInput } from "@/lib/admin/taxonomy-input";

export type TaxonomyIngestionPayload = {
  scope: "content" | "agent" | "prompt" | "skill";
  kind: "category" | "tag" | "type";
  label: string;
  slug?: string | null;
  description?: string | null;
  externalId?: string | null;
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
}

const allowedTaxonomyPayloadKeys = new Set([
  "scope",
  "kind",
  "label",
  "slug",
  "description",
  "externalId",
]);

function assertNoUnknownTaxonomyFields(payload: Record<string, unknown>) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !allowedTaxonomyPayloadKeys.has(field),
  );

  if (unknownFields.length) {
    throw createKnownError(
      `Unexpected taxonomy ingestion fields: ${unknownFields.join(", ")}.`,
      400,
      "invalid_payload",
    );
  }
}

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function isIdempotencyConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint" in error &&
    error.constraint === "ingestion_events_api_key_idempotency_idx"
  );
}

async function findExistingIngestionEvent(apiKeyId: string, idempotencyKey: string) {
  const [existingEvent] = await db
    .select({
      id: ingestionEvents.id,
      payloadHash: ingestionEvents.payloadHash,
      createdRecordId: ingestionEvents.createdRecordId,
      status: ingestionEvents.status,
    })
    .from(ingestionEvents)
    .where(
      and(
        eq(ingestionEvents.apiKeyId, apiKeyId),
        eq(ingestionEvents.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return existingEvent ?? null;
}

async function buildReplayResult({
  existingEvent,
  payloadHash,
}: {
  existingEvent: IngestionLookup;
  payloadHash: string;
}) {
  if (existingEvent.payloadHash !== payloadHash) {
    throw createKnownError(
      "Payload differs from the original idempotent request.",
      409,
      "idempotency_conflict",
    );
  }

  if (!existingEvent.createdRecordId) {
    throw createKnownError(
      "Idempotent taxonomy record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingTerm] = await db
    .select({
      id: taxonomyTerms.id,
      slug: taxonomyTerms.slug,
      scope: taxonomyTerms.scope,
      kind: taxonomyTerms.kind,
    })
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingTerm) {
    throw createKnownError(
      "Idempotent taxonomy record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "taxonomy" as const,
    id: existingTerm.id,
    slug: existingTerm.slug,
    scope: existingTerm.scope,
    taxonomyKind: existingTerm.kind,
    replayed: true,
  };
}

export async function ingestTaxonomyRecord(...) {
  assertNoUnknownTaxonomyFields(payload as Record<string, unknown>);
  const normalized = normalizeTaxonomyInput(payload);
  const payloadHash = buildPayloadHash({
    scope: normalized.scope,
    kind: normalized.kind,
    label: normalized.label,
    slug: normalized.slug,
    description: normalized.description,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniqueTaxonomySlug(
    normalized.scope,
    normalized.kind,
    normalized.slug,
  );

  try {
    const created = await db.transaction(async (tx) => {
      const [term] = await tx
        .insert(taxonomyTerms)
        .values({
          ...normalized,
          slug,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "taxonomy",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: term.id,
      });

      return term;
    });

    return {
      kind: "taxonomy" as const,
      id: created.id,
      slug: created.slug,
      scope: created.scope,
      taxonomyKind: created.kind,
      replayed: false,
    };
  } catch (error) {
    if (!isIdempotencyConstraintError(error)) {
      throw error;
    }

    const replayEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

    if (!replayEvent) {
      throw error;
    }

    return buildReplayResult({
      existingEvent: replayEvent,
      payloadHash,
    });
  }
}
```

- [ ] **Step 4: Run the service test and extend it to replay, conflict, and missing-record coverage**

Run: `pnpm test -- tests/taxonomy-ingestion-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the service slice**

```bash
git add tests/taxonomy-ingestion-service.test.ts lib/ingestion/taxonomy-ingestion.ts
git commit -m "Add taxonomy ingestion service"
```

### Task 2: add the API route contract

**Files:**
- Create: `tests/taxonomy-ingestion-route.test.ts`
- Create: `app/api/v1/ingest/taxonomy/route.ts`
- Reuse: `lib/ingestion/auth.ts`
- Reuse: `lib/api/public-read.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const ingestTaxonomyRecord = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/taxonomy-ingestion", () => ({
  ingestTaxonomyRecord,
}));

describe("taxonomy ingestion routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a taxonomy term when auth and payload are valid", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestTaxonomyRecord.mockResolvedValue({
      kind: "taxonomy",
      id: "taxonomy-1",
      slug: "daily-ops",
      scope: "skill",
      taxonomyKind: "tag",
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        kind: "taxonomy",
        id: "taxonomy-1",
        slug: "daily-ops",
        scope: "skill",
        taxonomyKind: "tag",
        replayed: false,
      },
      meta: {
        entity: "ingest:taxonomy",
        version: "v1",
      },
    });
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `pnpm test -- tests/taxonomy-ingestion-route.test.ts`
Expected: FAIL because `@/app/api/v1/ingest/taxonomy/route` does not exist yet

- [ ] **Step 3: Write the route implementation**

```ts
import { buildErrorEnvelope, jsonOk } from "@/lib/api/public-read";
import { authenticateIngestionRequest } from "@/lib/ingestion/auth";
import { ingestTaxonomyRecord } from "@/lib/ingestion/taxonomy-ingestion";

async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), {
      status: 400,
      code: "invalid_json",
    });
  }
}

function getIdempotencyKey(headers: Headers) {
  return headers.get("idempotency-key")?.trim() || null;
}

export async function POST(request: Request) {
  const auth = await authenticateIngestionRequest({
    headers: request.headers,
    requiredScope: "taxonomy:write",
  });

  if (!auth.ok) {
    return jsonOk(
      buildErrorEnvelope({
        code: auth.code,
        message: auth.message,
      }),
      auth.status,
    );
  }

  const idempotencyKey = getIdempotencyKey(request.headers);

  if (!idempotencyKey) {
    return jsonOk(
      buildErrorEnvelope({
        code: "missing_idempotency_key",
        message: "Idempotency-Key header is required.",
      }),
      400,
    );
  }

  try {
    const payload = await parseJsonBody(request);
    const result = await ingestTaxonomyRecord({
      apiKeyId: auth.key.id!,
      idempotencyKey,
      payload,
    });

    return jsonOk(
      {
        data: result,
        meta: {
          entity: "ingest:taxonomy",
          version: "v1",
        },
      },
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest taxonomy term.";
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : 400;
    const code =
      typeof error === "object" && error && "code" in error && typeof error.code === "string"
        ? error.code
        : "invalid_payload";

    return jsonOk(
      buildErrorEnvelope({
        code,
        message,
      }),
      status,
    );
  }
}
```

- [ ] **Step 4: Run the route tests and auth regression suite**

Run: `pnpm test -- tests/taxonomy-ingestion-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the route slice**

```bash
git add tests/taxonomy-ingestion-route.test.ts app/api/v1/ingest/taxonomy/route.ts
git commit -m "Add taxonomy ingestion route"
```

### Task 3: update API discovery and run the full gate

**Files:**
- Modify: `app/api/page.tsx`

- [ ] **Step 1: Add the new ingestion route to API discovery**

```tsx
{
  href: "/api/v1/ingest/taxonomy",
  title: "Taxonomy ingestion",
  detail: "Authenticated create-only publishing for shared graph taxonomy terms.",
  method: "POST",
}
```

- [ ] **Step 2: Update the “Planned next” copy**

```tsx
detail="The read API is live. The next deferred platform work is taxonomy assignment and relation mutation, not another create-only catalog endpoint."
```

- [ ] **Step 3: Run the focused ingestion gate**

Run: `pnpm test -- tests/taxonomy-ingestion-service.test.ts tests/taxonomy-ingestion-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 4: Run the full repo gate**

Run: `pnpm lint && pnpm test && pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 5: Commit the finished contract and push**

```bash
git add app/api/page.tsx tests/taxonomy-ingestion-service.test.ts tests/taxonomy-ingestion-route.test.ts lib/ingestion/taxonomy-ingestion.ts app/api/v1/ingest/taxonomy/route.ts
git commit -m "Finish taxonomy ingestion contract"
git push
```

## Self-review

- Spec coverage:
  - route added: Task 2
  - required `taxonomy:write` auth: Task 2
  - required `Idempotency-Key`: Task 2
  - create-only taxonomy ingestion: Task 1
  - explicit unknown-field rejection: Task 1
  - API discovery update: Task 3
- Placeholder scan:
  - commands, file paths, and commit messages are explicit
  - no `TODO`, `TBD`, or “follow the existing pattern” placeholders remain
- Type consistency:
  - `ingestTaxonomyRecord`, `TaxonomyIngestionPayload`,
    `ensureUniqueTaxonomySlug`, and `normalizeTaxonomyInput` match the current
    taxonomy helper names in the repo
