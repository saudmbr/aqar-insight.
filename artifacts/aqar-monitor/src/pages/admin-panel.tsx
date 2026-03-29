import { SAUDI_CITIES as CITIES } from "@/lib/saudi-cities";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useListProperties, useDeleteProperty } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  LayoutDashboard,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { ImportDialog } from "@/components/import-dialog";
import { PROPERTY_TYPE_GROUPS } from "@/lib/property-types";
import { LISTING_TYPE_GROUPS, LISTING_TYPE_MAP } from "@/lib/listing-types";

function formatPrice(price: number) {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)} م.ر`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)} ألف`;
  return `${price.toLocaleString("en-US")} ر.س`;
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [debouncedDistrict, setDebouncedDistrict] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const LIMIT = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDistrict(districtSearch), 400);
    return () => clearTimeout(t);
  }, [districtSearch]);

  const resetPage = useCallback(() => setPage(1), []);
  useEffect(resetPage, [city, propertyType, listingType, debouncedDistrict]);

  const { data, isLoading, isFetching } = useListProperties({
    city: city || undefined,
    district: debouncedDistrict || undefined,
    propertyType: propertyType || undefined,
    listingType: (listingType as "sale" | "rent") || undefined,
    page,
    limit: LIMIT,
  });

  const deleteProperty = useDeleteProperty();

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteProperty.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast({
            title: "تم الحذف بنجاح",
            description: "تم حذف السجل العقاري من قاعدة البيانات.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/kpis"] });
          setDeleteDialogOpen(false);
          setDeleteId(null);
        },
        onError: () => {
          toast({
            title: "حدث خطأ",
            description: "فشل حذف السجل، الرجاء المحاولة مرة أخرى.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const properties = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const clearFilters = () => {
    setCity("");
    setPropertyType("");
    setListingType("");
    setDistrictSearch("");
  };

  const hasFilters = city || propertyType || listingType || districtSearch;

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">الإدارة</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">لوحة الإدارة</h1>
            <p className="text-muted-foreground mt-1">
              إدارة سجلات العقارات — إضافة وتعديل وحذف البيانات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Upload className="w-4 h-4" />
              استيراد Excel / CSV
            </Button>
            <Button
              onClick={() => navigate("/admin/add")}
              className="gap-2 shadow-lg hover:shadow-xl transition-all font-bold"
            >
              <Plus className="w-4 h-4" />
              إضافة سجل جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي السجلات", value: total.toLocaleString("en-US"), color: "text-primary" },
            { label: "الصفحة الحالية", value: `${page} / ${totalPages}`, color: "text-foreground" },
            { label: "النتائج في هذه الصفحة", value: properties.length.toLocaleString("en-US"), color: "text-foreground" },
            { label: "المرشحات النشطة", value: [city, propertyType, listingType, districtSearch].filter(Boolean).length.toString(), color: hasFilters ? "text-amber-600" : "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">البحث والتصفية</CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-7 px-3 text-xs">
                  مسح الكل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالحي..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={city || "_all_"} onValueChange={(v) => setCity(v === "_all_" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">كل المدن</SelectItem>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={propertyType || "_all_"} onValueChange={(v) => setPropertyType(v === "_all_" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع العقار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">كل الأنواع</SelectItem>
                  {PROPERTY_TYPE_GROUPS.map(g => (
                    <SelectGroup key={g.label}>
                      <SelectLabel className="font-bold text-muted-foreground text-xs">{g.label}</SelectLabel>
                      {g.types.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Select value={listingType || "_all_"} onValueChange={(v) => setListingType(v === "_all_" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">كل الصفقات</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                  <Search className="w-10 h-10 opacity-30" />
                  <p className="text-sm">لا توجد نتائج مطابقة للبحث</p>
                </div>
              ) : (
                <div className={`transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 bg-muted/30">
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground w-16">رقم</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">المدينة</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">الحي</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">النوع</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">العملية</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">السعر</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">المساحة (م²)</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">سعر المتر</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">غرف</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-muted-foreground">السنة</TableHead>
                        <TableHead className="text-center font-semibold text-xs text-muted-foreground w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((p, i) => (
                        <TableRow
                          key={p.id}
                          className={`border-border/30 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}
                        >
                          <TableCell className="text-muted-foreground text-xs font-mono">{p.id}</TableCell>
                          <TableCell className="font-medium text-sm">{p.city}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.district}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {p.propertyType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs font-medium ${
                                p.listingType === "sale"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                              }`}
                              variant="outline"
                            >
                              {p.listingType === "sale" ? "بيع" : "إيجار"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-sm text-primary">
                            {formatPrice(p.price)}
                          </TableCell>
                          <TableCell className="text-sm">{p.area.toLocaleString("en-US")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.pricePerSqm.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.bedrooms ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.year}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                onClick={() => navigate(`/admin/edit/${p.id}`)}
                                title="تعديل"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDelete(p.id)}
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  عرض {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} من {total.toLocaleString("en-US")} سجل
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                    className="h-8 gap-1"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    السابق
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setPage(p)}
                          className="h-8 w-8 p-0"
                          disabled={isFetching}
                        >
                          {p}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isFetching}
                    className="h-8 gap-1"
                  >
                    التالي
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Import Dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="text-lg">تأكيد الحذف</DialogTitle>
            </div>
            <DialogDescription className="text-right">
              هل أنت متأكد من حذف هذا السجل العقاري؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف البيانات نهائياً من قاعدة البيانات.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2 mt-2">
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProperty.isPending}
              className="gap-2"
            >
              {deleteProperty.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              نعم، احذف السجل
            </Button>
            <Button
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setDeleteId(null); }}
              disabled={deleteProperty.isPending}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
