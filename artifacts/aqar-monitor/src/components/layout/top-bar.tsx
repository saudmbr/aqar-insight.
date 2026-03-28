import { Link, useLocation } from "wouter";
import { Globe, PlusCircle } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";

/* ── Social icons as inline SVGs (no extra deps needed) ── */
function TwitterX() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function Instagram() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
function Snapchat() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.5 1.131.254 3.174.17 4.08-.056.54-.569.54-.569.54s-.202.028-.202.342c0 .37.427.557.854.88.127.09.568.394.568.846 0 .388-.324.7-.7.7-.24 0-.383-.067-.383-.067-.213-.082-.43-.144-.624-.144-.45 0-.728.213-1.297.767C15.073 13.2 14.02 14 12.206 14c-1.814 0-2.867-.8-3.747-1.642-.57-.554-.848-.767-1.298-.767-.193 0-.41.062-.623.144 0 0-.144.067-.384.067-.376 0-.7-.312-.7-.7 0-.452.441-.756.568-.847.428-.323.855-.51.855-.879 0-.314-.202-.342-.202-.342s-.514 0-.57-.54c-.083-.906-.329-2.948.171-4.08C7.859 1.07 11.216.793 12.206.793z" />
    </svg>
  );
}
function LinkedIn() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function TopBar() {
  const { t, toggleLang, lang } = useLang();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isAr = lang === "ar";

  const handlePostProperty = () => {
    if (isAuthenticated) {
      navigate("/listings/new");
    } else {
      navigate("/login");
    }
  };

  return (
    <div
      className="w-full h-10 flex items-center px-4 md:px-6 lg:px-10 shrink-0 gap-3"
      style={{
        background: "linear-gradient(90deg, #071022 0%, #0F1C3F 40%, #0e6d8f 80%, #0a5f7e 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
      dir="rtl"
    >
      {/* ── Right: Post listing CTA ── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handlePostProperty}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-primary/80 hover:bg-primary transition-all border border-white/10 hover:border-white/20"
        >
          <PlusCircle className="w-3 h-3" />
          <span>{isAr ? "أضف إعلانك" : "Post Property"}</span>
        </button>
      </div>

      <span className="text-white/15 text-sm">|</span>

      {/* ── Social icons ── */}
      <div className="flex items-center gap-0.5">
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-all"
          title="Twitter / X"
        >
          <TwitterX />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-all"
          title="Instagram"
        >
          <Instagram />
        </a>
        <a
          href="https://snapchat.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-all"
          title="Snapchat"
        >
          <Snapchat />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-all"
          title="LinkedIn"
        >
          <LinkedIn />
        </a>
      </div>

      {/* ── Center slogan — pushes to fill space ── */}
      <div className="flex-1 flex items-center justify-center">
        <span className="hidden md:block text-white/40 text-[10px] font-medium tracking-wide whitespace-nowrap select-none">
          {isAr ? "المنصة العقارية الأولى في المملكة" : "Saudi Arabia's #1 Real Estate Platform"}
        </span>
      </div>

      {/* ── Language toggle ── */}
      <button
        onClick={toggleLang}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border shrink-0"
        style={{
          color: "rgba(255,255,255,0.9)",
          borderColor: "rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.07)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.35)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
        }}
        title={isAr ? "Switch to English" : "التبديل للعربية"}
      >
        <Globe className="w-3 h-3 flex-shrink-0" />
        {/* Always show both options — active one is brighter */}
        <span style={{ opacity: isAr ? 0.5 : 1 }}>EN</span>
        <span className="text-white/25">·</span>
        <span style={{ opacity: isAr ? 1 : 0.5 }}>عربي</span>
      </button>
    </div>
  );
}
