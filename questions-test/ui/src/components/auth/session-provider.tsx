"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"

import { getCurrentUser, logout as logoutRequest } from "@/lib/api"
import type { User } from "@/lib/types/api"

type SessionStatus = "loading" | "authenticated" | "unauthenticated"

type SessionContextValue = {
  user: User | null
  status: SessionStatus
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<SessionStatus>("loading")

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentUser()
      setUser(current)
      setStatus("authenticated")
    } catch {
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((current) => {
        if (!active) return
        setUser(current)
        setStatus("authenticated")
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        setStatus("unauthenticated")
      })

    return () => {
      active = false
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Tetap bersihkan sesi lokal walau permintaan gagal.
    } finally {
      setUser(null)
      setStatus("unauthenticated")
      router.push("/login")
      router.refresh()
    }
  }, [router])

  const value = useMemo(
    () => ({ user, status, refresh, signOut }),
    [user, status, refresh, signOut]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error("useSession harus dipakai di dalam SessionProvider")
  }

  return context
}
