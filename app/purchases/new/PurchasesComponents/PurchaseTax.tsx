"use client";

import { FiPercent } from "react-icons/fi";
import type { TaxMode } from "../types";

interface PurchaseTaxProps {
  taxMode: TaxMode;
  taxRate: number;
  tax: number;
  onTaxModeChange: (value: TaxMode) => void;
  onTaxRateChange: (value: string) => void;
  formatMoney: (value: number) => string;
}

export default function PurchaseTax({
  taxMode,
  taxRate,
  tax,
  onTaxModeChange,
  onTaxRateChange,
  formatMoney,
}: PurchaseTaxProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <FiPercent size={17} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800">
            ضريبة القيمة المضافة
          </h3>

          <p className="text-[11px] text-gray-400">
            إصدار الفاتورة بالضريبة أو بدون ضريبة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            الضريبة
          </label>

          <select
            value={taxMode}
            onChange={(e) => onTaxModeChange(e.target.value as TaxMode)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-500"
          >
            <option value="none">بدون ضريبة</option>
            <option value="tax">مع ضريبة</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            نسبة الضريبة %
          </label>

          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={taxRate}
            disabled={taxMode === "none"}
            onChange={(e) => onTaxRateChange(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            قيمة الضريبة
          </label>

          <div
            className={`w-full h-10 px-3 rounded-lg border flex items-center text-sm font-bold ${
              taxMode === "tax"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            {formatMoney(tax)} ريال
          </div>
        </div>
      </div>
    </div>
  );
}
