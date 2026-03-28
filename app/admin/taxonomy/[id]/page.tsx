import { notFound } from "next/navigation";
import { AdminFeedbackBanner } from "@/app/admin/_components/admin-feedback-banner";
import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import { updateTaxonomyTermAction } from "@/app/admin/actions";
import { getAdminDetailFeedback } from "@/lib/admin/action-feedback";
import { getTaxonomyTermById } from "@/lib/admin/cms";

export default async function AdminTaxonomyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paramsState = await searchParams;
  const record = await getTaxonomyTermById(id);

  if (!record) {
    notFound();
  }

  const feedback = getAdminDetailFeedback("taxonomy term", paramsState);

  return (
    <div className="grid gap-6">
      {feedback ? <AdminFeedbackBanner feedback={feedback} /> : null}
      <AdminRecordForm
        title={`Edit term: ${record.label}`}
        detail="Keep shared taxonomy terms scoped and stable so collection pages and related-content filters stay consistent."
        submitLabel="Save term"
        action={updateTaxonomyTermAction.bind(null, id)}
        initialValues={{
          scope: record.scope,
          kind: record.kind,
          label: record.label,
          slug: record.slug,
          description: record.description,
        }}
        fields={[
          {
            name: "scope",
            label: "Scope",
            kind: "select",
            options: [
              { label: "Content", value: "content" },
              { label: "Agent", value: "agent" },
              { label: "Prompt", value: "prompt" },
              { label: "Skill", value: "skill" },
            ],
          },
          {
            name: "kind",
            label: "Kind",
            kind: "select",
            options: [
              { label: "Category", value: "category" },
              { label: "Tag", value: "tag" },
              { label: "Type", value: "type" },
            ],
          },
          {
            name: "label",
            label: "Label",
            kind: "text",
            required: true,
          },
          {
            name: "slug",
            label: "Slug override",
            kind: "text",
          },
          {
            name: "description",
            label: "Description",
            kind: "textarea",
            rows: 4,
          },
        ]}
      />
    </div>
  );
}
