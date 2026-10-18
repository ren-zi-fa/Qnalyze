import { extname } from "node:path";
import type { Request, Response } from "express";
import { importQuestions } from "../services/question.service.js";
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
