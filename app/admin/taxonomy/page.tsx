import { AdminListPage } from "@/app/admin/_components/admin-list-page";
import { getAdminListFeedback } from "@/lib/admin/action-feedback";
import { listTaxonomyTerms } from "@/lib/admin/cms";

export default async function AdminTaxonomyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const items = await listTaxonomyTerms();

  return (
    <AdminListPage
      eyebrow="Taxonomy"
      title="Shared scoped terms"
      detail="Manage the category, tag, and type terms that shape browse pages across content, agents, prompts, and skills."
      createHref="/admin/taxonomy/new"
      createLabel="New term"
      items={items}
      feedback={getAdminListFeedback("taxonomy term", params)}
    />
  );
}
