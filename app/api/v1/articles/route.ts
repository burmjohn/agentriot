import { listPublishedContent } from "@/lib/public/hub";
import { buildCollectionEnvelope, jsonOk, normalizeOptionalParam } from "@/lib/api/public-read";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = normalizeOptionalParam(searchParams.get("term"));
  const data = await listPublishedContent("article", term ?? undefined);

  return jsonOk(
    buildCollectionEnvelope({
      data,
      entity: "articles",
      query: term ? { term } : {},
    }),
  );
}
