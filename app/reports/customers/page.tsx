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
  FiBookOpen,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function CustomersReportPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const customers = useERPStore((state) => state.customers);
  const sales = useERPStore((state) => state.sales);
  const accounts = useERPStore((state) => state.accounts);
  const journalEntries = useERPStore((state) => state.journalEntries);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /*
   * =========================================================
   * حساب أرصدة الحسابات من القيود اليومية المرحلة
   * =========================================================
   *
   * الأصول:
   * الرصيد = المدين - الدائن
   *
   * الالتزامات وحقوق الملكية والإيرادات:
   * الرصيد = الدائن - المدين
   */
  const accountBalances = useMemo(() => {
    const balances: Record<
      string,
      {
        debit: number;
        credit: number;
        balance: number;
      }
    > = {};

    accounts.forEach((account) => {
      balances[account.code] = {
        debit: 0,
        credit: 0,
        balance: 0,
      };
    });

    journalEntries
      .filter((entry) => entry.status === "posted")
      .forEach((entry) => {
        entry.lines.forEach((line) => {
          if (!balances[line.accountCode]) {
            balances[line.accountCode] = {
              debit: 0,
              credit: 0,
              balance: 0,
            };
          }

          balances[line.accountCode].debit += Number(line.debit) || 0;
          balances[line.accountCode].credit += Number(line.credit) || 0;
        });
      });

    accounts.forEach((account) => {
      const data = balances[account.code];

      if (!data) return;

      if (account.type === "asset" || account.type === "expense") {
        data.balance = data.debit - data.credit;
      } else {
        data.balance = data.credit - data.debit;
      }
    });

    return balances;
  }, [accounts, journalEntries]);

  /*
   * =========================================================
   * العثور على حساب العميل
   * =========================================================
   *
   * الأولوية:
   * 1. accountCode الموجود داخل العميل.
   * 2. حساب باسم العميل تحت 1001 العملاء.
   */
  const getCustomerAccount = (customer: {
    id: string;
    name: string;
    accountCode?: string;
    accountName?: string;
  }) => {
    if (customer.accountCode) {
      const directAccount = accounts.find(
        (account) => account.code === customer.accountCode,
      );

      if (directAccount) {
        return directAccount;
      }
    }

    return accounts.find(
      (account) =>
        account.parent === "1001" &&
        account.name.trim() === customer.name.trim(),
    );
  };

  /*
   * =========================================================
   * تقرير العملاء
   * =========================================================
   */
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

      const customerAccount = getCustomerAccount(customer);

      const accountingBalance = customerAccount
        ? Number(accountBalances[customerAccount.code]?.balance || 0)
        : 0;

      /*
       * إذا كان الحساب المحاسبي موجودًا، نعتمد عليه.
       *
       * وإذا لم يكن الحساب موجودًا بعد، نستخدم الرصيد الموجود
       * في بيانات العميل، ثم نستخدم مبيعات الآجل كحل احتياطي.
       */
      const storeBalance = Number(customer.balance) || 0;

      const balance = customerAccount
        ? Math.max(accountingBalance, 0)
        : storeBalance > 0
          ? storeBalance
          : creditSales;

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

        accountCode: customerAccount?.code || customer.accountCode || "-",

        accountName:
          customerAccount?.name || customer.accountName || "غير مرتبط",

        invoices,
        sales: totalSales,
        paid,
        creditSales,
        balance,
        status: customerStatus,

        hasAccount: Boolean(customerAccount),
      };
    });
  }, [customers, sales, accounts, accountBalances, refreshKey]);

  /*
   * =========================================================
   * التصفية
   * =========================================================
   */
  const filteredCustomers = useMemo(() => {
    return customerReport.filter((customer) => {
      const searchValue = search.trim().toLowerCase();

      const searchMatch =
        !searchValue ||
        customer.name.toLowerCase().includes(searchValue) ||
        customer.code.toLowerCase().includes(searchValue) ||
        customer.phone.toLowerCase().includes(searchValue) ||
        customer.accountCode.toLowerCase().includes(searchValue) ||
        customer.accountName.toLowerCase().includes(searchValue);

      const statusMatch = !status || customer.status === status;

      return searchMatch && statusMatch;
    });
  }, [customerReport, search, status]);

  /*
   * =========================================================
   * الإحصائيات
   * =========================================================
   */
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

  const linkedCustomers = filteredCustomers.filter(
    (customer) => customer.hasAccount,
  ).length;

  const unlinkedCustomers = filteredCustomers.filter(
    (customer) => !customer.hasAccount,
  ).length;

  /*
   * =========================================================
   * الإجراءات
   * =========================================================
   */
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
            عرض مبيعات العملاء والمدفوعات والأرصدة المحاسبية
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
                  placeholder="اسم العميل أو الكود أو الحساب أو رقم الهاتف..."
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
                تقرير المبيعات والمدفوعات والأرصدة المحاسبية
              </p>

              <p className="text-xs text-gray-500 mt-2">
                مصدر الأرصدة: القيود اليومية المرحلة
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
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

            <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">حسابات مرتبطة</p>

              <p className="text-2xl font-bold text-emerald-700 mt-3">
                {linkedCustomers.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">عميل</p>
            </div>

            <div className="border-2 border-orange-200 bg-orange-50 rounded-xl p-5">
              <p className="text-sm text-gray-600">غير مرتبطة</p>

              <p className="text-2xl font-bold text-orange-700 mt-3">
                {unlinkedCustomers.toLocaleString("ar-SA")}
              </p>

              <p className="text-xs text-gray-500 mt-1">عميل</p>
            </div>
          </div>

          {/* =================================================
              ACCOUNTING NOTICE
          ================================================== */}

          {unlinkedCustomers > 0 && (
            <div className="mb-6 p-4 rounded-xl border-2 border-orange-200 bg-orange-50">
              <div className="flex items-start gap-3">
                <FiAlertCircle
                  size={21}
                  className="text-orange-600 mt-0.5 shrink-0"
                />

                <div>
                  <h3 className="font-bold text-orange-800">تنبيه محاسبي</h3>

                  <p className="text-sm text-orange-700 mt-1">
                    يوجد{" "}
                    <strong>{unlinkedCustomers.toLocaleString("ar-SA")}</strong>{" "}
                    عميل غير مرتبط بحساب محاسبي في دليل الحسابات تحت الحساب 1001
                    العملاء.
                  </p>

                  <p className="text-xs text-orange-600 mt-1">
                    سيتم استخدام الرصيد المخزن للعميل كحل احتياطي إلى أن يتم
                    إنشاء وربط حسابه المحاسبي.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              CUSTOMERS TABLE
          ================================================== */}

          <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse">
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
                      الحساب المحاسبي
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
                      الرصيد المحاسبي
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      الحالة
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold print:hidden">
                      الأستاذ
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

                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {customer.hasAccount ? (
                            <div>
                              <p className="font-bold text-gray-900">
                                {customer.accountCode}
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                {customer.accountName}
                              </p>
                            </div>
                          ) : (
                            <span className="text-orange-600 font-semibold">
                              غير مرتبط
                            </span>
                          )}
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

                        <td className="border border-gray-300 px-4 py-3 text-center print:hidden">
                          {customer.hasAccount ? (
                            <Link
                              href={`/accounting/ledger?account=${encodeURIComponent(
                                customer.accountCode,
                              )}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition"
                            >
                              <FiBookOpen size={15} />
                              دفتر الأستاذ
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              لا يوجد حساب
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={11}
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
                      colSpan={5}
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

                    <td className="border-2 border-gray-400 print:hidden"></td>
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
              ACCOUNTING SOURCE
          ================================================== */}

          <div className="mt-6 p-5 rounded-xl border-2 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <FiBookOpen size={21} className="text-blue-600 mt-0.5 shrink-0" />

              <div>
                <h3 className="font-bold text-gray-900">الربط المحاسبي</h3>

                <p className="text-sm text-gray-600 mt-1">
                  أرصدة العملاء المرتبطين بحسابات محاسبية يتم احتسابها من القيود
                  اليومية المرحلة في دليل الحسابات، وليس من قيمة الرصيد المخزنة
                  في بطاقة العميل.
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  المسار المحاسبي: <strong>1000 الأصول</strong>
                  {" → "}
                  <strong>1001 العملاء</strong>
                  {" → "}
                  <strong>حساب العميل</strong>
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
