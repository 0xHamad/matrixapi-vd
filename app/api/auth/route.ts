import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { cookies } from "next/headers"

const DB_PATH = path.join(process.cwd(), "data", "auth.json")

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = {
        users: {
          Ziv: { password: "Ziv" }, Pro: { password: "Pro" }, Elite: { password: "Elite" },
          AHM: { password: "AHM" }, UTS: { password: "UTS" }, Yasha: { password: "Yasha" },
          Issue: { password: "Issue" }, Xoxo: { password: "Xoxo" }, HAMAD: { password: "HAMAD" }
        },
        sessions: {}
      }
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2))
      return initial
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8")
    return JSON.parse(raw)
  } catch (err) {
    return { users: {}, sessions: {} }
  }
}

function writeDb(data: any) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  } catch (err) {}
}

// Helper to clean up expired sessions (older than 7 days)
function cleanSessions(db: any) {
  const now = Date.now()
  let changed = false
  for (const sid in db.sessions) {
    if (now - db.sessions[sid].createdAt > 7 * 24 * 3600 * 1000) {
      delete db.sessions[sid]
      changed = true
    }
  }
  return changed
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body
    const db = readDb()
    let changed = cleanSessions(db)

    if (action === "login") {
      const { username, password } = body
      const user = db.users[username]
      if (!user || user.password !== password) {
        return NextResponse.json({ success: false, error: "Invalid credentials" })
      }

      // Check device limit
      const userSessions = Object.values(db.sessions).filter((s: any) => s.username === username)
      if (userSessions.length >= 2) {
        return NextResponse.json({ success: false, error: "Max 2 devices allowed. Please logout from another device." })
      }

      // Create session
      const sid = crypto.randomBytes(32).toString("hex")
      db.sessions[sid] = { username, createdAt: Date.now() }
      writeDb(db)

      const res = NextResponse.json({ success: true, username })
      res.cookies.set("matrix_session", sid, {
        httpOnly: true,
        secure: false, // Fix: Must be false for HTTP IP addresses, otherwise browser rejects it
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 3600 // 7 days
      })
      return res
    }

    if (action === "logout") {
      const cookieStore = cookies()
      const sid = cookieStore.get("matrix_session")?.value
      if (sid && db.sessions[sid]) {
        delete db.sessions[sid]
        writeDb(db)
      }
      const res = NextResponse.json({ success: true })
      res.cookies.delete("matrix_session")
      return res
    }

    if (action === "change_password") {
      const cookieStore = cookies()
      const sid = cookieStore.get("matrix_session")?.value
      if (!sid || !db.sessions[sid]) {
        return NextResponse.json({ success: false, error: "Not logged in" })
      }

      const { currentPassword, newPassword } = body
      const username = db.sessions[sid].username
      
      if (db.users[username].password !== currentPassword) {
        return NextResponse.json({ success: false, error: "Incorrect current password" })
      }

      db.users[username].password = newPassword
      writeDb(db)
      return NextResponse.json({ success: true })
    }

    if (action === "me") {
      const cookieStore = cookies()
      const sid = cookieStore.get("matrix_session")?.value
      if (!sid || !db.sessions[sid]) {
        return NextResponse.json({ success: false })
      }
      return NextResponse.json({ success: true, username: db.sessions[sid].username })
    }

    return NextResponse.json({ success: false, error: "Invalid action" })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Server error" })
  }
}
