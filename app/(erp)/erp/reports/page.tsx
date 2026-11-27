"use client";

import { useEffect, useState } from "react";
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
  FiBookOpen,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

// أنواع البيانات
type ReportStats = {
  activeAccounts: number;
  postedJournals: number;
};

type UserData = {
  id: string;
  username: string;
  fullName?: string;
  companyId?: string;
  type?: string;
  isActive?: boolean;
  status?: string;
};

// التقارير المتاحة
const reports = [
  {
    title: "ميزان المراجعة",
    description: "عرض أرصدة الحسابات المدينة والدائنة والتحقق من توازنها.",
    href: "/erp/reports/trial-balance",
    icon: FiBarChart2,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
  },
  {
    title: "قائمة الدخل",
    description: "عرض الإيرادات والمصروفات وصافي الربح أو الخسارة.",
    href: "/erp/reports/income-statement",
    icon: FiTrendingUp,
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
  },
  {
    title: "الميزانية العمومية",
    description: "عرض الأصول والالتزامات وحقوق الملكية.",
    href: "/erp/reports/balance-sheet",
    icon: FiDollarSign,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
  },
];

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    activeAccounts: 0,
    postedJournals: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentDate, setCurrentDate] = useState("");

  // قراءة اسم المستخدم من Cookie
  const getUsernameFromCookie = () => {
    if (typeof document === "undefined") return null;

    const match = document.cookie.match(/(?:^|;\s*)username=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : null;
  };

  // جلب إحصائيات التقارير من Supabase
  const fetchReportStats = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. الحصول على المستخدم الحالي
      const username = getUsernameFromCookie();

      if (!username) {
        throw new Error("لم يتم العثور على بيانات المستخدم المسجل دخوله.");
      }

      const userResult = await getUserByUsername(username);

      const user = (
        Array.isArray(userResult) ? userResult[0] : userResult
      ) as UserData | null;

      if (!user) {
        throw new Error("تعذر العثور على المستخدم.");
      }

      // 2. التحقق من نوع المستخدم وحالته
      if (user.type === "platform") {
        throw new Error("ليس لديك صلاحية الوصول إلى تقارير الشركة.");
      }

      if (user.isActive === false || user.status === "inactive") {
        throw new Error("حساب المستخدم غير نشط.");
      }

      // 3. التحقق من ارتباط المستخدم بشركة
      if (!user.companyId) {
        throw new Error("المستخدم غير مرتبط بأي شركة.");
      }

      const companyId = user.companyId;

      // 4. جلب عدد الحسابات النشطة
      const accountsResult = await supabase
        .from("accounts")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("companyId", companyId)
        .eq("isActive", true);

      if (accountsResult.error) {
        throw accountsResult.error;
      }

      // 5. جلب عدد القيود المرحلة
      const journalsResult = await supabase
        .from("journals")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("companyId", companyId)
        .eq("status", "posted");

      if (journalsResult.error) {
        throw journalsResult.error;
      }

      // 6. تحديث الإحصائيات
      setStats({
        activeAccounts: accountsResult.count ?? 0,
        postedJournals: journalsResult.count ?? 0,
      });
    } catch (err) {
      console.error("Reports dashboard error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل بيانات التقارير.",
      );
    } finally {
      setLoading(false);
    }
  };

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    fetchReportStats();

    setCurrentDate(
      new Date().toLocaleDateString("ar-YE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  return (
    <div dir="rtl" className="space-y-6 pb-8">
      {/* ================= Header ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiFileText size={21} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">التقارير</h1>

              <p className="mt-1 text-sm text-slate-500">
                مركز التقارير المالية والإدارية للنظام
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <FiCalendar size={15} />

            <span>{currentDate || "..."}</span>
          </div>

          <button
            type="button"
            onClick={fetchReportStats}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* ================= Error ================= */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">تعذر تحميل بيانات التقارير</p>

            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchReportStats}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ================= Summary Cards ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* التقارير المتاحة */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                التقارير المتاحة
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-800">
                  {reports.length}
                </h3>

                <span className="text-xs text-slate-400">تقارير مالية</span>
              </div>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiFileText size={23} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-emerald-600">
            <FiCheckCircle size={14} />
            <span>متاحة للعرض</span>
          </div>
        </div>

        {/* الحسابات النشطة */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                الحسابات النشطة
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-800">
                  {loading ? (
                    <span className="inline-block h-9 w-12 animate-pulse rounded bg-slate-100" />
                  ) : (
                    stats.activeAccounts.toLocaleString("en-US")
                  )}
                </h3>

                <span className="text-xs text-slate-400">حساب</span>
              </div>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiBookOpen size={23} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <FiActivity size={14} />
            <span>من دليل حسابات الشركة</span>
          </div>
        </div>

        {/* القيود المرحلة */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                القيود المرحلة
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-800">
                  {loading ? (
                    <span className="inline-block h-9 w-12 animate-pulse rounded bg-slate-100" />
                  ) : (
                    stats.postedJournals.toLocaleString("en-US")
                  )}
                </h3>

                <span className="text-xs text-slate-400">قيد</span>
              </div>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FiBarChart2 size={23} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <FiCheckCircle size={14} />
            <span>من القيود المحاسبية المرحلة</span>
          </div>
        </div>
      </div>

      {/* ================= Financial Reports ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              التقارير المالية
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              اختر التقرير الذي تريد عرضه
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {reports.length} تقارير
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <Link
                href={report.href}
                key={report.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${report.color}`}
                  >
                    <Icon size={23} />
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                    <FiArrowLeft size={17} />
                  </div>
                </div>

                <h3 className="mt-5 text-base font-bold text-slate-800 transition group-hover:text-blue-700">
                  {report.title}
                </h3>

                <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
                  {report.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-medium text-slate-500">
                    عرض التقرير
                  </span>

                  <span className="text-xs font-semibold text-blue-600 transition group-hover:translate-x-[-3px]">
                    فتح التقرير
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ================= Future Reports ================= */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
            <FiPieChart size={23} />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-slate-700">تقارير إضافية</h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              يمكن توسيع مركز التقارير مستقبلًا ليشمل تقارير المبيعات والمشتريات
              والمخزون والعملاء والموردين والتدفقات النقدية.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "تقارير المبيعات",
                "تقارير المشتريات",
                "تقارير المخزون",
                "تقارير العملاء",
                "تقارير الموردين",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
