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
  const oldPath = buildRoutePath(routeType, previousSlug);
  const newPath = buildRoutePath(routeType, currentSlug);

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
