import "@/config/env.js";
import { hash } from "bcrypt";
import { logger } from "@/utils/logger.js";
import { db } from "./index.js";
import { questions, users } from "./schema.js";

async function seed() {
  const passwordHash = await hash("secret123", 10);

  const seededUsers = await db
    .insert(users)
    .values([
      {
        name: "Renzi",
        email: "renzi@example.com",
        password: passwordHash,
      },
      {
        name: "Alucard",
        email: "alucard@example.com",
        password: passwordHash,
      },
    ])
    .onConflictDoNothing()
    .returning();

  logger.info(
    { count: seededUsers.length, emails: seededUsers.map((u) => u.email) },
    "Seeded users",
  );

  const existingQuestions = await db.select().from(questions).limit(1);

  if (existingQuestions.length > 0) {
    logger.info("Questions already seeded, skipping.");
    return;
  }

  const seededQuestions = await db
    .insert(questions)
    .values([
      {
        title: "Apa ibu kota Indonesia?",
        body: "Pilih satu jawaban yang benar.",
      },
      {
        title: "Berapa hasil dari 2 + 2?",
        body: "Jawab dengan angka.",
      },
    ])
    .returning();

  logger.info({ count: seededQuestions.length }, "Seeded questions");
}

async function main() {
  try {
    await seed();
    logger.info("Seeding selesai.");
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Seeding gagal");
  process.exitCode = 1;
});
