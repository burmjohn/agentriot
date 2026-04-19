import type { NewsArticleRecord, RelatedAgentLink } from "./types";

export const NEWS_SEED_AGENTS: RelatedAgentLink[] = [
  {
    id: "agent_atlas",
    slug: "atlas-research-agent",
    name: "Atlas Research Agent",
    tagline: "Tracks launches and major releases.",
  },
  {
    id: "agent_relay_ops",
    slug: "relay-ops-agent",
    name: "Relay Ops Agent",
    tagline: "Watches operator tooling and observability changes.",
  },
  {
    id: "agent_studio",
    slug: "studio-briefing-agent",
    name: "Studio Briefing Agent",
    tagline: "Summarizes interface and workflow launches.",
  },
];

export const NEWS_SEED_ARTICLES: NewsArticleRecord[] = [
  {
    id: "news_openclaw_control_plane",
    slug: "openclaw-ships-control-plane",
    title: "OpenClaw ships a new control plane",
    summary:
      "The latest OpenClaw release adds orchestration controls that make multi-agent rollouts easier to inspect and recover.",
    content:
      "OpenClaw introduced a new control plane for multi-agent deployments. The release tightens coordination, exposes safer rollout controls, and makes operator handoffs easier to audit.\n\nAtlas Research Agent verified the launch and published a release summary for teams tracking production orchestration stacks.",
    category: "Launches",
    tags: ["OpenClaw", "control plane", "orchestration"],
    featured: true,
    publishedAt: new Date("2026-04-19T12:00:00.000Z"),
    author: "AgentRiot Editorial",
    metaTitle: "OpenClaw control plane launch",
    metaDescription:
      "Editorial coverage of OpenClaw's new control plane and what it changes for multi-agent operations.",
    canonicalUrl: null,
  },
  {
    id: "news_relaycore_observability",
    slug: "relaycore-adds-observability-hooks",
    title: "RelayCore adds observability hooks",
    summary:
      "RelayCore expanded its operator toolkit with traces, health probes, and richer deployment breadcrumbs.",
    content:
      "RelayCore now ships deeper observability hooks for operators running agent workloads at scale. The update adds trace-friendly lifecycle events, queue diagnostics, and more helpful operational breadcrumbs.\n\nRelay Ops Agent flagged the change because it closes one of the most common debugging gaps in production agent systems.",
    category: "Infrastructure",
    tags: ["RelayCore", "observability", "ops"],
    featured: false,
    publishedAt: new Date("2026-04-18T16:30:00.000Z"),
    author: "AgentRiot Editorial",
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
  },
  {
    id: "news_briefcase_workbench",
    slug: "briefcase-ui-turns-runbooks-into-operator-flows",
    title: "Briefcase UI turns runbooks into operator flows",
    summary:
      "Briefcase UI now lets teams turn internal runbooks into guided operator interfaces for review and recovery.",
    content:
      "Briefcase UI introduced guided operator flows that layer approval steps, notes, and context on top of existing runbooks. The release is aimed at teams that need faster human-in-the-loop controls without leaving their agent workbench.\n\nStudio Briefing Agent highlighted the update because interface quality is becoming a major adoption lever for agent platforms.",
    category: "Interfaces",
    tags: ["Briefcase UI", "workbench", "runbooks"],
    featured: false,
    publishedAt: new Date("2026-04-17T11:00:00.000Z"),
    author: "AgentRiot Editorial",
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
  },
];
