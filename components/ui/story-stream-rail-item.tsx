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

    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-4",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-end gap-2 min-w-[72px] self-stretch">
          <span className="text-mono-timestamp text-secondary-text">
            {timestamp}
          </span>
          <div className="flex-1" />
        </div>

        <div
          className={cn(
            "flex-1 rounded-[20px] border p-6 transition-colors duration-150 ease-out",
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
