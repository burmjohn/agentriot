import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PillTag } from "@/components/ui/pill-tag";

export interface NewsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  headline: string;
  deck: string;
  tag: string;
  tagVariant?: React.ComponentProps<typeof PillTag>["variant"];
  href: string;
  publishedAt?: string;
  author?: string;
}

const NewsCard = React.forwardRef<HTMLDivElement, NewsCardProps>(
  (
    {
      className,
      headline,
      deck,
      tag,
      tagVariant = "mint",
      href,
      publishedAt,
      author,
      ...props
    },
    ref
  ) => {
    return (
      <Link href={href} className="block group">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-[20px] border border-white bg-[#131313] p-6 transition-colors duration-150 ease-out h-full",
            className
          )}
          {...props}
        >
          <div className="mb-4">
            <PillTag variant={tagVariant}>{tag}</PillTag>
          </div>

          <h3 className="text-headline-md text-white transition-colors duration-150 ease-out group-hover:text-[#3860be]">
            {headline}
          </h3>

          <p className="mt-3 text-body-compact text-[#949494] line-clamp-3">
            {deck}
          </p>

          {(publishedAt || author) && (
            <div className="mt-4 flex items-center gap-3 text-mono-timestamp text-[#949494]">
              {publishedAt && <span>{publishedAt}</span>}
              {publishedAt && author && <span>·</span>}
              {author && <span>{author}</span>}
            </div>
          )}
        </div>
      </Link>
    );
  }
);
NewsCard.displayName = "NewsCard";

export { NewsCard };
