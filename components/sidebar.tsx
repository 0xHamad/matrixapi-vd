"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Radio, Diamond, Flower2, BarChart3, Megaphone, SatelliteDish, LogOut, KeyRound, X } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { useState, FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"

export const NAV = [
  { href: "/", label: "Live Feed", icon: Radio },
  { href: "/active-clis", label: "Active CLIs", icon: BarChart3 },
  { href: "/lamix", label: "Lamix Panel", icon: Diamond },
  { href: "/purple", label: "Purple Panel", icon: Flower2 },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/endpoints", label: "Endpoints", icon: SatelliteDish },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { logout, username } = useAuth()
  const [showPwdModal, setShowPwdModal] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 px-6">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--app-accent)] text-[#07111f] shadow-[var(--app-glow)]">
          <Radio className="h-5 w-5" />
        </div>
        <span className="text-[13px] font-bold uppercase tracking-[0.24em] text-app-strong">
          Matrix
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
                active
                  ? "bg-[var(--app-card)] text-app-strong shadow-sm ring-1 ring-[var(--app-border)]"
                  : "text-app-muted hover:bg-white/5 hover:text-app-strong",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-[var(--app-accent)]" : "group-hover:text-[var(--app-accent)]",
                )}
              />
              {item.label}
              {active && (
                <span className="ml-auto block h-1.5 w-1.5 rounded-full bg-[var(--app-accent)] shadow-[var(--app-glow)]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-4 px-4 pb-5">
        <ThemeSwitcher />
        
        {/* User Actions */}
        <div className="flex flex-col gap-3 rounded-xl p-3" style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--app-accent)]/10 text-[var(--app-accent)]">
              <span className="text-xs font-bold">{username?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-app-strong">{username}</p>
              <p className="text-[10px] text-app-muted">Secured Account</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--app-border)]">
            <button
              onClick={() => setShowPwdModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-app-muted transition-colors hover:bg-white/5 hover:text-app-strong"
            >
              <KeyRound className="h-3 w-3" /> Change Pwd
            </button>
            <button
              onClick={logout}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-[var(--app-danger)] transition-colors hover:bg-[var(--app-danger)]/10"
            >
              <LogOut className="h-3 w-3" /> Logout
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal isOpen={showPwdModal} onClose={() => setShowPwdModal(false)} />
    </div>
  )
}

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: "", type: "" })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg({ text: "", type: "" })

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", currentPassword: current, newPassword: newPwd }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg({ text: "Password changed successfully!", type: "success" })
        setTimeout(() => {
          onClose()
          setCurrent("")
          setNewPwd("")
          setMsg({ text: "", type: "" })
        }, 1500)
      } else {
        setMsg({ text: data.error || "Update failed", type: "error" })
      }
    } catch {
      setMsg({ text: "Network error", type: "error" })
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-app-muted hover:text-app-strong transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="mb-4 text-lg font-semibold text-app-strong">Change Password</h3>
            
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-app-muted">Current Password</label>
                <input
                  type="password"
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  required
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                  style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: "var(--app-strong)" }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-app-muted">New Password</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  required
                  minLength={3}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                  style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: "var(--app-strong)" }}
                />
              </div>
              
              {msg.text && (
                <p className={`text-xs font-semibold ${msg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                  {msg.text}
                </p>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: "var(--app-accent)", color: "#000" }}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
