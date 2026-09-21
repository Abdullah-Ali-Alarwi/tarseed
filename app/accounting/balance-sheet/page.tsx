"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useERPStore } from "@/Store/erpStore";
import {
  FiArrowDown,
  FiArrowUp,
  FiBarChart2,
  FiCalendar,
  FiChevronRight,
  FiDollarSign,
  FiFileText,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function normalizeDate(date: string) {
  if (!date) return "";
  return date.slice(0, 10);
}

type BalanceRow = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  debit: number;
  credit: number;
  balance: number;
};

export default function BalanceSheetPage() {
  const { accounts, journalEntries } = useERPStore();

  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  /*
   * حركات الحسابات حتى التاريخ المحدد
   */
  const accountMovements = useMemo(() => {
    const movements = new Map<
      string,
      {
        debit: number;
        credit: number;
      }
    >();

    journalEntries.forEach((entry) => {
      const entryDate = normalizeDate(entry.date);

      if (dateTo && entryDate > dateTo) return;

      entry.lines.forEach((line) => {
        const current = movements.get(line.accountId) || {
          debit: 0,
          credit: 0,
        };

        current.debit += Number(line.debit || 0);
        current.credit += Number(line.credit || 0);

        movements.set(line.accountId, current);
      });
    });

    return movements;
  }, [journalEntries, dateTo]);

  /*
   * تصفية الحسابات
   */
  const filterRows = (
    type: "asset" | "liability" | "equity",
    nature: "debit" | "credit",
  ) => {
    const query = search.trim().toLowerCase();

    return accounts
      .filter(
        (account) =>
          account.isActive !== false &&
          !account.isGroup &&
          account.type === type,
      )
      .map((account) => {
        const movement = accountMovements.get(account.id) || {
          debit: 0,
          credit: 0,
        };

        const balance =
          nature === "debit"
            ? movement.debit - movement.credit
            : movement.credit - movement.debit;

        return {
          accountId: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          nature: account.nature,
          debit: movement.debit,
          credit: movement.credit,
          balance,
        };
      })
      .filter((row) => {
        const matchesSearch =
          !query ||
          row.code.toLowerCase().includes(query) ||
          row.name.toLowerCase().includes(query);

        const matchesZero =
          showZeroBalances || Math.abs(row.balance) > 0.000001;

        return matchesSearch && matchesZero;
      });
  };

  const assetRows = useMemo(
    () => filterRows("asset", "debit"),
    [accounts, accountMovements, search, showZeroBalances],
  );

  const liabilityRows = useMemo(
    () => filterRows("liability", "credit"),
    [accounts, accountMovements, search, showZeroBalances],
  );

  const equityRows = useMemo(
    () => filterRows("equity", "credit"),
    [accounts, accountMovements, search, showZeroBalances],
  );

  /*
   * صافي الربح
   */
  const retainedEarnings = useMemo(() => {
    let revenues = 0;
    let expenses = 0;

    accounts.forEach((account) => {
      if (account.isActive === false || account.isGroup) return;

      const movement = accountMovements.get(account.id) || {
        debit: 0,
        credit: 0,
      };

      if (account.type === "revenue") {
        revenues += movement.credit - movement.debit;
      }

      if (account.type === "expense" || account.type === "cogs") {
        expenses += movement.debit - movement.credit;
      }
    });

    return {
      revenues,
      expenses,
      netProfit: revenues - expenses,
    };
  }, [accounts, accountMovements]);

  /*
   * الإجماليات
   */
  const totals = useMemo(() => {
    const assets = assetRows.reduce((sum, row) => sum + row.balance, 0);

    const liabilities = liabilityRows.reduce(
      (sum, row) => sum + row.balance,
      0,
    );

    const equityAccounts = equityRows.reduce(
      (sum, row) => sum + row.balance,
      0,
    );

    const totalEquity = equityAccounts + retainedEarnings.netProfit;

    const liabilitiesAndEquity = liabilities + totalEquity;

    const difference = assets - liabilitiesAndEquity;

    return {
      assets,
      liabilities,
      equityAccounts,
      totalEquity,
      liabilitiesAndEquity,
      difference,
    };
  }, [assetRows, liabilityRows, equityRows, retainedEarnings.netProfit]);

  const isBalanced = Math.abs(totals.difference) < 0.01;

  const totalAssetAccounts = assetRows.length;
  const totalLiabilityAccounts = liabilityRows.length;
  const totalEquityAccounts = equityRows.length;

  function clearFilters() {
    setDateTo("");
    setSearch("");
    setShowZeroBalances(false);
  }

  function handlePrint() {
    window.print();
  }

  /*
   * جدول الحسابات
   */
  function renderAccountTable(
    rows: BalanceRow[],
    emptyMessage: string,
    valueLabel: string,
  ) {
    if (rows.length === 0) {
      return (
        <div className="rounded-lg bg-gray-50 p-4 text-center text-[10px] text-gray-500 sm:text-xs">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-right text-xs">
          <thead className="bg-gray-50 text-[10px] text-gray-500 sm:text-xs">
            <tr>
              <th className="px-2.5 py-2.5 font-bold">رقم الحساب</th>
              <th className="px-2.5 py-2.5 font-bold">الحساب</th>

              {showDetails && (
                <>
                  <th className="px-2.5 py-2.5 font-bold">مدين</th>
                  <th className="px-2.5 py-2.5 font-bold">دائن</th>
                </>
              )}

              <th className="px-2.5 py-2.5 font-bold">{valueLabel}</th>

              <th className="px-2.5 py-2.5 font-bold print:hidden">
                الإجراءات
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.accountId} className="transition hover:bg-gray-50">
                <td className="px-2.5 py-2.5">
                  <Link
                    href={`/accounting/ledger?account=${encodeURIComponent(
                      row.accountId,
                    )}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>

                <td className="px-2.5 py-2.5 text-xs font-medium text-gray-800">
                  {row.name}
                </td>

                {showDetails && (
                  <>
                    <td className="px-2.5 py-2.5 text-[10px] text-gray-500 sm:text-xs">
                      {formatMoney(row.debit)}
                    </td>

                    <td className="px-2.5 py-2.5 text-[10px] text-gray-500 sm:text-xs">
                      {formatMoney(row.credit)}
                    </td>
                  </>
                )}

                <td className="px-2.5 py-2.5 text-xs font-bold">
                  <span
                    className={
                      row.balance >= 0 ? "text-gray-900" : "text-red-600"
                    }
                  >
                    {formatMoney(Math.abs(row.balance))}
                  </span>
                </td>

                <td className="px-2.5 py-2.5 print:hidden">
                  <Link
                    href={`/accounting/ledger?account=${encodeURIComponent(
                      row.accountId,
                    )}`}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-[10px] font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    كشف الحساب
                    <FiChevronRight className="text-[10px]" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 p-2.5 sm:p-3 md:p-4 lg:p-5 print:bg-white print:p-0"
    >
      <div className="mx-auto max-w-[1450px] space-y-4">
        {/* Header */}
        <div className="rounded-xl bg-white p-3 shadow-sm print:shadow-none sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-11 sm:w-11">
                <FiBarChart2 className="text-lg" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                  الميزانية العمومية
                </h1>

                <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">
                  بيان الأصول والالتزامات وحقوق الملكية حتى تاريخ محدد
                </p>

                <p className="mt-1.5 text-[9px] font-medium text-gray-400 sm:text-[10px]">
                  حتى تاريخ: {dateTo || "حتى آخر حركة مسجلة"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 print:hidden">
              <Link
                href="/accounting"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[10px] font-medium text-gray-700 transition hover:bg-gray-50 sm:text-xs"
              >
                <FiChevronRight />
                المحاسبة
              </Link>

              <Link
                href="/accounting/income-statement"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[10px] font-medium text-gray-700 transition hover:bg-gray-50 sm:text-xs"
              >
                <FiFileText />
                قائمة الدخل
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-[10px] font-medium text-white transition hover:bg-gray-800 sm:text-xs"
              >
                <FiPrinter />
                طباعة
              </button>
            </div>
          </div>
        </div>

        {/* Print company header */}
        <div className="hidden print:block">
          <div className="mb-5 border-b-2 border-gray-900 pb-3 text-center">
            <h1 className="text-xl font-bold">شركة الجابري</h1>

            <p className="mt-1 text-xs">للعسل والزيوت الطبيعة وخدمات العمرة</p>

            <p className="text-xs">البيضاء - اليمن</p>

            <p className="text-xs">هاتف: 734 434 443</p>

            <h2 className="mt-4 text-lg font-bold">الميزانية العمومية</h2>

            <p className="mt-1 text-xs">كما في: {dateTo || "آخر حركة مسجلة"}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl bg-white p-3 shadow-sm print:hidden">
          <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-900 sm:text-sm">
                البحث وتحديد التاريخ
              </h2>

              <p className="mt-0.5 text-[9px] text-gray-500 sm:text-[10px]">
                الميزانية تعرض الأرصدة المتراكمة حتى التاريخ المحدد
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 self-start text-[10px] font-medium text-blue-600 hover:text-blue-700 sm:text-xs"
            >
              <FiRefreshCw />
              مسح الفلاتر
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-[10px] font-medium text-gray-700 sm:text-xs">
                البحث في الحسابات
              </label>

              <div className="relative">
                <FiSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم الحساب أو اسم الحساب..."
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-[10px] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-xs"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-gray-700 sm:text-xs">
                حتى تاريخ
              </label>

              <div className="relative">
                <FiCalendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-2.5 text-[10px] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-xs"
                />
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-4 border-t border-gray-100 pt-2.5">
            <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-gray-700 sm:text-xs">
              <input
                type="checkbox"
                checked={showZeroBalances}
                onChange={(e) => setShowZeroBalances(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              عرض الحسابات ذات الرصيد الصفري
            </label>

            <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-gray-700 sm:text-xs">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              عرض تفاصيل الحركة
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
          {/* Assets */}
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-500 sm:text-xs">
                  إجمالي الأصول
                </p>

                <p className="mt-1 text-lg font-bold text-blue-700 sm:text-xl">
                  {formatMoney(totals.assets)}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FiDollarSign className="text-base" />
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-500 sm:text-xs">
                  إجمالي الالتزامات
                </p>

                <p className="mt-1 text-lg font-bold text-orange-700 sm:text-xl">
                  {formatMoney(totals.liabilities)}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <FiTrendingDown className="text-base" />
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-500 sm:text-xs">
                  حقوق الملكية
                </p>

                <p className="mt-1 text-lg font-bold text-purple-700 sm:text-xl">
                  {formatMoney(totals.totalEquity)}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <FiTrendingUp className="text-base" />
              </div>
            </div>
          </div>

          {/* Balance status */}
          <div
            className={`rounded-xl p-3 shadow-sm ${
              isBalanced ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p
                  className={`text-[10px] ${
                    isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  حالة الميزانية
                </p>

                <p
                  className={`mt-1 text-base font-bold sm:text-lg ${
                    isBalanced ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isBalanced ? "متوازنة" : "غير متوازنة"}
                </p>
              </div>

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white ${
                  isBalanced ? "text-green-600" : "text-red-600"
                }`}
              >
                {isBalanced ? (
                  <FiArrowUp className="text-base" />
                ) : (
                  <FiArrowDown className="text-base" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Balance status */}
        <div
          className={`rounded-xl border p-3 ${
            isBalanced
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className={`text-xs font-bold sm:text-sm ${
                  isBalanced ? "text-green-800" : "text-red-800"
                }`}
              >
                {isBalanced
                  ? "الميزانية العمومية متوازنة"
                  : "الميزانية العمومية غير متوازنة"}
              </p>

              <p className="mt-0.5 text-[9px] text-gray-600 sm:text-[10px]">
                الأصول: {formatMoney(totals.assets)} | الالتزامات وحقوق الملكية:{" "}
                {formatMoney(totals.liabilitiesAndEquity)}
              </p>
            </div>

            {!isBalanced && (
              <div className="text-xs font-bold text-red-700">
                الفرق: {formatMoney(Math.abs(totals.difference))}
              </div>
            )}
          </div>
        </div>

        {/* Main statement */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="p-3 sm:p-4">
            {/* Assets */}
            <section>
              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FiTrendingUp className="text-sm" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                      الأصول
                    </h2>

                    <p className="text-[9px] text-gray-500 sm:text-[10px]">
                      {totalAssetAccounts} حساب
                    </p>
                  </div>
                </div>

                <div className="text-base font-bold text-blue-700 sm:text-lg">
                  {formatMoney(totals.assets)}
                </div>
              </div>

              {renderAccountTable(
                assetRows,
                "لا توجد أصول مسجلة خلال الفترة المحددة.",
                "الرصيد",
              )}

              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-blue-50 p-2.5">
                <span className="text-xs font-bold text-blue-900">
                  إجمالي الأصول
                </span>

                <span className="text-base font-bold text-blue-700">
                  {formatMoney(totals.assets)}
                </span>
              </div>
            </section>

            {/* Liabilities */}
            <section className="mt-5">
              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <FiTrendingDown className="text-sm" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                      الالتزامات
                    </h2>

                    <p className="text-[9px] text-gray-500 sm:text-[10px]">
                      {totalLiabilityAccounts} حساب
                    </p>
                  </div>
                </div>

                <div className="text-base font-bold text-orange-700 sm:text-lg">
                  {formatMoney(totals.liabilities)}
                </div>
              </div>

              {renderAccountTable(
                liabilityRows,
                "لا توجد التزامات مسجلة خلال الفترة المحددة.",
                "الرصيد",
              )}

              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-orange-50 p-2.5">
                <span className="text-xs font-bold text-orange-900">
                  إجمالي الالتزامات
                </span>

                <span className="text-base font-bold text-orange-700">
                  {formatMoney(totals.liabilities)}
                </span>
              </div>
            </section>

            {/* Equity */}
            <section className="mt-5">
              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <FiBarChart2 className="text-sm" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                      حقوق الملكية
                    </h2>

                    <p className="text-[9px] text-gray-500 sm:text-[10px]">
                      {totalEquityAccounts} حساب
                    </p>
                  </div>
                </div>

                <div className="text-base font-bold text-purple-700 sm:text-lg">
                  {formatMoney(totals.totalEquity)}
                </div>
              </div>

              {renderAccountTable(
                equityRows,
                "لا توجد حسابات حقوق ملكية مسجلة.",
                "الرصيد",
              )}

              {/* Net profit */}
              <div className="mt-2.5 rounded-lg border border-green-100 bg-green-50 p-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-900">
                      صافي الربح / الخسارة
                    </p>

                    <p className="mt-0.5 text-[9px] text-green-700 sm:text-[10px]">
                      يتم احتسابها من قائمة الدخل وإضافتها إلى حقوق الملكية
                    </p>
                  </div>

                  <p
                    className={`text-base font-bold sm:text-lg ${
                      retainedEarnings.netProfit >= 0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {formatMoney(Math.abs(retainedEarnings.netProfit))}
                  </p>
                </div>

                <div className="mt-1 text-[9px] font-medium sm:text-[10px]">
                  <span
                    className={
                      retainedEarnings.netProfit >= 0
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {retainedEarnings.netProfit >= 0
                      ? "صافي ربح"
                      : "صافي خسارة"}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-purple-50 p-2.5">
                <span className="text-xs font-bold text-purple-900">
                  إجمالي حقوق الملكية
                </span>

                <span className="text-base font-bold text-purple-700">
                  {formatMoney(totals.totalEquity)}
                </span>
              </div>
            </section>

            {/* Accounting equation */}
            <section className="mt-5">
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-3">
                <div className="mb-3 text-center">
                  <h2 className="text-sm font-bold text-gray-900">
                    المعادلة المحاسبية
                  </h2>

                  <p className="mt-0.5 text-[9px] text-gray-500 sm:text-[10px]">
                    الأصول = الالتزامات + حقوق الملكية
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                    <p className="text-[10px] text-gray-500">الأصول</p>

                    <p className="mt-1 text-lg font-bold text-blue-700">
                      {formatMoney(totals.assets)}
                    </p>
                  </div>

                  <div className="flex items-center justify-center text-lg font-bold text-gray-400">
                    =
                  </div>

                  <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                    <p className="text-[10px] text-gray-500">
                      الالتزامات + حقوق الملكية
                    </p>

                    <p className="mt-1 text-lg font-bold text-purple-700">
                      {formatMoney(totals.liabilitiesAndEquity)}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-2.5 rounded-lg p-3 text-center ${
                    isBalanced
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <p className="text-xs font-bold">
                    {isBalanced
                      ? "✓ المعادلة المحاسبية متوازنة"
                      : "✕ يوجد فرق في المعادلة المحاسبية"}
                  </p>

                  <p className="mt-0.5 text-[9px] sm:text-[10px]">
                    الفرق: {formatMoney(Math.abs(totals.difference))}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block">
          <div className="mt-8 border-t border-gray-300 pt-3 text-center text-[10px] text-gray-500">
            شركة الجابري - للعسل والزيوت الطبيعة وخدمات العمرة
            <br />
            البيضاء - اليمن | هاتف: 734 434 443
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          main {
            padding: 0 !important;
          }

          section,
          tr {
            break-inside: avoid;
          }

          table {
            font-size: 9px;
          }

          th,
          td {
            padding: 5px 7px !important;
          }
        }
      `}</style>
    </main>
  );
}
