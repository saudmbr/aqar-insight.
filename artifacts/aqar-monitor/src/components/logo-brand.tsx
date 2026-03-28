import { Link } from "wouter";

interface LogoBrandProps {
  variant?: "hero" | "sidebar" | "header" | "footer";
  className?: string;
  linkTo?: string;
}

function LogoIcon({
  size = 40,
  mode = "gradient",
}: {
  size?: number;
  mode?: "gradient" | "white" | "teal" | "navy";
}) {
  const gid = `lg-${mode}-${size}`;

  const fill = mode === "gradient" ? `url(#${gid})` : mode === "white" ? "#ffffff" : mode === "teal" ? "#0F7BA0" : "#0F1C3F";
  const stroke = fill;

  return (
    <svg
      width={size}
      height={Math.round(size * 0.875)}
      viewBox="0 0 80 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      {mode === "gradient" && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="80" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F1C3F" />
            <stop offset="100%" stopColor="#0F7BA0" />
          </linearGradient>
        </defs>
      )}
      {/* Base platform */}
      <rect x="10" y="57" width="60" height="6" rx="3" fill={fill} />
      {/* Four columns */}
      <rect x="13" y="29" width="10" height="29" rx="2.5" fill={fill} />
      <rect x="27" y="29" width="10" height="29" rx="2.5" fill={fill} />
      <rect x="41" y="29" width="10" height="29" rx="2.5" fill={fill} />
      <rect x="55" y="29" width="10" height="29" rx="2.5" fill={fill} />
      {/* Entablature */}
      <rect x="10" y="22" width="60" height="8" rx="2.5" fill={fill} />
      {/* Pediment */}
      <path
        d="M7 22 L40 5 L73 22"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoBrand({ variant = "header", className = "", linkTo = "/" }: LogoBrandProps) {
  let content: React.ReactNode;

  if (variant === "hero") {
    content = (
      <div className={`flex flex-col items-center gap-3 select-none ${className}`}>
        <LogoIcon size={72} mode="gradient" />
        <div className="text-center">
          <p
            className="text-3xl font-extrabold leading-tight"
            style={{ color: "#0F1C3F", letterSpacing: "-0.01em" }}
          >
            عقار إنسايت
          </p>
          <p className="text-sm font-medium mt-1.5" style={{ color: "#0F7BA0" }}>
            منصة ذكية للعقار
          </p>
        </div>
      </div>
    );
  } else if (variant === "sidebar") {
    content = (
      <div className={`flex flex-col items-center gap-3 w-full select-none ${className}`}>
        <LogoIcon size={56} mode="white" />
        <div className="text-center">
          <p className="text-lg font-extrabold text-white leading-tight">عقار إنسايت</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
            منصة ذكية للعقار
          </p>
        </div>
      </div>
    );
  } else if (variant === "header") {
    content = (
      <div className={`flex items-center gap-2.5 select-none shrink-0 ${className}`}>
        <LogoIcon size={30} mode="teal" />
        <span
          className="font-extrabold text-base leading-tight hidden xs:block"
          style={{ color: "#0F1C3F" }}
        >
          عقار إنسايت
        </span>
      </div>
    );
  } else {
    content = (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <LogoIcon size={28} mode="navy" />
        <div>
          <p className="font-extrabold text-sm leading-none" style={{ color: "#0F1C3F" }}>
            عقار إنسايت
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "#0F7BA0" }}>
            منصة ذكية للعقار
          </p>
        </div>
      </div>
    );
  }

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>;
  }
  return <>{content}</>;
}
