import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Search, BadgeCheck, Building2, Star, Users, ChevronLeft } from "lucide-react";

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
          <div className="w-16 h-16 rounded-2xl border-4 border-card bg-primary/10 flex items-center justify-center mb-3 shadow-md overflow-hidden">
            {m.photo ? (
              <img src={m.photo} alt={m.fullName} className="w-full h-full object-cover" />
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
          className="rounded-3xl px-8 py-12 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 50%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 50%, white 0%, transparent 60%)" }} />
          <div className="relative z-10 flex items-center gap-4 mb-2">
            <Users className="w-8 h-8 text-white/80" />
            <h1 className="text-3xl font-extrabold">دليل المسوّقين العقاريين</h1>
          </div>
          <p className="relative z-10 text-white/70 text-lg max-w-2xl">
            تصفح كوكبة من أفضل المسوّقين العقاريين المحترفين، واطّلع على كتالوج عقاراتهم
          </p>
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
            <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
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
