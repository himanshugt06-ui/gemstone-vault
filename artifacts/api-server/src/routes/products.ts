import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const SEED_PRODUCTS = [
  {
    name: "Eclipse Chain",
    description: "Heavy oxidised chain with matte black finish. Adjustable length.",
    price: 999,
    imageUrl: "/images/product-1.png",
    category: "chain",
    inStock: "true",
  },
  {
    name: "Phantom Cuff",
    description: "Open-ended architectural cuff. Unisex, one-size-fits-most.",
    price: 949,
    imageUrl: "/images/product-2.png",
    category: "cuff",
    inStock: "true",
  },
  {
    name: "Serpent Ring",
    description: "Coiled serpent signet ring. Sterling silver with antiqued finish.",
    price: 849,
    imageUrl: "/images/product-3.png",
    category: "ring",
    inStock: "true",
  },
  {
    name: "Neon Pendant",
    description: "Geometric pendant on a delicate box chain. Rhodium plated.",
    price: 799,
    imageUrl: "/images/product-4.png",
    category: "pendant",
    inStock: "true",
  },
  {
    name: "Void Ring",
    description: "Slim band with matte obsidian stone. Statement minimalism.",
    price: 699,
    imageUrl: "/images/product-5.png",
    category: "ring",
    inStock: "true",
  },
  {
    name: "Onyx Studs",
    description: "Black onyx stud earrings with surgical steel posts.",
    price: 499,
    imageUrl: "/images/product-6.png",
    category: "earring",
    inStock: "true",
  },
];

async function seedIfEmpty() {
  const existing = await db.select().from(productsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(productsTable).values(SEED_PRODUCTS);
  }
}

seedIfEmpty().catch(() => {});

router.get("/products", async (req, res) => {
  try {
    const { category } = req.query as { category?: string };
    let products;
    if (category && category !== "all") {
      products = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.category, category));
    } else {
      products = await db.select().from(productsTable);
    }
    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Failed to load products" });
  }
});

router.post("/products", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, description, price, imageUrl, category, inStock } = req.body as {
    name?: string; description?: string; price?: unknown;
    imageUrl?: string; category?: string; inStock?: string;
  };
  if (!name || typeof price !== "number" || !imageUrl || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const [product] = await db
      .insert(productsTable)
      .values({ name, description: description ?? "", price, imageUrl, category, inStock: inStock ?? "true" })
      .returning();
    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/products/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { name, description, price, imageUrl, category, inStock } = req.body as {
    name?: string; description?: string; price?: unknown;
    imageUrl?: string; category?: string; inStock?: string;
  };
  if (!name || typeof price !== "number" || !imageUrl || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const [product] = await db
      .update(productsTable)
      .set({ name, description: description ?? "", price, imageUrl, category, inStock: inStock ?? "true", updatedAt: new Date() })
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
