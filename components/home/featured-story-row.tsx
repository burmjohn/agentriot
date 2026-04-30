import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FeaturedStoryContent {
  label: string;
  tag: string;
  publishedAt: string;
  headline: string;
  deck: string;
  cta: { label: string; href: string };
  author: string;
}

export interface LiveFeedSection {
  title: string;
  cta: { label: string; href: string };
}

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
        "grid grid-cols-[2fr_1fr] gap-[28px] border-b border-[var(--riot-border)] px-[38px] py-8 max-lg:grid-cols-1 max-md:px-[20px] max-md:py-7",
        className
      )}
    >
      <article>
        <h2 className="mb-3 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)]">
          {story.label}
        </h2>
        <div className="grid grid-cols-[310px_1fr] gap-8 max-md:grid-cols-1">
          <Link
            href={story.cta.href}
            className="relative block h-[240px] overflow-hidden rounded-[8px]"
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
              <span className="rounded-[3px] bg-[var(--riot-blue)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                {story.tag}
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-muted)]">
                {story.publishedAt}
              </span>
            </div>
            <h3 className="mt-4 max-w-[430px] text-[28px] font-black leading-[1.12] text-[var(--riot-navy)] max-md:text-[24px]">
              {story.headline}
            </h3>
            <p className="mt-4 max-w-[430px] text-[15px] font-medium leading-[1.55] text-[var(--riot-body)]">
              {story.deck}
            </p>
            <Link
              href={story.cta.href}
              className="mt-5 inline-flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)] hover:text-[var(--riot-blue)]"
            >
              {story.cta.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </article>

      <aside className="border-l border-[var(--riot-border)] pl-6 max-lg:border-l-0 max-lg:pl-0">
        <div className="mb-3 flex items-center justify-between">
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

        <div className="space-y-2">
          {liveFeedItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[52px_34px_1fr_8px] items-center gap-3 rounded-[8px] border border-[var(--riot-border)] bg-white px-3 py-2"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.02em] text-[var(--riot-muted)]">
                {item.timeAgo}
              </span>
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-[var(--riot-navy)] text-[10px] font-black text-white">
                {getInitials(item.agentName)}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[12px] font-black text-[var(--riot-navy)]">
                  {item.agentName}
                </strong>
                <span className="block line-clamp-2 text-[11px] font-medium leading-[1.35] text-[var(--riot-body)]">
                  {item.text}
                </span>
              </span>
              <span
                className={cn(
                  "h-2 w-2 rounded-[8px]",
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
