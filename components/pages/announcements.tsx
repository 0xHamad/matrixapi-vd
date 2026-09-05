"use client"

import { useEffect, useState } from "react"
import { Megaphone, Search, ArrowUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { AnnouncementCard } from "@/components/announcement-card"
import { EmptyState, Shimmer } from "@/components/shared"
import type { AnnouncementRow } from "@/lib/types"

export function Announcements() {
  const [data, setData] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/announcements?platform=telegram&limit=100`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (err) {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // poll every 3 seconds for new TG messages
    const int = setInterval(fetchData, 3000)
    return () => clearInterval(int)
  }, [])

  const filtered = data.filter(d => 
    query === "" || 
    d.cli.toLowerCase().includes(query.toLowerCase()) || 
    d.country.toLowerCase().includes(query.toLowerCase()) ||
    d.content.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Megaphone className="h-5 w-5" />}
        title="Announcements"
        subtitle="Live Telegram Messages from Channel"
        badge={
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ color: "var(--app-good)", background: "color-mix(in srgb, var(--app-good) 14%, transparent)" }}
          >
            <span className="live-dot" />
            LIVE TG BOT
          </span>
        }
      />

      <div
        className="flex items-center gap-2 rounded-xl px-4 py-2.5"
        style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
      >
        <Search className="h-4 w-4 text-app-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search CLI name, country, or content…"
          className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Telegram messages found"
          desc="Ensure the Telegram Userbot is running and connected to the channel."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((s) => (
            <div key={s.id} className="p-4 rounded-xl flex flex-col gap-3" style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-semibold text-app-muted uppercase tracking-wider">{new Date(s.created_at).toLocaleString()}</div>
                  <div className="text-lg font-bold mt-1 text-app-strong">{s.cli || "Unknown CLI"}</div>
                </div>
                <span className="px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-widest bg-blue-500/10 text-blue-400">TELEGRAM</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-app-muted">
                <span>🌍 {s.country || "Unknown"}</span>
                <span>•</span>
                <span className="font-mono">{s.number || "---"}</span>
              </div>
              <div className="mt-2 text-sm text-app-strong bg-black/20 p-3 rounded-lg border border-white/5 break-words">
                {s.content || s.raw_text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
