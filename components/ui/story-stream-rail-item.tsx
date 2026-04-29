import * as React from "react";
import { cn } from "@/lib/utils";
import { PillTag } from "./pill-tag";

export interface StoryStreamRailItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
  kicker?: string;
  headline: string;
  deck?: string;
  tag?: string;
  tagVariant?: React.ComponentProps<typeof PillTag>["variant"];
  variant?: "dark" | "accent";
  hideSpine?: boolean;
}

const StoryStreamRailItem = React.forwardRef<
  HTMLDivElement,
  StoryStreamRailItemProps
>(
  (
    {
      className,
      timestamp,
      kicker,
      headline,
      deck,
      tag,
      tagVariant = "mint",
      variant = "dark",
      hideSpine: _hideSpine,
      ...props
    },
    ref
    ) => {
      const isAccent = variant === "accent";
      void _hideSpine;

      return (
      <div
        ref={ref}
        className={cn(
          "flex min-w-0 gap-3 sm:gap-4",
          className
        )}
        {...props}
      >
        <div className="flex min-w-[56px] flex-col items-end gap-2 self-stretch sm:min-w-[72px]">
          <span className="text-mono-timestamp text-secondary-text">
            {timestamp}
          </span>
          <div className="flex-1" />
        </div>

        <div
          className={cn(
            "min-w-0 flex-1 rounded-[20px] border p-5 transition-colors duration-150 ease-out sm:p-6",
            isAccent
              ? "bg-[#5200ff] border-transparent"
              : "bg-canvas border-border"
          )}
        >
          {tag && (
            <div className="mb-3">
              <PillTag variant={tagVariant}>{tag}</PillTag>
            </div>
          )}
          {kicker && (
            <span
              className={cn(
                "block text-label-sm mb-2",
                isAccent ? "text-white" : "text-mint"
              )}
            >
              {kicker}
            </span>
          )}
          <h3
            className={cn(
              "text-headline-md transition-colors duration-150 ease-out hover:text-deep-link cursor-pointer",
              isAccent ? "text-white" : "text-foreground"
            )}
          >
            {headline}
          </h3>
          {deck && (
            <p
              className={cn(
                "mt-2 text-body-compact",
                isAccent ? "text-muted-foreground" : "text-muted-foreground"
              )}
            >
              {deck}
            </p>
          )}
        </div>
      </div>
    );
  }
);
StoryStreamRailItem.displayName = "StoryStreamRailItem";

export { StoryStreamRailItem };
