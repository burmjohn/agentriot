import { buildCollectionEnvelope, jsonOk, normalizeOptionalParam } from "@/lib/api/public-read";
import { listPublishedSkills } from "@/lib/public/hub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = normalizeOptionalParam(searchParams.get("term"));
  const data = await listPublishedSkills(term ?? undefined);

  return jsonOk(
    buildCollectionEnvelope({
      data,
      entity: "skills",
      query: term ? { term } : {},
    }),
  );
}
