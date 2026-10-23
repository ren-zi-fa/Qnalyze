"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  Difficulty,
  Question,
  QuestionStatus,
} from "@/lib/types/models"
import { ApiError, deleteQuestion, duplicateQuestion, getCategories, getQuestion, getQuestions, updateQuestion } from "@/lib/api"
import type { ApiCategory, ApiQuestion } from "@/lib/types/api"
import { toast } from "sonner"
import { cn } from "cn"

const difficultyStyles: Record<Difficulty, string> = {
  Mudah: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Sedang: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Sulit: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

const statusStyles: Record<QuestionStatus, string> = {
  Terbit: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Draf: "bg-muted text-muted-foreground",
}

function toAdminQuestion(question: ApiQuestion): Question {
  return {
    ...question,
    id: String(question.id),
    categoryId: String(question.categoryId),
    explanation: question.explanation ?? "",
    answer: question.answer ?? "",
    updatedAt: question.updatedAt
      ? new Date(question.updatedAt).toLocaleDateString("id-ID")
      : "—",
  }
}

const difficultyFilterItems = [
  { value: "all", label: "Semua Tingkat" },
  { value: "Mudah", label: "Mudah" },
  { value: "Sedang", label: "Sedang" },
  { value: "Sulit", label: "Sulit" },
]

const statusFilterItems = [
  { value: "all", label: "Semua Status" },
  { value: "Terbit", label: "Terbit" },
  { value: "Draf", label: "Draf" },
]

export default function BankSoalPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [status, setStatus] = useState("all")
  const [selected, setSelected] = useState<string[]>([])

  const refresh = async () => {
    const [categoryResult, questionResult] = await Promise.allSettled([
      getCategories(),
      getQuestions({ page: 1, limit: 100 }),
    ])

    if (categoryResult.status === "fulfilled") {
      setCategories(categoryResult.value)
    } else {
      toast.error(categoryResult.reason instanceof ApiError ? categoryResult.reason.message : "Gagal memuat kategori.")
    }

    if (questionResult.status === "fulfilled") {
      setQuestions(questionResult.value.data.map(toAdminQuestion))
    } else {
      toast.error(questionResult.reason instanceof ApiError ? questionResult.reason.message : "Gagal memuat bank soal.")
    }

    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchesQuery =
        query.trim() === "" ||
        q.text.toLowerCase().includes(query.toLowerCase()) ||
        q.code.toLowerCase().includes(query.toLowerCase())
      const matchesCategory =
        category === "all" || q.categoryId === category
      const matchesDifficulty =
        difficulty === "all" || q.difficulty === difficulty
      const matchesStatus = status === "all" || q.status === status
      return (
        matchesQuery && matchesCategory && matchesDifficulty && matchesStatus
      )
    })
  }, [questions, query, category, difficulty, status])

  const allSelected =
    filtered.length > 0 && filtered.every((q) => selected.includes(q.id))
  const someSelected = selected.length > 0 && !allSelected

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? filtered.map((q) => q.id) : [])
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    )
  }

  const removeQuestion = async (id: string) => {
    try {
      await deleteQuestion(id)
      toast.success("Soal berhasil dihapus.")
      await refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gagal menghapus soal.")
    }
  }

  const duplicate = async (id: string) => {
    try {
      await duplicateQuestion(id)
      toast.success("Soal berhasil diduplikasi.")
      await refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gagal menduplikasi soal.")
    }
  }

  const deleteSelected = async () => {
    try {
      await Promise.all(selected.map((id) => deleteQuestion(id)))
      setSelected([])
      toast.success("Soal terpilih berhasil dihapus.")
      await refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gagal menghapus soal terpilih.")
    }
  }

  const publishSelected = async () => {
    try {
      const selectedQuestions = await Promise.all(selected.map((id) => getQuestion(id)))
      await Promise.all(selectedQuestions.map((item) => updateQuestion(item.id, { ...item, status: "Terbit" })))
      setSelected([])
      toast.success("Soal terpilih berhasil diterbitkan.")
      await refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gagal menerbitkan soal terpilih.")
    }
  }

  const categoryName = (id: string) => categories.find((item) => String(item.id) === id)?.name ?? "Tanpa Kategori"
  const categoryFilterItems = [
    { value: "all", label: "Semua Kategori" },
    ...categories.map((item) => ({ value: String(item.id), label: item.name })),
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bank Soal"
        description="Kelola seluruh bank soal yang tersedia untuk asesmen."
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/import-excel" />}
        >
          <FileUp />
          Import Excel
        </Button>
        <Button nativeButton={false} render={<Link href="/admin/bank-soal/baru" />}>
          <Plus />
          Tambah Soal
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari berdasarkan teks atau kode soal…"
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-3">
              <Select
                items={categoryFilterItems}
                value={category}
                onValueChange={(v) => setCategory(v as string)}
              >
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={difficultyFilterItems}
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as string)}
              >
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue placeholder="Kesulitan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="Mudah">Mudah</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Sulit">Sulit</SelectItem>
                </SelectContent>
              </Select>

              <Select
                items={statusFilterItems}
                value={status}
                onValueChange={(v) => setStatus(v as string)}
              >
                <SelectTrigger className="w-full lg:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Terbit">Terbit</SelectItem>
                  <SelectItem value="Draf">Draf</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selected.length > 0 ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-accent px-3 py-2 text-sm">
              <span className="text-accent-foreground">
                {selected.length} soal dipilih
              </span>
              <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => void publishSelected()}>
                  Terbitkan
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void deleteSelected()}
                >
                  <Trash2 />
                  Hapus
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Pilih semua"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                    />
                  </TableHead>
                  <TableHead>Soal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kesulitan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diperbarui</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Pilih ${q.code}`}
                        checked={selected.includes(q.id)}
                        onCheckedChange={(checked) =>
                          toggleOne(q.id, checked === true)
                        }
                      />
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {q.code}
                        </span>
                        <span className="line-clamp-2 font-medium text-foreground">
                          {q.text}
                        </span>
                        <Badge variant="secondary" className="w-fit">
                          {categoryName(q.categoryId)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border-transparent", difficultyStyles[q.difficulty])}
                      >
                        {q.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border-transparent", statusStyles[q.status])}
                      >
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.updatedAt}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Aksi soal"
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={
                              <Link href={`/admin/bank-soal/${q.id}`} />
                            }
                          >
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicate(q.id)}>
                            <Copy />
                            Duplikat
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => removeQuestion(q.id)}>
                            <Trash2 />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {loading ? "Memuat bank soal..." : "Tidak ada soal yang cocok dengan filter."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">
                {questions.length}
              </span>{" "}
              soal
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronLeft />
                <span className="sr-only">Sebelumnya</span>
              </Button>
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronRight />
                <span className="sr-only">Berikutnya</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
