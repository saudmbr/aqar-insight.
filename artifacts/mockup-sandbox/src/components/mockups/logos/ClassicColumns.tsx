export function ClassicColumns() {
  return (
    <div
      style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F6F7FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", gap: "32px" }}
      dir="rtl"
    >
      {/* Main logo display */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
        {/* Icon */}
        <svg width="90" height="82" viewBox="0 0 90 82" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-a1" x1="0" y1="0" x2="90" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F1C3F" />
              <stop offset="100%" stopColor="#0F7BA0" />
            </linearGradient>
            <linearGradient id="grad-a2" x1="0" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#e8c96a" />
            </linearGradient>
          </defs>
          {/* Base platform */}
          <rect x="8" y="68" width="74" height="7" rx="3.5" fill="url(#grad-a1)" />
          {/* Four columns */}
          <rect x="12" y="34" width="13" height="35" rx="3" fill="url(#grad-a1)" />
          <rect x="30" y="34" width="13" height="35" rx="3" fill="url(#grad-a1)" />
          <rect x="48" y="34" width="13" height="35" rx="3" fill="url(#grad-a1)" />
          <rect x="66" y="34" width="13" height="35" rx="3" fill="url(#grad-a1)" />
          {/* Column capitals (gold) */}
          <rect x="10" y="30" width="17" height="5" rx="2" fill="url(#grad-a2)" />
          <rect x="28" y="30" width="17" height="5" rx="2" fill="url(#grad-a2)" />
          <rect x="46" y="30" width="17" height="5" rx="2" fill="url(#grad-a2)" />
          <rect x="64" y="30" width="17" height="5" rx="2" fill="url(#grad-a2)" />
          {/* Entablature */}
          <rect x="8" y="22" width="74" height="9" rx="3" fill="url(#grad-a1)" />
          {/* Pediment with gold */}
          <path d="M5 22 L45 4 L85 22" stroke="url(#grad-a2)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Wordmark */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "34px", fontWeight: "900", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            <span style={{ color: "#0F1C3F" }}>عقار </span>
            <span style={{ color: "#0F7BA0" }}>إنسايت</span>
          </div>
          <div style={{ fontSize: "13px", color: "#C9A84C", fontWeight: "600", marginTop: "6px", letterSpacing: "0.5px" }}>
            منصة ذكية للعقار
          </div>
        </div>
      </div>

      {/* Dark preview */}
      <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "380px" }}>
        <div style={{ flex: 1, background: "#0F1C3F", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="34" height="31" viewBox="0 0 90 82" fill="none">
            <rect x="8" y="68" width="74" height="7" rx="3.5" fill="white" />
            <rect x="12" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="30" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="48" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="66" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="10" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="28" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="46" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="64" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="8" y="22" width="74" height="9" rx="3" fill="white" />
            <path d="M5 22 L45 4 L85 22" stroke="#C9A84C" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
        <div style={{ flex: 1, background: "#0F7BA0", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="34" height="31" viewBox="0 0 90 82" fill="none">
            <rect x="8" y="68" width="74" height="7" rx="3.5" fill="white" />
            <rect x="12" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="30" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="48" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="66" y="34" width="13" height="35" rx="3" fill="white" />
            <rect x="10" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="28" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="46" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="64" y="30" width="17" height="5" rx="2" fill="#C9A84C" />
            <rect x="8" y="22" width="74" height="9" rx="3" fill="white" />
            <path d="M5 22 L45 4 L85 22" stroke="#C9A84C" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "800" }}>عقار إنسايت</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px" }}>منصة ذكية للعقار</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "#999", fontWeight: "600" }}>أ — أعمدة كلاسيك مع ذهبي</div>
    </div>
  );
}
