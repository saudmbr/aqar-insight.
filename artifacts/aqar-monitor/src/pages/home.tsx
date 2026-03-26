import { Layout } from "@/components/layout/layout";
import { StatCard } from "@/components/ui/stat-card";
import { 
  Building2, 
  MapPin, 
  Banknote, 
  TrendingUp,
  Activity,
  ArrowLeft
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

const COLORS = ['#0F7BA0', '#1A2744', '#C9A84C', '#64748B', '#E8EDF5'];

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
        className="space-y-10 pb-10"
      >
        {/* Premium Hero Section */}
        <motion.div variants={itemVariants} className="relative rounded-[2rem] overflow-hidden bg-sidebar text-sidebar-foreground shadow-xl">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,123,160,0.1),transparent_50%)] pointer-events-none" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative px-8 py-16 md:px-12 md:py-20 flex flex-col items-start max-w-3xl">
            <Badge className="bg-primary/20 text-primary-foreground border-primary/30 px-4 py-1.5 rounded-full mb-6 font-medium text-sm">
              المنصة العقارية الرائدة
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              اكتشف فرص العقار <br />
              <span className="text-primary-foreground">بذكاء ودقة</span>
            </h1>
            <p className="text-lg md:text-xl text-sidebar-foreground/80 leading-relaxed mb-8 max-w-2xl">
              منصة عقار إنسايت توفر لك أحدث المؤشرات والتحليلات لتمكينك من اتخاذ قرارات عقارية مدروسة في السوق السعودي.
            </p>
          </div>
        </motion.div>

        {/* Welcome Banner (logged-in) or Guest CTA */}
        <motion.div variants={itemVariants}>
          {isAuthenticated && user ? (
            <UserWelcomeBanner fullName={user.fullName ?? user.username} />
          ) : (
            <GuestCTA />
          )}
        </motion.div>

        {/* KPIs */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">مؤشرات السوق</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={itemVariants}>
              <StatCard 
                title="متوسط السعر"
                value={isLoadingKpis ? <Skeleton className="h-8 w-32" /> : formatCurrency(kpis?.avgPrice)}
                icon={<Banknote className="w-6 h-6" />}
                trend={kpis?.priceChangePercent}
                trendLabel="مقارنة بالعام الماضي"
                className="border-l-4 border-l-primary"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard 
                title="متوسط سعر المتر"
                value={isLoadingKpis ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.avgPricePerSqm)}
                icon={<Activity className="w-6 h-6" />}
                className="border-t-4 border-t-accent"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard 
                title="إجمالي العقارات"
                value={isLoadingKpis ? <Skeleton className="h-8 w-20" /> : formatNumber(kpis?.totalListings)}
                icon={<Building2 className="w-6 h-6" />}
                className="border-t-4 border-t-secondary-foreground"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard 
                title="عقارات البيع / الإيجار"
                value={isLoadingKpis ? <Skeleton className="h-8 w-32" /> : `${formatNumber(kpis?.saleCount)} / ${formatNumber(kpis?.rentCount)}`}
                icon={<TrendingUp className="w-6 h-6" />}
                className="border-t-4 border-t-primary"
              />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full border-border premium-shadow rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">اتجاه الأسعار (شهرياً)</CardTitle>
                <CardDescription className="text-base">متوسط السعر على مدار السنة</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[320px] w-full" dir="ltr">
                  {isLoadingTrends ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends || []} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 500 }}
                          dy={15}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 500 }}
                          tickFormatter={(value) => `SAR ${value/1000}k`}
                          dx={10}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'متوسط السعر']}
                          labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', marginBottom: '8px' }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="avgPrice" 
                          stroke="var(--primary)" 
                          strokeWidth={4}
                          dot={{ r: 5, strokeWidth: 3, fill: 'var(--background)', stroke: 'var(--primary)' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--primary)' }}
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
            <Card className="h-full border-border premium-shadow rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">توزيع أنواع العقار</CardTitle>
                <CardDescription className="text-base">حسب إجمالي المعروض</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-4">
                <div className="h-[260px] w-full" dir="ltr">
                  {isLoadingTypes ? (
                    <Skeleton className="w-full h-full rounded-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={types || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="propertyType"
                          stroke="none"
                        >
                          {(types || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatNumber(value), name]}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {(types || []).map((type, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{type.propertyType}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Records */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">أحدث الصفقات العقارية</h2>
          </div>
          <Card className="border-border premium-shadow rounded-2xl overflow-hidden bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-5 font-semibold text-base">المدينة</th>
                      <th className="px-6 py-5 font-semibold text-base">الحي</th>
                      <th className="px-6 py-5 font-semibold text-base">النوع</th>
                      <th className="px-6 py-5 font-semibold text-base">العملية</th>
                      <th className="px-6 py-5 font-semibold text-base">السعر</th>
                      <th className="px-6 py-5 font-semibold text-base">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoadingRecent ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-6 py-5"><Skeleton className="h-5 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : recent?.data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-lg">لا توجد بيانات متاحة</td>
                      </tr>
                    ) : (
                      recent?.data.map((item, i) => (
                        <tr key={item.id} className={`transition-colors hover:bg-muted/30 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                          <td className="px-6 py-5 font-semibold text-foreground">{item.city}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="font-medium">{item.district}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-medium">{item.propertyType}</td>
                          <td className="px-6 py-5">
                            <Badge className={`font-semibold px-3 py-1 ${item.listingType === 'sale' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent-foreground border-accent/20'}`} variant="outline">
                              {item.listingType === 'sale' ? 'بيع' : 'إيجار'}
                            </Badge>
                          </td>
                          <td className="px-6 py-5 font-bold text-foreground text-base">{formatCurrency(item.price)}</td>
                          <td className="px-6 py-5 text-muted-foreground font-medium">{new Date(item.recordedAt).toLocaleDateString('ar-SA')}</td>
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