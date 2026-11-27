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

type SalesInvoice = {
  id: string;
  companyId: string;
  invoiceNumber: string | null;
  customerId: string | null;
  customerName: string | null;
  date: string | null;
  total: number | null;
  totalAmount: number | null;
  grandTotal: number | null;
  paidAmount: number | null;
  remainingAmount: number | null;
  status: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string | null;
  createdByName: string | null;
};

type StatusFilter = "all" | "draft" | "posted" | "cancelled";

const formatMoney = (value: number | null | undefined) => {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

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

const getInvoiceTotal = (invoice: SalesInvoice) => {
  return Number(
    invoice.grandTotal ?? invoice.totalAmount ?? invoice.total ?? 0,
  );
};

const getStatus = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case "posted":
      return {
        label: "مرحّلة",
        className: "bg-green-50 text-green-700 border-green-200",
      };

    case "draft":
      return {
        label: "مسودة",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };

    case "cancelled":
      return {
        label: "ملغاة",
        className: "bg-red-50 text-red-700 border-red-200",
      };

    case "pending":
      return {
        label: "معلقة",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };

    default:
      return {
        label: status || "غير محددة",
        className: "bg-slate-50 text-slate-600 border-slate-200",
      };
  }
};

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchInvoices = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // 1. التحقق من المستخدم المسجل
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجدداً.");
      }

      // 2. جلب الشركة المرتبط بها المستخدم
      const { data: currentUser, error: userError } = await supabase
        .from("users")
        .select("id, companyId, type, status, isActive")
        .eq("auth_user_id", user.id)
        .single();

      if (userError || !currentUser) {
        throw new Error("لم يتم العثور على بيانات المستخدم.");
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

      // 3. جلب فواتير الشركة
      const { data, error: invoicesError } = await supabase
        .from("sales")
        .select(
          `
          id,
          companyId,
          invoiceNumber,
          customerId,
          customerName,
          date,
          total,
          totalAmount,
          grandTotal,
          paidAmount,
          remainingAmount,
          status,
          paymentMethod,
          notes,
          createdAt,
          createdByName
        `,
        )
        .eq("companyId", currentUser.companyId)
        .order("date", { ascending: false })
        .limit(500);

      if (invoicesError) {
        throw invoicesError;
      }

      setInvoices((data || []) as SalesInvoice[]);
    } catch (err: unknown) {
      console.error("Fetch sales invoices error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل فواتير المبيعات.";

      setError(message);
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // البحث والتصفية
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        invoice.invoiceNumber?.toLowerCase().includes(searchValue) ||
        invoice.customerName?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        invoice.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  // الإحصائيات
  const statistics = useMemo(() => {
    const totalInvoices = invoices.length;

    const totalSales = invoices.reduce(
      (sum, invoice) => sum + getInvoiceTotal(invoice),
      0,
    );

    const totalPaid = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.paidAmount || 0),
      0,
    );

    const totalRemaining = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.remainingAmount || 0),
      0,
    );

    return {
      totalInvoices,
      totalSales,
      totalPaid,
      totalRemaining,
    };
  }, [invoices]);

  return (
    <div dir="rtl" className="space-y-6 pb-8">
      {/* عنوان الصفحة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FiFileText size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                فواتير المبيعات
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                عرض ومتابعة جميع فواتير المبيعات
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchInvoices(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/sales/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <FiPlus size={18} />
            فاتورة جديدة
          </Link>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="عدد الفواتير"
          value={formatMoney(statistics.totalInvoices)}
          icon={<FiFileText size={21} />}
          color="blue"
        />

        <StatCard
          title="إجمالي المبيعات"
          value={formatMoney(statistics.totalSales)}
          icon={<FiDollarSign size={21} />}
          color="indigo"
        />

        <StatCard
          title="إجمالي المدفوع"
          value={formatMoney(statistics.totalPaid)}
          icon={<FiDollarSign size={21} />}
          color="green"
        />

        <StatCard
          title="المبالغ المتبقية"
          value={formatMoney(statistics.totalRemaining)}
          icon={<FiDollarSign size={21} />}
          color="amber"
        />
      </div>

      {/* جدول الفواتير */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* أدوات البحث */}
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
              placeholder="ابحث برقم الفاتورة أو اسم العميل..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FiFilter className="text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400"
            >
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="posted">مرحّلة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        {/* معلومات النتائج */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            عرض{" "}
            <span className="font-semibold text-slate-800">
              {filteredInvoices.length}
            </span>{" "}
            من أصل{" "}
            <span className="font-semibold text-slate-800">
              {invoices.length}
            </span>{" "}
            فاتورة
          </p>
        </div>

        {/* محتوى الجدول */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <FiRefreshCw className="animate-spin" size={20} />
              جاري تحميل الفواتير...
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FiFileText size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">لا توجد فواتير</h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {search || statusFilter !== "all"
                ? "لم يتم العثور على فواتير تطابق البحث أو التصفية."
                : "لم يتم إنشاء أي فواتير مبيعات حتى الآن."}
            </p>

            {!search && statusFilter === "all" && (
              <Link
                href="/erp/sales/new"
                className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <FiPlus />
                إنشاء أول فاتورة
              </Link>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-4">رقم الفاتورة</th>
                  <th className="px-5 py-4">العميل</th>
                  <th className="px-5 py-4">التاريخ</th>
                  <th className="px-5 py-4">الإجمالي</th>
                  <th className="px-5 py-4">المدفوع</th>
                  <th className="px-5 py-4">المتبقي</th>
                  <th className="px-5 py-4">الحالة</th>
                  <th className="px-5 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const status = getStatus(invoice.status);

                  return (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {invoice.invoiceNumber || invoice.id}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {invoice.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FiUser size={15} />
                          </div>

                          <span className="font-medium text-slate-700">
                            {invoice.customerName || "عميل نقدي"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-slate-400" />
                          {formatDate(invoice.date)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {formatMoney(getInvoiceTotal(invoice))}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-green-700">
                        {formatMoney(invoice.paidAmount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-amber-700">
                        {formatMoney(invoice.remainingAmount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center">
                          <Link
                            href={`/erp/sales/invoices/${invoice.id}`}
                            title="عرض الفاتورة"
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

// ==========================================
// مكون بطاقة الإحصائيات
// ==========================================

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
