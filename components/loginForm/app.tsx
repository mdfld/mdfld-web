"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

const ACCENT = "#00d4b6";

export default function LoginFormFrameless() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn.email({ email, password }, {
        onSuccess: () => {
          const redirect = new URLSearchParams(window.location.search).get("from") || "/dashboard";
          router.push(redirect);
        },
        onError: (ctx) => {
          const msg = ctx.error.message || "Login failed";
          if (msg.toLowerCase().includes("verify")) {
            setError("Please verify your email first. Check your inbox for the verification link.");
          } else if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
            setError("Invalid email or password. Please try again.");
          } else { setError(msg); }
        },
      });
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily:"'Oswald',sans-serif",background:"#020606",minHeight:"100dvh",position:"relative",overflow:"hidden",display:"flex",alignItems:"stretch",flexDirection:"row" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Oswald:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .bg-image{position:absolute;inset:0;z-index:0;background-image:url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d?q=80&w=2500&auto=format&fit=crop');background-size:cover;background-position:center;filter:grayscale(40%) contrast(120%);}
        .bg-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(135deg,rgba(2,6,6,0.95) 0%,rgba(2,6,6,0.7) 40%,rgba(0,212,182,0.15) 100%);}
        .grid-bg{position:absolute;inset:0;z-index:2;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:56px 56px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-ring{0%{transform:scale(1);opacity:0.7}100%{transform:scale(2.2);opacity:0}}
        @keyframes shimmer{0%{transform:translateX(-100%) skewX(-15deg)}100%{transform:translateX(400%) skewX(-15deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .animate-1{animation:fadeUp 0.6s 0.1s both}.animate-2{animation:fadeUp 0.6s 0.2s both}.animate-3{animation:fadeUp 0.6s 0.3s both}.animate-4{animation:fadeUp 0.6s 0.4s both}.animate-5{animation:fadeUp 0.6s 0.5s both}.animate-6{animation:fadeUp 0.6s 0.6s both}.animate-7{animation:fadeUp 0.6s 0.7s both}
        .pulse-ring{animation:pulse-ring 2s ease-out infinite}
        .float-el{animation:float 4s ease-in-out infinite}
        .glass-panel{background:rgba(5,12,10,0.45);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-left:1px solid rgba(255,255,255,0.05);box-shadow:-20px 0 40px rgba(0,0,0,0.5);}
        .input-wrap{position:relative;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);backdrop-filter:blur(10px);transition:border-color 0.3s,box-shadow 0.3s,background 0.3s;display:flex;align-items:center;border-radius:4px;}
        .input-wrap.focused{border-color:rgba(0,212,182,0.6);background:rgba(0,212,182,0.05);box-shadow:0 0 0 1px rgba(0,212,182,0.1),0 4px 24px rgba(0,212,182,0.08);}
        .input-wrap input{flex:1;background:transparent;border:none;outline:none;font-family:'Inter',sans-serif;font-size:14px;color:#fff;padding:16px 20px;letter-spacing:0.01em;caret-color:#00d4b6;}
        .input-wrap input::placeholder{color:rgba(255,255,255,0.25);}
        .input-label{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px;display:block;transition:color 0.3s;}
        .input-label.active{color:#00d4b6;}
        .btn-primary{position:relative;overflow:hidden;background:#00d4b6;border:none;color:#020606;font-family:'Oswald',sans-serif;font-size:16px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;padding:18px 32px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:12px;border-radius:4px;transition:opacity 0.2s,transform 0.2s,box-shadow 0.2s;box-shadow:0 8px 24px rgba(0,212,182,0.2);min-height:56px;}
        .btn-primary:hover:not(:disabled){opacity:0.95;transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,212,182,0.3);}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed;}
        .btn-primary .shimmer{animation:shimmer 2.5s ease-in-out infinite;position:absolute;top:0;left:0;width:30%;height:100%;background:rgba(255,255,255,0.3);}
        .btn-google{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-family:'Inter',sans-serif;font-size:14px;font-weight:500;padding:16px 24px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:12px;border-radius:4px;backdrop-filter:blur(10px);transition:border-color 0.3s,background 0.3s,color 0.3s,transform 0.2s;min-height:52px;}
        .btn-google:hover{border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;transform:translateY(-1px);}
        .divider{display:flex;align-items:center;gap:16px;}
        .divider-line{flex:1;height:1px;background:rgba(255,255,255,0.08);}
        .divider-text{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.4);white-space:nowrap;}
        .stat-card{background:rgba(255,255,255,0.03);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #00d4b6;padding:16px 20px;border-radius:0 4px 4px 0;}
        .link-accent{color:#00d4b6;text-decoration:none;font-weight:500;transition:opacity 0.2s;}
        .link-accent:hover{opacity:0.75;}
        .forgot-link{font-family:'Inter',sans-serif;font-size:13px;color:rgba(255,255,255,0.5);text-decoration:none;transition:color 0.2s;min-height:44px;display:inline-flex;align-items:center;}
        .forgot-link:hover{color:#00d4b6;}
        .ghost-text{position:absolute;font-size:clamp(80px,14vw,220px);font-weight:700;letter-spacing:-0.02em;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,0.03);text-transform:uppercase;user-select:none;pointer-events:none;line-height:1;z-index:2;}
        .error-box{background:rgba(255,60,60,0.1);border:1px solid rgba(255,60,60,0.3);border-radius:4px;padding:14px 16px;margin-bottom:24px;font-family:'Inter',sans-serif;font-size:13px;color:#ff6b6b;display:flex;align-items:center;gap:8px;}
        .login-logo{height:38px;width:auto;object-fit:contain;}
        @media(max-width:1024px){.left-panel{display:none !important}.glass-panel{border-left:none !important;box-shadow:none !important;background:rgba(2,6,6,0.7) !important}}
        @media(max-width:768px){.input-wrap input{font-size:16px;padding:14px 16px}.btn-primary{font-size:14px;padding:16px 24px}}
        @supports(padding:max(0px)){.mobile-safe{padding-left:max(20px,env(safe-area-inset-left));padding-right:max(20px,env(safe-area-inset-right));padding-top:max(20px,env(safe-area-inset-top));padding-bottom:max(20px,env(safe-area-inset-bottom));}}
      `}</style>

      <div className="bg-image" />
      <div className="bg-overlay" />
      <div className="grid-bg" />
      <div className="ghost-text" style={{ bottom:"-2%",left:"-2%" }}>MDFLD</div>
      <div style={{ position:"absolute",top:"20%",left:"10%",width:"60vw",height:"60vw",maxWidth:600,maxHeight:600,background:"radial-gradient(circle,rgba(0,212,182,0.08) 0%,transparent 60%)",filter:"blur(60px)",pointerEvents:"none",zIndex:2 }} />

      {/* LEFT PANEL */}
      <div className="left-panel" style={{ flex:"0 0 45%",position:"relative",zIndex:3,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"clamp(32px,5vw,64px)" }}>
        {/* ── LOGO ── */}
        <a href="/" style={{ display:"inline-flex",alignItems:"center" }}>
          <img src="/assets/logo1.png" alt="mdfld" className="login-logo" />
        </a>

        <div>
          <div className="animate-2" style={{ display:"inline-flex",alignItems:"center",gap:10,background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:100,backdropFilter:"blur(10px)",padding:"8px 20px 8px 10px",marginBottom:"clamp(24px,4vh,40px)" }}>
            <div style={{ position:"relative",width:8,height:8,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div className="pulse-ring" style={{ position:"absolute",inset:0,borderRadius:"50%",background:ACCENT,opacity:0.5 }} />
              <div style={{ width:8,height:8,borderRadius:"50%",background:ACCENT,position:"relative",zIndex:1 }} />
            </div>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",color:ACCENT }}>Members Only Access</span>
          </div>
          <h1 className="animate-3" style={{ fontSize:"clamp(48px,6.5vw,92px)",fontWeight:700,lineHeight:1.1,textTransform:"uppercase",color:"#fff",margin:"0 0 4px" }}>Welcome</h1>
          <h1 className="animate-4" style={{ fontSize:"clamp(48px,6.5vw,92px)",fontWeight:700,lineHeight:1.1,textTransform:"uppercase",margin:"0 0 clamp(20px,3vh,32px)",background:"linear-gradient(135deg,#00d4b6,#008f7a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>Back.</h1>
          <div className="animate-4" style={{ height:3,width:140,background:"linear-gradient(90deg,#00d4b6,transparent)",boxShadow:"0 0 16px rgba(0,212,182,0.6)",marginBottom:"clamp(20px,3vh,32px)",borderRadius:2 }} />
          <p className="animate-5" style={{ fontFamily:"'Inter',sans-serif",fontSize:"clamp(14px,1.8vw,15px)",fontWeight:300,lineHeight:1.6,color:"rgba(255,255,255,0.6)",maxWidth:360 }}>
            Sign in to access exclusive drops, manage your collection, and dominate the midfield.
          </p>
        </div>
        <div className="animate-6" style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {[{n:"12K+",l:"Members Worldwide"},{n:"5K+",l:"Exclusive Drops"}].map((s,i) => (
            <div key={i} className="stat-card float-el" style={{ animationDelay:`${i*0.8}s`,maxWidth:280 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:"clamp(22px,3.5vw,28px)",fontWeight:600,color:"#fff",lineHeight:1 }}>{s.n}</div>
              <div style={{ fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:ACCENT,marginTop:6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="glass-panel" style={{ flex:1,position:"relative",zIndex:3,display:"flex",alignItems:"center",justifyContent:"center",padding:"clamp(24px,6vw,64px)",overflowY:"auto" }}>
        <div className="mobile-safe" style={{ width:"100%",maxWidth:440 }}>
          <h2 className="animate-1" style={{ fontSize:"clamp(28px,5vw,36px)",fontWeight:600,textTransform:"uppercase",color:"#fff",marginBottom:8 }}>Sign In</h2>
          <p className="animate-2" style={{ fontFamily:"'Inter',sans-serif",fontSize:"clamp(13px,2vw,14px)",fontWeight:300,color:"rgba(255,255,255,0.5)",marginBottom:"clamp(28px,5vh,40px)" }}>
            Don&apos;t have an account?{" "}<a href="/auth/signup" className="link-accent">Create one &rarr;</a>
          </p>
          <div className="animate-3">
            <button className="btn-google" onClick={() => signIn.social({ provider:"google",callbackURL:"/dashboard" })}>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
          <div className="divider animate-4" style={{ margin:"clamp(24px,4vh,32px) 0" }}>
            <div className="divider-line" /><span className="divider-text">or sign in with email</span><div className="divider-line" />
          </div>
          {error && (
            <div className="error-box animate-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          <div className="animate-5" style={{ marginBottom:"clamp(18px,3vh,24px)" }}>
            <label className={`input-label${emailFocus?" active":""}`}>Email Address</label>
            <div className={`input-wrap${emailFocus?" focused":""}`}>
              <input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setEmailFocus(true)} onBlur={()=>setEmailFocus(false)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoComplete="email" />
            </div>
          </div>
          <div className="animate-5" style={{ marginBottom:12 }}>
            <label className={`input-label${passFocus?" active":""}`}>Password</label>
            <div className={`input-wrap${passFocus?" focused":""}`}>
              <input type={showPass?"text":"password"} placeholder="••••••••••" value={password} onChange={e=>setPassword(e.target.value)} onFocus={()=>setPassFocus(true)} onBlur={()=>setPassFocus(false)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoComplete="current-password" />
              <button onClick={()=>setShowPass(p=>!p)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",padding:"0 18px",display:"flex",alignItems:"center",minWidth:48,minHeight:48,justifyContent:"center" }} onMouseEnter={e=>(e.currentTarget.style.color=ACCENT)} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.3)")} aria-label={showPass?"Hide password":"Show password"}>
                {showPass?<EyeOff size={18}/>:<Eye size={18}/>}
              </button>
            </div>
          </div>
          <div className="animate-5" style={{ display:"flex",justifyContent:"flex-end",marginBottom:"clamp(24px,4vh,36px)" }}>
            <a href="/auth/forgot-password" className="forgot-link">Forgot password?</a>
          </div>
          <div className="animate-6">
            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              <div className="shimmer" />
              <span style={{ position:"relative",zIndex:2 }}>{loading?"Signing In...":"Sign In"}</span>
              <ArrowRight size={18} style={{ position:"relative",zIndex:2 }} />
            </button>
          </div>
          <p className="animate-7" style={{ fontFamily:"'Inter',sans-serif",fontSize:"clamp(11px,1.5vw,12px)",color:"rgba(255,255,255,0.4)",marginTop:"clamp(20px,3vh,28px)",lineHeight:1.6,textAlign:"center" }}>
            By signing in you agree to our{" "}<a href="/terms" style={{ color:"rgba(0,212,182,0.8)",textDecoration:"none" }}>Terms of Service</a>{" "}and{" "}<a href="/privacy" style={{ color:"rgba(0,212,182,0.8)",textDecoration:"none" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}