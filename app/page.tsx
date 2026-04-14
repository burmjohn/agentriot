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
      label: "Lead story",
      title: snapshot.leadStory
        ? snapshot.leadStory.title
        : "Publish an article or tutorial to feature the latest story here.",
    },
    {
      label: "Featured agent",
      title:
        snapshot.featuredAgents[0]?.shortDescription ??
        "Featured agents appear here once published.",
    },
    {
      label: "Featured prompt",
      title:
        snapshot.featuredPrompts[0]?.shortDescription ??
        "Featured prompts appear here once published.",
    },
    {
      label: "Featured story",
      title:
        snapshot.featuredStories[0]?.excerpt ??
        "Featured tutorials and articles appear here once published.",
    },
  ];

  return (
    <PublicShell>
      <section className="panel grid gap-6 overflow-hidden rounded-[2rem] px-4 py-8 sm:px-6 lg:grid-cols-[1.45fr_0.85fr] lg:px-8">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-border/80 bg-surface-2/80 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted">
            Connected discovery for agentic coding
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl lg:text-6xl">
              The connected discovery surface for agentic coding.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              One place to find agents, prompts, skills, tutorials, and articles
              for agentic coding.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
              href="/agents"
            >
              Browse the directory
            </Link>
            <Link
              className="chip inline-flex min-h-12 items-center rounded-full px-5 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
              href={leadStoryHref}
            >
              Read the latest
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
                Browse agents, prompts, skills, tutorials, and articles for
                agentic coding. Search and explore the directory.
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Curated directory",
              "Connected records",
              "Technical focus",
              "Linked discovery",
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
                : "Lead stories appear here once articles or tutorials are published."
            }
            detail="The latest editorial lead, with links to related agents, prompts, skills, and tutorials."
          />
          <p className="max-w-3xl text-base leading-8 text-muted">
            {snapshot.leadStory?.excerpt ??
              "The lead story slot shows the most recent article or tutorial as soon as content is published."}
          </p>
          <div className="flex flex-wrap gap-2">
            {snapshot.leadStory ? (
              [
                snapshot.leadStory.kind,
                snapshot.leadStory.subtype ?? "published",
                "linked",
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
                no published stories yet
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
                Lead stories include hero images when available, so editorial
                content stands out.
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
              Search, detail pages, and taxonomy filters all work as first-class
              navigation.
            </p>
          </div>
        </div>
      </section>

      <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
        <SectionHeading
          eyebrow="Featured agents"
          title="Tools agentic coders are actually using"
          detail="Compact, technical cards for agents worth tracking."
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
                  {agent.shortDescription ?? "Agent record"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 text-sm leading-7 text-muted lg:col-span-3">
              No agents published yet. New records appear here automatically.
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
                    {story.excerpt ?? "Article"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-border/80 bg-background/80 px-4 py-4 text-sm leading-7 text-muted">
                No news articles published yet.
              </div>
            )}
          </div>
        </section>

        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6 xl:sticky xl:top-28 xl:h-fit">
          <SectionHeading
            eyebrow="Search-first"
            title="Search across everything"
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
              Find agents, prompts, skills, tutorials, and articles from a single
              search.
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
                    {prompt.shortDescription ?? "Prompt"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 text-sm leading-7 text-muted sm:col-span-2">
                No prompts published yet.
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
                    {skill.shortDescription ?? "Skill"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 text-sm leading-7 text-muted sm:col-span-2">
                No skills published yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
        <SectionHeading
          eyebrow="Stories"
          title="Tutorials and articles"
          detail="Guides and editorial content, linked to related records."
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
                  {story.excerpt ?? "Story"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-border/80 bg-background/80 p-4 text-sm leading-7 text-muted lg:col-span-2 xl:col-span-4">
              No tutorials or articles published yet.
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel rounded-[2rem] px-4 py-6 sm:px-6">
          <SectionHeading
            eyebrow="Trending topics"
            title="Topics across the directory"
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
            title="Recently updated records"
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
                No updates published yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";
