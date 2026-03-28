import { slugify } from "@/lib/content/slug-policy";

function normalizeInput(value?: string | null) {
  return value?.trim() ?? "";
}

export function isSlugCustomized(sourceValue?: string | null, slugValue?: string | null) {
  const normalizedSource = normalizeInput(sourceValue);
  const normalizedSlug = normalizeInput(slugValue);

  if (!normalizedSlug) {
    return false;
  }

  return slugify(normalizedSlug) !== slugify(normalizedSource);
}

export function getAutoSlugValue(sourceValue?: string | null) {
  return slugify(normalizeInput(sourceValue));
}
