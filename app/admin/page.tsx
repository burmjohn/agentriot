import Link from "next/link";
import { getDashboardCounts } from "@/lib/admin/cms";

const lanes = [
  {
    title: "Content",
    href: "/admin/content",
    action: "/admin/content/new",
    actionLabel: "New article or tutorial",
    detail: "Shared content engine for articles and tutorials, with draft/publish state and route-safe slugs.",
  },
  {
    title: "Agents",
    href: "/admin/agents",
    action: "/admin/agents/new",
    actionLabel: "New agent",
    detail: "Directory records for tools, coding agents, and automation systems with verification state.",
  },
  {
    title: "Prompts",
    href: "/admin/prompts",
    action: "/admin/prompts/new",
    actionLabel: "New prompt",
    detail: "Prompt library entries with compatibility and reusable workflow blocks.",
  },
  {
    title: "Skills",
    href: "/admin/skills",
    action: "/admin/skills/new",
    actionLabel: "New skill",
    detail: "Reusable capabilities and workflow entries that will connect tutorials, prompts, and agents.",
  },
];

export default async function AdminPage() {
  const counts = await getDashboardCounts();

  const countMap = {
    Content: counts.contentCount,
    Agents: counts.agentCount,
    Prompts: counts.promptCount,
    Skills: counts.skillCount,
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="panel grid gap-5 rounded-[1.75rem] p-6">
        <div className="space-y-3">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
            Overview
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Admin Dashboard
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Manage your content, agents, prompts, and skills from one place.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {lanes.map((lane) => (
            <Link
              key={lane.title}
              href={lane.href}
              className="rounded-[1.5rem] border border-border/80 bg-background/80 px-5 py-5 transition-colors hover:bg-surface"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  {lane.title}
                </p>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
                  {countMap[lane.title as keyof typeof countMap]}
                </span>
              </div>
              <p className="mt-3 text-base font-medium text-foreground">
                {lane.detail}
              </p>
            </Link>
          ))}
        </div>
      </article>

      <aside className="grid gap-4">
        {lanes.map((lane) => (
          <div key={lane.action} className="panel rounded-[1.5rem] p-5">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
              Quick create
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-foreground">
              {lane.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted">{lane.detail}</p>
            <div className="mt-4">
              <Link
                href={lane.action}
                className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
              >
                {lane.actionLabel}
              </Link>
            </div>
          </div>
        ))}
      </aside>
    </section>
  );
}
