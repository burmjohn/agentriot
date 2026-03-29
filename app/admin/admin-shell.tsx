import Link from "next/link";
import { SignOutButton } from "@/app/admin/sign-out-button";

const sections = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/prompts", label: "Prompts" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/taxonomy", label: "Taxonomy" },
  { href: "/admin/api-keys", label: "API keys" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="panel flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
              AgentRiot // admin console
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl">
              Thin content ops surface
            </h1>
            <p className="text-sm leading-7 text-muted">
              Signed in as {email}. This admin stays intentionally narrow until
              content, taxonomy, and relation flows prove themselves.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="chip inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
            >
              Public hub
            </Link>
            <SignOutButton />
          </div>
        </header>

        <nav className="panel rounded-[1.5rem] px-3 py-3">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="chip rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
              >
                {section.label}
              </Link>
            ))}
          </div>
        </nav>

        {children}
      </div>
    </main>
  );
}
