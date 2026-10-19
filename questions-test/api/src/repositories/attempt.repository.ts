import { eq } from "drizzle-orm";
import { db, type Executor } from "../db/index.js";
import { attempts } from "../db/schema.js";

export type NewAttempt = typeof attempts.$inferInsert;

export type AttemptRow = typeof attempts.$inferSelect;

/** Buat sesi pengerjaan baru. */
export async function create(values: NewAttempt, executor: Executor = db): Promise<AttemptRow> {
  const [row] = await executor.insert(attempts).values(values).returning();
  if (!row) {
    throw new Error("Gagal membuat sesi pengerjaan");
  }
  return row;
}

/** Ambil satu sesi pengerjaan berdasarkan id. */
export async function findById(
  id: number,
  executor: Executor = db,
): Promise<AttemptRow | undefined> {
  const [row] = await executor.select().from(attempts).where(eq(attempts.id, id));
  return row;
}

/** Ubah sebagian data sesi pengerjaan. */
export async function update(
  id: number,
  values: Partial<NewAttempt>,
  executor: Executor = db,
): Promise<AttemptRow | undefined> {
  const [row] = await executor.update(attempts).set(values).where(eq(attempts.id, id)).returning();
  return row;
}
