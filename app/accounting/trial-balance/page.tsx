"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiBookOpen,
  FiSearch,
  FiPrinter,
  FiRefreshCw,
  FiFilter,
  FiChevronLeft,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

type TrialRow = {
  code: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
  nature: "مدين" | "دائن" | "متزن";
};

const accountNames: Record<string, string> = {
  "1101": "الصندوق",
  "1102": "البنك",
  "1103": "العملاء",
  "1104": "المخزون",
  "1105": "المصروفات المقدمة",

  "1201": "الأثاث والتجهيزات",
  "1202": "المعدات",
  "1203": "السيارات",
  "1204": "مجمع الإهلاك",

  "2101": "الموردون",
  "2102": "مصروفات مستحقة",
  "2103": "ضرائب مستحقة",
  "2104": "دفعات مقدمة من العملاء",

  "3101": "رأس المال",
  "3102": "الأرباح المحتجزة",
  "3103": "المسحوبات الشخصية",

  "4101": "المبيعات",
  "4102": "إيرادات خدمات العمرة",
  "4103": "إيرادات أخرى",

  "5101": "تكلفة خدمات العمرة",
  "5102": "تكلفة المبيعات",
  "5103": "الرواتب والأجور",
  "5104": "الإيجار",
  "5105": "الكهرباء والماء",
  "5106": "الاتصالات",
  "5107": "مصروفات نقل",
  "5108": "مصروفات تسويق وإعلان",
  "5109": "مصروفات أخرى",
};

export default function TrialBalancePage() {
  const { journalEntries } = useERPStore();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const trialRows = useMemo<TrialRow[]>(() => {
    const balances: Record<
      string,
      {
        debit: number;
        credit: number;
        name: string;
      }
    > = {};

    journalEntries
      .filter((entry) => {
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
      })
      .forEach((entry) => {
        entry.lines.forEach((line) => {
          if (!balances[line.accountCode]) {
            balances[line.accountCode] = {
              debit: 0,
              credit: 0,
              name:
                accountNames[line.accountCode] ||
                line.accountName ||
                "حساب غير معروف",
            };
          }

          balances[line.accountCode].debit += Number(line.debit || 0);

          balances[line.accountCode].credit += Number(line.credit || 0);

          if (!balances[line.accountCode].name && line.accountName) {
            balances[line.accountCode].name = line.accountName;
          }
        });
      });

    return Object.entries(balances)
      .map(([code, data]) => {
        const balance = data.debit - data.credit;

        let nature: "مدين" | "دائن" | "متزن" = "متزن";

        if (balance > 0) {
          nature = "مدين";
        } else if (balance < 0) {
          nature = "دائن";
        }

        return {
          code,
          name: data.name,
          debit: data.debit,
          credit: data.credit,
          balance,
          nature,
        };
      })
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
          numeric: true,
        }),
      );
  }, [journalEntries, fromDate, toDate]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return trialRows.filter((row) => {
      const matchesSearch =
        !query ||
        row.code.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query);

      const matchesZero =
        showZeroBalances || row.debit !== 0 || row.credit !== 0;

      return matchesSearch && matchesZero;
    });
  }, [trialRows, search, showZeroBalances]);

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

  const difference = totals.debit - totals.credit;

  const isBalanced = Math.abs(difference) < 0.01;

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setSearch("");
    setShowZeroBalances(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-7">
      {/* Header */}
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

            <span className="text-gray-700">ميزان المراجعة</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiBookOpen className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                ميزان المراجعة
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                عرض أرصدة الحسابات المدينة والدائنة والتحقق من توازن القيود
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

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 mb-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="w-4 h-4 text-amber-600" />

          <h2 className="text-sm font-bold text-gray-800">تصفية التقرير</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div>
            <label className="block text-xs text-gray-600 mb-2">البحث</label>

            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="كود أو اسم الحساب..."
                className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2.5 mt-auto">
            <label className="text-xs text-gray-700">
              إظهار الحسابات صفرية الرصيد
            </label>

            <button
              type="button"
              onClick={() => setShowZeroBalances(!showZeroBalances)}
              className={`relative w-10 h-5 rounded-full transition ${
                showZeroBalances ? "bg-amber-600" : "bg-gray-300"
              }`}
              aria-label="إظهار الحسابات صفرية الرصيد"
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${
                  showZeroBalances ? "right-0.5" : "right-[22px]"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-3">
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

      {/* Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 print:hidden">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] sm:text-xs text-gray-500">إجمالي المدين</p>

          <p className="text-base sm:text-lg font-bold text-gray-800 mt-2">
            {formatMoney(totals.debit)}
          </p>

          <span className="text-[10px] text-gray-400">ريال</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] sm:text-xs text-gray-500">إجمالي الدائن</p>

          <p className="text-base sm:text-lg font-bold text-gray-800 mt-2">
            {formatMoney(totals.credit)}
          </p>

          <span className="text-[10px] text-gray-400">ريال</span>
        </div>

        <div
          className={`rounded-xl border shadow-sm p-4 ${
            isBalanced
              ? "bg-green-50 border-green-100"
              : "bg-red-50 border-red-100"
          }`}
        >
          <p
            className={`text-[10px] sm:text-xs ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            حالة الميزان
          </p>

          <p
            className={`text-base sm:text-lg font-bold mt-2 ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            {isBalanced ? "متوازن" : "غير متوازن"}
          </p>

          <span
            className={`text-[10px] ${
              isBalanced ? "text-green-600" : "text-red-600"
            }`}
          >
            الفرق: {formatMoney(Math.abs(difference))} ريال
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              أرصدة الحسابات
            </h2>

            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
              عدد الحسابات: {filteredRows.length}
            </p>
          </div>

          <div className="text-[10px] text-gray-400">القيود المرحّلة فقط</div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-20 text-center">
            <FiBookOpen className="w-10 h-10 mx-auto text-gray-200 mb-3" />

            <p className="text-sm font-medium text-gray-600">
              لا توجد بيانات لعرضها
            </p>

            <p className="text-xs text-gray-400 mt-1">
              أضف قيودًا يومية مرحّلة أو غيّر الفترة المحددة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    #
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    كود الحساب
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    اسم الحساب
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

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    طبيعة الرصيد
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row, index) => (
                  <tr key={row.code} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-700">
                        {row.code}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-700">
                        {row.name}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-700">
                      {row.debit > 0 ? formatMoney(row.debit) : "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-700">
                      {row.credit > 0 ? formatMoney(row.credit) : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-gray-800">
                        {formatMoney(Math.abs(row.balance))}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {row.nature === "مدين" && (
                        <span className="inline-flex px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">
                          مدين
                        </span>
                      )}

                      {row.nature === "دائن" && (
                        <span className="inline-flex px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-medium">
                          دائن
                        </span>
                      )}

                      {row.nature === "متزن" && (
                        <span className="inline-flex px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                          متزن
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-xs font-bold text-gray-700"
                  >
                    الإجمالي
                  </td>

                  <td className="px-4 py-3 text-xs font-bold text-gray-900">
                    {formatMoney(totals.debit)}
                  </td>

                  <td className="px-4 py-3 text-xs font-bold text-gray-900">
                    {formatMoney(totals.credit)}
                  </td>

                  <td colSpan={2} className="px-4 py-3">
                    <span
                      className={`text-xs font-bold ${
                        isBalanced ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      الفرق: {formatMoney(Math.abs(difference))}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4 print:hidden">
        <div className="flex gap-3">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <FiBookOpen className="w-4 h-4" />
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-800">ملاحظة محاسبية</h3>

            <p className="text-[11px] sm:text-xs text-gray-600 leading-6 mt-1">
              يعرض ميزان المراجعة القيود اليومية المرحّلة فقط، ويتم تجميع المدين
              والدائن لكل حساب ضمن الفترة المحددة. في الميزان المتزن يجب أن
              يتساوى إجمالي المدين مع إجمالي الدائن.
            </p>
          </div>
        </div>
      </div>

      {/* Print */}
      <div className="hidden print:block trial-print">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">شركة الجابري</h1>

          <p className="text-sm mt-1">للعسل والزيوت الطبيعة وخدمات العمرة</p>

          <p className="text-xs text-gray-600 mt-1">البيضاء - اليمن</p>

          <p className="text-xs text-gray-600 mt-1">
            هاتف: <bdi dir="ltr">734 434 443</bdi>
          </p>

          <h2 className="text-lg font-bold mt-5">ميزان المراجعة</h2>

          {(fromDate || toDate) && (
            <p className="text-xs text-gray-600 mt-2">
              الفترة: {fromDate || "البداية"} إلى {toDate || "النهاية"}
            </p>
          )}
        </div>

        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr>
              <th className="border border-gray-400 p-2">#</th>

              <th className="border border-gray-400 p-2">كود الحساب</th>

              <th className="border border-gray-400 p-2">اسم الحساب</th>

              <th className="border border-gray-400 p-2">مدين</th>

              <th className="border border-gray-400 p-2">دائن</th>

              <th className="border border-gray-400 p-2">الرصيد</th>

              <th className="border border-gray-400 p-2">الطبيعة</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={`print-${row.code}`}>
                <td className="border border-gray-400 p-2">{index + 1}</td>

                <td className="border border-gray-400 p-2">{row.code}</td>

                <td className="border border-gray-400 p-2">{row.name}</td>

                <td className="border border-gray-400 p-2">
                  {row.debit > 0 ? formatMoney(row.debit) : "—"}
                </td>

                <td className="border border-gray-400 p-2">
                  {row.credit > 0 ? formatMoney(row.credit) : "—"}
                </td>

                <td className="border border-gray-400 p-2">
                  {formatMoney(Math.abs(row.balance))}
                </td>

                <td className="border border-gray-400 p-2">{row.nature}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={3} className="border border-gray-400 p-2 font-bold">
                الإجمالي
              </td>

              <td className="border border-gray-400 p-2 font-bold">
                {formatMoney(totals.debit)}
              </td>

              <td className="border border-gray-400 p-2 font-bold">
                {formatMoney(totals.credit)}
              </td>

              <td colSpan={2} className="border border-gray-400 p-2 font-bold">
                الفرق: {formatMoney(Math.abs(difference))}
              </td>
            </tr>
          </tfoot>
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

          .trial-print,
          .trial-print * {
            visibility: visible;
          }

          .trial-print {
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
