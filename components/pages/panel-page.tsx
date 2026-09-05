"use client"

import { useMemo, useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, Cell } from "recharts"
import { Diamond, Flower2, Coins, MessageSquare, Radio, Globe } from "lucide-react"
import { useFeed } from "@/components/feed-provider"
import { PageHeader } from "@/components/page-header"
import { AnimatedNumber, StatCard, PanelBadge, CopyButton, EmptyState, Shimmer } from "@/components/shared"
import { byPanel, cliStats, activeCliCount, totalPayout, topCountry, withinMs } from "@/lib/stats"
import { LAMIX_RANGES, PURPLE_RANGES } from "@/lib/mock-data"
import { relativeTime, euro } from "@/lib/format"
import type { Panel, CliStat, Range } from "@/lib/types"

export function PanelPage({ panel }: { panel: Panel }) {
  const { feed, ready } = useFeed()
  const isLamix = panel === "lamix"
  const accentVar = isLamix ? "var(--app-lamix)" : "var(--app-purple)"

  const [realRanges, setRealRanges] = useState<any[]>([])
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLamix) return
    fetch("/api/lamix/proxy?path=ranges")
      .then(r => r.json())
      .then(d => {
        if (d.error) setApiError(d.error)
        else if (d.ranges) {
          // Format Lamix ranges to match UI
          const formatted = d.ranges.map((r: any) => ({
            name: r.name,
            country: r.name.replace(/Mobile.*|Fixed.*/, "").trim(),
            flag: "🌍",
            numbers: r.numbers || 0,
            rate: Math.max(...r.rates.map((x: any) => parseFloat(x.payoutRate || "0"))),
            active: r.active
          }))
          setRealRanges(formatted)
        }
      })
      .catch(() => setApiError("network_error"))
  }, [isLamix])

  const rows = useMemo(() => byPanel(feed, panel), [feed, panel])
  const today = useMemo(() => withinMs(rows, 24 * 3_600_000), [rows])
  const stats = useMemo(() => cliStats(rows), [rows])
  const tc = useMemo(() => topCountry(rows), [rows])
  
  // Use real ranges for Lamix, keep mock for Purple since Purple has no ranges API
  const displayRanges = isLamix ? realRanges : PURPLE_RANGES

  return (
    <div className="space-y-6">
      <PageHeader
        icon={isLamix ? <Diamond className="h-5 w-5" /> : <Flower2 className="h-5 w-5" />}
        title={isLamix ? "Lamix Panel" : "Purple Panel"}
        subtitle={`Dedicated analytics for the ${isLamix ? "Lamix" : "Purple"} data stream`}
        badge={<PanelBadge panel={panel} />}
      />

      {apiError && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          Lamix API Error: {apiError === 'invalid_token' ? 'Your Lamix Token is invalid or revoked. Please update it in .env.local' : apiError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Messages Today" icon={<MessageSquare className="h-4 w-4" />} accent={isLamix ? "accent" : "accent-2"}>
          <AnimatedNumber value={today.length} />
        </StatCard>
        <StatCard label="Payout Today" icon={<Coins className="h-4 w-4" />} accent="good" delay={0.05}>
          <AnimatedNumber value={totalPayout(today)} decimals={4} prefix="€" />
        </StatCard>
        <StatCard label="Active CLIs" icon={<Radio className="h-4 w-4" />} accent={isLamix ? "accent" : "accent-2"} delay={0.1}>
          <AnimatedNumber value={activeCliCount(rows)} />
        </StatCard>
        <StatCard label="Top Country" icon={<Globe className="h-4 w-4" />} accent={isLamix ? "accent" : "accent-2"} delay={0.15}>
          <span className="flex items-center gap-2 text-2xl">
            <span>{tc?.flag ?? "—"}</span>
            <span className="truncate">{tc?.country ?? "No data"}</span>
          </span>
        </StatCard>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-app-strong">Active CLIs</h2>
        {!ready ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Shimmer key={i} className="h-44 w-full" />
            ))}
          </div>
        ) : stats.length === 0 ? (
          <EmptyState title="No CLIs yet" desc="Messages for this panel will populate CLI analytics here as they arrive." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.slice(0, 9).map((s) => (
              <CliCard key={s.cli} stat={s} accent={accentVar} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-app-strong">Ranges</h2>
        <RangesTable ranges={displayRanges} />
      </div>
    </div>
  )
}

function CliCard({ stat, accent }: { stat: CliStat; accent: string }) {
  const data = stat.hourly.map((v, i) => ({ h: i, v }))
  const max = Math.max(...stat.hourly, 1)
  return (
    <div className="glass-card glass-card-hover flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-app-strong">{stat.cli}</h3>
            <CopyButton text={stat.cli} label="Copy CLI" />
          </div>
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-app-muted">
            {stat.flag} {stat.country}
          </span>
        </div>
        <div className="text-right">
          <div className="tabular text-2xl font-bold" style={{ color: accent }}>
            {stat.count}
          </div>
          <div className="text-[11px] text-app-muted">messages</div>
        </div>
      </div>

      <div className="h-14">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={2}>
            <Bar dataKey="v" radius={[2, 2, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={accent} fillOpacity={0.35 + (d.v / max) * 0.65} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="line-clamp-2 text-xs text-app-muted" title={stat.lastMessage}>
        {stat.lastMessage}
      </p>

      <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-3">
        <span className="text-xs text-app-muted">Last {relativeTime(stat.lastAt)}</span>
        <span
          className="tabular rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{ color: "var(--app-good)", background: "color-mix(in srgb, var(--app-good) 14%, transparent)" }}
        >
          {euro(stat.payout)}
        </span>
      </div>
    </div>
  )
}

function RangesTable({ ranges }: { ranges: Range[] }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="custom-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead style={{ background: "var(--app-bg-2)" }}>
            <tr className="text-left text-[11px] uppercase tracking-wider text-app-muted">
              <th className="px-4 py-3 font-medium">Range Name</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium text-right">Numbers</th>
              <th className="px-4 py-3 font-medium text-right">Rate</th>
              <th className="px-4 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {ranges.map((r) => (
              <tr key={r.name} className="border-t border-[var(--app-border)] hover:bg-[var(--app-card)]">
                <td className="px-4 py-3 font-semibold text-app-strong">{r.name}</td>
                <td className="px-4 py-3 text-app-muted">
                  <span className="mr-1.5">{r.flag}</span>
                  {r.country}
                </td>
                <td className="tabular px-4 py-3 text-right text-app-muted">{r.numbers.toLocaleString()}</td>
                <td className="tabular px-4 py-3 text-right text-app-muted">{euro(r.rate)}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={
                      r.active
                        ? { color: "var(--app-good)", background: "color-mix(in srgb, var(--app-good) 14%, transparent)" }
                        : { color: "var(--app-muted)", background: "var(--app-card)" }
                    }
                  >
                    {r.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
