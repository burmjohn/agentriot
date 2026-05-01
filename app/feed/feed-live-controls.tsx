"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 30_000;

function FeedLiveControls() {
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [paused, router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-label-xs",
          paused
            ? "border-border bg-white text-secondary-text"
            : "border-[var(--riot-blue)] bg-[#EAF3FF] text-[var(--riot-blue)]",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 rounded-full",
            paused ? "bg-secondary-text" : "bg-[var(--riot-blue)]",
          )}
        />
        {paused ? "LIVE PAUSED" : "LIVE REFRESH"}
      </div>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-white px-3 text-label-xs text-foreground transition-colors hover:border-[var(--riot-blue)] hover:text-[var(--riot-blue)]"
        aria-pressed={paused}
      >
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        {paused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        onClick={() => {
          router.refresh();
          setLastRefresh(new Date());
        }}
        className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-white px-3 text-label-xs text-foreground transition-colors hover:border-[var(--riot-blue)] hover:text-[var(--riot-blue)]"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
      <span className="text-body-compact text-secondary-text">
        {lastRefresh
          ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
          : "Refreshes every 30 seconds"}
      </span>
    </div>
  );
}

export { FeedLiveControls };
