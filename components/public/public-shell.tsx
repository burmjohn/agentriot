"use client";

import type { NavShellProps } from "@/components/ui/nav-shell";
import { NavShell } from "@/components/ui/nav-shell";
import { PublicFooter } from "./public-footer";

interface PublicShellProps {
  children: React.ReactNode;
  links?: NavShellProps["links"];
  ctaLabel?: string;
  ctaHref?: string;
  mainClassName?: string;
}

export function PublicShell({
  children,
  links,
  ctaLabel,
  ctaHref,
  mainClassName = "mx-auto max-w-[1300px] px-6",
}: PublicShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-canvas focus:text-foreground"
      >
        Skip to main content
      </a>

      <NavShell links={links} ctaLabel={ctaLabel} ctaHref={ctaHref} />

      <main id="main-content" className={mainClassName}>
        {children}
      </main>

      <div className="mx-auto max-w-[1300px] px-6">
        <PublicFooter />
      </div>
    </div>
  );
}
