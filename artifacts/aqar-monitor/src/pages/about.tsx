import { useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { motion } from "framer-motion";
import {
  Eye, Target, Shield, Zap, Heart, TrendingUp,
  Building2, MapPin, Users, BarChart3, Star, CheckCircle2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 240, damping: 22 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const VALUES = [
  {
    icon: Shield,
    title: "الشفافية",
    desc: "أسعار حقيقية من السوق، لا أرقام منتقاة أو مضخّمة.",
    color: "#0F7BA0",
  },
  {
    icon: Star,
    title: "الموثوقية",
    desc: "بيانات موثّقة وتحليلات يمكن الاعتماد عليها في كل قرار.",
    color: "#94A3B8",
  },
  {
    icon: Zap,
    title: "الابتكار",
    desc: "تقنيات حديثة وأدوات ذكية في خدمة قرار الإنسان.",
    color: "#0F7BA0",
  },
  {
    icon: Heart,
    title: "المجتمع",
    desc: "نخدم الفرد السعودي والمستثمر قبل السوق.",
    color: "#94A3B8",
  },
];

const WHY_US = [
  { icon: BarChart3, text: "مقارنة أسعار الأحياء في ثوانٍ" },
  { icon: MapPin,    text: "خريطة تفاعلية لجميع العقارات" },
  { icon: TrendingUp, text: "مؤشرات السوق لحظة بلحظة" },
  { icon: Users,    text: "شبكة مسوّقين ومزودي خدمات موثّقين" },
  { icon: Building2, text: "منصة متكاملة للبيع والإيجار والاستثمار" },
];

export default function About() {
  useEffect(() => {
    document.title = "من نحن – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  return (
    <Layout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-12 pb-20" dir="rtl">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div
            className="relative rounded-[2rem] overflow-hidden text-white"
            style={{
              background: "linear-gradient(140deg, #0F1C3F 0%, #0F1C3F 50%, #0a2a4a 75%, #0F7BA0 100%)",
              boxShadow: "0 32px 80px rgba(15,28,63,0.45)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_top_right,rgba(15,123,160,0.45),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_35%_45%_at_bottom_left,rgba(148,163,184,0.08),transparent)] pointer-events-none" />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "26px 26px" }}
            />
            <div className="relative px-8 py-14 md:px-16 md:py-20 text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-1.5 rounded-full text-[13px] font-semibold mb-7">
                <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
                عقار إنسايت — منصة عقارية سعودية
              </div>
              <h1 className="text-[2.6rem] md:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-5 text-white">
                من <span style={{ color: "#94A3B8" }}>نحن</span>
              </h1>
              <p className="text-[17px] md:text-[18px] text-white/80 leading-relaxed font-medium max-w-2xl mx-auto">
                عقار إنسايت منصة سعودية متخصصة في تحليل بيانات السوق العقاري.
                نؤمن أن كل قرار عقاري يستحق بيانات حقيقية — لذلك بنينا منصة تجمع أسعار السوق
                وتحليلات الأحياء والأدوات التي يحتاجها المشتري والبائع والمستثمر.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Vision & Mission ─────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-6">
          {/* رؤيتنا */}
          <div
            className="relative rounded-[22px] p-8 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0F1C3F 0%, #0e2a45 100%)",
              boxShadow: "0 8px 32px rgba(15,28,63,0.2)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]" style={{ background: "linear-gradient(90deg, #0F7BA0, #94A3B8)" }} />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(15,123,160,0.15)" }}>
              <Eye className="w-6 h-6 text-[#0F7BA0]" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-3">رؤيتنا</h2>
            <p className="text-white/75 leading-relaxed text-[15px]">
              أن نكون المرجع الأول والأكثر موثوقية للبيانات العقارية في المملكة العربية السعودية،
              ونساهم في بناء سوق عقاري شفاف يتماشى مع أهداف رؤية 2030.
            </p>
          </div>

          {/* مهمتنا */}
          <div
            className="relative rounded-[22px] p-8 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0F1C3F 0%, #0e2a45 100%)",
              boxShadow: "0 8px 32px rgba(15,28,63,0.2)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]" style={{ background: "linear-gradient(90deg, #94A3B8, #0F7BA0)" }} />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(148,163,184,0.12)" }}>
              <Target className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-3">مهمتنا</h2>
            <p className="text-white/75 leading-relaxed text-[15px]">
              نقدّم بيانات دقيقة، تحليلات ذكية، وأدوات متكاملة تربط المشترين والبائعين والمستثمرين
              والمسوّقين في منظومة واحدة — لأن القرار الصح يبدأ بالمعلومة الصح.
            </p>
          </div>
        </motion.div>

        {/* ── Values ──────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div className="mb-8 text-center">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">ما الذي يميّزنا</p>
            <h2 className="text-2xl font-extrabold text-foreground">قيمنا</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                className="bg-card rounded-[22px] p-6 border border-border/60 hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: "0 2px 16px rgba(15,28,63,0.06)" }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: v.color + "12" }}
                >
                  <v.icon className="w-5 h-5" style={{ color: v.color }} />
                </div>
                <h3 className="font-extrabold text-foreground text-base mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Why Us ──────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div
            className="rounded-[22px] p-8 md:p-12"
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 4px 24px rgba(15,28,63,0.06)",
            }}
          >
            <div className="mb-8 text-center">
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">الفرق الحقيقي</p>
              <h2 className="text-2xl font-extrabold text-foreground">لماذا عقار إنسايت؟</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {WHY_US.map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-border/50 shadow-sm">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#0F7BA012" }}
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground leading-snug">{item.text}</span>
                </div>
              ))}
              {/* Last item centered */}
              <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-border/50 shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#94A3B812" }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#94A3B8" }} />
                </div>
                <span className="text-sm font-semibold text-foreground leading-snug">بيانات موثّقة ومحدّثة باستمرار</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="text-center">
          <div
            className="inline-flex flex-col items-center gap-4 rounded-[22px] px-12 py-10"
            style={{
              background: "linear-gradient(140deg, #0F1C3F, #0F7BA0)",
              boxShadow: "0 16px 48px rgba(15,28,63,0.3)",
            }}
          >
            <p className="text-white/70 text-sm font-semibold">جاهز تبدأ؟</p>
            <h3 className="text-2xl font-extrabold text-white">خذ القرار الصح في عقارك</h3>
            <a
              href="/listings"
              className="inline-flex items-center gap-2 bg-white text-[#0F1C3F] font-bold px-8 py-3 rounded-xl text-sm hover:bg-white/90 transition-all"
              style={{ boxShadow: "0 4px 16px rgba(255,255,255,0.2)" }}
            >
              تصفح العقارات
            </a>
          </div>
        </motion.div>

      </motion.div>
    </Layout>
  );
}
