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
          <span className="mb-2 block text-label-light text-secondary-gray">
            {eyebrow}
          </span>
        ) : null}

        <h2 className="font-display text-display-md text-white">{headline}</h2>
      </div>

      {href ? (
        <Link href={href} className="text-label-light text-mint md:text-right">
          {linkLabel ?? "View all →"}
        </Link>
      ) : null}
    </div>
  );
}

export { SectionHeader };
