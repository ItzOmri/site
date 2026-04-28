import { useState, useEffect, useRef } from "react";

// ── helpers ───────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const cl = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// Background: pure white → cool grey → water teal → deep blue → black
const BG = [
  [0.00, [255, 255, 255]],
  [0.22, [228, 230, 232]],
  [0.42, [95, 158, 190]],
  [0.62, [12, 60, 100]],
  [0.82, [2, 12, 26]],
  [1.00, [0, 0, 0]],
];
function bgRGB(p) {
  for (let i = 0; i < BG.length - 1; i++) {
    const [p0, c0] = BG[i], [p1, c1] = BG[i + 1];
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0);
      return c0.map((a, j) => Math.round(lerp(a, c1[j], t)));
    }
  }
  return [0, 0, 0];
}
// Foreground: dark (#1e1e1e) on white → white on dark
function foreRGB(depth) {
  const t = cl(depth / 0.28);
  return `rgb(${Math.round(lerp(30, 255, t))},${Math.round(lerp(30, 255, t))},${Math.round(lerp(30, 255, t))})`;
}
// Drip: grey (#707070) → white
function dripColor(depth) {
  const t = cl((depth - 0.14) / 0.28);
  const v = Math.round(lerp(100, 255, t));
  return `rgb(${v},${v},${v})`;
}

// ── film grain ────────────────────────────────────────────────────────
function FilmGrain() {
  return (
    <svg style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none", opacity: 0.065, mixBlendMode: "overlay", width: "100vw", height: "100vh" }}>
      <filter id="grain">
        <feTurbulence baseFrequency="2.5" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

// ── bubbles (only shows when deep) ───────────────────────────────────
function BubbleField({ depth }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = () => window.innerWidth, H = () => window.innerHeight;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = W() * dpr; canvas.height = H() * dpr;
      canvas.style.width = W() + "px"; canvas.style.height = H() + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    const bs = Array.from({ length: 55 }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      r: Math.random() * 4 + 1, vy: -(Math.random() * 1 + 0.3),
      seed: Math.random() * 100, o: Math.random() * 0.4 + 0.15,
    }));
    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, W(), H());
      const intensity = cl((depth - 0.4) / 0.25);
      if (intensity > 0) {
        bs.forEach(b => {
          b.y += b.vy * (0.5 + intensity);
          b.x += Math.sin((b.y + b.seed) * 0.012) * 0.5;
          if (b.y < -10) { b.y = H() + 10; b.x = Math.random() * W(); }
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${b.o * intensity * 0.3})`; ctx.fill();
          ctx.strokeStyle = `rgba(255,255,255,${b.o * intensity * 0.85})`; ctx.lineWidth = 0.7; ctx.stroke();
        });
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [depth]);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 3 }} />;
}

// ── custom cursor (desktop) ───────────────────────────────────────────
function CustomCursor() {
  const dot = useRef(null), ring = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(max-width:768px)").matches) return;
    const mv = e => {
      [dot, ring].forEach(r => { if (r.current) { r.current.style.left = e.clientX + "px"; r.current.style.top = e.clientY + "px"; } });
    };
    const cl = e => {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:10px;height:10px;border:2px solid #00E5FF;border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);animation:rippleOut 0.8s ease-out forwards;`;
      document.body.appendChild(el); setTimeout(() => el.remove(), 800);
    };
    window.addEventListener("mousemove", mv); window.addEventListener("click", cl);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("click", cl); };
  }, []);
  return (
    <>
      <div ref={dot} style={{ position: "fixed", width: 6, height: 6, background: "#00E5FF", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, transform: "translate(-50%,-50%)", boxShadow: "0 0 8px #00E5FF", mixBlendMode: "screen" }} />
      <div ref={ring} style={{ position: "fixed", width: 32, height: 32, border: "1px solid rgba(0,229,255,0.5)", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, transform: "translate(-50%,-50%)" }} />
    </>
  );
}

// ── depth meter ───────────────────────────────────────────────────────
function DepthMeter({ depth }) {
  const m = Math.round(depth * 1500);
  return (
    <div style={{
      position: "fixed", right: 22, top: "50%", transform: "translateY(-50%)",
      zIndex: 60, fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
      letterSpacing: "0.25em", textAlign: "right", mixBlendMode: "difference",
      color: "white", pointerEvents: "none",
      opacity: depth > 0.04 ? 1 : 0, transition: "opacity 0.6s",
    }}>
      <div style={{ opacity: 0.5, marginBottom: 5 }}>DEPTH</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {String(m).padStart(4, "0")}m
      </div>
      <div style={{ width: 2, height: 150, background: "rgba(255,255,255,0.2)", marginTop: 10, marginLeft: "auto", position: "relative" }}>
        <div style={{ position: "absolute", left: -3, top: `${depth * 100}%`, width: 8, height: 8, background: "#00E5FF", borderRadius: "50%", boxShadow: "0 0 10px #00E5FF", transform: "translateY(-50%)" }} />
      </div>
    </div>
  );
}

// ── ocean floor scene ─────────────────────────────────────────────────
function OceanFloor() {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "90vh", background: "#000", overflow: "hidden" }}>
      {/* underwater bg photo */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(https://images.unsplash.com/photo-1464925257126-6450e871c667?w=1920&q=85&auto=format&fit=crop)",
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.32, filter: "brightness(0.4) contrast(1.2) saturate(0.55)",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.28) 30%,rgba(0,0,0,.5) 65%,rgba(0,0,0,.96) 100%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "radial-gradient(ellipse 1000px 500px at 50% 0%,rgba(0,229,255,.06),transparent 70%)" }} />

      {/* gold warmth from chest */}
      <div style={{
        position: "absolute", left: "50%", bottom: "4%", transform: "translateX(-50%)",
        width: "min(900px,95vw)", height: "58vh",
        background: "radial-gradient(ellipse at center 78%,rgba(255,162,60,.42),rgba(255,120,40,.14) 30%,transparent 65%)",
        filter: "blur(55px)", pointerEvents: "none", zIndex: 2,
      }} />

      {/* scattered coins */}
      <svg style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "28%", zIndex: 2, pointerEvents: "none" }} viewBox="0 0 1440 300" preserveAspectRatio="none">
        <defs>
          <radialGradient id="gc" cx=".35" cy=".3">
            <stop offset="0%" stopColor="#fff5b8" /><stop offset="50%" stopColor="#ffd966" /><stop offset="100%" stopColor="#7a4a08" />
          </radialGradient>
        </defs>
        {[[155,242],[188,254],[130,260],[218,270],[1182,242],[1224,256],[1262,247],[1292,268],[318,278],[1088,282]].map(([cx,cy],i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={i%3===0?14:12} ry={3.8} fill="url(#gc)" />
        ))}
      </svg>

      {/* sword half-sunk */}
      <svg style={{ position: "absolute", left: "10%", bottom: "11%", width: "min(105px,10.5vw)", height: "auto", zIndex: 2, filter: "drop-shadow(0 6px 14px rgba(0,0,0,.75))" }} viewBox="0 0 100 280">
        <defs>
          <linearGradient id="bl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22292f" /><stop offset="50%" stopColor="#8a939c" /><stop offset="100%" stopColor="#22292f" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="178" rx="30" ry="5" fill="rgba(32,18,8,.9)" />
        <path d="M30 176 Q50 167 70 176 L70 182 L30 182Z" fill="rgba(55,35,18,.65)" />
        <polygon points="44,18 50,8 56,18 56,178 50,180 44,178" fill="url(#bl)" stroke="#0a0a0a" strokeWidth=".4" />
        <line x1="50" y1="20" x2="50" y2="176" stroke="rgba(255,255,255,.32)" strokeWidth=".6" />
        <rect x="34" y="14" width="32" height="6" fill="#362616" rx="1" />
        <rect x="46" y="0" width="8" height="14" fill="#1a0e05" />
        <line x1="46" y1="5" x2="54" y2="5" stroke="#3a2a15" strokeWidth=".3" />
        <line x1="46" y1="10" x2="54" y2="10" stroke="#3a2a15" strokeWidth=".3" />
        <circle cx="50" cy="0" r="3.5" fill="#2a1810" />
      </svg>

      {/* treasure chest photo */}
      <div style={{
        position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
        width: "min(720px,80vw)", height: "min(480px,56vh)",
        backgroundImage: "url(https://images.unsplash.com/photo-1632809199725-72a4245e846b?w=1600&q=85&auto=format&fit=crop)",
        backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center bottom",
        filter: "brightness(.86) contrast(1.12) saturate(1.06)", zIndex: 3,
      }} />

      {/* hooded figure sitting on chest lighting blunt */}
      <svg viewBox="0 0 280 360" preserveAspectRatio="xMidYMax meet" style={{
        position: "absolute", left: "50%",
        bottom: "calc(min(480px, 56vh) - 80px)",
        transform: "translateX(-50%)",
        width: "min(220px,24vw)", height: "auto", zIndex: 5,
        filter: "drop-shadow(0 -8px 30px rgba(255,140,40,.22))",
      }}>
        <defs>
          <filter id="fB" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="wH" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
          <radialGradient id="fG"><stop offset="0%" stopColor="rgba(255,175,55,.88)" /><stop offset="45%" stopColor="rgba(255,115,28,.38)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
        </defs>
        {/* silhouette */}
        <g fill="#020203">
          <path d="M140 5C92 5 60 38 58 92c0 20 6 38 17 53 25-10 105-10 130 0 11-15 17-33 17-53C220 38 188 5 140 5z" />
          <path d="M76 142C56 178 46 220 50 258c3 32 17 56 34 68 21 6 91 6 112 0 17-12 31-36 34-68 4-38-6-80-26-116Q140 162 76 142z" />
          <path d="M78 158C56 188 50 228 65 252c13 10 30-2 40-22 5-12 13-20 23-25l4-10-16 5C95 205 80 195 78 178V158z" />
          <path d="M202 158C224 188 230 228 215 252c-13 10-30-2-40-22-5-12-13-20-23-25l-4-10 16 5C185 205 200 195 202 178V158z" />
          <ellipse cx="92" cy="285" rx="30" ry="48" />
          <ellipse cx="188" cy="285" rx="30" ry="48" />
          <ellipse cx="80" cy="335" rx="22" ry="10" />
          <ellipse cx="200" cy="335" rx="22" ry="10" />
        </g>
        {/* warm glow on hood from flame */}
        <ellipse cx="140" cy="136" rx="44" ry="30" fill="rgba(255,138,48,.38)" filter="url(#wH)" />
        <ellipse cx="140" cy="150" rx="33" ry="18" fill="rgba(255,98,28,.48)" filter="url(#wH)" />
        {/* cyan eyes */}
        <circle cx="125" cy="98" r="1.8" fill="#00E5FF">
          <animate attributeName="opacity" values="1;0.3;1" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="155" cy="98" r="1.8" fill="#00E5FF">
          <animate attributeName="opacity" values="1;0.3;1" dur="4s" repeatCount="indefinite" />
        </circle>
        {/* blunt */}
        <g transform="rotate(-22 140 142)">
          <rect x="138" y="133" width="3.5" height="18" rx="1.2" fill="#2a1c10" />
          <rect x="138" y="133" width="3.5" height="4" rx="1" fill="#e85515" />
          <circle cx="139.8" cy="132" r="1.8" fill="#ffaa30" opacity=".9">
            <animate attributeName="opacity" values=".9;.45;.9" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
        {/* lighter */}
        <g transform="translate(155,190)">
          <rect x="-5" y="0" width="10" height="16" rx="2" fill="#0e0e0e" stroke="#2a2a2a" strokeWidth=".5" />
          <rect x="-3" y="-3" width="6" height="3" fill="#383838" />
          <line x1="-3" y1="7" x2="3" y2="7" stroke="#1a1a1a" strokeWidth=".4" />
        </g>
        {/* flame */}
        <g transform="translate(155,179)">
          <circle cx="0" cy="0" r="30" fill="url(#fG)" filter="url(#fB)" />
          <path fill="#ff8a0e">
            <animate dur=".45s" repeatCount="indefinite" attributeName="d"
              values="M0-15C-6-8-8-2-6 5-3 9 0 10 0 10 0 10 3 9 6 5 8-2 6-8 0-15Z;M0-17C-5-9-7-3-5 5-2 9 0 10 0 10 0 10 4 9 5 5 7-3 5-9 0-17Z;M0-15C-6-8-8-2-6 5-3 9 0 10 0 10 0 10 3 9 6 5 8-2 6-8 0-15Z" />
          </path>
          <path d="M0-10C-3-5-4-1-2 4 0 7 0 7 2 4 4-1 3-5 0-10Z" fill="#ffd633" />
          <path d="M0-6C-1.5-3-2 0-1 2 0 4 1 2 2 0 1.5-3 0-6Z" fill="#fff" />
          <circle cx="0" cy="-20" r="1.5" fill="#fffab0" opacity=".7">
            <animate attributeName="cy" values="-20;-24;-20" dur=".6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".7;.1;.7" dur=".6s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* edge vignette */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 240px 90px #000", pointerEvents: "none", zIndex: 8 }} />
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────
export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [winH, setWinH] = useState(800);
  const [docH, setDocH] = useState(4000);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onResize = () => { setWinH(window.innerHeight); setDocH(document.documentElement.scrollHeight); };
    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); };
  }, []);

  const depth = cl(scrollY / Math.max(1, docH - winH));
  const [r, g, b] = bgRGB(depth);
  const fore = foreRGB(depth);
  const drip = dripColor(depth);

  // drip section: 300vh container, sticky 100vh panel
  // progress 0→1 over first 2 * winH of scroll
  const dp = cl(scrollY / (winH * 2));
  const dripExtend = cl(dp / 0.44);          // drips grow: 0→0.44
  const manifestoIn = cl((dp - 0.46) / 0.32); // manifesto: 0.46→0.78
  const sectionOut  = cl((dp - 0.87) / 0.13); // fade out: 0.87→1.0

  const maxDripH = winH * 0.21;
  const dripH = dripExtend * maxDripH;

  // per-letter stagger offsets (em fractions of maxDripH)
  const stagger = [0, 0.06, -0.04, 0.09, -0.06, 0.04, -0.09, 0.02];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#fff;overflow-x:hidden;}
        body{font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;cursor:none;}
        @media(max-width:768px){body{cursor:auto;}}
        @keyframes rippleOut{from{width:10px;height:10px;opacity:1}to{width:120px;height:120px;opacity:0}}
        @keyframes scrollPulse{0%{transform:translateY(0);opacity:0}30%{opacity:1}100%{transform:translateY(18px);opacity:0}}
        @keyframes wDrop{0%{transform:translateY(0);opacity:.75}100%{transform:translateY(55px);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* fixed bg */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: `rgb(${r},${g},${b})` }} />
      <FilmGrain />
      <BubbleField depth={depth} />
      <CustomCursor />
      <DepthMeter depth={depth} />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrollY > 40 ? "12px 32px" : "20px 32px",
        transition: "padding .4s",
        background: depth > 0.18 && scrollY > 40 ? "rgba(0,0,0,.45)" : "transparent",
        backdropFilter: depth > 0.18 && scrollY > 40 ? "blur(14px)" : "none",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontFamily: "Anton,sans-serif", fontSize: 22, letterSpacing: ".05em", color: fore }}>
          DRENCHED<span style={{ color: "#00E5FF" }}>.</span>
        </div>
        <button style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: ".25em",
          padding: "9px 20px", background: "transparent", cursor: "pointer",
          border: `1px solid ${depth < 0.15 ? "rgba(0,0,0,.3)" : "rgba(255,255,255,.38)"}`,
          color: fore, transition: "all .3s",
        }}>SHOP ↗</button>
      </nav>

      {/* ── DRIP SECTION (300vh scroll room) ── */}
      <section style={{ height: "300vh", position: "relative" }}>
        <div style={{
          position: "sticky", top: 0, height: "100vh", overflow: "hidden",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: "24vh",
          opacity: 1 - sectionOut,
        }}>

          {/* DRENCHED with per-letter drips */}
          <div style={{
            fontFamily: "Anton,sans-serif",
            fontSize: "clamp(72px,15vw,175px)",
            lineHeight: 1, letterSpacing: ".025em",
            color: fore, userSelect: "none", position: "relative",
          }}>
            {"DRENCHED".split("").map((ch, i) => {
              const thisH = Math.max(0, dripH + stagger[i] * maxDripH);
              return (
                <span key={i} style={{ position: "relative", display: "inline-block" }}>
                  {ch}
                  {/* drip stem */}
                  {dripExtend > 0.01 && (
                    <span style={{
                      position: "absolute", left: "50%", top: "94%",
                      transform: "translateX(-50%)",
                      width: 5, height: thisH,
                      background: drip,
                      borderRadius: "0 0 3px 3px",
                      display: "block", pointerEvents: "none",
                    }} />
                  )}
                  {/* drip blob */}
                  {thisH > 8 && (
                    <span style={{
                      position: "absolute", left: "50%",
                      top: `calc(94% + ${thisH}px)`,
                      transform: "translateX(-50%) translateY(-2px)",
                      width: 13, height: 16,
                      background: drip,
                      borderRadius: "42% 42% 58% 58% / 28% 28% 72% 72%",
                      display: "block", pointerEvents: "none",
                    }} />
                  )}
                </span>
              );
            })}
          </div>

          {/* manifesto text — floats up into view below the drips */}
          <div style={{
            marginTop: `${dripH + 32}px`,
            textAlign: "center",
            padding: "0 28px",
            maxWidth: 680,
            opacity: manifestoIn,
            transform: `translateY(${(1 - manifestoIn) * 18}px)`,
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily: "Anton,sans-serif",
              fontSize: "clamp(26px,4.5vw,54px)",
              color: fore, lineHeight: 1.05,
              letterSpacing: "-.005em", marginBottom: 16,
            }}>
              They dripped.<br />
              <span style={{ color: "#00E5FF" }}>We DRENCHED.</span>
            </div>
            <div style={{
              fontFamily: "Inter,sans-serif", fontWeight: 300,
              fontSize: "clamp(13px,1.7vw,17px)",
              color: fore, lineHeight: 1.85, opacity: .82,
            }}>
              There's a difference between wearing fits<br />
              and being fully submerged in them.<br />
              Welcome to the deep end.
            </div>
          </div>

          {/* scroll hint — only visible at very top */}
          <div style={{
            position: "absolute", bottom: 34,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9, letterSpacing: ".35em",
            color: fore, opacity: cl(1 - dp * 18),
            textAlign: "center", transition: "opacity .4s",
          }}>
            <div style={{ marginBottom: 9 }}>SCROLL TO DESCEND</div>
            <div style={{ width: 1, height: 36, background: fore, margin: "0 auto", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", width: 1, height: 14, background: fore, animation: "scrollPulse 2s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── SWEATS WATER ── */}
      <section style={{
        minHeight: "55vh", display: "flex", alignItems: "center",
        justifyContent: "center", position: "relative", overflow: "hidden",
        padding: "80px 24px",
      }}>
        {/* subtle caustic hint */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 900px 300px at 50% 100%, rgba(0,229,255,.05), transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            letterSpacing: ".45em", color: "rgba(255,255,255,.45)", marginBottom: 20,
          }}>
            D × D — EST. 2026 — TLV × NYC
          </div>
          {/* big type */}
          <div style={{
            fontFamily: "Anton,sans-serif",
            fontSize: "clamp(54px,11vw,140px)",
            color: "white", lineHeight: .88,
            letterSpacing: "-.01em", position: "relative",
          }}>
            SWEATS<br />WATER
            {/* drops dripping from the word */}
            <div style={{
              position: "absolute", left: "5%", right: "5%", bottom: -18,
              display: "flex", justifyContent: "space-evenly",
              pointerEvents: "none",
            }}>
              {Array.from({ length: 11 }).map((_, i) => (
                <span key={i} style={{
                  width: 4, height: 9,
                  borderRadius: "40% 40% 60% 60% / 25% 25% 75% 75%",
                  background: `rgba(${100 + i * 8},${190 + i * 4},235,.72)`,
                  display: "block",
                  animation: `wDrop ${1.1 + i * 0.12}s ease-in ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OCEAN FLOOR ── */}
      <section style={{ position: "relative" }}>
        <div style={{ textAlign: "center", padding: "80px 24px 40px", position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".45em", color: "#00E5FF", marginBottom: 18 }}>
            — 1500 m / THE FLOOR —
          </div>
          <div style={{ fontFamily: "Anton,sans-serif", fontSize: "clamp(46px,9vw,115px)", color: "white", lineHeight: .88, letterSpacing: "-.01em" }}>
            WE LIVE<br />DOWN<span style={{ color: "#00E5FF" }}>HERE.</span>
          </div>
        </div>
        <OceanFloor />
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#000", padding: "60px 32px 32px", borderTop: "1px solid rgba(0,229,255,.12)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Anton,sans-serif", fontSize: "clamp(38px,6vw,72px)", color: "white", marginBottom: 28, letterSpacing: ".03em" }}>
            DRENCHED<span style={{ color: "#00E5FF" }}>.</span>
          </div>
          <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto 40px", flexWrap: "wrap", justifyContent: "center" }}>
            <input type="email" placeholder="your@email.com" style={{
              flex: 1, minWidth: 210, padding: "12px 16px",
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.15)",
              color: "white", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, outline: "none",
            }} />
            <button style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: ".25em",
              padding: "12px 22px", background: "#00E5FF", color: "#000",
              border: "none", cursor: "pointer", fontWeight: 700,
            }}>GET IN ↓</button>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "rgba(255,255,255,.22)", letterSpacing: ".2em" }}>
            © 2026 DRENCHED. DRENCHED IN DRIP — TLV × NYC
          </div>
        </div>
      </footer>
    </>
  );
}
