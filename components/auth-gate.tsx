"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Eye, EyeOff, LockKeyhole, Radio, UserRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function AuthGate() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const res = await login(username.trim(), password)
    if (!res.success) {
      setErrorMsg(res.error || "Login failed")
      setShake(true)
      setTimeout(() => setShake(false), 450)
    }
    setLoading(false)
  }

  return (
    <main className="login-surface relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-8">
      <div className="login-grid absolute inset-0" aria-hidden="true" />
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className={`relative z-10 w-full max-w-[440px] ${shake ? "shake" : ""}`}
      >
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="login-brand-mark"><Radio className="h-5 w-5" /></div>
          <span className="text-[12px] font-bold uppercase tracking-[0.34em] text-app-strong">SMS Intelligence</span>
        </div>

        <section className="login-card rounded-[28px] p-6 sm:p-9">
          <div className="mb-8 flex justify-center">
            <div className="login-icon"><LockKeyhole className="h-5 w-5" /></div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Username" icon={<UserRound className="h-[18px] w-[18px]" />}>
              <input
                value={username}
                onChange={(event) => { setUsername(event.target.value); setErrorMsg("") }}
                autoComplete="username"
                className="w-full bg-transparent text-[15px] text-app-strong outline-none placeholder:text-app-muted"
                required
              />
            </Field>

            <Field label="Password" icon={<LockKeyhole className="h-[18px] w-[18px]" />}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => { setPassword(event.target.value); setErrorMsg("") }}
                autoComplete="current-password"
                className="w-full bg-transparent text-[15px] text-app-strong outline-none placeholder:text-app-muted"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="text-app-muted transition-colors hover:text-app-strong"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </Field>

            {errorMsg && <p className="text-center text-sm font-medium text-[var(--app-danger)]">{errorMsg}</p>}

            <button type="submit" disabled={loading} className="login-button mt-2 flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-70">
              <span>{loading ? "Signing in..." : "Sign in"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </section>
      </motion.div>
    </main>
  )
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-app-muted">{label}</span>
      <div className="login-field flex items-center gap-3 rounded-2xl px-4 py-4">
        <span className="text-app-muted">{icon}</span>
        {children}
      </div>
    </label>
  )
}
