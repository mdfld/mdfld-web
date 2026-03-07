"use client"
import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const ACCENT = '#00d4b6';

interface Category {
  id: number;
  label: string;
  count: string;
  img: string;
  tag: string;
  span: 'large' | 'small';
}

const CATEGORIES: Category[] = [
  {
    id: 0,
    label: 'Football Boots',
    count: '4,200+ items',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&auto=format&fit=crop',
    tag: 'Most Popular',
    span: 'large',
  },
  {
    id: 1,
    label: 'Match Kits',
    count: '1,800+ items',
    img: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?w=800&q=80&auto=format&fit=crop',
    tag: 'New Season',
    span: 'small',
  },
  {
    id: 2,
    label: 'Goalkeeper',
    count: '620+ items',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80&auto=format&fit=crop',
    tag: 'Pro Grade',
    span: 'small',
  },
  {
    id: 3,
    label: 'Training Gear',
    count: '2,100+ items',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80&auto=format&fit=crop',
    tag: 'Trending',
    span: 'small',
  },
  {
    id: 4,
    label: 'Accessories',
    count: '980+ items',
    img: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=800&q=80&auto=format&fit=crop',
    tag: 'Essentials',
    span: 'small',
  },
];

interface CategoryCardProps {
  cat: Category;
  large: boolean;
}

function CategoryCard({ cat, large }: CategoryCardProps) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        gridColumn: large ? 'span 2' : 'span 1',
        gridRow: large ? 'span 2' : 'span 1',
        minHeight: large ? 420 : 200,
        borderRadius: 20,
        background: '#0a0f0f',
        boxShadow: hovered 
          ? `0 8px 32px rgba(0, 212, 182, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 0 0 1.5px ${ACCENT}` 
          : '0 2px 12px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Background Image */}
      <img
        src={cat.img} 
        alt={cat.label}
        style={{
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%',
          objectFit: 'cover',
          filter: hovered ? 'brightness(0.65) saturate(1.15) contrast(1.05)' : 'brightness(0.42) saturate(0.75)',
          transform: hovered ? 'scale(1.08)' : 'scale(1.02)',
          transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Gradient Overlays */}
      <div style={{
        position: 'absolute', 
        inset: 0,
        background: 'linear-gradient(135deg, rgba(0, 212, 182, 0.03) 0%, transparent 50%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }} />
      
      <div style={{
        position: 'absolute', 
        inset: 0,
        background: 'linear-gradient(to top, rgba(2, 6, 6, 0.95) 0%, rgba(2, 6, 6, 0.7) 35%, rgba(2, 6, 6, 0.2) 65%, transparent 100%)',
      }} />

      {/* Noise Texture Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        opacity: 0.03,
        mixBlendMode: 'overlay',
      }} />

      {/* Tag Badge */}
      <div style={{
        position: 'absolute', 
        top: 18, 
        left: 18,
        background: hovered 
          ? `linear-gradient(135deg, ${ACCENT} 0%, rgba(0, 212, 182, 0.9) 100%)` 
          : 'rgba(10, 15, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        border: hovered ? `1.5px solid ${ACCENT}` : '1px solid rgba(255, 255, 255, 0.08)',
        color: hovered ? '#020606' : 'rgba(255, 255, 255, 0.65)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 9.5, 
        fontWeight: 700, 
        letterSpacing: '0.12em', 
        textTransform: 'uppercase',
        padding: '7px 14px',
        borderRadius: 8,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        boxShadow: hovered ? `0 4px 16px ${ACCENT}40` : '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}>
        {hovered && <Sparkles style={{ width: 11, height: 11 }} />}
        {cat.tag}
      </div>

      {/* Bottom Content */}
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: large ? '32px 30px 28px' : '22px 24px 20px',
        background: 'linear-gradient(to top, rgba(2, 6, 6, 0.4) 0%, transparent 100%)',
      }}>
        {/* Category Label */}
        <div style={{
          fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: large ? 'clamp(28px, 4vw, 42px)' : 'clamp(20px, 2.5vw, 26px)', 
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: '#ffffff', 
          lineHeight: 1.1,
          marginBottom: large ? 10 : 7,
          textShadow: '0 2px 12px rgba(0, 0, 0, 0.5)',
        }}>
          {cat.label}
        </div>

        {/* Bottom Row */}
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 12,
        }}>
          {/* Item Count */}
          <span style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: large ? 12 : 10.5, 
            color: 'rgba(255, 255, 255, 0.5)', 
            fontWeight: 500,
            letterSpacing: '0.03em',
          }}>
            {cat.count}
          </span>

          {/* Action Button */}
          <div style={{
            width: large ? 44 : 38, 
            height: large ? 44 : 38,
            borderRadius: large ? 12 : 10,
            background: hovered 
              ? `linear-gradient(135deg, ${ACCENT} 0%, rgba(0, 212, 182, 0.9) 100%)` 
              : 'rgba(255, 255, 255, 0.06)',
            border: hovered ? `1.5px solid ${ACCENT}` : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hovered ? 'rotate(-45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
            boxShadow: hovered 
              ? `0 4px 20px ${ACCENT}50, 0 0 0 4px rgba(0, 212, 182, 0.1)` 
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}>
            <ArrowRight style={{ 
              width: large ? 18 : 16, 
              height: large ? 18 : 16, 
              color: hovered ? '#020606' : 'rgba(255, 255, 255, 0.8)',
              transition: 'color 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Accent Border Animation */}
      <div style={{
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: 3,
        background: `linear-gradient(90deg, ${ACCENT} 0%, rgba(0, 212, 182, 0.6) 100%)`,
        transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }} />
    </div>
  );
}

export default function FeaturedCategories() {
  const [viewAllHovered, setViewAllHovered] = useState(false);

  return (
    <section style={{
      background: 'linear-gradient(180deg, #020606 0%, #0a0f0f 100%)',
      padding: 'clamp(60px, 8vw, 110px) clamp(24px, 5vw, 64px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Subtle Background Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.02) 1px, transparent 0)',
        backgroundSize: '32px 32px',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '50%',
        height: '60%',
        background: `radial-gradient(circle, ${ACCENT}08 0%, transparent 70%)`,
        pointerEvents: 'none',
        filter: 'blur(80px)',
      }} />

      <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-between', 
          marginBottom: 'clamp(36px, 4vw, 52px)',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div>
            {/* Eyebrow */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}>
              <div style={{
                width: 32,
                height: 1.5,
                background: `linear-gradient(90deg, ${ACCENT} 0%, transparent 100%)`,
              }} />
              <span style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", 
                fontSize: 11, 
                fontWeight: 600,
                letterSpacing: '0.15em', 
                textTransform: 'uppercase',
                color: ACCENT,
              }}>
                Shop by Category
              </span>
            </div>

            {/* Main Heading */}
            <h2 style={{
              fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 'clamp(40px, 5.5vw, 68px)', 
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#ffffff', 
              lineHeight: 1.05, 
              margin: 0,
            }}>
              Find Your{' '}
              <span style={{ 
                background: `linear-gradient(135deg, ${ACCENT} 0%, rgba(0, 212, 182, 0.7) 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Position
              </span>
            </h2>
          </div>

          {/* View All Link */}
          <a 
            href="#"
            onMouseEnter={() => setViewAllHovered(true)}
            onMouseLeave={() => setViewAllHovered(false)}
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", 
              fontSize: 11.5, 
              fontWeight: 600,
              letterSpacing: '0.08em', 
              textTransform: 'uppercase',
              color: viewAllHovered ? ACCENT : 'rgba(255, 255, 255, 0.5)', 
              textDecoration: 'none',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              paddingBottom: 6,
              borderBottom: `2px solid ${viewAllHovered ? ACCENT : 'transparent'}`,
            }}
          >
            All Categories
            <ArrowRight style={{ 
              width: 15, 
              height: 15,
              transform: viewAllHovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </a>
        </div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(12px, 2vw, 18px)',
        }}>
          {CATEGORIES.map(cat => (
            <CategoryCard key={cat.id} cat={cat} large={cat.span === 'large'} />
          ))}
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          section > div > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section > div > div:last-child > div:first-child {
            grid-column: span 2 !important;
          }
        }
        
        @media (max-width: 640px) {
          section > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
          section > div > div:last-child > div {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
            min-height: 240px !important;
          }
        }
      `}</style>
    </section>
  );
}