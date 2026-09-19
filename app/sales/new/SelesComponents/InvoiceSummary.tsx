"use client";

import { FiDollarSign } from "react-icons/fi";

import type { InvoiceItem } from "./AddItems";

interface InvoiceSummaryProps {
  items: InvoiceItem[];
}

export default function InvoiceSummary({ items }: InvoiceSummaryProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);

  const invoiceTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <section className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* العنوان */}

      <div className="mb-2 flex items-center gap-2">
        <FiDollarSign size={14} className="text-blue-600" />

        <h2 className="text-xs font-bold text-gray-800">ملخص الفاتورة</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* إجمالي الكمية */}

        <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
          <span className="text-[10px] text-gray-500">إجمالي الكمية</span>

          <span className="text-sm font-bold text-gray-800">
            {totalQuantity.toLocaleString()}
          </span>
        </div>

        {/* إجمالي الخصم */}

        <div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2">
          <span className="text-[10px] text-gray-500">إجمالي الخصم</span>

          <span className="text-sm font-bold text-red-600">
            {totalDiscount.toLocaleString()}
          </span>
        </div>

        {/* عدد الأصناف */}

        <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
          <span className="text-[10px] text-gray-500">عدد الأصناف</span>

          <span className="text-sm font-bold text-gray-800">
            {items.length.toLocaleString()}
          </span>
        </div>

        {/* إجمالي الفاتورة */}

        <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2">
          <span className="text-[10px] text-gray-500">إجمالي الفاتورة</span>

          <span className="text-sm font-bold text-blue-600">
            {invoiceTotal.toLocaleString()}

            <span className="mr-1 text-[9px] font-normal">ريال</span>
          </span>
        </div>
      </div>
    </section>
  );
}
