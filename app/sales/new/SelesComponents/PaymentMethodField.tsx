"use client";

import type { PaymentMethod } from "./Buyers";

interface PaymentMethodFieldProps {
  value: PaymentMethod;

  onChange: (value: PaymentMethod) => void;
}

export default function PaymentMethodField({
  value,
  onChange,
}: PaymentMethodFieldProps) {
  return (
    <div className="flex-1">
      <label className="mb-2 block text-sm font-medium">طريقة الدفع</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PaymentMethod)}
        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none focus:border-blue-500"
      >
        <option value="credit">آجل</option>

        <option value="cash">نقدًا</option>

        <option value="bank">حوالة بنكية</option>
      </select>
    </div>
  );
}
