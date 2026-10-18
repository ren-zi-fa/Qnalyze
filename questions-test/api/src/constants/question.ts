/**
 * Konstanta fitur soal (question): daftar pilihan valid, nilai bawaan, dan
 * pemetaan header kolom Excel.
 */

import type {
  CanonicalField,
  OptionKey,
  ParsedOption,
  QuestionDifficulty,
  QuestionStatus,
  RequiredField,
} from "../types/question.js";

/** Kunci opsi jawaban valid, berurutan sesuai kolom template. */
export const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const satisfies readonly OptionKey[];

/** Tipe soal yang dikenali saat impor. */
export const QUESTION_TYPES = ["Pilihan Ganda", "Benar/Salah", "Isian Singkat"] as const;

/** Tingkat kesulitan yang dikenali saat impor. */
export const DIFFICULTIES = ["Mudah", "Sedang", "Sulit"] as const;

/** Status yang dikenali saat impor. */
export const STATUSES = ["Terbit", "Draf"] as const;

/** Opsi bawaan untuk soal bertipe Benar/Salah. */
export const DEFAULT_BENAR_SALAH_OPTIONS: ParsedOption[] = [
  { key: "B", text: "Benar" },
  { key: "S", text: "Salah" },
];

export const DEFAULT_DIFFICULTY: QuestionDifficulty = "Sedang";
export const DEFAULT_STATUS: QuestionStatus = "Draf";

/** Field kanonikal yang wajib ada pada header Excel. */
export const REQUIRED_FIELDS: readonly RequiredField[] = [
  "code",
  "text",
  "category",
  "type",
  "answer",
];

/** Label Indonesia untuk tiap field kanonikal (dipakai pada pesan kesalahan). */
export const FIELD_LABELS: Record<string, string> = {
  code: "kode",
  text: "pertanyaan",
  category: "kategori",
  type: "tipe",
  difficulty: "tingkat kesulitan",
  status: "status",
  answer: "jawaban",
  explanation: "pembahasan",
};

/** Alias header kolom Excel (baik Inggris maupun Indonesia) → field kanonikal. */
export const HEADER_ALIASES: Record<string, CanonicalField> = {
  kode: "code",
  code: "code",
  pertanyaan: "text",
  soal: "text",
  question: "text",
  text: "text",
  kategori: "category",
  category: "category",
  tipe: "type",
  type: "type",
  tingkat: "difficulty",
  "tingkat kesulitan": "difficulty",
  kesulitan: "difficulty",
  difficulty: "difficulty",
  status: "status",
  jawaban: "answer",
  "kunci jawaban": "answer",
  kunci: "answer",
  answer: "answer",
  pembahasan: "explanation",
  explanation: "explanation",
};

for (const key of OPTION_KEYS) {
  const lower = key.toLowerCase();
  HEADER_ALIASES[`opsi ${lower}`] = `option:${key}`;
  HEADER_ALIASES[`option ${lower}`] = `option:${key}`;
  HEADER_ALIASES[`pilihan ${lower}`] = `option:${key}`;
  HEADER_ALIASES[lower] = `option:${key}`;
}
