"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useERPStore } from "@/Store/erpStore";

export default function SalesPrintPage() {
  const params = useParams();

  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;

  const sales = useERPStore((state) => state.sales);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sale = useMemo(() => {
    if (!saleId) return undefined;

    return sales.find((item) => item.id === saleId);
  }, [sales, saleId]);

  const calculatedTotals = useMemo(() => {
    if (!sale) {
      return {
        totalQuantity: 0,
        subtotal: 0,
        discount: 0,
        total: 0,
      };
    }

    const items = sale.items || [];

    let totalQuantity = 0;
    let subtotal = 0;
    let discount = 0;

    items.forEach((item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const itemDiscount = Number(item.discount || 0);

      totalQuantity += quantity;
      subtotal += quantity * price;
      discount += itemDiscount;
    });

    const total = Math.max(0, subtotal - discount);

    return {
      totalQuantity,
      subtotal,
      discount,
      total,
    };
  }, [sale]);

  if (!mounted) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-100 text-xs text-gray-500"
      >
        جاري تحميل الفاتورة...
      </div>
    );
  }

  if (!sale) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-100 p-4"
      >
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <h1 className="mb-2 text-base font-bold text-red-600">
            لم يتم العثور على الفاتورة المطلوبة
          </h1>

          <p className="text-xs text-gray-500">
            رقم الفاتورة أو المعرف غير موجود في سجل المبيعات.
          </p>

          <p className="mt-3 break-all text-[10px] text-gray-400">
            ID: {saleId}
          </p>

          <button
            type="button"
            onClick={() => window.close()}
            className="mt-4 rounded-md bg-gray-800 px-4 py-2 text-xs font-bold text-white hover:bg-gray-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const items = sale.items || [];

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-YE").format(Number(value || 0));
  };

  const paymentMethodLabel =
    sale.paymentMethod === "cash"
      ? "نقدًا"
      : sale.paymentMethod === "bank"
        ? "حوالة بنكية"
        : "آجل";

  const statusLabel =
    sale.status === "paid"
      ? "مدفوعة"
      : sale.status === "pending"
        ? "معلقة"
        : "ملغاة";

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* أزرار التحكم */}
      <div className="print:hidden">
        <div
          dir="rtl"
          className="flex items-center justify-center gap-2 bg-gray-100 p-3"
        >
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-[#0E1F33] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#162d47]"
          >
            طباعة الفاتورة
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-md border border-gray-300 bg-white px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* صفحة الفاتورة */}
      <main
        dir="rtl"
        className="min-h-screen bg-gray-100 p-3 print:min-h-0 print:bg-white print:p-0"
      >
        <div className="mx-auto w-full max-w-[794px] bg-white text-gray-900 print:max-w-none">
          <div className="border-2 border-gray-800">
            {/* رأس الفاتورة */}
            <div className="flex items-center justify-between border-b-2 border-gray-800 px-5 py-4">
              <div className="text-right">
                <h1 className="text-xl font-bold">شركة الجابري</h1>

                <p className="mt-0.5 text-xs">
                  للعسل والزيوت الطبيعة وخدمات العمرة
                </p>

                <p className="mt-0.5 text-xs">البيضاء - اليمن</p>

                <p className="mt-0.5 text-xs">هاتف: 734 434 443</p>
              </div>

              <div className="text-center">
                <div className="mb-1.5 inline-block rounded border-2 border-gray-800 px-5 py-1.5">
                  <h2 className="text-lg font-bold">فاتورة مبيعات</h2>
                </div>

                <p className="text-xs">
                  رقم الفاتورة:{" "}
                  <span className="font-bold">{sale.invoiceNumber}</span>
                </p>

                <p className="mt-0.5 text-xs">
                  التاريخ: <span className="font-bold">{sale.date}</span>
                </p>
              </div>
            </div>

            {/* بيانات العميل */}
            <div className="grid grid-cols-3 border-b-2 border-gray-800">
              <div className="border-l border-gray-800 p-2.5">
                <p className="mb-0.5 text-[10px] text-gray-500">العميل</p>

                <p className="text-xs font-bold">
                  {sale.customerName || "عميل نقدي"}
                </p>
              </div>

              <div className="border-l border-gray-800 p-2.5">
                <p className="mb-0.5 text-[10px] text-gray-500">طريقة الدفع</p>

                <p className="text-xs font-bold">{paymentMethodLabel}</p>
              </div>

              <div className="p-2.5">
                <p className="mb-0.5 text-[10px] text-gray-500">الحساب</p>

                <p className="text-xs font-bold">
                  {sale.accountCode
                    ? `${sale.accountCode} - ${sale.accountName ?? ""}`
                    : sale.accountName || "غير محدد"}
                </p>
              </div>
            </div>

            {/* حالة الفاتورة */}
            <div className="border-b border-gray-800 px-3 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">حالة الفاتورة</span>

                <span
                  className={`text-[10px] font-bold ${
                    sale.status === "paid"
                      ? "text-green-700"
                      : sale.status === "pending"
                        ? "text-orange-600"
                        : "text-red-600"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* جدول الأصناف */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-10 border-b border-l border-gray-800 px-1.5 py-2">
                    م
                  </th>

                  <th className="border-b border-l border-gray-800 px-2.5 py-2 text-right">
                    الصنف
                  </th>

                  <th className="w-20 border-b border-l border-gray-800 px-1.5 py-2">
                    الكمية
                  </th>

                  <th className="w-24 border-b border-l border-gray-800 px-1.5 py-2">
                    السعر
                  </th>

                  <th className="w-24 border-b border-l border-gray-800 px-1.5 py-2">
                    الخصم
                  </th>

                  <th className="w-28 border-b border-gray-800 px-1.5 py-2">
                    الإجمالي
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-xs text-gray-500"
                    >
                      لا توجد أصناف في الفاتورة
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const quantity = Number(item.quantity || 0);
                    const price = Number(item.price || 0);
                    const discount = Number(item.discount || 0);

                    const itemSubtotal = quantity * price;
                    const itemTotal = Math.max(0, itemSubtotal - discount);

                    return (
                      <tr key={item.id}>
                        <td className="border-b border-l border-gray-800 px-1.5 py-2 text-center">
                          {index + 1}
                        </td>

                        <td className="border-b border-l border-gray-800 px-2.5 py-2">
                          <div className="text-xs">{item.item}</div>

                          {item.productCode && (
                            <div className="mt-0.5 text-[9px] text-gray-400">
                              كود الصنف: {item.productCode}
                            </div>
                          )}
                        </td>

                        <td className="border-b border-l border-gray-800 px-1.5 py-2 text-center">
                          {formatMoney(quantity)}
                        </td>

                        <td className="border-b border-l border-gray-800 px-1.5 py-2 text-center">
                          {formatMoney(price)}
                        </td>

                        <td className="border-b border-l border-gray-800 px-1.5 py-2 text-center">
                          {formatMoney(discount)}
                        </td>

                        <td className="border-b border-gray-800 px-1.5 py-2 text-center font-bold">
                          {formatMoney(itemTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* ملخص الفاتورة */}
            <div className="flex justify-between border-b-2 border-gray-800">
              {/* الملاحظات */}
              <div className="w-1/2 p-3">
                <p className="mb-1.5 text-xs font-bold">ملاحظات</p>

                {sale.notes ? (
                  <p className="text-xs text-gray-700">{sale.notes}</p>
                ) : (
                  <div className="h-12 rounded border border-dashed border-gray-400" />
                )}
              </div>

              {/* الإجماليات */}
              <div className="w-1/2 border-r-2 border-gray-800 text-xs">
                <div className="flex justify-between border-b border-gray-300 px-3 py-1.5">
                  <span>إجمالي الكمية</span>

                  <span className="font-bold">
                    {formatMoney(calculatedTotals.totalQuantity)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-300 px-3 py-1.5">
                  <span>الإجمالي قبل الخصم</span>

                  <span className="font-bold">
                    {formatMoney(calculatedTotals.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-300 px-3 py-1.5">
                  <span>إجمالي الخصم</span>

                  <span className="font-bold">
                    {formatMoney(calculatedTotals.discount)}
                  </span>
                </div>

                <div className="flex justify-between bg-gray-100 px-3 py-2.5 text-sm">
                  <span className="font-bold">صافي الفاتورة</span>

                  <span className="font-bold">
                    {formatMoney(calculatedTotals.total)} ريال
                  </span>
                </div>
              </div>
            </div>

            {/* أسفل الفاتورة */}
            <div className="px-5 py-4 text-center">
              <p className="text-xs font-bold">شركة الجابري</p>

              <p className="mt-0.5 text-[10px] text-gray-600">
                الجابري للعسل والزيوت الطبيعة وخدمات العمرة
              </p>

              <p className="mt-1 text-[10px] text-gray-500">
                شكرًا لتعاملكم معنا
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* إعدادات الطباعة A4 */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {
          html,
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          * {
            box-sizing: border-box;
            box-shadow: none !important;
          }

          main {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            background: white !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </>
  );
}
