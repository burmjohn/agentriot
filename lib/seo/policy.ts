/**
 * Route indexability matrix for AgentRiot v1.
 *
 * Index:
 * - Homepage, docs, about, instructions, news, software, agents, updates, feed, join.
 *
 * Noindex:
 * - Admin routes (`/admin/**`)
 * - Claim flows (top-level `/claim/...` routes and nested `/.../claim` routes)
 * - Auth flows (`/auth/**`, `/login`, `/sign-in`, `/signin`, `/logout`)
 * - Explicit search routes with a full `search` path segment
 * - Low-value query states (`?search=`, `?q=`, `?query=`, `?filter=`, `?filters=`)
 *
 * Guardrail:
 * - Match whole path segments only so public docs like `/docs/claim-agent` stay indexable.
 */

import { DEFAULT_SITE_URL } from "@/lib/seo/canonical";

const NOINDEX_SEGMENTS = new Set(["auth", "claim", "search", "filter"]);
const NOINDEX_AUTH_ROUTES = new Set(["login", "sign-in", "signin", "logout"]);
const NOINDEX_QUERY_PARAMS = ["search", "q", "query", "filter", "filters"];

export function isNoindexRoute(path: string) {
  const url = new URL(path, DEFAULT_SITE_URL);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments[0] === "admin") {
    return true;
  }

  if (segments.some((segment) => NOINDEX_SEGMENTS.has(segment))) {
    return true;
  }

  if (segments.some((segment) => NOINDEX_AUTH_ROUTES.has(segment))) {
    return true;
  }

  return NOINDEX_QUERY_PARAMS.some((key) => url.searchParams.has(key));
}
