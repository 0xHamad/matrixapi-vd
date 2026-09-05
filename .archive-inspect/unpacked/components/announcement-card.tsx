"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CopyButton } from "@/components/shared"
import { relativeTime, maskNumber } from "@/lib/format"
import type { SmsRecord } from "@/lib/types"

export function AnnouncementCard({ sms, count }: { sms: SmsRecord; count: number }) {
  const [expanded, setExpanded] = useState(false)
  const isLamix = sms.panel === "lamix"
  const accent = isLamix ? "var(--app-lamix)" : "var(--app-purple)"
  const long = sms.content.length > 90

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card glass-card-hover p-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            color: accent,
            background: isLamix ? "rgba(var(--app-accent-rgb),0.12)" : "rgba(var(--app-accent-2-rgb),0.12)",
            border: `1px solid ${accent}`,
          }}
        >
          {isLamix ? "💠 Lamix" : "🪻 Purple"}
        </span>
        <span className="text-xs text-app-muted">{relativeTime(sms.receivedAt)}</span>
        <span className="ml-auto text-sm text-app-muted">
          {sms.flag} {sms.country}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <h3 className="text-xl font-bold text-app-strong">{sms.cli}</h3>
        <CopyButton text={sms.cli} label="Copy CLI name" />
        {sms.isNewCli && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{ color: "var(--app-good)", background: "color-mix(in srgb, var(--app-good) 16%, transparent)" }}
          >
            New CLI
          </span>
        )}
      </div>

      <div
        className="mt-3 rounded-lg px-3 py-2.5 font-mono text-sm leading-relaxed"
        style={{ background: "var(--app-card-solid)", border: "1px solid var(--app-border)", color: "var(--app-text)" }}
      >
        <p className={expanded ? "" : "line-clamp-3"}>{sms.content}</p>
        {long && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-xs font-semibold"
            style={{ color: accent }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-app-muted">
        <span className="tabular">{maskNumber(sms.number)}</span>
        <span className="ml-auto tabular">
          {count} SMS for this CLI
        </span>
      </div>
    </motion.article>
  )
}
