import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const ACCENT = '#00d4b6';

const ATHLETES = [
  {
    id: 0,
    name: 'Kylian Dupont',
    role: 'Striker · Ligue 1',
    brand: 'Nike',
    boot: 'Mercurial Superfly 10',
    stat: '34 Goals',
    statLabel: 'This Season',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80&auto=format&fit=crop',
    quote: 'Speed is everything. The Superfly gives me the edge.',
    accentColor: '#00d4b6',
  },
  {
    id: 1,
    name: 'Marco Bellini',
    role: 'Midfielder · Serie A',
    brand: 'Adidas',
    boot: 'Predator Elite',
    stat: '18 Assists',
    statLabel: 'This Season',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=80&auto=format&fit=crop',
    quote: 'Control the ball, control the game.',
    accentColor: '#00d4b6',
  },
  {
    id: 2,
    name: 'Aisha Mensah',
    role: 'Captain · WSL',
    brand: 'Puma',
    boot: 'Future 7 Ultimate',
    stat: '12 MOTM',
    statLabel: 'Awards',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80&auto=format&fit=crop',
    quote: 'The pitch is mine. These boots prove it.',
    accentColor: '#00d4b6',
  },
  {
    id: 3,
    name: 'Sven Hartmann',
    role: 'Defender · Bundesliga',
    brand: 'New Balance',
    boot: 'Furon v7 Pro',
    stat: '0.3 Goals',
    statLabel: 'Conceded/90',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&q=80&auto=format&fit=crop',
    quote: 'Defend with precision. Attack with power.',
    accentColor: '#00d4b6',
  },
];

function AthleteCard({ athlete, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${hovered ? 'rgba(0,212,182,0.3)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'border-color 0.35s',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 320, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={athlete.img} alt={athlete.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: hovered ? 'brightness(0.5) saturate(1.1)' : 'brightness(0.38) saturate(0.6)',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'filter 0.55s ease, transform 0.7s ease',
          }}
        />
        {/* Gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,6,6,1) 0%, rgba(2,6,6,0.3) 50%, transparent 100%)' }} />

        {/* Brand pill */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          background: hovered ? ACCENT : 'rgba(2,6,6,0.7)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${hovered ? ACCENT : 'rgba(255,255,255,0.1)'}`,
          color: hovered ? '#020606' : 'rgba(255,255,255,0.5)',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 9, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase',
          padding: '5px 12px', transition: 'all 0.3s',
        }}>{athlete.brand}</div>

        {/* Stat bubble */}
        <div style={{
          position: 'absolute', top: 16, right: 16, textAlign: 'right',
        }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: ACCENT, letterSpacing: '-0.03em', lineHeight: 1 }}>{athlete.stat}</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{athlete.statLabel}</div>
        </div>

        {/* Quote on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute', bottom: 16, left: 16, right: 16,
            fontFamily: "'Barlow', sans-serif", fontSize: 13, fontStyle: 'italic',
            fontWeight: 300, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
            borderLeft: `2px solid ${ACCENT}`, paddingLeft: 12,
          }}
        >"{athlete.quote}"</motion.div>
      </div>

      {/* Info */}
      <div style={{
        padding: '18px 20px 20px',
        background: hovered ? 'rgba(0,212,182,0.04)' : 'rgba(10,15,14,0.9)',
        transition: 'background 0.35s', flex: 1,
        borderTop: `1px solid ${hovered ? 'rgba(0,212,182,0.15)' : 'rgba(255,255,255,0.05)'}`,
      }}>
        <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>{athlete.role}</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#fff', marginBottom: 6 }}>{athlete.name}</div>
        <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          Wears: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{athlete.boot}</span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{
        height: 2, background: ACCENT,
        transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left', transition: 'transform 0.4s ease',
      }} />
    </motion.div>
  );
}

export default function ProAthletes() {
  return (
    <section style={{
      background: '#030909',
      padding: 'clamp(64px, 8vw, 104px) clamp(20px, 4vw, 52px)',
      fontFamily: "'Barlow Condensed', sans-serif",
      borderTop: '1px solid rgba(255,255,255,0.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,900;1,900&family=Barlow:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Ambient */}
      <div style={{ position: 'absolute', top: '-10%', right: '15%', width: 600, height: 500, background: 'radial-gradient(ellipse, rgba(0,212,182,0.05) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
        <div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star style={{ width: 10, height: 10, fill: ACCENT, color: 'transparent' }} />
            Pro Endorsed
          </div>
          <div style={{ overflow: 'hidden' }}>
            <motion.h2
              initial={{ y: '110%' }} whileInView={{ y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', color: '#fff', lineHeight: 0.88, margin: 0 }}
            >
              Worn At The<br /><span style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, #00bba4 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Highest Level.</span>
            </motion.h2>
          </div>
        </div>

        <div style={{ maxWidth: 320 }}>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75, marginBottom: 20 }}>
            Every boot on Midfield is trusted by elite footballers across the world's top leagues.
          </p>
          <a href="#" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 800,
            letterSpacing: '0.25em', textTransform: 'uppercase',
            color: ACCENT, textDecoration: 'none',
            borderBottom: `1px solid rgba(0,212,182,0.3)`, paddingBottom: 4,
          }}>
            See All Pro Picks <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {ATHLETES.map((a, i) => <AthleteCard key={a.id} athlete={a} index={i} />)}
      </div>

      {/* Bottom strip */}
      <motion.div
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: 48, padding: '24px 32px',
          background: 'rgba(0,212,182,0.04)', border: '1px solid rgba(0,212,182,0.12)',
          borderLeft: `2px solid ${ACCENT}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          {[
            { n: '200+', l: 'Pro Athletes' },
            { n: '40+', l: 'Countries Represented' },
            { n: '8', l: 'Top Leagues' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: ACCENT, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <a href="#" style={{
          background: ACCENT, color: '#020606', border: 'none',
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 900,
          letterSpacing: '0.25em', textTransform: 'uppercase',
          padding: '14px 32px', cursor: 'pointer', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          Shop Pro Picks <ArrowRight style={{ width: 15, height: 15 }} />
        </a>
      </motion.div>
    </section>
  );
}