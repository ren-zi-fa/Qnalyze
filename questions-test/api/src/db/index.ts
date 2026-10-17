import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { relations } from "./schema.js";

export const db: NodePgDatabase<typeof relations> & { $client: Pool } = drizzle(
  process.env.DATABASE_URL as string,
  { relations },
);
