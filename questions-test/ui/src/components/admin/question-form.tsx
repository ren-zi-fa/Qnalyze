"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlert, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  type Difficulty,
  type Question,
  type QuestionOption,
  type QuestionStatus,
  type QuestionType,
} from "@/lib/types/models"
import { ApiError, createQuestion, getCategories, updateQuestion } from "@/lib/api"
import type { ApiCategory } from "@/lib/types/api"

const questionTypes: QuestionType[] = [
  "Pilihan Ganda",
  "Benar/Salah",
  "Isian Singkat",
]

const difficulties: Difficulty[] = ["Mudah", "Sedang", "Sulit"]

const optionKeys = ["A", "B", "C", "D", "E", "F"]

const typeItems = questionTypes.map((item) => ({ value: item, label: item }))
const difficultyItems = difficulties.map((item) => ({
  value: item,
  label: item,
}))
const statusItems = [
  { value: "Draf", label: "Draf" },
  { value: "Terbit", label: "Terbit" },
]

const defaultsByType = (
  type: QuestionType
): { options: QuestionOption[]; answer: string } => {
  if (type === "Benar/Salah") {
    return {
      options: [
        { key: "B", text: "Benar" },
        { key: "S", text: "Salah" },
      ],
      answer: "B",
    }
  }
  if (type === "Isian Singkat") {
    return { options: [], answer: "" }
  }
  return {
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ],
    answer: "A",
  }
}

export function QuestionForm({
  mode = "create",
  question,
}: {
  mode?: "create" | "edit"
  question?: Question
}) {
  const router = useRouter()
  const initialType = question?.type ?? "Pilihan Ganda"

  const [type, setType] = useState<QuestionType>(initialType)
  const [code, setCode] = useState(question?.code ?? "")
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [text, setText] = useState(question?.text ?? "")
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options.length
      ? question.options
      : defaultsByType(initialType).options
  )
  const [answer, setAnswer] = useState(
    question?.answer ?? defaultsByType(initialType).answer
  )
  const [explanation, setExplanation] = useState(question?.explanation ?? "")
  const [categoryId, setCategoryId] = useState<string | null>(
    question?.categoryId ?? null
  )
  const [difficulty, setDifficulty] = useState<Difficulty>(
    question?.difficulty ?? "Sedang"
  )
  const [status, setStatus] = useState<QuestionStatus>(
    question?.status ?? "Draf"
  )

  useEffect(() => {
    getCategories().then(setCategories).catch((error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : "Gagal memuat kategori.")
    })
  }, [])

  const handleTypeChange = (next: QuestionType) => {
    setType(next)
    const preset = defaultsByType(next)
    setOptions(preset.options)
    setAnswer(preset.answer)
  }

  const updateOption = (key: string, value: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.key === key ? { ...opt, text: value } : opt))
    )
  }

  const addOption = () => {
    const nextKey = optionKeys[options.length] ?? `O${options.length + 1}`
    setOptions((prev) => [...prev, { key: nextKey, text: "" }])
  }

  const removeOption = (key: string) => {
    setOptions((prev) => prev.filter((opt) => opt.key !== key))
    if (answer === key) setAnswer("")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!text.trim() || !categoryId) {
      toast.error("Lengkapi pertanyaan dan kategori terlebih dahulu.")
      return
    }
    if (!code.trim() || (type !== "Isian Singkat" && options.some((option) => !option.text.trim()))) {
      toast.error("Lengkapi kode dan semua opsi jawaban.")
      return
    }
    setSaving(true)
    try {
      const input = {
        code: code.trim(),
        text: text.trim(),
        categoryId: Number(categoryId),
        type,
        difficulty,
        status,
        options,
        answer: answer.trim(),
        explanation: explanation.trim() || null,
      }
      if (mode === "edit" && question) await updateQuestion(question.id, input)
      else await createQuestion(input)
      toast.success(mode === "create" ? "Soal berhasil disimpan." : "Soal berhasil diperbarui.")
      router.push("/admin/bank-soal")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan soal.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 lg:grid-cols-3 lg:items-start"
    >
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Detail Soal</CardTitle>
            <CardDescription>
              Tulis pertanyaan dan tentukan tipe soal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="question-code">Kode Soal</Label>
              <Input
                id="question-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Contoh: LOG-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-text">Pertanyaan</Label>
              <Textarea
                id="question-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tuliskan pertanyaan di sini…"
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipe Soal</Label>
              <Select
                items={typeItems}
                value={type}
                onValueChange={(value) => handleTypeChange(value as QuestionType)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Jawaban</Label>
                  <p className="text-xs text-muted-foreground">
                    {type === "Pilihan Ganda"
                      ? "Tandai satu opsi sebagai jawaban benar."
                      : type === "Benar/Salah"
                        ? "Pilih jawaban yang benar."
                        : "Masukkan kunci jawaban."}
                  </p>
                </div>
                {type === "Pilihan Ganda" && options.length < 6 ? (
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus />
                    Opsi
                  </Button>
                ) : null}
              </div>

              {type === "Isian Singkat" ? (
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Contoh: 17 Agustus 1945"
                />
              ) : (
                <RadioGroup
                  value={answer}
                  onValueChange={(value) => setAnswer(value as string)}
                  className="gap-2.5"
                >
                  {options.map((opt) => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={opt.key}
                        id={`option-${opt.key}`}
                        aria-label={`Jawaban ${opt.key}`}
                      />
                      <Label
                        htmlFor={`option-${opt.key}`}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-input text-xs font-semibold uppercase"
                      >
                        {opt.key}
                      </Label>
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOption(opt.key, e.target.value)}
                        placeholder={
                          type === "Benar/Salah"
                            ? opt.text
                            : `Teks pilihan ${opt.key}`
                        }
                        disabled={type === "Benar/Salah"}
                      />
                      {type === "Pilihan Ganda" && options.length > 2 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeOption(opt.key)}
                          aria-label={`Hapus opsi ${opt.key}`}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="explanation">Pembahasan</Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Jelaskan alasan jawaban benar (opsional)…"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan</CardTitle>
            <CardDescription>
              Atur kategori, tingkat kesulitan, dan status soal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                items={categories.map((category) => ({ value: String(category.id), label: category.name }))}
                value={categoryId}
                onValueChange={(value) => setCategoryId(value as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tingkat Kesulitan</Label>
              <Select
                items={difficultyItems}
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as Difficulty)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                items={statusItems}
                value={status}
                onValueChange={(value) => setStatus(value as QuestionStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draf">Draf</SelectItem>
                  <SelectItem value="Terbit">Terbit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Soal berstatus draf tidak akan muncul pada asesmen siswa sampai
                diterbitkan.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={saving}>
            <Save />
            {saving ? "Menyimpan..." : mode === "create" ? "Simpan Soal" : "Simpan Perubahan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/bank-soal" />}
          >
            Batal
          </Button>
        </div>
      </div>
    </form>
  )
}
