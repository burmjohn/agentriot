import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { PillTag } from "./pill-tag";

export interface FeatureCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  kicker?: string;
  headline: string;
  deck?: string;
  tag?: string;
  tagVariant?: React.ComponentProps<typeof PillTag>["variant"];
  imageUrl?: string;
  imageAlt?: string;
  variant?: "dark" | "accent";
  accentColor?: string;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      className,
      kicker,
      headline,
      deck,
      tag,
      tagVariant = "blue",
      imageUrl,
      imageAlt = "",
      variant = "dark",
      accentColor = "#1457F5",
      ...props
    },
    ref
  ) => {
    const isAccent = variant === "accent";
    const LIGHT_ACCENTS = new Set(["#eaf3ff", "#fff0ec", "#f5c518", "#ffffff"]);
    const isLightAccent = isAccent && LIGHT_ACCENTS.has(accentColor.toLowerCase());

    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden transition-colors duration-150 ease-out rounded-[24px] p-8",
          !isAccent && "border border-white bg-[#131313] text-white",
          isAccent && (isLightAccent ? "text-black border border-black/10" : "text-white border border-white/10"),
          className
        )}
        style={isAccent ? { backgroundColor: accentColor } : undefined}
        {...props}
      >
        {imageUrl && (
          <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-[3px] border border-image-frame">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              unoptimized
              className="object-cover"
              loading="lazy"
            />
          </div>
        )}

        {tag && (
          <div className="mb-4">
            <PillTag variant={tagVariant}>{tag}</PillTag>
          </div>
        )}

        {kicker && (
          <span
            className={cn(
              "block text-label-light mb-3",
              !isAccent && "text-[#949494]"
            )}
          >
            {kicker}
          </span>
        )}

        <h2
          className={cn(
              "text-headline-lg transition-colors duration-150 ease-out group-hover:text-[var(--riot-blue)] cursor-pointer",
            !isAccent && "text-white"
          )}
        >
          {headline}
        </h2>

        {deck && (
          <p
            className={cn(
              "mt-4 text-body-relaxed",
              !isAccent && "text-[#e9e9e9]"
            )}
          >
            {deck}
          </p>
        )}
      </div>
    );
  }
);
FeatureCard.displayName = "FeatureCard";

export { FeatureCard };
