"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { CategoryCard } from "@/components/portal/category-card";
import { ApiError, getCategories } from "@/lib/api";
import type { ApiCategory } from "@/lib/types/api";

export function FeaturedCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories(true)
      .then(setCategories)
      .catch((error: unknown) =>
        toast.error(
          error instanceof ApiError ? error.message : "Gagal memuat kategori.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Pilih Kategori Latihan
          </h2>
          <p className="text-sm text-muted-foreground">
            Kategori publik berisi soal yang sudah diterbitkan.
          </p>
        </div>
        <Link
          href="/latihan"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Lihat Semua Kategori <ArrowRight className="size-4" />
        </Link>
      </div>
      {categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {loading ? "Memuat kategori..." : "Belum ada soal terbit."}
        </p>
      )}
    </section>
  );
}
