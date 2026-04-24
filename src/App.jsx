import { useState, useEffect, useRef } from "react";

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

const products = [
  { id: "001", name: "KIKAR", sub: "OVERSIZED TEE", price: "₪280", accent: "#E8271A", bg: "#141414" },
  { id: "002", name: "TZABAR", sub: "CARGO PANTS", price: "₪590", accent: "#C8A96E", bg: "#111" },
  { id: "003", name: "SHNIRA", sub: "UTILITY JACKET", price: "₪890", accent: "#ffffff", bg: "#0d0d0d" },
  { id: "004", name: "DROP 002", sub: "COMING SOON", price: "???", accent: "#333", bg: "#0a0a0a" },
];

const manifestoLines = [
  { en: "We didn't come from fashion week.", he: "לא באנו משבוע האופנה." },
  { en: "We came from Shuk HaCarmel.", he: "באנו משוק הכרמל." },
  { en: "From Florentine at 3AM.", he: "מפלורנטין בשלוש בלילה." },
  { en: "From service, sweat, and the Tel Aviv sun.", he: "משירות, זיעה ושמש תל אביב." },
];

function ProductCard({ p, delay, inView }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: p.bg,
        aspectRatio: "3/4",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.04)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ${delay}s, transform 0.7s ${delay}s`,
      }}
    >
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        transition: "transform 0.6s ease",
        transform: hov ? "scale(1.05)" : "scale(1)",
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 110, lineHeight: 1,
          color: p.id === "004" ? "rgba(255,255,255,0.02)" : `${p.accent}18`,
          userSelect: "none",
        }}>
          {p.name.split(" ")[0]}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 2, background: p.accent,
        transform: hov ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "left", transition: "transform 0.4s ease",
      }} />

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: 28,
        background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
        transition: "transform 0.3s ease",
        transform: hov ? "translateY(0)" : "translateY(6px)",
      }}>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.25em", color: p.accent, marginBottom: 8 }}>
          {p.sub}
        </div>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, color: "white", letterSpacing: "0.04em" }}>
          {p.name}
        </div>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          {p.price}
        </div>
      </div>

      <div style={{
        position: "absolute", top: 18, right: 18,
        fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.15em",
        color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)",
        padding: "4px 8px",
      }}>
        {p.id === "004" ? "SOON" : `#${p.id}`}
      </div>
    </div>
  );
}

export default function Shuq() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const [heroRef, heroInView] = useInView(0.05);
  const [collectRef, collectInView] = useInView();
  const [manifestoRef, manifestoInView] = useInView();
  const [aboutRef, aboutInView] = useInView();

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navScrolled = scrollY > 60;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080808; color: white; -webkit-font-smoothing: antialiased; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.12; }
        }

        .nav-a {
          font-family: Space Mono, monospace; font-size: 11px;
          letter-spacing: 0.2em; color: rgba(255,255,255,0.45);
          text-decoration: none; position: relative;
          transition: color 0.2s;
        }
        .nav-a::after {
          content: ''; position: absolute; bottom: -3px; left: 0;
          width: 0; height: 1px; background: #E8271A; transition: width 0.25s;
        }
        .nav-a:hover { color: white; }
        .nav-a:hover::after { width: 100%; }

        .btn-red {
          font-family: Space Mono, monospace; font-size: 10px;
          letter-spacing: 0.25em; padding: 13px 28px;
          background: #E8271A; color: white; border: none; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-red:hover { background: #c41e13; transform: translateY(-2px); }

        .btn-ghost {
          font-family: Space Mono, monospace; font-size: 10px;
          letter-spacing: 0.25em; padding: 13px 28px; background: transparent;
          color: white; border: 1px solid rgba(255,255,255,0.25); cursor: pointer;
          transition: border-color 0.2s, transform 0.15s;
        }
        .btn-ghost:hover { border-color: white; transform: translateY(-2px); }

        .ticker-track { animation: ticker 22s linear infinite; white-space: nowrap; display: inline-flex; }

        .footer-link {
          font-family: Space Mono, monospace; font-size: 11px;
          color: rgba(255,255,255,0.35); text-decoration: none;
          transition: color 0.2s; display: block; margin-bottom: 12px;
        }
        .footer-link:hover { color: white; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .about-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-h1 { font-size: clamp(80px, 25vw, 200px) !important; }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 99,
        background: navScrolled ? "rgba(8,8,8,0.96)" : "transparent",
        backdropFilter: navScrolled ? "blur(12px)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "all 0.4s",
        padding: "18px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, letterSpacing: "0.06em", color: "white" }}>
          SHUQ<span style={{ color: "#E8271A" }}> שוק</span>
        </div>

        <div className="desktop-nav" style={{ display: "flex", gap: 36 }}>
          {["COLLECTIONS", "MANIFESTO", "ABOUT", "CONTACT"].map(n => (
            <a key={n} href={`#${n.toLowerCase()}`} className="nav-a">{n}</a>
          ))}
        </div>

        <button className="btn-red" style={{ padding: "10px 20px", fontSize: "9px" }}>
          SHOP ↗
        </button>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ height: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {/* ambient glows */}
        <div style={{
          position: "absolute", width: 700, height: 700,
          background: "#E8271A", borderRadius: "50%", filter: "blur(130px)",
          opacity: 0.07, left: "-15%", top: "15%",
          animation: "pulse 6s ease-in-out infinite",
          transform: `translateY(${scrollY * 0.25}px)`,
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500,
          background: "#C8A96E", borderRadius: "50%", filter: "blur(110px)",
          opacity: 0.06, right: "0%", bottom: "5%",
          animation: "pulse 8s 2s ease-in-out infinite",
          transform: `translateY(${scrollY * -0.18}px)`,
        }} />

        {/* vertical label */}
        <div style={{
          position: "absolute", left: 44, top: "50%",
          transform: "translateY(-50%) rotate(180deg)",
          writingMode: "vertical-rl",
          fontFamily: "Space Mono, monospace", fontSize: 10,
          letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)",
        }}>
          תל אביב × וורלדוויידה
        </div>

        <div ref={heroRef} style={{ textAlign: "center", position: "relative", zIndex: 2, padding: "0 24px" }}>
          <div style={{
            fontFamily: "Space Mono, monospace", fontSize: 10, letterSpacing: "0.5em",
            color: "#E8271A", marginBottom: 28,
            opacity: heroInView ? 1 : 0,
            animation: heroInView ? "fadeUp 0.6s ease forwards" : "none",
          }}>
            DROP 001 — NOW AVAILABLE
          </div>

          <h1 className="hero-h1" style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "clamp(100px, 22vw, 240px)",
            lineHeight: 0.85, color: "white", letterSpacing: "-0.02em",
            opacity: heroInView ? 1 : 0,
            animation: heroInView ? "fadeUp 0.8s 0.15s ease forwards" : "none",
          }}>
            SHUQ
          </h1>

          <div style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "clamp(18px, 4vw, 38px)",
            color: "rgba(255,255,255,0.25)", letterSpacing: "0.25em",
            marginTop: 8, marginBottom: 16,
            opacity: heroInView ? 1 : 0,
            animation: heroInView ? "fadeUp 0.8s 0.3s ease forwards" : "none",
          }}>
            שוק
          </div>

          <p style={{
            fontFamily: "Space Mono, monospace", fontSize: 12,
            color: "rgba(255,255,255,0.38)", letterSpacing: "0.12em", marginBottom: 52,
            opacity: heroInView ? 1 : 0,
            animation: heroInView ? "fadeUp 0.8s 0.45s ease forwards" : "none",
          }}>
            מהרחוב. בלי התנצלויות.&nbsp; / &nbsp;FROM THE STREET. NO APOLOGIES.
          </p>

          <div style={{
            display: "flex", gap: 14, justifyContent: "center",
            opacity: heroInView ? 1 : 0,
            animation: heroInView ? "fadeUp 0.8s 0.6s ease forwards" : "none",
          }}>
            <button className="btn-red">SHOP DROP 001</button>
            <button className="btn-ghost">WATCH THE FILM</button>
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 36, right: 48,
          fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.25em",
          color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 14,
        }}>
          SCROLL <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.15)" }} />
        </div>
      </section>

      {/* ─── TICKER ─── */}
      <div style={{ background: "#E8271A", padding: "14px 0", overflow: "hidden" }}>
        <div className="ticker-track">
          {Array(8).fill(["TEL AVIV", "שוק", "STREETWEAR", "DROP 001", "NO APOLOGIES", "מהרחוב", "AUTHENTIC", "LIMITED EDITION", "IL × WW"]).flat().map((t, i) => (
            <span key={i} style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 15, letterSpacing: "0.35em", color: "white", padding: "0 28px" }}>
              {t} <span style={{ opacity: 0.5 }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── COLLECTIONS ─── */}
      <section id="collections" style={{ padding: "120px 48px", background: "#080808" }}>
        <div ref={collectRef} style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56,
            opacity: collectInView ? 1 : 0, transform: collectInView ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.7s, transform 0.7s",
          }}>
            <div>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, letterSpacing: "0.35em", color: "#E8271A", marginBottom: 14 }}>
                001 — COLLECTION
              </div>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(52px, 9vw, 100px)", color: "white", lineHeight: 0.88 }}>
                DROP<br />ONE
              </h2>
            </div>
            <button className="btn-ghost" style={{ marginBottom: 4 }}>VIEW ALL →</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
            {products.map((p, i) => (
              <ProductCard key={p.id} p={p} delay={i * 0.12} inView={collectInView} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── MANIFESTO ─── */}
      <section id="manifesto" style={{
        minHeight: "90vh", background: "#0c0c0c",
        display: "flex", alignItems: "center",
        padding: "120px 48px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", fontFamily: "'Bebas Neue', cursive",
          fontSize: "clamp(140px,28vw,300px)", color: "rgba(255,255,255,0.018)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          שוק
        </div>

        <div ref={manifestoRef} style={{ maxWidth: 860, position: "relative", zIndex: 2 }}>
          <div style={{
            fontFamily: "Space Mono, monospace", fontSize: 10, letterSpacing: "0.35em",
            color: "#E8271A", marginBottom: 56,
            opacity: manifestoInView ? 1 : 0, transform: manifestoInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s, transform 0.6s",
          }}>
            THE MANIFESTO — המניפסט
          </div>

          {manifestoLines.map((line, i) => (
            <div key={i} style={{
              marginBottom: 36,
              opacity: manifestoInView ? 1 : 0, transform: manifestoInView ? "translateY(0)" : "translateY(30px)",
              transition: `opacity 0.8s ${0.1 + i * 0.15}s, transform 0.8s ${0.1 + i * 0.15}s`,
            }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(30px,5.5vw,60px)", color: "white", lineHeight: 1.05, letterSpacing: "0.02em" }}>
                {line.en}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(18px,3vw,34px)", color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em", marginTop: 6 }}>
                {line.he}
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 70, paddingTop: 48,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(44px,9vw,92px)",
            color: "#E8271A", letterSpacing: "0.04em",
            opacity: manifestoInView ? 1 : 0, transform: manifestoInView ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s 0.75s, transform 0.8s 0.75s",
          }}>
            THIS IS SHUQ.
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" style={{ padding: "120px 48px", background: "#080808" }}>
        <div ref={aboutRef} className="about-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div style={{
            opacity: aboutInView ? 1 : 0, transform: aboutInView ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s, transform 0.8s",
          }}>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, letterSpacing: "0.35em", color: "#E8271A", marginBottom: 24 }}>
              ABOUT — אודות
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(50px,8vw,90px)", color: "white", lineHeight: 0.88, marginBottom: 36 }}>
              BORN<br />IN THE<br />BAZAAR
            </h2>
            <p style={{ fontFamily: "Space Mono, monospace", fontSize: 11, lineHeight: 2, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              SHUQ started with a table at a flea market in Jaffa. Two friends, a sewing machine, and an idea that Israeli street culture deserved its own uniform.
            </p>
            <p style={{ fontFamily: "Space Mono, monospace", fontSize: 11, lineHeight: 2, color: "rgba(255,255,255,0.45)", marginBottom: 48 }}>
              Every piece carries the weight of the city — the chaos of the shuk, the calm of the sea, the tension of a country that never sleeps.
            </p>
            <button className="btn-red">OUR STORY →</button>
          </div>

          <div style={{
            opacity: aboutInView ? 1 : 0, transform: aboutInView ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s 0.2s, transform 0.8s 0.2s",
          }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: "100%", aspectRatio: "3/4",
                background: "linear-gradient(135deg, #151515, #0a0a0a)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 160, color: "rgba(232,39,26,0.07)", lineHeight: 1 }}>שוק</div>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(232,39,26,0.04), transparent 60%)" }} />
                <div style={{ position: "absolute", bottom: 32, left: 32, right: 32 }}>
                  <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>FOUNDED IN JAFFA, 2024</div>
                  <div style={{ width: 36, height: 2, background: "#E8271A" }} />
                </div>
              </div>

              {/* badge */}
              <div style={{
                position: "absolute", top: -18, right: -18,
                width: 76, height: 76, borderRadius: "50%",
                background: "#E8271A",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: "white", lineHeight: 1 }}>IL</div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 7, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>ORIGINAL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer id="contact" style={{ background: "#060606", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "80px 48px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 72 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 48, color: "white", marginBottom: 18 }}>
                SHUQ<span style={{ color: "#E8271A" }}> שוק</span>
              </div>
              <p style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.9, maxWidth: 260 }}>
                Israeli streetwear. Built in the bazaar. Worn worldwide.
              </p>
            </div>
            {[
              { title: "SHOP", links: ["All Products", "Drop 001", "Drop 002 (Soon)", "Lookbook"] },
              { title: "BRAND", links: ["About", "Manifesto", "Stockists", "Press"] },
              { title: "CONTACT", links: ["hello@shuq.il", "Instagram", "TikTok", "Tel Aviv, IL"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.35em", color: "#E8271A", marginBottom: 22 }}>{col.title}</div>
                {col.links.map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em" }}>
              © 2024 SHUQ. ALL RIGHTS RESERVED.
            </div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 13, color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em" }}>
              מהרחוב לעולם
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
