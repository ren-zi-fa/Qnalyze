"use client"

import { CheckCircle2, Lightbulb, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { QuizQuestion } from "@/lib/types/portal"
import { cn } from "cn"

function OptionRow({
  optionKey,
  text,
  mode,
  selected,
  correct,
}: {
  optionKey: string
  text: string
  mode: "answering" | "review"
  selected: boolean
  correct: boolean
}) {
  const state = mode === "review" && correct
    ? "correct"
    : !selected
    ? "idle"
    : mode === "answering"
      ? "selected"
      : "wrong"

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
        state === "idle" && "border-border bg-background",
        state === "selected" && "border-primary bg-primary/5",
        state === "correct" &&
          "border-emerald-500/50 bg-emerald-500/10",
        state === "wrong" && "border-rose-500/50 bg-rose-500/10"
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          state === "idle" &&
            "border-border text-muted-foreground",
          state === "selected" &&
            "border-primary bg-primary text-primary-foreground",
          state === "correct" &&
            "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500",
          state === "wrong" &&
            "border-rose-600 bg-rose-600 text-white dark:border-rose-500 dark:bg-rose-500"
        )}
      >
        {optionKey}
      </span>
      <span className="flex-1 leading-relaxed text-foreground">{text}</span>
      {mode === "review" && state === "correct" ? (
        <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : null}
      {mode === "review" && state === "wrong" ? (
        <XCircle className="mt-0.5 size-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
      ) : null}
    </div>
  )
}

export function QuestionCard({
  question,
  mode,
  value,
  onSelect,
}: {
  question: QuizQuestion
  mode: "answering" | "review"
  value?: string
  onSelect?: (key: string) => void
}) {
  const interactive = mode === "answering"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[11px] font-semibold">
          Soal Nomor {String(question.number).padStart(2, "0")}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Topik: <span className="font-medium text-foreground">{question.topic}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          • Tingkat Kesulitan:{" "}
          <span className="font-medium text-foreground">{question.difficulty}</span>
        </span>
      </div>

      {question.stimulus ? (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
          {question.stimulus}
        </div>
      ) : null}

      <p className="text-sm leading-relaxed font-medium text-foreground">
        {question.prompt}
      </p>

      {question.guide ? (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="font-semibold text-foreground">Panduan Analisis: </span>
            {question.guide}
          </span>
        </div>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="sr-only">Pilihan jawaban</legend>
        {question.options.length === 0 && interactive ? (
          <Input
            value={value ?? ""}
            onChange={(event) => onSelect?.(event.target.value)}
            placeholder="Ketik jawabanmu..."
            aria-label="Jawaban singkat"
          />
        ) : null}
        {question.options.length === 0 && !interactive ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p>Jawabanmu: <span className="font-medium text-foreground">{value || "Belum dijawab"}</span></p>
            <p>Kunci jawaban: <span className="font-medium text-foreground">{question.answer}</span></p>
          </div>
        ) : null}
        {question.options.map((option) => {
          const selected = value === option.key
          const correct = question.answer === option.key
          if (interactive) {
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelect?.(option.key)}
                aria-pressed={selected}
                className="block w-full text-left"
              >
                <OptionRow
                  optionKey={option.key}
                  text={option.text}
                  mode="answering"
                  selected={selected}
                  correct={correct}
                />
              </button>
            )
          }
          return (
            <OptionRow
              key={option.key}
              optionKey={option.key}
              text={option.text}
              mode="review"
              selected={selected}
              correct={correct}
            />
          )
        })}
      </fieldset>

      {mode === "review" ? (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <span>
            <span className="font-semibold text-foreground">
              Pembahasan &amp; Kunci:{" "}
            </span>
            {question.explanation}
          </span>
        </div>
      ) : null}
    </div>
  )
}
