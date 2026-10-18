import "../config/env.js";
import { hash } from "bcrypt";
import { logger } from "../utils/logger.js";
import { db } from "./index.js";
import { categories, questions, users } from "./schema.js";

async function seed() {
  const passwordHash = await hash("secret123", 10);

  const seededUsers = await db
    .insert(users)
    .values([
      {
        name: "Renzi",
        email: "renzi@example.com",
        password: passwordHash,
        role: "admin",
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

  await db
    .insert(categories)
    .values([
      {
        name: "Penalaran Verbal",
        description: "Sinonim, antonim, analogi, dan pemahaman bacaan.",
        tone: "indigo",
      },
      {
        name: "Penalaran Numerik",
        description: "Deret angka, hitungan, dan penalaran kuantitatif.",
        tone: "emerald",
      },
      {
        name: "Penalaran Logis",
        description: "Premis, kesimpulan, dan silogisme.",
        tone: "amber",
      },
      {
        name: "Penalaran Figural",
        description: "Pola gambar dan kelanjutan bentuk visual.",
        tone: "violet",
      },
    ])
    .onConflictDoNothing();

  const storedCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories);
  const categoryId = (name: string): number => {
    const id = storedCategories.find((category) => category.name === name)?.id;
    if (id === undefined) {
      throw new Error(`Kategori "${name}" belum terseed`);
    }
    return id;
  };

  const existingQuestions = await db.select().from(questions).limit(1);

  if (existingQuestions.length > 0) {
    logger.info("Questions already seeded, skipping.");
    return;
  }

  const seededQuestions = await db
    .insert(questions)
    .values([
      {
        code: "Q-LG-001",
        text: "Sinonim dari kata EVOKASI adalah ...",
        categoryId: categoryId("Penalaran Verbal"),
        type: "Pilihan Ganda",
        difficulty: "Mudah",
        status: "Terbit",
        options: [
          { key: "A", text: "Terjadap" },
          { key: "B", text: "Terbuka" },
          { key: "C", text: "Tersirat" },
          { key: "D", text: "Terpisah" },
        ],
        answer: "A",
        explanation: "Evokasi berarti membangkitkan atau menghadapkan.",
      },
      {
        code: "Q-NM-001",
        text: "Lanjutkan deret: 3, 6, 11, 18, 27, ...",
        categoryId: categoryId("Penalaran Numerik"),
        type: "Isian Singkat",
        difficulty: "Sedang",
        status: "Draf",
        options: [],
        answer: "38",
        explanation: "Selisih deret bertambah dua: 3, 5, 7, 9, 11.",
      },
      {
        code: "Q-BG-001",
        text: "Air mendidih pada suhu 100 derajat Celsius.",
        categoryId: categoryId("Penalaran Logis"),
        type: "Benar/Salah",
        difficulty: "Sulit",
        status: "Draf",
        options: [
          { key: "B", text: "Benar" },
          { key: "S", text: "Salah" },
        ],
        answer: "B",
        explanation: "Titik didih air 100°C pada tekanan 1 atm.",
      },
    ])
    .onConflictDoNothing()
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
