export type RouteType =
  | "article"
  | "tutorial"
  | "agent"
  | "prompt"
  | "skill";

type RedirectInput = {
  routeType: RouteType;
  currentSlug: string;
  previousSlugs: string[];
};

type RedirectRecord = {
  sourcePath: string;
  targetPath: string;
  isPermanent: true;
};

const routePrefixes: Record<RouteType, string> = {
  article: "/articles",
  tutorial: "/tutorials",
  agent: "/agents",
  prompt: "/prompts",
  skill: "/skills",
};

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function nextAvailableSlug(desiredSlug: string, existingSlugs: string[]) {
  const baseSlug = slugify(desiredSlug);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existingSlugs.includes(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export function nextAvailableSlugExcept(
  desiredSlug: string,
  existingSlugs: string[],
  currentSlug?: string,
) {
  const normalizedCurrentSlug = currentSlug ? slugify(currentSlug) : null;
  const filteredExistingSlugs = normalizedCurrentSlug
    ? existingSlugs.filter((slug) => slugify(slug) !== normalizedCurrentSlug)
    : existingSlugs;

  return nextAvailableSlug(desiredSlug, filteredExistingSlugs);
}

export function buildRoutePath(routeType: RouteType, slug: string) {
  return `${routePrefixes[routeType]}/${slugify(slug)}`;
}

export function buildRedirectRecords({
  routeType,
  currentSlug,
  previousSlugs,
}: RedirectInput): RedirectRecord[] {
  const canonicalSlug = slugify(currentSlug);
  const targetPath = buildRoutePath(routeType, canonicalSlug);

  return [...new Set(previousSlugs.map(slugify))]
    .filter((previousSlug) => previousSlug && previousSlug !== canonicalSlug)
    .map((previousSlug) => ({
      sourcePath: buildRoutePath(routeType, previousSlug),
      targetPath,
      isPermanent: true as const,
    }));
}
