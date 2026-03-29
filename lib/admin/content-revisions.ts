import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentRevisions, type contentItems } from "@/db/schema";

type ContentSnapshotSource = Pick<
  typeof contentItems.$inferSelect,
  | "id"
  | "kind"
  | "subtype"
  | "status"
  | "title"
  | "slug"
  | "excerpt"
  | "body"
  | "heroImageUrl"
  | "canonicalUrl"
  | "seoTitle"
  | "seoDescription"
  | "publishedAt"
  | "scheduledFor"
>;

const revisionFieldLabels = {
  kind: "Kind",
  subtype: "Subtype",
  status: "Status",
  title: "Title",
  slug: "Slug",
  excerpt: "Excerpt",
  body: "Body",
  heroImageUrl: "Hero image",
  canonicalUrl: "Canonical URL",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
  publishedAt: "Published at",
  scheduledFor: "Scheduled for",
} as const;

type RevisionComparableField = keyof typeof revisionFieldLabels;

function areRevisionValuesEqual(
  left: typeof contentRevisions.$inferSelect[RevisionComparableField],
  right: typeof contentRevisions.$inferSelect[RevisionComparableField],
) {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }

  return left === right;
}

export function buildContentRevisionValues({
  contentItem,
  editedById,
  revisionNumber,
  createdAt = new Date(),
}: {
  contentItem: ContentSnapshotSource;
  editedById: string | null;
  revisionNumber: number;
  createdAt?: Date;
}) {
  return {
    contentItemId: contentItem.id,
    revisionNumber,
    kind: contentItem.kind,
    subtype: contentItem.subtype,
    status: contentItem.status,
    title: contentItem.title,
    slug: contentItem.slug,
    excerpt: contentItem.excerpt,
    body: contentItem.body,
    heroImageUrl: contentItem.heroImageUrl,
    canonicalUrl: contentItem.canonicalUrl,
    seoTitle: contentItem.seoTitle,
    seoDescription: contentItem.seoDescription,
    publishedAt: contentItem.publishedAt,
    scheduledFor: contentItem.scheduledFor,
    editedById,
    createdAt,
  };
}

export function buildContentRestoreValues(
  revision: typeof contentRevisions.$inferSelect,
) {
  return {
    kind: revision.kind,
    subtype: revision.subtype,
    status: revision.status,
    title: revision.title,
    slug: revision.slug,
    excerpt: revision.excerpt,
    body: revision.body,
    heroImageUrl: revision.heroImageUrl,
    canonicalUrl: revision.canonicalUrl,
    seoTitle: revision.seoTitle,
    seoDescription: revision.seoDescription,
    publishedAt: revision.publishedAt,
    scheduledFor: revision.scheduledFor,
  };
}

export function getChangedContentRevisionFields(
  revision: typeof contentRevisions.$inferSelect,
  currentRevision: typeof contentRevisions.$inferSelect,
) {
  return (Object.entries(revisionFieldLabels) as Array<
    [RevisionComparableField, (typeof revisionFieldLabels)[RevisionComparableField]]
  >)
    .filter(([field]) => !areRevisionValuesEqual(revision[field], currentRevision[field]))
    .map(([, label]) => label);
}

export async function createContentRevisionSnapshot({
  database = db,
  contentItem,
  editedById,
}: {
  database?: Pick<typeof db, "select" | "insert">;
  contentItem: ContentSnapshotSource;
  editedById: string | null;
}) {
  const [latestRevision] = await database
    .select({ revisionNumber: contentRevisions.revisionNumber })
    .from(contentRevisions)
    .where(eq(contentRevisions.contentItemId, contentItem.id))
    .orderBy(desc(contentRevisions.revisionNumber))
    .limit(1);

  const revisionNumber = (latestRevision?.revisionNumber ?? 0) + 1;

  await database.insert(contentRevisions).values(
    buildContentRevisionValues({
      contentItem,
      editedById,
      revisionNumber,
    }),
  );
}
