import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, TerminalSquare } from "lucide-react";

import type {
  agentPrompts,
  latestCoverage,
  softwareSpotlight,
  tripleColumnContent,
} from "./homepage-content";

type PromptItem = (typeof agentPrompts)[number];
type SoftwareItem = (typeof softwareSpotlight)[number];
type CoverageItem = (typeof latestCoverage)[number];
type TripleColumnContent = typeof tripleColumnContent;

export interface HomepageTripleColumnProps {
  content: TripleColumnContent;
  prompts: readonly PromptItem[];
  software: readonly SoftwareItem[];
  coverage: readonly CoverageItem[];
  className?: string;
}

export function HomepageTripleColumn({
  content,
  prompts,
  software,
  coverage,
  className,
}: HomepageTripleColumnProps) {
  return (
    <section className={className}>
      <div className="grid grid-cols-3 gap-[20px] border-b border-[var(--riot-border)] px-[38px] py-[11px] max-lg:grid-cols-1 max-md:px-[20px]">
        <div>
          <ColumnHeader title={content.prompts.title} cta={content.prompts.primaryCta} />
          <div className="space-y-1.5">
            {prompts.map((prompt) => (
              <Link
                key={prompt.href}
                href={prompt.href}
                className="grid grid-cols-[32px_1fr] gap-2 rounded-[8px] border border-[var(--riot-border)] bg-white p-1.5 transition-colors hover:border-[var(--riot-blue)]"
              >
                <span className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[var(--riot-blue)] text-white">
                  <TerminalSquare className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <strong className="truncate text-[11px] font-black text-[var(--riot-navy)]">
                      {prompt.name}
                    </strong>
                    <span className="rounded-[2px] bg-[#EAF3FF] px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.05em] text-[var(--riot-blue)]">
                      {prompt.tag}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[8px] font-medium leading-[1.25] text-[var(--riot-body)]">
                    {prompt.description}
                  </span>
                  <span className="mt-1 flex items-center justify-end gap-4 font-mono text-[8px] text-[var(--riot-muted)]">
                    <span>{formatUses(prompt.uses)} uses</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-[var(--riot-navy)] text-[var(--riot-navy)]" />
                      {prompt.rating}
                    </span>
                  </span>
                </span>
              </Link>
            ))}
            <Link
              href={content.prompts.secondaryCta.href}
              className="inline-flex items-center gap-2 pt-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)] hover:text-[var(--riot-blue)]"
            >
              {content.prompts.secondaryCta.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div>
          <ColumnHeader title={content.software.title} cta={content.software.cta} />
          <div className="space-y-1.5">
            {software.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="grid grid-cols-[32px_1fr_36px] items-center gap-2 rounded-[8px] border border-[var(--riot-border)] bg-white p-1.5 transition-colors hover:border-[var(--riot-blue)]"
              >
                <span className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[var(--riot-navy)] text-[11px] font-black text-white">
                  {item.name.slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <strong className="truncate text-[12px] font-black text-[var(--riot-navy)]">
                      {item.name}
                    </strong>
                    <span className="rounded-[2px] bg-[#EAF3FF] px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.05em] text-[var(--riot-blue)]">
                      {item.category}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[8px] font-medium text-[var(--riot-body)]">
                    {item.description}
                  </span>
                </span>
                <span className="font-mono text-[9px] text-[var(--riot-muted)]">
                  <span className="flex items-center gap-1 text-[var(--riot-navy)]">
                    <Star className="h-3 w-3 fill-[var(--riot-navy)]" />
                    {item.rating}
                  </span>
                  <span>{item.installs}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <ColumnHeader title={content.coverage.title} cta={content.coverage.cta} />
          <div className="space-y-1.5">
            {coverage.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="grid grid-cols-[78px_1fr] gap-2 rounded-[8px] border border-[var(--riot-border)] bg-white p-1.5 transition-colors hover:border-[var(--riot-blue)]"
              >
                <span className="relative h-[48px] overflow-hidden rounded-[6px] bg-[var(--riot-navy)]">
                  <Image
                    src={`/images/homepage/coverage-thumb-${index + 1}.svg`}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-[2px] bg-[var(--riot-blue)] px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.05em] text-white">
                      {item.tag}
                    </span>
                    <span className="font-mono text-[8px] font-bold uppercase text-[var(--riot-muted)]">
                      {item.publishedAt}
                    </span>
                  </span>
                  <strong className="mt-1 block text-[11px] font-black leading-[1.15] text-[var(--riot-navy)]">
                    {item.headline}
                  </strong>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ColumnHeader({
  title,
  cta,
}: {
  title: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)]">
        {title}
      </h2>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)] hover:text-[var(--riot-orange)]"
      >
        {cta.label}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function formatUses(uses: number) {
  return `${(uses / 1000).toFixed(1)}K`;
}
