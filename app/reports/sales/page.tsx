"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
  FiShoppingCart,
  FiSearch,
  FiDownload,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function SalesReportPage() {
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-08-31");
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const sales = useERPStore((state) => state.sales);

  const customers = useERPStore((state) => state.customers);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const paymentMethodName = (method: string) => {
    switch (method) {
      case "cash":
        return "نقدي";

      case "bank":
        return "تحويل بنكي";

      case "credit":
        return "آجل";

      default:
        return "غير محدد";
    }
  };

  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        const dateMatch = sale.date >= fromDate && sale.date <= toDate;

        const customerMatch = !customer || sale.customerId === customer;

        const paymentMatch =
          !paymentMethod || sale.paymentMethod === paymentMethod;

        return dateMatch && customerMatch && paymentMatch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, fromDate, toDate, customer, paymentMethod]);

  const totalInvoices = filteredSales.length;

  const totalSubtotal = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.subtotal) || 0),
    0,
  );

  const totalDiscount = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.discount) || 0),
    0,
  );

  const totalTax = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.tax) || 0),
    0,
  );

  const grandTotal = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.total) || 0),
    0,
  );

  const cashTotal = filteredSales
    .filter((sale) => sale.paymentMethod === "cash")
    .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  const bankTotal = filteredSales
    .filter((sale) => sale.paymentMethod === "bank")
    .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  const creditTotal = filteredSales
    .filter((sale) => sale.paymentMethod === "credit")
    .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  const resetFilters = () => {
    setFromDate("2026-01-01");
    setToDate("2026-08-31");
    setCustomer("");
    setPaymentMethod("");
  };

  const handleRefresh = () => {
    setFromDate((value) => value);
    setToDate((value) => value);
    setCustomer((value) => value);
    setPaymentMethod((value) => value);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-amber-600 transition">
              الرئيسية
            </Link>

            <FiArrowRight size={14} />

            <Link href="/reports" className="hover:text-amber-600 transition">
              التقارير
            </Link>

            <FiArrowRight size={14} />

            <span className="text-gray-800 font-medium">تقرير المبيعات</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              تقرير المبيعات
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
              تقرير مبيعات
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            عرض وتحليل جميع فواتير المبيعات خلال الفترة المحددة
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/reports"
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <FiArrowRight size={18} />
            العودة للتقارير
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <FiPrinter size={18} />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="print:hidden bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-5 md:p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <FiSearch size={20} className="text-amber-600" />

            <div>
              <h2 className="font-bold text-gray-900">خيارات التقرير</h2>

              <p className="text-sm text-gray-500 mt-1">
                حدد الفترة والعميل وطريقة الدفع
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* من تاريخ */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                من تاريخ
              </label>

              <div className="relative">
                <FiCalendar
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>

            {/* إلى تاريخ */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                إلى تاريخ
              </label>

              <div className="relative">
                <FiCalendar
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>

            {/* العميل */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                العميل
              </label>

              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="">جميع العملاء</option>

                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* طريقة الدفع */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                طريقة الدفع
              </label>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="">جميع طرق الدفع</option>

                <option value="cash">نقدي</option>

                <option value="bank">تحويل بنكي</option>

                <option value="credit">آجل</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg text-sm font-semibold transition"
            >
              <FiRefreshCw size={18} />
              إعادة ضبط
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition"
            >
              <FiRefreshCw size={18} />
              تحديث التقرير
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          REPORT
      ====================================================== */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">
        {/* ===================================================
            COMPANY HEADER
        ==================================================== */}

        <div className="p-6 md:p-8 border-b-2 border-gray-300">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
                  ERP
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    شركة الجابري
                  </h2>

                  <p className="text-sm text-gray-500">
                    للعسل والزيوت الطبيعة وخدمات العمرة
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">البيضاء - اليمن</p>

              <p className="text-sm text-gray-600 mt-1">
                هاتف: <bdi dir="ltr">734 434 443</bdi>
              </p>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                تقرير المبيعات
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                عن الفترة من <span className="font-bold">{fromDate}</span> إلى{" "}
                <span className="font-bold">{toDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            REPORT BODY
        ==================================================== */}

        <div className="p-5 md:p-8">
          {/* SUMMARY */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">عدد الفواتير</p>

                <FiShoppingCart size={20} className="text-gray-500" />
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-3">
                {totalInvoices.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">فاتورة</p>
            </div>

            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي المبيعات</p>

              <p className="text-2xl font-bold text-green-700 mt-3">
                {formatMoney(grandTotal)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

            <div className="border-2 border-red-200 bg-red-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي الخصومات</p>

              <p className="text-2xl font-bold text-red-700 mt-3">
                {formatMoney(totalDiscount)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي الضريبة</p>

              <p className="text-2xl font-bold text-blue-700 mt-3">
                {formatMoney(totalTax)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>
          </div>

          {/* SALES TABLE */}

          <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      #
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      رقم الفاتورة
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      التاريخ
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      العميل
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      طريقة الدفع
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      قبل الخصم
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      الخصم
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      الضريبة
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      الإجمالي
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      الحالة
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale, index) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition">
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-amber-700">
                          {sale.invoiceNumber}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                          {sale.date}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900">
                          {sale.customerName}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              sale.paymentMethod === "cash"
                                ? "bg-green-100 text-green-700"
                                : sale.paymentMethod === "bank"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {paymentMethodName(sale.paymentMethod)}
                          </span>
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-gray-700">
                          {formatMoney(sale.subtotal)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-red-600">
                          {formatMoney(sale.discount)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-blue-600">
                          {formatMoney(sale.tax)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-bold text-gray-900">
                          {formatMoney(sale.total)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            مسجلة
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="border border-gray-300 px-4 py-12 text-center text-gray-500"
                      >
                        لا توجد مبيعات مطابقة للمعايير المحددة
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-gray-100">
                    <td
                      colSpan={5}
                      className="border-2 border-gray-400 px-4 py-4 text-right font-bold text-gray-900"
                    >
                      إجمالي التقرير
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-gray-900">
                      {formatMoney(totalSubtotal)}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-red-700">
                      {formatMoney(totalDiscount)}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-blue-700">
                      {formatMoney(totalTax)}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-green-700">
                      {formatMoney(grandTotal)}
                    </td>

                    <td className="border-2 border-gray-400"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* PAYMENT SUMMARY */}

          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ملخص المبيعات حسب طريقة الدفع
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
                <p className="text-sm text-gray-600">المبيعات النقدية</p>

                <p className="text-xl font-bold text-green-700 mt-2">
                  {formatMoney(cashTotal)} ريال
                </p>
              </div>

              <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
                <p className="text-sm text-gray-600">التحويلات البنكية</p>

                <p className="text-xl font-bold text-blue-700 mt-2">
                  {formatMoney(bankTotal)} ريال
                </p>
              </div>

              <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-5">
                <p className="text-sm text-gray-600">المبيعات الآجلة</p>

                <p className="text-xl font-bold text-amber-700 mt-2">
                  {formatMoney(creditTotal)} ريال
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <p className="font-bold text-gray-800">إعداد التقرير</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>

            <div>
              <p className="font-bold text-gray-800">المحاسب</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>

            <div>
              <p className="font-bold text-gray-800">المدير</p>

              <div className="border-b border-gray-400 mt-12"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <div className="print:hidden mt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <p>تم إنشاء التقرير بواسطة نظام المحاسبة ERP</p>

        <button
          type="button"
          className="inline-flex items-center gap-2 hover:text-amber-600 transition"
        >
          <FiDownload size={16} />
          تصدير التقرير
        </button>
      </div>

      {/* PRINT CSS */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            color: #111827 !important;
          }

          main {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          section {
            box-shadow: none !important;
          }

          table {
            width: 100% !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
}
