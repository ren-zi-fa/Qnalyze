import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import type { Server } from "node:http";
import { fileURLToPath } from "node:url";
import { eq, inArray } from "drizzle-orm";
import { app } from "../../src/config/express.js";
import { db } from "../../src/db/index.js";
import { categories, questions, sessions, users } from "../../src/db/schema.js";
import { generateSessionToken, sessionExpiresAt } from "../../src/utils/session.js";

/** Server Express yang berjalan di port acak, siap diuji lewat HTTP. */
export type TestServer = {
  baseUrl: string;
  stop: () => Promise<void>;
};

/** Hidupkan aplikasi pada port acak agar test tidak bentrok dengan dev. */
export async function startTestServer(): Promise<TestServer> {
  const server: Server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Alamat server pengujian tidak valid");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    stop: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

/** Sesi login pengujian: cookie siap pakai + id user untuk pembersihan. */
export type TestSession = {
  cookie: string;
  userId: number;
};

/** Buat user dengan peran tertentu beserta sesi login yang valid. */
export async function createTestSession(role: "admin" | "user"): Promise<TestSession> {
  const email = `${role}-${randomUUID()}@example.test`;

  const [user] = await db
    .insert(users)
    .values({ name: "Pengguna Uji", email, password: "tidak-dipakai", role })
    .returning();

  if (!user) {
    throw new Error("Gagal membuat user pengujian");
  }

  const token = generateSessionToken();
  await db.insert(sessions).values({ id: token, userId: user.id, expiresAt: sessionExpiresAt() });

  return { cookie: `sid=${token}`, userId: user.id };
}

/** Hapus user pengujian (sesinya ikut terhapus lewat ON DELETE CASCADE). */
export async function deleteUsers(ids: number[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  await db.delete(users).where(inArray(users.id, ids));
}

/** Pastikan kategori dengan nama tertentu tersedia. */
export async function ensureCategory(name: string): Promise<void> {
  await db.insert(categories).values({ name }).onConflictDoNothing();
}

/** Pastikan satu soal acuan ada, misalnya untuk menguji deteksi kode duplikat. */
export async function ensureQuestion(code: string, categoryName: string): Promise<void> {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, categoryName))
    .limit(1);

  if (!category) {
    throw new Error(`Kategori "${categoryName}" belum tersedia`);
  }

  await db
    .insert(questions)
    .values({
      code,
      text: "Soal acuan pengujian",
      categoryId: category.id,
      // Harus "Terbit" agar ikut terpilih saat memulai pengerjaan (startAttempt).
      status: "Terbit",
      type: "Pilihan Ganda",
      options: [
        { key: "A", text: "Opsi A" },
        { key: "B", text: "Opsi B" },
      ],
      answer: "A",
    })
    .onConflictDoNothing();
}

/** Hapus soal berdasarkan kode, dipakai untuk mereset state antar test. */
export async function deleteQuestionsByCodes(codes: string[]): Promise<void> {
  if (codes.length === 0) {
    return;
  }
  await db.delete(questions).where(inArray(questions.code, codes));
}

/** Baca berkas fixture Excel dari folder `fixtures`. */
export function readFixture(name: string): Buffer {
  return readFileSync(fileURLToPath(new URL(`../../fixtures/${name}`, import.meta.url)));
}

/** Tutup koneksi database agar proses test bisa berhenti bersih. */
export async function closeDatabase(): Promise<void> {
  await db.$client.end();
}
