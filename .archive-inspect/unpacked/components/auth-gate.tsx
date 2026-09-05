"use client"

import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, SatelliteDish, User } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function AuthGate() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!login(username.trim(), password)) {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 450)
    }
  }

  return (
    <div className="app-surface relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="starfield" aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`glass-card relative z-10 w-full max-w-md p-8 ${shake ? "shake" : ""}`}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl accent-glow"
            style={{ color: "var(--app-accent)", background: "rgba(var(--app-accent-rgb),0.12)" }}
          >
            <SatelliteDish className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-app-strong">SMS Intelligence</h1>
          <p className="mt-1 text-sm text-app-muted">Restricted access · authorized operators only</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field icon={<User className="h-4 w-4" />}>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(false)
              }}
              placeholder="Username"
              autoComplete="username"
              className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted"
            />
          </Field>

          <Field icon={<Lock className="h-4 w-4" />}>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full bg-transparent text-sm text-app-strong outline-none placeholder:text-app-muted"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="text-app-muted transition-colors hover:text-app-strong"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-[var(--app-danger)]"
            >
              Invalid credentials
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl py-3 text-sm font-semibold text-black transition-transform active:scale-[0.98]"
            style={{ background: "var(--app-accent)", boxShadow: "var(--app-glow)" }}
          >
            Unlock Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
    >
      <span className="text-app-muted">{icon}</span>
      {children}
    </div>
  )
}
