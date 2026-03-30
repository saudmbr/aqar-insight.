import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Search, BadgeCheck, Building2, Star, Users, ChevronLeft, ShieldCheck, MessageCircle, SlidersHorizontal, X } from "lucide-react";
import { getImageSrc } from "@/lib/utils";
import { SAUDI_REGIONS_LIST } from "@/lib/saudi-geo";

const SPECIALTIES_LIST = [
  "شقق سكنية", "فلل", "أراضي", "تجاري", "مكاتب", "مستودعات", "فنادق",
  "مجمعات سكنية", "الاستثمار العقاري", "إدارة العقارات", "التقييم العقاري",
];

interface MarketerRow {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  officeName: string | null;
  bio: string | null;
  city: string | null;
  servedAreas: string | null;
  specialties: string | null;
  yearsExperience: number | null;
  photo: string | null;
  coverImage: string | null;
  whatsapp: string | null;
  phone: string | null;
  verified: boolean;
  activeListingsCount: number;
  createdAt: string;
}

function MarketerCard({ m }: { m: MarketerRow }) {
  const specialties = m.specialties ? (JSON.parse(m.specialties) as string[]) : [];

  return (
    <Link href={`/marketers/${m.id}`}>
      <div className="group bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
        {/* Header — cover image or gradient */}
        <div className="h-24 relative overflow-hidden">
          {m.coverImage && getImageSrc(m.coverImage) ? (
            <img
              src={getImageSrc(m.coverImage) ?? ""}
              alt=""
              className="w-full h-full object-cover"
              onError={e => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = "none";
                const fallback = img.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "block";
              }}
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={
              m.coverImage && getImageSrc(m.coverImage)
                ? { background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }
                : { background: "linear-gradient(135deg, #0F1C3F 0%, #0F7BA0 100%)" }
            }
          />
          {m.verified && (
            <span className="absolute top-3 left-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white z-10">
              <BadgeCheck className="w-3.5 h-3.5" /> موثّق
            </span>
          )}
        </div>

        <div className="px-5 pb-5 -mt-8">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl border-4 border-card bg-primary/10 flex items-center justify-center mb-3 shadow-md overflow-hidden relative">
            {m.photo && getImageSrc(m.photo) ? (
              <>
                <img
                  src={getImageSrc(m.photo) ?? ""}
                  alt={m.fullName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = "none";
                    const fallback = img.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <span className="text-xl font-bold text-primary absolute inset-0 items-center justify-center hidden">
                  {m.fullName.charAt(0)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-primary">{m.fullName.charAt(0)}</span>
            )}
          </div>

          <h3 className="text-base font-bold text-foreground leading-tight">{m.fullName}</h3>
          {m.officeName && <p className="text-sm text-muted-foreground mt-0.5">{m.officeName}</p>}

          {m.city && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />{m.city}
            </div>
          )}

          {specialties.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-muted-foreground mb-1.5 tracking-wide uppercase">التخصصات</p>
              <div className="flex flex-wrap gap-1.5">
                {specialties.slice(0, 3).map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 rounded-lg border-primary/30 text-primary bg-primary/5">{s}</Badge>
                ))}
                {specialties.length > 3 && <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-lg border-border/60">+{specialties.length - 3}</Badge>}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
            <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded-lg">
              <Building2 className="w-3.5 h-3.5" />
              {m.activeListingsCount} إعلان
            </div>
            {m.yearsExperience && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-accent" />
                {m.yearsExperience} سنة خبرة
              </div>
            )}
            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Marketers() {
  const [marketers, setMarketers] = useState<MarketerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  useEffect(() => {
    void fetch("/api/marketers").then(r => r.json()).then((data: MarketerRow[]) => {
      setMarketers(data);
      setLoading(false);
    });
  }, []);

  const filtered = marketers.filter(m => {
    if (search && !m.fullName.includes(search) && !m.officeName?.includes(search) && !m.city?.includes(search)) return false;
    if (regionFilter && m.city !== regionFilter) return false;
    if (specialtyFilter) {
      const specs = m.specialties ? (JSON.parse(m.specialties) as string[]) : [];
      if (!specs.includes(specialtyFilter)) return false;
    }
    return true;
  });

  const hasFilters = !!(search || regionFilter || specialtyFilter);

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Hero banner */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-12 text-white"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.04 }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_top_left,rgba(201,168,76,0.10),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Users className="w-3.5 h-3.5" />
              موثّقون ومعتمدون
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">دليل المسوّقين العقاريين</h1>
            <p className="text-white/75 mt-2 text-base max-w-2xl">
              اعثر على المسوّق العقاري المناسب لك — قارن الخبرات، اطّلع على الإعلانات، وتواصل مباشرةً بضغطة واحدة
            </p>
          </div>
        </div>

        {/* Service description for visitors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              color: "text-primary bg-primary/10 border-primary/20",
              title: "مسوّقون موثّقون",
              desc: "جميع المسوّقين المعروضين لديهم ملفات معتمدة، مع إمكانية التحقق من رقم الترخيص (فال) مباشرةً",
            },
            {
              icon: <Building2 className="w-6 h-6" />,
              color: "text-[#0F7BA0] bg-[#0F7BA0]/10 border-[#0F7BA0]/20",
              title: "كتالوج العقارات",
              desc: "تصفح إعلانات كل مسوّق بشكل مباشر من ملفه الشخصي — بيع، إيجار، أراضي، وأكثر",
            },
            {
              icon: <MessageCircle className="w-6 h-6" />,
              color: "text-green-600 bg-green-50 border-green-200",
              title: "تواصل فوري",
              desc: "تواصل مع المسوّق مباشرةً عبر الواتساب أو الجوال دون وسيط أو انتظار",
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 bg-card border border-border/60 rounded-2xl p-5 hover:shadow-sm transition-shadow">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works strip */}
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-foreground">كيف تستفيد من الدليل؟</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {[
              { n: "١", t: "ابحث عن مسوّق بالمنطقة أو التخصص" },
              { n: "٢", t: "اطّلع على ملفه وكتالوج عقاراته" },
              { n: "٣", t: "تواصل معه مباشرةً لإتمام الصفقة" },
            ].map(step => (
              <div key={step.n} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center shrink-0">{step.n}</span>
                <span>{step.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
          {/* Row 1: search */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث باسم المسوّق، المكتب، أو المدينة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-12 h-12 rounded-xl text-base"
            />
          </div>
          {/* Row 2: region + specialty dropdowns + clear */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[160px]">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={regionFilter}
                onChange={e => setRegionFilter(e.target.value)}
                className="w-full h-10 pr-9 rounded-xl border border-border bg-background text-sm font-semibold appearance-none outline-none focus:border-primary"
                style={{ color: "#111827" }}
              >
                <option value="">كل المناطق</option>
                {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="relative flex-1 min-w-[160px]">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={specialtyFilter}
                onChange={e => setSpecialtyFilter(e.target.value)}
                className="w-full h-10 pr-9 rounded-xl border border-border bg-background text-sm font-semibold appearance-none outline-none focus:border-primary"
                style={{ color: "#111827" }}
              >
                <option value="">كل التخصصات</option>
                {SPECIALTIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setRegionFilter(""); setSpecialtyFilter(""); }}
                className="h-10 px-3 rounded-xl text-xs font-bold text-destructive bg-destructive/8 hover:bg-destructive/15 border border-destructive/20 flex items-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} مسوّق {hasFilters ? "مطابق للبحث" : "مسجّل"}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border border-dashed">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/15">
              <Users className="w-10 h-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">لا يوجد مسوّقون بعد</h3>
            <p className="text-muted-foreground">كن أول من ينضم كمسوّق عقاري محترف</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(m => <MarketerCard key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
