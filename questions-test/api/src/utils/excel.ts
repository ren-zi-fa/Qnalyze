import * as XLSX from "xlsx";
import {
  DEFAULT_BENAR_SALAH_OPTIONS,
  DEFAULT_DIFFICULTY,
  DEFAULT_STATUS,
  DIFFICULTIES,
  FIELD_LABELS,
  HEADER_ALIASES,
  OPTION_KEYS,
  QUESTION_TYPES,
  REQUIRED_FIELDS,
  STATUSES,
} from "../constants/question.js";
import type {
  CanonicalField,
  ExcelImportError,
  ParsedEntry,
  ParsedWorkbook,
  QuestionType,
} from "../types/question.js";

/** Error yang berasal dari bentuk berkas, bukan dari satu baris. */
export class ExcelParseError extends Error {}

/** Label kolom untuk pesan kesalahan; opsi memakai format "opsi X". */
function fieldLabel(field: CanonicalField): string {
  if (field.startsWith("option:")) {
    return `opsi ${field.slice("option:".length)}`;
  }
  return FIELD_LABELS[field] ?? field;
}

/** Normalisasi header kolom: huruf kecil, simbol jadi spasi, spasi rapi. */
function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ubah isi sel apa pun menjadi string yang rapi. */
function toCellText(value: unknown): string {
  return String(value ?? "").trim();
}

/** Cocokkan teks ke daftar pilihan tanpa memedulikan besar/kecil huruf. */
function matchChoice<T extends string>(choices: readonly T[], value: string): T | undefined {
  return choices.find((choice) => choice.toLowerCase() === value.toLowerCase());
}

function mapColumns(headerRow: unknown[]): Map<CanonicalField, number> {
  const columns = new Map<CanonicalField, number>();
  headerRow.forEach((value, index) => {
    const field = HEADER_ALIASES[normalizeHeader(value)];
    if (field !== undefined && !columns.has(field)) {
      columns.set(field, index);
    }
  });
  return columns;
}

/**
 * Parsing berkas Excel menjadi daftar soal JSON.
 *
 * Kolom template: kode, pertanyaan, kategori, tipe, tingkat kesulitan,
 * status, opsi A–F, jawaban, pembahasan. Baris yang seluruhnya kosong
 * dilewati; baris dengan isi yang tidak valid dilaporkan di `errors`.
 *
 * @throws ExcelParseError bila berkas tidak bisa dibaca atau kolom wajib tidak ada.
 */
export function parseQuestionsWorkbook(buffer: Buffer): ParsedWorkbook {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new ExcelParseError("Isi berkas bukan berkas Excel yang valid");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName !== undefined ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) {
    throw new ExcelParseError("Berkas Excel tidak memiliki sheet");
  }

  // `header: 1` mengembalikan array per baris; blankrows diminta supaya
  // nomor baris Excel tetap sesuai untuk laporan error, baris kosong
  // dilewati manual di loop.
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: true,
    raw: true,
    defval: "",
  });
  if (rows.length < 2) {
    throw new ExcelParseError("Berkas tidak berisi data soal");
  }

  const columns = mapColumns(rows[0] as unknown[]);
  const mappedFields = [...columns.keys()];
  const missing = REQUIRED_FIELDS.filter((field) => !mappedFields.includes(field));
  if (missing.length > 0) {
    throw new ExcelParseError(`Kolom wajib tidak ditemukan: ${missing.map(fieldLabel).join(", ")}`);
  }

  const entries: ParsedEntry[] = [];
  const errors: ExcelImportError[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const excelRow = i + 1;

    const cell = (field: CanonicalField): string => {
      const index = columns.get(field);
      return index === undefined ? "" : toCellText(row[index]);
    };
    const options = OPTION_KEYS.map((key) => ({ key, text: cell(`option:${key}`) })).filter(
      (option) => option.text !== "",
    );

    // Baris yang seluruh kolomnya kosong bukan data, bukan error.
    if (mappedFields.every((field) => cell(field) === "") && options.length === 0) {
      continue;
    }

    const rowErrors: string[] = [];

    const code = cell("code");
    if (code === "") rowErrors.push("Kolom kode kosong");

    const text = cell("text");
    if (text === "") rowErrors.push("Kolom pertanyaan kosong");

    const category = cell("category");
    if (category === "") rowErrors.push("Kolom kategori kosong");

    const typeValue = cell("type");
    const type =
      typeValue === "" ? matchChoice(QUESTION_TYPES, "") : matchChoice(QUESTION_TYPES, typeValue);
    if (typeValue === "") {
      rowErrors.push("Kolom tipe kosong");
    } else if (!type) {
      rowErrors.push(
        `Tipe soal "${typeValue}" tidak valid (gunakan: ${QUESTION_TYPES.join(", ")})`,
      );
    }

    const difficultyValue = cell("difficulty");
    const difficulty = matchChoice(DIFFICULTIES, difficultyValue) ?? DEFAULT_DIFFICULTY;
    if (difficultyValue !== "" && !matchChoice(DIFFICULTIES, difficultyValue)) {
      rowErrors.push(
        `Tingkat kesulitan "${difficultyValue}" tidak valid (gunakan: ${DIFFICULTIES.join(", ")})`,
      );
    }

    const statusValue = cell("status");
    const status = matchChoice(STATUSES, statusValue) ?? DEFAULT_STATUS;
    if (statusValue !== "" && !matchChoice(STATUSES, statusValue)) {
      rowErrors.push(`Status "${statusValue}" tidak valid (gunakan: ${STATUSES.join(", ")})`);
    }

    const answerRaw = cell("answer");

    let answer = "";
    if (answerRaw === "") {
      rowErrors.push("Kolom jawaban kosong");
    } else if (type === "Benar/Salah") {
      const lower = answerRaw.toLowerCase();
      if (lower === "b" || lower === "benar") {
        answer = "B";
      } else if (lower === "s" || lower === "salah") {
        answer = "S";
      } else {
        rowErrors.push(`Jawaban "${answerRaw}" tidak valid untuk Benar/Salah (gunakan B atau S)`);
      }
    } else if (type === "Isian Singkat") {
      answer = answerRaw;
    } else if (type !== undefined) {
      answer = answerRaw.toUpperCase();
      if (options.length < 2) {
        rowErrors.push(`Minimal 2 opsi jawaban untuk tipe ${type}`);
      }
      const validKeys = options.map((option) => option.key);
      if (!(validKeys as string[]).includes(answer)) {
        rowErrors.push(
          `Jawaban "${answerRaw}" tidak cocok dengan opsi yang tersedia (${validKeys.join(", ")})`,
        );
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: excelRow, message: rowErrors.join("; ") });
      continue;
    }

    entries.push({
      row: excelRow,
      question: {
        code,
        text,
        category,
        type: type as QuestionType,
        difficulty,
        status,
        options: type === "Benar/Salah" ? DEFAULT_BENAR_SALAH_OPTIONS : options,
        answer,
        explanation: cell("explanation") || null,
      },
    });
  }

  return { data: entries, errors };
}
