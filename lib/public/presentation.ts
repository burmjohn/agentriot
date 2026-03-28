export type PublicTaxonomyTerm = {
  id: string;
  label: string;
  slug: string;
  kind: "category" | "tag" | "type";
  scope: "content" | "agent" | "prompt" | "skill";
};

export type GroupedTaxonomyTerms = {
  kind: PublicTaxonomyTerm["kind"];
  label: string;
  terms: PublicTaxonomyTerm[];
};

const taxonomyKindOrder: PublicTaxonomyTerm["kind"][] = [
  "category",
  "tag",
  "type",
];

const taxonomyKindLabels: Record<PublicTaxonomyTerm["kind"], string> = {
  category: "Category",
  tag: "Tags",
  type: "Types",
};

export function getPublicTaxonomyHref(term: PublicTaxonomyTerm) {
  const query = `?term=${encodeURIComponent(term.slug)}`;

  if (term.scope === "agent") {
    return `/agents${query}`;
  }

  if (term.scope === "prompt") {
    return `/prompts${query}`;
  }

  if (term.scope === "skill") {
    return `/skills${query}`;
  }

  return `/articles${query}`;
}

export function groupTaxonomyTermsByKind(terms: PublicTaxonomyTerm[]) {
  return taxonomyKindOrder
    .map((kind) => ({
      kind,
      label: taxonomyKindLabels[kind],
      terms: terms.filter((term) => term.kind === kind),
    }))
    .filter((group) => group.terms.length > 0)
    .map((group) => ({
      ...group,
      terms: [...group.terms].sort((a, b) => a.label.localeCompare(b.label)),
    })) satisfies GroupedTaxonomyTerms[];
}
