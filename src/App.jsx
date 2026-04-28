import { useState, useEffect, useRef } from "react";

// ─── DEPTH COLOR INTERPOLATION ────────────────────────────────────────
const STOPS = [
  { p: 0.00, c: [255, 200, 140] },
  { p: 0.04, c: [135, 206, 235] },
  { p: 0.10, c: [120, 200, 230] },
  { p: 0.13, c: [79, 195, 247] },
  { p: 0.30, c: [0, 172, 193] },
  { p: 0.50, c: [0, 90, 110] },
  { p: 0.70, c: [0, 40, 58] },
  { p: 0.85, c: [0, 18, 28] },
  { p: 1.00, c: [0, 3, 8] },
];
const lerp = (a, b, t) => a + (b - a) * t;
function depthRGB(p) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (p >= STOPS[i].p && p <= STOPS[i + 1].p) {
      const t = (p - STOPS[i].p) / (STOPS[i + 1].p - STOPS[i].p);
      return [
        Math.round(lerp(STOPS[i].c[0], STOPS[i + 1].c[0], t)),
        Math.round(lerp(STOPS[i].c[1], STOPS[i + 1].c[1], t)),
        Math.round(lerp(STOPS[i].c[2], STOPS[i + 1].c[2], t)),
      ];
    }
  }
  return STOPS[STOPS.length - 1].c;
}

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSeen(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, seen];
}

// ─── BUBBLE FIELD ─────────────────────────────────────────────────────
function BubbleField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const bubbles = Array.from({ length: 90 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      r: Math.random() * 5 + 1,
      vy: -(Math.random() * 1.2 + 0.4),
      seed: Math.random() * 100,
      o: Math.random() * 0.4 + 0.15,
    }));

    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, W(), H());
      const docH = document.documentElement.scrollHeight - H();
      const depth = docH > 0 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
      const intensity = Math.min(1, depth * 1.4 + 0.05);

      bubbles.forEach((b) => {
        b.y += b.vy * (0.5 + intensity);
        b.x += Math.sin((b.y + b.seed) * 0.012) * 0.6;
        if (b.y < -10) { b.y = H() + 10; b.x = Math.random() * W(); }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.o * intensity * 0.4})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${b.o * intensity})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 3 }} />;
}

function Caustics({ depth }) {
  const opacity = Math.max(0, 0.5 - Math.abs(depth - 0.25) * 1.5);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
      opacity, mixBlendMode: "soft-light",
      background: "radial-gradient(ellipse 800px 400px at 30% 0%, rgba(255,255,255,0.6), transparent 60%), radial-gradient(ellipse 600px 300px at 70% 0%, rgba(255,255,255,0.4), transparent 60%)",
      animation: "causticShift 8s ease-in-out infinite alternate",
    }} />
  );
}

function DepthMeter({ depth }) {
  const meters = Math.round(depth * 1500);
  return (
    <div style={{
      position: "fixed", right: 24, top: "50%", transform: "translateY(-50%)",
      zIndex: 60, color: "white", fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9, letterSpacing: "0.25em", textAlign: "right",
      mixBlendMode: "difference", pointerEvents: "none",
    }}>
      <div style={{ marginBottom: 6, opacity: 0.55 }}>DEPTH</div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
        {String(meters).padStart(4, "0")}m
      </div>
      <div style={{ width: 2, height: 220, background: "rgba(255,255,255,0.2)", marginTop: 14, marginLeft: "auto", position: "relative" }}>
        <div style={{
          position: "absolute", left: -3, top: `${depth * 100}%`,
          width: 8, height: 8, background: "#00E5FF", borderRadius: "50%",
          boxShadow: "0 0 12px #00E5FF, 0 0 24px #00E5FF", transform: "translateY(-50%)",
        }} />
      </div>
      <div style={{ marginTop: 10, fontSize: 8, opacity: 0.5 }}>
        {depth < 0.13 ? "SURFACE" : depth < 0.4 ? "EUPHOTIC" : depth < 0.7 ? "MESOPELAGIC" : depth < 0.9 ? "BATHYPELAGIC" : "ABYSS"}
      </div>
    </div>
  );
}

function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
    const move = (e) => {
      if (dot.current) { dot.current.style.left = e.clientX + "px"; dot.current.style.top = e.clientY + "px"; }
      if (ring.current) { ring.current.style.left = e.clientX + "px"; ring.current.style.top = e.clientY + "px"; }
    };
    const click = (e) => {
      const r = document.createElement("div");
      r.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:10px;height:10px;border:2px solid #00E5FF;border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);animation:rippleOut 0.8s ease-out forwards;`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 800);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("click", click); };
  }, []);
  return (
    <>
      <div ref={dot} className="desktop-only" style={{
        position: "fixed", width: 6, height: 6, background: "#00E5FF",
        borderRadius: "50%", pointerEvents: "none", zIndex: 9999,
        transform: "translate(-50%,-50%)", boxShadow: "0 0 8px #00E5FF",
        mixBlendMode: "screen",
      }} />
      <div ref={ring} className="desktop-only" style={{
        position: "fixed", width: 32, height: 32, border: "1px solid rgba(0,229,255,0.5)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 9999,
        transform: "translate(-50%,-50%)",
      }} />
    </>
  );
}

function Jellyfish({ y, delay }) {
  return (
    <div style={{
      position: "absolute", top: y, left: 0, width: "100%", height: 60,
      pointerEvents: "none", zIndex: 4,
      animation: `swimAcross 30s linear ${delay}s infinite`,
    }}>
      <svg width="50" height="80" viewBox="0 0 50 80" style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.6))" }}>
        <ellipse cx="25" cy="20" rx="20" ry="16" fill="rgba(0,229,255,0.25)" stroke="rgba(0,229,255,0.5)" strokeWidth="1">
          <animate attributeName="ry" values="16;13;16" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <path d="M10,30 Q12,55 8,75 M18,32 Q16,60 14,78 M25,33 Q25,62 25,78 M32,32 Q34,60 36,78 M40,30 Q38,55 42,75"
          stroke="rgba(0,229,255,0.4)" strokeWidth="1" fill="none">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}

function ProductCard({ p, idx, seen }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)",
        aspectRatio: "3/4", overflow: "hidden",
        opacity: seen ? 1 : 0,
        transform: seen ? `translateY(0) rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)` : "translateY(60px)",
        transition: `opacity 0.9s ${idx * 0.15}s, transform 0.9s ${idx * 0.15}s`,
        animation: seen ? `floatSway 6s ease-in-out ${idx * 0.5}s infinite alternate` : "none",
      }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          fontFamily: "'Anton', sans-serif", fontSize: "clamp(60px, 11vw, 130px)",
          color: hov ? "rgba(0,229,255,0.3)" : "rgba(255,255,255,0.06)",
          letterSpacing: "0.02em", lineHeight: 0.85, textAlign: "center",
          transition: "color 0.4s, transform 0.6s",
          transform: hov ? "scale(1.08)" : "scale(1)",
          textShadow: hov ? "0 0 40px rgba(0,229,255,0.5)" : "none",
        }}>
          {p.name}
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: 22,
        background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.25em", color: "#00E5FF", marginBottom: 6 }}>
          {p.tag}
        </div>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 30, color: "white", letterSpacing: "0.03em" }}>{p.name}</div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)",
        }}>
          <span>{p.price}</span>
          <span style={{ color: p.stock === "SOLD OUT" ? "#ff4444" : "#00E5FF" }}>● {p.stock}</span>
        </div>
      </div>
      <div style={{
        position: "absolute", top: 16, right: 16,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.15)",
        padding: "4px 8px", background: "rgba(0,0,0,0.4)",
      }}>#{p.id}</div>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: hov ? "radial-gradient(circle at 50% 50%, rgba(0,229,255,0.15), transparent 70%)" : "transparent",
        transition: "background 0.4s",
      }} />
    </div>
  );
}

function OceanFloor() {
  return (
    <div style={{ position:"relative", width:"100%", minHeight:"90vh", background:"#000", overflow:"hidden" }}>
      {/* Underwater bg photo */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:"url(https://images.unsplash.com/photo-1464925257126-6450e871c667?w=1920&q=85&auto=format&fit=crop)",
        backgroundSize:"cover", backgroundPosition:"center",
        opacity:0.32, filter:"brightness(0.4) contrast(1.2) saturate(0.55)",
      }} />
      {/* Dark gradient overlays */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.28) 30%,rgba(0,0,0,.5) 65%,rgba(0,0,0,.96) 100%)" }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"40%", background:"radial-gradient(ellipse 1000px 500px at 50% 0%,rgba(0,229,255,.06),transparent 70%)" }} />

      {/* Warm gold glow from chest */}
      <div style={{
        position:"absolute", left:"50%", bottom:"4%", transform:"translateX(-50%)",
        width:"min(900px,95vw)", height:"58vh",
        background:"radial-gradient(ellipse at center 78%,rgba(255,162,60,.42),rgba(255,120,40,.14) 30%,transparent 65%)",
        filter:"blur(55px)", pointerEvents:"none", zIndex:2,
      }} />

      {/* Scattered coins */}
      <svg style={{ position:"absolute", left:0, bottom:0, width:"100%", height:"28%", zIndex:2, pointerEvents:"none" }} viewBox="0 0 1440 300" preserveAspectRatio="none">
        <defs>
          <radialGradient id="gc" cx=".35" cy=".3">
            <stop offset="0%" stopColor="#fff5b8"/><stop offset="50%" stopColor="#ffd966"/><stop offset="100%" stopColor="#7a4a08"/>
          </radialGradient>
        </defs>
        {[[155,242],[188,254],[130,260],[218,270],[1182,242],[1224,256],[1262,247],[1292,268],[318,278],[1088,282],[420,290],[950,285],[600,275],[800,265]].map(([cx,cy],i)=>(
          <ellipse key={i} cx={cx} cy={cy} rx={i%3===0?14:12} ry={3.8} fill="url(#gc)" />
        ))}
      </svg>

      {/* Sword half-sunk */}
      <svg style={{ position:"absolute", left:"10%", bottom:"12%", width:"min(100px,10vw)", height:"auto", zIndex:2, filter:"drop-shadow(0 6px 14px rgba(0,0,0,.75))" }} viewBox="0 0 100 280">
        <defs>
          <linearGradient id="bl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22292f"/><stop offset="50%" stopColor="#8a939c"/><stop offset="100%" stopColor="#22292f"/>
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="178" rx="30" ry="5" fill="rgba(32,18,8,.9)"/>
        <path d="M30 176 Q50 167 70 176 L70 182 L30 182Z" fill="rgba(55,35,18,.65)"/>
        <polygon points="44,18 50,8 56,18 56,178 50,180 44,178" fill="url(#bl)" stroke="#0a0a0a" strokeWidth=".4"/>
        <line x1="50" y1="20" x2="50" y2="176" stroke="rgba(255,255,255,.32)" strokeWidth=".6"/>
        <rect x="34" y="14" width="32" height="6" fill="#362616" rx="1"/>
        <rect x="46" y="0" width="8" height="14" fill="#1a0e05"/>
        <circle cx="50" cy="0" r="3.5" fill="#2a1810"/>
      </svg>

      {/* Treasure chest photo */}
      <div style={{
        position:"absolute", left:"50%", bottom:0, transform:"translateX(-50%)",
        width:"min(680px,76vw)", height:"min(460px,54vh)",
        backgroundImage:"url(https://images.unsplash.com/photo-1632809199725-72a4245e846b?w=1600&q=85&auto=format&fit=crop)",
        backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundPosition:"center bottom",
        filter:"brightness(.88) contrast(1.1) saturate(1.05)", zIndex:3,
      }}/>

      {/* CHARACTER IMAGE — sitting on chest, dark bg blended out with screen mode */}
      <img
        src="/character.png"
        alt=""
        style={{
          position:"absolute",
          left:"50%",
          bottom:"calc(min(460px, 54vh) - 95px)",
          transform:"translateX(-50%)",
          width:"min(340px, 36vw)",
          height:"auto",
          zIndex:5,
          mixBlendMode:"screen",
          filter:"brightness(1.05) contrast(1.1) saturate(0.9)",
          pointerEvents:"none",
        }}
      />

      {/* Edge vignette */}
      <div style={{ position:"absolute", inset:0, boxShadow:"inset 0 0 240px 90px #000", pointerEvents:"none", zIndex:8 }}/>
    </div>
  );
}

function WaterSurface() {
  return (
    <svg viewBox="0 0 1440 140" preserveAspectRatio="none" style={{
      position: "absolute", bottom: -1, left: 0, width: "100%", height: 140, zIndex: 5,
    }}>
      <defs>
        <linearGradient id="wsg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="40%" stopColor="rgba(79,195,247,0.85)" />
          <stop offset="100%" stopColor="#4FC3F7" />
        </linearGradient>
      </defs>
      <path fill="url(#wsg)" opacity="0.6">
        <animate attributeName="d" dur="7s" repeatCount="indefinite"
          values="M0,40 Q360,90 720,50 T1440,55 L1440,140 L0,140 Z;
                  M0,55 Q360,30 720,70 T1440,40 L1440,140 L0,140 Z;
                  M0,40 Q360,90 720,50 T1440,55 L1440,140 L0,140 Z" />
      </path>
      <path fill="#4FC3F7">
        <animate attributeName="d" dur="5s" repeatCount="indefinite"
          values="M0,75 Q360,55 720,80 T1440,70 L1440,140 L0,140 Z;
                  M0,70 Q360,90 720,60 T1440,85 L1440,140 L0,140 Z;
                  M0,75 Q360,55 720,80 T1440,70 L1440,140 L0,140 Z" />
      </path>
    </svg>
  );
}

const PRODUCTS = [
  { id: "001", name: "TIDAL", tag: "OVERSIZED HOODIE", price: "$180", stock: "IN STOCK" },
  { id: "002", name: "ABYSS", tag: "GRAPHIC TEE", price: "$75", stock: "IN STOCK" },
  { id: "003", name: "DEPTH", tag: "CARGO PANTS", price: "$220", stock: "LOW STOCK" },
  { id: "004", name: "PRESSURE", tag: "WORK JACKET", price: "$340", stock: "SOLD OUT" },
];

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [winH, setWinH] = useState(typeof window !== "undefined" ? window.innerHeight : 800);
  const [docH, setDocH] = useState(8000);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [, setTick] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onResize = () => { setWinH(window.innerHeight); setDocH(document.documentElement.scrollHeight); };
    const onMouse = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      clearInterval(id);
    };
  }, []);

  const depth = docH > winH ? Math.min(1, Math.max(0, scrollY / (docH - winH))) : 0;
  const [r, g, b] = depthRGB(depth);
  const navScrolled = scrollY > 80;

  const [dropRef, dropSeen] = useReveal(0.1);
  const [manRef, manSeen] = useReveal(0.2);
  const [featRef, featSeen] = useReveal(0.15);
  const [floorRef, floorSeen] = useReveal(0.05);

  const dropDate = new Date("2026-06-15T00:00:00");
  const diff = Math.max(0, dropDate - new Date());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes floatSway { 0% { transform: translateY(0) rotate(-0.5deg); } 100% { transform: translateY(-10px) rotate(0.5deg); } }
        @keyframes swimAcross { from { transform: translateX(-100px); } to { transform: translateX(calc(100vw + 100px)); } }
        @keyframes bobble { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes rippleOut { from { width: 10px; height: 10px; opacity: 1; } to { width: 120px; height: 120px; opacity: 0; } }
        @keyframes causticShift { from { transform: translateX(-3%) scale(1); } to { transform: translateX(3%) scale(1.05); } }
        @keyframes dripFall { 0% { transform: translateY(-4px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }
        @keyframes glow { 0%, 100% { text-shadow: 0 0 20px rgba(0,229,255,0.5), 0 0 40px rgba(0,229,255,0.3); } 50% { text-shadow: 0 0 30px rgba(0,229,255,0.8), 0 0 60px rgba(0,229,255,0.5); } }
        @keyframes scrollHint { 0% { transform: translateY(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }

        .nav-link { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.25em; color: rgba(255,255,255,0.6); text-decoration: none; position: relative; transition: color 0.2s; }
        .nav-link:hover { color: #00E5FF; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: #00E5FF; transition: width 0.3s; }
        .nav-link:hover::after { width: 100%; }

        .btn-cyan { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.25em; padding: 14px 32px; background: #00E5FF; color: #000; border: none; cursor: pointer; transition: all 0.2s; font-weight: 700; }
        .btn-cyan:hover { background: white; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,229,255,0.5); }
        .btn-ghost-cyan { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.25em; padding: 14px 32px; background: transparent; color: #00E5FF; border: 1px solid #00E5FF; cursor: pointer; transition: all 0.2s; }
        .btn-ghost-cyan:hover { background: rgba(0,229,255,0.1); transform: translateY(-2px); }

        .ticker-track { animation: ticker 30s linear infinite; white-space: nowrap; display: inline-flex; }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .products-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .featured-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-title { font-size: clamp(80px, 26vw, 140px) !important; }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: -1,
        background: `linear-gradient(180deg, rgb(${r},${g},${b}) 0%, rgb(${Math.max(0, r - 20)},${Math.max(0, g - 20)},${Math.max(0, b - 20)}) 100%)`,
      }} />

      <Caustics depth={depth} />
      <BubbleField />
      <DepthMeter depth={depth} />
      <CustomCursor />

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: navScrolled ? "12px 32px" : "20px 32px",
        background: navScrolled ? "rgba(0,0,0,0.5)" : "transparent",
        backdropFilter: navScrolled ? "blur(14px)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "all 0.4s",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{
          fontFamily: "'Anton', sans-serif", fontSize: 26, color: "white", letterSpacing: "0.05em",
          textShadow: "0 0 20px rgba(0,229,255,0.5)",
        }}>
          DRENCHED<span style={{ color: "#00E5FF" }}>.</span>
        </div>
        <div className="desktop-only" style={{ display: "flex", gap: 36 }}>
          {["DROP 001", "MANIFESTO", "STORY", "CONTACT"].map((n) => (
            <a key={n} href={`#${n.replace(" ", "-").toLowerCase()}`} className="nav-link">{n}</a>
          ))}
        </div>
        <button className="btn-cyan" style={{ padding: "10px 20px", fontSize: 9 }}>SHOP ↗</button>
      </nav>

      {/* HERO */}
      <section style={{ height: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,240,200,0.9), rgba(255,200,140,0.4) 50%, transparent 70%)",
          right: "10%", top: "12%",
          transform: `translateY(${scrollY * 0.4}px) translate(${mouse.x * 20}px, ${mouse.y * 20}px)`,
          filter: "blur(8px)",
        }} />
        <div style={{ position: "absolute", left: "5%", top: "20%", color: "rgba(255,255,255,0.4)", fontSize: 80,
          transform: `translateX(${scrollY * -0.2}px)`, filter: "blur(2px)",
        }}>☁</div>
        <div style={{ position: "absolute", right: "20%", top: "40%", color: "rgba(255,255,255,0.3)", fontSize: 60,
          transform: `translateX(${scrollY * -0.3}px)`, filter: "blur(1px)",
        }}>☁</div>

        <div style={{
          position: "absolute", top: 100, left: "50%", transform: "translateX(-50%)",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.5em",
          color: "rgba(255,255,255,0.7)", animation: "fadeUp 0.8s 0.1s both",
        }}>
          EST. 2026 — TEL AVIV × NYC
        </div>

        <div style={{ textAlign: "center", zIndex: 5, padding: "0 24px" }}>
          <h1 className="hero-title" style={{
            fontFamily: "'Anton', sans-serif", fontSize: "clamp(110px, 22vw, 280px)",
            color: "white", letterSpacing: "-0.01em", lineHeight: 0.85,
            textShadow: "0 4px 30px rgba(0,0,0,0.3)",
            animation: "fadeUp 1s 0.2s both", position: "relative",
          }}>
            DRENCHED
            <span style={{ position: "absolute", left: 0, right: 0, bottom: -10, display: "flex", justifyContent: "space-around", pointerEvents: "none" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  background: "rgba(255,255,255,0.7)",
                  animation: `dripFall ${2 + i * 0.3}s ease-in ${i * 0.4}s infinite`,
                }} />
              ))}
            </span>
          </h1>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "clamp(16px, 3vw, 24px)",
            color: "rgba(255,255,255,0.85)", letterSpacing: "0.4em", marginTop: 24,
            animation: "fadeUp 1s 0.5s both",
          }}>
            DRENCHED <span style={{ fontStyle: "italic", color: "#00E5FF" }}>in</span> DRIP
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 50, animation: "fadeUp 1s 0.8s both", flexWrap: "wrap" }}>
            <button className="btn-cyan">DIVE IN ↓</button>
            <button className="btn-ghost-cyan" style={{ color: "white", borderColor: "white" }}>WATCH FILM</button>
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 200, left: "50%", transform: "translateX(-50%)",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.6)", textAlign: "center",
        }}>
          <div style={{ marginBottom: 12 }}>SCROLL TO DESCEND</div>
          <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.4)", margin: "0 auto", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", width: 1, height: 20, background: "white", animation: "scrollHint 2s ease-in-out infinite" }} />
          </div>
        </div>

        <WaterSurface />
      </section>

      {/* TICKER */}
      <div style={{ background: "#00E5FF", padding: "12px 0", overflow: "hidden", position: "relative", zIndex: 6 }}>
        <div className="ticker-track">
          {Array(10).fill(["DRENCHED", "IN DRIP", "DROP 001 — TIDE", "GET WET", "SUBMERGED.", "TEL AVIV", "× NYC", "EST. 2026"]).flat().map((t, i) => (
            <span key={i} style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, letterSpacing: "0.3em", color: "#000", padding: "0 26px" }}>
              {t} <span style={{ opacity: 0.5 }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* PLUNGE */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px", overflow: "hidden" }}>
        <div style={{ textAlign: "center", maxWidth: 900, zIndex: 5, position: "relative" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.4em", color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>
            — 0050 m / DEPTH ZONE 01 —
          </div>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(60px, 13vw, 180px)", color: "white", lineHeight: 0.85, letterSpacing: "-0.01em" }}>
            PLUNGE.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", maxWidth: 600, margin: "30px auto 0", lineHeight: 1.7 }}>
            Most brands let you sample the drip. We push you in head first. The deeper you go, the wetter you get.
          </p>
        </div>
        <Jellyfish y="20%" delay="0" />
      </section>

      {/* DROP 001 */}
      <section ref={dropRef} id="drop-001" style={{ minHeight: "120vh", padding: "140px 32px", position: "relative", zIndex: 6 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 64,
            opacity: dropSeen ? 1 : 0, transform: dropSeen ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s, transform 0.8s", flexWrap: "wrap", gap: 24,
          }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.4em", color: "#00E5FF", marginBottom: 14 }}>
                DROP 001 / TIDE — 0150 m
              </div>
              <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(54px, 9vw, 110px)", color: "white", lineHeight: 0.88, letterSpacing: "-0.005em" }}>
                FIRST<br />WAVE
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                NEXT DROP IN
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 38, color: "white", letterSpacing: "0.08em" }}>
                {String(days).padStart(2, "0")}<span style={{ color: "#00E5FF" }}>:</span>{String(hours).padStart(2, "0")}<span style={{ color: "#00E5FF" }}>:</span>{String(mins).padStart(2, "0")}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                D : H : M
              </div>
            </div>
          </div>

          <div className="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {PRODUCTS.map((p, i) => <ProductCard key={p.id} p={p} idx={i} seen={dropSeen} />)}
          </div>

          <div style={{ marginTop: 56, textAlign: "center", opacity: dropSeen ? 1 : 0, transition: "opacity 1s 0.8s" }}>
            <button className="btn-ghost-cyan" style={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}>VIEW ALL — 12 PIECES →</button>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section ref={manRef} id="manifesto" style={{
        minHeight: "100vh", padding: "140px 32px", position: "relative", zIndex: 6,
        display: "flex", alignItems: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Anton', sans-serif", fontSize: "clamp(180px, 32vw, 400px)",
          color: "rgba(255,255,255,0.025)", whiteSpace: "nowrap", pointerEvents: "none",
          letterSpacing: "-0.04em",
        }}>
          DRENCHED
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 2, width: "100%" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.4em", color: "#00E5FF", marginBottom: 56,
            opacity: manSeen ? 1 : 0, transform: manSeen ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s, transform 0.6s",
          }}>
            THE MANIFESTO — 0500 m
          </div>

          {[
            "They dripped.",
            "We DRENCHED.",
            "There's a difference between wearing fits",
            "and being fully submerged in them.",
            "Welcome to the deep end.",
          ].map((line, i) => (
            <div key={i} style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: i === 1 ? "clamp(60px, 11vw, 130px)" : "clamp(32px, 6vw, 64px)",
              color: i === 1 ? "#00E5FF" : "white",
              lineHeight: 1.05, letterSpacing: "-0.005em", marginBottom: 18,
              opacity: manSeen ? 1 : 0, transform: manSeen ? "translateY(0)" : "translateY(40px)",
              transition: `opacity 0.9s ${0.15 + i * 0.18}s, transform 0.9s ${0.15 + i * 0.18}s`,
              animation: i === 1 && manSeen ? "glow 3s ease-in-out infinite" : "none",
              textShadow: i === 1 ? "0 0 30px rgba(0,229,255,0.5)" : "none",
            }}>
              {line}
            </div>
          ))}

          <div style={{
            marginTop: 56, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.4)", opacity: manSeen ? 1 : 0, transition: "opacity 1s 1.5s",
          }}>
            — D × D / 2026
          </div>
        </div>
        <Jellyfish y="60%" delay="6" />
      </section>

      {/* FEATURED */}
      <section ref={featRef} style={{
        minHeight: "90vh", padding: "140px 32px", position: "relative", zIndex: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div className="featured-grid" style={{
          maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
        }}>
          <div style={{
            opacity: featSeen ? 1 : 0, transform: featSeen ? "translateX(0)" : "translateX(-40px)",
            transition: "opacity 0.9s, transform 0.9s",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.4em", color: "#00E5FF", marginBottom: 18 }}>
              FEATURED — 0900 m
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(48px, 7vw, 90px)", color: "white", lineHeight: 0.9, marginBottom: 24, letterSpacing: "-0.005em" }}>
              THE<br />ABYSS<br />HOODIE
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.9, marginBottom: 40, fontWeight: 300 }}>
              500 GSM heavyweight French terry. Tonal embroidery. Reflective tape that lights up like bioluminescence under flash. Limited to 200 numbered pieces — once they're gone, they're at the bottom.
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn-cyan">$420 — COP IT</button>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#ff5566" }}>
                ⬤ 47 / 200 LEFT
              </div>
            </div>
          </div>

          <div style={{
            opacity: featSeen ? 1 : 0, transform: featSeen ? "translateX(0)" : "translateX(40px)",
            transition: "opacity 0.9s 0.2s, transform 0.9s 0.2s", position: "relative",
          }}>
            <div style={{
              aspectRatio: "3/4",
              background: "linear-gradient(135deg, rgba(0,30,40,0.6), rgba(0,10,20,0.9))",
              border: "1px solid rgba(0,229,255,0.2)",
              position: "relative", overflow: "hidden",
              animation: "bobble 4s ease-in-out infinite",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.18), transparent 60%)" }} />
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Anton', sans-serif", fontSize: "clamp(70px, 13vw, 150px)",
                color: "rgba(0,229,255,0.18)", lineHeight: 0.85, textAlign: "center",
                animation: "glow 4s ease-in-out infinite",
              }}>
                ABYSS
              </div>
              <div style={{ position: "absolute", top: 18, left: 18, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "#00E5FF" }}>
                #001 / 200
              </div>
              <div style={{ position: "absolute", bottom: 18, right: 18, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}>
                LIMITED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OCEAN FLOOR */}
      <section ref={floorRef} style={{ minHeight: "120vh", padding: "120px 0 0", position: "relative", zIndex: 6 }}>
        <div style={{ textAlign: "center", marginBottom: 60, padding: "0 24px" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.4em", color: "#00E5FF", marginBottom: 24,
            opacity: floorSeen ? 1 : 0, transition: "opacity 0.8s",
          }}>
            — 1500 m / THE FLOOR —
          </div>
          <h2 style={{
            fontFamily: "'Anton', sans-serif", fontSize: "clamp(50px, 10vw, 130px)", color: "white", lineHeight: 0.85, letterSpacing: "-0.01em",
            opacity: floorSeen ? 1 : 0, transform: floorSeen ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.9s 0.1s, transform 0.9s 0.1s",
          }}>
            WE LIVE<br />DOWN<span style={{ color: "#00E5FF" }}>HERE.</span>
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: 16, color: "rgba(255,255,255,0.6)",
            maxWidth: 540, margin: "30px auto 0", lineHeight: 1.7,
            opacity: floorSeen ? 1 : 0, transition: "opacity 0.9s 0.4s",
          }}>
            Where it's cold. Where it's quiet. Where the only thing that glows is what we made.
          </p>
        </div>

        <div style={{ position: "relative", marginTop: 40 }}>
          <OceanFloor />
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" style={{
        background: "#000308", padding: "100px 32px 40px",
        borderTop: "1px solid rgba(0,229,255,0.15)", position: "relative", zIndex: 7,
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.4em", color: "#00E5FF", marginBottom: 18 }}>
              GET ON THE LIST
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(40px, 7vw, 80px)", color: "white", lineHeight: 0.9, marginBottom: 30 }}>
              FIRST WAVE.<br />FIRST DIPS.
            </h3>
            <div style={{ display: "flex", gap: 8, maxWidth: 480, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
              <input type="email" placeholder="your@email.com"
                style={{
                  flex: 1, minWidth: 240, padding: "14px 18px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.15)", color: "white",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: "none",
                }} />
              <button className="btn-cyan">SUBMERGE ↓</button>
            </div>
          </div>

          <div className="footer-grid" style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 56, marginBottom: 56,
          }}>
            <div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 50, color: "white", marginBottom: 16, letterSpacing: "0.03em" }}>
                DRENCHED<span style={{ color: "#00E5FF" }}>.</span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 280 }}>
                Streetwear soaked in Mediterranean salt and New York concrete. Made for those who don't sip drip — they swim in it.
              </p>
            </div>
            {[
              { title: "SHOP", links: ["All", "Drop 001 — Tide", "Lookbook", "Gift Cards"] },
              { title: "BRAND", links: ["About", "Manifesto", "Stockists", "Press"] },
              { title: "SOCIAL", links: ["Instagram ↗", "TikTok ↗", "Discord ↗", "hello@drenched.co"] },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.4em", color: "#00E5FF", marginBottom: 24 }}>
                  {col.title}
                </div>
                {col.links.map((l) => (
                  <a key={l} href="#" style={{
                    display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 10,
                    transition: "color 0.2s",
                  }}
                    onMouseEnter={(e) => (e.target.style.color = "#00E5FF")}
                    onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.5)")}>
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div style={{
            paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18,
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em" }}>
              © 2026 DRENCHED. ALL RIGHTS RESERVED.
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em" }}>
              DRENCHED IN DRIP — TLV × NYC
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
