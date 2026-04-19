import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PillButton } from "./pill-button";

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
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b border-white/10 bg-[#131313]/95 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <div className="mx-auto flex h-14 max-w-[1300px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-2xl tracking-tight text-white hover:text-white"
          >
            {wordmark}
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-mono-timestamp text-white transition-colors duration-150 ease-out hover:text-[#3860be]",
                  link.active && "tab-active pb-3 pt-3"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href={ctaHref}>
              <PillButton variant="primary" size="sm">{ctaLabel}</PillButton>
            </Link>
          </div>
        </div>
      </header>
    );
  }
);
NavShell.displayName = "NavShell";

export { NavShell };
