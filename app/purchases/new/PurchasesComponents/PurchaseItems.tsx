"use client";

import { FiPlus, FiTrash2 } from "react-icons/fi";
import type { PurchaseFormItem } from "../types";

interface Product {
  id: string;
  code: string;
  name: string;
  unit?: string;
}

interface PurchaseItemsProps {
  items: PurchaseFormItem[];
  products: Product[];
  getItemTotal: (item: PurchaseFormItem) => number;
  formatMoney: (value: number) => string;
  getProduct: (id: string) => Product | undefined;
  onAddItem: () => void;
  onRemoveItem: (id: number) => void;
  onUpdateItem: (
    id: number,
    field: keyof PurchaseFormItem,
    value: string,
  ) => void;
}

export default function PurchaseItems({
  items,
  products,
  getItemTotal,
  formatMoney,
  getProduct,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: PurchaseItemsProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800">تفاصيل المشتريات</h3>

          <p className="text-[11px] text-gray-400">
            السعر والكمية يتم تحديدهما عند الشراء.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold"
        >
          <FiPlus size={15} />
          إضافة صنف
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-2 text-xs w-10">#</th>

              <th className="border px-2 py-2 text-right text-xs">الصنف</th>

              <th className="border px-2 py-2 text-xs">الوحدة</th>

              <th className="border px-2 py-2 text-xs">الكمية</th>

              <th className="border px-2 py-2 text-xs">سعر الشراء</th>

              <th className="border px-2 py-2 text-xs">الخصم %</th>

              <th className="border px-2 py-2 text-xs">الإجمالي</th>

              <th className="border px-2 py-2 text-xs">حذف</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              const product = getProduct(item.productId);

              return (
                <tr key={item.id}>
                  <td className="border px-2 py-2 text-center text-xs">
                    {index + 1}
                  </td>

                  <td className="border px-2 py-2">
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        onUpdateItem(item.id, "productId", e.target.value)
                      }
                      className="w-full h-9 px-2 border rounded-md text-xs outline-none"
                    >
                      <option value="">اختر الصنف</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="border px-2 py-2 text-center text-xs">
                    {product?.unit || "-"}
                  </td>

                  <td className="border px-2 py-2">
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateItem(item.id, "quantity", e.target.value)
                      }
                      className="w-20 h-9 px-2 border rounded-md text-xs text-center"
                    />
                  </td>

                  <td className="border px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        onUpdateItem(item.id, "price", e.target.value)
                      }
                      className="w-24 h-9 px-2 border rounded-md text-xs text-center"
                    />
                  </td>

                  <td className="border px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) =>
                        onUpdateItem(item.id, "discount", e.target.value)
                      }
                      className="w-20 h-9 px-2 border rounded-md text-xs text-center"
                    />
                  </td>

                  <td className="border px-2 py-2 text-center text-xs font-bold whitespace-nowrap">
                    {formatMoney(getItemTotal(item))} ريال
                  </td>

                  <td className="border px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      disabled={items.length === 1}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
