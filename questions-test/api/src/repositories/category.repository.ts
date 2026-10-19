import { eq, inArray, sql } from "drizzle-orm";
import { db, type Executor } from "../db/index.js";
import { categories, questions } from "../db/schema.js";

export type NewCategory = typeof categories.$inferInsert;

export type CategoryWithCount = typeof categories.$inferSelect & {
  questionCount: number;
};

/** Ambil semua kategori beserta jumlah soal di masing-masing. */
export async function list(executor: Executor = db): Promise<CategoryWithCount[]> {
  const rows = await executor
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      tone: categories.tone,
      createdAt: categories.createdAt,
      questionCount: sql<number>`cast(count(${questions.id}) as integer)`,
    })
    .from(categories)
    .leftJoin(questions, eq(questions.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.id);

  return rows as CategoryWithCount[];
}

/** Ambil satu kategori beserta jumlah soalnya. */
export async function findById(
  id: number,
  executor: Executor = db,
): Promise<CategoryWithCount | undefined> {
  const rows = await executor
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      tone: categories.tone,
      createdAt: categories.createdAt,
      questionCount: sql<number>`cast(count(${questions.id}) as integer)`,
    })
    .from(categories)
    .leftJoin(questions, eq(questions.categoryId, categories.id))
    .where(eq(categories.id, id))
    .groupBy(categories.id);

  return rows[0] as CategoryWithCount | undefined;
}

/** Simpan kategori baru dan kembalikan baris yang tersimpan. */
export async function create(
  values: NewCategory,
  executor: Executor = db,
): Promise<typeof categories.$inferSelect> {
  const [row] = await executor.insert(categories).values(values).returning();
  if (!row) {
    throw new Error("Gagal membuat kategori");
  }
  return row;
}

/** Ubah sebagian data kategori dan kembalikan baris yang tersimpan. */
export async function update(
  id: number,
  values: Partial<NewCategory>,
  executor: Executor = db,
): Promise<typeof categories.$inferSelect | undefined> {
  const [row] = await executor
    .update(categories)
    .set(values)
    .where(eq(categories.id, id))
    .returning();
  return row;
}

/** Hapus kategori dan kembalikan baris yang terhapus. */
export async function remove(
  id: number,
  executor: Executor = db,
): Promise<typeof categories.$inferSelect | undefined> {
  const [row] = await executor.delete(categories).where(eq(categories.id, id)).returning();
  return row;
}

/** Hitung jumlah soal yang memakai kategori tertentu. */
export async function countQuestions(categoryId: number, executor: Executor = db): Promise<number> {
  const [row] = await executor
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(questions)
    .where(eq(questions.categoryId, categoryId));
  return row?.count ?? 0;
}

/**
 * Ambil pasangan nama → id kategori untuk nama yang diminta.
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
