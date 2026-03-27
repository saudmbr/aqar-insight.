import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { 
  useGetPriceTrends,
  useGetYearlyComparison,
  useGetCities
} from "@workspace/api-client-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

export default function Analytics() {
  const [city, setCity] = useState<string>("all");
  const [listingType, setListingType] = useState<string>("sale");

  const { data: cities } = useGetCities();
  
  const queryParams = {
    ...(city !== "all" && { city }),
    ...(listingType !== "all" && { listingType })
  };

  const { data: trends, isLoading: isLoadingTrends } = useGetPriceTrends(queryParams);
  const { data: yearly, isLoading: isLoadingYearly } = useGetYearlyComparison(queryParams);

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">تحليل السوق</h1>
            <p className="text-muted-foreground mt-1">دراسة معمقة للمؤشرات العقارية والتاريخية</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={listingType} onValueChange={setListingType}>
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="sale">بيع</SelectItem>
                <SelectItem value="rent">إيجار</SelectItem>
              </SelectContent>
            </Select>

            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدن</SelectItem>
                {cities?.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Monthly Area Chart */}
          <Card className="lg:col-span-2 border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>التقلبات الشهرية للأسعار</CardTitle>
              <CardDescription>تحليل الاتجاه العام لمتوسط الأسعار</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full" dir="ltr">
                {isLoadingTrends ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        dy={10}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        tickFormatter={(value) => `${value/1000}k`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'متوسط السعر']}
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="avgPrice" 
                        stroke="var(--primary)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Yearly Comparison Bar Chart */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>المقارنة السنوية</CardTitle>
              <CardDescription>متوسط السعر عبر السنوات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full" dir="ltr">
                {isLoadingYearly ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearly || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="year" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        dy={10}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        tickFormatter={(value) => `${value/1000}k`}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'color-mix(in srgb, var(--muted) 50%, transparent)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'متوسط السعر']}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="avgPrice" 
                        fill="var(--primary)" 
                        radius={[4, 4, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Volume */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>حجم التداول السنوي</CardTitle>
              <CardDescription>عدد الصفقات/العروض المعروضة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full" dir="ltr">
                {isLoadingYearly ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearly || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="year" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        dy={10}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)' }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'color-mix(in srgb, var(--muted) 50%, transparent)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [value, 'إجمالي الصفقات']}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="count" 
                        fill="#C9A84C"
                        radius={[4, 4, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
