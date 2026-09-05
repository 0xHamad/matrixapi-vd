import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { AppFrame } from "@/components/app-frame"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "SMS Intelligence — Real-time SMS Monitoring Dashboard",
  description:
    "Ultra-professional SMS intelligence dashboard. Live feed, Lamix & Purple panels, active CLI leaderboards, and Telegram announcements.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#05060c",
  userScalable: false,
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased app-theme-root app-surface grain min-h-screen`}>
        <div className="starfield" aria-hidden />
        <div className="scanlines" aria-hidden />
        <ThemeProvider>
          <AuthProvider>
            <AppFrame>{children}</AppFrame>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
