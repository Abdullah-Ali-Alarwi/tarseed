"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function TrialBalancePage() {
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
    const accountMap = new Map<
      string,
      {
        code: string;
        name: string;
        debit: number;
        credit: number;
      }
    >();

    /*
      نأخذ القيود المرحّلة فقط وضمن الفترة المحددة.
    */
    const postedEntries = journalEntries.filter(
      (entry) =>
        entry.status === "posted" &&
        entry.date >= fromDate &&
        entry.date <= toDate,
    );

    /*
      تجميع الحسابات من جميع أسطر القيود.
    */
    postedEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const debit = Number(line.debit) || 0;

        const credit = Number(line.credit) || 0;

        const existing = accountMap.get(line.accountCode);

        if (existing) {
          existing.debit += debit;
          existing.credit += credit;
        } else {
          accountMap.set(line.accountCode, {
            code: line.accountCode,
            name: line.accountName,
            debit,
            credit,
          });
        }
      });
    });

    /*
      تحويل Map إلى مصفوفة وترتيبها حسب رمز الحساب.
    */
    const accounts = Array.from(accountMap.values())
      .filter((account) => account.debit > 0 || account.credit > 0)
      .sort((a, b) => a.code.localeCompare(b.code));

    /*
      إجمالي المدين.
    */
    const totalDebit = accounts.reduce(
      (sum, account) => sum + account.debit,
      0,
    );

    /*
      إجمالي الدائن.
    */
    const totalCredit = accounts.reduce(
      (sum, account) => sum + account.credit,
      0,
    );

    /*
      الفرق.
    */
    const difference = totalDebit - totalCredit;

    /*
      الميزان متوازن إذا كان الفرق صفرًا.
    */
    const isBalanced = Math.abs(difference) < 0.01;

    return {
      accounts,
      totalDebit,
      totalCredit,
      difference,
      isBalanced,
      postedEntriesCount: postedEntries.length,
    };
  }, [journalEntries, fromDate, toDate, refreshKey]);

  const {
    accounts,
    totalDebit,
    totalCredit,
    difference,
    isBalanced,
    postedEntriesCount,
  } = reportData;

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

            <span className="text-gray-800 font-medium">ميزان المراجعة</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              ميزان المراجعة
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
              تقرير محاسبي
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            كشف بأرصدة الحسابات المدينة والدائنة خلال الفترة المحددة
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
            طباعة الميزان
          </button>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="print:hidden bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-5 md:p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <FiCalendar size={20} className="text-amber-600" />

            <div>
              <h2 className="font-bold text-gray-900">فترة التقرير</h2>

              <p className="text-sm text-gray-500 mt-1">
                حدد الفترة المالية لعرض ميزان المراجعة
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

      {/* =====================================================
          OFFICIAL REPORT
      ====================================================== */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">
        {/* =====================================================
            COMPANY HEADER
        ====================================================== */}

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
                ميزان المراجعة
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                عن الفترة من <span className="font-bold">{fromDate}</span> إلى{" "}
                <span className="font-bold">{toDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY
        ====================================================== */}

        <div className="p-5 md:p-6 border-b border-gray-200 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* DEBIT */}

            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المدين</p>

                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatMoney(totalDebit)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiBookOpen size={22} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* CREDIT */}

            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الدائن</p>

                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatMoney(totalCredit)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  <FiCheckCircle size={22} className="text-green-600" />
                </div>
              </div>
            </div>

            {/* DIFFERENCE */}

            <div
              className={`rounded-xl border-2 p-5 ${
                isBalanced
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الفرق</p>

                  <p
                    className={`text-2xl font-bold mt-2 ${
                      isBalanced ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatMoney(Math.abs(difference))}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center">
                  {isBalanced ? (
                    <FiCheckCircle size={22} className="text-green-600" />
                  ) : (
                    <FiAlertCircle size={22} className="text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <div className="p-5 md:p-8">
          <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                أرصدة الحسابات
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                عدد القيود المرحّلة المستخدمة في التقرير:{" "}
                <span className="font-bold text-gray-700">
                  {postedEntriesCount.toLocaleString("ar-SA")}
                </span>
              </p>
            </div>

            <div className="text-sm text-gray-500">
              عدد الحسابات:{" "}
              <span className="font-bold text-gray-900">
                {accounts.length.toLocaleString("ar-SA")}
              </span>
            </div>
          </div>

          <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                      #
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      رمز الحساب
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                      اسم الحساب
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      مدين
                    </th>

                    <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                      دائن
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.length > 0 ? (
                    accounts.map((account, index) => (
                      <tr
                        key={account.code}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600 text-center">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-blue-700 font-bold">
                          {account.code}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 font-medium">
                          {account.name}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-blue-700">
                          {account.debit > 0 ? formatMoney(account.debit) : "-"}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-green-700">
                          {account.credit > 0
                            ? formatMoney(account.credit)
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-gray-300 px-4 py-12 text-center text-gray-500"
                      >
                        لا توجد قيود مرحّلة ضمن الفترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* TOTALS */}

                <tfoot>
                  <tr className="bg-gray-100">
                    <td
                      colSpan={3}
                      className="border-2 border-gray-400 px-4 py-4 text-right font-bold text-gray-900"
                    >
                      الإجمالي
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-blue-700">
                      {formatMoney(totalDebit)}
                    </td>

                    <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-green-700">
                      {formatMoney(totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* =====================================================
              BALANCE STATUS
          ====================================================== */}

          <div
            className={`mt-8 rounded-xl border-2 p-5 ${
              isBalanced
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                  isBalanced ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {isBalanced ? (
                  <FiCheckCircle size={24} className="text-green-600" />
                ) : (
                  <FiAlertCircle size={24} className="text-red-600" />
                )}
              </div>

              <div className="flex-1">
                <h3
                  className={`font-bold ${
                    isBalanced ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isBalanced
                    ? "ميزان المراجعة متوازن"
                    : "ميزان المراجعة غير متوازن"}
                </h3>

                <p
                  className={`text-sm mt-1 ${
                    isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isBalanced
                    ? "إجمالي الأرصدة المدينة يساوي إجمالي الأرصدة الدائنة."
                    : "يوجد فرق بين إجمالي الأرصدة المدينة والدائنة. يرجى مراجعة القيود المرحّلة."}
                </p>

                {!isBalanced && (
                  <p className="text-sm text-red-700 font-bold mt-2">
                    قيمة الفرق: {formatMoney(Math.abs(difference))} ريال
                  </p>
                )}
              </div>

              <div className="text-left">
                <p className="text-xs text-gray-500">الفرق</p>

                <p
                  className={`font-bold ${
                    isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {formatMoney(Math.abs(difference))}
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              SIGNATURES
          ====================================================== */}

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
