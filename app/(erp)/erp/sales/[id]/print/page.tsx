"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: string;
  companyId: string;
  invoiceNumber?: string;
  customerName?: string;
  customerId?: string;
  warehouseName?: string;
  date?: string;
  items?: any[];
  subtotal?: number;
  total?: number;
  totalAmount?: number;
  grandTotal?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod?: string;
  paymentAccountName?: string;
  status?: string;
  notes?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdAt?: string;
};

type Company = {
  name?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
};

const money = (value: any) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateFormat = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function PrintSalePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        throw new Error("يرجى تسجيل الدخول أولاً");
      }

      const user = JSON.parse(storedUser);
      const companyId = user.companyId;

      if (!companyId) {
        throw new Error("لم يتم العثور على الشركة");
      }

      const [saleResult, companyResult] = await Promise.all([
        supabase
          .from("sales")
          .select("*")
          .eq("id", id)
          .eq("companyId", companyId)
          .single(),

        supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .maybeSingle(),
      ]);

      if (saleResult.error) throw saleResult.error;

      setSale(saleResult.data as Sale);
      setCompany(companyResult.data as Company | null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "تعذر تحميل الفاتورة");
    } finally {
      setLoading(false);
    }
  };

  const items = Array.isArray(sale?.items) ? sale.items : [];

  const total = Number(
    sale?.grandTotal ?? sale?.totalAmount ?? sale?.total ?? 0,
  );

  const paid = Number(sale?.paidAmount || 0);

  const remaining =
    sale?.remainingAmount != null
      ? Number(sale.remainingAmount)
      : Math.max(total - paid, 0);

  const getName = (item: any) =>
    item.productName || item.name || item.product?.name || "صنف بدون اسم";

  const getQuantity = (item: any) => Number(item.quantity ?? item.qty ?? 0);

  const getPrice = (item: any) =>
    Number(item.unitPrice ?? item.sellingPrice ?? item.price ?? 0);

  const getItemTotal = (item: any) =>
    Number(item.total ?? item.totalPrice ?? getQuantity(item) * getPrice(item));

  const companyName =
    company?.companyName || company?.name || userCompanyName();

  function userCompanyName() {
    try {
      const user = JSON.parse(localStorage.getItem("authUser") || "{}");

      return user.companyname || user.companyName || "اسم المنشأة";
    } catch {
      return "اسم المنشأة";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        جاري تجهيز الفاتورة للطباعة...
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div dir="rtl" className="p-10 text-center">
        <p className="mb-5 text-red-600">{error || "الفاتورة غير موجودة"}</p>

        <button
          onClick={() => router.back()}
          className="rounded-lg bg-[#0E1F33] px-5 py-2 text-white"
        >
          العودة
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 py-8">
      {/* Toolbar */}
      <div className="mx-auto mb-5 flex max-w-[210mm] justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="rounded-lg border bg-white px-5 py-2 text-sm"
        >
          العودة
        </button>

        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#0E1F33] px-6 py-2 text-sm font-semibold text-white"
        >
          طباعة الفاتورة
        </button>
      </div>

      {/* A4 Invoice */}
      <main
        id="print-invoice"
        className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white p-8 shadow-lg md:p-12"
      >
        {/* Header */}
        <header className="flex items-start justify-between border-b-2 border-[#0E1F33] pb-7">
          <div>
            <h1 className="text-2xl font-bold text-[#0E1F33]">{companyName}</h1>

            <div className="mt-3 space-y-1 text-sm text-gray-500">
              {company?.address && <p>{company.address}</p>}

              {company?.phone && <p>الهاتف: {company.phone}</p>}

              {company?.email && <p>{company.email}</p>}

              {company?.taxNumber && <p>الرقم الضريبي: {company.taxNumber}</p>}
            </div>
          </div>

          <div className="text-left">
            <div className="text-xs font-bold tracking-widest text-gray-400">
              WEZZAN ERP
            </div>

            <h2 className="mt-2 text-2xl font-black text-[#0E1F33]">
              فاتورة مبيعات
            </h2>

            <p className="mt-2 text-sm font-bold" dir="ltr">
              {sale.invoiceNumber || sale.id}
            </p>
          </div>
        </header>

        {/* Invoice Information */}
        <section className="my-7 grid grid-cols-2 gap-5 rounded-xl bg-gray-50 p-5">
          <div>
            <p className="mb-2 text-xs text-gray-400">فاتورة إلى</p>

            <p className="font-bold text-gray-800">
              {sale.customerName || "عميل نقدي"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-gray-400">تاريخ الفاتورة</p>

            <p className="font-bold text-gray-800">{dateFormat(sale.date)}</p>
          </div>

          <div>
            <p className="mb-2 text-xs text-gray-400">المستودع</p>

            <p className="font-bold text-gray-800">
              {sale.warehouseName || "—"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-gray-400">طريقة الدفع</p>

            <p className="font-bold text-gray-800">
              {sale.paymentMethod || "—"}
            </p>
          </div>
        </section>

        {/* Items Table */}
        <section className="mb-8">
          <h3 className="mb-4 text-base font-bold text-[#0E1F33]">
            تفاصيل الأصناف
          </h3>

          <table className="w-full border-collapse text-right text-sm">
            <thead>
              <tr className="bg-[#0E1F33] text-white">
                <th className="border border-[#0E1F33] px-3 py-3">#</th>
                <th className="border border-[#0E1F33] px-3 py-3">الصنف</th>
                <th className="border border-[#0E1F33] px-3 py-3">الكمية</th>
                <th className="border border-[#0E1F33] px-3 py-3">السعر</th>
                <th className="border border-[#0E1F33] px-3 py-3">الإجمالي</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-200 px-3 py-3">
                    {index + 1}
                  </td>

                  <td className="border border-gray-200 px-3 py-3 font-semibold">
                    {getName(item)}

                    {item.sku && (
                      <div className="mt-1 text-xs text-gray-400">
                        {item.sku}
                      </div>
                    )}
                  </td>

                  <td className="border border-gray-200 px-3 py-3">
                    {money(getQuantity(item))}
                    {item.unitName ? ` ${item.unitName}` : ""}
                  </td>

                  <td className="border border-gray-200 px-3 py-3">
                    {money(getPrice(item))}
                  </td>

                  <td className="border border-gray-200 px-3 py-3 font-bold">
                    {money(getItemTotal(item))}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-200 py-8 text-center text-gray-400"
                  >
                    لا توجد أصناف
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="flex justify-end">
          <div className="w-full max-w-[320px] space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">المجموع الفرعي</span>

              <span className="font-semibold">
                {money(sale.subtotal ?? sale.total ?? total)}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="font-bold">الإجمالي النهائي</span>

              <span className="text-xl font-black text-[#0E1F33]">
                {money(total)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">المدفوع</span>

              <span className="font-bold text-green-700">{money(paid)}</span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="font-bold">المتبقي</span>

              <span className="font-bold text-red-600">{money(remaining)}</span>
            </div>
          </div>
        </section>

        {/* Notes */}
        {sale.notes && (
          <section className="mt-8 rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 font-bold text-[#0E1F33]">ملاحظات</h3>

            <p className="text-sm leading-7 text-gray-600">{sale.notes}</p>
          </section>
        )}

        {/* Signatures */}
        <section className="mt-16 grid grid-cols-2 gap-12 text-center">
          <div>
            <div className="mb-10 border-b border-gray-300" />
            <p className="text-sm font-semibold text-gray-600">توقيع المستلم</p>
          </div>

          <div>
            <div className="mb-10 border-b border-gray-300" />
            <p className="text-sm font-semibold text-gray-600">توقيع المسؤول</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200 pt-5 text-center">
          <p className="text-xs text-gray-400">شكراً لتعاملكم معنا</p>

          <p className="mt-2 text-[10px] text-gray-300">
            تم إصدار هذه الفاتورة بواسطة نظام Wezzan ERP
          </p>
        </footer>
      </main>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden;
          }

          #print-invoice,
          #print-invoice * {
            visibility: visible;
          }

          #print-invoice {
            position: absolute;
            top: 0;
            right: 0;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 12mm;
            box-shadow: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
