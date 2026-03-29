export default function AdDataSquare() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: "rtl" }}>
      <img
        src="/__mockup/images/ad-hero-data.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(5,14,27,0.88) 0%, rgba(5,14,27,0.40) 50%, rgba(5,14,27,0.70) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,14,27,0.95) 0%, transparent 55%)" }} />

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

      {/* Stats floating card */}
      <div style={{ position: "absolute", top: "50%", right: "5%", transform: "translateY(-50%)", background: "rgba(5,14,27,0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(14,200,245,0.3)", borderRadius: "1.5vw", padding: "2vw", minWidth: "22vw" }}>
        {[
          { label: "متوسط سعر م²", value: "٤٢٠٠", unit: "ر.س", color: "#0ec8f5" },
          { label: "إعلانات نشطة", value: "١٢٬٥٠٠+", unit: "", color: "#34d399" },
          { label: "مدينة مُغطّاة", value: "٥٠+", unit: "", color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8vw 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.4vw", fontWeight: 500 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: "2vw", fontWeight: 800 }}>{s.value} {s.unit}</span>
          </div>
        ))}
      </div>

      {/* Bottom content */}
      <div style={{ position: "absolute", bottom: "6%", right: "5%", left: "5%" }}>
        <div style={{ fontSize: "8.5vw", fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: "1.5vw", textShadow: "0 4px 30px rgba(0,0,0,0.7)" }}>
          البيانات<br />
          <span style={{ color: "#0ec8f5" }}>لا التخمين</span>
        </div>
        <p style={{ fontSize: "2vw", color: "rgba(255,255,255,0.65)", fontWeight: 500, lineHeight: 1.6 }}>
          تحليلات سوق عقاري سعودي في وقت حقيقي
        </p>
      </div>
    </div>
  );
}
