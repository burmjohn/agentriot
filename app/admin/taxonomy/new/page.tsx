import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import { createTaxonomyTermAction } from "@/app/admin/actions";

export default function AdminTaxonomyNewPage() {
  return (
    <AdminRecordForm
      title="Create taxonomy term"
      detail="Add a shared category, tag, or type term for one scope. Terms stay scoped so public browse pages remain coherent."
      submitLabel="Create term"
      action={createTaxonomyTermAction}
      initialValues={{
        scope: "content",
        kind: "category",
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
  );
}
