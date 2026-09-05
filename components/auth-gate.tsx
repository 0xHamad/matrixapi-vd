"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, CheckCircle2, Eye, EyeOff, Fingerprint, Lock, SatelliteDish, ShieldCheck, User } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

const signals = ["Live carrier intelligence", "Encrypted operator workspace", "Decision-ready in seconds"]

export function AuthGate() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    window.setTimeout(() => {
      if (!login(username.trim(), password)) {
        setError(true)
        setShake(true)
        window.setTimeout(() => setShake(false), 450)
      }
      setLoading(false)
    }, 420)
  }

  return (
    <main className="app-surface relative min-h-screen overflow-hidden px-4 py-6 sm:px-8 lg:px-12">
      <div className="starfield" aria-hidden />
      <div className="aurora" aria-hidden><span /><span /><span /></div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <section className="hidden min-h-[680px] flex-col justify-between border-r border-white/10 p-10 lg:flex xl:p-14">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-[var(--app-accent)] ring-1 ring-blue-400/30"><SatelliteDish className="h-5 w-5" /></div>
              <span className="text-sm font-semibold tracking-[0.22em] text-app-strong">SMS INTELLIGENCE</span>
            </div>
            <div>
              <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-accent)]"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Mission control for modern messaging</p>
              <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.05em] text-app-strong xl:text-6xl">See the signal<br /><span className="gradient-text">before it moves.</span></h1>
              <p className="mt-6 max-w-md text-base leading-7 text-app-muted">A focused command layer for live SMS operations, carrier patterns, and the decisions that matter next.</p>
              <div className="mt-10 grid gap-3">{signals.map((signal) => <div key={signal} className="flex items-center gap-3 text-sm text-app-text"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {signal}</div>)}</div>
            </div>
            <div className="flex items-center justify-between text-xs text-app-muted"><span>Private operator network</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> All systems nominal</span></div>
          </section>

          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className={`flex min-h-[680px] flex-col justify-center p-7 sm:p-12 lg:p-14 ${shake ? "shake" : ""}`}>
            <div className="mb-10 lg:hidden"><div className="mb-8 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-[var(--app-accent)] ring-1 ring-blue-400/30"><SatelliteDish className="h-5 w-5" /></div><span className="text-sm font-semibold tracking-[0.18em] text-app-strong">SMS INTELLIGENCE</span></div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-accent)]">Mission control for modern messaging</p></div>
            <div className="mb-8"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-[var(--app-accent)] ring-1 ring-white/10"><Fingerprint className="h-6 w-6" /></div><h2 className="text-3xl font-semibold tracking-[-0.04em] text-app-strong">Welcome back, operator.</h2><p className="mt-2 text-sm leading-6 text-app-muted">Authenticate to enter your private intelligence workspace.</p></div>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Operator ID" icon={<User className="h-4 w-4" />}><input value={username} onChange={(e) => { setUsername(e.target.value); setError(false) }} placeholder="Enter your operator ID" autoComplete="username" className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted" required /></Field>
              <Field label="Access key" icon={<Lock className="h-4 w-4" />}><input type={show ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(false) }} placeholder="Enter your access key" autoComplete="current-password" className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted" required /><button type="button" onClick={() => setShow((s) => !s)} className="text-app-muted transition-colors hover:text-app-strong" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></Field>
              {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-[var(--app-danger)]">Access denied. Check your credentials and try again.</motion.p>}
              <button type="submit" disabled={loading} className="btn-premium mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70">{loading ? "Verifying secure access…" : "Enter intelligence workspace"}{!loading && <ArrowUpRight className="h-4 w-4" />}</button>
            </form>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-app-muted"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Protected operator access · Session encrypted</div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-app-muted">{label}</span><div className="field flex items-center gap-3 px-4 py-3.5"><span className="text-app-muted">{icon}</span>{children}</div></label>
}
