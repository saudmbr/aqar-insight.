import { Link } from "wouter";
import { ArrowLeft, BarChart3, Bell, BookMarked, Sparkles, UserCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: BookMarked,
    title: "حفظ العقارات والتحليلات",
    desc: "احفظ العقارات التي تهمك وراجع تحليلاتها في أي وقت",
  },
  {
    icon: UserCircle2,
    title: "تجربة مخصصة",
    desc: "احصل على توصيات وتنبيهات تتناسب مع اهتماماتك واحتياجاتك",
  },
  {
    icon: Zap,
    title: "وصول أسرع للمؤشرات",
    desc: "تصفح أسعار الأحياء ومؤشرات السوق بشكل أسرع وأكثر عمقاً",
  },
  {
    icon: Bell,
    title: "متابعة أفضل للفرص",
    desc: "كن أول من يرصد تحركات الأسعار والفرص العقارية الواعدة",
  },
];

export function GuestCTA() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm">
      {/* Main CTA block */}
      <div
        className="relative px-8 py-14 text-center"
        style={{
          background:
            "linear-gradient(135deg, hsl(218 55% 10%) 0%, hsl(218 55% 14%) 40%, hsl(191 80% 20%) 100%)",
        }}
      >
        {/* Subtle glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, hsl(191 80% 28% / 0.35) 0%, transparent 70%)",
          }}
        />

        {/* Badge */}
        <div className="relative flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            منصة ذكاء عقاري متكاملة
          </span>
        </div>

        {/* Headline */}
        <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
          ابدأ رحلتك نحو
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, hsl(191 80% 55%), hsl(191 80% 75%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            قرارات عقارية أذكى
          </span>
        </h2>

        {/* Subtext */}
        <p className="relative text-base text-white/85 max-w-md mx-auto leading-relaxed mb-8">
          احصل على تحليلات دقيقة، قارن بين الأحياء، واتخذ قراراتك بناءً على بيانات موثوقة
        </p>

        {/* CTA Buttons */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 rounded-xl text-base font-semibold shadow-lg shadow-primary/30 min-w-[140px]"
          >
            <Link href="/signup">
              سجّل الآن
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-8 rounded-xl text-base font-medium min-w-[140px] border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 bg-transparent"
          >
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </div>

        {/* Trust line */}
        <p className="relative mt-6 text-xs text-white/70">
          أكثر من ٣٣٠٠ سجل عقاري حقيقي من المملكة العربية السعودية
        </p>
      </div>

      {/* Benefit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-border/40 bg-card/50">
        {benefits.map((b, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-6 border-l border-border/30 first:border-l-0 hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <b.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-snug mb-1">{b.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Logged-in user welcome strip (replaces CTA)
export function UserWelcomeBanner({ fullName }: { fullName: string }) {
  const name = fullName.split(" ")[0];
  return (
    <div className="flex items-center justify-between px-6 py-4 rounded-2xl border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">مرحباً، {name} 👋</p>
          <p className="text-xs text-muted-foreground">استعرض أحدث تحليلات سوق العقار</p>
        </div>
      </div>
    </div>
  );
}
