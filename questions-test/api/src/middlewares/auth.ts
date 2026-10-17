import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "@/db/index.js";
import { sessions, users } from "@/db/schema.js";
import { HttpStatus } from "@/utils/http-status.js";
import { SESSION_COOKIE_NAME } from "@/utils/session.js";

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
