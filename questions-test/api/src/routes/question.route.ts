import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import { importExcel, previewExcelImport } from "../controllers/question.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
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

questionRouter.post("/import", requireAuth, requireAdmin, handleUpload, importExcel);
questionRouter.post("/import/preview", requireAuth, requireAdmin, handleUpload, previewExcelImport);
