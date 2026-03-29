export default function AdDataVertical() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: "rtl" }}>
      <img
        src="/__mockup/images/ad-hero-data-vertical.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,14,27,0.97) 0%, rgba(5,14,27,0.55) 38%, rgba(5,14,27,0.08) 65%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,14,27,0.85) 0%, transparent 55%)" }} />

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

      {/* Stat cards floating */}
      <div style={{ position: "absolute", top: "30%", right: "6%", display: "flex", flexDirection: "column", gap: "2vw" }}>
        {[
          { label: "إعلانات نشطة", value: "١٢٬٥٠٠+", color: "#0ec8f5" },
          { label: "مدينة مُغطّاة", value: "٥٠+", color: "#34d399" },
          { label: "تحليلات يومية", value: "مجاناً", color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(5,14,27,0.60)", backdropFilter: "blur(16px)", border: `1px solid ${s.color}40`, borderRadius: "2vw", padding: "2.5vw 4vw", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4vw" }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "3.2vw", fontWeight: 500 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: "4.5vw", fontWeight: 900 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Bottom headline */}
      <div style={{ position: "absolute", bottom: "38%", right: "6%", left: "6%" }}>
        <div style={{ fontSize: "15vw", fontWeight: 900, color: "#fff", lineHeight: 0.95, textShadow: "0 6px 40px rgba(0,0,0,0.7)" }}>
          البيانات<br />
          <span style={{ color: "#0ec8f5" }}>لا التخمين</span>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4%", right: "6%", left: "6%" }}>
        <p style={{ fontSize: "3.8vw", color: "rgba(255,255,255,0.60)", fontWeight: 500 }}>
          تحليلات السوق العقاري السعودي في وقت حقيقي
        </p>
      </div>
    </div>
  );
}
