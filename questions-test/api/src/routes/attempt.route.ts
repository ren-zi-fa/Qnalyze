import { Router } from "express";
import { body, param } from "express-validator";
import { getById, start, submit } from "../controllers/attempt.controller.js";
import { validate } from "../middlewares/validate.js";

export const attemptRouter: Router = Router();

attemptRouter.post(
  "/",
  body("categoryId").isInt({ min: 1 }).withMessage("Kategori tidak valid"),
  body("packageLabel").optional().isString().withMessage("Label paket harus berupa teks"),
  body("questionLimit").optional().isInt({ min: 1 }).withMessage("Jumlah soal tidak valid"),
  validate,
  start,
);

attemptRouter.get(
  "/:id",
  param("id").isInt({ min: 1 }).withMessage("ID pengerjaan tidak valid"),
  validate,
  getById,
);

attemptRouter.post(
  "/:id/answers",
  param("id").isInt({ min: 1 }).withMessage("ID pengerjaan tidak valid"),
  body("answers").isArray().withMessage("Jawaban harus berupa array"),
  body("answers.*.questionId").isInt({ min: 1 }).withMessage("ID soal tidak valid"),
  body("answers.*.answer").isString().withMessage("Jawaban harus berupa teks"),
  validate,
  submit,
);
