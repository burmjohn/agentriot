import { describe, expect, it } from "vitest";

import { createRegisterAgentRoute } from "@/app/api/agents/register/route";
import { createAgentUpdateRoute } from "@/app/api/agents/[slug]/updates/route";
import {
  createAgentService,
  createMemoryAgentRepository,
} from "@/lib/agents";
import { createUpdateService } from "@/lib/updates";

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function createRoutes(now = () => new Date("2026-04-19T12:00:00.000Z")) {
  const repository = createMemoryAgentRepository();
  const agentService = createAgentService(repository);
  const updateService = createUpdateService(repository, { now });

  return {
    repository,
    register: createRegisterAgentRoute(agentService),
    postUpdate: createAgentUpdateRoute(updateService),
  };
}

async function registerAgent(register: ReturnType<typeof createRoutes>["register"]) {
  const response = await register(
    new Request("http://localhost/api/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Orbit Ops Agent",
        tagline: "Ships production updates.",
        description: "Coordinates launches, milestones, and status posts for public agents.",
        features: ["release tracking"],
        skillsTools: ["deploy automation"],
      }),
    }),
  );

  return readJson(response);
}

describe("agent update posting route", () => {
  it("valid payload returns 201 and the created update", async () => {
    const { postUpdate, register, repository } = createRoutes();
    const registration = await registerAgent(register);

    const response = await postUpdate(
      new Request("http://localhost/api/agents/orbit-ops-agent/updates", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({
          title: "Major release",
          summary: "Shipped a bigger orchestration runtime.",
          whatChanged: "Added a new scheduler, cleaner rollback flow, and better public docs.",
          skillsTools: ["scheduler", "rollbacks"],
          signalType: "major_release",
          publicLink: "https://example.com/releases/major-release",
        }),
      }),
      {
        params: Promise.resolve({ slug: "orbit-ops-agent" }),
      },
    );

    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      update: {
        title: "Major release",
        signalType: "major_release",
        isFeedVisible: true,
      },
    });
    expect(repository.updates).toHaveLength(1);
    expect(repository.agents[0]?.lastPostedAt?.toISOString()).toBe("2026-04-19T12:00:00.000Z");
  });

  it("second update within one hour returns 429", async () => {
    const now = () => new Date("2026-04-19T12:00:00.000Z");
    const { postUpdate, register } = createRoutes(now);
    const registration = await registerAgent(register);
    const request = () =>
      postUpdate(
        new Request("http://localhost/api/agents/orbit-ops-agent/updates", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": String(registration.apiKey),
          },
          body: JSON.stringify({
            title: "Launch update",
            summary: "Posted to the timeline.",
            whatChanged: "Shared a high-signal launch milestone with the network.",
            skillsTools: ["deploy automation"],
            signalType: "launch",
          }),
        }),
        {
          params: Promise.resolve({ slug: "orbit-ops-agent" }),
        },
      );

    expect((await request()).status).toBe(201);

    const secondResponse = await request();

    expect(secondResponse.status).toBe(429);
    expect(await readJson(secondResponse)).toMatchObject({
      error: expect.stringContaining("hour"),
    });
  });

  it("oversized whatChanged returns 400", async () => {
    const { postUpdate, register } = createRoutes();
    const registration = await registerAgent(register);

    const response = await postUpdate(
      new Request("http://localhost/api/agents/orbit-ops-agent/updates", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({
          title: "Guardrail test",
          summary: "Should be rejected.",
          whatChanged: "x".repeat(501),
          skillsTools: ["validation"],
          signalType: "milestone",
        }),
      }),
      {
        params: Promise.resolve({ slug: "orbit-ops-agent" }),
      },
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("whatChanged"),
    });
  });

  it("invalid signalType returns 400", async () => {
    const { postUpdate, register } = createRoutes();
    const registration = await registerAgent(register);

    const response = await postUpdate(
      new Request("http://localhost/api/agents/orbit-ops-agent/updates", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({
          title: "Signal test",
          summary: "Should be rejected.",
          whatChanged: "The payload used a signal outside the contract.",
          skillsTools: ["validation"],
          signalType: "breaking_news",
        }),
      }),
      {
        params: Promise.resolve({ slug: "orbit-ops-agent" }),
      },
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("signalType"),
    });
  });
});
