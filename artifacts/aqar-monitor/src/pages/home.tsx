import { Layout } from "@/components/layout/layout";
import { StatCard } from "@/components/ui/stat-card";
import { 
  Building2, 
  MapPin, 
  Banknote, 
  TrendingUp,
  Activity
} from "lucide-react";
import { 
  useGetKpis, 
  useGetPriceTrends,
  useGetPropertyTypeBreakdown,
  useListProperties 
} from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { GuestCTA, UserWelcomeBanner } from "@/components/guest-cta";

const COLORS = ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#03045e'];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: kpis, isLoading: isLoadingKpis } = useGetKpis({});
  const { data: trends, isLoading: isLoadingTrends } = useGetPriceTrends({});
  const { data: types, isLoading: isLoadingTypes } = useGetPropertyTypeBreakdown({});
  const { data: recent, isLoading: isLoadingRecent } = useListProperties({ limit: 5 });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <Layout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 pb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">رؤية أعمق لاتخاذ قرارات عقارية أفضل</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <motion.div variants={itemVariants}>
            <StatCard 
              title="متوسط السعر"
              value={isLoadingKpis ? <Skeleton className="h-8 w-32" /> : formatCurrency(kpis?.avgPrice)}
              icon={<Banknote className="w-6 h-6" />}
              trend={kpis?.priceChangePercent}
              trendLabel="مقارنة بالعام الماضي"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="متوسط سعر المتر"
              value={isLoadingKpis ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.avgPricePerSqm)}
              icon={<Activity className="w-6 h-6" />}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="إجمالي العقارات"
              value={isLoadingKpis ? <Skeleton className="h-8 w-20" /> : formatNumber(kpis?.totalListings)}
              icon={<Building2 className="w-6 h-6" />}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="عقارات البيع / الإيجار"
              value={isLoadingKpis ? <Skeleton className="h-8 w-32" /> : `${formatNumber(kpis?.saleCount)} / ${formatNumber(kpis?.rentCount)}`}
              icon={<TrendingUp className="w-6 h-6" />}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>اتجاه الأسعار (شهرياً)</CardTitle>
                <CardDescription>متوسط السعر على مدار السنة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full" dir="ltr">
                  {isLoadingTrends ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickFormatter={(value) => `SAR ${value/1000}k`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'متوسط السعر']}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="avgPrice" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Type Breakdown */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>توزيع أنواع العقار</CardTitle>
                <CardDescription>حسب إجمالي المعروض</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[250px] w-full" dir="ltr">
                  {isLoadingTypes ? (
                    <Skeleton className="w-full h-full rounded-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={types || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="propertyType"
                        >
                          {(types || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatNumber(value), name]}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {(types || []).map((type, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{type.propertyType}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Welcome Banner (logged-in) or Guest CTA */}
        <motion.div variants={itemVariants}>
          {isAuthenticated && user ? (
            <UserWelcomeBanner fullName={user.fullName ?? user.username} />
          ) : (
            <GuestCTA />
          )}
        </motion.div>

        {/* Recent Records */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle>أحدث السجلات العقارية</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">المدينة</th>
                      <th className="px-6 py-4 font-medium">الحي</th>
                      <th className="px-6 py-4 font-medium">النوع</th>
                      <th className="px-6 py-4 font-medium">العملية</th>
                      <th className="px-6 py-4 font-medium">السعر</th>
                      <th className="px-6 py-4 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {isLoadingRecent ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : recent?.data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">لا توجد بيانات متاحة</td>
                      </tr>
                    ) : (
                      recent?.data.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-medium">{item.city}</td>
                          <td className="px-6 py-4 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {item.district}
                          </td>
                          <td className="px-6 py-4">{item.propertyType}</td>
                          <td className="px-6 py-4">
                            <Badge variant={item.listingType === 'sale' ? 'default' : 'secondary'} className="font-normal">
                              {item.listingType === 'sale' ? 'بيع' : 'إيجار'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-semibold text-foreground">{formatCurrency(item.price)}</td>
                          <td className="px-6 py-4 text-muted-foreground">{new Date(item.recordedAt).toLocaleDateString('ar-SA')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
