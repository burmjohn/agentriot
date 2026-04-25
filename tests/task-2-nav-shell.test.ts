import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

import { pillButtonVariants } from "../components/ui/pill-button";

const globalsCss = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");
const navShellSrc = fs.readFileSync(path.resolve(__dirname, "../components/ui/nav-shell.tsx"), "utf-8");
const pillButtonSrc = fs.readFileSync(path.resolve(__dirname, "../components/ui/pill-button.tsx"), "utf-8");

describe("Task 2: Nav Shell + Global Design Tokens", () => {
  describe("globals.css token system", () => {
    it("has full color palette as CSS custom properties", () => {
      const requiredColors = [
        "--canvas",
        "--surface",
        "--mint",
        "--ultraviolet",
        "--console-mint",
        "--deep-link",
        "--focus-cyan",
        "--purple-rule",
        "--image-frame",
        "--hazard-white",
        "--absolute-black",
        "--secondary-text",
        "--muted-text",
        "--dim-gray",
        "--overlay-black",
      ];
      for (const color of requiredColors) {
        expect(globalsCss).toContain(color);
      }
    });

    it("has full spacing scale", () => {
      const spacingValues = ["1px", "2px", "4px", "5px", "6px", "8px", "9px", "10px", "12px", "14px", "15px", "16px", "20px", "24px", "25px", "32px", "48px", "64px"];
      for (const val of spacingValues) {
        expect(globalsCss).toContain(val);
      }
    });

    it("has full border radius scale", () => {
      const radiusValues = ["2px", "3px", "4px", "20px", "24px", "30px", "40px", "50%"];
      for (const val of radiusValues) {
        expect(globalsCss).toContain(val);
      }
    });

    it("does not contain decorative shadow tokens", () => {
      const forbiddenPatterns = [
        /box-shadow:\s*(?!inset)\s*[^;]*\d+px\s+\d+px\s+[1-9]/,
        /backdrop-blur/,
        /filter:\s*blur/,
        /gradient/,
      ];
      for (const pattern of forbiddenPatterns) {
        expect(globalsCss).not.toMatch(pattern);
      }
    });

    it("has body background set to canvas token #131313", () => {
      expect(globalsCss).toContain("--canvas: #131313");
    });

    it("has transition tokens for color and background", () => {
      expect(globalsCss).toMatch(/transition.*150ms.*ease/);
      expect(globalsCss).toMatch(/transition.*180ms.*ease/);
    });
  });

  describe("nav-shell.tsx redesign", () => {
    it("has massive editorial wordmark scale (60px+ on desktop)", () => {
      expect(navShellSrc).toMatch(/text-\[\d+px\]|text-display/);
      expect(navShellSrc).toContain("font-display");
    });

    it("has uppercase mono category links", () => {
      expect(navShellSrc).toContain("font-mono-label");
      expect(navShellSrc).toMatch(/uppercase|tracking-\[/);
    });

    it("has mint pill CTA button", () => {
      expect(navShellSrc).toContain('variant="primary"');
      expect(navShellSrc).toContain("PillButton");
    });

    it("has color-only hover to deep-link token on links", () => {
      expect(navShellSrc).toContain("hover:text-deep-link");
    });

    it("has active section underline treatment", () => {
      expect(navShellSrc).toContain("tab-active");
    });

    it("has thin nav bar (not compact h-14)", () => {
      expect(navShellSrc).not.toContain("h-14");
    });

    it("has mobile hamburger toggle", () => {
      expect(navShellSrc).toContain("mobile-nav-toggle");
    });

    it("wordmark is never clipped (has overflow handling)", () => {
      expect(navShellSrc).toMatch(/whitespace-nowrap|overflow-hidden|min-w-0/);
    });
  });

  describe("pill-button.tsx CTA styling", () => {
    it("primary variant has mint fill and black text", () => {
      const classes = pillButtonVariants({ variant: "primary" });
      expect(classes).toContain("bg-[#3cffd0]");
      expect(classes).toContain("text-black");
      expect(classes).toContain("rounded-[24px]");
      expect(classes).toContain("text-mono-button");
    });

    it("primary variant has proper hover state", () => {
      const classes = pillButtonVariants({ variant: "primary" });
      expect(classes).toContain("hover:bg-[rgba(255,255,255,0.2)]");
      expect(classes).toContain("hover:text-black");
    });

    it("has transition on background", () => {
      expect(pillButtonSrc).toContain("transition-all");
      expect(pillButtonSrc).toContain("duration-150");
    });
  });
});
