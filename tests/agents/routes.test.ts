import { describe, expect, it } from "vitest";

import { createClaimAgentRoute } from "@/app/api/agents/claim/route";
import { createRegisterAgentRoute } from "@/app/api/agents/register/route";
import {
  createAgentService,
  createMemoryAgentRepository,
} from "@/lib/agents";

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function createRoutes() {
  const repository = createMemoryAgentRepository();
  const service = createAgentService(repository);

  return {
    repository,
    register: createRegisterAgentRoute(service),
    claim: createClaimAgentRoute(service),
  };
}

describe("agent registration and claim routes", () => {
  it("registration with valid payload returns 201 and a one-time API key", async () => {
    const { register, repository } = createRoutes();

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Atlas Research Agent",
          tagline: "Tracks launches and major releases.",
          description: "Monitors agent ecosystems and summarizes notable public changes.",
          features: ["timeline summaries", "signal tagging"],
          skillsTools: ["web search", "benchmarking"],
        }),
      }),
    );

    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      agent: {
        slug: "atlas-research-agent",
        name: "Atlas Research Agent",
      },
    });
    expect(body.apiKey).toEqual(expect.stringMatching(/^agrt_[a-f0-9]+$/));
    expect(repository.keys).toHaveLength(1);
    expect(repository.keys[0]?.keyHash).not.toContain(String(body.apiKey));
    expect(repository.keys[0]?.keyPrefix).toBe(String(body.apiKey).slice(0, 8));
  });

  it("registration with a duplicate name generates a unique slug", async () => {
    const { register } = createRoutes();
    const payload = {
      name: "Atlas Research Agent",
      tagline: "Tracks launches and major releases.",
      description: "Monitors agent ecosystems and summarizes notable public changes.",
      features: ["timeline summaries"],
      skillsTools: ["web search"],
    };

    await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const secondResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const secondBody = await readJson(secondResponse);

    expect(secondResponse.status).toBe(201);
    expect(secondBody).toMatchObject({
      agent: {
        slug: "atlas-research-agent-2",
      },
    });
  });

  it("registration with a reserved slug is rejected", async () => {
    const { register } = createRoutes();

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Admin",
          tagline: "Reserved route collision.",
          description: "Should not be allowed to claim a protected slug.",
          features: [],
          skillsTools: [],
        }),
      }),
    );

    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body.error).toContain("reserved");
  });

  it("claim with a valid API key succeeds", async () => {
    const { register, claim, repository } = createRoutes();

    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Orbit Ops Agent",
          tagline: "Ships production updates.",
          description: "Coordinates releases and status updates for public agent systems.",
          features: ["release tracking"],
          skillsTools: ["deploy automation"],
        }),
      }),
    );
    const registrationBody = await readJson(registrationResponse);

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "orbit-ops-agent",
          apiKey: registrationBody.apiKey,
          email: "owner@example.com",
        }),
      }),
    );

    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      claimed: true,
      email: "owner@example.com",
    });
    expect(repository.claims).toHaveLength(1);
    expect(repository.claims[0]).toMatchObject({
      email: "owner@example.com",
    });
  });

  it("claim with an invalid API key returns 401", async () => {
    const { claim } = createRoutes();

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "atlas-research-agent",
          apiKey: "agrt_invalid-key",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("Invalid API key"),
    });
  });

  it("claim with a revoked API key returns 403", async () => {
    const { register, claim, repository } = createRoutes();

    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Muted Agent",
          tagline: "Used to verify revoked access.",
          description: "Records claim failures when a key has been revoked.",
          features: [],
          skillsTools: [],
        }),
      }),
    );
    const registrationBody = await readJson(registrationResponse);

    repository.keys[0] = {
      ...repository.keys[0]!,
      revokedAt: new Date("2026-04-19T00:00:00.000Z"),
      isActive: false,
    };

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "muted-agent",
          apiKey: registrationBody.apiKey,
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("revoked"),
    });
  });
});
