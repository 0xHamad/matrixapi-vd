"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, Diamond, Flower2, BarChart3, Megaphone, Globe, Hash } from "lucide-react"
import { useFeed } from "@/components/feed-provider"

const PAGES = [
  { label: "Go to Live Feed", href: "/", icon: Radio },
  { label: "Go to Lamix Panel", href: "/lamix", icon: Diamond },
  { label: "Go to Purple Panel", href: "/purple", icon: Flower2 },
  { label: "Go to Active CLIs", href: "/clis", icon: BarChart3 },
  { label: "Go to Announcements", href: "/announcements", icon: Megaphone },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { feed } = useFeed()

  const { clis, countries } = useMemo(() => {
    const cliSet = new Set<string>()
    const countrySet = new Set<string>()
    for (const s of feed) {
      cliSet.add(s.cli)
      countrySet.add(s.country)
    }
    return { clis: [...cliSet].slice(0, 8), countries: [...countrySet].slice(0, 8) }
  }, [feed])

  function go(href: string) {
    router.push(href)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-start justify-items-center px-4 pt-[12vh]"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass-card w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Command palette" className="w-full">
              <Command.Input
                autoFocus
                placeholder="Search CLIs, countries, or jump to a page…"
                className="w-full bg-transparent px-5 py-4 text-sm text-app-strong outline-none placeholder:text-app-muted"
                style={{ borderBottom: "1px solid var(--app-border)" }}
              />
              <Command.List className="custom-scroll max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-app-muted">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="px-2 py-1 text-[11px] uppercase tracking-wide text-app-muted">
                  {PAGES.map((p) => (
                    <Item key={p.href} onSelect={() => go(p.href)}>
                      <p.icon className="h-4 w-4 text-accent" />
                      {p.label}
                    </Item>
                  ))}
                </Command.Group>

                {clis.length > 0 && (
                  <Command.Group heading="CLIs" className="px-2 py-1 text-[11px] uppercase tracking-wide text-app-muted">
                    {clis.map((c) => (
                      <Item key={c} onSelect={() => go("/clis")}>
                        <Hash className="h-4 w-4 text-accent-2" />
                        {c}
                      </Item>
                    ))}
                  </Command.Group>
                )}

                {countries.length > 0 && (
                  <Command.Group heading="Countries" className="px-2 py-1 text-[11px] uppercase tracking-wide text-app-muted">
                    {countries.map((c) => (
                      <Item key={c} onSelect={() => go("/")}>
                        <Globe className="h-4 w-4 text-accent" />
                        Filter: {c}
                      </Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Item({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-app-strong transition-colors data-[selected=true]:bg-[var(--app-card)]"
    >
      {children}
    </Command.Item>
  )
}
