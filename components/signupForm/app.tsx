"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "@/lib/auth-client";

const ACCENT = "#00d4b6";

const PERKS = [
  "Early access to exclusive drops",
  "Blockchain verified authentication",
  "Free shipping on first order",
  "Members-only pricing",
];

export default function SignUpFormFrameless() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name:"",username:"",email:"",password:"",confirm:"" });
  const [focus, setFocus] = useState<string|null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement>) => setForm(f=>({...f,[k]:e.target.value}));

  const handleSignup = async () => {
    setError(""); setSuccess("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!agreed) { setError("You must agree to the Terms and Privacy Policy"); return; }
    setLoading(true);
    try {
      await signUp.email({ name:form.name,email:form.email,password:form.password,username:form.username }, {
        onSuccess: () => { setSuccess("Account created! Check your email to verify before signing in."); setTimeout(()=>router.push("/auth/login"),3000); },
        onError: (ctx) => {
          const msg = ctx.error.message || "An error occurred";
          if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("already")) { setError("This email is already registered. Please log in instead."); }
          else if (msg.toLowerCase().includes("username")) { setError("This username is taken. Please choose another."); }
          else { setError(msg); }
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
        .bg-su{position:absolute;inset:0;z-index:0;background-image:url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2500&auto=format&fit=crop');background-size:cover;background-position:center;filter:grayscale(30%) contrast(110%);}
        .bg-ov-su{position:absolute;inset:0;z-index:1;background:linear-gradient(135deg,rgba(2,6,6,0.96) 0%,rgba(2,6,6,0.75) 45%,rgba(0,212,182,0.12) 100%);}
        .grid-bg-su{position:absolute;inset:0;z-index:2;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:56px 56px;}
        @keyframes fadeUpSU{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmerSU{0%{transform:translateX(-100%) skewX(-15deg)}100%{transform:translateX(400%) skewX(-15deg)}}
        .su-a1{animation:fadeUpSU 0.6s 0.1s both}.su-a2{animation:fadeUpSU 0.6s 0.2s both}.su-a3{animation:fadeUpSU 0.6s 0.3s both}.su-a4{animation:fadeUpSU 0.6s 0.4s both}.su-a5{animation:fadeUpSU 0.6s 0.5s both}.su-a6{animation:fadeUpSU 0.6s 0.6s both}.su-a7{animation:fadeUpSU 0.6s 0.7s both}
        .su-glass{background:rgba(5,12,10,0.45);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-left:1px solid rgba(255,255,255,0.05);box-shadow:-20px 0 40px rgba(0,0,0,0.5);}
        .su-input-wrap{position:relative;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);transition:border-color 0.3s,box-shadow 0.3s,background 0.3s;display:flex;align-items:center;border-radius:4px;}
        .su-input-wrap.focused{border-color:rgba(0,212,182,0.6);background:rgba(0,212,182,0.05);box-shadow:0 0 0 1px rgba(0,212,182,0.1);}
        .su-input-wrap input{flex:1;background:transparent;border:none;outline:none;font-family:'Inter',sans-serif;font-size:14px;color:#fff;padding:14px 18px;caret-color:#00d4b6;}
        .su-input-wrap input::placeholder{color:rgba(255,255,255,0.25);}
        .su-label{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:7px;display:block;transition:color 0.3s;}
        .su-label.act{color:#00d4b6;}
        .su-btn{position:relative;overflow:hidden;background:#00d4b6;border:none;color:#020606;font-family:'Oswald',sans-serif;font-size:15px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;padding:16px 32px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:12px;border-radius:4px;transition:opacity 0.2s,transform 0.2s,box-shadow 0.2s;box-shadow:0 8px 24px rgba(0,212,182,0.2);min-height:52px;}
        .su-btn:hover:not(:disabled){opacity:0.95;transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,212,182,0.3);}
        .su-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .su-btn .shim{animation:shimmerSU 2.5s ease-in-out infinite;position:absolute;top:0;left:0;width:30%;height:100%;background:rgba(255,255,255,0.3);}
        .su-google{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-family:'Inter',sans-serif;font-size:14px;padding:14px 24px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:12px;border-radius:4px;min-height:48px;transition:all 0.2s;}
        .su-google:hover{border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;}
        .su-divider{display:flex;align-items:center;gap:16px;}
        .su-dline{flex:1;height:1px;background:rgba(255,255,255,0.08);}
        .su-dtext{font-family:'Inter',sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.4);}
        .su-link{color:#00d4b6;text-decoration:none;font-weight:500;transition:opacity 0.2s;}
        .su-link:hover{opacity:0.75;}
        .su-err{background:rgba(255,60,60,0.1);border:1px solid rgba(255,60,60,0.3);border-radius:4px;padding:12px 16px;margin-bottom:20px;font-family:'Inter',sans-serif;font-size:13px;color:#ff6b6b;display:flex;align-items:center;gap:8px;}
        .su-ok{background:rgba(0,212,182,0.08);border:1px solid rgba(0,212,182,0.25);border-radius:4px;padding:12px 16px;margin-bottom:20px;font-family:'Inter',sans-serif;font-size:13px;color:#00d4b6;}
        .su-ghost{position:absolute;font-size:clamp(80px,14vw,200px);font-weight:700;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,0.03);text-transform:uppercase;user-select:none;pointer-events:none;line-height:1;z-index:2;}
        .su-perk{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
        .su-logo-img{height:38px;width:auto;object-fit:contain;}
        @media(max-width:1024px){.su-left{display:none !important}.su-glass{border-left:none !important;box-shadow:none !important;background:rgba(2,6,6,0.7) !important}}
        @media(max-width:768px){.su-input-wrap input{font-size:16px;}}
        @supports(padding:max(0px)){.su-safe{padding-left:max(20px,env(safe-area-inset-left));padding-right:max(20px,env(safe-area-inset-right));}}
      `}</style>

      <div className="bg-su" />
      <div className="bg-ov-su" />
      <div className="grid-bg-su" />
      <div className="su-ghost" style={{ bottom:"-2%",right:"-1%" }}>MDFLD</div>

      {/* LEFT PANEL */}
      <div className="su-left" style={{ flex:"0 0 42%",position:"relative",zIndex:3,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"clamp(32px,5vw,64px)" }}>
        {/* ── LOGO ── */}
        <a href="/" style={{ display:"inline-flex",alignItems:"center" }}>
          <img src="/assets/logo1.png" alt="mdfld" className="su-logo-img" />
        </a>

        <div>
          <h1 className="su-a2" style={{ fontSize:"clamp(42px,6vw,82px)",fontWeight:700,lineHeight:1.1,textTransform:"uppercase",color:"#fff",margin:"0 0 4px" }}>Join The</h1>
          <h1 className="su-a3" style={{ fontSize:"clamp(42px,6vw,82px)",fontWeight:700,lineHeight:1.1,textTransform:"uppercase",margin:"0 0 clamp(20px,3vh,36px)",background:"linear-gradient(135deg,#00d4b6,#008f7a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>Midfield.</h1>
          <div className="su-a3" style={{ height:3,width:120,background:"linear-gradient(90deg,#00d4b6,transparent)",marginBottom:"clamp(24px,4vh,40px)",borderRadius:2 }} />
          <div className="su-a4">
            {PERKS.map((p,i) => (
              <div key={i} className="su-perk">
                <div style={{ width:22,height:22,borderRadius:"50%",background:"rgba(0,212,182,0.12)",border:"1px solid rgba(0,212,182,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Check size={11} color={ACCENT} />
                </div>
                <span style={{ fontFamily:"'Inter',sans-serif",fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.4 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="su-a6" style={{ background:"rgba(0,212,182,0.04)",border:"1px solid rgba(0,212,182,0.12)",borderLeft:`3px solid ${ACCENT}`,padding:"16px 20px",borderRadius:"0 4px 4px 0" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:"#fff" }}>50K+</div>
          <div style={{ fontFamily:"'Inter',sans-serif",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:ACCENT,marginTop:4 }}>Community Members</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="su-glass" style={{ flex:1,position:"relative",zIndex:3,display:"flex",alignItems:"center",justifyContent:"center",padding:"clamp(24px,5vw,56px)",overflowY:"auto" }}>
        <div className="su-safe" style={{ width:"100%",maxWidth:420 }}>
          <h2 className="su-a1" style={{ fontSize:"clamp(26px,4.5vw,34px)",fontWeight:600,textTransform:"uppercase",color:"#fff",marginBottom:8 }}>Create Account</h2>
          <p className="su-a2" style={{ fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:300,color:"rgba(255,255,255,0.5)",marginBottom:"clamp(24px,4vh,36px)" }}>
            Already have an account?{" "}<a href="/auth/login" className="su-link">Sign in &rarr;</a>
          </p>
          <div className="su-a3">
            <button className="su-google" onClick={() => signIn.social({ provider:"google",callbackURL:"/dashboard" })}>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Sign up with Google</span>
            </button>
          </div>
          <div className="su-divider su-a4" style={{ margin:"clamp(20px,3.5vh,28px) 0" }}>
            <div className="su-dline"/><span className="su-dtext">or create with email</span><div className="su-dline"/>
          </div>
          {error && <div className="su-err su-a1"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
          {success && <div className="su-ok su-a1">✓ {success}</div>}

          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {[{key:"name",label:"Full Name",type:"text",placeholder:"Your full name",auto:"name"},{key:"username",label:"Username",type:"text",placeholder:"Choose a username",auto:"username"},{key:"email",label:"Email Address",type:"email",placeholder:"you@example.com",auto:"email"}].map(({key,label,type,placeholder,auto},idx)=>(
              <div key={key} className={`su-a${idx+5}`}>
                <label className={`su-label${focus===key?" act":""}`}>{label}</label>
                <div className={`su-input-wrap${focus===key?" focused":""}`}>
                  <input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={set(key)} onFocus={()=>setFocus(key)} onBlur={()=>setFocus(null)} autoComplete={auto} />
                </div>
              </div>
            ))}
            <div className="su-a5">
              <label className={`su-label${focus==="password"?" act":""}`}>Password</label>
              <div className={`su-input-wrap${focus==="password"?" focused":""}`}>
                <input type={showPass?"text":"password"} placeholder="Min 8 characters" value={form.password} onChange={set("password")} onFocus={()=>setFocus("password")} onBlur={()=>setFocus(null)} autoComplete="new-password" />
                <button onClick={()=>setShowPass(p=>!p)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",padding:"0 16px",display:"flex",alignItems:"center",minWidth:44,minHeight:44,justifyContent:"center" }} onMouseEnter={e=>(e.currentTarget.style.color=ACCENT)} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.3)")}>{showPass?<EyeOff size={17}/>:<Eye size={17}/>}</button>
              </div>
            </div>
            <div className="su-a6">
              <label className={`su-label${focus==="confirm"?" act":""}`}>Confirm Password</label>
              <div className={`su-input-wrap${focus==="confirm"?" focused":""}`}>
                <input type={showConfirm?"text":"password"} placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} onFocus={()=>setFocus("confirm")} onBlur={()=>setFocus(null)} onKeyDown={e=>e.key==="Enter"&&handleSignup()} autoComplete="new-password" />
                <button onClick={()=>setShowConfirm(p=>!p)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",padding:"0 16px",display:"flex",alignItems:"center",minWidth:44,minHeight:44,justifyContent:"center" }} onMouseEnter={e=>(e.currentTarget.style.color=ACCENT)} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.3)")}>{showConfirm?<EyeOff size={17}/>:<Eye size={17}/>}</button>
              </div>
            </div>
          </div>

          <div className="su-a6" style={{ display:"flex",alignItems:"flex-start",gap:12,margin:"20px 0 24px" }}>
            <button onClick={()=>setAgreed(a=>!a)} style={{ width:20,height:20,borderRadius:4,border:`2px solid ${agreed?ACCENT:"rgba(255,255,255,0.2)"}`,background:agreed?"rgba(0,212,182,0.15)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.2s" }}>
              {agreed&&<Check size={12} color={ACCENT}/>}
            </button>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.5 }}>
              I agree to the{" "}<a href="/terms" className="su-link">Terms of Service</a> and{" "}<a href="/privacy" className="su-link">Privacy Policy</a>
            </span>
          </div>

          <div className="su-a7">
            <button className="su-btn" onClick={handleSignup} disabled={loading}>
              <div className="shim"/>
              <span style={{ position:"relative",zIndex:2 }}>{loading?"Creating Account...":"Create Account"}</span>
              <ArrowRight size={17} style={{ position:"relative",zIndex:2 }}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}