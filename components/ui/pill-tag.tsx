import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillTagVariants = cva(
  "inline-flex max-w-full items-center justify-center whitespace-normal break-words rounded-[8px] px-2.5 py-1 text-center font-mono text-[11px] font-semibold uppercase tracking-[1.8px] select-none",
  {
    variants: {
      variant: {
        blue: "bg-[var(--riot-blue)] text-white",
        yellow: "bg-[#EAF3FF] text-[var(--riot-blue)]",
        pink: "bg-[#FFF0EC] text-[var(--riot-orange)]",
        orange: "bg-[var(--riot-orange)] text-white",
        white: "bg-white text-black",
        slate: "border border-[var(--riot-border)] bg-white text-[var(--riot-muted)]",
      },
    },
    defaultVariants: {
      variant: "blue",
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
