import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
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

export type QuestionListFilters = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  difficulty?: string;
  status?: string;
};

export type QuestionListResult = {
  data: Question[];
  total: number;
};

/** Ambil satu soal berdasarkan id. */
export async function findById(id: number, executor: Executor = db): Promise<Question | undefined> {
  const [row] = await executor.select().from(questions).where(eq(questions.id, id));
  return row;
}

/** Simpan satu soal baru dan kembalikan baris yang tersimpan. */
export async function create(values: NewQuestion, executor: Executor = db): Promise<Question> {
  const [row] = await executor.insert(questions).values(values).returning();
  if (!row) {
    throw new Error("Gagal membuat soal");
  }
  return row;
}

/** Hapus soal berdasarkan id dan kembalikan baris yang terhapus. */
export async function remove(id: number, executor: Executor = db): Promise<Question | undefined> {
  const [row] = await executor.delete(questions).where(eq(questions.id, id)).returning();
  return row;
}

/** Daftar soal dengan filter dan paginasi. */
export async function list(
  filters: QuestionListFilters,
  executor: Executor = db,
): Promise<QuestionListResult> {
  const conditions = [];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(or(ilike(questions.code, pattern), ilike(questions.text, pattern)));
  }
  if (filters.categoryId !== undefined) {
    conditions.push(eq(questions.categoryId, filters.categoryId));
  }
  if (filters.difficulty) {
    conditions.push(eq(questions.difficulty, filters.difficulty as Question["difficulty"]));
  }
  if (filters.status) {
    conditions.push(eq(questions.status, filters.status as Question["status"]));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await executor
    .select({ total: sql<number>`cast(count(*) as integer)` })
    .from(questions)
    .where(where);

  const total = countRow?.total ?? 0;

  const data = await executor
    .select()
    .from(questions)
    .where(where)
    .orderBy(questions.id)
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);

  return { data, total };
}
