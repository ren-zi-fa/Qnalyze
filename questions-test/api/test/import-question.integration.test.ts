import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  closeDatabase,
  createTestSession,
  deleteQuestionsByCodes,
  deleteUsers,
  ensureCategory,
  ensureQuestion,
  readFixture,
  startTestServer,
  type TestServer,
} from "./helpers/integration.js";

const IMPORT_PATH = "/api/questions/import";

/** Kode soal pada `template-impor-soal.xlsx` (seluruhnya valid). */
const TEMPLATE_CODES = ["Q-VB-101", "Q-NM-101", "Q-LG-101", "Q-AL-101", "Q-NM-102", "Q-VB-102"];

/** Kode soal pada `impor-soal-contoh-error.xlsx` (seluruhnya bermasalah). */
const ERROR_CODES = ["Q-XX-001", "Q-XX-002", "Q-XX-003", "Q-XX-004", "Q-XX-005", "Q-XX-006"];

const FIXTURE_CODES = [...TEMPLATE_CODES, ...ERROR_CODES];

/** Kode yang sengaja dibuat sudah ada agar terdeteksi sebagai duplikat. */
const DUPLICATE_CODE = "Q-LG-001";

const REQUIRED_CATEGORIES = ["Penalaran Verbal", "Penalaran Numerik", "Penalaran Logis"];

type ImportedQuestion = {
  code: string;
  type: string;
  difficulty: string;
  status: string;
  options: { key: string; text: string }[];
  answer: string;
  explanation: string | null;
};

type ImportResponse = {
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
  data: ImportedQuestion[];
};

type ErrorResponse = { message: string };

let server: TestServer;
let adminCookie: string;
let userCookie: string;
const createdUserIds: number[] = [];

beforeAll(async () => {
  server = await startTestServer();

  const admin = await createTestSession("admin");
  const regularUser = await createTestSession("user");
  adminCookie = admin.cookie;
  userCookie = regularUser.cookie;
  createdUserIds.push(admin.userId, regularUser.userId);

  for (const name of REQUIRED_CATEGORIES) {
    await ensureCategory(name);
  }
  await ensureQuestion(DUPLICATE_CODE, "Penalaran Logis");
});

beforeEach(async () => {
  await deleteQuestionsByCodes(FIXTURE_CODES);
});

afterAll(async () => {
  await deleteQuestionsByCodes(FIXTURE_CODES);
  await deleteUsers(createdUserIds);
  await server.stop();
  await closeDatabase();
});

/** Unggah berkas sebagai multipart/form-data ke endpoint impor. */
function uploadWorkbook(buffer: Buffer, filename: string, cookie?: string): Promise<Response> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), filename);

  return fetch(`${server.baseUrl}${IMPORT_PATH}`, {
    method: "POST",
    headers: cookie === undefined ? {} : { cookie },
    body: form,
  });
}

describe("POST /api/questions/import", () => {
  describe("akses", () => {
    it("menolak request tanpa sesi (401)", async () => {
      const response = await uploadWorkbook(
        readFixture("template-impor-soal.xlsx"),
        "template.xlsx",
      );

      expect(response.status).toBe(401);
    });

    it("menolak request dari pengguna non-admin (403)", async () => {
      const response = await uploadWorkbook(
        readFixture("template-impor-soal.xlsx"),
        "template.xlsx",
        userCookie,
      );

      expect(response.status).toBe(403);
    });
  });

  describe("validasi berkas", () => {
    it("menolak request tanpa berkas unggahan (400)", async () => {
      const response = await fetch(`${server.baseUrl}${IMPORT_PATH}`, {
        method: "POST",
        headers: { cookie: adminCookie },
        body: new FormData(),
      });
      const body = (await response.json()) as ErrorResponse;

      expect(response.status).toBe(400);
      expect(body.message).toContain("field 'file'");
    });

    it("menolak ekstensi berkas yang tidak didukung (400)", async () => {
      const response = await uploadWorkbook(Buffer.from("bukan excel"), "soal.txt", adminCookie);
      const body = (await response.json()) as ErrorResponse;

      expect(response.status).toBe(400);
      expect(body.message).toContain(".xlsx");
    });

    it("menolak berkas yang bukan Excel valid (400)", async () => {
      const response = await uploadWorkbook(
        Buffer.from("ini bukan excel"),
        "soal.xlsx",
        adminCookie,
      );

      expect(response.status).toBe(400);
    });
  });

  describe("impor sukses", () => {
    it("menyimpan seluruh baris valid dari template", async () => {
      const response = await uploadWorkbook(
        readFixture("template-impor-soal.xlsx"),
        "template.xlsx",
        adminCookie,
      );
      const body = (await response.json()) as ImportResponse;

      expect(response.status).toBe(200);
      expect(body.imported).toBe(TEMPLATE_CODES.length);
      expect(body.failed).toBe(0);
      expect(body.errors).toEqual([]);
      expect(body.data.map(({ code }) => code).sort()).toEqual([...TEMPLATE_CODES].sort());
    });

    it("menerapkan nilai bawaan dan opsi Benar/Salah saat kolom dikosongkan", async () => {
      const response = await uploadWorkbook(
        readFixture("template-impor-soal.xlsx"),
        "template.xlsx",
        adminCookie,
      );
      const body = (await response.json()) as ImportResponse;
      const byCode = (code: string): ImportedQuestion | undefined =>
        body.data.find((question) => question.code === code);

      // Tingkat kesulitan & status kosong memakai nilai bawaan.
      expect(byCode("Q-VB-102")).toMatchObject({ difficulty: "Sedang", status: "Draf" });
      // Benar/Salah mendapat opsi default B/S meski kolom opsi kosong.
      expect(byCode("Q-AL-101")).toMatchObject({
        answer: "B",
        options: [
          { key: "B", text: "Benar" },
          { key: "S", text: "Salah" },
        ],
      });
      // Isian singkat mempertahankan jawaban apa adanya dan tanpa opsi.
      expect(byCode("Q-NM-102")).toMatchObject({
        type: "Isian Singkat",
        answer: "20",
        options: [],
      });
    });
  });

  describe("pelaporan kesalahan", () => {
    it("melaporkan tiap baris bermasalah dan tidak menyimpan apa pun", async () => {
      const response = await uploadWorkbook(
        readFixture("impor-soal-contoh-error.xlsx"),
        "contoh-error.xlsx",
        adminCookie,
      );
      const body = (await response.json()) as ImportResponse;

      expect(response.status).toBe(200);
      expect(body.imported).toBe(0);
      expect(body.failed).toBe(body.errors.length);
      expect(body.errors.map(({ row }) => row).sort((a, b) => a - b)).toEqual([
        2, 3, 4, 5, 6, 7, 8, 9,
      ]);

      const messageFor = (row: number): string =>
        body.errors.find((error) => error.row === row)?.message ?? "";

      expect(messageFor(2)).toContain("sudah digunakan"); // kode duplikat
      expect(messageFor(3)).toContain("tidak ditemukan"); // kategori asing
      expect(messageFor(4)).toContain("tidak valid"); // tipe tidak dikenal
      expect(messageFor(5)).toContain("tidak cocok dengan opsi"); // jawaban di luar opsi
      expect(messageFor(6)).toContain("Kolom jawaban kosong");
      expect(messageFor(7)).toContain("Kolom pertanyaan kosong");
      expect(messageFor(8)).toContain("Minimal 2 opsi");
      expect(messageFor(9)).toContain("Kolom kode kosong");
    });

    it("menolak kode yang sudah tersimpan di database", async () => {
      await uploadWorkbook(readFixture("template-impor-soal.xlsx"), "template.xlsx", adminCookie);

      const response = await uploadWorkbook(
        readFixture("template-impor-soal.xlsx"),
        "template.xlsx",
        adminCookie,
      );
      const body = (await response.json()) as ImportResponse;

      expect(body.imported).toBe(0);
      expect(body.failed).toBe(TEMPLATE_CODES.length);
      expect(body.errors.every(({ message }) => message.includes("sudah digunakan"))).toBe(true);
    });
  });
});
