import { Link } from "wouter";
import { Globe, Phone, PlusCircle, Users, Smartphone, ChevronLeft } from "lucide-react";
import { useLang } from "@/contexts/language-context";

export function TopBar() {
  const { t, toggleLang, lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div
      className="w-full h-9 flex items-center px-4 md:px-8 lg:px-12 shrink-0"
      style={{
        background: "linear-gradient(90deg, #0a1628 0%, #0F1C3F 35%, #0F7BA0 75%, #0a5f7e 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Left/Start side — quick links */}
      <div className="flex items-center gap-0.5 flex-1">
        <Link href="/listings/new">
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all text-[11px] font-medium">
            <PlusCircle className="w-3 h-3" />
            <span className="hidden sm:inline">{t("postProperty")}</span>
          </button>
        </Link>
        <span className="text-white/20 text-xs">|</span>
        <Link href="/marketers">
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all text-[11px] font-medium">
            <Users className="w-3 h-3" />
            <span className="hidden sm:inline">{t("findAgent")}</span>
          </button>
        </Link>
        <span className="text-white/20 text-xs hidden sm:inline">|</span>
        <a
          href="tel:920033337"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all text-[11px] font-medium"
        >
          <Phone className="w-3 h-3" />
          <span>920-033-337</span>
        </a>
      </div>

      {/* Center — slogan */}
      <div className="hidden md:flex items-center justify-center flex-shrink-0 px-4">
        <span className="text-white/50 text-[10px] font-medium tracking-wide whitespace-nowrap">
          {t("siteSlogan")}
        </span>
      </div>

      {/* Right/End side — language toggle + icon */}
      <div className="flex items-center gap-1 justify-end flex-1">
        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-all border border-white/15 hover:border-white/30"
          title={isAr ? "Switch to English" : "التبديل للعربية"}
        >
          <Globe className="w-3 h-3 flex-shrink-0" />
          <span className="text-[11px] font-bold tracking-wide">{t("langCode")}</span>
          <span className="text-[11px] text-white/60 hidden sm:inline">{t("switchLang")}</span>
        </button>
      </div>
    </div>
  );
}
