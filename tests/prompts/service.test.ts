import { describe, expect, it } from "vitest";

import { createMemoryAgentRepository } from "@/lib/agents";
import { createPromptService, type StoredAgentPromptRecord } from "@/lib/prompts";
import type { PromptRepository } from "@/lib/prompts/types";

function createMemoryPromptRepository(): PromptRepository & {
  prompts: StoredAgentPromptRecord[];
} {
  const repository: PromptRepository & { prompts: StoredAgentPromptRecord[] } = {
    prompts: [],
    async findPromptBySlug(slug) {
      return repository.prompts.find((prompt) => prompt.slug === slug) ?? null;
    },
    async findPublicPromptBySlug(slug) {
      const prompt = repository.prompts.find((entry) => entry.slug === slug);
      return prompt
        ? {
            ...prompt,
            agentName: "Atlas Research Agent",
            agentSlug: "atlas-research-agent",
          }
        : null;
    },
    async createAgentPrompt(input) {
      const record: StoredAgentPromptRecord = {
        id: `prompt_${repository.prompts.length + 1}`,
        ...input,
      };
      repository.prompts.push(record);
      return record;
    },
    async listPublicPrompts() {
      return repository.prompts.map((prompt) => ({
        ...prompt,
        agentName: "Atlas Research Agent",
        agentSlug: "atlas-research-agent",
      }));
    },
    async listPublicPromptsByAgentId(agentId) {
      return repository.prompts.filter((prompt) => prompt.agentId === agentId);
    },
  };

  return repository;
}

describe("prompt service", () => {
  it("publishes prompts tied to an authenticated agent", async () => {
    const agentRepository = createMemoryAgentRepository({
      agents: [
        {
          id: "agent_1",
          slug: "atlas-research-agent",
          name: "Atlas Research Agent",
          tagline: "Tracks launch quality.",
          description: "Publishes safe release reviews.",
          avatarUrl: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
          primarySoftwareId: null,
          features: [],
          skillsTools: [],
          createdAt: new Date("2026-04-19T12:00:00.000Z"),
          updatedAt: new Date("2026-04-19T12:00:00.000Z"),
          lastPostedAt: null,
          status: "active",
          metaTitle: null,
          metaDescription: null,
        },
      ],
      keys: [
        {
          id: "key_1",
          agentId: "agent_1",
          keyHash: "fa3c7277f6b570a2840702bd4cb9cceb094f453815919dd338cd90a51c7e0cfc",
          keyPrefix: "agrt_tes",
          createdAt: new Date("2026-04-19T12:00:00.000Z"),
          revokedAt: null,
          rotatedAt: null,
          isActive: true,
        },
      ],
    });
    const promptRepository = createMemoryPromptRepository();
    const service = createPromptService(promptRepository, agentRepository, {
      now: () => new Date("2026-04-20T12:00:00.000Z"),
    });

    const prompt = await service.publish({
      agentSlug: "atlas-research-agent",
      apiKey: "agrt_test_key",
      payload: {
        title: "Release risk brief",
        description: "Summarizes release notes into a public operator brief.",
        prompt: "Review these public release notes and identify launch risks.",
        expectedOutput: "A short brief with risks, mitigations, and follow-up questions.",
        tags: ["release", "risk"],
      },
    });

    expect(prompt).toMatchObject({
      agentId: "agent_1",
      slug: "release-risk-brief",
      title: "Release risk brief",
      tags: ["release", "risk"],
    });
    expect(promptRepository.prompts).toHaveLength(1);
  });

  it("rejects unauthenticated prompt submissions", async () => {
    const agentRepository = createMemoryAgentRepository();
    const promptRepository = createMemoryPromptRepository();
    const service = createPromptService(promptRepository, agentRepository);

    await expect(
      service.publish({
        agentSlug: "missing-agent",
        apiKey: "bad-key",
        payload: {
          title: "Prompt",
          description: "Description",
          prompt: "Prompt text",
          expectedOutput: "Expected output",
        },
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
