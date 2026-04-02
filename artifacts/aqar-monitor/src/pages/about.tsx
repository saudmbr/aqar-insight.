import { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout/layout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Zap, TrendingUp, Building2,
  Users, BarChart3, Star, CheckCircle2, Eye, Target,
  ArrowLeft, Sparkles, Globe2, Home, ChevronLeft,
  Map, Layers, Database,
  Telescope, Crosshair, Activity,
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 22 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

/* ─── SVG Illustrations ─────────────────────────────────────── */

function IllustrationCity() {
  return (
    <svg viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="118" width="220" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
      <rect x="12" y="52" width="28" height="66" rx="3" fill="rgba(15,123,160,0.35)" />
      <rect x="12" y="52" width="28" height="4" rx="1" fill="rgba(15,123,160,0.6)" />
      {[60,72,84,96,108].map(y => (
        <rect key={y} x="17" y={y} width="5" height="5" rx="1" fill="rgba(255,255,255,0.18)" />
      ))}
      {[60,72,84,96,108].map(y => (
        <rect key={y} x="27" y={y} width="5" height="5" rx="1" fill="rgba(255,255,255,0.12)" />
      ))}
      <line x1="26" y1="52" x2="26" y2="38" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      <circle cx="26" cy="37" r="2" fill="#0F7BA0" />
      <rect x="48" y="70" width="34" height="48" rx="3" fill="rgba(148,163,184,0.2)" />
      <rect x="48" y="70" width="34" height="4" rx="1" fill="rgba(148,163,184,0.4)" />
      {[78,90,102].map(y => (
        <g key={y}>
          <rect x="54" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.14)" />
          <rect x="64" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.08)" />
          <rect x="74" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.18)" />
        </g>
      ))}
      <rect x="90" y="30" width="36" height="88" rx="3" fill="rgba(15,123,160,0.45)" />
      <rect x="90" y="30" width="36" height="5" rx="1" fill="#0F7BA0" />
      {[38,50,62,74,86,98,110].map(y => (
        <g key={y}>
          <rect x="96" y={y} width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.2)" />
          <rect x="108" y={y} width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.1)" />
        </g>
      ))}
      <rect x="102" y="20" width="12" height="10" rx="2" fill="rgba(15,123,160,0.6)" />
      <line x1="108" y1="10" x2="108" y2="20" stroke="#94A3B8" strokeWidth="1.5" />
      <circle cx="108" cy="9" r="2.5" fill="#94A3B8" />
      <rect x="134" y="60" width="30" height="58" rx="3" fill="rgba(15,28,63,0.5)" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
      {[68,80,92,104].map(y => (
        <g key={y}>
          <rect x="140" y={y} width="5" height="5" rx="1" fill="rgba(255,255,255,0.15)" />
          <rect x="152" y={y} width="5" height="5" rx="1" fill="rgba(148,163,184,0.25)" />
        </g>
      ))}
      <rect x="172" y="80" width="38" height="38" rx="3" fill="rgba(15,123,160,0.25)" />
      <rect x="172" y="80" width="38" height="4" rx="1" fill="rgba(15,123,160,0.5)" />
      {[88,100,110].map(y => (
        <g key={y}>
          <rect x="178" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.12)" />
          <rect x="189" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.18)" />
          <rect x="200" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.1)" />
        </g>
      ))}
      {[[30,15],[60,8],[140,12],[180,6],[200,20]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(255,255,255,0.4)" />
      ))}
      <circle cx="195" cy="14" r="7" fill="rgba(148,163,184,0.15)" />
      <circle cx="199" cy="12" r="5" fill="rgba(15,28,63,0.9)" />
    </svg>
  );
}

function IllustrationChart() {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {[30,55,80,105].map(y => (
        <line key={y} x1="20" y1={y} x2="185" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      <line x1="20" y1="20" x2="20" y2="118" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <line x1="20" y1="118" x2="185" y2="118" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <path d="M20,95 L50,80 L80,60 L110,50 L140,35 L170,25 L185,22 L185,118 L20,118 Z" fill="url(#chartGrad)" opacity="0.4" />
      <path d="M20,95 L50,80 L80,60 L110,50 L140,35 L170,25 L185,22" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {[[20,95],[50,80],[80,60],[110,50],[140,35],[170,25],[185,22]].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#0F7BA0" />
          <circle cx={x} cy={y} r="2" fill="white" />
        </g>
      ))}
      {[[45,100,18],[75,85,15],[105,72,15],[135,55,14],[165,42,13]].map(([x,h,w],i) => (
        <rect key={i} x={x-w/2} y={118-h} width={w} height={h} rx="3" fill="rgba(148,163,184,0.15)" />
      ))}
      <text x="100" y="14" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Cairo, sans-serif">متوسط الأسعار</text>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F7BA0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0F7BA0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#0F7BA0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IllustrationMap() {
  return (
    <svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="10" y="10" width="180" height="120" rx="12" fill="rgba(15,123,160,0.08)" stroke="rgba(15,123,160,0.2)" strokeWidth="1" />
      <path d="M10,70 L190,70" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
      <path d="M100,10 L100,130" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
      <rect x="20" y="20" width="35" height="28" rx="4" fill="rgba(148,163,184,0.12)" />
      <rect x="65" y="20" width="25" height="32" rx="4" fill="rgba(15,123,160,0.15)" />
      <rect x="112" y="18" width="30" height="25" rx="4" fill="rgba(148,163,184,0.1)" />
      <rect x="148" y="22" width="35" height="28" rx="4" fill="rgba(15,123,160,0.12)" />
      <rect x="20" y="85" width="45" height="32" rx="4" fill="rgba(15,123,160,0.12)" />
      <rect x="110" y="82" width="28" height="35" rx="4" fill="rgba(148,163,184,0.12)" />
      <rect x="148" y="80" width="35" height="38" rx="4" fill="rgba(15,123,160,0.1)" />
      <circle cx="100" cy="55" r="14" fill="rgba(15,123,160,0.25)" />
      <circle cx="100" cy="55" r="9" fill="#0F7BA0" />
      <circle cx="100" cy="55" r="4" fill="white" />
      <line x1="100" y1="64" x2="100" y2="75" stroke="#0F7BA0" strokeWidth="2" />
      <ellipse cx="100" cy="76" rx="5" ry="2" fill="rgba(15,123,160,0.3)" />
      <circle cx="55" cy="35" r="6" fill="rgba(148,163,184,0.5)" />
      <circle cx="55" cy="35" r="3" fill="#94A3B8" />
      <circle cx="155" cy="95" r="6" fill="rgba(15,123,160,0.4)" />
      <circle cx="155" cy="95" r="3" fill="#0F7BA0" />
      <rect x="112" y="40" width="62" height="22" rx="8" fill="#0F1C3F" stroke="rgba(15,123,160,0.5)" strokeWidth="1" />
      <text x="143" y="55" textAnchor="middle" fill="white" fontSize="8" fontFamily="Cairo, sans-serif" fontWeight="bold">٢.٥ م.ر / م²</text>
    </svg>
  );
}

/* ─── Premium Icon Box ───────────────────────────────────────── */

function IconBox({
  icon: Icon,
  gradient,
  glow,
  size = "md",
}: {
  icon: React.ElementType;
  gradient: string;
  glow: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-10 h-10" : "w-14 h-14";
  const iconDims = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-5 h-5" : "w-7 h-7";
  return (
    <div
      className={`${dims} rounded-2xl flex items-center justify-center shrink-0`}
      style={{
        background: gradient,
        boxShadow: `0 8px 24px ${glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      <Icon className={`${iconDims} text-white`} strokeWidth={1.7} />
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────── */

const STATS = [
  {
    value: "٤",
    label: "خدمات متكاملة في منصة واحدة",
    icon: Layers,
    gradient: "linear-gradient(135deg,#0F7BA0,#0a5f80)",
    glow: "rgba(15,123,160,0.4)",
  },
  {
    value: "مجاناً",
    label: "التسجيل والاستخدام الأساسي",
    icon: Zap,
    gradient: "linear-gradient(135deg,#0d6d8e,#0F7BA0)",
    glow: "rgba(13,109,142,0.45)",
  },
  {
    value: "آمن",
    label: "منصة موثوقة ومُدارة",
    icon: Shield,
    gradient: "linear-gradient(135deg,#64748b,#475569)",
    glow: "rgba(148,163,184,0.4)",
  },
];


const WHY_US = [
  { icon: BarChart3,    text: "مقارنة أسعار الأحياء في ثوانٍ",                gradient: "linear-gradient(135deg,#0F7BA0,#0a5a78)", glow: "rgba(15,123,160,0.3)" },
  { icon: Map,          text: "خريطة تفاعلية لجميع العقارات",                  gradient: "linear-gradient(135deg,#0d6d8e,#084f68)", glow: "rgba(13,109,142,0.3)" },
  { icon: TrendingUp,   text: "مؤشرات السوق لحظة بلحظة",                       gradient: "linear-gradient(135deg,#0F7BA0,#0a5a78)", glow: "rgba(15,123,160,0.3)" },
  { icon: Users,        text: "شبكة مسوّقين ومزودي خدمات موثّقين",             gradient: "linear-gradient(135deg,#475569,#334155)", glow: "rgba(71,85,105,0.3)"  },
  { icon: Building2,    text: "منصة متكاملة للبيع والإيجار والاستثمار",         gradient: "linear-gradient(135deg,#1e3a5f,#0F1C3F)", glow: "rgba(30,58,95,0.3)"  },
  { icon: Database,     text: "بيانات موثّقة ومحدّثة باستمرار",                gradient: "linear-gradient(135deg,#64748b,#475569)", glow: "rgba(100,116,139,0.3)"},
];

/* ─── Platform Rating Component ─────────────────────────────── */

function PlatformRating() {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(0);
  const [avg, setAvg]           = useState(0);
  const [count, setCount]       = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`/api/platform-rating`);
      const d = await r.json();
      setAvg(d.avg ?? 0);
      setCount(d.count ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    const saved = localStorage.getItem("platform_rating_v1");
    if (saved) { setSelected(parseInt(saved, 10)); setSubmitted(true); }
  }, [fetchStats]);

  const handleRate = async (stars: number) => {
    if (submitted || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/platform-rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });
      const d = await r.json();
      if (d.success) {
        setSelected(stars);
        setSubmitted(true);
        setAvg(d.avg ?? 0);
        setCount(d.count ?? 0);
        localStorage.setItem("platform_rating_v1", String(stars));
      }
    } catch {}
    setLoading(false);
  };

  const activeStars = hovered || selected;

  return (
    <motion.div variants={fadeUp}>
      <div
        className="rounded-[26px] overflow-hidden text-center py-12 px-8"
        style={{
          background: "linear-gradient(135deg,#fff 0%,#f8fafc 100%)",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 8px 40px rgba(15,28,63,0.07)",
        }}
      >
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold text-amber-700 mb-5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          قيّم المنصة
        </div>

        <h2 className="text-2xl font-extrabold text-foreground mb-2">
          {submitted ? "شكراً لتقييمك!" : "كيف تقيّم تجربتك مع عقار إنسايت؟"}
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
          {submitted
            ? `أضفت تقييم ${selected} من ٥ نجوم. رأيك يساعدنا على التحسين المستمر.`
            : "أخبرنا برأيك — اختر عدد النجوم فقط"}
        </p>

        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onMouseEnter={() => !submitted && setHovered(s)}
              onMouseLeave={() => !submitted && setHovered(0)}
              onClick={() => handleRate(s)}
              disabled={submitted || loading}
              className="transition-all duration-150 focus:outline-none disabled:cursor-not-allowed"
              style={{ transform: activeStars >= s ? "scale(1.18)" : "scale(1)" }}
              aria-label={`${s} نجوم`}
            >
              <Star
                className="w-11 h-11 transition-colors duration-150"
                style={{
                  fill: activeStars >= s ? "#FBBF24" : "#E5E7EB",
                  color: activeStars >= s ? "#F59E0B" : "#D1D5DB",
                  filter: activeStars >= s ? "drop-shadow(0 2px 6px rgba(251,191,36,0.5))" : "none",
                }}
              />
            </button>
          ))}
        </div>

        {count > 0 && (
          <div className="flex items-center justify-center gap-5">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground" style={{ fontFeatureSettings: "'tnum'" }}>
                {avg.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">متوسط التقييم</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground" style={{ fontFeatureSettings: "'tnum'" }}>
                {count.toLocaleString("ar-SA")}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">عدد المقيّمين</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-4 h-4" style={{ fill: i <= Math.round(avg) ? "#FBBF24" : "#E5E7EB", color: i <= Math.round(avg) ? "#F59E0B" : "#D1D5DB" }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Component ──────────────────────────────────────────────── */

export default function About() {
  useEffect(() => {
    document.title = "من نحن – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  return (
    <Layout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-14 pb-20" dir="rtl">

        {/* ══════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div
            className="relative rounded-[2rem] overflow-hidden"
            style={{
              background: "linear-gradient(130deg, #071022 0%, #0F1C3F 45%, #0a2a4a 70%, #0d5a78 100%)",
              boxShadow: "0 40px 100px rgba(15,28,63,0.5)",
              minHeight: "340px",
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse,rgba(15,123,160,0.35) 0%,transparent 70%)" }} />

            <div className="relative flex flex-col md:flex-row items-center gap-0">
              <div className="flex-1 px-8 py-14 md:px-14 md:py-16 text-white">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-[#94A3B8]" />
                  عقار إنسايت
                </div>
                <h1 className="text-[3rem] md:text-[3.6rem] font-extrabold leading-[1.08] tracking-tight mb-5">
                  من{" "}
                  <span
                    className="relative inline-block"
                    style={{
                      background: "linear-gradient(90deg,#94A3B8,#0F7BA0)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    نحن
                  </span>
                </h1>
                <p className="text-[16px] text-white/75 leading-relaxed font-medium max-w-md mb-8">
                  عقار إنسايت منصة سعودية متخصصة في تحليل بيانات السوق العقاري.
                  نؤمن أن كل قرار عقاري يستحق بيانات حقيقية — لذلك بنينا منصة تجمع
                  أسعار السوق وتحليلات الأحياء والأدوات التي يحتاجها المشتري والبائع والمستثمر.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href="/listings"
                    className="inline-flex items-center gap-2 bg-[#0F7BA0] hover:bg-[#0d6d8e] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#0F7BA0]/30"
                  >
                    <Building2 className="w-4 h-4" />
                    تصفح العقارات
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/marketers"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all border border-white/15"
                  >
                    <Users className="w-4 h-4" />
                    دليل المسوّقين
                  </Link>
                </div>
              </div>

              {/* Hero Illustration — floating data cards */}
            <div className="flex-shrink-0 w-full md:w-[340px] h-[240px] md:min-h-[340px] relative flex items-center justify-center overflow-hidden">
              {/* Background glow blob */}
              <div className="absolute w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(ellipse,rgba(15,123,160,0.18) 0%,transparent 70%)" }} />

              {/* Card 1 — active listings */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-6 right-4 rounded-2xl px-4 py-3 shadow-2xl"
                style={{ background: "#fff", border: "1px solid rgba(15,123,160,0.15)", minWidth: 148 }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0F7BA0,#0a5a78)" }}>
                    <Building2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-[#94A3B8]">إعلانات نشطة</span>
                </div>
                <p className="text-xl font-extrabold text-[#0F1C3F] leading-none">+٢٠٠</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500">نمو مستمر</span>
                </div>
              </motion.div>

              {/* Card 2 — marketers */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.8 }}
                className="absolute bottom-10 right-3 rounded-2xl px-4 py-3 shadow-2xl"
                style={{ background: "#0F1C3F", border: "1px solid rgba(15,123,160,0.3)", minWidth: 138 }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(15,123,160,0.3)" }}>
                    <Users className="w-3.5 h-3.5 text-[#7ec8e3]" />
                  </div>
                  <span className="text-[10px] font-bold text-white/50">مسوّقون مسجّلون</span>
                </div>
                <p className="text-xl font-extrabold text-white leading-none">+٥٠</p>
                <div className="mt-1.5 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-[#0F1C3F]"
                      style={{ background: `hsl(${190 + i*15},60%,${40+i*5}%)`, marginRight: i > 1 ? -6 : 0 }} />
                  ))}
                </div>
              </motion.div>

              {/* Card 3 — price badge */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1.5 }}
                className="absolute top-14 left-2 rounded-2xl px-3 py-2.5 shadow-xl"
                style={{ background: "linear-gradient(135deg,#0F7BA0,#095a75)", minWidth: 120 }}
              >
                <p className="text-[9px] font-bold text-white/60 mb-0.5">متوسط متر الرياض</p>
                <p className="text-sm font-extrabold text-white leading-none">٤,٨٠٠ ر.س/م²</p>
              </motion.div>

              {/* Card 4 — activity pulse */}
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-4 left-4 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2"
                style={{ background: "rgba(15,28,63,0.85)", border: "1px solid rgba(15,123,160,0.4)" }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white/80">منصة نشطة</span>
              </motion.div>

              {/* Central icon */}
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,rgba(15,123,160,0.25),rgba(15,28,63,0.5))",
                  border: "1.5px solid rgba(15,123,160,0.3)",
                  boxShadow: "0 12px 40px rgba(15,123,160,0.25)",
                }}>
                <Activity className="w-9 h-9 text-[#7ec8e3]" strokeWidth={1.5} />
              </div>
            </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            STATS ROW — Premium icon boxes
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="relative rounded-[20px] p-6 overflow-hidden group cursor-default"
                style={{
                  background: "linear-gradient(135deg,#fff 0%,#f8fafc 100%)",
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(15,28,63,0.06)",
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(135deg,rgba(15,123,160,0.04),transparent)" }} />
                <div className="mb-4">
                  <IconBox icon={s.icon} gradient={s.gradient} glow={s.glow} size="sm" />
                </div>
                <div className="text-2xl font-extrabold text-[#0F1C3F] mb-1" style={{ fontFeatureSettings: "'tnum'" }}>
                  {s.value}
                </div>
                <div className="text-xs font-semibold text-muted-foreground leading-snug">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            VISION & MISSION
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-6">

          {/* رؤيتنا */}
          <div
            className="relative rounded-[24px] overflow-hidden group"
            style={{
              background: "linear-gradient(140deg,#0F1C3F 0%,#0e2a45 60%,#0d3a58 100%)",
              boxShadow: "0 12px 40px rgba(15,28,63,0.25)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[24px]"
              style={{ background: "linear-gradient(90deg,#0F7BA0,#94A3B8)" }} />
            <div className="absolute left-0 bottom-0 w-56 h-40 opacity-25 group-hover:opacity-35 transition-opacity duration-500">
              <IllustrationMap />
            </div>
            <div className="relative p-8 md:p-10">
              <div className="mb-6">
                <IconBox
                  icon={Telescope}
                  gradient="linear-gradient(135deg,#0F7BA0,#0a5a78)"
                  glow="rgba(15,123,160,0.5)"
                  size="lg"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#0F7BA0]/20 border border-[#0F7BA0]/30 px-3 py-1 rounded-full text-[11px] font-bold text-[#7ec8e3] mb-4">
                <Eye className="w-3 h-3" />
                رؤيتنا
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-4 leading-snug">
                المرجع الأول<br />للبيانات العقارية
              </h2>
              <p className="text-white/70 leading-relaxed text-[15px] max-w-xs">
                أن نكون المرجع الأول والأكثر موثوقية للبيانات العقارية في المملكة العربية السعودية،
                ونساهم في بناء سوق عقاري شفاف يتماشى مع أهداف رؤية 2030.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-4 py-2">
                <Globe2 className="w-4 h-4 text-[#94A3B8]" />
                <span className="text-xs font-semibold text-white/60">رؤية 2030</span>
              </div>
            </div>
          </div>

          {/* مهمتنا */}
          <div
            className="relative rounded-[24px] overflow-hidden group"
            style={{
              background: "linear-gradient(140deg,#0a1f3a 0%,#0F1C3F 60%,#0e2a45 100%)",
              boxShadow: "0 12px 40px rgba(15,28,63,0.25)",
              border: "1px solid rgba(148,163,184,0.15)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[24px]"
              style={{ background: "linear-gradient(90deg,#94A3B8,#0F7BA0)" }} />
            <div className="absolute left-0 bottom-0 w-64 h-44 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              <IllustrationChart />
            </div>
            <div className="relative p-8 md:p-10">
              <div className="mb-6">
                <IconBox
                  icon={Crosshair}
                  gradient="linear-gradient(135deg,#64748b,#475569)"
                  glow="rgba(100,116,139,0.5)"
                  size="lg"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#94A3B8]/20 border border-[#94A3B8]/30 px-3 py-1 rounded-full text-[11px] font-bold text-[#94A3B8] mb-4">
                <Target className="w-3 h-3" />
                مهمتنا
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-4 leading-snug">
                القرار الصح<br />يبدأ بالمعلومة الصح
              </h2>
              <p className="text-white/70 leading-relaxed text-[15px] max-w-xs">
                نقدّم بيانات دقيقة، تحليلات ذكية، وأدوات متكاملة تربط المشترين والبائعين
                والمستثمرين والمسوّقين في منظومة واحدة.
              </p>
              <div className="mt-6 space-y-2">
                {["بيانات دقيقة وموثّقة", "تحليلات لحظية للسوق", "أدوات متكاملة للجميع"].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F7BA0] shrink-0" />
                    <span className="text-xs font-semibold text-white/65">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            WHY US — Premium icon grid
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div
            className="rounded-[26px] overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#0F1C3F 0%,#0a2a4a 50%,#0d3a58 100%)",
              boxShadow: "0 20px 60px rgba(15,28,63,0.3)",
            }}
          >
            <div className="px-8 pt-10 pb-6 text-center border-b border-white/10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs font-bold text-white/80 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#94A3B8]" />
                الفرق الحقيقي
              </div>
              <h2 className="text-2xl font-extrabold text-white">لماذا عقار إنسايت؟</h2>
            </div>

            <div className="p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {WHY_US.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-4 rounded-[18px] px-5 py-4 group hover:bg-white/8 transition-all duration-200 cursor-default"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200"
                    style={{
                      background: item.gradient,
                      boxShadow: `0 6px 18px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}
                  >
                    <item.icon className="w-5 h-5 text-white" strokeWidth={1.7} />
                  </div>
                  <span className="text-sm font-semibold text-white/80 leading-snug group-hover:text-white transition-colors">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            PLATFORM STAR RATING
        ══════════════════════════════════════════════════ */}
        <PlatformRating />

        {/* ══════════════════════════════════════════════════
            CTA
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div
            className="relative rounded-[26px] overflow-hidden text-center"
            style={{
              background: "linear-gradient(135deg,#071022 0%,#0F1C3F 40%,#0a3a55 80%,#0F7BA0 100%)",
              boxShadow: "0 24px 64px rgba(15,28,63,0.4)",
              padding: "clamp(40px,8vw,72px) clamp(24px,6vw,80px)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%,rgba(15,123,160,0.35),transparent)" }} />
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />

            <div className="relative">
              {/* Premium icon instead of emoji */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,rgba(15,123,160,0.5),rgba(15,28,63,0.8))",
                    boxShadow: "0 12px 40px rgba(15,123,160,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                    border: "1px solid rgba(15,123,160,0.4)",
                  }}
                >
                  <Home className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-white/60 text-sm font-semibold mb-2 tracking-wider uppercase">جاهز تبدأ؟</p>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
                خذ القرار الصح<br />
                <span style={{ color: "#94A3B8" }}>في عقارك</span>
              </h3>
              <p className="text-white/55 max-w-md mx-auto mb-8 text-[15px] leading-relaxed">
                انضم لآلاف المستخدمين الذين يثقون بعقار إنسايت لاتخاذ قراراتهم العقارية بثقة ووضوح.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-2 bg-white text-[#0F1C3F] font-extrabold px-8 py-3.5 rounded-2xl text-sm hover:bg-white/92 transition-all shadow-xl shadow-white/10"
                >
                  <Building2 className="w-4 h-4" />
                  تصفح العقارات
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <Link
                  href="/districts"
                  className="inline-flex items-center gap-2 bg-white/12 hover:bg-white/18 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all border border-white/15"
                >
                  <BarChart3 className="w-4 h-4" />
                  مقارنة الأحياء
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </Layout>
  );
}

