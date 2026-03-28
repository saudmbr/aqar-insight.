import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProperty } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, PlusCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة"];
const PROPERTY_TYPES = ["شقة", "فيلا", "أرض", "عمارة", "مكتب", "محل تجاري"];
const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const formSchema = z.object({
  city: z.string().min(2, "المدينة مطلوبة"),
  district: z.string().min(2, "الحي مطلوب"),
  propertyType: z.string().min(2, "نوع العقار مطلوب"),
  listingType: z.enum(["sale", "rent"], { errorMap: () => ({ message: "نوع العملية مطلوب" }) }),
  price: z.coerce.number().min(1, "السعر يجب أن يكون أكبر من 0"),
  area: z.coerce.number().min(1, "المساحة يجب أن تكون أكبر من 0"),
  bedrooms: z.coerce.number().optional().nullable(),
  bathrooms: z.coerce.number().optional().nullable(),
  year: z.coerce.number().min(2000, "السنة يجب أن تكون بعد 2000").max(2100),
  month: z.coerce.number().min(1).max(12),
  recordedAt: z.string().min(1, "التاريخ مطلوب"),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminAdd() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProperty = useCreateProperty();
  const [, navigate] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: "",
      district: "",
      propertyType: "شقة",
      listingType: "sale",
      price: 0,
      area: 0,
      bedrooms: null,
      bathrooms: null,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      recordedAt: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const watchPrice = form.watch("price");
  const watchArea = form.watch("area");
  const pricePerSqm = watchArea > 0 ? watchPrice / watchArea : 0;

  const onSubmit = (data: FormValues) => {
    createProperty.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "تم الحفظ بنجاح",
            description: "تم إضافة السجل العقاري الجديد إلى قاعدة البيانات.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/kpis"] });
          navigate("/admin");
        },
        onError: () => {
          toast({
            title: "حدث خطأ",
            description: "فشل حفظ السجل، الرجاء المحاولة مرة أخرى.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-8">
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة إلى لوحة الإدارة
          </button>
          <h1 className="text-3xl font-bold text-foreground">إضافة سجل جديد</h1>
          <p className="text-muted-foreground mt-1">
            أدخل بيانات العقار لإضافته إلى منصة عقار إنسايت
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle>تفاصيل العقار</CardTitle>
              <CardDescription>
                الرجاء تعبئة الحقول الأساسية لضمان دقة التحليلات
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* City & District */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدينة *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المدينة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CITIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحي *</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: الملقا" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Property Type & Listing Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع العقار *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر النوع" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROPERTY_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع العملية *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر العملية" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sale">بيع</SelectItem>
                              <SelectItem value="rent">إيجار</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Price & Area with auto price/sqm */}
                  <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السعر الإجمالي (ريال) *</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المساحة (م²) *</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {pricePerSqm > 0 && (
                      <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <span>سعر المتر المربع (محسوب تلقائياً):</span>
                        <span className="font-bold">
                          {pricePerSqm.toLocaleString("en-US", { maximumFractionDigits: 0 })} ر.س/م²
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bedrooms, Bathrooms, Year, Month, Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>غرف النوم</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>دورات المياه</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>السنة *</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الشهر *</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(parseInt(v))}
                            value={String(field.value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="الشهر" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MONTHS.map((m, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recordedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ التسجيل *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات إضافية</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أي تفاصيل أخرى كالمميزات، التشطيبات، الخ..."
                            className="resize-none h-24"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin")}
                      disabled={createProperty.isPending}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      className="px-8 font-bold shadow-lg hover:shadow-xl transition-all gap-2"
                      disabled={createProperty.isPending}
                    >
                      {createProperty.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )}
                      إضافة السجل
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
