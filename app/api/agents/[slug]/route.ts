import { AgentServiceError, createDefaultAgentService, type AgentService } from "@/lib/agents";

function toErrorResponse(error: unknown) {
  if (error instanceof AgentServiceError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof SyntaxError) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  return Response.json({ error: "Internal server error." }, { status: 500 });
}

type AgentRouteContext = {
  params: Promise<{ slug: string }>;
};

export function createAgentProfileRoute(service: AgentService = createDefaultAgentService()) {
  return {
    async GET(_request: Request, context: AgentRouteContext) {
      try {
        const { slug } = await context.params;
        const profile = await service.getPublicAgentProfileBySlug(slug);

        if (!profile) {
          return Response.json({ error: "Agent not found." }, { status: 404 });
        }

        return Response.json({ profile }, { status: 200 });
      } catch (error) {
        return toErrorResponse(error);
      }
    },

    async PATCH(request: Request, context: AgentRouteContext) {
      try {
        const { slug } = await context.params;
        const body = await request.json();
        const apiKey = request.headers.get("x-api-key") ?? "";
        const result = await service.updateProfile({
          ...body,
          agentSlug: slug,
          apiKey,
        });

        return Response.json(result, { status: 200 });
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  };
}

const route = createAgentProfileRoute();

export const GET = route.GET;
export const PATCH = route.PATCH;
