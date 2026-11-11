"use client";

import Link from "next/link";

import {
  FiFileText,
  FiTrendingUp,
  FiDollarSign,
  FiBarChart2,
  FiArrowLeft,
  FiActivity,
  FiPieChart,
  FiCalendar,
} from "react-icons/fi";

const reports = [
  {
    title: "ميزان المراجعة",
    description: "عرض أرصدة الحسابات المدينة والدائنة والتحقق من توازنها.",
    href: "/erp/reports/trial-balance",
    icon: FiBarChart2,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "قائمة الدخل",
    description: "عرض الإيرادات والمصروفات وصافي الربح أو الخسارة.",
    href: "/erp/reports/income-statement",
    icon: FiTrendingUp,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "الميزانية العمومية",
    description: "عرض الأصول والالتزامات وحقوق الملكية.",
    href: "/erp/reports/balance-sheet",
    icon: FiDollarSign,
    color: "bg-purple-50 text-purple-600",
  },
];

export default function ReportsPage() {
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">التقارير</h1>

          <p className="mt-1 text-sm text-slate-500">
            مركز التقارير المالية والإدارية للنظام
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          <FiCalendar size={15} />
          <span>{new Date().toLocaleDateString("ar-YE")}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">التقارير المتاحة</p>

              <h2 className="mt-2 text-2xl font-bold text-slate-800">3</h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiFileText size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">التقارير المالية</p>

              <h2 className="mt-2 text-2xl font-bold text-slate-800">3</h2>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <FiDollarSign size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">حالة التقارير</p>

              <h2 className="mt-2 text-lg font-bold text-emerald-600">
                جاهزة للعرض
              </h2>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <FiActivity size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Reports */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-800">
            التقارير المالية
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            اختر التقرير الذي تريد عرضه
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <Link
                href={report.href}
                key={report.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-3 ${report.color}`}>
                    <Icon size={23} />
                  </div>

                  <FiArrowLeft
                    size={18}
                    className="text-slate-300 transition-transform group-hover:-translate-x-1 group-hover:text-slate-700"
                  />
                </div>

                <h3 className="mt-5 text-sm font-bold text-slate-800">
                  {report.title}
                </h3>

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {report.description}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-blue-600">
                    عرض التقرير
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Future Reports */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white p-3 text-slate-500 shadow-sm">
            <FiPieChart size={22} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700">تقارير إضافية</h3>

            <p className="mt-1 text-xs text-slate-500">
              يمكن إضافة تقارير المبيعات والمشتريات والمخزون والعملاء والموردين
              لاحقاً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
