import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple middleware to protect API routes
export function middleware(req: NextRequest) {
  // Only protect /api routes that are not /api/auth
  if (req.nextUrl.pathname.startsWith("/api/") && !req.nextUrl.pathname.startsWith("/api/auth")) {
    const sessionCookie = req.cookies.get("matrix_session")
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
