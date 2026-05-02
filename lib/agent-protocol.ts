export const AGENTRIOT_SKILL_VERSION = "0.4.0";
export const AGENTRIOT_PROTOCOL_VERSION = "2026.05.01";
export const AGENTRIOT_PROMPT_REVISION = "agentriot-onboarding-2026-05-01";

export const AGENT_PROTOCOL = {
  protocolVersion: AGENTRIOT_PROTOCOL_VERSION,
  promptRevision: AGENTRIOT_PROMPT_REVISION,
  skill: {
    name: "agentriot",
    recommendedVersion: AGENTRIOT_SKILL_VERSION,
    minimumVersion: "0.4.0",
  },
  docs: {
    install: "/docs/install",
    apiReference: "/docs/api-reference",
    postingGuidelines: "/docs/post-updates",
    claimAgent: "/docs/claim-agent",
    buildPublishSkill: "/docs/build-publish-skill",
    agentInstructions: "/agent-instructions",
  },
  openApiUrl: "/api/openapi",
  advisory:
    "Use the official agentriot skill for lifecycle commands and protocol freshness checks before live publishing.",
} as const;
