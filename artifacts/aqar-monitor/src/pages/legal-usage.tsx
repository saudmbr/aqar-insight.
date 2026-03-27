import { useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { BookOpen, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function LegalUsage() {
  useEffect(() => {
    document.title = "سياسة الاستخدام – منصة عقار إنسايت";
    const desc = document.querySelector('meta[name="description"]');
    const content = "اطّلع على سياسة الاستخدام المقبول والمحظور في منصة عقار إنسايت، وآليات الإبلاغ عن المخالفات والإجراءات التأديبية المتّبعة.";
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
          <span className="text-foreground font-medium">سياسة الاستخدام</span>
        </nav>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#C9A84C] to-[#a8872d] text-white rounded-3xl p-10 mb-10 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">سياسة الاستخدام</h1>
              <p className="text-white/85 text-sm mt-1">منصة عقار إنسايت</p>
            </div>
          </div>
          <p className="text-white/80 text-sm mt-4">آخر تحديث: مارس 2025 · تحدّد هذه السياسة حقوقك والتزاماتك تجاه المجتمع العقاري</p>
        </div>

        {/* Intro */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10 text-sm text-amber-900 leading-relaxed">
          تهدف سياسة الاستخدام إلى ضمان بيئة رقمية عقارية آمنة وموثوقة وعادلة لجميع المستخدمين. تُحدّد هذه السياسة السلوكيات المقبولة والمحظورة، وتُوضّح صلاحيات المنصة في التعامل مع المخالفات. الجهل بهذه السياسة لا يُعفي من تطبيقها.
        </div>

        <div className="space-y-10">

          <Section number="1" title="الاستخدام المقبول">
            <p className="mb-4">تُتيح المنصة استخدامها للأغراض المشروعة الآتية:</p>
            <ul className="space-y-3 list-none">
              <Li>الإعلان عن العقارات للبيع أو الإيجار التي يمتلك المستخدم صلاحية التسويق لها.</Li>
              <Li>البحث عن العقارات المناسبة وتصفّح الإعلانات المتاحة وحفظ المفضّلة منها.</Li>
              <Li>التواصل المهني بين أطراف السوق العقاري من ملّاك وسماسرة ومسوّقين ومطوّرين.</Li>
              <Li>الاطلاع على تقارير السوق العقاري وتحليلات الأسعار وبيانات الأحياء.</Li>
              <Li>نشر طلبات العقارات بحثاً عن عروض تتناسب مع الاحتياجات والميزانية.</Li>
              <Li>تسجيل ملفات مهنية للمسوّقين العقاريين ومزوّدي الخدمات الموثوقين.</Li>
            </ul>
          </Section>

          <Section number="2" title="المحتوى المسموح">
            <p className="mb-4">يُسمح بنشر المحتوى الذي يستوفي جميع الشروط الآتية:</p>
            <ul className="space-y-3 list-none">
              <Li>معلومات دقيقة وصحيحة عن العقار تتطابق مع واقعه من حيث الموقع والمساحة والحالة والسعر.</Li>
              <Li>صور أصيلة غير معدّلة للعقار تعكس حالته الفعلية الراهنة.</Li>
              <Li>وصف واضح ومحايد يُبرز مميزات العقار دون مبالغة أو تضليل.</Li>
              <Li>بيانات تواصل حقيقية وفعّالة يمكن التحقق منها.</Li>
              <Li>إعلانات تتوافق مع أنظمة وزارة الإسكان ونظام التسجيل العيني للعقار.</Li>
              <Li>محتوى مكتوب باللغة العربية أو الإنجليزية بأسلوب لائق ومحترم.</Li>
            </ul>
          </Section>

          <Section number="3" title="المحتوى الممنوع">
            <p className="mb-4">يُحظر حظراً قاطعاً نشر أي من المحتويات الآتية:</p>
            <div className="space-y-4">
              <Prohibited title="المحتوى الكاذب والمضلّل">
                <ul className="space-y-2 list-none mt-2">
                  <Li>إعلانات لعقارات وهمية أو غير موجودة أو غير متاحة فعلياً.</Li>
                  <Li>أسعار مغلوطة أو مُضخَّمة أو مخفّضة بشكل احتيالي.</Li>
                  <Li>صور لعقارات أخرى أو صور معدّلة تُخفي عيوباً جوهرية.</Li>
                  <Li>ادّعاء ملكية أو صلاحية تسويق عقار دون سند قانوني.</Li>
                </ul>
              </Prohibited>
              <Prohibited title="المحتوى المسيء والمخالف للأنظمة">
                <ul className="space-y-2 list-none mt-2">
                  <Li>المحتوى المسيء للأديان أو المعتقدات أو الجنسيات أو المجموعات.</Li>
                  <Li>أي محتوى يُروّج للكراهية أو التمييز بأي صورة كانت.</Li>
                  <Li>الإعلانات التي تنتهك أحكام الشريعة الإسلامية أو الأنظمة السعودية النافذة.</Li>
                  <Li>المحتوى ذو الطابع السياسي أو الديني غير ذي الصلة بالعقارات.</Li>
                </ul>
              </Prohibited>
              <Prohibited title="المحتوى الاحتيالي والإجرامي">
                <ul className="space-y-2 list-none mt-2">
                  <Li>الإعلانات التي تهدف إلى النصب أو الاحتيال على المستخدمين.</Li>
                  <Li>روابط ضارة أو مواقع تصيّد أو محتوى إلكتروني خبيث.</Li>
                  <Li>الترويج لأنشطة غسيل الأموال أو تمويل الإرهاب.</Li>
                  <Li>جمع بيانات المستخدمين بطرق غير مشروعة أو دون موافقتهم.</Li>
                </ul>
              </Prohibited>
            </div>
          </Section>

          <Section number="4" title="التقييمات والتعليقات">
            <p className="mb-4">تخضع التقييمات والتعليقات لضوابط محددة:</p>
            <ul className="space-y-3 list-none">
              <Li>يجب أن تستند التقييمات إلى تجربة حقيقية ومباشرة مع المسوّق أو مزوّد الخدمة.</Li>
              <Li>تُحظر التقييمات المزيّفة أو المدفوعة أو المنسّقة بين أطراف متواطئة.</Li>
              <Li>يُحظر استخدام لغة مسيئة أو تشهيرية أو ماسّة بالشرف أو الكرامة في التعليقات.</Li>
              <Li>تحتفظ المنصة بحق حذف أي تقييم يُشتبه في عدم مصداقيته أو في مخالفته لهذه الضوابط.</Li>
              <Li>يمكن للمعنيين الردّ على التقييمات ردّاً مهنياً واحداً دون الانجرار إلى جدال علني.</Li>
            </ul>
          </Section>

          <Section number="5" title="التفاعل بين المستخدمين">
            <p className="mb-4">يلتزم المستخدمون في تعاملاتهم مع بعضهم داخل المنصة بما يأتي:</p>
            <ul className="space-y-3 list-none">
              <Li>الاحترام المتبادل وآداب الحوار المهني في جميع أشكال التواصل.</Li>
              <Li>التعامل بنية حسنة وصدق في التفاوض وعدم اللجوء إلى أسلوب الضغط أو التحايل.</Li>
              <Li>عدم إرسال رسائل ترويجية غير مرغوب فيها أو متكررة لأشخاص لم يطلبوا ذلك.</Li>
              <Li>عدم مشاركة بيانات التواصل الخاصة بالمستخدمين مع أطراف ثالثة دون موافقتهم.</Li>
              <Li>الإبلاغ عن أي سلوك مشبوه أو مخالف يُلاحَظ من مستخدمين آخرين.</Li>
            </ul>
          </Section>

          <Section number="6" title="البلاغات">
            <p className="mb-4">توفّر المنصة آليات واضحة للإبلاغ عن المخالفات:</p>
            <ul className="space-y-3 list-none">
              <Li>يمكن الإبلاغ عن أي إعلان أو محتوى مخالف من خلال زر "الإبلاغ" المتاح بجانب كل إعلان.</Li>
              <Li>تُعالَج البلاغات خلال مدة أقصاها (3-5) أيام عمل من تاريخ الاستلام.</Li>
              <Li>تتعامل المنصة مع جميع البلاغات بسرية تامة وتحافظ على هوية المُبلِّغ.</Li>
              <Li>البلاغات الكيدية أو الزائفة تُعرّض أصحابها لإجراءات تأديبية مماثلة.</Li>
              <Li>للبلاغات العاجلة أو الحساسة: <span className="text-primary font-medium">report@aqar-insight.sa</span></Li>
            </ul>
          </Section>

          <Section number="7" title="الإجراءات والعقوبات">
            <p className="mb-4">تطبّق المنصة منظومة متدرجة من الإجراءات عند ثبوت المخالفة:</p>
            <div className="space-y-3">
              <Penalty level="1" title="إنذار رسمي" color="yellow">
                إصدار إنذار خطي للمستخدم مع توضيح طبيعة المخالفة وتعليق المحتوى المخالف ريثما يُصحَّح.
              </Penalty>
              <Penalty level="2" title="إيقاف مؤقت" color="orange">
                تعليق الحساب لمدة تتراوح بين 7 و30 يوماً حسب جسامة المخالفة، مع حظر نشر محتوى جديد خلال فترة الإيقاف.
              </Penalty>
              <Penalty level="3" title="حذف المحتوى" color="red">
                حذف المحتوى المخالف بالكامل دون إمكانية الاسترداد واشتراط التعهد الخطي بعدم تكرار المخالفة.
              </Penalty>
              <Penalty level="4" title="إغلاق الحساب نهائياً" color="dark">
                إغلاق الحساب بصورة دائمة وحظر التسجيل مجدداً وإبلاغ الجهات المختصة عند الاقتضاء القانوني.
              </Penalty>
            </div>
            <p className="mt-6">تحتفظ المنصة بحق تجاوز هذا التدرّج وتطبيق الإجراء المناسب مباشرةً في حالات المخالفات الجسيمة أو الصريحة التي تمسّ سلامة المستخدمين أو تنتهك الأنظمة القانونية النافذة.</p>
          </Section>

        </div>

        <div className="mt-16 p-6 bg-muted/50 rounded-2xl text-center text-sm text-muted-foreground">
          <p>© 2025 منصة عقار إنسايت · جميع الحقوق محفوظة</p>
          <p className="mt-2">للتواصل مع فريق الامتثال: <span className="text-primary">compliance@aqar-insight.sa</span></p>
        </div>
      </div>
    </Layout>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C9A84C]/10 text-[#C9A84C] font-bold text-sm flex items-center justify-center border border-[#C9A84C]/30">
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

function Prohibited({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <p className="font-semibold text-red-800 mb-1 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        {title}
      </p>
      <div className="text-red-700">{children}</div>
    </div>
  );
}

function Penalty({
  level, title, color, children
}: {
  level: number; title: string; color: "yellow" | "orange" | "red" | "dark"; children: React.ReactNode;
}) {
  const colors = {
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    red: "bg-red-50 border-red-200 text-red-800",
    dark: "bg-gray-900 border-gray-700 text-white",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="font-bold mb-1">المرحلة {level}: {title}</p>
      <p className="text-sm leading-relaxed opacity-80">{children}</p>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#C9A84C] flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
