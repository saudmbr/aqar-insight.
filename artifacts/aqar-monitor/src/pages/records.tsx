import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { 
  useListProperties,
  useGetCities,
  useGetPropertyTypes,
  getExportPropertiesUrl
} from "@workspace/api-client-react";

export default function Records() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [city, setCity] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [listingType, setListingType] = useState<string>("all");
  // Basic client-side search simulation since API doesn't have a search param
  const [search, setSearch] = useState("");

  const { data: cities } = useGetCities();
  const { data: propertyTypes } = useGetPropertyTypes();

  const queryParams = {
    page,
    limit,
    ...(city !== "all" && { city }),
    ...(propertyType !== "all" && { propertyType }),
    ...(listingType !== "all" && { listingType })
  };

  const { data, isLoading } = useListProperties(queryParams);

  const handleExport = () => {
    const exportParams = {
      ...(city !== "all" && { city }),
      ...(propertyType !== "all" && { propertyType }),
      ...(listingType !== "all" && { listingType })
    };
    const url = getExportPropertiesUrl(exportParams);
    window.open(url, '_blank');
  };

  const filteredData = data?.data.filter(item => 
    !search || 
    item.district.includes(search) || 
    item.notes?.includes(search)
  ) || [];

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">سجل البيانات</h1>
            <p className="text-muted-foreground mt-1">تصفح وإدارة السجلات العقارية وتصديرها</p>
          </div>
          
          <Button onClick={handleExport} className="gap-2 shadow-md hover:shadow-lg transition-all active:scale-95">
            <Download className="w-4 h-4" />
            تصدير CSV
          </Button>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 md:p-6 space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="ابحث بالحي أو الملاحظات..." 
                  className="pr-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Select value={city} onValueChange={(v) => { setCity(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {cities?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={propertyType} onValueChange={(v) => { setPropertyType(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {propertyTypes?.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={listingType} onValueChange={(v) => { setListingType(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="sale">بيع</SelectItem>
                  <SelectItem value="rent">إيجار</SelectItem>
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
                      <th className="px-4 py-3 font-medium">المدينة - الحي</th>
                      <th className="px-4 py-3 font-medium">النوع</th>
                      <th className="px-4 py-3 font-medium">العملية</th>
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
                          {Array.from({ length: 8 }).map((_, j) => (
                            <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">لا توجد بيانات مطابقة للبحث</td>
                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">#{item.id}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-foreground">{item.city}</span>
                            <span className="text-muted-foreground mr-1">/ {item.district}</span>
                          </td>
                          <td className="px-4 py-3">{item.propertyType}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.listingType === 'sale' ? 'default' : 'outline'} className="font-normal">
                              {item.listingType === 'sale' ? 'بيع' : 'إيجار'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.area} م²</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatCurrency(item.pricePerSqm)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(item.recordedAt).toLocaleDateString('ar-SA')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  إجمالي النتائج: {data.total}
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronRight className="w-4 h-4 ml-1" />
                    السابق
                  </Button>
                  <span className="text-sm font-medium w-16 text-center">
                    {page} / {data.totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                  >
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
