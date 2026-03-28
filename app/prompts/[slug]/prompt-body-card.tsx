"use client";

import { useEffect, useRef, useState } from "react";

export function PromptBodyCard({ promptBody }: { promptBody: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function fallbackCopyText(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function handleCopy() {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(promptBody);
      } catch {
        fallbackCopyText(promptBody);
      }
    } else {
      fallbackCopyText(promptBody);
    }

    setCopied(true);

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2_000);
  }

  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-background/85 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
          Prompt body
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className={`rounded-full px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] transition-colors ${
            copied
              ? "bg-foreground text-background"
              : "chip text-muted hover:text-foreground"
          }`}
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <pre className="mt-4 whitespace-pre-wrap font-mono text-sm leading-7 text-foreground">
        {promptBody}
      </pre>
    </div>
  );
}
