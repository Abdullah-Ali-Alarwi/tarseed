"use client";

import { FiPrinter, FiFileText } from "react-icons/fi";

type SalesInvoiceItem = {
  id?: string | number;
  item?: string;
  name?: string;
  quantity?: number;
  price?: number;
  discount?: number;
  total?: number;
};

type SalesInvoiceProps = {
  invoiceNumber?: string;
  date?: string;
  customer?: string;
  accountName?: string;
  accountCode?: string;
  paymentMethod?: string;
  status?: string;
  items?: SalesInvoiceItem[];
  subtotal?: number;
  discount?: number;
  total?: number;
};

export default function SalesInvoice({
  invoiceNumber = "INV-1001",
  date = "",
  customer = "",
  accountName = "",
  accountCode = "",
  paymentMethod = "نقدي",
  status = "مدفوعة",
  items = [],
  subtotal = 0,
  discount = 0,
  total = 0,
}: SalesInvoiceProps) {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA").format(Number(value || 0));
  };

  const paymentLabel =
    paymentMethod === "cash"
      ? "نقدي"
      : paymentMethod === "bank"
        ? "تحويل بنكي"
        : paymentMethod === "credit"
          ? "آجل"
          : paymentMethod || "-";

  const calculatedSubtotal =
    subtotal ||
    items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0,
    );

  const calculatedDiscount =
    discount ||
    items.reduce((sum, item) => sum + Number(item.discount || 0), 0);

  const calculatedTotal =
    total || Math.max(calculatedSubtotal - calculatedDiscount, 0);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-4">
      {/* =====================================================
          أزرار الصفحة - لا تظهر أثناء الطباعة
      ====================================================== */}

      <div className="mx-auto mb-4 flex max-w-[850px] justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPrinter size={15} />
          طباعة الفاتورة
        </button>
      </div>

      {/* =====================================================
          الفاتورة
      ====================================================== */}

      <div
        id="sales-invoice"
        className="invoice-page mx-auto w-full max-w-[850px] bg-white p-8 text-gray-800 shadow-sm print:max-w-none print:p-6 print:shadow-none"
      >
        {/* =====================================================
            رأس الفاتورة
        ====================================================== */}

        <div className="border-b-2 border-gray-800 pb-4">
          <div className="flex items-start justify-between gap-5">
            {/* بيانات الشركة */}

            <div className="text-right">
              <h1 className="text-2xl font-black text-gray-900">
                شركة الجابري
              </h1>

              <p className="mt-1 text-sm font-semibold text-gray-700">
                للعسل والزيوت الطبيعة وخدمات العمرة
              </p>

              <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                <p>العنوان: البيضاء - اليمن</p>

                <p>الهاتف: 734 434 443</p>
              </div>
            </div>

            {/* عنوان الفاتورة */}

            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-800">
                  <FiFileText size={22} />
                </div>
              </div>

              <h2 className="text-xl font-black">فاتورة مبيعات</h2>

              <p className="mt-1 text-xs text-gray-500">SALES INVOICE</p>
            </div>

            {/* بيانات الفاتورة */}

            <div className="min-w-[170px] text-xs">
              <div className="mb-1 flex justify-between gap-4 border-b border-gray-200 pb-1">
                <span className="font-semibold text-gray-500">
                  رقم الفاتورة
                </span>

                <span className="font-bold">{invoiceNumber}</span>
              </div>

              <div className="mb-1 flex justify-between gap-4 border-b border-gray-200 pb-1">
                <span className="font-semibold text-gray-500">التاريخ</span>

                <span className="font-semibold">{date || "-"}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-semibold text-gray-500">الحالة</span>

                <span className="font-bold">{status || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            بيانات العميل
        ====================================================== */}

        <div className="mt-5 rounded-md border border-gray-300">
          <div className="grid grid-cols-2">
            <div className="border-b border-gray-200 px-4 py-3">
              <span className="block text-[10px] text-gray-500">العميل</span>

              <span className="mt-1 block text-sm font-bold">
                {customer || "-"}
              </span>
            </div>

            <div className="border-b border-r border-gray-200 px-4 py-3">
              <span className="block text-[10px] text-gray-500">الحساب</span>

              <span className="mt-1 block text-sm font-bold">
                {accountName || "-"}
              </span>

              {accountCode && (
                <span className="text-[10px] text-gray-400">
                  كود الحساب: {accountCode}
                </span>
              )}
            </div>

            <div className="px-4 py-3">
              <span className="block text-[10px] text-gray-500">
                طريقة الدفع
              </span>

              <span className="mt-1 block text-sm font-bold">
                {paymentLabel}
              </span>
            </div>

            <div className="border-r border-gray-200 px-4 py-3">
              <span className="block text-[10px] text-gray-500">العملة</span>

              <span className="mt-1 block text-sm font-bold">ريال يمني</span>
            </div>
          </div>
        </div>

        {/* =====================================================
            جدول الأصناف
        ====================================================== */}

        <div className="mt-5 overflow-hidden rounded-md border border-gray-300">
          <table className="w-full border-collapse text-right text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="w-10 border-l border-gray-600 px-2 py-2.5 text-center">
                  #
                </th>

                <th className="border-l border-gray-600 px-3 py-2.5">الصنف</th>

                <th className="w-20 border-l border-gray-600 px-2 py-2.5 text-center">
                  الكمية
                </th>

                <th className="w-28 border-l border-gray-600 px-2 py-2.5 text-center">
                  سعر الوحدة
                </th>

                <th className="w-24 border-l border-gray-600 px-2 py-2.5 text-center">
                  الخصم
                </th>

                <th className="w-32 px-2 py-2.5 text-center">الإجمالي</th>
              </tr>
            </thead>

            <tbody>
              {items.length > 0 ? (
                items.map((item, index) => {
                  const itemSubtotal =
                    Number(item.quantity || 0) * Number(item.price || 0);

                  const itemTotal =
                    item.total !== undefined
                      ? Number(item.total)
                      : Math.max(itemSubtotal - Number(item.discount || 0), 0);

                  return (
                    <tr
                      key={item.id ?? index}
                      className="border-t border-gray-200"
                    >
                      <td className="border-l border-gray-200 px-2 py-2 text-center text-gray-500">
                        {index + 1}
                      </td>

                      <td className="border-l border-gray-200 px-3 py-2 font-semibold">
                        {item.item || item.name || "-"}
                      </td>

                      <td className="border-l border-gray-200 px-2 py-2 text-center">
                        {formatMoney(Number(item.quantity || 0))}
                      </td>

                      <td className="border-l border-gray-200 px-2 py-2 text-center">
                        {formatMoney(Number(item.price || 0))}
                      </td>

                      <td className="border-l border-gray-200 px-2 py-2 text-center text-red-600">
                        {formatMoney(Number(item.discount || 0))}
                      </td>

                      <td className="px-2 py-2 text-center font-bold">
                        {formatMoney(itemTotal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    لا توجد أصناف في الفاتورة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            الملخص
        ====================================================== */}

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-[350px] overflow-hidden rounded-md border border-gray-300">
            <div className="flex justify-between border-b border-gray-200 px-4 py-2.5 text-xs">
              <span className="text-gray-500">الإجمالي قبل الخصم</span>

              <span className="font-bold">
                {formatMoney(calculatedSubtotal)}
              </span>
            </div>

            <div className="flex justify-between border-b border-gray-200 px-4 py-2.5 text-xs">
              <span className="text-gray-500">الخصم</span>

              <span className="font-bold text-red-600">
                {formatMoney(calculatedDiscount)}
              </span>
            </div>

            <div className="flex justify-between bg-gray-800 px-4 py-3 text-sm text-white">
              <span className="font-bold">صافي الفاتورة</span>

              <span className="font-black">
                {formatMoney(calculatedTotal)}
                <span className="mr-1 text-[10px] font-normal">ريال</span>
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            المبلغ كتابة
        ====================================================== */}

        <div className="mt-5 rounded-md border border-dashed border-gray-300 px-4 py-3">
          <p className="text-[10px] text-gray-500">المبلغ المستحق</p>

          <p className="mt-1 text-xs font-bold">
            {formatMoney(calculatedTotal)} ريال يمني
          </p>
        </div>

        {/* =====================================================
            التوقيعات
        ====================================================== */}

        <div className="mt-12 grid grid-cols-2 gap-10 text-center text-xs">
          <div>
            <div className="mx-auto mb-2 h-px w-40 bg-gray-400" />
            <p className="font-semibold text-gray-600">توقيع العميل</p>
          </div>

          <div>
            <div className="mx-auto mb-2 h-px w-40 bg-gray-400" />
            <p className="font-semibold text-gray-600">توقيع المسؤول</p>
          </div>
        </div>

        {/* =====================================================
            تذييل الشركة
        ====================================================== */}

        <div className="mt-10 border-t border-gray-300 pt-3 text-center">
          <p className="text-xs font-bold text-gray-700">
            الجابري للعسل والزيوت الطبيعة وخدمات العمرة
          </p>

          <p className="mt-1 text-[10px] text-gray-400">شكراً لتعاملكم معنا</p>
        </div>
      </div>

      {/* =====================================================
          إعدادات الطباعة
      ====================================================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .invoice-page {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
