import { permanentRedirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  PublicCollectionGrid,
  PublicEmptyState,
  PublicFilterChips,
  PublicPageHeader,
  PublicShell,
} from "@/app/_components/public-ui";
import { listPublishedContent, listTaxonomyTermsByScope } from "@/lib/public/hub";
import { getFilterRedirectTarget } from "@/lib/content/redirects";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeTerm = Array.isArray(params.term) ? params.term[0] : params.term;
  const [articles, taxonomyTerms] = await Promise.all([
    listPublishedContent("article", activeTerm),
    listTaxonomyTermsByScope("content"),
  ]);

  const redirectRecord = await getFilterRedirectTarget({
    basePath: "/articles",
    activeTerm,
    knownSlugs: taxonomyTerms.map((term) => term.slug),
  });

  if (redirectRecord?.isPermanent) {
    permanentRedirect(redirectRecord.targetPath);
  }

  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="Articles"
        title="Current signal, not feed sludge"
        detail="Published articles cover news, analysis, and release context while staying connected to the actual agents, prompts, and skills they affect."
      />
      <PublicFilterChips
        basePath="/articles"
        activeSlug={activeTerm}
        terms={taxonomyTerms}
      />
      {articles.length === 0 ? (
        <PublicEmptyState
          title={
            activeTerm ? "No published articles match this term yet" : "No published articles yet"
          }
          detail={
            activeTerm
              ? "Try a different scoped term or clear the filter to return to the full article stream."
              : "Publish the first article from admin and the article stream will start surfacing here."
          }
        />
      ) : (
        <PublicCollectionGrid
          items={articles.map((article) => ({
            href: `/articles/${article.slug}`,
            title: article.title,
            summary: article.excerpt,
            meta: [article.subtype ?? "article", "published"],
          }))}
        />
      )}
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "Articles",
  description: "Read published AI articles, news, and analysis connected to the wider AgentRiot graph.",
  path: "/articles",
});
