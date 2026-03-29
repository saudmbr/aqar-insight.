import { SAUDI_CITIES as CITIES } from "@/lib/saudi-cities";
import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetProperty, useUpdateProperty } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { PROPERTY_TYPE_GROUPS } from "@/lib/property-types";

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

export default function AdminEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const propertyId = parseInt(id ?? "");

  const { data: property, isLoading, isError } = useGetProperty(
    propertyId,
    { query: { enabled: !isNaN(propertyId) } }
  );

  const updateProperty = useUpdateProperty();

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

  useEffect(() => {
    if (property) {
      form.reset({
        city: property.city,
        district: property.district,
        propertyType: property.propertyType,
        listingType: property.listingType as "sale" | "rent",
        price: property.price,
        area: property.area,
        bedrooms: property.bedrooms ?? null,
        bathrooms: property.bathrooms ?? null,
        year: property.year,
        month: property.month,
        recordedAt: property.recordedAt,
        notes: property.notes ?? "",
      });
    }
  }, [property, form]);

  const watchPrice = form.watch("price");
  const watchArea = form.watch("area");
  const pricePerSqm = watchArea > 0 ? watchPrice / watchArea : 0;

  const onSubmit = (data: FormValues) => {
    updateProperty.mutate(
      { id: propertyId, data },
      {
        onSuccess: () => {
          toast({
            title: "تم التعديل بنجاح",
            description: "تم حفظ التغييرات على السجل العقاري.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/kpis"] });
          navigate("/admin");
        },
        onError: () => {
          toast({
            title: "حدث خطأ",
            description: "فشل حفظ التغييرات، الرجاء المحاولة مرة أخرى.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isNaN(propertyId)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
          <AlertCircle className="w-12 h-12 opacity-40" />
          <p>معرّف السجل غير صحيح</p>
          <Button variant="outline" onClick={() => navigate("/admin")}>العودة إلى لوحة الإدارة</Button>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
          <AlertCircle className="w-12 h-12 opacity-40" />
          <p>لم يتم العثور على السجل أو حدث خطأ في الاتصال</p>
          <Button variant="outline" onClick={() => navigate("/admin")}>العودة إلى لوحة الإدارة</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى لوحة الإدارة
            </button>
            <h1 className="text-3xl font-bold text-foreground">تعديل السجل العقاري</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? "جاري التحميل..." : `تعديل سجل رقم #${propertyId} — ${property?.city ?? ""} / ${property?.district ?? ""}`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle>تفاصيل العقار</CardTitle>
                <CardDescription>عدّل الحقول المطلوبة ثم احفظ التغييرات</CardDescription>
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

                    {/* Price, Area, auto-calc pricePerSqm */}
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
                              <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? null : e.target.value)} />
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
                              <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === "" ? null : e.target.value)} />
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
                            <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
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
                          <FormLabel>ملاحظات</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="أي تفاصيل إضافية..."
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
                        disabled={updateProperty.isPending}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        className="px-8 font-bold shadow-lg hover:shadow-xl transition-all gap-2"
                        disabled={updateProperty.isPending}
                      >
                        {updateProperty.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        حفظ التعديلات
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
