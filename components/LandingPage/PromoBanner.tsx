"use client"
import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

const ACCENT = '#00d4b6';

function useCountdown(targetHours = 8, targetMins = 42) {
  const [time, setTime] = useState({ h: targetHours, m: targetMins, s: 0 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function Digit({ val }: { val: string }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <motion.span
        key={val}
        initial={{ y: '-60%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'inline-block' }}
      >
        {val}
      </motion.span>
    </div>
  );
}

export default function PromoBanner() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgX = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);
  const time = useCountdown(8, 42);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section ref={ref} style={{ position: 'relative', overflow: 'hidden', background: '#060a09' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Barlow:wght@300;400;600;700&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes promo-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .promo-ticker { animation: promo-ticker 18s linear infinite; display:flex; width:max-content; }

        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.25} }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200vh); }
        }

        .promo-shop-btn {
          position: relative; overflow: hidden;
          background: ${ACCENT}; color: #020606;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 900; letter-spacing: 0.28em; text-transform: uppercase;
          padding: 0 32px; height: 52px; border: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 10px;
          transition: all 0.3s; white-space: nowrap; min-width: 180px; justify-content: center;
        }
        .promo-shop-btn::before {
          content: ''; position: absolute; top: 0; left: -75%;
          width: 50%; height: 100%; background: rgba(255,255,255,0.25);
          transform: skewX(-15deg); transition: left 0.5s ease;
        }
        .promo-shop-btn:hover::before { left: 130%; }
        .promo-shop-btn:hover { background: #00bda2; }

        .promo-ghost-btn {
          background: transparent; color: rgba(255,255,255,0.45);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 800; letter-spacing: 0.28em; text-transform: uppercase;
          padding: 0 28px; height: 52px; border: 1px solid rgba(255,255,255,0.12); cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.3s; white-space: nowrap; min-width: 160px; justify-content: center;
        }
        .promo-ghost-btn:hover { border-color: rgba(0,212,182,0.45); color: ${ACCENT}; }

        /* STAT CARDS */
        .promo-stat-card {
          flex: 1 1 0; min-width: 110px; padding: 18px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative; overflow: hidden;
          transition: border-color 0.3s;
        }
        .promo-stat-card:hover { border-color: rgba(0,212,182,0.2); }
        .promo-stat-card.hot {
          background: rgba(0,212,182,0.05);
          border-color: rgba(0,212,182,0.18);
          border-top: 2px solid ${ACCENT};
        }

        /* RESPONSIVE */
        .promo-layout {
          position: relative; z-index: 3;
          padding: clamp(44px, 7vw, 80px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 90px);
          width: 100%;
        }
        .promo-body {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        .promo-stats-row {
          display: flex; flex-direction: row;
          gap: 1px; overflow-x: auto; -webkit-overflow-scrolling: touch;
          scrollbar-width: none; background: rgba(255,255,255,0.05);
          margin-left: calc(-1 * clamp(20px, 5vw, 80px));
          margin-right: calc(-1 * clamp(20px, 5vw, 80px));
        }
        .promo-stats-row::-webkit-scrollbar { display: none; }
        .promo-stats-row .promo-stat-card { flex: 0 0 140px; }

        .promo-cta-row {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
        }

        @media (min-width: 768px) {
          .promo-body {
            grid-template-columns: 1fr auto;
            gap: 56px;
            align-items: center;
          }
          .promo-stats-row {
            flex-direction: column;
            overflow-x: visible;
            margin: 0; background: transparent;
            min-width: 210px; gap: 2px;
          }
          .promo-stats-row .promo-stat-card {
            flex: 1 1 auto; min-width: unset;
          }
        }
        @media (max-width: 400px) {
          .promo-shop-btn, .promo-ghost-btn { flex: 1 1 100%; }
        }
      `}</style>

      {/* ── PARALLAX BG ── */}
      <motion.div style={{ position: 'absolute', inset: '-6%', zIndex: 0, x: bgX, scale: bgScale }}>
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80&auto=format&fit=crop"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.22) saturate(0.5)' }}
        />
      </motion.div>

      {/* ── OVERLAYS ── */}
      {/* Deep left vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(2,6,6,0.99) 0%, rgba(2,6,6,0.8) 50%, rgba(2,6,6,0.4) 100%)', zIndex: 1 }} />
      {/* Teal glow right */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 70% at 90% 50%, rgba(0,212,182,0.1) 0%, transparent 65%)`, zIndex: 1 }} />
      {/* Scanline sweep */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '30%',
          background: 'linear-gradient(to bottom, transparent, rgba(0,212,182,0.018), transparent)',
          animation: 'scanline 8s ease-in-out infinite',
        }} />
      </div>
      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,212,182,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,182,0.025) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* ── LEFT ACCENT BAR ── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(to bottom, transparent, ${ACCENT} 30%, ${ACCENT} 70%, transparent)`,
        boxShadow: `0 0 20px rgba(0,212,182,0.5)`, zIndex: 2,
      }} />

      {/* ── TOP TAG ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#ff4d4d', padding: '7px 20px 7px 16px',
          marginLeft: 3,
          clipPath: 'polygon(0 0, 100% 0, 94% 100%, 0 100%)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'livepulse 1s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#fff' }}>
            Flash Sale Live
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="promo-layout">
        <div className="promo-body">

          {/* LEFT: COPY */}
          <div>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}
            >
              <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, transparent, ${ACCENT})` }} />
              <Zap size={11} style={{ color: ACCENT, fill: ACCENT }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(0,212,182,0.8)' }}>
                Ends Midnight · Today Only
              </span>
            </motion.div>

            {/* BIG NUMBER */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              {/* Ghost text behind */}
              <div style={{
                position: 'absolute', top: '-10%', left: -8, zIndex: 0, userSelect: 'none', pointerEvents: 'none',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 'clamp(100px, 22vw, 220px)', fontWeight: 900,
                color: 'rgba(255,255,255,0.022)', letterSpacing: '-0.04em', lineHeight: 1,
              }}>40%</div>

              <div style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <motion.h2
                  initial={{ y: '110%' }} whileInView={{ y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 'clamp(54px, 10vw, 112px)', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '-0.03em',
                    color: '#fff', lineHeight: 0.88, margin: 0,
                  }}
                >
                  Up to 40%
                </motion.h2>
              </div>
              <div style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <motion.h2
                  initial={{ y: '110%' }} whileInView={{ y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 'clamp(54px, 10vw, 112px)', fontWeight: 900,
                    fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em',
                    color: ACCENT, lineHeight: 0.88, margin: 0,
                  }}
                >
                  Off Pro Boots
                </motion.h2>
              </div>
            </div>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              style={{
                fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 300,
                color: 'rgba(255,255,255,0.36)', lineHeight: 1.75,
                maxWidth: 400, margin: '20px 0 32px',
              }}
            >
              Clearance on last season's elite-level boots — all blockchain-verified, all authentic. Sizes going fast. Free shipping included.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="promo-cta-row"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <Link href="/shop?sale=true" className="promo-shop-btn" style={{ textDecoration: 'none' }}>
                Shop the Sale <ArrowRight size={15} />
              </Link>
              <Link href="/shop?deals=true" className="promo-ghost-btn" style={{ textDecoration: 'none' }}>
                View All Deals
              </Link>
            </motion.div>

            {/* Trust pills */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24, alignItems: 'center' }}
            >
              {['Free Shipping', '30-Day Returns', 'Verified Auth'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT, opacity: 0.6 }} />
                  <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: LIVE COUNTDOWN + STATS */}
          <div>
            {/* Live countdown clock */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{
                background: 'rgba(0,212,182,0.05)',
                border: '1px solid rgba(0,212,182,0.15)',
                borderTop: `2px solid ${ACCENT}`,
                padding: '24px 28px', marginBottom: 2,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Glow behind clock */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%', height: '100%',
                background: `radial-gradient(ellipse, rgba(0,212,182,0.06) 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff4d4d', animation: 'livepulse 1s infinite' }} />
                Sale Ends In
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, position: 'relative' }}>
                {/* Hours */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                    fontSize: 'clamp(44px, 7vw, 64px)', letterSpacing: '-0.04em',
                    color: ACCENT, lineHeight: 1, display: 'flex',
                  }}>
                    {pad(time.h).split('').map((d, i) => <Digit key={i} val={d} />)}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.15em', marginTop: 4 }}>HRS</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 900, color: 'rgba(255,255,255,0.2)', lineHeight: 1, paddingBottom: 16 }}>:</div>
                {/* Minutes */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(44px, 7vw, 64px)', letterSpacing: '-0.04em', color: ACCENT, lineHeight: 1, display: 'flex' }}>
                    {pad(time.m).split('').map((d, i) => <Digit key={i} val={d} />)}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.15em', marginTop: 4 }}>MIN</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 900, color: 'rgba(255,255,255,0.2)', lineHeight: 1, paddingBottom: 16 }}>:</div>
                {/* Seconds */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(44px, 7vw, 64px)', letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, display: 'flex' }}>
                    {pad(time.s).split('').map((d, i) => <Digit key={i} val={d} />)}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.15em', marginTop: 4 }}>SEC</div>
                </div>
              </div>
            </motion.div>

            {/* Stat cards */}
            <div className="promo-stats-row">
              {[
                { label: 'Max Discount', value: '40%', sub: 'On selected boots' },
                { label: 'Items on sale', value: '820+', sub: 'Across all brands' },
              ].map((s, i) => (
                <div key={i} className="promo-stat-card">
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)', marginBottom: 4 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM TICKER ── */}
      <div style={{
        position: 'relative', zIndex: 4, overflow: 'hidden',
        background: '#0b100f', padding: '9px 0',
        borderTop: `1px solid rgba(0,212,182,0.1)`,
      }}>
        <div className="promo-ticker">
          {[...Array(2)].map((_, g) =>
            ['FREE SHIPPING', '✦', '30-DAY RETURNS', '✦', 'BLOCKCHAIN VERIFIED', '✦', 'FLASH SALE LIVE NOW', '✦', 'UP TO 40% OFF', '✦', 'LIMITED STOCK', '✦'].map((t, i) => (
              <span key={`${g}-${i}`} style={{
                fontFamily: "'Barlow', sans-serif", fontSize: 9, fontWeight: 800,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                color: t === '✦' ? 'rgba(0,212,182,0.3)' : 'rgba(255,255,255,0.25)',
                padding: '0 20px', whiteSpace: 'nowrap',
              }}>{t}</span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}