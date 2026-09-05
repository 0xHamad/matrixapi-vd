import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_KEY!
  return createClient(url, key)
}

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit
    const platform = searchParams.get("platform") || null
    const search = searchParams.get("search") || null

    const supabase = getSupabase()
    let query = supabase
      .from("announcements")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (platform) query = query.eq("platform", platform)
    if (search) query = query.or(`cli.ilike.%${search}%,content.ilike.%${search}%,country.ilike.%${search}%`)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [], total: count || 0, page, limit })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabase()

    const { data, error } = await supabase.from("announcements").insert([{
      platform: body.platform || "lamix",
      cli: body.cli || "",
      country: body.country || "",
      number: body.number || "",
      content: body.content || "",
      is_new_cli: body.is_new_cli || false,
      raw_text: body.raw_text || "",
    }]).select().single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
