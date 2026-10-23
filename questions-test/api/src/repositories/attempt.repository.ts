import { and, eq, sql } from "drizzle-orm";
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

/**
 * Gabungkan jawaban ke sesi yang masih berlangsung tanpa mengakhiri sesi.
 *
 * Penggabungan dilakukan di database (`answers || patch`) supaya autosave
 * yang datang berdekatan tidak saling menimpa. Nilai untuk `questionId` yang
 * sama akan diperbarui.
 */
export async function mergeAnswers(
  id: number,
  answers: Record<string, string>,
  executor: Executor = db,
): Promise<AttemptRow | undefined> {
  const patch = JSON.stringify(answers);

  const [row] = await executor
    .update(attempts)
    .set({ answers: sql`${attempts.answers} || ${patch}::jsonb` })
    .where(and(eq(attempts.id, id), eq(attempts.status, "Berlangsung")))
    .returning();

  return row;
}
