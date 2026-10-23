"use client"

import { useMemo, useState } from "react"
import {
  ClipboardList,
  Clock,
  Eye,
  Gauge,
  Search,
  Target,
} from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
import {
  categories,
  categoryName,
  submissions,
} from "@/lib/mock-data"
import type { Submission, SubmissionStatus } from "@/lib/types/models"
import { cn } from "cn"

const statusStyles: Record<SubmissionStatus, string> = {
  Selesai: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Berlangsung: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Belum Mulai": "bg-muted text-muted-foreground",
}

const categoryFilterItems = [
  { value: "all", label: "Semua Kategori" },
  ...categories.map((c) => ({ value: c.id, label: c.name })),
]

const statusFilterItems = [
  { value: "all", label: "Semua Status" },
  { value: "Selesai", label: "Selesai" },
  { value: "Berlangsung", label: "Berlangsung" },
  { value: "Belum Mulai", label: "Belum Mulai" },
]

const scoreStyle = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-rose-600 dark:text-rose-400"
}

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

export default function HasilPengerjaanPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [detail, setDetail] = useState<Submission | null>(null)

  const filtered = useMemo(
    () =>
      submissions.filter((s) => {
        const matchesQuery =
          query.trim() === "" ||
          s.studentName.toLowerCase().includes(query.toLowerCase()) ||
          s.exam.toLowerCase().includes(query.toLowerCase())
        const matchesCategory =
          category === "all" || s.categoryId === category
        const matchesStatus = status === "all" || s.status === status
        return matchesQuery && matchesCategory && matchesStatus
      }),
    [query, category, status]
  )

  const avg =
    Math.round(
      submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length
    ) || 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hasil Pengerjaan"
        description="Pantau nilai dan status pengerjaan siswa pada setiap asesmen."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Pengerjaan"
          value="2.480"
          delta="+3,2% dari bulan lalu"
          icon={ClipboardList}
        />
        <StatCard
          label="Nilai Rata-rata"
          value={String(avg)}
          delta="+2 poin"
          icon={Gauge}
          tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Tingkat Ketuntasan"
          value="87%"
          delta="+1,4%"
          icon={Target}
          tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          label="Rata-rata Durasi"
          value="64 mnt"
          delta="-5 menit"
          trend="down"
          icon={Clock}
          tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama siswa atau asesmen…"
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
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
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                items={statusFilterItems}
                value={status}
                onValueChange={(v) => setStatus(v as string)}
              >
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Berlangsung">Berlangsung</SelectItem>
                  <SelectItem value="Belum Mulai">Belum Mulai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Siswa</TableHead>
                  <TableHead>Asesmen</TableHead>
                  <TableHead className="w-40">Nilai</TableHead>
                  <TableHead>Benar</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Waktu Kirim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/10 text-[0.65rem] font-semibold text-primary">
                            {initials(s.studentName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            {s.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <p className="text-sm text-foreground">{s.exam}</p>
                      <Badge variant="secondary" className="mt-1">
                        {categoryName(s.categoryId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-9 text-sm font-semibold tabular-nums",
                            scoreStyle(s.score)
                          )}
                        >
                          {s.score}
                        </span>
                        <Progress value={s.score} className="w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {s.correct}/{s.total}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.durationMinutes > 0 ? `${s.durationMinutes} mnt` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {s.submittedAt}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent",
                          statusStyles[s.status]
                        )}
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Lihat detail"
                        onClick={() => setDetail(s)}
                      >
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Tidak ada data pengerjaan yang cocok.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pengerjaan</DialogTitle>
            <DialogDescription>{detail?.exam}</DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {initials(detail.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {detail.studentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detail.id} · {categoryName(detail.categoryId)}
                  </p>
                </div>
                <span
                  className={cn(
                    "ml-auto font-heading text-2xl font-semibold tabular-nums",
                    scoreStyle(detail.score)
                  )}
                >
                  {detail.score}
                </span>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {detail.correct}
                  </p>
                  <p className="text-xs text-muted-foreground">Benar</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-lg font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                    {detail.total - detail.correct}
                  </p>
                  <p className="text-xs text-muted-foreground">Salah</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {detail.total}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Soal</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Durasi</span>
                  <span className="font-medium text-foreground">
                    {detail.durationMinutes > 0
                      ? `${detail.durationMinutes} menit`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Waktu Kirim</span>
                  <span className="font-medium text-foreground">
                    {detail.submittedAt}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={cn("border-transparent", statusStyles[detail.status])}
                  >
                    {detail.status}
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
