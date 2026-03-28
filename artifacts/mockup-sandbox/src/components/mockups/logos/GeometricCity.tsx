export function GeometricCity() {
  return (
    <div
      style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F6F7FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", gap: "32px" }}
      dir="rtl"
    >
      {/* Main logo display */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
        {/* Icon — Geometric skyline */}
        <svg width="96" height="68" viewBox="0 0 96 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-b1" x1="0" y1="0" x2="96" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F7BA0" />
              <stop offset="60%" stopColor="#0d6d8e" />
              <stop offset="100%" stopColor="#0F1C3F" />
            </linearGradient>
          </defs>
          {/* Base line */}
          <rect x="0" y="60" width="96" height="4" rx="2" fill="url(#grad-b1)" opacity="0.35" />
          {/* Buildings as vertical bars — skyline */}
          {/* Tall building left */}
          <rect x="4" y="20" width="12" height="40" rx="2.5" fill="url(#grad-b1)" />
          {/* Short building */}
          <rect x="20" y="38" width="9" height="22" rx="2" fill="url(#grad-b1)" opacity="0.75" />
          {/* Medium building */}
          <rect x="33" y="28" width="11" height="32" rx="2.5" fill="url(#grad-b1)" />
          {/* Tallest building center */}
          <rect x="48" y="10" width="13" height="50" rx="2.5" fill="url(#grad-b1)" />
          {/* Antenna on tallest */}
          <rect x="54" y="4" width="1.5" height="8" rx="0.75" fill="url(#grad-b1)" />
          <circle cx="54.75" cy="3.5" r="2" fill="#0F7BA0" />
          {/* Medium right */}
          <rect x="65" y="30" width="11" height="30" rx="2.5" fill="url(#grad-b1)" />
          {/* Short right */}
          <rect x="80" y="40" width="9" height="20" rx="2" fill="url(#grad-b1)" opacity="0.75" />
          {/* Windows as small dots */}
          <rect x="7" y="25" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
          <rect x="11" y="25" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
          <rect x="7" y="30" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
          <rect x="11" y="30" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
          <rect x="51" y="15" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
          <rect x="55" y="15" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
          <rect x="51" y="21" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
          <rect x="55" y="21" width="2.5" height="2" rx="0.5" fill="white" opacity="0.6" />
        </svg>

        {/* Wordmark */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0px", justifyContent: "center" }}>
            <span style={{ fontSize: "36px", fontWeight: "900", color: "#0F1C3F", letterSpacing: "-0.5px" }}>عقار</span>
            <span style={{ fontSize: "36px", fontWeight: "300", color: "#0F7BA0", letterSpacing: "-0.5px", marginRight: "6px" }}>إنسايت</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>
            <div style={{ width: "28px", height: "1px", background: "#0F7BA0", opacity: 0.5 }} />
            <div style={{ fontSize: "11px", color: "#0F7BA0", fontWeight: "600", letterSpacing: "1.5px" }}>منصة ذكية للعقار</div>
            <div style={{ width: "28px", height: "1px", background: "#0F7BA0", opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Dark previews */}
      <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "380px" }}>
        <div style={{ flex: 1, background: "#0F1C3F", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="38" height="28" viewBox="0 0 96 68" fill="none">
            <rect x="0" y="60" width="96" height="4" rx="2" fill="white" opacity="0.2" />
            <rect x="4" y="20" width="12" height="40" rx="2.5" fill="white" opacity="0.9" />
            <rect x="20" y="38" width="9" height="22" rx="2" fill="white" opacity="0.6" />
            <rect x="33" y="28" width="11" height="32" rx="2.5" fill="white" opacity="0.8" />
            <rect x="48" y="10" width="13" height="50" rx="2.5" fill="white" opacity="0.9" />
            <rect x="65" y="30" width="11" height="30" rx="2.5" fill="white" opacity="0.8" />
            <rect x="80" y="40" width="9" height="20" rx="2" fill="white" opacity="0.6" />
          </svg>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
        <div style={{ flex: 1, background: "#0F7BA0", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="38" height="28" viewBox="0 0 96 68" fill="none">
            <rect x="4" y="20" width="12" height="40" rx="2.5" fill="white" opacity="0.9" />
            <rect x="20" y="38" width="9" height="22" rx="2" fill="white" opacity="0.6" />
            <rect x="33" y="28" width="11" height="32" rx="2.5" fill="white" opacity="0.8" />
            <rect x="48" y="10" width="13" height="50" rx="2.5" fill="white" opacity="0.9" />
            <rect x="65" y="30" width="11" height="30" rx="2.5" fill="white" opacity="0.8" />
            <rect x="80" y="40" width="9" height="20" rx="2" fill="white" opacity="0.6" />
          </svg>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "#999", fontWeight: "600" }}>ب — أفق المدينة الهندسي</div>
    </div>
  );
}
