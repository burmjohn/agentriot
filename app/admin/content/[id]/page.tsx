import { notFound } from "next/navigation";
import { AdminFeedbackBanner } from "@/app/admin/_components/admin-feedback-banner";
import { ContentRevisionList } from "@/app/admin/_components/content-revision-list";
import { AdminRelationEditor } from "@/app/admin/_components/admin-relation-editor";
import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import {
  updateContentAction,
  updateContentAgentsRelationAction,
  updateContentPromptsRelationAction,
  updateContentSkillsRelationAction,
  updateContentTaxonomyAction,
} from "@/app/admin/actions";
import { getAdminDetailFeedback } from "@/lib/admin/action-feedback";
import {
  getContentItemById,
  getContentRelationIds,
  listContentRevisions,
  getContentTaxonomyIds,
  listAgentOptions,
  listPromptOptions,
  listSkillOptions,
  listTaxonomyOptionsByScope,
} from "@/lib/admin/cms";
import { formatDateTimeLocalValue } from "@/lib/admin/date-time";

export default async function AdminContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paramsState = await searchParams;
  const [
    record,
    revisions,
    relationIds,
    taxonomyIds,
    agentOptions,
    promptOptions,
    skillOptions,
    taxonomyOptions,
  ] =
    await Promise.all([
      getContentItemById(id),
      listContentRevisions(id),
      getContentRelationIds(id),
      getContentTaxonomyIds(id),
      listAgentOptions(),
      listPromptOptions(),
      listSkillOptions(),
      listTaxonomyOptionsByScope("content"),
    ]);

  if (!record) {
    notFound();
  }

  const feedback = getAdminDetailFeedback("content record", paramsState);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-6">
        {feedback ? <AdminFeedbackBanner feedback={feedback} /> : null}
        <AdminRecordForm
          title={`Edit content: ${record.title}`}
          detail="Update the shared content record. Slug conflicts are resolved centrally so route integrity stays stable."
          submitLabel="Save content"
          action={updateContentAction.bind(null, id)}
          initialValues={{
            kind: record.kind,
            subtype: record.subtype,
            status: record.status,
            title: record.title,
            slug: record.slug,
            excerpt: record.excerpt,
            body: record.body,
            heroImageUrl: record.heroImageUrl,
            canonicalUrl: record.canonicalUrl,
            seoTitle: record.seoTitle,
            seoDescription: record.seoDescription,
            publishedAt: formatDateTimeLocalValue(record.publishedAt),
            scheduledFor: formatDateTimeLocalValue(record.scheduledFor),
          }}
          fields={[
            {
              name: "kind",
              label: "Kind",
              kind: "select",
              options: [
                { label: "Article", value: "article" },
                { label: "Tutorial", value: "tutorial" },
              ],
            },
            {
              name: "subtype",
              label: "Subtype",
              kind: "select",
              options: [
                { label: "News", value: "news" },
                { label: "Blog", value: "blog" },
                { label: "Analysis", value: "analysis" },
                { label: "Roundup", value: "roundup" },
                { label: "Guide", value: "guide" },
                { label: "Release note", value: "release-note" },
              ],
            },
            {
              name: "status",
              label: "Status",
              kind: "select",
              options: [
                { label: "Draft", value: "draft" },
                { label: "Review", value: "review" },
                { label: "Scheduled", value: "scheduled" },
                { label: "Published", value: "published" },
                { label: "Archived", value: "archived" },
              ],
            },
            {
              name: "title",
              label: "Title",
              kind: "text",
              required: true,
            },
            {
              name: "slug",
              label: "Slug override",
              kind: "text",
            },
            {
              name: "excerpt",
              label: "Excerpt",
              kind: "textarea",
              rows: 3,
            },
            {
              name: "body",
              label: "Body",
              kind: "textarea",
              rows: 10,
            },
            {
              name: "heroImageUrl",
              label: "Hero image URL",
              kind: "url",
            },
            {
              name: "canonicalUrl",
              label: "Canonical URL override",
              kind: "url",
            },
            {
              name: "seoTitle",
              label: "SEO title override",
              kind: "text",
            },
            {
              name: "seoDescription",
              label: "SEO description override",
              kind: "textarea",
              rows: 3,
            },
            {
              name: "publishedAt",
              label: "Published at",
              kind: "datetime-local",
            },
            {
              name: "scheduledFor",
              label: "Scheduled for",
              kind: "datetime-local",
            },
          ]}
        />
      </div>

      <div className="grid gap-6">
        <AdminRelationEditor
          title="Taxonomy"
          detail="Assign scoped categories, tags, and types so browse pages and related content stay navigable."
          action={updateContentTaxonomyAction.bind(null, id)}
          options={taxonomyOptions}
          selectedIds={taxonomyIds}
          submitLabel="Save taxonomy"
          emptyMessage="No content taxonomy terms exist yet."
        />
        <AdminRelationEditor
          title="Related agents"
          detail="Connect this content to agent records so public detail pages can traverse the graph cleanly."
          action={updateContentAgentsRelationAction.bind(null, id)}
          options={agentOptions}
          selectedIds={relationIds.agentIds}
        />
        <AdminRelationEditor
          title="Related prompts"
          detail="Attach prompts that should surface alongside this article or tutorial."
          action={updateContentPromptsRelationAction.bind(null, id)}
          options={promptOptions}
          selectedIds={relationIds.promptIds}
        />
        <AdminRelationEditor
          title="Related skills"
          detail="Attach skills and workflows that belong in the same discovery thread."
          action={updateContentSkillsRelationAction.bind(null, id)}
          options={skillOptions}
          selectedIds={relationIds.skillIds}
        />
        <ContentRevisionList contentItemId={id} revisions={revisions} />
      </div>
    </div>
  );
}
