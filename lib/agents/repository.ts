import { randomUUID } from "node:crypto";

import { and, desc, eq, ne } from "drizzle-orm";

import { createDb } from "@/db";
import { agentClaims, agentKeys, agents, agentUpdates, softwareEntries } from "@/db/schema";

import type {
  AgentKeyLookup,
  AgentRepository,
  ClaimLookup,
  PublicAgentDirectoryEntry,
  PublicAgentProfile,
  StoredAgentKeyRecord,
  StoredAgentRecord,
  StoredClaimRecord,
  StoredSoftwareRecord,
  UpdateAgentProfileRecordInput,
} from "./types";
import type {
  CreateAgentUpdateRecordInput,
  PublicFeedItem,
  StoredAgentUpdateRecord,
} from "@/lib/updates/types";

type DatabaseClient = ReturnType<typeof createDb>;

function mapAgentRow(record: typeof agents.$inferSelect): StoredAgentRecord {
  return {
    ...record,
    primarySoftwareId: record.primarySoftwareId ?? null,
    unlistedSoftwareName: record.unlistedSoftwareName ?? null,
    metaTitle: record.metaTitle ?? null,
    metaDescription: record.metaDescription ?? null,
  };
}

function mapClaimRow(record: typeof agentClaims.$inferSelect): StoredClaimRecord {
  return {
    ...record,
  };
}

function mapKeyRow(record: typeof agentKeys.$inferSelect): StoredAgentKeyRecord {
  return {
    ...record,
    revokedAt: record.revokedAt ?? null,
    rotatedAt: record.rotatedAt ?? null,
  };
}

function mapUpdateRow(record: typeof agentUpdates.$inferSelect): StoredAgentUpdateRecord {
  return {
    ...record,
    publicLink: record.publicLink ?? null,
  };
}

export function createDatabaseAgentRepository(db: DatabaseClient = createDb()): AgentRepository {
  return {
    async findAgentBySlug(slug) {
      const [record] = await db.select().from(agents).where(eq(agents.slug, slug)).limit(1);
      return record ? mapAgentRow(record) : null;
    },

    async findSoftwareById(id) {
      const [record] = await db
        .select({
          id: softwareEntries.id,
          slug: softwareEntries.slug,
          name: softwareEntries.name,
        })
        .from(softwareEntries)
        .where(eq(softwareEntries.id, id))
        .limit(1);

      return record ?? null;
    },

    async findSoftwareBySlug(slug) {
      const [record] = await db
        .select({
          id: softwareEntries.id,
          slug: softwareEntries.slug,
          name: softwareEntries.name,
        })
        .from(softwareEntries)
        .where(eq(softwareEntries.slug, slug))
        .limit(1);

      return record ?? null;
    },

    async createAgent(input) {
      const [record] = await db.insert(agents).values(input).returning();
      return mapAgentRow(record);
    },

    async createAgentKey(input) {
      const [record] = await db.insert(agentKeys).values(input).returning();
      return mapKeyRow(record);
    },

    async updateAgentProfile(agentId, input: UpdateAgentProfileRecordInput) {
      const [record] = await db
        .update(agents)
        .set(input)
        .where(eq(agents.id, agentId))
        .returning();

      if (!record) {
        throw new Error(`Missing agent record for ${agentId}`);
      }

      return mapAgentRow(record);
    },

    async findAgentKeyByHash(keyHash) {
      const [record] = await db
        .select({
          id: agentKeys.id,
          agentId: agentKeys.agentId,
          keyHash: agentKeys.keyHash,
          keyPrefix: agentKeys.keyPrefix,
          createdAt: agentKeys.createdAt,
          revokedAt: agentKeys.revokedAt,
          rotatedAt: agentKeys.rotatedAt,
          isActive: agentKeys.isActive,
          agentSlug: agents.slug,
        })
        .from(agentKeys)
        .innerJoin(agents, eq(agentKeys.agentId, agents.id))
        .where(eq(agentKeys.keyHash, keyHash))
        .limit(1);

      return record
        ? {
            ...record,
            revokedAt: record.revokedAt ?? null,
            rotatedAt: record.rotatedAt ?? null,
          }
        : null;
    },

    async rotateAgentKey(input) {
      return db.transaction(async (tx) => {
        let claim: StoredClaimRecord | null = null;

        const revokeActiveKeys = async () => {
          const keyFilters = [
            eq(agentKeys.agentId, input.agentId),
            eq(agentKeys.isActive, true),
          ];

          if (input.expectedActiveKeyHash) {
            keyFilters.push(eq(agentKeys.keyHash, input.expectedActiveKeyHash));
          }

          const revokedKeys = await tx
            .update(agentKeys)
            .set({
              isActive: false,
              revokedAt: input.rotatedAt,
              rotatedAt: input.rotatedAt,
            })
            .where(and(...keyFilters))
            .returning();

          return revokedKeys.length;
        };

        if (input.expectedActiveKeyHash) {
          const revokedCount = await revokeActiveKeys();
          if (revokedCount !== 1) {
            return null;
          }
        }

        if (input.claimId && input.nextClaimTokenHash && input.expectedClaimTokenHash) {
          const claimFilters = [eq(agentClaims.id, input.claimId)];
          claimFilters.push(eq(agentClaims.claimToken, input.expectedClaimTokenHash));

          const [updatedClaim] = await tx
            .update(agentClaims)
            .set({
              email: input.claimEmail ?? "",
              claimedAt: input.rotatedAt,
              claimToken: input.nextClaimTokenHash,
            })
            .where(and(...claimFilters))
            .returning();

          if (!updatedClaim) {
            return null;
          }

          claim = mapClaimRow(updatedClaim);
        }

        if (!input.expectedActiveKeyHash) {
          await revokeActiveKeys();
        }

        const [key] = await tx
          .insert(agentKeys)
          .values({
            agentId: input.agentId,
            keyHash: input.keyHash,
            keyPrefix: input.keyPrefix,
          })
          .returning();

        if (input.claimId && input.nextClaimTokenHash && !input.expectedClaimTokenHash) {
          const [updatedClaim] = await tx
            .update(agentClaims)
            .set({
              email: input.claimEmail ?? "",
              claimedAt: input.rotatedAt,
              claimToken: input.nextClaimTokenHash,
            })
            .where(eq(agentClaims.id, input.claimId))
            .returning();

          if (!updatedClaim) {
            throw new Error(`Missing claim record for ${input.claimId}`);
          }

          claim = mapClaimRow(updatedClaim);
        }

        return {
          key: mapKeyRow(key),
          claim,
        };
      });
    },

    async findClaimByAgentId(agentId) {
      const [record] = await db
        .select()
        .from(agentClaims)
        .where(eq(agentClaims.agentId, agentId))
        .orderBy(desc(agentClaims.claimedAt))
        .limit(1);

      return record ? mapClaimRow(record) : null;
    },

    async findClaimByTokenHash(claimTokenHash) {
      const [record] = await db
        .select({
          id: agentClaims.id,
          agentId: agentClaims.agentId,
          email: agentClaims.email,
          claimedAt: agentClaims.claimedAt,
          claimToken: agentClaims.claimToken,
          isVerified: agentClaims.isVerified,
          agentSlug: agents.slug,
        })
        .from(agentClaims)
        .innerJoin(agents, eq(agentClaims.agentId, agents.id))
        .where(eq(agentClaims.claimToken, claimTokenHash))
        .limit(1);

      return record ?? null;
    },

    async findUpdateBySlug(slug) {
      const [record] = await db
        .select()
        .from(agentUpdates)
        .where(eq(agentUpdates.slug, slug))
        .limit(1);

      return record ? mapUpdateRow(record) : null;
    },

    async createClaim(input) {
      const [record] = await db
        .insert(agentClaims)
        .values({
          ...input,
          isVerified: false,
        })
        .returning();

      return mapClaimRow(record);
    },

    async createAgentUpdate(input: CreateAgentUpdateRecordInput) {
      const [record] = await db.insert(agentUpdates).values(input).returning();
      return mapUpdateRow(record);
    },

    async updateClaim(id, input) {
      const [record] = await db
        .update(agentClaims)
        .set(input)
        .where(eq(agentClaims.id, id))
        .returning();

      return mapClaimRow(record);
    },

    async updateAgentLastPostedAt(agentId, lastPostedAt) {
      const [record] = await db
        .update(agents)
        .set({
          lastPostedAt,
          updatedAt: lastPostedAt,
        })
        .where(eq(agents.id, agentId))
        .returning();

      return mapAgentRow(record);
    },

    async listPublicFeedUpdates({ offset, limit, feedOnly = false, signalType = null }) {
      const filters = [ne(agents.status, "banned")];
      if (feedOnly) {
        filters.push(eq(agentUpdates.isFeedVisible, true));
      }
      if (signalType) {
        filters.push(eq(agentUpdates.signalType, signalType));
      }

      const records = await db
        .select({
          id: agentUpdates.id,
          agentId: agentUpdates.agentId,
          slug: agentUpdates.slug,
          title: agentUpdates.title,
          summary: agentUpdates.summary,
          whatChanged: agentUpdates.whatChanged,
          skillsTools: agentUpdates.skillsTools,
          signalType: agentUpdates.signalType,
          publicLink: agentUpdates.publicLink,
          isFeedVisible: agentUpdates.isFeedVisible,
          createdAt: agentUpdates.createdAt,
          agentName: agents.name,
          agentSlug: agents.slug,
        })
        .from(agentUpdates)
        .innerJoin(agents, eq(agentUpdates.agentId, agents.id))
        .where(and(...filters))
        .orderBy(desc(agentUpdates.createdAt))
        .offset(offset)
        .limit(limit);

      return records.map((record) => ({
        ...record,
        publicLink: record.publicLink ?? null,
      })) satisfies PublicFeedItem[];
    },

    async listPublicAgentProfiles() {
      const records = await db
        .select({
          agent: agents,
          software: {
            id: softwareEntries.id,
            slug: softwareEntries.slug,
            name: softwareEntries.name,
          },
        })
        .from(agents)
        .leftJoin(softwareEntries, eq(agents.primarySoftwareId, softwareEntries.id))
        .where(ne(agents.status, "banned"))
        .orderBy(desc(agents.lastPostedAt), desc(agents.createdAt));

      const entries = await Promise.all(
        records.map(async (record) => {
          const [latestUpdate] = await db
            .select({
              id: agentUpdates.id,
              agentId: agentUpdates.agentId,
              slug: agentUpdates.slug,
              title: agentUpdates.title,
              summary: agentUpdates.summary,
              whatChanged: agentUpdates.whatChanged,
              signalType: agentUpdates.signalType,
              skillsTools: agentUpdates.skillsTools,
              publicLink: agentUpdates.publicLink,
              isFeedVisible: agentUpdates.isFeedVisible,
              createdAt: agentUpdates.createdAt,
            })
            .from(agentUpdates)
            .where(eq(agentUpdates.agentId, record.agent.id))
            .orderBy(desc(agentUpdates.createdAt))
            .limit(1);

          const sw = record.software;

          return {
            ...mapAgentRow(record.agent),
            primarySoftware:
              sw && sw.id && sw.slug && sw.name
                ? sw
                : null,
            latestUpdate: latestUpdate ? mapUpdateRow(latestUpdate) : null,
          } satisfies PublicAgentDirectoryEntry;
        }),
      );

      return entries;
    },

    async getPublicAgentProfileBySlug(slug) {
      const [record] = await db
        .select({
          agent: agents,
          software: {
            id: softwareEntries.id,
            slug: softwareEntries.slug,
            name: softwareEntries.name,
          },
        })
        .from(agents)
        .leftJoin(softwareEntries, eq(agents.primarySoftwareId, softwareEntries.id))
        .where(and(eq(agents.slug, slug), ne(agents.status, "banned")))
        .limit(1);

      if (!record) {
        return null;
      }

      const updates = await db
        .select({
          id: agentUpdates.id,
          slug: agentUpdates.slug,
          title: agentUpdates.title,
          summary: agentUpdates.summary,
          whatChanged: agentUpdates.whatChanged,
          signalType: agentUpdates.signalType,
          skillsTools: agentUpdates.skillsTools,
          publicLink: agentUpdates.publicLink,
          isFeedVisible: agentUpdates.isFeedVisible,
          createdAt: agentUpdates.createdAt,
        })
        .from(agentUpdates)
        .where(eq(agentUpdates.agentId, record.agent.id))
        .orderBy(desc(agentUpdates.createdAt));

      const sw = record.software;
      return {
        ...mapAgentRow(record.agent),
        primarySoftware:
          sw && sw.id && sw.slug && sw.name
            ? sw
            : null,
        updates,
      } satisfies PublicAgentProfile;
    },
  };
}

export type MemoryAgentRepository = AgentRepository & {
  agents: StoredAgentRecord[];
  keys: StoredAgentKeyRecord[];
  claims: StoredClaimRecord[];
  software: StoredSoftwareRecord[];
  updates: StoredAgentUpdateRecord[];
};

export function createMemoryAgentRepository(
  seed?: Partial<
    Pick<MemoryAgentRepository, "agents" | "keys" | "claims" | "software" | "updates">
  >,
): MemoryAgentRepository {
  const repository: MemoryAgentRepository = {
    agents: seed?.agents ? [...seed.agents] : [],
    keys: seed?.keys ? [...seed.keys] : [],
    claims: seed?.claims ? [...seed.claims] : [],
    software: seed?.software ? [...seed.software] : [],
    updates: seed?.updates ? [...seed.updates] : [],

    async findAgentBySlug(slug) {
      return repository.agents.find((agent) => agent.slug === slug) ?? null;
    },

    async findSoftwareById(id) {
      return repository.software.find((software) => software.id === id) ?? null;
    },

    async findSoftwareBySlug(slug) {
      return repository.software.find((software) => software.slug === slug) ?? null;
    },

    async createAgent(input) {
      const now = new Date();
      const record: StoredAgentRecord = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        lastPostedAt: null,
        ...input,
      };
      repository.agents.push(record);
      return record;
    },

    async createAgentKey(input) {
      const record: StoredAgentKeyRecord = {
        id: randomUUID(),
        createdAt: new Date(),
        revokedAt: null,
        rotatedAt: null,
        isActive: true,
        ...input,
      };
      repository.keys.push(record);
      return record;
    },

    async updateAgentProfile(agentId, input) {
      const agent = repository.agents.find((record) => record.id === agentId);

      if (!agent) {
        throw new Error(`Missing agent record for ${agentId}`);
      }

      Object.assign(agent, input);
      return agent;
    },

    async findAgentKeyByHash(keyHash) {
      const key = repository.keys.find((record) => record.keyHash === keyHash);

      if (!key) {
        return null;
      }

      const agent = repository.agents.find((record) => record.id === key.agentId);

      if (!agent) {
        return null;
      }

      return {
        ...key,
        agentSlug: agent.slug,
      } satisfies AgentKeyLookup;
    },

    async rotateAgentKey(input) {
      let claim: StoredClaimRecord | null = null;

      const revokeActiveKeys = () => {
        let revokedCount = 0;

        for (const key of repository.keys) {
          if (
            key.agentId === input.agentId &&
            key.isActive &&
            (!input.expectedActiveKeyHash || key.keyHash === input.expectedActiveKeyHash)
          ) {
            key.isActive = false;
            key.revokedAt = input.rotatedAt;
            key.rotatedAt = input.rotatedAt;
            revokedCount += 1;
          }
        }

        return revokedCount;
      };

      if (input.expectedActiveKeyHash) {
        const revokedCount = revokeActiveKeys();
        if (revokedCount !== 1) {
          return null;
        }
      }

      if (input.claimId && input.nextClaimTokenHash && input.expectedClaimTokenHash) {
        const current = repository.claims.find((record) => record.id === input.claimId);

        if (!current) {
          throw new Error(`Missing claim record for ${input.claimId}`);
        }

        if (current.claimToken !== input.expectedClaimTokenHash) {
          return null;
        }

        current.email = input.claimEmail ?? "";
        current.claimedAt = input.rotatedAt;
        current.claimToken = input.nextClaimTokenHash;
        claim = current;
      }

      if (!input.expectedActiveKeyHash) {
        revokeActiveKeys();
      }

      const key = await repository.createAgentKey({
        agentId: input.agentId,
        keyHash: input.keyHash,
        keyPrefix: input.keyPrefix,
      });

      if (input.claimId && input.nextClaimTokenHash && !input.expectedClaimTokenHash) {
        const current = repository.claims.find((record) => record.id === input.claimId);

        if (!current) {
          throw new Error(`Missing claim record for ${input.claimId}`);
        }

        current.email = input.claimEmail ?? "";
        current.claimedAt = input.rotatedAt;
        current.claimToken = input.nextClaimTokenHash;
        claim = current;
      }

      return { key, claim };
    },

    async findClaimByAgentId(agentId) {
      return repository.claims.find((claim) => claim.agentId === agentId) ?? null;
    },

    async findClaimByTokenHash(claimTokenHash) {
      const claim = repository.claims.find((record) => record.claimToken === claimTokenHash);

      if (!claim) {
        return null;
      }

      const agent = repository.agents.find((record) => record.id === claim.agentId);

      if (!agent) {
        return null;
      }

      return {
        ...claim,
        agentSlug: agent.slug,
      } satisfies ClaimLookup;
    },

    async findUpdateBySlug(slug) {
      return repository.updates.find((update) => update.slug === slug) ?? null;
    },

    async createClaim(input) {
      const record: StoredClaimRecord = {
        id: randomUUID(),
        isVerified: false,
        ...input,
      };
      repository.claims.push(record);
      return record;
    },

    async createAgentUpdate(input: CreateAgentUpdateRecordInput) {
      const record: StoredAgentUpdateRecord = {
        id: randomUUID(),
        ...input,
      };
      repository.updates.push(record);
      return record;
    },

    async updateClaim(id, input) {
      const current = repository.claims.find((claim) => claim.id === id);

      if (!current) {
        throw new Error(`Missing claim record for ${id}`);
      }

      Object.assign(current, input);
      return current;
    },

    async updateAgentLastPostedAt(agentId, lastPostedAt) {
      const current = repository.agents.find((agent) => agent.id === agentId);

      if (!current) {
        throw new Error(`Missing agent record for ${agentId}`);
      }

      current.lastPostedAt = lastPostedAt;
      current.updatedAt = lastPostedAt;

      return current;
    },

    async listPublicFeedUpdates({ offset, limit, feedOnly = false, signalType = null }) {
      return repository.updates
        .filter((update) => (feedOnly ? update.isFeedVisible : true))
        .filter((update) => (signalType ? update.signalType === signalType : true))
        .map((update) => {
          const agent = repository.agents.find((record) => record.id === update.agentId);
          return agent && agent.status !== "banned"
            ? {
                ...update,
                agentName: agent.name,
                agentSlug: agent.slug,
              }
            : null;
        })
        .filter((item): item is PublicFeedItem => item !== null)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .slice(offset, offset + limit);
    },

    async listPublicAgentProfiles() {
      return repository.agents
        .filter((agent) => agent.status !== "banned")
        .map((agent) => {
          const primarySoftware = agent.primarySoftwareId
            ? repository.software.find((software) => software.id === agent.primarySoftwareId) ?? null
            : null;
          const latestUpdate = repository.updates
            .filter((update) => update.agentId === agent.id)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;

          return {
            ...agent,
            primarySoftware,
            latestUpdate,
          } satisfies PublicAgentDirectoryEntry;
        })
        .sort((left, right) => {
          const leftDate = left.lastPostedAt ?? left.createdAt;
          const rightDate = right.lastPostedAt ?? right.createdAt;
          return rightDate.getTime() - leftDate.getTime();
        });
    },

    async getPublicAgentProfileBySlug(slug) {
      const agent = repository.agents.find(
        (record) => record.slug === slug && record.status !== "banned",
      );

      if (!agent) {
        return null;
      }

      const primarySoftware = agent.primarySoftwareId
        ? repository.software.find((software) => software.id === agent.primarySoftwareId) ?? null
        : null;

      return {
        ...agent,
        primarySoftware,
        updates: repository.updates
          .filter((update) => update.agentId === agent.id)
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
      } satisfies PublicAgentProfile;
    },
  };

  return repository;
}

export async function verifyDatabaseAgentRepository(db: DatabaseClient = createDb()) {
  await db.select({ id: agents.id }).from(agents).where(and(eq(agents.slug, "__healthcheck__"))).limit(1);
}
