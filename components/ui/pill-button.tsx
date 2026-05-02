import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillButtonVariants = cva(
  "inline-flex max-w-full shrink-0 items-center justify-center whitespace-normal text-center outline-none select-none transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1eaedb] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "h-[46px] rounded-[8px] bg-[var(--riot-orange)] px-[22px] text-mono-button text-white hover:bg-[#E83F1A]",
        secondary:
          "h-[46px] rounded-[8px] border border-[var(--riot-border)] bg-white px-[22px] text-mono-button text-[var(--riot-navy)] hover:border-[var(--riot-blue)] hover:text-[var(--riot-blue)]",
        tertiary:
          "h-[46px] rounded-[8px] border border-[var(--riot-blue)] bg-white px-[22px] text-mono-button text-[var(--riot-blue)] hover:bg-[#EAF3FF]",
        orange:
          "h-[46px] rounded-[8px] border border-[var(--riot-orange)] bg-white px-[22px] text-mono-button text-[var(--riot-orange)] hover:bg-[#FFF0EC]",
      },
      size: {
        default: "",
        sm: "h-[38px] px-[18px]",
        lg: "h-[52px] px-[28px]",
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
    VariantProps<typeof pillButtonVariants> {
  asChild?: boolean;
}

const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ asChild = false, children, className, variant, size, ...props }, ref) => {
    const classes = cn(pillButtonVariants({ variant, size, className }));

    if (asChild && React.isValidElement<{ className?: string }>(children)) {
      return React.cloneElement(children, {
        className: cn(classes, children.props.className),
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PillButton.displayName = "PillButton";

export { PillButton, pillButtonVariants };
