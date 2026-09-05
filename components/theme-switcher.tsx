"use client"

import { Moon, Sun, Zap } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import type { ThemeName } from "@/lib/types"
import { cn } from "@/lib/utils"

const OPTIONS: { key: ThemeName; icon: typeof Moon; label: string }[] = [
  { key: "dark", icon: Moon, label: "Deep Space" },
  { key: "light", icon: Sun, label: "Professional" },
  { key: "fun", icon: Zap, label: "Cyberpunk" },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
    >
      {OPTIONS.map(({ key, icon: Icon, label }) => {
        const active = theme === key
        return (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={`${label} theme`}
            aria-pressed={active}
            onClick={() => setTheme(key)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition-all",
              active ? "text-black" : "text-app-muted hover:text-app-strong",
            )}
            style={active ? { background: "var(--app-accent)", boxShadow: "var(--app-glow)" } : undefined}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
