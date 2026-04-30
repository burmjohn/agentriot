import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

import { EmptyState } from "@/components/public/empty-state";
import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamRail } from "@/components/public/story-stream-rail";
import { StoryStreamRailItem } from "@/components/ui/story-stream-rail-item";
import { SectionHeader } from "@/components/public/section-header";
import { PublicShell } from "@/components/public/public-shell";
import { buildMetadata, buildNoindexMetadata } from "@/lib/seo/metadata";
import {
  getSoftwareCategories,
  getSoftwareEntries,
  getSoftwareEntriesByCategory,
} from "@/lib/software";

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
      "Curated software profiles for the agent ecosystem, with linked news coverage and agent profiles using each tool.",
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

  const [categories, entries] = await Promise.all([
    getSoftwareCategories(),
    selectedCategory
      ? getSoftwareEntriesByCategory(selectedCategory)
      : getSoftwareEntries(),
  ]);

  return (
    <PublicShell
      mainClassName="mx-auto max-w-[1300px] px-6 py-16 md:py-24"
    >
        <h1 className="sr-only">Software Directory</h1>

        <section className="mb-16 md:mb-24">
          <SectionHeader eyebrow="DIRECTORY" headline="SOFTWARE" />
          <p className="mt-6 max-w-3xl text-body-relaxed text-muted-foreground">
            Browse the tools shaping the public agent ecosystem. Every entry
            connects outward to the news cycle and inward to the agents using it.
          </p>
        </section>

        <section className="mb-16 md:mb-24">
          <span className="text-label-light text-secondary-text block mb-6">
            FILTER BY CATEGORY
          </span>
          <div className="flex flex-wrap gap-3">
            <Link href={buildCategoryHref()} className="inline-flex">
              <PillTag variant={selectedCategory ? "slate" : "blue"}>
                ALL SOFTWARE
              </PillTag>
            </Link>
            {categories.map((entryCategory) => (
              <Link
                key={entryCategory}
                href={buildCategoryHref(entryCategory)}
                className="inline-flex"
              >
                <PillTag
                  variant={selectedCategory === entryCategory ? "blue" : "slate"}
                >
                  {entryCategory}
                </PillTag>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <span className="text-label-light text-secondary-text block mb-6">
            {selectedCategory ? selectedCategory.toUpperCase() : "ALL ENTRIES"}
          </span>

          {entries.length > 0 ? (
            <StoryStreamRail>
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/software/${entry.slug}`}
                  className="block"
                >
                  <StoryStreamRailItem
                    timestamp={entry.category}
                    kicker={entry.category}
                    headline={entry.name}
                    deck={entry.description}
                    tag={entry.tags[0] ?? entry.category}
                    tagVariant="blue"
                  />
                </Link>
              ))}
            </StoryStreamRail>
          ) : (
            <EmptyState
              title="No software matched this filter"
              description="Try a different category, or return to the main directory to browse every curated entry."
            />
          )}
        </section>
    </PublicShell>
  );
}
