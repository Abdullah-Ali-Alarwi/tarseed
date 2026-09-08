"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiBookOpen,
  FiSearch,
  FiPrinter,
  FiRefreshCw,
  FiFilter,
  FiChevronDown,
  FiChevronLeft,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

type AccountOption = {
  code: string;
  name: string;
};

type LedgerRow = {
  entryId: string;
  entryNumber: string;
  date: string;
  reference: string;
  description: string;
  lineDescription: string;
  debit: number;
  credit: number;
  balance: number;
};

const accountOptions: AccountOption[] = [
  { code: "1101", name: "الصندوق" },
  { code: "1102", name: "البنك" },
  { code: "1103", name: "العملاء" },
  { code: "1104", name: "المخزون" },
  { code: "1105", name: "المصروفات المقدمة" },

  { code: "1201", name: "الأثاث والتجهيزات" },
  { code: "1202", name: "المعدات" },
  { code: "1203", name: "السيارات" },
  { code: "1204", name: "مجمع الإهلاك" },

  { code: "2101", name: "الموردون" },
  { code: "2102", name: "مصروفات مستحقة" },
  { code: "2103", name: "ضرائب مستحقة" },
  { code: "2104", name: "دفعات مقدمة من العملاء" },

  { code: "3101", name: "رأس المال" },
  { code: "3102", name: "الأرباح المحتجزة" },
  { code: "3103", name: "المسحوبات الشخصية" },

  { code: "4101", name: "المبيعات" },
  { code: "4102", name: "إيرادات خدمات العمرة" },
  { code: "4103", name: "إيرادات أخرى" },

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

export default function LedgerPage() {
  const { journalEntries } = useERPStore();

  const [accountCode, setAccountCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const selectedAccount = useMemo(() => {
    return accountOptions.find((account) => account.code === accountCode);
  }, [accountCode]);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const postedEntries = useMemo(() => {
    return journalEntries
      .filter((entry) => entry.status === "posted")
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [journalEntries]);

  const openingBalance = useMemo(() => {
    if (!accountCode) return 0;

    let balance = 0;

    postedEntries.forEach((entry) => {
      if (fromDate && entry.date >= fromDate) {
        return;
      }

      entry.lines.forEach((line) => {
        if (line.accountCode !== accountCode) return;

        balance += Number(line.debit || 0);
        balance -= Number(line.credit || 0);
      });
    });

    return balance;
  }, [postedEntries, accountCode, fromDate]);

  const ledgerRows = useMemo<LedgerRow[]>(() => {
    if (!accountCode) return [];

    let runningBalance = openingBalance;
    const rows: LedgerRow[] = [];

    postedEntries.forEach((entry) => {
      if (fromDate && entry.date < fromDate) return;
      if (toDate && entry.date > toDate) return;

      entry.lines.forEach((line) => {
        if (line.accountCode !== accountCode) return;

        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);

        runningBalance += debit - credit;

        rows.push({
          entryId: entry.id,
          entryNumber: entry.number,
          date: entry.date,
          reference: entry.reference,
          description: entry.description,
          lineDescription: line.description,
          debit,
          credit,
          balance: runningBalance,
        });
      });
    });

    return rows;
  }, [postedEntries, accountCode, fromDate, toDate, openingBalance]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return ledgerRows;

    return ledgerRows.filter((row) => {
      return (
        row.entryNumber.toLowerCase().includes(query) ||
        row.reference.toLowerCase().includes(query) ||
        row.description.toLowerCase().includes(query) ||
        row.lineDescription.toLowerCase().includes(query)
      );
    });
  }, [ledgerRows, search]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (result, row) => {
        result.debit += row.debit;
        result.credit += row.credit;
        return result;
      },
      {
        debit: 0,
        credit: 0,
      },
    );
  }, [filteredRows]);

  const closingBalance = useMemo(() => {
    if (!accountCode) return 0;

    return openingBalance + totals.debit - totals.credit;
  }, [openingBalance, totals, accountCode]);

  const balanceNature = useMemo(() => {
    if (!accountCode || closingBalance === 0) {
      return "متزن";
    }

    const accountClass = accountCode.charAt(0);

    const isDebitNature = accountClass === "1" || accountClass === "5";

    if (isDebitNature) {
      return closingBalance > 0 ? "مدين" : "دائن";
    }

    return closingBalance > 0 ? "دائن" : "مدين";
  }, [accountCode, closingBalance]);

  const resetFilters = () => {
    setAccountCode("");
    setFromDate("");
    setToDate("");
    setSearch("");
  };

  const handlePrint = () => {
    if (!accountCode) {
      alert("يرجى اختيار حساب أولاً قبل الطباعة.");
      return;
    }

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

            <span className="text-gray-700">دفتر الأستاذ</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiBookOpen className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                دفتر الأستاذ العام
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                عرض الحركات التفصيلية والأرصدة لكل حساب
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
          طباعة دفتر الأستاذ
        </button>
      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 mb-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="w-4 h-4 text-amber-600" />

          <h2 className="text-sm font-bold text-gray-800">
            خيارات دفتر الأستاذ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Account */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">الحساب</label>

            <div className="relative">
              <select
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pl-9 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              >
                <option value="">اختر الحساب</option>

                {accountOptions.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>

              <FiChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* From */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">من تاريخ</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* To */}
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

          {/* Search */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">البحث</label>

            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="رقم القيد أو البيان..."
                className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-amber-600 transition"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            إعادة ضبط
          </button>
        </div>
      </div>

      {/* ==================================================
          ACCOUNT SUMMARY
      ================================================== */}
      {accountCode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 print:hidden">
          <SummaryCard
            title="الرصيد الافتتاحي"
            value={formatMoney(Math.abs(openingBalance))}
            subtitle={
              openingBalance === 0
                ? "متزن"
                : openingBalance > 0
                  ? "مدين"
                  : "دائن"
            }
          />

          <SummaryCard
            title="إجمالي المدين"
            value={formatMoney(totals.debit)}
            subtitle="ريال"
          />

          <SummaryCard
            title="إجمالي الدائن"
            value={formatMoney(totals.credit)}
            subtitle="ريال"
          />

          <SummaryCard
            title="الرصيد الختامي"
            value={formatMoney(Math.abs(closingBalance))}
            subtitle={balanceNature}
          />
        </div>
      )}

      {/* ==================================================
          SELECTED ACCOUNT
      ================================================== */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {selectedAccount ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono">
                    {selectedAccount.code}
                  </span>

                  <h2 className="text-sm sm:text-base font-bold text-gray-800">
                    {selectedAccount.name}
                  </h2>
                </div>

                <p className="text-[11px] text-gray-400 mt-1">
                  دفتر الأستاذ للحساب المحدد
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm sm:text-base font-bold text-gray-800">
                  دفتر الأستاذ
                </h2>

                <p className="text-[11px] text-gray-400 mt-1">
                  اختر حسابًا لعرض حركاته
                </p>
              </>
            )}
          </div>

          {selectedAccount && (
            <div className="text-xs text-gray-500">
              عدد الحركات:{" "}
              <span className="font-bold text-gray-800">
                {filteredRows.length}
              </span>
            </div>
          )}
        </div>

        {!accountCode ? (
          <div className="px-4 py-20 text-center">
            <FiBookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />

            <p className="text-sm font-medium text-gray-600">
              لم يتم اختيار حساب
            </p>

            <p className="text-xs text-gray-400 mt-1">
              اختر حسابًا من خيارات دفتر الأستاذ لعرض الحركات.
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-20 text-center">
            <FiSearch className="w-9 h-9 text-gray-200 mx-auto mb-3" />

            <p className="text-sm font-medium text-gray-600">
              لا توجد حركات لهذا الحساب
            </p>

            <p className="text-xs text-gray-400 mt-1">
              لا توجد قيود مرحّلة ضمن الفترة أو البحث المحدد.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                      التاريخ
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                      رقم القيد
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                      المرجع
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                      البيان
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                      مدين
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                      دائن
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                      الرصيد
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {fromDate && (
                    <tr className="bg-amber-50/50">
                      <td className="px-4 py-3 text-xs text-gray-600">
                        قبل الفترة
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400">—</td>

                      <td className="px-4 py-3 text-xs text-gray-400">—</td>

                      <td className="px-4 py-3 text-xs font-medium text-gray-700">
                        الرصيد الافتتاحي للفترة
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">—</td>

                      <td className="px-4 py-3 text-xs text-gray-500">—</td>

                      <td className="px-4 py-3 text-xs font-bold text-gray-800">
                        {formatMoney(Math.abs(openingBalance))}
                      </td>
                    </tr>
                  )}

                  {filteredRows.map((row, index) => (
                    <tr
                      key={`${row.entryId}-${index}`}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {row.date}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-medium text-gray-700">
                          {row.entryNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.reference || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            {row.description}
                          </p>

                          {row.lineDescription &&
                            row.lineDescription !== row.description && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {row.lineDescription}
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs font-medium text-gray-700">
                        {row.debit > 0 ? formatMoney(row.debit) : "—"}
                      </td>

                      <td className="px-4 py-3 text-xs font-medium text-gray-700">
                        {row.credit > 0 ? formatMoney(row.credit) : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800">
                            {formatMoney(Math.abs(row.balance))}
                          </span>

                          <span
                            className={`text-[9px] mt-0.5 ${
                              row.balance === 0
                                ? "text-gray-400"
                                : row.balance > 0
                                  ? "text-blue-600"
                                  : "text-green-600"
                            }`}
                          >
                            {row.balance === 0
                              ? "متزن"
                              : row.balance > 0
                                ? "مدين"
                                : "دائن"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-xs font-bold text-gray-700"
                    >
                      الإجمالي
                    </td>

                    <td className="px-4 py-3 text-xs font-bold text-gray-800">
                      {formatMoney(totals.debit)}
                    </td>

                    <td className="px-4 py-3 text-xs font-bold text-gray-800">
                      {formatMoney(totals.credit)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">
                          {formatMoney(Math.abs(closingBalance))}
                        </span>

                        <span className="text-[9px] text-gray-500">
                          {balanceNature}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ==================================================
          INFORMATION
      ================================================== */}
      <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4 print:hidden">
        <div className="flex gap-3">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <FiBookOpen className="w-4 h-4" />
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-800">ملاحظة</h3>

            <p className="text-[11px] sm:text-xs text-gray-600 leading-6 mt-1">
              يتم عرض القيود اليومية المرحّلة فقط. الرصيد الافتتاحي يحسب من جميع
              الحركات المرحّلة السابقة لبداية الفترة المحددة، ثم يتم احتساب
              الرصيد الجاري مع كل حركة.
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
          PRINT
      ================================================== */}
      <div className="hidden print:block ledger-print">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">شركة الجابري</h1>

          <p className="text-sm mt-1">للعسل والزيوت الطبيعة وخدمات العمرة</p>

          <p className="text-xs text-gray-600 mt-1">البيضاء - اليمن</p>

          <p className="text-xs text-gray-600 mt-1">
            هاتف: <bdi dir="ltr">734 434 443</bdi>
          </p>

          <h2 className="text-lg font-bold mt-5">دفتر الأستاذ العام</h2>

          {selectedAccount && (
            <p className="text-sm mt-2">
              الحساب:{" "}
              <strong>
                {selectedAccount.code} - {selectedAccount.name}
              </strong>
            </p>
          )}

          {(fromDate || toDate) && (
            <p className="text-xs text-gray-600 mt-1">
              الفترة: {fromDate || "البداية"} إلى {toDate || "النهاية"}
            </p>
          )}
        </div>

        {accountCode && (
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2">التاريخ</th>

                <th className="border border-gray-400 p-2">رقم القيد</th>

                <th className="border border-gray-400 p-2">المرجع</th>

                <th className="border border-gray-400 p-2">البيان</th>

                <th className="border border-gray-400 p-2">مدين</th>

                <th className="border border-gray-400 p-2">دائن</th>

                <th className="border border-gray-400 p-2">الرصيد</th>
              </tr>
            </thead>

            <tbody>
              {fromDate && (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-gray-400 p-2 font-bold"
                  >
                    الرصيد الافتتاحي
                  </td>

                  <td className="border border-gray-400 p-2">—</td>

                  <td className="border border-gray-400 p-2">—</td>

                  <td className="border border-gray-400 p-2 font-bold">
                    {formatMoney(Math.abs(openingBalance))}
                  </td>
                </tr>
              )}

              {filteredRows.map((row, index) => (
                <tr key={`${row.entryId}-print-${index}`}>
                  <td className="border border-gray-400 p-2">{row.date}</td>

                  <td className="border border-gray-400 p-2">
                    {row.entryNumber}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {row.reference || "—"}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {row.description}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {row.debit > 0 ? formatMoney(row.debit) : "—"}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {row.credit > 0 ? formatMoney(row.credit) : "—"}
                  </td>

                  <td className="border border-gray-400 p-2 font-bold">
                    {formatMoney(Math.abs(row.balance))}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  className="border border-gray-400 p-2 font-bold"
                >
                  الإجمالي والرصيد الختامي
                </td>

                <td className="border border-gray-400 p-2 font-bold">
                  {formatMoney(totals.debit)}
                </td>

                <td className="border border-gray-400 p-2 font-bold">
                  {formatMoney(totals.credit)}
                </td>

                <td className="border border-gray-400 p-2 font-bold">
                  {formatMoney(Math.abs(closingBalance))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .ledger-print,
          .ledger-print * {
            visibility: visible;
          }

          .ledger-print {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            width: 100%;
            padding: 15px;
            background: white;
          }

          @page {
            size: A4 landscape;
            margin: 10mm;
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
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <p className="text-[10px] sm:text-xs text-gray-500">{title}</p>

      <div className="flex items-end gap-2 mt-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">
          {value}
        </h3>

        <span className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
