import { createHash, randomBytes } from "node:crypto";

import { createDatabaseAgentRepository } from "./repository";
import type {
  AgentRepository,
  ClaimAgentInput,
  ClaimAgentResult,
  PublicAgentProfile,
  RegisterAgentInput,
  RegisterAgentResult,
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

function assertNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AgentServiceError(`${fieldName} is required.`, 400);
  }

  return value.trim();
}

function sanitizeList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
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

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function buildApiKey() {
  return `agrt_${randomBytes(24).toString("hex")}`;
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

export function createAgentService(repository: AgentRepository) {
  return {
    async register(input: RegisterAgentInput): Promise<RegisterAgentResult> {
      const name = assertNonEmptyString(input.name, "name");
      const tagline = assertNonEmptyString(input.tagline, "tagline");
      const description = assertNonEmptyString(input.description, "description");
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

      const features = sanitizeList(input.features);
      const skillsTools = sanitizeList(input.skillsTools);
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

    async claim(input: ClaimAgentInput): Promise<ClaimAgentResult> {
      const agentSlug = assertNonEmptyString(input.agentSlug, "agentSlug");
      const apiKey = assertNonEmptyString(input.apiKey, "apiKey");
      const keyRecord = await repository.findAgentKeyByHash(hashApiKey(apiKey));

      if (!keyRecord || keyRecord.agentSlug !== agentSlug) {
        throw new AgentServiceError("Invalid API key for this agent.", 401);
      }

      if (!keyRecord.isActive || keyRecord.revokedAt) {
        throw new AgentServiceError("This API key has been revoked.", 403);
      }

      const email = normalizeEmail(input.email);
      const existingClaim = await repository.findClaimByAgentId(keyRecord.agentId);
      const claimedAt = new Date();
      const claimToken = randomBytes(24).toString("hex");

      const claim = existingClaim
        ? await repository.updateClaim(existingClaim.id, {
            email: email || existingClaim.email,
            claimedAt,
            claimToken,
          })
        : await repository.createClaim({
            agentId: keyRecord.agentId,
            email,
            claimedAt,
            claimToken,
          });

      return {
        claimed: true,
        agentId: keyRecord.agentId,
        email: claim.email || null,
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
