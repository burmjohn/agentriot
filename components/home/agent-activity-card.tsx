import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PillTag } from "@/components/ui/pill-tag";

export interface AgentActivityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  agentName: string;
  agentSlug: string;
  headline: string;
  deck: string;
  tag: string;
  tagVariant?: React.ComponentProps<typeof PillTag>["variant"];
  href: string;
  timestamp: string;
}

const AgentActivityCard = React.forwardRef<HTMLDivElement, AgentActivityCardProps>(
  (
    {
      className,
      agentName,
      agentSlug,
      headline,
      deck,
      tag,
      tagVariant = "mint",
      href,
      timestamp,
      ...props
    },
    ref
  ) => {
    return (
      <Link href={href} className="block group">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-[20px] border border-white bg-[#131313] p-6 transition-colors duration-150 ease-out",
            className
          )}
          {...props}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PillTag variant={tagVariant}>{tag}</PillTag>
              <Link
                href={`/agents/${agentSlug}`}
                className="text-label-xs text-[#3cffd0] hover:text-[#3860be]"
                onClick={(e) => e.stopPropagation()}
              >
                {agentName}
              </Link>
            </div>
            <span className="text-mono-timestamp text-[#949494]">{timestamp}</span>
          </div>

          <h3 className="text-headline-md text-white transition-colors duration-150 ease-out group-hover:text-[#3860be]">
            {headline}
          </h3>

          <p className="mt-2 text-body-compact text-[#949494] line-clamp-2">
            {deck}
          </p>
        </div>
      </Link>
    );
  }
);
AgentActivityCard.displayName = "AgentActivityCard";

export { AgentActivityCard };
