"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Check, Eye, EyeOff, Fingerprint, LockKeyhole, Radio, ShieldCheck, UserRound } from "lucide-react"
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
    <main className="app-surface relative min-h-screen overflow-hidden px-4 py-5 sm:px-8 lg:px-12">
      <div className="grid-backdrop absolute inset-0 opacity-40" aria-hidden />
      <div className="aurora" aria-hidden><span /><span /><span /></div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1260px] flex-col">
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3"><div className="brand-mark"><Radio className="h-[18px] w-[18px]" /></div><span className="text-[11px] font-bold uppercase tracking-[0.28em] text-app-strong">SMS Intelligence</span></div>
          <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-app-muted sm:flex"><span className="live-dot" /> Secure operator access</div>
        </header>

        <div className="my-auto grid w-full overflow-hidden rounded-[32px] border border-white/[0.12] bg-[rgba(9,12,22,0.76)] shadow-[0_32px_100px_-35px_rgba(0,0,0,0.9)] backdrop-blur-2xl lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative hidden min-h-[650px] overflow-hidden border-r border-white/[0.1] p-10 lg:flex lg:flex-col lg:justify-between xl:p-16">
            <div className="relative z-10"><div className="mb-16 flex items-center gap-3"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-app-muted">Private network</span><span className="h-px w-12 bg-white/15" /></div><p className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--app-accent)]"><span className="live-dot" /> Mission control for modern messaging</p><h1 className="max-w-[590px] text-5xl font-semibold leading-[1.02] tracking-[-0.065em] text-app-strong xl:text-[68px]">See the signal<br /><span className="gradient-text">before it moves.</span></h1><p className="mt-7 max-w-[410px] text-[15px] leading-7 text-app-muted">A focused command layer for live SMS operations, carrier patterns, and the decisions that matter next.</p></div>
            <div className="relative z-10 space-y-3">{signals.map((signal) => <div key={signal} className="group flex items-center gap-3 text-sm text-app-text"><span className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[var(--app-accent)] transition-transform group-hover:scale-110"><Check className="h-3.5 w-3.5" /></span>{signal}</div>)}<div className="mt-10 flex items-center justify-between border-t border-white/10 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-app-muted"><span>v2.4.0 / private beta</span><span>All systems nominal</span></div></div>
            <div className="signal-orbit" aria-hidden><span /><span /><span /></div>
          </section>

          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className={`flex min-h-[650px] flex-col justify-center p-7 sm:p-12 lg:p-14 xl:p-16 ${shake ? "shake" : ""}`}>
            <div className="mb-10 lg:hidden"><div className="mb-8 flex items-center gap-3"><div className="brand-mark"><Radio className="h-[18px] w-[18px]" /></div><span className="text-[11px] font-bold uppercase tracking-[0.24em] text-app-strong">SMS Intelligence</span></div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--app-accent)]"><span className="live-dot" /> Private operator network</p></div>
            <div className="mb-9"><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-[var(--app-accent)] shadow-[0_10px_30px_rgba(50,150,255,0.12)]"><Fingerprint className="h-6 w-6" /></div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-app-muted">Operator authentication</p><h2 className="text-3xl font-semibold tracking-[-0.05em] text-app-strong">Welcome back.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-app-muted">Enter your credentials to continue to your private intelligence workspace.</p></div>
            <form onSubmit={onSubmit} className="space-y-5"><Field label="Operator ID" icon={<UserRound className="h-4 w-4" />}><input value={username} onChange={(e) => { setUsername(e.target.value); setError(false) }} placeholder="e.g. operator-042" autoComplete="username" className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted" required /></Field><Field label="Access key" icon={<LockKeyhole className="h-4 w-4" />}><input type={show ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(false) }} placeholder="Enter your access key" autoComplete="current-password" className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted" required /><button type="button" onClick={() => setShow((s) => !s)} className="text-app-muted transition-colors hover:text-app-strong" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></Field>{error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-[var(--app-danger)]">Access denied. Check your credentials and try again.</motion.p>}<button type="submit" disabled={loading} className="btn-premium mt-2 flex w-full items-center justify-between rounded-xl px-5 py-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"><span>{loading ? "Verifying secure access…" : "Enter intelligence workspace"}</span>{!loading && <ArrowRight className="h-4 w-4" />}</button></form>
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-app-muted"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Encrypted session · Zero-trust access</div>
          </motion.section>
        </div>
        <footer className="flex items-center justify-between py-5 text-[10px] uppercase tracking-[0.16em] text-app-muted"><span>Built for teams operating at signal speed</span><span className="hidden sm:block">© 2026 SMS Intelligence</span></footer>
      </div>
    </main>
  )
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <label className="block"><span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-app-muted">{label}</span><div className="field flex items-center gap-3 px-4 py-4"><span className="text-app-muted">{icon}</span>{children}</div></label>
}
