import type { CSSProperties } from "react";
import riyalImg from "/riyal.webp";

interface SARProps {
  value: number | null | undefined;
  className?: string;
  imgClassName?: string;
  perSqm?: boolean;
  dark?: boolean;
}

export function SAR({ value, className = "", imgClassName = "", perSqm = false, dark = false }: SARProps) {
  const n = value ?? 0;
  const formatted = n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (dark) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`} dir="ltr">
        <span>{formatted}</span>
        <span className="text-[0.75em] font-bold opacity-85" style={{ letterSpacing: "0.01em" }}>ريال</span>
        {perSqm && <span className="text-[0.7em] opacity-55">/م²</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-[2px] ${className}`} dir="ltr">
      <span>{formatted}</span>
      <img
        src={riyalImg}
        alt="ريال"
        aria-label="ريال سعودي"
        className={`inline-block w-auto self-center select-none ${imgClassName}`}
        style={{ height: "0.85em", filter: "var(--riyal-filter, none)", verticalAlign: "middle" } as CSSProperties}
      />
      {perSqm && <span className="text-[0.7em] opacity-70">/م²</span>}
    </span>
  );
}

export function SARStr(value: number | null | undefined): string {
  const n = value ?? 0;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " ريال";
}
