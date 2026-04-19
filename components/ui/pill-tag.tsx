import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillTagVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[20px] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1125rem] select-none",
  {
    variants: {
      variant: {
        mint: "bg-[#3cffd0] text-black",
        ultraviolet: "bg-[#5200ff] text-white",
        yellow: "bg-[#f5c518] text-black",
        pink: "bg-[#ff6b9d] text-black",
        orange: "bg-[#ff8c42] text-black",
        white: "bg-white text-black",
        slate: "bg-[#2d2d2d] text-[#e9e9e9]",
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
