import { describe, expect, it } from "vitest";
import { parseSelectedIds } from "@/lib/admin/relation-selection";

describe("parseSelectedIds", () => {
  it("returns a deduplicated string array from repeated form values", () => {
    const formData = new FormData();
    formData.append("relatedIds", "agent-1");
    formData.append("relatedIds", "agent-2");
    formData.append("relatedIds", "agent-1");

    expect(parseSelectedIds(formData, "relatedIds")).toEqual([
      "agent-1",
      "agent-2",
    ]);
  });

  it("ignores blank values", () => {
    const formData = new FormData();
    formData.append("relatedIds", "");
    formData.append("relatedIds", "prompt-1");

    expect(parseSelectedIds(formData, "relatedIds")).toEqual(["prompt-1"]);
  });
});
