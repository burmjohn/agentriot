"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavShellProps extends React.HTMLAttributes<HTMLElement> {
  wordmark?: string;
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
}

type NavLink = { label: string; href: string; active?: boolean };

const defaultLinks: NavLink[] = [
  { label: "NEWS", href: "/news" },
  { label: "SOFTWARE", href: "/software" },
  { label: "AGENTS", href: "/agents" },
  { label: "PROMPTS", href: "/prompts" },
  { label: "FEED", href: "/feed" },
  { label: "RESOURCES", href: "/agent-instructions" },
  { label: "ABOUT", href: "/about" },
];

const NavShell = React.forwardRef<HTMLElement, NavShellProps>(
  (
    {
      className,
      wordmark = "AgentRiot",
      links = [...defaultLinks],
      ctaLabel = "JOIN THE RIOT",
      ctaHref = "/join",
      ...props
    },
    ref
  ) => {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const pathname = usePathname() ?? "/";
    const resolvedLinks = React.useMemo(
      () =>
        links.map((link) => ({
          ...link,
          active:
            link.active ??
            (pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(`${link.href}/`))),
        })),
      [links, pathname],
    );

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setDrawerOpen(false);
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    React.useEffect(() => {
      document.body.style.overflow = drawerOpen ? "hidden" : "";
      return () => {
        document.body.style.overflow = "";
      };
    }, [drawerOpen]);

    return (
      <>
        <header
          ref={ref}
          className={cn(
            "sticky top-0 z-50 border-b border-[var(--riot-border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/88",
            className
          )}
          {...props}
        >
          <div className="mx-auto flex h-[82px] max-w-[1180px] items-center justify-between px-[38px] max-md:h-[64px] max-md:px-[20px]">
            <Link
              href="/"
              aria-label={wordmark}
              className="relative block h-[42px] w-[178px] shrink-0 max-md:h-[32px] max-md:w-[136px]"
            >
              <Image
                src="/brand/agentriot-logo-exact.png"
                alt="AgentRiot"
                fill
                priority
                unoptimized
                className="object-contain object-left"
              />
            </Link>

            <nav className="hidden items-center gap-[42px] md:flex">
              {resolvedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[13px] font-semibold leading-none text-[var(--riot-navy)] transition-colors hover:text-[var(--riot-blue)]",
                    link.active && "text-[var(--riot-blue)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-[14px] md:flex">
              <button
                type="button"
                aria-label="Search"
                className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-[8px] bg-[#F2F5FA] text-[var(--riot-navy)] transition-colors hover:bg-[#E8EEF7] focus-visible:outline-focus-cyan"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
              <Link
                href={ctaHref}
                className="inline-flex h-[46px] items-center justify-center rounded-[8px] bg-[var(--riot-orange)] px-[22px] font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#E83F1A] focus-visible:outline-focus-cyan"
              >
                {ctaLabel}
              </Link>
            </div>

            <button
              type="button"
              aria-label="Open navigation menu"
              data-testid="mobile-nav-toggle"
              className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-[8px] bg-[#F2F5FA] text-[var(--riot-navy)] md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-[20px] w-[20px]" />
            </button>
          </div>
        </header>

        {drawerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-[var(--riot-navy)]/60"
              aria-label="Close navigation menu overlay"
              onClick={() => setDrawerOpen(false)}
            />
            <div
              data-testid="mobile-nav-drawer"
              className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[340px] flex-col border-l border-[var(--riot-border)] bg-white"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between border-b border-[var(--riot-border)] px-6 py-5">
                <Link
                  href="/"
                  aria-label={wordmark}
                  className="relative block h-[36px] w-[152px]"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Image
                    src="/brand/agentriot-logo-exact.png"
                    alt="AgentRiot"
                    fill
                    priority
                    unoptimized
                    className="object-contain object-left"
                  />
                </Link>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  data-testid="mobile-nav-close"
                  className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-[8px] bg-[#F2F5FA] text-[var(--riot-navy)]"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="h-[20px] w-[20px]" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 px-6 py-6">
                {resolvedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-[8px] px-3 py-3 text-[15px] font-semibold text-[var(--riot-navy)] hover:bg-[#F2F5FA]"
                    onClick={() => setDrawerOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-[var(--riot-border)] px-6 py-6">
                <Link
                  href={ctaHref}
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-[48px] w-full items-center justify-center rounded-[8px] bg-[var(--riot-orange)] font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-white"
                >
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </>
        )}
      </>
    );
  }
);

NavShell.displayName = "NavShell";

export { NavShell };
