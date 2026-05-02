import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  ExternalLink,
  Newspaper,
  Star,
  TerminalSquare,
} from "lucide-react";

import { EmptyState } from "@/components/public/empty-state";
import { PublicShell } from "@/components/public/public-shell";
import { SectionHeader } from "@/components/public/section-header";
import { PillTag } from "@/components/ui/pill-tag";
import { buildMetadata, buildNoindexMetadata } from "@/lib/seo/metadata";
import { getSoftwareCategories, getSoftwareEntries } from "@/lib/software";
import type { SoftwareEntryRecord } from "@/lib/software/types";

type SoftwareResourceLink = {
  key: keyof Pick<
    SoftwareEntryRecord,
    "officialUrl" | "githubUrl" | "docsUrl" | "downloadUrl"
  >;
  label: string;
};

const resourceLinks: SoftwareResourceLink[] = [
  { key: "officialUrl", label: "Official" },
  { key: "githubUrl", label: "GitHub" },
  { key: "docsUrl", label: "Docs" },
  { key: "downloadUrl", label: "Download" },
];

function normalizeCategoryValue(value?: string) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function buildCategoryHref(category?: string) {
  return category
    ? `/software?category=${encodeURIComponent(category)}`
    : "/software";
}

function mergeMetadata(base: Metadata, overrides: Metadata): Metadata {
  return {
    ...base,
    ...overrides,
    robots: overrides.robots ?? base.robots,
  };
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function countEntriesByCategory(entries: SoftwareEntryRecord[]) {
  return entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.category] = (counts[entry.category] ?? 0) + 1;
    return counts;
  }, {});
}

function getAvailableResourceLinks(entry: SoftwareEntryRecord) {
  return resourceLinks
    .map((resource) => ({
      ...resource,
      href: entry[resource.key],
    }))
    .filter(
      (resource): resource is SoftwareResourceLink & { href: string } =>
        typeof resource.href === "string" && resource.href.length > 0,
    );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const selectedCategory = normalizeCategoryValue(category);
  const baseMetadata = buildMetadata({
    title: selectedCategory ? `${selectedCategory} software` : "Software Directory",
    description:
      "Browse indexed agent software, frameworks, developer tools, and linked public coverage.",
    canonical: "/software",
    type: "website",
  });

  return selectedCategory
    ? mergeMetadata(baseMetadata, buildNoindexMetadata())
    : baseMetadata;
}

export default async function SoftwareIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selectedCategory = normalizeCategoryValue(category);
  await connection();

  const [categories, allEntries] = await Promise.all([
    getSoftwareCategories(),
    getSoftwareEntries(),
  ]);
  const entries = selectedCategory
    ? allEntries.filter(
        (entry) => entry.category.toLowerCase() === selectedCategory.toLowerCase(),
      )
    : allEntries;
  const categoryCounts = countEntriesByCategory(allEntries);
  const linkedStoryCount = allEntries.reduce(
    (total, entry) => total + entry.relatedNewsIds.length,
    0,
  );

  return (
    <PublicShell mainClassName="mx-auto max-w-[1300px] px-6 py-10 md:py-16">
      <section className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <PillTag variant="blue">DIRECTORY</PillTag>
            {selectedCategory ? (
              <PillTag variant="slate">{selectedCategory}</PillTag>
            ) : null}
          </div>
          <h1 className="mt-6 max-w-5xl font-display text-display-md text-foreground">
            Software directory
          </h1>
          <p className="mt-6 max-w-3xl text-body-relaxed text-muted-foreground">
            A data-backed index of agent software, frameworks, and developer
            tools with official resources and linked site coverage.
          </p>
        </div>

        <aside className="rounded-[8px] border border-border bg-[#F7F9FC] p-6">
          <span className="text-label-light text-secondary-text">
            DIRECTORY STATUS
          </span>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <DirectoryStat
              icon={TerminalSquare}
              label="Listed tools"
              value={allEntries.length}
            />
            <DirectoryStat
              icon={Box}
              label="Categories"
              value={categories.length}
            />
            <DirectoryStat
              icon={Newspaper}
              label="Linked stories"
              value={linkedStoryCount}
            />
            <DirectoryStat icon={Star} label="Showing" value={entries.length} />
          </div>
        </aside>
      </section>

      <section className="border-b border-border py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="text-label-light text-secondary-text">
              FILTER BY CATEGORY
            </span>
            <p className="mt-2 text-body-compact text-secondary-text">
              {selectedCategory
                ? formatCount(entries.length, "entry", "entries")
                : formatCount(allEntries.length, "entry", "entries")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <CategoryFilterLink
              href={buildCategoryHref()}
              label="All software"
              count={allEntries.length}
              active={!selectedCategory}
            />
            {categories.map((entryCategory) => (
              <CategoryFilterLink
                key={entryCategory}
                href={buildCategoryHref(entryCategory)}
                label={entryCategory}
                count={categoryCounts[entryCategory] ?? 0}
                active={selectedCategory === entryCategory}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <SectionHeader
          eyebrow={selectedCategory ? selectedCategory : "ALL SOFTWARE"}
          headline={
            selectedCategory
              ? `${selectedCategory} tools`
              : "Indexed software"
          }
        />

        {entries.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <SoftwareDirectoryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="No software matched this filter"
              description="Try a different category, or return to the main directory to browse every entry."
            />
          </div>
        )}
      </section>
    </PublicShell>
  );
}

function DirectoryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Box;
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 border-t border-border pt-4">
      <Icon className="size-4 text-[var(--riot-blue)]" aria-hidden="true" />
      <p className="mt-3 font-display text-[28px] leading-none text-foreground">
        {value}
      </p>
      <p className="mt-2 text-label-xs text-secondary-text">{label}</p>
    </div>
  );
}

function CategoryFilterLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex items-center gap-2 rounded-[8px] bg-[var(--riot-blue)] px-3 py-2 text-label-xs text-white transition-colors"
          : "inline-flex items-center gap-2 rounded-[8px] border border-border bg-white px-3 py-2 text-label-xs text-secondary-text transition-colors hover:border-[var(--riot-blue)] hover:text-[var(--riot-blue)]"
      }
    >
      <span>{label}</span>
      <span
        className={
          active
            ? "rounded-[6px] bg-white/15 px-1.5 py-0.5 text-[10px]"
            : "rounded-[6px] bg-[#F7F9FC] px-1.5 py-0.5 text-[10px] text-secondary-text"
        }
      >
        {count}
      </span>
    </Link>
  );
}

function SoftwareDirectoryCard({ entry }: { entry: SoftwareEntryRecord }) {
  const availableLinks = getAvailableResourceLinks(entry);

  return (
    <article className="flex flex-col md:min-h-[360px] rounded-[8px] border border-border bg-white p-6 transition-colors hover:border-[var(--riot-blue)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[8px] border border-border bg-[#F7F9FC] text-[var(--riot-blue)]">
          <TerminalSquare className="size-5" aria-hidden="true" />
        </div>
        <PillTag variant="slate">{entry.category}</PillTag>
      </div>

      <div className="mt-6 min-w-0">
        <h2 className="font-display text-headline-lg text-foreground">
          <Link href={`/software/${entry.slug}`} className="hover:text-deep-link">
            {entry.name}
          </Link>
        </h2>
        <p className="mt-4 text-body-compact text-secondary-text">
          {entry.description}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {entry.tags.slice(0, 4).map((tag) => (
          <PillTag key={tag} variant="white">
            {tag}
          </PillTag>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <div className="flex flex-wrap gap-2">
          {availableLinks.map((resource) => (
            <a
              key={resource.key}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-border px-2.5 py-1.5 text-label-xs text-secondary-text transition-colors hover:border-[var(--riot-blue)] hover:text-[var(--riot-blue)]"
            >
              {resource.label}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <span className="text-label-xs text-secondary-text">
            {formatCount(entry.relatedNewsIds.length, "linked story", "linked stories")}
          </span>
          <Link
            href={`/software/${entry.slug}`}
            className="inline-flex items-center gap-2 text-label-sm text-[var(--riot-blue)] hover:text-deep-link"
          >
            View profile
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
