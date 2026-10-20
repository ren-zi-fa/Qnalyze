import "../config/env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "../utils/logger.js";
import { db } from "./index.js";
import { seed } from "./seed.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(dirname, "../../drizzle");

/** Ringkas target koneksi tanpa membocorkan kredensial. */
function describeTarget(): string {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    return `${url.hostname}:${url.port || "5432"}${url.pathname}`;
  } catch {
    return "(DATABASE_URL tidak valid)";
  }
}

/**
 * Kembalikan database ke kondisi awal: buang seluruh schema, jalankan ulang
 * migrasi, lalu isi data seed. Schema `drizzle` ikut dihapus agar jurnal
 * migrasi tidak menganggap migrasi sudah pernah dijalankan.
 */
export async function reset(): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.CONFIRM_DB_RESET !== "1") {
    throw new Error(
      "Reset database ditolak pada NODE_ENV=production. Set CONFIRM_DB_RESET=1 bila memang disengaja.",
    );
  }

  const target = describeTarget();
  logger.warn({ target }, "Membuang seluruh schema database...");

  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

  logger.info("Menjalankan migrasi...");
  await migrate(db, { migrationsFolder });

  logger.info("Menjalankan seeding...");
  await seed();

  logger.info({ target }, "Reset database selesai.");
}

async function main() {
  try {
    await reset();
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Reset database gagal");
  process.exitCode = 1;
});
