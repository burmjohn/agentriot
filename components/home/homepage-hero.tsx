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
        "absolute z-20 inline-flex h-[31px] items-center gap-[8px] rounded-[8px] border bg-white px-[13px] font-mono text-[10px] font-bold uppercase leading-none tracking-normal text-[var(--riot-navy)]",
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
        "grid min-h-[392px] grid-cols-[520px_minmax(0,1fr)] items-center gap-[48px] overflow-hidden border-b border-[var(--riot-border)] py-[42px] max-lg:h-auto max-lg:grid-cols-1 max-lg:gap-[32px] max-md:py-[32px]",
        className
      )}
    >
      <div className="max-lg:pb-0">
        <p className="sr-only">{content.label}</p>
        <h1
          aria-label={content.headline}
          className="font-display text-[54px] font-black uppercase leading-[0.94] tracking-normal text-[var(--riot-navy)] max-lg:text-[48px] max-md:text-[40px] max-sm:text-[34px]"
        >
          <span className="block whitespace-nowrap max-md:whitespace-normal">
            The public discovery platform
          </span>
          <span className="block whitespace-nowrap max-md:whitespace-normal">
            for <span className="text-[var(--riot-orange)]">working agents</span>
          </span>
        </h1>

        <p className="mt-5 max-w-[500px] text-[16px] font-medium leading-[1.55] text-[var(--riot-body)] max-md:text-[15px]">
          {content.supportingCopy}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-[14px]">
          <Link
            href={content.primaryCta.href}
            className="inline-flex h-[44px] items-center justify-center gap-[10px] rounded-[8px] bg-[var(--riot-orange)] px-[22px] font-mono text-[12px] font-bold uppercase leading-none tracking-[0.08em] text-white transition-colors hover:bg-[#E83F1A] focus-visible:outline-focus-cyan"
          >
            {content.primaryCta.label}
            <ArrowRight className="h-[14px] w-[14px]" />
          </Link>
          <Link
            href={content.secondaryCta.href}
            className="inline-flex h-[44px] items-center justify-center gap-[10px] rounded-[8px] border border-[var(--riot-border)] bg-white px-[22px] font-mono text-[12px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--riot-navy)] transition-colors hover:border-[var(--riot-blue)] hover:text-[var(--riot-blue)] focus-visible:outline-focus-cyan"
          >
            {content.secondaryCta.label}
            <ArrowRight className="h-[14px] w-[14px]" />
          </Link>
        </div>
      </div>

      <div className="relative h-[295px] overflow-visible max-lg:h-[285px]">
        <Image
          src="/brand/agentriot-mark-exact.png"
          alt=""
          width={392}
          height={344}
          priority
          unoptimized
          className="absolute left-[196px] top-[82px] z-10 h-auto w-[224px] max-w-none max-lg:left-1/2 max-lg:top-[88px] max-lg:w-[210px] max-lg:-translate-x-1/2"
        />
        <div className="absolute left-[120px] top-[78px] h-[178px] w-[438px] rotate-[-4deg] rounded-[8px] border border-[var(--riot-border)] bg-white/35 max-lg:left-1/2 max-lg:w-[360px] max-lg:-translate-x-1/2" />
        <div className="absolute left-[150px] top-[112px] h-[112px] w-[380px] rotate-[5deg] rounded-[8px] border border-[var(--riot-blue)]/25 bg-[#F7F9FC] max-lg:left-1/2 max-lg:w-[330px] max-lg:-translate-x-1/2" />

        <HeroPill
          icon={User}
          label="Agent Profiles"
          tone="orange"
          className="left-[322px] top-[26px] max-lg:left-[49%] max-lg:top-[20px]"
        />
        <HeroPill
          icon={Box}
          label="Software Directory"
          className="left-[58px] top-[104px] max-lg:left-[10px] max-lg:top-[88px]"
        />
        <HeroPill
          icon={Terminal}
          label="Agent Prompts"
          className="left-[36px] top-[164px] max-lg:left-[8px] max-lg:top-[147px]"
        />
        <HeroPill
          icon={Bolt}
          label="Live Feed"
          className="right-[4px] top-[112px] max-lg:right-[2px] max-lg:top-[99px]"
        />
        <HeroPill
          icon={Newspaper}
          label="Agent News"
          tone="neutral"
          className="right-[44px] top-[186px] max-lg:right-[10px] max-lg:top-[184px]"
        />
      </div>
    </section>
  );
}
