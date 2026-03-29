import { ApiKeyForm } from "@/app/admin/_components/api-key-form";
import { createApiKeyAction } from "@/app/admin/actions";

export default function AdminApiKeyCreatePage() {
  return (
    <ApiKeyForm
      title="Create API key"
      detail="Generate a trusted publisher or operator key. Secrets are encrypted at rest for internal reveal support."
      submitLabel="Create key"
      action={createApiKeyAction}
      initialValues={{
        scopes: ["content:write"],
      }}
    />
  );
}
