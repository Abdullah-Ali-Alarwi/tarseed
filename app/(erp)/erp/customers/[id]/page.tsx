"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiArrowRight,
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiShoppingBag,
  FiCreditCard,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
  FiHash,
  FiEdit2,
  FiPlus,
} from "react-icons/fi";

import { getCustomerById, type Customer } from "@/lib/api/customers";

import { getAccounts, type AccountRecord } from "@/lib/api/accounts";

import { supabase } from "@/lib/supabase";

/* =====================================================
   TYPES
===================================================== */

type Actor = {
  id: string;
  username: string;
  companyId: string;
  name?: string;
  fullName?: string;
  type: "erp" | "owner";
};

type Sale = {
  id: string;
  companyId?: string | number;
  customerId?: string;

  invoiceNumber?: string;
  invoiceCode?: string;
  code?: string;
  reference?: string;

  date?: string;
  invoiceDate?: string;
  createdAt?: string;

  total?: number;
  totalAmount?: number;
  grandTotal?: number;

  paidAmount?: number;
  remainingAmount?: number;

  status?: string;
  paymentStatus?: string;
  notes?: string;
};

/* =====================================================
   HELPERS
===================================================== */

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const getSaleTotal = (sale: Sale) =>
  Number(sale.total ?? sale.totalAmount ?? sale.grandTotal ?? 0);

const getSalePaid = (sale: Sale) => Number(sale.paidAmount ?? 0);

const getSaleRemaining = (sale: Sale) =>
  Number(
    sale.remainingAmount ?? Math.max(getSaleTotal(sale) - getSalePaid(sale), 0),
  );

const getSaleIsCancelled = (sale: Sale) =>
  ["cancelled", "canceled", "ملغي", "ملغاة"].includes(
    String(sale.status || "").toLowerCase(),
  );

const getSaleNumber = (sale: Sale) =>
  sale.invoiceNumber ||
  sale.invoiceCode ||
  sale.code ||
  sale.reference ||
  sale.id?.slice(0, 8) ||
  "—";

const getSaleDate = (sale: Sale) =>
  sale.date || sale.invoiceDate || sale.createdAt;

const getSaleStatus = (sale: Sale) => {
  const status = String(sale.status || "").toLowerCase();

  if (getSaleIsCancelled(sale)) {
    return {
      label: "ملغاة",
      className: "bg-red-50 text-red-600",
    };
  }

  if (
    ["paid", "completed", "مدفوعة", "مكتملة"].includes(status) ||
    getSaleRemaining(sale) <= 0
  ) {
    return {
      label: "مدفوعة",
      className: "bg-green-50 text-green-700",
    };
  }

  if (getSalePaid(sale) > 0) {
    return {
      label: "مدفوعة جزئياً",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "غير مدفوعة",
    className: "bg-orange-50 text-orange-700",
  };
};

const getStoredUser = (): Actor | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("authUser");

    if (!stored) return null;

    const user = JSON.parse(stored);

    if (
      !user ||
      !user.id ||
      !user.companyId ||
      !["erp", "owner"].includes(user.type)
    ) {
      return null;
    }

    if (
      user.is_active === false ||
      user.isActive === false ||
      (user.status && user.status !== "active")
    ) {
      return null;
    }

    return {
      id: String(user.id),
      username: String(user.username || ""),
      companyId: String(user.companyId),
      name: user.name,
      fullName: user.fullName,
      type: user.type,
    };
  } catch {
    return null;
  }
};

const logError = (title: string, error: any) => {
  console.error(title, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    error,
  });
};

/* =====================================================
   PAGE
===================================================== */

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const customerId = String(params.id || "");

  const [actor, setActor] = useState<Actor | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [account, setAccount] = useState<AccountRecord | null>(null);

  const [sales, setSales] = useState<Sale[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const currentUser = getStoredUser();

        if (!currentUser) {
          toast.error("تعذر التحقق من المستخدم أو الشركة.");
          router.push("/login");
          return;
        }

        if (!customerId) {
          toast.error("معرّف العميل غير صحيح.");
          return;
        }

        setActor(currentUser);

        const companyId = String(currentUser.companyId);

        // تحميل بيانات العميل
        const customerData = await getCustomerById(customerId, companyId);

        if (!customerData) {
          toast.error("لم يتم العثور على العميل.");
          setCustomer(null);
          return;
        }

        setCustomer(customerData);

        // تحميل الحسابات والمبيعات
        const [accountsResult, salesResult] = await Promise.allSettled([
          getAccounts(companyId),

          supabase
            .from("sales")
            .select("*")
            .eq("companyId", companyId)
            .eq("customerId", customerId),
        ]);

        // الحساب المحاسبي المرتبط بالعميل
        if (accountsResult.status === "fulfilled") {
          const linkedAccount = accountsResult.value.find(
            (item) =>
              item.entityType === "customer" &&
              String(item.entityId) === String(customerId),
          );

          setAccount(linkedAccount || null);
        } else {
          setAccount(null);
          logError("Customer account load error:", accountsResult.reason);
        }

        // فواتير العميل
        if (salesResult.status === "fulfilled") {
          const { data, error } = salesResult.value;

          if (error) {
            logError("Customer sales error:", error);
            setSales([]);
            toast.error("تعذر تحميل فواتير العميل.");
          } else {
            const companySales = (data || []).filter(
              (sale: Sale) =>
                String(sale.companyId) === companyId &&
                String(sale.customerId) === customerId,
            );

            setSales(companySales);
          }
        } else {
          setSales([]);
          logError("Customer sales load error:", salesResult.reason);
          toast.error("تعذر تحميل فواتير العميل.");
        }
      } catch (error: any) {
        logError("Customer details load error:", error);

        toast.error(error?.message || "حدث خطأ أثناء تحميل بيانات العميل.");

        setCustomer(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId, router],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const statistics = useMemo(() => {
    const validSales = sales.filter((sale) => !getSaleIsCancelled(sale));

    return {
      invoices: validSales.length,

      total: validSales.reduce((sum, sale) => sum + getSaleTotal(sale), 0),

      paid: validSales.reduce((sum, sale) => sum + getSalePaid(sale), 0),

      remaining: validSales.reduce(
        (sum, sale) => sum + getSaleRemaining(sale),
        0,
      ),
    };
  }, [sales]);

  const activeSales = useMemo(
    () =>
      [...sales].sort((a, b) => {
        const dateA = new Date(getSaleDate(a) || 0).getTime();
        const dateB = new Date(getSaleDate(b) || 0).getTime();

        return dateB - dateA;
      }),
    [sales],
  );

  const isActive =
    customer?.isActive !== false && customer?.status !== "inactive";

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin text-xl" />
          جاري تحميل بيانات العميل...
        </div>
      </div>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!customer) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center p-5"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FiAlertCircle className="mx-auto mb-4 text-5xl text-red-400" />

          <h2 className="text-lg font-bold text-slate-800">
            لم يتم العثور على العميل
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            ربما تم حذف العميل أو لا تملك صلاحية الوصول إليه.
          </p>

          <Link
            href="/erp/customers"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm text-white hover:bg-blue-700"
          >
            <FiArrowRight />
            العودة إلى العملاء
          </Link>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/erp/dashboard" className="hover:text-blue-600">
              الرئيسية
            </Link>

            <span>/</span>

            <Link href="/erp/customers" className="hover:text-blue-600">
              العملاء
            </Link>

            <span>/</span>

            <span className="text-slate-700">تفاصيل العميل</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              {customer.name}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isActive ? "عميل نشط" : "عميل غير نشط"}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            تفاصيل العميل ومتابعة حسابه وفواتير المبيعات
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/customers"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <FiArrowRight />
            العملاء
          </Link>

          <Link
            href="/erp/sales/new"
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <FiPlus />
            فاتورة جديدة
          </Link>
        </div>
      </div>

      {/* CUSTOMER PROFILE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600">
              <FiUser />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {customer.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                كود العميل: {customer.code || "—"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              toast.info(
                "التعديل متاح من نافذة تعديل بيانات العميل في صفحة العملاء.",
              );

              router.push("/erp/customers");
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <FiEdit2 />
            تعديل بيانات العميل
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={<FiHash />}
            label="كود العميل"
            value={customer.code || "—"}
          />

          <InfoItem
            icon={<FiPhone />}
            label="رقم الهاتف"
            value={customer.phone || "—"}
          />

          <InfoItem
            icon={<FiMapPin />}
            label="العنوان"
            value={customer.address || "—"}
          />

          <InfoItem
            icon={<FiCalendar />}
            label="تاريخ الإضافة"
            value={formatDate(customer.createdAt)}
          />
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="عدد الفواتير"
          value={money(statistics.invoices)}
          icon={<FiShoppingBag />}
          color="blue"
        />

        <StatCard
          title="إجمالي المبيعات"
          value={money(statistics.total)}
          icon={<FiDollarSign />}
          color="purple"
        />

        <StatCard
          title="إجمالي المدفوع"
          value={money(statistics.paid)}
          icon={<FiCheckCircle />}
          color="green"
        />

        <StatCard
          title="المبالغ المتبقية"
          value={money(statistics.remaining)}
          icon={<FiCreditCard />}
          color="orange"
        />
      </div>

      {/* ACCOUNT INFORMATION */}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ACCOUNT */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiBookOpen className="text-xl" />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">الحساب المحاسبي</h2>

              <p className="mt-1 text-xs text-slate-500">
                الحساب المرتبط بالعميل في شجرة الحسابات
              </p>
            </div>
          </div>

          {account ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">اسم الحساب</p>

                <p className="mt-2 font-bold text-slate-800">{account.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">رمز الحساب</p>

                  <p className="mt-2 font-bold text-blue-700">{account.code}</p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">طبيعة الحساب</p>

                  <p className="mt-2 font-bold text-slate-700">مدين</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <span className="text-sm text-green-800">حالة الحساب</span>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {account.isActive === false ? "غير نشط" : "نشط"}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 text-center">
              <FiAlertCircle className="mx-auto mb-2 text-2xl text-amber-600" />

              <p className="font-medium text-amber-800">
                لا يوجد حساب محاسبي مرتبط
              </p>

              <p className="mt-2 text-xs text-amber-700">
                لم يتم العثور على حساب مرتبط بمعرّف هذا العميل.
              </p>
            </div>
          )}
        </div>

        {/* OPENING BALANCE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <FiDollarSign className="text-xl" />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">الرصيد الافتتاحي</h2>

              <p className="mt-1 text-xs text-slate-500">
                الرصيد المسجل في بيانات العميل
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-orange-50 p-5">
            <p className="text-sm text-orange-800">رصيد العميل الافتتاحي</p>

            <p className="mt-3 text-3xl font-bold text-orange-700">
              {money(Number(customer.balance || 0))}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-medium text-slate-700">ملاحظات العميل</p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-500">
              {customer.notes || "لا توجد ملاحظات مسجلة."}
            </p>
          </div>
        </div>
      </div>

      {/* SALES TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">فواتير المبيعات</h2>

            <p className="mt-1 text-xs text-slate-500">
              جميع الفواتير المرتبطة بهذا العميل
            </p>
          </div>

          <Link
            href="/erp/sales/new"
            className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <FiPlus />
            فاتورة جديدة
          </Link>
        </div>

        {activeSales.length === 0 ? (
          <div className="p-12 text-center">
            <FiShoppingBag className="mx-auto mb-3 text-4xl text-slate-300" />

            <p className="font-medium text-slate-600">
              لا توجد فواتير مبيعات لهذا العميل
            </p>

            <p className="mt-2 text-xs text-slate-400">
              ستظهر الفواتير هنا بعد إنشاء أول فاتورة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4">رقم الفاتورة</th>
                  <th className="px-5 py-4">التاريخ</th>
                  <th className="px-5 py-4">الإجمالي</th>
                  <th className="px-5 py-4">المدفوع</th>
                  <th className="px-5 py-4">المتبقي</th>
                  <th className="px-5 py-4">الحالة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {activeSales.map((sale) => {
                  const status = getSaleStatus(sale);

                  return (
                    <tr key={sale.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {getSaleNumber(sale)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(getSaleDate(sale))}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {money(getSaleTotal(sale))}
                      </td>

                      <td className="px-5 py-4 font-medium text-green-600">
                        {money(getSalePaid(sale))}
                      </td>

                      <td className="px-5 py-4 font-medium text-orange-600">
                        {money(getSaleRemaining(sale))}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                        >
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
      </div>

      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs text-slate-500">
          {customer.createdBy && <p>أضيف بواسطة: {customer.createdBy}</p>}

          {customer.updatedBy && (
            <p className="mt-1">آخر تعديل بواسطة: {customer.updatedBy}</p>
          )}
        </div>

        <Link
          href="/erp/customers"
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <FiArrowRight />
          العودة إلى قائمة العملاء
        </Link>
      </div>
    </div>
  );
}

/* =====================================================
   INFO ITEM
===================================================== */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-slate-50 p-3 text-slate-500">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   STATISTICS CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
