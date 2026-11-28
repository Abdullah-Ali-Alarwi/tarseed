"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: string;
  companyId: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
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
  extra?: Record<string, any>;
};

const money = (value: any) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateFormat = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function SalesInvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        throw new Error("يرجى تسجيل الدخول أولاً");
      }

      const user = JSON.parse(storedUser);
      const companyId = user.companyId;

      if (!companyId) {
        throw new Error("لم يتم تحديد الشركة");
      }

      const { data, error: queryError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .eq("companyId", companyId)
        .single();

      if (queryError) throw queryError;

      setSale(data as Sale);
    } catch (err: any) {
      console.error("Invoice loading error:", err);
      setError(err.message || "تعذر تحميل الفاتورة");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadInvoice();
  }, [id, loadInvoice]);

  const total = Number(
    sale?.grandTotal ?? sale?.totalAmount ?? sale?.total ?? 0,
  );

  const paid = Number(sale?.paidAmount || 0);

  const remaining =
    sale?.remainingAmount != null
      ? Number(sale.remainingAmount)
      : Math.max(total - paid, 0);

  const items = Array.isArray(sale?.items) ? sale.items : [];

  const isPosted = Boolean(sale?.journalId || sale?.extra?.salesPosted);

  const postInvoice = async () => {
    if (!sale || posting) return;

    if (isPosted) {
      setMessage("هذه الفاتورة مرحلة محاسبيًا بالفعل.");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من ترحيل الفاتورة ${sale.invoiceNumber || sale.id}؟\n\nسيتم إنشاء القيد المحاسبي وتحديث المخزون. لا تنفذ العملية مرتين.`,
    );

    if (!confirmed) return;

    try {
      setPosting(true);
      setError("");
      setMessage("");

      const { data, error: rpcError } = await supabase.rpc(
        "post_sales_invoice",
        {
          p_sale_id: sale.id,
        },
      );

      if (rpcError) {
        throw rpcError;
      }

      // التعامل مع نتيجة RPC إذا كانت الدالة ترجع نتيجة JSON
      if (data && typeof data === "object") {
        if (data.success === false || data.error) {
          throw new Error(data.message || data.error || "فشلت عملية الترحيل");
        }
      }

      await loadInvoice();

      setMessage(
        data?.message ||
          "تم إرسال طلب الترحيل بنجاح. تم تحديث بيانات الفاتورة.",
      );
    } catch (err: any) {
      console.error("Invoice posting error:", err);

      setError(err.message || "حدث خطأ أثناء ترحيل الفاتورة");
    } finally {
      setPosting(false);
    }
  };

  const paymentStatus = () => {
    const status = (sale?.status || "").toLowerCase();

    if (["paid", "completed", "مدفوعة"].includes(status)) {
      return {
        label: "مدفوعة بالكامل",
        style: "bg-green-100 text-green-700",
      };
    }

    if (["partial", "partially_paid", "جزئية"].includes(status)) {
      return {
        label: "مدفوعة جزئياً",
        style: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "غير مدفوعة",
      style: "bg-red-100 text-red-700",
    };
  };

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

  if (error && !sale) {
    return (
      <div dir="rtl" className="p-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h2 className="mb-3 text-xl font-bold text-gray-800">
            تعذر عرض الفاتورة
          </h2>

          <p className="mb-6 text-sm text-red-600">{error}</p>

          <button
            onClick={() => router.push("/erp/sales/invoices")}
            className="rounded-xl bg-[#0E1F33] px-6 py-3 text-white"
          >
            العودة للفواتير
          </button>
        </div>
      </div>
    );
  }

  if (!sale) return null;

  const payment = paymentStatus();

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 md:p-7">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => router.push("/erp/sales")}
                className="hover:text-[#0E1F33]"
              >
                المبيعات
              </button>

              <span>/</span>

              <button
                onClick={() => router.push("/erp/sales/invoices")}
                className="hover:text-[#0E1F33]"
              >
                الفواتير
              </button>

              <span>/</span>

              <span>تفاصيل الفاتورة</span>
            </div>

            <h1 className="text-2xl font-bold text-[#0E1F33]">
              إدارة فاتورة المبيعات
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {sale.invoiceNumber || sale.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/erp/sales/invoices")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              العودة
            </button>

            <button
              onClick={() => router.push(`/erp/sales/${sale.id}/print`)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              طباعة الفاتورة
            </button>

            <button
              onClick={postInvoice}
              disabled={isPosted || posting}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${
                isPosted
                  ? "cursor-not-allowed bg-green-600"
                  : posting
                    ? "cursor-wait bg-gray-400"
                    : "bg-[#0E1F33] hover:bg-[#183653]"
              }`}
            >
              {posting
                ? "جاري الترحيل..."
                : isPosted
                  ? "✓ تم الترحيل"
                  : "ترحيل الفاتورة"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Status cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي الفاتورة"
            value={money(total)}
            subtitle="إجمالي قيمة البيع"
          />

          <StatCard
            title="المبلغ المدفوع"
            value={money(paid)}
            subtitle="المبلغ المحصل"
            color="text-green-700"
          />

          <StatCard
            title="المبلغ المتبقي"
            value={money(remaining)}
            subtitle="الرصيد المستحق"
            color="text-red-600"
          />

          <StatCard
            title="حالة الترحيل"
            value={isPosted ? "مرحلة" : "غير مرحلة"}
            subtitle={isPosted ? "تم إنشاء القيد المحاسبي" : "تحتاج إلى ترحيل"}
            color={isPosted ? "text-green-700" : "text-yellow-700"}
          />
        </div>

        {/* Invoice information */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <h2 className="font-bold text-[#0E1F33]">معلومات الفاتورة</h2>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${payment.style}`}
              >
                {payment.label}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isPosted
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {isPosted ? "مرحلة محاسبيًا" : "غير مرحلة"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="رقم الفاتورة" value={sale.invoiceNumber || sale.id} />

            <Info label="تاريخ الفاتورة" value={dateFormat(sale.date)} />

            <Info label="اسم العميل" value={sale.customerName || "عميل نقدي"} />

            <Info label="المستودع" value={sale.warehouseName || "—"} />

            <Info label="طريقة الدفع" value={sale.paymentMethod || "—"} />

            <Info label="حساب الدفع" value={sale.paymentAccountName || "—"} />

            <Info
              label="أنشئت بواسطة"
              value={sale.createdByName || sale.createdByUsername || "—"}
            />

            <Info label="تاريخ الإنشاء" value={dateFormat(sale.createdAt)} />
          </div>
        </div>

        {/* Items */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h2 className="font-bold text-[#0E1F33]">الأصناف</h2>

            <span className="text-sm text-gray-500">{items.length} صنف</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">الصنف</th>
                  <th className="px-5 py-4">الكمية</th>
                  <th className="px-5 py-4">سعر الوحدة</th>
                  <th className="px-5 py-4">الإجمالي</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => {
                  const quantity = Number(item.quantity ?? item.qty ?? 0);

                  const price = Number(
                    item.unitPrice ?? item.sellingPrice ?? item.price ?? 0,
                  );

                  const itemTotal = Number(
                    item.total ?? item.totalPrice ?? quantity * price,
                  );

                  return (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">
                          {item.productName ||
                            item.name ||
                            item.product?.name ||
                            "—"}
                        </p>

                        {item.sku && (
                          <p className="mt-1 text-xs text-gray-400">
                            {item.sku}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {money(quantity)}
                        {item.unitName ? ` ${item.unitName}` : ""}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {money(price)}
                      </td>

                      <td className="px-5 py-4 font-bold text-gray-800">
                        {money(itemTotal)}
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      لا توجد أصناف في الفاتورة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial summary */}
        <div className="mb-6 flex justify-end">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 font-bold text-[#0E1F33]">الملخص المالي</h2>

            <div className="space-y-4">
              <SummaryRow
                label="المجموع الفرعي"
                value={money(sale.subtotal ?? sale.total ?? total)}
              />

              <SummaryRow label="الإجمالي النهائي" value={money(total)} bold />

              <SummaryRow
                label="المبلغ المدفوع"
                value={money(paid)}
                color="text-green-700"
              />

              <SummaryRow
                label="المبلغ المتبقي"
                value={money(remaining)}
                color="text-red-600"
                bold
              />
            </div>
          </div>
        </div>

        {/* Accounting */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
          <h2 className="mb-5 font-bold text-[#0E1F33]">المعلومات المحاسبية</h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-gray-400">حالة الترحيل</p>

              <p
                className={`font-bold ${isPosted ? "text-green-700" : "text-yellow-700"}`}
              >
                {isPosted ? "تم ترحيل الفاتورة" : "لم يتم ترحيل الفاتورة"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-400">رقم القيد المحاسبي</p>

              <p className="font-bold text-gray-800" dir="ltr">
                {sale.journalId || "لا يوجد قيد حتى الآن"}
              </p>
            </div>

            {sale.totalCost !== undefined && (
              <Info label="تكلفة البضاعة" value={money(sale.totalCost)} />
            )}

            {sale.profit !== undefined && (
              <Info label="الربح" value={money(sale.profit)} />
            )}
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-bold text-[#0E1F33]">ملاحظات</h2>

            <p className="text-sm leading-7 text-gray-600">{sale.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color = "text-[#0E1F33]",
}: {
  title: string;
  value: string;
  subtitle: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>

      <p className={`mt-3 text-2xl font-bold ${color}`}>{value}</p>

      <p className="mt-2 text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-400">{label}</p>

      <p className="break-words text-sm font-semibold text-gray-800">
        {value || "—"}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
  color = "text-gray-800",
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${bold ? "font-bold" : "text-gray-500"}`}>
        {label}
      </span>

      <span
        className={`${bold ? "text-lg font-bold" : "font-semibold"} ${color}`}
      >
        {value}
      </span>
    </div>
  );
}
