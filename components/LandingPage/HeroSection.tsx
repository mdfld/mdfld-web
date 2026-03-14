"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  {
    id: '01',
    title: 'OUTERWEAR',
    subtitle: 'Engineered for the elements.',
    price: 'From $450',
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop',
    color: '#111111',
    shopHref: '/shop?category=outerwear',
    galleryHref: '/shop?category=outerwear&view=gallery',
  },
  {
    id: '02',
    title: 'FOOTWEAR',
    subtitle: 'Tactical mobility.',
    price: 'From $220',
    img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop',
    color: '#0a0a0a',
    shopHref: '/shop?category=footwear',
    galleryHref: '/shop?category=footwear&view=gallery',
  },
  {
    id: '03',
    title: 'ACCESSORIES',
    subtitle: 'Utilitarian precision.',
    price: 'From $85',
    img: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=1200&auto=format&fit=crop',
    color: '#161616',
    shopHref: '/shop?category=accessories',
    galleryHref: '/shop?category=accessories&view=gallery',
  },
  {
    id: '04',
    title: 'ARCHIVE',
    subtitle: 'Rare & unreleased.',
    price: 'Vault Access',
    img: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=1200&auto=format&fit=crop',
    color: '#050505',
    shopHref: '/shop?category=archive',
    galleryHref: '/shop?category=archive&view=gallery',
  }
];

// ─── Desktop: original accordion ───────────────────────────────────────────
function DesktopView() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
      {CATEGORIES.map((cat, i) => {
        const isHovered = hovered === i;
        const isMuted = hovered !== null && hovered !== i;

        return (
          <motion.div
            key={cat.id}
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
                padding: '40px 0', alignItems: 'center', pointerEvents: 'none',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, letterSpacing: '0.2em' }}>{cat.id}</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '0.2em', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 100 }}>
                        {cat.id}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 14, fontWeight: 600 }}>
                        {cat.price}
                      </span>
                    </div>
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
                      <Link href={cat.shopHref} className="vault-btn" style={{ textDecoration: 'none' }}>
                        <ShoppingBag size={18} strokeWidth={2.5} />
                        Explore
                      </Link>
                      <Link href={cat.galleryHref} style={{ background: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Manrope', sans-serif", textDecoration: 'none' }}>
                        View Gallery <ArrowRight size={16} />
                      </Link>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#000' }}>
      {CATEGORIES.map((cat, i) => {
        const isOpen = expanded === i;

        return (
          <motion.div
            key={cat.id}
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
                <span style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em' }}>
                  {cat.id}
                </span>
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
                  <span style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    {cat.price}
                  </span>
                  <p style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.72)', fontSize: 15, fontWeight: 400, lineHeight: 1.5, margin: 0, maxWidth: 320 }}>
                    {cat.subtitle}
                  </p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                    <Link href={cat.shopHref} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 10,
                      background: '#fff', color: '#000',
                      padding: '14px 28px', borderRadius: 4,
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13,
                      textDecoration: 'none',
                    }}>
                      <ShoppingBag size={15} strokeWidth={2.5} />
                      Explore
                    </Link>
                    <Link href={cat.galleryHref} style={{
                      color: 'rgba(255,255,255,0.6)',
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                      textDecoration: 'none',
                    }}>
                      Gallery <ArrowRight size={14} />
                    </Link>
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