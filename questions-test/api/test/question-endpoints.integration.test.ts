import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  closeDatabase,
  createTestSession,
  deleteQuestionsByCodes,
  deleteUsers,
  ensureCategory,
  startTestServer,
  type TestServer,
} from "./helpers/integration.js";

const BASE_PATH = "/api/questions";

type Question = {
  id: number;
  code: string;
  text: string;
  categoryId: number;
  type: string;
  difficulty: string;
  status: string;
  options: { key: string; text: string }[];
  answer: string;
  explanation: string | null;
};

type PaginatedQuestions = {
  data: Question[];
  page: number;
  limit: number;
  total: number;
};

type ErrorResponse = { message: string; errors?: { field: string; message: string }[] };

let server: TestServer;
let adminCookie: string;
let userCookie: string;
const createdUserIds: number[] = [];
const createdQuestionIds: number[] = [];
const createdCodes: string[] = [];

beforeAll(async () => {
  server = await startTestServer();

  const admin = await createTestSession("admin");
  const regularUser = await createTestSession("user");
  adminCookie = admin.cookie;
  userCookie = regularUser.cookie;
  createdUserIds.push(admin.userId, regularUser.userId);

  await ensureCategory("Penalaran Verbal");
});

afterAll(async () => {
  for (const id of createdQuestionIds) {
    await fetch(`${server.baseUrl}${BASE_PATH}/${id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });
  }
  await deleteQuestionsByCodes(createdCodes);
  await deleteUsers(createdUserIds);
  await server.stop();
  await closeDatabase();
});

async function createQuestion(payload: Record<string, unknown>, cookie?: string) {
  const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as Question | ErrorResponse;
  if (response.status === 201) {
    const created = body as Question;
    createdQuestionIds.push(created.id);
    createdCodes.push(created.code);
  }
  return { response, body };
}

describe("GET /api/questions", () => {
  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`);
    expect(response.status).toBe(401);
  });

  it("mengembalikan daftar soal dengan paginasi (200)", async () => {
    await createQuestion(
      {
        code: "Q-ENDPOINT-001",
        text: "Soal endpoint 1",
        categoryId: 1,
        type: "Pilihan Ganda",
        difficulty: "Mudah",
        options: [
          { key: "A", text: "Opsi A" },
          { key: "B", text: "Opsi B" },
        ],
        answer: "A",
      },
      adminCookie,
    );

    const response = await fetch(`${server.baseUrl}${BASE_PATH}?page=1&limit=2`, {
      headers: { cookie: userCookie },
    });
    const body = (await response.json()) as PaginatedQuestions;

    expect(response.status).toBe(200);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(typeof body.total).toBe("number");
  });

  it("memfilter berdasarkan status (200)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}?status=Draf&limit=100`, {
      headers: { cookie: adminCookie },
    });
    const body = (await response.json()) as PaginatedQuestions;

    expect(response.status).toBe(200);
    expect(body.data.every((question) => question.status === "Draf")).toBe(true);
  });
});

describe("GET /api/questions/:id", () => {
  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/1`);
    expect(response.status).toBe(401);
  });

  it("mengembalikan 404 untuk soal yang tidak ada", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/999999`, {
      headers: { cookie: adminCookie },
    });
    expect(response.status).toBe(404);
  });

  it("mengambil satu soal (200)", async () => {
    const { body: created } = await createQuestion(
      {
        code: "Q-ENDPOINT-002",
        text: "Soal endpoint 2",
        categoryId: 1,
        type: "Isian Singkat",
        difficulty: "Sedang",
        options: [],
        answer: "42",
      },
      adminCookie,
    );

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${(created as Question).id}`, {
      headers: { cookie: userCookie },
    });
    const body = (await response.json()) as Question;

    expect(response.status).toBe(200);
    expect(body.id).toBe((created as Question).id);
    expect(body.code).toBe("Q-ENDPOINT-002");
  });
});

describe("POST /api/questions", () => {
  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(401);
  });

  it("menolak body yang tidak valid (400)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ code: "Q-INVALID" }),
    });
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("membuat soal baru (201)", async () => {
    const payload = {
      code: "Q-ENDPOINT-003",
      text: "Soal baru endpoint",
      categoryId: 1,
      type: "Pilihan Ganda",
      difficulty: "Sulit",
      status: "Terbit",
      options: [
        { key: "A", text: "Opsi A" },
        { key: "B", text: "Opsi B" },
      ],
      answer: "B",
      explanation: "Pembahasan",
    };

    const { response, body } = await createQuestion(payload, adminCookie);
    const question = body as Question;

    expect(response.status).toBe(201);
    expect(question.code).toBe(payload.code);
    expect(question.status).toBe("Terbit");
    expect(question.difficulty).toBe("Sulit");
  });
});

describe("DELETE /api/questions/:id", () => {
  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/1`, {
      method: "DELETE",
    });
    expect(response.status).toBe(401);
  });

  it("mengembalikan 404 untuk soal yang tidak ada", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/999999`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });
    expect(response.status).toBe(404);
  });

  it("menghapus soal (204)", async () => {
    const { body: created } = await createQuestion(
      {
        code: "Q-ENDPOINT-DELETE",
        text: "Soal hapus",
        categoryId: 1,
        type: "Pilihan Ganda",
        difficulty: "Mudah",
        options: [
          { key: "A", text: "Opsi A" },
          { key: "B", text: "Opsi B" },
        ],
        answer: "A",
      },
      adminCookie,
    );

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${(created as Question).id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    expect(response.status).toBe(204);

    const index = createdQuestionIds.indexOf((created as Question).id);
    if (index !== -1) createdQuestionIds.splice(index, 1);
    const codeIndex = createdCodes.indexOf((created as Question).code);
    if (codeIndex !== -1) createdCodes.splice(codeIndex, 1);
  });
});

describe("POST /api/questions/:id/duplicate", () => {
  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/1/duplicate`, {
      method: "POST",
    });
    expect(response.status).toBe(401);
  });

  it("menolak request dari pengguna non-admin (403)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/1/duplicate`, {
      method: "POST",
      headers: { cookie: userCookie },
    });
    expect(response.status).toBe(403);
  });

  it("mengembalikan 404 untuk soal yang tidak ada", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/999999/duplicate`, {
      method: "POST",
      headers: { cookie: adminCookie },
    });
    expect(response.status).toBe(404);
  });

  it("menduplikasi soal (201)", async () => {
    const { body: created } = await createQuestion(
      {
        code: "Q-ENDPOINT-DUP",
        text: "Soal duplikat",
        categoryId: 1,
        type: "Pilihan Ganda",
        difficulty: "Mudah",
        options: [
          { key: "A", text: "Opsi A" },
          { key: "B", text: "Opsi B" },
        ],
        answer: "A",
      },
      adminCookie,
    );

    const response = await fetch(
      `${server.baseUrl}${BASE_PATH}/${(created as Question).id}/duplicate`,
      {
        method: "POST",
        headers: { cookie: adminCookie },
      },
    );
    const body = (await response.json()) as Question;

    expect(response.status).toBe(201);
    expect(body.id).not.toBe((created as Question).id);
    expect(body.code).not.toBe((created as Question).code);
    expect(body.text).toBe((created as Question).text);
    expect(body.status).toBe("Draf");

    createdQuestionIds.push(body.id);
    createdCodes.push(body.code);
  });
});
