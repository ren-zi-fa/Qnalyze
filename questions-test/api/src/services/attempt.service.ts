import type { Question } from "../db/schema.js";
import {
  create as createAttemptRow,
  findById as findAttemptById,
  mergeAnswers as mergeAttemptAnswers,
  type NewAttempt,
  update as updateAttemptRow,
} from "../repositories/attempt.repository.js";
import { findById as findCategoryById } from "../repositories/category.repository.js";
import {
  findById as findQuestionById,
  list as listQuestionsRepository,
} from "../repositories/question.repository.js";

export type AttemptQuestion = {
  id: number;
  number: number;
  topic: string;
  difficulty: string;
  prompt: string;
  options: { key: string; text: string }[];
  stimulus?: string;
  answer?: string;
  explanation?: string | null;
};

export type Attempt = {
  id: number;
  categoryId: number;
  title: string;
  packageLabel?: string | null;
  durationLimitMinutes: number;
  status: "Berlangsung" | "Selesai";
  startedAt: Date;
  finishedAt: Date | null;
  score: number | null;
  correct: number | null;
  total: number;
  durationMinutes: number | null;
  /** Jawaban tersimpan sementara: questionId (string) → jawaban. */
  answers: Record<string, string>;
  questions: AttemptQuestion[];
};

export type StartAttemptInput = {
  categoryId: number;
  packageLabel?: string;
  questionLimit?: number;
};

export type SubmitAnswer = {
  questionId: number;
  answer: string;
};

function toAttemptQuestion(
  question: Question,
  number: number,
  topic: string,
  includeAnswers: boolean,
): AttemptQuestion {
  const result: AttemptQuestion = {
    id: question.id,
    number,
    topic,
    difficulty: question.difficulty,
    prompt: question.text,
    options: question.options,
  };

  if (includeAnswers) {
    result.answer = question.answer;
    result.explanation = question.explanation;
  }

  return result;
}

function toAttempt(
  row: {
    id: number;
    categoryId: number;
    title: string;
    packageLabel: string | null;
    durationLimitMinutes: number;
    status: "Berlangsung" | "Selesai";
    startedAt: Date;
    finishedAt: Date | null;
    score: number | null;
    correct: number | null;
    total: number;
    durationMinutes: number | null;
    answers: Record<string, string>;
  },
  questions: AttemptQuestion[],
): Attempt {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    packageLabel: row.packageLabel,
    durationLimitMinutes: row.durationLimitMinutes,
    status: row.status,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    score: row.score,
    correct: row.correct,
    total: row.total,
    durationMinutes: row.durationMinutes,
    answers: row.answers,
    questions,
  };
}

export async function startAttempt(
  input: StartAttemptInput,
  userId?: number,
): Promise<Attempt | null> {
  const category = await findCategoryById(input.categoryId);
  if (!category) {
    return null;
  }

  const result = await listQuestionsRepository({
    page: 1,
    limit: 10000,
    categoryId: input.categoryId,
    status: "Terbit",
  });

  let selected = result.data;
  if (input.questionLimit !== undefined) {
    selected = selected.slice(0, input.questionLimit);
  }

  if (selected.length === 0) {
    return null;
  }

  const title = input.packageLabel ?? `Tes ${category.name}`;

  const attemptRow = await createAttemptRow({
    userId: userId ?? null,
    categoryId: input.categoryId,
    title,
    packageLabel: input.packageLabel ?? null,
    durationLimitMinutes: 20,
    status: "Berlangsung",
    total: selected.length,
    questionIds: selected.map((question) => question.id),
    answers: {},
  } as NewAttempt);

  const questions = selected.map((question, index) =>
    toAttemptQuestion(question, index + 1, category.name, false),
  );

  return toAttempt(attemptRow, questions);
}

/**
 * Simpan jawaban sementara pada sesi yang masih berlangsung.
 *
 * Jawaban digabungkan dengan jawaban yang sudah tersimpan dan tidak mengubah
 * status sesi maupun skor. Mengembalikan "invalid" bila ada `questionId`
 * yang bukan bagian dari paket soal sesi tersebut.
 */
export async function saveAttemptAnswers(
  id: number,
  userId: number | undefined,
  isAdmin: boolean,
  answers: SubmitAnswer[],
): Promise<Attempt | null | "conflict" | "invalid"> {
  const row = await findAttemptById(id);
  if (!row) {
    return null;
  }
  if (userId !== undefined && row.userId !== userId && !isAdmin) {
    return null;
  }
  if (row.status === "Selesai") {
    return "conflict";
  }

  const questionIds = new Set(row.questionIds);
  if (answers.some(({ questionId }) => !questionIds.has(questionId))) {
    return "invalid";
  }

  const answerRecord: Record<string, string> = {};
  for (const { questionId, answer } of answers) {
    answerRecord[String(questionId)] = answer;
  }

  const updated = await mergeAttemptAnswers(id, answerRecord);
  if (!updated) {
    return "conflict";
  }

  return getAttempt(id, userId, isAdmin);
}

export async function getAttempt(
  id: number,
  userId?: number,
  isAdmin: boolean = false,
): Promise<Attempt | null> {
  const row = await findAttemptById(id);
  if (!row) {
    return null;
  }
  if (userId !== undefined && row.userId !== userId && !isAdmin) {
    return null;
  }

  const includeAnswers = row.status === "Selesai";
  const questions = await Promise.all(
    row.questionIds.map(async (questionId, index) => {
      const question = await findQuestionById(questionId);
      if (!question) {
        return null;
      }
      return toAttemptQuestion(
        question,
        index + 1,
        (await findCategoryById(row.categoryId))?.name ?? "",
        includeAnswers,
      );
    }),
  );

  return toAttempt(
    row,
    questions.filter((item): item is AttemptQuestion => item !== null),
  );
}

export async function submitAttempt(
  id: number,
  userId?: number,
  isAdmin: boolean = false,
  answers: SubmitAnswer[] = [],
): Promise<Attempt | null | "conflict"> {
  const row = await findAttemptById(id);
  if (!row) {
    return null;
  }
  if (userId !== undefined && row.userId !== userId && !isAdmin) {
    return null;
  }
  if (row.status === "Selesai") {
    return "conflict";
  }

  // Jawaban sementara (autosave) tetap dihitung saat pengerjaan dikumpulkan.
  const answerRecord: Record<string, string> = { ...row.answers };
  for (const item of answers) {
    answerRecord[String(item.questionId)] = item.answer;
  }

  const answerMap = new Map<number, string>(
    Object.entries(answerRecord).map(([questionId, answer]) => [Number(questionId), answer]),
  );
  const questions = await Promise.all(
    row.questionIds.map((questionId) => findQuestionById(questionId)),
  );

  let correct = 0;
  for (const question of questions) {
    if (!question) {
      continue;
    }
    const userAnswer = answerMap.get(question.id);
    if (
      userAnswer !== undefined &&
      userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase()
    ) {
      correct += 1;
    }
  }

  const total = row.total || questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const finishedAt = new Date();
  const durationMinutes = (finishedAt.getTime() - row.startedAt.getTime()) / 60000;

  const updated = await updateAttemptRow(id, {
    status: "Selesai",
    finishedAt,
    score,
    correct,
    total,
    durationMinutes,
    answers: answerRecord,
  });

  if (!updated) {
    return null;
  }

  const includeAnswers = true;
  const category = await findCategoryById(row.categoryId);
  const topic = category?.name ?? "";
  const attemptQuestions = await Promise.all(
    row.questionIds.map(async (questionId, index) => {
      const question = await findQuestionById(questionId);
      if (!question) {
        return null;
      }
      return toAttemptQuestion(question, index + 1, topic, includeAnswers);
    }),
  );

  return toAttempt(
    updated,
    attemptQuestions.filter((item): item is AttemptQuestion => item !== null),
  );
}
