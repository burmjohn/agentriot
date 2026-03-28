import { describe, expect, it, vi } from "vitest";
import { replaceJoinRows } from "@/lib/admin/relation-writes";

describe("replaceJoinRows", () => {
  it("uses the provided database handle for both delete and insert work", async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const deleteBuilder = { where: deleteWhere };
    const deleteFn = vi.fn().mockReturnValue(deleteBuilder);
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const insertBuilder = { values: insertValues };
    const insertFn = vi.fn().mockReturnValue(insertBuilder);

    await replaceJoinRows({
      database: {
        delete: deleteFn,
        insert: insertFn,
      },
      deleteTable: { _: "agentPrompts" },
      deleteWhere: { agentId: "agent-1" },
      insertValues: [{ agentId: "agent-1", promptId: "prompt-1" }],
      insertTable: { _: "agentPrompts" },
    });

    expect(deleteFn).toHaveBeenCalledTimes(1);
    expect(deleteFn).toHaveBeenCalledWith({ _: "agentPrompts" });
    expect(deleteWhere).toHaveBeenCalledWith({ agentId: "agent-1" });
    expect(insertFn).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith([{ agentId: "agent-1", promptId: "prompt-1" }]);
  });

  it("skips insert work when the new relation set is empty", async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const deleteFn = vi.fn().mockReturnValue({ where: deleteWhere });
    const insertFn = vi.fn();

    await replaceJoinRows({
      database: {
        delete: deleteFn,
        insert: insertFn,
      },
      deleteTable: { _: "agentPrompts" },
      deleteWhere: { agentId: "agent-1" },
      insertValues: [],
      insertTable: { _: "agentPrompts" },
    });

    expect(deleteFn).toHaveBeenCalledTimes(1);
    expect(deleteFn).toHaveBeenCalledWith({ _: "agentPrompts" });
    expect(deleteWhere).toHaveBeenCalledWith({ agentId: "agent-1" });
    expect(insertFn).not.toHaveBeenCalled();
  });
});
