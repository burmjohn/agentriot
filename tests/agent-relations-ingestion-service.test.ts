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
  agentPrompts: {
    agentId: "agent_prompts.agent_id",
    promptId: "agent_prompts.prompt_id",
    name: "agent_prompts",
  },
  agentSkills: {
    agentId: "agent_skills.agent_id",
    skillId: "agent_skills.skill_id",
    name: "agent_skills",
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
        agentId: "agent-1",
        promptIds: ["prompt-a", "prompt-b"],
        skillIds: ["skill-a"],
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

describe("agent relations ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("replaces both agent relation families and records the ingestion event", async () => {
    queueSelectResults([
      [],
      [{ id: "agent-1" }],
      [{ id: "prompt-b" }, { id: "prompt-a" }],
      [{ id: "skill-a" }],
    ]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          agentId: "agent-1",
          promptIds: ["prompt-b", "prompt-a", "prompt-b"],
          skillIds: ["skill-a"],
        },
      }),
    ).resolves.toEqual({
      kind: "agent-relations",
      agentId: "agent-1",
      promptIds: ["prompt-a", "prompt-b"],
      skillIds: ["skill-a"],
      replayed: false,
    });

    expect(replaceJoinRows).toHaveBeenCalledTimes(2);
    expect(replaceJoinRows.mock.calls[0]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "agent_prompts" }),
      insertTable: expect.objectContaining({ name: "agent_prompts" }),
      insertValues: [
        { agentId: "agent-1", promptId: "prompt-a" },
        { agentId: "agent-1", promptId: "prompt-b" },
      ],
    });
    expect(replaceJoinRows.mock.calls[1]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "agent_skills" }),
      insertTable: expect.objectContaining({ name: "agent_skills" }),
      insertValues: [{ agentId: "agent-1", skillId: "skill-a" }],
    });
  });

  it("allows clearing both relation families with empty arrays", async () => {
    queueSelectResults([[], [{ id: "agent-1" }], [], []]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-clear",
        payload: {
          agentId: "agent-1",
          promptIds: [],
          skillIds: [],
        },
      }),
    ).resolves.toEqual({
      kind: "agent-relations",
      agentId: "agent-1",
      promptIds: [],
      skillIds: [],
      replayed: false,
    });
  });

  it("rejects unexpected fields", async () => {
    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          agentId: "agent-1",
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
    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: null as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("rejects requests when the agent does not exist", async () => {
    queueSelectResults([[], []]);

    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          agentId: "missing-agent",
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
    queueSelectResults([[], [{ id: "agent-1" }], [{ id: "prompt-a" }]]);

    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          agentId: "agent-1",
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
    queueSelectResults([[], [{ id: "agent-1" }], [], [{ id: "skill-a" }]]);

    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          agentId: "agent-1",
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
      [{ id: "agent-1" }],
      [{ id: "prompt-b" }, { id: "prompt-a" }],
      [{ id: "skill-a" }],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "agent-1",
          status: "applied",
        },
      ],
    ]);
    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          agentId: "agent-1",
          promptIds: ["prompt-b", "prompt-a", "prompt-b"],
          skillIds: ["skill-a"],
        },
      }),
    ).resolves.toEqual({
      kind: "agent-relations",
      agentId: "agent-1",
      promptIds: ["prompt-a", "prompt-b"],
      skillIds: ["skill-a"],
      replayed: true,
    });
  });

  it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
    queueSelectResults([
      [],
      [{ id: "agent-1" }],
      [{ id: "prompt-a" }],
      [{ id: "skill-a" }],
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

    const { assignAgentRelations } = await import(
      "@/lib/ingestion/agent-relations-ingestion"
    );

    await expect(
      assignAgentRelations({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          agentId: "agent-1",
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
