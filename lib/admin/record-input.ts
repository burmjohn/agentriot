import { z } from "zod";
import { slugify } from "@/lib/content/slug-policy";

const publicationStatusSchema = z.enum([
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
]);

const contentKindSchema = z.enum(["article", "tutorial"]);
const contentSubtypeSchema = z.enum([
  "news",
  "blog",
  "analysis",
  "roundup",
  "guide",
  "release-note",
]);

function trimText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeSlugInput(title: string, slug?: string | null) {
  const source = trimText(slug) ?? title;
  return slugify(source);
}

function normalizeUrl(value?: string | null) {
  return trimText(value);
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

const contentInputSchema = z.object({
  kind: contentKindSchema,
  title: z.string().trim().min(1),
  slug: z.string().optional().nullable(),
  subtype: contentSubtypeSchema.optional().nullable(),
  status: publicationStatusSchema,
  excerpt: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  publishedAt: z.string().optional().nullable(),
  scheduledFor: z.string().optional().nullable(),
});

const agentInputSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().optional().nullable(),
  status: publicationStatusSchema,
  shortDescription: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  pricingNotes: z.string().optional().nullable(),
});

const promptInputSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().optional().nullable(),
  status: publicationStatusSchema,
  shortDescription: z.string().optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  promptBody: z.string().trim().min(1),
  providerCompatibility: z.string().optional().nullable(),
  variablesSchema: z.string().optional().nullable(),
  exampleOutput: z.string().optional().nullable(),
});

const skillInputSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().optional().nullable(),
  status: publicationStatusSchema,
  shortDescription: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
});

export function normalizeContentInput(input: Record<string, unknown>) {
  const parsed = contentInputSchema.parse(input);
  const publishedAt =
    normalizeDateTime(parsed.publishedAt) ??
    (parsed.status === "published" ? new Date() : null);
  const scheduledFor = normalizeDateTime(parsed.scheduledFor);

  return {
    kind: parsed.kind,
    title: parsed.title.trim(),
    slug: normalizeSlugInput(parsed.title, parsed.slug),
    subtype: parsed.subtype ?? null,
    status: parsed.status,
    excerpt: trimText(parsed.excerpt),
    body: trimText(parsed.body),
    heroImageUrl: normalizeUrl(parsed.heroImageUrl),
    canonicalUrl: normalizeUrl(parsed.canonicalUrl),
    seoTitle: trimText(parsed.seoTitle),
    seoDescription: trimText(parsed.seoDescription),
    publishedAt,
    scheduledFor,
  };
}

export function normalizeAgentInput(input: Record<string, unknown>) {
  const parsed = agentInputSchema.parse(input);

  return {
    title: parsed.title.trim(),
    slug: normalizeSlugInput(parsed.title, parsed.slug),
    status: parsed.status,
    shortDescription: trimText(parsed.shortDescription),
    longDescription: trimText(parsed.longDescription),
    websiteUrl: normalizeUrl(parsed.websiteUrl),
    githubUrl: normalizeUrl(parsed.githubUrl),
    pricingNotes: trimText(parsed.pricingNotes),
  };
}

export function normalizePromptInput(input: Record<string, unknown>) {
  const parsed = promptInputSchema.parse(input);

  return {
    title: parsed.title.trim(),
    slug: normalizeSlugInput(parsed.title, parsed.slug),
    status: parsed.status,
    shortDescription: trimText(parsed.shortDescription),
    fullDescription: trimText(parsed.fullDescription),
    promptBody: parsed.promptBody.trim(),
    providerCompatibility: trimText(parsed.providerCompatibility),
    variablesSchema: trimText(parsed.variablesSchema),
    exampleOutput: trimText(parsed.exampleOutput),
  };
}

export function normalizeSkillInput(input: Record<string, unknown>) {
  const parsed = skillInputSchema.parse(input);

  return {
    title: parsed.title.trim(),
    slug: normalizeSlugInput(parsed.title, parsed.slug),
    status: parsed.status,
    shortDescription: trimText(parsed.shortDescription),
    longDescription: trimText(parsed.longDescription),
    websiteUrl: normalizeUrl(parsed.websiteUrl),
    githubUrl: normalizeUrl(parsed.githubUrl),
  };
}
