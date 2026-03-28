import { Link } from "wouter";

interface LogoBrandProps {
  variant?: "hero" | "sidebar" | "header" | "footer";
  className?: string;
  linkTo?: string;
}

/* ── City Skyline Icon ─────────────────────────────────── */
function SkylineIcon({
  size = 48,
  mode = "gradient",
  uid = "a",
}: {
  size?: number;
  mode?: "gradient" | "white" | "teal" | "navy";
  uid?: string;
}) {
  const h = Math.round(size * (68 / 96));
  const gid = `sky-${uid}`;

  const skyFill = mode === "gradient" ? `url(#${gid})` : mode === "white" ? "rgba(255,255,255,0.9)" : mode === "teal" ? "#0F7BA0" : "#0F1C3F";
  const winFill = mode === "white" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.6)";
  const antFill = mode === "gradient" ? "#0F7BA0" : mode === "white" ? "rgba(255,255,255,0.9)" : mode === "teal" ? "#0d9bc8" : "#1a3060";

  return (
    <svg width={size} height={h} viewBox="0 0 96 68" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", flexShrink: 0 }}>
      {mode === "gradient" && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="96" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F7BA0" />
            <stop offset="60%" stopColor="#0d6d8e" />
            <stop offset="100%" stopColor="#0F1C3F" />
          </linearGradient>
        </defs>
      )}
      {/* Base ground line */}
      <rect x="0" y="60" width="96" height="4" rx="2" fill={skyFill} opacity={mode === "gradient" ? 0.35 : 0.4} />
      {/* Buildings */}
      <rect x="4"  y="20" width="12" height="40" rx="2.5" fill={skyFill} />
      <rect x="20" y="38" width="9"  height="22" rx="2"   fill={skyFill} opacity={mode === "gradient" ? 0.75 : 0.7} />
      <rect x="33" y="28" width="11" height="32" rx="2.5" fill={skyFill} />
      <rect x="48" y="10" width="13" height="50" rx="2.5" fill={skyFill} />
      <rect x="65" y="30" width="11" height="30" rx="2.5" fill={skyFill} />
      <rect x="80" y="40" width="9"  height="20" rx="2"   fill={skyFill} opacity={mode === "gradient" ? 0.75 : 0.7} />
      {/* Antenna */}
      <rect x="54" y="4" width="1.5" height="8" rx="0.75" fill={skyFill} />
      <circle cx="54.75" cy="3.5" r="2" fill={antFill} />
      {/* Windows */}
      <rect x="7"  y="25" width="2.5" height="2" rx="0.5" fill={winFill} />
      <rect x="11" y="25" width="2.5" height="2" rx="0.5" fill={winFill} />
      <rect x="7"  y="30" width="2.5" height="2" rx="0.5" fill={winFill} />
      <rect x="11" y="30" width="2.5" height="2" rx="0.5" fill={winFill} />
      <rect x="51" y="15" width="2.5" height="2" rx="0.5" fill={winFill} />
      <rect x="55" y="15" width="2.5" height="2" rx="0.5" fill={winFill} />
      <rect x="51" y="21" width="2.5" height="2" rx="0.5" fill={winFill} />
      <rect x="55" y="21" width="2.5" height="2" rx="0.5" fill={winFill} />
    </svg>
  );
}

/* ── LogoBrand ─────────────────────────────────────────── */
export function LogoBrand({ variant = "header", className = "", linkTo = "/" }: LogoBrandProps) {
  let content: React.ReactNode;

  if (variant === "hero") {
    /* Auth pages — large centered stacked logo */
    content = (
      <div className={`flex flex-col items-center gap-3 select-none ${className}`} dir="rtl">
        <SkylineIcon size={96} mode="gradient" uid="hero" />
        <div className="text-center">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0 }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#0F1C3F", letterSpacing: "-0.5px", lineHeight: 1.1, fontFamily: "Cairo, sans-serif" }}>
              عقار
            </span>
            <span style={{ fontSize: "34px", fontWeight: 300, color: "#0F7BA0", letterSpacing: "-0.5px", lineHeight: 1.1, marginRight: "5px", fontFamily: "Cairo, sans-serif" }}>
              إنسايت
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
            <div style={{ width: "24px", height: "1px", background: "#0F7BA0", opacity: 0.5 }} />
            <span style={{ fontSize: "11px", color: "#0F7BA0", fontWeight: 600, letterSpacing: "1px", fontFamily: "Cairo, sans-serif" }}>
              منصة ذكية للعقار
            </span>
            <div style={{ width: "24px", height: "1px", background: "#0F7BA0", opacity: 0.5 }} />
          </div>
        </div>
      </div>
    );
  } else if (variant === "sidebar") {
    /* Dark navy sidebar — white icon + white text */
    content = (
      <div className={`flex flex-col items-center gap-2.5 w-full select-none ${className}`} dir="rtl">
        <SkylineIcon size={72} mode="white" uid="sidebar" />
        <div className="text-center">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0 }}>
            <span style={{ fontSize: "17px", fontWeight: 900, color: "white", fontFamily: "Cairo, sans-serif" }}>عقار</span>
            <span style={{ fontSize: "17px", fontWeight: 300, color: "rgba(255,255,255,0.85)", marginRight: "4px", fontFamily: "Cairo, sans-serif" }}>إنسايت</span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontFamily: "Cairo, sans-serif", marginTop: "2px" }}>منصة ذكية للعقار</p>
        </div>
      </div>
    );
  } else if (variant === "header") {
    /* Compact top header bar */
    content = (
      <div className={`flex items-center gap-2 select-none shrink-0 ${className}`} dir="rtl">
        <SkylineIcon size={32} mode="gradient" uid="header" />
        <div className="hidden sm:flex items-baseline gap-0.5">
          <span style={{ fontSize: "14px", fontWeight: 900, color: "#0F1C3F", fontFamily: "Cairo, sans-serif" }}>عقار</span>
          <span style={{ fontSize: "14px", fontWeight: 300, color: "#0F7BA0", fontFamily: "Cairo, sans-serif" }}>إنسايت</span>
        </div>
      </div>
    );
  } else {
    /* Footer */
    content = (
      <div className={`flex items-center gap-2 select-none ${className}`} dir="rtl">
        <SkylineIcon size={28} mode="teal" uid="footer" />
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ fontSize: "13px", fontWeight: 900, color: "#0F1C3F", fontFamily: "Cairo, sans-serif" }}>عقار</span>
            <span style={{ fontSize: "13px", fontWeight: 300, color: "#0F7BA0", fontFamily: "Cairo, sans-serif", marginRight: "3px" }}>إنسايت</span>
          </div>
          <p style={{ fontSize: "10px", color: "#0F7BA0", fontFamily: "Cairo, sans-serif", marginTop: "1px" }}>منصة ذكية للعقار</p>
        </div>
      </div>
    );
  }

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>;
  }
  return <>{content}</>;
}
