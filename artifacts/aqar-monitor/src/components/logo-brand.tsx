import { useState } from "react";
import { Link } from "wouter";

interface LogoBrandProps {
  variant?: "full" | "compact" | "stacked";
  className?: string;
  linkTo?: string;
  light?: boolean;
}

export function LogoBrand({
  variant = "full",
  className = "",
  linkTo = "/",
  light = true,
}: LogoBrandProps) {
  const [imgError, setImgError] = useState(false);

  const imgSrc = "/images/logo.png";

  if (variant === "stacked") {
    const content = (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="relative">
          {!imgError ? (
            <img
              src={imgSrc}
              alt="عقار إنسايت"
              className="w-24 h-24 object-contain drop-shadow-xl"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: "linear-gradient(135deg, #0F1C3F, #0F7BA0)" }}
            >
              <svg viewBox="0 0 60 60" className="w-12 h-12" fill="none">
                <rect x="8" y="42" width="44" height="3" rx="1.5" fill="white" opacity="0.95" />
                <rect x="12" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
                <rect x="20" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
                <rect x="28" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
                <rect x="36" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
                <rect x="8" y="17" width="44" height="6" rx="2" fill="white" opacity="0.95" />
                <path d="M14 17 Q30 5 46 17" stroke="white" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className={`text-2xl font-extrabold leading-tight tracking-tight ${light ? "text-white" : "text-foreground"}`}>
            عقار إنسايت
          </p>
          <p className={`text-sm font-medium mt-0.5 ${light ? "text-white/65" : "text-muted-foreground"}`}>
            منصة ذكية للعقار
          </p>
        </div>
      </div>
    );
    if (linkTo) return <Link href={linkTo}>{content}</Link>;
    return <>{content}</>;
  }

  if (variant === "compact") {
    const content = (
      <div className={`flex items-center justify-center ${className}`}>
        {!imgError ? (
          <img
            src={imgSrc}
            alt="عقار إنسايت"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg viewBox="0 0 60 60" className="w-full h-full" fill="none">
            <rect x="8" y="42" width="44" height="3" rx="1.5" fill="white" opacity="0.95" />
            <rect x="12" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
            <rect x="20" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
            <rect x="28" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
            <rect x="36" y="22" width="5" height="22" rx="1" fill="white" opacity="0.95" />
            <rect x="8" y="17" width="44" height="6" rx="2" fill="white" opacity="0.95" />
            <path d="M14 17 Q30 5 46 17" stroke="white" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
          </svg>
        )}
      </div>
    );
    if (linkTo) return <Link href={linkTo}>{content}</Link>;
    return <>{content}</>;
  }

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0 w-10 h-10">
        {!imgError ? (
          <img
            src={imgSrc}
            alt="عقار إنسايت"
            className="w-full h-full object-contain drop-shadow-md"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #0F1C3F, #0F7BA0)" }}
          >
            <svg viewBox="0 0 60 60" className="w-6 h-6" fill="none">
              <rect x="8" y="42" width="44" height="3" rx="1.5" fill="white" />
              <rect x="12" y="22" width="5" height="22" rx="1" fill="white" />
              <rect x="20" y="22" width="5" height="22" rx="1" fill="white" />
              <rect x="28" y="22" width="5" height="22" rx="1" fill="white" />
              <rect x="36" y="22" width="5" height="22" rx="1" fill="white" />
              <rect x="8" y="17" width="44" height="6" rx="2" fill="white" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-extrabold text-lg leading-tight tracking-tight ${light ? "text-white" : "text-foreground"}`}>
          عقار إنسايت
        </span>
        <span className={`text-[11px] font-medium mt-0.5 ${light ? "text-white/60" : "text-muted-foreground"}`}>
          منصة ذكية للعقار
        </span>
      </div>
    </div>
  );

  if (linkTo) return <Link href={linkTo}>{content}</Link>;
  return <>{content}</>;
}
