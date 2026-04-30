import { describe, expect, it } from "vitest";

import { createRegisterAgentRoute } from "@/app/api/agents/register/route";
import { createAgentPromptRoute } from "@/app/api/agents/[slug]/prompts/route";
import { createAgentUpdateRoute } from "@/app/api/agents/[slug]/updates/route";
import {
  createAgentService,
  createMemoryAgentRepository,
} from "@/lib/agents";
import { createUpdateService } from "@/lib/updates";
import { createPromptService, type StoredAgentPromptRecord } from "@/lib/prompts";
import type { PromptRepository } from "@/lib/prompts/types";

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function createRoutes(now = () => new Date("2026-04-19T12:00:00.000Z")) {
  const repository = createMemoryAgentRepository();
  const promptRepository: PromptRepository & { prompts: StoredAgentPromptRecord[] } = {
    prompts: [],
    async findPromptBySlug(slug) {
      return promptRepository.prompts.find((prompt) => prompt.slug === slug) ?? null;
    },
    async findPublicPromptBySlug(slug) {
      const prompt = promptRepository.prompts.find((entry) => entry.slug === slug);
      return prompt
        ? {
            ...prompt,
            agentName: "Orbit Ops Agent",
            agentSlug: "orbit-ops-agent",
          }
        : null;
    },
    async createAgentPrompt(input) {
      const record: StoredAgentPromptRecord = {
        id: `prompt_${promptRepository.prompts.length + 1}`,
        ...input,
      };
      promptRepository.prompts.push(record);
      return record;
    },
    async listPublicPrompts() {
      return [];
    },
    async listPublicPromptsByAgentId(agentId) {
      return promptRepository.prompts.filter((prompt) => prompt.agentId === agentId);
    },
  };
  const agentService = createAgentService(repository);
  const updateService = createUpdateService(repository, { now });
  const promptService = createPromptService(promptRepository, repository, { now });

  return {
    repository,
    promptRepository,
    register: createRegisterAgentRoute(agentService),
    postUpdate: createAgentUpdateRoute(updateService),
    postPrompt: createAgentPromptRoute(promptService),
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

describe("agent prompt posting route", () => {
  it("valid prompt payload returns 201 and stores the prompt", async () => {
    const { postPrompt, register, promptRepository } = createRoutes();
    const registration = await registerAgent(register);

    const response = await postPrompt(
      new Request("http://localhost/api/agents/orbit-ops-agent/prompts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({
          title: "Release risk brief",
          description: "Summarizes public release notes into operator risks.",
          prompt: "Review these notes and identify launch risks.",
          expectedOutput: "A short brief with risks, mitigations, and questions.",
          tags: ["release", "risk"],
        }),
      }),
      {
        params: Promise.resolve({ slug: "orbit-ops-agent" }),
      },
    );
    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      prompt: {
        title: "Release risk brief",
        slug: "release-risk-brief",
        tags: ["release", "risk"],
      },
      publicPath: "/prompts/release-risk-brief",
    });
    expect(promptRepository.prompts).toHaveLength(1);
  });
});
