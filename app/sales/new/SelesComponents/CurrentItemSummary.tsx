"use client";

interface CurrentItemSummaryProps {
  subtotal: number;
  itemTotal: number;
  discount: number;
}

export default function CurrentItemSummary({
  subtotal,
  itemTotal,
  discount,
}: CurrentItemSummaryProps) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/70 px-3 py-2">
      {/* قبل الخصم */}

      <div className="flex min-w-[145px] items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
        <span className="text-[10px] text-gray-500">قبل الخصم</span>

        <span className="text-xs font-bold text-gray-700">
          {subtotal.toLocaleString()}
        </span>
      </div>

      {/* إجمالي الصنف */}

      <div className="flex min-w-[145px] items-center justify-between gap-3 rounded-md bg-blue-50 px-2.5 py-1.5">
        <span className="text-[10px] text-gray-500">إجمالي الصنف</span>

        <span className="text-xs font-bold text-blue-600">
          {itemTotal.toLocaleString()}
        </span>
      </div>

      {/* الخصم */}

      <div className="flex min-w-[120px] items-center justify-between gap-3 rounded-md bg-red-50 px-2.5 py-1.5">
        <span className="text-[10px] text-gray-500">الخصم</span>

        <span className="text-xs font-bold text-red-600">
          {discount.toLocaleString()}
        </span>
      </div>

      <span className="self-center text-[9px] text-gray-400">ريال</span>
    </div>
  );
}
