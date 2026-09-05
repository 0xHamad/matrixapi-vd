"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

const AUTH_KEY = "sms_auth_v1"
const USERNAME = "Matrix_Leader"
const PASSWORD = "ShakeelBKL"

interface AuthCtx {
  ready: boolean
  authed: boolean
  login: (u: string, p: string) => boolean
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAuthed(localStorage.getItem(AUTH_KEY) === "granted")
    setReady(true)
  }, [])

  const login = (u: string, p: string) => {
    if (u === USERNAME && p === PASSWORD) {
      localStorage.setItem(AUTH_KEY, "granted")
      setAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    setAuthed(false)
  }

  return <Ctx.Provider value={{ ready, authed, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
