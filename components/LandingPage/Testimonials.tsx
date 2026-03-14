import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ShieldCheck, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const ACCENT = '#00d4b6';
const ACCENT2 = '#00ffcc';

const TESTIMONIALS = [
  {
    id: 0,
    name: 'Marcus T.',
    role: 'Semi-Pro · West Ham Academy',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&auto=format&fit=crop&crop=face',
    rating: 5,
    product: 'Nike Mercurial Superfly 10',
    productTag: 'SPEED',
    text: "I've bought from a dozen sites and Midfield is the only one where I felt 100% confident about authenticity. The blockchain cert is a genuine game-changer. Boots arrived in 2 days, perfect condition.",
    verified: true,
    date: '3 days ago',
    country: '🇬🇧',
    index: '01',
  },
  {
    id: 1,
    name: 'Sofia R.',
    role: 'Club Captain · Barcelona FC Women',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&auto=format&fit=crop&crop=face',
    rating: 5,
    product: 'Adidas Predator Elite',
    productTag: 'CONTROL',
    text: "The curation here is exceptional — not just boots but complete kits and training gear for elite female players. Finally a platform that takes women's football seriously. Customer service is elite.",
    verified: true,
    date: '1 week ago',
    country: '🇪🇸',
    index: '02',
  },
  {
    id: 2,
    name: 'Jordan K.',
    role: 'Goalkeeper Coach · MLS',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80&auto=format&fit=crop&crop=face',
    rating: 5,
    product: 'Puma Future 7 Ultimate',
    productTag: 'AGILITY',
    text: "Ordered custom sizes for my squad — 14 pairs shipped to the US, all verified, all perfect. The bulk order process was seamless and savings vs retail were significant. Midfield is our team's go-to.",
    verified: true,
    date: '2 weeks ago',
    country: '🇺🇸',
    index: '03',
  },
  {
    id: 3,
    name: 'Amara D.',
    role: 'Youth Player · Grassroots',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&auto=format&fit=crop&crop=face',
    rating: 5,
    product: 'New Balance Furon v7',
    productTag: 'POWER',
    text: "Got my first proper boots here at a massive discount. Even as a regular player, not a pro — the experience felt premium. Returns were easy when I needed a half size up.",
    verified: true,
    date: '3 weeks ago',
    country: '🇳🇬',
    index: '04',
  },
];

const STATS = [
  { n: '4.9', unit: '/5', l: 'Rating' },
  { n: '28K', unit: '+', l: 'Reviews' },
  { n: '99', unit: '%', l: 'Recommend' },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const dragX = useMotionValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const go = useCallback((direction: number) => {
    setDir(direction);
    setActive(prev => (prev + direction + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!autoPlay) return;
    timerRef.current = setInterval(() => go(1), 5500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoPlay, go]);

  const pauseAuto = () => {
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 8000);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 60) {
      pauseAuto();
      go(info.offset.x < 0 ? 1 : -1);
    }
    setDragging(false);
  };

  const t = TESTIMONIALS[active];

  return (
    <section style={{
      background: '#020808',
      padding: 'clamp(56px, 8vw, 112px) 0',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Barlow', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap');

        .tm-root * { box-sizing: border-box; }

        /* ── Scan lines ── */
        .tm-scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.06) 3px,
            rgba(0,0,0,0.06) 4px
          );
        }

        /* ── Grid bg ── */
        .tm-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(0,212,182,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,182,0.04) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .tm-grid::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% 100%, rgba(0,212,182,0.06), transparent 70%);
        }

        /* ── Corner marks ── */
        .tm-corner {
          position: absolute; width: 28px; height: 28px;
          border-color: rgba(0,212,182,0.3); border-style: solid;
          pointer-events: none; z-index: 3;
        }
        .tm-corner-tl { top: 20px; left: 20px; border-width: 2px 0 0 2px; }
        .tm-corner-tr { top: 20px; right: 20px; border-width: 2px 2px 0 0; }
        .tm-corner-bl { bottom: 20px; left: 20px; border-width: 0 0 2px 2px; }
        .tm-corner-br { bottom: 20px; right: 20px; border-width: 0 2px 2px 0; }

        /* ── BIG ghost text ── */
        .tm-ghost {
          position: absolute;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(100px, 22vw, 300px);
          font-weight: 900;
          color: transparent;
          -webkit-text-stroke: 1px rgba(0,212,182,0.05);
          text-transform: uppercase;
          letter-spacing: -0.05em;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
          z-index: 0;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          transition: opacity 0.5s ease;
        }

        /* ── Progress dots ── */
        .tm-dots { display: flex; gap: 6px; align-items: center; }
        .tm-dot {
          height: 2px; border-radius: 2px;
          background: rgba(255,255,255,0.15);
          transition: all 0.4s ease;
          cursor: pointer;
        }
        .tm-dot.active {
          background: ${ACCENT};
          box-shadow: 0 0 8px rgba(0,212,182,0.5);
        }

        /* ── Stat items ── */
        .tm-stat { text-align: center; }
        .tm-stat-n {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 900;
          color: ${ACCENT};
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .tm-stat-unit { font-size: 0.5em; color: rgba(0,212,182,0.6); }
        .tm-stat-l {
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: rgba(255,255,255,0.2); margin-top: 5px;
        }

        /* ── Sidebar tabs ── */
        .tm-tab {
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.05);
          border-left: 2px solid transparent;
          background: rgba(255,255,255,0.02);
          padding: 14px 16px;
          display: flex; align-items: center; gap: 10px;
          transition: all 0.25s ease;
        }
        .tm-tab.active {
          background: rgba(0,212,182,0.06);
          border-color: rgba(0,212,182,0.2);
          border-left-color: ${ACCENT};
        }
        .tm-tab:hover:not(.active) {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }
        .tm-tab-avatar {
          width: 34px; height: 34px; border-radius: 50%; object-fit: cover;
          flex-shrink: 0;
          filter: saturate(0.3) brightness(0.5);
          transition: all 0.3s ease;
          border: 1.5px solid transparent;
        }
        .tm-tab.active .tm-tab-avatar {
          filter: none;
          border-color: ${ACCENT};
        }

        /* ── Quote card ── */
        .tm-card {
          position: relative;
          background: rgba(5,14,13,0.95);
          border: 1px solid rgba(255,255,255,0.07);
          border-left: 3px solid ${ACCENT};
          padding: clamp(28px, 5vw, 52px);
          overflow: hidden;
          flex: 1;
        }
        .tm-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, ${ACCENT}, transparent 50%);
        }

        /* ── Index counter ── */
        .tm-index {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.3em;
          color: rgba(0,212,182,0.5);
        }

        /* ── Mobile card swipe ── */
        @media (max-width: 767px) {
          .tm-card {
            border-left: none;
            border-top: 3px solid ${ACCENT};
          }
        }

        /* ── Product pill ── */
        .tm-product-pill {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(0,212,182,0.2);
          background: rgba(0,212,182,0.06);
          padding: 5px 12px;
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(0,212,182,0.8);
          margin-bottom: 18px;
        }
        .tm-product-tag {
          background: ${ACCENT};
          color: #020808;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 0.15em;
          padding: 2px 5px;
        }

        /* ── Nav arrows ── */
        .tm-arrow {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: none;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .tm-arrow-outline {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .tm-arrow-outline:hover {
          border-color: ${ACCENT};
          background: rgba(0,212,182,0.08);
        }
        .tm-arrow-solid {
          background: ${ACCENT};
          border: 1px solid ${ACCENT};
        }
        .tm-arrow-solid:hover {
          background: ${ACCENT2};
        }

        /* ── Glitch effect on name ── */
        @keyframes glitch {
          0%   { clip-path: inset(40% 0 61% 0); transform: skewX(-3deg); }
          20%  { clip-path: inset(92% 0 1% 0); transform: skewX(3deg); }
          40%  { clip-path: inset(43% 0 1% 0); transform: skewX(0deg); }
          60%  { clip-path: inset(25% 0 58% 0); transform: skewX(-1deg); }
          80%  { clip-path: inset(54% 0 7% 0); transform: skewX(2deg); }
          100% { clip-path: inset(58% 0 43% 0); transform: skewX(-2deg); }
        }

        /* ── Shimmer bar ── */
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* ── autoplay progress ── */
        @keyframes progress-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .tm-progress-bar {
          transform-origin: left;
          animation: progress-bar 5.5s linear infinite;
          height: 2px;
          background: ${ACCENT};
          box-shadow: 0 0 8px rgba(0,212,182,0.6);
        }

        /* ── Verified badge pulse ── */
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .tm-verified-pulse::after {
          content: '';
          position: absolute; inset: -3px;
          border-radius: 50%;
          border: 1px solid ${ACCENT};
          animation: pulse-ring 1.8s ease-out infinite;
        }
      `}</style>

      {/* Decorative layer */}
      <div className="tm-grid" />
      <div className="tm-scanlines" />
      <div className="tm-ghost">{t.productTag}</div>
      <div className="tm-corner tm-corner-tl" />
      <div className="tm-corner tm-corner-tr" />
      <div className="tm-corner tm-corner-bl" />
      <div className="tm-corner tm-corner-br" />

      <div className="tm-root" style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 'clamp(40px, 6vw, 72px)' }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 1, background: ACCENT }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: ACCENT }}>
              Verified Reviews
            </span>
            <ShieldCheck size={10} color={ACCENT} />
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '-0.03em',
              color: '#fff', lineHeight: 0.88, margin: 0,
            }}>
              Trusted By<br />
              <span style={{
                color: ACCENT,
                textShadow: `0 0 40px rgba(0,212,182,0.25)`,
                position: 'relative', display: 'inline-block',
              }}>
                The Game's
              </span>{' '}
              <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)', color: 'transparent' }}>Best.</span>
            </h2>

            {/* Stats — right side on desktop, below on mobile */}
            <div style={{ display: 'flex', gap: 'clamp(20px, 4vw, 48px)', alignItems: 'flex-end' }}>
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  className="tm-stat"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                >
                  <div className="tm-stat-n">
                    {s.n}<span className="tm-stat-unit">{s.unit}</span>
                  </div>
                  <div className="tm-stat-l">{s.l}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', marginTop: 8 }}>
            <motion.div
              key={active}
              className="tm-progress-bar"
              style={{ position: 'absolute', inset: 0 }}
            />
          </div>
        </div>

        {/* ── MAIN LAYOUT ── */}
        {/* Desktop: quote card + sidebar tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 3,
          alignItems: 'stretch',
          marginBottom: 32,
        }}
          className="desktop-grid"
        >
          <style>{`
            @media (max-width: 767px) {
              .desktop-grid { grid-template-columns: 1fr !important; }
              .desktop-sidebar { display: none !important; }
            }
          `}</style>

          {/* ── QUOTE CARD ── */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={active}
              className="tm-card"
              custom={dir}
              initial={{ opacity: 0, x: dir * 50, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: dir * -50, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setDragging(true)}
              onDragEnd={handleDragEnd}
              style={{ cursor: dragging ? 'grabbing' : 'grab', x: dragX }}
            >
              {/* Shimmer sweep */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '40%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(0,212,182,0.025), transparent)',
                  animation: 'shimmer 4s ease-in-out infinite',
                }} />
              </div>

              {/* Index */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <span className="tm-index">Review {t.index}/{TESTIMONIALS.length.toString().padStart(2, '0')}</span>
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}>{t.date}</span>
              </div>

              {/* Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 400 }}
                  >
                    <Star size={13} fill={ACCENT} color="transparent" />
                  </motion.div>
                ))}
              </div>

              {/* Product pill */}
              <div className="tm-product-pill">
                <span className="tm-product-tag">{t.productTag}</span>
                {t.product}
              </div>

              {/* Quote text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: 'clamp(14px, 1.7vw, 18px)',
                  fontWeight: 300,
                  lineHeight: 1.8,
                  color: 'rgba(255,255,255,0.75)',
                  marginBottom: 32,
                  position: 'relative',
                }}
              >
                <span style={{
                  position: 'absolute', top: -8, left: -8,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 80, fontWeight: 900,
                  color: 'rgba(0,212,182,0.07)', lineHeight: 1,
                  pointerEvents: 'none', userSelect: 'none',
                }}>
                  "
                </span>
                "{t.text}"
              </motion.p>

              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={t.avatar}
                    alt={t.name}
                    style={{
                      width: 46, height: 46, borderRadius: '50%', objectFit: 'cover',
                      border: `2px solid ${ACCENT}`,
                      boxShadow: `0 0 0 4px rgba(0,212,182,0.1), 0 0 20px rgba(0,212,182,0.2)`,
                    }}
                  />
                  {/* Pulse ring */}
                  <div className="tm-verified-pulse" style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#020808',
                    border: `1.5px solid ${ACCENT}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ShieldCheck size={7} color={ACCENT} />
                  </div>
                </div>

                <div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 19, fontWeight: 900, textTransform: 'uppercase',
                    color: '#fff', letterSpacing: '0.02em', lineHeight: 1,
                  }}>
                    {t.name} <span style={{ fontSize: 16 }}>{t.country}</span>
                  </div>
                  <div style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: 9, color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.15em', marginTop: 3,
                  }}>
                    {t.role}
                  </div>
                </div>

                {t.verified && (
                  <div style={{
                    marginLeft: 'auto',
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(0,212,182,0.08)',
                    border: '1px solid rgba(0,212,182,0.22)',
                    padding: '6px 10px',
                  }}>
                    <ShieldCheck size={9} color={ACCENT} />
                    <span style={{
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: 7, fontWeight: 700, letterSpacing: '0.22em',
                      textTransform: 'uppercase', color: ACCENT,
                    }}>Verified Purchase</span>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── SIDEBAR TABS — desktop only ── */}
          <div className="desktop-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {TESTIMONIALS.map((item, i) => (
              <div
                key={item.id}
                className={`tm-tab${active === i ? ' active' : ''}`}
                onClick={() => { pauseAuto(); setDir(i > active ? 1 : -1); setActive(i); }}
              >
                <img src={item.avatar} alt={item.name} className="tm-tab-avatar" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13, fontWeight: 800, textTransform: 'uppercase',
                    color: active === i ? '#fff' : 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.03em', lineHeight: 1, marginBottom: 3,
                    transition: 'color 0.25s',
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: 7.5, color: 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.1em', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.role}
                  </div>
                </div>
                <ArrowUpRight
                  size={12}
                  color={active === i ? ACCENT : 'rgba(255,255,255,0.1)'}
                  style={{ flexShrink: 0, transition: 'color 0.25s' }}
                />
              </div>
            ))}

            {/* Tap hint on mobile */}
            <div style={{
              marginTop: 12, padding: '10px 16px',
              border: '1px dashed rgba(255,255,255,0.06)',
              fontFamily: "'Barlow', sans-serif",
              fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.15)', textAlign: 'center',
            }}>
              Swipe card to navigate
            </div>
          </div>
        </div>

        {/* ── MOBILE: Review thumbnail strip ── */}
        <style>{`
          .tm-mobile-strip { display: none; }
          @media (max-width: 767px) {
            .tm-mobile-strip { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
            .tm-mobile-strip::-webkit-scrollbar { display: none; }
          }
        `}</style>

        <div className="tm-mobile-strip">
          {TESTIMONIALS.map((item, i) => (
            <div
              key={item.id}
              onClick={() => { pauseAuto(); setDir(i > active ? 1 : -1); setActive(i); }}
              style={{
                flexShrink: 0,
                width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                cursor: 'pointer',
              }}
            >
              <img
                src={item.avatar}
                alt={item.name}
                style={{
                  width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                  border: `2px solid ${active === i ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                  filter: active === i ? 'none' : 'brightness(0.4) saturate(0.3)',
                  transition: 'all 0.3s ease',
                  boxShadow: active === i ? `0 0 12px rgba(0,212,182,0.4)` : 'none',
                }}
              />
              <div style={{
                width: active === i ? 20 : 6, height: 2, borderRadius: 2,
                background: active === i ? ACCENT : 'rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
              }} />
            </div>
          ))}
        </div>

        {/* ── BOTTOM ROW: nav + dots ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Nav arrows */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="tm-arrow tm-arrow-outline"
              onClick={() => { pauseAuto(); go(-1); }}
              aria-label="Previous"
            >
              <ChevronLeft size={17} color="rgba(255,255,255,0.6)" />
            </button>
            <button
              className="tm-arrow tm-arrow-solid"
              onClick={() => { pauseAuto(); go(1); }}
              aria-label="Next"
            >
              <ChevronRight size={17} color="#020808" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="tm-dots">
            {TESTIMONIALS.map((_, i) => (
              <div
                key={i}
                className={`tm-dot${active === i ? ' active' : ''}`}
                style={{ width: active === i ? 28 : 8 }}
                onClick={() => { pauseAuto(); setDir(i > active ? 1 : -1); setActive(i); }}
              />
            ))}
          </div>

          {/* Counter */}
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.15em',
          }}>
            {String(active + 1).padStart(2, '0')} / {String(TESTIMONIALS.length).padStart(2, '0')}
          </div>
        </div>
      </div>
    </section>
  );
}