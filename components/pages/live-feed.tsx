"use client"

import { useMemo, useState } from "react"
import { Activity, Diamond, Flower2, Radio } from "lucide-react"
import { useFeed } from "@/components/feed-provider"
import { PanelSelector, type PanelFilter } from "@/components/panel-selector"
import { AnimatedNumber, PanelBadge, StatCard, Shimmer, CopyButton } from "@/components/shared"
import { byPanel, activeCliCount } from "@/lib/stats"
import { relativeTime, fullTime, maskNumber, euro } from "@/lib/format"
import { PageHeader } from "@/components/page-header"

export function LiveFeed() {
  const { feed, ready } = useFeed()
  const [panel, setPanel] = useState<PanelFilter>("all")

  const lamixCount = useMemo(() => feed.filter((s) => s.panel === "lamix").length, [feed])
  const purpleCount = feed.length - lamixCount
  const active = useMemo(() => activeCliCount(feed), [feed])
  const rows = useMemo(() => byPanel(feed, panel), [feed, panel])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Radio className="h-5 w-5" />}
        title="Live Feed"
        subtitle="Combined real-time SMS stream from Lamix and Purple panels"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total SMS" icon={<Activity className="h-4 w-4" />} delay={0}>
          <AnimatedNumber value={feed.length} />
        </StatCard>
        <StatCard label="Lamix SMS" icon={<Diamond className="h-4 w-4" />} accent="accent" delay={0.05}>
          <AnimatedNumber value={lamixCount} />
        </StatCard>
        <StatCard label="Purple SMS" icon={<Flower2 className="h-4 w-4" />} accent="accent-2" delay={0.1}>
          <AnimatedNumber value={purpleCount} />
        </StatCard>
        <StatCard label="Active CLIs" icon={<Radio className="h-4 w-4" />} accent="good" delay={0.15}>
          <AnimatedNumber value={active} />
        </StatCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PanelSelector value={panel} onChange={setPanel} />
        <span className="tabular text-sm text-app-muted">{rows.length} messages · updates live</span>
      </div>

      {!ready ? (
        <div className="glass-card space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : (
        <FeedTable rows={rows} />
      )}
    </div>
  )
}

function FeedTable({ rows }: { rows: ReturnType<typeof byPanel> }) {
  const now = Date.now()
  const visible = rows.slice(0, 120)
  return (
    <div className="glass-card overflow-hidden">
      <div className="custom-scroll max-h-[62vh] overflow-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead className="sticky top-0 z-10" style={{ background: "var(--app-bg-2)" }}>
            <tr className="text-left text-[11px] uppercase tracking-wider text-app-muted">
              <Th>Time</Th>
              <Th>Panel</Th>
              <Th>Country</Th>
              <Th>Number</Th>
              <Th>CLI</Th>
              <Th>Message</Th>
              <Th className="text-right">Payout</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const fresh = now - s.receivedAt < 2500
              return (
                <tr
                  key={s.id}
                  className={`group border-t border-[var(--app-border)] transition-colors hover:bg-[var(--app-card)] ${fresh ? "flash-row" : ""}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-app-muted" title={fullTime(s.receivedAt)}>
                    {relativeTime(s.receivedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <PanelBadge panel={s.panel} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="mr-1.5">{s.flag}</span>
                    <span className="text-app-muted">{s.country}</span>
                  </td>
                  <td className="tabular whitespace-nowrap px-4 py-3 text-app-muted">{maskNumber(s.number)}</td>
                  <td
                    className="whitespace-nowrap px-4 py-3 font-semibold"
                    style={{ color: s.panel === "lamix" ? "var(--app-lamix)" : "var(--app-purple)" }}
                  >
                    {s.cli}
                  </td>
                  <td className="max-w-[260px] px-4 py-3 relative group/copy">
                    <div className="flex items-center justify-between gap-2">
                      <span className="block truncate text-app-muted" title={s.content}>
                        {s.content}
                      </span>
                      <div className="opacity-0 group-hover/copy:opacity-100 transition-opacity flex-shrink-0">
                        <CopyButton text={s.content} label="Copy SMS" />
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span
                      className="tabular rounded-md px-2 py-0.5 text-xs font-semibold"
                      style={{ color: "var(--app-good)", background: "color-mix(in srgb, var(--app-good) 14%, transparent)" }}
                    >
                      {euro(s.payout)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}
