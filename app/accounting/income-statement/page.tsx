"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useERPStore } from "@/Store/erpStore";
import {
  FiArrowDown,
  FiArrowUp,
  FiBarChart2,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiDollarSign,
  FiFileText,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
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

function getAccountTypeLabel(type: string) {
  const types: Record<string, string> = {
    asset: "أصول",
    liability: "التزامات",
    equity: "حقوق ملكية",
    revenue: "إيرادات",
    expense: "مصروفات",
    cogs: "تكلفة المبيعات",
  };

  return types[type] || type || "-";
}

type StatementRow = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  amount: number;
};

export default function IncomeStatementPage() {
  const { accounts, journalEntries } = useERPStore();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [showDetails, setShowDetails] = useState(true);

  /*
   * حساب حركة الحسابات خلال الفترة المحددة.
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

      if (dateFrom && entryDate < dateFrom) return;
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
  }, [journalEntries, dateFrom, dateTo]);

  /*
   * الإيرادات.
   *
   * حسابات الإيرادات طبيعتها دائنة،
   * لذلك قيمة الإيراد = الدائن - المدين.
   */
  const revenueRows = useMemo<StatementRow[]>(() => {
    const query = search.trim().toLowerCase();

    return accounts
      .filter(
        (account) =>
          account.isActive !== false &&
          !account.isGroup &&
          account.type === "revenue",
      )
      .map((account) => {
        const movement = accountMovements.get(account.id) || {
          debit: 0,
          credit: 0,
        };

        const amount = movement.credit - movement.debit;

        return {
          accountId: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debit: movement.debit,
          credit: movement.credit,
          amount,
        };
      })
      .filter((row) => {
        if (!query) return true;

        return (
          row.code.toLowerCase().includes(query) ||
          row.name.toLowerCase().includes(query)
        );
      });
  }, [accounts, accountMovements, search]);

  /*
   * تكلفة المبيعات.
   */
  const cogsRows = useMemo<StatementRow[]>(() => {
    const query = search.trim().toLowerCase();

    return accounts
      .filter(
        (account) =>
          account.isActive !== false &&
          !account.isGroup &&
          account.type === "cogs",
      )
      .map((account) => {
        const movement = accountMovements.get(account.id) || {
          debit: 0,
          credit: 0,
        };

        const amount = movement.debit - movement.credit;

        return {
          accountId: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debit: movement.debit,
          credit: movement.credit,
          amount,
        };
      })
      .filter((row) => {
        if (!query) return true;

        return (
          row.code.toLowerCase().includes(query) ||
          row.name.toLowerCase().includes(query)
        );
      });
  }, [accounts, accountMovements, search]);

  /*
   * المصروفات.
   */
  const expenseRows = useMemo<StatementRow[]>(() => {
    const query = search.trim().toLowerCase();

    return accounts
      .filter(
        (account) =>
          account.isActive !== false &&
          !account.isGroup &&
          account.type === "expense",
      )
      .map((account) => {
        const movement = accountMovements.get(account.id) || {
          debit: 0,
          credit: 0,
        };

        const amount = movement.debit - movement.credit;

        return {
          accountId: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debit: movement.debit,
          credit: movement.credit,
          amount,
        };
      })
      .filter((row) => {
        if (!query) return true;

        return (
          row.code.toLowerCase().includes(query) ||
          row.name.toLowerCase().includes(query)
        );
      });
  }, [accounts, accountMovements, search]);

  const totals = useMemo(() => {
    const revenue = revenueRows.reduce((sum, row) => sum + row.amount, 0);

    const cogs = cogsRows.reduce((sum, row) => sum + row.amount, 0);

    const expenses = expenseRows.reduce((sum, row) => sum + row.amount, 0);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    return {
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
    };
  }, [revenueRows, cogsRows, expenseRows]);

  const totalRevenueDebit = revenueRows.reduce(
    (sum, row) => sum + row.debit,
    0,
  );

  const totalRevenueCredit = revenueRows.reduce(
    (sum, row) => sum + row.credit,
    0,
  );

  const totalCogsDebit = cogsRows.reduce((sum, row) => sum + row.debit, 0);

  const totalCogsCredit = cogsRows.reduce((sum, row) => sum + row.credit, 0);

  const totalExpenseDebit = expenseRows.reduce(
    (sum, row) => sum + row.debit,
    0,
  );

  const totalExpenseCredit = expenseRows.reduce(
    (sum, row) => sum + row.credit,
    0,
  );

  const totalRevenueAccounts = revenueRows.length;
  const totalCogsAccounts = cogsRows.length;
  const totalExpenseAccounts = expenseRows.length;

  const periodLabel =
    dateFrom || dateTo
      ? `${dateFrom || "البداية"} إلى ${dateTo || "النهاية"}`
      : "جميع الفترات";

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-white p-5 shadow-sm print:shadow-none sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiBarChart2 className="text-2xl" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  قائمة الدخل
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  بيان الإيرادات وتكلفة المبيعات والمصروفات وصافي الربح أو
                  الخسارة
                </p>

                <p className="mt-2 text-xs font-medium text-gray-400">
                  الفترة: {periodLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <Link
                href="/accounting"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <FiChevronRight />
                المحاسبة
              </Link>

              <Link
                href="/accounting/trial-balance"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <FiFileText />
                ميزان المراجعة
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                <FiPrinter />
                طباعة
              </button>
            </div>
          </div>
        </div>

        {/* Company header for print */}
        <div className="hidden print:block">
          <div className="mb-6 border-b-2 border-gray-900 pb-4 text-center">
            <h1 className="text-2xl font-bold">شركة الجابري</h1>

            <p className="mt-1 text-sm">للعسل والزيوت الطبيعة وخدمات العمرة</p>

            <p className="text-sm">البيضاء - اليمن</p>

            <p className="text-sm">هاتف: 734 434 443</p>

            <h2 className="mt-5 text-xl font-bold">قائمة الدخل</h2>

            <p className="mt-2 text-sm">الفترة: {periodLabel}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-5 shadow-sm print:hidden">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">البحث وتحديد الفترة</h2>

              <p className="mt-1 text-xs text-gray-500">
                حدد الفترة التي تريد عرض نتائجها
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 self-start text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <FiRefreshCw />
              مسح الفلاتر
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Search */}
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                البحث في الحسابات
              </label>

              <div className="relative">
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم أو اسم الحساب..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* From */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                من تاريخ
              </label>

              <div className="relative">
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-10 pl-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* To */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                إلى تاريخ
              </label>

              <div className="relative">
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-10 pl-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              عرض تفاصيل الحسابات
            </label>
          </div>
        </div>

        {/* Main result */}
        <div className="rounded-2xl bg-white shadow-sm">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-5 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">إجمالي الإيرادات</p>

                  <p className="mt-2 text-xl font-bold text-green-800">
                    {formatMoney(totals.revenue)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-green-600">
                  <FiArrowUp className="text-xl" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">تكلفة المبيعات</p>

                  <p className="mt-2 text-xl font-bold text-orange-800">
                    {formatMoney(totals.cogs)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600">
                  <FiDollarSign className="text-xl" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">مجمل الربح</p>

                  <p className="mt-2 text-xl font-bold text-blue-800">
                    {formatMoney(totals.grossProfit)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600">
                  <FiBarChart2 className="text-xl" />
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-5 ${
                totals.netProfit >= 0
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-red-100 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm ${
                      totals.netProfit >= 0
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    صافي الربح / الخسارة
                  </p>

                  <p
                    className={`mt-2 text-xl font-bold ${
                      totals.netProfit >= 0
                        ? "text-emerald-800"
                        : "text-red-800"
                    }`}
                  >
                    {formatMoney(Math.abs(totals.netProfit))}
                  </p>

                  <p
                    className={`mt-1 text-xs font-medium ${
                      totals.netProfit >= 0
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {totals.netProfit >= 0 ? "صافي ربح" : "صافي خسارة"}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white ${
                    totals.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {totals.netProfit >= 0 ? (
                    <FiArrowUp className="text-xl" />
                  ) : (
                    <FiArrowDown className="text-xl" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Income statement */}
          <div className="p-5 sm:p-6">
            {/* Revenue */}
            <section>
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <FiArrowUp />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900">الإيرادات</h2>

                    <p className="text-xs text-gray-500">
                      {totalRevenueAccounts} حساب
                    </p>
                  </div>
                </div>

                <div className="text-lg font-bold text-green-700">
                  {formatMoney(totals.revenue)}
                </div>
              </div>

              {showDetails && revenueRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-right text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-bold">رقم الحساب</th>

                        <th className="px-4 py-3 font-bold">الحساب</th>

                        <th className="px-4 py-3 font-bold">مدين</th>

                        <th className="px-4 py-3 font-bold">دائن</th>

                        <th className="px-4 py-3 font-bold">الإيراد</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {revenueRows.map((row) => (
                        <tr key={row.accountId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/accounting/ledger?account=${encodeURIComponent(
                                row.accountId,
                              )}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {row.code}
                            </Link>
                          </td>

                          <td className="px-4 py-3 font-medium text-gray-800">
                            {row.name}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {formatMoney(row.debit)}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {formatMoney(row.credit)}
                          </td>

                          <td className="px-4 py-3 font-bold text-green-700">
                            {formatMoney(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showDetails && revenueRows.length === 0 && (
                <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
                  لا توجد إيرادات مسجلة خلال الفترة المحددة.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-bold text-gray-800">
                  إجمالي الإيرادات
                </span>

                <span className="text-lg font-bold text-green-700">
                  {formatMoney(totals.revenue)}
                </span>
              </div>
            </section>

            {/* COGS */}
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <FiDollarSign />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900">تكلفة المبيعات</h2>

                    <p className="text-xs text-gray-500">
                      {totalCogsAccounts} حساب
                    </p>
                  </div>
                </div>

                <div className="text-lg font-bold text-orange-700">
                  {formatMoney(totals.cogs)}
                </div>
              </div>

              {showDetails && cogsRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-right text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-bold">رقم الحساب</th>

                        <th className="px-4 py-3 font-bold">الحساب</th>

                        <th className="px-4 py-3 font-bold">مدين</th>

                        <th className="px-4 py-3 font-bold">دائن</th>

                        <th className="px-4 py-3 font-bold">التكلفة</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {cogsRows.map((row) => (
                        <tr key={row.accountId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/accounting/ledger?account=${encodeURIComponent(
                                row.accountId,
                              )}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {row.code}
                            </Link>
                          </td>

                          <td className="px-4 py-3 font-medium text-gray-800">
                            {row.name}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {formatMoney(row.debit)}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {formatMoney(row.credit)}
                          </td>

                          <td className="px-4 py-3 font-bold text-orange-700">
                            {formatMoney(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showDetails && cogsRows.length === 0 && (
                <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
                  لا توجد تكلفة مبيعات مسجلة خلال الفترة المحددة.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-bold text-gray-800">
                  إجمالي تكلفة المبيعات
                </span>

                <span className="text-lg font-bold text-orange-700">
                  {formatMoney(totals.cogs)}
                </span>
              </div>
            </section>

            {/* Gross profit */}
            <section className="mt-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      مجمل الربح
                    </p>

                    <p className="mt-1 text-xs text-blue-600">
                      الإيرادات - تكلفة المبيعات
                    </p>
                  </div>

                  <p
                    className={`text-2xl font-bold ${
                      totals.grossProfit >= 0 ? "text-blue-800" : "text-red-700"
                    }`}
                  >
                    {formatMoney(Math.abs(totals.grossProfit))}
                  </p>
                </div>
              </div>
            </section>

            {/* Expenses */}
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <FiArrowDown />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900">
                      المصروفات التشغيلية والإدارية
                    </h2>

                    <p className="text-xs text-gray-500">
                      {totalExpenseAccounts} حساب
                    </p>
                  </div>
                </div>

                <div className="text-lg font-bold text-red-700">
                  {formatMoney(totals.expenses)}
                </div>
              </div>

              {showDetails && expenseRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-right text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-bold">رقم الحساب</th>

                        <th className="px-4 py-3 font-bold">الحساب</th>

                        <th className="px-4 py-3 font-bold">مدين</th>

                        <th className="px-4 py-3 font-bold">دائن</th>

                        <th className="px-4 py-3 font-bold">المصروف</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {expenseRows.map((row) => (
                        <tr key={row.accountId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/accounting/ledger?account=${encodeURIComponent(
                                row.accountId,
                              )}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {row.code}
                            </Link>
                          </td>

                          <td className="px-4 py-3 font-medium text-gray-800">
                            {row.name}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {formatMoney(row.debit)}
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {formatMoney(row.credit)}
                          </td>

                          <td className="px-4 py-3 font-bold text-red-700">
                            {formatMoney(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showDetails && expenseRows.length === 0 && (
                <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
                  لا توجد مصروفات مسجلة خلال الفترة المحددة.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-bold text-gray-800">
                  إجمالي المصروفات
                </span>

                <span className="text-lg font-bold text-red-700">
                  {formatMoney(totals.expenses)}
                </span>
              </div>
            </section>

            {/* Net profit */}
            <section className="mt-8">
              <div
                className={`rounded-2xl border-2 p-6 ${
                  totals.netProfit >= 0
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p
                      className={`text-lg font-bold ${
                        totals.netProfit >= 0
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      صافي الربح / الخسارة
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      مجمل الربح - المصروفات
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-3xl font-bold ${
                        totals.netProfit >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {formatMoney(Math.abs(totals.netProfit))}
                    </p>

                    <p
                      className={`mt-1 text-sm font-bold ${
                        totals.netProfit >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {totals.netProfit >= 0 ? "صافي ربح" : "صافي خسارة"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Technical summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:hidden">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">حركة الإيرادات - مدين</p>

            <p className="mt-2 font-bold text-gray-800">
              {formatMoney(totalRevenueDebit)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">حركة الإيرادات - دائن</p>

            <p className="mt-2 font-bold text-gray-800">
              {formatMoney(totalRevenueCredit)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">عدد الحسابات المؤثرة</p>

            <p className="mt-2 font-bold text-gray-800">
              {totalRevenueAccounts + totalCogsAccounts + totalExpenseAccounts}
            </p>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block">
          <div className="mt-10 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
            شركة الجابري
            {" - "}
            للعسل والزيوت الطبيعة وخدمات العمرة
            <br />
            البيضاء - اليمن
            {" | "}
            هاتف: 734 434 443
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
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

          table {
            font-size: 10px;
          }

          section,
          tr {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
