import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "@/middlewares/auth.js";
import { HttpStatus } from "@/utils/http-status.js";
import { toPublicUser } from "@/utils/user.js";

export function me(req: Request, res: Response): void {
  const { user } = req as AuthenticatedRequest;
  res.status(HttpStatus.OK).json(toPublicUser(user));
}
