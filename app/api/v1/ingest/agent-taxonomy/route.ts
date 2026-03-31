import { buildErrorEnvelope, jsonOk } from "@/lib/api/public-read";
import { authenticateIngestionRequest } from "@/lib/ingestion/auth";
import { assignAgentTaxonomy } from "@/lib/ingestion/agent-taxonomy-assignment";

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
    const result = await assignAgentTaxonomy({
      apiKeyId: auth.key.id!,
      idempotencyKey,
      payload,
    });

    return jsonOk(
      {
        data: result,
        meta: {
          entity: "ingest:agent-taxonomy",
          version: "v1",
        },
      },
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to assign agent taxonomy.";
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
