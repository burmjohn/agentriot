"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PillButton } from "./pill-button";
import { ThemeToggle } from "@/components/public/theme-toggle";

export interface NavShellProps extends React.HTMLAttributes<HTMLElement> {
  wordmark?: string;
  links?: Array<{ label: string; href: string; active?: boolean }>;
  ctaLabel?: string;
  ctaHref?: string;
}

const NavShell = React.forwardRef<HTMLElement, NavShellProps>(
  (
    {
      className,
      wordmark = "AGENTRIOT",
      links = [
        { label: "NEWS", href: "/news" },
        { label: "SOFTWARE", href: "/software" },
        { label: "AGENTS", href: "/agents" },
        { label: "ABOUT", href: "/about" },
      ],
      ctaLabel = "SUBSCRIBE",
      ctaHref = "/join",
      ...props
    },
    ref
  ) => {
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && drawerOpen) {
          setDrawerOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [drawerOpen]);

    React.useEffect(() => {
      if (drawerOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [drawerOpen]);

    return (
      <>
        <header
          ref={ref}
          className={cn(
            "sticky top-0 z-50 w-full bg-canvas",
            className
          )}
          {...props}
        >
          <div className="mx-auto max-w-[1300px] px-4 sm:px-6">
            <div className="flex items-end justify-between py-3 sm:py-4 md:py-5">
              <Link
                href="/"
                className="font-display text-[48px] sm:text-[60px] md:text-[80px] lg:text-[107px] tracking-tight text-foreground hover:text-foreground shrink-0 leading-[0.92] whitespace-nowrap"
                style={{ fontWeight: 900 }}
              >
                {wordmark}
              </Link>
            </div>
          </div>

          <div className="border-t border-border">
            <div className="mx-auto flex h-10 sm:h-11 md:h-12 max-w-[1300px] items-center justify-between px-4 sm:px-6">
              <nav className="hidden items-center gap-6 md:gap-8 md:flex">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "font-mono-label text-foreground transition-colors duration-150 ease-out hover:text-deep-link text-[11px] sm:text-[12px] tracking-[0.1125rem]",
                      link.active && "tab-active"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-3 md:gap-4 shrink-0 ml-auto">
                <div className="hidden md:flex items-center gap-3">
                  <Link href={ctaHref}>
                    <PillButton variant="primary">{ctaLabel}</PillButton>
                  </Link>
                  <ThemeToggle />
                </div>

                <button
                  type="button"
                  aria-label="Open navigation menu"
                  data-testid="mobile-nav-toggle"
                  className="md:hidden inline-flex items-center justify-center p-2 text-foreground hover:text-deep-link transition-colors"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/60"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div
              data-testid="mobile-nav-drawer"
              className="fixed inset-y-0 right-0 z-[70] w-full max-w-[320px] bg-canvas border-l border-border flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <span className="font-display text-2xl tracking-tight text-foreground">
                  {wordmark}
                </span>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    data-testid="mobile-nav-close"
                    className="inline-flex items-center justify-center p-2 text-foreground hover:text-deep-link transition-colors"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <nav className="flex flex-col gap-5 px-6 py-8">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "font-mono-label text-foreground transition-colors duration-150 ease-out hover:text-deep-link py-2 text-[12px] tracking-[0.1125rem]",
                      link.active && "tab-active"
                    )}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto px-6 py-8 border-t border-border">
                <Link href={ctaHref} onClick={() => setDrawerOpen(false)}>
                  <PillButton variant="primary" className="w-full">
                    {ctaLabel}
                  </PillButton>
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
