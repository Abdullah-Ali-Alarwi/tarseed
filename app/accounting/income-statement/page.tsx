"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowUp,
  FiArrowDown,
  FiBarChart2,
  FiFilter,
  FiPrinter,
  FiRefreshCw,
  FiChevronLeft,
  FiDollarSign,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

type AccountSummary = {
  code: string;
  name: string;
  amount: number;
};

const revenueAccounts = [
  { code: "4101", name: "المبيعات" },
  { code: "4102", name: "إيرادات خدمات العمرة" },
  { code: "4103", name: "إيرادات أخرى" },
];

const expenseAccounts = [
  { code: "5101", name: "تكلفة خدمات العمرة" },
  { code: "5102", name: "تكلفة المبيعات" },
  { code: "5103", name: "الرواتب والأجور" },
  { code: "5104", name: "الإيجار" },
  { code: "5105", name: "الكهرباء والماء" },
  { code: "5106", name: "الاتصالات" },
  { code: "5107", name: "مصروفات نقل" },
  { code: "5108", name: "مصروفات تسويق وإعلان" },
  { code: "5109", name: "مصروفات أخرى" },
];

export default function IncomeStatementPage() {
  const { journalEntries } = useERPStore();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const postedEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (entry.status !== "posted") {
        return false;
      }

      if (fromDate && entry.date < fromDate) {
        return false;
      }

      if (toDate && entry.date > toDate) {
        return false;
      }

      return true;
    });
  }, [journalEntries, fromDate, toDate]);

  const revenueData = useMemo<AccountSummary[]>(() => {
    return revenueAccounts
      .map((account) => {
        const amount = postedEntries.reduce((sum, entry) => {
          return (
            sum +
            entry.lines
              .filter((line) => line.accountCode === account.code)
              .reduce((lineSum, line) => lineSum + Number(line.credit || 0), 0)
          );
        }, 0);

        return {
          code: account.code,
          name: account.name,
          amount,
        };
      })
      .filter((account) => account.amount !== 0);
  }, [postedEntries]);

  const expenseData = useMemo<AccountSummary[]>(() => {
    return expenseAccounts
      .map((account) => {
        const amount = postedEntries.reduce((sum, entry) => {
          return (
            sum +
            entry.lines
              .filter((line) => line.accountCode === account.code)
              .reduce((lineSum, line) => lineSum + Number(line.debit || 0), 0)
          );
        }, 0);

        return {
          code: account.code,
          name: account.name,
          amount,
        };
      })
      .filter((account) => account.amount !== 0);
  }, [postedEntries]);

  const totalRevenue = useMemo(() => {
    return revenueData.reduce((sum, account) => sum + account.amount, 0);
  }, [revenueData]);

  const totalExpenses = useMemo(() => {
    return expenseData.reduce((sum, account) => sum + account.amount, 0);
  }, [expenseData]);

  const grossProfit = useMemo(() => {
    const salesRevenue = revenueData
      .filter((account) => account.code === "4101")
      .reduce((sum, account) => sum + account.amount, 0);

    const serviceRevenue = revenueData
      .filter((account) => account.code === "4102")
      .reduce((sum, account) => sum + account.amount, 0);

    const costOfSales = expenseData
      .filter((account) => account.code === "5102")
      .reduce((sum, account) => sum + account.amount, 0);

    const serviceCost = expenseData
      .filter((account) => account.code === "5101")
      .reduce((sum, account) => sum + account.amount, 0);

    return salesRevenue + serviceRevenue - costOfSales - serviceCost;
  }, [revenueData, expenseData]);

  const operatingExpenses = useMemo(() => {
    return expenseData
      .filter((account) => account.code !== "5101" && account.code !== "5102")
      .reduce((sum, account) => sum + account.amount, 0);
  }, [expenseData]);

  const operatingProfit = grossProfit - operatingExpenses;

  const netProfit = totalRevenue - totalExpenses;

  const revenueMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-7">
      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link
              href="/accounting"
              className="hover:text-amber-600 transition"
            >
              المحاسبة
            </Link>

            <FiChevronLeft className="w-3 h-3" />

            <span className="text-gray-700">قائمة الدخل</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                قائمة الدخل
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                عرض الإيرادات والتكاليف والمصروفات وصافي الربح
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition"
        >
          <FiPrinter className="w-4 h-4" />
          طباعة
        </button>
      </div>

      {/* ==================================================
          FILTER
      ================================================== */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 mb-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="w-4 h-4 text-amber-600" />

          <h2 className="text-sm font-bold text-gray-800">فترة التقرير</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-2">من تاريخ</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-2">
              إلى تاريخ
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs sm:text-sm text-gray-600 transition"
            >
              <FiRefreshCw className="w-4 h-4" />
              إعادة ضبط
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 print:hidden">
        <SummaryCard
          title="إجمالي الإيرادات"
          value={formatMoney(totalRevenue)}
          subtitle="ريال"
          icon={<FiArrowUp />}
          type="positive"
        />

        <SummaryCard
          title="إجمالي المصروفات"
          value={formatMoney(totalExpenses)}
          subtitle="ريال"
          icon={<FiArrowDown />}
          type="negative"
        />

        <SummaryCard
          title="الربح التشغيلي"
          value={formatMoney(operatingProfit)}
          subtitle="ريال"
          icon={<FiBarChart2 />}
          type={operatingProfit >= 0 ? "positive" : "negative"}
        />

        <SummaryCard
          title="صافي الربح"
          value={formatMoney(netProfit)}
          subtitle={`${revenueMargin.toFixed(2)}%`}
          icon={<FiDollarSign />}
          type={netProfit >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* ==================================================
          INCOME STATEMENT
      ================================================== */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {/* Report Header */}
          <div className="text-center px-5 py-7 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">شركة الجابري</h2>

            <p className="text-sm text-gray-600 mt-1">
              للعسل والزيوت الطبيعة وخدمات العمرة
            </p>

            <p className="text-xs text-gray-400 mt-1">البيضاء - اليمن</p>

            <p className="text-xs text-gray-400 mt-1">
              هاتف: <bdi dir="ltr">734 434 443</bdi>
            </p>

            <h3 className="text-lg font-bold text-gray-800 mt-5">
              قائمة الدخل
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              للفترة من{" "}
              <span className="font-medium">{fromDate || "بداية النشاط"}</span>{" "}
              إلى <span className="font-medium">{toDate || "اليوم"}</span>
            </p>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-7">
            {/* Revenue */}
            <section>
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
                <h4 className="text-sm font-bold text-gray-800">الإيرادات</h4>

                <span className="text-xs text-gray-500">ريال</span>
              </div>

              <div className="mt-2">
                {revenueData.length === 0 ? (
                  <EmptyRow text="لا توجد إيرادات مسجلة" />
                ) : (
                  revenueData.map((account) => (
                    <StatementRow
                      key={account.code}
                      name={account.name}
                      amount={account.amount}
                    />
                  ))
                )}

                <div className="flex items-center justify-between py-3 mt-1 border-t border-gray-300">
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    إجمالي الإيرادات
                  </span>

                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    {formatMoney(totalRevenue)}
                  </span>
                </div>
              </div>
            </section>

            {/* Cost */}
            <section className="mt-8">
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
                <h4 className="text-sm font-bold text-gray-800">
                  تكلفة الإيرادات
                </h4>

                <span className="text-xs text-gray-500">ريال</span>
              </div>

              <div className="mt-2">
                {expenseData.filter(
                  (account) =>
                    account.code === "5101" || account.code === "5102",
                ).length === 0 ? (
                  <EmptyRow text="لا توجد تكاليف مسجلة" />
                ) : (
                  expenseData
                    .filter(
                      (account) =>
                        account.code === "5101" || account.code === "5102",
                    )
                    .map((account) => (
                      <StatementRow
                        key={account.code}
                        name={account.name}
                        amount={account.amount}
                      />
                    ))
                )}

                <div className="flex items-center justify-between py-3 mt-1 border-t border-gray-300">
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    إجمالي تكلفة الإيرادات
                  </span>

                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    {formatMoney(totalRevenue - grossProfit)}
                  </span>
                </div>
              </div>
            </section>

            {/* Gross Profit */}
            <div className="mt-5 bg-gray-50 rounded-lg border border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">
                  مجمل الربح
                </span>

                <span
                  className={`text-base font-bold ${
                    grossProfit >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {formatMoney(grossProfit)}
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <section className="mt-8">
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
                <h4 className="text-sm font-bold text-gray-800">
                  المصروفات التشغيلية
                </h4>

                <span className="text-xs text-gray-500">ريال</span>
              </div>

              <div className="mt-2">
                {expenseData.filter(
                  (account) =>
                    account.code !== "5101" && account.code !== "5102",
                ).length === 0 ? (
                  <EmptyRow text="لا توجد مصروفات تشغيلية مسجلة" />
                ) : (
                  expenseData
                    .filter(
                      (account) =>
                        account.code !== "5101" && account.code !== "5102",
                    )
                    .map((account) => (
                      <StatementRow
                        key={account.code}
                        name={account.name}
                        amount={account.amount}
                      />
                    ))
                )}

                <div className="flex items-center justify-between py-3 mt-1 border-t border-gray-300">
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    إجمالي المصروفات التشغيلية
                  </span>

                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    {formatMoney(operatingExpenses)}
                  </span>
                </div>
              </div>
            </section>

            {/* Operating Profit */}
            <div className="mt-5 border-y border-gray-300 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">
                  الربح التشغيلي
                </span>

                <span
                  className={`text-base font-bold ${
                    operatingProfit >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {formatMoney(operatingProfit)}
                </span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="mt-5 rounded-xl bg-gray-900 px-5 py-5 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-400">النتيجة النهائية</p>

                  <h4 className="text-lg font-bold mt-1">
                    صافي الربح / الخسارة
                  </h4>
                </div>

                <div className="text-left sm:text-right">
                  <p
                    className={`text-xl font-bold ${
                      netProfit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatMoney(Math.abs(netProfit))}
                  </p>

                  <p className="text-[10px] text-gray-400 mt-1">
                    {netProfit >= 0 ? "صافي ربح" : "صافي خسارة"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
              تم إعداد التقرير بناءً على القيود اليومية المرحّلة
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
          PRINT
      ================================================== */}
      <div className="hidden print:block income-print">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">شركة الجابري</h1>

          <p className="text-sm mt-1">للعسل والزيوت الطبيعة وخدمات العمرة</p>

          <p className="text-xs text-gray-600 mt-1">البيضاء - اليمن</p>

          <p className="text-xs text-gray-600 mt-1">
            هاتف: <bdi dir="ltr">734 434 443</bdi>
          </p>

          <h2 className="text-lg font-bold mt-5">قائمة الدخل</h2>

          <p className="text-xs text-gray-600 mt-2">
            للفترة من {fromDate || "بداية النشاط"} إلى {toDate || "اليوم"}
          </p>
        </div>

        <table className="w-full border-collapse border border-gray-400 text-sm">
          <tbody>
            <tr>
              <td
                colSpan={2}
                className="border border-gray-400 p-2 font-bold bg-gray-100"
              >
                الإيرادات
              </td>
            </tr>

            {revenueData.map((account) => (
              <tr key={`print-revenue-${account.code}`}>
                <td className="border border-gray-400 p-2">{account.name}</td>

                <td className="border border-gray-400 p-2 text-left">
                  {formatMoney(account.amount)}
                </td>
              </tr>
            ))}

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                إجمالي الإيرادات
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(totalRevenue)}
              </td>
            </tr>

            <tr>
              <td
                colSpan={2}
                className="border border-gray-400 p-2 font-bold bg-gray-100"
              >
                تكلفة الإيرادات
              </td>
            </tr>

            {expenseData
              .filter(
                (account) => account.code === "5101" || account.code === "5102",
              )
              .map((account) => (
                <tr key={`print-cost-${account.code}`}>
                  <td className="border border-gray-400 p-2">{account.name}</td>

                  <td className="border border-gray-400 p-2 text-left">
                    {formatMoney(account.amount)}
                  </td>
                </tr>
              ))}

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                مجمل الربح
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(grossProfit)}
              </td>
            </tr>

            <tr>
              <td
                colSpan={2}
                className="border border-gray-400 p-2 font-bold bg-gray-100"
              >
                المصروفات التشغيلية
              </td>
            </tr>

            {expenseData
              .filter(
                (account) => account.code !== "5101" && account.code !== "5102",
              )
              .map((account) => (
                <tr key={`print-expense-${account.code}`}>
                  <td className="border border-gray-400 p-2">{account.name}</td>

                  <td className="border border-gray-400 p-2 text-left">
                    {formatMoney(account.amount)}
                  </td>
                </tr>
              ))}

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                الربح التشغيلي
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(operatingProfit)}
              </td>
            </tr>

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                صافي الربح / الخسارة
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(Math.abs(netProfit))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .income-print,
          .income-print * {
            visibility: visible;
          }

          .income-print {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            width: 100%;
            padding: 15px;
            background: white;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  type,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  type: "positive" | "negative";
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs text-gray-500">{title}</p>

          <p
            className={`text-base sm:text-lg font-bold mt-2 ${
              type === "positive" ? "text-green-700" : "text-red-700"
            }`}
          >
            {value}
          </p>

          <span className="text-[9px] sm:text-[10px] text-gray-400">
            {subtitle}
          </span>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            type === "positive"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatementRow({ name, amount }: { name: string; amount: number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-xs sm:text-sm text-gray-600">{name}</span>

      <span className="text-xs sm:text-sm text-gray-700">
        {amount.toLocaleString("ar-SA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="py-5 text-center">
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}
