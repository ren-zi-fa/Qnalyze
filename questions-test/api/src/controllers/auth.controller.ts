import { compare, hash } from "bcrypt";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { HttpStatus } from "../utils/http-status.js";
import {
  generateSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  sessionExpiresAt,
} from "../utils/session.js";
import { toPublicUser } from "../utils/user.js";

type Credentials = {
  name?: string;
  email: string;
  password: string;
};

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as Credentials;

  const existing = await db.select().from(users).where(eq(users.email, email));

  if (existing.length > 0) {
    res.status(HttpStatus.CONFLICT).json({ message: "Email sudah terdaftar" });
    return;
  }

  const passwordHash = await hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      name: name?.trim() ? name.trim() : null,
      email,
      password: passwordHash,
    })
    .returning();

  if (!user) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Terjadi kesalahan saat membuat user" });
    return;
  }

  await createSession(res, user.id);

  res.status(HttpStatus.CREATED).json({ user: toPublicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as Credentials;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Email atau password salah" });
    return;
  }

  const passwordValid = await compare(password, user.password);

  if (!passwordValid) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Email atau password salah" });
    return;
  }

  await createSession(res, user.id);

  res.status(HttpStatus.OK).json({ user: toPublicUser(user) });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies[SESSION_COOKIE_NAME] as string | undefined;

  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }

  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
  res.status(HttpStatus.NO_CONTENT).send();
}

async function createSession(res: Response, userId: number): Promise<void> {
  const token = generateSessionToken();

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt: sessionExpiresAt(),
  });

  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions);
}
