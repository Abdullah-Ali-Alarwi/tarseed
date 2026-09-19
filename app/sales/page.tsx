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
  FiTrash2,
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

  const deleteSale = useSalesStore((state) => state.deleteSale);

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

      return (
        invoiceNumber.includes(value) ||
        customerName.includes(value) ||
        accountName.includes(value)
      );
    });
  }, [sales, search]);

  /* =====================================================
     الإحصائيات
  ===================================================== */

  const statistics = useMemo(() => {
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);

    const paid = sales.filter((sale) => sale.status === "paid");

    const pending = sales.filter((sale) => sale.status === "pending");

    const paidTotal = paid.reduce((sum, sale) => sum + sale.total, 0);

    const pendingTotal = pending.reduce((sum, sale) => sum + sale.total, 0);

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
    return value.toLocaleString("ar-YE");
  };

  /* =====================================================
     اسم طريقة الدفع
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
        return method;
    }
  };

  /* =====================================================
     اسم الحالة
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
        return status;
    }
  };

  /* =====================================================
     تأكيد الحذف
  ===================================================== */

  const handleDelete = (id: string, invoiceNumber: string) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الفاتورة ${invoiceNumber}؟`,
    );

    if (!confirmed) {
      return;
    }

    deleteSale(id);
  };

  /* =====================================================
     الصفحة
  ===================================================== */

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-[1500px]">
        {/* =================================================
            رأس الصفحة
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">المبيعات</h1>

            <p className="mt-1 text-xs text-gray-500">
              إدارة ومتابعة فواتير المبيعات
            </p>
          </div>

          <Link
            href="/sales/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={17} />
            فاتورة مبيعات جديدة
          </Link>
        </div>

        {/* =================================================
            بطاقات الإحصائيات
        ================================================= */}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* عدد الفواتير */}

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">عدد الفواتير</p>

                <p className="mt-2 text-xl font-bold text-gray-800">
                  {statistics.count}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FiFileText size={20} />
              </div>
            </div>
          </div>

          {/* إجمالي المبيعات */}

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">إجمالي المبيعات</p>

                <p className="mt-2 text-xl font-bold text-gray-800">
                  {formatMoney(statistics.total)}
                </p>

                <p className="mt-1 text-[10px] text-gray-400">ريال</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <FiDollarSign size={20} />
              </div>
            </div>
          </div>

          {/* المدفوعة */}

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">الفواتير المدفوعة</p>

                <p className="mt-2 text-xl font-bold text-green-600">
                  {statistics.paidCount}
                </p>

                <p className="mt-1 text-[10px] text-gray-400">
                  {formatMoney(statistics.paidTotal)} ريال
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <FiCheckCircle size={20} />
              </div>
            </div>
          </div>

          {/* المعلقة */}

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">الفواتير المعلقة</p>

                <p className="mt-2 text-xl font-bold text-orange-500">
                  {statistics.pendingCount}
                </p>

                <p className="mt-1 text-[10px] text-gray-400">
                  {formatMoney(statistics.pendingTotal)} ريال
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <FiClock size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            البحث
        ================================================= */}

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <FiSearch
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو اسم العميل أو الحساب..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pr-10 pl-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* =================================================
            جدول المبيعات
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* عنوان الجدول */}

          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                فواتير المبيعات
              </h2>

              <p className="mt-1 text-[10px] text-gray-500">
                عدد النتائج: {filteredSales.length}
              </p>
            </div>
          </div>

          {/* الجدول */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-right">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-3 font-semibold">رقم الفاتورة</th>

                  <th className="px-4 py-3 font-semibold">التاريخ</th>

                  <th className="px-4 py-3 font-semibold">العميل</th>

                  <th className="px-4 py-3 font-semibold">طريقة الدفع</th>

                  <th className="px-4 py-3 font-semibold">عدد الأصناف</th>

                  <th className="px-4 py-3 font-semibold">الإجمالي</th>

                  <th className="px-4 py-3 font-semibold">الحالة</th>

                  <th className="px-4 py-3 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <FiFileText
                        size={32}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="text-sm font-semibold text-gray-500">
                        لا توجد فواتير
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
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

                      <td className="px-4 py-3">
                        <div className="font-bold text-blue-600">
                          {sale.invoiceNumber}
                        </div>
                      </td>

                      {/* التاريخ */}

                      <td className="px-4 py-3 text-xs text-gray-600">
                        {sale.date}
                      </td>

                      {/* العميل */}

                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-800">
                          {sale.customerName || "عميل نقدي"}
                        </div>

                        {sale.accountName && (
                          <div className="mt-1 text-[10px] text-gray-400">
                            {sale.accountCode ? `${sale.accountCode} - ` : ""}
                            {sale.accountName}
                          </div>
                        )}
                      </td>

                      {/* طريقة الدفع */}

                      <td className="px-4 py-3">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                          {getPaymentMethodName(sale.paymentMethod)}
                        </span>
                      </td>

                      {/* عدد الأصناف */}

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sale.items.length}
                      </td>

                      {/* الإجمالي */}

                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-800">
                          {formatMoney(sale.total)}
                        </div>

                        <div className="text-[10px] text-gray-400">ريال</div>
                      </td>

                      {/* الحالة */}

                      <td className="px-4 py-3">
                        {sale.status === "paid" ? (
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600">
                            {getStatusName(sale.status)}
                          </span>
                        ) : sale.status === "pending" ? (
                          <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600">
                            {getStatusName(sale.status)}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                            {getStatusName(sale.status)}
                          </span>
                        )}
                      </td>

                      {/* الإجراءات */}

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* عرض */}

                          <Link
                            href={`/sales/${sale.id}`}
                            title="عرض الفاتورة"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
                          >
                            <FiEye size={15} />
                          </Link>

                          {/* طباعة */}

                          <Link
                            href={`/sales/${sale.id}/print`}
                            target="_blank"
                            title="طباعة الفاتورة"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiPrinter size={15} />
                          </Link>

                          {/* حذف */}

                          <button
                            type="button"
                            title="حذف الفاتورة"
                            onClick={() =>
                              handleDelete(sale.id, sale.invoiceNumber)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 size={15} />
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
