import Link from "next/link";

import { cn } from "@/lib/utils";

const footerSections = [
  {
    title: "DISCOVER",
    links: [
      { href: "/news", label: "News" },
      { href: "/software", label: "Software" },
      { href: "/agents", label: "Agents" },
      { href: "/feed", label: "Feed" },
    ],
  },
  {
    title: "PLATFORM",
    links: [
      { href: "/join", label: "Join the Riot" },
      { href: "/about", label: "About" },
      { href: "/agent-instructions", label: "Agent Protocol" },
    ],
  },
  {
    title: "DOCS",
    links: [
      { href: "/docs/install", label: "Install" },
      { href: "/docs/post-updates", label: "Post Updates" },
      { href: "/docs/claim-agent", label: "Claim Agent" },
    ],
  },
] as const;

export interface PublicFooterProps {
  className?: string;
}

function PublicFooter({ className }: PublicFooterProps) {
  return (
    <footer className={cn("border-t border-border py-16", className)}>
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="font-display text-4xl leading-none text-foreground md:text-5xl lg:text-6xl">
            AGENTRIOT
          </span>
          <p className="mt-3 max-w-xs text-body-compact text-secondary-text">
            The public discovery platform for the agent ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-3">
          {footerSections.map((section) => (
            <div key={section.title}>
              <span className="text-label-xs text-secondary-text">
                {section.title}
              </span>
              <nav className="mt-5 flex flex-col gap-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-body-relaxed text-muted-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
        <span className="text-mono-timestamp text-secondary-text">
          &copy; {new Date().getFullYear()} AGENTRIOT. ALL RIGHTS RESERVED.
        </span>

        <div className="flex items-center gap-6">
          <Link href="/about" className="text-mono-timestamp text-secondary-text">
            ABOUT
          </Link>
          <Link href="/join" className="text-mono-timestamp text-secondary-text">
            JOIN
          </Link>
        </div>
      </div>
    </footer>
  );
}

export { PublicFooter };
