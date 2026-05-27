import { useState, useEffect, useRef } from "react";
import { Search, Heart, ShoppingCart, ArrowDown, Star, Instagram } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Custom 3D Tilt Card Component ---
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setRotateX(rotateX);
    setRotateY(rotateY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className={`perspective-1000 ${className}`}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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

// --- Main Page Component ---
export default function Home() {
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addToCart = () => setCartCount(c => c + 1);

  return (
    <div className="min-h-screen bg-black text-foreground overflow-hidden font-sans">
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-md border-b border-border py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="text-2xl font-display font-semibold tracking-widest text-primary">BLAZE.IN</div>
          <div className="hidden md:flex items-center space-x-8 text-sm uppercase tracking-wider text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Shop</a>
            <a href="#" className="hover:text-primary transition-colors">Collections</a>
            <a href="#" className="hover:text-primary transition-colors text-accent">Drops</a>
            <a href="#" className="hover:text-primary transition-colors">About</a>
          </div>
          <div className="flex items-center space-x-6 text-muted-foreground">
            <button className="hover:text-primary transition-colors"><Search className="w-5 h-5" /></button>
            <button className="hover:text-primary transition-colors"><Heart className="w-5 h-5" /></button>
            <button className="hover:text-primary transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black opacity-80" />
          <div className="orb-glow top-[20%] left-[20%]" />
          <div className="orb-glow bottom-[10%] right-[20%] animation-delay-2000" />
        </motion.div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl md:text-8xl lg:text-9xl font-display leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 mb-6"
          >
            Crafted for the<br/>uncommon.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground uppercase tracking-widest mb-12 max-w-2xl mx-auto"
          >
            Limited jewellery pieces designed for modern fashion culture.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Button size="lg" className="w-full sm:w-auto bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none uppercase tracking-widest h-14 px-10 transition-all duration-500">
              Shop Collection
            </Button>
            <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/80 hover:shadow-[0_0_20px_hsl(var(--accent)/0.5)] rounded-none uppercase tracking-widest h-14 px-10 transition-all duration-500 border-none">
              Explore Drops
            </Button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Featured Collections */}
      <section className="py-32 px-6 bg-black relative">
        <div className="container mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                className="group relative aspect-[3/4] overflow-hidden bg-card border border-border flex items-end p-6 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <img 
                  src={col.img} 
                  alt={col.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale-[20%]"
                />
                <h3 className="relative z-20 text-2xl font-display tracking-widest text-primary uppercase">{col.title}</h3>
                <div className="absolute inset-0 border border-transparent group-hover:border-accent/30 transition-colors duration-500 z-30" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-32 px-6 bg-neutral-950 border-y border-border">
        <div className="container mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-display text-primary mb-4">The Signatures</h2>
              <p className="text-muted-foreground uppercase tracking-widest text-sm">Most coveted pieces</p>
            </div>
            <a href="#" className="hidden md:block uppercase tracking-widest text-sm text-primary hover:text-accent transition-colors border-b border-primary hover:border-accent pb-1">View All</a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Eclipse Chain", price: "$450", img: "/images/product-1.png" },
              { name: "Void Ring", price: "$280", img: "/images/product-2.png" },
              { name: "Phantom Cuff", price: "$520", img: "/images/product-3.png" },
              { name: "Neon Pendant", price: "$390", img: "/images/product-4.png" },
              { name: "Onyx Studs", price: "$210", img: "/images/product-5.png" },
              { name: "Serpent Ring", price: "$340", img: "/images/product-6.png" }
            ].map((prod, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group flex flex-col"
              >
                <div className="relative aspect-square mb-6 bg-card border border-border overflow-hidden">
                  <img 
                    src={prod.img} 
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-border flex items-center justify-center hover:text-accent hover:border-accent transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                    <Button 
                      onClick={addToCart}
                      className="w-full bg-primary text-primary-foreground hover:bg-white rounded-none uppercase tracking-widest text-xs h-12"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <h4 className="font-sans uppercase tracking-widest text-sm text-primary">{prod.name}</h4>
                  <span className="text-muted-foreground text-sm tracking-wider">{prod.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Showcase */}
      <section className="py-32 overflow-hidden">
        <div className="w-full relative h-[70vh] md:h-[90vh] bg-card border-y border-border flex items-center justify-center">
          <div className="absolute inset-0">
            <img src="/images/chain-collection.png" alt="Editorial" className="w-full h-full object-cover opacity-30 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-black" />
          </div>
          <div className="relative z-10 w-full">
            <motion.div 
              initial={{ x: "10%" }}
              whileInView={{ x: "-10%" }}
              transition={{ duration: 10, ease: "linear" }}
              className="whitespace-nowrap"
            >
              <h2 className="text-[10vw] md:text-[8vw] font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-800 via-primary to-neutral-800 opacity-80 select-none">
                MIDNIGHT COLLECTION • LIMITED SERIES • CHROME EDITION
              </h2>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Experience (3D Hover) */}
      <section className="py-32 px-6 bg-black">
        <div className="container mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-display text-primary mb-4">The Experience</h2>
            <p className="text-muted-foreground uppercase tracking-widest text-sm max-w-xl mx-auto">Interact with our most exclusive drops. Precision engineered for the bold.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <TiltCard key={i} className="aspect-[3/4]">
                <div className="w-full h-full bg-card border border-border relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  <img 
                    src={`/images/product-${i}.png`} 
                    alt={`Experience ${i}`} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col justify-end p-8" style={{ transform: "translateZ(50px)" }}>
                    <div className="w-10 h-10 border border-accent rounded-full flex items-center justify-center mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_hsl(var(--accent))]" />
                    </div>
                    <h3 className="font-display text-3xl text-primary mb-2">Exhibit 0{i}</h3>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Examine details</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-neutral-950 border-y border-border overflow-hidden">
        <div className="container mx-auto px-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-display text-primary text-center">Inner Circle</h2>
        </div>
        
        <div className="w-full px-6" ref={emblaRef}>
          <div className="flex gap-6 -ml-6 cursor-grab active:cursor-grabbing">
            {[
              { name: "ALEX M.", text: "The weight, the finish. It feels dangerous. Nothing else comes close to this aesthetic." },
              { name: "SARAH J.", text: "I've stopped wearing anything else. The Void ring gets comments every single night out." },
              { name: "D.K.", text: "Packaging was immaculate. The piece itself is heavy, cold, and perfect. True luxury streetwear." },
              { name: "MARCUS T.", text: "Waited 3 months for the drop. Worth every second. The chrome reflects light unlike any other silver I own." },
              { name: "ELENA R.", text: "Finally a brand that understands modern edge without looking cheap. Craftsmanship is 10/10." }
            ].map((review, i) => (
              <div key={i} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_30%] pl-6">
                <div className="bg-card border border-border p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-6 text-primary">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-muted-foreground text-lg mb-8 font-serif italic">"{review.text}"</p>
                  </div>
                  <div className="text-xs uppercase tracking-widest text-primary border-t border-border pt-4">
                    {review.name} // Verified
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Gallery */}
      <section className="py-32 px-2 md:px-6 bg-black">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-12 px-4">
            <h2 className="text-2xl font-display tracking-widest uppercase">@Blaze.in</h2>
            <Button variant="outline" className="rounded-none border-border hover:border-primary uppercase tracking-widest text-xs h-10">
              Follow Us
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative aspect-square group overflow-hidden bg-card">
                <img src={`/images/product-${i}.png`} alt={`Instagram ${i}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  <Instagram className="w-8 h-8 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-40 px-6 relative bg-card border-t border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        <div className="container mx-auto relative z-10 max-w-2xl text-center">
          <h2 className="text-5xl md:text-7xl font-display text-primary mb-6">Join the inner circle.</h2>
          <p className="text-muted-foreground uppercase tracking-widest text-sm mb-12">Exclusive access to limited drops before they go public.</p>
          
          <form className="flex flex-col sm:flex-row gap-4" onSubmit={e => e.preventDefault()}>
            <Input 
              type="email" 
              placeholder="YOUR EMAIL" 
              className="bg-black border-border h-14 rounded-none uppercase tracking-widest text-center sm:text-left px-6 focus-visible:ring-accent"
            />
            <Button type="submit" className="h-14 rounded-none bg-accent text-accent-foreground hover:bg-accent/80 hover:shadow-[0_0_15px_hsl(var(--accent)/0.4)] px-10 uppercase tracking-widest transition-all">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 px-6 border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="text-3xl font-display font-semibold tracking-widest text-primary mb-6">BLAZE.IN</div>
              <p className="text-muted-foreground text-sm max-w-sm">
                Underground luxury jewellery for the modern era. Crafted with precision, designed for the bold.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-primary mb-6">Navigation</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Shop All</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Collections</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Limited Drops</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-primary mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground uppercase tracking-widest">
            <p>© {new Date().getFullYear()} BLAZE.IN. ALL RIGHTS RESERVED.</p>
            <p>Limited pieces. Unlimited expression.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
