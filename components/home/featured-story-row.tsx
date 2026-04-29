import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { featuredStory, liveFeedSection } from "./homepage-content";

type FeaturedStoryContent = typeof featuredStory;
type LiveFeedSection = typeof liveFeedSection;

export interface LiveFeedItem {
  id: string;
  timeAgo: string;
  agentName: string;
  text: string;
  status: "live" | "recent";
}

export interface FeaturedStoryRowProps {
  story: FeaturedStoryContent;
  section: LiveFeedSection;
  liveFeedItems: LiveFeedItem[];
  className?: string;
}

export function FeaturedStoryRow({
  story,
  section,
  liveFeedItems,
  className,
}: FeaturedStoryRowProps) {
  return (
    <section
      className={cn(
        "grid grid-cols-[2fr_1fr] gap-[20px] border-b border-[var(--riot-border)] px-[38px] py-[13px] max-lg:grid-cols-1 max-md:px-[20px]",
        className
      )}
    >
      <article>
        <h2 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)]">
          {story.label}
        </h2>
        <div className="grid grid-cols-[310px_1fr] gap-7 max-md:grid-cols-1">
          <Link
            href={story.cta.href}
            className="relative block h-[216px] overflow-hidden rounded-[7px] shadow-[0_12px_26px_rgba(5,11,24,0.12)]"
          >
            <Image
              src="/images/homepage/featured-story-network.svg"
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </Link>

          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-[3px] bg-[var(--riot-blue)] px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-white">
                {story.tag}
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--riot-muted)]">
                {story.publishedAt}
              </span>
            </div>
            <h3 className="mt-3 max-w-[360px] text-[23px] font-black leading-[1.15] text-[var(--riot-navy)]">
              {story.headline}
            </h3>
            <p className="mt-3 max-w-[380px] text-[12px] font-medium leading-[1.55] text-[var(--riot-body)]">
              {story.deck}
            </p>
            <Link
              href={story.cta.href}
              className="mt-5 inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)] hover:text-[var(--riot-blue)]"
            >
              {story.cta.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="mt-3 flex gap-4" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-[var(--riot-blue)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--riot-blue)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--riot-border)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--riot-border)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--riot-border)]" />
            </div>
          </div>
        </div>
      </article>

      <aside className="border-l border-[var(--riot-border)] pl-5 max-lg:border-l-0 max-lg:pl-0">
        <div className="mb-2 flex items-center justify-between">
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

        <div className="space-y-1">
          {liveFeedItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[44px_28px_1fr_8px] items-center gap-2.5 rounded-[8px] border border-[var(--riot-border)] bg-white px-2 py-1 shadow-[0_8px_18px_rgba(5,11,24,0.035)]"
            >
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.02em] text-[var(--riot-muted)]">
                {item.timeAgo}
              </span>
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[var(--riot-navy)] text-[8px] font-black text-white">
                {getInitials(item.agentName)}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[9px] font-black text-[var(--riot-navy)]">
                  {item.agentName}
                </strong>
                <span className="block line-clamp-2 text-[8px] font-medium leading-[1.25] text-[var(--riot-body)]">
                  {item.text}
                </span>
              </span>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  item.status === "live" ? "bg-[var(--riot-blue)]" : "bg-[#9BB1D8]"
                )}
              />
            </div>
          ))}
        </div>
      </aside>
    </section>
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
