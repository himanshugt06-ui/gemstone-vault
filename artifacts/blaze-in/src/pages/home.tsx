import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Heart, ShoppingCart, ArrowDown, Star, Instagram, X, Plus, Minus, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RazorpayCheckout } from "@/components/RazorpayCheckout";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  img: string;
}

interface CartItem extends Product {
  qty: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ─── Product Data ─────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 1, name: "Eclipse Chain", price: 999, img: "/images/product-1.png" },
  { id: 2, name: "Void Ring", price: 699, img: "/images/product-2.png" },
  { id: 3, name: "Phantom Cuff", price: 949, img: "/images/product-3.png" },
  { id: 4, name: "Neon Pendant", price: 799, img: "/images/product-4.png" },
  { id: 5, name: "Onyx Studs", price: 499, img: "/images/product-5.png" },
  { id: 6, name: "Serpent Ring", price: 849, img: "/images/product-6.png" },
];

const FEATURED_PRODUCTS: Product[] = [
  { id: 1, name: "Eclipse Chain", price: 999, img: "/images/product-1.png" },
  { id: 2, name: "Void Ring", price: 699, img: "/images/product-2.png" },
  { id: 3, name: "Phantom Cuff", price: 949, img: "/images/product-3.png" },
];

const INSTAGRAM_IMAGES = [
  "/images/insta-1.png",
  "/images/insta-2.png",
  "/images/insta-3.png",
  "/images/insta-4.png",
  "/images/insta-5.png",
  "/images/insta-6.png",
];

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX(((y - rect.height / 2) / rect.height) * -12);
    setRotateY(((x - rect.width / 2) / rect.width) * 12);
  };

  return (
    <div className={`perspective-1000 ${className}`}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({
  open,
  onClose,
  items,
  onQtyChange,
  onRemove,
  onPaymentSuccess,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onQtyChange: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onPaymentSuccess: (paymentId: string) => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          />
          <motion.aside
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-border z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border">
              <span className="text-xs uppercase tracking-widest text-primary font-sans">
                Cart — {items.reduce((s, i) => s + i.qty, 0)} items
              </span>
              <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors" data-testid="cart-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                  <p className="text-muted-foreground text-sm uppercase tracking-widest">Your cart is empty</p>
                  <p className="text-muted-foreground/50 text-xs mt-2">Add pieces to begin</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 items-start" data-testid={`cart-item-${item.id}`}>
                    <div className="w-20 h-20 bg-card border border-border overflow-hidden flex-shrink-0">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm uppercase tracking-widest text-primary font-sans">{item.name}</h4>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors ml-2"
                          data-testid={`remove-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => onQtyChange(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-card transition-colors text-muted-foreground hover:text-primary"
                            data-testid={`qty-decrease-${item.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-sm text-primary font-sans">{item.qty}</span>
                          <button
                            onClick={() => onQtyChange(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-card transition-colors text-muted-foreground hover:text-primary"
                            data-testid={`qty-increase-${item.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm text-primary font-sans">{inr(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-display text-primary">{inr(subtotal)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest">Free shipping · COD available · Secure checkout</p>
                <RazorpayCheckout
                  items={items}
                  onSuccess={onPaymentSuccess}
                  label="Pay with Razorpay"
                />
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full h-10 rounded-none uppercase tracking-widest text-xs text-muted-foreground hover:text-primary font-sans"
                >
                  Continue Shopping
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Search Overlay ───────────────────────────────────────────────────────────
function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = query.length > 1
    ? PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[80] flex flex-col"
        >
          <div className="container mx-auto px-6 pt-32 max-w-2xl">
            <div className="flex items-center gap-4 border-b border-primary pb-4 mb-8">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pieces..."
                className="flex-1 bg-transparent text-2xl md:text-3xl font-display text-primary outline-none placeholder:text-muted-foreground/40 tracking-wide"
                data-testid="search-input"
              />
              <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors ml-2" data-testid="search-close">
                <X className="w-6 h-6" />
              </button>
            </div>

            {filtered.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                className="space-y-3"
              >
                {filtered.map(p => (
                  <motion.div
                    key={p.id}
                    variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                    className="flex items-center gap-4 p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                    data-testid={`search-result-${p.id}`}
                  >
                    <img src={p.img} alt={p.name} className="w-12 h-12 object-cover bg-card" />
                    <div className="flex-1">
                      <p className="text-sm uppercase tracking-widest text-primary group-hover:text-white transition-colors">{p.name}</p>
                    </div>
                    <span className="text-muted-foreground text-sm font-sans">{inr(p.price)}</span>
                  </motion.div>
                ))}
              </motion.div>
            ) : query.length > 1 ? (
              <p className="text-muted-foreground text-sm uppercase tracking-widest text-center py-12">No pieces found for "{query}"</p>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground/40 text-xs uppercase tracking-widest">Type to search our collection</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
const PRODUCT_DETAILS: Record<number, { material: string; desc: string; sizes?: string[]; lengths?: string[] }> = {
  1: { material: "925 Sterling Silver", desc: "A bold Cuban-link chain with mirror-polished chrome finish. Designed for maximum presence with minimal effort.", lengths: ['16"', '18"', '20"', '24"'] },
  2: { material: "Sterling Silver + Black Onyx", desc: "A statement signet ring carved from solid sterling silver with a deep black onyx stone set at centre.", sizes: ["6", "7", "8", "9", "10", "11"] },
  3: { material: "Oxidised Silver", desc: "An architectural open cuff with asymmetric edges and satin finish. Fits most wrists with adjustable opening.", lengths: ["S / 15cm", "M / 17cm", "L / 19cm"] },
  4: { material: "Sterling Silver", desc: "A geometric pendant inspired by void geometry. Hangs on a delicate 18\" box chain included in the set.", lengths: ['16"', '18"', '20"'] },
  5: { material: "Sterling Silver + Jet Black Enamel", desc: "Minimal circular studs with deep black enamel inlay. Lightweight, understated, and unmistakably Blaze.", sizes: ["One Size"] },
  6: { material: "925 Silver + Hand-Engraved", desc: "A serpent-motif ring with hand-engraved scales and a matte oxidised finish. A limited drop — only 50 units.", sizes: ["6", "7", "8", "9", "10", "11"] },
};

function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setQty(1);
    setSelectedOption(null);
    setAddedFeedback(false);
    if (product) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const detail = product ? PRODUCT_DETAILS[product.id] : null;
  const options = detail?.sizes ?? detail?.lengths ?? [];
  const optionLabel = detail?.sizes ? "Size" : "Length";

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) onAddToCart(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            key="pdp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80]"
          />
          <motion.div
            key="pdp-modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed inset-x-4 top-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl bg-[#0a0a0a] border border-border z-[90] overflow-y-auto max-h-[90vh]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Image panel */}
              <div className="relative aspect-square bg-card overflow-hidden">
                <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4 px-3 py-1 border border-accent/40 bg-accent/10">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-accent">Limited Piece</span>
                </div>
              </div>

              {/* Info panel */}
              <div className="flex flex-col p-8 md:p-10 relative">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors"
                  data-testid="pdp-close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-accent mb-3">{detail?.material}</p>
                  <h2 className="text-3xl md:text-4xl font-display text-primary mb-2 leading-tight">{product.name}</h2>
                  <p className="text-2xl font-display text-primary mb-6">{inr(product.price)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Incl. of all taxes · Free shipping over ₹5,000</p>

                  <div className="w-12 h-px bg-border my-6" />

                  <p className="text-muted-foreground text-sm leading-relaxed mb-8">{detail?.desc}</p>

                  {/* Size / Length selector */}
                  {options.length > 0 && (
                    <div className="mb-8">
                      <p className="text-[10px] uppercase tracking-widest text-primary mb-3">
                        {optionLabel}
                        {selectedOption && <span className="text-accent ml-2">— {selectedOption}</span>}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setSelectedOption(opt)}
                            className={`px-4 h-10 border text-[11px] uppercase tracking-widest transition-all duration-200 ${
                              selectedOption === opt
                                ? "border-primary text-primary bg-primary/10"
                                : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                            }`}
                            data-testid={`pdp-option-${opt}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-8">
                    <p className="text-[10px] uppercase tracking-widest text-primary mb-3">Quantity</p>
                    <div className="flex items-center border border-border w-fit">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-11 h-11 flex items-center justify-center hover:bg-card transition-colors text-muted-foreground hover:text-primary"
                        data-testid="pdp-qty-decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 h-11 flex items-center justify-center text-sm text-primary font-sans border-x border-border">{qty}</span>
                      <button
                        onClick={() => setQty(q => q + 1)}
                        className="w-11 h-11 flex items-center justify-center hover:bg-card transition-colors text-muted-foreground hover:text-primary"
                        data-testid="pdp-qty-increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest pt-4">Total: {inr(product.price * qty)}</p>
                  <Button
                    onClick={handleAddToCart}
                    className={`w-full h-13 rounded-none uppercase tracking-widest text-xs font-sans transition-all duration-300 h-12 ${
                      addedFeedback
                        ? "bg-accent/20 text-accent border border-accent/50"
                        : "bg-primary text-primary-foreground hover:bg-white"
                    }`}
                    data-testid="pdp-add-to-cart"
                  >
                    {addedFeedback ? (
                      <><Check className="w-4 h-4 mr-2" /> Added to Cart</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
                    )}
                  </Button>
                  <Button
                    onClick={() => { handleAddToCart(); onClose(); }}
                    className="w-full h-12 rounded-none uppercase tracking-widest text-xs font-sans bg-accent/10 text-accent border border-accent/40 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                    data-testid="pdp-buy-now"
                  >
                    Buy Now — {inr(product.price * qty)}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [newsletterState, setNewsletterState] = useState<"idle" | "success">("idle");
  const [email, setEmail] = useState("");

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.4], ["0%", "30%"]);

  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay.current]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  }, []);

  const changeQty = useCallback((id: number, delta: number) => {
    setCartItems(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleWishlist = useCallback((id: number) => {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setNewsletterState("success");
    setEmail("");
  };

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-black text-foreground overflow-hidden font-sans">

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p) => { addToCart(p); }}
      />

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onQtyChange={changeQty}
        onRemove={removeFromCart}
        onPaymentSuccess={(pid) => {
          setPaymentSuccess(pid);
          setCartItems([]);
          setCartOpen(false);
        }}
      />

      {/* Payment Success Overlay */}
      <AnimatePresence>
        {paymentSuccess && (
          <>
            <motion.div
              key="pay-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90]"
            />
            <motion.div
              key="pay-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-[#0a0a0a] border border-border z-[100] p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full border border-accent/50 bg-accent/10 flex items-center justify-center mx-auto mb-8">
                <Check className="w-7 h-7 text-accent" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-accent mb-4">Payment Confirmed</p>
              <h2 className="text-3xl font-display text-primary mb-3">Order Placed.</h2>
              <p className="text-muted-foreground text-sm mb-2">Thank you for shopping with BLAZE.IN.</p>
              <p className="text-muted-foreground/50 text-[11px] uppercase tracking-widest mb-10">
                Payment ID: {paymentSuccess.slice(-12)}
              </p>
              <Button
                onClick={() => setPaymentSuccess(null)}
                className="rounded-none bg-primary text-primary-foreground hover:bg-white uppercase tracking-widest text-xs h-12 px-10"
              >
                Continue Shopping
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/85 backdrop-blur-md border-b border-border py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="text-2xl font-display font-semibold tracking-widest text-primary">BLAZE.IN</div>
          <div className="hidden md:flex items-center space-x-8 text-sm uppercase tracking-wider text-muted-foreground">
            <a href="#collections" className="hover:text-primary transition-colors">Collections</a>
            <a href="#bestsellers" className="hover:text-primary transition-colors">Shop</a>
            <a href="#drops" className="hover:text-primary transition-colors text-accent">Drops</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </div>
          <div className="flex items-center space-x-5 text-muted-foreground">
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:text-primary transition-colors"
              data-testid="button-search"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="hover:text-primary transition-colors relative"
              data-testid="button-wishlist"
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlist.size > 0 ? "text-accent fill-accent" : ""}`} />
              {wishlist.size > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.size}
                </span>
              )}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="hover:text-primary transition-colors relative"
              data-testid="button-cart"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <AnimatePresence>
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                </AnimatePresence>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,#0d1b3e_0%,#000_70%)]" />
          <div className="orb-glow" style={{ top: "20%", left: "15%" }} />
          <div className="orb-glow" style={{ bottom: "15%", right: "20%", animationDelay: "2s" }} />
          <div className="orb-glow" style={{ top: "55%", left: "60%", width: "200px", height: "200px", animationDelay: "1s" }} />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.4em] text-accent mb-8 font-sans"
          >
            Underground Luxury Jewellery
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-[7rem] font-display leading-[0.95] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-600 mb-8"
          >
            Crafted for the<br />uncommon.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-sm md:text-base text-muted-foreground uppercase tracking-[0.3em] mb-14 max-w-lg mx-auto leading-relaxed"
          >
            Limited jewellery pieces designed for modern fashion culture.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <a href="#bestsellers">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-transparent border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground rounded-none uppercase tracking-widest h-14 px-12 transition-all duration-500 text-xs"
                data-testid="button-shop-collection"
              >
                Shop Collection
              </Button>
            </a>
            <a href="#drops">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-accent/10 text-accent border border-accent/40 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_30px_hsl(var(--accent)/0.4)] rounded-none uppercase tracking-widest h-14 px-12 transition-all duration-500 text-xs"
                data-testid="button-explore-drops"
              >
                Explore Drops
              </Button>
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ── Featured Collections ──────────────────────────────────────── */}
      <section id="collections" className="py-32 px-6 bg-black">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-accent mb-4">Explore</p>
            <h2 className="text-4xl md:text-5xl font-display text-primary">Collections</h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { title: "Chains", img: "/images/chain-collection.png" },
              { title: "Rings", img: "/images/ring-collection.png" },
              { title: "Earrings", img: "/images/earring-collection.png" },
              { title: "Limited Drops", img: "/images/drops-collection.png" }
            ].map((col, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                whileHover={{ y: -4 }}
                className="group relative aspect-[3/4] overflow-hidden bg-card border border-border flex items-end p-6 cursor-pointer"
                data-testid={`collection-card-${i}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                <img
                  src={col.img}
                  alt={col.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
                <div className="relative z-20">
                  <h3 className="text-xl font-display tracking-widest text-primary uppercase mb-1">{col.title}</h3>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground group-hover:text-accent transition-colors duration-300">View All</p>
                </div>
                <div className="absolute inset-0 border border-transparent group-hover:border-accent/20 transition-colors duration-500 z-30 pointer-events-none" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
                  style={{ background: "radial-gradient(ellipse at center, hsl(var(--accent)/0.08) 0%, transparent 70%)" }} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Best Sellers ──────────────────────────────────────────────── */}
      <section id="bestsellers" className="py-32 px-6 bg-neutral-950 border-y border-border">
        <div className="container mx-auto">
          <div className="flex items-end justify-between mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-accent mb-3">Most Coveted</p>
              <h2 className="text-4xl md:text-5xl font-display text-primary">The Signatures</h2>
            </motion.div>
            <a href="#" className="hidden md:block uppercase tracking-widest text-xs text-primary hover:text-accent transition-colors border-b border-primary/50 hover:border-accent pb-1">View All</a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map((prod, i) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group flex flex-col"
                data-testid={`product-card-${prod.id}`}
              >
                <div
                  className="relative aspect-square mb-5 bg-card border border-border overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(prod)}
                  data-testid={`button-open-pdp-${prod.id}`}
                >
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* View detail hint */}
                  <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/70 bg-black/50 backdrop-blur-sm px-2 py-1">View Details</span>
                  </div>
                  {/* Wishlist */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(prod.id); }}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-md border border-border flex items-center justify-center hover:border-accent transition-all duration-300"
                    data-testid={`button-wishlist-${prod.id}`}
                    aria-label="Toggle wishlist"
                  >
                    <Heart className={`w-4 h-4 transition-colors duration-300 ${wishlist.has(prod.id) ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                  </button>
                  {/* Add to Cart slide-up */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                    <Button
                      onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                      className="w-full bg-primary text-primary-foreground hover:bg-white rounded-none uppercase tracking-widest text-[11px] h-11 font-sans"
                      data-testid={`button-addtocart-${prod.id}`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-2" /> Add to Cart
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center px-1">
                  <h4 className="font-sans uppercase tracking-widest text-[11px] text-primary">{prod.name}</h4>
                  <span className="text-muted-foreground text-sm font-sans">{inr(prod.price)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial Showcase ────────────────────────────────────────── */}
      <section className="relative overflow-hidden h-[80vh] md:h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <img src="/images/editorial-hero.png" alt="Editorial" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-accent mb-6">New Season</p>
            <h2 className="text-5xl md:text-8xl lg:text-[9rem] font-display font-light leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 mb-4">
              MIDNIGHT
            </h2>
            <h2 className="text-5xl md:text-8xl lg:text-[9rem] font-display font-light leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-neutral-400 to-neutral-700 mb-10">
              COLLECTION
            </h2>
            <div className="flex items-center justify-center gap-8 text-xs uppercase tracking-[0.4em] text-muted-foreground mb-12">
              <span>Limited Series</span>
              <span className="w-12 h-px bg-border" />
              <span>Chrome Edition</span>
            </div>
            <Button
              className="bg-transparent border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground rounded-none uppercase tracking-widest h-14 px-14 transition-all duration-500 text-xs"
              data-testid="button-editorial-shop"
            >
              Shop The Edit
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Product Experience (3D Tilt) ──────────────────────────────── */}
      <section id="drops" className="py-32 px-6 bg-black">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-accent mb-4">Interact</p>
            <h2 className="text-4xl md:text-5xl font-display text-primary mb-4">The Experience</h2>
            <p className="text-muted-foreground uppercase tracking-widest text-[11px] max-w-md mx-auto">Precision engineered for the bold. Tilt to feel the detail.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {FEATURED_PRODUCTS.map((prod, i) => (
              <TiltCard key={prod.id} className="aspect-[3/4]">
                <div className="w-full h-full bg-card border border-border relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col justify-end p-8" style={{ transform: "translateZ(40px)" }}>
                    <div className="w-8 h-8 border border-accent rounded-full flex items-center justify-center mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_hsl(var(--accent))]" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-accent mb-1">Exhibit 0{i + 1}</p>
                    <h3 className="font-display text-2xl text-primary mb-3">{prod.name}</h3>
                    <Button
                      onClick={() => addToCart(prod)}
                      className="w-full h-10 rounded-none bg-transparent border border-primary/50 hover:bg-primary hover:text-primary-foreground uppercase tracking-widest text-[10px] transition-all duration-300"
                      data-testid={`button-tilt-addtocart-${prod.id}`}
                    >
                      Add — {inr(prod.price)}
                    </Button>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-32 bg-neutral-950 border-y border-border overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 mb-16 text-center"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-accent mb-4">Verified Owners</p>
          <h2 className="text-4xl md:text-5xl font-display text-primary">Inner Circle</h2>
        </motion.div>

        <div className="w-full px-6" ref={emblaRef}>
          <div className="flex gap-5 cursor-grab active:cursor-grabbing">
            {[
              { name: "ALEX M.", handle: "@alex.m", text: "The weight, the finish — it feels dangerous. Nothing else comes close to this aesthetic." },
              { name: "SARAH J.", handle: "@sarah.j", text: "I've stopped wearing anything else. The Void ring gets comments every single night out." },
              { name: "D.K.", handle: "@dk.wears", text: "Packaging was immaculate. The piece itself is heavy, cold, and perfect. True luxury streetwear." },
              { name: "MARCUS T.", handle: "@marcus.t", text: "Waited 3 months for the drop. Worth every second. The chrome reflects unlike anything I own." },
              { name: "ELENA R.", handle: "@elena.r", text: "Finally a brand that understands modern edge without looking cheap. Craftsmanship is 10/10." },
              { name: "JAMES K.", handle: "@jk.fits", text: "The Serpent Ring sold out in 2 mins. Got mine. Feels like wearing something sacred." }
            ].map((review, i) => (
              <div key={i} className="flex-[0_0_88%] sm:flex-[0_0_48%] lg:flex-[0_0_30%] min-w-0">
                <div className="bg-card border border-border p-8 h-full flex flex-col justify-between min-h-[240px]">
                  <div>
                    <div className="flex items-center gap-0.5 mb-5 text-primary">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6 font-serif italic text-[15px]">"{review.text}"</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-[10px] uppercase tracking-widest text-primary">{review.name}</span>
                    <span className="text-[10px] text-accent/70 tracking-wider">{review.handle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram Gallery ─────────────────────────────────────────── */}
      <section className="py-32 px-4 md:px-6 bg-black">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent mb-2">Instagram</p>
              <h2 className="text-2xl font-display tracking-widest uppercase text-primary">@_.blaze.in._</h2>
            </div>
            <a
              href="https://www.instagram.com/_.blaze.in._"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest border border-border hover:border-primary text-muted-foreground hover:text-primary transition-all duration-300 px-5 h-10"
              data-testid="link-instagram-follow"
            >
              <Instagram className="w-3.5 h-3.5" />
              Follow
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3"
          >
            {INSTAGRAM_IMAGES.map((src, i) => (
              <motion.a
                key={i}
                href="https://www.instagram.com/_.blaze.in._"
                target="_blank"
                rel="noopener noreferrer"
                variants={{
                  hidden: { opacity: 0, scale: 0.96 },
                  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
                }}
                className="relative aspect-square group overflow-hidden bg-card block"
                data-testid={`instagram-image-${i}`}
              >
                <img src={src} alt={`Blaze.in Instagram ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                  <Instagram className="w-7 h-7 text-white" />
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/80">View on Instagram</span>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────────── */}
      <section id="about" className="py-40 px-6 relative bg-card border-t border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/8 via-transparent to-transparent" />
        <div className="container mx-auto relative z-10 max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-accent mb-6">Exclusive Access</p>
            <h2 className="text-5xl md:text-6xl font-display text-primary mb-5 leading-tight">Join the inner circle.</h2>
            <p className="text-muted-foreground uppercase tracking-widest text-[11px] mb-12 leading-relaxed">
              First access to limited drops, early previews, and members-only offers.
            </p>

            <AnimatePresence mode="wait">
              {newsletterState === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                  data-testid="newsletter-success"
                >
                  <div className="w-14 h-14 rounded-full border border-accent/50 flex items-center justify-center bg-accent/10">
                    <Check className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-primary uppercase tracking-widest text-sm">You're in the circle.</p>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">Watch your inbox for exclusive access.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col sm:flex-row gap-3"
                  onSubmit={handleNewsletter}
                  data-testid="newsletter-form"
                >
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="YOUR EMAIL"
                    required
                    className="bg-black border-border/60 h-14 rounded-none uppercase tracking-widest text-center sm:text-left px-6 focus-visible:ring-accent focus-visible:border-accent placeholder:text-muted-foreground/40 text-sm"
                    data-testid="input-newsletter-email"
                  />
                  <Button
                    type="submit"
                    className="h-14 rounded-none bg-accent text-accent-foreground hover:bg-accent/80 hover:shadow-[0_0_20px_hsl(var(--accent)/0.5)] px-10 uppercase tracking-widest transition-all text-xs flex-shrink-0"
                    data-testid="button-newsletter-submit"
                  >
                    Subscribe
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-black py-20 px-6 border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="text-3xl font-display font-semibold tracking-widest text-primary mb-5">BLAZE.IN</div>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                Underground luxury jewellery for the modern era. Crafted with precision, designed for the bold.
              </p>
              <a
                href="https://www.instagram.com/_.blaze.in._"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                data-testid="link-footer-instagram"
              >
                <Instagram className="w-4 h-4" />
                @_.blaze.in._
              </a>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-primary mb-6">Shop</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">All Pieces</a></li>
                <li><a href="#collections" className="hover:text-primary transition-colors">Chains</a></li>
                <li><a href="#collections" className="hover:text-primary transition-colors">Rings</a></li>
                <li><a href="#drops" className="hover:text-primary transition-colors">Limited Drops</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-primary mb-6">Support</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms & Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground uppercase tracking-widest">
            <p>© {new Date().getFullYear()} BLAZE.IN. All rights reserved.</p>
            <p>Limited pieces. Unlimited expression.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
