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
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function CustomersReportPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const customers = useERPStore((state) => state.customers);
  const sales = useERPStore((state) => state.sales);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const customerReport = useMemo(() => {
    return customers.map((customer) => {
      const customerSales = sales.filter(
        (sale) => sale.customerId === customer.id,
      );

      const invoices = customerSales.length;

      const totalSales = customerSales.reduce(
        (sum, sale) => sum + (Number(sale.total) || 0),
        0,
      );

      const paid = customerSales
        .filter(
          (sale) =>
            sale.paymentMethod === "cash" || sale.paymentMethod === "bank",
        )
        .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

      const creditSales = customerSales
        .filter((sale) => sale.paymentMethod === "credit")
        .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

      const storeBalance = Number(customer.balance) || 0;

      const balance = storeBalance > 0 ? storeBalance : creditSales;

      let customerStatus = "مسدد";

      if (balance > 0) {
        customerStatus = "نشط";
      }

      if (balance >= 50000) {
        customerStatus = "متأخر";
      }

      return {
        id: customer.id,
        code: customer.id,
        name: customer.name,
        phone: customer.phone || "-",
        invoices,
        sales: totalSales,
        paid,
        balance,
        status: customerStatus,
      };
    });
  }, [customers, sales, refreshKey]);

  const filteredCustomers = useMemo(() => {
    return customerReport.filter((customer) => {
      const searchValue = search.trim().toLowerCase();

      const searchMatch =
        !searchValue ||
        customer.name.toLowerCase().includes(searchValue) ||
        customer.code.toLowerCase().includes(searchValue) ||
        customer.phone.toLowerCase().includes(searchValue);

      const statusMatch = !status || customer.status === status;

      return searchMatch && statusMatch;
    });
  }, [customerReport, search, status]);

  const totalCustomers = filteredCustomers.length;

  const totalInvoices = filteredCustomers.reduce(
    (sum, customer) => sum + customer.invoices,
    0,
  );

  const totalSales = filteredCustomers.reduce(
    (sum, customer) => sum + customer.sales,
    0,
  );

  const totalPaid = filteredCustomers.reduce(
    (sum, customer) => sum + customer.paid,
    0,
  );

  const totalBalance = filteredCustomers.reduce(
    (sum, customer) => sum + customer.balance,
    0,
  );

  const overdueCustomers = filteredCustomers.filter(
    (customer) => customer.status === "متأخر",
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

            <span className="text-gray-800 font-medium">تقرير العملاء</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              تقرير العملاء
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              العملاء
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            عرض مبيعات العملاء والمدفوعات والأرصدة المستحقة
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
                البحث عن عميل أو تصفية العملاء حسب الحالة
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  placeholder="اسم العميل أو الكود أو رقم الهاتف..."
                  className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium placeholder:text-gray-500 outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                حالة العميل
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="">جميع العملاء</option>

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
                تقرير العملاء
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                تقرير المبيعات والمدفوعات والأرصدة
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
            <div className="border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">عدد العملاء</p>

                <FiUsers size={20} className="text-gray-500" />
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-3">
                {totalCustomers.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">عميل</p>
            </div>

            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">عدد الفواتير</p>

              <p className="text-2xl font-bold text-blue-700 mt-3">
                {totalInvoices.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">فاتورة</p>
            </div>

            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي المبيعات</p>

              <p className="text-xl font-bold text-green-700 mt-3">
                {formatMoney(totalSales)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

            <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">إجمالي المدفوع</p>

              <p className="text-xl font-bold text-amber-700 mt-3">
                {formatMoney(totalPaid)}
              </p>

              <p className="text-xs text-gray-500 mt-1">ريال</p>
            </div>

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
              CUSTOMERS TABLE
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
                      كود العميل
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      اسم العميل
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      الهاتف
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      الفواتير
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      إجمالي المبيعات
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
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-blue-700">
                          {customer.code}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-gray-900">
                          {customer.name}
                        </td>

                        <td
                          dir="ltr"
                          className="border border-gray-300 px-4 py-3 text-sm text-gray-700 text-right"
                        >
                          {customer.phone}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-900">
                          {customer.invoices.toLocaleString("ar-SA")}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-900">
                          {formatMoney(customer.sales)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-green-700">
                          {formatMoney(customer.paid)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-red-700">
                          {formatMoney(customer.balance)}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              customer.status === "نشط"
                                ? "bg-green-100 text-green-700"
                                : customer.status === "مسدد"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {customer.status}
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
                      {formatMoney(totalSales)}
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
              RECEIVABLES SUMMARY
          ================================================== */}

          <div className="mt-6 p-5 rounded-xl border-2 border-red-200 bg-red-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900">تنبيه الذمم المدينة</h3>

                <p className="text-sm text-gray-600 mt-1">
                  يوجد {overdueCustomers.toLocaleString("ar-SA")} عميل لديه
                  مبالغ مستحقة ومتأخرة
                </p>
              </div>

              <div className="text-left">
                <p className="text-2xl font-bold text-red-700">
                  {formatMoney(totalBalance)}
                </p>

                <p className="text-xs text-gray-500">إجمالي الذمم المستحقة</p>
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
