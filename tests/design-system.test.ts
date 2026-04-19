import { describe, expect, it } from "vitest";

import { cn } from "../lib/utils";
import { pillButtonVariants } from "../components/ui/pill-button";
import { pillTagVariants } from "../components/ui/pill-tag";
import { storyStreamTileVariants } from "../components/ui/story-stream-tile";

describe("Design System Shell", () => {
  describe("cn utility", () => {
    it("merges tailwind classes correctly", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-white", "text-black")).toBe("text-black");
    });
  });

  describe("PillButton variants", () => {
    it("has primary variant with mint background", () => {
      const classes = pillButtonVariants({ variant: "primary" });
      expect(classes).toContain("bg-[#3cffd0]");
      expect(classes).toContain("text-black");
      expect(classes).toContain("rounded-[24px]");
    });

    it("has secondary variant with slate background", () => {
      const classes = pillButtonVariants({ variant: "secondary" });
      expect(classes).toContain("bg-[#2d2d2d]");
      expect(classes).toContain("text-[#e9e9e9]");
    });

    it("has tertiary variant with mint outline", () => {
      const classes = pillButtonVariants({ variant: "tertiary" });
      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("text-[#3cffd0]");
      expect(classes).toContain("border-[#3cffd0]");
      expect(classes).toContain("rounded-[40px]");
    });

    it("has ultraviolet variant with purple outline", () => {
      const classes = pillButtonVariants({ variant: "ultraviolet" });
      expect(classes).toContain("text-[#5200ff]");
      expect(classes).toContain("border-[#5200ff]");
      expect(classes).toContain("rounded-[30px]");
    });
  });

  describe("PillTag variants", () => {
    it("has mint variant", () => {
      const classes = pillTagVariants({ variant: "mint" });
      expect(classes).toContain("bg-[#3cffd0]");
      expect(classes).toContain("text-black");
      expect(classes).toContain("rounded-[20px]");
    });

    it("has ultraviolet variant", () => {
      const classes = pillTagVariants({ variant: "ultraviolet" });
      expect(classes).toContain("bg-[#5200ff]");
      expect(classes).toContain("text-white");
    });
  });

  describe("StoryStreamTile variants", () => {
    it("has dark variant with white border", () => {
      const classes = storyStreamTileVariants({ variant: "dark" });
      expect(classes).toContain("bg-[#131313]");
      expect(classes).toContain("border");
      expect(classes).toContain("border-white");
      expect(classes).toContain("rounded-[20px]");
    });

    it("has mint accent variant", () => {
      const classes = storyStreamTileVariants({ variant: "mint" });
      expect(classes).toContain("bg-[#3cffd0]");
    });

    it("has feature size with larger radius", () => {
      const classes = storyStreamTileVariants({ variant: "feature", size: "feature" });
      expect(classes).toContain("rounded-[24px]");
    });
  });
});
