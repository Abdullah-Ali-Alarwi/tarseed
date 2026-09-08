import Link from "next/link";
import {
  FiCheckCircle,
  FiBarChart2,
  FiShield,
  FiUsers,
  FiArrowLeft,
} from "react-icons/fi";
import type { IconType } from "react-icons";

export default function AboutPage() {
  const features = [
    "إدارة الحسابات والقيود اليومية",
    "إدارة المبيعات والمشتريات",
    "إدارة المخزون والأصناف",
    "إدارة العملاء والموردين",
    "التقارير المالية والإدارية",
    "متابعة الأداء المالي للمنشأة",
  ];

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-sm font-medium mb-5">
              من نحن
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              نظام متكامل لإدارة
              <span className="text-amber-600"> أعمالك ومحاسبتك</span>
            </h1>

            <p className="text-gray-500 text-lg leading-8 mt-6">
              نقدم نظام ERP يساعد المنشآت على إدارة عملياتها اليومية ومتابعة
              الحسابات والمبيعات والمشتريات والمخزون والعملاء والموردين من خلال
              منصة واحدة.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* TEXT */}

            <div>
              <p className="text-amber-600 font-semibold mb-3">عن النظام</p>

              <h2 className="text-3xl font-bold text-gray-800">
                كل عمليات منشأتك في مكان واحد
              </h2>

              <p className="text-gray-500 leading-8 mt-5">
                تم تصميم النظام لتسهيل إدارة العمليات المالية والإدارية وتقليل
                العمل اليدوي، مع توفير معلومات واضحة تساعد الإدارة على اتخاذ
                قرارات أفضل.
              </p>

              <p className="text-gray-500 leading-8 mt-4">
                يجمع النظام بين المحاسبة والمبيعات والمشتريات والمخزون وإدارة
                العملاء والموردين والتقارير في بيئة واحدة مترابطة.
              </p>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 mt-7 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                الدخول إلى النظام
                <FiArrowLeft size={18} />
              </Link>
            </div>

            {/* CARDS */}

            <div className="grid grid-cols-2 gap-5">
              <InfoCard
                icon={FiBarChart2}
                title="إدارة مالية"
                text="متابعة الأداء المالي والحسابات."
              />

              <InfoCard
                icon={FiShield}
                title="بيانات منظمة"
                text="إدارة بيانات المنشأة بطريقة منظمة."
              />

              <InfoCard
                icon={FiUsers}
                title="إدارة العملاء"
                text="متابعة العملاء والأرصدة والتحصيلات."
              />

              <InfoCard
                icon={FiCheckCircle}
                title="سهولة الاستخدام"
                text="واجهة واضحة وسهلة الاستخدام."
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-amber-600 font-semibold mb-3">
              ماذا يقدم النظام؟
            </p>

            <h2 className="text-3xl font-bold text-gray-800">
              حلول متكاملة لإدارة المنشأة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-amber-200 transition"
              >
                <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle size={18} />
                </div>

                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION / VISION
      ===================================================== */}

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gray-900 rounded-2xl p-10 md:p-14 text-center">
            <h2 className="text-3xl font-bold text-white">رؤيتنا</h2>

            <p className="text-gray-400 leading-8 max-w-2xl mx-auto mt-5">
              بناء نظام ERP عربي سهل الاستخدام يساعد المنشآت الصغيرة والمتوسطة
              على تنظيم أعمالها وإدارة مواردها واتخاذ القرارات بناءً على بيانات
              مالية دقيقة.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-gray-400">
            © 2026 نظام ERP - جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </main>
  );
}

/* =====================================================
   INFO CARD
===================================================== */

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: IconType;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <Icon size={22} />
      </div>

      <h3 className="font-bold text-gray-800 mt-4">{title}</h3>

      <p className="text-sm text-gray-500 leading-6 mt-2">{text}</p>
    </div>
  );
}
