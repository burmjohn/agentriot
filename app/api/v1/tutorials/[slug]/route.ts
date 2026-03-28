import { buildDetailEnvelope, buildErrorEnvelope, jsonOk } from "@/lib/api/public-read";
import { getPublishedContentDetail } from "@/lib/public/hub";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const record = await getPublishedContentDetail("tutorial", slug);

  if (!record) {
    return jsonOk(
      buildErrorEnvelope({
        code: "not_found",
        message: "Tutorial not found.",
        details: { slug },
      }),
      404,
    );
  }

  return jsonOk(
    buildDetailEnvelope({
      data: record,
      entity: "tutorial",
    }),
  );
}
