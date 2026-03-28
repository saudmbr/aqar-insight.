export function RoyalArch() {
  return (
    <div
      style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F6F7FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", gap: "32px" }}
      dir="rtl"
    >
      {/* Main logo display */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
        {/* Islamic arch icon */}
        <svg width="82" height="90" viewBox="0 0 82 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-d-gold" x1="0" y1="0" x2="82" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C9A84C" />
              <stop offset="50%" stopColor="#e8c96a" />
              <stop offset="100%" stopColor="#b8922e" />
            </linearGradient>
            <linearGradient id="grad-d-navy" x1="0" y1="0" x2="0" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F1C3F" />
              <stop offset="100%" stopColor="#1a3060" />
            </linearGradient>
          </defs>

          {/* Outer arch frame */}
          <path
            d="M8 82 L8 42 Q8 8 41 8 Q74 8 74 42 L74 82"
            stroke="url(#grad-d-gold)" strokeWidth="4.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
          {/* Inner arch decoration */}
          <path
            d="M16 82 L16 45 Q16 18 41 18 Q66 18 66 45 L66 82"
            stroke="url(#grad-d-gold)" strokeWidth="2" fill="none" opacity="0.5"
            strokeLinecap="round" strokeLinejoin="round"
          />

          {/* Base platform */}
          <rect x="4" y="80" width="74" height="6" rx="3" fill="url(#grad-d-gold)" />

          {/* Top ornament - star/diamond */}
          <polygon
            points="41,2 44,8 50,8 45.5,12 47.5,18 41,14 34.5,18 36.5,12 32,8 38,8"
            fill="url(#grad-d-gold)"
          />

          {/* Building inside arch */}
          <rect x="26" y="52" width="10" height="30" rx="2" fill="url(#grad-d-navy)" />
          <rect x="46" y="52" width="10" height="30" rx="2" fill="url(#grad-d-navy)" />
          <rect x="32" y="40" width="18" height="42" rx="2" fill="url(#grad-d-navy)" />

          {/* Door */}
          <path d="M36 82 L36 68 Q41 62 46 68 L46 82" fill="url(#grad-d-gold)" opacity="0.8" />

          {/* Side decorative dots */}
          <circle cx="8" cy="82" r="3.5" fill="url(#grad-d-gold)" />
          <circle cx="74" cy="82" r="3.5" fill="url(#grad-d-gold)" />
        </svg>

        {/* Wordmark */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "#0F1C3F", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
            عقار إنسايت
          </div>
          <div style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "#C9A84C",
            fontWeight: "700",
            letterSpacing: "2px",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center"
          }}>
            <span style={{ width: "20px", height: "1px", background: "#C9A84C", display: "inline-block" }} />
            منصة ذكية للعقار
            <span style={{ width: "20px", height: "1px", background: "#C9A84C", display: "inline-block" }} />
          </div>
        </div>
      </div>

      {/* Previews */}
      <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "380px" }}>
        <div style={{ flex: 1, background: "#0F1C3F", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="28" height="32" viewBox="0 0 82 90" fill="none">
            <path d="M8 82 L8 42 Q8 8 41 8 Q74 8 74 42 L74 82" stroke="#C9A84C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <rect x="4" y="80" width="74" height="6" rx="3" fill="#C9A84C" />
            <polygon points="41,2 44,8 50,8 45.5,12 47.5,18 41,14 34.5,18 36.5,12 32,8 38,8" fill="#C9A84C" />
            <rect x="32" y="40" width="18" height="42" rx="2" fill="white" opacity="0.7" />
            <path d="M36 82 L36 68 Q41 62 46 68 L46 82" fill="#C9A84C" opacity="0.8" />
          </svg>
          <div>
            <div style={{ color: "#C9A84C", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
        <div style={{ flex: 1, background: "#C9A84C", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="28" height="32" viewBox="0 0 82 90" fill="none">
            <path d="M8 82 L8 42 Q8 8 41 8 Q74 8 74 42 L74 82" stroke="#0F1C3F" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <rect x="4" y="80" width="74" height="6" rx="3" fill="#0F1C3F" />
            <polygon points="41,2 44,8 50,8 45.5,12 47.5,18 41,14 34.5,18 36.5,12 32,8 38,8" fill="#0F1C3F" />
            <rect x="32" y="40" width="18" height="42" rx="2" fill="#0F1C3F" opacity="0.7" />
            <path d="M36 82 L36 68 Q41 62 46 68 L46 82" fill="white" opacity="0.8" />
          </svg>
          <div>
            <div style={{ color: "#0F1C3F", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(15,28,63,0.6)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "#999", fontWeight: "600" }}>د — قوس ملكي بلمسة ذهبية</div>
    </div>
  );
}
