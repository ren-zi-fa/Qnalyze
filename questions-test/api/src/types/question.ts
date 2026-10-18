/** Jenis soal yang didukung bank soal. */
export type QuestionType = "Pilihan Ganda" | "Benar/Salah" | "Isian Singkat";

/** Tingkat kesulitan soal. */
export type QuestionDifficulty = "Mudah" | "Sedang" | "Sulit";

/** Status publikasi soal. */
export type QuestionStatus = "Terbit" | "Draf";

/** Satu opsi jawaban pada soal pilihan ganda. */
export type ParsedOption = { key: string; text: string };

export type ParsedQuestion = {
  code: string;
  text: string;
  category: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  options: ParsedOption[];
  answer: string;
  explanation: string | null;
};

/** Baris Excel yang gagal diformat, beserta alasannya. */
export type ExcelImportError = { row: number; message: string };

/** Soal valid hasil parsing, lengkap dengan nomor baris Excel-nya. */
export type ParsedEntry = { row: number; question: ParsedQuestion };

export type ParsedWorkbook = {
  data: ParsedEntry[];
  errors: ExcelImportError[];
};

/** Kunci opsi jawaban yang dikenali pada kolom Excel. */
export type OptionKey = "A" | "B" | "C" | "D" | "E" | "F";

/** Field kanonikal hasil pemetaan header kolom Excel. */
export type CanonicalField =
  | "code"
  | "text"
  | "category"
  | "type"
  | "difficulty"
  | "status"
  | `option:${OptionKey}`
  | "answer"
  | "explanation";

/** Kolom yang wajib ada pada berkas Excel. */
export type RequiredField = Extract<
  CanonicalField,
  "code" | "text" | "category" | "type" | "answer"
>;
