"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiPrinter,
  FiEye,
} from "react-icons/fi";
import { useSalesStore } from "@/Store/salesStore";

export default function SalesPage() {
  /* =====================================================
     البحث
  ===================================================== */

  const [search, setSearch] = useState("");

  /* =====================================================
     Store
  ===================================================== */

  const sales = useSalesStore((state) => state.sales);

  /* =====================================================
     البحث في الفواتير
  ===================================================== */

  const filteredSales = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return sales;
    }

    return sales.filter((sale) => {
      const invoiceNumber = sale.invoiceNumber.toLowerCase();

      const customerName = (sale.customerName ?? "").toLowerCase();

      const accountName = (sale.accountName ?? "").toLowerCase();

      const accountCode = (sale.accountCode ?? "").toLowerCase();

      return (
        invoiceNumber.includes(value) ||
        customerName.includes(value) ||
        accountName.includes(value) ||
        accountCode.includes(value)
      );
    });
  }, [sales, search]);

  /* =====================================================
     الإحصائيات
  ===================================================== */

  const statistics = useMemo(() => {
    const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    const paid = sales.filter((sale) => sale.status === "paid");

    const pending = sales.filter((sale) => sale.status === "pending");

    const paidTotal = paid.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0,
    );

    const pendingTotal = pending.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0,
    );

    return {
      count: sales.length,
      total,
      paidCount: paid.length,
      paidTotal,
      pendingCount: pending.length,
      pendingTotal,
    };
  }, [sales]);

  /* =====================================================
     تنسيق المبلغ
  ===================================================== */

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-YE");
  };

  /* =====================================================
     طريقة الدفع
  ===================================================== */

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "cash":
        return "نقدًا";

      case "bank":
        return "حوالة بنكية";

      case "credit":
        return "آجل";

      default:
        return method || "-";
    }
  };

  /* =====================================================
     حالة الفاتورة
  ===================================================== */

  const getStatusName = (status: string) => {
    switch (status) {
      case "paid":
        return "مدفوعة";

      case "pending":
        return "معلقة";

      case "cancelled":
        return "ملغاة";

      default:
        return status || "-";
    }
  };

  /* =====================================================
     الطباعة
  ===================================================== */

  const handlePrint = (id: string) => {
    const printWindow = window.open(`/sales/${id}/print`, "_blank");

    if (!printWindow) {
      // لا يوجد حذف أو تعديل للفاتورة هنا
      console.error("تعذر فتح صفحة الطباعة، يرجى السماح بالنوافذ المنبثقة.");
    }
  };

  /* =====================================================
     الصفحة
  ===================================================== */

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-2 sm:p-3">
      <div className="mx-auto max-w-[1500px]">
        {/* =================================================
            رأس الصفحة
        ================================================= */}

        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-800">المبيعات</h1>

            <p className="mt-0.5 text-[9px] text-gray-500">
              إدارة ومتابعة فواتير المبيعات
            </p>
          </div>

          <Link
            href="/sales/new"
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={14} />
            فاتورة مبيعات جديدة
          </Link>
        </div>

        {/* =================================================
            بطاقات الإحصائيات
        ================================================= */}

        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {/* عدد الفواتير */}

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">عدد الفواتير</p>

                <p className="mt-1 text-base font-bold text-gray-800">
                  {statistics.count}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FiFileText size={15} />
              </div>
            </div>
          </div>

          {/* إجمالي المبيعات */}

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">إجمالي المبيعات</p>

                <p className="mt-1 text-base font-bold text-gray-800">
                  {formatMoney(statistics.total)}
                </p>

                <p className="text-[8px] text-gray-400">ريال</p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <FiDollarSign size={15} />
              </div>
            </div>
          </div>

          {/* المدفوعة */}

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">الفواتير المدفوعة</p>

                <p className="mt-1 text-base font-bold text-green-600">
                  {statistics.paidCount}
                </p>

                <p className="text-[8px] text-gray-400">
                  {formatMoney(statistics.paidTotal)} ريال
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <FiCheckCircle size={15} />
              </div>
            </div>
          </div>

          {/* المعلقة */}

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">الفواتير المعلقة</p>

                <p className="mt-1 text-base font-bold text-orange-500">
                  {statistics.pendingCount}
                </p>

                <p className="text-[8px] text-gray-400">
                  {formatMoney(statistics.pendingTotal)} ريال
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <FiClock size={15} />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            البحث
        ================================================= */}

        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
          <div className="relative">
            <FiSearch
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو اسم العميل أو الحساب..."
              className="h-8 w-full rounded-lg border border-gray-300 bg-gray-50 pr-9 pl-3 text-[10px] outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* =================================================
            جدول المبيعات
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* عنوان الجدول */}

          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <div>
              <h2 className="text-[11px] font-bold text-gray-800">
                فواتير المبيعات
              </h2>

              <p className="mt-0.5 text-[8px] text-gray-500">
                عدد النتائج: {filteredSales.length}
              </p>
            </div>
          </div>

          {/* الجدول */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500">
                  <th className="px-3 py-2.5 font-semibold">رقم الفاتورة</th>

                  <th className="px-3 py-2.5 font-semibold">التاريخ</th>

                  <th className="px-3 py-2.5 font-semibold">العميل</th>

                  <th className="px-3 py-2.5 font-semibold">طريقة الدفع</th>

                  <th className="px-3 py-2.5 font-semibold">الأصناف</th>

                  <th className="px-3 py-2.5 font-semibold">الإجمالي</th>

                  <th className="px-3 py-2.5 font-semibold">الحالة</th>

                  <th className="px-3 py-2.5 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center">
                      <FiFileText
                        size={28}
                        className="mx-auto mb-2 text-gray-300"
                      />

                      <p className="text-[11px] font-semibold text-gray-500">
                        لا توجد فواتير
                      </p>

                      <p className="mt-1 text-[9px] text-gray-400">
                        لم يتم العثور على فواتير مطابقة للبحث
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      {/* رقم الفاتورة */}

                      <td className="px-3 py-2">
                        <div className="text-[10px] font-bold text-blue-600">
                          {sale.invoiceNumber}
                        </div>
                      </td>

                      {/* التاريخ */}

                      <td className="px-3 py-2 text-[9px] text-gray-600">
                        {sale.date}
                      </td>

                      {/* العميل */}

                      <td className="px-3 py-2">
                        <div className="text-[10px] font-semibold text-gray-800">
                          {sale.customerName || "عميل نقدي"}
                        </div>

                        {sale.accountName && (
                          <div className="mt-0.5 text-[8px] text-gray-400">
                            {sale.accountCode ? `${sale.accountCode} - ` : ""}
                            {sale.accountName}
                          </div>
                        )}
                      </td>

                      {/* طريقة الدفع */}

                      <td className="px-3 py-2">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[9px] font-medium text-gray-600">
                          {getPaymentMethodName(sale.paymentMethod)}
                        </span>
                      </td>

                      {/* عدد الأصناف */}

                      <td className="px-3 py-2 text-[9px] text-gray-600">
                        {sale.items.length}
                      </td>

                      {/* الإجمالي */}

                      <td className="px-3 py-2">
                        <div className="text-[10px] font-bold text-gray-800">
                          {formatMoney(sale.total)}
                        </div>

                        <div className="text-[8px] text-gray-400">ريال</div>
                      </td>

                      {/* الحالة */}

                      <td className="px-3 py-2">
                        {sale.status === "paid" ? (
                          <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-[9px] font-bold text-green-600">
                            {getStatusName(sale.status)}
                          </span>
                        ) : sale.status === "pending" ? (
                          <span className="inline-flex rounded-full bg-orange-50 px-2 py-1 text-[9px] font-bold text-orange-600">
                            {getStatusName(sale.status)}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
                            {getStatusName(sale.status)}
                          </span>
                        )}
                      </td>

                      {/* الإجراءات */}

                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {/* عرض */}

                          <Link
                            href={`/sales/${sale.id}`}
                            title="عرض الفاتورة"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
                          >
                            <FiEye size={13} />
                          </Link>

                          {/* طباعة */}

                          <button
                            type="button"
                            title="طباعة الفاتورة"
                            onClick={() => handlePrint(sale.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiPrinter size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
