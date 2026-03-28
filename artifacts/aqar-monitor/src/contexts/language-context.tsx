import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";

export const translations = {
  ar: {
    // Sidebar nav
    home: "الرئيسية",
    properties: "العقارات",
    map: "الخريطة التفاعلية",
    marketers: "المسوّقون",
    services: "سوق الخدمات",
    requests: "الطلبات",
    marketAnalysis: "تحليل السوق",
    districtComparison: "مقارنة الأحياء",
    futureProjects: "المشاريع المستقبلية",
    myAccount: "حسابي",
    myDashboard: "لوحتي",
    marketerProfile: "ملف المسوّق",
    personalProfile: "الملف الشخصي",
    joinMarketer: "انضم كمسوّق",
    createMarketerProfile: "أنشئ ملف مسوّق",
    administration: "الإدارة",
    adminPanel: "لوحة الإدارة",
    addRecord: "إضافة سجل",
    users: "المستخدمون",
    // Header
    login: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    logout: "تسجيل الخروج",
    // Top bar
    callUs: "اتصل بنا",
    postProperty: "أضف إعلانك",
    findAgent: "ابحث عن وكيل",
    downloadApp: "حمّل التطبيق",
    siteSlogan: "المنصة العقارية الأولى في المملكة",
    // Sidebar group labels
    marketplace: "السوق العقاري",
    analytics: "التحليلات والمؤشرات",
    // Sidebar footer
    platformManager: "مدير النظام",
    realEstateMarketer: "مسوّق عقاري",
    serviceProvider: "مزوّد خدمة",
    broker: "وسيط عقاري",
    developer: "مطوّر عقاري",
    member: "عضو موثق",
    // Language toggle
    switchLang: "English",
    langCode: "EN",
  },
  en: {
    // Sidebar nav
    home: "Home",
    properties: "Properties",
    map: "Interactive Map",
    marketers: "Agents",
    services: "Services",
    requests: "Requests",
    marketAnalysis: "Market Analysis",
    districtComparison: "District Comparison",
    futureProjects: "Future Projects",
    myAccount: "My Account",
    myDashboard: "Dashboard",
    marketerProfile: "Agent Profile",
    personalProfile: "Profile",
    joinMarketer: "Become an Agent",
    createMarketerProfile: "Create Agent Profile",
    administration: "Administration",
    adminPanel: "Admin Panel",
    addRecord: "Add Record",
    users: "Users",
    // Header
    login: "Sign In",
    createAccount: "Sign Up",
    logout: "Sign Out",
    // Top bar
    callUs: "Call Us",
    postProperty: "Post Property",
    findAgent: "Find Agent",
    downloadApp: "Download App",
    siteSlogan: "Saudi Arabia's #1 Real Estate Platform",
    // Sidebar group labels
    marketplace: "Marketplace",
    analytics: "Analytics & Insights",
    // Sidebar footer
    platformManager: "Platform Admin",
    realEstateMarketer: "Real Estate Agent",
    serviceProvider: "Service Provider",
    broker: "Broker",
    developer: "Developer",
    member: "Verified Member",
    // Language toggle
    switchLang: "عربي",
    langCode: "AR",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

type LanguageContextType = {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  t: (key) => translations.ar[key],
  toggleLang: () => {},
  isRTL: true,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("aqar-lang") as Lang) ?? "ar";
    } catch {
      return "ar";
    }
  });

  const isRTL = lang === "ar";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", isRTL ? "rtl" : "ltr");
    try {
      localStorage.setItem("aqar-lang", lang);
    } catch {}
  }, [lang, isRTL]);

  const toggleLang = () => setLang(l => (l === "ar" ? "en" : "ar"));
  const t = (key: TranslationKey): string => translations[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
