export function SmartEye() {
  return (
    <div
      style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F6F7FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", gap: "32px" }}
      dir="rtl"
    >
      {/* Main logo display */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
        {/* Combined mark: building + lens */}
        <div style={{ position: "relative", width: "90px", height: "80px" }}>
          <svg width="90" height="80" viewBox="0 0 90 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad-c-navy" x1="0" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F1C3F" />
                <stop offset="100%" stopColor="#162d5e" />
              </linearGradient>
              <linearGradient id="grad-c-teal" x1="0" y1="0" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F7BA0" />
                <stop offset="100%" stopColor="#0d9bc8" />
              </linearGradient>
            </defs>

            {/* Building silhouette */}
            <rect x="8" y="70" width="54" height="5" rx="2.5" fill="url(#grad-c-navy)" />
            <rect x="10" y="40" width="10" height="31" rx="2" fill="url(#grad-c-navy)" />
            <rect x="24" y="40" width="10" height="31" rx="2" fill="url(#grad-c-navy)" />
            <rect x="38" y="40" width="10" height="31" rx="2" fill="url(#grad-c-navy)" />
            <rect x="8" y="33" width="52" height="8" rx="2" fill="url(#grad-c-navy)" />
            <path d="M6 33 L34 18 L62 33" stroke="#0F1C3F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Lens / Eye circle overlapping top-right */}
            <circle cx="66" cy="28" r="18" fill="white" />
            <circle cx="66" cy="28" r="18" stroke="url(#grad-c-teal)" strokeWidth="3.5" fill="none" />
            {/* Inner lens */}
            <circle cx="66" cy="28" r="9" fill="url(#grad-c-teal)" />
            {/* Pupil / shine */}
            <circle cx="66" cy="28" r="4" fill="white" opacity="0.95" />
            <circle cx="62.5" cy="24.5" r="1.8" fill="white" opacity="0.7" />
            {/* Scan lines */}
            <line x1="50" y1="28" x2="55" y2="28" stroke="url(#grad-c-teal)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="77" y1="28" x2="82" y2="28" stroke="url(#grad-c-teal)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="66" y1="12" x2="66" y2="17" stroke="url(#grad-c-teal)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="66" y1="39" x2="66" y2="44" stroke="url(#grad-c-teal)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "34px", fontWeight: "900", letterSpacing: "-0.5px", lineHeight: 1 }}>
            <span style={{ color: "#0F1C3F" }}>عقار</span>
            <span
              style={{
                color: "#0F7BA0",
                borderBottom: "3px solid #0F7BA0",
                paddingBottom: "0px",
                marginRight: "6px",
              }}
            >
              إنسايت
            </span>
          </div>
          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#0F7BA0" strokeWidth="1.5" />
              <circle cx="6" cy="6" r="2.5" fill="#0F7BA0" />
            </svg>
            <span style={{ fontSize: "12px", color: "#0F7BA0", fontWeight: "600" }}>منصة ذكية للعقار</span>
          </div>
        </div>
      </div>

      {/* Previews */}
      <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "380px" }}>
        <div style={{ flex: 1, background: "#0F1C3F", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="32" height="28" viewBox="0 0 90 80" fill="none">
            <rect x="8" y="70" width="54" height="5" rx="2.5" fill="white" />
            <rect x="10" y="40" width="10" height="31" rx="2" fill="white" />
            <rect x="24" y="40" width="10" height="31" rx="2" fill="white" />
            <rect x="38" y="40" width="10" height="31" rx="2" fill="white" />
            <rect x="8" y="33" width="52" height="8" rx="2" fill="white" />
            <path d="M6 33 L34 18 L62 33" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="66" cy="28" r="18" stroke="#0F7BA0" strokeWidth="3.5" fill="none" />
            <circle cx="66" cy="28" r="9" fill="#0F7BA0" />
            <circle cx="66" cy="28" r="4" fill="white" />
          </svg>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
        <div style={{ flex: 1, background: "#0F7BA0", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="32" height="28" viewBox="0 0 90 80" fill="none">
            <rect x="8" y="70" width="54" height="5" rx="2.5" fill="white" />
            <rect x="10" y="40" width="10" height="31" rx="2" fill="white" />
            <rect x="24" y="40" width="10" height="31" rx="2" fill="white" />
            <rect x="38" y="40" width="10" height="31" rx="2" fill="white" />
            <rect x="8" y="33" width="52" height="8" rx="2" fill="white" />
            <path d="M6 33 L34 18 L62 33" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="66" cy="28" r="18" stroke="white" strokeWidth="3" fill="none" />
            <circle cx="66" cy="28" r="9" fill="white" />
            <circle cx="66" cy="28" r="4" fill="#0F7BA0" />
          </svg>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "#999", fontWeight: "600" }}>ج — بناء + عدسة الذكاء</div>
    </div>
  );
}
