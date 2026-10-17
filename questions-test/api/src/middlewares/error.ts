import type { NextFunction, Request, Response } from "express";
import { HttpStatus, type HttpStatusCode, isServerError } from "@/utils/http-status.js";
import { logger } from "@/utils/logger.js";

const SERVER_ERROR_MESSAGE = "Terjadi kesalahan pada server";
const FALLBACK_CLIENT_ERROR_MESSAGE = "Request tidak dapat diproses";

/**
 * Pesan spesifik untuk kegagalan yang berasal dari body parser / request,
 * sehingga klien tahu bagian mana yang salah. Status lain memakai pesan
 * fallback.
 */
const CLIENT_ERROR_MESSAGE: Partial<Record<HttpStatusCode, string>> = {
  [HttpStatus.BAD_REQUEST]: "Body request bukan JSON yang valid",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "Ukuran body request terlalu besar",
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: "Content-Type request tidak didukung",
};

/** Menangani semua request yang tidak cocok dengan route mana pun. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
}

/** Error handler terakhir: mengubah error apa pun menjadi JSON yang konsisten. */
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  // Respons sudah terkirim: serahkan ke handler default Express.
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = resolveStatus(err);

  if (isServerError(status)) {
    logger.error({ err, status }, SERVER_ERROR_MESSAGE);
  } else {
    logger.warn({ status }, "Request ditolak");
  }

  res.status(status).json({ message: resolveMessage(status) });
}

/** Ambil status dari error (mis. dari body parser) atau default 500. */
function resolveStatus(err: unknown): HttpStatusCode {
  if (typeof err !== "object" || err === null) {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  const { status, statusCode } = err as {
    status?: unknown;
    statusCode?: unknown;
  };
  const raw = typeof status === "number" ? status : statusCode;

  return typeof raw === "number" && raw >= 400 && raw <= 599
    ? (raw as HttpStatusCode)
    : HttpStatus.INTERNAL_SERVER_ERROR;
}

function resolveMessage(status: HttpStatusCode): string {
  if (isServerError(status)) {
    return SERVER_ERROR_MESSAGE;
  }

  return CLIENT_ERROR_MESSAGE[status] ?? FALLBACK_CLIENT_ERROR_MESSAGE;
}
