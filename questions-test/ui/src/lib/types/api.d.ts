/**
 * Kontrak API (request & response).
 * Type-only file: tidak menghasilkan output JavaScript.
 */

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export type User = {
  id: number
  name: string | null
  email: string
  createdAt: string
}

export type AuthResponse = {
  user: User
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  name?: string
  email: string
  password: string
}

/* ------------------------------------------------------------------ */
/* Kategori                                                            */
/* ------------------------------------------------------------------ */

export type CategoryTone =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"

export type ApiCategory = {
  id: number
  name: string
  description: string | null
  tone: CategoryTone
  questionCount: number
  createdAt: string
}

export type CategoryInput = {
  name: string
  description?: string | null
  tone?: ApiCategory["tone"]
}

export type CategoriesResponse = {
  data: ApiCategory[]
}

/* ------------------------------------------------------------------ */
/* Soal                                                                */
/* ------------------------------------------------------------------ */

export type QuestionType = "Pilihan Ganda" | "Benar/Salah" | "Isian Singkat"
export type QuestionDifficulty = "Mudah" | "Sedang" | "Sulit"
export type QuestionStatus = "Terbit" | "Draf"

export type ApiQuestion = {
  id: number
  code: string
  categoryId: number
  text: string
  type: QuestionType
  difficulty: QuestionDifficulty
  status: QuestionStatus
  options: { key: string; text: string }[]
  answer?: string
  explanation?: string | null
  updatedAt?: string
}

export type QuestionInput = Omit<ApiQuestion, "id" | "updatedAt">

export type PublicQuestion = Omit<ApiQuestion, "answer" | "explanation">

export type QuestionsQuery = {
  page?: number
  limit?: number
  status?: string
}

export type QuestionsResponse = {
  data: ApiQuestion[]
  total: number
}

export type PublicQuestionsResponse = {
  data: PublicQuestion[]
}

/* ------------------------------------------------------------------ */
/* Pengerjaan (attempt)                                                */
/* ------------------------------------------------------------------ */

export type AttemptQuestion = {
  id: number
  number: number
  topic: string
  difficulty: QuestionDifficulty
  prompt: string
  options: { key: string; text: string }[]
  answer?: string
  explanation?: string | null
}

export type Attempt = {
  id: number
  categoryId: number
  title: string
  packageLabel: string | null
  durationLimitMinutes: number
  status: "Berlangsung" | "Selesai"
  score: number | null
  correct: number | null
  total: number
  /** Jawaban tersimpan sementara: questionId (string) → jawaban. */
  answers: Record<string, string>
  questions: AttemptQuestion[]
}

export type AttemptAnswerInput = {
  questionId: number
  answer: string
}

export type SubmitAttemptInput = {
  answers: AttemptAnswerInput[]
}

/* ------------------------------------------------------------------ */
/* Import Excel                                                        */
/* ------------------------------------------------------------------ */

export type ExcelImportError = {
  row: number
  message: string
}

export type ExcelImportResult = {
  imported: number
  failed: number
  errors: ExcelImportError[]
}

export type ExcelImportPreviewRow = {
  row: number
  question: {
    code: string
    text: string
    category: string
    type: string
  } | null
  errors: string[]
}

export type ExcelImportPreview = {
  valid: number
  failed: number
  rows: ExcelImportPreviewRow[]
}
