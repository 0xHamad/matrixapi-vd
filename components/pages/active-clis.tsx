"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { BarChart3, Radio, MessageSquare, Trophy, Sigma, ClipboardList, Check } from "lucide-react"
import { useFeed } from "@/components/feed-provider"
import { PageHeader } from "@/components/page-header"
import { AnimatedNumber, StatCard, PanelBadge, EmptyState } from "@/components/shared"
import { cliStats, withinMs } from "@/lib/stats"
import type { CliStat } from "@/lib/types"
import { copyText } from "@/lib/format"

const TABS = [
  { key: 1, label: "Last 1 Hour" },
  { key: 4, label: "Last 4 Hours" },
  { key: 24, label: "Last 24 Hours" },
] as const

export function ActiveClis() {
  const { feed, rollingStats } = useFeed()
  const [hours, setHours] = useState<number>(1)
  const [copied, setCopied] = useState(false)
  const [, forceTick] = useState(0)

  // Auto-refresh every 3s
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 3000)
    return () => clearInterval(t)
  }, [])

  // Use real rolling stats from API
  const stats = useMemo(() => {
    const raw = hours === 1 ? rollingStats.hourly : hours === 4 ? rollingStats.fourHourly : rollingStats.daily
    return (raw || []).map(r => ({
      cli: r.cli, panel: r.panel as any, country: r.range || "", flag: "🌍",
      count: r.count, payout: 0, lastMessage: r.content, lastAt: Date.now(), hourly: [],
    }))
  }, [rollingStats, hours])
  const totalSms = stats.reduce((s, c) => s + c.count, 0)
  const max = stats[0]?.count ?? 1
  const avg = stats.length ? totalSms / stats.length : 0
  const cliList = stats.map((stat, index) => `${index + 1}. ${stat.cli}`).join("\n")

  async function handleCopyClis() {
    if (!cliList) return
    const didCopy = await copyText(cliList)
    if (didCopy) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="Active CLIs"
        subtitle="Live leaderboard ranked by SMS volume · auto-refreshes every 3s"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full p-1" style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}>
          {TABS.map((t) => {
            const active = hours === t.key
            return (
              <button
                key={t.key}
                onClick={() => setHours(t.key)}
                className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${active ? "text-black" : "text-app-muted hover:text-app-strong"}`}
              >
                {active && (
                  <motion.span
                    layoutId="cli-tab"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--app-accent)", boxShadow: "var(--app-glow)" }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleCopyClis}
          disabled={!stats.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ background: "var(--app-accent)", color: "#07111f", boxShadow: "var(--app-glow)" }}
          aria-label={`Copy active CLI names from the last ${hours} hours`}
        >
          {copied ? <Check className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
          {copied ? `Copied ${stats.length} CLIs` : `Copy ${stats.length} Active CLIs`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active CLIs" icon={<Radio className="h-4 w-4" />}>
          <AnimatedNumber value={stats.length} />
        </StatCard>
        <StatCard label="Total SMS" icon={<MessageSquare className="h-4 w-4" />} accent="accent-2" delay={0.05}>
          <AnimatedNumber value={totalSms} />
        </StatCard>
        <StatCard label="Most Active" icon={<Trophy className="h-4 w-4" />} accent="good" delay={0.1}>
          <span className="truncate text-2xl">{stats[0]?.cli ?? "—"}</span>
        </StatCard>
        <StatCard label="Avg / CLI" icon={<Sigma className="h-4 w-4" />} delay={0.15}>
          <AnimatedNumber value={avg} decimals={1} />
        </StatCard>
      </div>

      {stats.length === 0 ? (
        <EmptyState title="No activity in this window" desc="Try a wider time range — new messages arrive continuously." />
      ) : (
        <div className="space-y-3">
          {stats.map((s, i) => (
            <RankCard key={s.cli} stat={s} rank={i + 1} max={max} total={totalSms} />
          ))}
        </div>
      )}
    </div>
  )
}

const MEDALS = ["🥇", "🥈", "🥉"]

function RankCard({ stat, rank, max, total }: { stat: CliStat; rank: number; max: number; total: number }) {
  const pct = (stat.count / max) * 100
  const share = total ? (stat.count / total) * 100 : 0
  const accent = stat.panel === "lamix" ? "var(--app-lamix)" : "var(--app-purple)"
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: Math.min(rank * 0.03, 0.3) }}
      className="glass-card glass-card-hover flex items-center gap-4 p-4"
    >
      <div className="grid w-10 shrink-0 place-items-center">
        {rank <= 3 ? (
          <span className="text-2xl">{MEDALS[rank - 1]}</span>
        ) : (
          <span className="tabular text-lg font-bold text-app-muted">#{rank}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-app-strong">{stat.cli}</span>
          <PanelBadge panel={stat.panel} />
          <span className="text-sm text-app-muted">{stat.flag} {stat.country}</span>
          <span className="ml-auto tabular text-xs text-app-muted">{share.toFixed(1)}% share</span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--app-card)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="h-full rounded-full"
              style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
            />
          </div>
          <span className="tabular w-12 shrink-0 text-right text-xl font-bold" style={{ color: accent }}>
            {stat.count}
          </span>
        </div>

        <p className="mt-1.5 truncate text-xs italic text-app-muted" title={stat.lastMessage}>
          “{stat.lastMessage}”
        </p>
      </div>
    </motion.div>
  )
}
