import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, Package, ShoppingBag, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@workspace/replit-auth-web";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: string;
}

const CATEGORIES = ["chain", "ring", "cuff", "earring", "pendant", "stud", "bracelet", "gemstone", "other"];

const EMPTY_FORM = { name: "", description: "", price: "", imageUrl: "", category: "chain", inStock: "true" };

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<{ id: number; razorpayPaymentId?: string; totalAmount: number; status: string; createdAt: string; items?: unknown[] }[]>([]);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.isAdmin === true;

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
      loadOrders();
    }
  }, [isAdmin]);

  async function loadProducts() {
    try {
      const res = await fetch(`${BASE}/api/products`);
      const data = await res.json() as Product[];
      setProducts(data);
    } catch {}
  }

  async function loadOrders() {
    try {
      const res = await fetch(`${BASE}/api/orders`, { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch {}
  }

  async function shipOrder(id: number) {
    try {
      const res = await fetch(`${BASE}/api/orders/${id}/ship`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "shipped" } : o)));
      }
    } catch {}
  }

  async function saveProduct() {
    if (!form.name || !form.price || !form.imageUrl) {
      setError("Name, price, and image URL are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, price: Number(form.price) };
      const url = editId ? `${BASE}/api/products/${editId}` : `${BASE}/api/products`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      await loadProducts();
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await fetch(`${BASE}/api/products/${id}`, { method: "DELETE", credentials: "include" });
      setProducts(p => p.filter(x => x.id !== id));
    } catch {}
  }

  function startEdit(p: Product) {
    setForm({ name: p.name, description: p.description, price: String(p.price), imageUrl: p.imageUrl, category: p.category, inStock: p.inStock });
    setEditId(p.id);
    setShowForm(true);
    setError("");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 font-sans">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Not authorized</p>
        <button
          onClick={() => setLocation("/")}
          className="text-[10px] uppercase tracking-widest text-accent hover:text-white transition-colors"
        >
          ← Go Home
        </button>
      </div>
    );
  }

  const inr = (p: number) => `₹${(p).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-black text-foreground font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[20%] w-80 h-80 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)" }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-border py-5">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <div className="text-xl font-display font-semibold tracking-widest text-primary">BLAZE.IN — Admin</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            {user.firstName || user.email || "Admin"}
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-24 px-6">
        <div className="container mx-auto max-w-5xl">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.5em] text-accent mb-3">Dashboard</p>
            <h1 className="text-4xl font-display text-primary">Admin Panel</h1>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-0 border border-border mb-10 w-fit">
            {(["products", "orders"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-8 py-3 text-xs uppercase tracking-widest transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}>
                {t === "products" ? <Package className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                {t}
              </button>
            ))}
          </div>

          {/* ── Products Tab ── */}
          {tab === "products" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground text-sm uppercase tracking-widest">{products.length} products</p>
                <Button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setError(""); }}
                  className="rounded-none h-10 px-6 bg-primary text-primary-foreground hover:bg-white text-xs uppercase tracking-widest gap-2">
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </Button>
              </div>

              {/* Form */}
              {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="border border-accent/30 bg-card p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs uppercase tracking-widest text-accent">{editId ? "Edit Product" : "New Product"}</p>
                    <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-primary">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Name *</label>
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="rounded-none bg-background border-border h-11 text-sm focus-visible:ring-accent" placeholder="Eclipse Chain" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Price (₹) *</label>
                      <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        className="rounded-none bg-background border-border h-11 text-sm focus-visible:ring-accent" placeholder="999" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Image URL *</label>
                      <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        className="rounded-none bg-background border-border h-11 text-sm focus-visible:ring-accent" placeholder="/images/product-1.png" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Category *</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full h-11 bg-background border border-border text-sm text-primary px-3 focus:outline-none focus:border-accent">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
                      <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="rounded-none bg-background border-border h-11 text-sm focus-visible:ring-accent" placeholder="Short product description..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">In Stock</label>
                      <select value={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.value }))}
                        className="w-full h-11 bg-background border border-border text-sm text-primary px-3 focus:outline-none focus:border-accent">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
                  {form.imageUrl && (
                    <div className="mb-4">
                      <img src={form.imageUrl} alt="preview" className="h-20 w-20 object-cover border border-border" onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
                  <Button onClick={saveProduct} disabled={saving}
                    className="rounded-none h-11 px-8 bg-primary text-primary-foreground hover:bg-white text-xs uppercase tracking-widest gap-2">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {editId ? "Update" : "Create"}
                  </Button>
                </motion.div>
              )}

              {/* Product List */}
              <div className="border border-border divide-y divide-border">
                {products.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground/50 text-xs uppercase tracking-widest">No products yet</div>
                )}
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-6 px-6 py-4 hover:bg-card/50 transition-colors">
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover flex-shrink-0 border border-border"
                      onError={e => (e.currentTarget.style.opacity = "0.3")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{p.category} · {inr(p.price)} · {p.inStock === "true" ? "In Stock" : "Out of Stock"}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button onClick={() => startEdit(p)} variant="ghost" size="icon"
                        className="h-8 w-8 rounded-none hover:bg-accent/10 hover:text-accent">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => deleteProduct(p.id)} variant="ghost" size="icon"
                        className="h-8 w-8 rounded-none hover:bg-red-400/10 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Orders Tab ── */}
          {tab === "orders" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-muted-foreground text-sm uppercase tracking-widest mb-6">{orders.length} orders</p>
              <div className="border border-border divide-y divide-border">
                {orders.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground/50 text-xs uppercase tracking-widest">No orders yet</div>
                )}
                {orders.map(o => (
                  <div key={o.id} className="px-6 py-5 hover:bg-card/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-mono text-muted-foreground mb-1">{o.razorpayPaymentId ?? "—"}</p>
                        <p className="text-sm text-primary font-medium">{inr(o.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-widest">
                          {new Date(o.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-widest px-3 py-1 border ${
                          o.status === "shipped"
                            ? "border-blue-400/30 text-blue-400 bg-blue-400/10"
                            : o.status === "paid"
                            ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/10"
                            : "border-border text-muted-foreground"
                        }`}>
                          {o.status}
                        </span>
                        {o.status !== "shipped" && (
                          <Button
                            onClick={() => shipOrder(o.id)}
                            variant="ghost"
                            className="h-7 px-2 rounded-none hover:bg-blue-400/10 hover:text-blue-400 text-[10px] uppercase tracking-widest gap-1"
                            title="Mark as Shipped"
                          >
                            <Truck className="w-3 h-3" /> Ship
                          </Button>
                        )}
                      </div>
                    </div>
                    {Array.isArray(o.items) && o.items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(o.items as { name?: string; qty?: number }[]).map((item, i) => (
                          <span key={i} className="text-[10px] uppercase tracking-widest text-muted-foreground/60 border border-border px-2 py-1">
                            {item.name ?? "Item"} ×{item.qty ?? 1}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
