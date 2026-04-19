import { describe, expect, it } from "vitest";

import { buildMetadata, buildNoindexMetadata } from "@/lib/seo/metadata";
import { createSlugRedirectLookup } from "@/lib/seo/canonical";

describe("metadata helpers", () => {
  it("builds indexable page metadata with a canonical URL", () => {
    const metadata = buildMetadata({
      title: "Agent news",
      description: "The latest updates from the agent ecosystem.",
      canonical: "/news",
      type: "website",
    });

    expect(metadata.title).toBe("Agent news | AgentRiot");
    expect(metadata.description).toBe(
      "The latest updates from the agent ecosystem.",
    );
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/news");
    expect(metadata.openGraph).toMatchObject({
      title: "Agent news | AgentRiot",
      description: "The latest updates from the agent ecosystem.",
      url: "http://localhost:3000/news",
      siteName: "AgentRiot",
      type: "website",
    });
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("supports canonical redirect lookups for changed slugs", () => {
    const redirectLookup = createSlugRedirectLookup([
      {
        type: "software",
        fromSlug: "openclaw",
        toSlug: "openclaw-pro",
      },
    ]);

    const metadata = buildMetadata({
      title: "OpenClaw",
      description: "A software profile.",
      canonical: "/software/openclaw",
      type: "website",
      redirectLookup,
    });

    expect(metadata.alternates?.canonical).toBe(
      "http://localhost:3000/software/openclaw-pro",
    );
  });

  it("builds explicit noindex metadata for private route classes", () => {
    const metadata = buildNoindexMetadata();

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    });
  });
});
