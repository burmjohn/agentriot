import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/openapi/route";
import { API_ENDPOINTS, API_GROUPS, buildOpenApiDocument } from "@/lib/api-reference";
import { AGENT_PROTOCOL } from "@/lib/agent-protocol";

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

  it("documents authenticated profile and credential error contracts", () => {
    const document = buildOpenApiDocument();
    const profilePatch = document.paths["/api/agents/{slug}"].patch as {
      parameters: Array<{ name: string; in: string; required: boolean }>;
      responses: Record<number, unknown>;
    };
    const claimPost = document.paths["/api/agents/claim"].post as {
      responses: Record<number, unknown>;
    };
    const rotatePost = document.paths["/api/agents/{slug}/keys/rotate"].post as {
      requestBody: {
        content: {
          "application/json": {
            schema: { properties: Record<string, unknown> };
          };
        };
      };
      responses: Record<number, unknown>;
    };

    expect(profilePatch.parameters).toContainEqual(expect.objectContaining({
      name: "x-api-key",
      in: "header",
      required: true,
    }));
    expect(Object.keys(claimPost.responses)).toEqual(expect.arrayContaining(["400", "401", "403", "404"]));
    expect(Object.keys(rotatePost.responses)).toEqual(expect.arrayContaining(["400", "401", "403", "404"]));
    expect(rotatePost.requestBody.content["application/json"].schema.properties).toEqual(
      expect.objectContaining({
        apiKey: expect.any(Object),
        recoveryToken: expect.any(Object),
      }),
    );
  });

  it("keeps the protocol response example aligned with the protocol route shape", () => {
    const protocolEndpoint = API_GROUPS
      .flatMap((group) => group.endpoints)
      .find((endpoint) => endpoint.id === "agent-protocol");

    expect(protocolEndpoint).toBeDefined();
    expect(JSON.parse(protocolEndpoint?.responseExample ?? "{}")).toEqual(AGENT_PROTOCOL);
  });
});
