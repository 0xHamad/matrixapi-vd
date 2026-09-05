"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Radio, Diamond, Flower2, BarChart3, Megaphone, SatelliteDish, LogOut } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

export const NAV = [
  { href: "/", label: "Live Feed", icon: Radio },
  { href: "/lamix", label: "Lamix Panel", icon: Diamond },
  { href: "/purple", label: "Purple Panel", icon: Flower2 },
  { href: "/clis", label: "Active CLIs", icon: BarChart3 },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div
          className="grid h-10 w-10 place-items-center rounded-xl accent-glow"
          style={{ color: "var(--app-accent)", background: "rgba(var(--app-accent-rgb),0.12)" }}
        >
          <SatelliteDish className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-app-strong">SMS Intelligence</p>
          <p className="text-[11px] text-app-muted">Realtime Monitoring</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "text-app-strong" : "text-app-muted hover:text-app-strong",
              )}
              style={active ? { background: "var(--app-card)", border: "1px solid var(--app-border)" } : undefined}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
                  style={{ background: "var(--app-accent)", boxShadow: "var(--app-glow)" }}
                />
              )}
              <Icon
                className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110"
                style={active ? { color: "var(--app-accent)" } : undefined}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-4 px-4 pb-5">
        <ThemeSwitcher />
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-app-muted"
            style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
          >
            v1.0.0
          </span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-app-muted transition-colors hover:text-[var(--app-danger)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block"
      style={{ background: "var(--app-bg-2)", borderRight: "1px solid var(--app-border)" }}
    >
      <SidebarContent />
    </aside>
  )
}
