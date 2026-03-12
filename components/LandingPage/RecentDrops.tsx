"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, Flame, ShoppingBag, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const ACCENT = "#00d4b6";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90&auto=format&fit=crop";

// Static activity feed (can be made dynamic later)
const ACTIVITY = [
  { user: "Jake M.", location: "London", product: "Football Boots", time: "12s" },
  { user: "Sofía R.", location: "Madrid", product: "Training Kit", time: "34s" },
  { user: "Tom B.", location: "Berlin", product: "Goalkeeper Gloves", time: "1m" },
  { user: "Amara D.", location: "Lagos", product: "Shin Guards", time: "2m" },
  { user: "Lucas F.", location: "Paris", product: "Match Ball", time: "3m" },
];

export default function RecentDrops() {
  const [featured, setFeatured] = useState(0);
  const [activityIdx, setActivityIdx] = useState(0);
  const { data: session } = authClient.useSession();

  // ── Fetch real products ────────────────────────────────────
  const { data, isLoading } = trpc.product.search.useQuery({
    limit: 6,
    minPrice: 0,
  });

  const products = data?.items ?? [];

  const addToCart = trpc.cart.addItem.useMutation();

  useEffect(() => {
    if (products.length === 0) return;
    const t = setInterval(() => setFeatured(f => (f + 1) % Math.min(products.length, 6)), 4000);
    return () => clearInterval(t);
  }, [products.length]);

  useEffect(() => {
    const t = setInterval(() => setActivityIdx(i => (i + 1) % ACTIVITY.length), 3000);
    return () => clearInterval(t);
  }, []);

  const handleAddToCart = (productId: string) => {
    if (!session?.user) { window.location.href = '/auth/login'; return; }
    addToCart.mutate({ productId, quantity: 1 });
  };

  if (isLoading) {
    return (
      <section style={{ background: "#020606", padding: "clamp(80px, 10vw, 140px) clamp(24px, 5vw, 64px)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "sans-serif", fontSize: 14 }}>Loading drops...</div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  const featuredProduct = products[featured];
  const featuredImg = featuredProduct?.images?.[0] || FALLBACK_IMG;
  const featuredPrice = Number(featuredProduct?.price ?? 0);
  const featuredCompare = featuredProduct?.compareAtPrice ? Number(featuredProduct.compareAtPrice) : null;

  return (
    <section style={{ background: "#020606", padding: "clamp(80px, 10vw, 140px) clamp(24px, 5vw, 64px)", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;600;700&display=swap');
        .rd-thumb { cursor: pointer; position: relative; overflow: hidden; border-radius: 4px; }
        .rd-thumb-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
        .rd-thumb:hover .rd-thumb-img { transform: scale(1.05); }
        .rd-add-btn { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.6); font-family: 'Barlow', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 10px 20px; cursor: pointer; transition: all 0.25s; }
        .rd-add-btn:hover { background: ${ACCENT}; border-color: ${ACCENT}; color: #020606; }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "clamp(48px, 6vw, 80px)", flexWrap: "wrap", gap: 24 }}>
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 2, background: ACCENT }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Just Dropped
              </span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(48px, 7vw, 88px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", textTransform: "uppercase", margin: 0, lineHeight: 0.95 }}>
              Recent<br /><span style={{ color: ACCENT }}>Drops</span>
            </motion.h2>
          </div>

          {/* Live Activity Feed */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 24px", minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, animation: "pulse-dot 1.5s infinite" }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase" }}>Live Activity</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activityIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}
              >
                <span style={{ color: "#fff", fontWeight: 600 }}>{ACTIVITY[activityIdx].user}</span>
                {" from "}{ACTIVITY[activityIdx].location}
                {" just viewed "}
                <span style={{ color: ACCENT }}>{ACTIVITY[activityIdx].product}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginLeft: 8 }}>{ACTIVITY[activityIdx].time} ago</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Main Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(24px, 4vw, 48px)", alignItems: "start" }}>

          {/* Featured Product */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Link href={`/products/${featuredProduct?.id}`} style={{ textDecoration: "none" }}>
              <AnimatePresence mode="wait">
                <motion.div key={featured} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", borderRadius: 4, background: "#0a0a0a", marginBottom: 28 }}>
                    <img src={featuredImg} alt={featuredProduct?.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.8s ease" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
                    <div style={{ position: "absolute", top: 20, left: 20 }}>
                      <span style={{ background: ACCENT, color: "#020606", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 900, padding: "5px 14px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        <Flame size={10} style={{ display: "inline", marginRight: 4 }} />
                        FEATURED
                      </span>
                    </div>
                    <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {featuredProduct?.brand || "MDFLD"}
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "#fff", lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                        {featuredProduct?.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: ACCENT }}>
                          ${featuredPrice.toFixed(0)}
                        </span>
                        {featuredCompare && featuredCompare > featuredPrice && (
                          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.3)", textDecoration: "line-through" }}>
                            ${featuredCompare.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Link>
            <button
              className="rd-add-btn"
              onClick={() => handleAddToCart(featuredProduct?.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              <ShoppingBag size={14} /> Add to Bag
            </button>
          </motion.div>

          {/* Product List */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {products.slice(0, 6).map((p: any, i: number) => {
              const pImg = p.images?.[0] || FALLBACK_IMG;
              const pPrice = Number(p.price ?? 0);
              const isActive = i === featured;

              return (
                <motion.div
                  key={p.id}
                  onClick={() => setFeatured(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 20,
                    padding: "16px 20px", cursor: "pointer",
                    background: isActive ? "rgba(0,212,182,0.06)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(0,212,182,0.2)" : "transparent"}`,
                    borderRadius: 4, transition: "all 0.3s",
                  }}
                  whileHover={{ background: "rgba(255,255,255,0.03)" }}
                >
                  {/* Number */}
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: isActive ? ACCENT : "rgba(255,255,255,0.1)", minWidth: 28, transition: "color 0.3s" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Thumb */}
                  <div className="rd-thumb" style={{ width: 72, height: 72, flexShrink: 0 }}>
                    <img src={pImg} alt={p.title} className="rd-thumb-img" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                      {p.brand || "MDFLD"}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title}
                    </div>
                    <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 700, color: ACCENT, marginTop: 4 }}>
                      ${pPrice.toFixed(0)}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight size={16} style={{ color: isActive ? ACCENT : "rgba(255,255,255,0.15)", flexShrink: 0, transition: "all 0.3s", transform: isActive ? "translateX(4px)" : "none" }} />
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* View All */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(64px, 8vw, 96px)" }}>
          <Link href="/shop" style={{
            display: "inline-flex", alignItems: "center", gap: 14,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 900,
            letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase",
            textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.3)",
            paddingBottom: 8, transition: "all 0.3s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
          >
            View All Products <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </section>
  );
}