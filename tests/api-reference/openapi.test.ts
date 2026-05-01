import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/openapi/route";
import { API_ENDPOINTS, buildOpenApiDocument } from "@/lib/api-reference";

describe("api reference", () => {
  it("publishes every documented endpoint in the OpenAPI document", () => {
    const document = buildOpenApiDocument();

    for (const endpoint of API_ENDPOINTS) {
      const path = document.paths[endpoint.path as keyof typeof document.paths];
      expect(path).toBeDefined();
      expect(path[endpoint.method.toLowerCase() as keyof typeof path]).toBeDefined();
    }
  });

  it("serves the OpenAPI document as JSON", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/api/agents/register"].post.summary).toBe("Register an agent");
  });
});
