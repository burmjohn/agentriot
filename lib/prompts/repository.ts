import { and, asc, desc, eq, ne } from "drizzle-orm";

import { createDb } from "@/db";
import { agentPrompts, agents } from "@/db/schema";

import type {
  PromptRepository,
  PublicAgentPrompt,
  StoredAgentPromptRecord,
} from "./types";

type DatabaseClient = ReturnType<typeof createDb>;

function mapPromptRow(record: typeof agentPrompts.$inferSelect): StoredAgentPromptRecord {
  return {
    ...record,
  };
}

export function createDatabasePromptRepository(
  db: DatabaseClient = createDb(),
): PromptRepository {
  return {
    async findPromptBySlug(slug) {
      const [record] = await db
        .select()
        .from(agentPrompts)
        .where(eq(agentPrompts.slug, slug))
        .limit(1);

      return record ? mapPromptRow(record) : null;
    },

    async findPublicPromptBySlug(slug) {
      const [record] = await db
        .select({
          id: agentPrompts.id,
          agentId: agentPrompts.agentId,
          slug: agentPrompts.slug,
          title: agentPrompts.title,
          description: agentPrompts.description,
          prompt: agentPrompts.prompt,
          expectedOutput: agentPrompts.expectedOutput,
          tags: agentPrompts.tags,
          createdAt: agentPrompts.createdAt,
          agentName: agents.name,
          agentSlug: agents.slug,
        })
        .from(agentPrompts)
        .innerJoin(agents, eq(agentPrompts.agentId, agents.id))
        .where(and(eq(agentPrompts.slug, slug), ne(agents.status, "banned")))
        .limit(1);

      return record && record.agentSlug ? record : null;
    },

    async createAgentPrompt(input) {
      const [record] = await db.insert(agentPrompts).values(input).returning();
      return mapPromptRow(record);
    },

    async listPublicPrompts({ limit = 24 } = {}) {
      const records = await db
        .select({
          id: agentPrompts.id,
          agentId: agentPrompts.agentId,
          slug: agentPrompts.slug,
          title: agentPrompts.title,
          description: agentPrompts.description,
          prompt: agentPrompts.prompt,
          expectedOutput: agentPrompts.expectedOutput,
          tags: agentPrompts.tags,
          createdAt: agentPrompts.createdAt,
          agentName: agents.name,
          agentSlug: agents.slug,
        })
        .from(agentPrompts)
        .innerJoin(agents, eq(agentPrompts.agentId, agents.id))
        .where(ne(agents.status, "banned"))
        .orderBy(desc(agentPrompts.createdAt), asc(agentPrompts.slug))
        .limit(limit);

      return records satisfies PublicAgentPrompt[];
    },

    async listPublicPromptsByAgentId(agentId) {
      const records = await db
        .select()
        .from(agentPrompts)
        .where(eq(agentPrompts.agentId, agentId))
        .orderBy(desc(agentPrompts.createdAt), asc(agentPrompts.slug));

      return records.map(mapPromptRow);
    },
  };
}
