import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import { createAgentAction } from "@/app/admin/actions";

export default function AdminNewAgentPage() {
  return (
    <AdminRecordForm
      title="Create agent"
      detail="Add a new agent record with a concise directory summary and optional source links."
      submitLabel="Create agent"
      action={createAgentAction}
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
          placeholder: "Claude Code",
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
          placeholder: "Repo-aware coding workflows with strong day-to-day signal.",
        },
        {
          name: "longDescription",
          label: "Long description",
          kind: "textarea",
          rows: 8,
          placeholder: "Longer directory profile for this agent.",
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
        {
          name: "pricingNotes",
          label: "Pricing notes",
          kind: "textarea",
          rows: 3,
          placeholder: "Optional pricing or licensing note.",
        },
      ]}
    />
  );
}
