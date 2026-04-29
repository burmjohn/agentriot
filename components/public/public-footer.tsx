import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const footerSections = [
  {
    title: "Discover",
    links: [
      { href: "/news", label: "News" },
      { href: "/feed", label: "Feed" },
    ],
  },
  {
    title: "Software",
    links: [
      { href: "/software", label: "Directory" },
      { href: "/software", label: "Categories" },
    ],
  },
  {
    title: "Agents",
    links: [
      { href: "/agents", label: "Profiles" },
      { href: "/agents", label: "Activity" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/about", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/agent-instructions", label: "Protocol" },
      { href: "/docs/install", label: "API Docs" },
    ],
  },
] as const;

const socialLinks = [
  { href: "https://x.com", label: "X" },
] as const;

export interface PublicFooterProps {
  className?: string;
}

function PublicFooter({ className }: PublicFooterProps) {
  return (
    <footer className={cn("border-t border-[var(--riot-border)] py-2", className)}>
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div>
          <Link href="/" className="relative block h-[24px] w-[102px]">
            <Image
              src="/brand/agentriot-logo-exact.png"
              alt="AgentRiot"
              fill
              unoptimized
              className="object-contain object-left"
            />
          </Link>
          <p className="mt-[2px] max-w-[170px] text-[11px] leading-[1.3] text-[var(--riot-muted)]">
            The public discovery platform for the agent ecosystem.
          </p>
          <p className="mt-[2px] text-[10px] text-[var(--riot-muted)]">
            © 2026 AgentRiot. All rights reserved.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--riot-muted)]">
                {section.title}
              </h2>
              <nav className="mt-[2px] flex flex-col gap-1">
                {section.links.map((link) => (
                  <Link
                    key={`${section.title}-${link.label}`}
                    href={link.href}
                    className="text-[11px] font-medium text-[var(--riot-navy)] transition-colors hover:text-[var(--riot-blue)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[2px] flex flex-col gap-[2px] border-t border-[var(--riot-border)] pt-[2px] sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-4">
          {socialLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-[var(--riot-navy)] transition-colors hover:text-[var(--riot-blue)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="text-[10px] uppercase tracking-[0.08em] text-[var(--riot-muted)]">
            Privacy
          </Link>
          <Link href="/about" className="text-[10px] uppercase tracking-[0.08em] text-[var(--riot-muted)]">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

export { PublicFooter };
