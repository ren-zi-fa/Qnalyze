/**
 * Tipe domain aplikasi (bentuk data yang dipakai di UI).
 * Type-only file: tidak menghasilkan output JavaScript.
 */

export type Tone = "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet"

export type Category = {
  id: string
  name: string
  description: string
  questionCount: number
  tone: Tone
  createdAt: string
}

export type QuestionType = "Pilihan Ganda" | "Benar/Salah" | "Isian Singkat"
export type Difficulty = "Mudah" | "Sedang" | "Sulit"
export type QuestionStatus = "Terbit" | "Draf"

export type QuestionOption = {
  key: string
  text: string
}

export type Question = {
  id: string
  code: string
  text: string
  categoryId: string
  type: QuestionType
  difficulty: Difficulty
  status: QuestionStatus
  options: QuestionOption[]
  answer: string
  explanation: string
  updatedAt: string
}

export type UserRole = "Admin" | "Guru" | "Siswa"
export type UserStatus = "Aktif" | "Nonaktif"

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  joinedAt: string
  lastActive: string
}

export type SubmissionStatus = "Selesai" | "Berlangsung" | "Belum Mulai"

export type Submission = {
  id: string
  studentName: string
  exam: string
  categoryId: string
  score: number
  correct: number
  total: number
  durationMinutes: number
  submittedAt: string
  status: SubmissionStatus
}

export type DashboardStat = {
  key: string
  label: string
  value: string
  delta: string
  trend: "up" | "down"
}

export type ScoreBucket = {
  label: string
  value: number
}

export type WeeklyActivityPoint = {
  day: string
  value: number
}

export type RecentActivityItem = {
  id: string
  actor: string
  action: string
  target: string
  time: string
  tone: Tone
}

export type TopCategory = {
  categoryId: string
  attempts: number
  average: number
}

export type ToneClass = {
  bg: string
  text: string
  ring: string
}
