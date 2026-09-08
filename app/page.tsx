import Link from "next/link";
import React from "react";
import homeImage from "@/public/home.png";
import Image from "next/image";
import {
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiUsers,
  FiShoppingCart,
  FiFileText,
  FiShield,
} from "react-icons/fi";

export default function Home() {
  const features = [
    {
      icon: FiBarChart2,
      title: "المحاسبة",
      text: "إدارة الحسابات والقيود اليومية والتقارير المالية.",
    },
    {
      icon: FiShoppingCart,
      title: "المبيعات والمشتريات",
      text: "إدارة الفواتير والمبيعات والمشتريات بسهولة.",
    },
    {
      icon: FiBox,
      title: "إدارة المخزون",
      text: "متابعة الأصناف والكميات وحركة المخزون.",
    },
    {
      icon: FiUsers,
      title: "العملاء والموردين",
      text: "إدارة بيانات العملاء والموردين وحساباتهم.",
    },
    {
      icon: FiFileText,
      title: "التقارير",
      text: "تقارير مالية وإدارية تساعدك على اتخاذ القرار.",
    },
    {
      icon: FiShield,
      title: "أمان البيانات",
      text: "تنظيم وإدارة بيانات المنشأة بشكل آمن.",
    },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50">
      <section className="w-full bg-white flex justify-center overflow-hidden">
        <Image
          src={homeImage}
          alt="نظام الإدارة والمحاسبة"
          className="w-full h-full object-contain"
          priority
        />
      </section>

      <section className="relative min-h-[620px] overflow-hidden ">
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute -right-32 top-10 w-96 h-96 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-[620px] flex items-center">
          <div className="max-w-3xl py-20">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-blue-900 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
              نظام ERP متكامل
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-blue-950  leading-tight">
              أدر أعمالك
              <span className="block text-blue-400 mt-2">بسهولة واحترافية</span>
            </h1>

            <p className="text-lg md:text-xl  text-black leading-8 mt-6 max-w-2xl">
              نظام إداري ومحاسبي متكامل يساعدك على إدارة المبيعات، المشتريات،
              المخزون، العملاء، الموردين والحسابات من مكان واحد.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-blue- px-7 py-3.5 rounded-lg font-semibold transition shadow-lg shadow-blue-900/30"
              >
                دخول إلى النظام
                <FiArrowLeft size={19} />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-blue-950 hover:bg-white/20 transition font-medium"
              >
                تعرف على النظام
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 mt-10 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <FiShield className="text-blue-400" />
                أمان البيانات
              </div>

              <div className="flex items-center gap-2">
                <FiBarChart2 className="text-blue-400" />
                تقارير متقدمة
              </div>

              <div className="flex items-center gap-2">
                <FiUsers className="text-blue-400" />
                إدارة متكاملة
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-bold mb-3">مميزات النظام</p>

            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800">
              كل ما تحتاجه لإدارة منشأتك
            </h2>

            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              مجموعة متكاملة من الأدوات لإدارة أعمالك ومتابعة العمليات المالية
              والإدارية بكفاءة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition duration-300"
                >
                  <div className="w-[52px] h-[52px] rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">
                    {feature.title}
                  </h3>

                  <p className="text-slate-500 text-sm leading-7 mt-2">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden bg-[#0f172a] rounded-3xl p-10 md:p-14 text-center">
            <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                ابدأ بإدارة أعمالك بطريقة أفضل
              </h2>

              <p className="text-slate-400 mt-4">
                جميع أدوات الإدارة والمحاسبة في نظام واحد.
              </p>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 mt-8 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-lg font-semibold transition"
              >
                الدخول إلى لوحة التحكم
                <FiArrowLeft />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-7">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-sm text-slate-400">
              © 2026 نظام ERP - جميع الحقوق محفوظة
            </p>

            <p className="text-sm text-slate-400">
              نظام الإدارة والمحاسبة المتكامل
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
