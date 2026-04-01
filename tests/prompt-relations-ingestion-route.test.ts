import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const assignPromptRelations = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/prompt-relations-ingestion", () => ({
  assignPromptRelations,
}));

describe("prompt relations ingestion route", () => {
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

    const { POST } = await import("@/app/api/v1/ingest/prompt-relations/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompt-relations", {
        method: "POST",
        body: JSON.stringify({
          promptId: "prompt-1",
          agentIds: [],
          skillIds: [],
        }),
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
    expect(assignPromptRelations).not.toHaveBeenCalled();
  });

  it("replaces prompt relations when auth and payload are valid", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignPromptRelations.mockResolvedValue({
      kind: "prompt-relations",
      promptId: "prompt-1",
      agentIds: ["agent-a", "agent-b"],
      skillIds: ["skill-a"],
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/prompt-relations/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompt-relations", {
        method: "POST",
        body: JSON.stringify({
          promptId: "prompt-1",
          agentIds: ["agent-b", "agent-a"],
          skillIds: ["skill-a"],
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
        kind: "prompt-relations",
        promptId: "prompt-1",
        agentIds: ["agent-a", "agent-b"],
        skillIds: ["skill-a"],
        replayed: false,
      },
      meta: {
        entity: "ingest:prompt-relations",
        version: "v1",
      },
    });
    expect(assignPromptRelations).toHaveBeenCalledWith({
      apiKeyId: "key-1",
      idempotencyKey: "evt-1",
      payload: {
        promptId: "prompt-1",
        agentIds: ["agent-b", "agent-a"],
        skillIds: ["skill-a"],
      },
    });
  });

  it("returns 200 on an idempotent replay", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignPromptRelations.mockResolvedValue({
      kind: "prompt-relations",
      promptId: "prompt-1",
      agentIds: [],
      skillIds: [],
      replayed: true,
    });

    const { POST } = await import("@/app/api/v1/ingest/prompt-relations/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompt-relations", {
        method: "POST",
        body: JSON.stringify({
          promptId: "prompt-1",
          agentIds: [],
          skillIds: [],
        }),
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        kind: "prompt-relations",
        promptId: "prompt-1",
        agentIds: [],
        skillIds: [],
        replayed: true,
      },
      meta: {
        entity: "ingest:prompt-relations",
        version: "v1",
      },
    });
  });

  it("returns a stable conflict envelope for mismatched idempotent payloads", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignPromptRelations.mockRejectedValue(
      Object.assign(new Error("Payload differs from the original idempotent request."), {
        code: "idempotency_conflict",
        status: 409,
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/prompt-relations/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompt-relations", {
        method: "POST",
        body: JSON.stringify({
          promptId: "prompt-1",
          agentIds: ["agent-a"],
          skillIds: [],
        }),
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "idempotency_conflict",
        details: undefined,
        message: "Payload differs from the original idempotent request.",
      },
      meta: {
        version: "v1",
      },
    });
  });

  it("returns a stable error when the request is missing Idempotency-Key", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });

    const { POST } = await import("@/app/api/v1/ingest/prompt-relations/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompt-relations", {
        method: "POST",
        body: JSON.stringify({
          promptId: "prompt-1",
          agentIds: [],
          skillIds: [],
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
    expect(assignPromptRelations).not.toHaveBeenCalled();
  });

  it("returns a stable invalid-json error", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });

    const { POST } = await import("@/app/api/v1/ingest/prompt-relations/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompt-relations", {
        method: "POST",
        body: "{not-json",
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_json",
        details: undefined,
        message: "Request body must be valid JSON.",
      },
      meta: {
        version: "v1",
      },
    });
  });

  it("returns a stable invalid-payload error for non-object JSON bodies", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignPromptRelations.mockRejectedValue(
      Object.assign(new Error("Request body must be a JSON object."), {
        code: "invalid_payload",
        status: 400,
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/prompt-relations/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/prompt-relations", {
        method: "POST",
        body: "null",
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_payload",
        details: undefined,
        message: "Request body must be a JSON object.",
      },
      meta: {
        version: "v1",
      },
    });
  });
});
