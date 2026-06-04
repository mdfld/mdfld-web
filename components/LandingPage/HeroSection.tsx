"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  {
    title: 'JERSEYS',
    subtitle: 'Match-worn styles for every club.',
    img: '/categories/kits-v2.jpeg',
    color: '#111111',
    href: '/shop?category=JERSEYS',
  },
  {
    title: 'BOOTS',
    subtitle: 'Elite performance on the pitch.',
    img: '/categories/boots.jpg',
    color: '#0a0a0a',
    href: '/shop?category=BOOTS',
  },
  {
    title: 'ACCESSORIES',
    subtitle: 'Complete your kit.',
    img: '/categories/accessories.jpg',
    color: '#161616',
    href: '/shop?category=ACCESSORIES',
  },
  {
    title: 'STICKERS',
    subtitle: 'Collect every kit. WC 2026.',
    img: '/categories/hero-stickers.webp',
    color: '#050505',
    href: '/shop?category=STICKERS',
  },
];

// ─── Desktop: original accordion ───────────────────────────────────────────
function DesktopView() {
  const [hovered, setHovered] = useState<number | null>(null);
  const router = useRouter();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
      {CATEGORIES.map((cat, i) => {
        const isHovered = hovered === i;
        const isMuted = hovered !== null && hovered !== i;

        return (
          <motion.div
            key={cat.title}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            animate={{ width: hovered === null ? '25%' : isHovered ? '70%' : '10%' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative', height: '100%',
              borderRight: i !== CATEGORIES.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              cursor: 'pointer', overflow: 'hidden', backgroundColor: cat.color,
            }}
          >
            <motion.div
              animate={{
                scale: isHovered ? 1 : 1.1,
                opacity: isHovered ? 0.7 : 0.35,
                filter: isHovered
                  ? 'grayscale(0%) brightness(1) contrast(1.1)'
                  : 'grayscale(100%) brightness(0.6) contrast(1.2)'
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${cat.img})`,
                backgroundSize: 'cover', backgroundPosition: 'center', transformOrigin: 'center',
              }}
            />

            {/* Collapsed: vertical text */}
            <motion.div
              animate={{ opacity: isHovered ? 0 : isMuted ? 0.15 : 1, y: isHovered ? -20 : 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: '84px 0 40px', alignItems: 'center', pointerEvents: 'none',
              }}
            >
              <div style={{
                writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                color: '#fff', fontFamily: "'Syncopate', sans-serif",
                fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>
                {cat.title}
              </div>
            </motion.div>

            {/* Expanded: full hero content */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute', inset: 0,
                    padding: 'clamp(40px, 6vw, 80px)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                    <h2 style={{
                      color: '#fff', fontFamily: "'Syncopate', sans-serif",
                      fontSize: 'clamp(48px, 6vw, 100px)', fontWeight: 700,
                      lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0,
                    }}>
                      {cat.title}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(16px, 1.5vw, 24px)', fontWeight: 400, marginBottom: 32, maxWidth: 400 }}>
                      {cat.subtitle}
                    </p>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <button className="vault-btn" onClick={() => router.push(cat.href)}>
                        <ShoppingBag size={18} strokeWidth={2.5} />
                        Explore
                      </button>
                      <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Manrope', sans-serif" }}>
                        View Gallery <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Mobile: vertical tap-to-expand accordion ──────────────────────────────
function MobileView() {
  const [expanded, setExpanded] = useState<number | null>(0);
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#000', paddingTop: 72 }}>
      {CATEGORIES.map((cat, i) => {
        const isOpen = expanded === i;

        return (
          <motion.div
            key={cat.title}
            animate={{ flex: isOpen ? 4 : 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setExpanded(isOpen ? null : i)}
            style={{
              position: 'relative', overflow: 'hidden',
              backgroundColor: cat.color, cursor: 'pointer',
              borderBottom: i !== CATEGORIES.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              minHeight: 72,
            }}
          >
            {/* Background image */}
            <motion.div
              animate={{
                opacity: isOpen ? 0.65 : 0.3,
                scale: isOpen ? 1 : 1.08,
                filter: isOpen
                  ? 'grayscale(0%) brightness(0.9) contrast(1.1)'
                  : 'grayscale(100%) brightness(0.5) contrast(1.2)',
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${cat.img})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
            />

            {/* Bottom fade */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
            }} />

            {/* Collapsed row header — always visible */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', zIndex: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  fontFamily: "'Syncopate', sans-serif", color: '#fff',
                  fontSize: isOpen ? 18 : 15, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  transition: 'font-size 0.3s ease',
                }}>
                  {cat.title}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.4)', display: 'flex' }}
              >
                <ArrowRight size={18} />
              </motion.div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '24px 24px 32px', zIndex: 2,
                    display: 'flex', flexDirection: 'column', gap: 14,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <p style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.72)', fontSize: 15, fontWeight: 400, lineHeight: 1.5, margin: 0, maxWidth: 320 }}>
                    {cat.subtitle}
                  </p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                    <button
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        background: '#fff', color: '#000',
                        padding: '14px 28px', borderRadius: 4,
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13,
                        border: 'none', cursor: 'pointer',
                      }}
                      onClick={() => router.push(cat.href)}
                    >
                      <ShoppingBag size={15} strokeWidth={2.5} />
                      Explore
                    </button>
                    <button style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      Gallery <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Root: picks layout based on viewport ──────────────────────────────────
export default function KineticVaultHero() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;800&family=Syncopate:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        .vault-btn {
          display: inline-flex; align-items: center; gap: 12px;
          background: #fff; color: #000;
          padding: 16px 32px; border-radius: 4px;
          font-family: 'Manrope', sans-serif;
          font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
          border: none; cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s;
        }
        .vault-btn:hover { transform: translateY(-4px); background: #f0f0f0; }
      `}</style>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}