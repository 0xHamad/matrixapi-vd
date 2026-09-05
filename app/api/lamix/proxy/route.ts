import { NextRequest, NextResponse } from "next/server"

const LAMIX_TOKEN = "PstOUlBGmW-wBvi1qZgO419BHEmL3oxU8lWR-bKfCBc"
const LAMIX_BASE = "https://panel.lamix.org/api/v1"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const targetPath = url.searchParams.get("path") || "messages"
    
    // Build the query string for the target API
    const targetUrl = new URL(`${LAMIX_BASE}/${targetPath}`)
    url.searchParams.forEach((val, key) => {
      if (key !== "path") targetUrl.searchParams.append(key, val)
    })

    const response = await fetch(targetUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${LAMIX_TOKEN}`,
        "Accept": "application/json"
      },
      next: { revalidate: 0 }
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ error: "internal_error", message: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const targetPath = url.searchParams.get("path")

    if (!targetPath) {
      return NextResponse.json({ error: "invalid_request", message: "Missing path parameter" }, { status: 400 })
    }

    const body = await req.json()
    
    const response = await fetch(`${LAMIX_BASE}/${targetPath}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LAMIX_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ error: "internal_error", message: error.message }, { status: 500 })
  }
}
