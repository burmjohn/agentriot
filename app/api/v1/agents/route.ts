import { buildCollectionEnvelope, jsonOk, normalizeOptionalParam } from "@/lib/api/public-read";
import { listPublishedAgents } from "@/lib/public/hub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = normalizeOptionalParam(searchParams.get("term"));
  const data = await listPublishedAgents(term ?? undefined);

  return jsonOk(
    buildCollectionEnvelope({
      data,
      entity: "agents",
      query: term ? { term } : {},
    }),
  );
}
