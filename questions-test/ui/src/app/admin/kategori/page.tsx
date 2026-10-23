"use client";

import { useEffect, useState } from "react";
import { FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api";
import type { ApiCategory } from "@/lib/types/api";
import { toneClasses } from "@/lib/mock-data";
import { cn } from "cn";

export default function KategoriPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshCategories = async () => {
    try {
      setCategories(await getCategories());
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal memuat kategori.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setFormOpen(true);
  };

  const openEdit = (category: ApiCategory) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
      };
      if (editing) {
        await updateCategory(editing.id, input);
        toast.success("Kategori berhasil diperbarui.");
      } else {
        await createCategory(input);
        toast.success("Kategori baru berhasil ditambahkan.");
      }
      await refreshCategories();
      setFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menyimpan kategori.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      toast.success(`Kategori "${deleteTarget.name}" dihapus.`);
      setDeleteTarget(null);
      await refreshCategories();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menghapus kategori.",
      );
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kategori Soal"
        description="Kelompokkan bank soal berdasarkan mata pelajaran atau topik."
      >
        <Button onClick={openCreate}>
          <Plus />
          Tambah Kategori
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const tone = toneClasses[category.tone];
          return (
            <Card key={category.id} size="sm">
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      tone.bg,
                      tone.text,
                    )}
                  >
                    <FolderOpen className="size-5" />
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Aksi ${category.name}`}
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(category)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(category)}
                      >
                        <Trash2 />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge variant="secondary">
                    {category.questionCount} soal
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Dibuat{" "}
                    {new Date(category.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {categories.length === 0 && !loading ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada kategori.
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat kategori...</p>
      ) : null}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi kategori soal."
                : "Buat kategori baru untuk mengelompokkan soal."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nama Kategori</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Matematika"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Deskripsi</Label>
              <Textarea
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat kategori…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori &quot;{deleteTarget?.name}&quot; akan dihapus. Kategori
              yang masih memiliki soal tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
