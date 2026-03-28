import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageSrc } from "@/lib/utils";
import {
  MapPin, Phone, MessageSquare, Wrench, ArrowRight, BadgeCheck,
  Star, Clock, ChevronLeft, ChevronRight, Building2,
} from "lucide-react";

interface ServiceProvider {
  id: number;
  userId: number | null;
  businessName: string;
  category: string;
  city: string;
  coveredAreas: string | null;
  description: string | null;
  startingPrice: number | null;
  contactPhone: string | null;
  whatsapp: string | null;
  workingHours: string | null;
  portfolioImages: string | null;
  verified: boolean | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  status: string;
  createdAt: string;
  ownerName: string | null;
}

export default function ServiceProviderProfile() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const providerId = parseInt(id ?? "");

  useEffect(() => {
    if (isNaN(providerId)) { setNotFound(true); setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/service-providers/${providerId}`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (res.ok) setProvider(await res.json() as ServiceProvider);
      setLoading(false);
    };
    void load();
  }, [providerId]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound || !provider) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border border-dashed max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10 text-primary/60" />
          </div>
          <h2 className="text-2xl font-bold mb-3">مزوّد الخدمة غير موجود</h2>
          <p className="text-muted-foreground mb-8">عذراً، لا يمكن العثور على هذا المزوّد.</p>
          <Button asChild variant="outline" className="rounded-xl px-8">
            <Link href="/services"><ArrowRight className="w-4 h-4 ml-2" />العودة لسوق الخدمات</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = provider.portfolioImages
    ? provider.portfolioImages
        .split("\n")
        .map(u => u.trim())
        .filter(Boolean)
        .map(getImageSrc)
        .filter((s): s is string => s !== null)
    : [];

  const whatsappLink = provider.whatsapp
    ? `https://wa.me/${provider.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحباً، وجدت نشاطكم "${provider.businessName}" على منصة عقار إنسايت`)}`
    : null;

  const coveredAreas = provider.coveredAreas
    ? provider.coveredAreas.split(/[،,\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Back navigation */}
        <div>
          <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
            <ArrowRight className="w-4 h-4" />سوق الخدمات العقارية
          </Link>
        </div>

        {/* Profile hero card */}
        <div className="bg-card rounded-3xl border border-border/60 overflow-hidden shadow-sm">
          {/* Banner — use first portfolio image as cover, fallback to gradient */}
          <div className="h-40 relative overflow-hidden">
            {images.length > 0 ? (
              <>
                <img
                  src={images[0]}
                  alt={provider.businessName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
              </>
            ) : (
              <div
                className="w-full h-full"
                style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 55%, #0F7BA0 100%)" }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.04 }} />
              </div>
            )}
            {provider.verified && (
              <span className="absolute top-4 left-4 flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-white border border-white/30 z-10">
                <BadgeCheck className="w-4 h-4" />مزوّد موثّق
              </span>
            )}
          </div>

          <div className="px-6 pb-6">
            {/* Row: business icon + name/info + CTA — same pattern as marketer profile */}
            <div className="flex items-start gap-4 -mt-10 flex-wrap">
              {/* Business avatar icon */}
              <div className="w-20 h-20 rounded-2xl border-4 border-card bg-primary/10 flex items-center justify-center shadow-lg shrink-0">
                <Wrench className="w-8 h-8 text-primary" />
              </div>

              {/* Business name / category / city — mt-10 cancels parent -mt-10 */}
              <div className="flex-1 min-w-0 mt-10 pt-1.5">
                <h1 className="text-2xl font-extrabold text-foreground leading-tight">{provider.businessName}</h1>
                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                  <Badge variant="outline" className="rounded-lg text-xs px-2.5 py-1 border-primary/20 text-primary bg-primary/5 font-semibold">
                    {provider.category}
                  </Badge>
                  {provider.city && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />{provider.city}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA buttons — mt-10 places them at card-body level */}
              <div className="flex gap-3 flex-wrap shrink-0 mt-10">
                {whatsappLink && (
                  <Button asChild size="sm" className="rounded-xl gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-4 h-4" />واتساب
                    </a>
                  </Button>
                )}
                {provider.contactPhone && (
                  <Button asChild size="sm" variant="outline" className="rounded-xl gap-2">
                    <a href={`tel:${provider.contactPhone}`}>
                      <Phone className="w-4 h-4" />اتصال
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-border/40">
              {(provider.ratingAvg ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground leading-none">{(provider.ratingAvg ?? 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">({provider.ratingCount} تقييم)</p>
                  </div>
                </div>
              )}
              {provider.startingPrice && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground leading-none">{provider.startingPrice.toLocaleString("en-US")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ر.س تبدأ من</p>
                  </div>
                </div>
              )}
              {provider.workingHours && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none">{provider.workingHours}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ساعات العمل</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left sidebar: info + contact */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Description */}
            {provider.description && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />نبذة عن النشاط
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{provider.description}</p>
              </div>
            )}

            {/* Covered areas */}
            {coveredAreas.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />مناطق التغطية
                </h3>
                <div className="flex flex-wrap gap-2">
                  {coveredAreas.map((area, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-xl bg-muted text-muted-foreground border border-border/40 font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground mb-3">التواصل</h3>
              {provider.contactPhone && (
                <a href={`tel:${provider.contactPhone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-primary shrink-0" />{provider.contactPhone}
                </a>
              )}
              {provider.whatsapp && (
                <a
                  href={whatsappLink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0" />{provider.whatsapp}
                </a>
              )}
              {!provider.contactPhone && !provider.whatsapp && (
                <p className="text-sm text-muted-foreground">لا توجد معلومات تواصل</p>
              )}
            </div>
          </div>

          {/* Right: portfolio gallery */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xl font-bold text-foreground">معرض الأعمال</h2>

            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-border border-dashed">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center mb-4">
                  <Wrench className="w-7 h-7 text-primary/60" />
                </div>
                <p className="text-muted-foreground">لا توجد صور أعمال مضافة بعد</p>
              </div>
            ) : (
              <>
                {/* Main image viewer */}
                <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video group">
                  <img
                    src={images[currentImage]}
                    alt={`${provider.businessName} - صورة ${currentImage + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={e => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = "none";
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center text-white backdrop-blur transition-all opacity-0 group-hover:opacity-100"
                        aria-label="الصورة السابقة"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center text-white backdrop-blur transition-all opacity-0 group-hover:opacity-100"
                        aria-label="الصورة التالية"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white bg-black/40 backdrop-blur px-3 py-1 rounded-full font-mono">
                        {currentImage + 1} / {images.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImage ? "border-primary shadow-md" : "border-transparent hover:border-primary/40"}`}
                      >
                        <img
                          src={src}
                          alt={`صورة ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
