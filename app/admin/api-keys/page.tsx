import { AdminListPage } from "@/app/admin/_components/admin-list-page";
import { listApiKeys } from "@/lib/admin/cms";

export default async function AdminApiKeysPage() {
  const items = await listApiKeys();

  return (
    <AdminListPage
      eyebrow="Admin / API keys"
      title="API keys"
      detail="Manage trusted publisher and operator credentials for ingestion and internal automation."
      createHref="/admin/api-keys/new"
      createLabel="Create key"
      items={items}
    />
  );
}
