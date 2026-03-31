import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const assignContentTaxonomy = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/content-taxonomy-assignment", () => ({
  assignContentTaxonomy,
}));

describe("content taxonomy assignment ingestion route", () => {
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

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
        method: "POST",
        body: JSON.stringify({ contentId: "content-1", taxonomyTermIds: ["term-a"] }),
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
    expect(assignContentTaxonomy).not.toHaveBeenCalled();
  });

  it("replaces content taxonomy assignments when auth and payload are valid", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignContentTaxonomy.mockResolvedValue({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: ["term-a", "term-b"],
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
        method: "POST",
        body: JSON.stringify({
          contentId: "content-1",
          taxonomyTermIds: ["term-b", "term-a"],
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
        kind: "content-taxonomy",
        contentId: "content-1",
        taxonomyTermIds: ["term-a", "term-b"],
        replayed: false,
      },
      meta: {
        entity: "ingest:content-taxonomy",
        version: "v1",
      },
    });
    expect(assignContentTaxonomy).toHaveBeenCalledWith({
      apiKeyId: "key-1",
      idempotencyKey: "evt-1",
      payload: {
        contentId: "content-1",
        taxonomyTermIds: ["term-b", "term-a"],
      },
    });
  });

  it("returns 200 on an idempotent replay", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignContentTaxonomy.mockResolvedValue({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: ["term-a"],
      replayed: true,
    });

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
        method: "POST",
        body: JSON.stringify({
          contentId: "content-1",
          taxonomyTermIds: ["term-a"],
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
        kind: "content-taxonomy",
        contentId: "content-1",
        taxonomyTermIds: ["term-a"],
        replayed: true,
      },
      meta: {
        entity: "ingest:content-taxonomy",
        version: "v1",
      },
    });
  });

  it("returns a stable conflict envelope for mismatched idempotent payloads", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    assignContentTaxonomy.mockRejectedValue(
      Object.assign(new Error("Payload differs from the original idempotent request."), {
        code: "idempotency_conflict",
        status: 409,
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
        method: "POST",
        body: JSON.stringify({
          contentId: "content-1",
          taxonomyTermIds: ["term-a"],
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

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
        method: "POST",
        body: JSON.stringify({
          contentId: "content-1",
          taxonomyTermIds: ["term-a"],
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
    expect(assignContentTaxonomy).not.toHaveBeenCalled();
  });

  it("returns a stable invalid-json error", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
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
    assignContentTaxonomy.mockRejectedValue(
      Object.assign(new Error("Request body must be a JSON object."), {
        code: "invalid_payload",
        status: 400,
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/content-taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/content-taxonomy", {
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
