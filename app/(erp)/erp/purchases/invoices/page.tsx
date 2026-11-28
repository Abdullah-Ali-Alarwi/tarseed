"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiPrinter,
  FiRefreshCw,
  FiFileText,
  FiShoppingBag,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiX,
  FiPackage,
  FiTruck,
  FiCalendar,
  FiCreditCard,
  FiArchive,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

type PurchaseItem = {
  id?: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
  discount?: number;
  unit?: string;
  unitName?: string;
  warehouseId?: string;
  warehouseName?: string;
};

type Purchase = {
  id: string;
  companyId: string;
  invoiceNumber: string;
  date: string;
  supplier: string;
  supplierId: string | null;
  accountCode: string | null;
  accountName: string | null;
  itemCount: number | null;
  totalQuantity: number | null;
  items: PurchaseItem[] | null;
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  taxRate: number | null;
  total: number | null;
  paymentMethod: string | null;
  paymentMethodName: string | null;
  paymentAccountId: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
  extra?: Record<string, any> | null;
};

type Supplier = {
  id: string;
  name: string;
};

type AuthUser = {
  id?: string;
  companyId?: string;
  type?: string;
  username?: string;
  fullName?: string;
};

const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const isInventoryPosted = (invoice: Purchase) =>
  invoice.extra?.inventoryPosted === true ||
  invoice.extra?.inventoryPosted === "true";

const getStatus = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return {
        label: "مدفوعة",
        className: "bg-emerald-50 text-emerald-700",
        icon: FiCheckCircle,
      };

    case "pending":
      return {
        label: "آجلة / غير مسددة",
        className: "bg-amber-50 text-amber-700",
        icon: FiClock,
      };

    case "cancelled":
      return {
        label: "ملغاة",
        className: "bg-red-50 text-red-700",
        icon: FiXCircle,
      };

    case "draft":
      return {
        label: "مسودة",
        className: "bg-slate-100 text-slate-600",
        icon: FiFileText,
      };

    default:
      return {
        label: status || "غير محددة",
        className: "bg-slate-100 text-slate-600",
        icon: FiFileText,
      };
  }
};

const getPaymentMethod = (method: string | null) => {
  switch (method?.toLowerCase()) {
    case "cash":
      return "نقداً";

    case "bank":
      return "تحويل بنكي";

    case "credit":
      return "آجل";

    default:
      return method || "-";
  }
};

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [companyId, setCompanyId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [selectedInvoice, setSelectedInvoice] = useState<Purchase | null>(null);

  const [postingId, setPostingId] = useState<string | null>(null);

  /* تحميل المستخدم */

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("authUser");

      if (!savedUser) {
        setError("لم يتم العثور على بيانات المستخدم.");
        setLoading(false);
        return;
      }

      const user: AuthUser = JSON.parse(savedUser);

      if (user.type === "platform") {
        setError("ليس لديك صلاحية الوصول إلى فواتير المشتريات.");
        setLoading(false);
        return;
      }

      if (!user.companyId) {
        setError("لم يتم تحديد الشركة المرتبطة بالمستخدم.");
        setLoading(false);
        return;
      }

      setCompanyId(user.companyId);
    } catch {
      setError("حدث خطأ أثناء قراءة بيانات المستخدم.");
      setLoading(false);
    }
  }, []);

  /* تحميل الفواتير */

  const fetchInvoices = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError("");

    try {
      const [invoicesResult, suppliersResult] = await Promise.all([
        supabase
          .from("purchases")
          .select("*")
          .eq("companyId", companyId)
          .order("createdAt", { ascending: false }),

        supabase
          .from("suppliers")
          .select("id, name")
          .eq("companyId", companyId),
      ]);

      if (invoicesResult.error) {
        throw invoicesResult.error;
      }

      if (suppliersResult.error) {
        throw suppliersResult.error;
      }

      setInvoices((invoicesResult.data || []) as Purchase[]);

      setSuppliers((suppliersResult.data || []) as Supplier[]);
    } catch (err: any) {
      console.error("Fetch purchases error:", err);

      setError(
        err?.message || "تعذر تحميل فواتير المشتريات. حاول تحديث الصفحة.",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchInvoices();
    }
  }, [companyId, fetchInvoices]);

  /* اسم المورد */

  const getSupplierName = (invoice: Purchase) => {
    if (invoice.supplier) return invoice.supplier;

    const supplier = suppliers.find((item) => item.id === invoice.supplierId);

    return supplier?.name || "مورد غير محدد";
  };

  /* التصفية */

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const supplierName = getSupplierName(invoice);

      const searchMatch =
        !search ||
        invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        supplierName.toLowerCase().includes(search.toLowerCase()) ||
        invoice.accountName?.toLowerCase().includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "all" || invoice.status === statusFilter;

      const paymentMatch =
        paymentFilter === "all" || invoice.paymentMethod === paymentFilter;

      return searchMatch && statusMatch && paymentMatch;
    });
  }, [invoices, search, statusFilter, paymentFilter, suppliers]);

  /* الإحصائيات */

  const statistics = useMemo(() => {
    const activeInvoices = invoices.filter(
      (invoice) => invoice.status !== "cancelled",
    );

    const totalAmount = activeInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0,
    );

    const paidAmount = activeInvoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    const pendingAmount = activeInvoices
      .filter((invoice) => invoice.status === "pending")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    const postedCount = invoices.filter(isInventoryPosted).length;

    return {
      count: invoices.length,
      total: totalAmount,
      paid: paidAmount,
      pending: pendingAmount,
      posted: postedCount,
    };
  }, [invoices]);

  /* ترحيل فاتورة */

  const postInvoice = async (invoice: Purchase) => {
    if (postingId) return;

    if (invoice.status === "cancelled") {
      toast.error("لا يمكن ترحيل فاتورة ملغاة");
      return;
    }

    if (invoice.status === "draft") {
      toast.error("هذه الفاتورة مسودة. احفظ الفاتورة كفاتورة شراء أولاً.");
      return;
    }

    if (isInventoryPosted(invoice)) {
      toast.info("هذه الفاتورة مرحّلة إلى المخزون مسبقاً");
      return;
    }

    const confirmed = window.confirm(
      `هل تريد ترحيل فاتورة ${invoice.invoiceNumber} إلى المخزون؟\n\nسيتم تحديث أرصدة المنتجات والمستودعات وإنشاء حركات مخزون.`,
    );

    if (!confirmed) return;

    try {
      setPostingId(invoice.id);

      const { data, error } = await supabase.rpc("post_purchase_invoice", {
        p_purchase_id: invoice.id,
      });

      if (error) {
        throw error;
      }

      if (data && typeof data === "object" && data.success === false) {
        throw new Error(data.message || "لم يكتمل ترحيل الفاتورة");
      }

      toast.success(
        `تم ترحيل الفاتورة ${invoice.invoiceNumber} إلى المخزون بنجاح`,
      );

      await fetchInvoices();

      setSelectedInvoice((previous) =>
        previous?.id === invoice.id ? null : previous,
      );
    } catch (err: any) {
      console.error("Post purchase invoice error:", err);

      toast.error(err?.message || "حدث خطأ أثناء ترحيل فاتورة المشتريات");
    } finally {
      setPostingId(null);
    }
  };

  /* طباعة الفاتورة */

  const printInvoice = (invoice: Purchase) => {
    const items = Array.isArray(invoice.items) ? invoice.items : [];

    const escapeHtml = (value: any) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      toast.error("يرجى السماح بفتح النوافذ المنبثقة للطباعة.");
      return;
    }

    const itemsHtml = items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.productName || item.name || "-")}</td>
            <td>${formatNumber(item.quantity)}</td>
            <td>${escapeHtml(item.unitName || item.unit || "-")}</td>
            <td>${formatNumber(item.price)}</td>
            <td>${formatNumber(item.total)}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>فاتورة مشتريات ${escapeHtml(invoice.invoiceNumber)}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 30px;
            color: #1e293b;
          }

          h2, h3 {
            text-align: center;
          }

          .info {
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            line-height: 2;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
          }

          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: center;
          }

          th {
            background: #f1f5f9;
          }

          .totals {
            margin-top: 25px;
            width: 320px;
            margin-right: auto;
            line-height: 2.2;
          }

          .notes {
            margin-top: 25px;
          }

          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>

      <body>
        <h2>فاتورة مشتريات</h2>
        <h3>${escapeHtml(invoice.invoiceNumber || "-")}</h3>

        <div class="info">
          <div>
            <strong>المورد:</strong>
            ${escapeHtml(getSupplierName(invoice))}<br />

            <strong>تاريخ الفاتورة:</strong>
            ${escapeHtml(formatDate(invoice.date))}<br />
          </div>

          <div>
            <strong>طريقة الدفع:</strong>
            ${escapeHtml(getPaymentMethod(invoice.paymentMethod))}<br />

            <strong>الحالة:</strong>
            ${escapeHtml(getStatus(invoice.status).label)}<br />

            <strong>ترحيل المخزون:</strong>
            ${isInventoryPosted(invoice) ? "مرحّلة" : "غير مرحلة"}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>الوحدة</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>

          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div>الإجمالي قبل الخصم: ${formatNumber(invoice.subtotal)}</div>

          <div>الخصم: ${formatNumber(invoice.discount)}</div>

          <div>الضريبة: ${formatNumber(invoice.tax)}</div>

          <hr />

          <strong>الإجمالي النهائي: ${formatNumber(invoice.total)}</strong>
        </div>

        ${
          invoice.notes
            ? `<div class="notes">
                <strong>ملاحظات:</strong>
                ${escapeHtml(invoice.notes)}
              </div>`
            : ""
        }

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  /* شاشة التحميل */

  if (loading && !invoices.length) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin text-3xl" />
          <p className="text-sm">جاري تحميل فواتير المشتريات...</p>
        </div>
      </div>
    );
  }

  /* شاشة الخطأ */

  if (error && !invoices.length) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">{error}</p>

          <button
            onClick={() => {
              setError("");
              fetchInvoices();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* الرأس */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <FiShoppingBag size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                فواتير المشتريات
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                إدارة ومتابعة فواتير مشتريات الشركة
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/purchases/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={18} />
            فاتورة مشتريات جديدة
          </Link>
        </div>
      </div>

      {/* الإحصائيات */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="عدد الفواتير"
          value={formatNumber(statistics.count)}
          icon={<FiFileText size={21} />}
          color="blue"
        />

        <StatCard
          title="إجمالي المشتريات"
          value={formatNumber(statistics.total)}
          icon={<FiDollarSign size={21} />}
          color="indigo"
          suffix="ر.ي"
        />

        <StatCard
          title="المبالغ المدفوعة"
          value={formatNumber(statistics.paid)}
          icon={<FiCheckCircle size={21} />}
          color="green"
          suffix="ر.ي"
        />

        <StatCard
          title="المبالغ الآجلة"
          value={formatNumber(statistics.pending)}
          icon={<FiClock size={21} />}
          color="amber"
          suffix="ر.ي"
        />

        <StatCard
          title="مرحّلة للمخزون"
          value={formatNumber(statistics.posted)}
          icon={<FiArchive size={21} />}
          color="green"
        />
      </div>

      {/* البحث والتصفية */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-700">
          <FiSearch />
          <h2 className="text-sm font-bold">البحث والتصفية</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو المورد..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="pending">آجلة / غير مسددة</option>
            <option value="draft">مسودة</option>
            <option value="cancelled">ملغاة</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">جميع طرق الدفع</option>
            <option value="cash">نقداً</option>
            <option value="bank">تحويل بنكي</option>
            <option value="credit">آجل</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>عدد النتائج: {formatNumber(filteredInvoices.length)}</span>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPaymentFilter("all");
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            مسح الفلاتر
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* جدول الفواتير */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h2 className="font-bold text-slate-800">قائمة فواتير المشتريات</h2>

            <p className="mt-1 text-xs text-slate-500">
              جميع الفواتير المسجلة في الشركة
            </p>
          </div>

          <FiFileText size={21} className="text-slate-400" />
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-5 text-slate-400">
              <FiShoppingBag size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">
              لا توجد فواتير مشتريات
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              لم يتم العثور على فواتير تطابق البحث أو الفلاتر المحددة.
            </p>

            <Link
              href="/erp/purchases/new"
              className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              <FiPlus />
              إنشاء فاتورة جديدة
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">رقم الفاتورة</th>

                  <th className="px-4 py-4 font-semibold">التاريخ</th>

                  <th className="px-4 py-4 font-semibold">المورد</th>

                  <th className="px-4 py-4 font-semibold">عدد الأصناف</th>

                  <th className="px-4 py-4 font-semibold">الإجمالي</th>

                  <th className="px-4 py-4 font-semibold">طريقة الدفع</th>

                  <th className="px-4 py-4 font-semibold">حالة السداد</th>

                  <th className="px-4 py-4 font-semibold">ترحيل المخزون</th>

                  <th className="px-4 py-4 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const status = getStatus(invoice.status);
                  const StatusIcon = status.icon;

                  const posted = isInventoryPosted(invoice);

                  const isPosting = postingId === invoice.id;

                  const canPost =
                    !posted &&
                    invoice.status !== "draft" &&
                    invoice.status !== "cancelled";

                  return (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <span className="font-bold text-blue-700">
                          {invoice.invoiceNumber || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiCalendar className="text-slate-400" size={14} />
                          {formatDate(invoice.date)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                            <FiTruck size={16} />
                          </div>

                          <span className="text-sm font-medium text-slate-700">
                            {getSupplierName(invoice)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">
                          {formatNumber(
                            invoice.itemCount ??
                              (Array.isArray(invoice.items)
                                ? invoice.items.length
                                : 0),
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800">
                          {formatNumber(invoice.total)}
                        </div>

                        <span className="text-xs text-slate-400">
                          ريال يمني
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiCreditCard size={15} className="text-slate-400" />

                          {invoice.paymentMethodName ||
                            getPaymentMethod(invoice.paymentMethod)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                        >
                          <StatusIcon size={13} />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {posted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <FiCheckCircle size={13} />
                            مرحّلة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            <FiClock size={13} />
                            غير مرحلة
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            title="عرض التفاصيل"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          >
                            <FiEye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => printInvoice(invoice)}
                            title="طباعة الفاتورة"
                            className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                          >
                            <FiPrinter size={17} />
                          </button>

                          {canPost && (
                            <button
                              type="button"
                              disabled={Boolean(postingId)}
                              onClick={() => postInvoice(invoice)}
                              title="ترحيل إلى المخزون"
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPosting ? (
                                <FiRefreshCw className="animate-spin" />
                              ) : (
                                <FiArchive />
                              )}

                              {isPosting ? "جارٍ الترحيل" : "ترحيل"}
                            </button>
                          )}

                          {posted && (
                            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                              <FiCheckCircle size={17} />
                            </span>
                          )}
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

      {/* نافذة تفاصيل الفاتورة */}

      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 md:p-6"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  تفاصيل فاتورة المشتريات
                </h2>

                <p className="mt-1 text-sm text-blue-600">
                  {selectedInvoice.invoiceNumber}
                </p>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* معلومات الفاتورة */}

              <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem
                  label="رقم الفاتورة"
                  value={selectedInvoice.invoiceNumber}
                />

                <InfoItem
                  label="تاريخ الفاتورة"
                  value={formatDate(selectedInvoice.date)}
                />

                <InfoItem
                  label="المورد"
                  value={getSupplierName(selectedInvoice)}
                />

                <InfoItem
                  label="طريقة الدفع"
                  value={
                    selectedInvoice.paymentMethodName ||
                    getPaymentMethod(selectedInvoice.paymentMethod)
                  }
                />

                <InfoItem
                  label="الحساب"
                  value={
                    selectedInvoice.accountName ||
                    selectedInvoice.accountCode ||
                    "-"
                  }
                />

                <InfoItem
                  label="حالة الفاتورة"
                  value={getStatus(selectedInvoice.status).label}
                />

                <InfoItem
                  label="حالة ترحيل المخزون"
                  value={
                    isInventoryPosted(selectedInvoice)
                      ? "مرحّلة إلى المخزون"
                      : "غير مرحلة"
                  }
                />

                {isInventoryPosted(selectedInvoice) && (
                  <InfoItem
                    label="تاريخ الترحيل"
                    value={formatDate(selectedInvoice.extra?.inventoryPostedAt)}
                  />
                )}

                {isInventoryPosted(selectedInvoice) && (
                  <InfoItem
                    label="عدد حركات المخزون"
                    value={formatNumber(
                      selectedInvoice.extra?.inventoryMovementCount,
                    )}
                  />
                )}
              </div>

              {/* الأصناف */}

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                  <FiPackage className="text-blue-600" />
                  أصناف الفاتورة
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[650px] text-right">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-3">الصنف</th>
                        <th className="px-3 py-3">الكمية</th>
                        <th className="px-3 py-3">الوحدة</th>
                        <th className="px-3 py-3">السعر</th>
                        <th className="px-3 py-3">الخصم</th>
                        <th className="px-3 py-3">الإجمالي</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {(Array.isArray(selectedInvoice.items)
                        ? selectedInvoice.items
                        : []
                      ).map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-3 py-3 text-sm font-medium text-slate-700">
                            {item.productName || item.name || "-"}
                          </td>

                          <td className="px-3 py-3 text-sm text-slate-600">
                            {formatNumber(item.quantity)}
                          </td>

                          <td className="px-3 py-3 text-sm text-slate-600">
                            {item.unitName || item.unit || "-"}
                          </td>

                          <td className="px-3 py-3 text-sm text-slate-600">
                            {formatNumber(item.price)}
                          </td>

                          <td className="px-3 py-3 text-sm text-slate-600">
                            {formatNumber(item.discount)}
                          </td>

                          <td className="px-3 py-3 text-sm font-bold text-slate-800">
                            {formatNumber(item.total)}
                          </td>
                        </tr>
                      ))}

                      {(!Array.isArray(selectedInvoice.items) ||
                        selectedInvoice.items.length === 0) && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-8 text-center text-sm text-slate-400"
                          >
                            لا توجد أصناف مسجلة في هذه الفاتورة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* الإجماليات */}

              <div className="flex justify-start">
                <div className="w-full max-w-sm space-y-3 rounded-xl border border-slate-200 p-4">
                  <TotalRow
                    label="الإجمالي قبل الخصم"
                    value={selectedInvoice.subtotal}
                  />

                  <TotalRow label="الخصم" value={selectedInvoice.discount} />

                  <TotalRow
                    label={`الضريبة (${formatNumber(
                      selectedInvoice.taxRate,
                    )}%)`}
                    value={selectedInvoice.tax}
                  />

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        الإجمالي النهائي
                      </span>

                      <span className="text-xl font-bold text-blue-700">
                        {formatNumber(selectedInvoice.total)} ر.ي
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* الملاحظات */}

              {selectedInvoice.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 text-sm font-bold text-amber-800">
                    ملاحظات الفاتورة
                  </h3>

                  <p className="text-sm text-amber-700">
                    {selectedInvoice.notes}
                  </p>
                </div>
              )}

              {/* تنبيه الترحيل */}

              {!isInventoryPosted(selectedInvoice) &&
                selectedInvoice.status !== "draft" &&
                selectedInvoice.status !== "cancelled" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-2 text-amber-800">
                      <FiAlertCircle size={18} className="mt-0.5 shrink-0" />

                      <div>
                        <p className="font-bold">
                          الفاتورة لم تُرحّل إلى المخزون
                        </p>

                        <p className="mt-1 text-xs leading-6">
                          عند الترحيل ستتم إضافة الكميات إلى المستودعات وتسجيل
                          حركات المخزون.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {isInventoryPosted(selectedInvoice) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <FiCheckCircle size={18} />

                    <span className="font-bold">
                      تم ترحيل الفاتورة إلى المخزون بنجاح
                    </span>
                  </div>
                </div>
              )}

              {/* الأزرار */}

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                {!isInventoryPosted(selectedInvoice) &&
                  selectedInvoice.status !== "draft" &&
                  selectedInvoice.status !== "cancelled" && (
                    <button
                      type="button"
                      disabled={Boolean(postingId)}
                      onClick={() => postInvoice(selectedInvoice)}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {postingId === selectedInvoice.id ? (
                        <FiRefreshCw className="animate-spin" />
                      ) : (
                        <FiArchive />
                      )}

                      {postingId === selectedInvoice.id
                        ? "جارٍ الترحيل..."
                        : "ترحيل إلى المخزون"}
                    </button>
                  )}

                <button
                  onClick={() => printInvoice(selectedInvoice)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FiPrinter />
                  طباعة الفاتورة
                </button>

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* بطاقة إحصائية */

function StatCard({
  title,
  value,
  icon,
  color,
  suffix,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "indigo" | "green" | "amber";
  suffix?: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <h3 className="mt-2 text-xl font-bold text-slate-800">
            {value}

            {suffix && (
              <span className="mr-1 text-xs font-normal text-slate-400">
                {suffix}
              </span>
            )}
          </h3>
        </div>

        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

/* بيانات */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{label}</p>

      <p className="text-sm font-semibold text-slate-700">{value || "-"}</p>
    </div>
  );
}

/* الإجماليات */

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>

      <span className="font-semibold text-slate-700">
        {formatNumber(value)} ر.ي
      </span>
    </div>
  );
}
