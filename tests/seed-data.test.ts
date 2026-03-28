import { describe, expect, it } from "vitest";
import { seedData } from "@/db/seed-data";

describe("seedData", () => {
  it("keeps public slugs unique within each collection", () => {
    expect(new Set(seedData.agents.map((item) => item.slug)).size).toBe(
      seedData.agents.length,
    );
    expect(new Set(seedData.prompts.map((item) => item.slug)).size).toBe(
      seedData.prompts.length,
    );
    expect(new Set(seedData.skills.map((item) => item.slug)).size).toBe(
      seedData.skills.length,
    );
    expect(new Set(seedData.content.map((item) => `${item.kind}:${item.slug}`)).size).toBe(
      seedData.content.length,
    );
  });

  it("only references known records in relation maps", () => {
    const agentIds = new Set(seedData.agents.map((item) => item.key));
    const promptIds = new Set(seedData.prompts.map((item) => item.key));
    const skillIds = new Set(seedData.skills.map((item) => item.key));
    const contentIds = new Set(seedData.content.map((item) => item.key));
    const taxonomyIds = new Set(seedData.taxonomy.map((item) => item.key));

    seedData.contentAgentRelations.forEach((item) => {
      expect(contentIds.has(item.contentKey)).toBe(true);
      expect(agentIds.has(item.agentKey)).toBe(true);
    });
    seedData.contentPromptRelations.forEach((item) => {
      expect(contentIds.has(item.contentKey)).toBe(true);
      expect(promptIds.has(item.promptKey)).toBe(true);
    });
    seedData.contentSkillRelations.forEach((item) => {
      expect(contentIds.has(item.contentKey)).toBe(true);
      expect(skillIds.has(item.skillKey)).toBe(true);
    });
    seedData.agentPromptRelations.forEach((item) => {
      expect(agentIds.has(item.agentKey)).toBe(true);
      expect(promptIds.has(item.promptKey)).toBe(true);
    });
    seedData.agentSkillRelations.forEach((item) => {
      expect(agentIds.has(item.agentKey)).toBe(true);
      expect(skillIds.has(item.skillKey)).toBe(true);
    });
    seedData.skillPromptRelations.forEach((item) => {
      expect(skillIds.has(item.skillKey)).toBe(true);
      expect(promptIds.has(item.promptKey)).toBe(true);
    });
    seedData.taxonomyAssignments.forEach((item) => {
      expect(taxonomyIds.has(item.taxonomyKey)).toBe(true);
      if (item.scope === "content") expect(contentIds.has(item.entityKey)).toBe(true);
      if (item.scope === "agent") expect(agentIds.has(item.entityKey)).toBe(true);
      if (item.scope === "prompt") expect(promptIds.has(item.entityKey)).toBe(true);
      if (item.scope === "skill") expect(skillIds.has(item.entityKey)).toBe(true);
    });
  });
});
