import { inArray } from "drizzle-orm";
import { db, type Executor } from "../db/index.js";
import { categories } from "../db/schema.js";

/**
 * Ambil pasangan nama → id kategori untuk nama yang diminta.
 *
 * Nama yang tidak ada di database tidak muncul pada hasil, sehingga pemanggil
 * bisa mendeteksinya lewat `Map.has`.
 */
export async function findIdsByNames(
  names: string[],
  executor: Executor = db,
): Promise<Map<string, number>> {
  if (names.length === 0) {
    return new Map();
  }

  const rows = await executor
    .select({ name: categories.name, id: categories.id })
    .from(categories)
    .where(inArray(categories.name, names));

  return new Map(rows.map(({ name, id }) => [name, id]));
}
