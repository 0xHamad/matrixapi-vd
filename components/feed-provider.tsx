"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { SmsRecord, Panel } from "@/lib/types"
import { makeSms, seedFeed } from "@/lib/mock-data"

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
}

const Ctx = createContext<FeedCtx | null>(null)

export function FeedProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<SmsRecord[]>([])
  const [ready, setReady] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seen = useRef<Set<string>>(new Set())

  useEffect(() => {
    let initial: SmsRecord[] = []
    try {
      const raw = localStorage.getItem(FEED_KEY)
      if (raw) initial = JSON.parse(raw)
    } catch {
      initial = []
    }
    if (!initial.length) initial = seedFeed(40)
    initial.forEach((s) => seen.current.add(s.cli))
    setFeed(initial)
    setReady(true)
  }, [])

  // Persist on change
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(FEED_KEY, JSON.stringify(feed.slice(0, MAX)))
    } catch {
      /* ignore quota */
    }
  }, [feed, ready])

  // Simulate realtime arrivals
  useEffect(() => {
    if (!ready) return
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const sms = makeSms()
      const isNew = !seen.current.has(sms.cli)
      sms.isNewCli = isNew
      seen.current.add(sms.cli)
      setFeed((prev) => [sms, ...prev].slice(0, MAX))
      pushToast(
        isNew
          ? { id: sms.id, title: `NEW CLI: ${sms.cli}`, desc: `${sms.flag} ${sms.country}`, panel: "new" }
          : {
              id: sms.id,
              title: `New ${sms.panel === "lamix" ? "Lamix" : "Purple"} SMS`,
              desc: `CLI: ${sms.cli} · ${sms.flag} ${sms.country}`,
              panel: sms.panel,
            },
      )
      timer = setTimeout(tick, 4000 + Math.random() * 6000)
    }
    timer = setTimeout(tick, 5000)
    return () => clearTimeout(timer)
  }, [ready])

  function pushToast(t: ToastItem) {
    setToasts((prev) => [t, ...prev].slice(0, 3))
    setTimeout(() => dismissToast(t.id), 4000)
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const value = useMemo(() => ({ feed, ready, toasts, dismissToast }), [feed, ready, toasts])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFeed() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useFeed must be used within FeedProvider")
  return ctx
}
