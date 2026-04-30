"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CopyBlockProps {
  content: string;
  label?: string;
  className?: string;
}

export function CopyBlock({ content, label, className }: CopyBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      void 0;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-label-xs text-[var(--riot-muted)]">{label}</span>
          <button
            onClick={handleCopy}
            className="text-label-nano text-[var(--riot-blue)] transition-colors hover:text-[var(--riot-orange)]"
            aria-label={copied ? "Copied" : "Copy to clipboard"}
          >
            {copied ? "COPIED" : "COPY"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto rounded-[4px] border border-[var(--riot-border)] bg-[var(--riot-navy)] p-4 text-body-compact text-white">
        <code>{content}</code>
      </pre>
    </div>
  );
}
