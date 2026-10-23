import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../src/db/index.js";
import { attempts, categories, questions } from "../src/db/schema.js";
import {
  closeDatabase,
  createTestSession,
  deleteQuestionsByCodes,
  deleteUsers,
  ensureCategory,
  ensureQuestion,
  startTestServer,
  type TestServer,
} from "./helpers/integration.js";

const BASE_PATH = "/api/attempts";

type AttemptQuestion = {
  id: number;
  number: number;
  topic: string;
  difficulty: string;
  prompt: string;
  options: { key: string; text: string }[];
  answer?: string;
  explanation?: string | null;
};

type Attempt = {
  id: number;
  categoryId: number;
  title: string;
  status: string;
  total: number;
  score: number | null;
  correct: number | null;
  answers: Record<string, string>;
  questions: AttemptQuestion[];
};

function firstQuestion(attempt: Attempt): AttemptQuestion {
  const [question] = attempt.questions;
  if (!question) {
    throw new Error("Pengerjaan tidak memiliki soal");
  }
  return question;
}

let server: TestServer;
let userCookie: string;
let autosaveCategoryId: number;
let autosaveQuestionCode: string;
const createdUserIds: number[] = [];

async function startAttempt(cookie = userCookie, questionLimit = 1): Promise<Attempt> {
  const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ categoryId: autosaveCategoryId, questionLimit }),
  });

  expect(response.status).toBe(201);
  return (await response.json()) as Attempt;
}

async function getStoredAnswers(attemptId: number): Promise<Record<string, string>> {
  const [row] = await db
    .select({ answers: attempts.answers })
    .from(attempts)
    .where(eq(attempts.id, attemptId));

  return row?.answers ?? {};
}

async function getCorrectAnswer(questionId: number): Promise<string> {
  const [row] = await db
    .select({ answer: questions.answer })
    .from(questions)
    .where(eq(questions.id, questionId));

  if (!row) {
    throw new Error(`Soal ${questionId} tidak ditemukan`);
  }

  return row.answer;
}

beforeAll(async () => {
  server = await startTestServer();

  const user = await createTestSession("user");
  userCookie = user.cookie;
  createdUserIds.push(user.userId);

  await ensureCategory("Penalaran Logis");
  await ensureQuestion("Q-ATT-001", "Penalaran Logis");

  // Kategori terisolasi agar test autosave tidak terpengaruh soal dari test lain.
  const [category] = await db
    .insert(categories)
    .values({ name: `Uji Autosave ${randomUUID()}` })
    .returning();

  if (!category) {
    throw new Error("Gagal membuat kategori autosave");
  }
  autosaveCategoryId = category.id;

  autosaveQuestionCode = `Q-ATT-SAVE-${randomUUID().slice(0, 8)}`;
  await db.insert(questions).values({
    code: autosaveQuestionCode,
    text: "Soal uji penyimpanan jawaban sementara",
    categoryId: autosaveCategoryId,
    type: "Pilihan Ganda",
    difficulty: "Mudah",
    status: "Terbit",
    options: [
      { key: "A", text: "Opsi A" },
      { key: "B", text: "Opsi B" },
    ],
    answer: "A",
  });
});

afterAll(async () => {
  await deleteQuestionsByCodes(["Q-ATT-001", autosaveQuestionCode]);
  await db.delete(attempts).where(eq(attempts.categoryId, autosaveCategoryId));
  await db.delete(categories).where(eq(categories.id, autosaveCategoryId));
  await deleteUsers(createdUserIds);
  await server.stop();
  await closeDatabase();
});

describe("POST /api/attempts", () => {
  it("mengembalikan 404 untuk kategori tanpa soal", async () => {
    await ensureCategory("Kategori Kosong Attempt");
    // category exists but may have no questions; find its id via list? use 999
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ categoryId: 999999 }),
    });
    expect(response.status).toBe(404);
  });

  it("memulai pengerjaan (201)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ categoryId: 3, questionLimit: 1 }),
    });
    const body = (await response.json()) as Attempt;

    expect(response.status).toBe(201);
    expect(body.status).toBe("Berlangsung");
    expect(body.questions.length).toBe(1);
    expect(firstQuestion(body).answer).toBeUndefined();
  });
});

describe("GET /api/attempts/:id", () => {
  it("mengembalikan 404 untuk pengerjaan yang tidak ada", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/999999`, {
      headers: { cookie: userCookie },
    });
    expect(response.status).toBe(404);
  });
});

describe("POST /api/attempts/:id/answers", () => {
  it("menyelesaikan pengerjaan dan mengembalikan hasil (200)", async () => {
    const startResponse = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ categoryId: 3, questionLimit: 1 }),
    });
    const started = (await startResponse.json()) as Attempt;

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({
        answers: [{ questionId: firstQuestion(started).id, answer: "B" }],
      }),
    });
    const body = (await response.json()) as Attempt;

    expect(response.status).toBe(200);
    expect(body.status).toBe("Selesai");
    expect(body.score).not.toBeNull();
    expect(firstQuestion(body).answer).toBeDefined();
  });

  it("mengembalikan 409 jika sudah selesai", async () => {
    const startResponse = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ categoryId: 3, questionLimit: 1 }),
    });
    const started = (await startResponse.json()) as Attempt;

    await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({
        answers: [{ questionId: firstQuestion(started).id, answer: "B" }],
      }),
    });

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({
        answers: [{ questionId: firstQuestion(started).id, answer: "B" }],
      }),
    });

    expect(response.status).toBe(409);
  });
});

describe("PATCH /api/attempts/:id/answers", () => {
  it("menyimpan jawaban sementara tanpa mengakhiri pengerjaan (200)", async () => {
    const started = await startAttempt();
    const questionId = firstQuestion(started).id;

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: "B" }] }),
    });
    const body = (await response.json()) as Attempt;

    expect(response.status).toBe(200);
    expect(body.status).toBe("Berlangsung");
    expect(body.score).toBeNull();
    expect(firstQuestion(body).answer).toBeUndefined();
    expect(body.answers).toEqual({ [String(questionId)]: "B" });
    expect(await getStoredAnswers(started.id)).toEqual({ [String(questionId)]: "B" });
  });

  it("mengembalikan jawaban tersimpan saat sesi dimuat ulang (200)", async () => {
    const started = await startAttempt();
    const questionId = firstQuestion(started).id;

    await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: "B" }] }),
    });

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}`, {
      headers: { cookie: userCookie },
    });
    const body = (await response.json()) as Attempt;

    expect(response.status).toBe(200);
    expect(body.answers).toEqual({ [String(questionId)]: "B" });
  });

  it("memperbarui jawaban untuk questionId yang sama (200)", async () => {
    const started = await startAttempt();
    const questionId = firstQuestion(started).id;
    const url = `${server.baseUrl}${BASE_PATH}/${started.id}/answers`;

    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: "B" }] }),
    });

    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: "C" }] }),
    });

    expect(response.status).toBe(200);
    expect(await getStoredAnswers(started.id)).toEqual({ [String(questionId)]: "C" });
  });

  it("menolak answers kosong (400)", async () => {
    const started = await startAttempt();

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [] }),
    });

    expect(response.status).toBe(400);
  });

  it("menolak questionId yang bukan bagian dari pengerjaan (400)", async () => {
    const started = await startAttempt();

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId: 999999, answer: "A" }] }),
    });

    expect(response.status).toBe(400);
  });

  it("mengembalikan 404 untuk pengerjaan yang tidak ada", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/999999/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId: 1, answer: "A" }] }),
    });

    expect(response.status).toBe(404);
  });

  it("mengembalikan 404 untuk pengerjaan milik pengguna lain", async () => {
    const started = await startAttempt();
    const otherUser = await createTestSession("user");
    createdUserIds.push(otherUser.userId);

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: otherUser.cookie },
      body: JSON.stringify({
        answers: [{ questionId: firstQuestion(started).id, answer: "A" }],
      }),
    });

    expect(response.status).toBe(404);
  });

  it("mengembalikan 409 setelah pengerjaan selesai", async () => {
    const started = await startAttempt();
    const questionId = firstQuestion(started).id;

    await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: "B" }] }),
    });

    await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: "B" }] }),
    });

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: "C" }] }),
    });

    expect(response.status).toBe(409);
  });

  it("jawaban sementara ikut dihitung saat pengerjaan dikumpulkan (200)", async () => {
    const started = await startAttempt();
    const questionId = firstQuestion(started).id;
    const correctAnswer = await getCorrectAnswer(questionId);

    const saveResponse = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [{ questionId, answer: correctAnswer }] }),
    });
    expect(saveResponse.status).toBe(200);

    // Kumpulkan tanpa mengirim ulang jawaban; jawaban autosave harus dipakai.
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ answers: [] }),
    });
    const body = (await response.json()) as Attempt;

    expect(response.status).toBe(200);
    expect(body.status).toBe("Selesai");
    expect(body.correct).toBe(1);
    expect(body.score).toBe(100);
  });
});
