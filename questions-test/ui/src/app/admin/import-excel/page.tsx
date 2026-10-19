"use client"

import { useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  LoaderCircle,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  importQuestions,
  previewQuestionsImport,
  type ExcelImportPreview,
  type ExcelImportResult,
} from "@/lib/api"
import { cn } from "cn"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"]
const steps = [
  { id: 1, label: "Unduh Template" },
  { id: 2, label: "Unggah File" },
  { id: 3, label: "Selesai" },
]

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function downloadErrorReport(result: ExcelImportResult) {
  const rows = [
    ["Baris", "Pesan error"].map(csvCell).join(","),
    ...result.errors.map(({ row, message }) => [row, message].map(csvCell).join(",")),
  ]
  const blob = new Blob(["\uFEFF", rows.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "laporan-error-impor-soal.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export default function ImportExcelPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null)
  const [result, setResult] = useState<ExcelImportResult | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const selectFile = async (selectedFile?: File) => {
    if (!selectedFile) return

    const extension = selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error("Pilih file .xlsx, .xls, atau .csv.")
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 5 MB.")
      return
    }

    setFile(selectedFile)
    setPreview(null)
    setResult(null)
    setIsReading(true)
    try {
      setPreview(await previewQuestionsImport(selectedFile))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File tidak dapat dibaca.")
    } finally {
      setIsReading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    try {
      const importResult = await importQuestions(file)
      setResult(importResult)
      toast.success(`${importResult.imported} soal berhasil diimpor.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impor soal gagal.")
    } finally {
      setIsImporting(false)
    }
  }

  const resetImport = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const activeStep = result ? 3 : 2
  const rowErrors = new Map(result?.errors.map((error) => [error.row, error.message]))

  return (
    <div className="space-y-5">
      <PageHeader title="Import Excel" description="Impor soal secara massal dari file spreadsheet.">
        <Button
          nativeButton={false}
          render={<a href="/template-impor-soal.xlsx" download />}
          variant="outline"
        >
          <Download />
          Unduh Template
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <ol className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {steps.map((step, index) => {
              const active = step.id === activeStep
              const done = step.id < activeStep
              return (
                <li key={step.id} className="flex flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <CheckCircle2 className="size-4" /> : step.id}
                  </span>
                  <span className={cn("text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 ? <span className="hidden h-px flex-1 bg-border sm:block" /> : null}
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      {!file ? (
        <Card>
          <CardContent>
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-14 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                void selectFile(event.dataTransfer.files[0])
              }}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Tarik & lepas file Excel di sini</p>
                <p className="text-xs text-muted-foreground">Format .xlsx, .xls, atau .csv, maksimal 5 MB.</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => void selectFile(event.target.files?.[0])}
              />
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <FileUp />
                Pilih File
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              {preview ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 /> {preview.valid} valid
                  </Badge>
                  <Badge variant="outline" className="border-transparent bg-destructive/10 text-destructive">
                    <AlertTriangle /> {preview.failed} perlu diperbaiki
                  </Badge>
                </div>
              ) : null}
              {!result ? (
                <Button variant="ghost" size="sm" onClick={resetImport} disabled={isReading || isImporting}>
                  Ganti file
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {isReading ? (
            <Card>
              <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" /> Membaca isi file...
              </CardContent>
            </Card>
          ) : null}

          {preview ? (
            <Card>
              <CardHeader>
                <CardTitle>{result ? "Hasil Impor" : "Data Soal"}</CardTitle>
                <CardDescription>
                  {result
                    ? `${result.imported} soal berhasil disimpan. ${result.failed} baris gagal.`
                    : "Data dan validasi soal yang terbaca dari file."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16">Baris</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Pertanyaan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.map((row) => {
                        const errors = result
                          ? rowErrors.has(row.row)
                            ? [rowErrors.get(row.row)!]
                            : []
                          : row.errors
                        return (
                          <TableRow key={row.row} className={cn(errors.length > 0 && "bg-destructive/5")}>
                            <TableCell className="tabular-nums text-muted-foreground">{row.row}</TableCell>
                            <TableCell>{row.question?.code ?? "—"}</TableCell>
                            <TableCell className="max-w-md whitespace-normal">
                              <div>{row.question?.text ?? "Data tidak terbaca"}</div>
                              {errors.map((error) => (
                                <p key={error} className="mt-1 text-xs text-destructive">{error}</p>
                              ))}
                            </TableCell>
                            <TableCell>{row.question?.category ?? "—"}</TableCell>
                            <TableCell>{row.question?.type ?? "—"}</TableCell>
                            <TableCell>
                              {errors.length === 0 ? (
                                <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Valid</Badge>
                              ) : (
                                <Badge variant="outline" className="border-transparent bg-destructive/10 text-destructive">Error</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {result?.errors.length ? (
                  <Button variant="outline" onClick={() => downloadErrorReport(result)}>
                    <Download />
                    Unduh Laporan Error
                  </Button>
                ) : null}
                {result ? (
                  <div className="flex justify-end">
                    <Button onClick={resetImport}>
                      <CheckCircle2 />
                      Selesai
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {!result ? (
            <div className="flex justify-end">
              <Button onClick={handleImport} disabled={isReading || isImporting || !preview}>
                {isImporting ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
                {isImporting ? "Mengimpor..." : "Mulai Import"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
