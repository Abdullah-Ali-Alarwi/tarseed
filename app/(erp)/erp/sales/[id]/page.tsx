"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: string;
  companyId: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  warehouseId?: string;
  warehouseName?: string;
  date?: string;
  items?: any[];
  subtotal?: number;
  total?: number;
  totalAmount?: number;
  grandTotal?: number;
  totalCost?: number;
  profit?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod?: string;
  paymentAccountName?: string;
  status?: string;
  notes?: string;
  journalId?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdAt?: string;
  extra?: any;
};

const formatNumber = (value: any) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getPaymentStatus = (status?: string) => {
  const value = (status || "").toLowerCase();

  if (["paid", "مدفوعة", "completed"].includes(value)) {
    return {
      label: "مدفوعة بالكامل",
      className: "bg-green-100 text-green-700",
    };
  }

  if (["partial", "جزئية", "partially_paid"].includes(value)) {
    return {
      label: "مدفوعة جزئياً",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  if (["unpaid", "غير مدفوعة", "pending"].includes(value)) {
    return {
      label: "غير مدفوعة",
      className: "bg-red-100 text-red-700",
    };
  }

  return {
    label: status || "غير محدد",
    className: "bg-gray-100 text-gray-700",
  };
};

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) loadSale();
  }, [id]);

  const loadSale = async () => {
    try {
      setLoading(true);
      setError("");

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        setError("يرجى تسجيل الدخول أولاً");
        return;
      }

      const user = JSON.parse(storedUser);
      const companyId = user.companyId;

      if (!companyId) {
        setError("لم يتم العثور على الشركة المرتبطة بالمستخدم");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .eq("companyId", companyId)
        .single();

      if (queryError) {
        console.error("Sale loading error:", queryError);
        throw queryError;
      }

      setSale(data as Sale);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "حدث خطأ أثناء تحميل بيانات الفاتورة");
    } finally {
      setLoading(false);
    }
  };

  const getItems = () => {
    if (!Array.isArray(sale?.items)) return [];
    return sale.items;
  };

  const getItemName = (item: any) =>
    item.productName || item.name || item.product?.name || "صنف بدون اسم";

  const getItemQuantity = (item: any) => Number(item.quantity ?? item.qty ?? 0);

  const getItemPrice = (item: any) =>
    Number(item.unitPrice ?? item.sellingPrice ?? item.price ?? 0);

  const getItemTotal = (item: any) => {
    if (item.total !== undefined) return Number(item.total);

    if (item.totalPrice !== undefined) return Number(item.totalPrice);

    return getItemQuantity(item) * getItemPrice(item);
  };

  const getTotal = () =>
    Number(sale?.grandTotal ?? sale?.totalAmount ?? sale?.total ?? 0);

  const getPaid = () => Number(sale?.paidAmount || 0);

  const getRemaining = () =>
    sale?.remainingAmount !== undefined && sale?.remainingAmount !== null
      ? Number(sale.remainingAmount)
      : Math.max(getTotal() - getPaid(), 0);

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0E1F33]" />
          <p className="text-sm text-gray-500">جاري تحميل بيانات الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div dir="rtl" className="p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">⚠️</div>

          <h2 className="mb-2 text-lg font-bold text-gray-800">
            تعذر عرض الفاتورة
          </h2>

          <p className="mb-6 text-sm text-red-600">
            {error || "الفاتورة غير موجودة"}
          </p>

          <button
            onClick={() => router.push("/erp/sales")}
            className="rounded-xl bg-[#0E1F33] px-6 py-3 text-sm font-semibold text-white hover:bg-[#183653]"
          >
            العودة إلى فواتير المبيعات
          </button>
        </div>
      </div>
    );
  }

  const paymentStatus = getPaymentStatus(sale.status);
  const items = getItems();

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 md:p-7">
      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => router.push("/erp/sales")}
                className="hover:text-[#0E1F33]"
              >
                المبيعات
              </button>

              <span>/</span>
              <span className="text-gray-800">تفاصيل الفاتورة</span>
            </div>

            <h1 className="text-2xl font-bold text-[#0E1F33]">
              فاتورة المبيعات
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              تفاصيل ومعلومات فاتورة المبيعات
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/erp/sales")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              ← العودة
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-xl bg-[#0E1F33] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#183653]"
            >
              طباعة الفاتورة
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div
          id="invoice"
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Invoice Header */}
          <div className="bg-[#0E1F33] p-6 text-white md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="mb-2 text-sm text-blue-200">WEZZAN ERP</div>

                <h2 className="text-2xl font-bold">فاتورة مبيعات</h2>

                <p className="mt-2 text-sm text-blue-200">تفاصيل عملية البيع</p>
              </div>

              <div className="text-left">
                <div className="text-sm text-blue-200">رقم الفاتورة</div>

                <div className="mt-1 text-2xl font-bold" dir="ltr">
                  {sale.invoiceNumber || sale.id}
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentStatus.className}`}
                  >
                    {paymentStatus.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-5 md:p-8">
            {/* Basic Information */}
            <section>
              <h3 className="mb-4 border-b border-gray-100 pb-3 text-base font-bold text-[#0E1F33]">
                معلومات الفاتورة
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Info
                  label="رقم الفاتورة"
                  value={sale.invoiceNumber || sale.id}
                />

                <Info label="تاريخ الفاتورة" value={formatDate(sale.date)} />

                <Info label="العميل" value={sale.customerName || "عميل نقدي"} />

                <Info label="المستودع" value={sale.warehouseName || "—"} />

                <Info label="طريقة الدفع" value={sale.paymentMethod || "—"} />

                <Info
                  label="حساب الدفع"
                  value={sale.paymentAccountName || "—"}
                />

                <Info
                  label="أنشئت بواسطة"
                  value={sale.createdByName || sale.createdByUsername || "—"}
                />

                <Info label="حالة الفاتورة" value={paymentStatus.label} />
              </div>
            </section>

            {/* Items */}
            <section>
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-[#0E1F33]">
                  الأصناف المباعة
                </h3>

                <span className="text-sm text-gray-500">
                  {items.length} صنف
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[650px] text-right text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-4 font-semibold">#</th>
                      <th className="px-4 py-4 font-semibold">الصنف</th>
                      <th className="px-4 py-4 font-semibold">الكمية</th>
                      <th className="px-4 py-4 font-semibold">سعر الوحدة</th>
                      <th className="px-4 py-4 font-semibold">الإجمالي</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-gray-500">
                            {index + 1}
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-800">
                              {getItemName(item)}
                            </div>

                            {item.sku && (
                              <div className="mt-1 text-xs text-gray-400">
                                SKU: {item.sku}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4 text-gray-700">
                            {formatNumber(getItemQuantity(item))}
                            {item.unitName ? ` ${item.unitName}` : ""}
                          </td>

                          <td className="px-4 py-4 text-gray-700">
                            {formatNumber(getItemPrice(item))}
                          </td>

                          <td className="px-4 py-4 font-bold text-gray-800">
                            {formatNumber(getItemTotal(item))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-gray-400"
                        >
                          لا توجد أصناف مسجلة في هذه الفاتورة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Totals */}
            <section className="flex flex-col items-end">
              <div className="w-full max-w-md space-y-4 rounded-xl bg-gray-50 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">المجموع الفرعي</span>

                  <span className="font-semibold text-gray-800">
                    {formatNumber(sale.subtotal ?? sale.total ?? getTotal())}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">
                      إجمالي الفاتورة
                    </span>

                    <span className="text-xl font-bold text-[#0E1F33]">
                      {formatNumber(getTotal())}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">المبلغ المدفوع</span>

                  <span className="font-bold text-green-700">
                    {formatNumber(getPaid())}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="font-bold text-gray-800">
                    المبلغ المتبقي
                  </span>

                  <span className="text-xl font-bold text-red-600">
                    {formatNumber(getRemaining())}
                  </span>
                </div>
              </div>
            </section>

            {/* Notes */}
            {sale.notes && (
              <section>
                <h3 className="mb-3 border-b border-gray-100 pb-3 font-bold text-[#0E1F33]">
                  ملاحظات الفاتورة
                </h3>

                <div className="rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-600">
                  {sale.notes}
                </div>
              </section>
            )}

            {/* Journal Information */}
            <section className="rounded-xl border border-gray-200 p-4">
              <h3 className="mb-3 font-bold text-[#0E1F33]">
                المعلومات المحاسبية
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">حالة الترحيل المحاسبي</span>

                {sale.journalId ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                    تم الترحيل
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-700">
                    غير مرحلة
                  </span>
                )}
              </div>

              {sale.journalId && (
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-gray-500">رقم القيد المحاسبي</span>

                  <span className="font-medium text-gray-800" dir="ltr">
                    {sale.journalId}
                  </span>
                </div>
              )}
            </section>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
              تم إنشاء هذه الفاتورة بواسطة نظام Wezzan ERP
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #invoice,
          #invoice * {
            visibility: visible;
          }

          #invoice {
            position: absolute;
            right: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          #invoice {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-gray-400">{label}</div>

      <div className="break-words text-sm font-semibold text-gray-800">
        {value || "—"}
      </div>
    </div>
  );
}
