import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const storyStreamTileVariants = cva(
  "relative overflow-hidden transition-colors duration-150 ease-out",
  {
    variants: {
      variant: {
        dark: "bg-[#131313] border border-white rounded-[20px]",
        feature: "bg-[#131313] border border-white rounded-[24px]",
        mint: "bg-[#3cffd0] rounded-[20px]",
        ultraviolet: "bg-[#5200ff] rounded-[20px]",
        yellow: "bg-[#f5c518] rounded-[20px]",
        pink: "bg-[#ff6b9d] rounded-[20px]",
        orange: "bg-[#ff8c42] rounded-[20px]",
        white: "bg-white rounded-[20px]",
      },
      size: {
        default: "p-6",
        feature: "p-8",
        compact: "p-5",
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
