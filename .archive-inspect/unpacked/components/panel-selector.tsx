"use client"

import { motion } from "framer-motion"
import type { Panel } from "@/lib/types"
import { cn } from "@/lib/utils"

export type PanelFilter = "all" | Panel

const OPTIONS: { key: PanelFilter; label: string }[] = [
  { key: "all", label: "All Panels" },
  { key: "lamix", label: "💠 Lamix" },
  { key: "purple", label: "🪻 Purple" },
]

export function PanelSelector({
  value,
  onChange,
}: {
  value: PanelFilter
  onChange: (v: PanelFilter) => void
}) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
    >
      {OPTIONS.map((o) => {
        const active = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              active ? "text-black" : "text-app-muted hover:text-app-strong",
            )}
          >
            {active && (
              <motion.span
                layoutId="panel-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--app-accent)", boxShadow: "var(--app-glow)" }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
