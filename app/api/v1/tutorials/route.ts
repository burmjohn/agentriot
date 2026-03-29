import { buildCollectionEnvelope, jsonOk, normalizeOptionalParam } from "@/lib/api/public-read";
import { listPublishedContent } from "@/lib/public/hub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = normalizeOptionalParam(searchParams.get("term"));
  const data = await listPublishedContent("tutorial", term ?? undefined);

  return jsonOk(
    buildCollectionEnvelope({
      data,
      entity: "tutorials",
      query: term ? { term } : {},
    }),
  );
}
