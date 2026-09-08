"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiPrinter,
  FiDownload,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function IncomeStatementPage() {
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-08-31");
  const [refreshKey, setRefreshKey] = useState(0);

  const journalEntries = useERPStore((state) => state.journalEntries);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const reportData = useMemo(() => {
    const postedEntries = journalEntries.filter(
      (entry) =>
        entry.status === "posted" &&
        entry.date >= fromDate &&
        entry.date <= toDate,
    );

    const accountBalances = new Map<
      string,
      {
        code: string;
        name: string;
        debit: number;
        credit: number;
        balance: number;
      }
    >();

    postedEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const existing = accountBalances.get(line.accountCode);

        if (existing) {
          existing.debit += Number(line.debit) || 0;
          existing.credit += Number(line.credit) || 0;
          existing.balance +=
            (Number(line.debit) || 0) - (Number(line.credit) || 0);
        } else {
          accountBalances.set(line.accountCode, {
            code: line.accountCode,
            name: line.accountName,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            balance: (Number(line.debit) || 0) - (Number(line.credit) || 0),
          });
        }
      });
    });

    /*
      الإيرادات:
      الحسابات 4xxx
    */
    const revenueAccounts = Array.from(accountBalances.values()).filter(
      (account) => account.code.startsWith("4"),
    );

    const productSales = revenueAccounts
      .filter((account) => account.code === "4101")
      .reduce(
        (sum, account) => sum + Math.max(account.credit - account.debit, 0),
        0,
      );

    const serviceRevenue = revenueAccounts
      .filter((account) => account.code === "4102")
      .reduce(
        (sum, account) => sum + Math.max(account.credit - account.debit, 0),
        0,
      );

    const otherRevenue = revenueAccounts
      .filter((account) => account.code !== "4101" && account.code !== "4102")
      .reduce(
        (sum, account) => sum + Math.max(account.credit - account.debit, 0),
        0,
      );

    const revenue = [
      {
        code: "4101",
        name: "مبيعات المنتجات",
        amount: productSales,
      },
      {
        code: "4102",
        name: "إيرادات خدمات العمرة",
        amount: serviceRevenue,
      },
      {
        code: "OTHER",
        name: "إيرادات أخرى",
        amount: otherRevenue,
      },
    ];

    /*
      تكلفة المبيعات:
      5201 تكلفة المبيعات
      5202 تكلفة خدمات العمرة
    */
    const costOfSalesAccounts = Array.from(accountBalances.values()).filter(
      (account) => account.code.startsWith("52"),
    );

    const costOfSales = costOfSalesAccounts.map((account) => ({
      code: account.code,
      name: account.name,
      amount: Math.max(account.debit - account.credit, 0),
    }));

    /*
      المصروفات التشغيلية:
      5101 - 5199
      ما عدا أي حسابات سيتم اعتبارها تكلفة مباشرة أعلاه.
    */
    const operatingExpenseAccounts = Array.from(
      accountBalances.values(),
    ).filter(
      (account) =>
        account.code.startsWith("51") && !account.code.startsWith("52"),
    );

    const operatingExpenses = operatingExpenseAccounts.map((account) => ({
      code: account.code,
      name: account.name,
      amount: Math.max(account.debit - account.credit, 0),
    }));

    /*
      أي حسابات دخل أخرى بخلاف 4101 و4102
      تعتبر إيرادات أخرى.
    */
    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);

    const totalCostOfSales = costOfSales.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const grossProfit = totalRevenue - totalCostOfSales;

    const totalOperatingExpenses = operatingExpenses.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const operatingProfit = grossProfit - totalOperatingExpenses;

    /*
      في النسخة الحالية لا يوجد دليل منفصل للحسابات الأخرى،
      لذلك نحسب الإيرادات الأخرى والمصروفات الأخرى من الحسابات
      غير المصنفة ضمن 41 و51 و52.
    */
    const otherExpenseAccounts = Array.from(accountBalances.values()).filter(
      (account) =>
        account.code.startsWith("6") ||
        account.code.startsWith("53") ||
        account.code.startsWith("54"),
    );

    const otherExpenses = otherExpenseAccounts.reduce(
      (sum, account) => sum + Math.max(account.debit - account.credit, 0),
      0,
    );

    const otherIncome = otherRevenue;

    const netOtherIncome = otherIncome - otherExpenses;

    const netProfit = operatingProfit + netOtherIncome;

    const grossProfitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const netProfitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenue,
      costOfSales,
      operatingExpenses,
      otherIncome,
      otherExpenses,
      totalRevenue,
      totalCostOfSales,
      grossProfit,
      totalOperatingExpenses,
      operatingProfit,
      netOtherIncome,
      netProfit,
      grossProfitMargin,
      netProfitMargin,
    };
  }, [journalEntries, fromDate, toDate, refreshKey]);

  const {
    revenue,
    costOfSales,
    operatingExpenses,
    otherIncome,
    otherExpenses,
    totalRevenue,
    totalCostOfSales,
    grossProfit,
    totalOperatingExpenses,
    operatingProfit,
    netOtherIncome,
    netProfit,
    grossProfitMargin,
    netProfitMargin,
  } = reportData;

  const totalExpenses =
    totalCostOfSales + totalOperatingExpenses + otherExpenses;

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* =========================
          HEADER
      ========================== */}

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

            <span className="text-gray-800 font-medium">قائمة الدخل</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              قائمة الدخل
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
              تقرير مالي
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            تقرير الإيرادات والمصروفات وصافي الربح خلال الفترة
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

      {/* =========================
          FILTERS
      ========================== */}

      <section className="print:hidden bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-5 md:p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <FiCalendar size={20} className="text-amber-600" />

            <div>
              <h2 className="font-bold text-gray-900">فترة التقرير</h2>

              <p className="text-sm text-gray-500 mt-1">
                اختر الفترة التي تريد عرض قائمة الدخل لها
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                من تاريخ
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                إلى تاريخ
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleRefresh}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
              >
                <FiRefreshCw size={18} />
                تحديث التقرير
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          REPORT
      ========================== */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">
        {/* =========================
            OFFICIAL HEADER
        ========================== */}

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
                قائمة الدخل
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                عن الفترة من <span className="font-bold">{fromDate}</span> إلى{" "}
                <span className="font-bold">{toDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            SUMMARY CARDS
        ========================== */}

        <div className="p-5 md:p-6 border-b border-gray-200 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الإيرادات</p>

                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatMoney(totalRevenue)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiTrendingUp size={22} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المصروفات</p>

                  <p className="text-2xl font-bold text-red-700 mt-2">
                    {formatMoney(totalExpenses)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiTrendingDown size={22} className="text-red-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">صافي الربح</p>

                  <p
                    className={`text-2xl font-bold mt-2 ${
                      netProfit >= 0 ? "text-amber-700" : "text-red-700"
                    }`}
                  >
                    {netProfit < 0
                      ? `(${formatMoney(Math.abs(netProfit))})`
                      : formatMoney(netProfit)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiDollarSign size={22} className="text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            INCOME STATEMENT
        ========================== */}

        <div className="p-5 md:p-8">
          {/* الإيرادات */}

          <div className="mb-8">
            <div className="flex items-center justify-between bg-gray-100 border-2 border-gray-300 px-4 py-3 rounded-t-lg">
              <h3 className="font-bold text-gray-900">الإيرادات</h3>

              <span className="font-bold text-gray-900">
                {formatMoney(totalRevenue)} ريال
              </span>
            </div>

            <div className="border-x-2 border-b-2 border-gray-300 rounded-b-lg">
              {revenue.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                >
                  <span className="text-gray-700">{item.name}</span>

                  <span className="font-medium text-gray-900">
                    {formatMoney(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* تكلفة المبيعات */}

          <div className="mb-8">
            <div className="flex items-center justify-between bg-gray-100 border-2 border-gray-300 px-4 py-3 rounded-t-lg">
              <h3 className="font-bold text-gray-900">تكلفة المبيعات</h3>

              <span className="font-bold text-red-700">
                ({formatMoney(totalCostOfSales)})
              </span>
            </div>

            <div className="border-x-2 border-b-2 border-gray-300 rounded-b-lg">
              {costOfSales.length > 0 ? (
                costOfSales.map((item) => (
                  <div
                    key={item.code}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-700">{item.name}</span>

                    <span className="font-medium text-gray-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  لا توجد قيود تكلفة مبيعات ضمن الفترة
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-4 bg-green-50 border-t-2 border-green-200">
                <span className="font-bold text-gray-900">إجمالي الربح</span>

                <span
                  className={`font-bold ${
                    grossProfit >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {grossProfit < 0
                    ? `(${formatMoney(Math.abs(grossProfit))})`
                    : formatMoney(grossProfit)}{" "}
                  ريال
                </span>
              </div>
            </div>
          </div>

          {/* المصروفات التشغيلية */}

          <div className="mb-8">
            <div className="flex items-center justify-between bg-gray-100 border-2 border-gray-300 px-4 py-3 rounded-t-lg">
              <h3 className="font-bold text-gray-900">المصروفات التشغيلية</h3>

              <span className="font-bold text-red-700">
                ({formatMoney(totalOperatingExpenses)})
              </span>
            </div>

            <div className="border-x-2 border-b-2 border-gray-300 rounded-b-lg">
              {operatingExpenses.length > 0 ? (
                operatingExpenses.map((item) => (
                  <div
                    key={item.code}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-700">{item.name}</span>

                    <span className="font-medium text-gray-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  لا توجد مصروفات تشغيلية مسجلة ضمن الفترة
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-4 bg-gray-100 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">الربح التشغيلي</span>

                <span
                  className={`font-bold ${
                    operatingProfit >= 0 ? "text-gray-900" : "text-red-700"
                  }`}
                >
                  {operatingProfit < 0
                    ? `(${formatMoney(Math.abs(operatingProfit))})`
                    : formatMoney(operatingProfit)}{" "}
                  ريال
                </span>
              </div>
            </div>
          </div>

          {/* الإيرادات والمصروفات الأخرى */}

          <div className="mb-8">
            <div className="flex items-center justify-between bg-gray-100 border-2 border-gray-300 px-4 py-3 rounded-t-lg">
              <h3 className="font-bold text-gray-900">
                الإيرادات والمصروفات الأخرى
              </h3>

              <span
                className={`font-bold ${
                  netOtherIncome >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {netOtherIncome < 0
                  ? `(${formatMoney(Math.abs(netOtherIncome))})`
                  : formatMoney(netOtherIncome)}{" "}
                ريال
              </span>
            </div>

            <div className="border-x-2 border-b-2 border-gray-300 rounded-b-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-gray-700">إيرادات أخرى</span>

                <span className="font-medium text-green-700">
                  {formatMoney(otherIncome)}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-700">مصروفات أخرى</span>

                <span className="font-medium text-red-700">
                  ({formatMoney(otherExpenses)})
                </span>
              </div>
            </div>
          </div>

          {/* صافي الربح */}

          <div className="border-2 border-gray-900 rounded-xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900 text-white px-6 py-5">
              <div>
                <h3 className="text-xl font-bold">صافي الربح</h3>

                <p className="text-sm text-gray-300 mt-1">
                  بعد خصم جميع التكاليف والمصروفات
                </p>
              </div>

              <div className="text-center md:text-left">
                <p className="text-3xl font-bold">
                  {netProfit < 0
                    ? `(${formatMoney(Math.abs(netProfit))})`
                    : formatMoney(netProfit)}
                </p>

                <p className="text-sm text-gray-300 mt-1">ريال</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-4 border-b md:border-b-0 md:border-l border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    هامش إجمالي الربح
                  </span>

                  <span className="font-bold text-gray-900">
                    {grossProfitMargin.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">هامش صافي الربح</span>

                  <span
                    className={`font-bold ${
                      netProfitMargin >= 0 ? "text-gray-900" : "text-red-700"
                    }`}
                  >
                    {netProfitMargin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* التوقيعات */}

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

      {/* =========================
          FOOTER
      ========================== */}

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

      {/* =========================
          PRINT CSS
      ========================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
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

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
}
