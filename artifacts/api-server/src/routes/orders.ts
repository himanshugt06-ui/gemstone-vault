import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import type { OrderItem } from "@workspace/db";

const router: IRouter = Router();

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
