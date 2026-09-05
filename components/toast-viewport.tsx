"use client"

import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useFeed } from "@/components/feed-provider"

export function ToastViewport() {
  const { toasts, dismissToast, showToasts } = useFeed()
  
  if (!showToasts) return null

  return (
    <div className="pointer-events-none fixed top-20 right-4 z-[80] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const color =
            t.panel === "new"
              ? "var(--app-good)"
              : t.panel === "lamix"
                ? "var(--app-lamix)"
                : "var(--app-purple)"
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass-card pointer-events-auto flex items-start gap-3 p-3.5"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-app-strong">{t.title}</p>
                <p className="truncate text-xs text-app-muted">{t.desc}</p>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-app-muted transition-colors hover:text-app-strong"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
