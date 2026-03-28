import { Link } from "wouter";
import { Home, ArrowRight, Building2 } from "lucide-react";
import { LogoBrand } from "@/components/logo-brand";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F3460 50%, #0F7BA0 100%)" }}
    >
      <div className="flex flex-col items-center text-center px-6 max-w-lg">
        <div className="mb-8">
          <LogoBrand variant="login" />
        </div>

        <div className="relative mb-6">
          <span
            className="text-[120px] font-black leading-none select-none"
            style={{ color: "rgba(15,123,160,0.25)" }}
          >
            404
          </span>
          <Building2
            className="absolute inset-0 m-auto w-16 h-16"
            style={{ color: "#C9A84C" }}
          />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-3">
          الصفحة غير موجودة
        </h1>
        <p className="text-white/60 text-base mb-10 leading-relaxed">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
          ربما تم نقلها أو حذفها أو أن الرابط غير صحيح.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300"
            style={{ background: "#0F7BA0" }}
          >
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <Link
            href="/listings"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/90 border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            <ArrowRight className="w-4 h-4" />
            تصفح العقارات
          </Link>
        </div>
      </div>
    </div>
  );
}
