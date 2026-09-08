"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiBarChart2,
  FiFilter,
  FiPrinter,
  FiRefreshCw,
  FiChevronLeft,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiCreditCard,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

type AccountDefinition = {
  code: string;
  name: string;
};

const assetAccounts: AccountDefinition[] = [
  { code: "1101", name: "الصندوق" },
  { code: "1102", name: "البنك" },
  { code: "1103", name: "العملاء" },
  { code: "1104", name: "المخزون" },
  { code: "1105", name: "المصروفات المقدمة" },
  { code: "1201", name: "الأثاث والتجهيزات" },
  { code: "1202", name: "المعدات" },
  { code: "1203", name: "السيارات" },
  { code: "1204", name: "مجمع الإهلاك" },
];

const liabilityAccounts: AccountDefinition[] = [
  { code: "2101", name: "الموردون" },
  { code: "2102", name: "مصروفات مستحقة" },
  { code: "2103", name: "ضرائب مستحقة" },
  { code: "2104", name: "دفعات مقدمة من العملاء" },
];

const equityAccounts: AccountDefinition[] = [
  { code: "3101", name: "رأس المال" },
  { code: "3102", name: "الأرباح المحتجزة" },
  { code: "3103", name: "المسحوبات الشخصية" },
];

export default function BalanceSheetPage() {
  const { journalEntries } = useERPStore();

  const [asOfDate, setAsOfDate] = useState("");

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

      if (asOfDate && entry.date > asOfDate) {
        return false;
      }

      return true;
    });
  }, [journalEntries, asOfDate]);

  const balances = useMemo(() => {
    const result: Record<
      string,
      {
        debit: number;
        credit: number;
        balance: number;
      }
    > = {};

    postedEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!result[line.accountCode]) {
          result[line.accountCode] = {
            debit: 0,
            credit: 0,
            balance: 0,
          };
        }

        result[line.accountCode].debit += Number(line.debit || 0);

        result[line.accountCode].credit += Number(line.credit || 0);

        result[line.accountCode].balance =
          result[line.accountCode].debit - result[line.accountCode].credit;
      });
    });

    return result;
  }, [postedEntries]);

  const getAccountBalance = (
    code: string,
    type: "asset" | "liability" | "equity",
  ) => {
    const data = balances[code];

    if (!data) {
      return 0;
    }

    if (type === "asset") {
      return data.balance;
    }

    return data.credit - data.debit;
  };

  const assetRows = useMemo(() => {
    return assetAccounts
      .map((account) => ({
        ...account,
        amount: getAccountBalance(account.code, "asset"),
      }))
      .filter((account) => account.amount !== 0);
  }, [balances]);

  const liabilityRows = useMemo(() => {
    return liabilityAccounts
      .map((account) => ({
        ...account,
        amount: getAccountBalance(account.code, "liability"),
      }))
      .filter((account) => account.amount !== 0);
  }, [balances]);

  const equityRows = useMemo(() => {
    return equityAccounts
      .map((account) => ({
        ...account,
        amount: getAccountBalance(account.code, "equity"),
      }))
      .filter((account) => account.amount !== 0);
  }, [balances]);

  const totalAssets = useMemo(() => {
    return assetRows.reduce((sum, account) => sum + account.amount, 0);
  }, [assetRows]);

  const totalLiabilities = useMemo(() => {
    return liabilityRows.reduce((sum, account) => sum + account.amount, 0);
  }, [liabilityRows]);

  const totalRecordedEquity = useMemo(() => {
    return equityRows.reduce((sum, account) => sum + account.amount, 0);
  }, [equityRows]);

  const totalRevenue = useMemo(() => {
    return postedEntries.reduce((sum, entry) => {
      return (
        sum +
        entry.lines
          .filter((line) => String(line.accountCode).startsWith("4"))
          .reduce((lineSum, line) => lineSum + Number(line.credit || 0), 0)
      );
    }, 0);
  }, [postedEntries]);

  const totalExpenses = useMemo(() => {
    return postedEntries.reduce((sum, entry) => {
      return (
        sum +
        entry.lines
          .filter((line) => String(line.accountCode).startsWith("5"))
          .reduce((lineSum, line) => lineSum + Number(line.debit || 0), 0)
      );
    }, 0);
  }, [postedEntries]);

  const currentProfit = totalRevenue - totalExpenses;

  const totalEquity = totalRecordedEquity + currentProfit;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const difference = totalAssets - totalLiabilitiesAndEquity;

  const isBalanced = Math.abs(difference) < 0.01;

  const resetFilters = () => {
    setAsOfDate("");
  };

  const handlePrint = () => {
    window.print();
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

            <span className="text-gray-700">الميزانية العمومية</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                الميزانية العمومية
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                عرض الأصول والالتزامات وحقوق الملكية
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

          <h2 className="text-sm font-bold text-gray-800">تاريخ الميزانية</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-2">
              كما في تاريخ
            </label>

            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs sm:text-sm text-gray-600 transition"
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
          title="إجمالي الأصول"
          value={formatMoney(totalAssets)}
          subtitle="ريال"
          icon={<FiPackage />}
        />

        <SummaryCard
          title="إجمالي الالتزامات"
          value={formatMoney(totalLiabilities)}
          subtitle="ريال"
          icon={<FiCreditCard />}
        />

        <SummaryCard
          title="حقوق الملكية"
          value={formatMoney(totalEquity)}
          subtitle="ريال"
          icon={<FiUsers />}
        />

        <SummaryCard
          title="صافي الربح"
          value={formatMoney(currentProfit)}
          subtitle="ريال"
          icon={<FiDollarSign />}
        />
      </div>

      {/* ==================================================
          BALANCE STATUS
      ================================================== */}
      <div
        className={`rounded-xl border p-4 mb-6 print:hidden ${
          isBalanced
            ? "bg-green-50 border-green-100"
            : "bg-red-50 border-red-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p
              className={`text-sm font-bold ${
                isBalanced ? "text-green-700" : "text-red-700"
              }`}
            >
              {isBalanced ? "الميزانية متوازنة" : "الميزانية غير متوازنة"}
            </p>

            <p
              className={`text-xs mt-1 ${
                isBalanced ? "text-green-600" : "text-red-600"
              }`}
            >
              الأصول = الالتزامات + حقوق الملكية
            </p>
          </div>

          <div
            className={`text-sm font-bold ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            الفرق: {formatMoney(Math.abs(difference))} ريال
          </div>
        </div>
      </div>

      {/* ==================================================
          BALANCE SHEET
      ================================================== */}
      <div className="max-w-5xl mx-auto">
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
              الميزانية العمومية
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              كما في{" "}
              <span className="font-medium">{asOfDate || "تاريخ اليوم"}</span>
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {/* ==================================================
                ASSETS
            ================================================== */}
            <section>
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
                <h4 className="text-sm font-bold text-gray-800">الأصول</h4>

                <span className="text-xs text-gray-500">ريال</span>
              </div>

              <div className="mt-2">
                {assetRows.length === 0 ? (
                  <EmptyRow text="لا توجد أصول مسجلة" />
                ) : (
                  assetRows.map((account) => (
                    <BalanceRow
                      key={account.code}
                      code={account.code}
                      name={account.name}
                      amount={account.amount}
                    />
                  ))
                )}

                <div className="flex items-center justify-between py-3 mt-1 border-t border-gray-300">
                  <span className="text-sm font-bold text-gray-800">
                    إجمالي الأصول
                  </span>

                  <span className="text-sm font-bold text-gray-800">
                    {formatMoney(totalAssets)}
                  </span>
                </div>
              </div>
            </section>

            {/* ==================================================
                LIABILITIES
            ================================================== */}
            <section className="mt-8">
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
                <h4 className="text-sm font-bold text-gray-800">الالتزامات</h4>

                <span className="text-xs text-gray-500">ريال</span>
              </div>

              <div className="mt-2">
                {liabilityRows.length === 0 ? (
                  <EmptyRow text="لا توجد التزامات مسجلة" />
                ) : (
                  liabilityRows.map((account) => (
                    <BalanceRow
                      key={account.code}
                      code={account.code}
                      name={account.name}
                      amount={account.amount}
                    />
                  ))
                )}

                <div className="flex items-center justify-between py-3 mt-1 border-t border-gray-300">
                  <span className="text-sm font-bold text-gray-800">
                    إجمالي الالتزامات
                  </span>

                  <span className="text-sm font-bold text-gray-800">
                    {formatMoney(totalLiabilities)}
                  </span>
                </div>
              </div>
            </section>

            {/* ==================================================
                EQUITY
            ================================================== */}
            <section className="mt-8">
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
                <h4 className="text-sm font-bold text-gray-800">
                  حقوق الملكية
                </h4>

                <span className="text-xs text-gray-500">ريال</span>
              </div>

              <div className="mt-2">
                {equityRows.length === 0 ? (
                  <EmptyRow text="لا توجد حقوق ملكية مسجلة" />
                ) : (
                  equityRows.map((account) => (
                    <BalanceRow
                      key={account.code}
                      code={account.code}
                      name={account.name}
                      amount={account.amount}
                    />
                  ))
                )}

                <BalanceRow
                  code=""
                  name="صافي الربح / الخسارة"
                  amount={currentProfit}
                />

                <div className="flex items-center justify-between py-3 mt-1 border-t border-gray-300">
                  <span className="text-sm font-bold text-gray-800">
                    إجمالي حقوق الملكية
                  </span>

                  <span className="text-sm font-bold text-gray-800">
                    {formatMoney(totalEquity)}
                  </span>
                </div>
              </div>
            </section>

            {/* ==================================================
                TOTAL
            ================================================== */}
            <div className="mt-8 bg-gray-900 rounded-xl px-5 py-5 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">
                    إجمالي الالتزامات وحقوق الملكية
                  </p>

                  <h4 className="text-lg font-bold mt-1">
                    الالتزامات + حقوق الملكية
                  </h4>
                </div>

                <p className="text-xl font-bold">
                  {formatMoney(totalLiabilitiesAndEquity)}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
              تم إعداد الميزانية بناءً على القيود اليومية المرحّلة
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
          PRINT
      ================================================== */}
      <div className="hidden print:block balance-print">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">شركة الجابري</h1>

          <p className="text-sm mt-1">للعسل والزيوت الطبيعة وخدمات العمرة</p>

          <p className="text-xs text-gray-600 mt-1">البيضاء - اليمن</p>

          <p className="text-xs text-gray-600 mt-1">
            هاتف: <bdi dir="ltr">734 434 443</bdi>
          </p>

          <h2 className="text-lg font-bold mt-5">الميزانية العمومية</h2>

          <p className="text-xs text-gray-600 mt-2">
            كما في {asOfDate || "تاريخ اليوم"}
          </p>
        </div>

        <table className="w-full border-collapse border border-gray-400 text-sm">
          <tbody>
            <tr>
              <td
                colSpan={2}
                className="border border-gray-400 p-2 font-bold bg-gray-100"
              >
                الأصول
              </td>
            </tr>

            {assetRows.map((account) => (
              <tr key={`print-asset-${account.code}`}>
                <td className="border border-gray-400 p-2">{account.name}</td>

                <td className="border border-gray-400 p-2 text-left">
                  {formatMoney(account.amount)}
                </td>
              </tr>
            ))}

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                إجمالي الأصول
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(totalAssets)}
              </td>
            </tr>

            <tr>
              <td
                colSpan={2}
                className="border border-gray-400 p-2 font-bold bg-gray-100"
              >
                الالتزامات
              </td>
            </tr>

            {liabilityRows.map((account) => (
              <tr key={`print-liability-${account.code}`}>
                <td className="border border-gray-400 p-2">{account.name}</td>

                <td className="border border-gray-400 p-2 text-left">
                  {formatMoney(account.amount)}
                </td>
              </tr>
            ))}

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                إجمالي الالتزامات
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(totalLiabilities)}
              </td>
            </tr>

            <tr>
              <td
                colSpan={2}
                className="border border-gray-400 p-2 font-bold bg-gray-100"
              >
                حقوق الملكية
              </td>
            </tr>

            {equityRows.map((account) => (
              <tr key={`print-equity-${account.code}`}>
                <td className="border border-gray-400 p-2">{account.name}</td>

                <td className="border border-gray-400 p-2 text-left">
                  {formatMoney(account.amount)}
                </td>
              </tr>
            ))}

            <tr>
              <td className="border border-gray-400 p-2">
                صافي الربح / الخسارة
              </td>

              <td className="border border-gray-400 p-2 text-left">
                {formatMoney(currentProfit)}
              </td>
            </tr>

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                إجمالي حقوق الملكية
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(totalEquity)}
              </td>
            </tr>

            <tr>
              <td className="border border-gray-400 p-2 font-bold">
                إجمالي الالتزامات وحقوق الملكية
              </td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(totalLiabilitiesAndEquity)}
              </td>
            </tr>

            <tr>
              <td className="border border-gray-400 p-2 font-bold">الفرق</td>

              <td className="border border-gray-400 p-2 font-bold text-left">
                {formatMoney(Math.abs(difference))}
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

          .balance-print,
          .balance-print * {
            visibility: visible;
          }

          .balance-print {
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
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs text-gray-500">{title}</p>

          <p className="text-base sm:text-lg font-bold text-gray-800 mt-2">
            {value}
          </p>

          <span className="text-[9px] sm:text-[10px] text-gray-400">
            {subtitle}
          </span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BalanceRow({
  code,
  name,
  amount,
}: {
  code: string;
  name: string;
  amount: number;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2">
        {code && (
          <span className="font-mono text-[10px] text-gray-400">{code}</span>
        )}

        <span className="text-xs sm:text-sm text-gray-600">{name}</span>
      </div>

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
