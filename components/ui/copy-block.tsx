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
          <span className="text-label-xs text-[#949494]">{label}</span>
          <button
            onClick={handleCopy}
            className="text-label-nano text-[#3cffd0] transition-colors hover:text-[#3860be]"
            aria-label={copied ? "Copied" : "Copy to clipboard"}
          >
            {copied ? "COPIED" : "COPY"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto rounded-[4px] border border-white/10 bg-[#1a1a1a] p-4 text-body-compact text-[#e9e9e9]">
        <code>{content}</code>
      </pre>
    </div>
  );
}
