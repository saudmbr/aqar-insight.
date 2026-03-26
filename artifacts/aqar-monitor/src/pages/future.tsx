import { Layout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BellRing, 
  Scale, 
  MessageSquareText, 
  Map, 
  Star,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

const modules = [
  {
    id: 1,
    title: "تنبيهات ذكية",
    description: "إشعارات فورية عند تغير أسعار العقار في أحيائك المفضلة أو عند توفر فرص ممتازة.",
    icon: BellRing,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: 2,
    title: "تقدير القيمة العادلة",
    description: "نموذج ذكاء اصطناعي لتقييم سعر العقار الفعلي بناءً على 50+ متغير وبيانات تاريخية.",
    icon: Scale,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    id: 3,
    title: "المساعد الذكي العقاري",
    description: "تحدث مع مساعد AI لطرح أسئلة عن السوق واستخراج تقارير تحليلية باللغة الطبيعية.",
    icon: MessageSquareText,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: 4,
    title: "الخريطة الحرارية",
    description: "توزيع بصري لأسعار العقارات والعوائد الإيجارية على الخريطة التفاعلية لاكتشاف الفرص.",
    icon: Map,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: 5,
    title: "نقاط الاستثمار (Scoring)",
    description: "تصنيف تلقائي للمناطق والعقارات لتحديد أفضل العوائد الاستثمارية ومخاطرها.",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  }
];

export default function Future() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="text-center max-w-2xl mx-auto py-8">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/30 bg-primary/5">خارطة الطريق</Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">الوحدات المستقبلية القادمة</h1>
          <p className="text-lg text-muted-foreground">
            نعمل في "عقار مونيتور" على تطوير أدوات متقدمة مدعومة بالذكاء الاصطناعي لتمكين المستثمرين من اتخاذ قرارات مبنية على بيانات موثوقة.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {modules.map((mod) => (
            <motion.div key={mod.id} variants={itemVariants} className="h-full">
              <Card className="h-full relative overflow-hidden border-border/50 group hover:border-primary/30 transition-all duration-500 bg-card/50 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${mod.bg} flex items-center justify-center`}>
                      <mod.icon className={`w-7 h-7 ${mod.color}`} />
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1.5 font-medium bg-secondary/80">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      قريباً
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-3">{mod.title}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-1">
                    {mod.description}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-muted-foreground/30 rounded-full w-1/4"></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-left font-medium">قيد التطوير</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          <motion.div variants={itemVariants} className="h-full">
            <Card className="h-full relative overflow-hidden border-dashed border-2 border-border/60 bg-transparent flex flex-col items-center justify-center p-8 text-center min-h-[250px] hover:bg-muted/10 transition-colors cursor-default">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-muted-foreground">؟</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">لديك فكرة ميزة؟</h3>
              <p className="text-sm text-muted-foreground">نحن نستمع لاقتراحات عملائنا لتطوير المنصة لتلبي احتياجاتهم الحقيقية.</p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
