export default function AdFamilySquare() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: "rtl" }}>
      <img
        src="/__mockup/images/ad-hero-family.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,14,27,0.94) 0%, rgba(5,14,27,0.35) 50%, rgba(5,14,27,0.08) 80%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245,158,11,0.15) 0%, transparent 70%)" }} />

      {/* Logo top right */}
      <div style={{ position: "absolute", top: "5%", right: "5%", display: "flex", alignItems: "center", gap: "0.5vw" }}>
        <svg width="3.5vw" height="3.5vw" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="rgba(15,123,160,0.85)" />
          <rect x="8" y="22" width="5" height="12" rx="1.5" fill="white" />
          <rect x="17" y="15" width="5" height="19" rx="1.5" fill="white" />
          <rect x="26" y="9" width="5" height="25" rx="1.5" fill="rgba(148,199,220,0.9)" />
        </svg>
        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "2vw", fontWeight: 800 }}>عقار إنسايت</span>
      </div>

      {/* Bottom content */}
      <div style={{ position: "absolute", bottom: "6%", right: "5%", left: "5%" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "1vw", background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.40)", backdropFilter: "blur(8px)", borderRadius: "50px", padding: "0.5vw 1.5vw", marginBottom: "2vw" }}>
          <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "#f59e0b", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#fbbf24", fontSize: "1.5vw", fontWeight: 700 }}>ابحث · قارن · اشتر</span>
        </div>
        <div style={{ fontSize: "9vw", fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: "1.5vw", textShadow: "0 4px 30px rgba(0,0,0,0.65)" }}>
          بيتك<br />
          <span style={{ color: "#fbbf24" }}>بخطوة واحدة</span>
        </div>
        <p style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.70)", fontWeight: 500, lineHeight: 1.6 }}>
          آلاف العقارات في كل مناطق المملكة
        </p>
      </div>
    </div>
  );
}
