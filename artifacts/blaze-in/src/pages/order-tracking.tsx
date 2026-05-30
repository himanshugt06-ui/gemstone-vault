import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, Clock, XCircle, ArrowLeft, Package, CreditCard, Phone, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

const METHOD_LABELS: Record<string, string> = {
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
  emi: "EMI",
  upi: "UPI",
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Check; color: string; bg: string }> = {
  captured: { label: "Payment Successful", icon: Check, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  authorized: { label: "Payment Authorised", icon: Clock, color: "text-accent", bg: "bg-accent/10 border-accent/30" },
  created: { label: "Payment Initiated", icon: Clock, color: "text-accent", bg: "bg-accent/10 border-accent/30" },
  failed: { label: "Payment Failed", icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  refunded: { label: "Refunded", icon: Check, color: "text-neutral-400", bg: "bg-neutral-400/10 border-neutral-400/30" },
};

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string;
  order_id: string;
  created_at: number;
  email?: string;
  contact?: string;
}

export default function OrderTracking() {
  const [, setLocation] = useLocation();
  const [paymentId, setPaymentId] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Pre-fill from URL param ?pid=pay_xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("pid");
    if (pid) {
      setPaymentId(pid);
      fetchPayment(pid);
    }
  }, []);

  async function fetchPayment(id: string) {
    const trimmed = id.trim();
    if (!trimmed) return;
    setState("loading");
    setErrorMsg("");
    setPayment(null);
    try {
      const res = await fetch(`${BASE}/api/razorpay/payment/${encodeURIComponent(trimmed)}`);
      const data = await res.json() as PaymentData & { error?: string };
      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error ?? "Payment not found.");
        return;
      }
      setPayment(data);
      setState("found");
    } catch {
      setState("error");
      setErrorMsg("Could not connect to server. Please try again.");
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayment(paymentId);
  };

  const statusInfo = payment ? (STATUS_CONFIG[payment.status] ?? STATUS_CONFIG["created"]) : null;

  return (
    <div className="min-h-screen bg-black text-foreground font-sans">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)" }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-border py-5">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-xl font-display font-semibold tracking-widest text-primary">BLAZE.IN</div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-accent mb-4">Blaze.in</p>
            <h1 className="text-4xl md:text-5xl font-display text-primary mb-4">Track your order</h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              Enter your Razorpay payment ID to view order status.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            onSubmit={handleSearch}
            className="flex gap-3 mb-12"
          >
            <Input
              value={paymentId}
              onChange={e => setPaymentId(e.target.value)}
              placeholder="pay_xxxxxxxxxxxxxxxx"
              className="flex-1 bg-card border-border h-14 rounded-none font-mono text-sm tracking-wider focus-visible:ring-accent focus-visible:border-accent placeholder:text-muted-foreground/40"
              data-testid="input-payment-id"
            />
            <Button
              type="submit"
              disabled={state === "loading" || !paymentId.trim()}
              className="h-14 w-14 rounded-none bg-primary text-primary-foreground hover:bg-white disabled:opacity-40 flex-shrink-0"
              data-testid="button-track"
            >
              {state === "loading"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Search className="w-4 h-4" />
              }
            </Button>
          </motion.form>

          {/* Results */}
          <AnimatePresence mode="wait">

            {/* Error */}
            {state === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border border-red-400/20 bg-red-400/5 p-6 flex items-start gap-4"
                data-testid="tracking-error"
              >
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm uppercase tracking-widest mb-1">Not Found</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{errorMsg}</p>
                </div>
              </motion.div>
            )}

            {/* Payment Found */}
            {state === "found" && payment && statusInfo && (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
                data-testid="tracking-result"
              >
                {/* Status Card */}
                <div className={`border p-6 flex items-center gap-5 ${statusInfo.bg}`}>
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0 ${statusInfo.bg}`}>
                    <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
                  </div>
                  <div>
                    <p className={`text-sm uppercase tracking-widest font-sans ${statusInfo.color}`}>{statusInfo.label}</p>
                    <p className="text-muted-foreground/60 text-[11px] mt-1 font-mono">{payment.id}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-2xl font-display text-primary">{inr(payment.amount)}</p>
                    <p className="text-muted-foreground/60 text-[10px] uppercase tracking-widest mt-1">{payment.currency}</p>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="border border-border bg-card p-6 space-y-5">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">Order Details</p>

                  <div className="space-y-4">
                    {[
                      {
                        icon: Package,
                        label: "Order ID",
                        value: payment.order_id || "—",
                        mono: true,
                      },
                      {
                        icon: CreditCard,
                        label: "Payment Method",
                        value: METHOD_LABELS[payment.method] ?? payment.method ?? "—",
                        mono: false,
                      },
                      {
                        icon: Clock,
                        label: "Date & Time",
                        value: payment.created_at
                          ? new Date(payment.created_at * 1000).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—",
                        mono: false,
                      },
                      ...(payment.email ? [{ icon: Mail, label: "Email", value: payment.email, mono: false }] : []),
                      ...(payment.contact ? [{ icon: Phone, label: "Contact", value: payment.contact, mono: false }] : []),
                    ].map((row, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 border border-border flex items-center justify-center flex-shrink-0">
                          <row.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-4">
                          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{row.label}</span>
                          <span className={`text-xs text-primary text-right break-all ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {payment.description && (
                  <div className="border border-border p-5">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Items</p>
                    <p className="text-sm text-primary leading-relaxed">{payment.description}</p>
                  </div>
                )}

                {/* Status Steps */}
                <div className="border border-border p-6">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">Fulfilment Status</p>
                  <div className="space-y-4">
                    {[
                      { label: "Order Placed", done: true },
                      { label: "Payment Confirmed", done: payment.status === "captured" },
                      { label: "Processing & Packing", done: payment.status === "captured" },
                      { label: "Shipped", done: false },
                      { label: "Delivered", done: false },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          step.done ? "border-accent bg-accent/20" : "border-border"
                        }`}>
                          {step.done && <div className="w-2 h-2 rounded-full bg-accent" />}
                        </div>
                        <span className={`text-xs uppercase tracking-widest ${step.done ? "text-primary" : "text-muted-foreground/50"}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Help */}
                <p className="text-center text-muted-foreground/50 text-[11px] uppercase tracking-widest pt-2">
                  Need help?{" "}
                  <a href="mailto:support@blaze.in" className="text-accent hover:underline">
                    Contact support
                  </a>
                </p>
              </motion.div>
            )}

            {/* Empty state */}
            {state === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 border border-border flex items-center justify-center mx-auto mb-6">
                  <Package className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground/50 text-xs uppercase tracking-widest">
                  Your payment ID was sent to your email after checkout
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
