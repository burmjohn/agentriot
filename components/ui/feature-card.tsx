import * as React from "react";
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
      tagVariant = "mint",
      imageUrl,
      imageAlt = "",
      variant = "dark",
      accentColor = "#5200ff",
      ...props
    },
    ref
  ) => {
    const isAccent = variant === "accent";

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-[24px] border p-8 transition-colors duration-150 ease-out",
          isAccent
            ? "border-transparent"
            : "border-white bg-[#131313]",
          className
        )}
        style={isAccent ? { backgroundColor: accentColor } : undefined}
        {...props}
      >
        {imageUrl && (
          <div className="mb-6 overflow-hidden rounded-[4px]">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full h-auto object-cover"
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
              isAccent ? "text-white/80" : "text-[#949494]"
            )}
          >
            {kicker}
          </span>
        )}

        <h2
          className={cn(
            "text-headline-lg transition-colors duration-150 ease-out hover:text-[#3860be] cursor-pointer",
            isAccent ? "text-white" : "text-white"
          )}
        >
          {headline}
        </h2>

        {deck && (
          <p
            className={cn(
              "mt-4 text-body-relaxed",
              isAccent ? "text-white/80" : "text-[#e9e9e9]"
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
