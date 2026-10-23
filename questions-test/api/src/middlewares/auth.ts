import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { HttpStatus } from "../utils/http-status.js";
import { SESSION_COOKIE_NAME } from "../utils/session.js";

export type AuthenticatedRequest = Request & {
  user: (typeof users)["$inferSelect"];
};

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies[SESSION_COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Tidak terautentikasi" });
    return;
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.id, token));

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Session tidak valid atau kedaluwarsa" });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));

  if (!user) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Session tidak valid atau kedaluwarsa" });
    return;
  }

  (req as AuthenticatedRequest).user = user;
  next();
}

/**
 * Isi `req.user` bila cookie sesi valid, tetapi tetap lanjut sebagai anonim
 * bila cookie tidak ada/tidak valid. Dipakai endpoint yang boleh diakses
 * publik sekaligus perlu mengenali pemilik sesi (mis. attempt).
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies[SESSION_COOKIE_NAME] as string | undefined;

  if (!token) {
    next();
    return;
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.id, token));

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    next();
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));

  if (user) {
    (req as AuthenticatedRequest).user = user;
  }

  next();
}

/** Hanya melanjutkan request dari pengguna berperan admin. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const { user } = req as AuthenticatedRequest;

  if (user.role !== "admin") {
    res.status(HttpStatus.FORBIDDEN).json({ message: "Hanya admin yang diizinkan" });
    return;
  }

  next();
}
