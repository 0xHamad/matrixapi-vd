export type Panel = "lamix" | "purple"

export interface SmsRecord {
  id: string
  panel: Panel
  cli: string
  country: string
  countryCode: string
  flag: string
  number: string
  content: string
  payout: number
  receivedAt: number // epoch ms
  isNewCli?: boolean
}

export interface CliStat {
  cli: string
  panel: Panel
  country: string
  flag: string
  count: number
  payout: number
  lastMessage: string
  lastAt: number
  hourly: number[] // 24 buckets
}

export interface Range {
  name: string
  country: string
  flag: string
  numbers: number
  rate: number
  active: boolean
}

export type ThemeName = "dark" | "light" | "fun"

export interface AnnouncementRow {
  id: string
  created_at: string
  platform: Panel
  cli: string
  country: string
  number: string
  content: string
  is_new_cli: boolean
}
