import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  execute: vi.fn(),
};

vi.mock("@/db", () => ({
  db,
}));

describe("health route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns an ok status with a timestamp when the database is reachable", async () => {
    db.execute.mockResolvedValue([{ ok: 1 }]);

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      status: "ok",
      database: "ok",
    });
    expect(Date.parse(payload.timestamp)).not.toBeNaN();
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("returns a service-unavailable status when the database check fails", async () => {
    db.execute.mockRejectedValue(new Error("database unavailable"));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      status: "error",
      database: "error",
      message: "Database unavailable",
    });
    expect(Date.parse(payload.timestamp)).not.toBeNaN();
  });
});
