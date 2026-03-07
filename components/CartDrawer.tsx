'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X, Plus, Minus, ShoppingBag, ArrowRight,
  Shield, Truck, RotateCcw, Zap, ChevronDown, Loader2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc-client';

const ACCENT = '#00d4b6';

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    if (prevRef.current === value) return;
    const start = prevRef.current, end = value, duration = 400, startTime = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(animate);
      else { setDisplayed(end); prevRef.current = end; }
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>${displayed.toFixed(2)}</>;
}

function CartItemRow({ item, onQty, onRemove, index }: {
  item: any;
  onQty: (itemId: string, newQty: number) => void;
  onRemove: (itemId: string) => void;
  index: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { product, variant, quantity } = item;
  const price = Number(variant?.price ?? product.price);
  const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const img = product.images?.[0];
  const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : null;

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(-16px)';
    const t = setTimeout(() => {
      el.style.transition = `opacity 0.4s ease ${index * 0.06}s, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 0.06}s`;
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    }, 30);
    return () => clearTimeout(t);
  }, [index]);

  const handleRemove = () => {
    const el = rowRef.current;
    if (el) {
      el.style.transition = 'opacity 0.25s, transform 0.25s, max-height 0.35s ease 0.2s, margin 0.35s ease 0.2s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(32px)';
      setTimeout(() => { el.style.maxHeight = '0'; el.style.marginBottom = '0'; el.style.overflow = 'hidden'; }, 240);
      setTimeout(() => onRemove(item.id), 580);
    } else {
      onRemove(item.id);
    }
  };

  return (
    <div ref={rowRef} className="dci-root" style={{ maxHeight: 160 }}>
      <div className="dci-img">
        {img ? (
          <img src={img} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="dci-img-empty"><ShoppingBag size={18} strokeWidth={1} /></div>
        )}
        {discount && <span className="dci-disc">−{discount}%</span>}
      </div>
      <div className="dci-info">
        <div className="dci-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            {product.brand && <span className="dci-brand">{product.brand}</span>}
            <h3 className="dci-title">{product.title}</h3>
          </div>
          <button className="dci-del" onClick={handleRemove}><X size={11} /></button>
        </div>
        {variant && (
          <span className="dci-cond" style={{ color: ACCENT, borderColor: `${ACCENT}30`, background: `${ACCENT}10` }}>
            <span className="dci-cond-dot" style={{ background: ACCENT }} />
            {variant.sizeDisplay || variant.size || 'Variant'}
          </span>
        )}
        <div className="dci-bottom">
          <div className="dci-qty">
            <button className="dci-qty-btn" onClick={() => onQty(item.id, quantity - 1)} disabled={quantity <= 1}><Minus size={10} /></button>
            <span className="dci-qty-val">{quantity}</span>
            <button className="dci-qty-btn" onClick={() => onQty(item.id, quantity + 1)}><Plus size={10} /></button>
          </div>
          <div className="dci-price-grp">
            {comparePrice && <span className="dci-compare">${(comparePrice * quantity).toFixed(2)}</span>}
            <span className="dci-price">${(price * quantity).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummary({ items }: { items: any[] }) {
  const subtotal = items.reduce((s, i) => s + Number(i.variant?.price ?? i.product.price) * i.quantity, 0);
  const origTotal = items.reduce((s, i) => s + (i.product.compareAtPrice ? Number(i.product.compareAtPrice) : Number(i.variant?.price ?? i.product.price)) * i.quantity, 0);
  const savings = origTotal - subtotal;
  const shipping = subtotal >= 75 ? 0 : 8.99;
  const total = subtotal + shipping;
  return (
    <div className="os-rows">
      <div className="os-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
      {savings > 0 && <div className="os-row os-save"><span>Item savings</span><span>−${savings.toFixed(2)}</span></div>}
      <div className="os-row"><span>Shipping</span><span className={shipping === 0 ? 'os-free' : ''}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span></div>
      {shipping > 0 && (
        <div className="os-ship-hint">
          Add ${(75 - subtotal).toFixed(2)} more for free shipping
          <div className="os-prog"><div className="os-prog-fill" style={{ width: `${Math.min((subtotal / 75) * 100, 100)}%` }} /></div>
        </div>
      )}
      <div className="os-divider" />
      <div className="os-total-row"><span>Total</span><span className="os-total-val"><AnimatedNumber value={total} /></span></div>
    </div>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="drawer-empty">
      <div className="drawer-empty-icon"><ShoppingBag size={32} strokeWidth={1} /></div>
      <p className="drawer-empty-title">Your bag is empty</p>
      <p className="drawer-empty-sub">Discover premium gear at unbeatable prices.</p>
      <Link href="/shop" className="drawer-empty-cta" onClick={onClose}>Explore Shop <ArrowRight size={13} /></Link>
    </div>
  );
}

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCartCountChange?: (count: number) => void;
}

export default function CartDrawer({ open, onClose, onCartCountChange }: CartDrawerProps) {
  const [promoOpen, setPromoOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const utils = trpc.useUtils();

  // ── Fetch cart via tRPC ────────────────────────────────────
  const { data, isLoading, error } = trpc.cart.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const items = data?.items ?? [];
  const itemCount = data?.itemCount ?? 0;
  const subtotal = data?.subtotal ?? 0;
  const shipping = subtotal >= 75 ? 0 : 8.99;
  const total = subtotal + shipping;

  // Sync count to navbar
  useEffect(() => {
    onCartCountChange?.(itemCount);
  }, [itemCount]);

  // ── Mutations ─────────────────────────────────────────────
  const updateQty = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const removeItem = trpc.cart.removeItem.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Refetch when drawer opens
  useEffect(() => {
    if (open) utils.cart.get.invalidate();
  }, [open]);

  const handleQty = useCallback((itemId: string, newQty: number) => {
    if (newQty < 1) return;
    updateQty.mutate({ itemId, quantity: newQty });
  }, []);

  const handleRemove = useCallback((itemId: string) => {
    removeItem.mutate({ itemId });
  }, []);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item: any) => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
            price: item.variant?.price || item.product.price,
            name: item.product.title,
            image: item.product.images?.[0],
            sellerId: item.product.seller?.id,
          })),
        }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <style>{`
        .cart-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity 0.35s ease;}
        .cart-backdrop.open{opacity:1;pointer-events:all;}
        .cart-drawer{position:fixed;top:0;right:0;bottom:0;z-index:9999;width:75vw;max-width:900px;background:#06080b;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.4s cubic-bezier(0.22,1,0.36,1);box-shadow:-20px 0 60px rgba(0,0,0,0.5);border-left:1px solid rgba(255,255,255,0.06);}
        .cart-drawer.open{transform:translateX(0);}
        @media(max-width:768px){.cart-drawer{width:100vw;max-width:100vw;}}
        .dr-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;background:#0b0e14;}
        .dr-header-left{display:flex;align-items:center;gap:12px;}
        .dr-title{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;letter-spacing:-0.01em;color:#e8ecf4;}
        .dr-count{font-family:'Barlow',monospace;font-size:11px;font-weight:600;color:#00d4b6;background:rgba(0,212,182,0.1);border:1px solid rgba(0,212,182,0.2);border-radius:100px;padding:2px 10px;}
        .dr-close{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(232,236,244,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
        .dr-close:hover{background:rgba(255,77,109,0.1);border-color:rgba(255,77,109,0.3);color:#ff4d6d;}
        .dr-body{flex:1;overflow-y:auto;overflow-x:hidden;display:grid;grid-template-columns:1fr 300px;align-items:start;}
        @media(max-width:768px){.dr-body{grid-template-columns:1fr;padding-bottom:110px;}}
        .dr-body::-webkit-scrollbar{width:4px;}
        .dr-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}
        .dr-loading{grid-column:1/-1;display:flex;align-items:center;justify-content:center;padding:80px 0;color:#00d4b6;gap:10px;font-size:12px;}
        .dr-error{grid-column:1/-1;text-align:center;padding:60px 24px;color:rgba(232,236,244,0.4);font-size:13px;}
        .dr-items-col{padding:20px 24px;border-right:1px solid rgba(255,255,255,0.06);min-height:100%;}
        @media(max-width:768px){.dr-items-col{border-right:none;}}
        .dr-items-label{font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(232,236,244,0.22);display:flex;align-items:center;gap:10px;margin-bottom:16px;font-family:'Barlow',sans-serif;}
        .dr-items-label::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06);}
        .dr-items-list{display:flex;flex-direction:column;gap:10px;}
        .dci-root{display:flex;gap:12px;background:#0b0e14;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px;position:relative;overflow:hidden;transition:border-color 0.25s;}
        .dci-root:hover{border-color:rgba(255,255,255,0.1);}
        .dci-img{flex-shrink:0;width:72px;height:88px;border-radius:8px;overflow:hidden;background:#11151e;position:relative;}
        .dci-img-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(232,236,244,0.22);}
        .dci-disc{position:absolute;top:4px;right:4px;font-size:7px;font-weight:700;background:#00d4b6;color:#020606;padding:1px 5px;border-radius:3px;}
        .dci-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}
        .dci-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
        .dci-brand{display:block;font-size:8px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#00d4b6;margin-bottom:2px;font-family:'Barlow',sans-serif;}
        .dci-title{font-size:12px;font-weight:700;line-height:1.3;color:#e8ecf4;letter-spacing:-0.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .dci-del{flex-shrink:0;width:24px;height:24px;border-radius:6px;background:transparent;border:1px solid rgba(255,255,255,0.06);color:rgba(232,236,244,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
        .dci-del:hover{background:rgba(255,77,109,0.1);border-color:rgba(255,77,109,0.3);color:#ff4d6d;}
        .dci-cond{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;padding:2px 8px;border-radius:4px;border:1px solid;width:fit-content;font-family:'Barlow',sans-serif;}
        .dci-cond-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0;}
        .dci-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;}
        .dci-qty{display:flex;align-items:center;background:#11151e;border:1px solid rgba(255,255,255,0.1);border-radius:7px;overflow:hidden;}
        .dci-qty-btn{width:26px;height:26px;background:transparent;border:none;color:rgba(232,236,244,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
        .dci-qty-btn:hover:not(:disabled){background:rgba(255,255,255,0.06);color:#e8ecf4;}
        .dci-qty-btn:disabled{opacity:0.3;cursor:not-allowed;}
        .dci-qty-val{min-width:28px;text-align:center;font-size:11px;font-weight:600;color:#e8ecf4;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);height:26px;display:flex;align-items:center;justify-content:center;font-family:'Barlow',sans-serif;}
        .dci-price-grp{display:flex;align-items:baseline;gap:6px;}
        .dci-compare{font-size:10px;color:rgba(232,236,244,0.3);text-decoration:line-through;}
        .dci-price{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;letter-spacing:-0.01em;color:#e8ecf4;}
        .dr-trust{display:flex;flex-direction:column;gap:8px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);}
        @media(max-width:768px){.dr-trust{display:none;}}
        .dr-trust-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0b0e14;border:1px solid rgba(255,255,255,0.06);border-radius:8px;}
        .dr-trust-icon{width:28px;height:28px;border-radius:7px;background:rgba(0,212,182,0.08);border:1px solid rgba(0,212,182,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#00d4b6;}
        .dr-trust-name{font-size:11px;font-weight:700;color:#e8ecf4;}
        .dr-trust-desc{font-size:9px;color:rgba(232,236,244,0.3);}
        .dr-summary-col{padding:20px;position:sticky;top:0;}
        @media(max-width:768px){.dr-summary-col{display:none;}}
        .os-rows{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}
        .os-row{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:rgba(232,236,244,0.5);font-weight:500;}
        .os-save span:last-child{color:#4ade80;font-weight:700;}
        .os-free{color:#00d4b6!important;font-weight:700!important;}
        .os-divider{height:1px;background:rgba(255,255,255,0.06);margin:4px 0;}
        .os-total-row{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#e8ecf4;}
        .os-total-val{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.01em;}
        .os-ship-hint{font-size:10px;color:rgba(232,236,244,0.3);display:flex;flex-direction:column;gap:6px;background:#11151e;border-radius:7px;padding:9px 11px;border:1px solid rgba(255,255,255,0.06);margin-top:-4px;}
        .os-prog{height:2px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;}
        .os-prog-fill{height:100%;background:#00d4b6;border-radius:4px;transition:width 0.6s cubic-bezier(0.22,1,0.36,1);}
        .dr-promo{border-top:1px solid rgba(255,255,255,0.06);padding:14px 0;}
        .promo-toggle{display:flex;align-items:center;justify-content:space-between;width:100%;background:transparent;border:none;cursor:pointer;color:rgba(232,236,244,0.5);font-size:12px;font-weight:600;padding:2px 0;transition:color 0.2s;font-family:'Barlow',sans-serif;}
        .promo-toggle:hover{color:#e8ecf4;}
        .promo-toggle.open svg{transform:rotate(180deg);}
        .promo-body{overflow:hidden;max-height:0;transition:max-height 0.3s ease;}
        .promo-body.open{max-height:80px;}
        .promo-note{margin-top:10px;font-size:10px;color:rgba(232,236,244,0.3);text-align:center;padding:10px;background:#11151e;border-radius:7px;border:1px solid rgba(255,255,255,0.06);}
        .dr-checkout-btn{width:100%;height:52px;background:#00d4b6;border:none;border-radius:11px;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;letter-spacing:0.05em;color:#020606;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;position:relative;overflow:hidden;transition:transform 0.2s,opacity 0.2s;margin-top:16px;}
        .dr-checkout-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent,rgba(255,255,255,0.15),transparent);transform:translateX(-100%);transition:transform 0.5s ease;}
        .dr-checkout-btn:hover::before{transform:translateX(100%);}
        .dr-checkout-btn:hover{transform:translateY(-1px);}
        .dr-checkout-btn:disabled{opacity:0.75;cursor:not-allowed;transform:none;}
        .dr-checkout-sub{text-align:center;margin-top:8px;font-size:9px;color:rgba(232,236,244,0.22);letter-spacing:0.1em;display:flex;align-items:center;justify-content:center;gap:5px;}
        .checkout-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(2,6,6,0.2);border-top-color:#020606;animation:dr-spin 0.7s linear infinite;}
        @keyframes dr-spin{to{transform:rotate(360deg)}}
        .drawer-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;grid-column:1/-1;}
        .drawer-empty-icon{width:56px;height:56px;border-radius:14px;background:rgba(0,212,182,0.08);border:1px solid rgba(0,212,182,0.15);display:flex;align-items:center;justify-content:center;color:#00d4b6;margin-bottom:20px;}
        .drawer-empty-title{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.01em;color:#e8ecf4;margin-bottom:8px;}
        .drawer-empty-sub{font-size:13px;color:rgba(232,236,244,0.4);max-width:260px;line-height:1.6;margin-bottom:24px;}
        .drawer-empty-cta{display:inline-flex;align-items:center;gap:7px;height:44px;padding:0 22px;background:#00d4b6;border-radius:9px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:#020606;text-decoration:none;transition:transform 0.2s;}
        .drawer-empty-cta:hover{transform:translateY(-2px);}
        .dr-mobile-footer{display:none;position:sticky;bottom:0;left:0;right:0;z-index:10;background:#0b0e14;border-top:1px solid rgba(255,255,255,0.08);padding:14px 20px;flex-direction:column;gap:10px;}
        @media(max-width:768px){.dr-mobile-footer{display:flex;}}
        .dr-mobile-total{display:flex;align-items:center;justify-content:space-between;}
        .dr-mobile-total-label{font-size:12px;color:rgba(232,236,244,0.5);font-weight:500;}
        .dr-mobile-total-val{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#e8ecf4;}
      `}</style>

      <div className={`cart-backdrop${open ? ' open' : ''}`} onClick={onClose} />

      <div className={`cart-drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true">
        <div className="dr-header">
          <div className="dr-header-left">
            <h2 className="dr-title">Your Bag</h2>
            {itemCount > 0 && <span className="dr-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>}
          </div>
          <button className="dr-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="dr-body">
          {isLoading ? (
            <div className="dr-loading">
              <Loader2 size={18} style={{ animation: 'dr-spin 1s linear infinite' }} />
              Loading your cart…
            </div>
          ) : error ? (
            <div className="dr-error">Failed to load cart. Please try again.</div>
          ) : items.length === 0 ? (
            <EmptyCart onClose={onClose} />
          ) : (
            <>
              <div className="dr-items-col">
                <p className="dr-items-label">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                <div className="dr-items-list">
                  {items.map((item: any, i: number) => (
                    <CartItemRow key={item.id} item={item} onQty={handleQty} onRemove={handleRemove} index={i} />
                  ))}
                </div>
                <div className="dr-trust">
                  {[
                    { icon: <Truck size={13} />, name: 'Free Shipping', desc: 'Orders over $75' },
                    { icon: <RotateCcw size={13} />, name: '30-Day Returns', desc: 'Hassle-free' },
                    { icon: <Shield size={13} />, name: 'Secure Checkout', desc: 'SSL encrypted' },
                  ].map((t, i) => (
                    <div className="dr-trust-item" key={i}>
                      <div className="dr-trust-icon">{t.icon}</div>
                      <div><p className="dr-trust-name">{t.name}</p><p className="dr-trust-desc">{t.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dr-summary-col">
                <OrderSummary items={items} />
                <div className="dr-promo">
                  <button className={`promo-toggle${promoOpen ? ' open' : ''}`} onClick={() => setPromoOpen(v => !v)}>
                    <span>Have a promo code?</span>
                    <ChevronDown size={13} />
                  </button>
                  <div className={`promo-body${promoOpen ? ' open' : ''}`}>
                    <p className="promo-note">Promo codes applied at Stripe checkout</p>
                  </div>
                </div>
                <button className="dr-checkout-btn" onClick={handleCheckout} disabled={checkingOut}>
                  {checkingOut ? <><div className="checkout-spin" /> Processing…</> : <><Zap size={14} fill="currentColor" strokeWidth={0} /> Checkout Now <ArrowRight size={13} /></>}
                </button>
                <p className="dr-checkout-sub"><Shield size={9} /> Secured by SSL • No hidden fees</p>
              </div>
            </>
          )}
        </div>

        {!isLoading && items.length > 0 && (
          <div className="dr-mobile-footer">
            <div className="dr-mobile-total">
              <span className="dr-mobile-total-label">Total</span>
              <span className="dr-mobile-total-val"><AnimatedNumber value={total} /></span>
            </div>
            <button className="dr-checkout-btn" style={{ margin: 0 }} onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? <><div className="checkout-spin" /> Processing…</> : <><Zap size={14} fill="currentColor" strokeWidth={0} /> Checkout Now</>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}