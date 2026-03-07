"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ACCENT = "#00d4b6";

const BRANDS = [
  { name: "Nike", slug: "Nike", logo: "N", desc: "Just Do It" },
  { name: "Adidas", slug: "Adidas", logo: "A", desc: "Impossible Is Nothing" },
  { name: "Puma", slug: "Puma", logo: "P", desc: "Forever Faster" },
  { name: "New Balance", slug: "New Balance", logo: "NB", desc: "Fearlessly Independent" },
  { name: "Mizuno", slug: "Mizuno", logo: "M", desc: "Inspired Design" },
  { name: "Under Armour", slug: "Under Armour", logo: "UA", desc: "Protect This House" },
];

export default function BrandsPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#020606", minHeight: "100vh", paddingTop: 120, paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;600;700&display=swap');
        .brand-card { cursor: pointer; border: 1px solid rgba(255,255,255,0.08); padding: 40px; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; transition: all 0.3s; background: transparent; }
        .brand-card:hover { border-color: rgba(0,212,182,0.4); background: rgba(0,212,182,0.04); }
        .brand-card:hover .brand-arrow { color: ${ACCENT}; transform: translateX(6px); }
        .brand-arrow { color: rgba(255,255,255,0.2); transition: all 0.3s; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(24px, 5vw, 64px)" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 48, height: 2, background: ACCENT }} />
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              All Brands
            </span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, lineHeight: 0.95 }}>
            Shop By<br /><span style={{ color: ACCENT }}>Brand</span>
          </h1>
        </motion.div>

        {/* Brands Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2 }}>
          {BRANDS.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="brand-card"
              onClick={() => router.push(`/shop?brand=${encodeURIComponent(brand.slug)}`)}
            >
              <div style={{
                width: 64, height: 64, background: "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900,
                color: ACCENT, border: "1px solid rgba(0,212,182,0.2)",
              }}>
                {brand.logo}
              </div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                  {brand.name}
                </div>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                  {brand.desc}
                </div>
              </div>
              <ArrowRight size={18} className="brand-arrow" style={{ marginTop: "auto" }} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}