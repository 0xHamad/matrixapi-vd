import { NextResponse } from "next/server"
import axios from "axios"

const LAMIX_TOKEN = "FN9LfZtOhoMFx6zOjdUm2n1Xt3t2Wh860lqChIcVhjY"
const PURPLE_TOKEN = "QlZTR0FOfkJET1dI"
const PURPLE_URL = "http://137.74.1.203/crapi/reseller/mdr.php"
const FETCH_RECORDS = 50

const PREFIX_MAP: Record<string, [string, string]> = {
  "880": ["Bangladesh", "BD"], "998": ["Uzbekistan", "UZ"], "996": ["Kyrgyzstan", "KG"],
  "994": ["Azerbaijan", "AZ"], "993": ["Turkmenistan", "TM"], "992": ["Tajikistan", "TJ"],
  "977": ["Nepal", "NP"], "976": ["Mongolia", "MN"], "974": ["Qatar", "QA"],
  "973": ["Bahrain", "BH"], "972": ["Israel", "IL"], "971": ["UAE", "AE"],
  "968": ["Oman", "OM"], "967": ["Yemen", "YE"], "966": ["Saudi Arabia", "SA"],
  "965": ["Kuwait", "KW"], "964": ["Iraq", "IQ"], "963": ["Syria", "SY"],
  "962": ["Jordan", "JO"], "961": ["Lebanon", "LB"], "886": ["Taiwan", "TW"],
  "856": ["Laos", "LA"], "855": ["Cambodia", "KH"], "852": ["Hong Kong", "HK"],
  "380": ["Ukraine", "UA"], "375": ["Belarus", "BY"], "374": ["Armenia", "AM"],
  '373': ["Moldova", "MD"], "255": ["Tanzania", "TZ"], "256": ["Uganda", "UG"],
  "254": ["Kenya", "KE"], "251": ["Ethiopia", "ET"], "249": ["Sudan", "SD"],
  "244": ["Angola", "AO"], "237": ["Cameroon", "CM"], "234": ["Nigeria", "NG"],
  "233": ["Ghana", "GH"], "225": ["Ivory Coast", "CI"], "221": ["Senegal", "SN"],
  "218": ["Libya", "LY"], "216": ["Tunisia", "TN"], "213": ["Algeria", "DZ"],
  "212": ["Morocco", "MA"], "95": ["Myanmar", "MM"], "94": ["Sri Lanka", "LK"],
  "93": ["Afghanistan", "AF"], "92": ["Pakistan", "PK"], "91": ["India", "IN"],
  "90": ["Turkey", "TR"], "86": ["China", "CN"], "84": ["Vietnam", "VN"],
  "82": ["South Korea", "KR"], "81": ["Japan", "JP"], "77": ["Kazakhstan", "KZ"],
  "7": ["Russia", "RU"], "66": ["Thailand", "TH"], "65": ["Singapore", "SG"],
  "64": ["New Zealand", "NZ"], "63": ["Philippines", "PH"], "62": ["Indonesia", "ID"],
  "61": ["Australia", "AU"], "60": ["Malaysia", "MY"], "58": ["Venezuela", "VE"],
  "57": ["Colombia", "CO"], "56": ["Chile", "CL"], "55": ["Brazil", "BR"],
  "54": ["Argentina", "AR"], "53": ["Cuba", "CU"], "52": ["Mexico", "MX"],
  "51": ["Peru", "PE"], "48": ["Poland", "PL"], "47": ["Norway", "NO"],
  "46": ["Sweden", "SE"], "45": ["Denmark", "DK"], "43": ["Austria", "AT"],
  "41": ["Switzerland", "CH"], "40": ["Romania", "RO"], "39": ["Italy", "IT"],
  "36": ["Hungary", "HU"], "34": ["Spain", "ES"], "33": ["France", "FR"],
  "32": ["Belgium", "BE"], "31": ["Netherlands", "NL"], "30": ["Greece", "GR"],
  "27": ["South Africa", "ZA"], "20": ["Egypt", "EG"], "49": ["Germany", "DE"],
  "44": ["UK", "GB"], "98": ["Iran", "IR"], "1": ["USA/Canada", "US"],
}

function parseCountry(num: string): { country: string; flag: string; countryCode: string } {
  const clean = String(num).replace(/^\+/, "")
  for (const pfx of Object.keys(PREFIX_MAP).sort((a, b) => b.length - a.length)) {
    if (clean.startsWith(pfx)) {
      const [country, code] = PREFIX_MAP[pfx]
      const flag = code.split("").map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("")
      return { country, flag, countryCode: code }
    }
  }
  return { country: `Unknown (+${clean.slice(0, 3)})`, flag: "🌍", countryCode: "XX" }
}

// In-memory cache
let LAMIX_CACHE: any[] = []
let PURPLE_CACHE: any[] = []
let lastFetch = 0
let fetching = false

// Rolling history for CLI stats
interface Mini { id: string; cli: string; panel: string; ms: number; content: string; range: string }
let HISTORY: Mini[] = []
const SEEN = new Set<string>()

async function doFetch() {
  if (fetching) return
  fetching = true
  lastFetch = Date.now()
  try {
    await Promise.all([
      axios.get(`https://panel.lamix.org/api/v1/messages?limit=${FETCH_RECORDS}`, {
        headers: { Authorization: `Bearer ${LAMIX_TOKEN}`, Accept: "application/json" },
        timeout: 8000,
      }).then(r => {
        if (Array.isArray(r.data?.records)) {
          LAMIX_CACHE = r.data.records.map((x: any) => ({
            panel: "lamix", time: x.time || "", number: x.number || "",
            content: x.content || "", cli: x.cli || "", payout: parseFloat(x.payout || x.rate || "0"),
            range: x.range || "",
          }))
        }
      }).catch(() => {}),
      axios.get(`${PURPLE_URL}?token=${PURPLE_TOKEN}&records=${FETCH_RECORDS}`, {
        timeout: 8000,
      }).then(r => {
        if (String(r.data?.status).toLowerCase() === "success" && Array.isArray(r.data?.data)) {
          PURPLE_CACHE = r.data.data.map((x: any) => ({
            panel: "purple", time: x.datetime || "", number: x.number || "",
            content: x.message || "", cli: x.cli || "", payout: parseFloat(x.payout || x.cost || "0"),
            range: x.country || "",
          }))
        }
      }).catch(() => {}),
    ])
  } finally {
    fetching = false
  }
}

// ── Supabase: auto-save new SMS ──────────────────────────────────────────────
const SUPABASE_URL = "https://owvgnnhayikisrehjkfz.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dmdubmhheWlraXNyZWhqa2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwOTE1MywiZXhwIjoyMTA0MTg1MTUzfQ.gglfJOcCy_-lZuJKTRoZ-4_cHd0klfz3OT5xPy8QKww"
const SUPABASE_SEEN = new Set<string>()
let supabaseReady = false

async function saveToSupabase(rows: any[]) {
  if (!rows.length) return
  try {
    const res = await axios.post(
      `${SUPABASE_URL}/rest/v1/announcements`,
      rows,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        timeout: 5000,
      }
    )
  } catch {}
}

export async function GET() {
  const now = Date.now()
  if (now - lastFetch > 1000 && !fetching) doFetch()

  const raw = [...LAMIX_CACHE, ...PURPLE_CACHE]
  const sms = raw.map(r => {
    const num = String(r.number).replace(/^\+/, "")
    const geo = parseCountry(num)
    const id = `${r.panel}-${r.time}-${num}-${r.cli}`
    const ms = new Date((r.time || "").replace(" ", "T")).getTime() || now
    return { id, panel: r.panel, cli: r.cli, country: geo.country, countryCode: geo.countryCode, flag: geo.flag, number: num, content: r.content, payout: r.payout, receivedAt: ms }
  })

  // Build rolling stats + auto-save new SMS to Supabase
  const newForSupabase: any[] = []

  sms.forEach(s => {
    if (!SEEN.has(s.id)) {
      SEEN.add(s.id)
      HISTORY.push({ id: s.id, cli: s.cli, panel: s.panel, ms: s.receivedAt, content: s.content, range: s.country })

      // Queue for Supabase (skip first boot to avoid mass-insert of old data)
      if (supabaseReady && !SUPABASE_SEEN.has(s.id)) {
        SUPABASE_SEEN.add(s.id)
        newForSupabase.push({
          platform: s.panel,
          cli: s.cli,
          country: s.country,
          number: s.number,
          content: s.content,
          is_new_cli: false,
          raw_text: `${s.panel.toUpperCase()} | CLI: ${s.cli} | ${s.country} | ${s.content}`,
        })
      }
    }
  })

  // After first successful data load, mark ready so future NEW sms get saved
  if (!supabaseReady && sms.length > 0) supabaseReady = true

  // Save new SMS to Supabase in background (don't await — zero latency)
  if (newForSupabase.length > 0) saveToSupabase(newForSupabase)

  const cut5h = now - 5 * 3600000
  HISTORY = HISTORY.filter(h => h.ms >= cut5h)

  const buildStats = (cutMs: number) => {
    const m: Record<string, { count: number; panel: string; content: string; range: string }> = {}
    HISTORY.filter(h => h.ms >= cutMs).forEach(h => {
      if (!m[h.cli]) m[h.cli] = { count: 0, panel: h.panel, content: h.content, range: h.range }
      m[h.cli].count++
      m[h.cli].content = h.content
    })
    return Object.entries(m).map(([cli, v]) => ({ cli, ...v })).sort((a, b) => b.count - a.count)
  }

  const rollingStats = {
    hourly: buildStats(now - 3600000),
    fourHourly: buildStats(now - 4 * 3600000),
    daily: buildStats(now - 24 * 3600000),
  }

  return NextResponse.json({ success: true, sms, rollingStats })
}
