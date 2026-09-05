import type { SmsRecord, Panel, Range } from "./types"

const COUNTRIES = [
  { country: "Malaysia", code: "MY", flag: "🇲🇾" },
  { country: "Germany", code: "DE", flag: "🇩🇪" },
  { country: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { country: "France", code: "FR", flag: "🇫🇷" },
  { country: "Spain", code: "ES", flag: "🇪🇸" },
  { country: "Italy", code: "IT", flag: "🇮🇹" },
  { country: "Netherlands", code: "NL", flag: "🇳🇱" },
  { country: "Poland", code: "PL", flag: "🇵🇱" },
  { country: "Brazil", code: "BR", flag: "🇧🇷" },
  { country: "India", code: "IN", flag: "🇮🇳" },
  { country: "Sweden", code: "SE", flag: "🇸🇪" },
  { country: "Turkey", code: "TR", flag: "🇹🇷" },
]

const CLIS = [
  "HiPeople",
  "FreedomBGM",
  "WhatsApp",
  "Telegram",
  "Google",
  "Amazon",
  "Netflix",
  "Revolut",
  "TikTok",
  "Instagram",
  "PayPal",
  "Uber",
  "Wise",
  "Binance",
  "Coinbase",
  "Discord",
]

const TEMPLATES = [
  "Your verification code is {CODE}. Do not share it with anyone.",
  "{CLI}: Use {CODE} to log in. This code expires in 10 minutes.",
  "Your one-time password is {CODE}. Valid for 5 minutes only.",
  "{CODE} is your {CLI} security code. Never share this code.",
  "Confirm your account with code {CODE}. Reply STOP to opt out.",
  "Your login code: {CODE}. If you didn't request this, ignore this message.",
]

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function randNumber(code: string) {
  const n = Math.floor(1000000000 + Math.random() * 8999999999).toString()
  return `+${code === "MY" ? "60" : code === "DE" ? "49" : "1"}${n}`.slice(0, 14)
}

let seq = 0
export function makeSms(panel?: Panel, at?: number): SmsRecord {
  const c = rand(COUNTRIES)
  const cli = rand(CLIS)
  const code = randCode()
  const p: Panel = panel ?? (Math.random() > 0.5 ? "lamix" : "purple")
  const content = rand(TEMPLATES).replaceAll("{CODE}", code).replaceAll("{CLI}", cli)
  seq += 1
  return {
    id: `sms_${Date.now()}_${seq}_${Math.floor(Math.random() * 1e6)}`,
    panel: p,
    cli,
    country: c.country,
    countryCode: c.code,
    flag: c.flag,
    number: randNumber(c.code),
    content,
    payout: Number((0.02 + Math.random() * 0.18).toFixed(4)),
    receivedAt: at ?? Date.now(),
    isNewCli: Math.random() > 0.85,
  }
}

export function seedFeed(count = 40): SmsRecord[] {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) =>
    makeSms(undefined, now - i * (30_000 + Math.random() * 180_000)),
  ).sort((a, b) => b.receivedAt - a.receivedAt)
}

export const LAMIX_RANGES: Range[] = [
  { name: "MY-Prime-01", country: "Malaysia", flag: "🇲🇾", numbers: 4200, rate: 0.09, active: true },
  { name: "DE-Bulk-14", country: "Germany", flag: "🇩🇪", numbers: 3100, rate: 0.12, active: true },
  { name: "GB-Retail-07", country: "United Kingdom", flag: "🇬🇧", numbers: 2600, rate: 0.15, active: true },
  { name: "FR-Legacy-03", country: "France", flag: "🇫🇷", numbers: 1800, rate: 0.08, active: false },
  { name: "ES-Prime-02", country: "Spain", flag: "🇪🇸", numbers: 2200, rate: 0.1, active: true },
]

export const PURPLE_RANGES: Range[] = [
  { name: "BR-Mega-21", country: "Brazil", flag: "🇧🇷", numbers: 5400, rate: 0.06, active: true },
  { name: "IN-Bulk-33", country: "India", flag: "🇮🇳", numbers: 6100, rate: 0.05, active: true },
  { name: "NL-Prime-09", country: "Netherlands", flag: "🇳🇱", numbers: 1900, rate: 0.14, active: true },
  { name: "PL-Retail-12", country: "Poland", flag: "🇵🇱", numbers: 2400, rate: 0.11, active: false },
  { name: "SE-Legacy-05", country: "Sweden", flag: "🇸🇪", numbers: 1500, rate: 0.13, active: true },
]
