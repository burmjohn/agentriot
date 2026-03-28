import { notFound } from "next/navigation";
import { AdminFeedbackBanner } from "@/app/admin/_components/admin-feedback-banner";
import { AdminRelationEditor } from "@/app/admin/_components/admin-relation-editor";
import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import {
  updateSkillAction,
  updateSkillAgentsRelationAction,
  updateSkillPromptsRelationAction,
  updateSkillTaxonomyAction,
} from "@/app/admin/actions";
import { getAdminDetailFeedback } from "@/lib/admin/action-feedback";
import {
  getSkillById,
  getSkillRelationIds,
  getSkillTaxonomyIds,
  listAgentOptions,
  listPromptOptions,
  listTaxonomyOptionsByScope,
} from "@/lib/admin/cms";

export default async function AdminSkillDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paramsState = await searchParams;
  const [record, relationIds, taxonomyIds, agentOptions, promptOptions, taxonomyOptions] =
    await Promise.all([
      getSkillById(id),
      getSkillRelationIds(id),
      getSkillTaxonomyIds(id),
      listAgentOptions(),
      listPromptOptions(),
      listTaxonomyOptionsByScope("skill"),
    ]);

  if (!record) {
    notFound();
  }

  const feedback = getAdminDetailFeedback("skill", paramsState);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-6">
        {feedback ? <AdminFeedbackBanner feedback={feedback} /> : null}
        <AdminRecordForm
          title={`Edit skill: ${record.title}`}
          detail="Refine the reusable workflow record while keeping slug and publication status consistent."
          submitLabel="Save skill"
          action={updateSkillAction.bind(null, id)}
          initialValues={{
            status: record.status,
            title: record.title,
            slug: record.slug,
            shortDescription: record.shortDescription,
            longDescription: record.longDescription,
            websiteUrl: record.websiteUrl,
            githubUrl: record.githubUrl,
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
          ]}
        />
      </div>

      <div className="grid gap-6">
        <AdminRelationEditor
          title="Taxonomy"
          detail="Assign scoped skill terms so workflow records show up in the right browse surfaces."
          action={updateSkillTaxonomyAction.bind(null, id)}
          options={taxonomyOptions}
          selectedIds={taxonomyIds}
          submitLabel="Save taxonomy"
          emptyMessage="No skill taxonomy terms exist yet."
        />
        <AdminRelationEditor
          title="Related agents"
          detail="Connect agents that use or demonstrate this skill."
          action={updateSkillAgentsRelationAction.bind(null, id)}
          options={agentOptions}
          selectedIds={relationIds.agentIds}
        />
        <AdminRelationEditor
          title="Related prompts"
          detail="Connect prompts that belong in the same workflow chain."
          action={updateSkillPromptsRelationAction.bind(null, id)}
          options={promptOptions}
          selectedIds={relationIds.promptIds}
        />
      </div>
    </div>
  );
}
