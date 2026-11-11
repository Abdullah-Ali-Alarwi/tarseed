"use client";

import Link from "next/link";
import { useState } from "react";

import {
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiCheckCircle,
  FiCloud,
  FiDatabase,
  FiLayers,
  FiLock,
  FiMenu,
  FiPieChart,
  FiShoppingCart,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: <FiShoppingCart />,
      title: "إدارة المبيعات",
      description:
        "إدارة فواتير المبيعات والعملاء والمدفوعات ومتابعة العمليات بسهولة.",
    },
    {
      icon: <FiBox />,
      title: "إدارة المخزون",
      description: "متابعة المنتجات والكميات وحركات المخزون والمستودعات.",
    },
    {
      icon: <FiPieChart />,
      title: "المحاسبة المالية",
      description: "إدارة الحسابات والقيود اليومية والتقارير والقوائم المالية.",
    },
    {
      icon: <FiUsers />,
      title: "إدارة العملاء",
      description: "تنظيم بيانات العملاء والموردين ومتابعة تعاملاتهم.",
    },
    {
      icon: <FiBarChart2 />,
      title: "التقارير والتحليلات",
      description: "احصل على تقارير واضحة تساعدك على اتخاذ قرارات أفضل.",
    },
    {
      icon: <FiLayers />,
      title: "إدارة الصلاحيات",
      description: "حدد صلاحيات الموظفين وتحكم في الوصول إلى بيانات شركتك.",
    },
  ];

  const advantages = [
    "الوصول إلى النظام من أي مكان.",
    "بيانات منظمة في مكان واحد.",
    "واجهة سهلة الاستخدام.",
    "إدارة متعددة المستخدمين.",
    "تقارير تساعدك على اتخاذ القرار.",
    "تحديثات وتطوير مستمر.",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              W
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">WEZZAN</h1>
              <p className="text-[10px] text-gray-400 tracking-wider">
                BUSINESS MANAGEMENT SYSTEM
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#home" className="hover:text-blue-600 transition">
              الرئيسية
            </a>

            <a href="#features" className="hover:text-blue-600 transition">
              المميزات
            </a>

            <a href="#about" className="hover:text-blue-600 transition">
              عن WEZZAN
            </a>

            <a href="#contact" className="hover:text-blue-600 transition">
              تواصل معنا
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-700 hover:text-blue-600 px-4 py-2"
            >
              تسجيل الدخول
            </Link>

            <Link
              href="#contact"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              ابدأ الآن
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-700 text-2xl"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white p-5 space-y-4">
            <a
              href="#home"
              onClick={() => setMenuOpen(false)}
              className="block"
            >
              الرئيسية
            </a>

            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="block"
            >
              المميزات
            </a>

            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="block"
            >
              عن WEZZAN
            </a>

            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="block"
            >
              تواصل معنا
            </a>

            <Link href="/login" className="block text-blue-600 font-bold">
              تسجيل الدخول
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      >
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-5 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">
          {/* Hero Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-7">
              <FiZap />
              <span>إدارة أعمالك بطريقة أكثر ذكاءً</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-gray-900">
              أدر أعمالك
              <span className="block text-blue-600 mt-2">من مكان واحد</span>
            </h1>

            <p className="text-gray-500 text-lg leading-9 mt-7 max-w-xl">
              WEZZAN هو نظام متكامل لإدارة أعمالك، يجمع المبيعات والمشتريات
              والمخزون والمحاسبة في منصة واحدة تساعدك على تنظيم أعمالك والنمو
              بثقة.
            </p>

            <div className="flex flex-wrap gap-4 mt-9">
              <Link
                href="#contact"
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-xl font-semibold transition shadow-lg shadow-blue-200"
              >
                ابدأ رحلتك الآن
                <FiArrowLeft />
              </Link>

              <Link
                href="#features"
                className="border border-gray-300 hover:border-blue-600 hover:text-blue-600 px-7 py-4 rounded-xl font-semibold transition"
              >
                اكتشف المميزات
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-green-500" />
                سهولة الاستخدام
              </div>

              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-green-500" />
                نظام متكامل
              </div>

              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-green-500" />
                وصول سحابي
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-200 blur-3xl opacity-30 rounded-full" />

            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 md:p-7">
              <div className="flex items-center justify-between border-b pb-5">
                <div>
                  <h3 className="font-bold text-gray-800">لوحة التحكم</h3>

                  <p className="text-xs text-gray-400 mt-1">
                    نظرة عامة على نشاطك التجاري
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiBarChart2 size={22} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <StatCard
                  title="إجمالي المبيعات"
                  value="125,400"
                  icon={<FiShoppingCart />}
                  color="blue"
                />

                <StatCard
                  title="العملاء"
                  value="248"
                  icon={<FiUsers />}
                  color="green"
                />

                <StatCard
                  title="المنتجات"
                  value="1,250"
                  icon={<FiBox />}
                  color="purple"
                />

                <StatCard
                  title="الأرباح"
                  value="32,800"
                  icon={<FiBarChart2 />}
                  color="orange"
                />
              </div>

              {/* Chart Preview */}
              <div className="mt-7 bg-gray-50 rounded-xl p-5">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-sm">أداء المبيعات</h4>

                  <span className="text-xs text-green-600">+12.5%</span>
                </div>

                <div className="flex items-end justify-between gap-3 h-36">
                  {[45, 65, 50, 85, 60, 95, 75, 100, 65, 85, 70, 95].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-blue-500 hover:bg-blue-700 rounded-t-md transition"
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>

                <div className="flex justify-between text-xs text-gray-400 mt-3">
                  <span>يناير</span>
                  <span>مارس</span>
                  <span>يونيو</span>
                  <span>سبتمبر</span>
                  <span>ديسمبر</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-600 font-bold text-sm">
              مميزات WEZZAN
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              كل ما تحتاجه لإدارة أعمالك
            </h2>

            <p className="text-gray-500 leading-8 mt-5">
              أدوات متكاملة تساعدك على إدارة عمليات شركتك ومتابعة أدائها من خلال
              منصة واحدة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-xl transition"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition">
                  {feature.icon}
                </div>

                <h3 className="font-bold text-xl mt-6">{feature.title}</h3>

                <p className="text-gray-500 leading-8 text-sm mt-3">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-blue-600 font-bold text-sm">
              لماذا WEZZAN؟
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-relaxed mt-4">
              إدارة أكثر تنظيماً،
              <span className="text-blue-600"> وقرارات أكثر ذكاءً.</span>
            </h2>

            <p className="text-gray-500 leading-9 mt-6">
              نهدف في WEZZAN إلى توفير تجربة متكاملة لإدارة الأعمال التجارية، من
              خلال جمع العمليات اليومية في نظام واحد يسهل الوصول إليه واستخدامه.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
              {advantages.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <FiCheckCircle className="text-blue-600 shrink-0" />

                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-2 gap-5">
              <InfoCard
                icon={<FiCloud />}
                title="نظام سحابي"
                description="الوصول إلى أعمالك من أي مكان."
              />

              <InfoCard
                icon={<FiLock />}
                title="حماية البيانات"
                description="إدارة آمنة لبيانات شركتك."
              />

              <InfoCard
                icon={<FiDatabase />}
                title="بيانات مركزية"
                description="جميع معلوماتك في مكان واحد."
              />

              <InfoCard
                icon={<FiZap />}
                title="سهولة وسرعة"
                description="إنجاز العمليات بسهولة."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="bg-blue-600 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute w-72 h-72 bg-white opacity-5 rounded-full -top-20 -right-20" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold">
                مستعد لتنظيم أعمالك؟
              </h2>

              <p className="text-blue-100 leading-8 mt-5 max-w-xl mx-auto">
                ابدأ باستخدام WEZZAN واكتشف طريقة أفضل لإدارة عمليات شركتك
                ومتابعة نمو أعمالك.
              </p>

              <a
                href="mailto:support@wazan.com"
                className="inline-flex items-center gap-3 bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold mt-9 transition"
              >
                تواصل معنا
                <FiArrowLeft />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl font-bold">
                  W
                </div>

                <h2 className="text-2xl font-bold">WEZZAN</h2>
              </div>

              <p className="text-gray-400 text-sm leading-8 mt-5 max-w-sm">
                منصة متكاملة لإدارة الأعمال والمبيعات والمخزون والمحاسبة من مكان
                واحد.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-5">روابط سريعة</h3>

              <div className="space-y-4 text-sm text-gray-400">
                <a href="#home" className="block hover:text-white">
                  الرئيسية
                </a>

                <a href="#features" className="block hover:text-white">
                  المميزات
                </a>

                <a href="#about" className="block hover:text-white">
                  عن WEZZAN
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-5">تواصل معنا</h3>

              <p className="text-sm text-gray-400">support@wazan.com</p>
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm pt-7">
            © {new Date().getFullYear()} WEZZAN. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </main>
  );
}

// Statistics Card
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}
      >
        {icon}
      </div>

      <p className="text-xs text-gray-500 mt-3">{title}</p>

      <h3 className="text-xl font-bold text-gray-800 mt-1">{value}</h3>
    </div>
  );
}

// Information Card
function InfoCard({ icon, title, description }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5">
      <div className="text-blue-600 text-3xl">{icon}</div>

      <h3 className="font-bold mt-4">{title}</h3>

      <p className="text-xs text-gray-500 leading-6 mt-2">{description}</p>
    </div>
  );
}
