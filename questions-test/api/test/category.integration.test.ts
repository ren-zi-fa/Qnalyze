import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  closeDatabase,
  createTestSession,
  deleteUsers,
  startTestServer,
  type TestServer,
} from "./helpers/integration.js";

const BASE_PATH = "/api/categories";

type Category = {
  id: number;
  name: string;
  description: string | null;
  tone: string;
  questionCount: number;
  createdAt: string;
};

type CategoryResponse = Category;

type ErrorResponse = { message: string; errors?: { field: string; message: string }[] };

let server: TestServer;
let adminCookie: string;
let userCookie: string;
const createdUserIds: number[] = [];
const createdCategoryIds: number[] = [];

beforeAll(async () => {
  server = await startTestServer();

  const admin = await createTestSession("admin");
  const regularUser = await createTestSession("user");
  adminCookie = admin.cookie;
  userCookie = regularUser.cookie;
  createdUserIds.push(admin.userId, regularUser.userId);
});

afterAll(async () => {
  for (const id of createdCategoryIds) {
    await fetch(`${server.baseUrl}${BASE_PATH}/${id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });
  }
  await deleteUsers(createdUserIds);
  await server.stop();
  await closeDatabase();
});

describe("GET /api/categories", () => {
  it("mengembalikan daftar kategori tanpa autentikasi (200)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`);
    const body = (await response.json()) as { data: Category[] };

    expect(response.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty("id");
    expect(body.data[0]).toHaveProperty("questionCount");
  });

  it("mengembalikan daftar kategori untuk pengguna terautentikasi (200)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      headers: { cookie: userCookie },
    });
    const body = (await response.json()) as { data: Category[] };

    expect(response.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe("POST /api/categories", () => {
  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kategori Tanpa Sesi" }),
    });

    expect(response.status).toBe(401);
  });

  it("menolak request dari pengguna non-admin (403)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ name: "Kategori Non Admin" }),
    });

    expect(response.status).toBe(403);
  });

  it("menolak body yang tidak valid (400)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ tone: "purple" }),
    });
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("membuat kategori baru (201)", async () => {
    const payload = {
      name: "Kategori Uji Buat",
      description: "Deskripsi kategori uji",
      tone: "rose",
    };

    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as CategoryResponse;

    expect(response.status).toBe(201);
    expect(body.name).toBe(payload.name);
    expect(body.description).toBe(payload.description);
    expect(body.tone).toBe(payload.tone);
    expect(body.questionCount).toBe(0);
    createdCategoryIds.push(body.id);
  });

  it("menolak nama kategori yang duplikat (409)", async () => {
    const name = "Kategori Uji Duplikat";
    const first = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ name }),
    });
    const firstBody = (await first.json()) as CategoryResponse;
    createdCategoryIds.push(firstBody.id);

    const second = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ name }),
    });

    expect(second.status).toBe(409);
  });
});

describe("PATCH /api/categories/:id", () => {
  let categoryId: number;

  beforeAll(async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ name: "Kategori Uji Ubah", tone: "indigo" }),
    });
    const body = (await response.json()) as CategoryResponse;
    categoryId = body.id;
    createdCategoryIds.push(categoryId);
  });

  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Baru" }),
    });

    expect(response.status).toBe(401);
  });

  it("menolak request dari pengguna non-admin (403)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ name: "Baru" }),
    });

    expect(response.status).toBe(403);
  });

  it("menolak id yang tidak valid (400)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/abc`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ name: "Baru" }),
    });

    expect(response.status).toBe(400);
  });

  it("mengembalikan 404 untuk kategori yang tidak ada", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/999999`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ name: "Baru" }),
    });

    expect(response.status).toBe(404);
  });

  it("mengubah sebagian data kategori (200)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ description: "Deskripsi baru", tone: "sky" }),
    });
    const body = (await response.json()) as CategoryResponse;

    expect(response.status).toBe(200);
    expect(body.id).toBe(categoryId);
    expect(body.name).toBe("Kategori Uji Ubah");
    expect(body.description).toBe("Deskripsi baru");
    expect(body.tone).toBe("sky");
  });
});

describe("DELETE /api/categories/:id", () => {
  it("menolak request tanpa sesi (401)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/1`, {
      method: "DELETE",
    });

    expect(response.status).toBe(401);
  });

  it("menolak request dari pengguna non-admin (403)", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/1`, {
      method: "DELETE",
      headers: { cookie: userCookie },
    });

    expect(response.status).toBe(403);
  });

  it("mengembalikan 404 untuk kategori yang tidak ada", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/999999`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    expect(response.status).toBe(404);
  });

  it("gagal (409) jika kategori masih memuat soal", async () => {
    const response = await fetch(`${server.baseUrl}${BASE_PATH}/1`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    expect(response.status).toBe(409);
  });

  it("menghapus kategori (204)", async () => {
    const createResponse = await fetch(`${server.baseUrl}${BASE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ name: "Kategori Uji Hapus" }),
    });
    const created = (await createResponse.json()) as CategoryResponse;

    const response = await fetch(`${server.baseUrl}${BASE_PATH}/${created.id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    expect(response.status).toBe(204);

    const remaining = createdCategoryIds.indexOf(created.id);
    if (remaining !== -1) {
      createdCategoryIds.splice(remaining, 1);
    }
  });
});
