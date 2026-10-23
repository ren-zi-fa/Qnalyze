"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
  Timer,
} from "lucide-react"
import { toast } from "sonner"

import { QuestionCard } from "@/components/portal/quiz/question-card"
import { QuestionNavigator } from "@/components/portal/quiz/question-navigator"
import { SubmitDialog } from "@/components/portal/quiz/submit-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ApiError, getAttempt, saveAttemptAnswers, submitAttempt } from "@/lib/api"
import type { Attempt } from "@/lib/types/api"
import type { QuizQuestion } from "@/lib/types/portal"

type SaveState = "idle" | "saving" | "saved" | "error"

/** Ubah state jawaban (nomor soal → jawaban) menjadi payload API. */
function toAnswerPayload(attempt: Attempt, answers: Record<number, string>) {
  return Object.entries(answers)
    .map(([number, answer]) => ({
      questionId: attempt.questions[Number(number) - 1]?.id ?? 0,
      answer,
    }))
    .filter(({ questionId }) => questionId > 0)
}

/** Pulihkan jawaban tersimpan dari API ke state berdasarkan nomor soal. */
function toSavedAnswers(attempt: Attempt): Record<number, string> {
  const restored: Record<number, string> = {}
  for (const question of attempt.questions) {
    const saved = attempt.answers?.[String(question.id)]
    if (saved !== undefined) restored[question.number] = saved
  }
  return restored
}

function formatTime(totalSeconds: number) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`
}

function toQuizQuestion(question: Attempt["questions"][number]): QuizQuestion {
  return {
    id: String(question.id),
    number: question.number,
    topic: question.topic,
    difficulty: question.difficulty,
    prompt: question.prompt,
    options: question.options,
    answer: question.answer ?? "",
    explanation: question.explanation ?? "",
  }
}

export default function KerjakanPage() {
  const router = useRouter()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const lastSavedSignature = useRef<string | null>(null)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  const finishAttempt = useCallback(async () => {
    if (!attempt || attempt.status === "Selesai" || submitting) return
    setSubmitting(true)
    try {
      const result = await submitAttempt(
        attempt.id,
        Object.entries(answers).map(([number, answer]) => ({
          questionId: attempt.questions[Number(number) - 1]?.id ?? 0,
          answer,
        })).filter(({ questionId }) => questionId > 0),
      )
      setAttempt(result)
      toast.success("Latihan selesai. Periksa hasil dan pembahasan di bawah.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gagal mengumpulkan jawaban.")
    } finally {
      setSubmitting(false)
    }
  }, [attempt, answers, submitting])

  useEffect(() => {
    const attemptId = new URLSearchParams(window.location.search).get("attempt")
    if (!attemptId || !/^\d+$/.test(attemptId)) {
      toast.error("Sesi latihan tidak ditemukan. Pilih kategori latihan terlebih dahulu.")
      router.replace("/latihan")
      return
    }
    getAttempt(Number(attemptId))
      .then((value) => {
        const restored = toSavedAnswers(value)
        setAttempt(value)
        setAnswers(restored)
        lastSavedSignature.current = JSON.stringify(toAnswerPayload(value, restored))
        setSecondsLeft(value.durationLimitMinutes * 60)
      })
      .catch((error: unknown) => {
        toast.error(error instanceof ApiError ? error.message : "Gagal memuat sesi latihan.")
        router.replace("/latihan")
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (!attempt || attempt.status === "Selesai") return
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => Math.max(remaining - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [attempt])

  useEffect(() => {
    if (secondsLeft === 0 && attempt?.status === "Berlangsung") void finishAttempt()
  }, [secondsLeft, attempt?.status, finishAttempt])

  // Autosave: kirim jawaban setelah pengguna berhenti menjawab sebentar.
  useEffect(() => {
    if (!attempt || attempt.status === "Selesai" || submitting) return

    const payload = toAnswerPayload(attempt, answers)
    const signature = JSON.stringify(payload)
    if (signature === lastSavedSignature.current) return

    const timer = window.setTimeout(() => {
      setSaveState("saving")

      // Antrian membuat request autosave berurutan agar jawaban lama tidak
      // menimpa jawaban yang lebih baru.
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveAttemptAnswers(attempt.id, payload))
        .then(() => {
          lastSavedSignature.current = signature
          setSaveState("saved")
        })
        .catch((error: unknown) => {
          setSaveState("error")
          toast.error(
            error instanceof ApiError ? error.message : "Gagal menyimpan jawaban sementara.",
          )
        })
    }, 700)

    return () => window.clearTimeout(timer)
  }, [answers, attempt, submitting])

  const questions = useMemo(() => attempt?.questions.map(toQuizQuestion) ?? [], [attempt])
  if (loading || !attempt || questions.length === 0) {
    return <div className="mx-auto max-w-3xl p-8 text-center text-sm text-muted-foreground">{loading ? "Memuat soal..." : "Sesi latihan tidak memiliki soal."}</div>
  }

  const total = questions.length
  const question = questions[current]
  const answered = new Set(Object.keys(answers).map(Number))
  const completeness = Math.round((answered.size / total) * 100)
  const isReview = attempt.status === "Selesai"
  const toggleFlag = () => setFlagged((previous) => {
    const next = new Set(previous)
    next.has(question.number) ? next.delete(question.number) : next.add(question.number)
    return next
  })

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="size-4" /></span>
            <span className="font-heading text-sm font-semibold text-foreground">QuizHub</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {!isReview ? <Badge variant="secondary" className="gap-1 tabular-nums"><Timer className="size-3.5" />{formatTime(secondsLeft)}</Badge> : null}
            <span className="hidden text-sm text-muted-foreground sm:inline">Soal {current + 1} dari {total}</span>
            <Button nativeButton={false} render={<Link href="/latihan" />} variant="ghost" size="sm"><LogOut data-icon="inline-start" />Keluar</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card><CardContent className="space-y-4">
            <div className="space-y-3">
              <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">{isReview ? "Hasil Latihan" : "Latihan Mandiri"}</Badge>
              <div className="space-y-1">
                <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">{attempt.title}</h1>
                {isReview ? <p className="text-sm font-medium text-primary">Skor {attempt.score ?? 0} · {attempt.correct ?? 0} dari {attempt.total} benar</p> : <p className="text-sm text-muted-foreground">Terjawab {answered.size} dari {total} soal</p>}
              </div>
              {!isReview ? <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${completeness}%` }} /></div> : null}
            </div>
            <div className="border-t border-border pt-4"><QuestionCard question={question} mode={isReview ? "review" : "answering"} value={answers[question.number]} onSelect={(value) => setAnswers((previous) => ({ ...previous, [question.number]: value }))} /></div>
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={() => setCurrent((index) => Math.max(0, index - 1))} disabled={current === 0}><ChevronLeft data-icon="inline-start" />Sebelumnya</Button>
              {!isReview ? <Button variant="outline" onClick={toggleFlag}>{flagged.has(question.number) ? <BookmarkCheck data-icon="inline-start" /> : <Bookmark data-icon="inline-start" />}{flagged.has(question.number) ? "Ditandai Ragu" : "Tandai Ragu-ragu"}</Button> : null}
              <Button onClick={() => setCurrent((index) => Math.min(total - 1, index + 1))} disabled={current === total - 1}>Selanjutnya<ChevronRight data-icon="inline-end" /></Button>
            </div>
          </CardContent></Card>
          {isReview ? <Card><CardContent className="flex items-center gap-3"><CheckCircle2 className="size-5 text-emerald-600" /><p className="text-sm text-muted-foreground">Jawaban dan pembahasan ditampilkan setelah latihan selesai.</p></CardContent></Card> : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card><CardContent className="space-y-4"><p className="text-sm font-semibold text-foreground">Navigasi Nomor Soal</p><QuestionNavigator total={total} current={current} answered={answered} flagged={flagged} onSelect={setCurrent} /></CardContent></Card>
          {!isReview ? <SubmitDialog total={total} answered={answered.size} flagged={flagged.size} onConfirm={() => void finishAttempt()} /> : null}
          {submitting ? <p className="text-center text-sm text-muted-foreground">Mengumpulkan jawaban...</p> : null}
          {!isReview && !submitting ? (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <span
                className={
                  saveState === "error"
                    ? "size-1.5 rounded-full bg-rose-500"
                    : saveState === "saving"
                      ? "size-1.5 animate-pulse rounded-full bg-amber-500"
                      : "size-1.5 rounded-full bg-emerald-500"
                }
              />
              {saveState === "saving"
                ? "Menyimpan jawaban..."
                : saveState === "error"
                  ? "Gagal menyimpan jawaban sementara"
                  : saveState === "saved"
                    ? "Jawaban tersimpan otomatis"
                    : "Jawaban disimpan otomatis"}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
