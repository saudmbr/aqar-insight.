import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { 
  useGetDistrictComparison,
  useGetCities,
  useGetPropertyTypes
} from "@workspace/api-client-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { Map } from "lucide-react";

export default function Districts() {
  const { data: cities } = useGetCities();
  const { data: propertyTypes } = useGetPropertyTypes();
  
  const [city, setCity] = useState<string>("الرياض"); // Default selection
  const [propertyType, setPropertyType] = useState<string>("all");
  const [listingType, setListingType] = useState<string>("sale");

  const queryParams = {
    city,
    ...(propertyType !== "all" && { propertyType }),
    ...(listingType !== "all" && { listingType })
  };

  const { data: districts, isLoading } = useGetDistrictComparison(queryParams, {
    query: { enabled: !!city }
  });

  // Sort by average price descending and take top 15 for the chart
  const sortedDistricts = districts ? [...districts].sort((a, b) => b.avgPrice - a.avgPrice) : [];
  const topDistricts = sortedDistricts.slice(0, 15);

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        {/* Hero banner — consistent with all other pages */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.04 }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_80%_at_top_right,rgba(201,168,76,0.10),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Map className="w-3.5 h-3.5" />
              خرائط وبيانات الأحياء
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">مقارنة الأحياء</h1>
            <p className="text-white/75 mt-2 text-base">قارن أداء وتوزيع الأسعار بين مختلف أحياء المدينة</p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <Select value={listingType} onValueChange={setListingType}>
              <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="sale">بيع</SelectItem>
                <SelectItem value="rent">إيجار</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="نوع العقار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {propertyTypes?.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-[160px] bg-white/15 border-white/30 text-white ring-1 ring-white/20">
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                {cities?.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Horizontal Bar Chart for Top Districts */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>الأحياء الأعلى سعراً في {city}</CardTitle>
              <CardDescription>مقارنة بناءً على متوسط السعر العام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[450px] w-full" dir="ltr">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={topDistricts} 
                      layout="vertical" 
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                      <XAxis 
                        type="number" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        tickFormatter={(value) => `${value/1000}k`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="district" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--foreground)', fontWeight: 500 }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'color-mix(in srgb, var(--muted) 30%, transparent)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'متوسط السعر']}
                      />
                      <Bar 
                        dataKey="avgPrice" 
                        fill="var(--primary)" 
                        radius={[0, 4, 4, 0]} 
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Full Districts Table */}
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50">
              <CardTitle>البيانات التفصيلية للأحياء</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">الحي</th>
                      <th className="px-6 py-4 font-medium">إجمالي المعروض</th>
                      <th className="px-6 py-4 font-medium">متوسط السعر</th>
                      <th className="px-6 py-4 font-medium">متوسط سعر المتر</th>
                      <th className="px-6 py-4 font-medium">أقل سعر</th>
                      <th className="px-6 py-4 font-medium">أعلى سعر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : sortedDistricts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">لا توجد بيانات متاحة للمدينة المحددة</td>
                      </tr>
                    ) : (
                      sortedDistricts.map((item) => (
                        <tr key={item.district} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground">{item.district}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold min-w-[2rem]">
                              {formatNumber(item.count)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-primary font-medium">{formatCurrency(item.avgPrice)}</td>
                          <td className="px-6 py-4">{formatCurrency(item.avgPricePerSqm)}</td>
                          <td className="px-6 py-4 text-muted-foreground">{formatCurrency(item.minPrice)}</td>
                          <td className="px-6 py-4 text-muted-foreground">{formatCurrency(item.maxPrice)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
