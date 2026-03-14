"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Instagram, Twitter, Youtube, Facebook, ShieldCheck, Zap, Globe } from 'lucide-react';

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
    { label: 'Addresses', href: '/addresses' },
    { label: 'Login', href: '/login' },
    { label: 'Sign Up', href: '/signup' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/Privacy-Policy' },
    { label: 'Contact', href: '/contact' },
  ],
};

const SOCIALS = [
  { icon: <Instagram size={15} />, label: 'Instagram', href: 'https://instagram.com/mdfldmarketplace' },
  { icon: <Twitter size={15} />, label: 'Twitter', href: 'https://x.com/mdfldmp' },
  { icon: <Youtube size={15} />, label: 'YouTube', href: 'https://youtube.com/@mdfld' },
  { icon: <Facebook size={15} />, label: 'Facebook', href: 'https://facebook.com/' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <footer style={{ background:'#010404',borderTop:'1px solid rgba(255,255,255,0.05)',fontFamily:"'Barlow Condensed',sans-serif",position:'relative',overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
        .f-link{font-family:'Barlow',sans-serif;font-size:12px;color:rgba(255,255,255,0.32);text-decoration:none;letter-spacing:0.04em;transition:color 0.2s;display:block;padding:4px 0;}
        .f-link:hover{color:${ACCENT};}
        .f-social{display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.35);text-decoration:none;transition:all 0.25s;flex-shrink:0;}
        .f-social:hover{background:rgba(0,212,182,0.08);border-color:rgba(0,212,182,0.3);color:${ACCENT};}
        .f-nl-input{caret-color:${ACCENT};}
        .f-nl-input::placeholder{color:rgba(255,255,255,0.2);}
        .f-legal{font-family:'Barlow',sans-serif;font-size:10px;color:rgba(255,255,255,0.18);text-decoration:none;letter-spacing:0.06em;transition:color 0.2s;white-space:nowrap;}
        .f-legal:hover{color:${ACCENT};}
        .f-logo-img{height:28px;width:auto;object-fit:contain;transition:opacity 0.2s;}
        .f-logo-img:hover{opacity:0.75;}
        @media(max-width:768px){.f-grid{grid-template-columns:1fr 1fr !important;gap:32px 24px !important}.f-brand-col{grid-column:1/-1 !important}.f-nl-col{grid-column:1/-1 !important}.f-bottom{flex-direction:column !important;align-items:flex-start !important;gap:12px !important}.f-legal-row{flex-wrap:wrap !important;gap:12px 16px !important}.f-ghost{display:none !important}.f-badge-row{flex-wrap:wrap !important}}
        @media(max-width:480px){.f-grid{grid-template-columns:1fr !important}}
      `}</style>

      <div style={{ height:1,background:`linear-gradient(90deg,transparent,${ACCENT},rgba(0,212,182,0.4),transparent)`,boxShadow:`0 0 20px rgba(0,212,182,0.3)` }} />
      <div style={{ position:'absolute',top:0,left:'10%',width:400,height:250,background:'radial-gradient(ellipse,rgba(0,212,182,0.05) 0%,transparent 65%)',filter:'blur(40px)',pointerEvents:'none' }} />
      <div className="f-ghost" style={{ position:'absolute',bottom:50,right:'-2%',fontSize:'clamp(80px,12vw,160px)',fontWeight:900,letterSpacing:'-0.06em',color:'transparent',WebkitTextStroke:'1px rgba(255,255,255,0.025)',textTransform:'uppercase',lineHeight:1,userSelect:'none',pointerEvents:'none' }}>MIDFIELD</div>

      <div style={{ padding:'clamp(40px,5vw,72px) clamp(16px,4vw,48px) 0',position:'relative',zIndex:2 }}>
        <div className="f-grid" style={{ display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr 1.3fr',gap:48,marginBottom:56 }}>

          {/* Brand col */}
          <div className="f-brand-col">
            <div style={{ marginBottom:20 }}>
              {/* ── FOOTER LOGO ── */}
              <Link href="/" style={{ textDecoration:'none',display:'inline-flex',alignItems:'center' }}>
                <img src="/assets/logo1.png" alt="mdfld" className="f-logo-img" />
              </Link>
              <div style={{ fontFamily:"'Barlow',sans-serif",fontSize:9,fontWeight:600,letterSpacing:'0.35em',textTransform:'uppercase',color:'rgba(255,255,255,0.22)',marginTop:8 }}>
                The Apex of Football Culture
              </div>
            </div>
            <p style={{ fontFamily:"'Barlow',sans-serif",fontSize:12,fontWeight:300,lineHeight:1.8,color:'rgba(255,255,255,0.30)',maxWidth:240,marginBottom:24 }}>
              Premium football boots, kits and gear — globally shipped, pro approved.
            </p>
            <div style={{ display:'flex',flexDirection:'column',gap:7,marginBottom:24 }}>
              {[
                { icon:<ShieldCheck size={11}/>,text:'Verified Authentic Products' },
                { icon:<Globe size={11}/>,text:'150+ Countries Shipped' },
                { icon:<Zap size={11}/>,text:'Same-Day Dispatch Available' },
              ].map((b,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ color:ACCENT,flexShrink:0 }}>{b.icon}</span>
                  <span style={{ fontFamily:"'Barlow',sans-serif",fontSize:10,color:'rgba(255,255,255,0.26)',letterSpacing:'0.05em' }}>{b.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',gap:8 }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} className="f-social" aria-label={s.label} target="_blank" rel="noopener noreferrer">{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Nav cols */}
          {Object.entries(NAV).filter(([h])=>h!=='Legal').map(([heading,links])=>(
            <div key={heading}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:ACCENT,marginBottom:18 }}>{heading}</div>
              <div style={{ display:'flex',flexDirection:'column',gap:1 }}>
                {links.map(l=><Link key={l.href} href={l.href} className="f-link">{l.label}</Link>)}
              </div>
            </div>
          ))}

          {/* Newsletter */}
          <div className="f-nl-col">
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:ACCENT,marginBottom:18 }}>Stay Ahead</div>
            <p style={{ fontFamily:"'Barlow',sans-serif",fontSize:11,color:'rgba(255,255,255,0.28)',lineHeight:1.7,marginBottom:14 }}>Drop alerts, exclusive deals, early access.</p>
            {sent ? (
              <div style={{ background:'rgba(0,212,182,0.06)',border:'1px solid rgba(0,212,182,0.15)',borderLeft:`2px solid ${ACCENT}`,padding:'14px 16px' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:ACCENT }}>✓ You're In</span>
                <div style={{ fontFamily:"'Barlow',sans-serif",fontSize:9,color:'rgba(255,255,255,0.3)',marginTop:3 }}>First drop alert coming soon.</div>
              </div>
            ) : (
              <div style={{ border:`1px solid ${focused?'rgba(0,212,182,0.35)':'rgba(255,255,255,0.08)'}`,background:'rgba(255,255,255,0.02)',transition:'border-color 0.3s' }}>
                <input className="f-nl-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder="your@email.com" style={{ background:'transparent',border:'none',outline:'none',fontFamily:"'Barlow',sans-serif",fontSize:12,color:'#fff',padding:'11px 14px',letterSpacing:'0.04em',width:'100%',boxSizing:'border-box' }} />
                <button onClick={()=>email.includes('@')&&setSent(true)} style={{ background:ACCENT,border:'none',color:'#020606',fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:900,letterSpacing:'0.3em',textTransform:'uppercase',padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%' }} onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.08)')} onMouseLeave={e=>(e.currentTarget.style.filter='brightness(1)')}>
                  Subscribe <ArrowRight size={12}/>
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:20,marginBottom:0 }} />
      </div>

      <div className="f-bottom" style={{ borderTop:'1px solid rgba(255,255,255,0.04)',padding:'16px clamp(16px,4vw,48px)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,position:'relative',zIndex:2 }}>
        <span style={{ fontFamily:"'Barlow',sans-serif",fontSize:10,color:'rgba(255,255,255,0.18)',letterSpacing:'0.08em',whiteSpace:'nowrap' }}>© 2025 Midfield FC Ltd. All rights reserved.</span>
        <div className="f-legal-row" style={{ display:'flex',gap:20 }}>
          {NAV.Legal.map(l=><Link key={l.href} href={l.href} className="f-legal">{l.label}</Link>)}
        </div>
      </div>
    </footer>
  );
}