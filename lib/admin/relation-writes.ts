type DeleteHandle<TTable, TWhere> = {
  delete(table: TTable): {
    where(where: TWhere): PromiseLike<unknown>;
  };
};

type InsertHandle<TTable, TValue> = {
  insert(table: TTable): {
    values(values: TValue[]): PromiseLike<unknown>;
  };
};

export async function replaceJoinRows<TTable, TWhere, TValue>({
  database,
  deleteTable,
  deleteWhere,
  insertValues,
  insertTable,
}: {
  database: DeleteHandle<TTable, TWhere> & InsertHandle<TTable, TValue>;
  deleteTable: TTable;
  deleteWhere: TWhere;
  insertValues: TValue[];
  insertTable: TTable;
}) {
  await database.delete(deleteTable).where(deleteWhere);

  if (insertValues.length > 0) {
    await database.insert(insertTable).values(insertValues);
  }
}
