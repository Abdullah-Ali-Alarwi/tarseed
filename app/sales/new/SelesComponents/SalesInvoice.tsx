"use client";

import type { InvoiceItem } from "./AddItems";

interface SalesInvoiceProps {
  invoiceNumber?: string;
  date?: string;
  customerName?: string;
  paymentMethod?: string;
  accountName?: string;
  items: InvoiceItem[];
}

export default function SalesInvoice({
  invoiceNumber = "INV-1001",
  date = new Date().toLocaleDateString("ar-YE"),
  customerName = "عميل نقدي",
  paymentMethod = "نقدًا",
  accountName = "1002 - الصندوق",
  items,
}: SalesInvoiceProps) {
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );

  const totalDiscount = items.reduce(
    (sum, item) => sum + Number(item.discount || 0),
    0,
  );

  const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-YE").format(value);
  };

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-[794px] bg-white text-gray-900"
    >
      {/* =====================================================
          رأس الفاتورة
      ===================================================== */}

      <div className="border-2 border-gray-800">
        <div className="flex items-center justify-between border-b-2 border-gray-800 px-6 py-5">
          {/* الشركة */}

          <div className="text-right">
            <h1 className="text-2xl font-bold">شركة الجابري</h1>

            <p className="mt-1 text-sm">للعسل والزيوت الطبيعة وخدمات العمرة</p>

            <p className="mt-1 text-sm">البيضاء - اليمن</p>

            <p className="mt-1 text-sm">هاتف: 734 434 443</p>
          </div>

          {/* عنوان الفاتورة */}

          <div className="text-center">
            <div className="mb-2 inline-block rounded border-2 border-gray-800 px-6 py-2">
              <h2 className="text-xl font-bold">فاتورة مبيعات</h2>
            </div>

            <p className="text-sm">
              رقم الفاتورة: <span className="font-bold">{invoiceNumber}</span>
            </p>

            <p className="mt-1 text-sm">
              التاريخ: <span className="font-bold">{date}</span>
            </p>
          </div>
        </div>

        {/* =====================================================
            بيانات العميل
        ===================================================== */}

        <div className="grid grid-cols-3 border-b-2 border-gray-800">
          <div className="border-l border-gray-800 p-3">
            <p className="mb-1 text-xs text-gray-500">العميل</p>

            <p className="font-bold">{customerName}</p>
          </div>

          <div className="border-l border-gray-800 p-3">
            <p className="mb-1 text-xs text-gray-500">طريقة الدفع</p>

            <p className="font-bold">{paymentMethod}</p>
          </div>

          <div className="p-3">
            <p className="mb-1 text-xs text-gray-500">الحساب</p>

            <p className="font-bold">{accountName}</p>
          </div>
        </div>

        {/* =====================================================
            جدول الأصناف
        ===================================================== */}

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
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  لا توجد أصناف في الفاتورة
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border-b border-l border-gray-800 px-2 py-3 text-center">
                    {index + 1}
                  </td>

                  <td className="border-b border-l border-gray-800 px-3 py-3">
                    {item.item}
                  </td>

                  <td className="border-b border-l border-gray-800 px-2 py-3 text-center">
                    {item.quantity}
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

        {/* =====================================================
            ملخص الفاتورة
        ===================================================== */}

        <div className="flex justify-between border-b-2 border-gray-800">
          <div className="w-1/2 p-4">
            <p className="mb-2 font-bold">ملاحظات</p>

            <div className="h-16 rounded border border-dashed border-gray-400" />
          </div>

          <div className="w-1/2 border-r-2 border-gray-800">
            <div className="flex justify-between border-b border-gray-300 px-4 py-2">
              <span>إجمالي الكمية</span>
              <span className="font-bold">{formatMoney(totalQuantity)}</span>
            </div>

            <div className="flex justify-between border-b border-gray-300 px-4 py-2">
              <span>الإجمالي قبل الخصم</span>
              <span className="font-bold">{formatMoney(subtotal)}</span>
            </div>

            <div className="flex justify-between border-b border-gray-300 px-4 py-2">
              <span>إجمالي الخصم</span>
              <span className="font-bold">{formatMoney(totalDiscount)}</span>
            </div>

            <div className="flex justify-between bg-gray-100 px-4 py-4 text-lg">
              <span className="font-bold">صافي الفاتورة</span>

              <span className="font-bold">{formatMoney(total)} ريال</span>
            </div>
          </div>
        </div>

        {/* =====================================================
            أسفل الفاتورة
        ===================================================== */}

        <div className="px-6 py-5 text-center">
          <p className="font-bold">شركة الجابري</p>

          <p className="mt-1 text-xs text-gray-600">
            الجابري للعسل والزيوت الطبيعة وخدمات العمرة
          </p>

          <p className="mt-2 text-xs text-gray-500">شكرًا لتعاملكم معنا</p>
        </div>
      </div>
    </div>
  );
}
