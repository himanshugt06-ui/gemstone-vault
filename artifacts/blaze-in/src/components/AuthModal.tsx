import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = "signin" | "signup";

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url =
      tab === "signin"
        ? `${BASE}/api/auth/login`
        : `${BASE}/api/auth/signup`;

    const body =
      tab === "signin"
        ? { email, password }
        : { email, password, firstName: firstName.trim() || undefined };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { user?: unknown; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        onSuccess();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = `${BASE}/api/auth/google?returnTo=/`;
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90]"
        />
        <motion.div
          key="auth-modal"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed inset-x-4 top-[8vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-[#0a0a0a] border border-border z-[100] p-8"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Brand */}
          <p className="text-[10px] uppercase tracking-[0.5em] text-accent mb-1">
            Blaze.in
          </p>
          <h2 className="text-2xl font-display text-primary mb-6">
            {tab === "signin" ? "Welcome back" : "Join the collection"}
          </h2>

          {/* Tabs */}
          <div className="flex border border-border mb-6">
            <button
              onClick={() => switchTab("signin")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-widest transition-colors ${
                tab === "signin"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <LogIn className="w-3 h-3" /> Sign In
            </button>
            <button
              onClick={() => switchTab("signup")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-widest transition-colors ${
                tab === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <UserPlus className="w-3 h-3" /> Sign Up
            </button>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-border hover:border-primary/60 text-muted-foreground hover:text-primary py-3 transition-colors mb-6 text-[11px] uppercase tracking-widest"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Name
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-none bg-background border-border h-11 text-sm focus-visible:ring-accent"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
                className="rounded-none bg-background border-border h-11 text-sm focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Password *
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  tab === "signup" ? "Min 6 characters" : "Your password"
                }
                required
                autoComplete={
                  tab === "signin" ? "current-password" : "new-password"
                }
                className="rounded-none bg-background border-border h-11 text-sm focus-visible:ring-accent"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[11px] uppercase tracking-widest">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none h-11 bg-primary text-primary-foreground hover:bg-white text-xs uppercase tracking-widest gap-2 mt-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {tab === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground/40 text-center mt-5 uppercase tracking-widest">
            {tab === "signin" ? (
              <>
                No account?{" "}
                <button
                  onClick={() => switchTab("signup")}
                  className="text-accent hover:text-white transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already a member?{" "}
                <button
                  onClick={() => switchTab("signin")}
                  className="text-accent hover:text-white transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
