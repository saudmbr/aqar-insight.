import { useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Shield, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function LegalPrivacy() {
  useEffect(() => {
    document.title = "سياسة الخصوصية – منصة عقار إنسايت";
    const desc = document.querySelector('meta[name="description"]');
    const content = "تعرّف على سياسة الخصوصية لمنصة عقار إنسايت وكيفية جمع بياناتك واستخدامها وحمايتها وفق نظام حماية البيانات الشخصية السعودي.";
    if (desc) desc.setAttribute("content", content);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = content;
      document.head.appendChild(meta);
    }
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8" dir="rtl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span className="text-foreground font-medium">سياسة الخصوصية</span>
        </nav>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0F7BA0] to-[#0a5a75] text-white rounded-3xl p-10 mb-10 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
              <p className="text-white/70 text-sm mt-1">منصة عقار إنسايت</p>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-4">آخر تحديث: مارس 2025 · تلتزم المنصة بحماية خصوصيتك وفق المعايير السعودية والدولية</p>
        </div>

        {/* Intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10 text-sm text-blue-900 leading-relaxed">
          تُولي منصة عقار إنسايت خصوصية مستخدميها أهمية قصوى، وتلتزم بحماية بياناتهم الشخصية وفق أحكام نظام حماية البيانات الشخصية السعودي الصادر بالمرسوم الملكي رقم م/19 لعام 1443هـ والمتطلبات الدولية ذات الصلة. تُوضّح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها.
        </div>

        <div className="space-y-10">

          <Section number="1" title="نطاق التطبيق">
            <p>تسري هذه السياسة على جميع البيانات الشخصية التي تقدّمها أو يتم جمعها عند استخدامك لمنصة عقار إنسايت عبر جميع قنواتها الرقمية المتاحة بما تشمل الموقع الإلكتروني والتطبيقات المرتبطة بها. تُطبَّق هذه السياسة على جميع المستخدمين سواء كانوا زوّاراً أو أعضاء مسجّلين أو مُعلنين أو مزوّدي خدمات.</p>
          </Section>

          <Section number="2" title="البيانات التي يتم جمعها">
            <p className="mb-4">تجمع المنصة الفئات الآتية من البيانات:</p>
            <div className="space-y-4">
              <Subsection title="أولاً: البيانات التي تُقدّمها مباشرةً">
                <ul className="space-y-2 list-none mt-2">
                  <Li>بيانات التسجيل: الاسم الكامل واسم المستخدم وعنوان البريد الإلكتروني ورقم الجوال.</Li>
                  <Li>بيانات الملف الشخصي: الصورة الشخصية والمؤهلات المهنية وبيانات المكتب العقاري.</Li>
                  <Li>محتوى الإعلانات: بيانات العقارات والصور والأوصاف وبيانات التواصل.</Li>
                  <Li>مراسلاتك مع فريق الدعم الفني وبلاغاتك المقدّمة عبر المنصة.</Li>
                </ul>
              </Subsection>
              <Subsection title="ثانياً: البيانات التي يتم جمعها تلقائياً">
                <ul className="space-y-2 list-none mt-2">
                  <Li>بيانات الجهاز: نوع الجهاز والمتصفح ونظام التشغيل وعنوان IP.</Li>
                  <Li>بيانات الاستخدام: الصفحات التي تزورها ومدة الزيارة وسلوك التصفح داخل المنصة.</Li>
                  <Li>بيانات الموقع الجغرافي التقريبي المستنتَجة من عنوان IP.</Li>
                  <Li>ملفات تعريف الارتباط (Cookies) والتقنيات المشابهة.</Li>
                </ul>
              </Subsection>
            </div>
          </Section>

          <Section number="3" title="أغراض استخدام البيانات">
            <p className="mb-4">تستخدم المنصة بياناتك الشخصية للأغراض الآتية فحسب:</p>
            <ul className="space-y-3 list-none">
              <Li>تشغيل الخدمات الأساسية للمنصة وإدارة حسابك وتأمين تجربة مستخدم متميزة.</Li>
              <Li>عرض الإعلانات العقارية ذات الصلة باهتماماتك وتخصيص المحتوى المقدَّم لك.</Li>
              <Li>التواصل معك بشأن تحديثات الخدمة والإشعارات الهامة والرد على استفساراتك.</Li>
              <Li>تحليل أنماط الاستخدام وتحسين أداء المنصة وجودة خدماتها المستمرة.</Li>
              <Li>الكشف عن الاحتيال والحسابات الوهمية والحماية من إساءة الاستخدام.</Li>
              <Li>الامتثال للمتطلبات القانونية والتنظيمية السارية في المملكة العربية السعودية.</Li>
              <Li>إرسال النشرات الإخبارية والعروض الترويجية وفق اختياراتك المسبقة فقط.</Li>
            </ul>
          </Section>

          <Section number="4" title="مشاركة البيانات">
            <p className="mb-4">لا تبيع المنصة بياناتك الشخصية لأطراف ثالثة بأي حال من الأحوال. قد تُشارك البيانات في الحالات الآتية المحدودة:</p>
            <ul className="space-y-3 list-none">
              <Li><strong>مزوّدو الخدمات التقنية:</strong> شركاء موثوقون يؤدّون خدمات تقنية محددة كالاستضافة السحابية وتحليل البيانات، مقيّدون بعقود سرية صارمة.</Li>
              <Li><strong>الجهات الحكومية والقانونية:</strong> عند وجود أمر قضائي أو طلب رسمي من جهة حكومية مختصة وفق الأنظمة السارية.</Li>
              <Li><strong>حماية الحقوق:</strong> عند الضرورة لحماية حقوق المنصة أو مستخدميها أو ممتلكاتهم أو سلامتهم.</Li>
              <Li><strong>إعادة الهيكلة:</strong> في حال الاندماج أو الاستحواذ أو إعادة الهيكلة، مع إخطارك مسبقاً.</Li>
            </ul>
          </Section>

          <Section number="5" title="حماية البيانات">
            <p className="mb-4">تتخذ المنصة إجراءات تقنية وتنظيمية متعددة الطبقات لحماية بياناتك:</p>
            <ul className="space-y-3 list-none">
              <Li>تشفير البيانات أثناء النقل باستخدام بروتوكول TLS 1.3 وعند التخزين بخوارزميات تشفير معتمدة.</Li>
              <Li>أنظمة جدار الحماية وتقنيات الكشف عن التسلل وحماية البنية التحتية.</Li>
              <Li>تقييد وصول الموظفين إلى البيانات الشخصية على أساس الحاجة إلى المعرفة فقط.</Li>
              <Li>إجراء اختبارات الاختراق الدورية ومراجعات الأمن المنتظمة من قِبل جهات متخصصة.</Li>
              <Li>خطط الاستجابة للحوادث الأمنية وإخطار المستخدمين في حال حدوث اختراق.</Li>
            </ul>
            <p className="mt-4 text-sm italic">لا يمكن ضمان الأمن المطلق لأي نظام إلكتروني، غير أن المنصة تبذل أقصى جهد ممكن لتطبيق أفضل معايير الأمن المتاحة.</p>
          </Section>

          <Section number="6" title="ملفات تعريف الارتباط (Cookies)">
            <p className="mb-4">تستخدم المنصة ملفات تعريف الارتباط والتقنيات المشابهة للأغراض الآتية:</p>
            <ul className="space-y-3 list-none">
              <Li><strong>الملفات الضرورية:</strong> لازمة لتشغيل المنصة والحفاظ على جلسة تسجيل الدخول.</Li>
              <Li><strong>ملفات التحليل:</strong> لقياس الأداء وتحليل أنماط الاستخدام لتحسين التجربة.</Li>
              <Li><strong>ملفات التخصيص:</strong> لتذكّر تفضيلاتك وتقديم محتوى مخصّص لك.</Li>
            </ul>
            <p className="mt-4">يمكنك ضبط متصفّحك لرفض ملفات تعريف الارتباط، غير أن ذلك قد يؤثر على بعض وظائف المنصة.</p>
          </Section>

          <Section number="7" title="حقوق المستخدم">
            <p className="mb-4">وفق نظام حماية البيانات الشخصية السعودي، يحق لك ممارسة الحقوق الآتية:</p>
            <ul className="space-y-3 list-none">
              <Li><strong>حق الاطلاع:</strong> الحصول على نسخة من البيانات الشخصية التي تحتفظ بها المنصة عنك.</Li>
              <Li><strong>حق التصحيح:</strong> طلب تصحيح أي بيانات غير دقيقة أو مضلّلة.</Li>
              <Li><strong>حق الحذف:</strong> طلب حذف بياناتك في الحالات المنصوص عليها نظاماً.</Li>
              <Li><strong>حق التقييد:</strong> طلب تقييد معالجة بياناتك في ظروف معينة.</Li>
              <Li><strong>حق الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض التسويق المباشر.</Li>
              <Li><strong>حق النقل:</strong> الحصول على بياناتك بصيغة قابلة للقراءة الآلية ونقلها.</Li>
            </ul>
            <p className="mt-4">لممارسة أي من هذه الحقوق يُرجى التواصل عبر: <span className="text-primary font-medium">privacy@aqar-insight.sa</span></p>
          </Section>

          <Section number="8" title="الاحتفاظ بالبيانات">
            <p>تحتفظ المنصة ببياناتك الشخصية طوال فترة نشاط حسابك ولمدة لا تتجاوز خمس (5) سنوات بعد إغلاق الحساب، أو وفق ما تقتضيه المتطلبات القانونية والتنظيمية النافذة. تُتلَف البيانات التي انتهت الحاجة إليها بصورة آمنة وفق معايير الأمن المعتمدة. قد تحتفظ المنصة ببعض البيانات لفترات أطول إذا اقتضت ذلك ضرورة قانونية أو نزاع قائم أو التزام تنظيمي.</p>
          </Section>

          <Section number="9" title="التعديلات على سياسة الخصوصية">
            <p>تحتفظ المنصة بالحق في تعديل سياسة الخصوصية هذه دورياً لتعكس التغيّرات في الممارسات أو المتطلبات القانونية. ستُعلَن التعديلات الجوهرية عبر إشعار بارز في المنصة أو عبر البريد الإلكتروني المسجّل قبل سريان التعديل بما لا يقل عن ثلاثين (30) يوماً. يُعدّ استمرارك في استخدام المنصة بعد هذه المدة قبولاً للسياسة المعدّلة.</p>
          </Section>

        </div>

        <div className="mt-16 p-6 bg-muted/50 rounded-2xl text-center text-sm text-muted-foreground">
          <p>© 2025 منصة عقار إنسايت · جميع الحقوق محفوظة</p>
          <p className="mt-2">مسؤول حماية البيانات: <span className="text-primary">privacy@aqar-insight.sa</span></p>
        </div>
      </div>
    </Layout>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0F7BA0]/10 text-[#0F7BA0] font-bold text-sm flex items-center justify-center border border-[#0F7BA0]/20">
          {number}
        </div>
        <h2 className="text-xl font-bold text-foreground pt-1.5">{title}</h2>
      </div>
      <div className="mr-14 text-muted-foreground leading-8 text-[0.95rem]">
        {children}
      </div>
      <div className="mt-8 border-b border-border" />
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 border border-border">
      <p className="font-semibold text-foreground mb-1">{title}</p>
      {children}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#0F7BA0] flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
