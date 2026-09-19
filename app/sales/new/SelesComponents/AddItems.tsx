"use client";

import { useState } from "react";
import { FiPlus, FiPackage } from "react-icons/fi";
import { toast } from "sonner";
import CurrentItemSummary from "./CurrentItemSummary";
import { useProductsStore } from "@/Store/productsStore";

export type InvoiceItem = {
  id: number;
  item: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
};

interface AddItemsProps {
  onAddItem: (item: InvoiceItem) => void;
}

export default function AddItems({ onAddItem }: AddItemsProps) {
  const { products } = useProductsStore();

  const [selectedItem, setSelectedItem] = useState("");

  const [quantity, setQuantity] = useState("");

  const [price, setPrice] = useState("");

  const [discount, setDiscount] = useState("");

  const subtotal = Number(quantity || 0) * Number(price || 0);

  const itemTotal = Math.max(subtotal - Number(discount || 0), 0);

  const handleAddItem = () => {
    if (!selectedItem) {
      toast.error("يرجى اختيار الصنف");
      return;
    }

    if (Number(quantity) <= 0) {
      toast.error("يرجى إدخال كمية صحيحة");
      return;
    }

    if (Number(price) <= 0) {
      toast.error("يرجى إدخال سعر صحيح");
      return;
    }

    if (Number(discount || 0) > subtotal) {
      toast.error("الخصم لا يمكن أن يكون أكبر من إجمالي الصنف");
      return;
    }

    const newItem: InvoiceItem = {
      id: Date.now(),
      item: selectedItem,
      quantity: Number(quantity),
      price: Number(price),
      discount: Number(discount || 0),
      total: itemTotal,
    };

    onAddItem(newItem);

    toast.success(`تمت إضافة "${selectedItem}" إلى الفاتورة`);

    setSelectedItem("");
    setQuantity("");
    setPrice("");
    setDiscount("");
  };

  return (
    <section className="mb-3 rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* العنوان */}

      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <FiPackage size={15} className="text-blue-600" />

        <h2 className="text-xs font-bold text-gray-800">إضافة صنف جديد</h2>
      </div>

      {/* الحقول */}

      <div className="p-3">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          {/* الصنف */}

          <div className="w-[210px]">
            <label
              htmlFor="item"
              className="mb-1 block text-[10px] font-semibold text-gray-600"
            >
              الصنف
            </label>

            <div className="relative">
              <FiPackage
                size={13}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                id="item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 bg-white pr-7 pl-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              >
                <option value="">اختر الصنف</option>

                {products.map((product) => (
                  <option key={product.id} value={product.name}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* الكمية */}

          <div className="w-[90px]">
            <label
              htmlFor="quantity"
              className="mb-1 block text-[10px] font-semibold text-gray-600"
            >
              الكمية
            </label>

            <input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* السعر */}

          <div className="w-[115px]">
            <label
              htmlFor="price"
              className="mb-1 block text-[10px] font-semibold text-gray-600"
            >
              سعر الوحدة
            </label>

            <input
              id="price"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* الخصم */}

          <div className="w-[95px]">
            <label
              htmlFor="discount"
              className="mb-1 block text-[10px] font-semibold text-gray-600"
            >
              الخصم
            </label>

            <input
              id="discount"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* زر الإضافة */}

        <div className="mt-3 flex justify-start">
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-blue-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <FiPlus size={13} />
            إضافة المنتج
          </button>
        </div>
      </div>

      {/* ملخص الصنف الحالي */}

      <CurrentItemSummary
        subtotal={subtotal}
        itemTotal={itemTotal}
        discount={Number(discount || 0)}
      />
    </section>
  );
}
