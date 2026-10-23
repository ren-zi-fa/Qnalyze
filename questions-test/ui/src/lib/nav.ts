import {
  BookOpen,
  ClipboardList,
  Dumbbell,
  FileUp,
  Home,
  LayoutDashboard,
  Tags,
  Users,
} from "lucide-react"

import type { NavItem } from "./types/nav"

export const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    match: "/admin",
  },
  {
    label: "Bank Soal",
    href: "/admin/bank-soal",
    icon: BookOpen,
    match: "/admin/bank-soal",
  },
  {
    label: "Kategori",
    href: "/admin/kategori",
    icon: Tags,
  },
  {
    label: "Import Excel",
    href: "/admin/import-excel",
    icon: FileUp,
  },
  {
    label: "Hasil Pengerjaan",
    href: "/admin/hasil-pengerjaan",
    icon: ClipboardList,
  },
  {
    label: "Pengguna",
    href: "/admin/pengguna",
    icon: Users,
  },
]

export const isNavActive = (pathname: string, item: NavItem) => {
  const target = item.match ?? item.href
  if (target === "/admin") return pathname === "/admin"
  return pathname === target || pathname.startsWith(`${target}/`)
}

export const portalNav: NavItem[] = [
  { label: "Beranda", href: "/", icon: Home },
  { label: "Latihan Soal", href: "/latihan", icon: Dumbbell },
]

export const isPortalNavActive = (pathname: string, item: NavItem) => {
  if (item.href === "/") return pathname === "/"
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
