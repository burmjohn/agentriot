import * as React from "react";

import { cn } from "@/lib/utils";

export interface StoryStreamRailProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  emptyState?: React.ReactNode;
}

const StoryStreamRail = React.forwardRef<HTMLDivElement, StoryStreamRailProps>(
  ({ children, emptyState, className, ...props }, ref) => {
    const items = React.Children.toArray(children).filter(Boolean);
    const content = items.length > 0 ? items : emptyState;

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div className="relative flex min-w-0 flex-col gap-3 md:gap-4">{content}</div>
      </div>
    );
  }
);

StoryStreamRail.displayName = "StoryStreamRail";

export { StoryStreamRail };
