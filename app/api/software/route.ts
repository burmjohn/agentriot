import { getSoftwareEntries } from "@/lib/software";

type SoftwareListItem = {
  slug: string;
  name: string;
  category: string;
  description: string;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesQuery(item: SoftwareListItem, query: string) {
  if (!query) return true;

  const haystack = normalizeText([
    item.name,
    item.slug,
    item.category,
    item.description,
  ].join(" "));

  return haystack.includes(normalizeText(query));
}

export function createSoftwareListRoute(
  listSoftware = getSoftwareEntries,
) {
  return async function GET(request: Request) {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";
    const entries = await listSoftware();

    return Response.json({
      items: entries
        .map((entry) => ({
          slug: entry.slug,
          name: entry.name,
          category: entry.category,
          description: entry.description,
        }))
        .filter((entry) => matchesQuery(entry, query))
        .slice(0, 25),
    });
  };
}

export const GET = createSoftwareListRoute();
