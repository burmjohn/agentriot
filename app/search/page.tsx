import { buildPageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { PublicEmptyState, PublicPageHeader, PublicShell } from "@/app/_components/public-ui";
import { searchPublishedGraph } from "@/lib/public/hub";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchPublishedGraph(query) : [];

  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="Search"
        title="Search the graph"
        detail="Search across published agents, prompts, skills, tutorials, and articles from one route."
      />
      <section className="panel grid gap-4 rounded-[1.75rem] p-6">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search prompts, agents, tutorials, skills..."
            className="min-h-12 rounded-[1.5rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground/35"
          />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
          >
            Search
          </button>
        </form>
      </section>
      {!query ? (
        <PublicEmptyState
          title="No query yet"
          detail="Start with a model, workflow, prompt, or agent name and the published graph will search across all current surfaces."
        />
      ) : results.length === 0 ? (
        <PublicEmptyState
          title="No published matches"
          detail={`Nothing published matches “${query}” yet. Try a broader term or publish matching records from the admin console.`}
        />
      ) : (
        <section className="grid gap-3">
          {results.map((result) => (
            <Link
              key={`${result.kind}-${result.id}`}
              href={result.href}
              className="panel grid gap-2 rounded-[1.5rem] px-5 py-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap gap-2">
                <span className="chip rounded-full px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
                  {result.kind}
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
                {result.title}
              </h2>
              {result.meta ? (
                <p className="text-sm leading-7 text-muted">{result.meta}</p>
              ) : null}
            </Link>
          ))}
        </section>
      )}
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "Search",
  description: "Search published agents, prompts, skills, tutorials, and articles across the AgentRiot graph.",
  path: "/search",
});
