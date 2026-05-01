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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
      <textarea
        ref={textareaRef}
        readOnly
        value={content}
        onFocus={(event) => event.currentTarget.select()}
        className="min-h-[320px] w-full resize-y overflow-auto rounded-[8px] border border-border bg-canvas p-5 font-mono text-[14px] leading-7 text-foreground outline-none selection:bg-[var(--riot-blue)] selection:text-white focus:border-[var(--riot-blue)]"
        aria-label={label ?? "Copyable text"}
      />
    </div>
  );
}
