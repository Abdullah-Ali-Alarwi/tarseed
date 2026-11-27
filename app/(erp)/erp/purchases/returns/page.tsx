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
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiX,
  FiPackage,
  FiTruck,
  FiCalendar,
  FiRotateCcw,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

type ReturnItem = {
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

type PurchaseReturn = {
  id: string;
  companyId: string;
  returnNumber: string;
  date: string;
  purchaseId: string;
  purchaseInvoiceNumber: string | null;
  supplierId: string | null;
  supplier: string | null;
  items: ReturnItem[] | null;
  itemCount: number | null;
  totalQuantity: number | null;
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  taxRate: number | null;
  total: number | null;
  paymentMethod: string | null;
  paymentMethodName: string | null;
  paymentAccountId: string | null;
  status: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthUser = {
  companyId?: string;
  type?: string;
};

const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar-YE");
};

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

const getStatus = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case "posted":
      return {
        label: "مرحّل",
        className: "bg-emerald-50 text-emerald-700",
        icon: FiCheckCircle,
      };

    case "draft":
      return {
        label: "مسودة",
        className: "bg-amber-50 text-amber-700",
        icon: FiClock,
      };

    case "cancelled":
      return {
        label: "ملغى",
        className: "bg-red-50 text-red-700",
        icon: FiXCircle,
      };

    default:
      return {
        label: status || "غير محدد",
        className: "bg-slate-100 text-slate-600",
        icon: FiFileText,
      };
  }
};

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(
    null,
  );

  // قراءة المستخدم والشركة
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
        setError("ليس لديك صلاحية الوصول إلى مرتجعات المشتريات.");
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

  // جلب المرتجعات
  const fetchReturns = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("purchaseReturns")
        .select("*")
        .eq("companyId", companyId)
        .order("createdAt", { ascending: false });

      if (fetchError) throw fetchError;

      setReturns((data || []) as PurchaseReturn[]);
    } catch (err) {
      console.error("Fetch purchase returns error:", err);
      setError("تعذر تحميل مرتجعات المشتريات. تحقق من الاتصال والصلاحيات.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) fetchReturns();
  }, [companyId, fetchReturns]);

  // البحث والتصفية
  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        item.returnNumber?.toLowerCase().includes(searchText) ||
        item.purchaseInvoiceNumber?.toLowerCase().includes(searchText) ||
        item.supplier?.toLowerCase().includes(searchText) ||
        item.reason?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [returns, search, statusFilter]);

  // الإحصائيات
  const statistics = useMemo(() => {
    const validReturns = returns.filter((item) => item.status !== "cancelled");

    return {
      count: returns.length,
      total: validReturns.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0,
      ),
      posted: returns.filter((item) => item.status === "posted").length,
      drafts: returns.filter((item) => item.status === "draft").length,
    };
  }, [returns]);

  // الطباعة
  const printReturn = (item: PurchaseReturn) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("يرجى السماح بفتح النوافذ المنبثقة للطباعة.");
      return;
    }

    const items = Array.isArray(item.items) ? item.items : [];

    const itemsHtml = items
      .map(
        (product, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(product.productName || product.name || "-")}</td>
            <td>${formatNumber(product.quantity)}</td>
            <td>${escapeHtml(product.unitName || product.unit || "-")}</td>
            <td>${formatNumber(product.price)}</td>
            <td>${formatNumber(product.total)}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>مرتجع ${escapeHtml(item.returnNumber)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 30px;
            color: #1e293b;
          }
          h2, h3 { text-align: center; }
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
          th { background: #f1f5f9; }
          .totals {
            margin-top: 25px;
            width: 320px;
            margin-right: auto;
            line-height: 2.2;
          }
        </style>
      </head>
      <body>
        <h2>مرتجع مشتريات</h2>
        <h3>${escapeHtml(item.returnNumber)}</h3>

        <div class="info">
          <div>
            <strong>المورد:</strong> ${escapeHtml(item.supplier)}<br />
            <strong>تاريخ المرتجع:</strong> ${escapeHtml(formatDate(item.date))}<br />
            <strong>فاتورة الشراء:</strong> ${escapeHtml(item.purchaseInvoiceNumber)}
          </div>
          <div>
            <strong>الحالة:</strong> ${escapeHtml(getStatus(item.status).label)}<br />
            <strong>السبب:</strong> ${escapeHtml(item.reason || "-")}
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
          <tbody>${itemsHtml}</tbody>
        </table>

        <div class="totals">
          <div>الإجمالي قبل الخصم: ${formatNumber(item.subtotal)}</div>
          <div>الخصم: ${formatNumber(item.discount)}</div>
          <div>الضريبة: ${formatNumber(item.tax)}</div>
          <hr />
          <strong>الإجمالي النهائي: ${formatNumber(item.total)}</strong>
        </div>

        <p><strong>ملاحظات:</strong> ${escapeHtml(item.notes || "-")}</p>

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

  if (loading && !returns.length) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin text-3xl" />
          <p className="text-sm">جاري تحميل مرتجعات المشتريات...</p>
        </div>
      </div>
    );
  }

  if (error && !returns.length) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchReturns}
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <FiRotateCcw size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800">
              مرتجعات المشتريات
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              إدارة ومتابعة البضائع المرتجعة إلى الموردين
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchReturns}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/purchases/returns/new"
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <FiPlus size={18} />
            إنشاء مرتجع جديد
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="عدد المرتجعات"
          value={formatNumber(statistics.count)}
          icon={<FiFileText size={21} />}
          color="blue"
        />

        <StatCard
          title="إجمالي المرتجعات"
          value={formatNumber(statistics.total)}
          icon={<FiDollarSign size={21} />}
          color="orange"
          suffix="ر.ي"
        />

        <StatCard
          title="المرتجعات المرحلة"
          value={formatNumber(statistics.posted)}
          icon={<FiCheckCircle size={21} />}
          color="green"
        />

        <StatCard
          title="المسودات"
          value={formatNumber(statistics.drafts)}
          icon={<FiClock size={21} />}
          color="amber"
        />
      </div>

      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-700">
          <FiSearch />
          <h2 className="text-sm font-bold">البحث والتصفية</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم المرتجع أو الفاتورة أو المورد..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-orange-400 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="posted">مرحّل</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>عدد النتائج: {formatNumber(filteredReturns.length)}</span>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="text-orange-600 hover:text-orange-800"
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h2 className="font-bold text-slate-800">
              قائمة مرتجعات المشتريات
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              جميع المرتجعات المسجلة للشركة
            </p>
          </div>
          <FiRotateCcw size={21} className="text-slate-400" />
        </div>

        {filteredReturns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-5 text-slate-400">
              <FiRotateCcw size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">
              لا توجد مرتجعات مشتريات
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              لم يتم العثور على مرتجعات تطابق البحث أو الفلاتر المحددة.
            </p>

            <Link
              href="/erp/purchases/returns/new"
              className="mt-5 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
            >
              <FiPlus />
              إنشاء مرتجع جديد
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-4">رقم المرتجع</th>
                  <th className="px-4 py-4">التاريخ</th>
                  <th className="px-4 py-4">فاتورة الشراء</th>
                  <th className="px-4 py-4">المورد</th>
                  <th className="px-4 py-4">عدد الأصناف</th>
                  <th className="px-4 py-4">إجمالي الكمية</th>
                  <th className="px-4 py-4">الإجمالي</th>
                  <th className="px-4 py-4">الحالة</th>
                  <th className="px-4 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReturns.map((item) => {
                  const status = getStatus(item.status);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={item.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <span className="font-bold text-orange-700">
                          {item.returnNumber || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiCalendar size={14} className="text-slate-400" />
                          {formatDate(item.date)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-blue-700">
                          {item.purchaseInvoiceNumber || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                            <FiTruck size={16} />
                          </div>
                          <span className="text-sm text-slate-700">
                            {item.supplier || "مورد غير محدد"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatNumber(
                          item.itemCount ??
                            (Array.isArray(item.items) ? item.items.length : 0),
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatNumber(item.totalQuantity)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800">
                          {formatNumber(item.total)}
                        </div>
                        <span className="text-xs text-slate-400">
                          ريال يمني
                        </span>
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReturn(item)}
                            title="عرض التفاصيل"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          >
                            <FiEye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => printReturn(item)}
                            title="طباعة المرتجع"
                            className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                          >
                            <FiPrinter size={17} />
                          </button>
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

      {/* Details Modal */}
      {selectedReturn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 md:p-6"
          onClick={() => setSelectedReturn(null)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  تفاصيل مرتجع المشتريات
                </h2>
                <p className="mt-1 text-sm text-orange-600">
                  {selectedReturn.returnNumber}
                </p>
              </div>

              <button
                onClick={() => setSelectedReturn(null)}
                className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem
                  label="رقم المرتجع"
                  value={selectedReturn.returnNumber}
                />
                <InfoItem
                  label="تاريخ المرتجع"
                  value={formatDate(selectedReturn.date)}
                />
                <InfoItem label="المورد" value={selectedReturn.supplier} />
                <InfoItem
                  label="فاتورة الشراء"
                  value={selectedReturn.purchaseInvoiceNumber}
                />
                <InfoItem
                  label="حالة المرتجع"
                  value={getStatus(selectedReturn.status).label}
                />
                <InfoItem label="سبب الإرجاع" value={selectedReturn.reason} />
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                  <FiPackage className="text-orange-600" />
                  الأصناف المرتجعة
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
                      {(Array.isArray(selectedReturn.items)
                        ? selectedReturn.items
                        : []
                      ).map((product, index) => (
                        <tr key={product.id || index}>
                          <td className="px-3 py-3 text-sm font-medium text-slate-700">
                            {product.productName || product.name || "-"}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600">
                            {formatNumber(product.quantity)}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600">
                            {product.unitName || product.unit || "-"}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600">
                            {formatNumber(product.price)}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600">
                            {formatNumber(product.discount)}
                          </td>
                          <td className="px-3 py-3 text-sm font-bold text-slate-800">
                            {formatNumber(product.total)}
                          </td>
                        </tr>
                      ))}

                      {(!Array.isArray(selectedReturn.items) ||
                        selectedReturn.items.length === 0) && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-8 text-center text-sm text-slate-400"
                          >
                            لا توجد أصناف مسجلة في هذا المرتجع.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="w-full max-w-sm space-y-3 rounded-xl border border-slate-200 p-4">
                  <TotalRow
                    label="الإجمالي قبل الخصم"
                    value={selectedReturn.subtotal}
                  />
                  <TotalRow label="الخصم" value={selectedReturn.discount} />
                  <TotalRow label="الضريبة" value={selectedReturn.tax} />

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        الإجمالي النهائي
                      </span>
                      <span className="text-xl font-bold text-orange-700">
                        {formatNumber(selectedReturn.total)} ر.ي
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedReturn.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 text-sm font-bold text-amber-800">
                    ملاحظات المرتجع
                  </h3>
                  <p className="text-sm text-amber-700">
                    {selectedReturn.notes}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => printReturn(selectedReturn)}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <FiPrinter />
                  طباعة المرتجع
                </button>

                <button
                  onClick={() => setSelectedReturn(null)}
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
  color: "blue" | "orange" | "green" | "amber";
  suffix?: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
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
