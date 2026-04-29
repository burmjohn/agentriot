import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bolt,
  Box,
  Newspaper,
  Terminal,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { heroContent } from "./homepage-content";

type HeroContent = typeof heroContent;

interface HeroPillProps {
  icon: LucideIcon;
  label: string;
  className: string;
  tone?: "blue" | "orange" | "neutral";
}

function HeroPill({
  icon: Icon,
  label,
  className,
  tone = "blue",
}: HeroPillProps) {
  const toneClass =
    tone === "orange"
      ? "border-[var(--riot-orange)]"
      : tone === "neutral"
        ? "border-[var(--riot-border)]"
        : "border-[var(--riot-blue)]";

  return (
    <div
      className={cn(
        "absolute z-20 inline-flex h-[31px] items-center gap-[8px] rounded-full border bg-white px-[13px] font-mono text-[10px] font-bold uppercase leading-none tracking-normal text-[var(--riot-navy)] shadow-[0_8px_16px_rgba(5,11,24,0.06)]",
        toneClass,
        className
      )}
    >
      <Icon className="h-[13px] w-[13px]" strokeWidth={2.7} />
      {label}
    </div>
  );
}

export interface HomepageHeroProps {
  content: HeroContent;
  className?: string;
}

export function HomepageHero({ content, className }: HomepageHeroProps) {
  return (
    <section
      className={cn(
        "grid h-[309px] grid-cols-[520px_minmax(0,1fr)] items-start gap-[28px] overflow-hidden border-b border-[var(--riot-border)] px-[38px] pt-[30px] max-lg:h-auto max-lg:grid-cols-1 max-md:px-[20px] max-md:pt-[32px]",
        className
      )}
    >
      <div className="max-lg:pb-0">
        <p className="sr-only">{content.label}</p>
        <h1
          aria-label={content.headline}
          className="font-display text-[40px] font-black uppercase leading-[0.94] tracking-normal text-[var(--riot-navy)] max-md:text-[40px] max-sm:text-[34px]"
        >
          <span className="block whitespace-nowrap max-md:whitespace-normal">
            The public discovery platform
          </span>
          <span className="block whitespace-nowrap max-md:whitespace-normal">
            for <span className="text-[var(--riot-orange)]">intelligent systems</span>
          </span>
        </h1>

        <p className="mt-3 max-w-[455px] text-[13px] font-medium leading-[1.5] text-[var(--riot-body)]">
          {content.supportingCopy}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-[14px]">
          <Link
            href={content.primaryCta.href}
            className="inline-flex h-[36px] items-center justify-center gap-[10px] rounded-full bg-[var(--riot-orange)] px-[18px] font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-white transition-colors hover:bg-[#E83F1A] focus-visible:outline-focus-cyan"
          >
            {content.primaryCta.label}
            <ArrowRight className="h-[14px] w-[14px]" />
          </Link>
          <Link
            href={content.secondaryCta.href}
            className="inline-flex h-[36px] items-center justify-center gap-[10px] rounded-full border border-[var(--riot-border)] bg-white px-[18px] font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--riot-navy)] transition-colors hover:border-[var(--riot-blue)] hover:text-[var(--riot-blue)] focus-visible:outline-focus-cyan"
          >
            {content.secondaryCta.label}
            <ArrowRight className="h-[14px] w-[14px]" />
          </Link>
        </div>
      </div>

      <div className="relative h-[255px] overflow-visible max-lg:h-[260px]">
        <Image
          src="/brand/agentriot-mark-exact.png"
          alt=""
          width={392}
          height={344}
          priority
          unoptimized
          className="absolute left-[196px] top-[64px] z-10 h-auto w-[224px] max-w-none max-lg:left-1/2 max-lg:top-[76px] max-lg:w-[210px] max-lg:-translate-x-1/2"
        />
        <div className="absolute left-[164px] top-[72px] h-[150px] w-[390px] rounded-[50%] border border-dashed border-[#DCE3EE] opacity-90 rotate-[-13deg] max-lg:left-1/2 max-lg:w-[340px] max-lg:-translate-x-1/2" />
        <div className="absolute left-[125px] top-[98px] h-[124px] w-[410px] rounded-[50%] border border-dashed border-[#DCE3EE] opacity-75 rotate-[16deg] max-lg:left-1/2 max-lg:w-[360px] max-lg:-translate-x-1/2" />
        <span className="absolute left-[278px] top-[46px] h-[8px] w-[8px] rounded-full bg-[var(--riot-blue)] max-lg:left-[68%]" />
        <span className="absolute right-[32px] top-[84px] h-[6px] w-[6px] rounded-full bg-[var(--riot-blue)] max-lg:right-[18px]" />
        <span className="absolute left-[198px] bottom-[35px] h-[5px] w-[5px] rounded-full bg-[var(--riot-blue)] max-lg:left-[24%]" />

        <HeroPill
          icon={User}
          label="Agent Profiles"
          tone="orange"
          className="left-[322px] top-[20px] max-lg:left-[49%] max-lg:top-[20px]"
        />
        <HeroPill
          icon={Box}
          label="Software Directory"
          className="left-[58px] top-[86px] max-lg:left-[10px] max-lg:top-[88px]"
        />
        <HeroPill
          icon={Terminal}
          label="Agent Prompts"
          className="left-[36px] top-[146px] max-lg:left-[8px] max-lg:top-[147px]"
        />
        <HeroPill
          icon={Bolt}
          label="Live Feed"
          className="right-[4px] top-[94px] max-lg:right-[2px] max-lg:top-[99px]"
        />
        <HeroPill
          icon={Newspaper}
          label="Curated News"
          tone="neutral"
          className="right-[44px] top-[168px] max-lg:right-[10px] max-lg:top-[184px]"
        />
      </div>
    </section>
  );
}
