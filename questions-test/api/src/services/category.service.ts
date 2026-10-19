import type { NewCategory } from "../repositories/category.repository.js";
import {
  type CategoryWithCount,
  countQuestions,
  create as createCategoryRow,
  findById,
  list as listCategoryRows,
  remove,
  update as updateCategoryRow,
} from "../repositories/category.repository.js";

export type Category = CategoryWithCount;

export type CreateCategoryInput = {
  name: string;
  description?: string | null;
  tone?: NewCategory["tone"];
};

export type UpdateCategoryInput = {
  name?: string;
  description?: string | null;
  tone?: NewCategory["tone"];
};

export class CategoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryConflictError";
  }
}

/** Daftar semua kategori beserta jumlah soalnya. */
export async function listCategories(): Promise<Category[]> {
  return listCategoryRows();
}

/** Buat kategori baru. */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  let row: Awaited<ReturnType<typeof createCategoryRow>>;
  try {
    row = await createCategoryRow({
      name: input.name.trim(),
      description: input.description ?? null,
      tone: input.tone ?? "indigo",
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CategoryConflictError("Nama kategori sudah digunakan");
    }
    throw error;
  }

  return { ...row, questionCount: 0 };
}

/** Ubah sebagian data kategori. Mengembalikan null bila tidak ditemukan. */
export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
): Promise<Category | null> {
  const existing = await findById(id);
  if (!existing) {
    return null;
  }

  const payload: Partial<NewCategory> = {};
  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }
  if (input.description !== undefined) {
    payload.description = input.description;
  }
  if (input.tone !== undefined) {
    payload.tone = input.tone;
  }

  if (Object.keys(payload).length > 0) {
    try {
      await updateCategoryRow(id, payload);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new CategoryConflictError("Nama kategori sudah digunakan");
      }
      throw error;
    }
  }

  const refreshed = await findById(id);
  return refreshed ?? null;
}

/** Hapus kategori. Mengembalikan status hasil penghapusan. */
export async function deleteCategory(id: number): Promise<"deleted" | "not_found" | "conflict"> {
  const existing = await findById(id);
  if (!existing) {
    return "not_found";
  }

  const total = await countQuestions(id);
  if (total > 0) {
    return "conflict";
  }

  await remove(id);
  return "deleted";
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const directCode = (error as { code?: unknown }).code;
  if (directCode === "23505") {
    return true;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (typeof cause === "object" && cause !== null) {
    return (cause as { code?: unknown }).code === "23505";
  }

  return false;
}
