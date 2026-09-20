"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSalesStore } from "@/Store/salesStore";

export default function SalesPrintPage() {
  const params = useParams();

  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;

  const sales = useSalesStore((state) => state.sales);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sale = useMemo(() => {
    if (!saleId) return undefined;

    return sales.find((item) => item.id === saleId);
  }, [sales, saleId]);

  /* =====================================================
     الانتظار حتى يتم تحميل Zustand
  ===================================================== */

  if (!mounted) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-100 text-sm text-gray-500"
      >
        جاري تحميل الفاتورة...
      </div>
    );
  }

  /* =====================================================
     الفاتورة غير موجودة
  ===================================================== */

  if (!sale) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-100 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-lg font-bold text-red-600">
            لم يتم العثور على الفاتورة المطلوبة
          </h1>

          <p className="text-sm text-gray-500">
            رقم الفاتورة أو المعرف غير موجود في سجل المبيعات.
          </p>

          <p className="mt-3 break-all text-xs text-gray-400">ID: {saleId}</p>

          <button
            type="button"
            onClick={() => window.close()}
            className="mt-5 rounded-md bg-gray-800 px-5 py-2 text-xs font-bold text-white hover:bg-gray-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     تنسيق الأموال
  ===================================================== */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-YE").format(Number(value || 0));
  };

  /* =====================================================
     طريقة الدفع
  ===================================================== */

  const paymentMethodLabel =
    sale.paymentMethod === "cash"
      ? "نقدًا"
      : sale.paymentMethod === "bank"
        ? "حوالة بنكية"
        : "آجل";

  /* =====================================================
     حالة الفاتورة
  ===================================================== */

  const statusLabel =
    sale.status === "paid"
      ? "مدفوعة"
      : sale.status === "pending"
        ? "معلقة"
        : "ملغاة";

  /* =====================================================
     الطباعة
  ===================================================== */

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ===================================================
          أزرار التحكم - لا تظهر في الطباعة
      =================================================== */}

      <div className="print:hidden">
        <div
          dir="rtl"
          className="flex items-center justify-center gap-2 bg-gray-100 p-4"
        >
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            طباعة الفاتورة
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* ===================================================
          صفحة الفاتورة
      =================================================== */}

      <main
        dir="rtl"
        className="min-h-screen bg-gray-100 p-5 print:min-h-0 print:bg-white print:p-0"
      >
        <div className="mx-auto w-full max-w-[794px] bg-white text-gray-900 print:max-w-none">
          <div className="border-2 border-gray-800">
            {/* =================================================
                رأس الفاتورة
            ================================================= */}

            <div className="flex items-center justify-between border-b-2 border-gray-800 px-6 py-5">
              {/* الشركة */}

              <div className="text-right">
                <h1 className="text-2xl font-bold">شركة الجابري</h1>

                <p className="mt-1 text-sm">
                  للعسل والزيوت الطبيعة وخدمات العمرة
                </p>

                <p className="mt-1 text-sm">البيضاء - اليمن</p>

                <p className="mt-1 text-sm">هاتف: 734 434 443</p>
              </div>

              {/* عنوان الفاتورة */}

              <div className="text-center">
                <div className="mb-2 inline-block rounded border-2 border-gray-800 px-6 py-2">
                  <h2 className="text-xl font-bold">فاتورة مبيعات</h2>
                </div>

                <p className="text-sm">
                  رقم الفاتورة:{" "}
                  <span className="font-bold">{sale.invoiceNumber}</span>
                </p>

                <p className="mt-1 text-sm">
                  التاريخ: <span className="font-bold">{sale.date}</span>
                </p>
              </div>
            </div>

            {/* =================================================
                بيانات العميل
            ================================================= */}

            <div className="grid grid-cols-3 border-b-2 border-gray-800">
              <div className="border-l border-gray-800 p-3">
                <p className="mb-1 text-xs text-gray-500">العميل</p>

                <p className="font-bold">{sale.customerName || "عميل نقدي"}</p>
              </div>

              <div className="border-l border-gray-800 p-3">
                <p className="mb-1 text-xs text-gray-500">طريقة الدفع</p>

                <p className="font-bold">{paymentMethodLabel}</p>
              </div>

              <div className="p-3">
                <p className="mb-1 text-xs text-gray-500">الحساب</p>

                <p className="font-bold">
                  {sale.accountCode
                    ? `${sale.accountCode} - ${sale.accountName ?? ""}`
                    : sale.accountName || "غير محدد"}
                </p>
              </div>
            </div>

            {/* =================================================
                حالة الفاتورة
            ================================================= */}

            <div className="border-b border-gray-800 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">حالة الفاتورة</span>

                <span
                  className={`text-xs font-bold ${
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

            {/* =================================================
                جدول الأصناف
            ================================================= */}

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-12 border-b border-l border-gray-800 px-2 py-3">
                    م
                  </th>

                  <th className="border-b border-l border-gray-800 px-3 py-3 text-right">
                    الصنف
                  </th>

                  <th className="w-24 border-b border-l border-gray-800 px-2 py-3">
                    الكمية
                  </th>

                  <th className="w-28 border-b border-l border-gray-800 px-2 py-3">
                    السعر
                  </th>

                  <th className="w-28 border-b border-l border-gray-800 px-2 py-3">
                    الخصم
                  </th>

                  <th className="w-32 border-b border-gray-800 px-2 py-3">
                    الإجمالي
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      لا توجد أصناف في الفاتورة
                    </td>
                  </tr>
                ) : (
                  sale.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border-b border-l border-gray-800 px-2 py-3 text-center">
                        {index + 1}
                      </td>

                      <td className="border-b border-l border-gray-800 px-3 py-3">
                        {item.item}
                      </td>

                      <td className="border-b border-l border-gray-800 px-2 py-3 text-center">
                        {formatMoney(item.quantity)}
                      </td>

                      <td className="border-b border-l border-gray-800 px-2 py-3 text-center">
                        {formatMoney(item.price)}
                      </td>

                      <td className="border-b border-l border-gray-800 px-2 py-3 text-center">
                        {formatMoney(item.discount)}
                      </td>

                      <td className="border-b border-gray-800 px-2 py-3 text-center font-bold">
                        {formatMoney(item.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* =================================================
                ملخص الفاتورة
            ================================================= */}

            <div className="flex justify-between border-b-2 border-gray-800">
              {/* الملاحظات */}

              <div className="w-1/2 p-4">
                <p className="mb-2 font-bold">ملاحظات</p>

                {sale.notes ? (
                  <p className="text-sm text-gray-700">{sale.notes}</p>
                ) : (
                  <div className="h-16 rounded border border-dashed border-gray-400" />
                )}
              </div>

              {/* الإجماليات */}

              <div className="w-1/2 border-r-2 border-gray-800">
                <div className="flex justify-between border-b border-gray-300 px-4 py-2">
                  <span>إجمالي الكمية</span>

                  <span className="font-bold">
                    {formatMoney(sale.totalQuantity)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-300 px-4 py-2">
                  <span>الإجمالي قبل الخصم</span>

                  <span className="font-bold">
                    {formatMoney(sale.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-300 px-4 py-2">
                  <span>إجمالي الخصم</span>

                  <span className="font-bold">
                    {formatMoney(sale.discount)}
                  </span>
                </div>

                <div className="flex justify-between bg-gray-100 px-4 py-4 text-lg">
                  <span className="font-bold">صافي الفاتورة</span>

                  <span className="font-bold">
                    {formatMoney(sale.total)} ريال
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                أسفل الفاتورة
            ================================================= */}

            <div className="px-6 py-5 text-center">
              <p className="font-bold">شركة الجابري</p>

              <p className="mt-1 text-xs text-gray-600">
                الجابري للعسل والزيوت الطبيعة وخدمات العمرة
              </p>

              <p className="mt-2 text-xs text-gray-500">شكرًا لتعاملكم معنا</p>
            </div>
          </div>
        </div>
      </main>

      {/* ===================================================
          إعدادات الطباعة A4
      =================================================== */}

      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
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
          }
        }
      `}</style>
    </>
  );
}
