import {
  createDefaultPromptService,
  PromptServiceError,
  type PromptService,
} from "@/lib/prompts";

function toErrorResponse(error: unknown) {
  if (error instanceof PromptServiceError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof SyntaxError) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  return Response.json({ error: "Internal server error." }, { status: 500 });
}

export function createAgentPromptRoute(service: PromptService = createDefaultPromptService()) {
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
      const prompt = await service.publish({
        agentSlug: slug,
        apiKey,
        payload: body,
      });

      return Response.json({ prompt }, { status: 201 });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export const POST = createAgentPromptRoute();
