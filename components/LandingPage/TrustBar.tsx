"use client"
import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Zap } from 'lucide-react';

const ACCENT = '#00d4b6';

const ITEMS = [
  { 
    type: 'brand', 
    name: 'NIKE', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' 
  },
  { type: 'trust', icon: ShieldCheck, text: 'BLOCKCHAIN VERIFIED' },
  { 
    type: 'brand', 
    name: 'ADIDAS', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' 
  },
  { type: 'trust', icon: Truck, text: 'FREE GLOBAL SHIPPING' },
  { 
    type: 'brand', 
    name: 'PUMA', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Puma_Logo.svg' 
  },
  { type: 'trust', icon: RotateCcw, text: '30-DAY RETURNS' },
  { 
    type: 'brand', 
    name: 'UNDER ARMOUR', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Under_armour_logo.svg' 
  },
  { type: 'trust', icon: Zap, text: 'SAME-DAY DISPATCH' },
];

export default function LogoTrustMarquee() {
  // Looped 4 times to ensure it fills ultra-wide screens smoothly
  const LOOPED_ITEMS = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <section style={{
      background: '#020606', // Deep pure black to match your theme
      padding: '24px 0',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&family=Barlow:wght@600;700&display=swap');
        
        @keyframes high-contrast-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .hq-marquee-track {
          display: flex;
          align-items: center;
          gap: 60px; /* Generous breathing room */
          width: max-content;
          animation: high-contrast-scroll 25s linear infinite;
          will-change: transform;
        }

        .hq-marquee-track:hover {
          animation-play-state: paused;
        }

        /* ── BRAND LOGOS ── */
        .hq-brand-logo {
          height: 28px; /* Perfectly sized logos */
          object-fit: contain;
          /* Magic filter: Turns black SVGs into pure white */
          filter: brightness(0) invert(1);
          opacity: 0.85;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        /* Hover effect: Turns the logo to your neon accent color */
        .hq-brand-logo:hover {
          opacity: 1;
          filter: brightness(0) saturate(100%) invert(67%) sepia(54%) saturate(3015%) hue-rotate(124deg) brightness(98%) contrast(105%);
          transform: scale(1.1);
        }

        /* ── TRUST BADGES ── */
        .hq-trust-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ffffff; /* PURE WHITE TEXT - NO OPACITY FADES */
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.1em;
          white-space: nowrap;
          cursor: default;
          padding: 8px 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 100px;
          transition: all 0.3s ease;
        }

        .hq-trust-badge:hover {
          background: rgba(0, 212, 182, 0.1);
          border-color: ${ACCENT};
          box-shadow: 0 0 20px rgba(0, 212, 182, 0.2);
          transform: translateY(-2px);
        }

        .hq-trust-icon {
          color: ${ACCENT};
        }

        /* Separator Star */
        .hq-separator {
          color: rgba(255,255,255,0.2);
          font-size: 12px;
        }

        /* Gradient fades on the edges so it doesn't just cut off harshly */
        .hq-fade-left { position: absolute; left: 0; top: 0; bottom: 0; width: 80px; background: linear-gradient(to right, #020606 0%, transparent 100%); z-index: 2; pointer-events: none; }
        .hq-fade-right { position: absolute; right: 0; top: 0; bottom: 0; width: 80px; background: linear-gradient(to left, #020606 0%, transparent 100%); z-index: 2; pointer-events: none; }
      `}</style>

      <div className="hq-fade-left" />
      <div className="hq-fade-right" />

      <div className="hq-marquee-track">
        {LOOPED_ITEMS.map((item, i) => (
          <React.Fragment key={i}>
            
            {/* Render Logo or Trust Badge */}
            {item.type === 'brand' ? (
              <img 
                src={item.logo} 
                alt={item.name} 
                className="hq-brand-logo"
                title={`Shop ${item.name}`}
              />
            ) : (
              <div className="hq-trust-badge">
                {item.icon && React.createElement(item.icon, { size: 20, className: 'hq-trust-icon', strokeWidth: 2.5 })}
                <span>{item.text}</span>
              </div>
            )}
            
            {/* Separator */}
            <span className="hq-separator">✦</span>
            
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}