# Agent ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated create-only ingestion for agent directory records at
`POST /api/v1/ingest/agents`.

**Architecture:** Mirror the existing content-ingestion shape instead of
generalizing it prematurely. Add a dedicated `agent-ingestion` service, a
single route that reuses current auth and response envelopes, and focused route
and service tests that prove idempotent create behavior. Update the API
discovery page so the machine-surface index reflects the new route.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL,
Better Auth, Vitest

---

## File structure

- Create: `lib/ingestion/agent-ingestion.ts`
- Create: `app/api/v1/ingest/agents/route.ts`
- Create: `tests/agent-ingestion-service.test.ts`
- Create: `tests/agent-ingestion-route.test.ts`
- Modify: `app/api/page.tsx`

### Task 0: create the implementation branch

**Files:**
- Modify: none

- [ ] **Step 1: Branch from current `main`**

Run: `git checkout -b phase-2-agent-ingestion`
Expected: branch created from `main`

- [ ] **Step 2: Push the branch and set upstream**

Run: `git push -u origin phase-2-agent-ingestion`
Expected: branch published and tracking `origin/phase-2-agent-ingestion`

### Task 1: add the service contract and idempotent agent creation

**Files:**
- Create: `tests/agent-ingestion-service.test.ts`
- Create: `lib/ingestion/agent-ingestion.ts`
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

const ensureUniqueAgentSlug = vi.fn();
const normalizeAgentInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/lib/admin/cms", () => ({
  ensureUniqueAgentSlug,
}));

vi.mock("@/lib/admin/record-input", () => ({
  normalizeAgentInput,
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
        title: "Claude Code",
        slug: "claude-code",
        status: "published",
        shortDescription: "Agentic coding assistant",
        longDescription: null,
        websiteUrl: "https://example.com/claude-code",
        githubUrl: null,
        pricingNotes: null,
        externalId: "agent-1",
      }),
    )
    .digest("hex");
}

describe("agent ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniqueAgentSlug.mockResolvedValue("claude-code");
    normalizeAgentInput.mockReturnValue({
      title: "Claude Code",
      slug: "claude-code",
      status: "published",
      shortDescription: "Agentic coding assistant",
      longDescription: null,
      websiteUrl: "https://example.com/claude-code",
      githubUrl: null,
      pricingNotes: null,
    });
  });

  it("creates a new agent and records the ingestion event", async () => {
    queueSelectResults([[]]);

    db.transaction.mockImplementation(async (callback) =>
      callback({
        insert(table: { name?: string }) {
          if (table.name === "agents") {
            return {
              values() {
                return {
                  returning: vi.fn().mockResolvedValue([
                    {
                      id: "agent-1",
                      slug: "claude-code",
                      status: "published",
                    },
                  ]),
                };
              },
            };
          }

          return {
            values: vi.fn().mockResolvedValue(undefined),
          };
        },
      }),
    );

    const { ingestAgentRecord } = await import("@/lib/ingestion/agent-ingestion");

    await expect(
      ingestAgentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Claude Code",
          status: "published",
          shortDescription: "Agentic coding assistant",
          websiteUrl: "https://example.com/claude-code",
          externalId: "agent-1",
        },
      }),
    ).resolves.toEqual({
      kind: "agent",
      id: "agent-1",
      slug: "claude-code",
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
          createdRecordId: "agent-1",
          status: "applied",
        },
      ],
      [
        {
          id: "agent-1",
          slug: "claude-code",
          status: "published",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestAgentRecord } = await import("@/lib/ingestion/agent-ingestion");

    await expect(
      ingestAgentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Claude Code",
          status: "published",
          shortDescription: "Agentic coding assistant",
          websiteUrl: "https://example.com/claude-code",
          externalId: "agent-1",
        },
      }),
    ).resolves.toEqual({
      kind: "agent",
      id: "agent-1",
      slug: "claude-code",
      status: "published",
      replayed: true,
    });
  });
});
```

- [ ] **Step 2: Run the targeted service test to verify failure**

Run: `pnpm test -- tests/agent-ingestion-service.test.ts`
Expected: FAIL with `Cannot find module '@/lib/ingestion/agent-ingestion'`

- [ ] **Step 3: Implement the minimal agent-ingestion service**

```ts
// lib/ingestion/agent-ingestion.ts
import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { agents, ingestionEvents } from "@/db/schema";
import { ensureUniqueAgentSlug } from "@/lib/admin/cms";
import { normalizeAgentInput } from "@/lib/admin/record-input";

export type AgentIngestionPayload = {
  title: string;
  slug?: string | null;
  status: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  pricingNotes?: string | null;
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
      "Idempotent agent record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingAgent] = await db
    .select({
      id: agents.id,
      slug: agents.slug,
      status: agents.status,
    })
    .from(agents)
    .where(eq(agents.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingAgent) {
    throw createKnownError(
      "Idempotent agent record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "agent" as const,
    id: existingAgent.id,
    slug: existingAgent.slug,
    status: existingAgent.status,
    replayed: true,
  };
}

export async function ingestAgentRecord({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: AgentIngestionPayload;
}) {
  const normalized = normalizeAgentInput(payload);
  const payloadHash = buildPayloadHash({
    title: normalized.title,
    slug: normalized.slug,
    status: normalized.status,
    shortDescription: normalized.shortDescription,
    longDescription: normalized.longDescription,
    websiteUrl: normalized.websiteUrl,
    githubUrl: normalized.githubUrl,
    pricingNotes: normalized.pricingNotes,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniqueAgentSlug(normalized.slug);

  try {
    const created = await db.transaction(async (tx) => {
      const [agent] = await tx
        .insert(agents)
        .values({
          ...normalized,
          slug,
          createdById: null,
          updatedById: null,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "agent",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: agent.id,
      });

      return agent;
    });

    return {
      kind: "agent" as const,
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

Run: `pnpm test -- tests/agent-ingestion-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the service slice**

```bash
git add tests/agent-ingestion-service.test.ts lib/ingestion/agent-ingestion.ts
git commit -m "Add agent ingestion service"
```

### Task 2: add the route contract and stable error handling

**Files:**
- Create: `tests/agent-ingestion-route.test.ts`
- Create: `app/api/v1/ingest/agents/route.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const ingestAgentRecord = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/agent-ingestion", () => ({
  ingestAgentRecord,
}));

describe("agent ingestion route", () => {
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

    const { POST } = await import("@/app/api/v1/ingest/agents/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/agents", {
        method: "POST",
        body: JSON.stringify({ title: "Claude Code" }),
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
    expect(ingestAgentRecord).not.toHaveBeenCalled();
  });

  it("creates a published agent when auth and payload are valid", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestAgentRecord.mockResolvedValue({
      kind: "agent",
      id: "agent-1",
      slug: "claude-code",
      status: "published",
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/agents/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/agents", {
        method: "POST",
        body: JSON.stringify({
          title: "Claude Code",
          status: "published",
          shortDescription: "Agentic coding assistant",
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
        kind: "agent",
        id: "agent-1",
        slug: "claude-code",
        status: "published",
        replayed: false,
      },
      meta: {
        entity: "ingest:agent",
        version: "v1",
      },
    });
  });

  it("returns 400 when the request is missing Idempotency-Key", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });

    const { POST } = await import("@/app/api/v1/ingest/agents/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/agents", {
        method: "POST",
        body: JSON.stringify({
          title: "Claude Code",
          status: "published",
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

Run: `pnpm test -- tests/agent-ingestion-route.test.ts`
Expected: FAIL with `Cannot find module '@/app/api/v1/ingest/agents/route'`

- [ ] **Step 3: Implement the route**

```ts
// app/api/v1/ingest/agents/route.ts
import { buildDetailEnvelope, buildErrorEnvelope, jsonOk } from "@/lib/api/public-read";
import { authenticateIngestionRequest } from "@/lib/ingestion/auth";
import { ingestAgentRecord } from "@/lib/ingestion/agent-ingestion";

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
    requiredScope: "agents:write",
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
    const result = await ingestAgentRecord({
      apiKeyId: auth.key.id!,
      idempotencyKey,
      payload,
    });

    return jsonOk(
      buildDetailEnvelope({
        data: result,
        entity: "ingest:agent",
      }),
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest agent.";
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

Run: `pnpm test -- tests/agent-ingestion-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the route slice**

```bash
git add tests/agent-ingestion-route.test.ts app/api/v1/ingest/agents/route.ts
git commit -m "Add agent ingestion route"
```

### Task 3: update machine-surface discovery and prove the full contract

**Files:**
- Modify: `app/api/page.tsx`
- Modify: `tests/agent-ingestion-route.test.ts`
- Modify: `tests/agent-ingestion-service.test.ts`

- [ ] **Step 1: Extend the failing tests for replay and conflict**

```ts
// tests/agent-ingestion-route.test.ts
it("returns 200 on an idempotent replay instead of creating a second record", async () => {
  authenticateIngestionRequest.mockResolvedValue({
    ok: true,
    key: { id: "key-1" },
  });
  ingestAgentRecord.mockResolvedValue({
    kind: "agent",
    id: "agent-1",
    slug: "claude-code",
    status: "review",
    replayed: true,
  });

  const { POST } = await import("@/app/api/v1/ingest/agents/route");
  const response = await POST(
    new Request("http://localhost:3011/api/v1/ingest/agents", {
      method: "POST",
      body: JSON.stringify({
        title: "Claude Code",
        status: "review",
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
// tests/agent-ingestion-service.test.ts
it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
  queueSelectResults([
    [],
    [
      {
        id: "evt-1",
        payloadHash: "different-hash",
        createdRecordId: "agent-1",
        status: "applied",
      },
    ],
  ]);

  db.transaction.mockRejectedValue({
    code: "23505",
    constraint: "ingestion_events_api_key_idempotency_idx",
  });

  const { ingestAgentRecord } = await import("@/lib/ingestion/agent-ingestion");

  await expect(
    ingestAgentRecord({
      apiKeyId: "key-1",
      idempotencyKey: "evt-1",
      payload: {
        title: "Claude Code",
        status: "published",
        externalId: "agent-1",
      },
    }),
  ).rejects.toMatchObject({
    code: "idempotency_conflict",
    status: 409,
  });
});
```

- [ ] **Step 2: Run both test files to verify the new assertions fail**

Run: `pnpm test -- tests/agent-ingestion-service.test.ts tests/agent-ingestion-route.test.ts`
Expected: FAIL on missing replay or conflict coverage

- [ ] **Step 3: Update the API discovery page and finish the route/service coverage**

```tsx
// app/api/page.tsx
{
  href: "/api/v1/ingest/agents",
  title: "Agent ingestion",
  detail: "Authenticated create-only publishing for trusted agent directory updates.",
}
```

```tsx
// app/api/page.tsx
<PublicPanel
  title="Planned next"
  detail="Agent ingestion is now live. Prompt and skill ingestion remain deferred until this pattern proves out."
>
```

```ts
// tests/agent-ingestion-route.test.ts
it("returns a stable conflict envelope for mismatched idempotent payloads", async () => {
  authenticateIngestionRequest.mockResolvedValue({
    ok: true,
    key: { id: "key-1" },
  });
  ingestAgentRecord.mockRejectedValue(
    Object.assign(new Error("Payload differs from the original idempotent request."), {
      code: "idempotency_conflict",
      status: 409,
    }),
  );

  const { POST } = await import("@/app/api/v1/ingest/agents/route");
  const response = await POST(
    new Request("http://localhost:3011/api/v1/ingest/agents", {
      method: "POST",
      body: JSON.stringify({
        title: "Claude Code",
        status: "published",
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

Run: `pnpm test -- tests/agent-ingestion-service.test.ts tests/agent-ingestion-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the contract-completion slice**

```bash
git add app/api/page.tsx tests/agent-ingestion-service.test.ts tests/agent-ingestion-route.test.ts
git commit -m "Document and verify agent ingestion contract"
```

### Task 4: run the gate and open the PR

**Files:**
- Modify: none expected
- Verify: `tests/agent-ingestion-service.test.ts`
- Verify: `tests/agent-ingestion-route.test.ts`

- [ ] **Step 1: Run the targeted unit suite**

Run: `pnpm test -- tests/agent-ingestion-service.test.ts tests/agent-ingestion-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full verification gate**

Run: `pnpm lint && pnpm test && pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 3: Open the PR**

```bash
gh pr create --base main --head phase-2-agent-ingestion --title "Add agent ingestion API" --body "## Summary
- add authenticated create-only agent ingestion
- reuse current idempotency and auth envelopes
- update API discovery copy and route tests

## Testing
- pnpm lint
- pnpm test
- pnpm typecheck
- pnpm build"
```

- [ ] **Step 4: Commit any final review fixes**

```bash
git add -A
git commit -m "Address agent ingestion review feedback"
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

- the service export is `ingestAgentRecord`
- the route meta entity is `ingest:agent`
- the route scope is `agents:write`
- the response `kind` is always `"agent"`
