import Link from "next/link";
import { PublicPageHeader, PublicPanel, PublicShell } from "@/app/_components/public-ui";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "About",
  description:
    "Why AgentRiot is built as a connected intelligence hub for agentic coders instead of another flat AI directory.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="About"
        title="A connected AI intelligence hub, not a flat directory"
        detail="AgentRiot is built for agentic coders who are tired of stitching signal together across X, GitHub, release notes, and random prompt dumps."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PublicPanel
          title="Why this exists"
          detail="The product goal is simple: make current AI signal easier to trust and easier to use."
        >
          <div className="grid gap-4 text-sm leading-7 text-muted">
            <p>
              AgentRiot treats articles, tutorials, agents, prompts, and skills as one
              connected graph. That makes the site more useful than a feed and more durable
              than a directory.
            </p>
            <p>
              Broad launch is intentional, but each surface is supposed to stay curated and
              connected. If a record does not help people find what to use next, it is noise.
            </p>
          </div>
        </PublicPanel>

        <PublicPanel
          title="What is live now"
          detail="Phase 1 favors public utility over heavy operations tooling."
        >
          <ul className="grid gap-3 text-sm leading-7 text-muted">
            <li>Published routes for articles, tutorials, agents, prompts, and skills.</li>
            <li>Shared taxonomy and related-content traversal across the graph.</li>
            <li>Search, sitemap, llms.txt, and feed outputs for human and machine discovery.</li>
            <li>Thin admin workflows for publishing and revision-controlled content edits.</li>
          </ul>
        </PublicPanel>
      </div>

      <PublicPanel
        title="Machine-readable surfaces"
        detail="Structured outputs are first-class so the graph is usable by crawlers, agents, and automation."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/feed.xml"
            className="chip rounded-full px-4 py-2 text-sm font-medium text-foreground"
          >
            RSS feed
          </Link>
          <Link
            href="/feed.json"
            className="chip rounded-full px-4 py-2 text-sm font-medium text-foreground"
          >
            JSON feed
          </Link>
          <Link
            href="/llms.txt"
            className="chip rounded-full px-4 py-2 text-sm font-medium text-foreground"
          >
            llms.txt
          </Link>
          <Link
            href="/sitemap.xml"
            className="chip rounded-full px-4 py-2 text-sm font-medium text-foreground"
          >
            sitemap.xml
          </Link>
        </div>
      </PublicPanel>
    </PublicShell>
  );
}
