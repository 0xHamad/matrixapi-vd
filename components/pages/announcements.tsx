"use client"

import { useEffect, useState } from "react"
import { Megaphone, Search, ArrowUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { AnnouncementCard } from "@/components/announcement-card"
import { EmptyState, Shimmer, CopyButton } from "@/components/shared"
import type { AnnouncementRow } from "@/lib/types"

export function Announcements() {
  const [data, setData] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/announcements?limit=100&t=${Date.now()}`, { cache: "no-store" })
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Telegram messages found"
          desc="Ensure the Telegram Userbot is running and connected to the channel."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const isLamix = s.platform === "lamix"
            const accent = isLamix ? "var(--app-lamix)" : "var(--app-purple)"
            const bgAccent = isLamix ? "rgba(45, 212, 191, 0.1)" : "rgba(168, 85, 247, 0.1)"

            return (
              <div 
                key={s.id} 
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "var(--app-bg-2)", border: "1px solid var(--app-border)" }}
              >
                {/* Ambient Glow */}
                <div 
                  className="absolute -right-12 -top-12 h-32 w-32 rounded-full blur-[50px] transition-opacity group-hover:opacity-60 opacity-20"
                  style={{ background: accent }}
                />

                <div className="relative z-10 flex flex-col gap-4">
                  {/* Header: Platform & Time */}
                  <div className="flex items-center justify-between">
                    <span 
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: accent, background: bgAccent }}
                    >
                      {isLamix ? "💠 LAMIX" : "🟣 PURPLE"}
                    </span>
                    <span className="text-xs font-medium text-app-muted">
                      {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* CLI Title & Badges */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-white truncate">
                        {s.cli || "Unknown CLI"}
                      </h3>
                      {s.is_new_cli && (
                        <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm font-medium text-app-muted">
                      <div className="flex items-center gap-1.5 rounded-md bg-black/20 px-2 py-1 border border-white/5">
                        <span>🌍</span>
                        <span>{s.country || "Unknown"}</span>
                      </div>
                      {s.number && (
                        <div className="flex items-center gap-1.5 rounded-md bg-black/20 px-2 py-1 border border-white/5 font-mono text-xs">
                          <span>📱</span>
                          <span>{s.number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="mt-2 relative rounded-xl bg-[#030712] p-4 border border-white/5 shadow-inner group/copy">
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: accent }} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                      <CopyButton text={s.content || s.raw_text || ""} label="Copy SMS" />
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all pr-6">
                      {(s.content || s.raw_text || "")
                        .split('\n')
                        .filter(line => {
                          const upper = line.toUpperCase()
                          return !upper.includes('NEW LAMIX APP') &&
                                 !upper.includes('NEW PURPLE APP') &&
                                 !upper.includes('COUNTRY:') &&
                                 !upper.includes('CLI:') &&
                                 !upper.includes('NUMBER:') &&
                                 !upper.includes('LAMIX PANEL') &&
                                 !upper.includes('MESSAGE:')
                        })
                        .join('\n')
                        .trim()
                      }
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
