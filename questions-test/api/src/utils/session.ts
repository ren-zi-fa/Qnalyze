import { randomBytes } from "node:crypto";
import type { CookieOptions } from "express";

export const SESSION_COOKIE_NAME = "sid";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function sessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_TTL_MS);
}

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_MS,
};
