import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { SAR } from "@/components/sar-amount";
import { LISTING_TYPE_GROUPS, LISTING_TYPE_MAP } from "@/lib/listing-types";

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

type FilterOptions = { cities: string[]; propertyTypes: string[] };
type Listing = {
  id: number; title: string; propertyType: string; listingType: string;
  city: string; district: string | null; price: number;
  areaSqm: number | null; pricePerSqm: number | null; status: string; createdAt: string;
};
type ListingsResponse = { data: Listing[]; total: number; page: number; pageSize: number };

function exportToCsv(rows: Listing[]) {
  const headers = ["ID", "العنوان", "المدينة", "الحي", "النوع", "العملية", "الحالة", "السعر", "المساحة م²", "سعر المتر", "التاريخ"];
  const csvRows = rows.map(r => [
    r.id, `"${r.title ?? ""}"`, `"${r.city ?? ""}"`, `"${r.district ?? ""}"`,
    `"${r.propertyType ?? ""}"`, LISTING_TYPE_MAP[r.listingType] ?? r.listingType,
    `"${r.status ?? ""}"`, r.price ?? "", r.areaSqm ?? "", r.pricePerSqm ?? "",
    new Date(r.createdAt).toLocaleDateString("en-GB"),
  ]);
  const content = [headers, ...csvRows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "listings-export.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function Records() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [city, setCity] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [listingType, setListingType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["listings-filter-options"],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-filter-options`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 60_000,
  });

  const buildQuery = (pg = page) => {
    const params = new URLSearchParams();
    params.set("page", String(pg));
    params.set("limit", String(limit));
    if (city !== "all")         params.set("city", city);
    if (propertyType !== "all") params.set("propertyType", propertyType);
    if (listingType !== "all")  params.set("listingType", listingType);
    if (status !== "all")       params.set("status", status);
    return params.toString();
  };

  const { data, isLoading } = useQuery<ListingsResponse>({
    queryKey: ["records-listings", page, city, propertyType, listingType, status],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/listings?${buildQuery()}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 30_000,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const filteredData = (data?.data ?? []).filter(item =>
    !search ||
    item.title?.includes(search) ||
    item.district?.includes(search) ||
    item.city?.includes(search)
  );

  const handleExport = () => {
    if (!data?.data.length) return;
    exportToCsv(data.data);
  };

  const handleFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v); setPage(1);
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { active: "نشط", archived: "مؤرشف", pending: "معلق", sold: "مباع", rented: "مؤجر" };
    return map[s] ?? s;
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">سجل الإعلانات</h1>
            <p className="text-muted-foreground mt-1">تصفح وإدارة سجلات إعلانات المنصة وتصديرها</p>
          </div>
          <Button onClick={handleExport} disabled={!data?.data.length}
            className="gap-2 shadow-md hover:shadow-lg transition-all active:scale-95">
            <Download className="w-4 h-4" />
            تصدير CSV
          </Button>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 md:p-6 space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالعنوان أو الحي..."
                  className="pr-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={city} onValueChange={handleFilter(setCity)}>
                <SelectTrigger><SelectValue placeholder="المدينة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {(filterOptions?.cities ?? []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={propertyType} onValueChange={handleFilter(setPropertyType)}>
                <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {(filterOptions?.propertyTypes ?? []).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={listingType} onValueChange={handleFilter(setListingType)}>
                <SelectTrigger><SelectValue placeholder="العملية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الصفقات</SelectItem>
                  {LISTING_TYPE_GROUPS.map(g => (
                    <SelectGroup key={g.label}>
                      <SelectLabel className="font-bold text-muted-foreground text-xs">{g.label}</SelectLabel>
                      {g.types.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={handleFilter(setStatus)}>
                <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="sold">مباع</SelectItem>
                  <SelectItem value="rented">مؤجر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">العنوان</th>
                      <th className="px-4 py-3 font-medium">المدينة / الحي</th>
                      <th className="px-4 py-3 font-medium">النوع</th>
                      <th className="px-4 py-3 font-medium">العملية</th>
                      <th className="px-4 py-3 font-medium">الحالة</th>
                      <th className="px-4 py-3 font-medium">السعر</th>
                      <th className="px-4 py-3 font-medium">المساحة</th>
                      <th className="px-4 py-3 font-medium">سعر المتر</th>
                      <th className="px-4 py-3 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                          لا توجد إعلانات مطابقة للفلاتر المحددة
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">#{item.id}</td>
                          <td className="px-4 py-3 max-w-[180px]">
                            <span className="font-medium text-foreground line-clamp-1">{item.title}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-foreground">{item.city}</span>
                            {item.district && <span className="text-muted-foreground mr-1">/ {item.district}</span>}
                          </td>
                          <td className="px-4 py-3">{item.propertyType}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.listingType === "sale" || item.listingType === "installment" || item.listingType === "auction" ? "default" : "outline"} className="font-normal">
                              {LISTING_TYPE_MAP[item.listingType] ?? item.listingType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-normal text-[11px]">
                              {statusLabel(item.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium"><SAR value={item.price} /></td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.areaSqm ? `${item.areaSqm} م²` : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.pricePerSqm ? <SAR value={item.pricePerSqm} perSqm /> : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString("en-GB")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  إجمالي النتائج: {data?.total ?? 0}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronRight className="w-4 h-4 ml-1" />
                    السابق
                  </Button>
                  <span className="text-sm font-medium w-16 text-center">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    التالي
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
