import Link from "next/link";
import { PublicPageHeader, PublicPanel, PublicShell } from "@/app/_components/public-ui";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "API",
  description:
    "Machine-readable outputs and current access surfaces for the published AgentRiot graph.",
  path: "/api",
});

export default function ApiPage() {
  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="API"
        title="Machine-readable access starts with stable public outputs"
        detail="The public read API is now live, alongside feeds, crawl guidance, and the rest of the machine-readable graph surfaces."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PublicPanel
          title="Available now"
          detail="These routes are the supported machine surfaces for published graph access and trusted publishing."
        >
          <div className="grid gap-3">
            {[
              {
                href: "/api/v1",
                title: "Public read API index",
                detail: "Versioned entry point for the current read-only graph routes.",
                method: "GET",
              },
              {
                href: "/api/v1/articles",
                title: "Article collection",
                detail: "Published article records, with optional taxonomy filtering.",
                method: "GET",
              },
              {
                href: "/api/v1/ingest/agents",
                title: "Agent ingestion",
                detail: "Authenticated create-only publishing for trusted agent directory updates.",
                method: "POST",
              },
              {
                href: "/api/v1/ingest/prompts",
                title: "Prompt ingestion",
                detail: "Authenticated create-only publishing for trusted prompt library updates.",
                method: "POST",
              },
              {
                href: "/api/v1/ingest/skills",
                title: "Skill ingestion",
                detail: "Authenticated create-only publishing for trusted skill directory updates.",
                method: "POST",
              },
              {
                href: "/api/v1/ingest/taxonomy",
                title: "Taxonomy ingestion",
                detail: "Authenticated create-only publishing for shared graph taxonomy terms.",
                method: "POST",
              },
              {
                href: "/api/v1/search?q=repo",
                title: "Search",
                detail: "Published graph search across content, agents, prompts, and skills.",
                method: "GET",
              },
              {
                href: "/feed.xml",
                title: "RSS feed",
                detail: "Latest published graph updates in RSS format.",
                method: "GET",
              },
              {
                href: "/feed.json",
                title: "JSON feed",
                detail: "Latest published graph updates in JSON Feed 1.1 format.",
                method: "GET",
              },
              {
                href: "/llms.txt",
                title: "llms.txt",
                detail: "A compact machine-facing index of the public graph.",
                method: "GET",
              },
              {
                href: "/sitemap.xml",
                title: "sitemap.xml",
                detail: "Canonical crawl map for public records and collection routes.",
                method: "GET",
              },
              {
                href: "/robots.txt",
                title: "robots.txt",
                detail: "Crawler policy for public routes and private admin surfaces.",
                method: "GET",
              },
            ].map((item) => (
              item.method === "GET" ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    {item.method} {item.href}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.detail}</p>
                </Link>
              ) : (
                <div
                  key={item.href}
                  className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4"
                >
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    {item.method} {item.href}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.detail}</p>
                  <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    Bearer auth required
                  </p>
                </div>
              )
            ))}
          </div>
        </PublicPanel>

        <PublicPanel
          title="Planned next"
          detail="The read API is live. The next deferred platform work is taxonomy assignment and relation mutation, not another create-only catalog endpoint."
        >
          <div className="grid gap-4 text-sm leading-7 text-muted">
            <p>
              The current read API ships off the same public graph queries as the site. That
              keeps the machine surface and the human surface on one data model.
            </p>
            <p>
              Agent, prompt, skill, and taxonomy ingestion now join the machine surface. The next
              platform step is taxonomy assignment and richer relation mutation, not a second read
              surface.
            </p>
          </div>
        </PublicPanel>
      </div>
    </PublicShell>
  );
}
