import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PillTag } from "@/components/ui/pill-tag";

export interface PillarCardProps extends React.HTMLAttributes<HTMLDivElement> {
  number: string;
  headline: string;
  deck: string;
  tag: string;
  tagVariant?: React.ComponentProps<typeof PillTag>["variant"];
  href: string;
  accentColor?: string;
}

const PillarCard = React.forwardRef<HTMLDivElement, PillarCardProps>(
  (
    {
      className,
      number,
      headline,
      deck,
      tag,
      tagVariant = "mint",
      href,
      accentColor = "#3cffd0",
      ...props
    },
    ref
  ) => {
    return (
      <Link href={href} className="block group">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-[24px] border border-white bg-[#131313] p-8 transition-colors duration-150 ease-out h-full",
            className
          )}
          {...props}
        >
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: accentColor }}
          />

          <div className="flex items-center justify-between mb-6">
            <PillTag variant={tagVariant}>{tag}</PillTag>
            <span
              className="font-display text-[4rem] leading-none font-black opacity-10 select-none"
              style={{ color: accentColor }}
            >
              {number}
            </span>
          </div>

          <span className="block text-label-light text-[#949494] mb-3">
            PILLAR {number}
          </span>

          <h3 className="text-headline-lg text-white transition-colors duration-150 ease-out group-hover:text-[#3860be]">
            {headline}
          </h3>

          <p className="mt-4 text-body-relaxed text-[#e9e9e9]">
            {deck}
          </p>
        </div>
      </Link>
    );
  }
);
PillarCard.displayName = "PillarCard";

export { PillarCard };
