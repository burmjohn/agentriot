import { AdminListPage } from "@/app/admin/_components/admin-list-page";
import { getAdminListFeedback } from "@/lib/admin/action-feedback";
import { listAgents } from "@/lib/admin/cms";

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const items = await listAgents();

  return (
    <AdminListPage
      eyebrow="Agents"
      title="Agent directory"
      detail="Track tools, coding agents, and automation systems with stable slugs and editorial status."
      createHref="/admin/agents/new"
      createLabel="New agent"
      items={items}
      feedback={getAdminListFeedback("agent", params)}
    />
  );
}
