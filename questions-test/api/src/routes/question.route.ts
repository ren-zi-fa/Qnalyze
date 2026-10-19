import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { body, param, query } from "express-validator";
import multer from "multer";
import { DIFFICULTIES, QUESTION_TYPES, STATUSES } from "../constants/question.js";
import {
  create as createQuestionController,
  duplicate as duplicateQuestionController,
  getById as getQuestionByIdController,
  importExcel,
  list as listQuestionsController,
  previewExcelImport,
  remove as removeQuestionController,
} from "../controllers/question.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { HttpStatus } from "../utils/http-status.js";

export const questionRouter: Router = Router();

// Berkas ditampung di memori karena langsung diparsing, 5 MB sesuai UI.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** Bungkus multer agar error pengunggahan berupa respons JSON yang konsisten. */
function handleUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single("file")(req, res, (error: unknown) => {
    if (error === undefined) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE" ? "Ukuran file melebihi 5 MB" : "Gagal membaca unggahan";
      res.status(HttpStatus.BAD_REQUEST).json({ message });
      return;
    }

    next(error);
  });
}

questionRouter.get(
  "/",
  requireAuth,
  query("page").optional().isInt({ min: 1 }).withMessage("Halaman tidak valid"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit tidak valid"),
  query("search").optional().isString().withMessage("Pencarian harus berupa teks"),
  query("categoryId").optional().isInt({ min: 1 }).withMessage("Kategori tidak valid"),
  query("difficulty")
    .optional()
    .isIn([...DIFFICULTIES])
    .withMessage("Tingkat kesulitan tidak valid"),
  query("status")
    .optional()
    .isIn([...STATUSES])
    .withMessage("Status tidak valid"),
  validate,
  listQuestionsController,
);

questionRouter.get(
  "/:id",
  requireAuth,
  param("id").isInt({ min: 1 }).withMessage("ID soal tidak valid"),
  validate,
  getQuestionByIdController,
);

questionRouter.post(
  "/",
  requireAuth,
  body("code")
    .isString()
    .withMessage("Kode harus berupa teks")
    .trim()
    .notEmpty()
    .withMessage("Kode wajib diisi"),
  body("text")
    .isString()
    .withMessage("Pertanyaan harus berupa teks")
    .trim()
    .notEmpty()
    .withMessage("Pertanyaan wajib diisi"),
  body("categoryId").isInt({ min: 1 }).withMessage("Kategori tidak valid"),
  body("type")
    .isIn([...QUESTION_TYPES])
    .withMessage("Tipe soal tidak valid"),
  body("difficulty")
    .isIn([...DIFFICULTIES])
    .withMessage("Tingkat kesulitan tidak valid"),
  body("status")
    .optional()
    .isIn([...STATUSES])
    .withMessage("Status tidak valid"),
  body("options").isArray().withMessage("Opsi harus berupa array"),
  body("options.*.key").isString().withMessage("Key opsi harus berupa teks"),
  body("options.*.text").isString().withMessage("Teks opsi harus berupa teks"),
  body("answer")
    .isString()
    .withMessage("Jawaban harus berupa teks")
    .trim()
    .notEmpty()
    .withMessage("Jawaban wajib diisi"),
  body("explanation")
    .optional({ nullable: true })
    .isString()
    .withMessage("Pembahasan harus berupa teks"),
  validate,
  createQuestionController,
);

questionRouter.delete(
  "/:id",
  requireAuth,
  param("id").isInt({ min: 1 }).withMessage("ID soal tidak valid"),
  validate,
  removeQuestionController,
);

questionRouter.post(
  "/:id/duplicate",
  requireAuth,
  requireAdmin,
  param("id").isInt({ min: 1 }).withMessage("ID soal tidak valid"),
  validate,
  duplicateQuestionController,
);

questionRouter.post("/import", requireAuth, requireAdmin, handleUpload, importExcel);
questionRouter.post("/import/preview", requireAuth, requireAdmin, handleUpload, previewExcelImport);
