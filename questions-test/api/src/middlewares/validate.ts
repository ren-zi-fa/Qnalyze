import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatus } from "@/utils/http-status.js";

export function validate(req: Request, res: Response, next: NextFunction): void {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  const errors = result.array().map((error) => ({
    field: error.type === "field" ? error.path : "body",
    message: error.msg,
  }));

  res.status(HttpStatus.BAD_REQUEST).json({ message: "Validasi request gagal", errors });
}
