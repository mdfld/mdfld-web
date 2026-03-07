"use client"
import React, { useState } from 'react';
import { Heart, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

const ACCENT = '#00d4b6';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90&auto=format&fit=crop';

function ProductCard({ product, index }: { product: any; index: number }) {
  const [liked, setLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { data: session } = authClient.useSession();

  const utils = trpc.useUtils();
  const addToCart = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      setAddedToCart(true);
      utils.cart.get.invalidate(); // refresh navbar badge + drawer
      setTimeout(() => setAddedToCart(false), 2000);
    },
  });

  const toggleWishlist = trpc.user.toggleWishlist?.useMutation?.({
    onSuccess: () => setLiked(l => !l),
  });

  const price = Number(product.price);
  const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const img = product.images?.[0] || FALLBACK_IMG;
  const tag = product.tags?.[0] || product.condition || 'NEW';
  const stock = product.inventory ?? 99;
  const lowStock = stock > 0 && stock <= 8;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) {
      window.location.href = '/auth/login';
      return;
    }
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="editorial-card"
    >
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
        <div className="ec-image-wrap">
          <img src={img} alt={product.title} className="ec-img" />
          <div className="ec-overlay" />

          {/* Badges */}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 10 }}>
            {tag && (
              <span style={{ background: '#fff', color: '#000', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 800, padding: '4px 10px', letterSpacing: '0.1em', borderRadius: 2 }}>
                {String(tag).toUpperCase()}
              </span>
            )}
            {lowStock && (
              <span style={{ background: 'transparent', color: '#ff4d4d', fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 800, padding: '4px 10px', letterSpacing: '0.1em', border: '1px solid #ff4d4d', borderRadius: 2 }}>
                LOW STOCK
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(l => !l); }}
            className="ec-wishlist"
          >
            <Heart size={18} fill={liked ? '#ff4d4d' : 'transparent'} color={liked ? '#ff4d4d' : '#fff'} strokeWidth={liked ? 0 : 2} style={{ transition: 'all 0.3s' }} />
          </button>

          {/* Quick Add */}
          <div className="ec-quick-add">
            <div style={{ padding: '20px' }}>
              <button
                onClick={handleAddToCart}
                style={{
                  width: '100%', padding: '12px', background: addedToCart ? ACCENT : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${addedToCart ? ACCENT : 'rgba(255,255,255,0.2)'}`,
                  color: addedToCart ? '#000' : '#fff', fontFamily: "'Manrope', sans-serif",
                  fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.3s',
                }}
              >
                {addedToCart ? <><Check size={14} /> Added!</> : 'Add to Bag'}
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {product.brand || product.seller?.storeName || 'MDFLD'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {comparePrice && comparePrice > price && (
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                  ${comparePrice.toFixed(0)}
                </span>
              )}
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 800, color: ACCENT }}>
                ${price.toFixed(0)}
              </span>
            </div>
          </div>
          <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0, transition: 'color 0.3s' }} className="ec-name">
            {product.title}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}

// Skeleton card while loading
function SkeletonCard() {
  return (
    <div style={{ opacity: 0.3 }}>
      <div style={{ width: '100%', aspectRatio: '4/5', background: 'rgba(255,255,255,0.05)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
      <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
        <div style={{ height: 18, width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default function EditorialGrid() {
  const [filter, setFilter] = useState('All');

  // ── Fetch real products from backend ──────────────────────
  const { data, isLoading } = trpc.product.search.useQuery({
    limit: 12,
    minPrice: 0,
  });

  const allProducts = data?.items ?? [];

  // Get unique brands for filter
  const brands = ['All', ...Array.from(new Set(allProducts.map((p: any) => p.brand).filter(Boolean)))].slice(0, 7);

  const filtered = filter === 'All'
    ? allProducts
    : allProducts.filter((p: any) => p.brand === filter);

  return (
    <section style={{
      background: '#020606',
      padding: 'clamp(80px, 10vw, 140px) clamp(24px, 5vw, 64px)',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .editorial-card { cursor: pointer; position: relative; }
        .ec-image-wrap { position: relative; width: 100%; aspect-ratio: 4/5; overflow: hidden; background: #0a0a0a; border-radius: 4px; }
        .ec-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s; filter: brightness(0.85) contrast(1.1); }
        .editorial-card:hover .ec-img { transform: scale(1.05); filter: brightness(0.6) contrast(1.2); }
        .ec-wishlist { position: absolute; top: 16px; right: 16px; z-index: 10; background: transparent; border: none; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.3s, transform 0.3s; }
        .ec-wishlist:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
        .ec-quick-add { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.1); transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .editorial-card:hover .ec-quick-add { transform: translateY(0); }
        .ec-name { }
        .editorial-card:hover .ec-name { color: ${ACCENT}; }

        .ed-filter { font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; background: transparent; border: none; padding: 12px 0; color: rgba(255,255,255,0.4); cursor: pointer; position: relative; transition: color 0.3s; }
        .ed-filter:hover { color: #fff; }
        .ed-filter.active { color: #fff; }
        .ed-filter::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0%; height: 2px; background: ${ACCENT}; transition: width 0.3s ease; }
        .ed-filter.active::after { width: 100%; }

        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.5} }
      `}</style>

      <div style={{ maxWidth: 1600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 'clamp(60px, 8vw, 80px)' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}
          >
            <div style={{ width: 48, height: 2, background: ACCENT }} />
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 800, color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Curated For You
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(48px, 8vw, 100px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', textAlign: 'left', margin: 0, lineHeight: 1.05 }}
          >
            Latest <span style={{ color: ACCENT }}>Drops</span>
          </motion.h2>

          {/* Filter Tabs */}
          {brands.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', gap: 'clamp(24px, 4vw, 48px)', flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 48, width: '100%', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              {brands.map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`ed-filter ${filter === f ? 'active' : ''}`}>
                  {f}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              columnGap: 'clamp(24px, 4vw, 40px)',
              rowGap: 'clamp(64px, 8vw, 96px)',
            }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : filtered.length > 0
                ? filtered.map((product: any, index: number) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))
                : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontFamily: "'Manrope', sans-serif", fontSize: 16 }}>
                    No products found. Add products from your dashboard.
                  </div>
                )
            }
          </motion.div>
        </AnimatePresence>

        {/* View All CTA */}
        {!isLoading && allProducts.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'clamp(80px, 10vw, 120px)' }}>
            <Link href="/shop" style={{
              display: 'inline-flex', alignItems: 'center', gap: 16,
              fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: '0.15em',
              color: '#fff', textTransform: 'uppercase', textDecoration: 'none',
              borderBottom: '1px solid #fff', paddingBottom: 8, transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
            >
              Explore Full Collection <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}