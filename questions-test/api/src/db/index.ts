import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { relations } from "./schema.js";

export const db: NodePgDatabase<typeof relations> & { $client: Pool } = drizzle(
  process.env.DATABASE_URL as string,
  { relations },
);

/**
 * Koneksi utama atau transaksi yang sedang berjalan.
 *
 * Repository menerima ini agar bisa dipakai baik di luar maupun di dalam
 * transaksi tanpa perlu tahu asalnya.
 */
export type Executor = typeof db | Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];
