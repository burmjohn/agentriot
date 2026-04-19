import { createDefaultUpdateService, UpdateServiceError, type UpdateService } from "@/lib/updates";

function toErrorResponse(error: unknown) {
  if (error instanceof UpdateServiceError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof SyntaxError) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  return Response.json({ error: "Internal server error." }, { status: 500 });
}

export function createAgentUpdateRoute(service: UpdateService = createDefaultUpdateService()) {
  return async function POST(
    request: Request,
    context: {
      params: Promise<{ slug: string }>;
    },
  ) {
    try {
      const { slug } = await context.params;
      const body = await request.json();
      const apiKey = request.headers.get("x-api-key") ?? "";
      const update = await service.publish({
        agentSlug: slug,
        apiKey,
        payload: body,
      });

      return Response.json({ update }, { status: 201 });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export const POST = createAgentUpdateRoute();
