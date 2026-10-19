import { defineRelations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import type {
  ParsedOption,
  QuestionDifficulty,
  QuestionStatus,
  QuestionType,
} from "../types/question.js";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<"admin" | "user">().notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  tone: text("tone")
    .$type<"indigo" | "emerald" | "amber" | "rose" | "sky" | "violet">()
    .notNull()
    .default("indigo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    text: text("text").notNull(),
    type: text("type").$type<QuestionType>().notNull(),
    difficulty: text("difficulty").$type<QuestionDifficulty>().notNull().default("Sedang"),
    status: text("status").$type<QuestionStatus>().notNull().default("Draf"),
    options: jsonb("options").$type<ParsedOption[]>().notNull().default([]),
    answer: text("answer").notNull(),
    explanation: text("explanation"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("questions_category_id_idx").on(table.categoryId),
    index("questions_status_idx").on(table.status),
  ],
);

/** Baris soal seperti yang dikembalikan database. */
export type Question = typeof questions.$inferSelect;

/** Bentuk data untuk menyisipkan soal baru. */
export type NewQuestion = typeof questions.$inferInsert;

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  packageLabel: text("package_label"),
  durationLimitMinutes: integer("duration_limit_minutes").notNull().default(20),
  status: text("status").$type<"Berlangsung" | "Selesai">().notNull().default("Berlangsung"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  score: integer("score"),
  correct: integer("correct"),
  total: integer("total").notNull().default(0),
  durationMinutes: real("duration_minutes"),
  questionIds: jsonb("question_ids").$type<number[]>().notNull().default([]),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const relations = defineRelations(
  { users, sessions, categories, questions, attempts },
  (r) => ({
    users: {
      sessions: r.many.sessions(),
    },
    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
      }),
    },
    categories: {
      questions: r.many.questions(),
    },
    questions: {
      category: r.one.categories({
        from: r.questions.categoryId,
        to: r.categories.id,
      }),
    },
    attempts: {
      user: r.one.users({
        from: r.attempts.userId,
        to: r.users.id,
      }),
      category: r.one.categories({
        from: r.attempts.categoryId,
        to: r.categories.id,
      }),
    },
  }),
);
