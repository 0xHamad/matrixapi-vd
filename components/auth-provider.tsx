"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface AuthCtx {
  ready: boolean
  authed: boolean
  username: string | null
  login: (u: string, p: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check session on mount
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "me" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthed(true)
          setUsername(data.username)
        } else {
          setAuthed(false)
          setUsername(null)
        }
      })
      .catch(() => setAuthed(false))
      .finally(() => setReady(true))
  }, [])

  const login = async (u: string, p: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username: u, password: p }),
      })
      const data = await res.json()
      if (data.success) {
        setAuthed(true)
        setUsername(data.username)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      })
    } catch (err) {}
    setAuthed(false)
    setUsername(null)
    router.push("/")
  }

  return <Ctx.Provider value={{ ready, authed, username, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
