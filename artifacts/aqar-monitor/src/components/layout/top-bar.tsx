import { useLocation } from "wouter";
import { Globe, PlusCircle } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";

export function TopBar() {
  const { toggleLang, lang } = useLang();
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
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handlePostProperty}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-primary/80 hover:bg-primary transition-all border border-white/10 hover:border-white/20"
        >
          <PlusCircle className="w-3 h-3" />
          <span>{isAr ? "أضف إعلانك" : "Post Property"}</span>
        </button>
      </div>

      <div className="flex-1" />

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
        <span style={{ opacity: isAr ? 0.5 : 1 }}>EN</span>
        <span className="text-white/25">·</span>
        <span style={{ opacity: isAr ? 1 : 0.5 }}>عربي</span>
      </button>
    </div>
  );
}
