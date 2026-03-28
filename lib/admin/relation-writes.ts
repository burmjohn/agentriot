import { db } from "@/db";

export async function replaceJoinRows({
  database,
  deleteTable,
  deleteWhere,
  insertValues,
  insertTable,
}: {
  database: Pick<typeof db, "delete" | "insert">;
  deleteTable: unknown;
  deleteWhere: unknown;
  insertValues: unknown[];
  insertTable: unknown;
}) {
  await database.delete(deleteTable as never).where(deleteWhere as never);

  if (insertValues.length > 0) {
    await database.insert(insertTable as never).values(insertValues as never);
  }
}
