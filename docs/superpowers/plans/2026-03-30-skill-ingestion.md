# Skill ingestion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated create-only ingestion for skill directory records at
`POST /api/v1/ingest/skills`.

**Architecture:** Mirror the existing agent-ingestion and prompt-ingestion
shape instead of generalizing it prematurely. Add a dedicated
`skill-ingestion` service, a single route that reuses current auth and response
envelopes, and focused route and service tests that prove idempotent create
behavior plus explicit unknown-field rejection. Update the API discovery page
so the machine-surface index reflects the new route.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL,
Better Auth, Vitest

---

## File structure

- Create: `lib/ingestion/skill-ingestion.ts`
- Create: `app/api/v1/ingest/skills/route.ts`
- Create: `tests/skill-ingestion-service.test.ts`
- Create: `tests/skill-ingestion-route.test.ts`
- Modify: `app/api/page.tsx`

### Task 0: create the implementation branch

**Files:**
- Modify: none

- [ ] **Step 1: Branch from current `main`**

Run: `git checkout -b phase-2-skill-ingestion`
Expected: branch created from `main`

- [ ] **Step 2: Push the branch and set upstream**

Run: `git push -u origin phase-2-skill-ingestion`
Expected: branch published and tracking `origin/phase-2-skill-ingestion`

### Task 1: add the service contract and idempotent skill creation

**Files:**
- Create: `tests/skill-ingestion-service.test.ts`
- Create: `lib/ingestion/skill-ingestion.ts`
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

const ensureUniqueSkillSlug = vi.fn();
const normalizeSkillInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  skills: {
    id: "skills.id",
    slug: "skills.slug",
    status: "skills.status",
    name: "skills",
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
  ensureUniqueSkillSlug,
}));

vi.mock("@/lib/admin/record-input", () => ({
  normalizeSkillInput,
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
        title: "Repo triage",
        slug: "repo-triage",
        status: "published",
        shortDescription: "Triage repository issues quickly.",
        longDescription: "Uses AI to summarize bug clusters and risk areas.",
        websiteUrl: "https://agentriot.test/skills/repo-triage",
        githubUrl: "https://github.com/burmjohn/agentriot",
        externalId: "skill-1",
      }),
    )
    .digest("hex");
}

function buildTransactionMock({
  id = "skill-1",
  slug = "repo-triage",
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
            if (table.name === "skills") {
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

describe("skill ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniqueSkillSlug.mockResolvedValue("repo-triage");
    normalizeSkillInput.mockReturnValue({
      title: "Repo triage",
      slug: "repo-triage",
      status: "published",
      shortDescription: "Triage repository issues quickly.",
      longDescription: "Uses AI to summarize bug clusters and risk areas.",
      websiteUrl: "https://agentriot.test/skills/repo-triage",
      githubUrl: "https://github.com/burmjohn/agentriot",
    });
  });

  it("creates a new skill and records the ingestion event", async () => {
    queueSelectResults([[]]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
          longDescription: "Uses AI to summarize bug clusters and risk areas.",
          websiteUrl: "https://agentriot.test/skills/repo-triage",
          githubUrl: "https://github.com/burmjohn/agentriot",
          externalId: "skill-1",
        },
      }),
    ).resolves.toEqual({
      kind: "skill",
      id: "skill-1",
      slug: "repo-triage",
      status: "published",
      replayed: false,
    });
  });

  it("rejects unknown payload fields explicitly", async () => {
    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
          unsupported: "nope",
        } as never,
      }),
    ).rejects.toMatchObject({
      message: "Unexpected skill ingestion fields: unsupported.",
      status: 400,
      code: "invalid_payload",
    });
  });

  it("replays deterministically when a concurrent request trips the idempotency unique index", async () => {
    queueSelectResults([
      [],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "skill-1",
          status: "applied",
        },
      ],
      [
        {
          id: "skill-1",
          slug: "repo-triage",
          status: "published",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
          longDescription: "Uses AI to summarize bug clusters and risk areas.",
          websiteUrl: "https://agentriot.test/skills/repo-triage",
          githubUrl: "https://github.com/burmjohn/agentriot",
          externalId: "skill-1",
        },
      }),
    ).resolves.toEqual({
      kind: "skill",
      id: "skill-1",
      slug: "repo-triage",
      status: "published",
      replayed: true,
    });
  });
});
```

- [ ] **Step 2: Run the service test to verify it fails**

Run: `pnpm test -- tests/skill-ingestion-service.test.ts`
Expected: FAIL because `@/lib/ingestion/skill-ingestion` does not exist yet

- [ ] **Step 3: Write the minimal service implementation**

```ts
import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { ingestionEvents, skills } from "@/db/schema";
import { ensureUniqueSkillSlug } from "@/lib/admin/cms";
import { normalizeSkillInput } from "@/lib/admin/record-input";

export type SkillIngestionPayload = {
  title: string;
  slug?: string | null;
  status: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  externalId?: string | null;
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedSkillPayloadKeys = new Set([
  "title",
  "slug",
  "status",
  "shortDescription",
  "longDescription",
  "websiteUrl",
  "githubUrl",
  "externalId",
]);

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
}

function assertNoUnknownSkillFields(payload: Record<string, unknown>) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !allowedSkillPayloadKeys.has(field),
  );

  if (unknownFields.length === 0) {
    return;
  }

  throw createKnownError(
    `Unexpected skill ingestion fields: ${unknownFields.join(", ")}.`,
    400,
    "invalid_payload",
  );
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
      "Idempotent skill record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingSkill] = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      status: skills.status,
    })
    .from(skills)
    .where(eq(skills.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingSkill) {
    throw createKnownError(
      "Idempotent skill record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "skill" as const,
    id: existingSkill.id,
    slug: existingSkill.slug,
    status: existingSkill.status,
    replayed: true,
  };
}

export async function ingestSkillRecord({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: SkillIngestionPayload;
}) {
  assertNoUnknownSkillFields(payload as Record<string, unknown>);
  const normalized = normalizeSkillInput(payload);
  const payloadHash = buildPayloadHash({
    title: normalized.title,
    slug: normalized.slug,
    status: normalized.status,
    shortDescription: normalized.shortDescription,
    longDescription: normalized.longDescription,
    websiteUrl: normalized.websiteUrl,
    githubUrl: normalized.githubUrl,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniqueSkillSlug(normalized.slug);

  try {
    const created = await db.transaction(async (tx) => {
      const [skill] = await tx
        .insert(skills)
        .values({
          ...normalized,
          slug,
          createdById: null,
          updatedById: null,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "skill",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: skill.id,
      });

      return skill;
    });

    return {
      kind: "skill" as const,
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

- [ ] **Step 4: Run the service test and the focused suite**

Run: `pnpm test -- tests/skill-ingestion-service.test.ts tests/admin-record-input.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the service slice**

```bash
git add tests/skill-ingestion-service.test.ts lib/ingestion/skill-ingestion.ts
git commit -m "Add skill ingestion service"
```

### Task 2: add the API route contract

**Files:**
- Create: `tests/skill-ingestion-route.test.ts`
- Create: `app/api/v1/ingest/skills/route.ts`
- Reuse: `lib/ingestion/auth.ts`
- Reuse: `lib/api/public-read.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const ingestSkillRecord = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/skill-ingestion", () => ({
  ingestSkillRecord,
}));

describe("POST /api/v1/ingest/skills", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
  });

  it("creates a skill with a valid key and idempotency header", async () => {
    ingestSkillRecord.mockResolvedValue({
      kind: "skill",
      id: "skill-1",
      slug: "repo-triage",
      status: "published",
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/skills/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/skills", {
        method: "POST",
        headers: {
          authorization: "Bearer secret",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
        body: JSON.stringify({
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
        }),
      }),
    );

    await expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        kind: "skill",
        id: "skill-1",
        slug: "repo-triage",
        status: "published",
        replayed: false,
      },
      meta: {
        entity: "ingest:skill",
        version: "v1",
      },
    });
    expect(authenticateIngestionRequest).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      requiredScope: "skills:write",
    });
  });

  it("rejects payloads with unknown fields", async () => {
    ingestSkillRecord.mockRejectedValue(
      Object.assign(new Error("Unexpected skill ingestion fields: unsupported."), {
        status: 400,
        code: "invalid_payload",
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/skills/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/skills", {
        method: "POST",
        headers: {
          authorization: "Bearer secret",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
        body: JSON.stringify({
          title: "Repo triage",
          status: "published",
          unsupported: "nope",
        }),
      }),
    );

    await expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        message: "Unexpected skill ingestion fields: unsupported.",
      },
      meta: {
        version: "v1",
      },
    });
  });

  it("rejects requests without an idempotency key", async () => {
    const { POST } = await import("@/app/api/v1/ingest/skills/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/skills", {
        method: "POST",
        headers: {
          authorization: "Bearer secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Repo triage",
          status: "published",
        }),
      }),
    );

    await expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing_idempotency_key",
        message: "Idempotency-Key header is required.",
      },
      meta: {
        version: "v1",
      },
    });
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `pnpm test -- tests/skill-ingestion-route.test.ts`
Expected: FAIL because `@/app/api/v1/ingest/skills/route` does not exist yet

- [ ] **Step 3: Write the route implementation**

```ts
import { buildErrorEnvelope, jsonOk } from "@/lib/api/public-read";
import { authenticateIngestionRequest } from "@/lib/ingestion/auth";
import { ingestSkillRecord } from "@/lib/ingestion/skill-ingestion";

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
    requiredScope: "skills:write",
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
    const result = await ingestSkillRecord({
      apiKeyId: auth.key.id!,
      idempotencyKey,
      payload,
    });

    return jsonOk(
      {
        data: result,
        meta: {
          entity: "ingest:skill",
          version: "v1",
        },
      },
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest skill.";
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

Run: `pnpm test -- tests/skill-ingestion-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the route slice**

```bash
git add tests/skill-ingestion-route.test.ts app/api/v1/ingest/skills/route.ts
git commit -m "Add skill ingestion route"
```

### Task 3: update API discovery and run the full gate

**Files:**
- Modify: `app/api/page.tsx`
- Reuse: `tests/prompt-ingestion-route.test.ts`
- Reuse: `tests/agent-ingestion-route.test.ts`

- [ ] **Step 1: Add the new ingestion route to API discovery**

```tsx
{
  method: "POST",
  href: "/api/v1/ingest/skills",
  title: "Skill ingestion",
  description:
    "Create skill records through authenticated machine publishing with idempotent replay.",
  auth: "Requires bearer API key with `skills:write` and `Idempotency-Key`.",
  clickable: false,
}
```

- [ ] **Step 2: Run the focused ingestion gate**

Run: `pnpm test -- tests/skill-ingestion-service.test.ts tests/skill-ingestion-route.test.ts tests/ingestion-auth.test.ts`
Expected: PASS

- [ ] **Step 3: Run the full repo gate**

Run: `pnpm lint && pnpm test && pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 4: Commit the finished contract**

```bash
git add app/api/page.tsx tests/skill-ingestion-service.test.ts tests/skill-ingestion-route.test.ts lib/ingestion/skill-ingestion.ts app/api/v1/ingest/skills/route.ts
git commit -m "Finish skill ingestion contract"
```

- [ ] **Step 5: Push the branch and open the PR**

Run: `git push`
Expected: branch updated on `origin/phase-2-skill-ingestion`

## Self-review

- Spec coverage:
  - route added: Task 2
  - required `skills:write` auth: Task 2
  - required `Idempotency-Key`: Task 2
  - create-only skill ingestion: Task 1
  - explicit unknown-field rejection: Tasks 1 and 2
  - API discovery update: Task 3
- Placeholder scan:
  - no `TODO`, `TBD`, or “similar to” placeholders remain
  - commands, file paths, and commit messages are explicit
- Type consistency:
  - `ingestSkillRecord`, `SkillIngestionPayload`, `ensureUniqueSkillSlug`, and
    `normalizeSkillInput` match the existing naming pattern in the codebase
