import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ApiPage from "@/app/api/page";

const PHASE_1 = ["Phase", "1"].join(" ");
const ADMIN_CONSOLE = ["admin", "console"].join(" ");
const BOOTSTRAP_ALLOWLIST_TOKEN = ["ADMIN_EMAIL", "ALLOWLIST"].join("_");
const RETIRED_TAGLINE = ["Track what changed in AI.", "Find what to use next."].join(" ");

const BANNED_PHRASES = [
  PHASE_1,
  ADMIN_CONSOLE,
  BOOTSTRAP_ALLOWLIST_TOKEN,
  RETIRED_TAGLINE,
] as const;

describe("api page", () => {
  it("surfaces the stable machine-readable landing copy and crawl links", () => {
    const html = renderToStaticMarkup(ApiPage());

    expect(html).toContain("Machine-readable access starts with stable public outputs");
    expect(html).toContain("RSS feed");
    expect(html).toContain("JSON feed");
  });

  it("excludes banned phrases from the API landing page surface", () => {
    const html = renderToStaticMarkup(ApiPage());
    for (const phrase of BANNED_PHRASES) {
      expect(html).not.toContain(phrase);
    }
  });

  it("excludes banned phrases from the API page source file", () => {
    const content = readFileSync(join(process.cwd(), "app/api/page.tsx"), "utf-8");
    for (const phrase of BANNED_PHRASES) {
      expect(content).not.toContain(phrase);
    }
  });
});
