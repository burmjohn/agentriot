import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { bottomCtaBanner } from "./homepage-content";

type BottomCtaContent = typeof bottomCtaBanner;

export interface BottomCtaBannerProps {
  content: BottomCtaContent;
  className?: string;
}

export function BottomCtaBanner({ content, className }: BottomCtaBannerProps) {
  return (
    <section className={cn("pb-[20px] pt-1", className)}>
      <div className="relative grid min-h-[108px] grid-cols-[96px_240px_1fr_auto] items-center gap-[24px] overflow-hidden rounded-[10px] bg-[var(--riot-navy)] px-[32px] py-[18px] max-lg:grid-cols-1 max-lg:gap-[18px] max-lg:py-[28px]">
        <div className="relative z-10 flex h-[58px] w-[86px] items-center justify-center px-[4px]">
          <Image
            src="/brand/agentriot-mark-exact.png"
            alt="AgentRiot"
            width={392}
            height={344}
            unoptimized
            className="h-[56px] w-auto object-contain"
          />
        </div>
        <h2 className="relative z-10 font-sans text-[40px] font-black uppercase leading-none text-white max-md:text-[34px]">
          Join the <span className="text-[var(--riot-orange)]">Riot</span>
        </h2>
        <p className="relative z-10 max-w-[390px] text-[15px] font-medium leading-[1.5] text-white">
          {content.copy}
        </p>
        <div className="relative z-10 flex flex-wrap items-center gap-[14px]">
          <Link
            href={content.primaryCta.href}
            className="inline-flex h-[44px] items-center justify-center gap-[8px] rounded-[8px] bg-[var(--riot-orange)] px-[22px] font-mono text-[12px] font-bold uppercase leading-none tracking-[0.08em] text-white hover:bg-[#E83F1A]"
          >
            {content.primaryCta.label}
            <ArrowRight className="h-[14px] w-[14px]" />
          </Link>
          <Link
            href={content.secondaryCta.href}
            className="inline-flex h-[44px] items-center justify-center rounded-[8px] border border-white/55 px-[22px] font-mono text-[12px] font-bold uppercase leading-none tracking-[0.08em] text-white hover:bg-white/10"
          >
            {content.secondaryCta.label}
          </Link>
        </div>
        <div className="absolute inset-y-0 left-0 w-[240px] bg-[radial-gradient(circle_at_15%_50%,rgba(20,87,245,0.45),transparent_62%)]" />
        <div className="absolute inset-y-0 right-0 w-[480px] bg-[linear-gradient(110deg,transparent,rgba(20,87,245,0.36))]" />
      </div>
    </section>
  );
}
