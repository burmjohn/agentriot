import { createHash, randomBytes } from "node:crypto";

import { createDatabaseAgentRepository } from "./repository";
import type {
  AgentRepository,
  ClaimAgentInput,
  ClaimAgentResult,
  PublicAgentProfile,
  RegisterAgentInput,
  RegisterAgentResult,
  RotateAgentKeyInput,
  RotateAgentKeyResult,
  UpdateAgentProfileInput,
  UpdateAgentProfileResult,
} from "./types";

export const RESERVED_AGENT_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "join",
  "docs",
  "about",
  "feed",
  "news",
  "software",
  "agents",
  "agent-instructions",
  "claim",
  "register",
  "search",
  "sitemap",
  "robots",
]);

export class AgentServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const PROFILE_LIMITS = {
  name: 120,
  tagline: 120,
  description: 1000,
  metaTitle: 120,
  metaDescription: 160,
  features: 8,
  skillsTools: 10,
} as const;

function assertInputObject<T extends object>(value: T | null | undefined, fieldName = "payload"): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AgentServiceError(`${fieldName} must be a JSON object.`, 400);
  }

  return value;
}

function assertNonEmptyString(value: unknown, fieldName: string, maxLength?: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AgentServiceError(`${fieldName} is required.`, 400);
  }

  const trimmed = value.trim();

  if (maxLength && trimmed.length > maxLength) {
    throw new AgentServiceError(`${fieldName} must be ${maxLength} characters or fewer.`, 400);
  }

  return trimmed;
}

function sanitizeList(value: unknown, fieldName = "list", maxItems?: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  const list = Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );

  if (maxItems && list.length > maxItems) {
    throw new AgentServiceError(`${fieldName} must include ${maxItems} items or fewer.`, 400);
  }

  return list;
}

function toSlugBase(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return base || "agent";
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeOptionalTextLimit(value: unknown, fieldName: string, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw new AgentServiceError(`${fieldName} must be ${maxLength} characters or fewer.`, 400);
  }

  return trimmed;
}

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function hashRecoveryToken(recoveryToken: string) {
  return createHash("sha256").update(recoveryToken).digest("hex");
}

function buildApiKey() {
  return `agrt_${randomBytes(24).toString("hex")}`;
}

function buildRecoveryToken() {
  return randomBytes(24).toString("hex");
}

function buildAvatarDataUrl(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="24" fill="#050B18"/><circle cx="80" cy="80" r="60" fill="#1457F5"/><text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#FFFFFF">${initials || "AR"}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function assertAvatarUrl(value: unknown, fallback: string) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const trimmed = value.trim();
  if (
    trimmed.startsWith("data:image/svg+xml") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  throw new AgentServiceError("avatarUrl must be an http(s) URL or SVG data URL.", 400);
}

async function createUniqueSlug(repository: AgentRepository, name: string) {
  const slugBase = toSlugBase(name);

  if (RESERVED_AGENT_SLUGS.has(slugBase)) {
    throw new AgentServiceError(`The slug \"${slugBase}\" is reserved.`, 400);
  }

  let candidate = slugBase;
  let suffix = 2;

  while (await repository.findAgentBySlug(candidate)) {
    candidate = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeEmail(email?: string) {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
}

async function authorizeAgentKey(repository: AgentRepository, agentSlug: string, apiKey: string) {
  const keyRecord = await repository.findAgentKeyByHash(hashApiKey(apiKey));

  if (!keyRecord || keyRecord.agentSlug !== agentSlug) {
    throw new AgentServiceError("Invalid API key for this agent.", 401);
  }

  if (!keyRecord.isActive || keyRecord.revokedAt) {
    throw new AgentServiceError("This API key has been revoked.", 403);
  }

  return keyRecord;
}

async function findVisibleAgent(repository: AgentRepository, agentSlug: string) {
  const agent = await repository.findAgentBySlug(agentSlug);

  if (!agent || agent.status === "banned") {
    throw new AgentServiceError("Agent not found.", 404);
  }

  return agent;
}

export function createAgentService(repository: AgentRepository) {
  return {
    async register(input: RegisterAgentInput): Promise<RegisterAgentResult> {
      input = assertInputObject(input);
      const name = assertNonEmptyString(input.name, "name", PROFILE_LIMITS.name);
      const tagline = assertNonEmptyString(input.tagline, "tagline", PROFILE_LIMITS.tagline);
      const description = assertNonEmptyString(
        input.description,
        "description",
        PROFILE_LIMITS.description,
      );
      const primarySoftwareSlug =
        typeof input.primarySoftwareSlug === "string" && input.primarySoftwareSlug.trim()
          ? input.primarySoftwareSlug.trim().toLowerCase()
          : undefined;
      const primarySoftwareId = normalizeOptionalText(input.primarySoftwareId);
      const softwareName = normalizeOptionalText(input.softwareName);

      const slug = await createUniqueSlug(repository, name);
      const softwareById = primarySoftwareId
        ? await repository.findSoftwareById(primarySoftwareId)
        : null;
      const softwareBySlug = !softwareById && primarySoftwareSlug
        ? await repository.findSoftwareBySlug(primarySoftwareSlug)
        : null;
      const softwareByName = !softwareById && !softwareBySlug && softwareName
        ? await repository.findSoftwareBySlug(toSlugBase(softwareName))
        : null;
      const software = softwareById ?? softwareBySlug ?? softwareByName;

      const unlistedSoftwareName = software ? null : softwareName || primarySoftwareSlug || null;

      const features = sanitizeList(input.features, "features", PROFILE_LIMITS.features);
      const skillsTools = sanitizeList(
        input.skillsTools,
        "skillsTools",
        PROFILE_LIMITS.skillsTools,
      );
      const apiKey = buildApiKey();

      const agent = await repository.createAgent({
        slug,
        name,
        tagline,
        description,
        avatarUrl: buildAvatarDataUrl(name),
        primarySoftwareId: software?.id ?? null,
        unlistedSoftwareName,
        features,
        skillsTools,
        status: "active",
        metaTitle: `${name} | AgentRiot`,
        metaDescription: description.slice(0, 160),
      });

      await repository.createAgentKey({
        agentId: agent.id,
        keyHash: hashApiKey(apiKey),
        keyPrefix: apiKey.slice(0, 8),
      });

      return {
        agent: {
          id: agent.id,
          slug: agent.slug,
          name: agent.name,
        },
        apiKey,
      };
    },

    async updateProfile(input: UpdateAgentProfileInput): Promise<UpdateAgentProfileResult> {
      input = assertInputObject(input);
      const agentSlug = assertNonEmptyString(input.agentSlug, "agentSlug").toLowerCase();
      const apiKey = assertNonEmptyString(input.apiKey, "apiKey");
      const agent = await findVisibleAgent(repository, agentSlug);
      const keyRecord = await authorizeAgentKey(repository, agentSlug, apiKey);

      if (agent.id !== keyRecord.agentId) {
        throw new AgentServiceError("Agent not found.", 404);
      }

      const name = input.name === undefined
        ? agent.name
        : assertNonEmptyString(input.name, "name", PROFILE_LIMITS.name);
      const tagline = input.tagline === undefined
        ? agent.tagline
        : assertNonEmptyString(input.tagline, "tagline", PROFILE_LIMITS.tagline);
      const description = input.description === undefined
        ? agent.description
        : assertNonEmptyString(input.description, "description", PROFILE_LIMITS.description);
      const avatarUrl = assertAvatarUrl(input.avatarUrl, agent.avatarUrl);
      const features = input.features === undefined
        ? agent.features
        : sanitizeList(input.features, "features", PROFILE_LIMITS.features);
      const skillsTools = input.skillsTools === undefined
        ? agent.skillsTools
        : sanitizeList(input.skillsTools, "skillsTools", PROFILE_LIMITS.skillsTools);
      const metaTitle = input.metaTitle === undefined
        ? `${name} | AgentRiot`
        : normalizeOptionalTextLimit(input.metaTitle, "metaTitle", PROFILE_LIMITS.metaTitle) || null;
      const metaDescription = input.metaDescription === undefined
        ? description.slice(0, PROFILE_LIMITS.metaDescription)
        : normalizeOptionalTextLimit(
            input.metaDescription,
            "metaDescription",
            PROFILE_LIMITS.metaDescription,
          ) || null;
      const softwareName = normalizeOptionalText(input.softwareName);
      const primarySoftwareSlug =
        typeof input.primarySoftwareSlug === "string" && input.primarySoftwareSlug.trim()
          ? input.primarySoftwareSlug.trim().toLowerCase()
          : "";
      const primarySoftwareId = normalizeOptionalText(input.primarySoftwareId);

      let nextPrimarySoftwareId = agent.primarySoftwareId;
      let nextUnlistedSoftwareName = agent.unlistedSoftwareName ?? null;

      if (primarySoftwareId || primarySoftwareSlug || softwareName) {
        const softwareById = primarySoftwareId
          ? await repository.findSoftwareById(primarySoftwareId)
          : null;
        const softwareBySlug = !softwareById && primarySoftwareSlug
          ? await repository.findSoftwareBySlug(primarySoftwareSlug)
          : null;
        const softwareByName = !softwareById && !softwareBySlug && softwareName
          ? await repository.findSoftwareBySlug(toSlugBase(softwareName))
          : null;
        const software = softwareById ?? softwareBySlug ?? softwareByName;

        if ((primarySoftwareId || primarySoftwareSlug) && !software) {
          throw new AgentServiceError("Unknown primary software reference.", 400);
        }

        nextPrimarySoftwareId = software?.id ?? null;
        nextUnlistedSoftwareName = software ? null : softwareName || null;
      }

      await repository.updateAgentProfile(agent.id, {
        name,
        tagline,
        description,
        avatarUrl,
        primarySoftwareId: nextPrimarySoftwareId,
        unlistedSoftwareName: nextUnlistedSoftwareName,
        features,
        skillsTools,
        metaTitle,
        metaDescription,
        updatedAt: new Date(),
      });

      const profile = await repository.getPublicAgentProfileBySlug(agent.slug);
      if (!profile) {
        throw new AgentServiceError("Agent not found.", 404);
      }

      return { profile };
    },

    async claim(input: ClaimAgentInput): Promise<ClaimAgentResult> {
      input = assertInputObject(input);
      const agentSlug = assertNonEmptyString(input.agentSlug, "agentSlug");
      const apiKey = assertNonEmptyString(input.apiKey, "apiKey");
      const keyRecord = await authorizeAgentKey(repository, agentSlug, apiKey);
      const agent = await findVisibleAgent(repository, agentSlug);

      if (agent.id !== keyRecord.agentId) {
        throw new AgentServiceError("Agent not found.", 404);
      }

      const email = normalizeEmail(input.email);
      const existingClaim = await repository.findClaimByAgentId(keyRecord.agentId);
      const claimedAt = new Date();
      const recoveryToken = buildRecoveryToken();

      const claim = existingClaim
        ? await repository.updateClaim(existingClaim.id, {
            email: email || existingClaim.email,
            claimedAt,
            claimToken: hashRecoveryToken(recoveryToken),
          })
        : await repository.createClaim({
            agentId: keyRecord.agentId,
            email,
            claimedAt,
            claimToken: hashRecoveryToken(recoveryToken),
          });

      return {
        claimed: true,
        agentId: keyRecord.agentId,
        email: claim.email || null,
        recoveryToken,
      };
    },

    async rotateKey(input: RotateAgentKeyInput): Promise<RotateAgentKeyResult> {
      input = assertInputObject(input);
      const agentSlug = assertNonEmptyString(input.agentSlug, "agentSlug");
      const apiKey = normalizeOptionalText(input.apiKey);
      const recoveryToken = normalizeOptionalText(input.recoveryToken);

      if (!apiKey && !recoveryToken) {
        throw new AgentServiceError("apiKey or recoveryToken is required.", 400);
      }

      if (apiKey && recoveryToken) {
        throw new AgentServiceError("Use either apiKey or recoveryToken, not both.", 400);
      }

      const agent = await findVisibleAgent(repository, agentSlug);

      let claimId: string | null = null;
      let email = "";
      let expectedActiveKeyHash: string | undefined;
      let expectedClaimTokenHash: string | undefined;

      if (apiKey) {
        const keyRecord = await repository.findAgentKeyByHash(hashApiKey(apiKey));

        if (!keyRecord || keyRecord.agentSlug !== agentSlug) {
          throw new AgentServiceError("Invalid API key for this agent.", 401);
        }

        if (!keyRecord.isActive || keyRecord.revokedAt) {
          throw new AgentServiceError("This API key has been revoked.", 403);
        }

        expectedActiveKeyHash = hashApiKey(apiKey);
        const claim = await repository.findClaimByAgentId(agent.id);
        claimId = claim?.id ?? null;
        email = claim?.email ?? "";
      } else {
        expectedClaimTokenHash = hashRecoveryToken(recoveryToken);
        const claim = await repository.findClaimByTokenHash(expectedClaimTokenHash);

        if (!claim || claim.agentSlug !== agentSlug) {
          throw new AgentServiceError("Invalid recovery token for this agent.", 401);
        }

        claimId = claim.id;
        email = claim.email;
      }

      const rotatedAt = new Date();
      const newApiKey = buildApiKey();
      const nextRecoveryToken = claimId ? buildRecoveryToken() : undefined;
      const rotation = await repository.rotateAgentKey({
        agentId: agent.id,
        keyHash: hashApiKey(newApiKey),
        keyPrefix: newApiKey.slice(0, 8),
        rotatedAt,
        expectedActiveKeyHash,
        claimId: claimId ?? undefined,
        claimEmail: email,
        nextClaimTokenHash: nextRecoveryToken ? hashRecoveryToken(nextRecoveryToken) : undefined,
        expectedClaimTokenHash,
      });

      if (!rotation) {
        if (expectedActiveKeyHash) {
          throw new AgentServiceError("This API key has been revoked.", 403);
        }
        throw new AgentServiceError("Invalid recovery token for this agent.", 401);
      }

      return {
        agent: {
          id: agent.id,
          slug: agent.slug,
          name: agent.name,
        },
        apiKey: newApiKey,
        keyPrefix: rotation.key.keyPrefix,
        recoveryToken: nextRecoveryToken,
      };
    },

    getPublicAgentProfileBySlug(slug: string): Promise<PublicAgentProfile | null> {
      return repository.getPublicAgentProfileBySlug(slug);
    },
  };
}

export type AgentService = ReturnType<typeof createAgentService>;

export function createDefaultAgentService() {
  return createAgentService(createDatabaseAgentRepository());
}
