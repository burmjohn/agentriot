import { REDIRECT_TYPES } from "@/db/schema/contracts";

export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type RedirectType = (typeof REDIRECT_TYPES)[number];

export type SlugRedirectRecord = {
  type: RedirectType;
  fromSlug: string;
  toSlug: string;
};

export type RedirectLookup = (path: string) => string | null;

const ROUTE_PREFIX_BY_TYPE: Record<RedirectType, string> = {
  news: "/news",
  software: "/software",
  agent: "/agents",
};

function normalizePath(path: string) {
  const url = new URL(path, DEFAULT_SITE_URL);

  if (url.pathname === "/") {
    return "/";
  }

  return url.pathname.replace(/\/+$/, "");
}

function replaceAgentSlug(path: string, nextSlug: string) {
  const match = path.match(/^\/agents\/([^/]+)(\/updates\/[^/]+)?$/);

  if (!match) {
    return path;
  }

  return `/agents/${nextSlug}${match[2] ?? ""}`;
}

export function createSlugRedirectLookup(records: SlugRedirectRecord[]): RedirectLookup {
  const redirectMap = new Map(
    records.map((record) => [`${record.type}:${record.fromSlug}`, record.toSlug]),
  );

  return (path) => {
    const normalizedPath = normalizePath(path);

    if (normalizedPath === "/") {
      return null;
    }

    const segments = normalizedPath.split("/").filter(Boolean);
    const [rootSegment, slug] = segments;

    if (!rootSegment || !slug) {
      return null;
    }

    if (rootSegment === "news") {
      const redirectedSlug = redirectMap.get(`news:${slug}`);
      return redirectedSlug ? `${ROUTE_PREFIX_BY_TYPE.news}/${redirectedSlug}` : null;
    }

    if (rootSegment === "software") {
      const redirectedSlug = redirectMap.get(`software:${slug}`);
      return redirectedSlug
        ? `${ROUTE_PREFIX_BY_TYPE.software}/${redirectedSlug}`
        : null;
    }

    if (rootSegment === "agents") {
      const redirectedSlug = redirectMap.get(`agent:${slug}`);
      return redirectedSlug ? replaceAgentSlug(normalizedPath, redirectedSlug) : null;
    }

    return null;
  };
}

export function buildCanonical(
  path: string,
  options?: {
    redirectLookup?: RedirectLookup;
  },
) {
  const normalizedPath = normalizePath(path);
  const canonicalPath = options?.redirectLookup?.(normalizedPath) ?? normalizedPath;

  return new URL(canonicalPath, DEFAULT_SITE_URL).toString();
}
