"use client"

import type { ReactNode } from "react"

export function PageHeader({
  icon,
  title,
  subtitle,
  badge,
  actions,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  badge?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl"
          style={{ color: "var(--app-accent)", background: "rgba(var(--app-accent-rgb),0.12)" }}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-app-strong">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-app-muted">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  )
}
