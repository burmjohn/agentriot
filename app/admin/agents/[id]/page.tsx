import { notFound } from "next/navigation";
import { AdminFeedbackBanner } from "@/app/admin/_components/admin-feedback-banner";
import { AdminRelationEditor } from "@/app/admin/_components/admin-relation-editor";
import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import {
  updateAgentAction,
  updateAgentPromptsRelationAction,
  updateAgentSkillsRelationAction,
  updateAgentTaxonomyAction,
} from "@/app/admin/actions";
import { getAdminDetailFeedback } from "@/lib/admin/action-feedback";
import {
  getAgentById,
  getAgentRelationIds,
  getAgentTaxonomyIds,
  listPromptOptions,
  listSkillOptions,
  listTaxonomyOptionsByScope,
} from "@/lib/admin/cms";

export default async function AdminAgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paramsState = await searchParams;
  const [record, relationIds, taxonomyIds, promptOptions, skillOptions, taxonomyOptions] =
    await Promise.all([
      getAgentById(id),
      getAgentRelationIds(id),
      getAgentTaxonomyIds(id),
      listPromptOptions(),
      listSkillOptions(),
      listTaxonomyOptionsByScope("agent"),
    ]);

  if (!record) {
    notFound();
  }

  const feedback = getAdminDetailFeedback("agent", paramsState);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-6">
        {feedback ? <AdminFeedbackBanner feedback={feedback} /> : null}
        <AdminRecordForm
          title={`Edit agent: ${record.title}`}
          detail="Keep the directory profile accurate while preserving canonical route integrity."
          submitLabel="Save agent"
          action={updateAgentAction.bind(null, id)}
          initialValues={{
            status: record.status,
            title: record.title,
            slug: record.slug,
            shortDescription: record.shortDescription,
            longDescription: record.longDescription,
            websiteUrl: record.websiteUrl,
            githubUrl: record.githubUrl,
            pricingNotes: record.pricingNotes,
          }}
          fields={[
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
              name: "shortDescription",
              label: "Short description",
              kind: "textarea",
              rows: 3,
            },
            {
              name: "longDescription",
              label: "Long description",
              kind: "textarea",
              rows: 8,
            },
            {
              name: "websiteUrl",
              label: "Website URL",
              kind: "url",
            },
            {
              name: "githubUrl",
              label: "GitHub URL",
              kind: "url",
            },
            {
              name: "pricingNotes",
              label: "Pricing notes",
              kind: "textarea",
              rows: 3,
            },
          ]}
        />
      </div>

      <div className="grid gap-6">
        <AdminRelationEditor
          title="Taxonomy"
          detail="Assign scoped terms so agent lists and detail pages stay consistent across categories, tags, and types."
          action={updateAgentTaxonomyAction.bind(null, id)}
          options={taxonomyOptions}
          selectedIds={taxonomyIds}
          submitLabel="Save taxonomy"
          emptyMessage="No agent taxonomy terms exist yet."
        />
        <AdminRelationEditor
          title="Related prompts"
          detail="Connect reusable prompts that belong with this agent record."
          action={updateAgentPromptsRelationAction.bind(null, id)}
          options={promptOptions}
          selectedIds={relationIds.promptIds}
        />
        <AdminRelationEditor
          title="Related skills"
          detail="Connect reusable skills and workflows that help explain what this agent is good for."
          action={updateAgentSkillsRelationAction.bind(null, id)}
          options={skillOptions}
          selectedIds={relationIds.skillIds}
        />
      </div>
    </div>
  );
}
