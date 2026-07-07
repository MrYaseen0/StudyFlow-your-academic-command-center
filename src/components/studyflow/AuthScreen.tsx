"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { GraduationCap, Mail, Lock, User as UserIcon, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { DrawBooks, DrawClock } from "./Drawings";

type Mode = "login" | "register";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Hero header with campus photo */}
          <div
            className="relative rounded-card overflow-hidden mb-6 shadow-warm-lg"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(201,116,138,0.82) 0%, rgba(46,36,32,0.62) 100%), url('/user-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="px-6 py-8 text-center text-white relative">
              <motion.div
                className="absolute top-3 right-4 opacity-35"
                animate={{ y: [0, -5, 0], rotate: [0, 4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <DrawClock size={48} />
              </motion.div>
              <motion.div
                className="absolute bottom-3 left-4 opacity-35"
                animate={{ y: [0, 4, 0], rotate: [0, -3, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <DrawBooks size={52} />
              </motion.div>
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <GraduationCap size={24} color="#ffffff" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold mb-1 text-white" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
                StudyFlow
              </h1>
              <p className="text-xs text-white/80">your academic command center</p>
            </div>
          </div>

          {/* Auth card */}
          <div className="rounded-card bg-white border border-border-soft shadow-warm p-6">
            {/* mode toggle */}
            <div className="flex rounded-pill p-1 mb-5" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="flex-1 rounded-pill py-1.5 text-sm font-medium transition-all"
                style={mode === "login"
                  ? { backgroundColor: "#fff", color: "var(--color-blush-deep)", boxShadow: "var(--shadow-warm)" }
                  : { color: "var(--color-ink-muted)" }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="flex-1 rounded-pill py-1.5 text-sm font-medium transition-all"
                style={mode === "register"
                  ? { backgroundColor: "#fff", color: "var(--color-blush-deep)", boxShadow: "var(--shadow-warm)" }
                  : { color: "var(--color-ink-muted)" }}
              >
                Create account
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-xs text-ink-muted mb-5">
                  {mode === "login"
                    ? "Sign in with the credentials you registered with."
                    : "Register to track deadlines, attendance & grades."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === "register" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink-secondary">Full name</label>
                      <div className="relative">
                        <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          className="w-full h-10 rounded-md border border-border-soft bg-cream-base pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-secondary">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@university.edu"
                        required
                        autoComplete="email"
                        className="w-full h-10 rounded-md border border-border-soft bg-cream-base pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-secondary">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                        required
                        minLength={mode === "register" ? 6 : 1}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        className="w-full h-10 rounded-md border border-border-soft bg-cream-base pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 rounded-md p-2.5 text-xs"
                      style={{ backgroundColor: "rgba(184, 80, 106, 0.08)", color: "var(--color-rose-urgent)" }}
                    >
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-pill text-sm font-semibold text-white transition-all hover:shadow-warm disabled:opacity-60 inline-flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--color-blush-deep)" }}
                  >
                    {submitting ? (
                      <><Loader2 size={15} className="animate-spin" /> Please wait…</>
                    ) : (
                      <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></>
                    )}
                  </button>
                </form>

                <p className="text-center text-[11px] text-ink-muted mt-4">
                  {mode === "login" ? (
                    <>No account yet?{" "}
                      <button type="button" onClick={() => switchMode("register")} className="font-medium text-blush-deep hover:text-rose-urgent">Register</button>
                    </>
                  ) : (
                    <>Already registered?{" "}
                      <button type="button" onClick={() => switchMode("login")} className="font-medium text-blush-deep hover:text-rose-urgent">Sign in</button>
                    </>
                  )}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-[11px] text-ink-muted mt-4">
            Your data is encrypted &amp; tied to your account only.
          </p>
        </div>
      </div>
    </div>
  );
}
