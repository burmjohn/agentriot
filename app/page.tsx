import Link from "next/link";
import { PublicHeroMedia, PublicShell } from "@/app/_components/public-ui";
import { getHomepageSnapshot } from "@/lib/public/hub";
import { getPublicTaxonomyHref } from "@/lib/public/presentation";

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-muted">
          {eyebrow}
        </p>
        <h2 className="text-balance text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>
      {detail ? (
        <p className="max-w-sm text-sm leading-6 text-muted sm:text-right">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export default async function Home() {
  const snapshot = await getHomepageSnapshot();
  const leadStoryHref = snapshot.leadStory
    ? snapshot.leadStory.kind === "article"
      ? `/articles/${snapshot.leadStory.slug}`
      : `/tutorials/${snapshot.leadStory.slug}`
    : "/articles";

  const signalItems = [
    {
      label: "Lead shift",
      title: snapshot.leadStory
        ? snapshot.leadStory.title
        : "Publish the first article or tutorial to turn the homepage into a live signal board.",
    },
    {
      label: "Verified repo",
      title:
        snapshot.featuredAgents[0]?.shortDescription ??
        "Agents will surface here once published records exist.",
    },
    {
      label: "Prompt pack",
      title:
        snapshot.featuredPrompts[0]?.shortDescription ??
        "Prompt highlights will appear here once the prompt library has published items.",
    },
    {
      label: "Tutorial pulse",
      title:
        snapshot.featuredStories[0]?.excerpt ??
        "Tutorial and article excerpts will start driving this pulse as soon as content is published.",
    },
  ];

  return (
    <PublicShell>
      <section className="panel grid gap-6 overflow-hidden rounded-[2rem] px-4 py-8 sm:px-6 lg:grid-cols-[1.45fr_0.85fr] lg:px-8">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-border/80 bg-surface-2/80 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
            AI intelligence hub for agentic coders
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl lg:text-6xl">
              Track what changed in AI. Find what to use next.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              AgentRiot turns scattered repo updates, prompt discoveries,
              skills, and tutorials into one connected discovery surface for
              people building with agents every day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
              href="/agents"
            >
              Explore the hub
            </Link>
            <Link
              className="chip inline-flex min-h-12 items-center rounded-full px-5 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
              href={leadStoryHref}
            >
              See current signal
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          {snapshot.leadStory?.heroImageUrl ? (
            <PublicHeroMedia
              imageUrl={snapshot.leadStory.heroImageUrl}
              title={snapshot.leadStory.title}
            />
          ) : (
            <div className="grid-noise rounded-[1.5rem] border border-border/80 bg-surface-2/70 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                current posture
              </p>
              <p className="mt-3 max-w-sm text-sm leading-7 text-foreground">
                Discover agents, prompts, skills, tutorials, and articles for
                agentic coding. Search and explore the directory.
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "calm surface",
              "dense signal",
              "metadata first",
              "graph navigation",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-border/80 bg-background/80 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {signalItems.map((item) => (
          <article key={item.label} className="panel rounded-[1.5rem] p-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
              {item.label}
            </p>
            <p className="mt-4 text-base font-medium leading-7 text-foreground">
              {item.title}
            </p>
          </article>
        ))}
      </section>

      <section className="panel grid gap-5 rounded-[2rem] px-4 py-6 sm:px-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Lead story"
            title={
              snapshot.leadStory
                ? snapshot.leadStory.title
                : "The homepage will promote one strong story as soon as the first article or tutorial is published."
            }
            detail="One editorial lead, then graph links into the agents, prompts, skills, and tutorials that matter."
          />
          <p className="max-w-3xl text-base leading-8 text-muted">
            {snapshot.leadStory?.excerpt ??
              "Right now the landing page is wired for live data but intentionally honest about inventory. As records are published, this section becomes the main judgment layer instead of a generic feed."}
          </p>
          <div className="flex flex-wrap gap-2">
            {snapshot.leadStory ? (
              [
                snapshot.leadStory.kind,
                snapshot.leadStory.subtype ?? "published",
                "graph-linked",
              ].map((item) => (
                <span
                  key={item}
                  className="chip rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="chip rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                waiting for first published story
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {snapshot.leadStory?.heroImageUrl ? (
            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                media signal
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground">
                Lead stories can carry their own hero media now, so the homepage
                stops treating published editorial records like plain text blobs.
              </p>
            </div>
          ) : null}
          <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
              why this matters
            </p>
            <p className="mt-3 text-sm leading-7 text-foreground">
              The point is not volume. It is fast, connected context across the
              exact records agentic coders actually reuse.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
              jump points
            </p>
            <p className="mt-3 text-sm leading-7 text-foreground">
              Search, relation-driven detail pages, and scoped taxonomy now all
              exist as first-class navigation surfaces.
            </p>
          </div>
        </div>
      </section>

      <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
        <SectionHeading
          eyebrow="Featured agents"
          title="Tools agentic coders are actually using"
          detail="Published agent cards stay compact, technical, and graph-linked."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {snapshot.featuredAgents.length > 0 ? (
            snapshot.featuredAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 transition-transform hover:-translate-y-0.5"
              >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                  agent
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {agent.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {agent.shortDescription ?? "Published agent record"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 text-sm leading-7 text-muted lg:col-span-3">
              No published agents yet. Use the admin console to publish the
              first records and this section will populate automatically.
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
          <SectionHeading
            eyebrow="Model news"
            title="What shipped, what changed, and why it matters"
          />
          <div className="mt-6 grid gap-3">
            {snapshot.modelNews.length > 0 ? (
              snapshot.modelNews.map((story) => (
                <Link
                  key={story.id}
                  href={`/articles/${story.slug}`}
                  className="rounded-[1.4rem] border border-border/80 bg-background/80 px-4 py-4 transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                    {story.subtype ?? "news"}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {story.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {story.excerpt ?? "Published article"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-border/80 bg-background/80 px-4 py-4 text-sm leading-7 text-muted">
                No published news or release-note articles yet.
              </div>
            )}
          </div>
        </section>

        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6 xl:sticky xl:top-28 xl:h-fit">
          <SectionHeading
            eyebrow="Search-first"
            title="The graph is searchable now"
          />
          <div className="mt-6 rounded-[1.4rem] border border-border/80 bg-background/80 p-4">
            <div className="flex items-center justify-between gap-3 rounded-full border border-border/80 px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                route
              </span>
              <Link href="/search" className="text-sm text-foreground">
                /search
              </Link>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">
              Search now spans published agents, prompts, skills, tutorials, and
              articles from one route instead of dead-end section pages.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
          <SectionHeading
            eyebrow="Prompt packs"
            title="Reusable prompts with actual use cases"
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {snapshot.featuredPrompts.length > 0 ? (
              snapshot.featuredPrompts.map((prompt) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                    prompt
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {prompt.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {prompt.shortDescription ?? "Published prompt record"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 text-sm leading-7 text-muted sm:col-span-2">
                No published prompts yet.
              </div>
            )}
          </div>
        </section>

        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
          <SectionHeading
            eyebrow="Skills"
            title="Capabilities and workflows you can plug into the stack"
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {snapshot.featuredSkills.length > 0 ? (
              snapshot.featuredSkills.map((skill) => (
                <Link
                  key={skill.id}
                  href={`/skills/${skill.slug}`}
                  className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                    skill
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {skill.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {skill.shortDescription ?? "Published workflow record"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 text-sm leading-7 text-muted sm:col-span-2">
                No published skills yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
        <SectionHeading
          eyebrow="Stories"
          title="Published tutorials and articles stay connected"
          detail="One grid, mixed content types, all routeable into the graph."
        />
        <div className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {snapshot.featuredStories.length > 0 ? (
            snapshot.featuredStories.map((story) => (
              <Link
                key={`${story.kind}-${story.id}`}
                href={story.kind === "article" ? `/articles/${story.slug}` : `/tutorials/${story.slug}`}
                className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 transition-transform hover:-translate-y-0.5"
              >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                  {story.kind}
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground">
                  {story.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {story.excerpt ?? "Published story"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 text-sm leading-7 text-muted lg:col-span-2 xl:col-span-4">
              No published stories yet.
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
          <SectionHeading
            eyebrow="Trending topics"
            title="Scoped terms driving the graph"
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {snapshot.trendingTerms.length > 0 ? (
              snapshot.trendingTerms.map((term) => (
                <Link
                  key={term.id}
                  href={getPublicTaxonomyHref(term)}
                  className="chip rounded-full px-3 py-2 text-sm text-foreground"
                >
                  {term.label}
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                No taxonomy terms have been created yet.
              </p>
            )}
          </div>
        </section>

        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
          <SectionHeading
            eyebrow="Recently updated"
            title="Fresh movement across the graph"
          />
          <div className="mt-6 grid gap-3">
            {snapshot.recentUpdates.length > 0 ? (
              snapshot.recentUpdates.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className="rounded-[1.35rem] border border-border/80 bg-background/80 px-4 py-4 transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                    {item.label}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.note}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-border/80 bg-background/80 px-4 py-4 text-sm leading-7 text-muted">
                No published updates yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";
