import { AdminListPage } from "@/app/admin/_components/admin-list-page";
import { getAdminListFeedback } from "@/lib/admin/action-feedback";
import { listSkills } from "@/lib/admin/cms";

export default async function AdminSkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const items = await listSkills();

  return (
    <AdminListPage
      eyebrow="Skills"
      title="Skills and workflows"
      detail="Create reusable skill records that later connect to prompts, tutorials, and agent pages."
      createHref="/admin/skills/new"
      createLabel="New skill"
      items={items}
      feedback={getAdminListFeedback("skill", params)}
    />
  );
}
