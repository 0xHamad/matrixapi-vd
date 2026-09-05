"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { animate, motion } from "framer-motion"
import { Check, Copy, Inbox } from "lucide-react"
import type { Panel } from "@/lib/types"
import { copyText } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value])

  return (
    <span className="tabular">
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

export function PanelBadge({ panel, className }: { panel: Panel; className?: string }) {
  const lamix = panel === "lamix"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        className,
      )}
      style={{
        color: lamix ? "var(--app-lamix)" : "var(--app-purple)",
        background: lamix ? "rgba(var(--app-accent-rgb),0.12)" : "rgba(var(--app-accent-2-rgb),0.12)",
        border: `1px solid ${lamix ? "rgba(var(--app-accent-rgb),0.3)" : "rgba(var(--app-accent-2-rgb),0.3)"}`,
      }}
    >
      <span>{lamix ? "💠" : "🪻"}</span>
      {lamix ? "Lamix" : "Purple"}
    </span>
  )
}

export function StatCard({
  label,
  icon,
  children,
  accent = "accent",
  delay = 0,
}: {
  label: string
  icon: ReactNode
  children: ReactNode
  accent?: "accent" | "accent-2" | "good"
  delay?: number
}) {
  const color =
    accent === "accent" ? "var(--app-accent)" : accent === "accent-2" ? "var(--app-accent-2)" : "var(--app-good)"
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card glass-card-hover p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-app-muted">{label}</span>
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold text-app-strong">{children}</div>
    </motion.div>
  )
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      aria-label={label ?? "Copy"}
      onClick={async (e) => {
        e.stopPropagation()
        if (await copyText(text)) {
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        }
      }}
      className="inline-grid h-6 w-6 place-items-center rounded-md text-app-muted transition-colors hover:text-app-strong"
      style={{ background: "var(--app-card)" }}
    >
      {ok ? <Check className="h-3.5 w-3.5 text-[var(--app-good)]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-app-strong">{children}</h2>
      {sub && <p className="mt-0.5 text-sm text-app-muted">{sub}</p>}
    </div>
  )
}

export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div
        className="grid h-16 w-16 place-items-center rounded-2xl"
        style={{ color: "var(--app-accent)", background: "rgba(var(--app-accent-rgb),0.1)" }}
      >
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-app-strong">{title}</h3>
      <p className="max-w-sm text-sm text-app-muted">{desc}</p>
      {action}
    </div>
  )
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />
}

export function Flag({ flag, country }: { flag: string; country: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-base leading-none">{flag}</span>
      <span className="text-sm text-app-muted">{country}</span>
    </span>
  )
}
