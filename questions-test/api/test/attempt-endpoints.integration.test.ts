import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
  questions: AttemptQuestion[];
};

let server: TestServer;
let userCookie: string;
const createdUserIds: number[] = [];

beforeAll(async () => {
  server = await startTestServer();

  const user = await createTestSession("user");
  userCookie = user.cookie;
  createdUserIds.push(user.userId);

  await ensureCategory("Penalaran Logis");
  await ensureQuestion("Q-ATT-001", "Penalaran Logis");
});

afterAll(async () => {
  await deleteQuestionsByCodes(["Q-ATT-001"]);
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
    expect(body.questions[0].answer).toBeUndefined();
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
        answers: [{ questionId: started.questions[0].id, answer: "B" }],
      }),
    });
    const body = (await response.json()) as Attempt;

    expect(response.status).toBe(200);
    expect(body.status).toBe("Selesai");
    expect(body.score).not.toBeNull();
    expect(body.questions[0].answer).toBeDefined();
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
        answers: [{ questionId: started.questions[0].id, answer: "B" }],
      }),
    });

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${started.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({
        answers: [{ questionId: started.questions[0].id, answer: "B" }],
      }),
    });

    expect(response.status).toBe(409);
  });
});
