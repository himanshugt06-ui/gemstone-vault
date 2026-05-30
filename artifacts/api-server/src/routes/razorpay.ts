import { Router, type IRouter } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router: IRouter = Router();

const rzp = new Razorpay({
  key_id: process.env["RAZORPAY_KEY_ID"] ?? "",
  key_secret: process.env["RAZORPAY_KEY_SECRET"] ?? "",
});

router.post("/razorpay/order", async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body as {
    amount?: unknown;
    currency?: string;
    receipt?: string;
  };

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    res.status(400).json({ error: "amount must be a positive integer (paise)" });
    return;
  }

  try {
    const order = await rzp.orders.create({
      amount,
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
    });
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Razorpay order creation failed");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/razorpay/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const secret = process.env["RAZORPAY_KEY_SECRET"] ?? "";
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (expected === razorpay_signature) {
    res.json({ success: true, payment_id: razorpay_payment_id });
  } else {
    res.status(400).json({ success: false, error: "Signature verification failed" });
  }
});

router.get("/razorpay/key", (_req, res) => {
  const key = process.env["RAZORPAY_KEY_ID"] ?? "";
  if (!key) {
    res.status(500).json({ error: "Razorpay key not configured" });
    return;
  }
  res.json({ key_id: key });
});

router.get("/razorpay/payment/:paymentId", async (req, res) => {
  const { paymentId } = req.params as { paymentId: string };
  if (!paymentId || !paymentId.startsWith("pay_")) {
    res.status(400).json({ error: "Invalid payment ID format. Must start with pay_" });
    return;
  }
  try {
    const payment = await rzp.payments.fetch(paymentId);
    res.json({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      description: payment.description,
      order_id: payment.order_id,
      created_at: payment.created_at,
      email: payment.email,
      contact: payment.contact,
    });
  } catch (err) {
    req.log.error({ err }, "Razorpay payment fetch failed");
    res.status(404).json({ error: "Payment not found. Check your payment ID and try again." });
  }
});

export default router;
