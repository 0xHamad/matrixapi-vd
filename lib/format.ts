import { formatDistanceToNowStrict } from "date-fns"

export function relativeTime(at: number): string {
  const diff = Date.now() - at
  if (diff < 15_000) return "just now"
  return formatDistanceToNowStrict(at, { addSuffix: true })
}

export function fullTime(at: number): string {
  return new Date(at).toUTCString()
}

export function maskNumber(num: string): string {
  const clean = num.replace(/\s+/g, "")
  if (clean.length <= 7) return clean
  return `${clean.slice(0, 4)}***${clean.slice(-3)}`
}

export function euro(n: number): string {
  return `€${n.toFixed(4)}`
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    throw new Error("clipboard api not available")
  } catch {
    try {
      const el = document.createElement("textarea")
      el.value = text
      el.setAttribute("readonly", "")
      el.style.position = "absolute"
      el.style.left = "-9999px"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      return true
    } catch {
      return false
    }
  }
}
