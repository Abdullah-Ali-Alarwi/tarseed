"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiFileText,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiEye,
  FiFilter,
  FiAlertCircle,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

type Quotation = {
  id: string;
  companyId: string;
  quotationNumber: string;
  customerId: string | null;
  customerName: string | null;
  date: string;
  expiryDate: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string | null;
};

type StatusFilter =
  | "all"
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "converted";

const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const getStatus = (status: string) => {
  const statuses: Record<string, { label: string; className: string }> = {
    draft: {
      label: "مسودة",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
    sent: {
      label: "مرسل",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    approved: {
      label: "موافق عليه",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    rejected: {
      label: "مرفوض",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    expired: {
      label: "منتهي الصلاحية",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    converted: {
      label: "تم التحويل لفاتورة",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
  };

  return (
    statuses[status] || {
      label: status || "غير محدد",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    }
  );
};

export default function SalesQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchQuotations = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // التحقق من جلسة المستخدم
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("يرجى تسجيل الدخول أولاً.");
      }

      // جلب بيانات المستخدم والشركة
      const { data: currentUser, error: userError } = await supabase
        .from("users")
        .select("id, companyId, status, isActive")
        .eq("auth_user_id", user.id)
        .single();

      if (userError || !currentUser) {
        throw new Error("تعذر العثور على بيانات المستخدم.");
      }

      if (
        currentUser.isActive === false ||
        currentUser.status?.toLowerCase() !== "active"
      ) {
        throw new Error("حساب المستخدم غير نشط.");
      }

      if (!currentUser.companyId) {
        throw new Error("المستخدم غير مرتبط بشركة.");
      }

      // جلب عروض الأسعار
      const { data, error: quotationsError } = await supabase
        .from("salesQuotations")
        .select("*")
        .eq("companyId", currentUser.companyId)
        .order("date", { ascending: false })
        .limit(500);

      if (quotationsError) {
        throw quotationsError;
      }

      setQuotations((data || []) as Quotation[]);
    } catch (err: unknown) {
      console.error("Sales quotations error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل عروض الأسعار.",
      );

      setQuotations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // البحث والتصفية
  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      const value = search.trim().toLowerCase();

      const matchesSearch =
        !value ||
        quotation.quotationNumber?.toLowerCase().includes(value) ||
        quotation.customerName?.toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "all" || quotation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  // الإحصائيات
  const statistics = useMemo(() => {
    return {
      count: quotations.length,

      total: quotations.reduce((sum, item) => sum + Number(item.total || 0), 0),

      approved: quotations.filter((item) => item.status === "approved").length,

      converted: quotations.filter((item) => item.status === "converted")
        .length,
    };
  }, [quotations]);

  return (
    <div dir="rtl" className="space-y-6 pb-8">
      {/* عنوان الصفحة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiFileText size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800">عروض الأسعار</h1>

            <p className="mt-1 text-sm text-slate-500">
              إنشاء وإدارة عروض أسعار العملاء
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchQuotations(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/sales/quotations/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiPlus size={18} />
            عرض سعر جديد
          </Link>
        </div>
      </div>

      {/* الأخطاء */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle size={20} />
          {error}
        </div>
      )}

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي العروض"
          value={formatMoney(statistics.count)}
          icon={<FiFileText size={21} />}
          color="blue"
        />

        <StatCard
          title="إجمالي قيمة العروض"
          value={formatMoney(statistics.total)}
          icon={<FiDollarSign size={21} />}
          color="indigo"
        />

        <StatCard
          title="عروض موافق عليها"
          value={formatMoney(statistics.approved)}
          icon={<FiUser size={21} />}
          color="green"
        />

        <StatCard
          title="تم تحويلها لفواتير"
          value={formatMoney(statistics.converted)}
          icon={<FiFileText size={21} />}
          color="amber"
        />
      </div>

      {/* جدول العروض */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* البحث والتصفية */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم العرض أو اسم العميل..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400"
            >
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="sent">مرسل</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
              <option value="expired">منتهي الصلاحية</option>
              <option value="converted">تم التحويل</option>
            </select>
          </div>
        </div>

        {/* عدد النتائج */}
        <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500">
          عرض{" "}
          <span className="font-semibold text-slate-800">
            {filteredQuotations.length}
          </span>{" "}
          من أصل{" "}
          <span className="font-semibold text-slate-800">
            {quotations.length}
          </span>{" "}
          عرض سعر
        </div>

        {/* المحتوى */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <FiRefreshCw className="animate-spin" size={20} />
            جاري تحميل عروض الأسعار...
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FiFileText size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">لا توجد عروض أسعار</h3>

            <p className="mt-2 text-sm text-slate-500">
              {search || statusFilter !== "all"
                ? "لا توجد نتائج تطابق البحث أو التصفية."
                : "لم يتم إنشاء عروض أسعار حتى الآن."}
            </p>

            {!search && statusFilter === "all" && (
              <Link
                href="/erp/sales/quotations/new"
                className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <FiPlus />
                إنشاء أول عرض سعر
              </Link>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[950px] text-right text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-4">رقم العرض</th>
                  <th className="px-5 py-4">العميل</th>
                  <th className="px-5 py-4">تاريخ العرض</th>
                  <th className="px-5 py-4">تاريخ الانتهاء</th>
                  <th className="px-5 py-4">الإجمالي</th>
                  <th className="px-5 py-4">الحالة</th>
                  <th className="px-5 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((quotation) => {
                  const status = getStatus(quotation.status);

                  return (
                    <tr
                      key={quotation.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {quotation.quotationNumber}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {quotation.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FiUser size={15} />
                          </div>

                          <span className="font-medium text-slate-700">
                            {quotation.customerName || "عميل نقدي"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-slate-400" />
                          {formatDate(quotation.date)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(quotation.expiryDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {formatMoney(quotation.total)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <Link
                            href={`/erp/sales/quotations/${quotation.id}`}
                            title="عرض التفاصيل"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiEye size={17} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// بطاقة الإحصائيات
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "indigo" | "green" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-3 text-xl font-bold text-slate-800">{value}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
