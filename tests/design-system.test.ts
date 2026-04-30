import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

import { cn } from "../lib/utils";
import { pillButtonVariants } from "../components/ui/pill-button";
import { pillTagVariants } from "../components/ui/pill-tag";
import { storyStreamTileVariants } from "../components/ui/story-stream-tile";

const layoutSrc = fs.readFileSync(path.resolve(__dirname, "../app/layout.tsx"), "utf-8");
const globalsCss = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");

describe("Design System Shell", () => {
  describe("Typography System — layout.tsx font loading", () => {
    it("loads Anton font with latin subset, swap display, and CSS variable", () => {
      expect(layoutSrc).toContain("Anton");
      expect(layoutSrc).toContain('subsets: ["latin"]');
      expect(layoutSrc).toContain('display: "swap"');
      expect(layoutSrc).toContain('variable: "--font-anton"');
    });

    it("loads Space Grotesk with weights 300, 400, 500, 700", () => {
      expect(layoutSrc).toContain("Space_Grotesk");
      expect(layoutSrc).toContain('weight: ["300", "400", "500", "700"]');
      expect(layoutSrc).toContain('variable: "--font-space-grotesk"');
    });

    it("loads Space Mono with weights 400 and 700", () => {
      expect(layoutSrc).toContain("Space_Mono");
      expect(layoutSrc).toContain('weight: ["400", "700"]');
      expect(layoutSrc).toContain('variable: "--font-space-mono"');
    });

    it("loads Newsreader with weights 400, 500, 700 and normal+italic styles", () => {
      expect(layoutSrc).toContain("Newsreader");
      expect(layoutSrc).toContain('weight: ["400", "500", "700"]');
      expect(layoutSrc).toContain('style: ["normal", "italic"]');
      expect(layoutSrc).toContain('variable: "--font-newsreader"');
    });

    it("html className includes all four font variables", () => {
      expect(layoutSrc).toContain("${anton.variable}");
      expect(layoutSrc).toContain("${spaceGrotesk.variable}");
      expect(layoutSrc).toContain("${spaceMono.variable}");
      expect(layoutSrc).toContain("${newsreader.variable}");
    });

    it("body uses light background by default", () => {
      expect(globalsCss).toContain('--background: #ffffff');
      expect(globalsCss).toContain('--canvas: var(--riot-white)');
      expect(globalsCss).toContain('background-color: var(--canvas)');
    });
  });

  describe("Typography System — globals.css display tokens", () => {
    it("text-display-hero uses Anton, 107px, weight 900, line-height 0.95, tracking 1.07px", () => {
      expect(globalsCss).toMatch(/\.text-display-hero\s*\{[^}]*font-size:\s*6\.6875rem/s);
      expect(globalsCss).toMatch(/\.text-display-hero\s*\{[^}]*line-height:\s*0\.95/s);
      expect(globalsCss).toMatch(/\.text-display-hero\s*\{[^}]*font-weight:\s*900/s);
      expect(globalsCss).toMatch(/\.text-display-hero\s*\{[^}]*letter-spacing:\s*0\.066875rem/s);
    });

    it("text-display-lg uses 90px, weight 900, line-height 0.95", () => {
      expect(globalsCss).toMatch(/\.text-display-lg\s*\{[^}]*font-size:\s*5\.625rem/s);
      expect(globalsCss).toMatch(/\.text-display-lg\s*\{[^}]*line-height:\s*0\.95/s);
      expect(globalsCss).toMatch(/\.text-display-lg\s*\{[^}]*font-weight:\s*900/s);
    });

    it("text-display-md uses 60px, weight 900, line-height 0.95", () => {
      expect(globalsCss).toMatch(/\.text-display-md\s*\{[^}]*font-size:\s*3\.75rem/s);
      expect(globalsCss).toMatch(/\.text-display-md\s*\{[^}]*line-height:\s*0\.95/s);
      expect(globalsCss).toMatch(/\.text-display-md\s*\{[^}]*font-weight:\s*900/s);
    });
  });

  describe("Typography System — globals.css headline tokens", () => {
    it("text-headline-lg uses Space Grotesk, 34px, weight 700, line-height 1.00", () => {
      expect(globalsCss).toMatch(/\.text-headline-lg\s*\{[^}]*font-size:\s*2\.125rem/s);
      expect(globalsCss).toMatch(/\.text-headline-lg\s*\{[^}]*line-height:\s*1\.?0*\b/s);
      expect(globalsCss).toMatch(/\.text-headline-lg\s*\{[^}]*font-weight:\s*700/s);
    });

    it("text-headline-md uses 24px, weight 700, line-height 1.00", () => {
      expect(globalsCss).toMatch(/\.text-headline-md\s*\{[^}]*font-size:\s*1\.5rem/s);
      expect(globalsCss).toMatch(/\.text-headline-md\s*\{[^}]*line-height:\s*1\.?0*\b/s);
      expect(globalsCss).toMatch(/\.text-headline-md\s*\{[^}]*font-weight:\s*700/s);
    });

    it("text-headline-sm uses 20px, weight 700, line-height 1.00", () => {
      expect(globalsCss).toMatch(/\.text-headline-sm\s*\{[^}]*font-size:\s*1\.25rem/s);
      expect(globalsCss).toMatch(/\.text-headline-sm\s*\{[^}]*line-height:\s*1\.?0*\b/s);
      expect(globalsCss).toMatch(/\.text-headline-sm\s*\{[^}]*font-weight:\s*700/s);
    });
  });

  describe("Typography System — globals.css label tokens", () => {
    it("text-label-xl uses 18px, weight 400, line-height 1.10, 1.8px tracking, UPPERCASE", () => {
      expect(globalsCss).toMatch(/\.text-label-xl\s*\{[^}]*font-size:\s*1\.125rem/s);
      expect(globalsCss).toMatch(/\.text-label-xl\s*\{[^}]*line-height:\s*1\.1/s);
      expect(globalsCss).toMatch(/\.text-label-xl\s*\{[^}]*font-weight:\s*400/s);
      expect(globalsCss).toMatch(/\.text-label-xl\s*\{[^}]*text-transform:\s*uppercase/s);
      expect(globalsCss).toMatch(/\.text-label-xl\s*\{[^}]*letter-spacing:\s*0\.1125rem/s);
    });

    it("text-label-light uses 19px, weight 300, line-height 1.20, 1.9px tracking, capitalized", () => {
      expect(globalsCss).toMatch(/\.text-label-light\s*\{[^}]*font-size:\s*1\.1875rem/s);
      expect(globalsCss).toMatch(/\.text-label-light\s*\{[^}]*line-height:\s*1\.2/s);
      expect(globalsCss).toMatch(/\.text-label-light\s*\{[^}]*font-weight:\s*300/s);
      expect(globalsCss).toMatch(/\.text-label-light\s*\{[^}]*text-transform:\s*capitalize/s);
      expect(globalsCss).toMatch(/\.text-label-light\s*\{[^}]*letter-spacing:\s*0\.11875rem/s);
    });

    it("text-eyebrow uses 12px, weight 400, line-height 1.30, 1.8px tracking, UPPERCASE", () => {
      expect(globalsCss).toMatch(/\.text-eyebrow\s*\{[^}]*font-size:\s*0\.75rem/s);
      expect(globalsCss).toMatch(/\.text-eyebrow\s*\{[^}]*line-height:\s*1\.3/s);
      expect(globalsCss).toMatch(/\.text-eyebrow\s*\{[^}]*font-weight:\s*400/s);
      expect(globalsCss).toMatch(/\.text-eyebrow\s*\{[^}]*text-transform:\s*uppercase/s);
      expect(globalsCss).toMatch(/\.text-eyebrow\s*\{[^}]*letter-spacing:\s*0\.1125rem/s);
    });
  });

  describe("Typography System — globals.css body tokens", () => {
    it("text-body-relaxed uses 16px, weight 500, line-height 1.60", () => {
      expect(globalsCss).toMatch(/\.text-body-relaxed\s*\{[^}]*font-size:\s*1rem/s);
      expect(globalsCss).toMatch(/\.text-body-relaxed\s*\{[^}]*line-height:\s*1\.6/s);
      expect(globalsCss).toMatch(/\.text-body-relaxed\s*\{[^}]*font-weight:\s*500/s);
    });

    it("text-body-compact uses 13px, weight 400, line-height 1.60", () => {
      expect(globalsCss).toMatch(/\.text-body-compact\s*\{[^}]*font-size:\s*0\.8125rem/s);
      expect(globalsCss).toMatch(/\.text-body-compact\s*\{[^}]*line-height:\s*1\.6/s);
      expect(globalsCss).toMatch(/\.text-body-compact\s*\{[^}]*font-weight:\s*400/s);
    });
  });

  describe("Typography System — globals.css mono tokens", () => {
    it("text-mono-button uses Space Mono, 12px, weight 600, line-height 2.00, 1.5px tracking, UPPERCASE", () => {
      expect(globalsCss).toMatch(/\.text-mono-button\s*\{[^}]*font-family:\s*var\(--font-mono\)/s);
      expect(globalsCss).toMatch(/\.text-mono-button\s*\{[^}]*font-size:\s*0\.75rem/s);
      expect(globalsCss).toMatch(/\.text-mono-button\s*\{[^}]*line-height:\s*2\.?0*\b/s);
      expect(globalsCss).toMatch(/\.text-mono-button\s*\{[^}]*font-weight:\s*600/s);
      expect(globalsCss).toMatch(/\.text-mono-button\s*\{[^}]*text-transform:\s*uppercase/s);
      expect(globalsCss).toMatch(/\.text-mono-button\s*\{[^}]*letter-spacing:\s*0\.09375rem/s);
    });

    it("text-mono-timestamp uses Space Mono, 11px, weight 500, line-height 1.20, 1.1px tracking, UPPERCASE", () => {
      expect(globalsCss).toMatch(/\.text-mono-timestamp\s*\{[^}]*font-family:\s*var\(--font-mono\)/s);
      expect(globalsCss).toMatch(/\.text-mono-timestamp\s*\{[^}]*font-size:\s*0\.6875rem/s);
      expect(globalsCss).toMatch(/\.text-mono-timestamp\s*\{[^}]*line-height:\s*1\.2/s);
      expect(globalsCss).toMatch(/\.text-mono-timestamp\s*\{[^}]*font-weight:\s*500/s);
      expect(globalsCss).toMatch(/\.text-mono-timestamp\s*\{[^}]*text-transform:\s*uppercase/s);
      expect(globalsCss).toMatch(/\.text-mono-timestamp\s*\{[^}]*letter-spacing:\s*0\.06875rem/s);
    });
  });

  describe("Typography System — globals.css serif tokens", () => {
    it("text-serif-body uses Newsreader, 16px, weight 400, line-height 1.30, -0.16px tracking", () => {
      expect(globalsCss).toMatch(/\.text-serif-body\s*\{[^}]*font-family:\s*var\(--font-serif\)/s);
      expect(globalsCss).toMatch(/\.text-serif-body\s*\{[^}]*font-size:\s*1rem/s);
      expect(globalsCss).toMatch(/\.text-serif-body\s*\{[^}]*line-height:\s*1\.3/s);
      expect(globalsCss).toMatch(/\.text-serif-body\s*\{[^}]*font-weight:\s*400/s);
      expect(globalsCss).toMatch(/\.text-serif-body\s*\{[^}]*letter-spacing:\s*-0\.01rem/s);
    });

    it("text-serif-caption uses Newsreader, 20px, weight 400, line-height 1.20", () => {
      expect(globalsCss).toMatch(/\.text-serif-caption\s*\{[^}]*font-family:\s*var\(--font-serif\)/s);
      expect(globalsCss).toMatch(/\.text-serif-caption\s*\{[^}]*font-size:\s*1\.25rem/s);
      expect(globalsCss).toMatch(/\.text-serif-caption\s*\{[^}]*line-height:\s*1\.2/s);
      expect(globalsCss).toMatch(/\.text-serif-caption\s*\{[^}]*font-weight:\s*400/s);
    });
  });

  describe("CSS Custom Properties — Color Palette", () => {
    it("defines riot brand tokens and light mode mappings", () => {
      const requiredColors = [
        "--riot-navy: #050B18",
        "--riot-blue: #1457F5",
        "--riot-orange: #FF4B23",
        "--riot-white: #FFFFFF",
        "--riot-page: #F7F9FC",
        "--riot-border: #DCE3EE",
        "--riot-cyan: #20D6C7",
        "--background: #ffffff",
        "--foreground: #131313",
        "--primary: var(--riot-orange)",
        "--accent: var(--riot-blue)",
        "--canvas: var(--riot-white)",
        "--surface: var(--riot-page)",
        "--deep-link: var(--riot-blue)",
        "--focus-cyan: var(--riot-cyan)",
        "--hazard-white: #ffffff",
        "--absolute-black: #000000",
        "--overlay-black: rgba(0, 0, 0, 0.33)",
      ];
      for (const color of requiredColors) {
        expect(globalsCss).toContain(color);
      }
    });
  });

  describe("CSS Custom Properties — Spacing Scale", () => {
    it("defines the full spacing scale from DESIGN.md", () => {
      const requiredSpacing = [
        "--spacing-1: 1px",
        "--spacing-2: 2px",
        "--spacing-4: 4px",
        "--spacing-5: 5px",
        "--spacing-6: 6px",
        "--spacing-8: 8px",
        "--spacing-9: 9px",
        "--spacing-10: 10px",
        "--spacing-12: 12px",
        "--spacing-14: 14px",
        "--spacing-15: 15px",
        "--spacing-16: 16px",
        "--spacing-20: 20px",
        "--spacing-24: 24px",
        "--spacing-25: 25px",
        "--spacing-32: 32px",
        "--spacing-48: 48px",
        "--spacing-64: 64px",
      ];
      for (const space of requiredSpacing) {
        expect(globalsCss).toContain(space);
      }
    });
  });

  describe("CSS Custom Properties — Border Radius Scale", () => {
    it("defines the full radius scale from DESIGN.md", () => {
      expect(globalsCss).toContain("--radius-sm: 2px");
      expect(globalsCss).toContain("--radius-md: 4px");
      expect(globalsCss).toContain("--radius-lg: 8px");
      expect(globalsCss).toContain("--radius-xl: 8px");
      expect(globalsCss).toContain("--radius-2xl: 10px");
      expect(globalsCss).toContain("--radius-3xl: 12px");
      expect(globalsCss).toContain("--radius-4xl: 16px");
    });

    it("includes 3px radius for inline images", () => {
      expect(globalsCss).toContain("3px");
    });
  });

  describe("CSS Forbidden Tokens", () => {
    it("does not define shadow custom property tokens", () => {
      const shadowTokens = globalsCss.match(/--[\w-]+:\s*.*shadow/gi) || [];
      expect(shadowTokens).toHaveLength(0);
    });

    it("does not define gradient custom property tokens", () => {
      const gradientTokens = globalsCss.match(/--[\w-]+:\s*.*gradient/gi) || [];
      expect(gradientTokens).toHaveLength(0);
    });

    it("does not define blur custom property tokens", () => {
      const blurTokens = globalsCss.match(/--[\w-]+:\s*.*blur/gi) || [];
      expect(blurTokens).toHaveLength(0);
    });

    it("body background uses light canvas token by default", () => {
      expect(globalsCss).toContain("--canvas: var(--riot-white)");
      expect(globalsCss).toContain("color-scheme: light");
    });
  });

  describe("cn utility", () => {
    it("merges tailwind classes correctly", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-white", "text-black")).toBe("text-black");
    });
  });

  describe("PillButton variants", () => {
    it("has primary variant with orange background", () => {
      const classes = pillButtonVariants({ variant: "primary" });
      expect(classes).toContain("bg-[var(--riot-orange)]");
      expect(classes).toContain("text-white");
      expect(classes).toContain("rounded-[8px]");
    });

    it("has secondary variant with surface token background", () => {
      const classes = pillButtonVariants({ variant: "secondary" });
      expect(classes).toContain("bg-white");
      expect(classes).toContain("text-[var(--riot-navy)]");
    });

    it("has tertiary variant with blue outline", () => {
      const classes = pillButtonVariants({ variant: "tertiary" });
      expect(classes).toContain("bg-white");
      expect(classes).toContain("text-[var(--riot-blue)]");
      expect(classes).toContain("border-[var(--riot-blue)]");
      expect(classes).toContain("rounded-[8px]");
    });

    it("has orange outline variant", () => {
      const classes = pillButtonVariants({ variant: "orange" });
      expect(classes).toContain("text-[var(--riot-orange)]");
      expect(classes).toContain("border-[var(--riot-orange)]");
      expect(classes).toContain("rounded-[8px]");
    });
  });

  describe("PillTag variants", () => {
    it("has blue variant", () => {
      const classes = pillTagVariants({ variant: "blue" });
      expect(classes).toContain("bg-[var(--riot-blue)]");
      expect(classes).toContain("text-white");
      expect(classes).toContain("rounded-[8px]");
    });

    it("has orange variant", () => {
      const classes = pillTagVariants({ variant: "orange" });
      expect(classes).toContain("bg-[var(--riot-orange)]");
      expect(classes).toContain("text-white");
    });
  });

  describe("StoryStreamTile variants", () => {
    it("has dark variant with editorial row borders", () => {
      const classes = storyStreamTileVariants({ variant: "dark" });
      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("border-y");
    });

    it("has blue accent variant", () => {
      const classes = storyStreamTileVariants({ variant: "blue" });
      expect(classes).toContain("bg-[var(--riot-blue)]");
    });

    it("has feature size with larger spacing", () => {
      const classes = storyStreamTileVariants({ variant: "feature", size: "feature" });
      expect(classes).toContain("p-10");
    });
  });
});
