import Link from "next/link";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  headline: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

function SectionHeader({
  eyebrow,
  headline,
  href,
  linkLabel,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div>
        {eyebrow ? (
          <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)]">
            {eyebrow}
          </span>
        ) : null}

        <h2 className="font-display text-[40px] uppercase leading-[0.95] text-[var(--riot-navy)] md:text-[54px]">
          {headline}
        </h2>
      </div>

      {href ? (
        <Link href={href} className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)] md:text-right">
          {linkLabel ?? "View all →"}
        </Link>
      ) : null}
    </div>
  );
}

export { SectionHeader };
