"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AuthGate } from "@/components/auth-gate"
import { FeedProvider } from "@/components/feed-provider"
import { Sidebar, SidebarContent, NAV } from "@/components/sidebar"
import { Header } from "@/components/header"
import { CommandPalette } from "@/components/command-palette"
import { ToastViewport } from "@/components/toast-viewport"
import { cn } from "@/lib/utils"

export function AppFrame({ children }: { children: ReactNode }) {
  const { ready, authed } = useAuth()
  const pathname = usePathname()
  const [drawer, setDrawer] = useState(false)
  const [command, setCommand] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommand((c) => !c)
      }
      if (e.key === "Escape") setCommand(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-muted border-t-[var(--app-accent)]" />
      </div>
    )
  }

  if (!authed) return <AuthGate />

  return (
    <FeedProvider>
      <Sidebar />

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
              style={{ background: "var(--app-bg-2)", borderRight: "1px solid var(--app-border)" }}
            >
              <button
                onClick={() => setDrawer(false)}
                className="absolute right-3 top-4 z-10 text-app-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setDrawer(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[260px]">
        <Header onOpenMenu={() => setDrawer(true)} onOpenCommand={() => setCommand(true)} />
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around px-2 py-2 backdrop-blur-xl lg:hidden"
        style={{ background: "color-mix(in srgb, var(--app-bg) 85%, transparent)", borderTop: "1px solid var(--app-border)" }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium",
                active ? "text-app-strong" : "text-app-muted",
              )}
            >
              <Icon className="h-5 w-5" style={active ? { color: "var(--app-accent)" } : undefined} />
              {label.split(" ")[0]}
            </Link>
          )
        })}
      </nav>

      <CommandPalette open={command} onClose={() => setCommand(false)} />
      <ToastViewport />
    </FeedProvider>
  )
}
