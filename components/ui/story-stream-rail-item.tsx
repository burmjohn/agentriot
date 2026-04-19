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
        <div className="flex flex-col items-end gap-2 min-w-[72px]">
          <span className="text-mono-timestamp text-[#949494]">
            {timestamp}
          </span>
          <div className="flex-1 w-px bg-[#3d00bf] self-end mr-1.5" />
        </div>

        <div
          className={cn(
            "flex-1 rounded-[20px] border p-6 transition-colors duration-150 ease-out",
            isAccent
              ? "bg-[#5200ff] border-transparent"
              : "bg-[#131313] border-white"
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
                isAccent ? "text-white/80" : "text-[#3cffd0]"
              )}
            >
              {kicker}
            </span>
          )}
          <h3
            className={cn(
              "text-headline-md transition-colors duration-150 ease-out hover:text-[#3860be] cursor-pointer",
              isAccent ? "text-white" : "text-white"
            )}
          >
            {headline}
          </h3>
          {deck && (
            <p
              className={cn(
                "mt-2 text-body-compact",
                isAccent ? "text-white/70" : "text-[#949494]"
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
