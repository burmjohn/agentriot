import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PillTag } from "@/components/ui/pill-tag";

export interface SoftwareCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  description: string;
  tag: string;
  tagVariant?: React.ComponentProps<typeof PillTag>["variant"];
  href: string;
  category?: string;
}

const SoftwareCard = React.forwardRef<HTMLDivElement, SoftwareCardProps>(
  (
    {
      className,
      name,
      description,
      tag,
      tagVariant = "ultraviolet",
      href,
      category,
      ...props
    },
    ref
  ) => {
    return (
      <Link href={href} className="block group">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-[20px] border border-white bg-[#131313] p-6 transition-colors duration-150 ease-out h-full",
            className
          )}
          {...props}
        >
          <div className="mb-4 flex items-center gap-3">
            <PillTag variant={tagVariant}>{tag}</PillTag>
            {category && (
              <span className="text-label-xs text-[#949494]">{category}</span>
            )}
          </div>

          <h3 className="text-headline-md text-white transition-colors duration-150 ease-out group-hover:text-[#3860be]">
            {name}
          </h3>

          <p className="mt-3 text-body-compact text-[#949494] line-clamp-3">
            {description}
          </p>
        </div>
      </Link>
    );
  }
);
SoftwareCard.displayName = "SoftwareCard";

export { SoftwareCard };
