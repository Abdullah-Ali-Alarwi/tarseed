"use client";

import { FiShoppingCart, FiTrash2 } from "react-icons/fi";

import type { InvoiceItem } from "./AddItems";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];

  onDeleteItem: (id: number) => void;
}

export default function InvoiceItemsTable({
  items,
  onDeleteItem,
}: InvoiceItemsTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* رأس الجدول */}

      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <FiShoppingCart size={14} className="text-blue-600" />

          <h2 className="text-xs font-bold text-gray-800">أصناف الفاتورة</h2>
        </div>

        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
          {items.length} صنف
        </span>
      </div>

      {/* لا توجد أصناف */}

      {items.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center text-[11px] text-gray-400">
          لم تتم إضافة أي أصناف بعد
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-right text-[11px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="w-10 px-2 py-2 font-semibold">#</th>

                <th className="px-2 py-2 font-semibold">الصنف</th>

                <th className="w-20 px-2 py-2 font-semibold">الكمية</th>

                <th className="w-28 px-2 py-2 font-semibold">سعر الوحدة</th>

                <th className="w-24 px-2 py-2 font-semibold">الخصم</th>

                <th className="w-28 px-2 py-2 font-semibold">الإجمالي</th>

                <th className="w-16 px-2 py-2 font-semibold">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-t border-gray-100 transition hover:bg-gray-50"
                >
                  <td className="px-2 py-1.5 text-gray-400">{index + 1}</td>

                  <td className="px-2 py-1.5 font-semibold text-gray-800">
                    {item.item}
                  </td>

                  <td className="px-2 py-1.5 text-gray-700">
                    {item.quantity.toLocaleString()}
                  </td>

                  <td className="px-2 py-1.5 text-gray-700">
                    {item.price.toLocaleString()}
                  </td>

                  <td className="px-2 py-1.5 text-red-600">
                    {item.discount.toLocaleString()}
                  </td>

                  <td className="px-2 py-1.5 font-bold text-gray-800">
                    {item.total.toLocaleString()}
                  </td>

                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      title="حذف الصنف"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
