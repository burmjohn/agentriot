import {
  buildCollectionEnvelope,
  buildErrorEnvelope,
  jsonOk,
  parseTaxonomyScope,
} from "@/lib/api/public-read";
import { listTaxonomyTermsByScope } from "@/lib/public/hub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawScope = searchParams.get("scope");
  const scope = parseTaxonomyScope(rawScope);

  if (!scope) {
    return jsonOk(
      buildErrorEnvelope({
        code: "invalid_scope",
        message: "Scope must be one of content, agent, prompt, or skill.",
        details: { scope: rawScope ?? "" },
      }),
      400,
    );
  }

  const data = await listTaxonomyTermsByScope(scope);

  return jsonOk(
    buildCollectionEnvelope({
      data,
      entity: "taxonomy",
      query: { scope },
    }),
  );
}
