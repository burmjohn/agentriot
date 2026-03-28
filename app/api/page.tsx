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
        detail="The public read API is deferred, but the published graph already exposes structured entry points for feeds, crawl guidance, and agent discovery."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PublicPanel
          title="Available now"
          detail="These routes are the supported phase-1 machine surfaces."
        >
          <div className="grid gap-3">
            {[
              {
                href: "/feed.xml",
                title: "RSS feed",
                detail: "Latest published graph updates in RSS format.",
              },
              {
                href: "/feed.json",
                title: "JSON feed",
                detail: "Latest published graph updates in JSON Feed 1.1 format.",
              },
              {
                href: "/llms.txt",
                title: "llms.txt",
                detail: "A compact machine-facing index of the public graph.",
              },
              {
                href: "/sitemap.xml",
                title: "sitemap.xml",
                detail: "Canonical crawl map for public records and collection routes.",
              },
              {
                href: "/robots.txt",
                title: "robots.txt",
                detail: "Crawler policy for public routes and private admin surfaces.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4 transition-transform hover:-translate-y-0.5"
              >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  {item.href}
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
          title="Planned next"
          detail="The public API is intentionally deferred until the schema and editorial workflows settle."
        >
          <div className="grid gap-4 text-sm leading-7 text-muted">
            <p>
              Phase 2 will expose a versioned read API over the published graph after the
              current schema, routing, and relation model have been validated through manual
              editorial use.
            </p>
            <p>
              That keeps the public machine surface stable instead of shipping an API we need
              to break immediately.
            </p>
          </div>
        </PublicPanel>
      </div>
    </PublicShell>
  );
}
