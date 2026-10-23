"use client"

import { useMemo, useState } from "react"
import {
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { users as initialUsers } from "@/lib/mock-data"
import type { User, UserRole, UserStatus } from "@/lib/types/models"
import { cn } from "cn"

const roleStyles: Record<UserRole, string> = {
  Admin: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  Guru: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Siswa: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
}

const roleFilterItems = [
  { value: "all", label: "Semua Peran" },
  { value: "Admin", label: "Admin" },
  { value: "Guru", label: "Guru" },
  { value: "Siswa", label: "Siswa" },
]

const statusFilterItems = [
  { value: "all", label: "Semua Status" },
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
]

const roleFormItems = [
  { value: "Admin", label: "Admin" },
  { value: "Guru", label: "Guru" },
  { value: "Siswa", label: "Siswa" },
]

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [query, setQuery] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [formRole, setFormRole] = useState<UserRole>("Siswa")
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const counts = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((u) => u.role === "Admin").length,
      guru: users.filter((u) => u.role === "Guru").length,
      siswa: users.filter((u) => u.role === "Siswa").length,
    }),
    [users]
  )

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const matchesQuery =
          query.trim() === "" ||
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
        const matchesRole = role === "all" || u.role === role
        const matchesStatus = status === "all" || u.status === status
        return matchesQuery && matchesRole && matchesStatus
      }),
    [users, query, role, status]
  )

  const openCreate = () => {
    setEditing(null)
    setName("")
    setEmail("")
    setFormRole("Siswa")
    setFormOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setName(user.name)
    setEmail(user.email)
    setFormRole(user.role)
    setFormOpen(true)
  }

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi.")
      return
    }
    if (editing) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editing.id ? { ...u, name, email, role: formRole } : u
        )
      )
      toast.success("Data pengguna diperbarui.")
    } else {
      setUsers((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          name,
          email,
          role: formRole,
          status: "Aktif",
          joinedAt: "Hari ini",
          lastActive: "Baru saja",
        },
      ])
      toast.success("Pengguna baru ditambahkan.")
    }
    setFormOpen(false)
  }

  const toggleStatus = (user: User) => {
    const next: UserStatus = user.status === "Aktif" ? "Nonaktif" : "Aktif"
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: next } : u))
    )
    toast.success(`${user.name} kini ${next.toLowerCase()}.`)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
    toast.success(`Pengguna "${deleteTarget.name}" dihapus.`)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola akun admin, guru, dan siswa yang memiliki akses."
      >
        <Button onClick={openCreate}>
          <Plus />
          Tambah Pengguna
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pengguna" value={String(counts.total)} icon={UserRound} />
        <StatCard
          label="Admin"
          value={String(counts.admin)}
          icon={ShieldCheck}
          tint="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label="Guru"
          value={String(counts.guru)}
          icon={GraduationCap}
          tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          label="Siswa"
          value={String(counts.siswa)}
          icon={UserRound}
          tint="bg-violet-500/10 text-violet-600 dark:text-violet-400"
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
                placeholder="Cari nama atau email pengguna…"
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select
                items={roleFilterItems}
                value={role}
                onValueChange={(v) => setRole(v as string)}
              >
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue placeholder="Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Peran</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Guru">Guru</SelectItem>
                  <SelectItem value="Siswa">Siswa</SelectItem>
                </SelectContent>
              </Select>
              <Select
                items={statusFilterItems}
                value={status}
                onValueChange={(v) => setStatus(v as string)}
              >
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Aktif</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-muted text-[0.65rem] font-semibold text-muted-foreground">
                            {initials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border-transparent", roleStyles[user.role])}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            user.status === "Aktif"
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/40"
                          )}
                        />
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastActive}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.joinedAt}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Aksi ${user.name}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(user)}>
                            <UserRound />
                            {user.status === "Aktif"
                              ? "Nonaktifkan"
                              : "Aktifkan"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
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
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Tidak ada pengguna yang cocok.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi akun pengguna."
                : "Buat akun baru untuk admin, guru, atau siswa."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nama Lengkap</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad Fauzi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@qnalyze.id"
              />
            </div>
            <div className="space-y-2">
              <Label>Peran</Label>
              <Select
                items={roleFormItems}
                value={formRole}
                onValueChange={(value) => setFormRole(value as UserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Guru">Guru</SelectItem>
                  <SelectItem value="Siswa">Siswa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
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
            <AlertDialogTitle>Hapus pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun &quot;{deleteTarget?.name}&quot; akan dihapus permanen dan
              tidak dapat mengakses sistem lagi.
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
  )
}
