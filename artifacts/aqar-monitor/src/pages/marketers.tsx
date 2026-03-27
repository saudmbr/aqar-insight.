import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Search, BadgeCheck, Building2, Star, Users, ChevronLeft } from "lucide-react";
import { getImageSrc } from "@/lib/utils";

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
        {/* Header gradient */}
        <div className="h-20 bg-gradient-to-l from-primary/20 to-primary/5 relative">
          {m.verified && (
            <span className="absolute top-3 left-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white">
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
            <div className="flex flex-wrap gap-1.5 mt-3">
              {specialties.slice(0, 3).map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 rounded-lg border-border/60">{s}</Badge>
              ))}
              {specialties.length > 3 && <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-lg border-border/60">+{specialties.length - 3}</Badge>}
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

  useEffect(() => {
    void fetch("/api/marketers").then(r => r.json()).then((data: MarketerRow[]) => {
      setMarketers(data);
      setLoading(false);
    });
  }, []);

  const filtered = marketers.filter(m =>
    !search ||
    m.fullName.includes(search) ||
    m.officeName?.includes(search) ||
    m.city?.includes(search)
  );

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
              دليل المسوّقين المحترفين
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">دليل المسوّقين العقاريين</h1>
            <p className="text-white/75 mt-2 text-base max-w-2xl">
              تصفح كوكبة من أفضل المسوّقين العقاريين المحترفين، واطّلع على كتالوج عقاراتهم
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-lg">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث باسم المسوّق، المكتب، أو المدينة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-12 h-12 rounded-xl text-base"
          />
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} مسوّق {search ? "مطابق للبحث" : "مسجّل"}
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
