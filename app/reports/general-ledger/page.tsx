"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
  FiBookOpen,
  FiAlertCircle,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function GeneralLedgerPage() {
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-08-31");
  const [selectedAccount, setSelectedAccount] = useState("");

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
   * الحسابات الفعلية من Zustand
   * =========================================================
   *
   * إذا لم يوجد حساب محدد بعد، نختار أول حساب موجود.
   */
  const availableAccounts = useMemo(() => {
    return [...accounts].sort((a, b) =>
      a.code.localeCompare(b.code, undefined, {
        numeric: true,
      }),
    );
  }, [accounts]);

  /*
   * =========================================================
   * الحساب المحدد
   * =========================================================
   */
  const currentAccount = useMemo(() => {
    if (selectedAccount) {
      const selected = accounts.find(
        (account) => account.code === selectedAccount,
      );

      if (selected) {
        return selected;
      }
    }

    return availableAccounts[0] || null;
  }, [selectedAccount, accounts, availableAccounts]);

  /*
   * =========================================================
   * تحديد طبيعة الحساب
   * =========================================================
   */
  const accountNature = useMemo(() => {
    if (!currentAccount) {
      return "مدين";
    }

    if (currentAccount.type === "asset" || currentAccount.type === "expense") {
      return "مدين";
    }

    return "دائن";
  }, [currentAccount]);

  /*
   * =========================================================
   * تقرير دفتر الأستاذ
   * =========================================================
   */
  const reportData = useMemo(() => {
    if (!currentAccount) {
      return {
        entriesWithBalance: [],
        openingBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        closingBalance: 0,
      };
    }

    /*
     * جميع القيود المرحلة فقط
     */
    const postedJournals = journalEntries
      .filter((journal) => journal.status === "posted")
      .filter((journal) => {
        return journal.date <= toDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    /*
     * الحركات الخاصة بالحساب المحدد
     */
    const accountMovements = postedJournals.flatMap((journal) => {
      const accountLines = journal.lines.filter(
        (line) => line.accountCode === currentAccount.code,
      );

      return accountLines.map((line) => ({
        id: `${journal.id}-${line.id}`,
        date: journal.date,
        journal: "قيد يومية",
        reference: journal.reference || journal.number || journal.id,
        description: line.description?.trim() || journal.description || "-",
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }));
    });

    /*
     * ترتيب الحركات
     *
     * إذا كان هناك أكثر من حركة في نفس اليوم، نحتفظ
     * بالترتيب الناتج من القيود.
     */
    accountMovements.sort((a, b) => {
      return a.date.localeCompare(b.date);
    });

    /*
     * =======================================================
     * الرصيد الافتتاحي
     * =======================================================
     *
     * جميع الحركات قبل fromDate.
     *
     * الحساب المدين:
     * debit - credit
     *
     * الحساب الدائن:
     * credit - debit
     */
    const openingMovements = accountMovements.filter(
      (entry) => entry.date < fromDate,
    );

    const openingDebit = openingMovements.reduce(
      (sum, entry) => sum + Number(entry.debit || 0),
      0,
    );

    const openingCredit = openingMovements.reduce(
      (sum, entry) => sum + Number(entry.credit || 0),
      0,
    );

    const openingBalance =
      accountNature === "مدين"
        ? openingDebit - openingCredit
        : openingCredit - openingDebit;

    /*
     * =======================================================
     * الحركات داخل الفترة
     * =======================================================
     */
    const periodEntries = accountMovements.filter(
      (entry) => entry.date >= fromDate && entry.date <= toDate,
    );

    /*
     * =======================================================
     * الرصيد الجاري
     * =======================================================
     */
    let runningBalance = openingBalance;

    const entriesWithBalance = periodEntries.map((entry) => {
      if (accountNature === "مدين") {
        runningBalance += Number(entry.debit || 0) - Number(entry.credit || 0);
      } else {
        runningBalance += Number(entry.credit || 0) - Number(entry.debit || 0);
      }

      return {
        ...entry,
        balance: runningBalance,
      };
    });

    /*
     * إجمالي المدين خلال الفترة
     */
    const totalDebit = periodEntries.reduce(
      (sum, entry) => sum + Number(entry.debit || 0),
      0,
    );

    /*
     * إجمالي الدائن خلال الفترة
     */
    const totalCredit = periodEntries.reduce(
      (sum, entry) => sum + Number(entry.credit || 0),
      0,
    );

    /*
     * =======================================================
     * الرصيد النهائي
     * =======================================================
     */
    const periodBalance =
      accountNature === "مدين"
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

    const closingBalance = openingBalance + periodBalance;

    return {
      entriesWithBalance,
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance,
    };
  }, [journalEntries, currentAccount, fromDate, toDate, accountNature]);

  const {
    entriesWithBalance,
    openingBalance,
    totalDebit,
    totalCredit,
    closingBalance,
  } = reportData;

  /*
   * =========================================================
   * تغيير الحساب
   * =========================================================
   */
  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
  };

  /*
   * =========================================================
   * التحقق من التاريخ
   * =========================================================
   */
  const invalidDateRange =
    Boolean(fromDate) && Boolean(toDate) && fromDate > toDate;

  /*
   * =========================================================
   * الطباعة
   * =========================================================
   */
  const handlePrint = () => {
    window.print();
  };

  /*
   * =========================================================
   * تحديث التقرير
   * =========================================================
   *
   * Zustand يقوم بالتحديث تلقائيًا.
   * لذلك لا نحتاج لتغيير أي بيانات.
   */
  const handleRefresh = () => {
    setSelectedAccount(currentAccount?.code || "");
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

            <span className="text-gray-800 font-medium">
              دفتر الأستاذ العام
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              دفتر الأستاذ العام
            </h1>

            <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              تقرير محاسبي
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            عرض الحركات المحاسبية الفعلية للحساب خلال الفترة المحددة
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
            <FiCalendar size={20} className="text-amber-600" />

            <div>
              <h2 className="font-bold text-gray-900">خيارات التقرير</h2>

              <p className="text-sm text-gray-500 mt-1">
                اختر الحساب والفترة المالية
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* =================================================
                ACCOUNT
            ================================================== */}

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                الحساب
              </label>

              <div className="relative">
                <FiBookOpen
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <select
                  value={currentAccount?.code || ""}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  disabled={availableAccounts.length === 0}
                  className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg pr-10 pl-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {availableAccounts.length === 0 ? (
                    <option value="">لا توجد حسابات</option>
                  ) : (
                    availableAccounts.map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* =================================================
                FROM DATE
            ================================================== */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                من تاريخ
              </label>

              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>

            {/* =================================================
                TO DATE
            ================================================== */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                إلى تاريخ
              </label>

              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>
          </div>

          {/* =================================================
              DATE ERROR
          ================================================== */}

          {invalidDateRange && (
            <div className="mt-5 flex items-center gap-2 p-4 rounded-lg bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold">
              <FiAlertCircle size={18} />
              يجب أن يكون تاريخ البداية قبل أو مساويًا لتاريخ النهاية.
            </div>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={invalidDateRange || !currentAccount}
            className="mt-5 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-semibold transition"
          >
            <FiRefreshCw size={18} />
            تحديث التقرير
          </button>
        </div>
      </section>

      {/* =====================================================
          NO ACCOUNT
      ====================================================== */}

      {!currentAccount ? (
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
          <FiAlertCircle size={40} className="mx-auto text-amber-500 mb-4" />

          <h2 className="text-xl font-bold text-gray-900">
            لا توجد حسابات في دليل الحسابات
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            قم بإضافة الحسابات من دليل الحسابات أولًا.
          </p>

          <Link
            href="/accounting/accounts"
            className="inline-flex items-center gap-2 mt-5 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg text-sm font-semibold"
          >
            <FiBookOpen size={18} />
            فتح دليل الحسابات
          </Link>
        </section>
      ) : (
        <>
          {/* =====================================================
              OFFICIAL REPORT
          ====================================================== */}

          <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">
            {/* =================================================
                COMPANY HEADER
            ================================================== */}

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
                    دفتر الأستاذ العام
                  </h2>

                  <p className="text-sm text-gray-600 mt-2">
                    عن الفترة من <span className="font-bold">{fromDate}</span>{" "}
                    إلى <span className="font-bold">{toDate}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                ACCOUNT INFO
            ================================================== */}

            <div className="p-5 md:p-8">
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                <div className="bg-gray-100 p-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">رمز الحساب</p>

                      <p className="text-lg font-bold text-gray-900">
                        {currentAccount.code}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">اسم الحساب</p>

                      <p className="text-lg font-bold text-gray-900">
                        {currentAccount.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">نوع الحساب</p>

                      <p className="text-lg font-bold text-gray-900">
                        {currentAccount.type === "asset"
                          ? "أصل"
                          : currentAccount.type === "liability"
                            ? "التزام"
                            : currentAccount.type === "equity"
                              ? "حقوق ملكية"
                              : currentAccount.type === "revenue"
                                ? "إيراد"
                                : "مصروف"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">طبيعة الحساب</p>

                      <p
                        className={`text-lg font-bold ${
                          accountNature === "مدين"
                            ? "text-blue-700"
                            : "text-red-700"
                        }`}
                      >
                        {accountNature}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-300">
                    <p className="text-xs text-gray-500 mb-1">
                      الرصيد الافتتاحي
                    </p>

                    <p
                      className={`text-lg font-bold ${
                        openingBalance >= 0 ? "text-blue-700" : "text-red-700"
                      }`}
                    >
                      {openingBalance < 0
                        ? `(${formatMoney(Math.abs(openingBalance))})`
                        : formatMoney(openingBalance)}{" "}
                      ريال
                    </p>
                  </div>
                </div>

                {/* =================================================
                    LEDGER TABLE
                ================================================== */}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="border border-gray-700 px-4 py-4 text-center text-sm font-bold">
                          #
                        </th>

                        <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                          التاريخ
                        </th>

                        <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                          نوع القيد
                        </th>

                        <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                          المرجع
                        </th>

                        <th className="border border-gray-700 px-4 py-4 text-right text-sm font-bold">
                          البيان
                        </th>

                        <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                          مدين
                        </th>

                        <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                          دائن
                        </th>

                        <th className="border border-gray-700 px-4 py-4 text-left text-sm font-bold">
                          الرصيد
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* =========================================
                          OPENING BALANCE
                      ========================================== */}

                      <tr className="bg-blue-50">
                        <td
                          colSpan={5}
                          className="border border-gray-300 px-4 py-4 font-bold text-gray-900"
                        >
                          الرصيد الافتتاحي
                        </td>

                        <td className="border border-gray-300 px-4 py-4 text-left">
                          -
                        </td>

                        <td className="border border-gray-300 px-4 py-4 text-left">
                          -
                        </td>

                        <td className="border border-gray-300 px-4 py-4 text-left font-bold text-blue-700">
                          {openingBalance < 0
                            ? `(${formatMoney(Math.abs(openingBalance))})`
                            : formatMoney(openingBalance)}
                        </td>
                      </tr>

                      {/* =========================================
                          MOVEMENTS
                      ========================================== */}

                      {entriesWithBalance.length > 0 ? (
                        entriesWithBalance.map((entry, index) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-600">
                              {index + 1}
                            </td>

                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                              {entry.date}
                            </td>

                            <td className="border border-gray-300 px-4 py-3 text-sm">
                              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                                {entry.journal}
                              </span>
                            </td>

                            <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700">
                              {entry.reference}
                            </td>

                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {entry.description}
                            </td>

                            <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-blue-700">
                              {entry.debit > 0 ? formatMoney(entry.debit) : "-"}
                            </td>

                            <td className="border border-gray-300 px-4 py-3 text-sm text-left font-semibold text-red-700">
                              {entry.credit > 0
                                ? formatMoney(entry.credit)
                                : "-"}
                            </td>

                            <td
                              className={`border border-gray-300 px-4 py-3 text-sm text-left font-bold ${
                                entry.balance >= 0
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {entry.balance < 0
                                ? `(${formatMoney(Math.abs(entry.balance))})`
                                : formatMoney(entry.balance)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="border border-gray-300 px-4 py-12 text-center text-gray-500"
                          >
                            لا توجد حركات محاسبية لهذا الحساب خلال الفترة
                            المحددة
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* =================================================
                        TOTALS
                    ================================================== */}

                    <tfoot>
                      <tr className="bg-gray-100">
                        <td
                          colSpan={5}
                          className="border-2 border-gray-400 px-4 py-4 text-right font-bold text-gray-900"
                        >
                          إجمالي حركات الفترة
                        </td>

                        <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-blue-700">
                          {formatMoney(totalDebit)}
                        </td>

                        <td className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-red-700">
                          {formatMoney(totalCredit)}
                        </td>

                        <td
                          className={`border-2 border-gray-400 px-4 py-4 text-left font-bold ${
                            closingBalance >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {closingBalance < 0
                            ? `(${formatMoney(Math.abs(closingBalance))})`
                            : formatMoney(closingBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* =====================================================
                  SUMMARY
              ====================================================== */}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 print:hidden">
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm text-gray-600">إجمالي المدين</p>

                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatMoney(totalDebit)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
                  <p className="text-sm text-gray-600">إجمالي الدائن</p>

                  <p className="text-2xl font-bold text-red-700 mt-2">
                    {formatMoney(totalCredit)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>

                <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-600">طبيعة الحساب</p>

                  <p
                    className={`text-2xl font-bold mt-2 ${
                      accountNature === "مدين"
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}
                  >
                    {accountNature}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {currentAccount.type === "asset"
                      ? "أصل"
                      : currentAccount.type === "liability"
                        ? "التزام"
                        : currentAccount.type === "equity"
                          ? "حقوق ملكية"
                          : currentAccount.type === "revenue"
                            ? "إيراد"
                            : "مصروف"}
                  </p>
                </div>

                <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
                  <p className="text-sm text-gray-600">الرصيد النهائي</p>

                  <p
                    className={`text-2xl font-bold mt-2 ${
                      closingBalance >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {closingBalance < 0
                      ? `(${formatMoney(Math.abs(closingBalance))})`
                      : formatMoney(closingBalance)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">ريال</p>
                </div>
              </div>

              {/* =====================================================
                  ACCOUNTING INFORMATION
              ====================================================== */}

              <div className="mt-6 p-5 rounded-xl border-2 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <FiBookOpen
                    size={21}
                    className="text-blue-600 mt-0.5 shrink-0"
                  />

                  <div>
                    <h3 className="font-bold text-gray-900">
                      مصدر البيانات المحاسبية
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      هذا التقرير يعتمد على القيود اليومية المرحلة الموجودة في
                      Zustand. يتم عرض الحركات الخاصة بالحساب{" "}
                      <strong>
                        {currentAccount.code} - {currentAccount.name}
                      </strong>{" "}
                      فقط.
                    </p>

                    <p className="text-xs text-gray-500 mt-2">
                      عدد القيود التي تحتوي على حركات لهذا الحساب خلال الفترة:{" "}
                      <strong>
                        {entriesWithBalance.length.toLocaleString("ar-SA")}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* =====================================================
                  FOOTER
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
        </>
      )}

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
