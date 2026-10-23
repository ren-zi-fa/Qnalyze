/**
 * Tipe khusus area portal siswa.
 * Type-only file: tidak menghasilkan output JavaScript.
 */

import type { Difficulty, QuestionOption } from "./models"

export type CategoryMeta = {
  badgeLabel: string
  badgeClass: string
  tags: string[]
  avgScore: number
  students: number
  difficulty: string
  level: string
}

export type QuizQuestion = {
  id: string
  number: number
  topic: string
  difficulty: Difficulty
  stimulus?: string
  prompt: string
  options: QuestionOption[]
  answer: string
  guide?: string
  explanation: string
}

export type QuizSession = {
  id: string
  title: string
  packageLabel: string
  categoryId: string
  durationLimitMinutes: number
  questions: QuizQuestion[]
}

export type PortalUser = {
  id: string
  name: string
  email: string
  role: string
  school: string
  grade: string
  nisn: string
  joinedAt: string
  target: string
  streakDays: number
  totalPracticeHours: number
  modulesDone: number
  initials: string
}

export type PortalMetrics = {
  sessionsCompleted: number
  sessionsDelta: string
  sessionsTargetPercent: number
  averageScore: number
  kkm: number
  percentile: number
  accuracy: number
  correct: number
  totalItems: number
}

export type PortalDashboard = {
  targetWeekly: {
    done: number
    total: number
  }
  metrics: PortalMetrics
}
