const API_VERSION = "v1";

export type PublicReadEntity =
  | "articles"
  | "article"
  | "tutorials"
  | "tutorial"
  | "agents"
  | "agent"
  | "prompts"
  | "prompt"
  | "skills"
  | "skill"
  | "taxonomy"
  | "search"
  | "ingest:article"
  | "ingest:tutorial";

export type TaxonomyScope = "content" | "agent" | "prompt" | "skill";

export function buildCollectionEnvelope<T>({
  data,
  entity,
  query = {},
}: {
  data: T[];
  entity: PublicReadEntity;
  query?: Record<string, string>;
}) {
  return {
    data,
    meta: {
      count: data.length,
      entity,
      query,
      version: API_VERSION,
    },
  };
}

export function buildDetailEnvelope<T>({
  data,
  entity,
}: {
  data: T;
  entity: PublicReadEntity;
}) {
  return {
    data,
    meta: {
      entity,
      version: API_VERSION,
    },
  };
}

export function buildErrorEnvelope({
  code,
  message,
  details,
}: {
  code: string;
  message: string;
  details?: Record<string, string>;
}) {
  return {
    error: {
      code,
      details,
      message,
    },
    meta: {
      version: API_VERSION,
    },
  };
}

export function normalizeOptionalParam(value: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function normalizeSearchQuery(value: string | null) {
  return normalizeOptionalParam(value);
}

export function parseTaxonomyScope(value: string | null): TaxonomyScope | null {
  if (value === "content" || value === "agent" || value === "prompt" || value === "skill") {
    return value;
  }

  return null;
}

export function jsonOk(body: unknown, status = 200) {
  return Response.json(body, { status });
}
