import Link from "next/link";
import { PublicPageHeader, PublicPanel, PublicShell } from "@/app/_components/public-ui";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "API",
  description: "Public API endpoints for accessing AgentRiot content.",
  path: "/api",
});

export default function ApiPage() {
  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="API"
        title="Public API"
        detail="Access agents, prompts, skills, and content programmatically."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PublicPanel
          title="Public Endpoints"
          detail="Read-only endpoints available to everyone."
        >
          <div className="grid gap-3">
            {[
              {
                href: "/api/v1",
                title: "API Index",
                detail: "Overview of available endpoints.",
                method: "GET",
              },
              {
                href: "/api/v1/articles",
                title: "Articles",
                detail: "Browse published articles.",
                method: "GET",
              },
              {
                href: "/api/v1/agents",
                title: "Agents",
                detail: "Browse the agent directory.",
                method: "GET",
              },
              {
                href: "/api/v1/prompts",
                title: "Prompts",
                detail: "Browse the prompt library.",
                method: "GET",
              },
              {
                href: "/api/v1/skills",
                title: "Skills",
                detail: "Browse available skills.",
                method: "GET",
              },
              {
                href: "/api/v1/search?q=repo",
                title: "Search",
                detail: "Search across all content.",
                method: "GET",
              },
              {
                href: "/feed.xml",
                title: "RSS Feed",
                detail: "Latest updates in RSS format.",
                method: "GET",
              },
              {
                href: "/feed.json",
                title: "JSON Feed",
                detail: "Latest updates in JSON format.",
                method: "GET",
              },
              {
                href: "/llms.txt",
                title: "LLMs.txt",
                detail: "Index for AI assistants.",
                method: "GET",
              },
              {
                href: "/sitemap.xml",
                title: "Sitemap",
                detail: "XML sitemap for crawlers.",
                method: "GET",
              },
            ].map((item) => (
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
            ))}
          </div>
        </PublicPanel>

        <PublicPanel
          title="Authenticated Endpoints"
          detail="Write access requires API key authentication."
        >
          <div className="grid gap-3">
            {[
              {
                href: "/api/v1/ingest/agents",
                title: "Create Agent",
                detail: "Add a new agent to the directory.",
              },
              {
                href: "/api/v1/ingest/prompts",
                title: "Create Prompt",
                detail: "Add a new prompt to the library.",
              },
              {
                href: "/api/v1/ingest/skills",
                title: "Create Skill",
                detail: "Add a new skill to the directory.",
              },
            ].map((item) => (
              <div
                key={item.href}
                className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4"
              >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  POST {item.href}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">{item.detail}</p>
                <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  API key required
                </p>
              </div>
            ))}
          </div>
        </PublicPanel>
      </div>
    </PublicShell>
  );
}
