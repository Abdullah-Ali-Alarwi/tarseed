"use client";

import { useParams } from "next/navigation";
import { useSalesStore } from "@/Store/salesStore";
import SalesInvoice from "@/components/invoices/SalesInvoice";

export default function SalesInvoicePage() {
  const params = useParams();

  const sales = useSalesStore((state) => state.sales);

  const sale = sales.find((item) => String(item.id) === String(params.id));

  if (!sale) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <h1 className="text-sm font-bold text-gray-800">
            الفاتورة غير موجودة
          </h1>

          <p className="mt-2 text-xs text-gray-500">
            لم يتم العثور على الفاتورة المطلوبة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SalesInvoice
      invoiceNumber={sale.invoiceNumber}
      date={sale.date}
      customer={sale.accountName}
      accountName={sale.accountName}
      accountCode={sale.accountCode}
      paymentMethod={sale.paymentMethod}
      status={sale.status}
      total={sale.total}
      subtotal={sale.subtotal}
      discount={sale.discount}
      items={sale.items ?? []}
    />
  );
}
