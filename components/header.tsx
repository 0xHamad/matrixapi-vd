"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, Search, BellRing, BellOff } from "lucide-react"
import { NAV } from "@/components/sidebar"

function useClock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const update = () => {
      const d = new Date()
      setTime(
        d.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }),
      )
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

function NotificationToggle() {
  const [perm, setPerm] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPerm(Notification.permission)
    }
  }, [])

  const requestPerm = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const p = await Notification.requestPermission()
      setPerm(p)
      if (p === "granted") {
        new Notification("Notifications Enabled", { body: "You will now receive alerts for new incoming SMS." })
      }
    }
  }

  if (perm === "denied") return null

  return (
    <button
      onClick={requestPerm}
      className={`hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
        perm === "granted" 
          ? "bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20"
          : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
      }`}
    >
      {perm === "granted" ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      {perm === "granted" ? "Alerts On" : "Enable Alerts"}
    </button>
  )
}

export function Header({
  onOpenMenu,
  onOpenCommand,
}: {
  onOpenMenu: () => void
  onOpenCommand: () => void
}) {
  const pathname = usePathname()
  const clock = useClock()
  const current = NAV.find((n) => n.href === pathname)?.label ?? "Dashboard"

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center gap-3 px-4 backdrop-blur-xl lg:px-6"
      style={{ background: "color-mix(in srgb, var(--app-bg) 82%, transparent)", borderBottom: "1px solid var(--app-border)" }}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid h-9 w-9 place-items-center rounded-lg text-app-muted lg:hidden"
        style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 text-sm sm:flex">
        <span className="text-app-muted">Dashboard</span>
        <span className="text-app-muted">/</span>
        <span className="font-medium text-app-strong mr-4">{current}</span>
        <NotificationToggle />
      </div>

      <button
        type="button"
        onClick={onOpenCommand}
        className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-app-muted transition-colors hover:text-app-strong sm:ml-4 sm:w-64 md:mx-auto"
        style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search CLIs, countries...</span>
        <kbd className="ml-auto hidden rounded border border-[var(--app-border)] px-1.5 py-0.5 text-[10px] sm:inline">
          CTRL K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3 md:ml-0">
        <div
          className="hidden items-center gap-2 rounded-full px-3 py-1.5 sm:flex"
          style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
        >
          <span className="live-dot" />
          <span className="text-xs font-semibold text-app-strong">LIVE</span>
        </div>
        <div
          className="hidden items-center gap-2 rounded-full px-3 py-1.5 tabular text-xs font-medium text-app-muted md:flex"
          style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
        >
          {clock} UTC
        </div>
      </div>
    </header>
  )
}
