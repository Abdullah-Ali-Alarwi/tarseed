"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function PurchasesReportPage() {
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-08-31");
  const [supplier, setSupplier] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const purchases = useERPStore((state) => state.purchases);

  const suppliers = useERPStore((state) => state.suppliers);

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

  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((purchase) => {
        const dateMatch = purchase.date >= fromDate && purchase.date <= toDate;

        const supplierMatch = !supplier || purchase.supplierId === supplier;

        const paymentMatch =
          !paymentMethod || purchase.paymentMethod === paymentMethod;

        return dateMatch && supplierMatch && paymentMatch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases, fromDate, toDate, supplier, paymentMethod]);

  const totalInvoices = filteredPurchases.length;

  const totalSubtotal = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.subtotal) || 0),
    0,
  );

  const totalDiscount = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.discount) || 0),
    0,
  );

  const totalTax = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.tax) || 0),
    0,
  );

  const grandTotal = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.total) || 0),
    0,
  );

  const cashTotal = filteredPurchases
    .filter((purchase) => purchase.paymentMethod === "cash")
    .reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

  const bankTotal = filteredPurchases
    .filter((purchase) => purchase.paymentMethod === "bank")
    .reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

  const creditTotal = filteredPurchases
    .filter((purchase) => purchase.paymentMethod === "credit")
    .reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

  const resetFilters = () => {
    setFromDate("2026-01-01");
    setToDate("2026-08-31");
    setSupplier("");
    setPaymentMethod("");
  };

  const handleRefresh = () => {
    setFromDate((value) => value);
    setToDate((value) => value);
    setSupplier((value) => value);
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

            <span className="text-gray-800 font-medium">تقرير المشتريات</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              تقرير المشتريات
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              تقرير مشتريات
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            عرض وتحليل فواتير المشتريات خلال الفترة المحددة
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
                حدد الفترة والمورد وطريقة الدفع
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* FROM DATE */}

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

            {/* TO DATE */}

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

            {/* SUPPLIER */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                المورد
              </label>

              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="">جميع الموردين</option>

                {suppliers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PAYMENT */}

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
                تقرير المشتريات
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
          {/* =================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">عدد الفواتير</p>

                <FiShoppingBag size={20} className="text-gray-500" />
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-3">
                {totalInvoices.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">فاتورة شراء</p>
            </div>

            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي المشتريات</p>

              <p className="text-2xl font-bold text-blue-700 mt-3">
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

            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي ضريبة المشتريات</p>

              <p className="text-2xl font-bold text-green-700 mt-3">
                {formatMoney(totalTax)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>
          </div>

          {/* =================================================
              PURCHASES TABLE
          ================================================== */}

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
                      المورد
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
                  {filteredPurchases.length > 0 ? (
                    filteredPurchases.map((purchase, index) => (
                      <tr
                        key={purchase.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-blue-700">
                          {purchase.invoiceNumber}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                          {purchase.date}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900">
                          {purchase.supplierName}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              purchase.paymentMethod === "cash"
                                ? "bg-green-100 text-green-700"
                                : purchase.paymentMethod === "bank"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {paymentMethodName(purchase.paymentMethod)}
                          </span>
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-gray-700">
                          {formatMoney(purchase.subtotal)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-red-600">
                          {formatMoney(purchase.discount)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-green-600">
                          {formatMoney(purchase.tax)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-bold text-gray-900">
                          {formatMoney(purchase.total)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              purchase.paymentMethod === "credit"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {purchase.paymentMethod === "credit"
                              ? "آجلة"
                              : "مدفوعة"}
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
                        لا توجد مشتريات مطابقة للمعايير المحددة
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

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-green-700">
                      {formatMoney(totalTax)}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-blue-700">
                      {formatMoney(grandTotal)}
                    </td>

                    <td className="border-2 border-gray-400"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* =================================================
              PAYMENT SUMMARY
          ================================================== */}

          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ملخص المشتريات حسب طريقة الدفع
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
                <p className="text-sm text-gray-600">المشتريات النقدية</p>

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
                <p className="text-sm text-gray-600">المشتريات الآجلة</p>

                <p className="text-xl font-bold text-amber-700 mt-2">
                  {formatMoney(creditTotal)} ريال
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

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

      {/* =====================================================
          PRINT CSS
      ====================================================== */}

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
