import { describe, expect, it } from "vitest";
import {
  getAdminDetailFeedback,
  getAdminListFeedback,
} from "@/lib/admin/action-feedback";

describe("getAdminListFeedback", () => {
  it("returns a created message when the page is redirected after creation", () => {
    expect(
      getAdminListFeedback("content record", {
        created: "1",
      }),
    ).toEqual({
      tone: "success",
      message: "Content record created.",
    });
  });
});

describe("getAdminDetailFeedback", () => {
  it("returns restore-specific success copy before generic saved copy", () => {
    expect(
      getAdminDetailFeedback("content record", {
        saved: "1",
        restored: "1",
      }),
    ).toEqual({
      tone: "success",
      message: "Revision restored and captured as a new snapshot.",
    });
  });

  it("maps relation and revision errors to clear editor feedback", () => {
    expect(
      getAdminDetailFeedback("content record", {
        relations: "agents",
      }),
    ).toEqual({
      tone: "success",
      message: "Related agents updated.",
    });

    expect(
      getAdminDetailFeedback("content record", {
        error: "revision-not-found",
      }),
    ).toEqual({
      tone: "error",
      message: "The selected revision could not be found.",
    });
  });
});
