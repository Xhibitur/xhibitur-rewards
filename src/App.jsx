import React, { useState, useEffect, useRef, createContext, useContext } from "react";

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
    html,body{-webkit-text-size-adjust:100%;scroll-behavior:smooth;width:100%;overflow-x:hidden}
    body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;background:#000;color:#fff;min-height:100vh;margin:0;padding:0}
    #root{width:100%;min-height:100vh;background:#000}
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

function PwInput({ value, onChange, placeholder="••••••••", style={} }) {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position:"relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...style, paddingRight:52 }}
        onFocus={e=>e.target.style.borderColor=C.vi}
        onBlur={e=>e.target.style.borderColor=C.b2}
      />
      <button type="button" onClick={()=>setShow(s=>!s)}
        style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.t4,cursor:"pointer",fontSize:12,fontWeight:600,padding:"4px",userSelect:"none",minHeight:0 }}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
// ── Auth ──────────────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const DEMOS = {
  "demo@xhibitur.com":  { pw:"demo1234",  name:"Demo Business", plan:"pro"   },
  "trial@xhibitur.com": { pw:"trial1234", name:"Trial Account",  plan:"trial" },
};

async function callAuth(body) {
  const res = await fetch("/.netlify/functions/auth", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function AuthProvider({ children }) {
  const [user, setU] = useState(null);
  const [loading, setL] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem("xr_u");
      if (s) setU(JSON.parse(s));
    } catch{}
    setL(false);
  },[]);

  const save = u => { setU(u); localStorage.setItem("xr_u", JSON.stringify(u)); };

  const signIn = async (em, pw) => {
    // Demo accounts — bypass Supabase
    const demo = DEMOS[em.toLowerCase()];
    if (demo && demo.pw === pw) {
      let plan = demo.plan;
      try {
        const r = await fetch("/.netlify/functions/check-plan", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ email: em.toLowerCase() }),
        });
        const d = await r.json();
        if (d.plan) plan = d.plan;
      } catch{}
      save({ id:"demo_"+btoa(em).slice(0,8), email:em.toLowerCase(), name:demo.name, plan, isDemo:true });
      return;
    }

    // Real users — Supabase Auth
    const data = await callAuth({ action:"signin", email:em, password:pw });
    if (data.error) throw new Error(data.error);
    if (data.token) localStorage.setItem("xr_token", data.token);
    if (data.refreshToken) localStorage.setItem("xr_refresh", data.refreshToken);
    save({ id:data.user.id, email:data.user.email, name:data.user.name, plan:data.user.plan });
  };

  const signUp = async (em, pw, nm) => {
    if (!em||!pw||!nm) throw new Error("All fields required");
    if (pw.length<8) throw new Error("Password must be at least 8 characters");

    const data = await callAuth({ action:"signup", email:em, password:pw, name:nm });
    if (data.error) throw new Error(data.error);
    if (data.token) localStorage.setItem("xr_token", data.token);
    if (data.refreshToken) localStorage.setItem("xr_refresh", data.refreshToken);
    save({ id:data.user.id, email:data.user.email, name:data.user.name, plan:"trial", trialStart:new Date().toISOString() });
  };

  const signOut = () => {
    setU(null);
    localStorage.removeItem("xr_u");
    localStorage.removeItem("xr_token");
    localStorage.removeItem("xr_refresh");
  };

  const setPlan = p => save({ ...user, plan:p });
  const updateName = async nm => {
    if (user && !user.isDemo) {
      await callAuth({ action:"update-name", email:user.email, name:nm });
    }
    save({ ...user, name:nm });
  };

  return <AuthCtx.Provider value={{ user,loading,signIn,signUp,signOut,setPlan,updateName }}>{children}</AuthCtx.Provider>;
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
  { id:"dashboard/stickers",  icon:"🏷", label:"Stickers"  },
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
      <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <div><label style={lbl}>Email</label><input type="email" value={em} onChange={e=>setEm(e.target.value)} placeholder="you@business.com" style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
        <div><label style={lbl}>Password</label><PwInput value={pw} onChange={e=>setPw(e.target.value)} style={dInp}/></div>
        {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ ...btnP(C.vi,true),fontSize:15,padding:"13px",opacity:busy?.7:1 }}>{busy?"Signing in…":"Sign in →"}</button>
      </form>
      <p style={{ textAlign:"center",marginTop:18,fontSize:14,color:C.t4 }}>No account? <span onClick={()=>nav("signup")} style={{ color:C.vi,fontWeight:600,cursor:"pointer" }}>Start free trial</span></p>
      <p style={{ textAlign:"center",marginTop:8,fontSize:13,color:C.t4 }}><span onClick={()=>nav("forgot-password")} style={{ color:C.t4,cursor:"pointer",textDecoration:"underline" }}>Forgot password?</span></p>
    </AuthShell>
  );
}

function ForgotPassword() {
  const { nav } = useNav();
  const [em,setEm]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false); const [sent,setSent]=useState(false);
  const go = async e => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/auth", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"forgot-password", email:em }) });
      const data = await res.json();
      if (data.error) setErr(data.error); else setSent(true);
    } catch { setErr("Something went wrong. Please try again."); }
    setBusy(false);
  };
  return (
    <AuthShell title="Reset your password" sub="Enter your email and we'll send a reset link.">
      {sent
        ? <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:16 }}>📧</div>
            <div style={{ fontSize:16,fontWeight:700,color:C.t1,marginBottom:8 }}>Check your inbox</div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:20,lineHeight:1.6 }}>We sent a password reset link to <strong style={{ color:C.t2 }}>{em}</strong>. Check your inbox and click the link.</div>
            <button onClick={()=>nav("login")} style={{ ...btnP(C.vi,true),fontSize:14,padding:"12px" }}>Back to sign in</button>
          </div>
        : <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div><label style={lbl}>Email</label><input type="email" value={em} onChange={e=>setEm(e.target.value)} placeholder="you@business.com" style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
            {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ ...btnP(C.vi,true),fontSize:15,padding:"13px",opacity:busy?.7:1 }}>{busy?"Sending…":"Send reset link →"}</button>
            <button type="button" onClick={()=>nav("login")} style={{ ...btnG(true),fontSize:14,padding:"12px" }}>Back to sign in</button>
          </form>
      }
    </AuthShell>
  );
}

function ResetPassword() {
  const { nav } = useNav();
  const [pw,setPw]=useState(""); const [pw2,setPw2]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false); const [done,setDone]=useState(false);
  // Get token from URL hash — Supabase puts it after #access_token=
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?reset-password\??/,"").replace(/^#/,""));
const token = hashParams.get("access_token") || new URLSearchParams(window.location.search).get("access_token") || "";
  const go = async e => {
    e.preventDefault(); setErr("");
    if (pw !== pw2) { setErr("Passwords don't match."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/auth", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"reset-password", token, newPassword:pw }) });
      const data = await res.json();
      if (data.error) setErr(data.error); else setDone(true);
    } catch { setErr("Something went wrong. Please try again."); }
    setBusy(false);
  };
  return (
    <AuthShell title="Set new password" sub="Choose a strong password for your account.">
      {done
        ? <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:16 }}>✅</div>
            <div style={{ fontSize:16,fontWeight:700,color:C.t1,marginBottom:8 }}>Password updated!</div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:20 }}>Your password has been changed. Sign in with your new password.</div>
            <button onClick={()=>nav("login")} style={{ ...btnP(C.vi,true),fontSize:14,padding:"12px" }}>Sign in →</button>
          </div>
        : <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
<div><label style={lbl}>New password</label><PwInput value={pw} onChange={e=>setPw(e.target.value)} placeholder="8+ characters" style={dInp}/></div>
           <div><label style={lbl}>Confirm password</label><PwInput value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Same password again" style={dInp}/></div>
            {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ ...btnP(C.vi,true),fontSize:15,padding:"13px",opacity:busy?.7:1 }}>{busy?"Updating…":"Set new password →"}</button>
          </form>
      }
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

  const row = { display:"flex",alignItems:"flex-start",gap:12,padding:"14px",background:C.bg4,border:`1px solid ${C.b2}`,borderRadius:10 };

  const CustomCheckbox = ({ id, checked, onChange }) => (
    <div
      onClick={()=>onChange({ target:{ checked:!checked } })}
      style={{
        width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? C.vi : C.b3}`,
        background: checked ? C.vi : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", transition:"all .15s",
      }}
    >
      {checked && <span style={{ color:"#000", fontSize:13, fontWeight:900, lineHeight:1 }}>✓</span>}
    </div>
  );

  return (
    <AuthShell title="Start your free trial" sub="14 days free. No credit card. $49.99/month after.">
      <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
     {[{ lb:"Business name",val:nm,set:setNm,type:"text",ph:"Acme Coffee Co." },{ lb:"Email",val:em,set:setEm,type:"email",ph:"you@business.com" },{ lb:"Password",val:pw,set:setPw,type:"password",ph:"8+ characters" }].map(f=>(
          <div key={f.lb}><label style={lbl}>{f.lb}</label>{f.type==="password"
  ? <PwInput value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={dInp}/>
  : <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
}</div>
        ))}
        <div style={row}>
          <CustomCheckbox id="age" checked={ageOk} onChange={e=>setAgeOk(e.target.checked)}/>
          <label htmlFor="age" onClick={()=>setAgeOk(!ageOk)} style={{ fontSize:13,color:C.t3,lineHeight:1.55,cursor:"pointer",flex:1 }}>
            I confirm I am <strong style={{ color:C.t2 }}>13 years of age or older</strong>. Xhibitur Rewards is not intended for persons under 13.
          </label>
        </div>
        <div style={row}>
          <CustomCheckbox id="terms" checked={termsOk} onChange={e=>setTermsOk(e.target.checked)}/>
          <label htmlFor="terms" style={{ fontSize:13,color:C.t3,lineHeight:1.55,flex:1 }}>
            <span onClick={()=>setTermsOk(!termsOk)} style={{ cursor:"pointer" }}>I agree to Xhibitur LLC's </span>
            <span onClick={e=>{e.preventDefault();setLegal("terms");}} style={{ color:C.vi,fontWeight:600,cursor:"pointer",textDecoration:"underline" }}>Terms of Use</span>
            <span onClick={()=>setTermsOk(!termsOk)} style={{ cursor:"pointer" }}> and </span>
            <span onClick={e=>{e.preventDefault();setLegal("privacy");}} style={{ color:C.vi,fontWeight:600,cursor:"pointer",textDecoration:"underline" }}>Privacy Policy</span>
            <span onClick={()=>setTermsOk(!termsOk)} style={{ cursor:"pointer" }}>, and consent to receive promotional SMS and email from Xhibitur LLC. Msg & data rates may apply. Reply STOP to opt out.</span>
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
  { icon:"🖨",  title:"Instant Print-Ready Sign",  desc:"Download a professional loyalty sign in seconds. Print at any printer and display at your counter today — no design skills needed.", col:C.bl },
];
const ALL_FEATURES = [
  "Unlimited Smart QR codes","Unlimited Rewards programs","Unlimited monthly scans",
  "Full analytics dashboard","Win-back automation","Mobile-first dashboard",
  "All 10 smart rule types","Custom domain support","CSV data export",
  "Auto-pilot templates","Priority email support","Instant print-ready QR sign",
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
                No app to download. No account required.
              </div>
              <div style={{ fontSize:mob?13:14, color:C.t3, lineHeight:1.65 }}>
                Xhibitur Rewards runs entirely through your customers' phone or web browser. Customers just scan and earn. For customers who want their stamps to follow them across devices they can optionally save their progress with their email.
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
            { icon:"🏷",lbl:"Order Stickers",desc:"Co-branded vinyl",  to:"dashboard/stickers",  col:C.am },
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

function QRModal({ init, onSave, onClose, programs=[] }) {
  const [name,setName]=useState(init?.name||""); const [wurl,setWurl]=useState(init?.workerUrl||"");
  const [dests,setDests]=useState(init?.destinations||[mkD()]); const [fb,setFb]=useState(init?.fallback||"");
  const [fg,setFg]=useState(init?.fg||C.t1); const [tab,setTab]=useState("build"); const [png,setPng]=useState(null);
  const [saving,setSaving]=useState(false);
  const [linkedProgram,setLinkedProgram]=useState(init?.linkedProgram||"");

  const handleSave = async () => {
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
    const autoUrl = `https://${slug}.qr.xhibitur.com`;
    const autoFallback = fb || `https://rewards.xhibitur.com/#/checkin/${slug}`;

    // Get linked program settings
    const prog = programs.find(p=>p.id===linkedProgram);
    const rewardSettings = prog ? {
      goal: prog.cfg?.stampsRequired || 10,
      reward: prog.cfg?.reward || "Free item",
      programName: prog.name,
    } : { goal: 10, reward: "Free item", programName: "" };

    setSaving(true);
    try {
      const res = await fetch("/.netlify/functions/save-qr-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          destinations: dests,
          fallback: autoFallback,
          rewardGoal: rewardSettings.goal,
          rewardName: rewardSettings.reward,
          programName: rewardSettings.programName,
        }),
      });
      const data = await res.json();
      if (!data.success) console.error("KV save error:", data.error);
    } catch(e) {
      console.error("KV save failed:", e);
    }
    setSaving(false);
    onSave({ id: init?.id || gid(), name, workerUrl: autoUrl, destinations: dests, fallback: autoFallback, fg, linkedProgram });
  };
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
            {["build","preview"].map(t=><button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 12px",borderRadius:8,border:"none",background:tab===t?C.vi:"transparent",color:tab===t?"#fff":C.t4,fontSize:12,fontWeight:600,cursor:"pointer",minHeight:36 }}>{t==="build"?"✏ Build":"👁 Preview"}</button>)}
            <button onClick={onClose} style={{ background:C.bg4,border:`1px solid ${C.b3}`,color:C.t4,width:36,height:36,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:4 }}>×</button>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:mob?16:20,WebkitOverflowScrolling:"touch" }}>
          {tab==="build" && (
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div>
                <label style={lbl}>Campaign name</label>
                <input value={name} onChange={e=>{
                  setName(e.target.value);
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
                  if (slug && !fb) setFb(`https://rewards.xhibitur.com/#/checkin/${slug}`);
                }} placeholder="e.g. Harlem Cafe Loyalty" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                {name && <div style={{ fontSize:11,color:C.t4,marginTop:6 }}>Your QR URL will be: <span style={{ color:C.vi,fontFamily:"DM Mono,monospace" }}>https://{name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)}.qr.xhibitur.com</span></div>}
              </div>
              <div style={{ background:C.em+"0c",border:`1px solid ${C.em}22`,borderRadius:10,padding:"10px 14px" }}>
                <div style={{ fontSize:12,color:C.em,fontWeight:600,marginBottom:2 }}>✓ Automatic setup</div>
                <div style={{ fontSize:12,color:C.t4 }}>Your QR code URL is assigned automatically when you save. No technical setup required.</div>
              </div>

              {/* Link to rewards program */}
              <div>
                <label style={lbl}>Link to rewards program</label>
                <select value={linkedProgram} onChange={e=>setLinkedProgram(e.target.value)}
                  style={{ ...si,width:"100%",color:linkedProgram?C.t1:C.t4 }}>
                  <option value="">— No program linked (default: 10 stamps, Free item) —</option>
                  {programs.filter(p=>p.type==="stamps").map(p=>(
                    <option key={p.id} value={p.id}>{p.name} — {p.cfg?.stampsRequired} stamps → {p.cfg?.reward}</option>
                  ))}
                </select>
                {linkedProgram && (()=>{
                  const p = programs.find(x=>x.id===linkedProgram);
                  return p ? (
                    <div style={{ fontSize:11,color:C.vi,marginTop:6 }}>
                      ✓ Check-in page will show: {p.cfg?.stampsRequired} stamps → {p.cfg?.reward}
                    </div>
                  ) : null;
                })()}
                {programs.filter(p=>p.type==="stamps").length===0 && (
                  <div style={{ fontSize:11,color:C.t4,marginTop:6 }}>
                    Create a Stamp Card program in the Rewards tab first to link it here.
                  </div>
                )}
              </div>
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
                      <input value={d.url} onChange={e=>upd(d.id,{...d,url:e.target.value})}
                        onBlur={e=>{ let v=e.target.value.trim(); if(v&&!v.startsWith("http")) upd(d.id,{...d,url:"https://"+v}); }}
                        placeholder="https://destination-url.com" style={si}
                        onFocus={e=>e.target.style.borderColor=C.vi}
                        onBlur={e=>{ let v=e.target.value.trim(); if(v&&!v.startsWith("http")) upd(d.id,{...d,url:"https://"+v}); e.target.style.borderColor=C.b2; }}/>
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
                <input value={fb} onChange={e=>setFb(e.target.value)}
                  onBlur={e=>{ let v=e.target.value.trim(); if(v&&!v.startsWith("http")) setFb("https://"+v); }}
                  placeholder="https://yoursite.com" style={si}
                  onFocus={e=>e.target.style.borderColor=C.am}/>
                <div style={{ fontSize:11,color:C.t4,marginTop:5 }}>If no rules match, customers go here. Leave blank to use your check-in page.</div>
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
                  <QRBox value={name ? `https://${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)}.qr.xhibitur.com` : "https://xhibitur.com"} fg={fg} bg={C.bg3} size={180} onUrl={setPng}/>
                </div>
                <div style={{ color:C.t4,fontSize:11,marginTop:12,wordBreak:"break-all" }}>
                  {name ? `https://${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)}.qr.xhibitur.com` : "Enter a campaign name to generate URL"}
                </div>
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
        </div>
        <div style={{ padding:"14px 18px",borderTop:`1px solid ${C.b1}`,display:"flex",gap:10,background:C.bg3,flexShrink:0 }}>
          <button onClick={onClose} style={{ ...btnG(mob),flex:mob?1:0,padding:"10px 18px",fontSize:14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnP(C.vi,mob),flex:mob?1:0,padding:"10px 20px",fontSize:14,opacity:saving?.7:1 }}>
            {saving?"Saving…":init?"Save changes":"Create QR code"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Printable Sign Generator ──────────────────────────────────────────────────
function generatePrintableSign(qr, qrDataUrl, bizName) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Loyalty Sign — ${bizName || qr.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .sign {
      background: #000;
      border-radius: 24px;
      padding: 48px 40px;
      width: 360px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,.3);
    }
    .star-row {
      color: #D4A017;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: .05em;
      margin-bottom: 20px;
    }
    .headline {
      font-size: 28px;
      font-weight: 900;
      color: #fff;
      letter-spacing: -.02em;
      line-height: 1.15;
      margin-bottom: 6px;
    }
    .headline span { color: #D4A017; }
    .subline {
      font-size: 16px;
      font-weight: 600;
      color: #a3a3a3;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    .qr-wrap {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      display: inline-block;
      margin-bottom: 28px;
      box-shadow: 0 0 0 4px #D4A017;
    }
    .qr-wrap img { display: block; width: 200px; height: 200px; }
    .badge {
      background: #D4A017;
      color: #000;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .08em;
      padding: 6px 16px;
      border-radius: 99px;
      display: inline-block;
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    .footer {
      font-size: 11px;
      color: #525252;
      line-height: 1.6;
    }
    .footer strong { color: #D4A017; }
    .divider {
      border: none;
      border-top: 1px solid #1a1a1a;
      margin: 20px 0;
    }
    .print-note {
      display: block;
      margin-top: 32px;
      font-size: 12px;
      color: #888;
      text-align: center;
      font-family: 'Inter', sans-serif;
    }
    @media print {
      body { background: white; padding: 0; }
      .sign { box-shadow: none; border: 2px solid #D4A017; }
      .print-note { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <div class="sign">
      <div class="star-row">⭐ SCAN TO JOIN ⭐</div>
      <div class="headline">Our <span>FREE</span> loyalty<br/>rewards program</div>
      <div class="subline">Earn rewards every time you visit.<br/>No app needed.</div>
      <div class="qr-wrap">
        <img src="${qrDataUrl}" alt="QR Code"/>
      </div>
      <br/>
      <div class="badge">Scan with your phone camera</div>
      <hr class="divider"/>
      <div class="footer">
        <strong>Powered by Xhibitur Rewards</strong><br/>
        rewards.xhibitur.com
      </div>
    </div>
    <span class="print-note">
      Print this page and display it at your counter, door, or table.<br/>
      Use Ctrl+P (Windows) or Cmd+P (Mac) to print.
    </span>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
  }
}

// ── QR Card — must be defined outside QRPage ──────────────────────────────────
function QRCard({ qr, onEdit, onDelete, mob }) {
  const [du,setDu]=useState(null);
  return (
    <div style={{ ...card(),padding:mob?14:18 }}>
      <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
        <div style={{ background:C.bg3,borderRadius:8,padding:6,flexShrink:0,border:`1px solid ${C.b2}` }}>
          <QRBox value={qr.workerUrl||"https://xhibitur.com"} fg={qr.fg||C.t1} bg={C.bg3} size={mob?64:76} onUrl={setDu}/>
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap" }}>
            <span style={{ fontWeight:700,fontSize:mob?14:15,color:C.t1 }}>{qr.name}</span>
            <Tag color={C.ok} dot>Active</Tag>
          </div>
          <div style={{ fontSize:11,color:C.t4,marginBottom:7,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{qr.workerUrl||"QR URL not set"}</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>{qr.destinations?.flatMap(d=>d.rules).slice(0,3).map((r,i)=>{const rt=RT.find(x=>x.id===r.type);return <Tag key={i} color={rt?.col||C.vi}>{rt?.icon} {r.type==="time"?`${r.tf}-${r.tt}`:r.cond}</Tag>;})}</div>
        </div>
      </div>
      <div style={{ display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${C.b1}`,flexWrap:"wrap" }}>
        {du && <a href={du} download={`${qr.name||"qr"}.png`} style={{ ...btnP(),flex:mob?1:0,padding:"9px 14px",fontSize:13,textDecoration:"none" }}>↓ QR PNG</a>}
        {du && <button onClick={()=>generatePrintableSign(qr,du,qr.name)} style={{ ...btnP(C.em),flex:mob?1:0,padding:"9px 14px",fontSize:13 }}>🖨 Print Sign</button>}
        <button onClick={()=>onEdit(qr)} style={{ ...btnG(),flex:mob?1:0,padding:"9px 14px",fontSize:13 }}>Edit</button>
        <button onClick={()=>onDelete(qr.id)} style={{ padding:"9px 14px",fontSize:13,background:"none",border:`1px solid ${C.err}28`,color:C.err,borderRadius:10,cursor:"pointer",flex:mob?1:0,minHeight:44 }}>Delete</button>
      </div>
      <div style={{ marginTop:12,background:C.em+"0c",border:`1px solid ${C.em}22`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
        <span style={{ fontSize:18 }}>💡</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12,fontWeight:600,color:C.em,marginBottom:2 }}>Display at your counter today</div>
          <div style={{ fontSize:11,color:C.t4 }}>Tap "Print Sign" to get a ready-to-print loyalty sign. Works at any printer — free.</div>
        </div>
        {du && <button onClick={()=>generatePrintableSign(qr,du,qr.name)} style={{ ...btnP(C.em),padding:"8px 14px",fontSize:12,whiteSpace:"nowrap" }}>Print now →</button>}
      </div>
    </div>
  );
}

// ── Shared Programs Store ─────────────────────────────────────────────────────
const ProgramsCtx = createContext([]);
const usePrograms = () => useContext(ProgramsCtx);

function QRPage() {
  const { nav } = useNav(); const w=useW(); const mob=w<640;
  const programs = usePrograms();
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
          :codes.map(qr=>(
            <QRCard key={qr.id} qr={qr} mob={mob}
              onEdit={q=>{setEd(q);setModal(true);}}
              onDelete={id=>setCodes(codes.filter(x=>x.id!==id))}/>
          ))
        }
      </div>
      {modal && <QRModal init={ed} onSave={save} programs={programs} onClose={()=>{setModal(false);setEd(null);}}/>}
    </DashShell>
  );
}

// ── Rewards Page ──────────────────────────────────────────────────────────────
const RWD = [
  { id:"stamps",   icon:"🎯", lb:"Stamp Card",     desc:"Scan to earn stamps. Redeem at goal." },
  { id:"tiers",    icon:"👑", lb:"Loyalty Tiers",  desc:"Bronze, Silver, Gold — stamp milestones." },
  { id:"referral", icon:"🤝", lb:"Referral",        desc:"Share a link. Friend joins. Both earn." },
];
const RPAL=[C.am,C.vi,C.cy];
const DEMO_P=[
  { id:"1",name:"Coffee Loyalty",type:"stamps",active:true,members:312,redemptions:47,scans:1284,cfg:{ stampsRequired:10,reward:"Free coffee",winbackDays:60,winbackOffer:"We miss you — come back for a free drink",referrals:false },col:C.am },
];

function RwdModal({ init,onSave,onClose }) {
  const [name,setName]   = useState(init?.name||"");
  const [type,setType]   = useState(init?.type||"stamps");
  const w=useW(); const mob=w<640;
  const si={...inp,fontSize:14,padding:"11px 13px",background:C.bg3,border:`1px solid ${C.b2}`};

  // Stamp Card state
  const [sr,setSr]   = useState(init?.cfg?.stampsRequired||10);
  const [rw,setRw]   = useState(init?.cfg?.reward||"Free item");
  const [wbd,setWbd] = useState(init?.cfg?.winbackDays||60);
  const [wbo,setWbo] = useState(init?.cfg?.winbackOffer||"We miss you — come back for a free visit");

  // Tiers state
  const [t1stamps,setT1stamps] = useState(init?.cfg?.tiers?.[0]?.stamps||5);
  const [t1reward,setT1reward] = useState(init?.cfg?.tiers?.[0]?.reward||"Free drink upgrade");
  const [t2stamps,setT2stamps] = useState(init?.cfg?.tiers?.[1]?.stamps||15);
  const [t2reward,setT2reward] = useState(init?.cfg?.tiers?.[1]?.reward||"20% off any purchase");
  const [t3stamps,setT3stamps] = useState(init?.cfg?.tiers?.[2]?.stamps||30);
  const [t3reward,setT3reward] = useState(init?.cfg?.tiers?.[2]?.reward||"Free meal or service");

  // Referral state
  const [refReward,setRefReward] = useState(init?.cfg?.refReward||"1 bonus stamp");
  const [refFriendReward,setRefFriendReward] = useState(init?.cfg?.refFriendReward||"1 bonus stamp");

  const save = () => {
    let cfg = {};
    if (type==="stamps") {
      cfg = { stampsRequired:sr, reward:rw, winbackDays:wbd, winbackOffer:wbo };
    } else if (type==="tiers") {
      cfg = {
        tiers:[
          { level:"Bronze", stamps:t1stamps, reward:t1reward, color:C.am },
          { level:"Silver", stamps:t2stamps, reward:t2reward, color:C.t3 },
          { level:"Gold",   stamps:t3stamps, reward:t3reward, color:C.vi },
        ],
        winbackDays:wbd, winbackOffer:wbo,
      };
    } else if (type==="referral") {
      cfg = { refReward, refFriendReward, winbackDays:wbd, winbackOffer:wbo };
    }
    onSave({
      id:init?.id||gid(), name, type, active:true,
      members:init?.members||0, redemptions:init?.redemptions||0, scans:init?.scans||0,
      cfg, col:RPAL[RWD.findIndex(x=>x.id===type)%3]||C.vi,
    });
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",padding:mob?0:20 }}>
      <div style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:mob?"20px 20px 0 0":18,width:"100%",maxWidth:mob?undefined:540,maxHeight:mob?"92vh":"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.8)",animation:mob?"sheetUp .3s ease":"fadeUp .2s ease" }}>
        <div style={{ padding:"16px 18px",background:C.bg3,borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <span style={{ color:C.t1,fontWeight:700,fontSize:15 }}>{init?"Edit Program":"New Rewards Program"}</span>
          <button onClick={onClose} style={{ background:C.bg4,border:`1px solid ${C.b3}`,color:C.t4,width:36,height:36,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:mob?16:20,display:"flex",flexDirection:"column",gap:16,WebkitOverflowScrolling:"touch" }}>

          {/* Program name */}
          <div>
            <label style={lbl}>Program name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Coffee Loyalty Club" style={si}
              onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
          </div>

          {/* Program type */}
          <div>
            <label style={lbl}>Program type</label>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
              {RWD.map(rt=>(
                <button key={rt.id} onClick={()=>setType(rt.id)} style={{ padding:"12px 8px",borderRadius:10,cursor:"pointer",border:`2px solid ${type===rt.id?C.vi:C.b2}`,background:type===rt.id?C.viDim:C.bg3,textAlign:"center",transition:"all .12s" }}>
                  <div style={{ fontSize:22,marginBottom:4 }}>{rt.icon}</div>
                  <div style={{ fontSize:12,fontWeight:700,color:type===rt.id?C.vi:C.t1 }}>{rt.lb}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Stamp Card ── */}
          {type==="stamps" && (
            <div style={{ background:C.bg3,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.vi,marginBottom:4 }}>STAMP CARD SETTINGS</div>
              <div>
                <label style={lbl}>Stamps required for reward</label>
                <input type="number" value={sr} onChange={e=>setSr(+e.target.value)} min={1} max={50} style={si}/>
              </div>
              <div>
                <label style={lbl}>Reward earned</label>
                <input value={rw} onChange={e=>setRw(e.target.value)} placeholder="Free coffee" style={si}
                  onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
            </div>
          )}

          {/* ── Loyalty Tiers ── */}
          {type==="tiers" && (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.vi,marginBottom:4 }}>TIER MILESTONES — stamps accumulate forever</div>
              {[
                { lb:"🥉 Bronze", stamps:t1stamps, setStamps:setT1stamps, reward:t1reward, setReward:setT1reward, color:C.am },
                { lb:"🥈 Silver", stamps:t2stamps, setStamps:setT2stamps, reward:t2reward, setReward:setT2reward, color:C.t3 },
                { lb:"🥇 Gold",   stamps:t3stamps, setStamps:setT3stamps, reward:t3reward, setReward:setT3reward, color:C.vi },
              ].map(t=>(
                <div key={t.lb} style={{ background:C.bg3,borderRadius:10,padding:12,borderLeft:`3px solid ${t.color}` }}>
                  <div style={{ fontSize:13,fontWeight:700,color:C.t1,marginBottom:10 }}>{t.lb}</div>
                  <div style={{ display:"grid",gridTemplateColumns:"80px 1fr",gap:8 }}>
                    <div>
                      <label style={lbl}>Stamps</label>
                      <input type="number" value={t.stamps} onChange={e=>t.setStamps(+e.target.value)} min={1} style={si}/>
                    </div>
                    <div>
                      <label style={lbl}>Reward</label>
                      <input value={t.reward} onChange={e=>t.setReward(e.target.value)} placeholder="Reward at this tier" style={si}
                        onFocus={e=>e.target.style.borderColor=t.color} onBlur={e=>e.target.style.borderColor=C.b2}/>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ background:C.vi+"0c",border:`1px solid ${C.vi}22`,borderRadius:8,padding:"10px 12px",fontSize:12,color:C.t4 }}>
                💡 Stamps accumulate across all visits — customers never reset. Each milestone reward fires once when reached.
              </div>
            </div>
          )}

          {/* ── Referral ── */}
          {type==="referral" && (
            <div style={{ background:C.bg3,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.vi,marginBottom:4 }}>REFERRAL SETTINGS</div>
              <div>
                <label style={lbl}>Reward for the person who refers</label>
                <input value={refReward} onChange={e=>setRefReward(e.target.value)} placeholder="1 bonus stamp" style={si}
                  onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              <div>
                <label style={lbl}>Reward for the new friend who joins</label>
                <input value={refFriendReward} onChange={e=>setRefFriendReward(e.target.value)} placeholder="1 bonus stamp" style={si}
                  onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              <div style={{ background:C.vi+"0c",border:`1px solid ${C.vi}22`,borderRadius:8,padding:"10px 12px",fontSize:12,color:C.t4 }}>
                💡 After checking in, customers get a unique referral link to share. When their friend checks in for the first time, both earn their reward automatically.
              </div>
            </div>
          )}

          {/* Win-back rule — shown for all types */}
          <div style={{ background:C.am+"0c",border:`1px solid ${C.am}22`,borderRadius:10,padding:14 }}>
            <label style={{ ...lbl,color:C.am }}>⚡ Win-back rule (all program types)</label>
            <div style={{ display:"flex",gap:10,marginBottom:10,alignItems:"center",flexWrap:"wrap" }}>
              <span style={{ fontSize:13,color:C.t4 }}>If inactive for</span>
              <input type="number" value={wbd} onChange={e=>setWbd(+e.target.value)} min={7} style={{...si,width:70}}/>
              <span style={{ fontSize:13,color:C.t4 }}>days, send offer:</span>
            </div>
            <input value={wbo} onChange={e=>setWbo(e.target.value)} placeholder="We miss you — 20% off your next visit" style={si}
              onFocus={e=>e.target.style.borderColor=C.am} onBlur={e=>e.target.style.borderColor=C.b2}/>
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

function RewardsPage({ programs, setPrograms }) {
  const progs = programs || DEMO_P;
  const setProgs = setPrograms || (()=>{});
  const { nav } = useNav(); const w=useW(); const mob=w<640;
  const [modal,setModal]=useState(false); const [ed,setEd]=useState(null);
  const save=p=>{ if(ed)setProgs(progs.map(x=>x.id===p.id?p:x));else setProgs([...progs,p]); setModal(false);setEd(null); };

  const typeLabel = p => {
    if (p.type==="stamps") return `${p.cfg?.stampsRequired} stamps → ${p.cfg?.reward}`;
    if (p.type==="tiers") return `${p.cfg?.tiers?.length||3} tiers — ${p.cfg?.tiers?.map(t=>t.level).join(", ")}`;
    if (p.type==="referral") return `Referrer gets: ${p.cfg?.refReward}`;
    return "";
  };

  const typeIcon = { stamps:"🎯", tiers:"👑", referral:"🤝" };

  return (
    <DashShell>
      <PgHead title="Rewards Programs" sub="Build loyalty and bring customers back."
        action={<button onClick={()=>setModal(true)} style={{ ...btnP(),fontSize:13,padding:"10px 18px" }}>+ New Program</button>}/>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {progs.length===0
          ?<Empty icon="◆" title="No rewards programs yet" body="Create your first loyalty program." cta={<button onClick={()=>setModal(true)} style={{ ...btnP(),padding:"12px 24px" }}>Create first program</button>}/>
          :progs.map(p=>(
            <div key={p.id} style={{ ...card(),padding:mob?14:18 }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:14 }}>
                <div style={{ width:44,height:44,borderRadius:10,background:p.col+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,border:`1px solid ${p.col}22` }}>{typeIcon[p.type]||"◆"}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:15,color:C.t1 }}>{p.name}</span>
                    <Tag color={p.active?C.ok:C.t4} dot>{p.active?"Active":"Paused"}</Tag>
                    <Tag color={p.col}>{RWD.find(x=>x.id===p.type)?.lb||p.type}</Tag>
                  </div>
                  <div style={{ fontSize:13,color:C.t4 }}>{typeLabel(p)}</div>

                  {/* Tier milestones preview */}
                  {p.type==="tiers" && p.cfg?.tiers && (
                    <div style={{ display:"flex",gap:6,marginTop:8,flexWrap:"wrap" }}>
                      {p.cfg.tiers.map(t=>(
                        <div key={t.level} style={{ background:C.bg3,border:`1px solid ${t.color||C.b2}`,borderRadius:8,padding:"4px 10px",fontSize:11 }}>
                          <span style={{ color:t.color||C.vi,fontWeight:700 }}>{t.level}</span>
                          <span style={{ color:C.t4 }}> · {t.stamps} stamps · {t.reward}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
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
          ))
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
          <div style={{ background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:10,padding:"13px 14px",fontSize:13,color:C.t4,lineHeight:1.65 }}>
            <span style={{ color:C.viL,fontWeight:600 }}>🔒 How stamps work:</span> Customer stamps are stored privately on each customer's device by default — no account needed, no data collected. Customers who want to sync stamps across phones can optionally save their progress with their email.
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

// ── Check-In Page ─────────────────────────────────────────────────────────────
function CheckInPage() {
  const { nav } = useNav();
  const w=useW(); const mob=w<640;

  // Get business slug from URL hash e.g. #/checkin/harlem-cafe
  const slug = window.location.hash.replace(/^#\/?checkin\/?/,"").split("?")[0] || "";

  const [step, setStep] = useState("enter"); // enter | stamped | welcome | redeem | tier
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [stamps, setStamps] = useState(0);
  const [goal, setGoal] = useState(10);
  const [reward, setReward] = useState("Free item");
  const [bizName, setBizName] = useState(slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [tiers, setTiers] = useState(null);
  const [unlockedTier, setUnlockedTier] = useState(null);
  const [refEnabled, setRefEnabled] = useState(false);
  const [refBonus, setRefBonus] = useState("1 bonus stamp");
  const [refLink, setRefLink] = useState("");
  const [saveEmail, setSaveEmail] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreInput, setRestoreInput] = useState("");

  // Load business info and reward settings from KV
  useEffect(() => {
    if (!slug) return;
    setBizName(slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()));
    // Fetch reward settings from our Netlify function
    fetch(`/.netlify/functions/get-qr-rules?slug=${slug}`)
      .then(r=>r.json())
      .then(data=>{
        if (data.name) setBizName(data.name);
        if (data.rewardGoal) setGoal(data.rewardGoal);
        if (data.rewardName) setReward(data.rewardName);
        if (data.tiers) setTiers(data.tiers);
        if (data.refEnabled) setRefEnabled(true);
        if (data.refBonus) setRefBonus(data.refBonus);
      })
      .catch(()=>{});

    // Handle referral — if ?ref= in URL award bonus stamp to referrer
    const params = new URLSearchParams(window.location.hash.split("?")[1]||"");
    const refCode = params.get("ref");
    if (refCode) {
      try {
        const refEmail = atob(refCode);
        const refKey = `stamps_${slug}_${refEmail}_ref_${Date.now()}`;
        // Mark this referral as pending — awarded when friend completes first check-in
        sessionStorage.setItem("pending_ref", JSON.stringify({ slug, refEmail }));
      } catch(e) {}
    }
  },[slug]);

  const handleCheckin = async e => {
    e.preventDefault();
    if (!email) { setErr("Please enter your email."); return; }
    setBusy(true); setErr("");

    try {
      const key = `stamps_${slug}_${email.toLowerCase()}`;
      const last = localStorage.getItem(`${key}_last`);
      const now = Date.now();
      const COOLDOWN = 4 * 60 * 60 * 1000;

      if (last && now - parseInt(last) < COOLDOWN) {
        const hoursLeft = Math.ceil((COOLDOWN - (now - parseInt(last))) / 3600000);
        setErr(`You already checked in recently. Come back in ${hoursLeft} hour${hoursLeft>1?"s":""} to earn your next stamp.`);
        setBusy(false);
        return;
      }

      const isNew = !localStorage.getItem(`${key}_name`) && !localStorage.getItem(key);
      const current = parseInt(localStorage.getItem(key) || "0");

      // Handle pending referral bonus — award to referrer
      const pendingRef = sessionStorage.getItem("pending_ref");
      if (pendingRef && isNew) {
        try {
          const { slug:rSlug, refEmail } = JSON.parse(pendingRef);
          if (rSlug === slug && refEmail !== email.toLowerCase()) {
            const refKey = `stamps_${slug}_${refEmail}`;
            const refStamps = parseInt(localStorage.getItem(refKey)||"0") + 1;
            localStorage.setItem(refKey, refStamps.toString());
            sessionStorage.removeItem("pending_ref");
          }
        } catch(e) {}
      }

      const newStamps = current + 1;

      // Check tiers
      if (tiers && tiers.length > 0) {
        const maxTier = tiers[tiers.length - 1]; // Gold is the last tier
        const newlyUnlocked = tiers.find(t => t.stamps === newStamps);

        if (newlyUnlocked) {
          const isGold = newlyUnlocked.stamps === maxTier.stamps;

          if (isGold) {
            // Gold reached — generate redemption code, reset stamps, mark permanent Gold
            const code = `${slug.slice(0,4).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
            localStorage.setItem(key, "0"); // reset to 0
            localStorage.removeItem(`${key}_last`);
            localStorage.setItem(`${key}_gold`, "true"); // permanent Gold status
            setRedeemCode(code);
            setStamps(0);
            setUnlockedTier({ ...newlyUnlocked, redemptionCode: code });
            setStep("tier");
          } else {
            // Bronze or Silver — save stamp count, show tier screen
            localStorage.setItem(key, newStamps.toString());
            localStorage.setItem(`${key}_last`, now.toString());
            if (name) localStorage.setItem(`${key}_name`, name);
            setStamps(newStamps);
            setUnlockedTier(newlyUnlocked);
            setStep("tier");
          }
          setBusy(false);
          return;
        }

        // After Gold reset — check if they hit Gold again on next cycle
        const isGoldAgain = localStorage.getItem(`${key}_gold`) === "true" && newStamps === maxTier.stamps;
        if (isGoldAgain) {
          const code = `${slug.slice(0,4).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
          localStorage.setItem(key, "0");
          localStorage.removeItem(`${key}_last`);
          setRedeemCode(code);
          setStamps(0);
          setUnlockedTier({ ...maxTier, redemptionCode: code, repeat: true });
          setStep("tier");
          setBusy(false);
          return;
        }
      }

      // Standard stamp card (no tiers)
      if (!tiers && newStamps >= goal) {
        const code = `${slug.slice(0,4).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
        localStorage.setItem(key, "0");
        localStorage.removeItem(`${key}_last`);
        setRedeemCode(code);
        setStamps(0);
        setStep("redeem");
      } else {
        localStorage.setItem(key, newStamps.toString());
        localStorage.setItem(`${key}_last`, now.toString());
        setStamps(newStamps);
        if (name) localStorage.setItem(`${key}_name`, name);

        // Generate referral link
        if (refEnabled) {
          const code = btoa(email.toLowerCase());
          setRefLink(`${window.location.origin}${window.location.pathname}#/checkin/${slug}?ref=${code}`);
        }

        setStep(isNew ? "welcome" : "stamped");
      }
    } catch(x) {
      setErr("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  if (!slug) return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40,marginBottom:16 }}>⚠️</div>
        <div style={{ fontSize:18,fontWeight:700,color:C.t1,marginBottom:8 }}>Invalid QR code</div>
        <div style={{ fontSize:14,color:C.t4 }}>This QR code is not linked to a business.</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20 }}>
      {/* Header */}
      <div style={{ marginBottom:32,textAlign:"center" }}>
        <Wordmark/>
        <div style={{ fontSize:13,color:C.t4,marginTop:6 }}>Loyalty Rewards</div>
      </div>

      <div style={{ width:"100%",maxWidth:400,animation:"fadeUp .28s ease" }}>

        {/* Business name */}
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:22,fontWeight:800,color:C.t1,letterSpacing:"-.02em" }}>{bizName}</div>
          <div style={{ fontSize:13,color:C.t4,marginTop:4 }}>Loyalty Rewards Program</div>
        </div>

        {/* STEP: Enter email */}
        {step==="enter" && (
          <div style={{ ...card(true),padding:24,border:`1px solid ${C.b2}` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:36,marginBottom:8 }}>🎯</div>
              <div style={{ fontSize:17,fontWeight:700,color:C.t1,marginBottom:6 }}>Check in to earn a stamp</div>
              <div style={{ fontSize:13,color:C.t4 }}>Collect {goal} stamps and get {reward}</div>
            </div>
            <form onSubmit={handleCheckin} style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div>
                <label style={lbl}>Your email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" style={{ ...inp,background:C.bg3,border:`1px solid ${C.b2}` }} required
                  onFocus={e=>e.target.style.borderColor=C.vi}
                  onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              {!localStorage.getItem(`stamps_${slug}_${email.toLowerCase()}_name`) && email && (
                <div>
                  <label style={lbl}>Your name (optional)</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="First name" style={{ ...inp,background:C.bg3,border:`1px solid ${C.b2}` }}
                    onFocus={e=>e.target.style.borderColor=C.vi}
                    onBlur={e=>e.target.style.borderColor=C.b2}/>
                </div>
              )}
              {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
              <button type="submit" disabled={busy} style={{ ...btnP(C.vi,true),fontSize:15,padding:"13px",opacity:busy?.7:1 }}>
                {busy?"Checking in…":"Check in & earn stamp ✓"}
              </button>
            </form>
            <div style={{ marginTop:14,background:C.bg3,borderRadius:8,padding:"10px 12px" }}>
              <div style={{ fontSize:11,color:C.t4,lineHeight:1.6,textAlign:"center" }}>
                🔒 <strong style={{ color:C.t3 }}>Your privacy is protected.</strong> Stamps are stored privately on your device. No account required. No data collected.
              </div>
            </div>

            {/* Restore stamps option */}
            <button onClick={()=>setStep("restore")} style={{ width:"100%",marginTop:10,background:"none",border:"none",color:C.t4,fontSize:12,cursor:"pointer",padding:"6px",textDecoration:"underline" }}>
              Have a restore code? Tap here
            </button>
          </div>
        )}

        {/* STEP: Stamp awarded */}
        {(step==="stamped"||step==="welcome") && (
          <div style={{ ...card(true),padding:28,border:`1px solid ${C.vi}40`,textAlign:"center",boxShadow:`0 0 40px ${C.viGlo}` }}>
            <div style={{ fontSize:48,marginBottom:12 }}>{step==="welcome"?"🎉":"⭐"}</div>
            <div style={{ fontSize:22,fontWeight:800,color:C.t1,marginBottom:6 }}>
              {step==="welcome"?`Welcome${name?`, ${name}`:""}!`:"Stamp added!"}
            </div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:20 }}>
              {step==="welcome"?"You've earned your first stamp!":"You now have"} {stamps} of {goal} stamps
            </div>

            {/* Stamp progress */}
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:20 }}>
              {Array.from({length:Math.min(goal,10)}).map((_,i)=>(
                <div key={i} style={{ width:32,height:32,borderRadius:"50%",background:i<Math.min(stamps,10)?C.vi:C.bg3,border:`2px solid ${i<Math.min(stamps,10)?C.vi:C.b3}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>
                  {i<Math.min(stamps,10)?"⭐":""}
                </div>
              ))}
              {goal>10 && <div style={{ fontSize:11,color:C.t4,width:"100%",marginTop:4 }}>{stamps} of {goal} total stamps</div>}
            </div>

            <div style={{ background:C.vi+"12",border:`1px solid ${C.vi}25`,borderRadius:10,padding:"12px 16px",marginBottom:16 }}>
              <div style={{ fontSize:13,color:C.viL,fontWeight:600 }}>
                {goal-stamps} more visit{goal-stamps!==1?"s":""} until your {reward}!
              </div>
            </div>

            {/* Gold status badge */}
            {localStorage.getItem(`stamps_${slug}_${email.toLowerCase()}_gold`)==="true" && (
              <div style={{ background:C.vi+"18",border:`1px solid ${C.vi}30`,borderRadius:10,padding:"8px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:6,justifyContent:"center" }}>
                <span style={{ fontSize:14 }}>🥇</span>
                <span style={{ fontSize:12,fontWeight:700,color:C.vi }}>Gold Member</span>
              </div>
            )}

            {/* Save progress */}
            <div style={{ background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:12,padding:"14px",marginBottom:14,textAlign:"left" }}>
              <div style={{ fontSize:13,fontWeight:700,color:C.t1,marginBottom:4 }}>💾 Save your progress</div>
              <div style={{ fontSize:12,color:C.t4,marginBottom:10,lineHeight:1.6 }}>Stamps live on this device. Save them so you never lose your progress if you switch phones.</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                <button onClick={()=>setStep("save-email")} style={{ ...btnP(C.vi,true),fontSize:13,padding:"9px" }}>📧 Save with email — sync across devices</button>
                <button onClick={()=>{
                  const payload = `${email.toLowerCase()}:${slug}:${stamps}:${Date.now()}`;
                  const code = btoa(payload).replace(/[+=\/]/g,"").slice(0,20).toUpperCase();
                  localStorage.setItem(`stamps_${slug}_${email.toLowerCase()}_code`,code);
                  setRestoreCode(code); setStep("show-code");
                }} style={{ ...btnG(true),fontSize:13,padding:"9px" }}>🔑 Get a private backup code</button>
              </div>
            </div>

            {/* Referral */}
            {refLink && (
              <div style={{ background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:10,padding:"12px",marginBottom:14,textAlign:"left" }}>
                <div style={{ fontSize:13,fontWeight:700,color:C.t1,marginBottom:4 }}>🤝 Refer a friend — earn a bonus stamp!</div>
                <div style={{ fontSize:12,color:C.t4,marginBottom:8 }}>Share your link. When a friend checks in for the first time you both earn {refBonus}.</div>
                <button onClick={()=>{ if(navigator.share){navigator.share({title:`Join ${bizName} Rewards`,text:`Join me at ${bizName} — earn free rewards!`,url:refLink});}else{navigator.clipboard.writeText(refLink);alert("Referral link copied!");}}} style={{ ...btnP(C.vi,true),fontSize:13,padding:"9px" }}>Share referral link →</button>
              </div>
            )}

            <button onClick={()=>setStep("enter")} style={{ ...btnG(true),fontSize:13,padding:"10px",width:"100%" }}>Done for now</button>
          </div>
        )}

        {/* STEP: Save with email */}
        {step==="save-email" && (
          <div style={{ ...card(true),padding:24,border:`1px solid ${C.vi}40` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:36,marginBottom:8 }}>📧</div>
              <div style={{ fontSize:17,fontWeight:700,color:C.t1,marginBottom:6 }}>Save with email</div>
              <div style={{ fontSize:13,color:C.t4,lineHeight:1.6 }}>We'll email you a restore code so your stamps follow you to any device.</div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div>
                <label style={lbl}>Your email</label>
                <input type="email" value={saveEmail} onChange={e=>setSaveEmail(e.target.value)} placeholder="you@email.com"
                  style={{ ...inp,background:C.bg3,border:`1px solid ${C.b2}` }}
                  onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              {saveErr && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{saveErr}</div>}
              <button onClick={async()=>{
                if(!saveEmail){setSaveErr("Please enter your email.");return;}
                setSaveBusy(true);setSaveErr("");
                try{
                  const res=await fetch("/.netlify/functions/save-stamps",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:saveEmail,slug,bizName,stamps,goal,reward})});
                  const data=await res.json();
                  if(data.success){localStorage.setItem(`stamps_${slug}_${email.toLowerCase()}_saved_email`,saveEmail);setRestoreCode(data.restoreCode);setStep("saved");}
                  else setSaveErr("Something went wrong. Try again.");
                }catch(e){setSaveErr("Something went wrong. Try again.");}
                setSaveBusy(false);
              }} disabled={saveBusy} style={{ ...btnP(C.vi,true),fontSize:14,padding:"12px",opacity:saveBusy?.7:1 }}>
                {saveBusy?"Sending…":"Send restore code →"}
              </button>
              <button onClick={()=>setStep("stamped")} style={{ ...btnG(true),fontSize:13,padding:"10px" }}>Back</button>
            </div>
            <div style={{ marginTop:12,fontSize:11,color:C.t4,textAlign:"center",lineHeight:1.6 }}>🔒 We use your email only to send this code. We don't track visits or share your data.</div>
          </div>
        )}

        {/* STEP: Show backup code */}
        {step==="show-code" && (
          <div style={{ ...card(true),padding:24,border:`1px solid ${C.vi}40`,textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:12 }}>🔑</div>
            <div style={{ fontSize:17,fontWeight:700,color:C.t1,marginBottom:8 }}>Your backup code</div>
            <div style={{ fontSize:13,color:C.t4,marginBottom:20,lineHeight:1.6 }}>Save this somewhere safe. Use it to restore your stamps on any device.</div>
            <div style={{ background:C.bg3,border:`2px dashed ${C.vi}`,borderRadius:12,padding:"20px",marginBottom:20 }}>
              <div style={{ fontSize:11,color:C.t4,marginBottom:6,letterSpacing:".1em" }}>YOUR BACKUP CODE</div>
              <div style={{ fontSize:22,fontWeight:900,color:C.vi,letterSpacing:".08em",fontFamily:"DM Mono,monospace" }}>{restoreCode}</div>
            </div>
            <button onClick={()=>{navigator.clipboard.writeText(restoreCode);alert("Code copied!");}} style={{ ...btnP(C.vi,true),fontSize:13,padding:"11px",marginBottom:10 }}>Copy code</button>
            <button onClick={()=>setStep("stamped")} style={{ ...btnG(true),fontSize:13,padding:"10px",width:"100%" }}>Done</button>
          </div>
        )}

        {/* STEP: Saved confirmation */}
        {step==="saved" && (
          <div style={{ ...card(true),padding:28,border:`1px solid ${C.ok}40`,textAlign:"center" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
            <div style={{ fontSize:20,fontWeight:800,color:C.t1,marginBottom:8 }}>Stamps saved!</div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:20,lineHeight:1.6 }}>We emailed your restore code to <strong style={{ color:C.t2 }}>{saveEmail}</strong>. Check your inbox.</div>
            <div style={{ background:C.bg3,border:`1px solid ${C.b2}`,borderRadius:10,padding:"14px",marginBottom:20,textAlign:"left" }}>
              <div style={{ fontSize:12,color:C.t4,lineHeight:1.7 }}><strong style={{ color:C.t2 }}>To restore on a new device:</strong><br/>Visit this loyalty page, tap "Have a restore code?" and enter the code from your email.</div>
            </div>
            <button onClick={()=>setStep("enter")} style={{ ...btnP(C.vi,true),fontSize:14,padding:"12px" }}>Done</button>
          </div>
        )}

        {/* STEP: Restore stamps */}
        {step==="restore" && (
          <div style={{ ...card(true),padding:24,border:`1px solid ${C.b2}` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:36,marginBottom:8 }}>🔄</div>
              <div style={{ fontSize:17,fontWeight:700,color:C.t1,marginBottom:6 }}>Restore your stamps</div>
              <div style={{ fontSize:13,color:C.t4 }}>Enter your email and restore code.</div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div>
                <label style={lbl}>Your email</label>
                <input type="email" value={saveEmail} onChange={e=>setSaveEmail(e.target.value)} placeholder="you@email.com"
                  style={{ ...inp,background:C.bg3,border:`1px solid ${C.b2}` }}
                  onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              <div>
                <label style={lbl}>Restore code</label>
                <input value={restoreInput} onChange={e=>setRestoreInput(e.target.value.toUpperCase())} placeholder="XXXXXXXXXXXXXXXXXXXX"
                  style={{ ...inp,background:C.bg3,border:`1px solid ${C.b2}`,fontFamily:"DM Mono,monospace",letterSpacing:".04em" }}
                  onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              {saveErr && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{saveErr}</div>}
              <button onClick={()=>{
                if(!saveEmail||!restoreInput){setSaveErr("Please fill in both fields.");return;}
                try{
                  const padded = restoreInput.toLowerCase() + "=".repeat((4-restoreInput.length%4)%4);
                  const decoded = atob(padded);
                  const parts = decoded.split(":");
                  if(parts[0]===saveEmail.toLowerCase()&&parts[1]===slug){
                    const key=`stamps_${slug}_${saveEmail.toLowerCase()}`;
                    localStorage.setItem(key,parts[2]||"0");
                    setEmail(saveEmail); setStamps(parseInt(parts[2])||0);
                    setSaveErr(""); setStep("stamped");
                  } else setSaveErr("Code doesn't match this email. Please check and try again.");
                }catch(e){setSaveErr("Invalid restore code. Please check and try again.");}
              }} style={{ ...btnP(C.vi,true),fontSize:14,padding:"12px" }}>Restore stamps →</button>
              <button onClick={()=>setStep("enter")} style={{ ...btnG(true),fontSize:13,padding:"10px" }}>Back</button>
            </div>
          </div>
        )}

        {/* STEP: Tier unlocked */}
        {step==="tier" && unlockedTier && (
          <div style={{ ...card(true),padding:28,border:`1px solid ${C.vi}40`,textAlign:"center",boxShadow:`0 0 40px ${C.viGlo}` }}>
            <div style={{ fontSize:48,marginBottom:12 }}>
              {unlockedTier.level==="Bronze"?"🥉":unlockedTier.level==="Silver"?"🥈":"🥇"}
            </div>
            <div style={{ fontSize:22,fontWeight:800,color:C.t1,marginBottom:6 }}>
              {unlockedTier.repeat ? "Gold again!" : `${unlockedTier.level} achieved!`}
            </div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:20 }}>
              {unlockedTier.repeat
                ? "You completed another full cycle — Gold status maintained!"
                : `You've reached ${unlockedTier.stamps} stamps`}
            </div>

            {/* Reward */}
            <div style={{ background:C.vi+"12",border:`1px solid ${C.vi}25`,borderRadius:10,padding:"16px",marginBottom:unlockedTier.redemptionCode?16:20 }}>
              <div style={{ fontSize:12,color:C.t4,marginBottom:4 }}>YOUR REWARD</div>
              <div style={{ fontSize:18,fontWeight:800,color:C.vi }}>{unlockedTier.reward}</div>
              {!unlockedTier.redemptionCode && <div style={{ fontSize:12,color:C.t4,marginTop:6 }}>Show this screen to redeem</div>}
            </div>

            {/* Redemption code for Gold */}
            {unlockedTier.redemptionCode && (
              <div style={{ background:C.bg3,border:`2px dashed ${C.ok}`,borderRadius:12,padding:"16px",marginBottom:20 }}>
                <div style={{ fontSize:11,color:C.t4,marginBottom:6,letterSpacing:".1em" }}>REDEMPTION CODE</div>
                <div style={{ fontSize:24,fontWeight:900,color:C.ok,letterSpacing:".1em",fontFamily:"DM Mono,monospace" }}>{unlockedTier.redemptionCode}</div>
                <div style={{ fontSize:11,color:C.t4,marginTop:8 }}>Show this to the cashier · Your stamp card has reset</div>
              </div>
            )}

            {/* Gold permanent status badge */}
            {unlockedTier.level==="Gold" && (
              <div style={{ background:C.vi+"18",border:`1px solid ${C.vi}30`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8,justifyContent:"center" }}>
                <span style={{ fontSize:16 }}>🥇</span>
                <span style={{ fontSize:13,fontWeight:700,color:C.vi }}>Permanent Gold Member</span>
              </div>
            )}

            <div style={{ fontSize:12,color:C.t4,marginBottom:16 }}>
              {unlockedTier.level==="Gold"
                ? "Your stamp card resets — keep visiting to earn Gold rewards every cycle!"
                : "Keep earning stamps to reach the next tier!"}
            </div>
            <button onClick={()=>setStep("enter")} style={{ ...btnP(C.vi,true),fontSize:14,padding:"12px" }}>
              {unlockedTier.level==="Gold" ? "Start new cycle →" : "Continue earning →"}
            </button>
          </div>
        )}

        {/* STEP: Redeem reward */}
        {step==="redeem" && (
          <div style={{ ...card(true),padding:28,border:`1px solid ${C.ok}40`,textAlign:"center",boxShadow:`0 0 40px rgba(34,197,94,.2)` }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🏆</div>
            <div style={{ fontSize:22,fontWeight:800,color:C.t1,marginBottom:6 }}>You earned it!</div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:24 }}>Show this code to the cashier to claim your {reward}</div>

            <div style={{ background:C.bg3,border:`2px dashed ${C.ok}`,borderRadius:12,padding:"20px 16px",marginBottom:24 }}>
              <div style={{ fontSize:11,color:C.t4,marginBottom:6,letterSpacing:".1em" }}>REDEMPTION CODE</div>
              <div style={{ fontSize:28,fontWeight:900,color:C.ok,letterSpacing:".1em",fontFamily:"DM Mono,monospace" }}>{redeemCode}</div>
            </div>

            <div style={{ fontSize:12,color:C.t4,marginBottom:20 }}>Your stamp card has been reset. Start collecting again!</div>
            <button onClick={()=>setStep("enter")} style={{ ...btnP(C.ok,true),fontSize:14,padding:"12px" }}>Start collecting again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sticker Order Page ─────────────────────────────────────────────────────────
function StickerOrderPage() {
  const { user } = useAuth(); const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const [pack, setPack] = useState("starter");
  const [bizName, setBizName] = useState(user?.name||"");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [style, setStyle] = useState("gold-black");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const PACKS = [
    { id:"standard", name:"Sticker Pack", qty:"10 co-branded stickers", price:29.99, priceId:"price_1TfQtIId1xxQI6ctWeURjbPJ" },
  ];
  const STYLES = [
    { id:"gold-black", name:"Gold on Black", desc:"Gold QR on black background — premium look" },
    { id:"black-gold", name:"Black on Gold", desc:"Black QR on gold background — high contrast" },
    { id:"white-black", name:"White on Black", desc:"Clean minimal white on black" },
  ];

  const handleOrder = async e => {
    e.preventDefault();
    if (!bizName||!addr1||!city||!state||!zip) { setErr("Please fill in all required fields."); return; }
    if (!user) { nav("signup"); return; }
    setLoading(true); setErr("");

    try {
      const selectedPack = PACKS[0];
      const res = await fetch("/.netlify/functions/create-checkout", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          priceId: selectedPack.priceId,
          email: user.email,
          mode: "payment",
          metadata: {
            type:"sticker_order",
            bizName,
            address:`${addr1}${addr2?", "+addr2:""}, ${city}, ${state} ${zip}`,
          }
        }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { setErr("Something went wrong. Please try again or email info@xhibitur.com"); }
    } catch(x) {
      setErr("Something went wrong. Please try again or email info@xhibitur.com");
    }
    setLoading(false);
  };

  const si = { ...inp, background:C.bg3, border:`1px solid ${C.b2}` };

  return (
    <DashShell>
      <PgHead title="Order Sticker Kit" sub="Co-branded QR stickers delivered to your door."/>

      <div style={{ maxWidth:mob?undefined:600 }}>

        {/* Why stickers */}
        <div style={{ ...card(),padding:mob?16:20,marginBottom:16,border:`1px solid ${C.vi}25`,background:C.viDim }}>
          <div style={{ fontWeight:700,fontSize:14,color:C.t1,marginBottom:8 }}>📦 What you get</div>
          <div style={{ fontSize:13,color:C.t3,lineHeight:1.7 }}>
            Professional co-branded QR stickers with your business name and the Xhibitur Rewards logo. Weatherproof vinyl — perfect for counters, windows, menus and tables. Each sticker encodes your unique loyalty QR code.
          </div>
        </div>

        <form onSubmit={handleOrder} style={{ display:"flex",flexDirection:"column",gap:16 }}>

          {/* Single pack display */}
          <div style={{ ...card(true),padding:mob?18:22,border:`2px solid ${C.vi}`,background:C.viDim,borderRadius:14 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:C.t1,marginBottom:4 }}>🏷 10 Co-Branded QR Stickers</div>
                <div style={{ fontSize:13,color:C.t3,lineHeight:1.6 }}>Weatherproof vinyl · Gold on Black · Your business name + QR code · Powered by Xhibitur Rewards</div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ fontSize:28,fontWeight:900,color:C.vi,letterSpacing:"-.04em" }}>$29.99</div>
                <div style={{ fontSize:11,color:C.t4 }}>one-time · free shipping</div>
              </div>
            </div>
          </div>

          {/* Business details */}
          <div>
            <label style={lbl}>Business name (appears on sticker)</label>
            <input value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="Harlem Cafe" style={si} required
              onFocus={e=>e.target.style.borderColor=C.vi}
              onBlur={e=>e.target.style.borderColor=C.b2}/>
          </div>

          {/* Shipping address */}
          <div>
            <label style={lbl}>Shipping address</label>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <input value={addr1} onChange={e=>setAddr1(e.target.value)} placeholder="Street address" style={si} required
                onFocus={e=>e.target.style.borderColor=C.vi}
                onBlur={e=>e.target.style.borderColor=C.b2}/>
              <input value={addr2} onChange={e=>setAddr2(e.target.value)} placeholder="Apt, suite, unit (optional)" style={si}
                onFocus={e=>e.target.style.borderColor=C.vi}
                onBlur={e=>e.target.style.borderColor=C.b2}/>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 80px 100px",gap:8 }}>
                <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" style={si} required
                  onFocus={e=>e.target.style.borderColor=C.vi}
                  onBlur={e=>e.target.style.borderColor=C.b2}/>
                <input value={state} onChange={e=>setState(e.target.value)} placeholder="NY" maxLength={2} style={si} required
                  onFocus={e=>e.target.style.borderColor=C.vi}
                  onBlur={e=>e.target.style.borderColor=C.b2}/>
                <input value={zip} onChange={e=>setZip(e.target.value)} placeholder="10001" maxLength={5} style={si} required
                  onFocus={e=>e.target.style.borderColor=C.vi}
                  onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
            </div>
          </div>

          {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}

          {/* Order summary */}
          <div style={{ ...card(),padding:16,border:`1px solid ${C.b2}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontSize:13,color:C.t4 }}>10 Co-Branded QR Stickers</span>
              <span style={{ fontSize:13,fontWeight:700,color:C.t1 }}>$29.99</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontSize:13,color:C.t4 }}>Shipping</span>
              <span style={{ fontSize:13,color:C.ok,fontWeight:600 }}>Free</span>
            </div>
            <div style={{ borderTop:`1px solid ${C.b2}`,paddingTop:8,display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:14,fontWeight:700,color:C.t1 }}>Total</span>
              <span style={{ fontSize:16,fontWeight:900,color:C.vi }}>$29.99</span>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...btnP(C.vi,true),fontSize:15,padding:"14px",boxShadow:`0 0 30px ${C.viGlo}`,opacity:loading?.7:1 }}>
            {loading?"Redirecting to checkout…":"Order 10 stickers — $29.99 →"}
          </button>

          <p style={{ textAlign:"center",fontSize:12,color:C.t4,margin:0 }}>
            Free shipping · Delivered in 7-10 business days · Weatherproof vinyl
          </p>
        </form>
      </div>
    </DashShell>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const PROTECTED = ["dashboard","dashboard/qr","dashboard/rewards","dashboard/analytics","dashboard/account","dashboard/stickers"];

function AppCore() {
  const { user,loading } = useAuth(); const { page,nav } = useNav();
  const [programs,setPrograms] = useState(DEMO_P);

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

  // Handle checkin routes: #/checkin/slug
  if (page.startsWith("checkin")) return <CheckInPage/>;

  // Handle password reset redirect from Supabase email
  if (window.location.hash.includes("access_token") && window.location.hash.includes("type=recovery")) {
    return <ResetPassword/>;
  }

  const views = {
    home:<Landing/>, login:<Login/>, signup:<Signup/>, pricing:<PricingPage/>,
    "forgot-password":<ForgotPassword/>,
    "reset-password":<ResetPassword/>,
    dashboard:<DashHome/>,
    "dashboard/qr":<QRPage/>,
    "dashboard/rewards":<RewardsPage programs={programs} setPrograms={setPrograms}/>,
    "dashboard/analytics":<AnalyticsPage/>,
    "dashboard/account":<AccountPage/>,
    "dashboard/stickers":<StickerOrderPage/>,
  };
  return (
    <ProgramsCtx.Provider value={programs}>
      {views[page] || <Landing/>}
    </ProgramsCtx.Provider>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
        <div style={{ maxWidth:480,textAlign:"center" }}>
          <div style={{ fontSize:40,marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:20,fontWeight:700,color:"#fff",marginBottom:12 }}>Something went wrong</div>
          <div style={{ fontSize:13,color:"#666",marginBottom:24,background:"#111",padding:"12px 16px",borderRadius:10,textAlign:"left",fontFamily:"monospace",wordBreak:"break-all" }}>
            {this.state.error?.message || "Unknown error"}
          </div>
          <button onClick={()=>{ this.setState({error:null}); window.location.hash="#/dashboard/qr"; }} style={{ background:"#d4a017",color:"#000",border:"none",borderRadius:10,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer" }}>
            Go back to dashboard
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <AuthProvider>
          <AppCore/>
        </AuthProvider>
      </RouterProvider>
    </ErrorBoundary>
  );
}
