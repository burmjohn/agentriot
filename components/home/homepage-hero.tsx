import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { heroContent } from "./homepage-content";

type HeroContent = typeof heroContent;

export interface HomepageHeroProps {
  content: HeroContent;
  className?: string;
}

export function HomepageHero({ content, className }: HomepageHeroProps) {
  return (
    <section
      className={cn(
        "grid h-[309px] grid-cols-[500px_1fr] items-start gap-[32px] overflow-hidden border-b border-[var(--riot-border)] px-[38px] pt-[30px] max-lg:h-auto max-lg:grid-cols-1 max-md:px-[20px] max-md:pt-[32px]",
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

      <div className="relative h-[309px] overflow-hidden max-lg:h-auto max-lg:min-h-[320px]">
        <Image
          src="/images/homepage/hero-art-reference.png"
          alt=""
          width={490}
          height={306}
          priority
          unoptimized
          className="absolute right-[-38px] top-[5px] h-auto w-[490px] max-w-none max-lg:relative max-lg:right-auto max-lg:top-0 max-lg:mx-auto max-lg:w-full"
        />
      </div>
    </section>
  );
}
