import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import { createPromptAction } from "@/app/admin/actions";

export default function AdminNewPromptPage() {
  return (
    <AdminRecordForm
      title="Create prompt"
      detail="Add a prompt record with a working prompt body and optional compatibility details."
      submitLabel="Create prompt"
      action={createPromptAction}
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
          placeholder: "Repository evaluator",
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
          placeholder: "What this prompt is for.",
        },
        {
          name: "fullDescription",
          label: "Full description",
          kind: "textarea",
          rows: 5,
          placeholder: "Context and usage guidance.",
        },
        {
          name: "promptBody",
          label: "Prompt body",
          kind: "textarea",
          required: true,
          rows: 10,
          placeholder: "Paste the working prompt here.",
        },
        {
          name: "providerCompatibility",
          label: "Provider compatibility",
          kind: "text",
          placeholder: "Claude, GPT-5.4, Gemini, etc.",
        },
        {
          name: "variablesSchema",
          label: "Variables",
          kind: "textarea",
          rows: 3,
          placeholder: "Optional variable notes or schema.",
        },
        {
          name: "exampleOutput",
          label: "Example output",
          kind: "textarea",
          rows: 4,
          placeholder: "Optional example result.",
        },
      ]}
    />
  );
}
