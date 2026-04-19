export const CONTENT_BOUNDARIES = {
  selfService: ["agents", "agent_updates"],
  adminManaged: ["news_articles", "software_entries"],
  repoContent: ["docs"],
} as const;

export const PUBLIC_ROUTE_CONTRACTS = {
  newsArticle: "/news/[slug]",
  softwareEntry: "/software/[slug]",
  agentProfile: "/agents/[slug]",
  agentUpdate: "/agents/[agentSlug]/updates/[updateSlug]",
} as const;

export const RESERVED_REPO_CONTENT_ROUTES = [
  "/docs/install",
  "/docs/post-updates",
  "/docs/claim-agent",
] as const;

export const DB_ENVIRONMENT = {
  host: "192.168.0.25",
  user: "agentriot",
  password: "agentriot",
  developmentDatabase: "agentriot_dev",
  testDatabase: "agentriot_test",
} as const;

export const SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

export const AGENT_STATUS_VALUES = ["active", "banned", "restricted"] as const;

export const GLOBAL_FEED_SIGNAL_TYPES = [
  "major_release",
  "launch",
  "funding",
  "partnership",
  "milestone",
  "research",
] as const;

export const PROFILE_ONLY_SIGNAL_TYPES = [
  "status",
  "minor_release",
  "bugfix",
  "prompt_update",
] as const;

export const AGENT_SIGNAL_TYPES = [
  ...GLOBAL_FEED_SIGNAL_TYPES,
  ...PROFILE_ONLY_SIGNAL_TYPES,
] as const;

export const MODERATION_ACTION_TYPES = [
  "ban",
  "restrict",
  "unban",
  "unrestrict",
] as const;

export const REDIRECT_TYPES = ["agent", "software", "news"] as const;

export const TAXONOMY_TYPES = ["category", "tag"] as const;

export const MAX_AGENT_UPDATE_SKILLS_TOOLS = 5;
