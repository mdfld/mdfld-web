// mdfld Custom Navbar — replaces components/main-navbar/page.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Heart, ShoppingBag, Search, X, Menu, ChevronRight, Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc-client';

const ACCENT = '#00d4b6';
const LINKS = ['HOME', 'SHOP', 'BRANDS', 'ABOUT', 'CONTACT'];
const LINK_HREF: Record<string, string> = {
  HOME: '/',
  SHOP: '/shop',
  BRANDS: '/brands',
  ABOUT: '/about',
  CONTACT: '/contact',
};

// ── Minimal Cart Drawer ──────────────────────────────────────
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: session } = authClient.useSession();
  const { data: cartData } = trpc.cart.get.useQuery(undefined, { enabled: !!session?.user });

  const removeItem = trpc.cart.removeItem.useMutation({ onSuccess: () => utils.cart.get.invalidate() });
  const updateQty  = trpc.cart.updateQuantity.useMutation({ onSuccess: () => utils.cart.get.invalidate() });

  const items    = cartData?.items ?? [];
  const subtotal = cartData?.subtotal ?? 0;
  const router   = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)' }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,zIndex:201,
        width:'min(420px,100vw)',
        background:'#0a0f0f',
        borderLeft:'1px solid rgba(0,212,182,0.2)',
        display:'flex',flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,letterSpacing:'-0.02em',color:'#fff' }}>
              YOUR BAG
            </span>
            {items.length > 0 && (
              <span style={{ marginLeft:10,fontSize:11,color:'rgba(255,255,255,0.4)',fontFamily:"'Barlow',sans-serif",letterSpacing:'0.15em',textTransform:'uppercase' }}>
                {items.reduce((s:number,i:any)=>s+i.quantity,0)} items
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36 }}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex:1,overflowY:'auto',padding:'8px 0' }}>
          {items.length === 0 ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16 }}>
              <ShoppingBag size={48} color='rgba(255,255,255,0.15)' />
              <p style={{ color:'rgba(255,255,255,0.35)',fontFamily:"'Barlow',sans-serif",fontSize:13,letterSpacing:'0.1em',textTransform:'uppercase' }}>Your bag is empty</p>
              <button onClick={() => { onClose(); router.push('/shop'); }} style={{ background:ACCENT,color:'#020606',border:'none',padding:'10px 24px',fontFamily:"'Barlow',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer' }}>
                Shop Now
              </button>
            </div>
          ) : items.map((item: any) => {
            const price = Number(item.variant?.price ?? item.product.price);
            const img   = item.product.images?.[0];
            return (
              <div key={item.id} style={{ display:'flex',gap:14,padding:'14px 24px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                {/* Image */}
                <div style={{ width:72,height:72,flexShrink:0,background:'rgba(255,255,255,0.05)',overflow:'hidden' }}>
                  {img ? <img src={img} alt={item.product.title} style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <div style={{ width:'100%',height:'100%' }} />}
                </div>
                {/* Info */}
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'#fff',fontFamily:"'Barlow',sans-serif",marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {item.product.title}
                  </p>
                  {item.variant && (
                    <p style={{ fontSize:10,color:'rgba(255,255,255,0.35)',fontFamily:"'Barlow',sans-serif",marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em' }}>
                      {item.variant.name ?? item.variant.size ?? ''}
                    </p>
                  )}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    {/* Qty controls */}
                    <div style={{ display:'flex',alignItems:'center',gap:0,border:'1px solid rgba(255,255,255,0.12)' }}>
                      <button onClick={() => updateQty.mutate({ itemId:item.id, quantity:Math.max(1,item.quantity-1) })}
                        style={{ background:'transparent',border:'none',cursor:'pointer',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)' }}>
                        <Minus size={10} />
                      </button>
                      <span style={{ width:24,textAlign:'center',fontSize:12,color:'#fff',fontFamily:"'Barlow',sans-serif" }}>{item.quantity}</span>
                      <button onClick={() => updateQty.mutate({ itemId:item.id, quantity:item.quantity+1 })}
                        style={{ background:'transparent',border:'none',cursor:'pointer',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)' }}>
                        <Plus size={10} />
                      </button>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:900,color:'#fff' }}>
                        ${(price * item.quantity).toFixed(2)}
                      </span>
                      <button onClick={() => removeItem.mutate({ itemId:item.id })}
                        style={{ background:'transparent',border:'none',cursor:'pointer',color:'rgba(255,100,100,0.5)',display:'flex',padding:4 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding:'20px 24px',borderTop:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <span style={{ fontFamily:"'Barlow',sans-serif",fontSize:11,letterSpacing:'0.15em',textTransform:'uppercase',color:'rgba(255,255,255,0.4)' }}>Subtotal</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:'#fff' }}>${Number(subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={() => { onClose(); router.push('/bag'); }}
                style={{ flex:1,padding:'12px',background:'transparent',border:'1px solid rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.7)',fontFamily:"'Barlow',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer' }}>
                View Bag
              </button>
              <button onClick={() => { onClose(); router.push('/checkout'); }}
                style={{ flex:1,padding:'12px',background:ACCENT,border:'none',color:'#020606',fontFamily:"'Barlow',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer' }}>
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Navbar ──────────────────────────────────────────────
export default function MainNavbar() {
  const navRef    = useRef<HTMLElement>(null);
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [cartOpen, setCartOpen]       = useState(false);
  const [searchVal, setSearchVal]     = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname  = usePathname();
  const router    = useRouter();

  // ── Auth ─────────────────────────────────────────────────
  const { data: session, isPending } = authClient.useSession();
  const authUser = session?.user ?? null;
  const initials = authUser
    ? (authUser.name ?? authUser.email ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : null;

  // ── tRPC data ─────────────────────────────────────────────
  const { data: cartData }     = trpc.cart.get.useQuery(undefined, { enabled: !!authUser });
  const { data: wishlistData } = trpc.user.getWishlist.useQuery(undefined, { enabled: !!authUser });
  const cartCount  = authUser ? (cartData?.itemCount ?? 0) : 0;
  const wishCount  = authUser ? (wishlistData?.length ?? 0) : 0;

  // ── Mobile detection ──────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSearchOpen(false); setMobileOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await authClient.signOut(); } catch {}
    document.cookie = 'better-auth.session_token=; Max-Age=0; path=/';
    document.cookie = '__Secure-better-auth.session_token=; Max-Age=0; path=/';
    window.location.href = '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setSearchOpen(false);
      router.push(`/shop?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .nb-root { font-family: 'Barlow', sans-serif; }

        .nb-link {
          position: relative; text-decoration: none;
          font-size: 11px; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(255,255,255,0.85);
          padding: 6px 0; transition: color 0.25s; white-space: nowrap;
        }
        .nb-link::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 2px; border-radius: 2px;
          background: ${ACCENT}; transition: width 0.3s ease;
        }
        .nb-link:hover { color: #fff; }
        .nb-link:hover::after, .nb-link-active::after { width: 100%; }
        .nb-link-active { color: ${ACCENT} !important; }

        .nb-icon {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%; cursor: pointer;
          transition: background 0.25s, color 0.25s; color: rgba(255,255,255,0.8);
          background: transparent; border: none; flex-shrink: 0;
        }
        .nb-icon:hover { background: rgba(0,212,182,0.12); color: ${ACCENT}; }

        .nb-badge {
          position: absolute; top: -2px; right: -2px;
          min-width: 16px; height: 16px; border-radius: 50%;
          background: ${ACCENT}; color: #020606;
          font-size: 8px; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Barlow', sans-serif; padding: 0 2px;
          box-shadow: 0 0 8px rgba(0,212,182,0.6);
        }

        .nb-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px; font-weight: 900; letter-spacing: -0.02em;
          color: #fff; text-decoration: none; line-height: 1; position: relative;
        }
        .nb-logo .dot { color: ${ACCENT}; display: inline-block; filter: drop-shadow(0 0 8px rgba(0,212,182,0.6)); }
        .nb-logo::after {
          content: ''; position: absolute; bottom: -2px; left: 0;
          width: 0; height: 2px;
          background: linear-gradient(90deg, ${ACCENT}, transparent);
          transition: width 0.45s ease;
        }
        .nb-logo:hover::after { width: 100%; }

        .nb-pill { transition: all 0.6s cubic-bezier(0.4,0,0.2,1); }
        .nb-glow {
          position: absolute; inset: 0; pointer-events: none; opacity: 0;
          background: radial-gradient(ellipse 100% 100% at 50% 0%, rgba(0,212,182,0.08), transparent 60%);
          transition: opacity 0.6s ease;
        }
        .nb-glow.active { opacity: 1; }

        .nb-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(0,212,182,0.15);
          border: 1px solid rgba(0,212,182,0.5);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 900; color: ${ACCENT};
          box-shadow: 0 0 12px rgba(0,212,182,0.2);
          transition: all 0.25s; cursor: pointer;
        }
        .nb-avatar:hover { background: rgba(0,212,182,0.25); }

        .nb-avatar-wrap { position: relative; }
        .nb-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: rgba(5,12,12,0.98); border: 1px solid rgba(0,212,182,0.2);
          border-radius: 8px; min-width: 180px;
          padding: 8px 0; z-index: 100;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(0,212,182,0.1);
          display: none; pointer-events: none;
        }
        .nb-avatar-wrap:hover .nb-dropdown { display: block; pointer-events: auto; }
        .nb-dropdown-header {
          padding: 10px 16px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 4px;
        }
        .nb-dropdown-header p { margin: 0; }
        .nb-dropdown a, .nb-dropdown button {
          display: block; width: 100%; text-align: left;
          padding: 9px 16px; background: transparent; border: none;
          font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(255,255,255,0.55); text-decoration: none;
          cursor: pointer; transition: color 0.2s, background 0.2s;
        }
        .nb-dropdown a:hover, .nb-dropdown button:hover {
          color: ${ACCENT}; background: rgba(0,212,182,0.05);
        }
        .nb-dropdown button.logout { color: rgba(255,100,100,0.6); }
        .nb-dropdown button.logout:hover { color: rgba(255,100,100,0.9); background: rgba(255,50,50,0.05); }

        .nb-login-link {
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,255,255,0.75);
          text-decoration: none; padding: 8px 4px; transition: color 0.25s;
          position: relative; white-space: nowrap;
        }
        .nb-login-link:hover { color: #fff; }

        .nb-search-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(2,6,6,0.96); backdrop-filter: blur(24px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: max(100px, 18vw) 20px 0;
        }
        .nb-search-box { width: 100%; max-width: 700px; }
        .nb-search-input-wrap {
          display: flex; align-items: center; gap: 12px;
          border-bottom: 2px solid ${ACCENT}; padding-bottom: 14px; margin-bottom: 22px;
        }
        .nb-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(24px,6vw,48px); font-weight: 800;
          color: #fff; letter-spacing: -0.02em; caret-color: ${ACCENT};
        }
        .nb-search-input::placeholder { color: rgba(255,255,255,0.18); }

        .nb-mobile-menu {
          position: fixed; inset: 0; z-index: 100; background: #020606;
          display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1);
          overflow-y: auto;
        }
        .nb-mobile-menu.open { transform: translateX(0); }

        .mob-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(0,212,182,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,182,0.03) 1px, transparent 1px);
          background-size: 44px 44px;
        }

        .nb-mobile-link {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(40px,11vw,68px); font-weight: 900;
          text-transform: uppercase; letter-spacing: -0.02em;
          color: rgba(255,255,255,0.18); text-decoration: none;
          line-height: 1.05; transition: color 0.2s;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 14px 0; min-height: 72px;
        }
        .nb-mobile-link:hover, .nb-mobile-link:active { color: #fff; }
        .nb-mobile-link:hover .mob-arrow { color: ${ACCENT}; transform: translateX(6px); }
        .mob-arrow { transition: transform 0.25s, color 0.25s; color: rgba(255,255,255,0.12); flex-shrink: 0; }

        /* Auth skeleton to prevent LOGIN flash */
        .nb-auth-skeleton {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.06); animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>

      {/* ═══ MAIN NAV ═══ */}
      <nav
        ref={navRef}
        className="nb-root"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
          padding: scrolled ? '12px clamp(12px,2vw,20px)' : '0',
        }}
      >
        <div
          className="nb-pill"
          style={{
            margin: '0 auto', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
            ...(scrolled ? {
              maxWidth: 1120, borderRadius: 16,
              border: '2px solid rgba(0,212,182,0.35)',
              background: 'rgba(5,12,12,0.95)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 24px rgba(0,212,182,0.15), inset 0 1px 0 rgba(0,212,182,0.1)',
              padding: '12px clamp(16px,3vw,28px)',
            } : {
              maxWidth: '100%', borderRadius: 0, border: 'none',
              background: 'transparent', backdropFilter: 'none',
              WebkitBackdropFilter: 'none', boxShadow: 'none',
              padding: 'clamp(16px,2.5vw,22px) clamp(20px,4vw,44px)',
            }),
          }}
        >
          <div className={`nb-glow${scrolled ? ' active' : ''}`} />

          {/* LOGO */}
          <Link href="/" className="nb-logo" style={{ zIndex: 2 }}>
            mdfld<span className="dot">.</span>
          </Link>

          {/* NAV LINKS — desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 36, alignItems: 'center', zIndex: 2 }}>
              {LINKS.map(l => {
                const isActive = pathname === LINK_HREF[l] || (l === 'SHOP' && pathname.startsWith('/shop'));
                return (
                  <Link key={l} href={LINK_HREF[l] ?? '#'} className={`nb-link${isActive ? ' nb-link-active' : ''}`}>
                    {l}
                  </Link>
                );
              })}
            </div>
          )}

          {/* RIGHT CLUSTER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 2 }}>
            {/* Search */}
            <button className="nb-icon" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={18} />
            </button>

            {/* Wishlist — desktop */}
            {!isMobile && (
              <Link href="/dashboard/wishlist" className="nb-icon" aria-label="Wishlist">
                <Heart size={18} />
                {wishCount > 0 && <span className="nb-badge">{wishCount}</span>}
              </Link>
            )}

            {/* Cart */}
            <button className="nb-icon" onClick={() => setCartOpen(true)} aria-label="Cart">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="nb-badge">{cartCount}</span>}
            </button>

            {/* Auth — desktop */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 6 }}>
                <div style={{ width: 1, height: 16, background: 'rgba(0,212,182,0.2)' }} />

                {/* While loading — show skeleton, not LOGIN */}
                {isPending ? (
                  <div className="nb-auth-skeleton" />
                ) : authUser ? (
                  <div className="nb-avatar-wrap">
                    <div className="nb-avatar">{initials}</div>
                    <div className="nb-dropdown">
                      <div className="nb-dropdown-header">
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                          Signed in as
                        </p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: "'Barlow',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {authUser.email}
                        </p>
                      </div>
                      <Link href="/dashboard">Dashboard</Link>
                      <Link href="/dashboard/orders">My Orders</Link>
                      <Link href="/dashboard/settings">Settings</Link>
                      <button className="logout" onClick={handleLogout}>Log Out</button>
                    </div>
                  </div>
                ) : (
                  <Link href="/auth/login" className="nb-login-link">Login</Link>
                )}
              </div>
            )}

            {/* Hamburger — mobile only */}
            {isMobile && (
              <button className="nb-icon" style={{ marginLeft: 2 }} onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ SEARCH OVERLAY ═══ */}
      {searchOpen && (
        <div className="nb-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="nb-search-box" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch}>
              <div className="nb-search-input-wrap">
                <Search size={24} color={ACCENT} style={{ flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  className="nb-search-input"
                  placeholder="Search boots, kits…"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                />
                <button type="button" className="nb-icon" style={{ flexShrink: 0, width: 44, height: 44 }} onClick={() => setSearchOpen(false)}>
                  <X size={22} />
                </button>
              </div>
            </form>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Popular</span>
              {['Mercurial', 'Predator', 'Copa Pure', 'Phantom GX', 'Dri-FIT Kit'].map(t => (
                <button key={t} onClick={() => { setSearchVal(t); router.push(`/shop?q=${encodeURIComponent(t)}`); setSearchOpen(false); }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontFamily: "'Barlow',sans-serif", fontSize: 11, letterSpacing: '0.08em', padding: '7px 14px', cursor: 'pointer', transition: 'all 0.2s', minHeight: 36 }}>
                  {t}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.18)', marginTop: 28, letterSpacing: '0.1em' }}>
              Press <kbd style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>ESC</kbd> to close
            </p>
          </div>
        </div>
      )}

      {/* ═══ MOBILE MENU ═══ */}
      <div className={`nb-mobile-menu${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mob-grid" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'clamp(24px,6vw,40px)', paddingTop: 'max(clamp(24px,6vw,40px),env(safe-area-inset-top,24px))', paddingBottom: 'max(clamp(24px,6vw,40px),env(safe-area-inset-bottom,24px))', position: 'relative', zIndex: 2, minHeight: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(32px,8vh,56px)' }}>
            <Link href="/" className="nb-logo" style={{ fontSize: 24 }} onClick={() => setMobileOpen(false)}>
              mdfld<span className="dot">.</span>
            </Link>
            <button className="nb-icon" onClick={() => setMobileOpen(false)} style={{ width: 44, height: 44 }}>
              <X size={22} />
            </button>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {LINKS.map((l, i) => (
              <Link key={l} href={LINK_HREF[l] ?? '#'} className="nb-mobile-link" onClick={() => setMobileOpen(false)} style={{ transitionDelay: mobileOpen ? `${i * 50}ms` : '0ms' }}>
                {l}
                <ChevronRight size={26} className="mob-arrow" />
              </Link>
            ))}
          </nav>

          <div style={{ paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'clamp(24px,5vh,40px)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {authUser ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, color: ACCENT, textDecoration: 'none', width: 44, height: 44, border: `1px solid rgba(0,212,182,0.4)`, background: 'rgba(0,212,182,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {initials}
                  </Link>
                  <button onClick={() => { setMobileOpen(false); handleLogout(); }} style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,100,100,0.7)', background: 'transparent', border: '1px solid rgba(255,100,100,0.3)', padding: '12px 18px', minHeight: 44, cursor: 'pointer' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', padding: '12px 18px', minHeight: 44, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                    Login
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#020606', textDecoration: 'none', padding: '12px 18px', minHeight: 44, background: ACCENT, display: 'flex', alignItems: 'center' }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Link href="/dashboard/wishlist" className="nb-icon" style={{ width: 44, height: 44 }} onClick={() => setMobileOpen(false)}>
                <Heart size={19} />
                {wishCount > 0 && <span className="nb-badge">{wishCount}</span>}
              </Link>
              <button className="nb-icon" style={{ width: 44, height: 44 }} onClick={() => { setMobileOpen(false); setCartOpen(true); }}>
                <ShoppingBag size={19} />
                {cartCount > 0 && <span className="nb-badge">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CART DRAWER ═══ */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}