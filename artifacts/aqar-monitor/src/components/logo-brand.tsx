import { Link } from "wouter";

interface LogoBrandProps {
  variant?: "hero" | "sidebar" | "header" | "footer" | "login";
  className?: string;
  linkTo?: string;
}

export function LogoBrand({ variant = "header", className = "", linkTo = "/" }: LogoBrandProps) {
  let content: React.ReactNode;

  if (variant === "hero") {
    content = (
      <div className={`flex flex-col items-center gap-3 select-none ${className}`} dir="rtl">
        <img
          src="/logo.png"
          alt="عقار إنسايت"
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            boxShadow: "0 8px 32px rgba(15,123,160,0.35), 0 2px 8px rgba(0,0,0,0.25)",
            display: "block",
            flexShrink: 0,
          }}
        />
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
    content = (
      <div className={`flex flex-col items-center gap-2.5 w-full select-none ${className}`} dir="rtl">
        <img
          src="/logo.png"
          alt="عقار إنسايت"
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
            display: "block",
            flexShrink: 0,
          }}
        />
        <div className="text-center">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0 }}>
            <span style={{ fontSize: "17px", fontWeight: 900, color: "white", fontFamily: "Cairo, sans-serif" }}>عقار</span>
            <span style={{ fontSize: "17px", fontWeight: 300, color: "rgba(255,255,255,0.85)", marginRight: "4px", fontFamily: "Cairo, sans-serif" }}>إنسايت</span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontFamily: "Cairo, sans-serif", marginTop: "2px" }}>منصة ذكية للعقار</p>
        </div>
      </div>
    );
  } else if (variant === "login") {
    content = (
      <div className={`flex flex-col items-center gap-3 select-none ${className}`} dir="rtl">
        <img
          src="/logo.png"
          alt="عقار إنسايت"
          style={{
            width: 80,
            height: 80,
            borderRadius: 18,
            boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
            display: "block",
            flexShrink: 0,
          }}
        />
        <div className="text-center">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0 }}>
            <span style={{ fontSize: "26px", fontWeight: 900, color: "white", fontFamily: "Cairo, sans-serif" }}>عقار</span>
            <span style={{ fontSize: "26px", fontWeight: 300, color: "rgba(255,255,255,0.75)", marginRight: "4px", fontFamily: "Cairo, sans-serif" }}>إنسايت</span>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontFamily: "Cairo, sans-serif", marginTop: "4px", letterSpacing: "0.5px" }}>منصة ذكية للعقار</p>
        </div>
      </div>
    );
  } else if (variant === "header") {
    content = (
      <div className={`flex items-center gap-2 select-none shrink-0 ${className}`} dir="rtl">
        <img
          src="/logo.png"
          alt="عقار إنسايت"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(15,123,160,0.25)",
            display: "block",
            flexShrink: 0,
          }}
        />
        <div className="hidden sm:flex items-baseline gap-0.5">
          <span style={{ fontSize: "14px", fontWeight: 900, color: "#0F1C3F", fontFamily: "Cairo, sans-serif" }}>عقار</span>
          <span style={{ fontSize: "14px", fontWeight: 300, color: "#0F7BA0", fontFamily: "Cairo, sans-serif" }}>إنسايت</span>
        </div>
      </div>
    );
  } else {
    /* footer */
    content = (
      <div className={`flex items-center gap-2 select-none ${className}`} dir="rtl">
        <img
          src="/logo.png"
          alt="عقار إنسايت"
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            boxShadow: "0 1px 6px rgba(15,123,160,0.2)",
            display: "block",
            flexShrink: 0,
          }}
        />
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
