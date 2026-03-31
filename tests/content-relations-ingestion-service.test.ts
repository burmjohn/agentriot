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
  agents: {
    id: "agents.id",
    name: "agents",
  },
  prompts: {
    id: "prompts.id",
    name: "prompts",
  },
  skills: {
    id: "skills.id",
    name: "skills",
  },
  contentItems: {
    id: "content_items.id",
    name: "content_items",
  },
  contentAgents: {
    contentItemId: "content_agents.content_item_id",
    agentId: "content_agents.agent_id",
    name: "content_agents",
  },
  contentPrompts: {
    contentItemId: "content_prompts.content_item_id",
    promptId: "content_prompts.prompt_id",
    name: "content_prompts",
  },
  contentSkills: {
    contentItemId: "content_skills.content_item_id",
    skillId: "content_skills.skill_id",
    name: "content_skills",
  },
  ingestionEvents: {
    id: "ingestion_events.id",
    payloadHash: "ingestion_events.payload_hash",
    createdRecordId: "ingestion_events.created_record_id",
    status: "ingestion_events.status",
    apiKeyId: "ingestion_events.api_key_id",
    idempotencyKey: "ingestion_events.idempotency_key",
    action: "ingestion_events.action",
    target: "ingestion_events.target",
    name: "ingestion_events",
  },
}));

vi.mock("@/lib/admin/relation-writes", () => ({
  replaceJoinRows,
}));

function queueSelectResults(results: unknown[]) {
  db.select.mockImplementation(() => {
    const next = results.shift();
    const resolved = Promise.resolve(next);

    return {
      from() {
        return {
          where() {
            const query = {
              limit: vi.fn().mockResolvedValue(next),
              then: resolved.then.bind(resolved),
              catch: resolved.catch.bind(resolved),
              finally: resolved.finally.bind(resolved),
              [Symbol.toStringTag]: "Promise",
            };

            return query;
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
        agentIds: ["agent-a", "agent-b"],
        promptIds: ["prompt-a"],
        skillIds: ["skill-a", "skill-b"],
      }),
    )
    .digest("hex");
}

function buildTransactionMock() {
  return async (
    callback: (tx: {
      insert: (table: { name?: string }) => {
        values: (values: Record<string, unknown>) => Promise<void>;
      };
      delete: typeof vi.fn;
    }) => Promise<unknown>,
  ) =>
    callback({
      insert() {
        return {
          values: vi.fn().mockResolvedValue(undefined),
        };
      },
      delete: vi.fn(),
    });
}

describe("content relations ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("replaces all three content relation families and records the ingestion event", async () => {
    queueSelectResults([
      [],
      [{ id: "content-1" }],
      [{ id: "agent-b" }, { id: "agent-a" }],
      [{ id: "prompt-a" }],
      [{ id: "skill-b" }, { id: "skill-a" }],
    ]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          agentIds: ["agent-b", "agent-a", "agent-b"],
          promptIds: ["prompt-a"],
          skillIds: ["skill-b", "skill-a", "skill-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "content-relations",
      contentId: "content-1",
      agentIds: ["agent-a", "agent-b"],
      promptIds: ["prompt-a"],
      skillIds: ["skill-a", "skill-b"],
      replayed: false,
    });

    expect(replaceJoinRows).toHaveBeenCalledTimes(3);
    expect(replaceJoinRows.mock.calls[0]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "content_agents" }),
      insertTable: expect.objectContaining({ name: "content_agents" }),
      insertValues: [
        { contentItemId: "content-1", agentId: "agent-a" },
        { contentItemId: "content-1", agentId: "agent-b" },
      ],
    });
    expect(replaceJoinRows.mock.calls[1]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "content_prompts" }),
      insertTable: expect.objectContaining({ name: "content_prompts" }),
      insertValues: [{ contentItemId: "content-1", promptId: "prompt-a" }],
    });
    expect(replaceJoinRows.mock.calls[2]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "content_skills" }),
      insertTable: expect.objectContaining({ name: "content_skills" }),
      insertValues: [
        { contentItemId: "content-1", skillId: "skill-a" },
        { contentItemId: "content-1", skillId: "skill-b" },
      ],
    });
  });

  it("allows clearing all relation families with empty arrays", async () => {
    queueSelectResults([[], [{ id: "content-1" }], [], [], []]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-clear",
        payload: {
          contentId: "content-1",
          agentIds: [],
          promptIds: [],
          skillIds: [],
        },
      }),
    ).resolves.toEqual({
      kind: "content-relations",
      contentId: "content-1",
      agentIds: [],
      promptIds: [],
      skillIds: [],
      replayed: false,
    });
  });

  it("rejects unexpected fields", async () => {
    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          agentIds: ["agent-a"],
          promptIds: ["prompt-a"],
          skillIds: ["skill-a"],
          unsupported: true,
        } as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("rejects non-object payloads with a stable invalid-payload error", async () => {
    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: null as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("rejects requests when the content item does not exist", async () => {
    queueSelectResults([[], []]);

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "missing-content",
          agentIds: [],
          promptIds: [],
          skillIds: [],
        },
      }),
    ).rejects.toMatchObject({
      code: "content_not_found",
      status: 404,
    });
  });

  it("rejects requests when a referenced agent does not exist", async () => {
    queueSelectResults([[], [{ id: "content-1" }], [{ id: "agent-a" }]]);

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          agentIds: ["agent-a", "missing-agent"],
          promptIds: [],
          skillIds: [],
        },
      }),
    ).rejects.toMatchObject({
      code: "agent_not_found",
      status: 404,
    });
  });

  it("rejects requests when a referenced prompt does not exist", async () => {
    queueSelectResults([[], [{ id: "content-1" }], [], [{ id: "prompt-a" }]]);

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          agentIds: [],
          promptIds: ["prompt-a", "missing-prompt"],
          skillIds: [],
        },
      }),
    ).rejects.toMatchObject({
      code: "prompt_not_found",
      status: 404,
    });
  });

  it("rejects requests when a referenced skill does not exist", async () => {
    queueSelectResults([[], [{ id: "content-1" }], [], [], [{ id: "skill-a" }]]);

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          agentIds: [],
          promptIds: [],
          skillIds: ["skill-a", "missing-skill"],
        },
      }),
    ).rejects.toMatchObject({
      code: "skill_not_found",
      status: 404,
    });
  });

  it("replays deterministically when a concurrent request trips the idempotency unique index", async () => {
    queueSelectResults([
      [],
      [{ id: "content-1" }],
      [{ id: "agent-b" }, { id: "agent-a" }],
      [{ id: "prompt-a" }],
      [{ id: "skill-b" }, { id: "skill-a" }],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "content-1",
          status: "applied",
        },
      ],
    ]);
    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          agentIds: ["agent-b", "agent-a", "agent-b"],
          promptIds: ["prompt-a"],
          skillIds: ["skill-b", "skill-a", "skill-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "content-relations",
      contentId: "content-1",
      agentIds: ["agent-a", "agent-b"],
      promptIds: ["prompt-a"],
      skillIds: ["skill-a", "skill-b"],
      replayed: true,
    });
  });

  it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
    queueSelectResults([
      [],
      [{ id: "content-1" }],
      [{ id: "agent-a" }],
      [{ id: "prompt-a" }],
      [{ id: "skill-a" }],
      [
        {
          id: "evt-1",
          payloadHash: "different-hash",
          createdRecordId: "content-1",
          status: "applied",
        },
      ],
    ]);
    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { assignContentRelations } = await import(
      "@/lib/ingestion/content-relations-ingestion"
    );

    await expect(
      assignContentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          agentIds: ["agent-a"],
          promptIds: ["prompt-a"],
          skillIds: ["skill-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_conflict",
      status: 409,
    });
  });
});
