import { AdminListPage } from "@/app/admin/_components/admin-list-page";
import { getAdminListFeedback } from "@/lib/admin/action-feedback";
import { listContentItems } from "@/lib/admin/cms";

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const items = await listContentItems();

  return (
    <AdminListPage
      eyebrow="Content"
      title="Articles and tutorials"
      detail="Shared content records power both the news/analysis side and the practical tutorial side of AgentRiot."
      createHref="/admin/content/new"
      createLabel="New article or tutorial"
      items={items}
      feedback={getAdminListFeedback("content record", params)}
    />
  );
}
