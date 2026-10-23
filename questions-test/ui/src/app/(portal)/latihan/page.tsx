"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Search } from "lucide-react"
import { toast } from "sonner"

import { PortalBreadcrumbs } from "@/components/portal/breadcrumbs"
import { CategoryCard } from "@/components/portal/category-card"
import { Input } from "@/components/ui/input"
import { ApiError, getCategories, startAttempt } from "@/lib/api"
import type { ApiCategory } from "@/lib/types/api"

export default function KatalogPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [startingCategory, setStartingCategory] = useState<number | null>(null)

  useEffect(() => {
    getCategories(true)
      .then(setCategories)
      .catch((error: unknown) => toast.error(error instanceof ApiError ? error.message : "Gagal memuat kategori."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID")
    return categories.filter((category) =>
      `${category.name} ${category.description ?? ""}`.toLocaleLowerCase("id-ID").includes(term)
    )
  }, [categories, query])

  const beginAttempt = async (categoryId: number) => {
    setStartingCategory(categoryId)
    try {
      const attempt = await startAttempt(categoryId)
      router.push(`/kerjakan?attempt=${attempt.id}`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gagal memulai latihan.")
    } finally {
      setStartingCategory(null)
    }
  }

  const totalQuestions = categories.reduce((sum, category) => sum + category.questionCount, 0)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <PortalBreadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Latihan Soal" }]} />
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium tracking-wide text-primary uppercase">
            <BookOpen className="size-3.5" /> Katalog Soal Terbit
          </span>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Latihan Soal</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pilih kategori untuk memulai latihan. Soal diambil dari bank soal yang sudah diterbitkan admin.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-md">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/5">
          <p className="text-xs font-medium text-muted-foreground">Total Soal Terbit</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
            {totalQuestions.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/5">
          <p className="text-xs font-medium text-muted-foreground">Kategori Tersedia</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">{categories.length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kategori..." className="pl-8" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onStart={(categoryId) => void beginAttempt(categoryId)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {loading ? "Memuat kategori..." : "Belum ada soal terbit di kategori yang cocok."}
        </div>
      )}
      {startingCategory !== null ? <p className="text-sm text-muted-foreground">Menyiapkan latihan...</p> : null}
    </div>
  )
}
