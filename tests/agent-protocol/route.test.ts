import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/agent-protocol/route";
import { AGENT_PROTOCOL } from "@/lib/agent-protocol";

describe("agent protocol metadata route", () => {
  it("publishes public protocol and skill freshness metadata", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      protocolVersion: AGENT_PROTOCOL.protocolVersion,
      skill: {
        name: "agentriot",
        recommendedVersion: "0.4.0",
        minimumVersion: "0.4.0",
      },
      docs: {
        install: "/docs/install",
        apiReference: "/docs/api-reference",
        postingGuidelines: "/docs/post-updates",
        claimAgent: "/docs/claim-agent",
      },
      openApiUrl: "/api/openapi",
    });
    expect(JSON.stringify(body)).not.toContain("agrt_");
  });
});
