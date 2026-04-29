import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

import type { liveActivitySection, liveAgentActivity } from "./homepage-content";

type ActivityEvent = (typeof liveAgentActivity)[number];
type LiveActivitySection = typeof liveActivitySection;

export interface LiveActivityTimelineProps {
  section: LiveActivitySection;
  events: readonly ActivityEvent[];
  className?: string;
}

export function LiveActivityTimeline({
  section,
  events,
  className,
}: LiveActivityTimelineProps) {
  return (
    <section className={cn("px-[38px] py-1.5 max-md:px-[20px]", className)}>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)]">
          {section.title}
        </h2>
        <Link
          href={section.cta.href}
          className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)] hover:text-[var(--riot-orange)]"
        >
          {section.cta.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="relative overflow-hidden max-lg:overflow-visible">
        <div className="absolute left-0 right-0 top-[23px] border-t-2 border-dotted border-[var(--riot-blue)] max-lg:hidden" />
        <div className="grid grid-cols-4 gap-3.5 max-lg:grid-cols-1">
          {events.map((event) => (
            <TimelineCard key={event.href} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineCard({ event }: { event: ActivityEvent }) {
  const tone = getTone(event.category);

  return (
    <Link href={event.href} className="group relative pt-[6px] max-lg:pt-0">
      <span className="mb-0.5 block font-mono text-[8px] font-bold uppercase leading-[1.1] text-[var(--riot-muted)] max-lg:mb-1">
        {event.timestamp}
      </span>
      <span
        className={cn(
          "relative z-10 mb-0.5 flex h-[36px] w-[36px] items-center justify-center rounded-full border-[3px] bg-white text-[11px] font-black shadow-[0_8px_18px_rgba(5,11,24,0.12)] max-lg:hidden",
          tone === "orange"
            ? "border-[var(--riot-orange)] text-[var(--riot-orange)]"
            : "border-[var(--riot-blue)] text-[var(--riot-blue)]"
        )}
      >
        {getInitials(event.agentName)}
      </span>
      <span className="block rounded-[8px] border border-[var(--riot-border)] bg-white p-1.5 shadow-[0_8px_18px_rgba(5,11,24,0.045)] transition-colors group-hover:border-[var(--riot-blue)]">
        <span
          className={cn(
            "rounded-[2px] px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.05em] text-white",
            tone === "orange" ? "bg-[var(--riot-orange)]" : "bg-[var(--riot-blue)]"
          )}
        >
          {event.category}
        </span>
        <strong className="mt-1 flex items-start justify-between gap-2 text-[11px] font-black leading-[1.1] text-[var(--riot-navy)]">
          {event.agentName}
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--riot-muted)]" />
        </strong>
        <span className="mt-0.5 block line-clamp-2 text-[8.5px] font-medium leading-[1.2] text-[var(--riot-body)]">
          {event.description}
        </span>
      </span>
    </Link>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getTone(category: string) {
  return category === "Launch" || category === "Update" ? "orange" : "blue";
}
