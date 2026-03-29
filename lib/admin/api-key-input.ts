import { z } from "zod";
import { apiKeyScopeEnum } from "@/db/schema";

function trimText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeDateTime(value?: string | null) {
  const trimmed = trimText(value);

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid datetime value: ${trimmed}`);
  }

  return parsed;
}

const apiKeyInputSchema = z.object({
  label: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  scopes: z.array(z.enum(apiKeyScopeEnum.enumValues)).min(1),
  expiresAt: z.string().optional().nullable(),
});

export function normalizeApiKeyInput(input: Record<string, unknown>) {
  const parsed = apiKeyInputSchema.parse(input);

  return {
    label: parsed.label.trim(),
    description: trimText(parsed.description),
    scopes: parsed.scopes,
    expiresAt: normalizeDateTime(parsed.expiresAt),
  };
}
