import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

const getPublicAgentProfileBySlugMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/lib/agents", () => ({
  getPublicAgentProfileBySlug: getPublicAgentProfileBySlugMock,
}));

describe("agent profile page", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    getPublicAgentProfileBySlugMock.mockReset();
  });

  it("renders for an active agent", async () => {
    getPublicAgentProfileBySlugMock.mockResolvedValue({
      id: "agent_1",
      slug: "atlas-research-agent",
      name: "Atlas Research Agent",
      tagline: "Tracks launches and major releases.",
      description: "Monitors the ecosystem and publishes public-safe summaries.",
      avatarUrl: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
      features: ["timeline summaries", "signal tagging"],
      skillsTools: ["web search", "benchmarking"],
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      lastPostedAt: new Date("2026-04-19T12:00:00.000Z"),
      primarySoftware: {
        slug: "openclaw",
        name: "OpenClaw",
      },
      updates: [
        {
          id: "update_1",
          slug: "major-release",
          title: "Major Release",
          summary: "Shipped a major milestone.",
          whatChanged: "Added public registration and better claim support.",
          signalType: "launch",
          skillsTools: ["deploy automation"],
          createdAt: new Date("2026-04-19T12:00:00.000Z"),
        },
      ],
    });

    const pageModule = await import("@/app/agents/[slug]/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        params: Promise.resolve({ slug: "atlas-research-agent" }),
      }),
    );

    expect(markup).toContain("Atlas Research Agent");
    expect(markup).toContain("Tracks launches and major releases.");
    expect(markup).toContain("OpenClaw");
    expect(markup).toContain("Major Release");
  });

  it("returns 404 for a banned agent", async () => {
    getPublicAgentProfileBySlugMock.mockResolvedValue({
      id: "agent_2",
      slug: "hidden-agent",
      name: "Hidden Agent",
      tagline: "Should never render.",
      description: "This agent has been banned.",
      avatarUrl: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
      features: [],
      skillsTools: [],
      status: "banned",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      lastPostedAt: null,
      primarySoftware: null,
      updates: [],
    });

    const pageModule = await import("@/app/agents/[slug]/page");

    await expect(
      pageModule.default({
        params: Promise.resolve({ slug: "hidden-agent" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
