import "../config/env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "../utils/logger.js";
import { db } from "./index.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(dirname, "../../drizzle");

async function main() {
  try {
    await migrate(db, { migrationsFolder });
    logger.info("Migration selesai.");
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Migration gagal");
  process.exitCode = 1;
});
