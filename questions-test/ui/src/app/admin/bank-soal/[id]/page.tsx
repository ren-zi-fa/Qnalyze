"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import { PageHeader } from "@/components/admin/page-header"
import { QuestionForm } from "@/components/admin/question-form"
import { ApiError, getQuestion } from "@/lib/api"
import type { ApiQuestion } from "@/lib/types/api"
import type { Question } from "@/lib/types/models"

function toQuestion(question: ApiQuestion): Question {
  return {
    ...question,
    id: String(question.id),
    categoryId: String(question.categoryId),
    answer: question.answer ?? "",
    explanation: question.explanation ?? "",
    updatedAt: question.updatedAt ?? "",
  }
}

export default function EditSoalPage() {
  const params = useParams<{ id: string }>()
  const [question, setQuestion] = useState<Question | null>(null)

  useEffect(() => {
    getQuestion(params.id)
      .then((result) => setQuestion(toQuestion(result)))
      .catch((error: unknown) => {
        toast.error(error instanceof ApiError ? error.message : "Gagal memuat soal.")
      })
  }, [params.id])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit Soal"
        description={question ? `Perbarui soal ${question.code}.` : "Memuat data soal..."}
      />
      {question ? <QuestionForm mode="edit" question={question} /> : null}
    </div>
  )
}
