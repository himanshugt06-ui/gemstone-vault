import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import type { OrderItem } from "@workspace/db";

const router: IRouter = Router();

// ── Resend email helper ────────────────────────────────────────────────────────

function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function buildOrderEmailHtml(params: {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  razorpayPaymentId: string;
}): string {
  const { orderId, items, totalAmount, razorpayPaymentId } = params;

  const itemRows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #222;font-size:13px;color:#c9a96e;">${it.name ?? "Item"}</td>
        <td style="padding:10px 0;border-bottom:1px solid #222;font-size:13px;color:#888;text-align:center;">${it.qty ?? 1}</td>
        <td style="padding:10px 0;border-bottom:1px solid #222;font-size:13px;color:#c9a96e;text-align:right;">${inr((it.price ?? 0) * (it.qty ?? 1))}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Order Confirmed — Blaze.in</title></head>
<body style="margin:0;padding:0;background:#000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1e1e1e;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:40px 40px 24px;border-bottom:1px solid #1e1e1e;text-align:center;">
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#c9a96e;">Underground Luxury Jewellery</p>
            <h1 style="margin:0;font-size:28px;font-weight:300;letter-spacing:0.1em;color:#f5f5f0;">BLAZE.IN</h1>
          </td>
        </tr>

        <!-- Hero message -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #1e1e1e;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#c9a96e;">Order Confirmed</p>
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:300;color:#f5f5f0;">Thank you for your order.</h2>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.7;">
              Your piece is being prepared with care. We'll notify you once it ships.
            </p>
          </td>
        </tr>

        <!-- Order meta -->
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid #1e1e1e;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#555;">Order ID</td>
                <td style="font-size:12px;color:#c9a96e;text-align:right;font-family:monospace;">#${orderId}</td>
              </tr>
              <tr><td style="height:10px;"></td></tr>
              <tr>
                <td style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#555;">Payment ID</td>
                <td style="font-size:12px;color:#888;text-align:right;font-family:monospace;">${razorpayPaymentId}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items -->
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid #1e1e1e;">
            <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#555;">Items</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#555;font-weight:400;text-align:left;padding-bottom:8px;">Piece</th>
                <th style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#555;font-weight:400;text-align:center;padding-bottom:8px;">Qty</th>
                <th style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#555;font-weight:400;text-align:right;padding-bottom:8px;">Amount</th>
              </tr>
              ${itemRows}
            </table>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td style="padding:20px 40px;border-bottom:1px solid #1e1e1e;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.25em;">Total Paid</td>
                <td style="font-size:20px;color:#c9a96e;text-align:right;font-weight:300;">${inr(totalAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Track CTA -->
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:1px solid #1e1e1e;">
            <a href="https://blaze.in/track" style="display:inline-block;padding:14px 36px;border:1px solid #c9a96e;color:#c9a96e;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;text-decoration:none;">
              TRACK MY ORDER
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#444;line-height:1.6;">
              Questions? Reply to this email or contact us at support@blaze.in<br>
              <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">© ${new Date().getFullYear()} Blaze.in — Limited pieces. Unlimited expression.</span>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  razorpayPaymentId: string;
  log: { warn: (obj: object, msg: string) => void; info: (obj: object, msg: string) => void };
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip — not configured

  const from = process.env.FROM_EMAIL ?? "Blaze.in <onboarding@resend.dev>";
  const html = buildOrderEmailHtml(params);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: `Order Confirmed — Blaze.in #${params.orderId}`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      params.log.warn({ status: res.status, body }, "Resend email delivery failed");
    } else {
      params.log.info({ to: params.to, orderId: params.orderId }, "Order confirmation email sent");
    }
  } catch (err) {
    params.log.warn({ err }, "Resend email request threw");
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────────

router.post("/orders", async (req, res) => {
  const { razorpayPaymentId, razorpayOrderId, totalAmount, email, contact, items } = req.body as {
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    totalAmount?: unknown;
    email?: string;
    contact?: string;
    items?: OrderItem[];
  };

  if (!razorpayPaymentId || !razorpayOrderId || typeof totalAmount !== "number" || !Array.isArray(items)) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const userId = req.isAuthenticated() ? req.user.id : undefined;

  try {
    const [order] = await db
      .insert(ordersTable)
      .values({
        razorpayPaymentId,
        razorpayOrderId,
        userId,
        email: email ?? null,
        contact: contact ?? null,
        totalAmount,
        items: items as unknown as Record<string, unknown>[],
        status: "paid",
      })
      .returning();

    res.status(201).json(order);

    // Send confirmation email fire-and-forget (after response sent)
    if (email) {
      void sendOrderConfirmationEmail({
        to: email,
        orderId: String(order.id),
        items,
        totalAmount,
        razorpayPaymentId,
        log: req.log,
      });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to save order");
    res.status(500).json({ error: "Failed to save order" });
  }
});

router.get("/orders", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(200);
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Failed to list orders" });
  }
});

router.patch("/orders/:id/ship", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  if (!adminEmail || req.user.email?.toLowerCase() !== adminEmail) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  try {
    const [order] = await db
      .update(ordersTable)
      .set({ status: "shipped" })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to ship order");
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
