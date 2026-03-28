import { jsonOk } from "@/lib/api/public-read";

export async function GET() {
  return jsonOk({
    data: {
      version: "v1",
      collections: [
        "/api/v1/articles",
        "/api/v1/tutorials",
        "/api/v1/agents",
        "/api/v1/prompts",
        "/api/v1/skills",
        "/api/v1/taxonomy?scope=agent",
        "/api/v1/search?q=repo",
      ],
      details: [
        "/api/v1/articles/:slug",
        "/api/v1/tutorials/:slug",
        "/api/v1/agents/:slug",
        "/api/v1/prompts/:slug",
        "/api/v1/skills/:slug",
      ],
    },
    meta: {
      entity: "api",
      version: "v1",
    },
  });
}
