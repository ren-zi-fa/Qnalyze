import { Router } from "express";
import { body } from "express-validator";
import { login, logout, register } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";

export const authRouter: Router = Router();

authRouter.post(
  "/register",
  body("name").optional().isString().trim(),
  body("email").isEmail().withMessage("Email tidak valid"),
  body("password").isLength({ min: 8 }).withMessage("Password minimal 8 karakter"),
  validate,
  register,
);

authRouter.post(
  "/login",
  body("email").isEmail().withMessage("Email tidak valid"),
  body("password").notEmpty().withMessage("Password wajib diisi"),
  validate,
  login,
);

authRouter.post("/logout", logout);
