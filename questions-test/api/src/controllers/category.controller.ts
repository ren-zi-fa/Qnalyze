import type { Request, Response } from "express";
import {
  CategoryConflictError,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../services/category.service.js";
import { HttpStatus } from "../utils/http-status.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const data = await listCategories();
  res.status(HttpStatus.OK).json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const category = await createCategory(req.body);
    res.status(HttpStatus.CREATED).json(category);
  } catch (error) {
    if (error instanceof CategoryConflictError) {
      res.status(HttpStatus.CONFLICT).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const category = await updateCategory(id, req.body);
  if (!category) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }
  res.status(HttpStatus.OK).json(category);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const result = await deleteCategory(id);
  if (result === "not_found") {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }
  if (result === "conflict") {
    res.status(HttpStatus.CONFLICT).json({ message: "Kategori masih memuat soal" });
    return;
  }
  res.status(HttpStatus.NO_CONTENT).send();
}
