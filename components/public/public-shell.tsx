"use client";

import type { NavShellProps } from "@/components/ui/nav-shell";
import { NavShell } from "@/components/ui/nav-shell";
import { cn } from "@/lib/utils";

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
  mainClassName,
}: PublicShellProps) {
  return (
    <div className="agentriot-public min-h-screen bg-white text-[var(--riot-navy)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-4 focus:text-[var(--riot-navy)]"
      >
        Skip to main content
      </a>

      <NavShell links={links} ctaLabel={ctaLabel} ctaHref={ctaHref} />

      <main
        id="main-content"
        className={cn("mx-auto max-w-[1055px]", mainClassName)}
      >
        {children}
      </main>

      <div className="mx-auto max-w-[1055px] px-[38px] max-md:px-[20px]">
        <PublicFooter />
      </div>
    </div>
  );
}
