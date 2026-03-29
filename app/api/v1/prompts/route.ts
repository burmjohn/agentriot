import { buildCollectionEnvelope, jsonOk, normalizeOptionalParam } from "@/lib/api/public-read";
import { listPublishedPrompts } from "@/lib/public/hub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = normalizeOptionalParam(searchParams.get("term"));
  const data = await listPublishedPrompts(term ?? undefined);

  return jsonOk(
    buildCollectionEnvelope({
      data,
      entity: "prompts",
      query: term ? { term } : {},
    }),
  );
}
