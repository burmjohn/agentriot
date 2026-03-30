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

  it("returns a stable unauthorized error when the request has no valid API key", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: false,
      status: 401,
      code: "missing_api_key",
      message: "API key is required.",
    });

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: JSON.stringify({ scope: "skill", kind: "tag", label: "Daily Ops" }),
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
    expect(ingestTaxonomyRecord).not.toHaveBeenCalled();
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
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
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
    expect(ingestTaxonomyRecord).toHaveBeenCalledWith({
      apiKeyId: "key-1",
      idempotencyKey: "evt-1",
      payload: {
        scope: "skill",
        kind: "tag",
        label: "Daily Ops",
      },
    });
  });

  it("returns 200 on an idempotent replay instead of creating a second record", async () => {
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
      replayed: true,
    });

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
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
        kind: "taxonomy",
        id: "taxonomy-1",
        slug: "daily-ops",
        scope: "skill",
        taxonomyKind: "tag",
        replayed: true,
      },
      meta: {
        entity: "ingest:taxonomy",
        version: "v1",
      },
    });
  });

  it("returns a stable conflict envelope for mismatched idempotent payloads", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestTaxonomyRecord.mockRejectedValue(
      Object.assign(new Error("Payload differs from the original idempotent request."), {
        code: "idempotency_conflict",
        status: 409,
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
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

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
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
    expect(ingestTaxonomyRecord).not.toHaveBeenCalled();
  });

  it("returns a stable unauthorized error when the API key has been revoked", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: false,
      status: 401,
      code: "api_key_revoked",
      message: "API key has been revoked.",
    });

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
        }),
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "api_key_revoked",
        details: undefined,
        message: "API key has been revoked.",
      },
      meta: {
        version: "v1",
      },
    });
    expect(ingestTaxonomyRecord).not.toHaveBeenCalled();
  });

  it("returns a stable forbidden error when the API key lacks taxonomy:write", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: false,
      status: 403,
      code: "insufficient_scope",
      message: "API key does not grant the required scope.",
    });

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
        }),
        headers: {
          authorization: "Bearer ar_live_secret_token",
          "content-type": "application/json",
          "idempotency-key": "evt-1",
        },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "insufficient_scope",
        details: undefined,
        message: "API key does not grant the required scope.",
      },
      meta: {
        version: "v1",
      },
    });
    expect(ingestTaxonomyRecord).not.toHaveBeenCalled();
  });

  it("returns a stable invalid-json error when the request body cannot be parsed", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: "{",
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
    expect(ingestTaxonomyRecord).not.toHaveBeenCalled();
  });

  it("returns a stable invalid-payload error when the request includes unexpected fields", async () => {
    authenticateIngestionRequest.mockResolvedValue({
      ok: true,
      key: { id: "key-1" },
    });
    ingestTaxonomyRecord.mockRejectedValue(
      Object.assign(new Error("Unexpected taxonomy ingestion fields: unexpectedField."), {
        code: "invalid_payload",
        status: 400,
      }),
    );

    const { POST } = await import("@/app/api/v1/ingest/taxonomy/route");
    const response = await POST(
      new Request("http://localhost:3011/api/v1/ingest/taxonomy", {
        method: "POST",
        body: JSON.stringify({
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
          unexpectedField: "ignored-no-more",
        }),
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
        message: "Unexpected taxonomy ingestion fields: unexpectedField.",
      },
      meta: {
        version: "v1",
      },
    });
  });
});
