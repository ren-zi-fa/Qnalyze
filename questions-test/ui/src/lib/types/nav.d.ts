/**
 * Tipe navigasi aplikasi.
 * Type-only file: tidak menghasilkan output JavaScript.
 */

import type { LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** Cocokkan juga untuk sub-route (mis. /admin/bank-soal/baru) */
  match?: string
}
