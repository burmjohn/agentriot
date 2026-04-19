import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all duration-150 ease-out outline-none select-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#1eaedb] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[#3cffd0] text-black rounded-[24px] px-6 py-2.5 font-sans text-base font-bold hover:bg-[rgba(255,255,255,0.2)] hover:text-black hover:shadow-[0_0_0_1px_#c2c2c2]",
        secondary:
          "bg-[#2d2d2d] text-[#e9e9e9] rounded-[24px] px-6 py-2.5 font-sans text-base font-normal hover:bg-[rgba(255,255,255,0.2)] hover:text-black hover:shadow-[0_0_0_1px_#c2c2c2]",
        tertiary:
          "bg-transparent text-[#3cffd0] border border-[#3cffd0] rounded-[40px] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.09375rem] hover:bg-[#3cffd0] hover:text-black",
        ultraviolet:
          "bg-transparent text-[#5200ff] border border-[#5200ff] rounded-[30px] px-5 py-2.5 font-sans text-base font-normal hover:bg-[#5200ff] hover:text-white",
      },
      size: {
        default: "",
        sm: "px-4 py-1.5 text-sm",
        lg: "px-8 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillButtonVariants> {}

const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(pillButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
PillButton.displayName = "PillButton";

export { PillButton, pillButtonVariants };
