export default function AdCityVertical() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: "rtl" }}>
      <img
        src="/__mockup/images/ad-hero-city-vertical.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,14,27,0.96) 0%, rgba(5,14,27,0.50) 35%, rgba(5,14,27,0.10) 60%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(15,123,160,0.30) 0%, transparent 65%)" }} />

      {/* Safe zone indicator — keep content inside 14% top / 35% bottom safe zone */}
      {/* Logo — inside safe zone top (after top 14% = ~14vh) */}
      <div style={{ position: "absolute", top: "16%", right: "6%", display: "flex", alignItems: "center", gap: "1.5vw" }}>
        <svg width="8vw" height="8vw" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="rgba(15,123,160,0.9)" />
          <rect x="8" y="22" width="5" height="12" rx="1.5" fill="white" />
          <rect x="17" y="15" width="5" height="19" rx="1.5" fill="white" />
          <rect x="26" y="9" width="5" height="25" rx="1.5" fill="rgba(148,199,220,0.9)" />
        </svg>
        <span style={{ color: "rgba(255,255,255,0.92)", fontSize: "4.5vw", fontWeight: 800, letterSpacing: "0.02em" }}>عقار إنسايت</span>
      </div>

      {/* Main text — inside safe zone (above bottom 35% = ~65vh from top) */}
      <div style={{ position: "absolute", bottom: "38%", right: "6%", left: "6%" }}>
        <div style={{ display: "inline-block", background: "rgba(15,123,160,0.25)", border: "1px solid rgba(14,200,245,0.4)", backdropFilter: "blur(10px)", borderRadius: "50px", padding: "1.5vw 4vw", marginBottom: "4vw" }}>
          <span style={{ color: "#0ec8f5", fontSize: "3.5vw", fontWeight: 700, letterSpacing: "0.1em" }}>الإطلاق الرسمي — ٢٠٢٦</span>
        </div>
        <div style={{ fontSize: "16vw", fontWeight: 900, color: "#fff", lineHeight: 0.95, textShadow: "0 6px 40px rgba(0,0,0,0.7)" }}>
          قرارك<br />الذكي<br />
          <span style={{ color: "#0ec8f5", WebkitTextFillColor: "transparent", WebkitTextStroke: "0.5vw #0ec8f5" }}>هنا</span>
        </div>
      </div>

      {/* Bottom tagline — safe zone */}
      <div style={{ position: "absolute", bottom: "4%", right: "6%", left: "6%" }}>
        <p style={{ fontSize: "3.8vw", color: "rgba(255,255,255,0.65)", fontWeight: 500, lineHeight: 1.7 }}>
          منصة العقارات الذكية · المملكة العربية السعودية
        </p>
      </div>
    </div>
  );
}
