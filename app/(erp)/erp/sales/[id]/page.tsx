"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiShoppingBag,
  FiCreditCard,
  FiPrinter,
  FiRefreshCw,
  FiEdit2,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiHash,
} from "react-icons/fi";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

type Customer = {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  address?: string;
  accountCode?: string;
  accountName?: string;
  accountId?: string;
  balance?: number;
  notes?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  createdByUsername?: string;
};

type Sale = {
  id: string;
  companyId: string;
  customerId: string;
  customerName?: string;
  invoiceNumber?: string;
  date?: string;
  createdAt?: string;
  total?: number;
  totalAmount?: number;
  grandTotal?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod?: string;
  status?: string;
  notes?: string;
  items?: {
    id?: string;
    productId?: string;
    productName?: string;
    name?: string;
    quantity?: number;
    price?: number;
    unitPrice?: number;
    total?: number;
  }[];
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (date?: string) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getSaleTotal = (sale: Sale) =>
  Number(sale.grandTotal ?? sale.totalAmount ?? sale.total ?? 0);

const getPaidAmount = (sale: Sale) => {
  const total = getSaleTotal(sale);

  if (sale.paidAmount !== undefined && sale.paidAmount !== null) {
    return Math.min(Math.max(Number(sale.paidAmount) || 0, 0), total);
  }

  if (sale.paymentMethod === "cash" || sale.paymentMethod === "paid") {
    return total;
  }

  return 0;
};

const getRemainingAmount = (sale: Sale) => {
  if (sale.remainingAmount !== undefined && sale.remainingAmount !== null) {
    return Math.max(Number(sale.remainingAmount) || 0, 0);
  }

  return Math.max(getSaleTotal(sale) - getPaidAmount(sale), 0);
};

const isCancelled = (sale: Sale) =>
  ["cancelled", "canceled", "void"].includes(
    String(sale.status || "").toLowerCase(),
  );

const getPaymentLabel = (method?: string) => {
  switch (method) {
    case "cash":
      return "نقدي";
    case "credit":
      return "آجل";
    case "paid":
      return "مدفوع";
    case "partial":
      return "دفع جزئي";
    case "bank":
      return "تحويل بنكي";
    default:
      return method || "غير محدد";
  }
};

const getStatusInfo = (status?: string) => {
  const value = String(status || "").toLowerCase();

  if (["posted", "completed", "paid"].includes(value)) {
    return {
      label: "مكتملة",
      className: "bg-emerald-50 text-emerald-700",
      icon: FiCheckCircle,
    };
  }

  if (["cancelled", "canceled", "void"].includes(value)) {
    return {
      label: "ملغاة",
      className: "bg-red-50 text-red-700",
      icon: FiXCircle,
    };
  }

  if (["draft", "pending"].includes(value)) {
    return {
      label: "معلقة",
      className: "bg-amber-50 text-amber-700",
      icon: FiClock,
    };
  }

  return {
    label: status || "غير محدد",
    className: "bg-slate-100 text-slate-600",
    icon: FiFileText,
  };
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const customerId = String(params.id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");

      const username = document.cookie
        .split("; ")
        .find((item) => item.startsWith("username="))
        ?.split("=")
        .slice(1)
        .join("=");

      if (!username) {
        router.replace("/login");
        return;
      }

      const decodedUsername = decodeURIComponent(username);

      const userResponse = await api.get("/users", {
        params: { username: decodedUsername },
      });

      const user = userResponse.data?.[0];

      if (!user || user.type === "platform" || !user.companyId) {
        router.replace("/login");
        return;
      }

      const companyId = String(user.companyId);

      const [customerResponse, salesResponse] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get("/sales", {
          params: { companyId },
        }),
      ]);

      const customerData = customerResponse.data as Customer;

      if (!customerData || String(customerData.companyId) !== companyId) {
        setCustomer(null);
        setSales([]);
        setError("العميل غير موجود أو لا تملك صلاحية الوصول إليه.");
        return;
      }

      setCustomer(customerData);

      const customerSales = (salesResponse.data as Sale[]).filter(
        (sale) =>
          String(sale.companyId) === companyId &&
          String(sale.customerId) === customerId,
      );

      customerSales.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();

        const dateB = new Date(b.date || b.createdAt || 0).getTime();

        return dateB - dateA;
      });

      setSales(customerSales);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل بيانات العميل.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statistics = useMemo(() => {
    const validSales = sales.filter((sale) => !isCancelled(sale));

    const totalSales = validSales.reduce(
      (sum, sale) => sum + getSaleTotal(sale),
      0,
    );

    const totalPaid = validSales.reduce(
      (sum, sale) => sum + getPaidAmount(sale),
      0,
    );

    const calculatedRemaining = validSales.reduce(
      (sum, sale) => sum + getRemainingAmount(sale),
      0,
    );

    return {
      invoiceCount: validSales.length,
      totalSales,
      totalPaid,
      calculatedRemaining,
    };
  }, [sales]);

  const customerBalance = Number(customer?.balance || 0);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="animate-spin text-3xl text-blue-600" />
          <p className="text-sm text-slate-500">جاري تحميل بيانات العميل...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div dir="rtl" className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <FiAlertCircle className="mx-auto mb-3 text-4xl text-red-500" />

          <h2 className="text-lg font-bold text-red-700">
            تعذر عرض بيانات العميل
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "لم يتم العثور على العميل."}
          </p>

          <Link
            href="/erp/customers"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            <FiArrowRight />
            العودة إلى العملاء
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/erp/customers"
              className="transition hover:text-blue-600"
            >
              العملاء
            </Link>

            <FiArrowRight className="text-xs" />

            <span className="text-slate-700">تفاصيل العميل</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">تفاصيل العميل</h1>

          <p className="mt-1 text-sm text-slate-500">
            عرض بيانات العميل وحركة المبيعات والرصيد المستحق.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FiPrinter />
            طباعة الكشف
          </button>

          <Link
            href={`/erp/customers/${customer.id}/edit`}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <FiEdit2 />
            تعديل العميل
          </Link>
        </div>
      </div>

      {/* Customer Profile */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600">
            <FiUser />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">
                {customer.name}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  customer.isActive === false || customer.status === "inactive"
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {customer.isActive === false || customer.status === "inactive"
                  ? "غير نشط"
                  : "نشط"}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              ملف العميل وسجل تعاملاته المالية.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-5 py-3">
            <p className="text-xs text-slate-500">رقم العميل</p>

            <p className="mt-1 font-mono text-sm font-bold text-slate-800">
              {customer.id}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <FiPhone />
            </div>

            <div>
              <p className="text-xs text-slate-500">رقم الهاتف</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {customer.phone || "غير مسجل"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
              <FiMapPin />
            </div>

            <div>
              <p className="text-xs text-slate-500">العنوان</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {customer.address || "غير مسجل"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <FiHash />
            </div>

            <div>
              <p className="text-xs text-slate-500">الحساب المحاسبي</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {customer.accountCode || "غير مرتبط"}
                {customer.accountName ? ` - ${customer.accountName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <FiCalendar />
            </div>

            <div>
              <p className="text-xs text-slate-500">تاريخ الإضافة</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {customer.notes && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-500">ملاحظات</p>

            <p className="text-sm leading-7 text-slate-700">{customer.notes}</p>
          </div>
        )}
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي المبيعات"
          value={statistics.totalSales}
          icon={<FiShoppingBag />}
          color="blue"
        />

        <StatCard
          title="إجمالي المحصل"
          value={statistics.totalPaid}
          icon={<FiDollarSign />}
          color="emerald"
        />

        <StatCard
          title="المتبقي حسب الفواتير"
          value={statistics.calculatedRemaining}
          icon={<FiCreditCard />}
          color="amber"
        />

        <StatCard
          title="رصيد العميل المسجل"
          value={customerBalance}
          icon={<FiUser />}
          color="purple"
        />
      </section>

      {/* Sales History */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              <FiFileText className="text-blue-600" />
              سجل فواتير المبيعات
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              جميع فواتير المبيعات المرتبطة بهذا العميل.
            </p>
          </div>

          <span className="w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {sales.length} فاتورة
          </span>
        </div>

        {sales.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FiShoppingBag className="mx-auto mb-3 text-4xl text-slate-300" />

            <h4 className="font-semibold text-slate-700">
              لا توجد فواتير مبيعات
            </h4>

            <p className="mt-2 text-sm text-slate-400">
              لم يتم تسجيل أي فاتورة مبيعات لهذا العميل حتى الآن.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">رقم الفاتورة</th>

                  <th className="px-5 py-4 font-semibold">التاريخ</th>

                  <th className="px-5 py-4 font-semibold">عدد الأصناف</th>

                  <th className="px-5 py-4 font-semibold">الإجمالي</th>

                  <th className="px-5 py-4 font-semibold">المدفوع</th>

                  <th className="px-5 py-4 font-semibold">المتبقي</th>

                  <th className="px-5 py-4 font-semibold">طريقة الدفع</th>

                  <th className="px-5 py-4 font-semibold">الحالة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => {
                  const status = getStatusInfo(sale.status);

                  const StatusIcon = status.icon;

                  return (
                    <tr key={sale.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-mono text-sm font-bold text-blue-600">
                          {sale.invoiceNumber || sale.id}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(sale.date || sale.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {sale.items?.length || 0}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {money(getSaleTotal(sale))}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-emerald-700">
                        {money(getPaidAmount(sale))}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-amber-700">
                        {money(getRemainingAmount(sale))}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getPaymentLabel(sale.paymentMethod)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          <StatusIcon />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">
              إجمالي الفواتير غير الملغاة:{" "}
              <strong className="text-slate-800">
                {statistics.invoiceCount}
              </strong>
            </span>

            <span className="font-bold text-slate-800">
              إجمالي المبيعات: {money(statistics.totalSales)}
            </span>
          </div>
        </div>
      </section>

      {/* Accounting Note */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 print:hidden">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 shrink-0 text-blue-600" />

          <div>
            <h4 className="text-sm font-bold text-blue-800">ملاحظة محاسبية</h4>

            <p className="mt-1 text-xs leading-6 text-blue-700">
              رصيد العميل المسجل هو الحقل balance في سجل العميل. أما المبالغ
              المعروضة في سجل الفواتير فهي محسوبة من فواتير المبيعات المرتبطة
              به. لا يتم اعتبار هذه الصفحة كشف حساب محاسبي نهائيًا قبل ربطها
              بحركات التحصيل والقيود اليومية المرحلة.
            </p>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block">
        <p className="border-t pt-4 text-center text-xs text-slate-500">
          تم استخراج كشف حساب العميل بتاريخ{" "}
          {new Date().toLocaleDateString("ar-YE")}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "amber" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-800">{money(value)}</p>
    </div>
  );
}
