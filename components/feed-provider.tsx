"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { SmsRecord, Panel } from "@/lib/types"

const FEED_KEY = "sms_feed_cache"
const MAX = 200

export interface ToastItem {
  id: string
  title: string
  desc: string
  panel: Panel | "new"
}

interface FeedCtx {
  feed: SmsRecord[]
  ready: boolean
  toasts: ToastItem[]
  dismissToast: (id: string) => void
  rollingStats: {
    hourly: CliStatRaw[]
    fourHourly: CliStatRaw[]
    daily: CliStatRaw[]
  }
  online: boolean
}

export interface CliStatRaw {
  cli: string
  panel: string
  count: number
  content: string
  range: string
}

const Ctx = createContext<FeedCtx | null>(null)

export function FeedProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<SmsRecord[]>([])
  const [ready, setReady] = useState(false)
  const [online, setOnline] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [rollingStats, setRollingStats] = useState<FeedCtx["rollingStats"]>({
    hourly: [], fourHourly: [], daily: [],
  })
  const seen = useRef<Set<string>>(new Set())

  // Load persisted feed from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FEED_KEY)
      if (raw) {
        const parsed: SmsRecord[] = JSON.parse(raw)
        parsed.forEach(s => seen.current.add(s.id))
        setFeed(parsed)
      }
    } catch {}
    setReady(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(FEED_KEY, JSON.stringify(feed.slice(0, MAX)))
    } catch {}
  }, [feed, ready])

  // Poll real API every 1 second
  useEffect(() => {
    if (!ready) return

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sms-monitor?t=${Date.now()}`, { cache: "no-store" })
        if (!res.ok) throw new Error("non-ok")
        const data = await res.json()
        if (!data.success) throw new Error("api-error")

        setOnline(true)

        // Update rolling stats only if changed to avoid full app re-renders every 1s
        if (data.rollingStats) {
          setRollingStats(prev => {
            const prevStr = JSON.stringify(prev)
            const nextStr = JSON.stringify(data.rollingStats)
            return prevStr === nextStr ? prev : data.rollingStats
          })
        }

        // Merge new SMS into feed
        const incoming: SmsRecord[] = data.sms || []
        if (!incoming.length) return

        const newOnes: SmsRecord[] = []
        incoming.forEach(s => {
          if (!seen.current.has(s.id)) {
            seen.current.add(s.id)
            newOnes.push(s)
          }
        })

        if (newOnes.length > 0) {
          setFeed(prev => {
            const merged = [...newOnes, ...prev]
            const map = new Map<string, SmsRecord>()
            merged.forEach(s => map.set(s.id, s))
            return Array.from(map.values())
              .sort((a, b) => b.receivedAt - a.receivedAt)
              .slice(0, MAX)
          })

          // Show toast for new entries (max 1 per batch to avoid spam)
          const latest = newOnes[0]
          pushToast({
            id: latest.id,
            title: latest.isNewCli
              ? `🆕 NEW CLI: ${latest.cli}`
              : `New ${latest.panel === "lamix" ? "Lamix" : "Purple"} SMS`,
            desc: `${latest.flag} ${latest.country} • ${latest.cli}`,
            panel: latest.isNewCli ? "new" : latest.panel,
          })
        }
      } catch {
        setOnline(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => clearInterval(interval)
  }, [ready])

  function pushToast(t: ToastItem) {
    setToasts(prev => [t, ...prev].slice(0, 3))
    setTimeout(() => dismissToast(t.id), 4000)
  }

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const value = useMemo(
    () => ({ feed, ready, toasts, dismissToast, rollingStats, online }),
    [feed, ready, toasts, rollingStats, online],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFeed() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useFeed must be used within FeedProvider")
  return ctx
}
