"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { ThemeName } from "@/lib/types"

const THEME_KEY = "sms_theme"

interface ThemeCtx {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark")

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_KEY) as ThemeName | null) ?? "dark"
    setThemeState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const setTheme = (t: ThemeName) => {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
