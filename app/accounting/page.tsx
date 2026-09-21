"use client";

import Link from "next/link";
import {
  FiBookOpen,
  FiFileText,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiTruck,
  FiPlusCircle,
  FiClipboard,
} from "react-icons/fi";

export default function AccountingPage() {
  const modules = [
    {
      title: "دليل الحسابات",
      description:
        "إدارة الحسابات والدليل المحاسبي والحسابات الرئيسية والفرعية.",
      href: "/accounting/accounts",
      icon: FiBookOpen,
      color: "blue",
    },
    {
      title: "القيود اليومية",
      description: "إضافة ومراجعة وتعديل القيود اليومية والحركات المحاسبية.",
      href: "/accounting/journal",
      icon: FiFileText,
      color: "green",
    },
    {
      title: "كشف الحساب",
      description: "عرض جميع الحركات والرصيد الخاص بأي حساب.",
      href: "/accounting/reports",
      icon: FiClipboard,
      color: "purple",
    },
    {
      title: "دفتر الأستاذ",
      description: "عرض حركات الحسابات المدينة والدائنة مع الرصيد الجاري.",
      href: "/accounting/ledger",
      icon: FiBookOpen,
      color: "orange",
    },
    {
      title: "ميزان المراجعة",
      description:
        "عرض أرصدة الحسابات المدينة والدائنة والتحقق من توازن الحسابات.",
      href: "/accounting/trial-balance",
      icon: FiBarChart2,
      color: "indigo",
    },
    {
      title: "قائمة الدخل",
      description: "عرض الإيرادات والمصروفات وصافي الربح أو الخسارة.",
      href: "/accounting/income-statement",
      icon: FiTrendingUp,
      color: "emerald",
    },
    {
      title: "الميزانية العمومية",
      description: "عرض الأصول والالتزامات وحقوق الملكية.",
      href: "/accounting/balance-sheet",
      icon: FiPieChart,
      color: "rose",
    },
  ];

  const quickActions = [
    {
      title: "قيد يومي جديد",
      href: "/accounting/journal/new",
      icon: FiPlusCircle,
    },
    {
      title: "دليل الحسابات",
      href: "/accounting/accounts",
      icon: FiBookOpen,
    },
    {
      title: "تقرير الحسابات",
      href: "/accounting/reports",
      icon: FiFileText,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<
      string,
      {
        bg: string;
        icon: string;
        hover: string;
      }
    > = {
      blue: {
        bg: "bg-blue-50",
        icon: "text-blue-600",
        hover: "hover:border-blue-300",
      },
      green: {
        bg: "bg-green-50",
        icon: "text-green-600",
        hover: "hover:border-green-300",
      },
      purple: {
        bg: "bg-purple-50",
        icon: "text-purple-600",
        hover: "hover:border-purple-300",
      },
      orange: {
        bg: "bg-orange-50",
        icon: "text-orange-600",
        hover: "hover:border-orange-300",
      },
      indigo: {
        bg: "bg-indigo-50",
        icon: "text-indigo-600",
        hover: "hover:border-indigo-300",
      },
      emerald: {
        bg: "bg-emerald-50",
        icon: "text-emerald-600",
        hover: "hover:border-emerald-300",
      },
      rose: {
        bg: "bg-rose-50",
        icon: "text-rose-600",
        hover: "hover:border-rose-300",
      },
    };

    return colors[color] || colors.blue;
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-2.5 sm:p-3 md:p-4">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-4">
          <div className="rounded-xl bg-[#0E1F33] p-4 text-white shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-bold sm:text-2xl">المحاسبة</h1>

                <p className="mt-1 text-[11px] leading-5 text-gray-300 sm:text-xs">
                  إدارة الحسابات والقيود والتقارير المحاسبية لنظام شركة الجابري
                </p>

                <p className="mt-0.5 text-[9px] text-gray-400 sm:text-[10px]">
                  للعسل والزيوت الطبيعة وخدمات العمرة
                </p>
              </div>

              <Link
                href="/accounting/journal/new"
                className="
                  flex
                  w-fit
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-white
                  px-3
                  py-2
                  text-[10px]
                  font-bold
                  text-[#0E1F33]
                  transition
                  hover:bg-gray-100
                  sm:px-4
                  sm:py-2.5
                  sm:text-xs
                "
              >
                <FiPlusCircle size={15} />
                قيد يومي جديد
              </Link>
            </div>
          </div>
        </div>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <section className="mb-4">
          <h2 className="mb-2 text-sm font-bold text-gray-800 sm:text-base">
            الوصول السريع
          </h2>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="
                    flex
                    items-center
                    gap-2.5
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-2.5
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:border-gray-300
                    hover:shadow-md
                    sm:p-3
                  "
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 sm:h-9 sm:w-9">
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[11px] font-bold text-gray-800 sm:text-xs">
                      {action.title}
                    </h3>

                    <p className="mt-0.5 text-[9px] text-gray-500">
                      فتح الصفحة
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            ACCOUNTING MODULES
        ===================================================== */}

        <section>
          <div className="mb-2.5">
            <h2 className="text-sm font-bold text-gray-800 sm:text-base">
              أقسام المحاسبة
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">
              اختر القسم الذي تريد العمل عليه
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              const colors = getColorClasses(module.color);

              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className={`
                    group
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-3
                    shadow-sm
                    transition
                    duration-200
                    hover:-translate-y-0.5
                    hover:shadow-md
                    sm:rounded-2xl
                    sm:p-4
                    ${colors.hover}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        sm:h-10
                        sm:w-10
                        sm:rounded-xl
                        ${colors.bg}
                      `}
                    >
                      <Icon size={19} className={colors.icon} />
                    </div>

                    <span className="text-[9px] text-gray-400 transition group-hover:text-gray-600 sm:text-[10px]">
                      فتح
                    </span>
                  </div>

                  <h3 className="mt-3 text-xs font-bold text-gray-800 sm:text-sm">
                    {module.title}
                  </h3>

                  <p className="mt-1.5 min-h-[36px] text-[9px] leading-4 text-gray-500 sm:text-[10px] sm:leading-5">
                    {module.description}
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-[9px] font-semibold text-gray-600 transition group-hover:text-gray-900 sm:text-[10px]">
                    عرض القسم
                    <span>←</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            ACCOUNTING STRUCTURE
        ===================================================== */}

        <section className="mt-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <FiDollarSign size={18} className="text-gray-700" />
              </div>

              <div>
                <h2 className="text-xs font-bold text-gray-800 sm:text-sm">
                  الهيكل المحاسبي
                </h2>

                <p className="text-[9px] text-gray-500 sm:text-[10px]">
                  الحسابات الرئيسية في النظام
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {/* الأصول */}

              <Link
                href="/accounting/accounts"
                className="
                  rounded-lg
                  border
                  border-gray-200
                  p-2
                  text-center
                  transition
                  hover:bg-blue-50
                  sm:p-2.5
                "
              >
                <FiDollarSign className="mx-auto text-blue-600" size={18} />

                <p className="mt-1.5 text-[9px] font-bold text-gray-700 sm:text-[10px]">
                  الأصول
                </p>
              </Link>

              {/* الالتزامات */}

              <Link
                href="/accounting/accounts"
                className="
                  rounded-lg
                  border
                  border-gray-200
                  p-2
                  text-center
                  transition
                  hover:bg-red-50
                  sm:p-2.5
                "
              >
                <FiClipboard className="mx-auto text-red-600" size={18} />

                <p className="mt-1.5 text-[9px] font-bold text-gray-700 sm:text-[10px]">
                  الالتزامات
                </p>
              </Link>

              {/* حقوق الملكية */}

              <Link
                href="/accounting/accounts"
                className="
                  rounded-lg
                  border
                  border-gray-200
                  p-2
                  text-center
                  transition
                  hover:bg-purple-50
                  sm:p-2.5
                "
              >
                <FiUsers className="mx-auto text-purple-600" size={18} />

                <p className="mt-1.5 text-[9px] font-bold text-gray-700 sm:text-[10px]">
                  حقوق الملكية
                </p>
              </Link>

              {/* الإيرادات */}

              <Link
                href="/accounting/accounts"
                className="
                  rounded-lg
                  border
                  border-gray-200
                  p-2
                  text-center
                  transition
                  hover:bg-green-50
                  sm:p-2.5
                "
              >
                <FiTrendingUp className="mx-auto text-green-600" size={18} />

                <p className="mt-1.5 text-[9px] font-bold text-gray-700 sm:text-[10px]">
                  الإيرادات
                </p>
              </Link>

              {/* المصروفات */}

              <Link
                href="/accounting/accounts"
                className="
                  rounded-lg
                  border
                  border-gray-200
                  p-2
                  text-center
                  transition
                  hover:bg-orange-50
                  sm:p-2.5
                "
              >
                <FiBarChart2 className="mx-auto text-orange-600" size={18} />

                <p className="mt-1.5 text-[9px] font-bold text-gray-700 sm:text-[10px]">
                  المصروفات
                </p>
              </Link>

              {/* تكلفة المبيعات */}

              <Link
                href="/accounting/accounts"
                className="
                  rounded-lg
                  border
                  border-gray-200
                  p-2
                  text-center
                  transition
                  hover:bg-indigo-50
                  sm:p-2.5
                "
              >
                <FiTruck className="mx-auto text-indigo-600" size={18} />

                <p className="mt-1.5 text-[9px] font-bold text-gray-700 sm:text-[10px]">
                  تكلفة المبيعات
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs font-semibold text-gray-700">شركة الجابري</p>

          <p className="mt-0.5 text-[9px] text-gray-500">
            للعسل والزيوت الطبيعة وخدمات العمرة
          </p>

          <p className="mt-0.5 text-[9px] text-gray-400">
            البيضاء - اليمن | هاتف: 734 434 443
          </p>
        </div>
      </div>
    </main>
  );
}
