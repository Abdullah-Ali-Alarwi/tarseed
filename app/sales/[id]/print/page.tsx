"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";

import { useSalesStore } from "@/Store/salesStore";
import SalesInvoice from "@/app/sales/new/SelesComponents/SalesInvoice";

export default function SalesPrintPage() {
  const params = useParams();

  const invoiceId = useMemo(() => {
    if (!params?.id) return "";

    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params]);

  const invoice = useSalesStore((state) =>
    state.sales.find((sale) => sale.id === invoiceId),
  );

  useEffect(() => {
    if (!invoice) return;

    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, [invoice]);

  if (!invoice) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-100"
      >
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-lg font-bold text-red-600">
            الفاتورة غير موجودة
          </h1>

          <p className="text-sm text-gray-500">
            لم يتم العثور على الفاتورة المطلوبة.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }

        @media screen {
          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
          }
        }
      `}</style>

      <main dir="rtl" className="min-h-screen bg-gray-200 py-5">
        <div className="no-print mb-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow hover:bg-blue-700"
          >
            طباعة الفاتورة
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-bold text-gray-700 shadow hover:bg-gray-50"
          >
            إغلاق
          </button>
        </div>

        <div className="print-page bg-white shadow-xl">
          <SalesInvoice
            invoiceNumber={invoice.invoiceNumber}
            date={invoice.date}
            customerName={invoice.customerName ?? "عميل نقدي"}
            paymentMethod={invoice.paymentMethod}
            accountName={invoice.accountName ?? "الصندوق"}
            items={invoice.items ?? []}
          />
        </div>
      </main>
    </>
  );
}
