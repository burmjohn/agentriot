import { buildOpenApiDocument } from "@/lib/api-reference";

export function GET() {
  return Response.json(buildOpenApiDocument(), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
