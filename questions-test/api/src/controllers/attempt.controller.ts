import type { Request, Response } from "express";
import {
  getAttempt,
  saveAttemptAnswers,
  startAttempt,
  submitAttempt,
} from "../services/attempt.service.js";
import { HttpStatus } from "../utils/http-status.js";

function isAdmin(req: Request): boolean {
  return (req as unknown as { user?: { role?: string } }).user?.role === "admin";
}

function getUserId(req: Request): number | undefined {
  return (req as unknown as { user?: { id: number } }).user?.id;
}

export async function start(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    categoryId: number;
    packageLabel?: string;
    questionLimit?: number;
  };

  const input: { categoryId: number; packageLabel?: string; questionLimit?: number } = {
    categoryId: body.categoryId,
  };
  if (body.packageLabel !== undefined) input.packageLabel = body.packageLabel;
  if (body.questionLimit !== undefined) input.questionLimit = body.questionLimit;

  const attempt = await startAttempt(input, getUserId(req));

  if (!attempt) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }

  res.status(HttpStatus.CREATED).json(attempt);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const attempt = await getAttempt(id, getUserId(req), isAdmin(req));

  if (!attempt) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }

  res.status(HttpStatus.OK).json(attempt);
}

export async function save(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { answers } = req.body as { answers: { questionId: number; answer: string }[] };

  const result = await saveAttemptAnswers(id, getUserId(req), isAdmin(req), answers);

  if (result === null) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }
  if (result === "conflict") {
    res.status(HttpStatus.CONFLICT).json({ message: "Pengerjaan sudah diselesaikan sebelumnya" });
    return;
  }
  if (result === "invalid") {
    res.status(HttpStatus.BAD_REQUEST).json({ message: "Soal tidak termasuk dalam pengerjaan" });
    return;
  }

  res.status(HttpStatus.OK).json(result);
}

export async function submit(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { answers } = req.body as { answers: { questionId: number; answer: string }[] };

  const result = await submitAttempt(id, getUserId(req), isAdmin(req), answers);

  if (result === null) {
    res.status(HttpStatus.NOT_FOUND).json({ message: "Resource tidak ditemukan" });
    return;
  }
  if (result === "conflict") {
    res.status(HttpStatus.CONFLICT).json({ message: "Pengerjaan sudah diselesaikan sebelumnya" });
    return;
  }

  res.status(HttpStatus.OK).json(result);
}
