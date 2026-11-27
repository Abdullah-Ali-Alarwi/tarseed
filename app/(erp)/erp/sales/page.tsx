"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiPrinter,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiShoppingCart,
  FiAlertCircle,
  FiX,
  FiFilter,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

/* =====================================================
   TYPES
===================================================== */

type SaleItem = {
  id?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  total?: number;
  cost?: number;
  costTotal?: number;
};

type Sale = {
  id: string;
  companyId: string;

  invoiceNumber?: string;

  customerId?: string | null;
  customerName?: string;

  warehouseId?: string;
  warehouseName?: string;

  date?: string;
  createdAt?: string;

  items?: SaleItem[];

  subtotal?: number;
  discount?: number;
  tax?: number;
  taxRate?: number;

  total?: number;
  totalAmount?: number;
  grandTotal?: number;

  totalCost?: number;
  profit?: number;

  paidAmount?: number;
  remainingAmount?: number;

  paymentMethod?: string;
  paymentAccountId?: string;
  paymentAccountCode?: string;
  paymentAccountName?: string;

  status?: string;

  notes?: string;

  journalId?: string;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;

  updatedAt?: string;
};

type AuthUser = {
  id?: string;
  username?: string;
  name?: string;
  fullName?: string;
  companyId?: string;
  type?: string;
};

/* =====================================================
   HELPERS
===================================================== */

const getNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getSaleTotal = (sale: Sale) => {
  return getNumber(sale.total ?? sale.totalAmount ?? sale.grandTotal ?? 0);
};

const getPaidAmount = (sale: Sale) => {
  return getNumber(sale.paidAmount);
};

const getRemainingAmount = (sale: Sale) => {
  if (sale.remainingAmount !== undefined && sale.remainingAmount !== null) {
    return Math.max(0, getNumber(sale.remainingAmount));
  }

  return Math.max(0, getSaleTotal(sale) - getPaidAmount(sale));
};

const isCancelled = (sale: Sale) => {
  return ["cancelled", "canceled", "ملغي", "ملغاة"].includes(
    String(sale.status || "").toLowerCase(),
  );
};

const money = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
};

const getPaymentName = (method?: string) => {
  switch (method) {
    case "cash":
      return "نقدي";

    case "bank":
      return "بنكي";

    case "credit":
      return "آجل";

    default:
      return method || "غير محدد";
  }
};

const getStatusName = (sale: Sale) => {
  if (isCancelled(sale)) return "ملغاة";

  if (sale.status === "draft") return "مسودة";

  if (sale.status === "posted") {
    if (getRemainingAmount(sale) <= 0) return "مدفوعة";
    if (getPaidAmount(sale) > 0) return "مدفوعة جزئياً";
    return "آجلة";
  }

  if (sale.status === "paid") return "مدفوعة";

  if (sale.status === "pending") return "معلقة";

  if (sale.status === "cancelled") return "ملغاة";

  if (sale.paymentMethod === "credit") return "آجلة";

  return sale.status || "غير محددة";
};

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({ sale }: { sale: Sale }) {
  const status = getStatusName(sale);

  const styles: Record<string, string> = {
    مدفوعة: "bg-green-50 text-green-700",
    "مدفوعة جزئياً": "bg-blue-50 text-blue-700",
    آجلة: "bg-orange-50 text-orange-700",
    معلقة: "bg-yellow-50 text-yellow-700",
    مسودة: "bg-gray-100 text-gray-600",
    ملغاة: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h3 className="mt-3 text-2xl font-bold text-gray-800">{value}</h3>

          <p className="mt-2 text-xs text-gray-400">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   MAIN PAGE
===================================================== */

export default function SalesPage() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [companyId, setCompanyId] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [paymentFilter, setPaymentFilter] = useState("all");

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  /* =====================================================
     LOAD SALES
  ===================================================== */

  const loadSales = useCallback(
    async (currentCompanyId: string, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const { data, error: queryError } = await supabase
          .from("sales")
          .select("*")
          .eq("companyId", currentCompanyId)
          .order("date", { ascending: false });

        if (queryError) {
          throw queryError;
        }

        setSales((data || []) as Sale[]);
      } catch (err: any) {
        console.error("Load sales error:", err);

        setError(err.message || "حدث خطأ أثناء تحميل فواتير المبيعات.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /* =====================================================
     AUTHENTICATION
  ===================================================== */

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser) as AuthUser;

      if (user.type === "platform") {
        setError("لا يمكن لمستخدم المنصة الوصول إلى مبيعات الشركة.");
        setLoading(false);
        return;
      }

      if (!user.companyId) {
        setError("لم يتم العثور على الشركة المرتبطة بالمستخدم.");
        setLoading(false);
        return;
      }

      setCompanyId(user.companyId);

      loadSales(user.companyId);
    } catch {
      setError("تعذر قراءة بيانات المستخدم.");
      setLoading(false);
    }
  }, [router, loadSales]);

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = () => {
    if (!companyId) return;

    loadSales(companyId, true);
  };

  /* =====================================================
     FILTER SALES
  ===================================================== */

  const filteredSales = useMemo(() => {
    const value = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !value ||
        String(sale.invoiceNumber || "")
          .toLowerCase()
          .includes(value) ||
        String(sale.customerName || "")
          .toLowerCase()
          .includes(value) ||
        String(sale.warehouseName || "")
          .toLowerCase()
          .includes(value) ||
        String(sale.paymentAccountName || "")
          .toLowerCase()
          .includes(value);

      const status = getStatusName(sale);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && status === "مدفوعة") ||
        (statusFilter === "partial" && status === "مدفوعة جزئياً") ||
        (statusFilter === "credit" && status === "آجلة") ||
        (statusFilter === "draft" && status === "مسودة") ||
        (statusFilter === "cancelled" && isCancelled(sale));

      const matchesPayment =
        paymentFilter === "all" || sale.paymentMethod === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [sales, search, statusFilter, paymentFilter]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const activeSales = useMemo(() => {
    return sales.filter(
      (sale) => !isCancelled(sale) && sale.status !== "draft",
    );
  }, [sales]);

  const totalSales = useMemo(() => {
    return activeSales.reduce((total, sale) => total + getSaleTotal(sale), 0);
  }, [activeSales]);

  const totalCollected = useMemo(() => {
    return activeSales.reduce((total, sale) => total + getPaidAmount(sale), 0);
  }, [activeSales]);

  const totalRemaining = useMemo(() => {
    return activeSales.reduce(
      (total, sale) => total + getRemainingAmount(sale),
      0,
    );
  }, [activeSales]);

  const totalInvoices = activeSales.length;

  const paidInvoices = activeSales.filter(
    (sale) => getRemainingAmount(sale) <= 0,
  ).length;

  const draftInvoices = sales.filter((sale) => sale.status === "draft").length;

  /* =====================================================
     RENDER
  ===================================================== */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-sm text-gray-500">جاري تحميل بيانات المبيعات...</p>
        </div>
      </div>
    );
  }

  return (
    <main dir="rtl" className="space-y-6 pb-10">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المبيعات</h1>

          <p className="mt-1 text-sm text-gray-500">
            إدارة فواتير المبيعات ومتابعة التحصيلات والمبالغ المستحقة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/sales/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={18} />
            فاتورة مبيعات جديدة
          </Link>
        </div>
      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* =========================================
          STATISTICS
      ========================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي المبيعات"
          value={`${money(totalSales)} ر.ي`}
          description="إجمالي الفواتير غير الملغاة"
          icon={FiDollarSign}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="عدد الفواتير"
          value={money(totalInvoices)}
          description={`${money(draftInvoices)} مسودة`}
          icon={FiFileText}
          color="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="المبالغ المحصلة"
          value={`${money(totalCollected)} ر.ي`}
          description={`${money(paidInvoices)} فاتورة مسددة بالكامل`}
          icon={FiCheckCircle}
          color="bg-green-50 text-green-600"
        />

        <StatCard
          title="المبالغ المستحقة"
          value={`${money(totalRemaining)} ر.ي`}
          description="المبالغ المتبقية على العملاء"
          icon={FiClock}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* =========================================
          SALES TABLE
      ========================================= */}

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-bold text-gray-800">فواتير المبيعات</h2>

              <p className="mt-1 text-xs text-gray-400">
                عرض {filteredSales.length} من أصل {sales.length} فاتورة
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* SEARCH */}

              <div className="relative w-full sm:w-72">
                <FiSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="رقم الفاتورة أو اسم العميل..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* STATUS FILTER */}

              <div className="relative">
                <FiFilter
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-8 text-sm text-gray-700 outline-none focus:border-blue-500 sm:w-44"
                >
                  <option value="all">كل الحالات</option>
                  <option value="paid">مدفوعة</option>
                  <option value="partial">مدفوعة جزئياً</option>
                  <option value="credit">آجلة</option>
                  <option value="draft">مسودة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>

              {/* PAYMENT FILTER */}

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="all">كل طرق الدفع</option>
                <option value="cash">نقدي</option>
                <option value="bank">بنكي</option>
                <option value="credit">آجل</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold text-gray-500">
                <th className="px-5 py-4">رقم الفاتورة</th>

                <th className="px-5 py-4">العميل</th>

                <th className="px-5 py-4">المخزن</th>

                <th className="px-5 py-4">التاريخ</th>

                <th className="px-5 py-4">الإجمالي</th>

                <th className="px-5 py-4">المدفوع</th>

                <th className="px-5 py-4">المتبقي</th>

                <th className="px-5 py-4">طريقة الدفع</th>

                <th className="px-5 py-4">الحالة</th>

                <th className="px-5 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="text-sm transition hover:bg-gray-50"
                >
                  {/* INVOICE NUMBER */}

                  <td className="px-5 py-4">
                    <p className="font-semibold text-blue-700">
                      {sale.invoiceNumber || sale.id}
                    </p>
                  </td>

                  {/* CUSTOMER */}

                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">
                      {sale.customerName || "عميل نقدي"}
                    </p>
                  </td>

                  {/* WAREHOUSE */}

                  <td className="px-5 py-4 text-gray-600">
                    {sale.warehouseName || "-"}
                  </td>

                  {/* DATE */}

                  <td className="px-5 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(sale.date || sale.createdAt)}
                  </td>

                  {/* TOTAL */}

                  <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-800">
                    {money(getSaleTotal(sale))} ر.ي
                  </td>

                  {/* PAID */}

                  <td className="px-5 py-4 whitespace-nowrap font-medium text-green-700">
                    {money(getPaidAmount(sale))} ر.ي
                  </td>

                  {/* REMAINING */}

                  <td className="px-5 py-4 whitespace-nowrap font-medium text-orange-600">
                    {money(getRemainingAmount(sale))} ر.ي
                  </td>

                  {/* PAYMENT */}

                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                      {getPaymentName(sale.paymentMethod)}
                    </span>
                  </td>

                  {/* STATUS */}

                  <td className="px-5 py-4">
                    <StatusBadge sale={sale} />
                  </td>

                  {/* ACTIONS */}

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/erp/sales/${sale.id}`}
                        title="تفاصيل الفاتورة"
                        className="rounded-lg border border-gray-200 p-2 text-blue-600 transition hover:bg-blue-50"
                      >
                        <FiEye size={16} />
                      </Link>

                      <Link
                        href={`/erp/sales/${sale.id}/print`}
                        title="طباعة الفاتورة"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                      >
                        <FiPrinter size={16} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        title="عرض مختصر"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                      >
                        <FiFileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* EMPTY */}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <FiShoppingCart size={25} />
                    </div>

                    <h3 className="mt-4 font-semibold text-gray-700">
                      لا توجد فواتير مبيعات
                    </h3>

                    <p className="mt-2 text-sm text-gray-400">
                      لم يتم العثور على فواتير تطابق البحث أو التصفية.
                    </p>

                    {sales.length === 0 && (
                      <Link
                        href="/erp/sales/new"
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <FiPlus />
                        إنشاء أول فاتورة مبيعات
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================
          QUICK SUMMARY
      ========================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <FiCheckCircle size={20} />
            </div>

            <div>
              <p className="text-xs text-gray-500">الفواتير المسددة بالكامل</p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                {money(paidInvoices)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
              <FiClock size={20} />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                الفواتير الآجلة أو الجزئية
              </p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                {money(
                  activeSales.filter((sale) => getRemainingAmount(sale) > 0)
                    .length,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-3 text-gray-600">
              <FiFileText size={20} />
            </div>

            <div>
              <p className="text-xs text-gray-500">إجمالي المسودات</p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                {money(draftInvoices)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          QUICK DETAILS MODAL
      ========================================= */}

      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedSale(null)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="font-bold text-gray-800">
                  تفاصيل فاتورة المبيعات
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  {selectedSale.invoiceNumber || selectedSale.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">العميل</p>

                  <p className="mt-2 font-semibold text-gray-800">
                    {selectedSale.customerName || "عميل نقدي"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">التاريخ</p>

                  <p className="mt-2 font-semibold text-gray-800">
                    {formatDate(selectedSale.date || selectedSale.createdAt)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">المخزن</p>

                  <p className="mt-2 font-semibold text-gray-800">
                    {selectedSale.warehouseName || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">طريقة الدفع</p>

                  <p className="mt-2 font-semibold text-gray-800">
                    {getPaymentName(selectedSale.paymentMethod)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold text-gray-800">الأصناف</h4>

                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full min-w-[400px] text-right text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="p-3">الصنف</th>
                        <th className="p-3">الكمية</th>
                        <th className="p-3">السعر</th>
                        <th className="p-3">الإجمالي</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {(selectedSale.items || []).map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="p-3 font-medium text-gray-700">
                            {item.productName || "-"}
                          </td>

                          <td className="p-3">
                            {money(getNumber(item.quantity))}
                          </td>

                          <td className="p-3">
                            {money(getNumber(item.price ?? item.unitPrice))}
                          </td>

                          <td className="p-3 font-semibold">
                            {money(getNumber(item.total))}
                          </td>
                        </tr>
                      ))}

                      {(!selectedSale.items ||
                        selectedSale.items.length === 0) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-5 text-center text-gray-400"
                          >
                            لا توجد أصناف مسجلة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الإجمالي</span>

                  <span className="font-bold text-gray-800">
                    {money(getSaleTotal(selectedSale))} ر.ي
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">المدفوع</span>

                  <span className="font-semibold text-green-700">
                    {money(getPaidAmount(selectedSale))} ر.ي
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">المتبقي</span>

                  <span className="font-semibold text-orange-600">
                    {money(getRemainingAmount(selectedSale))} ر.ي
                  </span>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">ملاحظات</p>

                  <p className="mt-2 text-sm text-gray-700">
                    {selectedSale.notes}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  href={`/erp/sales/${selectedSale.id}`}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  عرض التفاصيل
                </Link>

                <Link
                  href={`/erp/sales/${selectedSale.id}/print`}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <FiPrinter />
                  طباعة
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
