import { useState, useEffect, useRef, createContext, useContext } from "react";

// ── Fonts + Global Styles ─────────────────────────────────────────────────────
(() => {
  if (document.getElementById("xr-g")) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = "xr-g";
  s.textContent = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;background:#000;color:#fff;min-height:100vh}
    input,select,button,textarea{font-family:inherit;-webkit-appearance:none;appearance:none}
    select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23666' d='M5 7L0 2h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px!important}
    button{touch-action:manipulation}
    *{-webkit-tap-highlight-color:transparent}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-thumb{background:#333;border-radius:99px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  `;
  document.head.appendChild(s);
})();

// ── Responsive ────────────────────────────────────────────────────────────────
function useW() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#000",bg1:"#0a0a0a",bg2:"#111",bg3:"#171717",bg4:"#1c1c1c",
  b1:"#1a1a1a",b2:"#252525",b3:"#333",b4:"#444",
  t1:"#fff",t2:"#d4d4d4",t3:"#a3a3a3",t4:"#525252",
  vi:"#d4a017",viL:"#e8b84b",viD:"#b8860b",viDim:"rgba(212,160,23,0.1)",viGlo:"rgba(212,160,23,0.22)",
  fu:"#f59e0b",cy:"#06b6d4",em:"#10b981",am:"#e07b39",ro:"#f43f5e",bl:"#3b82f6",
  ok:"#22c55e",warn:"#f59e0b",err:"#ef4444",
};

// ── Single plan ───────────────────────────────────────────────────────────────
const PLAN = { name:"Pro", price:49, priceAnn:490, col:C.vi };

// ── Shared styles ─────────────────────────────────────────────────────────────
const btnP = (color=C.vi, full=false) => ({
  display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
  padding:"11px 20px",background:color,color:"#fff",border:"none",
  borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",
  letterSpacing:"-0.01em",whiteSpace:"nowrap",width:full?"100%":"auto",minHeight:44,
  transition:"opacity .15s",
});
const btnG = (full=false) => ({
  ...btnP("transparent",full),color:C.t3,border:`1px solid ${C.b3}`,
});
const inp = {
  width:"100%",padding:"12px 14px",background:C.bg3,border:`1px solid ${C.b2}`,
  borderRadius:10,fontSize:15,color:C.t1,outline:"none",
  fontFamily:"inherit",boxSizing:"border-box",minHeight:48,transition:"border-color .15s",
};
const lbl = { display:"block",fontSize:11,fontWeight:700,color:C.t4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6 };
const card = (e) => ({ background:e?C.bg3:C.bg2, borderRadius:14, border:`1px solid ${e?C.b2:C.b1}` });

// ── Auth ──────────────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const DEMOS = {
  "demo@xhibitur.com":  { pw:"demo1234",  name:"Demo Business", plan:"pro"   },
  "trial@xhibitur.com": { pw:"trial1234", name:"Trial Account",  plan:"trial" },
};
function AuthProvider({ children }) {
  const [user, setU] = useState(null);
  const [loading, setL] = useState(true);
  useEffect(() => { try { const s=localStorage.getItem("xr_u"); if(s) setU(JSON.parse(s)); } catch{} setL(false); },[]);
  const save = u => { setU(u); localStorage.setItem("xr_u", JSON.stringify(u)); };
 const signIn = async (em,pw) => {
    const f = DEMOS[em.toLowerCase()];
    if (!f||f.pw!==pw) throw new Error("Invalid email or password");
    
    // Check Supabase for real plan status
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?email=eq.${em.toLowerCase()}&select=plan`,
        {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          }
        }
      );
      const data = await res.json();
      const plan = data?.[0]?.plan || f.plan;
      save({ id:"u_"+btoa(em).slice(0,8), email:em.toLowerCase(), name:f.name, plan });
    } catch {
      save({ id:"u_"+btoa(em).slice(0,8), email:em.toLowerCase(), name:f.name, plan:f.plan });
    }
  };
  const signUp = async (em,pw,name) => {
    if (!em||!pw||!name) throw new Error("All fields required");
    if (pw.length<8) throw new Error("Password must be at least 8 characters");
    save({ id:"u_"+Math.random().toString(36).slice(2,10), email:em.toLowerCase(), name, plan:"trial", trialStart:new Date().toISOString() });
  };
  const signOut = () => { setU(null); localStorage.removeItem("xr_u"); };
  const setPlan = p => save({ ...user, plan:p });
  return <AuthCtx.Provider value={{ user,loading,signIn,signUp,signOut,setPlan }}>{children}</AuthCtx.Provider>;
}
const useAuth = () => useContext(AuthCtx);

// ── Router ────────────────────────────────────────────────────────────────────
const RouteCtx = createContext(null);
function RouterProvider({ children }) {
  const get = () => window.location.hash.replace(/^#\/?/,"") || "home";
  const [page, setPage] = useState(get);
  const nav = to => { const p=to.replace(/^\//,""); window.location.hash="#/"+p; setPage(p); window.scrollTo(0,0); };
  useEffect(() => {
    const h = () => { setPage(get()); window.scrollTo(0,0); };
    window.addEventListener("hashchange",h);
    return () => window.removeEventListener("hashchange",h);
  },[]);
  return <RouteCtx.Provider value={{ page,nav }}>{children}</RouteCtx.Provider>;
}
const useNav = () => useContext(RouteCtx);

// ── QR encoder ────────────────────────────────────────────────────────────────
function useQR() {
  const [ok,setOk] = useState(!!window.__xqr);
  useEffect(() => {
    if (window.__xqr) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = () => { window.__xqr=true; setOk(true); };
    document.head.appendChild(s);
  },[]);
  return ok;
}
function QRBox({ value, fg=C.t1, bg=C.bg3, size=160, onUrl }) {
  const ref = useRef(null);
  const ready = useQR();
  useEffect(() => {
    if (!ready||!ref.current||!window.QRCode) return;
    ref.current.innerHTML = "";
    new window.QRCode(ref.current,{ text:value||"https://xhibitur.com",width:size,height:size,colorDark:fg,colorLight:bg,correctLevel:window.QRCode.CorrectLevel.M });
    if (onUrl) setTimeout(() => { const c=ref.current?.querySelector("canvas"); if(c) onUrl(c.toDataURL("image/png")); },160);
  },[ready,value,fg,size]);
  if (!ready) return <div style={{ width:size,height:size,background:C.bg3,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:C.t4,fontSize:12 }}>Loading…</div>;
  return <div ref={ref} style={{ width:size,height:size,borderRadius:6,overflow:"hidden" }}/>;
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Wordmark({ sm }) {
  const sz = sm ? 15 : 18;
  return (
    <div style={{ display:"flex",alignItems:"baseline",gap:3,letterSpacing:"-0.04em",userSelect:"none" }}>
      <span style={{ fontSize:sz,fontWeight:800,color:C.t1 }}>Xhibitur</span>
      <span style={{ fontSize:sz*.85,fontWeight:700,color:C.vi }}>Rewards</span>
    </div>
  );
}
function Tag({ children, color=C.vi, dot }) {
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:4,background:color+"18",color,border:`1px solid ${color}30`,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",letterSpacing:".02em" }}>
      {dot && <span style={{ width:5,height:5,borderRadius:"50%",background:color,flexShrink:0 }}/>}
      {children}
    </span>
  );
}
function Stat({ icon, label:lb, value, delta, accent=C.vi }) {
  return (
    <div style={{ ...card(),padding:16,borderTop:`2px solid ${accent}` }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
        <div style={{ width:34,height:34,borderRadius:8,background:accent+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>{icon}</div>
        {delta && <Tag color={delta.startsWith("+")?C.ok:C.err}>{delta}</Tag>}
      </div>
      <div style={{ fontSize:24,fontWeight:800,color:C.t1,letterSpacing:"-0.04em",marginBottom:2 }}>{value}</div>
      <div style={{ fontSize:12,color:C.t4 }}>{lb}</div>
    </div>
  );
}
function Empty({ icon, title, body, cta }) {
  return (
    <div style={{ textAlign:"center",padding:"52px 20px",...card(),border:`1.5px dashed ${C.b3}` }}>
      <div style={{ fontSize:40,marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:17,fontWeight:700,color:C.t1,marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:14,color:C.t4,marginBottom:24,maxWidth:280,margin:"0 auto 24px",lineHeight:1.6 }}>{body}</div>
      {cta}
    </div>
  );
}

// ── Nav + Layout ──────────────────────────────────────────────────────────────
const TABS = [
  { id:"dashboard",           icon:"⊞", label:"Home"      },
  { id:"dashboard/qr",        icon:"▦",  label:"QR"        },
  { id:"dashboard/rewards",   icon:"◆",  label:"Rewards"   },
  { id:"dashboard/analytics", icon:"◈",  label:"Analytics" },
  { id:"dashboard/account",   icon:"◉",  label:"Account"   },
];

function TopNav() {
  const { user } = useAuth(); const { nav } = useNav(); const w=useW(); const mob=w<768;
  return (
    <header style={{ position:"sticky",top:0,zIndex:200,background:"rgba(0,0,0,.94)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.b1}`,padding:`0 ${mob?16:28}px`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
      <div onClick={()=>nav("home")} style={{ cursor:"pointer" }}><Wordmark/></div>
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        {!mob && <button onClick={()=>nav("pricing")} style={{ ...btnG(),padding:"7px 14px",fontSize:13,minHeight:36 }}>Pricing</button>}
        {user
          ? <button onClick={()=>nav("dashboard")} style={{ ...btnP(),fontSize:13,padding:"8px 16px",minHeight:36 }}>Dashboard →</button>
          : <>
              <button onClick={()=>nav("login")} style={{ ...btnG(),fontSize:13,padding:"7px 14px",minHeight:36 }}>Log in</button>
              <button onClick={()=>nav("signup")} style={{ ...btnP(),fontSize:13,padding:"8px 16px",minHeight:36 }}>Start free trial</button>
            </>
        }
      </div>
    </header>
  );
}

function BottomTabs() {
  const { page,nav } = useNav();
  return (
    <nav style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:300,background:C.bg1,borderTop:`1px solid ${C.b1}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
      {TABS.map(t => {
        const active = page===t.id||(t.id!=="dashboard"&&page.startsWith(t.id));
        return (
          <button key={t.id} onClick={()=>nav(t.id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"10px 2px 9px",background:"none",border:"none",cursor:"pointer",color:active?C.vi:C.t4,minHeight:56,position:"relative" }}>
            {active && <span style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2,background:C.vi,borderRadius:"0 0 3px 3px" }}/>}
            <span style={{ fontSize:17 }}>{t.icon}</span>
            <span style={{ fontSize:9,fontWeight:active?700:500 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  const { user,signOut } = useAuth(); const { page,nav } = useNav();
  return (
    <aside style={{ width:216,background:C.bg1,borderRight:`1px solid ${C.b1}`,display:"flex",flexDirection:"column",padding:"20px 0",flexShrink:0,minHeight:"100%" }}>
      <div style={{ padding:"0 16px 24px",cursor:"pointer" }} onClick={()=>nav("home")}><Wordmark sm/></div>
      <nav style={{ flex:1,padding:"0 8px" }}>
        {TABS.map(t => {
          const active = page===t.id||(t.id!=="dashboard"&&page.startsWith(t.id));
          return (
            <div key={t.id} onClick={()=>nav(t.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:2,cursor:"pointer",background:active?C.viDim:"transparent",color:active?C.vi:C.t4,fontSize:13,fontWeight:active?600:400,borderLeft:`2px solid ${active?C.vi:"transparent"}`,transition:"all .12s" }}
              onMouseEnter={e=>{ if(!active){e.currentTarget.style.background=C.bg3;e.currentTarget.style.color=C.t2;} }}
              onMouseLeave={e=>{ if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.t4;} }}>
              <span style={{ fontSize:15 }}>{t.icon}</span>{t.label}
            </div>
          );
        })}
      </nav>
      <div style={{ padding:"14px 10px 8px",borderTop:`1px solid ${C.b1}` }}>
        <div style={{ ...card(true),padding:"12px",marginBottom:12 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
            <span style={{ fontSize:10,fontWeight:700,color:C.t4,textTransform:"uppercase",letterSpacing:".07em" }}>Plan</span>
            <Tag color={C.vi}>{PLAN.name}</Tag>
          </div>
          <button onClick={()=>nav("pricing")} style={{ ...btnP(C.vi,true),fontSize:11,padding:"7px",minHeight:34 }}>View plan details</button>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"4px 2px" }}>
          <div style={{ width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.vi},${C.fu})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()||"U"}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:12,fontWeight:600,color:C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.name}</div>
            <div style={{ fontSize:10,color:C.t4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.email}</div>
          </div>
          <button onClick={()=>{signOut();nav("home");}} style={{ background:"none",border:"none",color:C.t4,cursor:"pointer",fontSize:16,padding:4,minWidth:32,minHeight:32,display:"flex",alignItems:"center",justifyContent:"center" }}>⏏</button>
        </div>
      </div>
    </aside>
  );
}

function MobAvatar() {
  const { user,signOut } = useAuth(); const { nav } = useNav();
  const [open,setOpen] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <div onClick={()=>setOpen(!open)} style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.vi},${C.fu})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,cursor:"pointer" }}>
        {user?.name?.[0]?.toUpperCase()||"U"}
      </div>
      {open && <>
        <div style={{ position:"fixed",inset:0,zIndex:298 }} onClick={()=>setOpen(false)}/>
        <div style={{ position:"absolute",top:40,right:0,background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:12,padding:8,minWidth:190,zIndex:299,boxShadow:"0 8px 32px rgba(0,0,0,.7)" }}>
          <div style={{ padding:"8px 12px 10px",borderBottom:`1px solid ${C.b1}`,marginBottom:4 }}>
            <div style={{ fontSize:13,fontWeight:600,color:C.t1 }}>{user?.name}</div>
            <div style={{ fontSize:11,color:C.t4 }}>{user?.email}</div>
          </div>
          <button onClick={()=>{nav("pricing");setOpen(false);}} style={{ width:"100%",padding:"10px 12px",background:"none",border:"none",color:C.t2,fontSize:14,cursor:"pointer",textAlign:"left",borderRadius:8,minHeight:40 }}>Plan details</button>
          <button onClick={()=>{signOut();nav("home");setOpen(false);}} style={{ width:"100%",padding:"10px 12px",background:"none",border:"none",color:C.err,fontSize:14,cursor:"pointer",textAlign:"left",borderRadius:8,minHeight:40 }}>Sign out</button>
        </div>
      </>}
    </div>
  );
}

function DashShell({ children }) {
  const w = useW();
  if (w<1024) return (
    <div style={{ minHeight:"100vh",background:C.bg1 }}>
      <div style={{ position:"sticky",top:0,zIndex:100,background:"rgba(10,10,10,.96)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.b1}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <Wordmark sm/><MobAvatar/>
      </div>
      <main style={{ padding:"20px 16px 96px" }}>{children}</main>
      <BottomTabs/>
    </div>
  );
  return (
    <div style={{ display:"flex",minHeight:"100vh",background:C.bg1 }}>
      <div style={{ position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0 }}><Sidebar/></div>
      <main style={{ flex:1,minWidth:0,padding:"32px 40px 56px",overflowX:"hidden" }}>{children}</main>
    </div>
  );
}

function PgHead({ title, sub, action }) {
  const w=useW(); const mob=w<768;
  return (
    <div style={{ display:"flex",alignItems:mob?"flex-start":"center",justifyContent:"space-between",marginBottom:mob?20:28,gap:12,flexWrap:"wrap",animation:"fadeUp .25s ease" }}>
      <div style={{ flex:1 }}>
        <h1 style={{ fontSize:mob?20:22,fontWeight:800,color:C.t1,letterSpacing:"-0.03em",marginBottom:2 }}>{title}</h1>
        {sub && <p style={{ fontSize:13,color:C.t4,margin:0 }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
  );
}

// ── Legal data ────────────────────────────────────────────────────────────────
const PRIVACY = [
  { h:"1. Introduction", b:"Xhibitur LLC (\"we\", \"us\", \"our\") operates Xhibitur Rewards. This Privacy Policy explains how we collect, use, and protect your information. By using Xhibitur Rewards you agree to this policy." },
  { h:"2. Information We Collect", b:"We collect your email when you sign up, plus device info, visit data (timestamp, business ID, visit count), and usage data. We do not collect payment info or government ID." },
  { h:"3. How We Use Your Information", b:"We use your info to: (a) operate your loyalty account; (b) send promotional messages from Xhibitur and partner businesses; (c) generate analytics; (d) comply with legal obligations; (e) prevent fraud." },
  { h:"4. Sharing of Information", b:"We share your contact info with the business whose QR you scanned. We do not sell your data. We may share with service providers under confidentiality agreements, or as required by law." },
  { h:"5. Promotional Communications", b:"By creating an account you opt in to receive promotional messages (SMS, email) from Xhibitur and partners. Opt out anytime: reply STOP to SMS, click unsubscribe in email, or email info@xhibitur.com." },
  { h:"6. SMS and Email", b:"You consent to recurring automated promotional SMS and emails. Consent is not required for purchase. Msg and data rates may apply. Reply STOP to opt out. Reply HELP for help." },
  { h:"7. Data Retention", b:"We retain your info while your account is active. Visit history kept at least 24 months. Request deletion at info@xhibitur.com — processed within 30 days." },
  { h:"8. Local Storage", b:"We use browser localStorage to store your anonymised ID and stamp counts. No third-party tracking cookies. Clear via browser settings — this resets your stamps." },
  { h:"9. Security", b:"We use TLS encryption, hashed identifiers, and access controls. No internet transmission is 100% secure." },
  { h:"10. Children", b:"Xhibitur Rewards is not directed to persons under 13 years of age. We do not knowingly collect personal information from children under 13. If you are under 13 you may not create an account. Contact info@xhibitur.com if you believe we collected data from a child." },
  { h:"11. Your Rights", b:"You may access, correct, delete, or port your data. Contact info@xhibitur.com. We respond within 30 days." },
  { h:"12. New York Residents", b:"Under the NY SHIELD Act and NY GBL Section 899-aa, we maintain reasonable safeguards. We will notify you of any breach per NY law." },
  { h:"13. Changes", b:"We may update this policy. Continued use constitutes acceptance." },
  { h:"14. Contact", b:"info@xhibitur.com · Xhibitur LLC" },
];
const TERMS = [
  { h:"1. Acceptance", b:"By using Xhibitur Rewards you agree to these Terms. If you do not agree, do not use the platform." },
  { h:"2. Service", b:"Xhibitur Rewards is a QR-based loyalty platform by Xhibitur LLC. We are a technology provider, not party to business-customer transactions." },
  { h:"3. Eligibility", b:"You must be at least 13 years old to create an account or use Xhibitur Rewards. By creating an account you represent that you are 13 or older. Business owners represent they have authority to bind their business. We reserve the right to terminate any account found to belong to a person under 13." },
  { h:"4. Check-In and Rewards", b:"Check-in creates a loyalty record. Rewards are at the business's sole discretion. Xhibitur LLC is not responsible for reward value or fulfilment." },
  { h:"5. Promotional Consent", b:"By creating an account you consent to promotional SMS and emails from Xhibitur LLC and partners. Opt out anytime. Msg and data rates may apply." },
  { h:"6. Business Responsibilities", b:"Businesses agree to: provide accurate info; honour advertised rewards; use customer data lawfully; maintain dashboard link confidentiality. We may suspend violating accounts." },
  { h:"7. Intellectual Property", b:"All platform content and branding is owned by Xhibitur LLC or its licensors. Xhibitur is a trademark of Xhibitur LLC." },
  { h:"8. Prohibited Conduct", b:"Do not: use the platform unlawfully; manipulate stamps; create fraudulent check-ins; reverse engineer; use bots; impersonate others." },
  { h:"9. Disclaimer", b:"Platform is provided as-is with no warranties of any kind." },
  { h:"10. Limitation of Liability", b:"Xhibitur LLC is not liable for indirect or consequential damages. Total liability capped at $100 USD or amounts paid in prior 12 months." },
  { h:"11. Indemnification", b:"You indemnify Xhibitur LLC from claims arising from your use or violation of these Terms." },
  { h:"12. NY Compliance", b:"We comply with TCPA, CAN-SPAM, NY General Business Law, and NY SHIELD Act." },
  { h:"13. Class Action Waiver", b:"Disputes resolved individually. No class action or class arbitration against Xhibitur LLC." },
  { h:"14. Governing Law", b:"Governed by New York law. Disputes in New York County courts." },
  { h:"15. Changes", b:"We may update these Terms. Continued use constitutes acceptance." },
  { h:"16. Contact", b:"info@xhibitur.com · Xhibitur LLC" },
];

function LegalModal({ type, onClose }) {
  const sections = type==="privacy" ? PRIVACY : TERMS;
  const title = type==="privacy" ? "Privacy Policy" : "Terms of Use";
  const w=useW(); const mob=w<640;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,.9)",backdropFilter:"blur(8px)",display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",padding:mob?0:20 }}>
      <div style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:mob?"20px 20px 0 0":18,width:"100%",maxWidth:mob?undefined:620,maxHeight:mob?"92vh":"88vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.9)",animation:mob?"sheetUp .3s ease":"fadeUp .2s ease" }}>
        <div style={{ padding:"18px 20px",background:C.bg3,borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:800,fontSize:16,color:C.t1 }}>{title}</div>
            <div style={{ fontSize:11,color:C.t4,marginTop:2 }}>Xhibitur LLC · Effective January 1, 2026</div>
          </div>
          <button onClick={onClose} style={{ background:C.bg4,border:`1px solid ${C.b3}`,color:C.t4,width:36,height:36,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:mob?"20px 18px":"24px 28px",WebkitOverflowScrolling:"touch" }}>
          {sections.map((s,i) => (
            <div key={i} style={{ marginBottom:22 }}>
              <div style={{ fontSize:13,fontWeight:700,color:C.vi,marginBottom:6 }}>{s.h}</div>
              <div style={{ fontSize:13,color:C.t3,lineHeight:1.75 }}>{s.b}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:"14px 20px",borderTop:`1px solid ${C.b1}`,background:C.bg3,flexShrink:0 }}>
          <button onClick={onClose} style={{ ...btnP(C.vi,true),fontSize:14,padding:"12px" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Auth pages ────────────────────────────────────────────────────────────────
function AuthShell({ title, sub, children }) {
  const { nav } = useNav(); const w=useW(); const mob=w<640;
  return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column" }}>
      <div style={{ padding:`16px ${mob?16:28}px`,borderBottom:`1px solid ${C.b1}` }}>
        <div onClick={()=>nav("home")} style={{ cursor:"pointer",display:"inline-block" }}><Wordmark/></div>
      </div>
      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:mob?"20px 16px 48px":"24px" }}>
        <div style={{ width:"100%",maxWidth:440,animation:"fadeUp .28s ease" }}>
          <h1 style={{ fontSize:24,fontWeight:800,color:C.t1,letterSpacing:"-0.04em",marginBottom:5 }}>{title}</h1>
          <p style={{ color:C.t4,fontSize:14,marginBottom:24 }}>{sub}</p>
          <div style={{ ...card(true),padding:mob?"22px 18px":"28px 24px",border:`1px solid ${C.b2}` }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
const dInp = { ...inp,background:C.bg3,border:`1px solid ${C.b2}` };

function Login() {
  const { signIn } = useAuth(); const { nav } = useNav();
  const [em,setEm]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const go = async e => { e.preventDefault(); setErr(""); setBusy(true); try { await signIn(em,pw); nav("dashboard"); } catch(x){ setErr(x.message); } finally{ setBusy(false); } };
  return (
    <AuthShell title="Welcome back" sub="Sign in to your Xhibitur Rewards account">
      <div style={{ background:C.bg4,border:`1px solid ${C.b2}`,borderRadius:8,padding:"10px 14px",marginBottom:20 }}>
        <p style={{ color:C.t4,fontSize:12,lineHeight:1.6,margin:0 }}>
          <span style={{ color:C.viL,fontWeight:600 }}>Demo:</span> demo@xhibitur.com / demo1234 · trial@xhibitur.com / trial1234
        </p>
      </div>
      <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <div><label style={lbl}>Email</label><input type="email" value={em} onChange={e=>setEm(e.target.value)} placeholder="you@business.com" style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
        <div><label style={lbl}>Password</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
        {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ ...btnP(C.vi,true),fontSize:15,padding:"13px",opacity:busy?.7:1 }}>{busy?"Signing in…":"Sign in →"}</button>
      </form>
      <p style={{ textAlign:"center",marginTop:18,fontSize:14,color:C.t4 }}>No account? <span onClick={()=>nav("signup")} style={{ color:C.vi,fontWeight:600,cursor:"pointer" }}>Start free trial</span></p>
    </AuthShell>
  );
}

function Signup() {
  const { signUp } = useAuth(); const { nav } = useNav();
  const [nm,setNm]=useState(""); const [em,setEm]=useState(""); const [pw,setPw]=useState("");
  const [ageOk,setAgeOk]=useState(false); const [termsOk,setTermsOk]=useState(false);
  const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const [legal,setLegal]=useState(null);

  const go = async e => {
    e.preventDefault();
    if (!ageOk) { setErr("You must confirm you are 13 years of age or older to create an account."); return; }
    if (!termsOk) { setErr("You must agree to the Terms of Use and Privacy Policy to continue."); return; }
    setErr(""); setBusy(true);
    try { await signUp(em,pw,nm); nav("dashboard"); }
    catch(x){ setErr(x.message); }
    finally{ setBusy(false); }
  };

  const chk = { width:18,height:18,accentColor:C.vi,cursor:"pointer",flexShrink:0,marginTop:1 };
  const row = { display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:C.bg4,border:`1px solid ${C.b2}`,borderRadius:10 };

  return (
    <AuthShell title="Start your free trial" sub="14 days free. No credit card. $49.99/month after.">
      <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
        {[{ lb:"Business name",val:nm,set:setNm,type:"text",ph:"Acme Coffee Co." },{ lb:"Email",val:em,set:setEm,type:"email",ph:"you@business.com" },{ lb:"Password",val:pw,set:setPw,type:"password",ph:"8+ characters" }].map(f=>(
          <div key={f.lb}><label style={lbl}>{f.lb}</label><input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
        ))}
        <div style={row}>
          <input type="checkbox" id="age" checked={ageOk} onChange={e=>setAgeOk(e.target.checked)} style={chk}/>
          <label htmlFor="age" style={{ fontSize:13,color:C.t3,lineHeight:1.55,cursor:"pointer" }}>
            I confirm I am <strong style={{ color:C.t2 }}>13 years of age or older</strong>. Xhibitur Rewards is not intended for persons under 13.
          </label>
        </div>
        <div style={row}>
          <input type="checkbox" id="terms" checked={termsOk} onChange={e=>setTermsOk(e.target.checked)} style={chk}/>
          <label htmlFor="terms" style={{ fontSize:13,color:C.t3,lineHeight:1.55,cursor:"pointer" }}>
            I agree to Xhibitur LLC's{" "}
            <span onClick={e=>{e.preventDefault();setLegal("terms");}} style={{ color:C.vi,fontWeight:600,cursor:"pointer",textDecoration:"underline" }}>Terms of Use</span>
            {" "}and{" "}
            <span onClick={e=>{e.preventDefault();setLegal("privacy");}} style={{ color:C.vi,fontWeight:600,cursor:"pointer",textDecoration:"underline" }}>Privacy Policy</span>
            , and consent to receive promotional SMS and email from Xhibitur LLC. Msg & data rates may apply. Reply STOP to opt out.
          </label>
        </div>
        {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ ...btnP(C.vi,true),fontSize:15,padding:"13px",opacity:busy?.7:1 }}>{busy?"Creating…":"Start free trial →"}</button>
      </form>
      <p style={{ textAlign:"center",marginTop:16,fontSize:14,color:C.t4 }}>Have an account? <span onClick={()=>nav("login")} style={{ color:C.vi,fontWeight:600,cursor:"pointer" }}>Sign in</span></p>
      {legal && <LegalModal type={legal} onClose={()=>setLegal(null)}/>}
    </AuthShell>
  );
}

// ── Landing ───────────────────────────────────────────────────────────────────
const FEATS = [
  { icon:"▦", title:"Smart QR Codes",      desc:"One code, infinite destinations. Route by device, time, weather, location, loyalty and more.", col:C.vi },
  { icon:"◆", title:"Customer Rewards",    desc:"Points, stamps, cashback and VIP tiers that keep customers coming back on autopilot.", col:C.fu },
  { icon:"◈", title:"Live Analytics",      desc:"Scan volume, device split, redemptions and member growth in real time.", col:C.em },
  { icon:"⚡", title:"Win-Back Automation", desc:"Customers inactive 60+ days automatically get a custom offer. Runs itself 24/7.", col:C.cy },
  { icon:"📱", title:"Mobile Dashboard",   desc:"Manage everything from your phone. Built mobile-first for busy owners.", col:C.am },
  { icon:"↗",  title:"One-Click Deploy",   desc:"Netlify, StackBlitz, Vercel. Cloudflare Workers powers live QR routing.", col:C.bl },
];
const ALL_FEATURES = [
  "Unlimited Smart QR codes","Unlimited Rewards programs","Unlimited monthly scans",
  "Full analytics dashboard","Win-back automation","Mobile-first dashboard",
  "All 10 smart rule types","Custom domain support","CSV data export",
  "Auto-pilot templates","Priority email support","Cloudflare Worker deploy",
];

function Landing() {
  const { nav } = useNav(); const w=useW(); const mob=w<640; const tab=w<1024;
  const px = mob?18:28;
  const [footerLegal,setFooterLegal] = useState(null);
  return (
    <div style={{ background:C.bg,minHeight:"100vh" }}>
      <TopNav/>

      {/* Hero */}
      <section style={{ position:"relative",overflow:"hidden",textAlign:"center",padding:`clamp(64px,10vw,120px) ${px}px clamp(56px,8vw,88px)`,borderBottom:`1px solid ${C.b1}` }}>
        <div style={{ position:"absolute",top:"25%",left:"50%",transform:"translateX(-50%)",width:640,height:420,background:`radial-gradient(ellipse,rgba(212,160,23,.18) 0%,transparent 68%)`,pointerEvents:"none" }}/>
        <div style={{ position:"relative",maxWidth:700,margin:"0 auto" }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:99,padding:"5px 14px",marginBottom:24 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:C.ok,boxShadow:`0 0 8px ${C.ok}`,display:"inline-block" }}/>
            <span style={{ fontSize:mob?10:11,fontWeight:600,color:C.t3,letterSpacing:".05em" }}>SMART QR + LOYALTY REWARDS PLATFORM</span>
          </div>
          <h1 style={{ fontSize:`clamp(38px,8vw,72px)`,fontWeight:900,letterSpacing:"-.05em",lineHeight:1.02,marginBottom:18,color:C.t1 }}>
            <span style={{ color:C.t1,WebkitTextFillColor:C.t1 }}>The smarter way to</span><br/>
            <span style={{ background:`linear-gradient(135deg,${C.vi},${C.fu},#f97316)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>build loyalty.</span>
          </h1>
          <p style={{ fontSize:`clamp(15px,2.5vw,18px)`,color:C.t3,lineHeight:1.7,maxWidth:480,margin:"0 auto 36px" }}>
            Dynamic QR codes that always route to the right destination — paired with rewards that bring customers back automatically.
          </p>
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
            <button onClick={()=>nav("signup")} style={{ ...btnP(),fontSize:mob?15:16,padding:mob?"14px 24px":"14px 32px",boxShadow:`0 0 40px ${C.viGlo}`,width:mob?"100%":"auto",maxWidth:mob?320:undefined }}>Start 14-day free trial</button>
            <button onClick={()=>nav("pricing")} style={{ ...btnG(),fontSize:mob?15:16,padding:mob?"14px 20px":"14px 28px",width:mob?"100%":"auto",maxWidth:mob?320:undefined }}>See how it works</button>
          </div>
          <p style={{ marginTop:16,fontSize:12,color:C.t4 }}>14-day free trial · No credit card · $49.99/mo after · Cancel any time</p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:`clamp(48px,7vw,88px) ${px}px`,maxWidth:1400,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:40 }}>
          <h2 style={{ fontSize:`clamp(22px,4vw,38px)`,fontWeight:800,letterSpacing:"-.04em",marginBottom:10,color:C.t1 }}>Everything your business needs</h2>
          <p style={{ color:C.t4,fontSize:15 }}>From QR routing to customer retention — one platform, zero complexity.</p>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:mob?"1fr":tab?"1fr 1fr":"repeat(3,1fr)",gap:1,border:`1px solid ${C.b1}`,borderRadius:16,overflow:"hidden" }}>
          {FEATS.map(f=>(
            <div key={f.title} style={{ background:C.bg2,padding:`${mob?20:26}px`,borderBottom:`1px solid ${C.b1}`,transition:"background .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg3}
              onMouseLeave={e=>e.currentTarget.style.background=C.bg2}>
              <div style={{ width:38,height:38,borderRadius:8,background:f.col+"16",border:`1px solid ${f.col}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:f.col,marginBottom:14 }}>{f.icon}</div>
              <div style={{ fontSize:14,fontWeight:700,color:C.t1,marginBottom:6 }}>{f.title}</div>
              <div style={{ fontSize:13,color:C.t4,lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Single plan section */}
      <section style={{ padding:`clamp(48px,7vw,80px) ${px}px`,borderTop:`1px solid ${C.b1}`,borderBottom:`1px solid ${C.b1}` }}>
        <div style={{ maxWidth:700,margin:"0 auto",textAlign:"center" }}>
          <Tag color={C.vi}>Simple pricing</Tag>
          <h2 style={{ fontSize:`clamp(24px,4vw,42px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1,marginTop:16,marginBottom:12 }}>One plan. Everything included.</h2>
          <p style={{ color:C.t4,fontSize:mob?14:16,marginBottom:36,lineHeight:1.65 }}>No tiers. No feature locks. No surprises. Just everything your business needs at one flat price.</p>
          <div style={{ ...card(true),border:`1px solid ${C.vi}40`,boxShadow:`0 0 60px ${C.viGlo}`,borderRadius:18,overflow:"hidden",marginBottom:20 }}>
            <div style={{ background:`linear-gradient(135deg,${C.bg3},${C.bg4})`,padding:mob?"28px 20px":"40px 48px",textAlign:"center",borderBottom:`1px solid ${C.b2}` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.vi,letterSpacing:".1em",marginBottom:14 }}>PRO PLAN — EVERYTHING INCLUDED</div>
              <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"center",gap:4,marginBottom:4 }}>
                <span style={{ fontSize:mob?60:80,fontWeight:900,letterSpacing:"-.05em",color:C.t1,lineHeight:1 }}>$49.99</span>
                <span style={{ fontSize:16,color:C.t3,fontWeight:400,marginBottom:10 }}>/month</span>
              </div>
              <div style={{ fontSize:13,color:C.t4,marginBottom:28 }}>or $490.99/year — 2 months free</div>
              <div style={{ display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?8:10,marginBottom:28,textAlign:"left" }}>
                {ALL_FEATURES.map(f=>(
                  <div key={f} style={{ display:"flex",alignItems:"center",gap:9 }}>
                    <span style={{ color:C.vi,fontSize:13,fontWeight:700,flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:mob?13:14,color:C.t2 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>nav("signup")} style={{ ...btnP(C.vi,true),fontSize:mob?15:16,padding:"15px",boxShadow:`0 0 40px ${C.viGlo}`,maxWidth:380 }}>
                Start 14-day free trial
              </button>
              <div style={{ marginTop:12,fontSize:12,color:C.t4 }}>No credit card required · $49.99/mo after trial · Cancel any time</div>
            </div>
          </div>
          <button onClick={()=>nav("pricing")} style={{ ...btnG(),fontSize:14 }}>See full details & FAQ →</button>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding:`clamp(48px,7vw,88px) ${px}px`, borderTop:`1px solid ${C.b1}`, background:C.bg1 }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          {/* Section header */}
          <div style={{ textAlign:"center", marginBottom:mob?40:56 }}>
            <Tag color={C.vi}>How it works</Tag>
            <h2 style={{ fontSize:`clamp(24px,4vw,40px)`, fontWeight:900, letterSpacing:"-.04em", color:C.t1, marginTop:16, marginBottom:12 }}>
              Set up in minutes.<br/>Run it from your phone.
            </h2>
            <p style={{ color:C.t4, fontSize:mob?14:16, maxWidth:460, margin:"0 auto", lineHeight:1.65 }}>
              No app to download. No developer needed. Everything runs in your mobile browser — from setup to managing customers.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":tab?"1fr 1fr":"repeat(3,1fr)", gap:mob?12:16, marginBottom:mob?40:56 }}>
            {[
              {
                step:"01",
                icon:"📱",
                title:"Sign up on your phone",
                body:"Create your account in under 2 minutes using just your phone browser. No app to download, no laptop needed. You'll be inside the dashboard immediately.",
                detail:"Works on iPhone, Android, any browser",
                col:C.vi,
              },
              {
                step:"02",
                icon:"⚡",
                title:"Create your QR & rewards in 60 seconds",
                body:"Pick a template — restaurant, retail, or event — and your smart QR code and rewards program are pre-configured and ready. Customise the details, then go live instantly.",
                detail:"Templates do the heavy lifting for you",
                col:C.fu,
              },
              {
                step:"03",
                icon:"🔄",
                title:"Customers come back automatically",
                body:"Print or display your QR code anywhere. Customers scan to join your loyalty program. The win-back rule quietly sends offers to anyone who goes quiet — with zero effort from you.",
                detail:"Runs 24/7 in the background, hands-free",
                col:C.em,
              },
            ].map((s, i) => (
              <div key={s.step} style={{ position:"relative" }}>
                {/* Connector line between steps on desktop */}
                {!mob && !tab && i < 2 && (
                  <div style={{ position:"absolute", top:36, right:-8, width:16, height:2, background:`linear-gradient(90deg,${s.col}60,transparent)`, zIndex:1 }}/>
                )}
                <div style={{ ...card(), padding:mob?"22px 20px":"28px 26px", height:"100%", borderTop:`2px solid ${s.col}`, position:"relative", overflow:"hidden" }}>
                  {/* Step number watermark */}
                  <div style={{ position:"absolute", top:-10, right:16, fontSize:72, fontWeight:900, color:s.col, opacity:.06, lineHeight:1, letterSpacing:"-.05em", userSelect:"none" }}>{s.step}</div>

                  {/* Icon */}
                  <div style={{ width:52, height:52, borderRadius:14, background:`${s.col}16`, border:`1px solid ${s.col}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:18 }}>
                    {s.icon}
                  </div>

                  {/* Step label */}
                  <div style={{ fontSize:10, fontWeight:700, color:s.col, letterSpacing:".1em", marginBottom:8 }}>STEP {s.step}</div>

                  {/* Title */}
                  <div style={{ fontSize:mob?16:18, fontWeight:800, color:C.t1, letterSpacing:"-.02em", marginBottom:10, lineHeight:1.2 }}>{s.title}</div>

                  {/* Body */}
                  <p style={{ fontSize:mob?13:14, color:C.t3, lineHeight:1.72, marginBottom:16 }}>{s.body}</p>

                  {/* Detail chip */}
                  <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:s.col+"12", border:`1px solid ${s.col}22`, borderRadius:99, padding:"5px 12px" }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:s.col, flexShrink:0 }}/>
                    <span style={{ fontSize:11, fontWeight:600, color:s.col }}>{s.detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Phone callout bar */}
          <div style={{ ...card(true), border:`1px solid ${C.vi}30`, borderRadius:16, padding:mob?"22px 20px":"28px 36px", display:"flex", alignItems:mob?"flex-start":"center", gap:mob?16:24, flexWrap:"wrap", background:`linear-gradient(135deg,${C.viDim},transparent)` }}>
            <div style={{ width:52, height:52, borderRadius:14, background:C.vi+"18", border:`1px solid ${C.vi}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📱</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:mob?15:17, fontWeight:800, color:C.t1, marginBottom:5, letterSpacing:"-.02em" }}>
                100% mobile. No app required.
              </div>
              <div style={{ fontSize:mob?13:14, color:C.t3, lineHeight:1.65 }}>
                Xhibitur Rewards runs entirely in your phone's browser. Set up your QR codes, manage your rewards programs, view live analytics, and see who came back — all from the same device you already have in your pocket.
              </div>
            </div>
            <button onClick={()=>nav("signup")} style={{ ...btnP(), fontSize:mob?14:15, padding:"12px 22px", whiteSpace:"nowrap", width:mob?"100%":"auto", boxShadow:`0 0 24px ${C.viGlo}` }}>
              Try it on your phone →
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:`clamp(48px,7vw,80px) ${px}px`,textAlign:"center",borderTop:`1px solid ${C.b1}`,background:C.bg1 }}>
        <h2 style={{ fontSize:`clamp(26px,5vw,52px)`,fontWeight:900,letterSpacing:"-.05em",marginBottom:14,lineHeight:1.05,color:C.t1 }}>
          Start building loyalty<br/><span style={{ color:C.vi }}>today.</span>
        </h2>
        <p style={{ color:C.t4,fontSize:mob?14:15,marginBottom:28 }}>14-day free trial. No credit card. Cancel any time.</p>
        <button onClick={()=>nav("signup")} style={{ ...btnP(),fontSize:mob?15:16,padding:mob?"14px 28px":"15px 36px",boxShadow:`0 0 40px ${C.viGlo}`,width:mob?"100%":"auto",maxWidth:mob?320:undefined }}>Start free trial →</button>
        <div style={{ marginTop:14,fontSize:12,color:C.t4 }}>$49.99/month after trial · Cancel any time</div>
      </section>

      <footer style={{ background:C.bg,borderTop:`1px solid ${C.b1}`,padding:`20px ${px}px` }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:12 }}>
          <Wordmark sm/>
          <span style={{ color:C.t4,fontSize:11 }}>© 2026 Xhibitur LLC. All rights reserved.</span>
        </div>
        <div style={{ display:"flex",gap:16,flexWrap:"wrap",borderTop:`1px solid ${C.b1}`,paddingTop:12 }}>
          <span onClick={()=>setFooterLegal("privacy")} style={{ fontSize:11,color:C.t4,cursor:"pointer",textDecoration:"underline" }}>Privacy Policy</span>
          <span onClick={()=>setFooterLegal("terms")} style={{ fontSize:11,color:C.t4,cursor:"pointer",textDecoration:"underline" }}>Terms of Use</span>
          <span style={{ fontSize:11,color:C.t4 }}>info@xhibitur.com</span>
          <span style={{ fontSize:11,color:C.t4 }}>Eligibility: 13+</span>
        </div>
        {footerLegal && <LegalModal type={footerLegal} onClose={()=>setFooterLegal(null)}/>}
      </footer>
    </div>
  );
}

// ── Pricing Page ──────────────────────────────────────────────────────────────
const FAQ = [
  { q:"What happens after the 14-day trial?", a:"Your account converts to $49.99/month. We send a reminder 3 days before — you're never surprised. Cancel any time before then and you won't be charged a penny." },
  { q:"Do I need a credit card to start?", a:"No. Start with just your email. We only ask for payment details when your trial ends." },
  { q:"Is there a contract or commitment?", a:"None. Month-to-month, cancel any time from your account settings. No cancellation fees, no questions asked." },
  { q:"What does the annual plan cost?", a:"$490.99/year — that's 2 months free compared to paying monthly. Your savings of $108.89 shows up immediately." },
  { q:"Can I use this for multiple locations?", a:"Yes. One account covers all your locations. Create a separate Smart QR and Rewards program per location — all under one $49.99/month subscription." },
  { q:"What if I need help setting up?", a:"Email info@xhibitur.com and we'll get you live within 24 hours. We also offer a $149 white-glove setup where we configure everything for you." },
  { q:"How does the win-back rule work?", a:"You set a threshold — say 60 days. Any loyalty member who hasn't visited in that time automatically receives a custom offer you define. It runs silently in the background with zero effort from you." },
  { q:"What are the 10 smart rule types?", a:"Device, Time of day, Day of week, Weather, Language, Location, Scan count, Customer loyalty status, Event stage, and Inventory level. Mix and match to create any routing logic you need." },
];

function PricingPage() {
  const { user } = useAuth(); const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const [ann,setAnn] = useState(false);
  const [legalModal,setLegalModal] = useState(null);
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState("");
  const price = ann ? 40.99 : 49.99;
  const px = mob?18:28;

  const startCheckout = async () => {
    if (!user) { nav("signup"); return; }
    if (user.plan === "pro") { nav("dashboard"); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: ann
            ? "price_1TSjbIId1xxQI6ctdhI42SiU"
            : "price_1TSjbIId1xxQI6cthyjPZG9f",
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { setErr("Something went wrong. Please try again or email info@xhibitur.com"); }
    } catch(e) {
      setErr("Something went wrong. Please try again or email info@xhibitur.com");
    } finally { setLoading(false); }
  };
  return (
    <div style={{ minHeight:"100vh",background:C.bg }}>
      <TopNav/>
      <div style={{ maxWidth:1000,margin:"0 auto",padding:`clamp(40px,6vw,80px) ${px}px` }}>

        {/* Header */}
        <div style={{ textAlign:"center",marginBottom:48 }}>
          <Tag color={C.vi}>Simple pricing</Tag>
          <h1 style={{ fontSize:`clamp(30px,5vw,56px)`,fontWeight:900,letterSpacing:"-.05em",color:C.t1,marginBottom:14,marginTop:16,lineHeight:1.05 }}>
            One plan.<br/>Everything included.
          </h1>
          <p style={{ color:C.t4,fontSize:mob?15:17,maxWidth:460,margin:"0 auto 28px",lineHeight:1.65 }}>
            No tiers. No feature locks. No surprises. Everything your business needs for one flat price.
          </p>
          <div style={{ display:"inline-flex",background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:99,padding:4 }}>
            {[["Monthly",false],["Annual (2 months free)",true]].map(([lb,v])=>(
              <button key={lb} onClick={()=>setAnn(v)} style={{ padding:mob?"8px 14px":"8px 22px",borderRadius:99,border:"none",background:ann===v?C.vi:"transparent",color:ann===v?"#fff":C.t4,fontSize:mob?12:13,fontWeight:600,cursor:"pointer",transition:"all .2s",minHeight:40 }}>{lb}</button>
            ))}
          </div>
        </div>

        {/* Plan card */}
        <div style={{ ...card(true),border:`1px solid ${C.vi}50`,boxShadow:`0 0 80px ${C.viGlo}`,borderRadius:20,overflow:"hidden",marginBottom:56 }}>
          {/* Price */}
          <div style={{ background:`linear-gradient(135deg,${C.bg3},${C.bg4})`,padding:mob?"32px 24px":"52px 64px",textAlign:"center",borderBottom:`1px solid ${C.b2}` }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.vi,letterSpacing:".1em",marginBottom:16 }}>PRO PLAN — EVERYTHING INCLUDED</div>
            <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"center",gap:6,marginBottom:6 }}>
              <span style={{ fontSize:mob?68:96,fontWeight:900,letterSpacing:"-.05em",color:C.t1,lineHeight:1 }}>${price}</span>
              <div style={{ paddingBottom:14,textAlign:"left" }}>
                <div style={{ fontSize:17,color:C.t3,fontWeight:400 }}>/month</div>
                {ann && <div style={{ fontSize:12,color:C.vi,fontWeight:600 }}>Save $108.89/yr</div>}
              </div>
            </div>
            {ann
              ? <div style={{ fontSize:14,color:C.t4,marginBottom:32 }}>Billed as $490.99/year</div>
              : <div style={{ fontSize:14,color:C.t4,marginBottom:32 }}>or $490.99/year — 2 months free</div>
            }
            {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 14px",color:C.err,fontSize:13,marginBottom:16,maxWidth:400,margin:"0 auto 16px" }}>{err}</div>}
            <button onClick={startCheckout} disabled={loading} style={{ ...btnP(C.vi,mob),fontSize:mob?15:17,padding:mob?"14px 28px":"16px 52px",boxShadow:`0 0 40px ${C.viGlo}`,maxWidth:400,opacity:loading?.7:1 }}>
              {loading ? "Redirecting to checkout…" : user?.plan==="pro" ? "Go to dashboard →" : "Start 14-day free trial"}
            </button>
            <div style={{ marginTop:14,fontSize:13,color:C.t4 }}>No credit card required · Cancel any time</div>
          </div>

          {/* Features */}
          <div style={{ padding:mob?"28px 20px":"44px 64px" }}>
            <div style={{ fontSize:12,fontWeight:700,color:C.t4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:28,textAlign:"center" }}>Everything included — no exceptions</div>
            <div style={{ display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?16:22 }}>
              {[
                { icon:"▦", title:"Unlimited Smart QR Codes",    desc:"Create as many dynamic QR codes as you need. No caps, ever." },
                { icon:"◆", title:"Unlimited Rewards Programs",  desc:"Points, stamps, cashback, referrals, tiers — all included." },
                { icon:"◈", title:"Full Analytics Dashboard",    desc:"Scan volume, device split, member growth and redemptions in real time." },
                { icon:"⚡", title:"Win-Back Automation",         desc:"Inactive customers automatically receive a custom offer. Runs 24/7." },
                { icon:"📱", title:"Mobile-First Dashboard",     desc:"Manage everything from your phone. Built for busy owners on the go." },
                { icon:"▦", title:"All 10 Smart Rule Types",     desc:"Device, time, weather, language, location, scan count, loyalty, event, inventory." },
                { icon:"↗", title:"CSV Data Export",             desc:"Download your full scan history and member data whenever you need it." },
                { icon:"🌐", title:"Custom Domain Support",      desc:"Point your own domain to your QR redirect engine." },
                { icon:"🎪", title:"Auto-Pilot Templates",       desc:"Restaurant, retail, event and salon templates. Launch in 60 seconds." },
                { icon:"✉️", title:"Priority Email Support",     desc:"Real humans, real answers within 24 hours." },
              ].map(f=>(
                <div key={f.title} style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
                  <div style={{ width:36,height:36,borderRadius:8,background:C.vi+"18",border:`1px solid ${C.vi}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600,color:C.t1,marginBottom:3 }}>{f.title}</div>
                    <div style={{ fontSize:12,color:C.t4,lineHeight:1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ borderTop:`1px solid ${C.b2}`,padding:mob?"24px 20px":"36px 64px",background:C.bg3,textAlign:"center" }}>
            <div style={{ fontSize:mob?18:22,fontWeight:800,color:C.t1,marginBottom:8,letterSpacing:"-.02em" }}>
              One customer brought back pays for the whole month.
            </div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:24,maxWidth:500,margin:"0 auto 24px",lineHeight:1.65 }}>
              The win-back rule generates more than $49.99 in recovered revenue for most businesses within their first 30 days.
            </div>
            <button onClick={startCheckout} disabled={loading} style={{ ...btnP(C.vi,mob),fontSize:15,padding:"13px 32px",maxWidth:340,opacity:loading?.7:1 }}>
              {loading ? "Redirecting…" : user?"Start free trial — no card needed":"Start free trial — no card needed"}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth:680,margin:"0 auto" }}>
          <h2 style={{ fontSize:mob?22:30,fontWeight:800,color:C.t1,letterSpacing:"-.03em",marginBottom:28,textAlign:"center" }}>Common questions</h2>
          {FAQ.map((f,i)=>(
            <div key={i} style={{ borderBottom:`1px solid ${C.b1}`,padding:"20px 0" }}>
              <div style={{ fontSize:mob?14:15,fontWeight:700,color:C.t1,marginBottom:8 }}>{f.q}</div>
              <div style={{ fontSize:mob?13:14,color:C.t4,lineHeight:1.72 }}>{f.a}</div>
            </div>
          ))}
          <div style={{ marginTop:36,padding:mob?"20px":"28px 32px",...card(),border:`1px solid ${C.b2}`,textAlign:"center" }}>
            <div style={{ fontSize:15,fontWeight:700,color:C.t1,marginBottom:6 }}>Still have questions?</div>
            <div style={{ fontSize:13,color:C.t4,marginBottom:16 }}>We're real people and we respond fast.</div>
            <a href="mailto:info@xhibitur.com" style={{ ...btnP(),fontSize:13,textDecoration:"none" }}>Email info@xhibitur.com</a>
          </div>
        </div>
      </div>

      <footer style={{ background:C.bg,borderTop:`1px solid ${C.b1}`,padding:`20px ${px}px`,marginTop:56 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:10 }}>
          <Wordmark sm/><span style={{ color:C.t4,fontSize:11 }}>© 2026 Xhibitur LLC. All rights reserved.</span>
        </div>
        <div style={{ display:"flex",gap:16,flexWrap:"wrap",borderTop:`1px solid ${C.b1}`,paddingTop:10 }}>
          <span onClick={()=>setLegalModal("privacy")} style={{ fontSize:11,color:C.t4,cursor:"pointer",textDecoration:"underline" }}>Privacy Policy</span>
          <span onClick={()=>setLegalModal("terms")} style={{ fontSize:11,color:C.t4,cursor:"pointer",textDecoration:"underline" }}>Terms of Use</span>
          <span style={{ fontSize:11,color:C.t4 }}>info@xhibitur.com</span>
          <span style={{ fontSize:11,color:C.t4 }}>Eligibility: 13+</span>
        </div>
        {legalModal && <LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
      </footer>
    </div>
  );
}

// ── Dashboard Home ────────────────────────────────────────────────────────────
const FEED = [
  { icon:"▦", text:'QR "Summer Menu" scanned 12×',      time:"2 min ago",  col:C.vi },
  { icon:"◆", text:"Reward redeemed — member #847",      time:"9 min ago",  col:C.fu },
  { icon:"◆", text:"New loyalty member joined",           time:"1 hr ago",   col:C.em },
  { icon:"▦", text:'QR "App Download" rule updated',      time:"2 hrs ago",  col:C.cy },
  { icon:"◆", text:"Win-back campaign sent (34 members)", time:"4 hrs ago",  col:C.am },
];

function DashHome() {
  const { user } = useAuth(); const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const hr = new Date().getHours();
  const greet = hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const isTrial = user?.plan==="trial";
  return (
    <DashShell>
      <PgHead title={`${greet}, ${user?.name?.split(" ")[0]||"there"} 👋`} sub="Your Xhibitur Rewards overview."/>

      {isTrial && (
        <div style={{ ...card(),padding:"16px 18px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",border:`1px solid ${C.vi}30`,background:C.viDim }}>
          <div>
            <div style={{ fontWeight:700,color:C.t1,fontSize:14,marginBottom:2 }}>🎉 You're on your free trial — all features unlocked</div>
            <div style={{ color:C.t4,fontSize:13 }}>$49.99/month after your 14-day trial. No surprises. Cancel any time.</div>
          </div>
          <button onClick={()=>nav("pricing")} style={{ ...btnP(),fontSize:13,padding:"9px 18px",width:mob?"100%":"auto" }}>Activate plan →</button>
        </div>
      )}

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
        <Stat icon="▦" label="QR Scans" value="1,284" delta="+24%" accent={C.vi}/>
        <Stat icon="◆" label="Redeemed" value="47" delta="+8%" accent={C.fu}/>
        <Stat icon="👥" label="Members" value="312" delta="+12%" accent={C.em}/>
        <Stat icon="◈" label="Growth" value="24%" delta="+5%" accent={C.cy}/>
      </div>

      <div style={{ ...card(),padding:mob?16:20,marginBottom:14 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.t2,marginBottom:14 }}>Quick actions</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[
            { icon:"▦",lbl:"New Smart QR",  desc:"Dynamic routing",  to:"dashboard/qr",        col:C.vi },
            { icon:"◆",lbl:"New Rewards",   desc:"Points & stamps",   to:"dashboard/rewards",   col:C.fu },
            { icon:"◈",lbl:"Analytics",     desc:"Scans & data",      to:"dashboard/analytics", col:C.em },
            { icon:"◉",lbl:"Account",       desc:"Plan & billing",    to:"dashboard/account",   col:C.am },
          ].map(a=>(
            <div key={a.to} onClick={()=>nav(a.to)} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:mob?12:14,background:C.bg3,border:`1px solid ${C.b1}`,borderRadius:10,cursor:"pointer",borderLeft:`2px solid ${a.col}`,minHeight:56,transition:"background .12s" }}
              onMouseEnter={e=>e.currentTarget.style.background=a.col+"10"}
              onMouseLeave={e=>e.currentTarget.style.background=C.bg3}>
              <span style={{ fontSize:18,color:a.col }}>{a.icon}</span>
              <div><div style={{ fontSize:mob?12:13,fontWeight:600,color:C.t1 }}>{a.lbl}</div><div style={{ fontSize:11,color:C.t4 }}>{a.desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card(),padding:mob?16:20 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.t2,marginBottom:14 }}>Live activity</div>
        {FEED.map((f,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<FEED.length-1?`1px solid ${C.b1}`:"none" }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:f.col+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:f.col,flexShrink:0 }}>{f.icon}</div>
            <div style={{ flex:1 }}><div style={{ fontSize:13,color:C.t2,fontWeight:500 }}>{f.text}</div><div style={{ fontSize:11,color:C.t4 }}>{f.time}</div></div>
          </div>
        ))}
      </div>
    </DashShell>
  );
}

// ── QR Page ───────────────────────────────────────────────────────────────────
const RT=[{id:"device",lb:"Device",icon:"📱",col:C.vi},{id:"time",lb:"Time",icon:"🕐",col:C.am},{id:"day",lb:"Day",icon:"📅",col:C.em},{id:"weather",lb:"Weather",icon:"🌤",col:C.cy},{id:"language",lb:"Language",icon:"🌐",col:C.fu},{id:"location",lb:"Location",icon:"📍",col:C.ro},{id:"scan_count",lb:"Scan Count",icon:"🔢",col:C.am},{id:"loyalty",lb:"Customer",icon:"⭐",col:C.vi},{id:"event",lb:"Event",icon:"🎪",col:C.cy},{id:"inventory",lb:"Inventory",icon:"📦",col:C.em}];
const RO={device:["iPhone / iOS","Android","Desktop / PC","Tablet"],day:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday","Weekdays","Weekends"],weather:["Sunny / Clear","Rainy","Snowing","Hot (85°F+)","Cold (50°F-)"],language:["English","Spanish","French","Mandarin","Arabic","Portuguese","German","Japanese"],location:["United States","United Kingdom","Canada","Europe (EU)","Latin America","Asia Pacific"],scan_count:["First scan ever","First 50 scans","First 100 scans","Every 10th scan","After 500 scans"],loyalty:["New visitor","Returning visitor","Loyalty member","VIP / Premium","Inactive (60+ days)"],event:["Before event","Day of event","During event","After event","Event cancelled"],inventory:["In stock","Low stock (< 10)","Out of stock","Back in stock","Discontinued"]};
const gid=()=>Math.random().toString(36).slice(2,9);
const mkR=(t="device")=>({id:gid(),type:t,cond:RO[t]?.[0]||"",tf:"09:00",tt:"17:00"});
const mkD=()=>({id:gid(),label:"",url:"",rules:[mkR()]});
const PILOTS={restaurant:[{label:"Lunch",url:"",rules:[{...mkR("time"),tf:"11:00",tt:"14:30"}]},{label:"Dinner",url:"",rules:[{...mkR("time"),tf:"17:00",tt:"22:00"}]},{label:"Brunch",url:"",rules:[{...mkR("day"),cond:"Weekends"}]}],app:[{label:"iOS",url:"",rules:[{...mkR("device"),cond:"iPhone / iOS"}]},{label:"Android",url:"",rules:[{...mkR("device"),cond:"Android"}]},{label:"Desktop",url:"",rules:[{...mkR("device"),cond:"Desktop / PC"}]}],event:[{label:"Tickets",url:"",rules:[{...mkR("event"),cond:"Before event"}]},{label:"Day-Of",url:"",rules:[{...mkR("event"),cond:"Day of event"}]},{label:"Live",url:"",rules:[{...mkR("event"),cond:"During event"}]},{label:"Recap",url:"",rules:[{...mkR("event"),cond:"After event"}]}]};

function QRModal({ init,onSave,onClose }) {
  const [name,setName]=useState(init?.name||""); const [wurl,setWurl]=useState(init?.workerUrl||"");
  const [dests,setDests]=useState(init?.destinations||[mkD()]); const [fb,setFb]=useState(init?.fallback||"");
  const [fg,setFg]=useState(init?.fg||C.t1); const [tab,setTab]=useState("build"); const [png,setPng]=useState(null);
  const w=useW(); const mob=w<640;
  const upd=(id,u)=>setDests(d=>d.map(x=>x.id===id?u:x));
  const rem=id=>setDests(d=>d.filter(x=>x.id!==id));
  const si={...inp,fontSize:14,padding:"11px 13px",background:C.bg3,border:`1px solid ${C.b2}`};
  const wc=`// Xhibitur Rewards — Cloudflare Worker\nconst C=${JSON.stringify({name,destinations:dests.map(d=>({label:d.label,destination:d.url,rules:d.rules.map(r=>({type:r.type,condition:r.type==="time"?`${r.tf}-${r.tt}`:r.cond}))})),fallback:fb},null,2)};\nexport default{async fetch(q){const ua=q.headers.get("User-Agent")||"";const now=new Date();const t=now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");const D=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];const day=D[now.getDay()];const iOS=/iPhone|iPad/.test(ua),droid=/Android/.test(ua);for(const d of C.destinations){if(d.rules.every(r=>{if(r.type==="device"){if(r.condition==="iPhone / iOS")return iOS;if(r.condition==="Android")return droid;if(r.condition==="Desktop / PC")return!iOS&&!droid;return true;}if(r.type==="time"){const[a,b]=r.condition.split("-");return t>=a&&t<=b;}if(r.type==="day"){if(r.condition==="Weekends")return["Saturday","Sunday"].includes(day);if(r.condition==="Weekdays")return!["Saturday","Sunday"].includes(day);return day===r.condition;}return true;})&&d.destination)return Response.redirect(d.destination,302);}return C.fallback?Response.redirect(C.fallback,302):new Response("No match",{status:200});}};`;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",padding:mob?0:20 }}>
      <div style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:mob?"20px 20px 0 0":18,width:"100%",maxWidth:mob?undefined:680,maxHeight:mob?"92vh":"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.8)",animation:mob?"sheetUp .3s ease":"fadeUp .2s ease" }}>
        <div style={{ padding:"16px 18px",background:C.bg3,borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,flexShrink:0 }}>
          <span style={{ color:C.t1,fontWeight:700,fontSize:15 }}>{init?"Edit Smart QR":"New Smart QR"}</span>
          <div style={{ display:"flex",gap:4 }}>
            {["build","preview","deploy"].map(t=><button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 12px",borderRadius:8,border:"none",background:tab===t?C.vi:"transparent",color:tab===t?"#fff":C.t4,fontSize:12,fontWeight:600,cursor:"pointer",minHeight:36 }}>{t==="build"?"✏ Build":t==="preview"?"👁 Preview":"↗ Deploy"}</button>)}
            <button onClick={onClose} style={{ background:C.bg4,border:`1px solid ${C.b3}`,color:C.t4,width:36,height:36,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:4 }}>×</button>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:mob?16:20,WebkitOverflowScrolling:"touch" }}>
          {tab==="build" && (
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div><label style={lbl}>Campaign name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Summer Menu" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
              <div><label style={lbl}>Worker URL</label><input value={wurl} onChange={e=>setWurl(e.target.value)} placeholder="https://my-qr.workers.dev" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
              <div>
                <label style={lbl}>Quick-start templates</label>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  {[{k:"restaurant",l:"🍕 Restaurant"},{k:"app",l:"📲 App"},{k:"event",l:"🎪 Event"}].map(p=><button key={p.k} onClick={()=>setDests((PILOTS[p.k]||[]).map(t=>({...mkD(),...t,id:gid()})))} style={{ ...btnG(),padding:"9px 14px",fontSize:13 }}>{p.l}</button>)}
                </div>
              </div>
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}><label style={{ ...lbl,margin:0 }}>Smart destinations</label><span style={{ fontSize:11,color:C.t4 }}>First match wins</span></div>
                {dests.map((d,i)=>(
                  <div key={d.id} style={{ border:`1px solid ${C.b2}`,borderRadius:12,overflow:"hidden",marginBottom:12 }}>
                    <div style={{ background:C.bg4,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.b1}` }}>
                      <div style={{ width:22,height:22,borderRadius:"50%",background:C.vi,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>{i+1}</div>
                      <input value={d.label} onChange={e=>upd(d.id,{...d,label:e.target.value})} placeholder={`Destination ${i+1}`} style={{ flex:1,border:"none",background:"transparent",fontSize:14,fontWeight:600,outline:"none",color:C.t1,minHeight:36 }}/>
                      {dests.length>1 && <button onClick={()=>rem(d.id)} style={{ background:"none",border:"none",color:C.t4,fontSize:22,cursor:"pointer",minWidth:36,minHeight:36,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>}
                    </div>
                    <div style={{ padding:14,background:C.bg2,display:"flex",flexDirection:"column",gap:10 }}>
                      <input value={d.url} onChange={e=>upd(d.id,{...d,url:e.target.value})} placeholder="https://destination-url.com" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                      {d.rules.map(r=>{
                        const rt=RT.find(x=>x.id===r.type);
                        return (
                          <div key={r.id} style={{ background:C.bg3,borderRadius:8,padding:"10px 12px",borderLeft:`2px solid ${rt?.col||C.vi}`,display:"flex",flexDirection:mob?"column":"row",gap:8,flexWrap:"wrap" }}>
                            <select value={r.type} onChange={e=>upd(d.id,{...d,rules:d.rules.map(x=>x.id===r.id?{...r,type:e.target.value,cond:RO[e.target.value]?.[0]||""}:x)})} style={{...si,width:mob?"100%":"auto",fontSize:13,padding:"9px 11px"}}>{RT.map(rt=><option key={rt.id} value={rt.id}>{rt.icon} {rt.lb}</option>)}</select>
                            {r.type==="time"
                              ?<div style={{ display:"flex",gap:8,flex:1,alignItems:"center",flexWrap:"wrap" }}>
                                  <input type="time" value={r.tf} onChange={e=>upd(d.id,{...d,rules:d.rules.map(x=>x.id===r.id?{...r,tf:e.target.value}:x)})} style={{...si,flex:1,fontSize:13,padding:"9px 11px"}}/>
                                  <span style={{color:C.t4,fontSize:13}}>→</span>
                                  <input type="time" value={r.tt} onChange={e=>upd(d.id,{...d,rules:d.rules.map(x=>x.id===r.id?{...r,tt:e.target.value}:x)})} style={{...si,flex:1,fontSize:13,padding:"9px 11px"}}/>
                                </div>
                              :<select value={r.cond} onChange={e=>upd(d.id,{...d,rules:d.rules.map(x=>x.id===r.id?{...r,cond:e.target.value}:x)})} style={{...si,flex:1,width:mob?"100%":"auto",fontSize:13,padding:"9px 11px"}}>{(RO[r.type]||[]).map(o=><option key={o}>{o}</option>)}</select>
                            }
                            <button onClick={()=>upd(d.id,{...d,rules:d.rules.filter(x=>x.id!==r.id)})} style={{background:"none",border:"none",color:C.t4,fontSize:20,cursor:"pointer",minWidth:36,minHeight:36,display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center"}}>×</button>
                          </div>
                        );
                      })}
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                        {RT.map(rt=><button key={rt.id} onClick={()=>upd(d.id,{...d,rules:[...d.rules,mkR(rt.id)]})} style={{ background:C.bg4,border:`1px solid ${C.b2}`,borderRadius:99,padding:"5px 11px",fontSize:11,cursor:"pointer",color:C.t4,minHeight:30 }}>+ {rt.icon} {rt.lb}</button>)}
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={()=>setDests([...dests,mkD()])} style={{ width:"100%",padding:"12px",border:`1px dashed ${C.b3}`,borderRadius:12,background:"transparent",cursor:"pointer",color:C.t4,fontSize:14,minHeight:48 }}>+ Add destination</button>
              </div>
              <div style={{ background:C.am+"0c",border:`1px solid ${C.am}22`,borderRadius:10,padding:14 }}>
                <label style={{ ...lbl,color:C.am }}>Fallback URL — when no rules match</label>
                <input value={fb} onChange={e=>setFb(e.target.value)} placeholder="https://yoursite.com" style={si} onFocus={e=>e.target.style.borderColor=C.am} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              <div>
                <label style={lbl}>QR foreground color</label>
                <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
                  {[C.t1,C.vi,C.em,C.ro,C.am,C.cy].map(c=><div key={c} onClick={()=>setFg(c)} style={{ width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${fg===c?C.bg2:"transparent"}`,outline:fg===c?`2px solid ${c}`:"none" }}/>)}
                  <input type="color" value={fg} onChange={e=>setFg(e.target.value)} style={{ width:30,height:30,border:"none",borderRadius:"50%",cursor:"pointer",padding:0 }}/>
                </div>
              </div>
            </div>
          )}
          {tab==="preview" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ background:C.bg3,borderRadius:16,padding:"28px 24px",marginBottom:16,border:`1px solid ${C.b2}` }}>
                <div style={{ color:C.t4,fontSize:10,fontWeight:600,letterSpacing:".1em",marginBottom:12 }}>{(name||"SMART QR CODE").toUpperCase()}</div>
                <div style={{ display:"inline-block",background:C.bg3,padding:14,borderRadius:14,border:`1px solid ${C.b2}`,boxShadow:`0 0 40px ${C.viGlo}` }}>
                  <QRBox value={wurl||"https://xhibitur.com"} fg={fg} bg={C.bg3} size={180} onUrl={setPng}/>
                </div>
                <div style={{ color:C.t4,fontSize:11,marginTop:12,wordBreak:"break-all" }}>{wurl||"Set Worker URL to encode"}</div>
                {png && <a href={png} download={`${name||"qr"}.png`} style={{ display:"inline-flex",alignItems:"center",gap:6,marginTop:14,...btnP(),textDecoration:"none",fontSize:13 }}>↓ Download QR PNG</a>}
              </div>
              {dests.map((d,i)=>(
                <div key={d.id} style={{ ...card(),padding:12,marginBottom:8,display:"flex",gap:10,textAlign:"left" }}>
                  <div style={{ width:20,height:20,borderRadius:"50%",background:C.vi,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0 }}>{i+1}</div>
                  <div>
                    <div style={{ fontWeight:600,fontSize:13,color:C.t1,marginBottom:5 }}>{d.label||`Destination ${i+1}`}</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginBottom:4 }}>{d.rules.map(r=>{const rt=RT.find(x=>x.id===r.type);return <Tag key={r.id} color={rt?.col||C.vi}>{rt?.icon} {r.type==="time"?`${r.tf}-${r.tt}`:r.cond}</Tag>;})}</div>
                    <div style={{ fontSize:11,color:C.t4,wordBreak:"break-all" }}>{d.url||"(no URL)"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==="deploy" && (
            <div>
              <div style={{ background:C.em+"0c",border:`1px solid ${C.em}22`,borderRadius:10,padding:"14px 16px",marginBottom:14,fontSize:13,color:C.em,lineHeight:1.75 }}>
                <strong>4 steps to go live:</strong><br/>1. Copy code below<br/>2. workers.cloudflare.com → New Worker → paste → Deploy<br/>3. Copy your .workers.dev URL → paste in Build tab<br/>4. Preview → Download QR PNG
              </div>
              <div style={{ background:C.bg,border:`1px solid ${C.b1}`,borderRadius:12,overflow:"hidden" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`1px solid ${C.b1}` }}>
                  <span style={{ color:C.t4,fontSize:11,fontFamily:"DM Mono,monospace" }}>worker.js</span>
                  <button onClick={()=>navigator.clipboard.writeText(wc)} style={{ ...btnG(),padding:"6px 13px",fontSize:12,minHeight:34 }}>Copy</button>
                </div>
                <pre style={{ margin:0,padding:14,color:"#86efac",fontSize:10,lineHeight:1.7,overflowX:"auto",maxHeight:220,overflowY:"auto",fontFamily:"DM Mono,monospace",whiteSpace:"pre-wrap",wordBreak:"break-all" }}>{wc}</pre>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:"14px 18px",borderTop:`1px solid ${C.b1}`,display:"flex",gap:10,background:C.bg3,flexShrink:0 }}>
          <button onClick={onClose} style={{ ...btnG(mob),flex:mob?1:0,padding:"10px 18px",fontSize:14 }}>Cancel</button>
          <button onClick={()=>onSave({id:init?.id||gid(),name,workerUrl:wurl,destinations:dests,fallback:fb,fg})} style={{ ...btnP(C.vi,mob),flex:mob?1:0,padding:"10px 20px",fontSize:14 }}>{init?"Save changes":"Create QR code"}</button>
        </div>
      </div>
    </div>
  );
}

function QRPage() {
  const { nav } = useNav(); const w=useW(); const mob=w<640;
  const [codes,setCodes]=useState([
    { id:"1",name:"Summer Menu 2026",workerUrl:"https://summer-menu.workers.dev",destinations:[{id:"a",label:"Lunch",url:"https://example.com/lunch",rules:[{id:"r1",type:"time",tf:"11:00",tt:"14:30",cond:""}]}],fallback:"https://example.com",fg:C.vi },
    { id:"2",name:"App Download QR",workerUrl:"https://app-dl.workers.dev",destinations:[{id:"b",label:"iOS",url:"https://apps.apple.com",rules:[{id:"r2",type:"device",cond:"iPhone / iOS",tf:"09:00",tt:"17:00"}]}],fallback:"https://example.com",fg:C.t1 },
  ]);
  const [modal,setModal]=useState(false); const [ed,setEd]=useState(null);
  const save=qr=>{ if(ed)setCodes(codes.map(x=>x.id===qr.id?qr:x));else setCodes([...codes,qr]); setModal(false);setEd(null); };
  return (
    <DashShell>
      <PgHead title="Smart QR Codes" sub="Route every scan to the right destination."
        action={<button onClick={()=>setModal(true)} style={{ ...btnP(),fontSize:13,padding:"10px 18px" }}>+ New QR</button>}/>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {codes.length===0
          ?<Empty icon="▦" title="No Smart QR codes yet" body="Create your first dynamic QR code." cta={<button onClick={()=>setModal(true)} style={{ ...btnP(),padding:"12px 24px" }}>Create first QR</button>}/>
          :codes.map(qr=>{
            const [du,setDu]=useState(null);
            return (
              <div key={qr.id} style={{ ...card(),padding:mob?14:18 }}>
                <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                  <div style={{ background:C.bg3,borderRadius:8,padding:6,flexShrink:0,border:`1px solid ${C.b2}` }}>
                    <QRBox value={qr.workerUrl||"https://xhibitur.com"} fg={qr.fg||C.t1} bg={C.bg3} size={mob?64:76} onUrl={setDu}/>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700,fontSize:mob?14:15,color:C.t1 }}>{qr.name}</span>
                      <Tag color={C.ok} dot>Active</Tag>
                    </div>
                    <div style={{ fontSize:11,color:C.t4,marginBottom:7,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{qr.workerUrl||"Worker URL not set"}</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>{qr.destinations?.flatMap(d=>d.rules).slice(0,3).map((r,i)=>{const rt=RT.find(x=>x.id===r.type);return <Tag key={i} color={rt?.col||C.vi}>{rt?.icon} {r.type==="time"?`${r.tf}-${r.tt}`:r.cond}</Tag>;})}</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${C.b1}` }}>
                  {du && <a href={du} download={`${qr.name||"qr"}.png`} style={{ ...btnP(),flex:mob?1:0,padding:"9px 14px",fontSize:13,textDecoration:"none" }}>↓ PNG</a>}
                  <button onClick={()=>{setEd(qr);setModal(true);}} style={{ ...btnG(),flex:mob?1:0,padding:"9px 14px",fontSize:13 }}>Edit</button>
                  <button onClick={()=>setCodes(codes.filter(x=>x.id!==qr.id))} style={{ padding:"9px 14px",fontSize:13,background:"none",border:`1px solid ${C.err}28`,color:C.err,borderRadius:10,cursor:"pointer",flex:mob?1:0,minHeight:44 }}>Delete</button>
                </div>
              </div>
            );
          })
        }
      </div>
      {modal && <QRModal init={ed} onSave={save} onClose={()=>{setModal(false);setEd(null);}}/>}
    </DashShell>
  );
}

// ── Rewards Page ──────────────────────────────────────────────────────────────
const RWD=[{id:"points",icon:"🪙",lb:"Points",desc:"Earn points per purchase."},{id:"stamps",icon:"🎯",lb:"Stamp Card",desc:"Buy X get one free."},{id:"tiers",icon:"👑",lb:"Tiers",desc:"Bronze, Silver, Gold."},{id:"referral",icon:"🤝",lb:"Referral",desc:"Earn for referring."},{id:"cashback",icon:"💵",lb:"Cashback",desc:"Earn % spend back."}];
const RPAL=[C.am,C.vi,C.cy,C.em,C.fu];
const DEMO_P=[{id:"1",name:"Coffee Loyalty",type:"stamps",active:true,members:312,redemptions:47,scans:1284,cfg:{stampsRequired:10,reward:"Free coffee"},col:C.am},{id:"2",name:"VIP Points Club",type:"points",active:true,members:89,redemptions:12,scans:445,cfg:{pointsPerDollar:10,redeemRate:"100 pts = $1 off"},col:C.vi}];

function RwdModal({ init,onSave,onClose }) {
  const [name,setName]=useState(init?.name||""); const [type,setType]=useState(init?.type||"stamps");
  const [sr,setSr]=useState(init?.cfg?.stampsRequired||10); const [rw,setRw]=useState(init?.cfg?.reward||"Free item");
  const [ppd,setPpd]=useState(init?.cfg?.pointsPerDollar||10); const [rr,setRr]=useState(init?.cfg?.redeemRate||"100 pts = $1 off");
  const [wbd,setWbd]=useState(60); const [wbo,setWbo]=useState("We miss you — 20% off your next visit");
  const w=useW(); const mob=w<640;
  const si={...inp,fontSize:14,padding:"11px 13px",background:C.bg3,border:`1px solid ${C.b2}`};
  const save=()=>{const cfg=type==="stamps"?{stampsRequired:sr,reward:rw}:type==="points"?{pointsPerDollar:ppd,redeemRate:rr}:{};onSave({id:init?.id||gid(),name,type,active:true,members:init?.members||0,redemptions:init?.redemptions||0,scans:init?.scans||0,cfg:{...cfg,winbackDays:wbd,winbackOffer:wbo},col:RPAL[RWD.findIndex(x=>x.id===type)%5]||C.vi});};
  return (
    <div style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",padding:mob?0:20 }}>
      <div style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:mob?"20px 20px 0 0":18,width:"100%",maxWidth:mob?undefined:540,maxHeight:mob?"92vh":"88vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.8)",animation:mob?"sheetUp .3s ease":"fadeUp .2s ease" }}>
        <div style={{ padding:"16px 18px",background:C.bg3,borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <span style={{ color:C.t1,fontWeight:700,fontSize:15 }}>{init?"Edit Program":"New Rewards Program"}</span>
          <button onClick={onClose} style={{ background:C.bg4,border:`1px solid ${C.b3}`,color:C.t4,width:36,height:36,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:mob?16:20,display:"flex",flexDirection:"column",gap:16,WebkitOverflowScrolling:"touch" }}>
          <div><label style={lbl}>Program name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Coffee Loyalty Club" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
          <div>
            <label style={lbl}>Reward type</label>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {RWD.map(rt=><button key={rt.id} onClick={()=>setType(rt.id)} style={{ padding:"12px",borderRadius:10,cursor:"pointer",border:`1px solid ${type===rt.id?C.vi:C.b2}`,background:type===rt.id?C.viDim:C.bg3,textAlign:"left",transition:"all .12s",minHeight:76 }}>
                <div style={{ fontSize:20,marginBottom:5 }}>{rt.icon}</div>
                <div style={{ fontSize:13,fontWeight:600,color:C.t1 }}>{rt.lb}</div>
                <div style={{ fontSize:11,color:C.t4,marginTop:2 }}>{rt.desc}</div>
              </button>)}
            </div>
          </div>
          {type==="stamps" && <div style={{ background:C.bg3,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:12 }}><div><label style={lbl}>Stamps required</label><input type="number" value={sr} onChange={e=>setSr(+e.target.value)} min={2} max={50} style={si}/></div><div><label style={lbl}>Reward earned</label><input value={rw} onChange={e=>setRw(e.target.value)} placeholder="Free coffee" style={si}/></div></div>}
          {type==="points" && <div style={{ background:C.bg3,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:12 }}><div><label style={lbl}>Points per $1 spent</label><input type="number" value={ppd} onChange={e=>setPpd(+e.target.value)} min={1} style={si}/></div><div><label style={lbl}>Redemption rate</label><input value={rr} onChange={e=>setRr(e.target.value)} placeholder="100 pts = $1 off" style={si}/></div></div>}
          <div style={{ background:C.am+"0c",border:`1px solid ${C.am}22`,borderRadius:10,padding:14 }}>
            <label style={{ ...lbl,color:C.am }}>⚡ Auto win-back rule</label>
            <div style={{ display:"flex",gap:10,marginBottom:10,alignItems:"center",flexWrap:"wrap" }}>
              <span style={{ fontSize:13,color:C.t4 }}>If inactive for</span>
              <input type="number" value={wbd} onChange={e=>setWbd(+e.target.value)} min={7} style={{...si,width:70}}/>
              <span style={{ fontSize:13,color:C.t4 }}>days, show:</span>
            </div>
            <input value={wbo} onChange={e=>setWbo(e.target.value)} placeholder="We miss you — 20% off" style={si} onFocus={e=>e.target.style.borderColor=C.am} onBlur={e=>e.target.style.borderColor=C.b2}/>
          </div>
        </div>
        <div style={{ padding:"14px 18px",borderTop:`1px solid ${C.b1}`,display:"flex",gap:10,background:C.bg3,flexShrink:0 }}>
          <button onClick={onClose} style={{ ...btnG(mob),flex:mob?1:0,fontSize:14,padding:"10px 18px" }}>Cancel</button>
          <button onClick={save} style={{ ...btnP(C.vi,mob),flex:mob?1:0,fontSize:14,padding:"10px 18px" }}>{init?"Save changes":"Create program"}</button>
        </div>
      </div>
    </div>
  );
}

function RewardsPage() {
  const { nav } = useNav(); const w=useW(); const mob=w<640;
  const [progs,setProgs]=useState(DEMO_P); const [modal,setModal]=useState(false); const [ed,setEd]=useState(null);
  const save=p=>{ if(ed)setProgs(progs.map(x=>x.id===p.id?p:x));else setProgs([...progs,p]); setModal(false);setEd(null); };
  return (
    <DashShell>
      <PgHead title="Rewards Programs" sub="Build loyalty and bring customers back."
        action={<button onClick={()=>setModal(true)} style={{ ...btnP(),fontSize:13,padding:"10px 18px" }}>+ New Program</button>}/>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {progs.length===0
          ?<Empty icon="◆" title="No rewards programs yet" body="Create your first loyalty program." cta={<button onClick={()=>setModal(true)} style={{ ...btnP(),padding:"12px 24px" }}>Create first program</button>}/>
          :progs.map(p=>{
            const rt=RWD.find(x=>x.id===p.type);
            return (
              <div key={p.id} style={{ ...card(),padding:mob?14:18 }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:14 }}>
                  <div style={{ width:44,height:44,borderRadius:10,background:p.col+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,border:`1px solid ${p.col}22` }}>{rt?.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700,fontSize:15,color:C.t1 }}>{p.name}</span>
                      <Tag color={p.active?C.ok:C.t4} dot>{p.active?"Active":"Paused"}</Tag>
                      <Tag color={p.col}>{rt?.lb}</Tag>
                    </div>
                    <div style={{ fontSize:13,color:C.t4 }}>{p.type==="stamps"&&`${p.cfg.stampsRequired} stamps → ${p.cfg.reward}`}{p.type==="points"&&`${p.cfg.pointsPerDollar} pts/$1 · ${p.cfg.redeemRate}`}</div>
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,padding:14,background:C.bg3,borderRadius:10,border:`1px solid ${C.b1}`,marginBottom:12 }}>
                  {[{l:"Members",v:p.members,i:"👥"},{l:"Redemptions",v:p.redemptions,i:"🎁"},{l:"Scans",v:p.scans,i:"◈"}].map(s=>(
                    <div key={s.l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:16,marginBottom:2 }}>{s.i}</div>
                      <div style={{ fontWeight:800,fontSize:18,color:C.t1,letterSpacing:"-.04em" }}>{s.v.toLocaleString()}</div>
                      <div style={{ fontSize:11,color:C.t4 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>{setEd(p);setModal(true);}} style={{ ...btnG(true),flex:1,fontSize:13,padding:"9px" }}>Edit</button>
                  <button onClick={()=>setProgs(progs.filter(x=>x.id!==p.id))} style={{ flex:1,padding:"9px",fontSize:13,background:"none",border:`1px solid ${C.err}28`,color:C.err,borderRadius:10,cursor:"pointer",minHeight:44 }}>Delete</button>
                </div>
              </div>
            );
          })
        }
      </div>
      {modal && <RwdModal init={ed} onSave={save} onClose={()=>{setModal(false);setEd(null);}}/>}
    </DashShell>
  );
}

// ── Analytics Page ────────────────────────────────────────────────────────────
const HIST=[284,310,291,405,380,420,512,488,390,445,510,1284];
const MOS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function AnalyticsPage() {
  const w=useW(); const mob=w<640;
  const mx=Math.max(...HIST);
  return (
    <DashShell>
      <PgHead title="Analytics" sub="Scans, redemptions and member growth."/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
        <Stat icon="◈" label="Total Scans" value="2,041" delta="+18%" accent={C.vi}/>
        <Stat icon="📅" label="This Month" value="1,284" delta="+24%" accent={C.em}/>
        <Stat icon="◆" label="Redeemed" value="47" delta="+8%" accent={C.fu}/>
        <Stat icon="👥" label="Members" value="312" delta="+12%" accent={C.cy}/>
      </div>
      <div style={{ ...card(),padding:mob?14:20,marginBottom:14 }}>
        <div style={{ fontWeight:700,fontSize:13,color:C.t2,marginBottom:16 }}>Scan volume — last 12 months</div>
        <div style={{ display:"flex",alignItems:"flex-end",gap:3,height:72 }}>
          {HIST.map((v,i)=>(
            <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
              <div style={{ flex:1,width:"100%",background:C.vi+"14",borderRadius:"3px 3px 0 0",display:"flex",alignItems:"flex-end" }}>
                <div style={{ width:"100%",height:`${(v/mx)*100}%`,background:C.vi,borderRadius:"3px 3px 0 0",minHeight:3 }}/>
              </div>
              <span style={{ fontSize:7,color:C.t4 }}>{MOS[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12,marginBottom:14 }}>
        <div style={{ ...card(),padding:mob?14:18 }}>
          <div style={{ fontWeight:700,fontSize:13,color:C.t2,marginBottom:14 }}>Top QR codes</div>
          {[{n:"Summer Menu 2026",s:1284,c:C.vi},{n:"App Download QR",s:445,c:C.em},{n:"Event Oct Summit",s:312,c:C.am}].map((q,i)=>(
            <div key={q.n} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<2?`1px solid ${C.b1}`:"none" }}>
              <div style={{ width:24,height:24,borderRadius:"50%",background:q.c+"16",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:q.c,flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600,color:C.t2 }}>{q.n}</div><div style={{ fontSize:11,color:C.t4 }}>{q.s.toLocaleString()} scans</div></div>
            </div>
          ))}
        </div>
        <div style={{ ...card(),padding:mob?14:18 }}>
          <div style={{ fontWeight:700,fontSize:13,color:C.t2,marginBottom:14 }}>Device split</div>
          {[{l:"iPhone / iOS",p:58,c:C.vi},{l:"Android",p:31,c:C.em},{l:"Desktop",p:11,c:C.t4}].map(d=>(
            <div key={d.l} style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}><span style={{ fontSize:13,color:C.t3 }}>{d.l}</span><span style={{ fontSize:13,fontWeight:700,color:d.c }}>{d.p}%</span></div>
              <div style={{ height:5,background:C.bg4,borderRadius:99,overflow:"hidden" }}><div style={{ height:"100%",width:`${d.p}%`,background:d.c,borderRadius:99 }}/></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...card(),padding:mob?14:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
        <div><div style={{ fontWeight:600,fontSize:14,color:C.t1,marginBottom:3 }}>Export analytics data</div><div style={{ fontSize:13,color:C.t4 }}>Full scan history and redemption logs as CSV.</div></div>
        <button style={{ ...btnP(),padding:"10px 18px",fontSize:14,width:mob?"100%":undefined }}>Download CSV</button>
      </div>
    </DashShell>
  );
}

// ── Account Page ──────────────────────────────────────────────────────────────
function AccountPage() {
  const { user,signOut } = useAuth(); const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const [nm,setNm]=useState(user?.name||""); const [ok,setOk]=useState(false);
  const isTrial = user?.plan==="trial";
  const si={...inp,fontSize:15,padding:"12px 14px",background:C.bg3,border:`1px solid ${C.b2}`};
  return (
    <DashShell>
      <PgHead title="Account Settings" sub="Profile, plan and billing."/>
      <div style={{ display:"grid",gap:14,maxWidth:mob?undefined:640 }}>
        <div style={{ ...card(),padding:mob?16:22 }}>
          <div style={{ fontWeight:700,fontSize:14,color:C.t2,marginBottom:18 }}>Profile</div>
          <div style={{ marginBottom:14 }}><label style={lbl}>Business name</label><input value={nm} onChange={e=>setNm(e.target.value)} style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
          <div style={{ marginBottom:20 }}><label style={lbl}>Email</label><input value={user?.email} disabled style={{...si,background:C.bg4,color:C.t4,cursor:"not-allowed"}}/></div>
          <button onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000);}} style={{ ...btnP(C.vi,mob),fontSize:15,padding:"12px 22px" }}>{ok?"✓ Saved!":"Save changes"}</button>
        </div>

        <div style={{ ...card(),padding:mob?16:22 }}>
          <div style={{ fontWeight:700,fontSize:14,color:C.t2,marginBottom:14 }}>Plan & billing</div>
          <div style={{ padding:16,background:C.bg3,borderRadius:10,border:`1px solid ${C.b2}`,marginBottom:14 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ fontWeight:700,fontSize:15,color:C.t1 }}>Pro Plan</span>
                <Tag color={C.vi}>{isTrial?"Free Trial":"$49.99/mo"}</Tag>
              </div>
              {isTrial && <button onClick={()=>nav("pricing")} style={{ ...btnP(),padding:"8px 16px",fontSize:13 }}>Activate plan — $49.99/mo</button>}
            </div>
            <div style={{ fontSize:12,color:C.t4,lineHeight:1.6 }}>
              {isTrial
                ?"All features unlocked during your 14-day trial. $49.99/month after — no credit card needed yet."
                :"All features included. Unlimited QRs, unlimited rewards, unlimited scans."
              }
            </div>
          </div>
        </div>

        <div style={{ ...card(),padding:mob?16:22,border:`1px solid ${C.err}1e` }}>
          <div style={{ fontWeight:700,fontSize:14,color:C.err,marginBottom:10 }}>Danger zone</div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
            <div><div style={{ fontWeight:500,fontSize:14,color:C.t2,marginBottom:2 }}>Sign out everywhere</div><div style={{ fontSize:13,color:C.t4 }}>You'll need to log in again on all devices.</div></div>
            <button onClick={()=>{signOut();nav("home");}} style={{ padding:"10px 18px",fontSize:14,background:"none",border:`1px solid ${C.err}30`,color:C.err,borderRadius:10,cursor:"pointer",minHeight:44,width:mob?"100%":undefined }}>Sign out</button>
          </div>
        </div>
      </div>
    </DashShell>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const PROTECTED = ["dashboard","dashboard/qr","dashboard/rewards","dashboard/analytics","dashboard/account"];

function AppCore() {
  const { user,loading } = useAuth(); const { page,nav } = useNav();
  useEffect(() => {
    if (loading) return;
    if (!user && PROTECTED.includes(page)) nav("login");
    if (user && (page==="login"||page==="signup")) nav("dashboard");
  },[user,loading,page]);

  if (loading) return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:28,color:C.vi,marginBottom:10,display:"inline-block",animation:"spin 1.1s linear infinite" }}>◆</div>
        <div style={{ fontSize:13,color:C.t4 }}>Loading…</div>
      </div>
    </div>
  );

  const views = {
    home:<Landing/>, login:<Login/>, signup:<Signup/>, pricing:<PricingPage/>,
    dashboard:<DashHome/>, "dashboard/qr":<QRPage/>, "dashboard/rewards":<RewardsPage/>,
    "dashboard/analytics":<AnalyticsPage/>, "dashboard/account":<AccountPage/>,
  };
  return views[page] || <Landing/>;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppCore/>
      </AuthProvider>
    </RouterProvider>
  );
}
