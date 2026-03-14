"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, ArrowRight, ArrowUpRight, Heart, MessageCircle } from 'lucide-react';

const ACCENT = '#00d4b6';

interface Post {
  id: string;
  title: string;
  caption: string;
  likes: string;
  comments: string;
  date: string;
  img: string;
  instagramUrl: string;
}

const POSTS: Post[] = [
  {
    id: '01',
    title: 'THE PHANTOM DROP',
    caption: 'The Phantom GX Elite just landed. Blockchain verified. Zero compromise. Shop the link in bio.',
    likes: '12.4K',
    comments: '284',
    date: '2 HOURS AGO',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=90&auto=format&fit=crop',
    instagramUrl: 'https://instagram.com/mdfldmarketplace',
  },
  {
    id: '02',
    title: 'WET PITCH PREDATORS',
    caption: 'Training in the wet. The Predator grips where others slip. Elite is a standard, not a label.',
    likes: '9.1K',
    comments: '193',
    date: '1 DAY AGO',
    img: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=90&auto=format&fit=crop',
    instagramUrl: 'https://instagram.com/mdfldmarketplace',
  },
  {
    id: '03',
    title: '25/26 HOME KITS',
    caption: 'New season. New kit. Same hunger. 2025/26 home shirts are now live — all clubs, all sizes.',
    likes: '7.8K',
    comments: '147',
    date: '3 DAYS AGO',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=90&auto=format&fit=crop',
    instagramUrl: 'https://instagram.com/mdfldmarketplace',
  },
  {
    id: '04',
    title: 'MIDFIELD ESSENTIALS',
    caption: 'Everyday utility meets professional grade. Accessorize your game.',
    likes: '15.2K',
    comments: '412',
    date: '1 WEEK AGO',
    img: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=90&auto=format&fit=crop',
    instagramUrl: 'https://instagram.com/mdfldmarketplace',
  },
];

export default function EditorialRosterFeed() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activePost = POSTS[activeIndex];

  return (
    <section style={{
      background: '#020606', // Pure dark theme
      padding: 'clamp(80px, 10vw, 140px) clamp(24px, 5vw, 64px)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── THE ROSTER LIST ITEM ── */
        .roster-item {
          display: flex;
          align-items: center;
          padding: clamp(24px, 4vw, 48px) 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          color: rgba(255, 255, 255, 0.3);
          position: relative;
        }

        .roster-item:first-child {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Hover & Active States */
        .roster-item:hover, .roster-item.active {
          color: #fff;
          border-bottom-color: rgba(255, 255, 255, 0.3);
        }

        .roster-title {
          font-family: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif";
          font-size: clamp(28px, 4.5vw, 64px);
          font-weight: 700;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          line-height: 1;
          margin-left: 24px;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s ease;
          transform-origin: left;
        }

        .roster-item:hover .roster-title, .roster-item.active .roster-title {
          transform: translateX(16px);
        }

        /* Dynamic underline strike on active */
        .roster-strike {
          position: absolute;
          top: 50%;
          left: 0;
          height: 3px;
          background: ${ACCENT};
          transform-origin: left;
          z-index: 10;
        }

        /* ── IMAGE CONTAINER ── */
        .image-viewer {
          position: sticky;
          top: 120px; /* Accounts for navbar */
          width: 100%;
          aspect-ratio: 4 / 5;
          background: #0a0a0a;
          overflow: hidden;
        }

        /* Responsive Layout */
        .roster-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
        }
        @media (min-width: 1024px) {
          .roster-layout {
            grid-template-columns: 1.2fr 0.8fr;
            gap: 80px;
            align-items: start;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1600, margin: '0 auto' }}>

        {/* ── HEADER ROW (Matching 'Find Your Position' perfectly) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 'clamp(60px, 8vw, 80px)' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
          >
            <div style={{ width: 32, height: 1.5, background: `linear-gradient(90deg, ${ACCENT} 0%, transparent 100%)` }} />
            <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              On The Pitch
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05 }}
          >
            Join The{' '}
            <span style={{ 
                background: `linear-gradient(135deg, ${ACCENT} 0%, rgba(0, 212, 182, 0.7) 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}>
              Community
            </span>
          </motion.h2>
        </div>

        {/* ── THE INTERACTIVE ROSTER LAYOUT ── */}
        <div className="roster-layout">
          
          {/* LEFT: Massive Typography List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {POSTS.map((post, index) => {
              const isActive = activeIndex === index;
              return (
                <div 
                  key={post.id}
                  className={`roster-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)} // For mobile taps
                >
                  {/* Striker line for active state */}
                  <motion.div 
                    className="roster-strike"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: '80px' }}
                  />

                  {/* Number */}
                  <span style={{ 
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, fontWeight: 600, 
                    opacity: isActive ? 1 : 0.4, transition: 'opacity 0.3s' 
                  }}>
                    {post.id}
                  </span>

                  {/* Title */}
                  <h3 className="roster-title">
                    {post.title}
                  </h3>

                  {/* Arrow indicating active */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <motion.div
                      animate={{ x: isActive ? 0 : -20, opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ArrowRight size={28} color={ACCENT} />
                    </motion.div>
                  </div>
                </div>
              );
            })}

            {/* CTA Button under list */}
            <motion.div 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              style={{ marginTop: 64 }}
            >
              <a href="https://instagram.com/mdfldmarketplace" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '18px 40px', textDecoration: 'none', transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
              >
                <Instagram size={16} /> View Instagram
              </a>
            </motion.div>
          </div>

          {/* RIGHT: Cinematic Image Viewer */}
          <div className="image-viewer">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePost.id}
                initial={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              >
                <img 
                  src={activePost.img} 
                  alt={activePost.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                
                {/* Image Overlays */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                
                {/* Top Tag */}
                <div style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Instagram size={14} color="#fff" />
                  <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>@MIDFIELD.FC</span>
                </div>

                {/* Bottom Content Tray */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 32px' }}>
                  <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                    {activePost.date}
                  </span>
                  <p style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 500, color: '#fff', lineHeight: 1.6, margin: '0 0 24px 0', maxWidth: 400 }}>
                    {activePost.caption}
                  </p>
                  
                  {/* Stats & Link */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Heart size={16} color={ACCENT} fill={ACCENT} />
                        <span style={{ fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{activePost.likes}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MessageCircle size={16} color="#fff" />
                        <span style={{ fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{activePost.comments}</span>
                      </div>
                    </div>
                    
                    <a href={activePost.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', textDecoration: 'none', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Open Post <ArrowUpRight size={14} color={ACCENT} />
                    </a>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}