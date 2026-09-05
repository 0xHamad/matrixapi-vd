"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Megaphone, Search, ArrowUp } from "lucide-react"
import { useFeed } from "@/components/feed-provider"
import { PageHeader } from "@/components/page-header"
import { AnnouncementCard } from "@/components/announcement-card"
import { EmptyState, Shimmer } from "@/components/shared"
import type { SmsRecord } from "@/lib/types"

const PER_PAGE = 25
type Filter = "all" | "new" | "lamix" | "purple" | "today" | "hour"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New CLI" },
  { key: "lamix", label: "Lamix" },
  { key: "purple", label: "Purple" },
  { key: "today", label: "Today" },
  { key: "hour", label: "This Hour" },
]

export function Announcements() {
  const { feed, ready } = useFeed()
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [newCount, setNewCount] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)
  const lastTop = useRef<number>(feed[0]?.receivedAt ?? 0)

  // Count new arrivals while scrolled/paged away
  useEffect(() => {
    const newestAt = feed[0]?.receivedAt ?? 0
    if (newestAt > lastTop.current) {
      if (page !== 1 || (topRef.current && topRef.current.getBoundingClientRect().top < -120)) {
        setNewCount((c) => c + feed.filter((s) => s.receivedAt > lastTop.current).length)
      }
      lastTop.current = newestAt
    }
  }, [feed, page])

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of feed) m.set(s.cli, (m.get(s.cli) ?? 0) + 1)
    return m
  }, [feed])

  const filtered = useMemo(() => {
    const now = Date.now()
    let list: SmsRecord[] = feed
    if (filter === "new") list = list.filter((s) => s.isNewCli)
    else if (filter === "lamix") list = list.filter((s) => s.panel === "lamix")
    else if (filter === "purple") list = list.filter((s) => s.panel === "purple")
    else if (filter === "today") list = list.filter((s) => now - s.receivedAt < 24 * 3_600_000)
    else if (filter === "hour") list = list.filter((s) => now - s.receivedAt < 3_600_000)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.cli.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q),
      )
    }
    return list
  }, [feed, filter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PER_PAGE
  const pageRows = filtered.slice(start, start + PER_PAGE)

  function scrollToTop() {
    setPage(1)
    setNewCount(0)
    topRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="space-y-6" ref={topRef}>
      <PageHeader
        icon={<Megaphone className="h-5 w-5" />}
        title="Announcements"
        subtitle="SMS messages forwarded from the Telegram bot, persisted permanently"
        badge={
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ color: "var(--app-good)", background: "color-mix(in srgb, var(--app-good) 14%, transparent)" }}
          >
            <span className="live-dot" />
            BOT CONNECTED
          </span>
        }
      />

      {/* Filters */}
      <div className="custom-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key)
                setPage(1)
              }}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${active ? "text-black" : "text-app-muted hover:text-app-strong"}`}
              style={active ? { background: "var(--app-accent)", boxShadow: "var(--app-glow)" } : { background: "var(--app-card)", border: "1px solid var(--app-border)" }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-2.5"
        style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
      >
        <Search className="h-4 w-4 text-app-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search CLI name, country, or content…"
          className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted"
        />
      </div>

      {!ready ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : pageRows.length === 0 ? (
        <EmptyState
          title="No messages match"
          desc="Adjust your filters or search to see forwarded Telegram messages."
          action={
            <button
              onClick={() => {
                setFilter("all")
                setQuery("")
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-black"
              style={{ background: "var(--app-accent)" }}
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {pageRows.map((s) => (
                <AnnouncementCard key={s.id} sms={s} count={counts.get(s.cli) ?? 1} />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="tabular text-sm text-app-muted">
              Showing {start + 1}-{Math.min(start + PER_PAGE, filtered.length)} of {filtered.length} messages
            </span>
            <Pagination page={current} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      {/* New messages toast */}
      <AnimatePresence>
        {newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black shadow-lg lg:bottom-8"
            style={{ background: "var(--app-accent)", boxShadow: "var(--app-glow)" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-black" />
            </span>
            {newCount} new message{newCount > 1 ? "s" : ""} · scroll to top
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages = useMemo(() => {
    const arr: (number | "…")[] = []
    const push = (n: number) => arr.push(n)
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i)
    } else {
      push(1)
      if (page > 3) arr.push("…")
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i)
      if (page < totalPages - 2) arr.push("…")
      push(totalPages)
    }
    return arr
  }, [page, totalPages])

  return (
    <div className="flex items-center gap-1">
      <PageBtn disabled={page === 1} onClick={() => onChange(page - 1)}>
        ←
      </PageBtn>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-app-muted">
            …
          </span>
        ) : (
          <PageBtn key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </PageBtn>
        ),
      )}
      <PageBtn disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        →
      </PageBtn>
    </div>
  )
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`tabular grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-medium transition-colors disabled:opacity-40 ${active ? "text-black" : "text-app-muted hover:text-app-strong"}`}
      style={active ? { background: "var(--app-accent)" } : { background: "var(--app-card)", border: "1px solid var(--app-border)" }}
    >
      {children}
    </button>
  )
}
