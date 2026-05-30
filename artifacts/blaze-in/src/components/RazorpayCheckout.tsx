import { useState, useCallback } from "react";
import { ShoppingCart, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface RazorpayCheckoutProps {
  items: CartItem[];
  onSuccess: (paymentId: string) => void;
  className?: string;
  label?: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function RazorpayCheckout({ items, onSuccess, className = "", label = "Proceed to Checkout" }: RazorpayCheckoutProps) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const totalPaise = items.reduce((s, i) => s + i.price * i.qty, 0) * 100;

  const handleCheckout = useCallback(async () => {
    if (items.length === 0) return;
    setState("loading");
    setErrorMsg("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setState("error");
      setErrorMsg("Could not load payment gateway. Check your connection.");
      return;
    }

    try {
      const [orderRes, keyRes] = await Promise.all([
        fetch(`${BASE}/api/razorpay/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalPaise,
            currency: "INR",
            receipt: `order_${Date.now()}`,
          }),
        }),
        fetch(`${BASE}/api/razorpay/key`),
      ]);

      if (!orderRes.ok || !keyRes.ok) throw new Error("Server error creating order");

      const order = await orderRes.json() as { id: string; amount: number; currency: string };
      const { key_id } = await keyRes.json() as { key_id: string };

      const description = items.map(i => `${i.name} x${i.qty}`).join(", ");

      const rzp = new window.Razorpay({
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "BLAZE.IN",
        description,
        order_id: order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${BASE}/api/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json() as { success: boolean };
            if (verifyData.success) {
              setState("success");
              onSuccess(response.razorpay_payment_id);
            } else {
              setState("error");
              setErrorMsg("Payment verification failed. Contact support.");
            }
          } catch {
            setState("error");
            setErrorMsg("Payment verification error. Contact support.");
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => {
            if (state !== "success") setState("idle");
          },
        },
      });

      rzp.open();
      setState("idle");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Payment failed. Try again.");
    }
  }, [items, totalPaise, onSuccess, state]);

  if (state === "success") {
    return (
      <div className={`flex items-center justify-center gap-2 h-14 border border-accent/50 bg-accent/10 text-accent text-xs uppercase tracking-widest ${className}`}>
        <Check className="w-4 h-4" /> Payment Successful
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        onClick={handleCheckout}
        disabled={state === "loading" || items.length === 0}
        className="w-full h-14 rounded-none bg-primary text-primary-foreground hover:bg-white uppercase tracking-widest text-xs font-sans disabled:opacity-50"
        data-testid="button-razorpay-checkout"
      >
        {state === "loading" ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            {label}
          </span>
        )}
      </Button>
      {state === "error" && (
        <div className="flex items-center gap-2 text-red-400 text-[11px] uppercase tracking-wider px-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
