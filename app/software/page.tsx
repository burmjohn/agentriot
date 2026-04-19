import type { Metadata } from "next";
import Link from "next/link";

import { FeatureCard } from "@/components/ui/feature-card";
import { NavShell } from "@/components/ui/nav-shell";
import { PillTag } from "@/components/ui/pill-tag";
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
  return category ? `/software?category=${encodeURIComponent(category)}` : "/software";
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
  const [categories, entries] = await Promise.all([
    getSoftwareCategories(),
    selectedCategory ? getSoftwareEntriesByCategory(selectedCategory) : getSoftwareEntries(),
  ]);

  return (
    <div className="min-h-screen bg-[#131313] text-white">
      <NavShell
        links={[
          { label: "NEWS", href: "/news" },
          { label: "SOFTWARE", href: "/software", active: true },
          { label: "AGENTS", href: "/agents" },
          { label: "FEED", href: "/feed" },
          { label: "ABOUT", href: "/about" },
        ]}
        ctaLabel="JOIN"
        ctaHref="/join"
      />

      <main className="mx-auto flex max-w-[1300px] flex-col gap-12 px-6 py-16">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <PillTag variant="mint">CURATED DIRECTORY</PillTag>
              <PillTag variant="slate">EDITORIAL LINKS INCLUDED</PillTag>
            </div>
            <h1 className="mt-6 font-display text-display-md text-white">Software directory</h1>
            <p className="mt-4 max-w-3xl text-body-relaxed text-[#e9e9e9]">
              Browse the tools shaping the public agent ecosystem. Every entry connects outward to
              the news cycle and inward to the agents using it.
            </p>
          </div>

          <div className="rounded-[24px] border border-white bg-[#131313] p-6">
            <p className="text-label-sm text-[#949494]">Indexation note</p>
            <p className="mt-3 text-body-compact text-[#e9e9e9]">
              Filtered category states help visitors browse, but only the main directory is meant
              to rank.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap gap-3">
            <Link href={buildCategoryHref()} className="inline-flex">
              <PillTag variant={selectedCategory ? "slate" : "mint"}>All software</PillTag>
            </Link>
            {categories.map((entryCategory) => (
              <Link key={entryCategory} href={buildCategoryHref(entryCategory)} className="inline-flex">
                <PillTag variant={selectedCategory === entryCategory ? "mint" : "slate"}>
                  {entryCategory}
                </PillTag>
              </Link>
            ))}
          </div>
        </section>

        <section>
          {entries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((entry) => (
                <Link key={entry.id} href={`/software/${entry.slug}`} className="block">
                  <FeatureCard
                    headline={entry.name}
                    deck={entry.description}
                    kicker={entry.category}
                    tag={entry.category}
                    tagVariant="mint"
                    className="h-full"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/30 bg-[#131313] p-8">
              <p className="text-headline-sm text-white">No software matched this filter</p>
              <p className="mt-3 max-w-2xl text-body-compact text-[#949494]">
                Try a different category, or return to the main directory to browse every curated
                entry.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
