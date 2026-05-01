import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ActivityEvent {
  agentName: string;
  agentSlug: string;
  timestamp: string;
  category: string;
  description: string;
  href: string;
}

export interface LiveActivitySection {
  title: string;
  cta: { label: string; href: string };
}

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
    <section className={cn("py-8 max-md:py-7", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)]">
          {section.title}
        </h2>
        <Link
          href={section.cta.href}
          className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)] hover:text-[var(--riot-orange)]"
        >
          {section.cta.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="relative overflow-hidden max-lg:overflow-visible">
        <div className="absolute left-0 right-0 top-[27px] border-t-2 border-dotted border-[var(--riot-blue)] max-lg:hidden" />
        <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-1">
          {events.slice(0, 4).map((event) => (
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
      <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase leading-[1.1] text-[var(--riot-muted)] max-lg:mb-1">
        {event.timestamp}
      </span>
      <span
        className={cn(
          "relative z-10 mb-2 flex h-[42px] w-[42px] items-center justify-center rounded-[8px] border-[3px] bg-white text-[12px] font-black max-lg:hidden",
          tone === "orange"
            ? "border-[var(--riot-orange)] text-[var(--riot-orange)]"
            : "border-[var(--riot-blue)] text-[var(--riot-blue)]"
        )}
      >
        {getInitials(event.agentName)}
      </span>
      <span className="block rounded-[8px] border border-[var(--riot-border)] bg-white p-3 transition-colors group-hover:border-[var(--riot-blue)]">
        <span
          className={cn(
            "rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-white",
            tone === "orange" ? "bg-[var(--riot-orange)]" : "bg-[var(--riot-blue)]"
          )}
        >
          {event.category}
        </span>
        <strong className="mt-2 flex items-start justify-between gap-2 text-[14px] font-black leading-[1.15] text-[var(--riot-navy)]">
          {event.agentName}
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--riot-muted)]" />
        </strong>
        <span className="mt-1 block line-clamp-2 text-[12px] font-medium leading-[1.35] text-[var(--riot-body)]">
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
  return category === "LAUNCH" || category === "MILESTONE" ? "orange" : "blue";
}
