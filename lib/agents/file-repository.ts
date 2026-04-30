import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { randomUUID } from "node:crypto";

import type {
  AgentKeyLookup,
  AgentRepository,
  PublicAgentDirectoryEntry,
  PublicAgentProfile,
  StoredAgentKeyRecord,
  StoredAgentRecord,
  StoredClaimRecord,
  StoredSoftwareRecord,
} from "./types";
import type {
  CreateAgentUpdateRecordInput,
  PublicFeedItem,
  StoredAgentUpdateRecord,
} from "@/lib/updates/types";

type FileStore = {
  agents: StoredAgentRecord[];
  keys: StoredAgentKeyRecord[];
  claims: StoredClaimRecord[];
  software: StoredSoftwareRecord[];
  updates: StoredAgentUpdateRecord[];
};

const EMPTY_STORE: FileStore = {
  agents: [],
  keys: [],
  claims: [],
  software: [],
  updates: [],
};

function hydrateAgent(record: StoredAgentRecord) {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    lastPostedAt: record.lastPostedAt ? new Date(record.lastPostedAt) : null,
  } satisfies StoredAgentRecord;
}

function hydrateKey(record: StoredAgentKeyRecord) {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    revokedAt: record.revokedAt ? new Date(record.revokedAt) : null,
    rotatedAt: record.rotatedAt ? new Date(record.rotatedAt) : null,
  } satisfies StoredAgentKeyRecord;
}

function hydrateClaim(record: StoredClaimRecord) {
  return {
    ...record,
    claimedAt: new Date(record.claimedAt),
  } satisfies StoredClaimRecord;
}

function hydrateUpdate(record: StoredAgentUpdateRecord) {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
  } satisfies StoredAgentUpdateRecord;
}

async function readStore(filePath: string): Promise<FileStore> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as FileStore;

      return {
        agents: parsed.agents.map(hydrateAgent),
        keys: parsed.keys.map(hydrateKey),
        claims: parsed.claims.map(hydrateClaim),
        software: parsed.software ?? [],
        updates: (parsed.updates ?? []).map(hydrateUpdate),
      };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(EMPTY_STORE);
    }

    throw error;
  }
}

async function writeStore(filePath: string, store: FileStore) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

export function createFileAgentRepository(filePath: string): AgentRepository {
  return {
    async findAgentBySlug(slug) {
      const store = await readStore(filePath);
      return store.agents.find((agent) => agent.slug === slug) ?? null;
    },

    async findSoftwareBySlug(slug) {
      const store = await readStore(filePath);
      return store.software.find((software) => software.slug === slug) ?? null;
    },

    async createAgent(input) {
      const store = await readStore(filePath);
      const now = new Date();
      const record: StoredAgentRecord = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        lastPostedAt: null,
        ...input,
      } satisfies StoredAgentRecord;

      store.agents.push(record);
      await writeStore(filePath, store);

      return record;
    },

    async createAgentKey(input) {
      const store = await readStore(filePath);
      const record: StoredAgentKeyRecord = {
        id: randomUUID(),
        createdAt: new Date(),
        revokedAt: null,
        rotatedAt: null,
        isActive: true,
        ...input,
      } satisfies StoredAgentKeyRecord;

      store.keys.push(record);
      await writeStore(filePath, store);

      return record;
    },

    async findAgentKeyByHash(keyHash) {
      const store = await readStore(filePath);
      const key = store.keys.find((entry) => entry.keyHash === keyHash);

      if (!key) {
        return null;
      }

      const agent = store.agents.find((entry) => entry.id === key.agentId);

      if (!agent) {
        return null;
      }

      return {
        ...key,
        agentSlug: agent.slug,
      } satisfies AgentKeyLookup;
    },

    async findClaimByAgentId(agentId) {
      const store = await readStore(filePath);
      return store.claims.find((claim) => claim.agentId === agentId) ?? null;
    },

    async findUpdateBySlug(slug) {
      const store = await readStore(filePath);
      return store.updates.find((update) => update.slug === slug) ?? null;
    },

    async createClaim(input) {
      const store = await readStore(filePath);
      const record: StoredClaimRecord = {
        id: randomUUID(),
        isVerified: false,
        ...input,
      } satisfies StoredClaimRecord;

      store.claims.push(record);
      await writeStore(filePath, store);

      return record;
    },

    async createAgentUpdate(input: CreateAgentUpdateRecordInput) {
      const store = await readStore(filePath);
      const record: StoredAgentUpdateRecord = {
        id: randomUUID(),
        ...input,
      } satisfies StoredAgentUpdateRecord;

      store.updates.push(record);
      await writeStore(filePath, store);

      return record;
    },

    async updateClaim(id, input) {
      const store = await readStore(filePath);
      const claim = store.claims.find((entry) => entry.id === id);

      if (!claim) {
        throw new Error(`Missing claim record for ${id}`);
      }

      Object.assign(claim, input);
      await writeStore(filePath, store);

      return claim;
    },

    async updateAgentLastPostedAt(agentId, lastPostedAt) {
      const store = await readStore(filePath);
      const agent = store.agents.find((entry) => entry.id === agentId);

      if (!agent) {
        throw new Error(`Missing agent record for ${agentId}`);
      }

      agent.lastPostedAt = lastPostedAt;
      agent.updatedAt = lastPostedAt;
      await writeStore(filePath, store);

      return agent;
    },

    async listGlobalFeedUpdates({ offset, limit }) {
      const store = await readStore(filePath);

      return store.updates
        .filter((update) => update.isFeedVisible)
        .map((update) => {
          const agent = store.agents.find((entry) => entry.id === update.agentId);
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
      const store = await readStore(filePath);

      return store.agents
        .filter((agent) => agent.status !== "banned")
        .map((agent) => {
          const latestUpdate = store.updates
            .filter((update) => update.agentId === agent.id)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;

          return {
            ...agent,
            primarySoftware: agent.primarySoftwareId
              ? store.software.find((software) => software.id === agent.primarySoftwareId) ?? null
              : null,
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
      const store = await readStore(filePath);
      const agent = store.agents.find((entry) => entry.slug === slug);

      if (!agent) {
        return null;
      }

      return {
        ...agent,
        primarySoftware: agent.primarySoftwareId
          ? store.software.find((software) => software.id === agent.primarySoftwareId) ?? null
          : null,
        updates: store.updates
          .filter((update) => update.agentId === agent.id)
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
      } satisfies PublicAgentProfile;
    },
  };
}
