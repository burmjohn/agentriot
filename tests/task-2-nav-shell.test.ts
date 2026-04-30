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
        "--riot-navy",
        "--riot-blue",
        "--riot-orange",
        "--riot-white",
        "--riot-page",
        "--riot-border",
        "--riot-cyan",
        "--canvas",
        "--surface",
        "--deep-link",
        "--focus-cyan",
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
      const radiusValues = ["2px", "3px", "4px", "8px", "10px", "12px", "16px"];
      for (const val of radiusValues) {
        expect(globalsCss).toContain(val);
      }
    });

    it("does not contain decorative shadow tokens", () => {
      const forbiddenPatterns = [
        /box-shadow:\s*(?!inset)\s*[^;]*\d+px\s+\d+px\s+[1-9]/,
        /backdrop-blur/,
        /filter:\s*blur/,
      ];
      for (const pattern of forbiddenPatterns) {
        expect(globalsCss).not.toMatch(pattern);
      }
    });

    it("has light mode background tokens", () => {
      expect(globalsCss).toContain("--background: #ffffff");
      expect(globalsCss).toContain("--canvas: var(--riot-white)");
    });

    it("has transition tokens for color and background", () => {
      expect(globalsCss).toMatch(/transition.*150ms.*ease/);
      expect(globalsCss).toMatch(/transition.*180ms.*ease/);
    });
  });

  describe("nav-shell.tsx redesign", () => {
    it("uses image logo instead of text wordmark", () => {
      expect(navShellSrc).toContain('import Image from "next/image"');
      expect(navShellSrc).toContain('/brand/agentriot-logo-exact.png');
    });

    it("has clean category link styling", () => {
      expect(navShellSrc).toContain("text-[13px]");
      expect(navShellSrc).toContain("font-semibold");
      expect(navShellSrc).toContain("text-[var(--riot-navy)]");
    });

    it("has orange squared CTA button", () => {
      expect(navShellSrc).toContain("bg-[var(--riot-orange)]");
      expect(navShellSrc).toContain("rounded-[8px]");
      expect(navShellSrc).toContain("Join the Riot");
    });

    it("has color-only hover to deep-link token on links", () => {
      expect(navShellSrc).toContain("hover:text-[var(--riot-blue)]");
    });

    it("has active section underline treatment", () => {
      expect(navShellSrc).toContain('link.active && "text-[var(--riot-blue)]"');
    });

    it("has thin nav bar (not compact h-14)", () => {
      expect(navShellSrc).not.toContain("h-14");
      expect(navShellSrc).toContain("h-[82px]");
      expect(navShellSrc).toContain("max-md:h-[64px]");
    });

    it("has mobile hamburger toggle", () => {
      expect(navShellSrc).toContain("mobile-nav-toggle");
    });

    it("logo has explicit dimensions and no shrink", () => {
      expect(navShellSrc).toContain("h-[42px]");
      expect(navShellSrc).toContain("w-[178px]");
      expect(navShellSrc).toContain("shrink-0");
    });
  });

  describe("pill-button.tsx CTA styling", () => {
    it("primary variant has orange fill and white text", () => {
      const classes = pillButtonVariants({ variant: "primary" });
      expect(classes).toContain("bg-[var(--riot-orange)]");
      expect(classes).toContain("text-white");
      expect(classes).toContain("rounded-[8px]");
      expect(classes).toContain("text-mono-button");
    });

    it("primary variant has proper hover state", () => {
      const classes = pillButtonVariants({ variant: "primary" });
      expect(classes).toContain("hover:bg-[#E83F1A]");
    });

    it("has transition on background", () => {
      expect(pillButtonSrc).toContain("transition-all");
      expect(pillButtonSrc).toContain("duration-150");
    });
  });
});
