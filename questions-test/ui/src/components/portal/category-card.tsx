import Link from "next/link"
import { BookOpenText, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ApiCategory } from "@/lib/types/api"

export function CategoryCard({
  category,
  onStart,
}: {
  category: ApiCategory | { id: string; name: string; description: string; questionCount: number }
  onStart?: (categoryId: number) => void
}) {
  return (
    <Card className="group h-full transition-shadow hover:shadow-md">
      <CardContent className="flex h-full flex-col">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary transition-transform group-hover:scale-105">
          <BookOpenText className="size-5" />
        </span>
        <h3 className="mt-3 font-heading text-base font-semibold tracking-tight text-foreground">
          {category.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {category.description || "Kumpulan latihan soal untuk kategori ini."}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {category.questionCount} soal terbit
        </p>
        <div className="mt-auto pt-4">
          {onStart ? (
            <Button className="w-full" onClick={() => onStart(Number(category.id))}>
              Mulai Latihan <PlayCircle data-icon="inline-end" />
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link href="/latihan" />} className="w-full">
              Pilih Kategori <PlayCircle data-icon="inline-end" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
