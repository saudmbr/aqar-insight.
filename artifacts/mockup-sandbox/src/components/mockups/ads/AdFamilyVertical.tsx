export default function AdFamilyVertical() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: "rtl" }}>
      <img
        src="/__mockup/images/ad-hero-family-vertical.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,14,27,0.97) 0%, rgba(5,14,27,0.45) 40%, rgba(5,14,27,0.05) 65%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(245,158,11,0.18) 0%, transparent 65%)" }} />

      {/* Logo */}
      <div style={{ position: "absolute", top: "16%", right: "6%", display: "flex", alignItems: "center", gap: "1.5vw" }}>
        <svg width="8vw" height="8vw" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="rgba(15,123,160,0.9)" />
          <rect x="8" y="22" width="5" height="12" rx="1.5" fill="white" />
          <rect x="17" y="15" width="5" height="19" rx="1.5" fill="white" />
          <rect x="26" y="9" width="5" height="25" rx="1.5" fill="rgba(148,199,220,0.9)" />
        </svg>
        <span style={{ color: "rgba(255,255,255,0.92)", fontSize: "4.5vw", fontWeight: 800 }}>عقار إنسايت</span>
      </div>

      {/* Badge */}
      <div style={{ position: "absolute", bottom: "42%", right: "6%", display: "inline-flex", alignItems: "center", gap: "2vw", background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.45)", backdropFilter: "blur(10px)", borderRadius: "50px", padding: "1.5vw 4vw" }}>
        <div style={{ width: "2vw", height: "2vw", borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ color: "#fbbf24", fontSize: "3.5vw", fontWeight: 700 }}>ابحث · قارن · اشتر</span>
      </div>

      {/* Headline */}
      <div style={{ position: "absolute", bottom: "38%", right: "6%", left: "6%", marginTop: "6vw" }}>
        <div style={{ fontSize: "17vw", fontWeight: 900, color: "#fff", lineHeight: 0.92, textShadow: "0 6px 40px rgba(0,0,0,0.7)", marginTop: "4vw" }}>
          بيتك<br />
          <span style={{ color: "#fbbf24" }}>هنا</span>
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{ position: "absolute", bottom: "4%", right: "6%", left: "6%" }}>
        <p style={{ fontSize: "3.8vw", color: "rgba(255,255,255,0.62)", fontWeight: 500, lineHeight: 1.7 }}>
          آلاف العقارات في كل مناطق المملكة العربية السعودية
        </p>
      </div>
    </div>
  );
}
