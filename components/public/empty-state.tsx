import * as React from "react";
import { cn } from "@/lib/utils";
import { PillButton } from "@/components/ui/pill-button";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
  icon?: React.ReactNode;
  className?: string;
}

function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-[20px] bg-canvas px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-muted-foreground">{icon}</div>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-headline-sm text-foreground">{title}</h3>
        <p className="max-w-sm text-body-compact text-muted-foreground">
          {description}
        </p>
      </div>
      {action && (
        <a href={action.href}>
          <PillButton variant="primary">{action.label}</PillButton>
        </a>
      )}
    </div>
  );
}

export { EmptyState };
