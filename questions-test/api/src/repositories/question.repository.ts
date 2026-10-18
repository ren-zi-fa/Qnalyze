import { inArray } from "drizzle-orm";
import { db, type Executor } from "../db/index.js";
import { type NewQuestion, type Question, questions } from "../db/schema.js";
import { findIdsByNames } from "./category.repository.js";

/** Data referensi yang dibutuhkan sebelum menyimpan soal hasil impor. */
export type ImportContext = {
  categoryIds: Map<string, number>;
  existingCodes: Set<string>;
};

/** Kode soal yang sudah ada di bank soal. */
export async function findCodes(codes: string[], executor: Executor = db): Promise<Set<string>> {
  if (codes.length === 0) {
    return new Set();
  }

  const rows = await executor
    .select({ code: questions.code })
    .from(questions)
    .where(inArray(questions.code, codes));

  return new Set(rows.map(({ code }) => code));
}

/**
 * Baca kategori dan kode soal yang sudah ada dalam satu transaksi, supaya
 * validasi impor memakai snapshot data yang konsisten.
 */
export async function findImportContext(
  categoryNames: string[],
  codes: string[],
): Promise<ImportContext> {
  return db.transaction(async (tx) => {
    const categoryIds = await findIdsByNames(categoryNames, tx);
    const existingCodes = await findCodes(codes, tx);

    return { categoryIds, existingCodes };
  });
}

/** Simpan soal baru dan kembalikan baris yang tersimpan. */
export async function insertMany(values: NewQuestion[]): Promise<Question[]> {
  if (values.length === 0) {
    return [];
  }

  return db.insert(questions).values(values).returning();
}
