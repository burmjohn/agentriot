import { notFound } from "next/navigation";
import { AdminFeedbackBanner } from "@/app/admin/_components/admin-feedback-banner";
import { AdminRelationEditor } from "@/app/admin/_components/admin-relation-editor";
import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import {
  updatePromptAction,
  updatePromptAgentsRelationAction,
  updatePromptSkillsRelationAction,
  updatePromptTaxonomyAction,
} from "@/app/admin/actions";
import { getAdminDetailFeedback } from "@/lib/admin/action-feedback";
import {
  getPromptById,
  getPromptRelationIds,
  getPromptTaxonomyIds,
  listAgentOptions,
  listSkillOptions,
  listTaxonomyOptionsByScope,
} from "@/lib/admin/cms";

export default async function AdminPromptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paramsState = await searchParams;
  const [record, relationIds, taxonomyIds, agentOptions, skillOptions, taxonomyOptions] =
    await Promise.all([
      getPromptById(id),
      getPromptRelationIds(id),
      getPromptTaxonomyIds(id),
      listAgentOptions(),
      listSkillOptions(),
      listTaxonomyOptionsByScope("prompt"),
    ]);

  if (!record) {
    notFound();
  }

  const feedback = getAdminDetailFeedback("prompt", paramsState);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-6">
        {feedback ? <AdminFeedbackBanner feedback={feedback} /> : null}
        <AdminRecordForm
          title={`Edit prompt: ${record.title}`}
          detail="Update the working prompt and supporting metadata without breaking canonical public routing."
          submitLabel="Save prompt"
          action={updatePromptAction.bind(null, id)}
          initialValues={{
            status: record.status,
            title: record.title,
            slug: record.slug,
            shortDescription: record.shortDescription,
            fullDescription: record.fullDescription,
            promptBody: record.promptBody,
            providerCompatibility: record.providerCompatibility,
            variablesSchema: record.variablesSchema,
            exampleOutput: record.exampleOutput,
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
              name: "fullDescription",
              label: "Full description",
              kind: "textarea",
              rows: 5,
            },
            {
              name: "promptBody",
              label: "Prompt body",
              kind: "textarea",
              rows: 10,
              required: true,
            },
            {
              name: "providerCompatibility",
              label: "Provider compatibility",
              kind: "text",
            },
            {
              name: "variablesSchema",
              label: "Variables",
              kind: "textarea",
              rows: 3,
            },
            {
              name: "exampleOutput",
              label: "Example output",
              kind: "textarea",
              rows: 4,
            },
          ]}
        />
      </div>

      <div className="grid gap-6">
        <AdminRelationEditor
          title="Taxonomy"
          detail="Assign scoped prompt terms so discovery pages can filter by category, tag, and prompt type."
          action={updatePromptTaxonomyAction.bind(null, id)}
          options={taxonomyOptions}
          selectedIds={taxonomyIds}
          submitLabel="Save taxonomy"
          emptyMessage="No prompt taxonomy terms exist yet."
        />
        <AdminRelationEditor
          title="Related agents"
          detail="Connect agent records that should surface this prompt in their graph."
          action={updatePromptAgentsRelationAction.bind(null, id)}
          options={agentOptions}
          selectedIds={relationIds.agentIds}
        />
        <AdminRelationEditor
          title="Related skills"
          detail="Connect reusable skills and workflows that pair with this prompt."
          action={updatePromptSkillsRelationAction.bind(null, id)}
          options={skillOptions}
          selectedIds={relationIds.skillIds}
        />
      </div>
    </div>
  );
}
