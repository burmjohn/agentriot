import Link from "next/link";
import { ArrowRight, Box, Newspaper, TerminalSquare, UserRound, Zap } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";

import type { platformPillars, platformPillarsSection } from "./homepage-content";

type PlatformPillar = (typeof platformPillars)[number];
type PlatformPillarsSection = typeof platformPillarsSection;

const iconByTag: Record<
  PlatformPillar["tag"],
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  News: Newspaper,
  Directory: Box,
  Profiles: UserRound,
  Prompts: TerminalSquare,
  Feed: Zap,
};

export interface PlatformPillarsProps {
  section: PlatformPillarsSection;
  pillars: readonly PlatformPillar[];
  className?: string;
}

export function PlatformPillars({
  section,
  pillars,
  className,
}: PlatformPillarsProps) {
  return (
    <section className={cn("border-b border-[var(--riot-border)] px-[38px] py-8 max-md:px-[20px] max-md:py-7", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)]">
          <span className="text-[var(--riot-blue)]">✣</span>
          {section.title}
        </h2>
        <Link
          href={section.cta.href}
          className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--riot-blue)] hover:text-[var(--riot-orange)]"
        >
          {section.cta.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-[16px] max-lg:grid-cols-2 max-sm:grid-cols-1">
        {pillars.map((pillar) => (
          <PillarCard key={pillar.number} pillar={pillar} />
        ))}
      </div>
    </section>
  );
}

function PillarCard({ pillar }: { pillar: PlatformPillar }) {
  const Icon = iconByTag[pillar.tag];
  const accentClass =
    pillar.accent === "orange"
      ? "border-l-[var(--riot-orange)] text-[var(--riot-orange)]"
      : "border-l-[var(--riot-blue)] text-[var(--riot-blue)]";
  const iconClass =
    pillar.accent === "orange"
      ? "bg-[var(--riot-orange)] text-white"
      : "bg-[var(--riot-blue)] text-white";

  return (
    <Link
      href={pillar.cta.href}
      className={cn(
        "group flex min-h-[190px] flex-col rounded-[8px] border border-[var(--riot-border)] border-l-2 bg-white p-[18px] transition-colors hover:border-[var(--riot-blue)]",
        accentClass
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("inline-flex h-[42px] w-[42px] items-center justify-center rounded-[8px]", iconClass)}>
          <Icon className="h-[23px] w-[23px]" strokeWidth={2.8} />
        </span>
        <span className="font-sans text-[24px] font-bold leading-none text-[#B7BDC8]">
          {pillar.number}
        </span>
      </div>

      <h3 className="mt-5 text-[17px] font-black leading-[1.08] tracking-normal text-[var(--riot-navy)]">
        {pillar.headline}
      </h3>
      <p className="mt-2.5 flex-1 text-[13px] font-medium leading-[1.45] text-[var(--riot-body)]">
        {pillar.deck}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--riot-navy)] group-hover:text-[var(--riot-blue)]">
        {pillar.cta.label}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
