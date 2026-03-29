export default function AdCitySquare() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: "rtl" }}>
      <img
        src="/__mockup/images/ad-hero-city.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,14,27,0.92) 0%, rgba(5,14,27,0.55) 45%, rgba(5,14,27,0.12) 75%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(15,123,160,0.25) 0%, transparent 70%)" }} />

      {/* Logo top right */}
      <div style={{ position: "absolute", top: "5%", right: "5%", display: "flex", alignItems: "center", gap: "0.5vw" }}>
        <svg width="3.5vw" height="3.5vw" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="rgba(15,123,160,0.85)" />
          <rect x="8" y="22" width="5" height="12" rx="1.5" fill="white" />
          <rect x="17" y="15" width="5" height="19" rx="1.5" fill="white" />
          <rect x="26" y="9" width="5" height="25" rx="1.5" fill="rgba(148,199,220,0.9)" />
        </svg>
        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "2vw", fontWeight: 800, letterSpacing: "0.02em" }}>عقار إنسايت</span>
      </div>

      {/* Main content — bottom */}
      <div style={{ position: "absolute", bottom: "6%", right: "5%", left: "5%" }}>
        <div style={{ display: "inline-block", background: "rgba(15,123,160,0.30)", border: "1px solid rgba(15,123,160,0.5)", backdropFilter: "blur(8px)", borderRadius: "50px", padding: "0.5vw 1.5vw", marginBottom: "2vw" }}>
          <span style={{ color: "rgba(148,199,220,1)", fontSize: "1.5vw", fontWeight: 700, letterSpacing: "0.08em" }}>مارس 2026 · الإطلاق الرسمي</span>
        </div>
        <div style={{ fontSize: "10vw", fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: "1.5vw", textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}>
          قرارك الذكي<br />
          <span style={{ color: "#0ec8f5", WebkitTextFillColor: "transparent", WebkitTextStroke: "1px #0ec8f5" }}>يبدأ هنا</span>
        </div>
        <p style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.72)", fontWeight: 500, lineHeight: 1.6, maxWidth: "60vw" }}>
          منصة عقارية ذكية تحلّل السوق السعودي بدقة
        </p>
      </div>
    </div>
  );
}
