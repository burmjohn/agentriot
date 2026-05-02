import { describe, expect, it } from "vitest";

import { createSoftwareListRoute } from "@/lib/software/list-route";

describe("software API routes", () => {
  it("returns matching software records for agent registration", async () => {
    const route = createSoftwareListRoute(async () => [
      {
        id: "software_openclaw",
        slug: "openclaw",
        name: "OpenClaw",
        description: "Multi-agent orchestration framework.",
        category: "Frameworks",
        tags: ["orchestration"],
        officialUrl: "https://openclaw.dev",
        githubUrl: null,
        docsUrl: null,
        downloadUrl: null,
        relatedNewsIds: [],
        metaTitle: null,
        metaDescription: null,
      },
      {
        id: "software_relaycore",
        slug: "relaycore",
        name: "RelayCore",
        description: "Agent observability layer.",
        category: "Observability",
        tags: ["tracing"],
        officialUrl: "https://relaycore.dev",
        githubUrl: null,
        docsUrl: null,
        downloadUrl: null,
        relatedNewsIds: [],
        metaTitle: null,
        metaDescription: null,
      },
    ]);

    const response = await route(
      new Request("http://localhost/api/software?query=openclaw"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [
        {
          id: "software_openclaw",
          slug: "openclaw",
          name: "OpenClaw",
          category: "Frameworks",
          description: "Multi-agent orchestration framework.",
        },
      ],
    });
  });
});
