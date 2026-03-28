import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  PublicCollectionGrid,
  PublicEmptyState,
  PublicFilterChips,
  PublicPageHeader,
  PublicShell,
} from "@/app/_components/public-ui";
import { listPublishedAgents, listTaxonomyTermsByScope } from "@/lib/public/hub";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeTerm = Array.isArray(params.term) ? params.term[0] : params.term;
  const [agents, taxonomyTerms] = await Promise.all([
    listPublishedAgents(activeTerm),
    listTaxonomyTermsByScope("agent"),
  ]);

  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="Agents"
        title="Agent records worth tracking"
        detail="Published agent profiles stay focused on what matters: clear summaries, working context, and graph links into prompts, skills, and tutorials."
      />
      <PublicFilterChips
        basePath="/agents"
        activeSlug={activeTerm}
        terms={taxonomyTerms}
      />
      {agents.length === 0 ? (
        <PublicEmptyState
          title={activeTerm ? "No published agents match this term yet" : "No published agents yet"}
          detail={
            activeTerm
              ? "Try a different scoped term or clear the filter to return to the full agent directory."
              : "Use the admin console to publish the first agent record, then this collection will become a proper browse surface."
          }
        />
      ) : (
        <PublicCollectionGrid
          items={agents.map((agent) => ({
            href: `/agents/${agent.slug}`,
            title: agent.title,
            summary: agent.shortDescription,
            meta: ["agent", "published"],
          }))}
        />
      )}
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "Agents",
  description: "Browse published agent records connected to prompts, skills, and supporting content.",
  path: "/agents",
});
