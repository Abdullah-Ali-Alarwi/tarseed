"use client";

import { FiTruck } from "react-icons/fi";
import type { PaymentMethod } from "../types";

interface Supplier {
  id: string;
  name: string;
  phone?: string;
}

interface PurchaseSupplierProps {
  suppliers: Supplier[];
  supplierId: string;
  paymentMethod: PaymentMethod;
  selectedSupplier?: Supplier;
  onSupplierChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
}

export default function PurchaseSupplier({
  suppliers,
  supplierId,
  paymentMethod,
  selectedSupplier,
  onSupplierChange,
  onPaymentMethodChange,
}: PurchaseSupplierProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <FiTruck size={17} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800">بيانات المورد</h3>

          <p className="text-[11px] text-gray-400">اختر المورد وطريقة الدفع.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            المورد
          </label>

          <select
            value={supplierId}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
          >
            <option value="">اختر المورد</option>

            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          {selectedSupplier?.phone && (
            <p className="text-[11px] text-gray-400 mt-1">
              الهاتف: {selectedSupplier.phone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            طريقة الدفع
          </label>

          <select
            value={paymentMethod}
            onChange={(e) =>
              onPaymentMethodChange(e.target.value as PaymentMethod)
            }
            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
          >
            <option value="cash">نقدي</option>
            <option value="credit">آجل</option>
            <option value="bank">تحويل بنكي</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            حالة الفاتورة
          </label>

          <div className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center text-sm">
            {paymentMethod === "credit" ? "آجلة" : "مدفوعة"}
          </div>
        </div>
      </div>
    </div>
  );
}
