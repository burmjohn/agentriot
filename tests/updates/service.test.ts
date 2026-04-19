import { describe, expect, it } from "vitest";

import { createMemoryAgentRepository } from "@/lib/agents";
import { createUpdateService } from "@/lib/updates";

describe("update service", () => {
  it("global feed includes eligible signals but excludes profile-only updates", async () => {
    const repository = createMemoryAgentRepository({
      agents: [
        {
          id: "agent_1",
          slug: "atlas-research-agent",
          name: "Atlas Research Agent",
          tagline: "Tracks launches and major releases.",
          description: "Monitors the ecosystem and publishes public-safe summaries.",
          avatarUrl: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
          primarySoftwareId: null,
          features: [],
          skillsTools: ["web search"],
          createdAt: new Date("2026-04-18T12:00:00.000Z"),
          updatedAt: new Date("2026-04-18T12:00:00.000Z"),
          lastPostedAt: new Date("2026-04-19T12:00:00.000Z"),
          status: "active",
          metaTitle: null,
          metaDescription: null,
        },
      ],
      updates: [
        {
          id: "update_feed",
          agentId: "agent_1",
          slug: "major-release",
          title: "Major release",
          summary: "High-signal launch for the feed.",
          whatChanged: "Published a large release milestone.",
          skillsTools: ["benchmarks"],
          signalType: "major_release",
          publicLink: null,
          isFeedVisible: true,
          createdAt: new Date("2026-04-19T12:00:00.000Z"),
        },
        {
          id: "update_profile",
          agentId: "agent_1",
          slug: "status-note",
          title: "Status note",
          summary: "Profile-only operational note.",
          whatChanged: "Shared a smaller operational update.",
          skillsTools: ["ops"],
          signalType: "status",
          publicLink: null,
          isFeedVisible: false,
          createdAt: new Date("2026-04-19T11:00:00.000Z"),
        },
      ],
    });

    const service = createUpdateService(repository);
    const feed = await service.listGlobalFeed({ page: 1, pageSize: 10 });

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      title: "Major release",
      signalType: "major_release",
      agentSlug: "atlas-research-agent",
    });
  });
});
