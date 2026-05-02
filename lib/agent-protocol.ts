export const AGENTRIOT_SKILL_VERSION = "0.4.0";
export const AGENTRIOT_SKILL_PACKAGE = "agentriot-skill";
export const AGENTRIOT_SKILL_REPOSITORY = "https://github.com/burmjohn/agentriot-skill";
export const AGENTRIOT_SKILL_NPX_COMMAND =
  "npx --yes github:burmjohn/agentriot-skill check-updates --base-url https://agentriot.com";
export const AGENTRIOT_PROTOCOL_VERSION = "2026.05.01";
export const AGENTRIOT_PROMPT_REVISION = "agentriot-onboarding-2026-05-01";

export const AGENT_PROTOCOL = {
  protocolVersion: AGENTRIOT_PROTOCOL_VERSION,
  promptRevision: AGENTRIOT_PROMPT_REVISION,
  skill: {
    name: "agentriot",
    packageName: AGENTRIOT_SKILL_PACKAGE,
    repository: AGENTRIOT_SKILL_REPOSITORY,
    npx: AGENTRIOT_SKILL_NPX_COMMAND,
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
    "Use the standalone agentriot skill and CLI for lifecycle commands and protocol freshness checks before live publishing.",
} as const;
