import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillTagVariants = cva(
  "inline-flex max-w-full items-center justify-center whitespace-normal break-words rounded-[20px] px-2.5 py-1 text-center font-mono text-[11px] font-semibold uppercase tracking-[1.8px] select-none",
  {
    variants: {
      variant: {
        mint: "bg-[#3cffd0] text-black",
        ultraviolet: "bg-[#5200ff] text-white",
        yellow: "bg-[#f5c518] text-black",
        pink: "bg-[#ff6b9d] text-black",
        orange: "bg-[#ff8c42] text-black",
        white: "bg-white text-black",
        slate: "bg-surface text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "mint",
    },
  }
);

export interface PillTagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillTagVariants> {}

const PillTag = React.forwardRef<HTMLSpanElement, PillTagProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(pillTagVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
PillTag.displayName = "PillTag";

export { PillTag, pillTagVariants };
