"use client";

import { useMemo, useState } from "react";
import { useERPStore } from "@/Store/erpStore";
import {
  FiSearch,
  FiPrinter,
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiChevronDown,
} from "react-icons/fi";

export default function AccountingReportsPage() {
  /* =====================================================
     STORE
  ===================================================== */

  const accounts = useERPStore((state) => state.accounts);
  const journalEntries = useERPStore((state) => state.journalEntries);
  const customers = useERPStore((state) => state.customers);
  const suppliers = useERPStore((state) => state.suppliers);
  const bankAccounts = useERPStore((state) => state.bankAccounts);

  /* =====================================================
     STATE
  ===================================================== */

  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showAccountList, setShowAccountList] = useState(false);

  /* =====================================================
     SELECTED ACCOUNT
  ===================================================== */

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return undefined;

    return accounts.find((account) => account.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  /* =====================================================
     NORMALIZE PHONE
  ===================================================== */

  const normalizePhone = (phone?: string) => {
    return String(phone || "").replace(/[\s\-().+]/g, "");
  };

  /* =====================================================
     SEARCH ACCOUNTS
  ===================================================== */

  const filteredAccounts = useMemo(() => {
    const value = search.trim().toLowerCase();
    const normalizedSearch = normalizePhone(search);

    const activeAccounts = accounts.filter(
      (account) => account.isActive !== false,
    );

    if (!value) {
      return activeAccounts.slice(0, 30);
    }

    return activeAccounts
      .filter((account) => {
        const nameMatch = String(account.name || "")
          .toLowerCase()
          .includes(value);

        const codeMatch = String(account.code || "")
          .toLowerCase()
          .includes(value);

        if (nameMatch || codeMatch) {
          return true;
        }

        const customerMatch = customers.some((customer) => {
          const sameAccount =
            customer.accountId === account.id ||
            customer.accountCode === account.code;

          if (!sameAccount) return false;

          const phone = normalizePhone(customer.phone);

          return (
            normalizedSearch.length > 0 && phone.includes(normalizedSearch)
          );
        });

        if (customerMatch) {
          return true;
        }

        const supplierMatch = suppliers.some((supplier) => {
          const sameAccount =
            supplier.accountId === account.id ||
            supplier.accountCode === account.code;

          if (!sameAccount) return false;

          const phone = normalizePhone(supplier.phone);

          return (
            normalizedSearch.length > 0 && phone.includes(normalizedSearch)
          );
        });

        if (supplierMatch) {
          return true;
        }

        const bankMatch = bankAccounts.some((bank) => {
          const sameAccount =
            bank.accountId === account.id || bank.accountCode === account.code;

          if (!sameAccount) return false;

          const phone = normalizePhone(bank.phone);

          return (
            normalizedSearch.length > 0 && phone.includes(normalizedSearch)
          );
        });

        return bankMatch;
      })
      .slice(0, 30);
  }, [accounts, customers, suppliers, bankAccounts, search]);

  /* =====================================================
     ACCOUNT PHONE
  ===================================================== */

  const getAccountPhone = (accountId: string, accountCode: string) => {
    const customer = customers.find(
      (item) =>
        item.accountId === accountId || item.accountCode === accountCode,
    );

    if (customer?.phone) {
      return customer.phone;
    }

    const supplier = suppliers.find(
      (item) =>
        item.accountId === accountId || item.accountCode === accountCode,
    );

    if (supplier?.phone) {
      return supplier.phone;
    }

    const bank = bankAccounts.find(
      (item) =>
        item.accountId === accountId || item.accountCode === accountCode,
    );

    if (bank?.phone) {
      return bank.phone;
    }

    return "";
  };

  /* =====================================================
     ACCOUNT MOVEMENTS
  ===================================================== */

  const accountMovements = useMemo(() => {
    if (!selectedAccount) return [];

    const movements: {
      entryId: string;
      entryNumber: string;
      date: string;
      description: string;
      debit: number;
      credit: number;
      referenceType?: string;
      referenceId?: string;
    }[] = [];

    journalEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const sameAccount =
          line.accountId === selectedAccount.id ||
          line.accountCode === selectedAccount.code;

        if (!sameAccount) return;

        movements.push({
          entryId: entry.id,
          entryNumber: entry.entryNumber,
          date: entry.date,
          description: line.description || entry.description || "",
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
        });
      });
    });

    return movements.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      return a.entryNumber.localeCompare(b.entryNumber, undefined, {
        numeric: true,
      });
    });
  }, [journalEntries, selectedAccount]);

  /* =====================================================
     REPORT DATA
  ===================================================== */

  const reportData = useMemo(() => {
    if (!selectedAccount) {
      return {
        openingDebit: 0,
        openingCredit: 0,
        openingBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        finalBalance: 0,
        movements: [],
      };
    }

    let openingDebit = 0;
    let openingCredit = 0;

    let totalDebit = 0;
    let totalCredit = 0;

    const periodMovements: typeof accountMovements = [];

    accountMovements.forEach((movement) => {
      const date = movement.date;

      if (fromDate && date < fromDate) {
        openingDebit += movement.debit;
        openingCredit += movement.credit;
        return;
      }

      if (toDate && date > toDate) {
        return;
      }

      totalDebit += movement.debit;
      totalCredit += movement.credit;

      periodMovements.push(movement);
    });

    const openingBalance =
      selectedAccount.nature === "debit"
        ? openingDebit - openingCredit
        : openingCredit - openingDebit;

    const periodBalance =
      selectedAccount.nature === "debit"
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

    const finalBalance = openingBalance + periodBalance;

    let runningBalance = openingBalance;

    const movements = periodMovements.map((movement) => {
      if (selectedAccount.nature === "debit") {
        runningBalance += movement.debit - movement.credit;
      } else {
        runningBalance += movement.credit - movement.debit;
      }

      return {
        ...movement,
        balance: runningBalance,
      };
    });

    return {
      openingDebit,
      openingCredit,
      openingBalance,
      totalDebit,
      totalCredit,
      finalBalance,
      movements,
    };
  }, [selectedAccount, accountMovements, fromDate, toDate]);

  /* =====================================================
     FORMAT MONEY
  ===================================================== */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-YE", {
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const getBalanceText = (balance: number) => {
    return formatMoney(Math.abs(balance));
  };

  /* =====================================================
     BALANCE TYPE
  ===================================================== */

  const getBalanceType = (balance: number) => {
    if (balance === 0) {
      return "متزن";
    }

    if (!selectedAccount) {
      return "";
    }

    if (selectedAccount.nature === "debit") {
      return balance > 0 ? "مدين" : "دائن";
    }

    return balance > 0 ? "دائن" : "مدين";
  };

  /* =====================================================
     ACCOUNT TYPE
  ===================================================== */

  const accountTypeLabel = (type: string) => {
    switch (type) {
      case "asset":
        return "أصل";
      case "liability":
        return "التزام";
      case "equity":
        return "حقوق ملكية";
      case "revenue":
        return "إيراد";
      case "expense":
        return "مصروف";
      default:
        return type;
    }
  };

  /* =====================================================
     SELECT ACCOUNT
  ===================================================== */

  const handleSelectAccount = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId);

    if (!account) return;

    setSelectedAccountId(account.id);
    setSearch(`${account.code} - ${account.name}`);
    setShowAccountList(false);
  };

  /* =====================================================
     RESET
  ===================================================== */

  const handleReset = () => {
    setSearch("");
    setSelectedAccountId("");
    setFromDate("");
    setToDate("");
    setShowAccountList(false);
  };

  /* =====================================================
     PRINT
  ===================================================== */

  const handlePrint = () => {
    if (!selectedAccount) return;

    window.print();
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-gray-50 px-2.5 py-3 sm:px-3 sm:py-4 md:px-4 lg:px-5 print:bg-white print:p-0"
      >
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}

          <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between print:mb-3">
            <div>
              <div className="mb-0.5 text-[10px] text-gray-400">
                المحاسبة / التقارير
              </div>

              <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
                تقارير الحسابات
              </h1>

              <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
                كشف حساب والحركات والرصيد خلال فترة محددة
              </p>
            </div>

            <div className="flex gap-1.5 print:hidden">
              <button
                type="button"
                onClick={handleReset}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FiRefreshCw size={13} />
                إعادة ضبط
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!selectedAccount}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-3.5 text-xs font-bold text-white transition hover:bg-[#172d46] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiPrinter size={13} />
                طباعة التقرير
              </button>
            </div>
          </div>

          {/* FILTERS */}

          <section className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm print:hidden">
            <div className="mb-2.5 flex items-center gap-1.5">
              <FiFileText size={14} className="text-blue-600" />

              <h2 className="text-xs font-bold text-gray-800">إعداد التقرير</h2>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
              {/* ACCOUNT */}

              <div className="relative lg:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                  الحساب
                </label>

                <div className="relative">
                  <FiSearch
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      const value = e.target.value;

                      setSearch(value);
                      setShowAccountList(true);

                      if (
                        selectedAccount &&
                        value !==
                          `${selectedAccount.code} - ${selectedAccount.name}`
                      ) {
                        setSelectedAccountId("");
                      }
                    }}
                    onFocus={() => setShowAccountList(true)}
                    placeholder="ابحث برقم الحساب أو الاسم أو الهاتف..."
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white pr-9 pl-9 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <FiChevronDown
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                {/* ACCOUNT LIST */}

                {showAccountList && (
                  <div className="absolute right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                    {filteredAccounts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        لا توجد حسابات مطابقة
                      </div>
                    ) : (
                      filteredAccounts.map((account) => {
                        const phone = getAccountPhone(account.id, account.code);

                        return (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => handleSelectAccount(account.id)}
                            className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5 text-right transition last:border-b-0 hover:bg-blue-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-800">
                                {account.name}
                              </p>

                              <p className="mt-0.5 text-[10px] text-gray-500">
                                رقم الحساب: {account.code}
                              </p>

                              {phone && (
                                <p className="mt-0.5 text-[10px] font-medium text-blue-600">
                                  الهاتف: {phone}
                                </p>
                              )}
                            </div>

                            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                              {accountTypeLabel(account.type)}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* FROM DATE */}

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                  من تاريخ
                </label>

                <div className="relative">
                  <FiCalendar
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white pr-9 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* TO DATE */}

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                  إلى تاريخ
                </label>

                <div className="relative">
                  <FiCalendar
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white pr-9 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* REPORT */}

          {selectedAccount ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
              {/* COMPANY HEADER */}

              <div className="border-b-2 border-gray-800 p-4 print:p-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 print:text-lg">
                      شركة الجابري
                    </h2>

                    <p className="mt-0.5 text-[11px] text-gray-600">
                      للعسل والزيوت الطبيعة وخدمات العمرة
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-600">
                      البيضاء - اليمن
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-600">
                      هاتف: 734 434 443
                    </p>
                  </div>

                  <div className="text-left">
                    <h1 className="text-xl font-bold text-gray-900 print:text-lg">
                      كشف حساب
                    </h1>

                    <p className="mt-1 text-[11px] text-gray-600">
                      الحساب:
                      <span className="mr-1.5 font-bold text-gray-900">
                        {selectedAccount.code}
                      </span>
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-600">
                      الفترة:
                      <span className="mr-1.5 font-bold text-gray-900">
                        {fromDate || "من البداية"}
                      </span>
                      <span className="mx-0.5">-</span>
                      <span className="font-bold text-gray-900">
                        {toDate || "حتى الآن"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ACCOUNT INFO */}

              <div className="grid grid-cols-2 border-b border-gray-300 md:grid-cols-4">
                <div className="border-l border-gray-300 px-3 py-2.5">
                  <p className="text-[10px] text-gray-500">اسم الحساب</p>

                  <p className="mt-0.5 truncate text-xs font-bold text-gray-800">
                    {selectedAccount.name}
                  </p>
                </div>

                <div className="border-l border-gray-300 px-3 py-2.5">
                  <p className="text-[10px] text-gray-500">رقم الحساب</p>

                  <p className="mt-0.5 text-xs font-bold text-gray-800">
                    {selectedAccount.code}
                  </p>
                </div>

                <div className="border-l border-gray-300 px-3 py-2.5">
                  <p className="text-[10px] text-gray-500">نوع الحساب</p>

                  <p className="mt-0.5 text-xs font-bold text-gray-800">
                    {accountTypeLabel(selectedAccount.type)}
                  </p>
                </div>

                <div className="px-3 py-2.5">
                  <p className="text-[10px] text-gray-500">طبيعة الحساب</p>

                  <p className="mt-0.5 text-xs font-bold text-gray-800">
                    {selectedAccount.nature === "debit" ? "مدين" : "دائن"}
                  </p>
                </div>
              </div>

              {/* SUMMARY */}

              <div className="grid grid-cols-2 gap-2.5 p-3 md:grid-cols-4 print:grid-cols-4 print:p-2">
                {/* Opening */}

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 print:p-2">
                  <p className="text-[10px] text-gray-500">الرصيد السابق</p>

                  <p className="mt-1 text-base font-bold text-gray-800">
                    {getBalanceText(reportData.openingBalance)}{" "}
                    <span className="text-[10px]">ريال</span>
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold text-gray-500">
                    {getBalanceType(reportData.openingBalance)}
                  </p>
                </div>

                {/* Debit */}

                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 print:p-2">
                  <p className="text-[10px] text-blue-600">إجمالي المدين</p>

                  <p className="mt-1 text-base font-bold text-blue-800">
                    {formatMoney(reportData.totalDebit)}{" "}
                    <span className="text-[10px]">ريال</span>
                  </p>
                </div>

                {/* Credit */}

                <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 print:p-2">
                  <p className="text-[10px] text-green-600">إجمالي الدائن</p>

                  <p className="mt-1 text-base font-bold text-green-800">
                    {formatMoney(reportData.totalCredit)}{" "}
                    <span className="text-[10px]">ريال</span>
                  </p>
                </div>

                {/* Final */}

                <div className="rounded-lg border-2 border-gray-800 bg-white px-3 py-2.5 print:p-2">
                  <p className="text-[10px] text-gray-600">الرصيد النهائي</p>

                  <p className="mt-1 text-base font-bold text-gray-900">
                    {getBalanceText(reportData.finalBalance)}{" "}
                    <span className="text-[10px]">ريال</span>
                  </p>

                  <p className="mt-0.5 text-[10px] font-bold text-gray-600">
                    {getBalanceType(reportData.finalBalance)}
                  </p>
                </div>
              </div>

              {/* MOVEMENTS */}

              <div className="px-3 pb-3 print:px-2">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800">
                    حركات الحساب
                  </h3>

                  <span className="text-[10px] text-gray-500">
                    عدد الحركات: {reportData.movements.length}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-300">
                  <table className="w-full min-w-[820px] border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="w-10 border-b border-l border-gray-300 px-2 py-2">
                          م
                        </th>

                        <th className="w-24 border-b border-l border-gray-300 px-2 py-2">
                          التاريخ
                        </th>

                        <th className="w-24 border-b border-l border-gray-300 px-2 py-2">
                          رقم القيد
                        </th>

                        <th className="border-b border-l border-gray-300 px-2 py-2 text-right">
                          البيان
                        </th>

                        <th className="w-24 border-b border-l border-gray-300 px-2 py-2">
                          مدين
                        </th>

                        <th className="w-24 border-b border-l border-gray-300 px-2 py-2">
                          دائن
                        </th>

                        <th className="w-28 border-b border-gray-300 px-2 py-2">
                          الرصيد
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Opening */}

                      <tr className="bg-gray-50">
                        <td className="border-b border-l border-gray-200 px-2 py-2 text-center">
                          -
                        </td>

                        <td className="border-b border-l border-gray-200 px-2 py-2 text-center">
                          {fromDate || "-"}
                        </td>

                        <td className="border-b border-l border-gray-200 px-2 py-2 text-center">
                          -
                        </td>

                        <td className="border-b border-l border-gray-200 px-2 py-2 font-semibold">
                          الرصيد الافتتاحي
                        </td>

                        <td className="border-b border-l border-gray-200 px-2 py-2 text-center">
                          -
                        </td>

                        <td className="border-b border-l border-gray-200 px-2 py-2 text-center">
                          -
                        </td>

                        <td className="border-b border-gray-200 px-2 py-2 text-center font-bold">
                          {getBalanceText(reportData.openingBalance)}{" "}
                          <span className="text-[9px] text-gray-500">
                            {getBalanceType(reportData.openingBalance)}
                          </span>
                        </td>
                      </tr>

                      {/* Movements */}

                      {reportData.movements.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-xs text-gray-500"
                          >
                            لا توجد حركات لهذا الحساب خلال الفترة المحددة
                          </td>
                        </tr>
                      ) : (
                        reportData.movements.map((movement, index) => (
                          <tr
                            key={`${movement.entryId}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="border-b border-l border-gray-200 px-2 py-2 text-center">
                              {index + 1}
                            </td>

                            <td className="border-b border-l border-gray-200 px-2 py-2 text-center">
                              {movement.date}
                            </td>

                            <td className="border-b border-l border-gray-200 px-2 py-2 text-center font-semibold">
                              {movement.entryNumber}
                            </td>

                            <td className="max-w-[320px] border-b border-l border-gray-200 px-2 py-2">
                              {movement.description || "-"}
                            </td>

                            <td className="border-b border-l border-gray-200 px-2 py-2 text-center font-semibold text-blue-700">
                              {movement.debit > 0
                                ? formatMoney(movement.debit)
                                : "-"}
                            </td>

                            <td className="border-b border-l border-gray-200 px-2 py-2 text-center font-semibold text-green-700">
                              {movement.credit > 0
                                ? formatMoney(movement.credit)
                                : "-"}
                            </td>

                            <td className="border-b border-gray-200 px-2 py-2 text-center font-bold">
                              {getBalanceText(movement.balance)}{" "}
                              <span className="text-[9px] text-gray-500">
                                {getBalanceType(movement.balance)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* TOTAL */}

                    <tfoot>
                      <tr className="bg-gray-100 text-xs font-bold">
                        <td
                          colSpan={4}
                          className="border-l border-gray-300 px-2 py-2.5 text-left"
                        >
                          إجمالي الفترة
                        </td>

                        <td className="border-l border-gray-300 px-2 py-2.5 text-center text-blue-700">
                          {formatMoney(reportData.totalDebit)}
                        </td>

                        <td className="border-l border-gray-300 px-2 py-2.5 text-center text-green-700">
                          {formatMoney(reportData.totalCredit)}
                        </td>

                        <td className="px-2 py-2.5 text-center">
                          {getBalanceText(reportData.finalBalance)}{" "}
                          <span className="text-[9px] text-gray-500">
                            {getBalanceType(reportData.finalBalance)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* FOOTER */}

              <div className="border-t border-gray-300 px-3 py-3 text-center text-[10px] text-gray-500 print:px-2 print:py-2">
                <p className="font-semibold text-gray-700">شركة الجابري</p>

                <p className="mt-0.5">
                  الجابري للعسل والزيوت الطبيعة وخدمات العمرة
                </p>

                <p className="mt-0.5">البيضاء - اليمن | هاتف: 734 434 443</p>
              </div>
            </div>
          ) : (
            /* NO ACCOUNT */

            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center shadow-sm print:hidden">
              <FiFileText size={38} className="mx-auto text-gray-300" />

              <h2 className="mt-3 text-sm font-bold text-gray-700">
                اختر حسابًا لعرض التقرير
              </h2>

              <p className="mx-auto mt-1.5 max-w-lg px-3 text-[11px] text-gray-500">
                ابحث عن الحساب باستخدام الاسم أو رقم الحساب أو رقم الهاتف، ثم
                حدد الفترة المطلوبة لعرض الحركات والرصيد.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* PRINT CSS */}

      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          * {
            box-sizing: border-box;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
