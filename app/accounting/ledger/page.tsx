"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiBookOpen,
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiFileText,
  FiFilter,
  FiPrinter,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function LedgerPage() {
  const { accounts, journalEntries, customers, suppliers, bankAccounts } =
    useERPStore();

  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAccounts, setShowAccounts] = useState(false);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(parsedDate);
  };

  const getEntityName = (account: (typeof accounts)[number]) => {
    if (account.entityType === "customer") {
      const customer = customers.find(
        (item) =>
          item.id === account.entityId ||
          item.accountId === account.id ||
          item.accountCode === account.code,
      );

      return customer?.name || "";
    }

    if (account.entityType === "supplier") {
      const supplier = suppliers.find(
        (item) =>
          item.id === account.entityId ||
          item.accountId === account.id ||
          item.accountCode === account.code,
      );

      return supplier?.name || "";
    }

    if (account.entityType === "bank") {
      const bank = bankAccounts.find(
        (item) =>
          item.id === account.entityId ||
          item.accountId === account.id ||
          item.accountCode === account.code,
      );

      return bank?.name || "";
    }

    return "";
  };

  const detailAccounts = useMemo(() => {
    return accounts
      .filter((account) => account.isActive !== false)
      .filter((account) => !account.isGroup)
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
          numeric: true,
        }),
      );
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return detailAccounts;

    return detailAccounts.filter((account) => {
      const entityName = getEntityName(account);

      return (
        account.code.toLowerCase().includes(query) ||
        account.name.toLowerCase().includes(query) ||
        (account.description || "").toLowerCase().includes(query) ||
        entityName.toLowerCase().includes(query)
      );
    });
  }, [detailAccounts, search, customers, suppliers, bankAccounts]);

  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId,
  );

  const movements = useMemo(() => {
    if (!selectedAccount) return [];

    const result: {
      id: string;
      entryId: string;
      entryNumber: string;
      date: string;
      description: string;
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      lineDescription: string;
      referenceType?: string;
      referenceId?: string;
    }[] = [];

    journalEntries.forEach((entry) => {
      if (dateFrom && entry.date < dateFrom) return;
      if (dateTo && entry.date > dateTo) return;

      entry.lines.forEach((line) => {
        if (
          line.accountId !== selectedAccount.id &&
          line.accountCode !== selectedAccount.code
        ) {
          return;
        }

        result.push({
          id: `${entry.id}-${line.id}`,
          entryId: entry.id,
          entryNumber: entry.entryNumber,
          date: entry.date,
          description: entry.description,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          lineDescription: line.description || "",
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
        });
      });
    });

    return result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);

      if (dateCompare !== 0) return dateCompare;

      return a.entryNumber.localeCompare(b.entryNumber, undefined, {
        numeric: true,
      });
    });
  }, [selectedAccount, journalEntries, dateFrom, dateTo]);

  const openingBalance = useMemo(() => {
    if (!selectedAccount || !dateFrom) return 0;

    let debit = 0;
    let credit = 0;

    journalEntries.forEach((entry) => {
      if (entry.date >= dateFrom) return;

      entry.lines.forEach((line) => {
        if (
          line.accountId !== selectedAccount.id &&
          line.accountCode !== selectedAccount.code
        ) {
          return;
        }

        debit += Number(line.debit || 0);
        credit += Number(line.credit || 0);
      });
    });

    if (selectedAccount.nature === "credit") {
      return credit - debit;
    }

    return debit - credit;
  }, [selectedAccount, journalEntries, dateFrom]);

  const ledgerRows = useMemo(() => {
    let runningBalance = openingBalance;

    return movements.map((movement) => {
      if (selectedAccount?.nature === "credit") {
        runningBalance += movement.credit - movement.debit;
      } else {
        runningBalance += movement.debit - movement.credit;
      }

      return {
        ...movement,
        runningBalance,
      };
    });
  }, [movements, openingBalance, selectedAccount]);

  const totals = useMemo(() => {
    const debit = movements.reduce((sum, movement) => sum + movement.debit, 0);

    const credit = movements.reduce(
      (sum, movement) => sum + movement.credit,
      0,
    );

    const closingBalance =
      ledgerRows.length > 0
        ? ledgerRows[ledgerRows.length - 1].runningBalance
        : openingBalance;

    return {
      debit,
      credit,
      closingBalance,
    };
  }, [movements, ledgerRows, openingBalance]);

  const selectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    setShowAccounts(false);
    setSearch("");
  };

  const clearAccount = () => {
    setSelectedAccountId("");
    setSearch("");
    setShowAccounts(false);
  };

  const handlePrint = () => {
    if (!selectedAccount) return;
    window.print();
  };

  const getNatureLabel = (nature: string) =>
    nature === "credit" ? "دائن" : "مدين";

  const getReferenceLabel = (type?: string) => {
    switch (type) {
      case "sale":
        return "مبيعات";
      case "purchase":
        return "مشتريات";
      case "payment":
        return "سداد";
      case "receipt":
        return "قبض";
      case "manual":
        return "قيد يدوي";
      default:
        return "أخرى";
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 p-2.5 sm:p-3 md:p-4 lg:p-5 print:bg-white print:p-0"
    >
      {/* العنوان */}
      <div className="mx-auto mb-4 flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-xs">
            <FiBookOpen />
            <Link href="/accounting" className="hover:text-[#0E1F33]">
              المحاسبة
            </Link>
            <span>/</span>
            <span>دفتر الأستاذ</span>
          </div>

          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            دفتر الأستاذ العام
          </h1>

          <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">
            عرض جميع الحركات والرصيد الجاري لكل حساب
          </p>
        </div>

        <Link
          href="/accounting/journal/new"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0E1F33] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#162d47] sm:w-auto"
        >
          <FiFileText />
          قيد يومية جديد
        </Link>
      </div>

      {/* اختيار الحساب */}
      <div className="mx-auto mb-4 max-w-7xl rounded-xl border border-gray-200 bg-white p-3 shadow-sm print:hidden">
        <div className="mb-2.5 flex items-center gap-1.5">
          <FiFilter className="text-xs text-gray-500" />
          <h2 className="text-xs font-bold text-gray-800 sm:text-sm">
            اختيار الحساب
          </h2>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAccounts((value) => !value)}
            className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-right transition hover:bg-white"
          >
            {selectedAccount ? (
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0E1F33] text-sm text-white">
                  <FiDollarSign />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-gray-800 sm:text-sm">
                    {selectedAccount.name}
                  </div>

                  <div className="mt-0.5 flex flex-wrap gap-1.5 text-[10px] text-gray-500">
                    <span>{selectedAccount.code}</span>
                    <span>•</span>
                    <span>
                      طبيعة الحساب: {getNatureLabel(selectedAccount.nature)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FiSearch />
                <span>اختر الحساب الذي تريد عرض دفتر الأستاذ الخاص به</span>
              </div>
            )}

            <FiChevronDown
              className={`shrink-0 text-sm transition ${
                showAccounts ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAccounts && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              {/* البحث */}
              <div className="border-b border-gray-100 p-2.5">
                <div className="relative">
                  <FiSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    placeholder="ابحث برقم أو اسم الحساب..."
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-2.5 text-xs outline-none focus:border-[#0E1F33] focus:bg-white"
                  />
                </div>
              </div>

              {/* الحسابات */}
              <div className="max-h-64 overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <div className="p-5 text-center text-xs text-gray-500">
                    لا توجد حسابات مطابقة للبحث
                  </div>
                ) : (
                  filteredAccounts.map((account) => {
                    const entityName = getEntityName(account);

                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => selectAccount(account.id)}
                        className="flex w-full items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 text-right transition last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-gray-800">
                            {account.name}
                          </div>

                          <div className="mt-0.5 flex flex-wrap gap-1.5 text-[10px] text-gray-400">
                            <span>{account.code}</span>

                            {entityName && (
                              <>
                                <span>•</span>
                                <span>{entityName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            account.nature === "credit"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {getNatureLabel(account.nature)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {selectedAccount && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={clearAccount}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] text-red-600 transition hover:bg-red-50 sm:text-xs"
            >
              <FiX />
              إلغاء اختيار الحساب
            </button>
          </div>
        )}
      </div>

      {/* الفلاتر */}
      {selectedAccount && (
        <div className="mx-auto mb-4 max-w-7xl rounded-xl border border-gray-200 bg-white p-3 shadow-sm print:hidden">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-gray-700 sm:text-xs">
                من تاريخ
              </label>

              <div className="relative">
                <FiCalendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-2.5 text-xs outline-none focus:border-[#0E1F33] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-gray-700 sm:text-xs">
                إلى تاريخ
              </label>

              <div className="relative">
                <FiCalendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-2.5 text-xs outline-none focus:border-[#0E1F33] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                <FiX />
                مسح الفترة
              </button>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handlePrint}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0E1F33] text-xs font-semibold text-white transition hover:bg-[#162d47]"
              >
                <FiPrinter />
                طباعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* دفتر الأستاذ */}
      {selectedAccount ? (
        <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          {/* رأس التقرير */}
          <div className="border-b border-gray-200 p-3 sm:p-3.5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-base font-bold text-gray-800 sm:text-lg">
                  دفتر الأستاذ العام
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] sm:text-xs">
                  <div>
                    <span className="text-gray-500">الحساب:</span>{" "}
                    <span className="font-bold text-gray-800">
                      {selectedAccount.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500">رقم الحساب:</span>{" "}
                    <span className="font-bold text-gray-800">
                      {selectedAccount.code}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500">الطبيعة:</span>{" "}
                    <span className="font-bold text-gray-800">
                      {getNatureLabel(selectedAccount.nature)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left text-[10px] text-gray-500 sm:text-right">
                <div className="font-semibold">شركة الجابري</div>
                <div className="mt-0.5">
                  للعسل والزيوت الطبيعة وخدمات العمرة
                </div>
                <div className="mt-0.5">البيضاء - اليمن</div>
              </div>
            </div>
          </div>

          {/* الملخص */}
          <div className="grid grid-cols-1 gap-2 border-b border-gray-200 bg-gray-50 p-2.5 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-2.5">
              <div className="text-[10px] text-gray-500">الرصيد الافتتاحي</div>
              <div className="mt-1 text-base font-bold text-gray-800">
                {formatMoney(openingBalance)}
              </div>
            </div>

            <div className="rounded-lg bg-white p-2.5">
              <div className="text-[10px] text-gray-500">إجمالي الحركة</div>
              <div className="mt-1 text-base font-bold text-gray-800">
                {formatMoney(totals.debit)}
              </div>
              <div className="mt-0.5 text-[9px] text-gray-400">مدين</div>
            </div>

            <div className="rounded-lg bg-white p-2.5">
              <div className="text-[10px] text-gray-500">الرصيد الختامي</div>

              <div
                className={`mt-1 text-base font-bold ${
                  totals.closingBalance >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {formatMoney(Math.abs(totals.closingBalance))}
              </div>

              <div className="mt-0.5 text-[9px] text-gray-400">
                {totals.closingBalance >= 0
                  ? getNatureLabel(selectedAccount.nature)
                  : selectedAccount.nature === "credit"
                    ? "مدين"
                    : "دائن"}
              </div>
            </div>
          </div>

          {/* جدول الحركات */}
          {ledgerRows.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center p-5 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <FiFileText className="text-2xl" />
              </div>

              <h3 className="text-sm font-bold text-gray-700">لا توجد حركات</h3>

              <p className="mt-1.5 max-w-md text-[10px] text-gray-500 sm:text-xs">
                لا توجد قيود يومية مسجلة لهذا الحساب ضمن الفترة المحددة.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-right">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-600 sm:text-xs">
                    <th className="px-2.5 py-2.5 font-semibold">التاريخ</th>
                    <th className="px-2.5 py-2.5 font-semibold">رقم القيد</th>
                    <th className="px-2.5 py-2.5 font-semibold">البيان</th>
                    <th className="px-2.5 py-2.5 font-semibold">المرجع</th>
                    <th className="px-2.5 py-2.5 font-semibold">مدين</th>
                    <th className="px-2.5 py-2.5 font-semibold">دائن</th>
                    <th className="px-2.5 py-2.5 font-semibold">الرصيد</th>
                  </tr>
                </thead>

                <tbody>
                  {/* الرصيد الافتتاحي */}
                  <tr className="border-b border-gray-100 bg-blue-50/40">
                    <td className="px-2.5 py-2.5 text-[10px] text-gray-500">
                      -
                    </td>

                    <td className="px-2.5 py-2.5 text-[10px] text-gray-500">
                      -
                    </td>

                    <td className="px-2.5 py-2.5 text-xs font-semibold text-gray-700">
                      الرصيد الافتتاحي
                    </td>

                    <td className="px-2.5 py-2.5 text-[10px] text-gray-400">
                      -
                    </td>

                    <td className="px-2.5 py-2.5 text-[10px]">-</td>

                    <td className="px-2.5 py-2.5 text-[10px]">-</td>

                    <td className="px-2.5 py-2.5 text-xs font-bold text-gray-800">
                      {formatMoney(Math.abs(openingBalance))}
                    </td>
                  </tr>

                  {ledgerRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-2.5 py-2.5 text-[10px] text-gray-600 sm:text-xs">
                        {formatDate(row.date)}
                      </td>

                      <td className="px-2.5 py-2.5">
                        <Link
                          href={`/accounting/journal/${row.entryId}`}
                          className="text-xs font-semibold text-[#0E1F33] hover:underline"
                        >
                          {row.entryNumber}
                        </Link>
                      </td>

                      <td className="max-w-[280px] px-2.5 py-2.5">
                        <div className="truncate text-xs font-medium text-gray-800">
                          {row.lineDescription || row.description}
                        </div>

                        {row.lineDescription && (
                          <div className="mt-0.5 truncate text-[9px] text-gray-400">
                            {row.description}
                          </div>
                        )}
                      </td>

                      <td className="px-2.5 py-2.5">
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-600">
                          {getReferenceLabel(row.referenceType)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-2.5 text-xs font-semibold text-gray-800">
                        {row.debit > 0 ? formatMoney(row.debit) : "-"}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-2.5 text-xs font-semibold text-gray-800">
                        {row.credit > 0 ? formatMoney(row.credit) : "-"}
                      </td>

                      <td
                        className={`whitespace-nowrap px-2.5 py-2.5 text-xs font-bold ${
                          row.runningBalance >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatMoney(Math.abs(row.runningBalance))}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 text-xs font-bold">
                    <td colSpan={4} className="px-2.5 py-2.5">
                      إجمالي الفترة
                    </td>

                    <td className="px-2.5 py-2.5">
                      {formatMoney(totals.debit)}
                    </td>

                    <td className="px-2.5 py-2.5">
                      {formatMoney(totals.credit)}
                    </td>

                    <td className="px-2.5 py-2.5">
                      {formatMoney(Math.abs(totals.closingBalance))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* لم يتم اختيار حساب */
        <div className="mx-auto max-w-7xl rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center sm:min-h-[350px]">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E1F33]/5 text-[#0E1F33]">
              <FiBookOpen className="text-3xl" />
            </div>

            <h2 className="text-base font-bold text-gray-800 sm:text-lg">
              اختر حسابًا لعرض دفتر الأستاذ
            </h2>

            <p className="mt-1.5 max-w-lg text-[10px] leading-5 text-gray-500 sm:text-xs sm:leading-6">
              اختر أحد الحسابات التفصيلية من القائمة أعلاه لعرض جميع الحركات
              المدينة والدائنة والرصيد الجاري للحساب.
            </p>

            <button
              type="button"
              onClick={() => setShowAccounts(true)}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#162d47]"
            >
              <FiSearch />
              اختيار الحساب
            </button>
          </div>
        </div>
      )}

      {/* التذييل */}
      <div className="mx-auto mt-4 max-w-7xl text-center text-[9px] text-gray-400 print:hidden sm:text-[10px]">
        شركة الجابري — للعسل والزيوت الطبيعة وخدمات العمرة — البيضاء - اليمن —
        هاتف: 734 434 443
      </div>
    </div>
  );
}
