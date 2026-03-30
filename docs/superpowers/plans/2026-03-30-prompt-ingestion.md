# Prompt ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated create-only ingestion for prompt library records at
`POST /api/v1/ingest/prompts`.

**Architecture:** Mirror the existing agent-ingestion shape instead of
generalizing it prematurely. Add a dedicated `prompt-ingestion` service, a
single route that reuses current auth and response envelopes, and focused route
and service tests that prove idempotent create behavior. Update the API
discovery page so the machine-surface index reflects the new route.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL,
Better Auth, Vitest

---

## File structure

- Create: `lib/ingestion/prompt-ingestion.ts`
- Create: `app/api/v1/ingest/prompts/route.ts`
- Create: `tests/prompt-ingestion-service.test.ts`
- Create: `tests/prompt-ingestion-route.test.ts`
- Modify: `app/api/page.tsx`

### Task 0: create the implementation branch

**Files:**
- Modify: none

- [ ] **Step 1: Branch from current `main`**

Run: `git checkout -b phase-2-prompt-ingestion`
Expected: branch created from `main`

- [ ] **Step 2: Push the branch and set upstream**

Run: `git push -u origin phase-2-prompt-ingestion`
Expected: branch published and tracking `origin/phase-2-prompt-ingestion`

### Task 1: add the service contract and idempotent prompt creation

**Files:**
- Create: `tests/prompt-ingestion-service.test.ts`
- Create: `lib/ingestion/prompt-ingestion.ts`
- Reuse: `lib/admin/record-input.ts`
- Reuse: `lib/admin/cms.ts`

- [ ] **Step 1: Write the failing service test**

```ts
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const ensureUniquePromptSlug = vi.fn();
const normalizePromptInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  prompts: {
    id: "prompts.id",
    slug: "prompts.slug",
    status: "prompts.status",
    name: "prompts",
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
  ensureUniquePromptSlug,
}));

vi.mock("@/lib/admin/record-input", () => ({
  normalizePromptInput,
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
        title: "Repo triage prompt",
        slug: "repo-triage-prompt",
        status: "published",
        shortDescription: "Summarize repo state fast.",
        fullDescription: null,
        promptBody: "Summarize the repository and highlight risk.",
        providerCompatibility: "openai,anthropic",
        variablesSchema: null,
        exampleOutput: null,
        externalId: "prompt-1",
      }),
    )
    .digest("hex");
}

function buildTransactionMock({
  id = "prompt-1",
  slug = "repo-triage-prompt",
  status = "published",
}: {
  id?: string;
  slug?: string;
  status?: string;
} = {}) {
  return async (callback: (tx: {
    insert: (table: { name?: string }) => {
      values: (values: Record<string, unknown>) =>
        | { returning: () => Promise<Array<{ id: string; slug: string; status: string }>> }
        | Promise<void>;
    };
  }) => Promise<unknown>) =>
    callback({
      insert(table: { name?: string }) {
        return {
          values(values: Record<string, unknown>) {
            if (table.name === "prompts") {
              return {
                returning: vi.fn().mockResolvedValue([
                  {
                    id,
                    slug: typeof values.slug === "string" ? values.slug : slug,
                    status:
                      typeof values.status === "string" ? values.status : status,
                  },
                ]),
              };
            }

            return Promise.resolve(undefined);
          },
        };
      },
    });
}

describe("prompt ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniquePromptSlug.mockResolvedValue("repo-triage-prompt");
    normalizePromptInput.mockReturnValue({
      title: "Repo triage prompt",
      slug: "repo-triage-prompt",
      status: "published",
      shortDescription: "Summarize repo state fast.",
      fullDescription: null,
      promptBody: "Summarize the repository and highlight risk.",
      providerCompatibility: "openai,anthropic",
      variablesSchema: null,
      exampleOutput: null,
    });
  });

  it("creates a new prompt and records the ingestion event", async () => {
    queueSelectResults([[]]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { ingestPromptRecord } = await import("@/lib/ingestion/prompt-ingestion");

    await expect(
      ingestPromptRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage prompt",
          status: "published",
          shortDescription: "Summarize repo state fast.",
          promptBody: "Summarize the repository and highlight risk.",
          providerCompatibility: "openai,anthropic",
          externalId: "prompt-1",
        },
      }),
    ).resolves.toEqual({
      kind: "prompt",
      id: "prompt-1",
      slug: "repo-triage-prompt",
      status: "published",
      replayed: false,
    });
  });

  it("replays deterministically when a concurrent request trips the idempotency unique index", async () => {
    queueSelectResults([
      [],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "prompt-1",
          status: "applied",
        },
      ],
      [
        {
          id: "prompt-1",
          slug: "repo-triage-prompt",
          status: "published",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestPromptRecord } = await import("@/lib/ingestion/prompt-ingestion");

    await expect(
      ingestPromptRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage prompt",
          status: "published",
          shortDescription: "Summarize repo state fast.",
          promptBody: "Summarize the repository and highlight risk.",
          providerCompatibility: "openai,anthropic",
          externalId: "prompt-1",
        },
      }),
    ).resolves.toEqual({
      kind: "prompt",
      id: "prompt-1",
      slug: "repo-triage-prompt",
      status: "published",
      replayed: true,
    });
  });
});
```

- [ ] **Step 2: Run the targeted service test to verify failure**

Run: `pnpm test -- tests/prompt-ingestion-service.test.ts`
Expected: FAIL with `Cannot find module '@/lib/ingestion/prompt-ingestion'`

- [ ] **Step 3: Implement the minimal prompt-ingestion service**

```ts
// lib/ingestion/prompt-ingestion.ts
import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { ingestionEvents, prompts } from "@/db/schema";
import { ensureUniquePromptSlug } from "@/lib/admin/cms";
import { normalizePromptInput } from "@/lib/admin/record-input";

export type PromptIngestionPayload = {
  title: string;
  slug?: string | null;
  status: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  promptBody: string;
  providerCompatibility?: string | null;
  variablesSchema?: string | null;
  exampleOutput?: string | null;
  externalId?: string | null;
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
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
      "Idempotent prompt record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingPrompt] = await db
    .select({
      id: prompts.id,
      slug: prompts.slug,
      status: prompts.status,
    })
    .from(prompts)
    .where(eq(prompts.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingPrompt) {
    throw createKnownError(
      "Idempotent prompt record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "prompt" as const,
    id: existingPrompt.id,
    slug: existingPrompt.slug,
    status: existingPrompt.status,
    replayed: true,
  };
}

export async function ingestPromptRecord({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: PromptIngestionPayload;
}) {
  const normalized = normalizePromptInput(payload);
  const payloadHash = buildPayloadHash({
    title: normalized.title,
    slug: normalized.slug,
    status: normalized.status,
    shortDescription: normalized.shortDescription,
    fullDescription: normalized.fullDescription,
    promptBody: normalized.promptBody,
    providerCompatibility: normalized.providerCompatibility,
    variablesSchema: normalized.variablesSchema,
    exampleOutput: normalized.exampleOutput,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniquePromptSlug(normalized.slug);

  try {
    const created = await db.transaction(async (tx) => {
      const [prompt] = await tx
        .insert(prompts)
        .values({
          ...normalized,
          slug,
          createdById: null,
          updatedById: null,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "prompt",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: prompt.id,
      });

      return prompt;
    });

    return {
      kind: "prompt" as const,
      id: created.id,
      slug: created.slug,
      status: created.status,
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

- [ ] **Step 4: Run the targeted service test to verify it passes**

Run: `pnpm test -- tests/prompt-ingestion-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the service slice**

```bash
git add tests/prompt-ingestion-service.test.ts lib/ingestion/prompt-ingestion.ts
git commit -m "Add prompt ingestion service"
```

### Task 2: add the route contract and stable error handling

**Files:**
- Create: `tests/prompt-ingestion-route.test.ts`
- Create: `app/api/v1/ingest/prompts/route.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const ingestPromptRecord = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/prompt-ingestion", () => ({
  ingestPromptRecord,
}));

describe("prompt ingestion routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns a stable unauthorized error when the request has no valid API key", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: false,
      status: 401,
      code: "missing_api_key",
      message: "API key is required.",
    });

    const { POST } = await import("@/app/api/v1/ingest/prompts/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompts", {
        method: "POST",
        body: JSON.stringify({ title: "Repo triage prompt" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing_api_key",
        details: undefined,
        message: "API key is required.",
      },
      meta: {
        version: "v1",
      },
    });
    expect(ingestPromptRecord).not.toHaveBeenCalled();
  });

  it("creates a published prompt when auth and payload are valid", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestPromptRecord.mockResolvedValue({
      kind: "prompt",
      id: "prompt-1",
      slug: "repo-triage-prompt",
      status: "published",
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/prompts/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompts", {
        method: "POST",
        body: JSON.stringify({
          title: "Repo triage prompt",
          status: "published",
          promptBody: "Summarize the repository and highlight risk.",
        }),
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        kind: "prompt",
        id: "prompt-1",
        slug: "repo-triage-prompt",
        status: "published",
        replayed: false,
      },
      meta: {
        entity: "ingest:prompt",
        version: "v1",
      },
    });
  });

  it("returns 400 when the request is missing Idempotency-Key", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });

    const { POST } = await import("@/app/api/v1/ingest/prompts/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompts", {
        method: "POST",
        body: JSON.stringify({
          title: "Repo triage prompt",
          status: "published",
          promptBody: "Summarize the repository and highlight risk.",
        }),
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing_idempotency_key",
        details: undefined,
        message: "Idempotency-Key header is required.",
      },
      meta: {
        version: "v1",
      },
    });
  });
});
```

- [ ] **Step 2: Run the targeted route test to verify failure**

Run: `pnpm test -- tests/prompt-ingestion-route.test.ts`
Expected: FAIL with `Cannot find module '@/app/api/v1/ingest/prompts/route'`

- [ ] **Step 3: Implement the route**

```ts
// app/api/v1/ingest/prompts/route.ts
import { buildErrorEnvelope, jsonOk } from "@/lib/api/public-read";
import { authenticateIngestionRequest } from "@/lib/ingestion/auth";
import { ingestPromptRecord } from "@/lib/ingestion/prompt-ingestion";

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
    requiredScope: "prompts:write",
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
    const result = await ingestPromptRecord({
      apiKeyId: auth.key.id!,
      idempotencyKey,
      payload,
    });

    return jsonOk(
      {
        data: result,
        meta: {
          entity: "ingest:prompt",
          version: "v1",
        },
      },
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest prompt.";
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

- [ ] **Step 4: Run the targeted route test to verify it passes**

Run: `pnpm test -- tests/prompt-ingestion-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the route slice**

```bash
git add tests/prompt-ingestion-route.test.ts app/api/v1/ingest/prompts/route.ts
git commit -m "Add prompt ingestion route"
```

### Task 3: update machine-surface discovery and prove the full contract

**Files:**
- Modify: `app/api/page.tsx`
- Modify: `tests/prompt-ingestion-service.test.ts`
- Modify: `tests/prompt-ingestion-route.test.ts`

- [ ] **Step 1: Extend the failing tests for replay and conflict**

```ts
// tests/prompt-ingestion-route.test.ts
it("returns 200 on an idempotent replay instead of creating a second record", async () => {
  authenticateIngestionRequest.mockResolvedValue({
    ok: true,
    key: { id: "key-1" },
  });
  ingestPromptRecord.mockResolvedValue({
    kind: "prompt",
    id: "prompt-1",
    slug: "repo-triage-prompt",
    status: "review",
    replayed: true,
  });

  const { POST } = await import("@/app/api/v1/ingest/prompts/route");
  const response = await POST(
    new Request("http://localhost:3011/api/v1/ingest/prompts", {
      method: "POST",
      body: JSON.stringify({
        title: "Repo triage prompt",
        status: "review",
        promptBody: "Summarize the repository and highlight risk.",
      }),
      headers: {
        authorization: "Bearer ar_live_secret_token",
        "content-type": "application/json",
        "idempotency-key": "evt-1",
      },
    }),
  );

  expect(response.status).toBe(200);
});
```

```ts
// tests/prompt-ingestion-service.test.ts
it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
  queueSelectResults([
    [],
    [
      {
        id: "evt-1",
        payloadHash: "different-hash",
        createdRecordId: "prompt-1",
        status: "applied",
      },
    ],
  ]);

  db.transaction.mockRejectedValue({
    code: "23505",
    constraint: "ingestion_events_api_key_idempotency_idx",
  });

  const { ingestPromptRecord } = await import("@/lib/ingestion/prompt-ingestion");

  await expect(
    ingestPromptRecord({
      apiKeyId: "key-1",
      idempotencyKey: "evt-1",
      payload: {
        title: "Repo triage prompt",
        status: "published",
        promptBody: "Summarize the repository and highlight risk.",
        externalId: "prompt-1",
      },
    }),
  ).rejects.toMatchObject({
    code: "idempotency_conflict",
    status: 409,
  });
});
```

- [ ] **Step 2: Run both test files to verify the new assertions fail**

Run: `pnpm test -- tests/prompt-ingestion-service.test.ts tests/prompt-ingestion-route.test.ts`
Expected: FAIL on missing replay or conflict coverage

- [ ] **Step 3: Update the API discovery page and finish the route/service coverage**

```tsx
// app/api/page.tsx
{
  href: "/api/v1/ingest/prompts",
  title: "Prompt ingestion",
  detail: "Authenticated create-only publishing for trusted prompt library updates.",
  method: "POST",
}
```

```tsx
// app/api/page.tsx
<PublicPanel
  title="Planned next"
  detail="The read API is live. Skill ingestion remains deferred until prompt ingestion proves out."
>
```

```ts
// tests/prompt-ingestion-route.test.ts
it("returns a stable conflict envelope for mismatched idempotent payloads", async () => {
  authenticateIngestionRequest.mockResolvedValue({
    ok: true,
    key: { id: "key-1" },
  });
  ingestPromptRecord.mockRejectedValue(
    Object.assign(new Error("Payload differs from the original idempotent request."), {
      code: "idempotency_conflict",
      status: 409,
    }),
  );

  const { POST } = await import("@/app/api/v1/ingest/prompts/route");
  const response = await POST(
    new Request("http://localhost:3011/api/v1/ingest/prompts", {
      method: "POST",
      body: JSON.stringify({
        title: "Repo triage prompt",
        status: "published",
        promptBody: "Summarize the repository and highlight risk.",
      }),
      headers: {
        authorization: "Bearer ar_live_secret_token",
        "content-type": "application/json",
        "idempotency-key": "evt-1",
      },
    }),
  );

  expect(response.status).toBe(409);
});
```

- [ ] **Step 4: Run the focused contract tests**

Run: `pnpm test -- tests/prompt-ingestion-service.test.ts tests/prompt-ingestion-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the contract-completion slice**

```bash
git add app/api/page.tsx tests/prompt-ingestion-service.test.ts tests/prompt-ingestion-route.test.ts
git commit -m "Document and verify prompt ingestion contract"
```

### Task 4: run the gate and open the PR

**Files:**
- Modify: none expected
- Verify: `tests/prompt-ingestion-service.test.ts`
- Verify: `tests/prompt-ingestion-route.test.ts`

- [ ] **Step 1: Run the targeted unit suite**

Run: `pnpm test -- tests/prompt-ingestion-service.test.ts tests/prompt-ingestion-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full verification gate**

Run: `pnpm lint && pnpm test && pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 3: Open the PR**

```bash
gh pr create --base main --head phase-2-prompt-ingestion --title "Add prompt ingestion API" --body "## Summary
- add authenticated create-only prompt ingestion
- reuse current idempotency and auth envelopes
- update API discovery copy and route coverage

## Testing
- pnpm test -- tests/prompt-ingestion-service.test.ts tests/prompt-ingestion-route.test.ts tests/ingestion-auth.test.ts
- pnpm lint
- pnpm test
- pnpm typecheck
- pnpm build"
```

- [ ] **Step 4: Commit any final review fixes**

```bash
git add -A
git commit -m "Address prompt ingestion review feedback"
```

## Self-review

Spec coverage:

- route scope and payload contract -> Tasks 1 and 2
- idempotency and replay behavior -> Tasks 1 and 3
- stable envelopes and auth handling -> Task 2
- API discovery update -> Task 3
- full verification gate -> Task 4

Placeholder scan:

- no `TBD`, `TODO`, or implied future implementation inside the execution path
- each task names exact files and exact commands

Type consistency:

- the service export is `ingestPromptRecord`
- the route meta entity is `ingest:prompt`
- the route scope is `prompts:write`
- the response `kind` is always `"prompt"`
