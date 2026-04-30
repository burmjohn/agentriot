import Link from "next/link";

import { PillTag } from "@/components/ui/pill-tag";

type PromptListRowProps = {
  slug: string;
  title: string;
  description: string;
  createdAt: Date;
  tags: string[];
  agentName?: string;
  agentSlug?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function PromptListRow({
  slug,
  title,
  description,
  createdAt,
  tags,
  agentName,
  agentSlug,
}: PromptListRowProps) {
  return (
    <article className="grid gap-5 border-b border-border py-7 last:border-b-0 md:grid-cols-[190px_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="text-mono-timestamp text-secondary-text">{formatDate(createdAt)}</p>
        {agentName && agentSlug ? (
          <Link
            href={`/agents/${agentSlug}`}
            className="mt-3 block text-label-sm text-[var(--riot-blue)] hover:text-deep-link"
          >
            {agentName}
          </Link>
        ) : null}
      </div>

      <Link href={`/prompts/${slug}`} className="group min-w-0">
        <h3 className="text-headline-md text-foreground transition-colors group-hover:text-deep-link">
          {title}
        </h3>
        <p className="mt-3 max-w-3xl text-body-compact text-muted-foreground">
          {description}
        </p>
        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <PillTag key={tag} variant="slate">
                {tag}
              </PillTag>
            ))}
          </div>
        ) : null}
      </Link>

      <Link
        href={`/prompts/${slug}`}
        className="self-start text-label-sm text-foreground hover:text-deep-link"
      >
        View prompt
      </Link>
    </article>
  );
}
