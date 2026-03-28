import { z } from "zod";
import { slugify } from "@/lib/content/slug-policy";

const taxonomyScopeSchema = z.enum(["content", "agent", "prompt", "skill"]);
const taxonomyKindSchema = z.enum(["category", "tag", "type"]);

function trimText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeTaxonomyInput(input: Record<string, unknown>) {
  const parsed = z
    .object({
      scope: taxonomyScopeSchema,
      kind: taxonomyKindSchema,
      label: z.string().trim().min(1),
      slug: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
    })
    .parse(input);

  return {
    scope: parsed.scope,
    kind: parsed.kind,
    label: parsed.label.trim(),
    slug: slugify(trimText(parsed.slug) ?? parsed.label),
    description: trimText(parsed.description),
  };
}
