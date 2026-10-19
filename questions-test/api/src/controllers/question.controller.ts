import { extname } from "node:path";
import type { Request, Response } from "express";
import {
  createQuestion,
  deleteQuestion,
  duplicateQuestion,
  getQuestion,
  importQuestions,
  listQuestions,
  previewQuestions,
  QuestionValidationError,
} from "../services/question.service.js";
import { ExcelParseError } from "../utils/excel.js";
import { HttpStatus } from "../utils/http-status.js";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export async function importExcel(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "File Excel wajib diunggah pada field 'file'" });
    return;
  }

  if (!ALLOWED_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Berkas harus berekstensi .xlsx, .xls, atau .csv" });
    return;
  }

  try {
    const result = await importQuestions(file.buffer);
    res.status(HttpStatus.OK).json(result);
  } catch (error) {
    if (error instanceof ExcelParseError) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  const filters: Parameters<typeof listQuestions>[0] = { page, limit };
  if (typeof req.query.search === "string") filters.search = req.query.search;
  if (req.query.categoryId !== undefined) filters.categoryId = Number(req.query.categoryId);
  if (typeof req.query.difficulty === "string") filters.difficulty = req.query.difficulty;
  if (typeof req.query.status === "string") filters.status = req.query.status;

  const result = await listQuestions(filters);

  res.status(HttpStatus.OK).json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const question = await getQuestion(id);
  if (!question) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }
  res.status(HttpStatus.OK).json(question);
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const question = await createQuestion(req.body);
    res.status(HttpStatus.CREATED).json(question);
  } catch (error) {
    if (error instanceof QuestionValidationError) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function previewExcelImport(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "File Excel wajib diunggah pada field 'file'" });
    return;
  }
  if (!ALLOWED_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Berkas harus berekstensi .xlsx, .xls, atau .csv" });
    return;
  }

  try {
    res.status(HttpStatus.OK).json(await previewQuestions(file.buffer));
  } catch (error) {
    if (error instanceof ExcelParseError) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const deleted = await deleteQuestion(id);
  if (!deleted) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }
  res.status(HttpStatus.NO_CONTENT).send();
}

export async function duplicate(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const question = await duplicateQuestion(id);
  if (!question) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }
  res.status(HttpStatus.CREATED).json(question);
}
