import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import { createSkillAction } from "@/app/admin/actions";

export default function AdminNewSkillPage() {
  return (
    <AdminRecordForm
      title="Create skill"
      detail="Add a reusable capability or workflow entry for the connected graph."
      submitLabel="Create skill"
      action={createSkillAction}
      fields={[
        {
          name: "status",
          label: "Status",
          kind: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Review", value: "review" },
            { label: "Published", value: "published" },
          ],
        },
        {
          name: "title",
          label: "Title",
          kind: "text",
          required: true,
          placeholder: "Issue triage",
        },
        {
          name: "slug",
          label: "Slug override",
          kind: "text",
          placeholder: "leave blank to derive automatically",
        },
        {
          name: "shortDescription",
          label: "Short description",
          kind: "textarea",
          rows: 3,
          placeholder: "Short summary for list views.",
        },
        {
          name: "longDescription",
          label: "Long description",
          kind: "textarea",
          rows: 8,
          placeholder: "Explain the workflow or capability in detail.",
        },
        {
          name: "websiteUrl",
          label: "Website URL",
          kind: "url",
          placeholder: "https://example.com",
        },
        {
          name: "githubUrl",
          label: "GitHub URL",
          kind: "url",
          placeholder: "https://github.com/example/repo",
        },
      ]}
    />
  );
}
