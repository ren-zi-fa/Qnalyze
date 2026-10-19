import { Router } from "express";
import { body, param } from "express-validator";
import {
  create as createCategoryController,
  list as listCategoriesController,
  remove as removeCategoryController,
  update as updateCategoryController,
} from "../controllers/category.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const TONES = ["indigo", "emerald", "amber", "rose", "sky", "violet"];

export const categoryRouter: Router = Router();

categoryRouter.get("/", listCategoriesController);

categoryRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  body("name")
    .isString()
    .withMessage("Nama kategori wajib berupa teks")
    .trim()
    .notEmpty()
    .withMessage("Nama kategori wajib diisi"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Deskripsi harus berupa teks"),
  body("tone").optional().isIn(TONES).withMessage("Tone tidak valid"),
  validate,
  createCategoryController,
);

categoryRouter.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  param("id").isInt({ min: 1 }).withMessage("ID kategori tidak valid"),
  body("name")
    .optional()
    .isString()
    .withMessage("Nama kategori harus berupa teks")
    .trim()
    .notEmpty()
    .withMessage("Nama kategori tidak boleh kosong"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Deskripsi harus berupa teks"),
  body("tone").optional().isIn(TONES).withMessage("Tone tidak valid"),
  validate,
  updateCategoryController,
);

categoryRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  param("id").isInt({ min: 1 }).withMessage("ID kategori tidak valid"),
  validate,
  removeCategoryController,
);
