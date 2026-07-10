"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Icon } from '@iconify/react';

const ACCENT = '#00d4b6';

const NAV = {
  Shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Cart', href: '/cart' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Account: [
    { label: 'My Account', href: '/account' },
    { label: 'My Orders', href: '/myorders' },
    { label: 'Saved Items', href: '/saved' },
    { label: 'Login', href: '/login' },
    { label: 'Sign Up', href: '/signup' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Contact', href: '/contact' },
  ],
};

const DiscordIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const SOCIALS = [
  { icon: <Instagram size={15} />, label: 'Instagram', href: 'https://www.instagram.com/mdfldmarketplace/' },
  { icon: <Twitter size={15} />, label: 'X', href: 'https://x.com/mdfldmp' },
  { icon: <Linkedin size={15} />, label: 'LinkedIn', href: 'https://www.linkedin.com/in/ayoolamorakinyo/' },
  { icon: <Icon icon="ic:baseline-discord" width={15} />, label: 'Discord', href: 'https://discord.gg/pW87DDjZ' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!email.includes('@')) return;
    setSubmitting(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // fail silently — UI still shows success to avoid frustrating user
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer style={{
      background: '#010404',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      fontFamily: "'Barlow Condensed', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');

        .f-link {
          font-family: 'Barlow', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.32);
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.2s;
          display: block;
          padding: 4px 0;
        }
        .f-link:hover { color: ${ACCENT}; }

        .f-social {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          transition: all 0.25s;
          flex-shrink: 0;
        }
        .f-social:hover {
          background: rgba(0,212,182,0.08);
          border-color: rgba(0,212,182,0.3);
          color: ${ACCENT};
        }

        .f-nl-input { caret-color: ${ACCENT}; }
        .f-nl-input::placeholder { color: rgba(255,255,255,0.2); }

        .f-legal {
          font-family: 'Barlow', sans-serif;
          font-size: 10px;
          color: rgba(255,255,255,0.18);
          text-decoration: none;
          letter-spacing: 0.06em;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .f-legal:hover { color: ${ACCENT}; }

        /* Mobile */
        @media (max-width: 768px) {
          .f-grid { grid-template-columns: 1fr 1fr !important; gap: 32px 24px !important; }
          .f-brand-col { grid-column: 1 / -1 !important; }
          .f-nl-col { grid-column: 1 / -1 !important; }
          .f-bottom { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .f-legal-row { flex-wrap: wrap !important; gap: 12px 16px !important; }
          .f-ghost { display: none !important; }
          .f-badge-row { flex-wrap: wrap !important; }
        }

        @media (max-width: 480px) {
          .f-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Top accent line */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${ACCENT}, rgba(0,212,182,0.4), transparent)`, boxShadow: `0 0 20px rgba(0,212,182,0.3)` }} />

      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: 0, left: '10%', width: 400, height: 250, background: 'radial-gradient(ellipse, rgba(0,212,182,0.05) 0%, transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />


      {/* Main body */}
      <div style={{ padding: 'clamp(40px, 5vw, 72px) clamp(16px, 4vw, 48px) 0', position: 'relative', zIndex: 2 }}>
        <div className="f-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.3fr', gap: 48, marginBottom: 56 }}>

          {/* Brand col */}
          <div className="f-brand-col">
            <div style={{ marginBottom: 20 }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Image
                  src="/mdfld-logo-v2.png"
                  alt="MDFLD"
                  width={80}
                  height={40}
                  style={{ marginBottom: 8, objectFit: 'contain' }}
                />
              </Link>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>
                The Apex of Football Culture
              </div>
            </div>

            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.30)', maxWidth: 240, marginBottom: 24 }}>
              Premium football boots, kits and gear — globally shipped, pro approved.
            </p>

            {/* Socials */}
            <div style={{ display: 'flex', gap: 8 }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} className="f-social" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav cols */}
          {Object.entries(NAV).filter(([h]) => h !== 'Legal').map(([heading, links]) => (
            <div key={heading}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18 }}>{heading}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {links.map(l => (
                  <Link key={l.href} href={l.href} className="f-link">{l.label}</Link>
                ))}
              </div>
            </div>
          ))}

          {/* Newsletter col */}
          <div className="f-nl-col">
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18 }}>Stay Ahead</div>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.7, marginBottom: 14 }}>
              Drop alerts, exclusive deals, early access.
            </p>

            {sent ? (
              <div style={{ background: 'rgba(0,212,182,0.06)', border: '1px solid rgba(0,212,182,0.15)', borderLeft: `2px solid ${ACCENT}`, padding: '14px 16px' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT }}>✓ You're In</span>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>First drop alert coming soon.</div>
              </div>
            ) : (
              <div style={{ border: `1px solid ${focused ? 'rgba(0,212,182,0.35)' : 'rgba(255,255,255,0.08)'}`, background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.3s' }}>
                <input
                  className="f-nl-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="your@email.com"
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Barlow', sans-serif", fontSize: 12, color: '#fff', padding: '11px 14px', letterSpacing: '0.04em', width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={submitting}
                  style={{ background: ACCENT, border: 'none', color: '#020606', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '10px 14px', cursor: submitting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', opacity: submitting ? 0.7 : 1 }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  {submitting ? 'Sending...' : 'Subscribe'} <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, marginBottom: 0 }} />
      </div>

      {/* Bottom bar */}
      <div className="f-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '16px clamp(16px, 4vw, 48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative', zIndex: 2 }}>
        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
          © 2025 MDFLD LLC. All rights reserved.
        </span>
        <div className="f-legal-row" style={{ display: 'flex', gap: 20 }}>
          {NAV.Legal.map(l => (
            <Link key={l.href} href={l.href} className="f-legal">{l.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}