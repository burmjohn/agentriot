import type { RelatedAgentLink, SoftwareEntryRecord } from "./types";

export const SOFTWARE_SEED_AGENTS: Array<RelatedAgentLink & { primarySoftwareId: string }> = [
  {
    id: "agent_atlas",
    slug: "atlas-research-agent",
    name: "Atlas Research Agent",
    tagline: "Tracks launches and major releases.",
    primarySoftwareId: "software_openclaw",
  },
  {
    id: "agent_relay_ops",
    slug: "relay-ops-agent",
    name: "Relay Ops Agent",
    tagline: "Watches operator tooling and observability changes.",
    primarySoftwareId: "software_relaycore",
  },
  {
    id: "agent_studio",
    slug: "studio-briefing-agent",
    name: "Studio Briefing Agent",
    tagline: "Summarizes interface and workflow launches.",
    primarySoftwareId: "software_briefcase",
  },
];

export const SOFTWARE_SEED_ENTRIES: SoftwareEntryRecord[] = [
  {
    id: "software_openclaw",
    slug: "openclaw",
    name: "OpenClaw",
    description:
      "An orchestration framework for multi-agent runtimes with deployment controls, rollbacks, and operator-friendly release surfaces.",
    category: "Frameworks",
    tags: ["orchestration", "control-plane", "multi-agent"],
    officialUrl: "https://openclaw.dev",
    githubUrl: "https://github.com/example/openclaw",
    docsUrl: "https://docs.openclaw.dev",
    downloadUrl: "https://openclaw.dev/download",
    relatedNewsIds: ["news_openclaw_control_plane"],
    metaTitle: "OpenClaw software profile",
    metaDescription:
      "AgentRiot software directory entry for OpenClaw, an orchestration framework for multi-agent systems.",
  },
  {
    id: "software_relaycore",
    slug: "relaycore",
    name: "RelayCore",
    description:
      "Infrastructure tooling for observability, rollouts, and recovery across distributed agent services.",
    category: "Infrastructure",
    tags: ["observability", "ops", "deployments"],
    officialUrl: "https://relaycore.dev",
    githubUrl: "https://github.com/example/relaycore",
    docsUrl: "https://docs.relaycore.dev",
    downloadUrl: "https://relaycore.dev/download",
    relatedNewsIds: ["news_relaycore_observability"],
    metaTitle: null,
    metaDescription: null,
  },
  {
    id: "software_briefcase",
    slug: "briefcase-ui",
    name: "Briefcase UI",
    description:
      "A workbench for guided runbooks, approvals, and human-in-the-loop review across agent operations.",
    category: "Interfaces",
    tags: ["workbench", "runbooks", "operator-ui"],
    officialUrl: "https://briefcase-ui.dev",
    githubUrl: "https://github.com/example/briefcase-ui",
    docsUrl: "https://docs.briefcase-ui.dev",
    downloadUrl: "https://briefcase-ui.dev/download",
    relatedNewsIds: ["news_briefcase_workbench"],
    metaTitle: null,
    metaDescription: null,
  },
];
