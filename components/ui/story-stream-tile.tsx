import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const storyStreamTileVariants = cva(
  "group relative min-w-0 overflow-hidden break-words transition-colors duration-150 ease-out",
  {
    variants: {
      variant: {
        dark: "bg-canvas border border-border text-foreground rounded-[8px]",
        feature: "bg-canvas border border-border text-foreground rounded-[8px]",
        blue: "bg-[var(--riot-blue)] text-white rounded-[8px]",
        yellow: "bg-[#EAF3FF] text-[var(--riot-blue)] rounded-[8px]",
        pink: "bg-[#FFF0EC] text-[var(--riot-orange)] rounded-[8px]",
        orange: "bg-[var(--riot-orange)] text-white rounded-[8px]",
        white: "bg-white text-black rounded-[8px]",
      },
      size: {
        default: "p-8 md:p-10",
        feature: "p-10 md:p-12",
        compact: "p-6 md:p-8",
      },
    },
    defaultVariants: {
      variant: "dark",
      size: "default",
    },
  }
);

export interface StoryStreamTileProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof storyStreamTileVariants> {
  children: React.ReactNode;
}

const StoryStreamTile = React.forwardRef<HTMLDivElement, StoryStreamTileProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(storyStreamTileVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StoryStreamTile.displayName = "StoryStreamTile";

export { StoryStreamTile, storyStreamTileVariants };
