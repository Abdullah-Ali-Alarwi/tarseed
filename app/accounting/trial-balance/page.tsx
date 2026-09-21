"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useERPStore } from "@/Store/erpStore";
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiDollarSign,
  FiFileText,
  FiPrinter,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";

type TrialBalanceRow = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  debit: number;
  credit: number;
  balanceDebit: number;
  balanceCredit: number;
};

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

function getAccountNatureLabel(nature: string) {
  if (nature === "debit") return "مدين";
  if (nature === "credit") return "دائن";
  return nature || "-";
}

function getAccountTypeLabel(type: string) {
  const types: Record<string, string> = {
    asset: "أصول",
    liability: "التزامات",
    equity: "حقوق ملكية",
    revenue: "إيرادات",
    expense: "مصروفات",
    cogs: "تكلفة مبيعات",
  };

  return types[type] || type || "-";
}

export default function TrialBalancePage() {
  const { accounts, journalEntries, customers, suppliers, bankAccounts } =
    useERPStore();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const rows = useMemo<TrialBalanceRow[]>(() => {
    const detailAccounts = accounts.filter(
      (account) => account.isActive !== false && !account.isGroup,
    );

    return detailAccounts.map((account) => {
      let debit = 0;
      let credit = 0;

      journalEntries.forEach((entry) => {
        const entryDate = normalizeDate(entry.date);

        if (dateFrom && entryDate < dateFrom) return;
        if (dateTo && entryDate > dateTo) return;

        entry.lines.forEach((line) => {
          if (line.accountId !== account.id) return;

          debit += Number(line.debit || 0);
          credit += Number(line.credit || 0);
        });
      });

      let balanceDebit = 0;
      let balanceCredit = 0;

      const difference = debit - credit;

      if (account.nature === "debit") {
        if (difference >= 0) {
          balanceDebit = difference;
        } else {
          balanceCredit = Math.abs(difference);
        }
      } else {
        if (difference <= 0) {
          balanceCredit = Math.abs(difference);
        } else {
          balanceDebit = difference;
        }
      }

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        debit,
        credit,
        balanceDebit,
        balanceCredit,
      };
    });
  }, [accounts, journalEntries, dateFrom, dateTo]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.code.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        getAccountTypeLabel(row.type).toLowerCase().includes(query);

      const hasBalance =
        Math.abs(row.debit) > 0.000001 ||
        Math.abs(row.credit) > 0.000001 ||
        Math.abs(row.balanceDebit) > 0.000001 ||
        Math.abs(row.balanceCredit) > 0.000001;

      const matchesZero = showZeroBalances || hasBalance;

      return matchesSearch && matchesZero;
    });
  }, [rows, search, showZeroBalances]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (result, row) => {
        result.debit += row.debit;
        result.credit += row.credit;
        result.balanceDebit += row.balanceDebit;
        result.balanceCredit += row.balanceCredit;

        return result;
      },
      {
        debit: 0,
        credit: 0,
        balanceDebit: 0,
        balanceCredit: 0,
      },
    );
  }, [filteredRows]);

  const movementDifference = totals.debit - totals.credit;
  const balanceDifference = totals.balanceDebit - totals.balanceCredit;

  const isBalanced =
    Math.abs(movementDifference) < 0.01 && Math.abs(balanceDifference) < 0.01;

  const accountCount = filteredRows.length;

  const activeAccounts = accounts.filter(
    (account) => account.isActive !== false,
  ).length;

  const journalCount = journalEntries.length;

  const entityAccountsCount =
    customers.length + suppliers.length + bankAccounts.length;

  function handlePrint() {
    window.print();
  }

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setShowZeroBalances(false);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-white p-5 shadow-sm print:shadow-none sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiBookOpen className="text-2xl" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  ميزان المراجعة
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  عرض أرصدة الحسابات والحركات المدينة والدائنة
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
                href="/accounting/journal"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <FiFileText />
                القيود اليومية
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

        {/* Company print header */}
        <div className="hidden print:block">
          <div className="mb-6 border-b-2 border-gray-900 pb-4 text-center">
            <h1 className="text-2xl font-bold">شركة الجابري</h1>
            <p className="mt-1 text-sm">للعسل والزيوت الطبيعة وخدمات العمرة</p>
            <p className="text-sm">البيضاء - اليمن</p>
            <p className="text-sm">هاتف: 734 434 443</p>

            <h2 className="mt-5 text-xl font-bold">ميزان المراجعة</h2>

            {(dateFrom || dateTo) && (
              <p className="mt-2 text-sm">
                الفترة: {dateFrom || "البداية"} إلى {dateTo || "النهاية"}
              </p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">الحسابات المعروضة</p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {accountCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiBookOpen className="text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">إجمالي المدين</p>

                <p className="mt-2 text-xl font-bold text-green-600">
                  {formatMoney(totals.debit)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <FiDollarSign className="text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">إجمالي الدائن</p>

                <p className="mt-2 text-xl font-bold text-red-600">
                  {formatMoney(totals.credit)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <FiFileText className="text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">حالة الميزان</p>

                <p
                  className={`mt-2 text-lg font-bold ${
                    isBalanced ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {isBalanced ? "متوازن" : "غير متوازن"}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isBalanced
                    ? "bg-green-50 text-green-600"
                    : "bg-orange-50 text-orange-600"
                }`}
              >
                {isBalanced ? (
                  <FiCheckCircle className="text-xl" />
                ) : (
                  <FiXCircle className="text-xl" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-5 shadow-sm print:hidden">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">البحث والتصفية</h2>

              <p className="mt-1 text-xs text-gray-500">
                يمكنك تحديد الفترة والبحث عن حساب معين
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              مسح الفلاتر
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Search */}
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                البحث
              </label>

              <div className="relative">
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم الحساب أو اسم الحساب..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Date from */}
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

            {/* Date to */}
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

          <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-gray-100 pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showZeroBalances}
                onChange={(e) => setShowZeroBalances(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              عرض الحسابات ذات الرصيد الصفري
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              عرض تفاصيل الحركة
            </label>
          </div>
        </div>

        {/* Balance status */}
        <div
          className={`rounded-2xl border p-4 ${
            isBalanced
              ? "border-green-200 bg-green-50"
              : "border-orange-200 bg-orange-50"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <FiCheckCircle className="shrink-0 text-xl text-green-600" />
              ) : (
                <FiXCircle className="shrink-0 text-xl text-orange-600" />
              )}

              <div>
                <p
                  className={`font-bold ${
                    isBalanced ? "text-green-800" : "text-orange-800"
                  }`}
                >
                  {isBalanced
                    ? "ميزان المراجعة متوازن"
                    : "يوجد فرق في ميزان المراجعة"}
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  إجمالي المدين: {formatMoney(totals.debit)} | إجمالي الدائن:{" "}
                  {formatMoney(totals.credit)}
                </p>
              </div>
            </div>

            {!isBalanced && (
              <div className="text-sm font-bold text-orange-700">
                الفرق: {formatMoney(Math.abs(movementDifference))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">كشف ميزان المراجعة</h2>

              <p className="mt-1 text-xs text-gray-500">
                {accountCount} حساب من أصل {activeAccounts} حساب نشط
              </p>
            </div>

            <div className="text-xs text-gray-500">
              القيود اليومية: {journalCount} | حسابات مرتبطة:{" "}
              {entityAccountsCount}
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <FiFileText className="text-3xl" />
              </div>

              <h3 className="mt-4 font-bold text-gray-800">لا توجد بيانات</h3>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                لا توجد حسابات أو حركات محاسبية مطابقة للفلاتر المحددة.
              </p>

              <Link
                href="/accounting/journal/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 print:hidden"
              >
                <FiFileText />
                إضافة قيد يومي
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-4 font-bold">#</th>

                    <th className="whitespace-nowrap px-4 py-4 font-bold">
                      رقم الحساب
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-bold">
                      اسم الحساب
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-bold">
                      النوع
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-bold">
                      الطبيعة
                    </th>

                    {showDetails && (
                      <>
                        <th className="whitespace-nowrap px-4 py-4 font-bold text-green-700">
                          مدين
                        </th>

                        <th className="whitespace-nowrap px-4 py-4 font-bold text-red-700">
                          دائن
                        </th>
                      </>
                    )}

                    <th className="whitespace-nowrap px-4 py-4 font-bold text-blue-700">
                      رصيد مدين
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-bold text-purple-700">
                      رصيد دائن
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-bold print:hidden">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row, index) => (
                    <tr
                      key={row.accountId}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-gray-500">{index + 1}</td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/accounting/ledger?account=${encodeURIComponent(
                            row.accountId,
                          )}`}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {row.code}
                        </Link>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">
                          {row.name}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {getAccountTypeLabel(row.type)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {getAccountNatureLabel(row.nature)}
                      </td>

                      {showDetails && (
                        <>
                          <td className="px-4 py-4 font-medium text-green-700">
                            {formatMoney(row.debit)}
                          </td>

                          <td className="px-4 py-4 font-medium text-red-700">
                            {formatMoney(row.credit)}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-4 font-bold text-blue-700">
                        {row.balanceDebit > 0
                          ? formatMoney(row.balanceDebit)
                          : "-"}
                      </td>

                      <td className="px-4 py-4 font-bold text-purple-700">
                        {row.balanceCredit > 0
                          ? formatMoney(row.balanceCredit)
                          : "-"}
                      </td>

                      <td className="px-4 py-4 print:hidden">
                        <Link
                          href={`/accounting/ledger?account=${encodeURIComponent(
                            row.accountId,
                          )}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          كشف الحساب
                          <FiChevronLeftFix />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                  <tr>
                    <td
                      colSpan={showDetails ? 5 : 5}
                      className="px-4 py-5 font-bold text-gray-900"
                    >
                      الإجمالي
                    </td>

                    {showDetails && (
                      <>
                        <td className="px-4 py-5 font-bold text-green-700">
                          {formatMoney(totals.debit)}
                        </td>

                        <td className="px-4 py-5 font-bold text-red-700">
                          {formatMoney(totals.credit)}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-5 font-bold text-blue-700">
                      {formatMoney(totals.balanceDebit)}
                    </td>

                    <td className="px-4 py-5 font-bold text-purple-700">
                      {formatMoney(totals.balanceCredit)}
                    </td>

                    <td className="print:hidden" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 print:hidden">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">إجمالي الحركة المدينة</p>

            <p className="mt-2 text-xl font-bold text-green-600">
              {formatMoney(totals.debit)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">إجمالي الحركة الدائنة</p>

            <p className="mt-2 text-xl font-bold text-red-600">
              {formatMoney(totals.credit)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">فرق الحركة</p>

            <p
              className={`mt-2 text-xl font-bold ${
                Math.abs(movementDifference) < 0.01
                  ? "text-green-600"
                  : "text-orange-600"
              }`}
            >
              {formatMoney(Math.abs(movementDifference))}
            </p>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block">
          <div className="mt-10 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
            شركة الجابري - للعسل والزيوت الطبيعة وخدمات العمرة
            <br />
            البيضاء - اليمن | هاتف: 734 434 443
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
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

          table {
            font-size: 11px;
          }

          tr {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}

/*
  استخدمنا هذا المكوّن الصغير بدل استيراد أيقونة إضافية
  حتى لا يظهر خطأ آخر بسبب اسم الأيقونة.
*/
function FiChevronLeftFix() {
  return <span aria-hidden="true">‹</span>;
}
