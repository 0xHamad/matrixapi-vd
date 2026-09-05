import type { SmsRecord, CliStat, Panel } from "./types"

export function byPanel(feed: SmsRecord[], panel?: Panel | "all") {
  if (!panel || panel === "all") return feed
  return feed.filter((s) => s.panel === panel)
}

export function withinMs(feed: SmsRecord[], ms: number) {
  const cutoff = Date.now() - ms
  return feed.filter((s) => s.receivedAt >= cutoff)
}

export function activeCliCount(feed: SmsRecord[], windowMs = 3_600_000) {
  const recent = withinMs(feed, windowMs)
  return new Set(recent.map((s) => s.cli)).size
}

export function totalPayout(feed: SmsRecord[]) {
  return feed.reduce((sum, s) => sum + s.payout, 0)
}

export function topCountry(feed: SmsRecord[]) {
  const counts = new Map<string, { count: number; flag: string }>()
  for (const s of feed) {
    const cur = counts.get(s.country) ?? { count: 0, flag: s.flag }
    cur.count += 1
    counts.set(s.country, cur)
  }
  let best: { country: string; count: number; flag: string } | null = null
  for (const [country, v] of counts) {
    if (!best || v.count > best.count) best = { country, count: v.count, flag: v.flag }
  }
  return best
}

export function cliStats(feed: SmsRecord[]): CliStat[] {
  const map = new Map<string, CliStat>()
  const now = Date.now()
  for (const s of feed) {
    let stat = map.get(s.cli)
    if (!stat) {
      stat = {
        cli: s.cli,
        panel: s.panel,
        country: s.country,
        flag: s.flag,
        count: 0,
        payout: 0,
        lastMessage: s.content,
        lastAt: 0,
        hourly: new Array(24).fill(0),
      }
      map.set(s.cli, stat)
    }
    stat.count += 1
    stat.payout += s.payout
    if (s.receivedAt > stat.lastAt) {
      stat.lastAt = s.receivedAt
      stat.lastMessage = s.content
      stat.panel = s.panel
      stat.country = s.country
      stat.flag = s.flag
    }
    const hoursAgo = Math.floor((now - s.receivedAt) / 3_600_000)
    if (hoursAgo >= 0 && hoursAgo < 24) {
      stat.hourly[23 - hoursAgo] += 1
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}
