interface PurchaseTotalsProps {
  subtotal: number;
  totalDiscount: number;
  tax: number;
  grandTotal: number;
  taxMode: "none" | "tax";
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
  return (
    <div className="px-4 pb-4">
      <div className="flex justify-end">
        <div className="w-full md:w-80 border border-gray-200 rounded-lg overflow-hidden text-xs">
          <div className="flex justify-between px-3 py-2 border-b">
            <span className="text-gray-500">الإجمالي قبل الخصم</span>

            <span className="font-semibold">
              {formatMoney(subtotal + totalDiscount)} ريال
            </span>
          </div>

          <div className="flex justify-between px-3 py-2 border-b">
            <span className="text-gray-500">الخصم</span>

            <span className="font-semibold text-red-600">
              - {formatMoney(totalDiscount)} ريال
            </span>
          </div>

          <div className="flex justify-between px-3 py-2 border-b">
            <span className="text-gray-500">الإجمالي قبل الضريبة</span>

            <span className="font-semibold">{formatMoney(subtotal)} ريال</span>
          </div>

          <div className="flex justify-between px-3 py-2 border-b">
            <span className="text-gray-500">
              {taxMode === "tax"
                ? `ضريبة القيمة المضافة (${taxRate}%)`
                : "الضريبة"}
            </span>

            <span
              className={
                taxMode === "tax"
                  ? "font-semibold text-amber-600"
                  : "font-semibold text-gray-400"
              }
            >
              {taxMode === "tax" ? `${formatMoney(tax)} ريال` : "بدون ضريبة"}
            </span>
          </div>

          <div className="flex justify-between items-center px-3 py-3 bg-blue-50">
            <span className="font-bold">الإجمالي النهائي</span>

            <span className="text-base font-bold text-blue-600">
              {formatMoney(grandTotal)} ريال
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
