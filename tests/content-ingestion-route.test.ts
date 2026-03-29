import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateIngestionRequest = vi.fn();
const ingestContentRecord = vi.fn();

vi.mock("@/lib/ingestion/auth", () => ({
  authenticateIngestionRequest,
}));

vi.mock("@/lib/ingestion/content-ingestion", () => ({
  ingestContentRecord,
}));

describe("content ingestion routes", () => {
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

    const { POST } = await import("@/app/api/v1/ingest/articles/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/articles", {
        method: "POST",
        body: JSON.stringify({ title: "Weekly signal" }),
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
    expect(ingestContentRecord).not.toHaveBeenCalled();
  });

  it("creates a published article when auth and payload are valid", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestContentRecord.mockResolvedValue({
      kind: "article",
      id: "content-1",
      slug: "weekly-signal",
      status: "published",
      replayed: false,
    });

    const { POST } = await import("@/app/api/v1/ingest/articles/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "Weekly signal",
          status: "published",
          body: "Fresh release notes.",
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
        kind: "article",
        id: "content-1",
        slug: "weekly-signal",
        status: "published",
        replayed: false,
      },
      meta: {
        entity: "ingest:article",
        version: "v1",
      },
    });
    expect(ingestContentRecord).toHaveBeenCalledWith({
      apiKeyId: "key-1",
      idempotencyKey: "evt-1",
      kind: "article",
      payload: {
        title: "Weekly signal",
        status: "published",
        body: "Fresh release notes.",
      },
    });
  });

  it("returns 200 on an idempotent replay instead of creating a second record", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestContentRecord.mockResolvedValue({
      kind: "tutorial",
      id: "content-1",
      slug: "weekly-tutorial",
      status: "review",
      replayed: true,
    });

    const { POST } = await import("@/app/api/v1/ingest/tutorials/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/tutorials", {
        method: "POST",
        body: JSON.stringify({
          title: "Weekly tutorial",
          status: "review",
          body: "Same payload again.",
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
        kind: "tutorial",
        id: "content-1",
        slug: "weekly-tutorial",
        status: "review",
        replayed: true,
      },
      meta: {
        entity: "ingest:tutorial",
        version: "v1",
      },
    });
  });

  it("returns a stable conflict envelope for mismatched idempotent payloads", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestContentRecord.mockRejectedValue(
      Object.assign(new Error("Payload differs from the original idempotent request."), {
        code: "idempotency_conflict",
        status: 409,
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/articles/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "Weekly signal",
          status: "published",
          body: "Conflicting body.",
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
});
