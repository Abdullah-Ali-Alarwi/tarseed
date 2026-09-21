"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useERPStore } from "@/Store/erpStore";

export default function SalesPrintPage() {
  const params = useParams();
  const saleId = String(params.id);

  const sales = useERPStore((state) => state.sales);

  const [hydrated, setHydrated] = useState(false);

  /* =====================================================
     انتظار استعادة بيانات Zustand من LocalStorage
  ===================================================== */

  useEffect(() => {
    const checkHydration = () => {
      if (useERPStore.persist.hasHydrated()) {
        setHydrated(true);
      }
    };

    checkHydration();

    const unsubscribe = useERPStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /* =====================================================
     البحث عن الفاتورة بعد اكتمال Hydration
  ===================================================== */

  const sale = hydrated ? sales.find((item) => item.id === saleId) : undefined;

  /* =====================================================
     الطباعة التلقائية بعد ظهور الفاتورة
  ===================================================== */

  useEffect(() => {
    if (!sale) return;

    const timer = setTimeout(() => {
      window.print();
    }, 700);

    return () => clearTimeout(timer);
  }, [sale]);

  /* =====================================================
     تنسيق المبالغ
  ===================================================== */

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-YE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  /* =====================================================
     طريقة الدفع
  ===================================================== */

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "cash":
        return "نقدًا";

      case "bank":
        return "حوالة بنكية";

      case "credit":
        return "آجل";

      default:
        return method || "-";
    }
  };

  /* =====================================================
     حالة الفاتورة
  ===================================================== */

  const getStatusName = (status: string) => {
    switch (status) {
      case "paid":
        return "مدفوعة";

      case "pending":
        return "معلقة";

      case "cancelled":
        return "ملغاة";

      default:
        return status || "-";
    }
  };

  /* =====================================================
     أثناء انتظار LocalStorage
  ===================================================== */

  if (!hydrated) {
    return (
      <>
        <main dir="rtl" className="min-h-screen bg-white">
          <div className="mx-auto mt-6 min-h-[297mm] w-[210mm] border border-gray-300 bg-white" />
        </main>

        <style jsx global>{`
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
        `}</style>
      </>
    );
  }

  /* =====================================================
     إذا لم توجد الفاتورة
  ===================================================== */

  if (!sale) {
    return (
      <>
        <main
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-gray-100"
        >
          <div className="min-h-[100mm] w-[210mm] rounded-lg border border-gray-300 bg-white p-10 text-center shadow-sm">
            <h1 className="text-lg font-bold text-gray-800">
              لم يتم العثور على الفاتورة
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              رقم الفاتورة المطلوبة غير موجود في بيانات المبيعات.
            </p>

            <p className="mt-2 text-xs text-gray-400">{saleId}</p>
          </div>
        </main>

        <style jsx global>{`
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
        `}</style>
      </>
    );
  }

  /* =====================================================
     بيانات الفاتورة
  ===================================================== */

  const items = sale.items || [];

  /* =====================================================
     معلومات الحساب حسب طريقة الدفع
  ===================================================== */

  const getPaymentAccountTitle = () => {
    switch (sale.paymentMethod) {
      case "cash":
        return "حساب الدفع";

      case "bank":
        return "حساب البنك";

      case "credit":
        return "حساب العميل";

      default:
        return "الحساب";
    }
  };

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-gray-200 py-6 print:bg-white print:p-0"
      >
        {/* =====================================================
            ورقة A4
        ===================================================== */}

        <div className="mx-auto min-h-[297mm] w-[210mm] border border-gray-300 bg-white px-[12mm] py-[10mm] shadow-lg print:min-h-[297mm] print:w-[210mm] print:border-0 print:shadow-none">
          {/* =====================================================
              رأس الشركة
          ===================================================== */}

          <div className="border-b-2 border-gray-800 pb-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">شركة الجابري</h1>

              <p className="mt-1 text-sm font-semibold">
                للعسل والزيوت الطبيعة وخدمات العمرة
              </p>

              <p className="mt-1 text-xs text-gray-600">البيضاء - اليمن</p>

              <p className="mt-1 text-xs">هاتف: 734 434 443</p>
            </div>
          </div>

          {/* =====================================================
              عنوان الفاتورة
          ===================================================== */}

          <div className="mt-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">فاتورة مبيعات</h2>

              <p className="mt-1 text-xs text-gray-500">فاتورة أصلية</p>
            </div>

            <div className="rounded-md border border-gray-300 px-4 py-3 text-left">
              <p className="text-[10px] text-gray-500">رقم الفاتورة</p>

              <p className="text-sm font-bold">{sale.invoiceNumber}</p>

              <p className="mt-2 text-[10px] text-gray-500">التاريخ</p>

              <p className="text-xs font-semibold">{sale.date}</p>
            </div>
          </div>

          {/* =====================================================
              بيانات العميل والدفع
          ===================================================== */}

          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* بيانات العميل */}

            <div className="rounded-md border border-gray-300 p-3">
              <p className="mb-2 text-[10px] font-bold text-gray-500">
                بيانات العميل
              </p>

              <p className="text-sm font-bold">
                {sale.customerName || "عميل نقدي"}
              </p>

              <p className="mt-2 text-xs">
                كود الحساب: {sale.accountCode || "-"}
              </p>

              <p className="mt-1 text-xs">
                اسم الحساب: {sale.accountName || "-"}
              </p>
            </div>

            {/* معلومات الدفع */}

            <div className="rounded-md border border-gray-300 p-3">
              <p className="mb-2 text-[10px] font-bold text-gray-500">
                معلومات الدفع
              </p>

              <p className="text-sm font-bold">
                {getPaymentMethodName(sale.paymentMethod)}
              </p>

              <p className="mt-2 text-xs">
                الحالة: {getStatusName(sale.status)}
              </p>

              {sale.accountCode && (
                <p className="mt-1 text-xs">
                  {getPaymentAccountTitle()}: {sale.accountCode}
                </p>
              )}

              {sale.accountName && (
                <p className="mt-1 text-xs text-gray-600">{sale.accountName}</p>
              )}
            </div>
          </div>

          {/* =====================================================
              تنبيه البيع الآجل
          ===================================================== */}

          {sale.paymentMethod === "credit" && (
            <div className="mt-4 rounded-md border border-gray-300 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500">
                    نوع العملية
                  </p>

                  <p className="mt-1 text-xs font-bold text-gray-800">
                    بيع آجل
                  </p>
                </div>

                <div className="text-left">
                  <p className="text-[10px] text-gray-500">المبلغ المستحق</p>

                  <p className="mt-1 text-sm font-bold">
                    {formatMoney(Number(sale.total || 0))} ريال
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              جدول الأصناف
          ===================================================== */}

          <div className="mt-6 overflow-hidden rounded-md border border-gray-400">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">
                    #
                  </th>

                  <th className="border border-gray-300 px-3 py-2 text-right text-xs">
                    الصنف
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">
                    الكمية
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">
                    سعر الوحدة
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">
                    الخصم
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">
                    الإجمالي
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-gray-300 px-3 py-8 text-center text-xs text-gray-500"
                    >
                      لا توجد أصناف في الفاتورة
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                        {index + 1}
                      </td>

                      <td className="border border-gray-300 px-3 py-2 text-xs">
                        <div className="font-semibold">{item.item}</div>

                        {item.productCode && (
                          <div className="mt-0.5 text-[9px] text-gray-400">
                            كود الصنف: {item.productCode}
                          </div>
                        )}
                      </td>

                      <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                        {item.quantity}
                      </td>

                      <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                        {formatMoney(item.price)}
                      </td>

                      <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                        {formatMoney(item.discount)}
                      </td>

                      <td className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">
                        {formatMoney(item.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* =====================================================
              الإجماليات
          ===================================================== */}

          <div className="mt-5 flex justify-end">
            <div className="w-[300px] overflow-hidden rounded-md border border-gray-300">
              <div className="flex justify-between border-b border-gray-200 px-4 py-2 text-xs">
                <span>الإجمالي قبل الخصم</span>

                <span className="font-semibold">
                  {formatMoney(Number(sale.subtotal || 0))}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-200 px-4 py-2 text-xs">
                <span>الخصم</span>

                <span>{formatMoney(Number(sale.discount || 0))}</span>
              </div>

              <div className="flex justify-between bg-gray-100 px-4 py-3 text-sm font-bold">
                <span>الإجمالي النهائي</span>

                <span>{formatMoney(Number(sale.total || 0))}</span>
              </div>
            </div>
          </div>

          {/* =====================================================
              إجمالي الكمية
          ===================================================== */}

          <div className="mt-4 flex justify-end">
            <div className="text-xs">
              إجمالي الكمية:{" "}
              <span className="font-bold">{sale.totalQuantity}</span>
            </div>
          </div>

          {/* =====================================================
              الملاحظات
          ===================================================== */}

          {sale.notes && (
            <div className="mt-5 rounded-md border border-gray-300 p-3">
              <p className="text-[10px] font-bold text-gray-500">ملاحظات</p>

              <p className="mt-1 text-xs">{sale.notes}</p>
            </div>
          )}

          {/* =====================================================
              التوقيعات
          ===================================================== */}

          <div className="mt-20 grid grid-cols-2 gap-20 text-center">
            <div>
              <div className="mx-auto mb-2 w-40 border-b border-gray-400" />

              <p className="text-xs">توقيع العميل</p>
            </div>

            <div>
              <div className="mx-auto mb-2 w-40 border-b border-gray-400" />

              <p className="text-xs">توقيع المسؤول</p>
            </div>
          </div>

          {/* =====================================================
              التذييل
          ===================================================== */}

          <div className="mt-10 border-t border-gray-300 pt-3 text-center">
            <p className="text-xs font-semibold">شركة الجابري</p>

            <p className="mt-1 text-[10px] text-gray-500">
              للعسل والزيوت الطبيعة وخدمات العمرة
            </p>

            <p className="mt-1 text-[10px] text-gray-500">
              البيضاء - اليمن | 734 434 443
            </p>
          </div>
        </div>
      </main>

      {/* =====================================================
          إعدادات الطباعة
      ===================================================== */}

      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        html,
        body {
          margin: 0;
          padding: 0;
        }

        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          * {
            box-shadow: none !important;
          }

          main {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}
