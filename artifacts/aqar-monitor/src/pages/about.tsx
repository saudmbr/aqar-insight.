import { useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Zap, Heart, TrendingUp, Building2, MapPin,
  Users, BarChart3, Star, CheckCircle2, Eye, Target,
  ArrowLeft, Sparkles, Globe2, ChevronLeft,
} from "lucide-react";

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
      {/* Ground */}
      <rect x="0" y="118" width="220" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
      {/* Building 1 – tall */}
      <rect x="12" y="52" width="28" height="66" rx="3" fill="rgba(15,123,160,0.35)" />
      <rect x="12" y="52" width="28" height="4" rx="1" fill="rgba(15,123,160,0.6)" />
      {[60,72,84,96,108].map(y => (
        <rect key={y} x="17" y={y} width="5" height="5" rx="1" fill="rgba(255,255,255,0.18)" />
      ))}
      {[60,72,84,96,108].map(y => (
        <rect key={y} x="27" y={y} width="5" height="5" rx="1" fill="rgba(255,255,255,0.12)" />
      ))}
      {/* Antenna */}
      <line x1="26" y1="52" x2="26" y2="38" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      <circle cx="26" cy="37" r="2" fill="#0F7BA0" />

      {/* Building 2 – medium */}
      <rect x="48" y="70" width="34" height="48" rx="3" fill="rgba(148,163,184,0.2)" />
      <rect x="48" y="70" width="34" height="4" rx="1" fill="rgba(148,163,184,0.4)" />
      {[78,90,102].map(y => (
        <g key={y}>
          <rect x="54" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.14)" />
          <rect x="64" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.08)" />
          <rect x="74" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.18)" />
        </g>
      ))}

      {/* Building 3 – skyscraper */}
      <rect x="90" y="30" width="36" height="88" rx="3" fill="rgba(15,123,160,0.45)" />
      <rect x="90" y="30" width="36" height="5" rx="1" fill="#0F7BA0" />
      {[38,50,62,74,86,98,110].map(y => (
        <g key={y}>
          <rect x="96" y={y} width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.2)" />
          <rect x="108" y={y} width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.1)" />
        </g>
      ))}
      {/* Roof accent */}
      <rect x="102" y="20" width="12" height="10" rx="2" fill="rgba(15,123,160,0.6)" />
      <line x1="108" y1="10" x2="108" y2="20" stroke="#94A3B8" strokeWidth="1.5" />
      <circle cx="108" cy="9" r="2.5" fill="#94A3B8" />

      {/* Building 4 */}
      <rect x="134" y="60" width="30" height="58" rx="3" fill="rgba(15,28,63,0.5)" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
      {[68,80,92,104].map(y => (
        <g key={y}>
          <rect x="140" y={y} width="5" height="5" rx="1" fill="rgba(255,255,255,0.15)" />
          <rect x="152" y={y} width="5" height="5" rx="1" fill="rgba(148,163,184,0.25)" />
        </g>
      ))}

      {/* Building 5 – wide short */}
      <rect x="172" y="80" width="38" height="38" rx="3" fill="rgba(15,123,160,0.25)" />
      <rect x="172" y="80" width="38" height="4" rx="1" fill="rgba(15,123,160,0.5)" />
      {[88,100,110].map(y => (
        <g key={y}>
          <rect x="178" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.12)" />
          <rect x="189" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.18)" />
          <rect x="200" y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.1)" />
        </g>
      ))}

      {/* Stars/dots in sky */}
      {[[30,15],[60,8],[140,12],[180,6],[200,20]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(255,255,255,0.4)" />
      ))}
      {/* Moon */}
      <circle cx="195" cy="14" r="7" fill="rgba(148,163,184,0.15)" />
      <circle cx="199" cy="12" r="5" fill="rgba(15,28,63,0.9)" />
    </svg>
  );
}

function IllustrationChart() {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Grid lines */}
      {[30,55,80,105].map(y => (
        <line key={y} x1="20" y1={y} x2="185" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      {/* Axes */}
      <line x1="20" y1="20" x2="20" y2="118" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <line x1="20" y1="118" x2="185" y2="118" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

      {/* Area fill */}
      <path
        d="M20,95 L50,80 L80,60 L110,50 L140,35 L170,25 L185,22 L185,118 L20,118 Z"
        fill="url(#chartGrad)"
        opacity="0.4"
      />
      {/* Line */}
      <path
        d="M20,95 L50,80 L80,60 L110,50 L140,35 L170,25 L185,22"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      {/* Dots */}
      {[[20,95],[50,80],[80,60],[110,50],[140,35],[170,25],[185,22]].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#0F7BA0" />
          <circle cx={x} cy={y} r="2" fill="white" />
        </g>
      ))}

      {/* Bar chart overlay (small) */}
      {[[45,100,18],[75,85,15],[105,72,15],[135,55,14],[165,42,13]].map(([x,h,w],i) => (
        <rect key={i} x={x-w/2} y={118-h} width={w} height={h} rx="3" fill="rgba(148,163,184,0.15)" />
      ))}

      {/* Label */}
      <text x="100" y="14" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Cairo, sans-serif">
        متوسط الأسعار
      </text>

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
      {/* Map background */}
      <rect x="10" y="10" width="180" height="120" rx="12" fill="rgba(15,123,160,0.08)" stroke="rgba(15,123,160,0.2)" strokeWidth="1" />
      {/* Roads */}
      <path d="M10,70 L190,70" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
      <path d="M100,10 L100,130" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
      <path d="M10,40 L80,70 L10,100" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      <path d="M190,35 L130,70 L190,105" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      {/* Blocks */}
      <rect x="20" y="20" width="35" height="28" rx="4" fill="rgba(148,163,184,0.12)" />
      <rect x="65" y="20" width="25" height="32" rx="4" fill="rgba(15,123,160,0.15)" />
      <rect x="112" y="18" width="30" height="25" rx="4" fill="rgba(148,163,184,0.1)" />
      <rect x="148" y="22" width="35" height="28" rx="4" fill="rgba(15,123,160,0.12)" />
      <rect x="20" y="85" width="45" height="32" rx="4" fill="rgba(15,123,160,0.12)" />
      <rect x="110" y="82" width="28" height="35" rx="4" fill="rgba(148,163,184,0.12)" />
      <rect x="148" y="80" width="35" height="38" rx="4" fill="rgba(15,123,160,0.1)" />
      {/* Pin 1 – main */}
      <circle cx="100" cy="55" r="14" fill="rgba(15,123,160,0.25)" />
      <circle cx="100" cy="55" r="9" fill="#0F7BA0" />
      <circle cx="100" cy="55" r="4" fill="white" />
      <line x1="100" y1="64" x2="100" y2="75" stroke="#0F7BA0" strokeWidth="2" />
      <ellipse cx="100" cy="76" rx="5" ry="2" fill="rgba(15,123,160,0.3)" />
      {/* Pin 2 */}
      <circle cx="55" cy="35" r="6" fill="rgba(148,163,184,0.5)" />
      <circle cx="55" cy="35" r="3" fill="#94A3B8" />
      {/* Pin 3 */}
      <circle cx="155" cy="95" r="6" fill="rgba(15,123,160,0.4)" />
      <circle cx="155" cy="95" r="3" fill="#0F7BA0" />
      {/* Price badge */}
      <rect x="112" y="40" width="62" height="22" rx="8" fill="#0F1C3F" stroke="rgba(15,123,160,0.5)" strokeWidth="1" />
      <text x="143" y="55" textAnchor="middle" fill="white" fontSize="8" fontFamily="Cairo, sans-serif" fontWeight="bold">٢.٥ م.ر / م²</text>
    </svg>
  );
}

/* ─── Data ───────────────────────────────────────────────────── */

const STATS = [
  { value: "٣٠٠+", label: "مدينة وحي مُغطى", icon: "🏙️" },
  { value: "١٠٠٪", label: "بيانات سعودية أصيلة", icon: "🇸🇦" },
  { value: "٢٤/٧", label: "تحديث مستمر للسوق", icon: "⚡" },
  { value: "٥★", label: "تقييم مستخدمينا", icon: "⭐" },
];

const VALUES = [
  {
    emoji: "🛡️",
    icon: Shield,
    title: "الشفافية",
    desc: "أسعار حقيقية من السوق، لا أرقام منتقاة أو مضخّمة. ما تراه هو ما يحدث فعلاً.",
    accent: "#0F7BA0",
    bg: "linear-gradient(135deg,rgba(15,123,160,0.12),rgba(15,123,160,0.04))",
  },
  {
    emoji: "⭐",
    icon: Star,
    title: "الموثوقية",
    desc: "بيانات موثّقة وتحليلات يمكن الاعتماد عليها في كل قرار كبير أو صغير.",
    accent: "#94A3B8",
    bg: "linear-gradient(135deg,rgba(148,163,184,0.12),rgba(148,163,184,0.04))",
  },
  {
    emoji: "⚡",
    icon: Zap,
    title: "الابتكار",
    desc: "تقنيات حديثة وأدوات ذكية نطوّرها باستمرار في خدمة قرار الإنسان.",
    accent: "#0F7BA0",
    bg: "linear-gradient(135deg,rgba(15,123,160,0.12),rgba(15,123,160,0.04))",
  },
  {
    emoji: "🤝",
    icon: Heart,
    title: "المجتمع",
    desc: "نخدم الفرد السعودي والمستثمر قبل السوق. نجاحك هو معيار نجاحنا الحقيقي.",
    accent: "#94A3B8",
    bg: "linear-gradient(135deg,rgba(148,163,184,0.12),rgba(148,163,184,0.04))",
  },
];

const WHY_US = [
  { icon: BarChart3, emoji: "📊", text: "مقارنة أسعار الأحياء في ثوانٍ" },
  { icon: MapPin,    emoji: "🗺️", text: "خريطة تفاعلية لجميع العقارات" },
  { icon: TrendingUp,emoji: "📈", text: "مؤشرات السوق لحظة بلحظة" },
  { icon: Users,     emoji: "👥", text: "شبكة مسوّقين ومزودي خدمات موثّقين" },
  { icon: Building2, emoji: "🏢", text: "منصة متكاملة للبيع والإيجار والاستثمار" },
  { icon: CheckCircle2,emoji:"✅", text: "بيانات موثّقة ومحدّثة باستمرار" },
];

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
            HERO — Split layout with city illustration
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
            {/* Dot grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "24px 24px" }}
            />
            {/* Top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse,rgba(15,123,160,0.35) 0%,transparent 70%)" }} />

            <div className="relative flex flex-col md:flex-row items-center gap-0">
              {/* Text side */}
              <div className="flex-1 px-8 py-14 md:px-14 md:py-16 text-white">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-[#94A3B8]" />
                  عقار إنسايت — بيانات لا أوهام
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

              {/* Illustration side */}
              <div className="flex-shrink-0 w-full md:w-[360px] h-[220px] md:h-full md:min-h-[340px] relative flex items-end justify-center pb-0 overflow-hidden">
                <div className="absolute inset-0 flex items-end">
                  <IllustrationCity />
                </div>
                {/* Floating price badge */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="absolute top-8 right-6 bg-white rounded-2xl px-4 py-2 shadow-xl"
                >
                  <p className="text-[10px] text-muted-foreground font-medium">متوسط متر الرياض</p>
                  <p className="text-base font-extrabold text-[#0F1C3F]">٤,٨٠٠ ر.س/م²</p>
                </motion.div>
                {/* Floating trend badge */}
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-14 left-5 bg-[#0F7BA0] rounded-2xl px-3 py-2 shadow-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-bold text-white">+١٢٪ هذا الربع</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            STATS ROW
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="relative rounded-[20px] p-5 text-center overflow-hidden group cursor-default"
                style={{
                  background: "linear-gradient(135deg,#fff 0%,#f8fafc 100%)",
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(15,28,63,0.06)",
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(135deg,rgba(15,123,160,0.04),transparent)" }} />
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl font-extrabold text-[#0F1C3F] mb-1" style={{ fontFeatureSettings: "'tnum'" }}>
                  {s.value}
                </div>
                <div className="text-xs font-semibold text-muted-foreground leading-snug">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            VISION & MISSION — with SVG illustrations
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
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[24px]"
              style={{ background: "linear-gradient(90deg,#0F7BA0,#94A3B8)" }} />

            {/* Background illustration */}
            <div className="absolute left-0 bottom-0 w-56 h-40 opacity-25 group-hover:opacity-35 transition-opacity duration-500">
              <IllustrationMap />
            </div>

            <div className="relative p-8 md:p-10">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                style={{ background: "rgba(15,123,160,0.2)", border: "1px solid rgba(15,123,160,0.35)" }}>
                🔭
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
              {/* Bottom badge */}
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
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[24px]"
              style={{ background: "linear-gradient(90deg,#94A3B8,#0F7BA0)" }} />

            {/* Background illustration */}
            <div className="absolute left-0 bottom-0 w-64 h-44 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              <IllustrationChart />
            </div>

            <div className="relative p-8 md:p-10">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                style={{ background: "rgba(148,163,184,0.15)", border: "1px solid rgba(148,163,184,0.25)" }}>
                🎯
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
              {/* Checklist */}
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
            VALUES — Big emoji cards
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 px-4 py-1.5 rounded-full text-xs font-bold text-primary mb-3">
              <Star className="w-3.5 h-3.5" />
              ما الذي يميّزنا
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">قيمنا الجوهرية</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                className="relative rounded-[22px] p-7 border border-border/50 overflow-hidden group cursor-default hover:-translate-y-1.5 transition-all duration-300"
                style={{
                  background: v.bg,
                  boxShadow: "0 4px 20px rgba(15,28,63,0.07)",
                }}
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[22px]"
                  style={{ boxShadow: `inset 0 0 0 1.5px ${v.accent}40` }} />

                {/* Big emoji */}
                <div className="text-5xl mb-5 leading-none select-none">{v.emoji}</div>

                {/* Small lucide icon badge */}
                <div className="absolute top-5 left-5 w-8 h-8 rounded-xl flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{ background: v.accent + "20" }}>
                  <v.icon className="w-4 h-4" style={{ color: v.accent }} />
                </div>

                <h3 className="font-extrabold text-foreground text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg,${v.accent},transparent)` }} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            WHY US — Feature grid with large icons
        ══════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div
            className="rounded-[26px] overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#0F1C3F 0%,#0a2a4a 50%,#0d3a58 100%)",
              boxShadow: "0 20px 60px rgba(15,28,63,0.3)",
            }}
          >
            {/* Header */}
            <div className="px-8 pt-10 pb-6 text-center border-b border-white/10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs font-bold text-white/80 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#94A3B8]" />
                الفرق الحقيقي
              </div>
              <h2 className="text-2xl font-extrabold text-white">لماذا عقار إنسايت؟</h2>
            </div>

            {/* Grid */}
            <div className="p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {WHY_US.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-4 rounded-[18px] px-5 py-4 group hover:bg-white/8 transition-all duration-200 cursor-default"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl group-hover:scale-110 transition-transform duration-200"
                    style={{ background: "rgba(15,123,160,0.2)", border: "1px solid rgba(15,123,160,0.3)" }}
                  >
                    {item.emoji}
                  </div>
                  <span className="text-sm font-semibold text-white/80 leading-snug group-hover:text-white transition-colors">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            CTA — Bold closing section
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
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%,rgba(15,123,160,0.35),transparent)" }} />
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />

            <div className="relative">
              <div className="text-5xl mb-5">🏡</div>
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
