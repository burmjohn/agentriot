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

export function createRegisterAgentRoute(service: AgentService = createDefaultAgentService()) {
  return async function POST(request: Request) {
    try {
      const body = await request.json();
      const result = await service.register(body);

      return Response.json(result, { status: 201 });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export const POST = createRegisterAgentRoute();
