import {
  buildCollectionEnvelope,
  jsonOk,
  normalizeSearchQuery,
} from "@/lib/api/public-read";
import { searchPublishedGraph } from "@/lib/public/hub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeSearchQuery(searchParams.get("q"));
  const data = query ? await searchPublishedGraph(query) : [];

  return jsonOk(
    buildCollectionEnvelope({
      data,
      entity: "search",
      query: query ? { q: query } : {},
    }),
  );
}
