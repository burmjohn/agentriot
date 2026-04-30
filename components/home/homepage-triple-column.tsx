import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, TerminalSquare } from "lucide-react";

export interface PromptItem {
  name: string;
  tag: string;
  description: string;
  uses: number;
  rating: number;
  href: string;
}

export interface SoftwareItem {
  name: string;
  category: string;
  description: string;
  rating?: number;
  installs?: string;
  href: string;
}

export interface CoverageItem {
  headline: string;
  tag: string;
  publishedAt: string;
  href: string;
}

export interface TripleColumnContent {
  prompts: {
    title: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  software: {
    title: string;
    cta: { label: string; href: string };
  };
  coverage: {
    title: string;
    cta: { label: string; href: string };
  };
}

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
      <div className="grid grid-cols-3 gap-[24px] border-b border-[var(--riot-border)] px-[38px] py-8 max-lg:grid-cols-1 max-md:px-[20px] max-md:py-7">
        <div>
          <ColumnHeader title={content.prompts.title} cta={content.prompts.primaryCta} />
          <div className="space-y-2">
            {prompts.slice(0, 3).map((prompt) => (
              <Link
                key={prompt.href}
                href={prompt.href}
                className="grid grid-cols-[40px_1fr] gap-3 rounded-[8px] border border-[var(--riot-border)] bg-white p-3 transition-colors hover:border-[var(--riot-blue)]"
              >
                <span className="flex h-[40px] w-[40px] items-center justify-center rounded-[8px] bg-[var(--riot-blue)] text-white">
                  <TerminalSquare className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <strong className="truncate text-[14px] font-black text-[var(--riot-navy)]">
                      {prompt.name}
                    </strong>
                    <span className="rounded-[3px] bg-[#EAF3FF] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--riot-blue)]">
                      {prompt.tag}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12px] font-medium leading-[1.4] text-[var(--riot-body)]">
                    {prompt.description}
                  </span>
                  <span className="mt-2 flex items-center justify-end gap-4 font-mono text-[10px] text-[var(--riot-muted)]">
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
              className="inline-flex items-center gap-2 pt-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)] hover:text-[var(--riot-blue)]"
            >
              {content.prompts.secondaryCta.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div>
          <ColumnHeader title={content.software.title} cta={content.software.cta} />
          <div className="space-y-2">
            {software.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="grid grid-cols-[40px_1fr_46px] items-center gap-3 rounded-[8px] border border-[var(--riot-border)] bg-white p-3 transition-colors hover:border-[var(--riot-blue)]"
              >
                <span className="flex h-[40px] w-[40px] items-center justify-center rounded-[8px] bg-[var(--riot-navy)] text-[13px] font-black text-white">
                  {item.name.slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <strong className="truncate text-[14px] font-black text-[var(--riot-navy)]">
                      {item.name}
                    </strong>
                    <span className="rounded-[3px] bg-[#EAF3FF] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--riot-blue)]">
                      {item.category}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[12px] font-medium text-[var(--riot-body)]">
                    {item.description}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-[var(--riot-muted)]">
                  <span className="flex items-center gap-1 text-[var(--riot-navy)]">
                    <Star className="h-3 w-3 fill-[var(--riot-navy)]" />
                    {item.rating?.toFixed(1) ?? "DB"}
                  </span>
                  <span>{item.installs ?? "live"}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <ColumnHeader title={content.coverage.title} cta={content.coverage.cta} />
          <div className="space-y-2">
            {coverage.slice(0, 3).map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="grid grid-cols-[86px_1fr] gap-3 rounded-[8px] border border-[var(--riot-border)] bg-white p-3 transition-colors hover:border-[var(--riot-blue)]"
              >
                <span className="relative h-[58px] overflow-hidden rounded-[6px] bg-[var(--riot-navy)]">
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
                    <span className="rounded-[3px] bg-[var(--riot-blue)] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-white">
                      {item.tag}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase text-[var(--riot-muted)]">
                      {item.publishedAt}
                    </span>
                  </span>
                  <strong className="mt-2 block text-[14px] font-black leading-[1.2] text-[var(--riot-navy)]">
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
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)]">
        {title}
      </h2>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)] hover:text-[var(--riot-orange)]"
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
