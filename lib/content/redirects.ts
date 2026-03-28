import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { redirects } from "@/db/schema";
import { buildRoutePath, type RouteType } from "@/lib/content/slug-policy";

export async function getRedirectTarget(sourcePath: string) {
  const [record] = await db
    .select({
      targetPath: redirects.targetPath,
      isPermanent: redirects.isPermanent,
    })
    .from(redirects)
    .where(eq(redirects.sourcePath, sourcePath))
    .limit(1);

  return record ?? null;
}

async function syncRedirectForPathChange({
  database = db,
  previousPath,
  currentPath,
}: {
  database?: Pick<typeof db, "delete" | "insert" | "update">;
  previousPath: string;
  currentPath: string;
}) {
  const oldPath = previousPath;
  const newPath = currentPath;

  if (oldPath === newPath) {
    return;
  }

  const now = new Date();

  await database.delete(redirects).where(eq(redirects.sourcePath, newPath));

  await database
    .update(redirects)
    .set({
      targetPath: newPath,
      updatedAt: now,
    })
    .where(and(eq(redirects.targetPath, oldPath), ne(redirects.sourcePath, newPath)));

  await database
    .insert(redirects)
    .values({
      sourcePath: oldPath,
      targetPath: newPath,
      isPermanent: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: redirects.sourcePath,
      set: {
        targetPath: newPath,
        isPermanent: true,
        updatedAt: now,
      },
    });
}

export async function syncRedirectForSlugChange({
  database = db,
  routeType,
  previousSlug,
  currentSlug,
}: {
  database?: Pick<typeof db, "delete" | "insert" | "update">;
  routeType: RouteType;
  previousSlug: string;
  currentSlug: string;
}) {
  await syncRedirectForPathChange({
    database,
    previousPath: buildRoutePath(routeType, previousSlug),
    currentPath: buildRoutePath(routeType, currentSlug),
  });
}

function buildTaxonomyFilterPaths(
  scope: "content" | "agent" | "prompt" | "skill",
  slug: string,
) {
  const query = `?term=${encodeURIComponent(slug)}`;

  if (scope === "content") {
    return [`/articles${query}`, `/tutorials${query}`];
  }

  if (scope === "agent") {
    return [`/agents${query}`];
  }

  if (scope === "prompt") {
    return [`/prompts${query}`];
  }

  return [`/skills${query}`];
}

export async function syncRedirectsForTaxonomySlugChange({
  database = db,
  scope,
  previousSlug,
  currentSlug,
}: {
  database?: Pick<typeof db, "delete" | "insert" | "update">;
  scope: "content" | "agent" | "prompt" | "skill";
  previousSlug: string;
  currentSlug: string;
}) {
  const previousPaths = buildTaxonomyFilterPaths(scope, previousSlug);
  const currentPaths = buildTaxonomyFilterPaths(scope, currentSlug);

  await Promise.all(
    previousPaths.map((previousPath, index) =>
      syncRedirectForPathChange({
        database,
        previousPath,
        currentPath: currentPaths[index] ?? previousPath,
      }),
    ),
  );
}

export async function getFilterRedirectTarget({
  basePath,
  activeTerm,
  knownSlugs,
}: {
  basePath: string;
  activeTerm?: string;
  knownSlugs: string[];
}) {
  if (!activeTerm || knownSlugs.includes(activeTerm)) {
    return null;
  }

  return getRedirectTarget(`${basePath}?term=${encodeURIComponent(activeTerm)}`);
}
