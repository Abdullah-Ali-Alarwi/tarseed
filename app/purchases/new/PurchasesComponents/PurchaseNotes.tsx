"use client";

import type { TaxMode } from "../types";

interface PurchaseTotalsProps {
  subtotal: number;
  totalDiscount: number;
  tax: number;
  grandTotal: number;
  taxMode: TaxMode;
  taxRate: number;
  formatMoney: (value: number) => string;
}

export default function PurchaseTotals({
  subtotal,
  totalDiscount,
  tax,
  grandTotal,
  taxMode,
  taxRate,
  formatMoney,
}: PurchaseTotalsProps) {
  const afterDiscount = Math.max(0, subtotal - totalDiscount);

  return (
    <section className="border-t bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-md space-y-2 text-sm">
        {/* الإجمالي قبل الخصم */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">الإجمالي قبل الخصم</span>

          <span className="font-semibold text-gray-800">
            {formatMoney(subtotal)} ريال
          </span>
        </div>

        {/* الخصم */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">الخصم</span>

          <span className="font-semibold text-red-600">
            {formatMoney(totalDiscount)} ريال
          </span>
        </div>

        {/* بعد الخصم */}
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-gray-600">الإجمالي بعد الخصم</span>

          <span className="font-semibold text-gray-800">
            {formatMoney(afterDiscount)} ريال
          </span>
        </div>

        {/* الضريبة */}
        {taxMode === "tax" && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">الضريبة ({taxRate}%)</span>

            <span className="font-semibold text-orange-600">
              {formatMoney(tax)} ريال
            </span>
          </div>
        )}

        {/* الإجمالي النهائي */}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3 text-white">
          <span className="font-bold">الإجمالي النهائي</span>

          <span className="text-lg font-bold">
            {formatMoney(grandTotal)} ريال
          </span>
        </div>
      </div>
    </section>
  );
}
