"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiUsers,
  FiPrinter,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiTruck,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function SuppliersReportPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const suppliers = useERPStore((state) => state.suppliers);

  const purchases = useERPStore((state) => state.purchases);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const supplierReport = useMemo(() => {
    return suppliers.map((supplier) => {
      const supplierPurchases = purchases.filter(
        (purchase) => purchase.supplierId === supplier.id,
      );

      const invoices = supplierPurchases.length;

      const totalPurchases = supplierPurchases.reduce(
        (sum, purchase) => sum + (Number(purchase.total) || 0),
        0,
      );

      const paid = supplierPurchases
        .filter(
          (purchase) =>
            purchase.paymentMethod === "cash" ||
            purchase.paymentMethod === "bank",
        )
        .reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

      const creditPurchases = supplierPurchases
        .filter((purchase) => purchase.paymentMethod === "credit")
        .reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0);

      const storeBalance = Number(supplier.balance) || 0;

      const balance = storeBalance > 0 ? storeBalance : creditPurchases;

      let supplierStatus = "مسدد";

      if (balance > 0) {
        supplierStatus = "نشط";
      }

      if (balance >= 50000) {
        supplierStatus = "متأخر";
      }

      return {
        id: supplier.id,
        code: supplier.id,
        name: supplier.name,
        phone: supplier.phone || "-",
        invoices,
        purchases: totalPurchases,
        paid,
        balance,
        status: supplierStatus,
      };
    });
  }, [suppliers, purchases, refreshKey]);

  const filteredSuppliers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return supplierReport.filter((supplier) => {
      const searchMatch =
        !searchValue ||
        supplier.name.toLowerCase().includes(searchValue) ||
        supplier.code.toLowerCase().includes(searchValue) ||
        supplier.phone.includes(searchValue);

      const statusMatch = !status || supplier.status === status;

      return searchMatch && statusMatch;
    });
  }, [supplierReport, search, status]);

  const totalSuppliers = filteredSuppliers.length;

  const totalInvoices = filteredSuppliers.reduce(
    (sum, supplier) => sum + supplier.invoices,
    0,
  );

  const totalPurchases = filteredSuppliers.reduce(
    (sum, supplier) => sum + supplier.purchases,
    0,
  );

  const totalPaid = filteredSuppliers.reduce(
    (sum, supplier) => sum + supplier.paid,
    0,
  );

  const totalBalance = filteredSuppliers.reduce(
    (sum, supplier) => sum + supplier.balance,
    0,
  );

  const overdueSuppliers = filteredSuppliers.filter(
    (supplier) => supplier.status === "متأخر",
  ).length;

  const resetFilters = () => {
    setSearch("");
    setStatus("");
  };

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
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

            <span className="text-gray-800 font-medium">تقرير الموردين</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              تقرير الموردين
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
              الموردين
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            عرض المشتريات والمدفوعات والأرصدة المستحقة للموردين
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
                البحث عن مورد أو تصفية الموردين حسب الحالة
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* SEARCH */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                البحث
              </label>

              <div className="relative">
                <FiSearch
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="اسم المورد أو الكود أو رقم الهاتف..."
                  className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium placeholder:text-gray-500 outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>

            {/* STATUS */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                حالة المورد
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="">جميع الموردين</option>

                <option value="نشط">نشط</option>

                <option value="مسدد">مسدد بالكامل</option>

                <option value="متأخر">متأخر</option>
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
            REPORT HEADER
        ==================================================== */}

        <div className="p-6 md:p-8 border-b-2 border-gray-300">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* COMPANY */}

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

            {/* REPORT TITLE */}

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                تقرير الموردين
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                تقرير المشتريات والمدفوعات والأرصدة
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            REPORT CONTENT
        ==================================================== */}

        <div className="p-5 md:p-8">
          {/* =================================================
              SUMMARY
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* SUPPLIERS */}

            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">عدد الموردين</p>

                <FiUsers size={20} className="text-gray-500" />
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-3">
                {totalSuppliers.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">مورد</p>
            </div>

            {/* INVOICES */}

            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">عدد فواتير الشراء</p>

              <p className="text-2xl font-bold text-blue-700 mt-3">
                {totalInvoices.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">فاتورة</p>
            </div>

            {/* PURCHASES */}

            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي المشتريات</p>

              <p className="text-xl font-bold text-green-700 mt-3">
                {formatMoney(totalPurchases)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

            {/* PAID */}

            <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي المدفوع</p>

              <p className="text-xl font-bold text-amber-700 mt-3">
                {formatMoney(totalPaid)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

            {/* BALANCE */}

            <div className="border-2 border-red-200 bg-red-50 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">إجمالي المستحق</p>

                <FiAlertCircle size={20} className="text-red-600" />
              </div>

              <p className="text-xl font-bold text-red-700 mt-3">
                {formatMoney(totalBalance)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>
          </div>

          {/* =================================================
              SUPPLIERS TABLE
          ================================================== */}

          <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      #
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      كود المورد
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      اسم المورد
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      الهاتف
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      الفواتير
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      إجمالي المشتريات
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      المدفوع
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      الرصيد المستحق
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      الحالة
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier, index) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-blue-700">
                          {supplier.code}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-gray-900">
                          {supplier.name}
                        </td>

                        <td
                          dir="ltr"
                          className="border border-gray-300 px-4 py-3 text-sm text-gray-700 text-right"
                        >
                          {supplier.phone}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-900">
                          {supplier.invoices.toLocaleString("ar-SA")}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-900">
                          {formatMoney(supplier.purchases)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-green-700">
                          {formatMoney(supplier.paid)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-red-700">
                          {formatMoney(supplier.balance)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              supplier.status === "نشط"
                                ? "bg-green-100 text-green-700"
                                : supplier.status === "مسدد"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="border border-gray-300 px-4 py-12 text-center text-gray-500"
                      >
                        لا توجد بيانات مطابقة للبحث
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* TOTAL */}

                <tfoot>
                  <tr className="bg-gray-100">
                    <td
                      colSpan={4}
                      className="border-2 border-gray-400 px-4 py-4 text-right font-bold text-gray-900"
                    >
                      إجمالي التقرير
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-center font-bold text-gray-900">
                      {totalInvoices.toLocaleString("ar-SA")}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-gray-900">
                      {formatMoney(totalPurchases)}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-green-700">
                      {formatMoney(totalPaid)}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-red-700">
                      {formatMoney(totalBalance)}
                    </td>

                    <td className="border-2 border-gray-400"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* =================================================
              PAYABLES SUMMARY
          ================================================== */}

          <div className="mt-6 p-5 rounded-xl border-2 border-red-200 bg-red-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FiTruck size={24} className="text-red-600" />

                <div>
                  <h3 className="font-bold text-gray-900">
                    تنبيه الذمم الدائنة
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    يوجد {overdueSuppliers.toLocaleString("ar-SA")} مورد لديه
                    مبالغ مستحقة ومتأخرة
                  </p>
                </div>
              </div>

              <div className="text-left">
                <p className="text-2xl font-bold text-red-700">
                  {formatMoney(totalBalance)}
                </p>

                <p className="text-xs text-gray-500">
                  إجمالي المبالغ المستحقة للموردين
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
