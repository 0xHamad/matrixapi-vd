"use client"

import { useMemo, useState } from "react"
import { Activity, Diamond, Flower2, Radio, Copy, Check } from "lucide-react"
import { useFeed } from "@/components/feed-provider"
import { PanelSelector, type PanelFilter } from "@/components/panel-selector"
import { AnimatedNumber, PanelBadge, StatCard, Shimmer } from "@/components/shared"
import { byPanel, activeCliCount } from "@/lib/stats"
import { relativeTime, fullTime, maskNumber, euro, copyText } from "@/lib/format"
import { PageHeader } from "@/components/page-header"

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation()
        if (await copyText(text)) {
          setOk(true)
          setTimeout(() => setOk(false), 1500)
        }
      }}
      className="flex-shrink-0 inline-grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-white/10 text-app-muted hover:text-white"
      title="Copy SMS"
    >
      {ok ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function LiveFeed() {
  const { feed, ready } = useFeed()
  const [panel, setPanel] = useState<PanelFilter>("all")
  const [now] = useState(Date.now())

  const todayStart = new Date().setHours(0, 0, 0, 0)
  const todayFeed = useMemo(() => feed.filter(s => s.receivedAt >= todayStart), [feed, todayStart])
  
  const lamixCount = useMemo(() => todayFeed.filter((s) => s.panel === "lamix").length, [todayFeed])
  const purpleCount = todayFeed.length - lamixCount
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
        <StatCard label="Today SMS" icon={<Activity className="h-4 w-4" />} delay={0}>
          <AnimatedNumber value={todayFeed.length} />
        </StatCard>
        <StatCard label="Lamix Today" icon={<Diamond className="h-4 w-4" />} accent="accent" delay={0.05}>
          <AnimatedNumber value={lamixCount} />
        </StatCard>
        <StatCard label="Purple Today" icon={<Flower2 className="h-4 w-4" />} accent="accent-2" delay={0.1}>
          <AnimatedNumber value={purpleCount} />
        </StatCard>
        <StatCard label="Active CLIs" icon={<Radio className="h-4 w-4" />} accent="good" delay={0.15}>
          <AnimatedNumber value={active} />
        </StatCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PanelSelector value={panel} onChange={setPanel} />
        <span className="tabular text-sm text-app-muted">{rows.length} messages - updates live</span>
      </div>

      {!ready ? (
        <div className="glass-card space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--app-border)", background: "var(--app-bg-2)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-app-muted" style={{ borderBottom: "1px solid var(--app-border)" }}>
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
                {rows.map((s) => {
                  const fresh = Date.now() - s.receivedAt < 2500
                  return (
                    <tr
                      key={s.id}
                      className={`group border-t border-[var(--app-border)] transition-colors hover:bg-[var(--app-card)] ${fresh ? "flash-row" : ""}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-app-muted text-xs" title={fullTime(s.receivedAt)}>
                        {relativeTime(s.receivedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <PanelBadge panel={s.panel} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="mr-1.5">{s.flag}</span>
                        <span className="text-app-muted">{s.country}</span>
                      </td>
                      <td className="tabular whitespace-nowrap px-4 py-3 text-app-muted font-mono text-xs">{maskNumber(s.number)}</td>
                      <td
                        className="whitespace-nowrap px-4 py-3 font-semibold"
                        style={{ color: s.panel === "lamix" ? "var(--app-lamix)" : "var(--app-purple)" }}
                      >
                        {s.cli}
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-app-muted text-sm break-words whitespace-normal leading-relaxed">
                            {s.content}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                            <CopyBtn text={s.content} />
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

          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((s) => {
              const color = s.panel === "lamix" ? "var(--app-lamix)" : "var(--app-purple)"
              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: "var(--app-bg-2)", border: "1px solid var(--app-border)" }}
                >
                  {/* Row 1: Panel + Time + Payout */}
                  <div className="flex items-center justify-between">
                    <PanelBadge panel={s.panel} />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-app-muted">{relativeTime(s.receivedAt)}</span>
                      <span
                        className="tabular rounded-md px-2 py-0.5 text-xs font-semibold"
                        style={{ color: "var(--app-good)", background: "color-mix(in srgb, var(--app-good) 14%, transparent)" }}
                      >
                        {euro(s.payout)}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: CLI + Country + Number */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color }}>{s.cli}</span>
                    <span className="text-app-muted text-xs">{s.flag} {s.country}</span>
                    <span className="font-mono text-xs text-app-muted bg-black/20 px-2 py-0.5 rounded">{maskNumber(s.number)}</span>
                  </div>

                  {/* Row 3: Message + Copy */}
                  <div className="relative rounded-xl bg-black/30 p-3 border border-white/5">
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: color }} />
                    <div className="flex items-start justify-between gap-2 pl-1">
                      <p className="text-sm text-gray-300 font-mono leading-relaxed break-all whitespace-pre-wrap">
                        {s.content}
                      </p>
                      <CopyBtn text={s.content} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}
