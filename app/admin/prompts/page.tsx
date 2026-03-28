import { AdminListPage } from "@/app/admin/_components/admin-list-page";
import { getAdminListFeedback } from "@/lib/admin/action-feedback";
import { listPrompts } from "@/lib/admin/cms";

export default async function AdminPromptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const items = await listPrompts();

  return (
    <AdminListPage
      eyebrow="Prompts"
      title="Prompt library"
      detail="Maintain reusable prompts with canonical slugs and clean operational metadata."
      createHref="/admin/prompts/new"
      createLabel="New prompt"
      items={items}
      feedback={getAdminListFeedback("prompt", params)}
    />
  );
}
