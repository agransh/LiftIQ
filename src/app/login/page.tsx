"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { Zap, ArrowRight, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setMessage("Check your email for a confirmation link!");
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") void handleLogin();
    else void handleSignup();
  };

  const inp =
    "w-full h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-colors";

  return (
    <div className="noise min-h-[100dvh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[20%] h-[50vh] w-[50vh] rounded-full bg-cyan-500/[0.06] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[10%] h-[40vh] w-[40vh] rounded-full bg-blue-500/[0.04] blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Lift<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">IQ</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <GlassCard elevated className="p-6 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1.5 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    required
                    className={cn(inp, "pl-10 pr-4")}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={cn(inp, "pl-10 pr-4")}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                  required
                  minLength={6}
                  className={cn(inp, "pl-10 pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs text-rose-400">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-400">
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] rounded-xl text-base font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white transition-all hover:shadow-[0_0_32px_-4px_rgba(6,182,212,0.4)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setMessage("");
              }}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {mode === "login" ? (
                <>
                  Don&apos;t have an account? <span className="text-cyan-400 font-medium">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="text-cyan-400 font-medium">Sign in</span>
                </>
              )}
            </button>
          </div>
        </GlassCard>
        <p className="text-[10px] text-zinc-700 text-center mt-5">Your data is stored securely.</p>
      </motion.div>
    </div>
  );
}
