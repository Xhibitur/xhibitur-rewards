import React, { useState, useEffect, useRef, createContext, useContext } from "react";

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

function useW() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

const C = {
  bg:"#000",bg1:"#0a0a0a",bg2:"#111",bg3:"#171717",bg4:"#1c1c1c",
  b1:"#1a1a1a",b2:"#252525",b3:"#333",b4:"#444",
  t1:"#fff",t2:"#d4d4d4",t3:"#a3a3a3",t4:"#525252",
  vi:"#d4a017",viL:"#e8b84b",viD:"#b8860b",viDim:"rgba(212,160,23,0.1)",viGlo:"rgba(212,160,23,0.22)",
  fu:"#f59e0b",cy:"#06b6d4",em:"#10b981",am:"#e07b39",ro:"#f43f5e",bl:"#3b82f6",
  ok:"#22c55e",warn:"#f59e0b",err:"#ef4444",
};

const PLAN = { name:"Pro", price:49, priceAnn:490, col:C.vi };

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

const AuthCtx = createContext(null);
const DEMOS = {
  "demo@xhibitur.com":  { pw:"demo1234",  name:"Demo Business", plan:"pro"   },
  "trial@xhibitur.com": { pw:"trial1234", name:"Trial Account",  plan:"trial" },
};

async function callAuth(body) {
  const res = await fetch("/.netlify/functions/auth", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body),
  });
  return res.json();
}

function AuthProvider({ children }) {
  const [user, setU] = useState(null);
  const [loading, setL] = useState(true);
  useEffect(() => { try { const s = localStorage.getItem("xr_u"); if (s) setU(JSON.parse(s)); } catch{} setL(false); },[]);
  const save = u => { setU(u); localStorage.setItem("xr_u", JSON.stringify(u)); };
  const signIn = async (em, pw) => {
    const demo = DEMOS[em.toLowerCase()];
    if (demo && demo.pw === pw) {
      let plan = demo.plan;
      try { const r = await fetch("/.netlify/functions/check-plan", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: em.toLowerCase() }) }); const d = await r.json(); if (d.plan) plan = d.plan; } catch{}
      save({ id:"demo_"+btoa(em).slice(0,8), email:em.toLowerCase(), name:demo.name, plan, isDemo:true }); return;
    }
    const data = await callAuth({ action:"signin", email:em, password:pw });
    if (data.error) throw new Error(data.error);
    if (data.token) localStorage.setItem("xr_token", data.token);
    if (data.refreshToken) localStorage.setItem("xr_refresh", data.refreshToken);
    let plan = data.user.plan;
    try { const r = await fetch("/.netlify/functions/check-plan", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: em.toLowerCase() }) }); const d = await r.json(); if (d.plan) plan = d.plan; } catch{}
    save({ id:data.user.id, email:data.user.email, name:data.user.name, plan });
  };
  const signUp = async (em, pw, nm) => {
    if (!em||!pw||!nm) throw new Error("All fields required");
    if (pw.length<8) throw new Error("Password must be at least 8 characters");
    const partnerId = getPartner();
    const data = await callAuth({ action:"signup", email:em, password:pw, name:nm, partnerId });
    if (data.error) throw new Error(data.error);
    if (data.token) localStorage.setItem("xr_token", data.token);
    if (data.refreshToken) localStorage.setItem("xr_refresh", data.refreshToken);
    try { if (partnerId && window.gtag) window.gtag("event","partner_signup",{ partner: partnerId }); } catch{}
    save({ id:data.user.id, email:data.user.email, name:data.user.name, plan:"trial", trialStart:new Date().toISOString() });
  };
  const signOut = () => { setU(null); localStorage.removeItem("xr_u"); localStorage.removeItem("xr_token"); localStorage.removeItem("xr_refresh"); };
  const setPlan = p => save({ ...user, plan:p });
  const updateName = async nm => { if (user && !user.isDemo) { await callAuth({ action:"update-name", email:user.email, name:nm }); } save({ ...user, name:nm }); };
  return <AuthCtx.Provider value={{ user,loading,signIn,signUp,signOut,setPlan,updateName }}>{children}</AuthCtx.Provider>;
}
const useAuth = () => useContext(AuthCtx);

const RouteCtx = createContext(null);

// ── Partner referral attribution ──────────────────────────────────────────────
const PARTNER_KEY = "xr_partner";
const PARTNER_DAYS = 60;
function capturePartner(pid) {
  if (!pid || !/^[a-z0-9-]{2,50}$/i.test(pid)) return;
  const rec = { id: pid.toLowerCase(), exp: Date.now() + PARTNER_DAYS*864e5 };
  try { localStorage.setItem(PARTNER_KEY, JSON.stringify(rec)); } catch{}
  try { if (window.gtag) window.gtag("event","partner_visit",{ partner: rec.id }); } catch{}
}
function getPartner() {
  try {
    const rec = JSON.parse(localStorage.getItem(PARTNER_KEY)||"null");
    if (rec && rec.id && rec.exp > Date.now()) return rec.id;
    if (rec) localStorage.removeItem(PARTNER_KEY);
  } catch{}
  return null;
}

function RouterProvider({ children }) {
  const get = () => {
    let h = window.location.hash.replace(/^#\/?/,"") || "home";
    // Partner referral links: rewards.xhibitur.com/#/p/<partner> → capture, land on home
    if (h.toLowerCase().startsWith("p/")) {
      capturePartner(h.slice(2).split("?")[0].split("/")[0]);
      window.location.hash = "#/";
      return "home";
    }
    return h;
  };
  const [page, setPage] = useState(get);
  const nav = to => { const p=to.replace(/^\//,""); window.location.hash="#/"+p; setPage(p); window.scrollTo(0,0); };
  useEffect(() => { const h = () => { setPage(get()); window.scrollTo(0,0); }; window.addEventListener("hashchange",h); return () => window.removeEventListener("hashchange",h); },[]);
  return <RouteCtx.Provider value={{ page,nav }}>{children}</RouteCtx.Provider>;
}
const useNav = () => useContext(RouteCtx);

function useQR() {
  const [ok,setOk] = useState(!!window.__xqr);
  useEffect(() => { if (window.__xqr) return; const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; s.onload = () => { window.__xqr=true; setOk(true); }; document.head.appendChild(s); },[]);
  return ok;
}
function QRBox({ value, fg=C.t1, bg=C.bg3, size=160, onUrl }) {
  const ref = useRef(null); const ready = useQR();
  useEffect(() => {
    if (!ready||!ref.current||!window.QRCode) return;
    ref.current.innerHTML = "";
    new window.QRCode(ref.current,{ text:value||"https://xhibitur.com",width:size,height:size,colorDark:fg,colorLight:bg,correctLevel:window.QRCode.CorrectLevel.M });
    if (onUrl) setTimeout(() => { const c=ref.current?.querySelector("canvas"); if(c) onUrl(c.toDataURL("image/png")); },160);
  },[ready,value,fg,size]);
  if (!ready) return <div style={{ width:size,height:size,background:C.bg3,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:C.t4,fontSize:12 }}>Loading…</div>;
  return <div ref={ref} style={{ width:size,height:size,borderRadius:6,overflow:"hidden" }}/>;
}

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
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,background:color+"18",color,border:`1px solid ${color}30`,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",letterSpacing:".02em" }}>{dot && <span style={{ width:5,height:5,borderRadius:"50%",background:color,flexShrink:0 }}/>}{children}</span>;
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

const ADMIN_EMAIL = "info@xhibitur.com";

const TABS = [
  { id:"dashboard",           icon:"⊞", label:"Home"      },
  { id:"dashboard/qr",        icon:"▦",  label:"QR"        },
  { id:"dashboard/rewards",   icon:"◆",  label:"Rewards"   },
  { id:"dashboard/analytics", icon:"◈",  label:"Analytics" },
  { id:"dashboard/stickers",  icon:"🏷", label:"Stickers"  },
  { id:"dashboard/account",   icon:"◉",  label:"Account"   },
  { id:"dashboard/broadcast", icon:"📣", label:"Broadcast" },
];

function TopNav() {
  const { user } = useAuth(); const { nav } = useNav(); const w=useW(); const mob=w<768;
  return (
    <header style={{ position:"sticky",top:0,zIndex:200,background:"rgba(0,0,0,.94)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.b1}`,padding:`0 ${mob?16:28}px`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
      <div onClick={()=>nav("home")} style={{ cursor:"pointer" }}><Wordmark/></div>
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        {!mob && <button onClick={()=>nav("pricing")} style={{ ...btnG(),padding:"7px 14px",fontSize:13,minHeight:36 }}>Pricing</button>}
        {user ? <button onClick={()=>nav("dashboard")} style={{ ...btnP(),fontSize:13,padding:"8px 16px",minHeight:36 }}>Dashboard →</button>
          : <><button onClick={()=>nav("login")} style={{ ...btnG(),fontSize:13,padding:"7px 14px",minHeight:36 }}>Log in</button><button onClick={()=>nav("signup")} style={{ ...btnP(),fontSize:13,padding:"8px 16px",minHeight:36 }}>Start free trial</button></>}
      </div>
    </header>
  );
}

function BottomTabs() {
  const { user } = useAuth();
  const { page,nav } = useNav();
  const tabs = [...TABS, ...(user?.email===ADMIN_EMAIL?[{ id:"dashboard/admin", icon:"🔧", label:"Admin" }]:[])];
  return (
    <nav style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:300,background:C.bg1,borderTop:`1px solid ${C.b1}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
      {tabs.map(t => {
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
  const isTrial = user?.plan==="trial";
  const tabs = [...TABS, ...(user?.email===ADMIN_EMAIL?[{ id:"dashboard/admin", icon:"🔧", label:"Admin" }]:[])];
  return (
    <aside style={{ width:216,background:C.bg1,borderRight:`1px solid ${C.b1}`,display:"flex",flexDirection:"column",padding:"20px 0",flexShrink:0,minHeight:"100%" }}>
      <div style={{ padding:"0 16px 24px",cursor:"pointer" }} onClick={()=>nav("home")}><Wordmark sm/></div>
      <nav style={{ flex:1,padding:"0 8px" }}>
        {tabs.map(t => {
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
            <Tag color={C.vi}>{isTrial?"Trial":"Pro"}</Tag>
          </div>
          <button onClick={()=>nav("pricing")} style={{ ...btnP(C.vi,true),fontSize:11,padding:"7px",minHeight:34 }}>View plan details</button>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"4px 2px" }}>
          <div style={{ width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.vi},${C.fu})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0 }}>{user?.name?.[0]?.toUpperCase()||"U"}</div>
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
      <div onClick={()=>setOpen(!open)} style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.vi},${C.fu})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,cursor:"pointer" }}>{user?.name?.[0]?.toUpperCase()||"U"}</div>
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
          <div><div style={{ fontWeight:800,fontSize:16,color:C.t1 }}>{title}</div><div style={{ fontSize:11,color:C.t4,marginTop:2 }}>Xhibitur LLC · Effective January 1, 2026</div></div>
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
    try { await signUp(em,pw,nm); nav("dashboard"); } catch(x){ setErr(x.message); } finally{ setBusy(false); }
  };
  const row = { display:"flex",alignItems:"flex-start",gap:12,padding:"14px",background:C.bg4,border:`1px solid ${C.b2}`,borderRadius:10 };
  const CustomCheckbox = ({ checked, onChange }) => (
    <div onClick={()=>onChange({ target:{ checked:!checked } })} style={{ width:22,height:22,borderRadius:6,flexShrink:0,marginTop:1,border:`2px solid ${checked?C.vi:C.b3}`,background:checked?C.vi:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s" }}>
      {checked && <span style={{ color:"#000",fontSize:13,fontWeight:900,lineHeight:1 }}>✓</span>}
    </div>
  );
  return (
    <AuthShell title="Start your free trial" sub="14 days free. No credit card. $49.99/month after.">
      <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <div><label style={lbl}>Business name</label><input type="text" value={nm} onChange={e=>setNm(e.target.value)} placeholder="Acme Coffee Co." style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
        <div><label style={lbl}>Email</label><input type="email" value={em} onChange={e=>setEm(e.target.value)} placeholder="you@business.com" style={dInp} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
        <div><label style={lbl}>Password</label><PwInput value={pw} onChange={e=>setPw(e.target.value)} placeholder="8+ characters" style={dInp}/></div>
        <div style={row}>
          <CustomCheckbox checked={ageOk} onChange={e=>setAgeOk(e.target.checked)}/>
          <label onClick={()=>setAgeOk(!ageOk)} style={{ fontSize:13,color:C.t3,lineHeight:1.55,cursor:"pointer",flex:1 }}>I confirm I am <strong style={{ color:C.t2 }}>13 years of age or older</strong>. Xhibitur Rewards is not intended for persons under 13.</label>
        </div>
        <div style={row}>
          <CustomCheckbox checked={termsOk} onChange={e=>setTermsOk(e.target.checked)}/>
          <label style={{ fontSize:13,color:C.t3,lineHeight:1.55,flex:1 }}>
            <span onClick={()=>setTermsOk(!termsOk)} style={{ cursor:"pointer" }}>I agree to Xhibitur LLC's </span>
            <span onClick={e=>{e.preventDefault();setLegal("terms");}} style={{ color:C.vi,fontWeight:600,cursor:"pointer",textDecoration:"underline" }}>Terms of Use</span>
            <span onClick={()=>setTermsOk(!termsOk)} style={{ cursor:"pointer" }}> and </span>
            <span onClick={e=>{e.preventDefault();setLegal("privacy");}} style={{ color:C.vi,fontWeight:600,cursor:"pointer",textDecoration:"underline" }}>Privacy Policy</span>
            <span onClick={()=>setTermsOk(!termsOk)} style={{ cursor:"pointer" }}>, and consent to receive promotional SMS and email from Xhibitur LLC. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
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

const FEATS = [
  { icon:"▦", title:"Smart QR Codes", desc:"One code, infinite destinations. Route by device, time, weather, location, loyalty and more.", col:C.vi },
  { icon:"◆", title:"Customer Rewards", desc:"Points, stamps, cashback and VIP tiers that keep customers coming back on autopilot.", col:C.fu },
  { icon:"◈", title:"Live Analytics", desc:"Scan volume, device split, redemptions and member growth in real time.", col:C.em },
  { icon:"⚡", title:"Win-Back Automation", desc:"Customers inactive 60+ days automatically get a custom offer. Runs itself 24/7.", col:C.cy },
  { icon:"📱", title:"Mobile Dashboard", desc:"Manage everything from your phone. Built mobile-first for busy owners.", col:C.am },
  { icon:"🖨", title:"Instant Print-Ready Sign", desc:"Download a professional loyalty sign in seconds. Print at any printer and display at your counter today — no design skills needed.", col:C.bl },
];
const ALL_FEATURES = [
  "Unlimited Smart QR codes","Unlimited Rewards programs","Unlimited monthly scans",
  "Full analytics dashboard","Win-back automation","Mobile-first dashboard",
  "All 10 smart rule types","Email broadcast messaging","CSV data export",
  "Auto-pilot templates","Priority email support","Instant print-ready QR sign",
];

function Landing() {
  const { nav } = useNav(); const w=useW(); const mob=w<640; const tab=w<1024;
  const px = mob?18:tab?32:48;
  const [footerLegal,setFooterLegal] = useState(null);
  const [stampCount,setStampCount] = useState(3);
  const [stamping,setStamping] = useState(false);
  const [activeRule,setActiveRule] = useState(0);
  const [winbackPlaying,setWinbackPlaying] = useState(false);
  const [winbackStep,setWinbackStep] = useState(0);

  const doStamp = () => {
    if (stamping||stampCount>=10) return;
    setStamping(true);
    setTimeout(()=>{ setStampCount(s=>s+1); setStamping(false); },600);
  };

  const rules = [
    { icon:"⏰", trigger:"It's 11am–2pm", action:"→ Shows lunch specials menu", biz:"Restaurant", color:"#06b6d4" },
    { icon:"🌧️", trigger:"It's raining outside", action:"→ Promotes hot drinks & soups", biz:"Cafe", color:"#3b82f6" },
    { icon:"📅", trigger:"It's Friday night", action:"→ Shows weekend event page", biz:"Bar / Lounge", color:"#8b5cf6" },
    { icon:"👤", trigger:"First-time scan ever", action:"→ Unlocks welcome discount", biz:"Boutique", color:"#10b981" },
    { icon:"🏋️", trigger:"It's 6am–9am", action:"→ Shows morning class schedule", biz:"Gym", color:"#f59e0b" },
  ];

  useEffect(()=>{
    const t = setInterval(()=>setActiveRule(r=>(r+1)%rules.length),2800);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    if (!winbackPlaying) return;
    setWinbackStep(0);
    const t1=setTimeout(()=>setWinbackStep(1),700);
    const t2=setTimeout(()=>setWinbackStep(2),1600);
    const t3=setTimeout(()=>setWinbackStep(3),2800);
    return ()=>{ clearTimeout(t1);clearTimeout(t2);clearTimeout(t3); };
  },[winbackPlaying]);

  const sec = (extra={}) => ({ padding:`clamp(56px,8vw,96px) ${px}px`, ...extra });
  const maxW = (n=1100,extra={}) => ({ maxWidth:n,margin:"0 auto",...extra });
  const phoneFrame = (children, accent) => (
    <div style={{ width:mob?"100%":220,maxWidth:280,flexShrink:0,background:"#0a0a0a",borderRadius:32,border:`2px solid ${(accent||C.vi)}30`,boxShadow:`0 0 60px ${(accent||C.vi)}20, 0 24px 64px rgba(0,0,0,.8)`,overflow:"hidden",position:"relative" }}>
      <div style={{ background:"#000",padding:"8px 0 6px",display:"flex",justifyContent:"center" }}>
        <div style={{ width:72,height:6,background:"#222",borderRadius:99 }}/>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ background:C.bg,minHeight:"100vh",overflowX:"hidden" }}>
      <TopNav/>

      <section style={{ ...sec(),textAlign:"center",position:"relative",borderBottom:`1px solid ${C.b1}` }}>
        <div style={{ position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:700,height:480,background:`radial-gradient(ellipse,rgba(212,160,23,.16) 0%,transparent 68%)`,pointerEvents:"none" }}/>
        <div style={{ ...maxW(720),position:"relative" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:99,padding:"7px 18px",marginBottom:24,whiteSpace:"nowrap",overflow:"hidden" }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:C.ok,boxShadow:`0 0 8px ${C.ok}`,display:"inline-block",flexShrink:0 }}/>
            <span style={{ fontSize:`clamp(9px,2.2vw,12px)`,fontWeight:700,color:C.t1,letterSpacing:".07em",whiteSpace:"nowrap" }}>XHIBITUR REWARDS — RETAIN AND REWARD YOUR CUSTOMERS</span>
          </div>
          <h1 style={{ fontSize:`clamp(36px,7.5vw,76px)`,fontWeight:900,letterSpacing:"-.05em",lineHeight:1,marginBottom:20,color:C.t1 }}>
            Turn walk-ins into <span style={{ background:`linear-gradient(135deg,${C.vi},#f97316)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>regulars. Automatically.</span>
          </h1>
          <p style={{ fontSize:`clamp(15px,2.2vw,19px)`,color:C.t3,lineHeight:1.7,maxWidth:480,margin:"0 auto 36px" }}>
            Your customers scan a code and earn stamps every visit towards a reward. When a customer hasn't visited in 30 days, we automatically send emails to win them back. No app to download. No staff training. Just results.
          </p>
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:16 }}>
            <button onClick={()=>nav("signup")} style={{ ...btnP(),fontSize:mob?15:16,padding:"15px 32px",boxShadow:`0 0 40px ${C.viGlo}`,width:mob?"100%":"auto",maxWidth:mob?320:undefined }}>Start free — 14 days on us</button>
            <button onClick={()=>nav("pricing")} style={{ ...btnG(),fontSize:mob?15:16,padding:"15px 24px",width:mob?"100%":"auto",maxWidth:mob?320:undefined }}>See pricing →</button>
          </div>
          <p style={{ fontSize:12,color:C.t4 }}>No credit card · No app download · $49.99/mo after trial · Cancel any time</p>
        </div>
      </section>

      <section style={{ ...sec(),borderBottom:`1px solid ${C.b1}`,background:C.bg1 }}>
        <div style={{ ...maxW(900) }}>
          <div style={{ textAlign:"center",marginBottom:mob?36:52 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.vi,letterSpacing:".1em",marginBottom:10 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize:`clamp(24px,4vw,42px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1 }}>Set up in 5 minutes. Runs forever.</h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:mob?"1fr":tab?"1fr 1fr":"repeat(4,1fr)",gap:1,background:C.b1,borderRadius:16,overflow:"hidden",border:`1px solid ${C.b1}` }}>
            {[
              { n:"1", icon:"▦", title:"Create your QR code", desc:"Name your campaign. Your check-in page goes live instantly. No design work needed.", col:C.vi },
              { n:"2", icon:"📋", title:"Set your reward", desc:"10 visits = free coffee. 8 stamps = 20% off. You choose the goal and the reward.", col:C.cy },
              { n:"3", icon:"📲", title:"Customer scans & earns", desc:"They scan with their phone camera. No app. No download. Just their email and a tap.", col:C.em },
              { n:"4", icon:"🔄", title:"Win-back runs itself", desc:"Gone 60 days? They get an automatic 'we miss you' offer. You do nothing.", col:C.am },
            ].map(s=>(
              <div key={s.n} style={{ background:C.bg2,padding:mob?"20px":tab?"22px":"28px 24px" }}>
                <div style={{ width:32,height:32,borderRadius:8,background:s.col+"20",border:`1px solid ${s.col}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginBottom:16 }}>{s.icon}</div>
                <div style={{ fontSize:11,fontWeight:700,color:s.col,letterSpacing:".06em",marginBottom:6 }}>STEP {s.n}</div>
                <div style={{ fontSize:14,fontWeight:700,color:C.t1,marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:13,color:C.t4,lineHeight:1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sec(),borderBottom:`1px solid ${C.b1}` }}>
        <div style={{ ...maxW(1000),display:"flex",alignItems:"center",gap:mob?32:56,flexDirection:mob?"column":"row" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.vi,letterSpacing:".1em",marginBottom:12 }}>DEMO — TRY IT NOW</div>
            <h2 style={{ fontSize:`clamp(22px,3.5vw,38px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1,marginBottom:14,lineHeight:1.1 }}>Your customers earn stamps every visit</h2>
            <p style={{ fontSize:14,color:C.t4,lineHeight:1.75,marginBottom:24 }}>Every time a customer scans your QR code, they earn a stamp. When they hit your goal, they get a reward code to show at the counter. Simple for them. Automatic for you.</p>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["10 stamps = free coffee","8 stamps = 20% off","5 stamps = free side","Visit 12x = VIP status"].map(ex=>(
                <div key={ex} style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:8,padding:"6px 12px",fontSize:12,color:C.t3 }}>{ex}</div>
              ))}
            </div>
          </div>
          {phoneFrame(
            <div style={{ padding:"16px 14px",background:"#000",minHeight:320 }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.vi,textAlign:"center",letterSpacing:".06em",marginBottom:4 }}>HARLEM CAFE</div>
              <div style={{ fontSize:10,color:C.t4,textAlign:"center",marginBottom:16 }}>Collect 10 stamps · Get a free coffee</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:16 }}>
                {Array.from({length:10}).map((_,i)=>(
                  <div key={i} style={{ aspectRatio:"1",borderRadius:8,background:i<stampCount?C.vi:C.bg3,border:`1px solid ${i<stampCount?C.vi:C.b3}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,transition:"all .3s",boxShadow:i<stampCount?`0 0 8px ${C.viGlo}`:undefined }}>
                    {i<stampCount?"☕":""}
                  </div>
                ))}
              </div>
              <div style={{ textAlign:"center",fontSize:11,color:C.t4,marginBottom:12 }}>{stampCount}/10 stamps collected</div>
              {stampCount>=10
                ? <div style={{ background:C.vi,borderRadius:10,padding:"10px",textAlign:"center" }}>
                    <div style={{ fontSize:13,fontWeight:800,color:"#000" }}>🎉 Free coffee earned!</div>
                    <div style={{ fontSize:10,color:"#00000099",marginTop:2 }}>Show this to your barista</div>
                    <div style={{ fontSize:16,fontWeight:900,color:"#000",marginTop:4,letterSpacing:".1em",fontFamily:"monospace" }}>HARL-X7K2</div>
                  </div>
                : <button onClick={doStamp} style={{ width:"100%",background:stamping?C.vi+"88":C.vi,border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,color:"#000",cursor:"pointer",transition:"all .3s",transform:stamping?"scale(.97)":"scale(1)" }}>
                    {stamping?"✓ Stamped!":"Check in & earn stamp"}
                  </button>
              }
              {stampCount<10 && stampCount>3 && <button onClick={()=>setStampCount(3)} style={{ width:"100%",background:"transparent",border:"none",padding:"6px",fontSize:10,color:C.t4,cursor:"pointer",marginTop:4 }}>reset demo</button>}
            </div>
          ,C.vi)}
        </div>
      </section>

      <section style={{ ...sec(),borderBottom:`1px solid ${C.b1}`,background:C.bg1 }}>
        <div style={{ ...maxW(1000),display:"flex",alignItems:"center",gap:mob?32:56,flexDirection:mob?"column":"row-reverse" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.cy,letterSpacing:".1em",marginBottom:12 }}>SMART QR RULES</div>
            <h2 style={{ fontSize:`clamp(22px,3.5vw,38px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1,marginBottom:14,lineHeight:1.1 }}>One QR code that knows what to show and when</h2>
            <p style={{ fontSize:14,color:C.t4,lineHeight:1.75,marginBottom:20 }}>Your QR code reads the situation — time of day, weather, whether it's a new customer — and routes them to exactly the right page. You set the rules once. It runs forever.</p>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {rules.map((r,i)=>(
                <div key={i} onClick={()=>setActiveRule(i)} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,border:`1px solid ${activeRule===i?r.color+"50":C.b2}`,background:activeRule===i?r.color+"12":C.bg2,cursor:"pointer",transition:"all .25s" }}>
                  <span style={{ fontSize:18,flexShrink:0 }}>{r.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:activeRule===i?C.t1:C.t3 }}>{r.trigger} <span style={{ color:r.color }}>{r.action}</span></div>
                    <div style={{ fontSize:11,color:C.t4 }}>{r.biz}</div>
                  </div>
                  {activeRule===i && <div style={{ width:6,height:6,borderRadius:"50%",background:r.color,boxShadow:`0 0 8px ${r.color}`,flexShrink:0 }}/>}
                </div>
              ))}
            </div>
          </div>
          {phoneFrame(
            <div style={{ padding:"14px",background:"#000",minHeight:340 }}>
              <div style={{ textAlign:"center",marginBottom:12 }}>
                <div style={{ fontSize:10,color:C.t4,marginBottom:4 }}>Smart QR scanned at</div>
                <div style={{ fontSize:13,fontWeight:700,color:rules[activeRule].color }}>{rules[activeRule].biz}</div>
              </div>
              <div key={activeRule} style={{ background:rules[activeRule].color+"15",border:`1px solid ${rules[activeRule].color}30`,borderRadius:12,padding:"14px",marginBottom:12,animation:"fadeUp .35s ease" }}>
                <div style={{ fontSize:24,textAlign:"center",marginBottom:8 }}>{rules[activeRule].icon}</div>
                <div style={{ fontSize:11,fontWeight:600,color:C.t3,textAlign:"center",marginBottom:4 }}>Rule matched:</div>
                <div style={{ fontSize:12,fontWeight:700,color:rules[activeRule].color,textAlign:"center",marginBottom:8 }}>{rules[activeRule].trigger}</div>
                <div style={{ background:rules[activeRule].color,borderRadius:8,padding:"8px",textAlign:"center" }}>
                  <div style={{ fontSize:12,fontWeight:800,color:"#000" }}>{rules[activeRule].action.replace("→ ","")}</div>
                </div>
              </div>
              <div style={{ display:"flex",gap:4 }}>
                {rules.map((_,i)=>(
                  <div key={i} style={{ flex:1,height:2,borderRadius:99,background:i===activeRule?rules[activeRule].color:C.b3,transition:"background .3s" }}/>
                ))}
              </div>
              <div style={{ fontSize:10,color:C.t4,textAlign:"center",marginTop:8 }}>Auto-checks every rule on every scan</div>
            </div>
          ,rules[activeRule].color)}
        </div>
      </section>

      <section style={{ ...sec(),borderBottom:`1px solid ${C.b1}` }}>
        <div style={{ ...maxW(1000),display:"flex",alignItems:"center",gap:mob?32:56,flexDirection:mob?"column":"row" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.am,letterSpacing:".1em",marginBottom:12 }}>WIN-BACK EMAILS</div>
            <h2 style={{ fontSize:`clamp(22px,3.5vw,38px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1,marginBottom:14,lineHeight:1.1 }}>Customers who ghost you get a reason to come back</h2>
            <p style={{ fontSize:14,color:C.t4,lineHeight:1.75,marginBottom:20 }}>When a customer hasn't visited in 60 days, they automatically receive a personal email from your business with a custom offer. No manual work. It fires while you sleep.</p>
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>
              {[
                { icon:"📍",text:"You set the threshold — 30, 60, or 90 days, your call" },
                { icon:"✍️",text:"You write the offer — we send it in your voice" },
                { icon:"🔁",text:"Won't resend to the same customer for 30 days" },
                { icon:"📊",text:"Customers who return after win-back earn stamps normally" },
              ].map(f=>(
                <div key={f.icon} style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                  <span style={{ fontSize:16,flexShrink:0,marginTop:1 }}>{f.icon}</span>
                  <span style={{ fontSize:13,color:C.t3,lineHeight:1.6 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>{ setWinbackPlaying(false); setTimeout(()=>setWinbackPlaying(true),50); }} style={{ ...btnP(C.am),fontSize:13,padding:"10px 20px" }}>▶ See it in action</button>
          </div>
          <div style={{ flexShrink:0,width:mob?"100%":280,maxWidth:320 }}>
            <div style={{ background:"#0d0d0d",border:`1px solid ${C.b2}`,borderRadius:16,overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,.8)" }}>
              <div style={{ background:"#111",padding:"10px 14px",borderBottom:`1px solid ${C.b2}`,display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:"#ef4444" }}/>
                <div style={{ width:8,height:8,borderRadius:"50%",background:"#f59e0b" }}/>
                <div style={{ width:8,height:8,borderRadius:"50%",background:"#22c55e" }}/>
                <div style={{ flex:1,background:"#1a1a1a",borderRadius:4,padding:"3px 8px",marginLeft:4 }}>
                  <span style={{ fontSize:9,color:C.t4 }}>Inbox</span>
                </div>
              </div>
              <div style={{ padding:"16px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.vi},${C.am})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#000",flexShrink:0 }}>H</div>
                  <div>
                    <div style={{ fontSize:10,fontWeight:700,color:C.t1 }}>Harlem Cafe</div>
                    <div style={{ fontSize:9,color:C.t4 }}>via Xhibitur Rewards</div>
                  </div>
                  <div style={{ marginLeft:"auto",fontSize:9,color:C.t4 }}>2m ago</div>
                </div>
                <div style={{ fontSize:11,fontWeight:700,color:C.t1,marginBottom:10,lineHeight:1.4 }}>We miss you, Sarah ☕</div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  <div style={{ fontSize:11,color:C.t3,lineHeight:1.6,opacity:winbackStep>=1?1:0.15,transition:"opacity .5s" }}>
                    Hey Sarah! It's been a while since your last visit. You still have <strong style={{ color:C.vi }}>7 stamps</strong> — just 3 away from your free coffee!
                  </div>
                  <div style={{ background:C.am+"15",border:`1px solid ${C.am}30`,borderRadius:8,padding:"8px 10px",opacity:winbackStep>=2?1:0,transform:winbackStep>=2?"translateY(0)":"translateY(8px)",transition:"all .5s" }}>
                    <div style={{ fontSize:10,fontWeight:700,color:C.am,marginBottom:3 }}>YOUR OFFER</div>
                    <div style={{ fontSize:11,color:C.t1 }}>Come back this week and get a <strong>free pastry</strong> with any order 🥐</div>
                  </div>
                  <div style={{ opacity:winbackStep>=3?1:0,transition:"opacity .5s .2s" }}>
                    <div style={{ background:C.vi,borderRadius:8,padding:"8px",textAlign:"center" }}>
                      <div style={{ fontSize:11,fontWeight:800,color:"#000" }}>Claim my offer →</div>
                    </div>
                    <div style={{ fontSize:9,color:C.t4,textAlign:"center",marginTop:6 }}>Tap to check in and earn your stamp</div>
                  </div>
                </div>
              </div>
            </div>
            {!winbackPlaying && <div style={{ textAlign:"center",marginTop:10,fontSize:11,color:C.t4 }}>Press the button to see the email animate ↑</div>}
          </div>
        </div>
      </section>

      <section style={{ ...sec(),borderBottom:`1px solid ${C.b1}`,background:C.bg1 }}>
        <div style={{ ...maxW(900),textAlign:"center" }}>
          <div style={{ fontSize:11,fontWeight:700,color:C.fu,letterSpacing:".1em",marginBottom:12 }}>LOYALTY TIERS</div>
          <h2 style={{ fontSize:`clamp(22px,3.5vw,38px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1,marginBottom:12,lineHeight:1.1 }}>Bronze. Silver. Gold. Customers keep climbing.</h2>
          <p style={{ fontSize:14,color:C.t4,lineHeight:1.75,maxWidth:560,margin:"0 auto 40px" }}>Give your best customers status. As they earn more stamps, they unlock bigger rewards — automatically.</p>
          <div style={{ display:"grid",gridTemplateColumns:mob?"1fr":tab?"1fr 1fr 1fr":"repeat(3,1fr)",gap:16 }}>
            {[
              { tier:"Bronze", icon:"🥉", stamps:"5 stamps", reward:"Free drink upgrade", col:"#cd7f32", desc:"Every new customer starts here" },
              { tier:"Silver", icon:"🥈", stamps:"10 stamps", reward:"15% off your order", col:"#9e9e9e", desc:"They're coming back — reward it" },
              { tier:"Gold",   icon:"🥇", stamps:"20 stamps", reward:"Free item of choice", col:C.vi,     desc:"VIP treatment for your regulars" },
            ].map((t,i)=>(
              <div key={i} style={{ background:C.bg2,border:`1px solid ${t.col}30`,borderRadius:16,padding:"24px 20px",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",top:-20,right:-20,fontSize:80,opacity:.06 }}>{t.icon}</div>
                <div style={{ fontSize:32,marginBottom:10 }}>{t.icon}</div>
                <div style={{ fontSize:16,fontWeight:800,color:t.col,marginBottom:4 }}>{t.tier}</div>
                <div style={{ fontSize:12,color:C.t4,marginBottom:12 }}>{t.desc}</div>
                <div style={{ background:t.col+"15",border:`1px solid ${t.col}30`,borderRadius:8,padding:"8px 12px" }}>
                  <div style={{ fontSize:11,color:t.col,fontWeight:700 }}>{t.stamps}</div>
                  <div style={{ fontSize:13,color:C.t1,fontWeight:600 }}>{t.reward}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sec(),borderBottom:`1px solid ${C.b1}` }}>
        <div style={{ ...maxW(900) }}>
          <div style={{ textAlign:"center",marginBottom:mob?32:48 }}>
            <h2 style={{ fontSize:`clamp(20px,3vw,34px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1,marginBottom:10 }}>Built for every business</h2>
            <p style={{ fontSize:14,color:C.t4 }}>If you have walk-in customers, Xhibitur Rewards works for you.</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10 }}>
            {["☕ Cafes","🍽️ Restaurants","🍸 Bars","💪 Gyms","✂️ Salons","🛍️ Boutiques","🥗 Juice Bars","🏪 Delis"].map(b=>(
              <div key={b} style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:12,padding:"14px",textAlign:"center",fontSize:13,color:C.t3,fontWeight:500 }}>{b}</div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sec(),borderBottom:`1px solid ${C.b1}`,background:C.bg1 }}>
        <div style={{ ...maxW(680),textAlign:"center" }}>
          <div style={{ fontSize:11,fontWeight:700,color:C.vi,letterSpacing:".1em",marginBottom:12 }}>PRICING</div>
          <h2 style={{ fontSize:`clamp(24px,4vw,44px)`,fontWeight:900,letterSpacing:"-.04em",color:C.t1,marginBottom:12 }}>One price. Everything included.</h2>
          <p style={{ fontSize:15,color:C.t4,marginBottom:36 }}>No feature tiers. No add-ons. Everything unlocked from day one.</p>
          <div style={{ background:C.bg2,border:`1px solid ${C.vi}40`,borderRadius:20,overflow:"hidden",boxShadow:`0 0 80px ${C.viGlo}`,marginBottom:20 }}>
            <div style={{ padding:mob?"28px 20px":"40px 48px",borderBottom:`1px solid ${C.b2}` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.vi,letterSpacing:".1em",marginBottom:16 }}>PRO PLAN — EVERYTHING INCLUDED</div>
              <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"center",gap:4,marginBottom:4 }}>
                <span style={{ fontSize:mob?64:84,fontWeight:900,letterSpacing:"-.05em",color:C.t1,lineHeight:1 }}>$49</span>
                <span style={{ fontSize:mob?28:34,fontWeight:900,color:C.vi,lineHeight:1,marginBottom:6 }}>.99</span>
                <span style={{ fontSize:16,color:C.t3,marginBottom:10 }}>/mo</span>
              </div>
              <div style={{ fontSize:13,color:C.t4,marginBottom:28 }}>or $490.99/year — 2 months free</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:mob?8:10,marginBottom:28,textAlign:"left" }}>
                {ALL_FEATURES.map(f=>(<div key={f} style={{ display:"flex",alignItems:"center",gap:9 }}><span style={{ color:C.vi,fontSize:13,fontWeight:700,flexShrink:0 }}>✓</span><span style={{ fontSize:mob?12:13,color:C.t2 }}>{f}</span></div>))}
              </div>
              <button onClick={()=>nav("signup")} style={{ ...btnP(C.vi,true),fontSize:mob?15:16,padding:"15px",boxShadow:`0 0 40px ${C.viGlo}`,maxWidth:380 }}>Start 14-day free trial</button>
              <div style={{ marginTop:12,fontSize:12,color:C.t4 }}>No credit card required · Cancel any time</div>
            </div>
          </div>
          <button onClick={()=>nav("pricing")} style={{ ...btnG(),fontSize:14 }}>See full details & FAQ →</button>
        </div>
      </section>

      <section style={{ ...sec(),textAlign:"center",background:"#000",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:400,background:`radial-gradient(ellipse,rgba(212,160,23,.14) 0%,transparent 68%)`,pointerEvents:"none" }}/>
        <div style={{ ...maxW(600),position:"relative" }}>
          <h2 style={{ fontSize:`clamp(28px,5vw,58px)`,fontWeight:900,letterSpacing:"-.05em",marginBottom:14,lineHeight:1.05,color:C.t1 }}>Ready to build loyalty<br/><span style={{ color:C.vi }}>that runs itself?</span></h2>
          <p style={{ color:C.t4,fontSize:mob?14:15,marginBottom:32,lineHeight:1.7 }}>Set up in 5 minutes. No app. No tech skills. Just customers coming back.</p>
          <button onClick={()=>nav("signup")} style={{ ...btnP(),fontSize:mob?15:17,padding:mob?"15px 28px":"17px 44px",boxShadow:`0 0 60px ${C.viGlo}`,width:mob?"100%":"auto",maxWidth:mob?320:undefined }}>Start free — 14 days on us →</button>
          <div style={{ marginTop:14,fontSize:12,color:C.t4 }}>$49.99/month after · Cancel any time · No credit card needed</div>
        </div>
      </section>

      <footer style={{ background:C.bg,borderTop:`1px solid ${C.b1}`,padding:`20px ${px}px` }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:12 }}>
          <Wordmark sm/><span style={{ color:C.t4,fontSize:11 }}>© 2026 Xhibitur LLC. All rights reserved.</span>
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
      const res = await fetch("/.netlify/functions/create-checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ priceId:ann?"price_1TSjbIId1xxQI6ctdhI42SiU":"price_1TSjbIId1xxQI6cthyjPZG9f", email:user.email }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { setErr("Something went wrong. Please try again or email info@xhibitur.com"); }
    } catch(e) { setErr("Something went wrong. Please try again or email info@xhibitur.com"); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ minHeight:"100vh",background:C.bg }}>
      <TopNav/>
      <div style={{ maxWidth:1000,margin:"0 auto",padding:`clamp(40px,6vw,80px) ${px}px` }}>
        <div style={{ textAlign:"center",marginBottom:48 }}>
          <Tag color={C.vi}>Simple pricing</Tag>
          <h1 style={{ fontSize:`clamp(30px,5vw,56px)`,fontWeight:900,letterSpacing:"-.05em",color:C.t1,marginBottom:14,marginTop:16,lineHeight:1.05 }}>One plan.<br/>Everything included.</h1>
          <p style={{ color:C.t4,fontSize:mob?15:17,maxWidth:460,margin:"0 auto 28px",lineHeight:1.65 }}>No tiers. No feature locks. No surprises. Everything your business needs for one flat price.</p>
          <div style={{ display:"inline-flex",background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:99,padding:4 }}>
            {[["Monthly",false],["Annual (2 months free)",true]].map(([lb,v])=>(
              <button key={lb} onClick={()=>setAnn(v)} style={{ padding:mob?"8px 14px":"8px 22px",borderRadius:99,border:"none",background:ann===v?C.vi:"transparent",color:ann===v?"#fff":C.t4,fontSize:mob?12:13,fontWeight:600,cursor:"pointer",transition:"all .2s",minHeight:40 }}>{lb}</button>
            ))}
          </div>
        </div>
        <div style={{ ...card(true),border:`1px solid ${C.vi}50`,boxShadow:`0 0 80px ${C.viGlo}`,borderRadius:20,overflow:"hidden",marginBottom:56 }}>
          <div style={{ background:`linear-gradient(135deg,${C.bg3},${C.bg4})`,padding:mob?"32px 24px":"52px 64px",textAlign:"center",borderBottom:`1px solid ${C.b2}` }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.vi,letterSpacing:".1em",marginBottom:16 }}>PRO PLAN — EVERYTHING INCLUDED</div>
            <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"center",gap:6,marginBottom:6 }}>
              <span style={{ fontSize:mob?68:96,fontWeight:900,letterSpacing:"-.05em",color:C.t1,lineHeight:1 }}>${price}</span>
              <div style={{ paddingBottom:14,textAlign:"left" }}>
                <div style={{ fontSize:17,color:C.t3,fontWeight:400 }}>/month</div>
                {ann && <div style={{ fontSize:12,color:C.vi,fontWeight:600 }}>Save $108.89/yr</div>}
              </div>
            </div>
            {ann ? <div style={{ fontSize:14,color:C.t4,marginBottom:32 }}>Billed as $490.99/year</div> : <div style={{ fontSize:14,color:C.t4,marginBottom:32 }}>or $490.99/year — 2 months free</div>}
            {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 14px",color:C.err,fontSize:13,marginBottom:16,maxWidth:400,margin:"0 auto 16px" }}>{err}</div>}
            <button onClick={startCheckout} disabled={loading} style={{ ...btnP(C.vi,mob),fontSize:mob?15:17,padding:mob?"14px 28px":"16px 52px",boxShadow:`0 0 40px ${C.viGlo}`,maxWidth:400,opacity:loading?.7:1 }}>
              {loading?"Redirecting to checkout…":user?.plan==="pro"?"Go to dashboard →":"Start 14-day free trial"}
            </button>
            <div style={{ marginTop:14,fontSize:13,color:C.t4 }}>No credit card required · Cancel any time</div>
          </div>
          <div style={{ borderTop:`1px solid ${C.b2}`,padding:mob?"24px 20px":"36px 64px",background:C.bg3,textAlign:"center" }}>
            <div style={{ fontSize:mob?18:22,fontWeight:800,color:C.t1,marginBottom:8,letterSpacing:"-.02em" }}>One customer brought back pays for the whole month.</div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:24,maxWidth:500,margin:"0 auto 24px",lineHeight:1.65 }}>The win-back rule generates more than $49.99 in recovered revenue for most businesses within their first 30 days.</div>
            <button onClick={startCheckout} disabled={loading} style={{ ...btnP(C.vi,mob),fontSize:15,padding:"13px 32px",maxWidth:340,opacity:loading?.7:1 }}>
              {loading?"Redirecting…":"Start free trial — no card needed"}
            </button>
          </div>
        </div>
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

function DashHome() {
  const { user } = useAuth(); const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const hr = new Date().getHours();
  const greet = hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const isTrial = user?.plan==="trial";
  const [stats,setStats] = useState({ members:0, redemptions:0, scans:0 });
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    if (!user?.email) return;
    fetch("/.netlify/functions/analytics-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userEmail:user.email }) })
      .then(r=>r.json()).then(d=>{ if(!d.error) setStats(d); }).finally(()=>setLoading(false));
  },[user?.email]);

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
        <Stat icon="▦" label="Check-In Visits" value={loading?"–":stats.scans.toLocaleString()} accent={C.vi}/>
        <Stat icon="◆" label="Redeemed" value={loading?"–":stats.redemptions.toLocaleString()} accent={C.fu}/>
        <Stat icon="👥" label="Members" value={loading?"–":stats.members.toLocaleString()} accent={C.em}/>
        <Stat icon="◈" label="Growth" value="0%" accent={C.cy}/>
      </div>
      <div style={{ ...card(),padding:mob?16:20,marginBottom:14 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.t2,marginBottom:14 }}>Quick actions</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[
            { icon:"▦",lbl:"New Smart QR",   desc:"Dynamic routing",  to:"dashboard/qr",        col:C.vi },
            { icon:"◆",lbl:"New Rewards",    desc:"Points & stamps",   to:"dashboard/rewards",   col:C.fu },
            { icon:"◈",lbl:"Analytics",      desc:"Scans & data",      to:"dashboard/analytics", col:C.em },
            { icon:"🏷",lbl:"Order Stickers", desc:"Co-branded vinyl",  to:"dashboard/stickers",  col:C.am },
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
        <div style={{ fontSize:13,color:C.t4,textAlign:"center",padding:"24px 0" }}>No activity yet. Activity will appear as customers scan your QR codes.</div>
      </div>
    </DashShell>
  );
}

const RT=[{id:"device",lb:"Device",icon:"📱",col:C.vi},{id:"time",lb:"Time",icon:"🕐",col:C.am},{id:"day",lb:"Day",icon:"📅",col:C.em},{id:"weather",lb:"Weather",icon:"🌤",col:C.cy},{id:"language",lb:"Language",icon:"🌐",col:C.fu},{id:"location",lb:"Location",icon:"📍",col:C.ro},{id:"scan_count",lb:"Scan Count",icon:"🔢",col:C.am},{id:"loyalty",lb:"Customer",icon:"⭐",col:C.vi},{id:"event",lb:"Event",icon:"🎪",col:C.cy},{id:"inventory",lb:"Inventory",icon:"📦",col:C.em}];
const RO={device:["iPhone / iOS","Android","Desktop / PC","Tablet"],day:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday","Weekdays","Weekends"],weather:["Sunny / Clear","Rainy","Snowing","Hot (85°F+)","Cold (50°F-)"],language:["English","Spanish","French","Mandarin","Arabic","Portuguese","German","Japanese"],location:["United States","United Kingdom","Canada","Europe (EU)","Latin America","Asia Pacific"],scan_count:["First scan ever","First 50 scans","First 100 scans","Every 10th scan","After 500 scans"],loyalty:["New visitor","Returning visitor","Loyalty member","VIP / Premium","Inactive (60+ days)"],event:["Before event","Day of event","During event","After event","Event cancelled"],inventory:["In stock","Low stock (< 10)","Out of stock","Back in stock","Discontinued"]};
const gid=()=>Math.random().toString(36).slice(2,9);
const mkR=(t="device")=>({id:gid(),type:t,cond:RO[t]?.[0]||"",tf:"09:00",tt:"17:00"});
const mkD=()=>({id:gid(),label:"",url:"",rules:[mkR()]});
const PILOTS={restaurant:[{label:"Lunch",url:"",rules:[{...mkR("time"),tf:"11:00",tt:"14:30"}]},{label:"Dinner",url:"",rules:[{...mkR("time"),tf:"17:00",tt:"22:00"}]},{label:"Brunch",url:"",rules:[{...mkR("day"),cond:"Weekends"}]}],app:[{label:"iOS",url:"",rules:[{...mkR("device"),cond:"iPhone / iOS"}]},{label:"Android",url:"",rules:[{...mkR("device"),cond:"Android"}]},{label:"Desktop",url:"",rules:[{...mkR("device"),cond:"Desktop / PC"}]}],event:[{label:"Tickets",url:"",rules:[{...mkR("event"),cond:"Before event"}]},{label:"Day-Of",url:"",rules:[{...mkR("event"),cond:"Day of event"}]},{label:"Live",url:"",rules:[{...mkR("event"),cond:"During event"}]},{label:"Recap",url:"",rules:[{...mkR("event"),cond:"After event"}]}]};

function QRModal({ init, onSave, onClose, programs=[] }) {
  const [name,setName]=useState(init?.name||"");
  const [dests,setDests]=useState(init?.destinations||[mkD()]);
  const [fb,setFb]=useState(init?.fallback||"");
  const [fg,setFg]=useState(init?.fg||C.t1);
  const [tab,setTab]=useState("build");
  const [png,setPng]=useState(null);
  const [saving,setSaving]=useState(false);
  const [linkedProgram,setLinkedProgram]=useState(init?.linkedProgram||"");
  const [promoTitle,setPromoTitle]=useState(init?.promoTitle||"");
  const [promoDesc,setPromoDesc]=useState(init?.promoDesc||"");
  const [promoButtonText,setPromoButtonText]=useState(init?.promoButtonText||"");
  const [promoButtonLink,setPromoButtonLink]=useState(init?.promoButtonLink||"");
  const w=useW(); const mob=w<640;
  const upd=(id,u)=>setDests(d=>d.map(x=>x.id===id?u:x));
  const rem=id=>setDests(d=>d.filter(x=>x.id!==id));
  const si={...inp,fontSize:14,padding:"11px 13px",background:C.bg3,border:`1px solid ${C.b2}`};

  const handleSave = async () => {
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
    const autoUrl = `https://${slug}.qr.xhibitur.com`;
    const autoFallback = fb || `https://rewards.xhibitur.com/#/checkin/${slug}`;
    const prog = programs.find(p=>p.id===linkedProgram);
    const rewardSettings = prog ? { goal:prog.cfg?.stampsRequired||10, reward:prog.cfg?.reward||"Free item", programName:prog.name } : { goal:10, reward:"Free item", programName:"" };
    setSaving(true);
    try {
      await fetch("/.netlify/functions/save-qr-rules", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ slug, name, destinations:dests, fallback:autoFallback, rewardGoal:rewardSettings.goal, rewardName:rewardSettings.reward, programName:rewardSettings.programName, promoTitle, promoDesc, promoButtonText, promoButtonLink }) });
    } catch(e) { console.error("KV save failed:", e); }
    setSaving(false);
    onSave({ id:init?.id||gid(), name, workerUrl:autoUrl, destinations:dests, fallback:autoFallback, fg, linkedProgram });
  };

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
                <input value={name} onChange={e=>{ setName(e.target.value); const slug=e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50); if(slug&&!fb) setFb(`https://rewards.xhibitur.com/#/checkin/${slug}`); }} placeholder="e.g. Harlem Cafe Loyalty" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                {name && <div style={{ fontSize:11,color:C.t4,marginTop:6 }}>Your QR URL will be: <span style={{ color:C.vi,fontFamily:"DM Mono,monospace" }}>https://{name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)}.qr.xhibitur.com</span></div>}
              </div>
              <div style={{ background:C.em+"0c",border:`1px solid ${C.em}22`,borderRadius:10,padding:"10px 14px" }}>
                <div style={{ fontSize:12,color:C.em,fontWeight:600,marginBottom:2 }}>✓ Automatic setup</div>
                <div style={{ fontSize:12,color:C.t4 }}>Your QR code URL is assigned automatically when you save. No technical setup required.</div>
              </div>
              <div style={{ background:C.vi+"0c",border:`1px solid ${C.vi}22`,borderRadius:10,padding:"14px" }}>
                <div style={{ fontSize:12,fontWeight:700,color:C.vi,marginBottom:10 }}>📢 OPTIONAL PROMOTIONAL SECTION</div>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  <div>
                    <label style={lbl}>Section title (e.g. "TODAY'S SPECIAL")</label>
                    <input value={promoTitle} onChange={e=>setPromoTitle(e.target.value)} placeholder="Leave blank to hide this section" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                  </div>
                  <div>
                    <label style={lbl}>Description</label>
                    <input value={promoDesc} onChange={e=>setPromoDesc(e.target.value)} placeholder="Tell them what's special" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                  </div>
                  <div>
                    <label style={lbl}>Button text (optional)</label>
                    <input value={promoButtonText} onChange={e=>setPromoButtonText(e.target.value)} placeholder="e.g. VIEW MENU, BOOK NOW, LEARN MORE" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                  </div>
                  <div>
                    <label style={lbl}>Button link (optional)</label>
                    <input value={promoButtonLink} onChange={e=>setPromoButtonLink(e.target.value)} placeholder="https://..." style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                  </div>
                </div>
              </div>
              <div>
                <label style={lbl}>Link to rewards program</label>
                <select value={linkedProgram} onChange={e=>setLinkedProgram(e.target.value)} style={{ ...si,width:"100%",color:linkedProgram?C.t1:C.t4 }}>
                  <option value="">— No program linked (default: 10 stamps, Free item) —</option>
                  {programs.filter(p=>p.type==="stamps").map(p=>(<option key={p.id} value={p.id}>{p.name} — {p.cfg?.stampsRequired} stamps → {p.cfg?.reward}</option>))}
                </select>
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
                      <input value={d.url} onChange={e=>upd(d.id,{...d,url:e.target.value})} onBlur={e=>{ let v=e.target.value.trim(); if(v&&!v.startsWith("http")) upd(d.id,{...d,url:"https://"+v}); e.target.style.borderColor=C.b2; }} placeholder="https://destination-url.com" style={si} onFocus={e=>e.target.style.borderColor=C.vi}/>
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
                <input value={fb} onChange={e=>setFb(e.target.value)} onBlur={e=>{ let v=e.target.value.trim(); if(v&&!v.startsWith("http")) setFb("https://"+v); }} placeholder="https://yoursite.com" style={si} onFocus={e=>e.target.style.borderColor=C.am}/>
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
                  <QRBox value={name?`https://${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)}.qr.xhibitur.com`:"https://xhibitur.com"} fg={fg} bg={C.bg3} size={180} onUrl={setPng}/>
                </div>
                <div style={{ color:C.t4,fontSize:11,marginTop:12,wordBreak:"break-all" }}>
                  {name?`https://${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)}.qr.xhibitur.com`:"Enter a campaign name to generate URL"}
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
          <button onClick={handleSave} disabled={saving} style={{ ...btnP(C.vi,mob),flex:mob?1:0,padding:"10px 20px",fontSize:14,opacity:saving?.7:1 }}>{saving?"Saving…":init?"Save changes":"Create QR code"}</button>
        </div>
      </div>
    </div>
  );
}

function generatePrintableSign(qr, qrDataUrl, bizName) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Loyalty Sign</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}.sign{background:#000;border-radius:24px;padding:48px 40px;width:360px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}.star-row{color:#D4A017;font-size:22px;font-weight:900;margin-bottom:20px}.headline{font-size:28px;font-weight:900;color:#fff;line-height:1.15;margin-bottom:6px}.headline span{color:#D4A017}.subline{font-size:16px;font-weight:600;color:#a3a3a3;margin-bottom:28px;line-height:1.5}.qr-wrap{background:#fff;border-radius:16px;padding:16px;display:inline-block;margin-bottom:28px;box-shadow:0 0 0 4px #D4A017}.qr-wrap img{display:block;width:200px;height:200px}.badge{background:#D4A017;color:#000;font-size:11px;font-weight:800;padding:6px 16px;border-radius:99px;display:inline-block;margin-bottom:20px;text-transform:uppercase}.footer{font-size:11px;color:#525252;line-height:1.6}.footer strong{color:#D4A017}.divider{border:none;border-top:1px solid #1a1a1a;margin:20px 0}.print-note{display:block;margin-top:32px;font-size:12px;color:#888;text-align:center}@media print{body{background:white;padding:0}.sign{box-shadow:none;border:2px solid #D4A017}.print-note{display:none}}</style></head><body><div><div class="sign"><div class="star-row">⭐ SCAN TO JOIN ⭐</div><div class="headline">Our <span>FREE</span> loyalty<br/>rewards program</div><div class="subline">Earn rewards every time you visit.<br/>No app needed.</div><div class="qr-wrap"><img src="${qrDataUrl}" alt="QR Code"/></div><br/><div class="badge">Scan with your phone camera</div><hr class="divider"/><div class="footer"><strong>Powered by Xhibitur Rewards</strong><br/>rewards.xhibitur.com</div></div><span class="print-note">Print this page and display it at your counter, door, or table.<br/>Use Ctrl+P (Windows) or Cmd+P (Mac) to print.</span></div></body></html>`;
  const blob = new Blob([html], { type:"text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) { win.onload = () => { setTimeout(()=>URL.revokeObjectURL(url),5000); }; }
}

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

const ProgramsCtx = createContext([]);
const usePrograms = () => useContext(ProgramsCtx);

function QRPage() {
  const { user } = useAuth();
  const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const programs = usePrograms();
  const [codes,setCodes] = useState([]);
  const [loading,setLoading] = useState(true);
  const [modal,setModal] = useState(false);
  const [ed,setEd] = useState(null);

  useEffect(()=>{
    if (!user?.email) return;
    fetch("/.netlify/functions/qr-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"load", userEmail:user.email }) })
      .then(r=>r.json()).then(d=>{ if(d.codes) setCodes(d.codes); }).finally(()=>setLoading(false));
  },[user?.email]);

  const save = async qr => {
    const updated = ed ? codes.map(x=>x.id===qr.id?qr:x) : [...codes,qr];
    setCodes(updated); setModal(false); setEd(null);
    await fetch("/.netlify/functions/qr-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"save", userEmail:user.email, qr }) });
  };

  const remove = async id => {
    setCodes(codes.filter(x=>x.id!==id));
    await fetch("/.netlify/functions/qr-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"delete", userEmail:user.email, qrId:id }) });
  };

  return (
    <DashShell>
      <PgHead title="Smart QR Codes" sub="Route every scan to the right destination."
        action={<button onClick={()=>setModal(true)} style={{ ...btnP(),fontSize:13,padding:"10px 18px" }}>+ New QR</button>}/>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {loading
          ? <div style={{ textAlign:"center",padding:"40px 0",color:C.t4 }}>Loading…</div>
          : codes.length===0
            ? <Empty icon="▦" title="No Smart QR codes yet" body="Create your first dynamic QR code." cta={<button onClick={()=>setModal(true)} style={{ ...btnP(),padding:"12px 24px" }}>Create first QR</button>}/>
            : codes.map(qr=>(<QRCard key={qr.id} qr={qr} mob={mob} onEdit={q=>{setEd(q);setModal(true);}} onDelete={remove}/>))
        }
      </div>
      {modal && <QRModal init={ed} onSave={save} programs={programs} onClose={()=>{setModal(false);setEd(null);}}/>}
    </DashShell>
  );
}

const RWD = [
  { id:"stamps",   icon:"🎯", lb:"Stamp Card",    desc:"Scan to earn stamps. Redeem at goal." },
  { id:"tiers",    icon:"👑", lb:"Loyalty Tiers", desc:"Bronze, Silver, Gold — stamp milestones." },
  { id:"referral", icon:"🤝", lb:"Referral",       desc:"Share a link. Friend joins. Both earn." },
];
const RPAL=[C.am,C.vi,C.cy];

function RwdModal({ init,onSave,onClose }) {
  const [name,setName]=useState(init?.name||"");
  const [type,setType]=useState(init?.type||"stamps");
  const w=useW(); const mob=w<640;
  const si={...inp,fontSize:14,padding:"11px 13px",background:C.bg3,border:`1px solid ${C.b2}`};
  const [sr,setSr]=useState(init?.cfg?.stampsRequired||10);
  const [rw,setRw]=useState(init?.cfg?.reward||"Free item");
  const [wbd,setWbd]=useState(init?.cfg?.winbackDays||60);
  const [wbo,setWbo]=useState(init?.cfg?.winbackOffer||"We miss you — come back for a free visit");
  const [t1stamps,setT1stamps]=useState(init?.cfg?.tiers?.[0]?.stamps||5);
  const [t1reward,setT1reward]=useState(init?.cfg?.tiers?.[0]?.reward||"Free drink upgrade");
  const [t2stamps,setT2stamps]=useState(init?.cfg?.tiers?.[1]?.stamps||15);
  const [t2reward,setT2reward]=useState(init?.cfg?.tiers?.[1]?.reward||"20% off any purchase");
  const [t3stamps,setT3stamps]=useState(init?.cfg?.tiers?.[2]?.stamps||30);
  const [t3reward,setT3reward]=useState(init?.cfg?.tiers?.[2]?.reward||"Free meal or service");
  const [refReward,setRefReward]=useState(init?.cfg?.refReward||"1 bonus stamp");
  const [refFriendReward,setRefFriendReward]=useState(init?.cfg?.refFriendReward||"1 bonus stamp");

  const save = () => {
    if (!name || name.trim().length === 0) { alert("Program name is required"); return; }
    let cfg = {};
    if (type==="stamps") { 
      if (!rw || rw.trim().length === 0) { alert("Reward description is required"); return; }
      cfg = { stampsRequired:sr, reward:rw, winbackDays:wbd, winbackOffer:wbo }; 
    }
    else if (type==="tiers") { 
      if (!t1reward || !t2reward || !t3reward) { alert("All tier rewards are required"); return; }
      cfg = { tiers:[{ level:"Bronze",stamps:t1stamps,reward:t1reward,color:C.am },{ level:"Silver",stamps:t2stamps,reward:t2reward,color:C.t3 },{ level:"Gold",stamps:t3stamps,reward:t3reward,color:C.vi }], winbackDays:wbd, winbackOffer:wbo }; 
    }
    else if (type==="referral") { 
      if (!refReward || !refFriendReward) { alert("Referral rewards are required"); return; }
      cfg = { refReward, refFriendReward, winbackDays:wbd, winbackOffer:wbo }; 
    }
    const prog = { id:init?.id||Math.random().toString(36).slice(2,9), name:name.trim(), type, active:true, members:init?.members||0, redemptions:init?.redemptions||0, scans:init?.scans||0, cfg, col:RPAL[RWD.findIndex(x=>x.id===type)%3]||C.vi };
    onSave(prog);
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:mob?"flex-end":"center",justifyContent:"center",padding:mob?0:20 }}>
      <div style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:mob?"20px 20px 0 0":18,width:"100%",maxWidth:mob?undefined:540,maxHeight:mob?"92vh":"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.8)",animation:mob?"sheetUp .3s ease":"fadeUp .2s ease" }}>
        <div style={{ padding:"16px 18px",background:C.bg3,borderBottom:`1px solid ${C.b1}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <span style={{ color:C.t1,fontWeight:700,fontSize:15 }}>{init?"Edit Program":"New Rewards Program"}</span>
          <button onClick={onClose} style={{ background:C.bg4,border:`1px solid ${C.b3}`,color:C.t4,width:36,height:36,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:mob?16:20,display:"flex",flexDirection:"column",gap:16,WebkitOverflowScrolling:"touch" }}>
          <div><label style={lbl}>Program name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Coffee Loyalty Club" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
          <div>
            <label style={lbl}>Program type</label>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
              {RWD.map(rt=>(<button key={rt.id} onClick={()=>setType(rt.id)} style={{ padding:"12px 8px",borderRadius:10,cursor:"pointer",border:`2px solid ${type===rt.id?C.vi:C.b2}`,background:type===rt.id?C.viDim:C.bg3,textAlign:"center",transition:"all .12s" }}><div style={{ fontSize:22,marginBottom:4 }}>{rt.icon}</div><div style={{ fontSize:12,fontWeight:700,color:type===rt.id?C.vi:C.t1 }}>{rt.lb}</div></button>))}
            </div>
          </div>
          {type==="stamps" && (
            <div style={{ background:C.bg3,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.vi,marginBottom:4 }}>STAMP CARD SETTINGS</div>
              <div><label style={lbl}>Stamps required for reward</label><input type="number" value={sr} onChange={e=>setSr(+e.target.value)} min={1} max={50} style={si}/></div>
              <div><label style={lbl}>Reward earned</label><input value={rw} onChange={e=>setRw(e.target.value)} placeholder="Free coffee" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
            </div>
          )}
          {type==="tiers" && (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.vi,marginBottom:4 }}>TIER MILESTONES</div>
              {[{ lb:"🥉 Bronze",stamps:t1stamps,setStamps:setT1stamps,reward:t1reward,setReward:setT1reward,color:C.am },{ lb:"🥈 Silver",stamps:t2stamps,setStamps:setT2stamps,reward:t2reward,setReward:setT2reward,color:C.t3 },{ lb:"🥇 Gold",stamps:t3stamps,setStamps:setT3stamps,reward:t3reward,setReward:setT3reward,color:C.vi }].map(t=>(
                <div key={t.lb} style={{ background:C.bg3,borderRadius:10,padding:12,borderLeft:`3px solid ${t.color}` }}>
                  <div style={{ fontSize:13,fontWeight:700,color:C.t1,marginBottom:10 }}>{t.lb}</div>
                  <div style={{ display:"grid",gridTemplateColumns:"80px 1fr",gap:8 }}>
                    <div><label style={lbl}>Stamps</label><input type="number" value={t.stamps} onChange={e=>t.setStamps(+e.target.value)} min={1} style={si}/></div>
                    <div><label style={lbl}>Reward</label><input value={t.reward} onChange={e=>t.setReward(e.target.value)} placeholder="Reward at this tier" style={si} onFocus={e=>e.target.style.borderColor=t.color} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {type==="referral" && (
            <div style={{ background:C.bg3,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.vi,marginBottom:4 }}>REFERRAL SETTINGS</div>
              <div><label style={lbl}>Reward for the person who refers</label><input value={refReward} onChange={e=>setRefReward(e.target.value)} placeholder="1 bonus stamp" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
              <div><label style={lbl}>Reward for the new friend who joins</label><input value={refFriendReward} onChange={e=>setRefFriendReward(e.target.value)} placeholder="1 bonus stamp" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
            </div>
          )}
          <div style={{ background:C.am+"0c",border:`1px solid ${C.am}22`,borderRadius:10,padding:14 }}>
            <label style={{ ...lbl,color:C.am }}>⚡ Win-back rule</label>
            <div style={{ display:"flex",gap:10,marginBottom:10,alignItems:"center",flexWrap:"wrap" }}>
              <span style={{ fontSize:13,color:C.t4 }}>If inactive for</span>
              <input type="number" value={wbd} onChange={e=>setWbd(+e.target.value)} min={7} style={{...si,width:70}}/>
              <span style={{ fontSize:13,color:C.t4 }}>days, send offer:</span>
            </div>
            <input value={wbo} onChange={e=>setWbo(e.target.value)} placeholder="We miss you — 20% off your next visit" style={si} onFocus={e=>e.target.style.borderColor=C.am} onBlur={e=>e.target.style.borderColor=C.b2}/>
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
  const { user } = useAuth();
  const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const progs = programs || [];
  const [loading,setLoading] = useState(true);
  const [modal,setModal] = useState(false);
  const [ed,setEd] = useState(null);

  useEffect(()=>{
    if (!user?.email) return;
    fetch("/.netlify/functions/program-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"load", userEmail:user.email }) })
      .then(r=>r.json()).then(d=>{ if(d.programs) setPrograms(d.programs); }).finally(()=>setLoading(false));
  },[user?.email]);

  const save = async p => {
    const updated = ed ? progs.map(x=>x.id===p.id?p:x) : [...progs,p];
    setPrograms(updated); setModal(false); setEd(null);
    await fetch("/.netlify/functions/program-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"save", userEmail:user.email, program:p }) });
  };

  const remove = async id => {
    setPrograms(progs.filter(x=>x.id!==id));
    await fetch("/.netlify/functions/program-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"delete", userEmail:user.email, programId:id }) });
  };

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
        {loading
          ? <div style={{ textAlign:"center",padding:"40px 0",color:C.t4 }}>Loading…</div>
          : progs.length===0
            ? <Empty icon="◆" title="No rewards programs yet" body="Create your first loyalty program." cta={<button onClick={()=>setModal(true)} style={{ ...btnP(),padding:"12px 24px" }}>Create first program</button>}/>
            : progs.map(p=>(
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
                  <button onClick={()=>remove(p.id)} style={{ flex:1,padding:"9px",fontSize:13,background:"none",border:`1px solid ${C.err}28`,color:C.err,borderRadius:10,cursor:"pointer",minHeight:44 }}>Delete</button>
                </div>
              </div>
            ))
        }
      </div>
      {modal && <RwdModal init={ed} onSave={save} onClose={()=>{setModal(false);setEd(null);}}/>}
    </DashShell>
  );
}

function AnalyticsPage() {
  const { user } = useAuth();
  const w=useW(); const mob=w<640;
  const [stats,setStats] = useState({ members:0, redemptions:0, scans:0 });
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    if (!user?.email) return;
    fetch("/.netlify/functions/analytics-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userEmail:user.email }) })
      .then(r=>r.json()).then(d=>{ if(!d.error) setStats(d); }).finally(()=>setLoading(false));
  },[user?.email]);

  return (
    <DashShell>
      <PgHead title="Analytics" sub="Check-in visits, redemptions and member growth."/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16 }}>
        <Stat icon="◈" label="Check-In Visits" value={loading?"–":stats.scans.toLocaleString()} accent={C.vi}/>
        <Stat icon="◆" label="Redeemed" value={loading?"–":stats.redemptions.toLocaleString()} accent={C.fu}/>
        <Stat icon="👥" label="Members" value={loading?"–":stats.members.toLocaleString()} accent={C.cy}/>
      </div>
      <div style={{ ...card(),padding:mob?16:20,textAlign:"center" }}>
        <div style={{ fontSize:14,color:C.t4,padding:"32px 0" }}>
          {!loading && stats.scans===0 && stats.members===0 && stats.redemptions===0
            ? "Analytics will populate as customers scan your QR codes and check in."
            : "Scans, members, and redemptions update automatically as customers check in."}
        </div>
        <div style={{ fontSize:12,color:C.t4,opacity:0.7,paddingBottom:20 }}>
          "Check-In Visits" counts every time a customer opens your check-in page — typically by scanning your QR code.
        </div>
      </div>
    </DashShell>
  );
}

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
            <div style={{ fontSize:12,color:C.t4,lineHeight:1.6 }}>{isTrial?"All features unlocked during your 14-day trial. $49.99/month after — no credit card needed yet.":"All features included. Unlimited QRs, unlimited rewards, unlimited scans."}</div>
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

function CheckInPage() {
  const { nav } = useNav();
  const w=useW(); const mob=w<640; const tab=w<1024;
  const px = mob?16:20;
  const slug = window.location.hash.replace(/^#\/?checkin\/?/,"").split("?")[0] || "";
  
  // State
  const [step,setStep]=useState("checkin"); // checkin, success, member
  const [email,setEmail]=useState("");
  const [name,setName]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const [redeemCode,setRedeemCode]=useState("");
  
  // Business/Program data
  const [bizName,setBizName]=useState(slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()));
  const [bizLogo,setBizLogo]=useState(null);
  const [bizLocation,setBizLocation]=useState("");
  const [bizAddress,setBizAddress]=useState("");
  const [featureImage,setFeatureImage]=useState(null);
  const [programName,setProgramName]=useState("Loyalty Rewards");
  const [goal,setGoal]=useState(10);
  const [reward,setReward]=useState("Free item");
  const [stamps,setStamps]=useState(0);
  const [tiers,setTiers]=useState(null);
  const [unlockedTier,setUnlockedTier]=useState(null);
  
  // Promotional section
  const [promoTitle,setPromoTitle]=useState("");
  const [promoDesc,setPromoDesc]=useState("");
  const [promoButtonText,setPromoButtonText]=useState("");
  const [promoButtonLink,setPromoButtonLink]=useState("");
  
  // Load QR data
  useEffect(()=>{
    if (!slug) return;
    fetch("/.netlify/functions/record-redemption", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ slug, email:"", reward:"__scan__" }) }).catch(()=>{});
    fetch(`/.netlify/functions/get-qr-rules?slug=${slug}`)
      .then(r=>r.json())
      .then(data=>{
        if (data.name) setBizName(data.name);
        if (data.rewardGoal) setGoal(data.rewardGoal);
        if (data.rewardName) setReward(data.rewardName);
        if (data.programName) setProgramName(data.programName);
        if (data.tiers) setTiers(data.tiers);
        if (data.bizLocation) setBizLocation(data.bizLocation);
        if (data.bizAddress) setBizAddress(data.bizAddress);
        if (data.featureImage) setFeatureImage(data.featureImage);
        if (data.promoTitle) setPromoTitle(data.promoTitle);
        if (data.promoDesc) setPromoDesc(data.promoDesc);
        if (data.promoButtonText) setPromoButtonText(data.promoButtonText);
        if (data.promoButtonLink) setPromoButtonLink(data.promoButtonLink);
      }).catch(()=>{});
  },[slug]);

  const recordRedemption = (rewardLabel) => {
    fetch("/.netlify/functions/record-redemption", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ slug, email: email.toLowerCase(), reward: rewardLabel||"reward" }) }).catch(()=>{});
  };

  const handleCheckin = async e => {
    e.preventDefault();
    if (!email) { setErr("Email required"); return; }
    setBusy(true); setErr("");
    
    try {
      const key = `stamps_${slug}_${email.toLowerCase()}`;
      const lastTime = localStorage.getItem(`${key}_last`);
      const now = Date.now();
      const COOLDOWN = 4*60*60*1000;
      
      if (lastTime && now - parseInt(lastTime) < COOLDOWN) {
        const hoursLeft = Math.ceil((COOLDOWN - (now - parseInt(lastTime)))/3600000);
        setErr(`Come back in ${hoursLeft} hour${hoursLeft>1?"s":""} to earn another stamp`);
        setBusy(false);
        return;
      }

      const current = parseInt(localStorage.getItem(key)||"0");
      const newStamps = current + 1;
      
      if (tiers && tiers.length > 0) {
        const newlyUnlocked = tiers.find(t=>t.stamps===newStamps);
        if (newlyUnlocked) {
          const code = `${slug.slice(0,4).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
          const maxTier = tiers[tiers.length-1];
          const isGold = newlyUnlocked.stamps === maxTier.stamps;
          localStorage.setItem(key, isGold ? "0" : newStamps.toString());
          localStorage.setItem(`${key}_last`, now.toString());
          if (isGold) localStorage.setItem(`${key}_gold`, "true");
          if (name) localStorage.setItem(`${key}_name`, name);
          setRedeemCode(code);
          setStamps(isGold ? 0 : newStamps);
          setUnlockedTier({...newlyUnlocked, redemptionCode:code, isGold});
          recordRedemption(newlyUnlocked.reward);
          setStep("tier");
          setBusy(false);
          return;
        }
      }

      if (newStamps >= goal) {
        const code = `${slug.slice(0,4).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
        localStorage.setItem(key, "0");
        localStorage.setItem(`${key}_last`, now.toString());
        if (name) localStorage.setItem(`${key}_name`, name);
        setRedeemCode(code);
        setStamps(0);
        recordRedemption(reward);
        setStep("success");
      } else {
        localStorage.setItem(key, newStamps.toString());
        localStorage.setItem(`${key}_last`, now.toString());
        if (name) localStorage.setItem(`${key}_name`, name);
        setStamps(newStamps);
        recordRedemption("stamp");
        setStep("success");
      }
    } catch (e) {
      setErr("Error: " + e.message);
    }
    setBusy(false);
  };

  const getLogoInitials = () => bizName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{ background:C.bg, minHeight:"100vh", padding:`${px}px`, paddingBottom:px+24, overflowX:"hidden" }}>
      <div style={{ display:"flex",justifyContent:"center",marginBottom:20 }}>
        <div style={{ width:60,height:60,borderRadius:12,background:C.vi,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#000" }}>
          {bizLogo ? <img src={bizLogo} style={{width:"100%",height:"100%",borderRadius:12,objectFit:"cover"}}/> : getLogoInitials()}
        </div>
      </div>

      <div style={{ textAlign:"center",marginBottom:28 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.vi,letterSpacing:".06em",marginBottom:8 }}>{programName}</div>
        <h1 style={{ fontSize:`clamp(18px,4vw,24px)`,fontWeight:900,color:C.t1,marginBottom:4 }}>Rewards for coming back.</h1>
        <p style={{ fontSize:13,color:C.t4,marginBottom:16 }}>You're checking in at</p>
        <div style={{ fontSize:18,fontWeight:800,color:C.t1,marginBottom:6 }}>{bizName}</div>
        {(bizLocation || bizAddress) && (
          <div style={{ fontSize:12,color:C.t4,display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexWrap:"wrap" }}>
            {bizLocation && <span>📍 {bizLocation}</span>}
            {bizAddress && <span>·</span>}
            {bizAddress && <span>{bizAddress}</span>}
          </div>
        )}
      </div>

      {featureImage && (
        <div style={{ width:"100%",maxWidth:400,margin:"0 auto 20px",borderRadius:12,overflow:"hidden",background:C.bg2,border:`1px solid ${C.b2}` }}>
          <img src={featureImage} style={{width:"100%",height:120,objectFit:"cover"}}/>
        </div>
      )}

      {step==="checkin" && (
        <>
          <div style={{ textAlign:"center",marginBottom:24 }}>
            <div style={{ fontSize:12,fontWeight:700,color:C.vi,letterSpacing:".06em",marginBottom:10 }}>CHECK IN TO EARN</div>
            <p style={{ fontSize:14,color:C.t3,marginBottom:8,lineHeight:1.6 }}>
              Check in today to earn 1 stamp. Collect {goal} to unlock {reward}.
            </p>
          </div>

          <div style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:14,padding:"16px",marginBottom:20 }}>
            {[
              {icon:"✓",text:"Earn rewards for qualifying visits"},
              {icon:"✦",text:"Access member-only offers and specials"},
              {icon:"🔒",text:"No app download required"}
            ].map((b,i)=>(
              <div key={i} style={{ display:"flex",gap:12,alignItems:"flex-start",paddingBottom:i<2?12:0,borderBottom:i<2?`1px solid ${C.b3}`:"none",marginBottom:i<2?12:0 }}>
                <span style={{fontSize:14,color:C.vi,flexShrink:0,fontWeight:700}}>{b.icon}</span>
                <span style={{fontSize:13,color:C.t3,lineHeight:1.5}}>{b.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleCheckin} style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:20 }}>
            <div>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{...inp,width:"100%",padding:"12px 14px",fontSize:14,background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:10}}
                onFocus={e=>e.target.style.borderColor=C.vi}
                onBlur={e=>e.target.style.borderColor=C.b2}
              />
            </div>
            <div>
              <input
                type="text"
                value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="Your name (optional)"
                style={{...inp,width:"100%",padding:"12px 14px",fontSize:14,background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:10}}
                onFocus={e=>e.target.style.borderColor=C.vi}
                onBlur={e=>e.target.style.borderColor=C.b2}
              />
            </div>
            {err && <div style={{fontSize:13,color:C.err,background:C.err+"0c",border:`1px solid ${C.err}22`,borderRadius:8,padding:"10px",textAlign:"center"}}>{err}</div>}
            <button type="submit" disabled={busy} style={{...btnP(),fontSize:14,padding:"14px",width:"100%"}}>{busy?"Checking in...":"Check in & earn stamp"}</button>
          </form>

          <div style={{ textAlign:"center",fontSize:12,color:C.t4 }}>
            Already a member? <span onClick={()=>setStep("member")} style={{color:C.vi,fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>Open my rewards</span>
          </div>
        </>
      )}

      {(step==="success" || step==="tier") && (
        <div style={{ textAlign:"center",maxWidth:340,margin:"0 auto" }}>
          <div style={{ fontSize:48,marginBottom:16 }}>🎉</div>
          {step==="tier" && unlockedTier ? (
            <>
              <h2 style={{fontSize:20,fontWeight:900,color:C.t1,marginBottom:8}}>Tier Unlocked!</h2>
              <p style={{fontSize:14,color:C.t3,marginBottom:16}}>{unlockedTier.level}: {unlockedTier.reward}</p>
              {unlockedTier.isGold && (
                <>
                  <div style={{background:C.vi,borderRadius:12,padding:"20px",marginBottom:16}}>
                    <div style={{fontSize:12,color:"#000",marginBottom:8,fontWeight:700}}>Your redemption code</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#000",fontFamily:"monospace",letterSpacing:".1em"}}>{redeemCode}</div>
                  </div>
                  <p style={{fontSize:13,color:C.t4,marginBottom:16}}>Show this code at the counter to claim your reward</p>
                </>
              )}
            </>
          ) : (
            <>
              <h2 style={{fontSize:20,fontWeight:900,color:C.t1,marginBottom:8}}>Stamp earned!</h2>
              <p style={{fontSize:14,color:C.t3,marginBottom:16}}>{stamps}/{goal} stamps collected</p>
              {stamps >= goal && (
                <>
                  <div style={{background:C.vi,borderRadius:12,padding:"20px",marginBottom:16}}>
                    <div style={{fontSize:12,color:"#000",marginBottom:8,fontWeight:700}}>Your reward code</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#000",fontFamily:"monospace",letterSpacing:".1em"}}>{redeemCode}</div>
                  </div>
                  <p style={{fontSize:13,color:C.t4,marginBottom:16}}>Show this code at the counter to claim your {reward}</p>
                </>
              )}
            </>
          )}
          <button onClick={()=>{setStep("checkin");setEmail("");setName("");setErr("");}} style={{...btnP(),fontSize:14,padding:"12px 24px"}}>Check in again</button>
        </div>
      )}

      {step==="member" && (
        <div style={{ maxWidth:340,margin:"0 auto" }}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:32,marginBottom:12}}>⭐</div>
            <h2 style={{fontSize:18,fontWeight:900,color:C.t1,marginBottom:8}}>My rewards</h2>
          </div>
          <div style={{background:C.bg2,borderRadius:12,padding:"20px",textAlign:"center",border:`1px solid ${C.b2}`,marginBottom:16}}>
            <div style={{fontSize:12,color:C.t4,marginBottom:8}}>Current stamps</div>
            <div style={{fontSize:36,fontWeight:900,color:C.vi}}>{stamps}</div>
            <div style={{fontSize:12,color:C.t4,marginTop:8}}>out of {goal}</div>
          </div>
          <p style={{fontSize:13,color:C.t3,textAlign:"center",marginBottom:20}}>Earn {goal-stamps} more to unlock {reward}</p>
          <button onClick={()=>setStep("checkin")} style={{...btnP(),fontSize:14,padding:"12px",width:"100%"}}>Check in now</button>
        </div>
      )}

      {promoTitle && promoDesc && (
        <div style={{ background:C.bg2,border:`1px solid ${C.b2}`,borderRadius:14,padding:"16px",marginTop:24,marginBottom:20,textAlign:"center" }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.vi,letterSpacing:".06em",marginBottom:6 }}>{promoTitle}</div>
          <p style={{ fontSize:13,color:C.t3,lineHeight:1.6,marginBottom:12 }}>{promoDesc}</p>
          {promoButtonText && promoButtonLink && (
            <a href={promoButtonLink} target="_blank" rel="noopener noreferrer" style={{...btnP(),fontSize:12,padding:"10px 20px",display:"inline-block",textDecoration:"none"}}>
              {promoButtonText}
            </a>
          )}
        </div>
      )}

      <div style={{textAlign:"center",marginTop:32,paddingTop:24,borderTop:`1px solid ${C.b1}`}}>
        <div style={{fontSize:10,color:C.t4}}>Powered by Xhibitur Rewards</div>
      </div>
    </div>
  );
}


function StickerOrderPage() {
  const { user } = useAuth(); const { nav } = useNav();
  const w=useW(); const mob=w<640;
  const [bizName,setBizName]=useState(user?.name||"");
  const [addr1,setAddr1]=useState(""); const [addr2,setAddr2]=useState("");
  const [city,setCity]=useState(""); const [state,setState]=useState(""); const [zip,setZip]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const si={...inp,background:C.bg3,border:`1px solid ${C.b2}`};
  const handleOrder = async e => {
    e.preventDefault();
    if (!bizName||!addr1||!city||!state||!zip) { setErr("Please fill in all required fields."); return; }
    if (!user) { nav("signup"); return; }
    setLoading(true); setErr("");
    try {
      const res=await fetch("/.netlify/functions/create-checkout",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ priceId:"price_1TfQtIId1xxQI6ctWeURjbPJ",email:user.email,mode:"payment",metadata:{type:"sticker_order",bizName,address:`${addr1}${addr2?", "+addr2:""}, ${city}, ${state} ${zip}`} }) });
      const data=await res.json();
      if (data.url){window.location.href=data.url;}else setErr("Something went wrong. Please try again or email info@xhibitur.com");
    }catch(x){setErr("Something went wrong. Please try again or email info@xhibitur.com");}
    setLoading(false);
  };
  return (
    <DashShell>
      <PgHead title="Order Sticker Kit" sub="Co-branded QR stickers delivered to your door."/>
      <div style={{ maxWidth:mob?undefined:600 }}>
        <div style={{ ...card(),padding:mob?16:20,marginBottom:16,border:`1px solid ${C.vi}25`,background:C.viDim }}>
          <div style={{ fontWeight:700,fontSize:14,color:C.t1,marginBottom:8 }}>📦 What you get</div>
          <div style={{ fontSize:13,color:C.t3,lineHeight:1.7 }}>Professional co-branded QR stickers with your business name and the Xhibitur Rewards logo. Weatherproof vinyl — perfect for counters, windows, menus and tables.</div>
        </div>
        <form onSubmit={handleOrder} style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ ...card(true),padding:mob?18:22,border:`2px solid ${C.vi}`,background:C.viDim,borderRadius:14 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
              <div><div style={{ fontSize:16,fontWeight:700,color:C.t1,marginBottom:4 }}>🏷 10 Co-Branded QR Stickers</div><div style={{ fontSize:13,color:C.t3,lineHeight:1.6 }}>Weatherproof vinyl · Gold on Black · Your business name + QR code</div></div>
              <div style={{ textAlign:"right",flexShrink:0 }}><div style={{ fontSize:28,fontWeight:900,color:C.vi,letterSpacing:"-.04em" }}>$29.99</div><div style={{ fontSize:11,color:C.t4 }}>one-time · free shipping</div></div>
            </div>
          </div>
          <div><label style={lbl}>Business name (appears on sticker)</label><input value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="Harlem Cafe" style={si} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
          <div>
            <label style={lbl}>Shipping address</label>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <input value={addr1} onChange={e=>setAddr1(e.target.value)} placeholder="Street address" style={si} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              <input value={addr2} onChange={e=>setAddr2(e.target.value)} placeholder="Apt, suite, unit (optional)" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 80px 100px",gap:8 }}>
                <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" style={si} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                <input value={state} onChange={e=>setState(e.target.value)} placeholder="NY" maxLength={2} style={si} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
                <input value={zip} onChange={e=>setZip(e.target.value)} placeholder="10001" maxLength={5} style={si} required onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
            </div>
          </div>
          {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
          <div style={{ ...card(),padding:16,border:`1px solid ${C.b2}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:13,color:C.t4 }}>10 Co-Branded QR Stickers</span><span style={{ fontSize:13,fontWeight:700,color:C.t1 }}>$29.99</span></div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:13,color:C.t4 }}>Shipping</span><span style={{ fontSize:13,color:C.ok,fontWeight:600 }}>Free</span></div>
            <div style={{ borderTop:`1px solid ${C.b2}`,paddingTop:8,display:"flex",justifyContent:"space-between" }}><span style={{ fontSize:14,fontWeight:700,color:C.t1 }}>Total</span><span style={{ fontSize:16,fontWeight:900,color:C.vi }}>$29.99</span></div>
          </div>
          <button type="submit" disabled={loading} style={{ ...btnP(C.vi,true),fontSize:15,padding:"14px",boxShadow:`0 0 30px ${C.viGlo}`,opacity:loading?.7:1 }}>{loading?"Redirecting to checkout…":"Order 10 stickers — $29.99 →"}</button>
          <p style={{ textAlign:"center",fontSize:12,color:C.t4,margin:0 }}>Free shipping · Delivered in 7-10 business days · Weatherproof vinyl</p>
        </form>
      </div>
    </DashShell>
  );
}

function BroadcastPage() {
  const { user } = useAuth();
  const w=useW(); const mob=w<640;
  const [subject,setSubject]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");
  const bizSlug=user?.name?.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"";
  const bizName=user?.name||"Your Business";
  const si={...inp,background:C.bg3,border:`1px solid ${C.b2}`};
  const send=async()=>{
    if(!subject.trim()){setErr("Please enter a subject line.");return;}
    if(!message.trim()){setErr("Please enter a message.");return;}
    if(message.trim().length<20){setErr("Message is too short. Write at least a sentence.");return;}
    setBusy(true);setErr("");setResult(null);
    try{
      const res=await fetch("/.netlify/functions/send-broadcast",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({businessSlug:bizSlug,businessName:bizName,subject:subject.trim(),message:message.trim(),userEmail:user?.email})});
      const data=await res.json();
      if(data.success){setResult(data);setSubject("");setMessage("");}else setErr(data.error||"Something went wrong. Please try again.");
    }catch(e){setErr("Something went wrong. Please try again.");}
    setBusy(false);
  };
  return (
    <DashShell>
      <PgHead title="Message Members" sub="Send an email broadcast to all your loyalty members."/>
      <div style={{ maxWidth:mob?undefined:580 }}>
        <div style={{ ...card(),padding:mob?14:18,marginBottom:16,border:`1px solid ${C.vi}25`,background:C.viDim }}>
          <div style={{ fontWeight:700,fontSize:14,color:C.t1,marginBottom:6 }}>📣 How this works</div>
          <div style={{ fontSize:13,color:C.t3,lineHeight:1.7 }}>Your message goes to every customer who checked in and saved their email at your loyalty page. Each email is personalized with their current stamp count.</div>
        </div>
        {result && (
          <div style={{ ...card(),padding:mob?16:22,marginBottom:16,border:`1px solid ${C.ok}30`,background:C.ok+"08",textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:10 }}>✅</div>
            <div style={{ fontSize:17,fontWeight:800,color:C.t1,marginBottom:6 }}>Broadcast sent!</div>
            <div style={{ fontSize:14,color:C.t4,marginBottom:4 }}>Delivered to <strong style={{ color:C.ok }}>{result.sent}</strong> of {result.total} members.</div>
            <button onClick={()=>setResult(null)} style={{ ...btnG(),fontSize:13,padding:"9px 20px",marginTop:16 }}>Send another</button>
          </div>
        )}
        {!result && (
          <div style={{ ...card(true),padding:mob?18:24,border:`1px solid ${C.b2}` }}>
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div style={{ background:C.bg4,border:`1px solid ${C.b2}`,borderRadius:8,padding:"10px 14px" }}>
                <div style={{ fontSize:11,fontWeight:700,color:C.t4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:4 }}>From</div>
                <div style={{ fontSize:13,color:C.t3 }}>{bizName} via Xhibitur Rewards &lt;notifications@xhibitur.com&gt;</div>
              </div>
              <div><label style={lbl}>Subject line</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Special offer just for our loyal customers 🎉" style={si} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/></div>
              <div>
                <label style={lbl}>Message</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="e.g. Hey! We're running a buy-one-get-one on all lattes this Friday only." rows={5} style={{ ...si,resize:"vertical",minHeight:120,lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor=C.vi} onBlur={e=>e.target.style.borderColor=C.b2}/>
              </div>
              {err && <div style={{ background:C.err+"15",border:`1px solid ${C.err}30`,borderRadius:8,padding:"10px 13px",color:C.err,fontSize:13 }}>{err}</div>}
              <button onClick={send} disabled={busy} style={{ ...btnP(C.vi,true),fontSize:15,padding:"13px",opacity:busy?.7:1 }}>{busy?"Sending...":"Send to all members →"}</button>
              <p style={{ textAlign:"center",fontSize:12,color:C.t4,margin:0 }}>All emails include an unsubscribe link · CAN-SPAM compliant</p>
            </div>
          </div>
        )}
      </div>
    </DashShell>
  );
}

function AdminPage() {
  const { user } = useAuth();
  const [data,setData] = useState({ users:[], members:[], loading:true });
  const [runningWinback,setRunningWinback] = useState(false);
  const [winbackMsg,setWinbackMsg] = useState("");

  useEffect(()=>{
    if (user?.email !== ADMIN_EMAIL) return;
    fetch("/.netlify/functions/admin-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ adminEmail: user.email }) })
      .then(r=>r.json()).then(d=>{
        if (!d.error) setData({ users:d.users||[], members:d.members||[], loading:false });
        else setData(d=>({...d,loading:false}));
      }).catch(()=>setData(d=>({...d,loading:false})));
  },[user?.email]);

  if (user?.email !== ADMIN_EMAIL) return null;

  const { users, members, loading } = data;
  const now = Date.now();
  const proUsers = users.filter(u=>u.plan==="pro");
  const trialUsers = users.filter(u=>u.plan==="trial");
  const atRisk = members.filter(m=>{ const d=new Date(m.last_visit||m.created_at); return (now-d.getTime())>(45*864e5); });
  const winbackSent = members.filter(m=>m.winback_sent_at);
  const totalStamps = members.reduce((a,m)=>a+(m.stamps||0),0);
  const avgStamps = members.length ? (totalStamps/members.length).toFixed(1) : "0";

  const runWinback = async () => {
    setRunningWinback(true); setWinbackMsg("");
    try {
      const r = await fetch("https://xhibitur-winback-scheduler.james-berry-2e2.workers.dev/run-winback");
      const t = await r.text();
      setWinbackMsg(r.ok ? "✅ Win-back run complete" : `❌ Error: ${t}`);
    } catch(e) { setWinbackMsg(`❌ ${e.message}`); }
    setRunningWinback(false);
  };

  const card2 = (accent) => ({ ...card(), padding:"16px 20px", borderLeft:`3px solid ${accent||C.vi}` });
  const statCard = (icon,label,value,accent) => (
    <div style={card2(accent)}>
      <div style={{ fontSize:20,marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:28,fontWeight:800,color:accent||C.vi,lineHeight:1 }}>{loading?"–":value}</div>
      <div style={{ fontSize:12,color:C.t4,marginTop:4 }}>{label}</div>
    </div>
  );

  return (
    <DashShell>
      <PgHead title="🔧 Admin" sub="Xhibitur Rewards — internal dashboard"/>

      {/* Stat cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:20 }}>
        {statCard("👥","Total Users",users.length,C.vi)}
        {statCard("✅","Pro (Paying)",proUsers.length,"#10b981")}
        {statCard("⏳","On Trial",trialUsers.length,C.am)}
        {statCard("◆","Loyalty Members",members.length,C.cy)}
        {statCard("⚠️","At-Risk (45d+)",atRisk.length,"#ef4444")}
        {statCard("📨","Win-backs Sent",winbackSent.length,C.fu)}
        {statCard("🏷","Avg Stamps",avgStamps,C.vi)}
        {statCard("💰","MRR (est)","$"+(proUsers.length*49.99).toFixed(0),"#10b981")}
      </div>

      {/* Quick links */}
      <div style={{ ...card(),padding:"16px 20px",marginBottom:20 }}>
        <div style={{ fontSize:12,fontWeight:700,color:C.t4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12 }}>Quick Links</div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {[
            { label:"Stripe Dashboard", url:"https://dashboard.stripe.com" },
            { label:"Supabase", url:"https://supabase.com/dashboard" },
            { label:"Netlify", url:"https://app.netlify.com" },
            { label:"Sticker Mule", url:"https://www.stickermule.com" },
            { label:"Cloudflare", url:"https://dash.cloudflare.com" },
          ].map(l=>(
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{ ...btnP(C.vi,true),fontSize:12,padding:"7px 12px",textDecoration:"none",display:"inline-flex",alignItems:"center" }}>{l.label} ↗</a>
          ))}
          <button onClick={runWinback} disabled={runningWinback} style={{ ...btnP(),fontSize:12,padding:"7px 12px",opacity:runningWinback?.6:1 }}>
            {runningWinback?"Running…":"▶ Run Win-back Now"}
          </button>
        </div>
        {winbackMsg && <div style={{ marginTop:10,fontSize:13,color:C.t2 }}>{winbackMsg}</div>}
      </div>

      {/* Recent signups */}
      <div style={{ ...card(),padding:"16px 20px",marginBottom:20 }}>
        <div style={{ fontSize:12,fontWeight:700,color:C.t4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12 }}>Recent Signups</div>
        {loading ? <div style={{ color:C.t4,fontSize:13 }}>Loading…</div> : users.length===0 ? <div style={{ color:C.t4,fontSize:13 }}>No users yet</div> : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {users.slice(0,20).map(u=>(
              <div key={u.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:C.bg3,borderRadius:8,gap:12,flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:C.t1 }}>{u.name||"—"}</div>
                  <div style={{ fontSize:12,color:C.t4 }}>{u.email}</div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <Tag color={u.plan==="pro"?"#10b981":C.am}>{u.plan==="pro"?"Pro":"Trial"}</Tag>
                  <span style={{ fontSize:11,color:C.t4 }}>{u.created_at?new Date(u.created_at).toLocaleDateString():""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* At-risk members */}
      <div style={{ ...card(),padding:"16px 20px",marginBottom:20,borderLeft:`3px solid #ef4444` }}>
        <div style={{ fontSize:12,fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:".08em",marginBottom:12 }}>⚠️ At-Risk Members (45+ days inactive)</div>
        {loading ? <div style={{ color:C.t4,fontSize:13 }}>Loading…</div> : atRisk.length===0 ? <div style={{ color:C.t4,fontSize:13 }}>No at-risk members</div> : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {atRisk.slice(0,30).map(m=>{
              const days = Math.floor((now-new Date(m.last_visit||m.created_at).getTime())/864e5);
              return (
                <div key={m.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:C.bg3,borderRadius:8,gap:12,flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:C.t1 }}>{m.email||"Guest"}</div>
                    <div style={{ fontSize:12,color:C.t4 }}>{m.business_slug}</div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Tag color="#ef4444">{days}d ago</Tag>
                    <span style={{ fontSize:11,color:C.t4 }}>{m.stamps||0} stamps</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All loyalty members */}
      <div style={{ ...card(),padding:"16px 20px",marginBottom:20 }}>
        <div style={{ fontSize:12,fontWeight:700,color:C.t4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12 }}>All Loyalty Members ({members.length})</div>
        {loading ? <div style={{ color:C.t4,fontSize:13 }}>Loading…</div> : members.length===0 ? <div style={{ color:C.t4,fontSize:13 }}>No members yet</div> : (
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {members.slice(0,50).map(m=>{
              const days = Math.floor((now-new Date(m.last_visit||m.created_at).getTime())/864e5);
              return (
                <div key={m.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",background:C.bg3,borderRadius:8,gap:12,flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:500,color:C.t1 }}>{m.email||"Guest"}</div>
                    <div style={{ fontSize:11,color:C.t4 }}>{m.business_slug}</div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Tag color={C.vi}>{m.stamps||0} stamps</Tag>
                    <span style={{ fontSize:11,color:days>45?"#ef4444":C.t4 }}>{days}d ago</span>
                    {m.winback_sent_at && <Tag color={C.fu}>wb sent</Tag>}
                  </div>
                </div>
              );
            })}
            {members.length>50 && <div style={{ fontSize:12,color:C.t4,textAlign:"center",paddingTop:8 }}>Showing 50 of {members.length} members</div>}
          </div>
        )}
      </div>
    </DashShell>
  );
}

const PROTECTED=["dashboard","dashboard/qr","dashboard/rewards","dashboard/analytics","dashboard/account","dashboard/stickers","dashboard/broadcast","dashboard/admin"];

function AppCore() {
  const { user,loading } = useAuth(); const { page,nav } = useNav();
  const [programs,setPrograms] = useState([]);

  useEffect(()=>{
    if (!user?.email) return;
    fetch("/.netlify/functions/program-data", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"load", userEmail:user.email }) })
      .then(r=>r.json()).then(d=>{ if(d.programs) setPrograms(d.programs); });
  },[user?.email]);

  useEffect(()=>{
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

  if (page.startsWith("checkin")) return <CheckInPage/>;
  if (window.location.hash.includes("access_token")&&window.location.hash.includes("type=recovery")) return <ResetPassword/>;

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
    "dashboard/broadcast":<BroadcastPage/>,
    "dashboard/admin": user?.email===ADMIN_EMAIL ? <AdminPage/> : <Landing/>,
  };
  return (
    <ProgramsCtx.Provider value={programs}>
      {views[page] || <Landing/>}
    </ProgramsCtx.Provider>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error:null }; }
  static getDerivedStateFromError(err) { return { error:err }; }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
        <div style={{ maxWidth:480,textAlign:"center" }}>
          <div style={{ fontSize:40,marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:20,fontWeight:700,color:"#fff",marginBottom:12 }}>Something went wrong</div>
          <div style={{ fontSize:13,color:"#666",marginBottom:24,background:"#111",padding:"12px 16px",borderRadius:10,textAlign:"left",fontFamily:"monospace",wordBreak:"break-all" }}>{this.state.error?.message||"Unknown error"}</div>
          <button onClick={()=>{ this.setState({error:null}); window.location.hash="#/dashboard"; }} style={{ background:"#d4a017",color:"#000",border:"none",borderRadius:10,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer" }}>Go back to dashboard</button>
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
