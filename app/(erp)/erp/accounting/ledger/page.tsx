"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  FiSearch,
  FiRefreshCw,
  FiBookOpen,
  FiFilter,
  FiPrinter,
  FiArrowUpCircle,
  FiArrowDownCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { toast } from "sonner";

import { Account } from "../accounts/types";

import { getCurrentActor, saveActivityLog } from "@/app/(erp)/erp/lib/activity";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// المستخدم الحالي
interface CurrentUser {
  id: number | string;
  name: string;
  username: string;
  type: string;
  role: string;
  companyId?: string;
  companyname?: string;
}

// القيد اليومي
interface Journal {
  id: number | string;
  journalNumber: string;
  date: string;
  description: string;
  status: "draft" | "posted" | "cancelled";
  companyId: string;
}

// سطر القيد
interface JournalLine {
  id: number | string;
  journalId: number | string;
  accountId: number | string;
  debit: number;
  credit: number;
  companyId: string;
  description?: string;
}

// الرصيد الافتتاحي
interface OpeningEntry {
  id: number | string;
  accountId: number | string;
  date: string;
  debit: number;
  credit: number;
  companyId: string;
  description?: string;
  reference?: string;
}

// حركة دفتر الأستاذ
interface LedgerTransaction {
  id: string;
  journalId?: number | string;
  journalNumber: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  source: "opening" | "journal";
  balance: number;
}

interface LedgerFilters {
  accountId: string;
  fromDate: string;
  toDate: string;
  search: string;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const formatDate = (date: string) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

export default function LedgerPage() {
  const router = useRouter();

  const activityViewLogged = useRef(false);

  // المستخدم والشركة
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState("");

  // البيانات
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // الفلاتر
  const [filters, setFilters] = useState<LedgerFilters>({
    accountId: "",
    fromDate: "",
    toDate: "",
    search: "",
  });

  // تحديد المستخدم
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setUserLoading(true);
        setUserError("");

        const username = getCookie("username");

        if (!username) {
          throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
        }

        const response = await api.get<CurrentUser[]>("/users", {
          params: { username },
        });

        const user = response.data.find((item) => item.username === username);

        if (!user) {
          throw new Error("المستخدم غير موجود");
        }

        if (user.type === "platform") {
          throw new Error("لا يمكن لمستخدم المنصة الوصول إلى دفتر الأستاذ");
        }

        if (!user.companyId) {
          throw new Error("المستخدم غير مرتبط بأي شركة");
        }

        setCurrentUser(user);
        setCompanyId(String(user.companyId));
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر الاتصال بـ JSON Server"
          : err instanceof Error
            ? err.message
            : "حدث خطأ غير متوقع";

        setUserError(message);
      } finally {
        setUserLoading(false);
      }
    };

    void getCurrentUser();
  }, []);

  // تسجيل نشاط المستخدم
  const logLedgerActivity = useCallback(
    async (
      action: "view" | "print",
      description: string,
      account?: Account,
    ) => {
      try {
        const actor = getCurrentActor();

        if (!actor) {
          console.warn("لم يتم العثور على هوية المستخدم في authUser");
          return;
        }

        if (String(actor.companyId) !== String(companyId)) {
          console.warn("شركة المستخدم في سجل النشاط لا تطابق الشركة الحالية");
          return;
        }

        await saveActivityLog({
          companyId: String(companyId),
          userId: String(actor.userId),
          userName: actor.userName,
          username: actor.username,
          userRole: actor.userRole,
          action,
          module: "accounting",
          description,
          recordId: account ? String(account.id) : "",
          recordName: account
            ? `${account.code} - ${account.name}`
            : "دفتر الأستاذ العام",
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Ledger Activity Error:", err);
      }
    },
    [companyId],
  );

  // تحميل بيانات دفتر الأستاذ
  const fetchLedgerData = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError("");

      const [
        accountsResponse,
        journalsResponse,
        linesResponse,
        openingResponse,
      ] = await Promise.all([
        api.get<Account[]>("/accounts", {
          params: { companyId },
        }),

        api.get<Journal[]>("/journals", {
          params: { companyId },
        }),

        api.get<JournalLine[]>("/journalLines", {
          params: { companyId },
        }),

        api.get<OpeningEntry[]>("/openingEntries", {
          params: { companyId },
        }),
      ]);

      // عزل بيانات الشركة
      const companyAccounts = accountsResponse.data.filter(
        (account) => String(account.companyId) === companyId,
      );

      const companyJournals = journalsResponse.data.filter(
        (journal) => String(journal.companyId) === companyId,
      );

      const companyLines = linesResponse.data.filter(
        (line) => String(line.companyId) === companyId,
      );

      const companyOpeningEntries = openingResponse.data.filter(
        (entry) => String(entry.companyId) === companyId,
      );

      setAccounts(companyAccounts);
      setJournals(companyJournals);
      setJournalLines(companyLines);
      setOpeningEntries(companyOpeningEntries);
    } catch (err) {
      console.error("Fetch Ledger Error:", err);

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر تحميل بيانات دفتر الأستاذ"
          : "حدث خطأ أثناء تحميل البيانات",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      void fetchLedgerData();
    }
  }, [companyId, fetchLedgerData]);

  // تسجيل فتح التقرير مرة واحدة
  useEffect(() => {
    if (
      companyId &&
      currentUser &&
      !loading &&
      !userLoading &&
      !error &&
      !activityViewLogged.current
    ) {
      activityViewLogged.current = true;

      void logLedgerActivity("view", "عرض دفتر الأستاذ العام");
    }
  }, [companyId, currentUser, loading, userLoading, error, logLedgerActivity]);

  // الحسابات التي تقبل القيود فقط
  const postingAccounts = useMemo(() => {
    return accounts
      .filter(
        (account) =>
          account.allowPosting === true &&
          account.isActive !== false &&
          account.isGroup !== true,
      )
      .sort((a, b) =>
        String(a.code).localeCompare(String(b.code), undefined, {
          numeric: true,
        }),
      );
  }, [accounts]);

  // الحساب المحدد
  const selectedAccount = useMemo(() => {
    return postingAccounts.find(
      (account) => String(account.id) === filters.accountId,
    );
  }, [postingAccounts, filters.accountId]);

  // طبيعة الحساب
  const accountNature =
    selectedAccount?.nature ||
    (selectedAccount?.type === "asset" || selectedAccount?.type === "expense"
      ? "debit"
      : "credit");

  // جميع الحركات للحساب
  const ledgerTransactions = useMemo(() => {
    if (!filters.accountId) return [];

    const transactions: LedgerTransaction[] = [];

    // إضافة الأرصدة الافتتاحية
    openingEntries
      .filter((entry) => String(entry.accountId) === filters.accountId)
      .forEach((entry) => {
        transactions.push({
          id: `opening-${entry.id}`,
          journalNumber: entry.reference || "رصيد افتتاحي",
          date: entry.date,
          description: entry.description || "الرصيد الافتتاحي",
          debit: Number(entry.debit || 0),
          credit: Number(entry.credit || 0),
          source: "opening",
          balance: 0,
        });
      });

    // ربط القيود اليومية بحركات الحساب
    const journalMap = new Map(
      journals.map((journal) => [String(journal.id), journal]),
    );

    journalLines
      .filter((line) => String(line.accountId) === filters.accountId)
      .forEach((line) => {
        const journal = journalMap.get(String(line.journalId));

        // لا نعتمد إلا القيود المرحلة
        if (!journal || journal.status !== "posted") {
          return;
        }

        transactions.push({
          id: `journal-${line.id}`,
          journalId: journal.id,
          journalNumber: journal.journalNumber,
          date: journal.date,
          description: line.description || journal.description,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          source: "journal",
          balance: 0,
        });
      });

    return transactions.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      // الأرصدة الافتتاحية تظهر قبل الحركات اليومية في التاريخ نفسه
      if (a.source !== b.source) {
        return a.source === "opening" ? -1 : 1;
      }

      return a.journalNumber.localeCompare(b.journalNumber, undefined, {
        numeric: true,
      });
    });
  }, [filters.accountId, openingEntries, journalLines, journals]);

  // تحويل المدين والدائن إلى رصيد حسب طبيعة الحساب
  const getSignedMovement = useCallback(
    (transaction: { debit: number; credit: number }) => {
      return accountNature === "debit"
        ? transaction.debit - transaction.credit
        : transaction.credit - transaction.debit;
    },
    [accountNature],
  );

  // الرصيد قبل الفترة
  const openingBalance = useMemo(() => {
    if (!filters.fromDate) return 0;

    return ledgerTransactions
      .filter((transaction) => transaction.date < filters.fromDate)
      .reduce(
        (balance, transaction) => balance + getSignedMovement(transaction),
        0,
      );
  }, [ledgerTransactions, filters.fromDate, getSignedMovement]);

  // الحركات ضمن الفترة
  const filteredTransactions = useMemo(() => {
    return ledgerTransactions.filter((transaction) => {
      const date = transaction.date;

      const fromMatch = !filters.fromDate || date >= filters.fromDate;

      const toMatch = !filters.toDate || date <= filters.toDate;

      const search = filters.search.trim().toLowerCase();

      const searchMatch =
        !search ||
        transaction.journalNumber.toLowerCase().includes(search) ||
        transaction.description.toLowerCase().includes(search);

      return fromMatch && toMatch && searchMatch;
    });
  }, [ledgerTransactions, filters]);

  // الرصيد الجاري
  const transactionsWithBalance = useMemo(() => {
    let balance = openingBalance;

    return filteredTransactions.map((transaction) => {
      balance += getSignedMovement(transaction);

      return {
        ...transaction,
        balance,
      };
    });
  }, [filteredTransactions, openingBalance, getSignedMovement]);

  // الإجماليات
  const totals = useMemo(() => {
    const debit = filteredTransactions.reduce(
      (sum, item) => sum + item.debit,
      0,
    );

    const credit = filteredTransactions.reduce(
      (sum, item) => sum + item.credit,
      0,
    );

    const closingBalance =
      transactionsWithBalance.length > 0
        ? transactionsWithBalance[transactionsWithBalance.length - 1].balance
        : openingBalance;

    return {
      debit,
      credit,
      closingBalance,
    };
  }, [filteredTransactions, transactionsWithBalance, openingBalance]);

  // وصف الرصيد مدين أو دائن
  const getBalanceNature = (balance: number) => {
    if (Math.abs(balance) < 0.001) return "متزن";

    const isDebit = accountNature === "debit" ? balance > 0 : balance < 0;

    return isDebit ? "مدين" : "دائن";
  };

  // طباعة التقرير
  const handlePrint = async () => {
    if (!selectedAccount) {
      toast.error("اختر حساباً أولاً");
      return;
    }

    await logLedgerActivity(
      "print",
      `طباعة دفتر الأستاذ للحساب ${selectedAccount.code} - ${selectedAccount.name}`,
      selectedAccount,
    );

    window.print();
  };

  // فتح القيد
  const handleViewJournal = (journalId?: number | string) => {
    if (!journalId) return;

    router.push(`/erp/accounting/journals/${journalId}`);
  };

  // تحميل المستخدم
  if (userLoading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            جارٍ تحميل بيانات المستخدم...
          </p>
        </div>
      </div>
    );
  }

  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-bold text-red-600">تعذر فتح دفتر الأستاذ</h2>

          <p className="mt-3 text-sm text-slate-600">
            {userError || "لم يتم تحديد الشركة الحالية"}
          </p>

          <button
            onClick={() => router.push("/erp/dashboard")}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            العودة إلى الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* العنوان */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            دفتر الأستاذ العام
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            متابعة أرصدة الحسابات والحركات المالية
          </p>

          <p className="mt-2 text-sm text-blue-700">
            الشركة:{" "}
            <span className="font-semibold">
              {currentUser?.companyname || "الشركة الحالية"}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void fetchLedgerData()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 shadow-sm hover:bg-slate-100"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <button
            onClick={handlePrint}
            disabled={!selectedAccount}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            <FiPrinter size={18} />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* خيارات التقرير */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
        <div className="mb-5 flex items-center gap-2">
          <FiFilter className="text-blue-600" />

          <h2 className="font-bold text-slate-800">خيارات التقرير</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              الحساب
            </label>

            <select
              value={filters.accountId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  accountId: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">اختر الحساب</option>

              {postingAccounts.map((account) => (
                <option key={account.id} value={String(account.id)}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              من تاريخ
            </label>

            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  fromDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              إلى تاريخ
            </label>

            <input
              type="date"
              value={filters.toDate}
              min={filters.fromDate || undefined}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  toDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              البحث
            </label>

            <div className="relative">
              <FiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                placeholder="رقم القيد أو البيان"
                className="w-full rounded-lg border border-slate-300 py-3 pl-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() =>
              setFilters({
                accountId: "",
                fromDate: "",
                toDate: "",
                search: "",
              })
            }
            className="text-sm font-medium text-slate-500 hover:text-red-600"
          >
            مسح الفلاتر
          </button>
        </div>
      </div>

      {/* التحميل والأخطاء */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500">
          جارٍ تحميل دفتر الأستاذ...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-white py-16 text-center">
          <div className="mb-3 flex justify-center text-red-500">
            <FiAlertCircle size={30} />
          </div>

          <p className="text-red-600">{error}</p>

          <button
            onClick={() => void fetchLedgerData()}
            className="mt-4 inline-flex items-center gap-2 text-blue-600"
          >
            <FiRefreshCw />
            إعادة المحاولة
          </button>
        </div>
      ) : !filters.accountId ? (
        <div className="rounded-xl border border-slate-200 bg-white py-20 text-center">
          <FiBookOpen size={45} className="mx-auto mb-4 text-slate-300" />

          <h3 className="font-bold text-slate-700">
            اختر حساباً لعرض دفتر الأستاذ
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            اختر أحد الحسابات التي تقبل القيود لعرض حركاته
          </p>
        </div>
      ) : (
        <>
          {/* بيانات الحساب */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">الحساب المحدد</p>

                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {selectedAccount?.code} - {selectedAccount?.name}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  طبيعة الحساب: {accountNature === "debit" ? "مدين" : "دائن"}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-5 py-3">
                <p className="text-xs text-blue-600">الرصيد الختامي</p>

                <p className="mt-1 text-xl font-bold text-blue-800">
                  {formatCurrency(Math.abs(totals.closingBalance))}
                </p>

                <p className="mt-1 text-xs text-blue-600">
                  {getBalanceNature(totals.closingBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* ملخص الأرصدة */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <FiBookOpen className="text-blue-600" size={22} />

                <p className="text-sm text-slate-500">الرصيد الافتتاحي</p>
              </div>

              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {formatCurrency(Math.abs(openingBalance))}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {getBalanceNature(openingBalance)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <FiArrowUpCircle className="text-green-600" size={22} />

                <p className="text-sm text-slate-500">إجمالي المدين</p>
              </div>

              <h3 className="mt-3 text-xl font-bold text-green-700">
                {formatCurrency(totals.debit)}
              </h3>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <FiArrowDownCircle className="text-red-600" size={22} />

                <p className="text-sm text-slate-500">إجمالي الدائن</p>
              </div>

              <h3 className="mt-3 text-xl font-bold text-red-700">
                {formatCurrency(totals.credit)}
              </h3>
            </div>
          </div>

          {/* جدول دفتر الأستاذ */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-bold text-slate-800">حركة الحساب</h2>

              <p className="mt-1 text-xs text-slate-500">
                عدد الحركات: {filteredTransactions.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">التاريخ</th>

                    <th className="px-5 py-4 font-semibold">رقم القيد</th>

                    <th className="px-5 py-4 font-semibold">البيان</th>

                    <th className="px-5 py-4 font-semibold">مدين</th>

                    <th className="px-5 py-4 font-semibold">دائن</th>

                    <th className="px-5 py-4 font-semibold">الرصيد</th>

                    <th className="px-5 py-4 text-center font-semibold">
                      المصدر
                    </th>

                    <th className="px-5 py-4 text-center font-semibold print:hidden">
                      الإجراء
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-blue-50/50">
                    <td
                      colSpan={3}
                      className="px-5 py-4 font-bold text-slate-700"
                    >
                      الرصيد قبل الفترة
                    </td>

                    <td className="px-5 py-4">-</td>

                    <td className="px-5 py-4">-</td>

                    <td className="px-5 py-4 font-bold text-blue-700">
                      {formatCurrency(Math.abs(openingBalance))}{" "}
                      {getBalanceNature(openingBalance)}
                    </td>

                    <td className="px-5 py-4 text-xs text-blue-600">افتتاحي</td>

                    <td className="print:hidden" />
                  </tr>

                  {transactionsWithBalance.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-blue-700">
                        {transaction.journalNumber}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {transaction.description}
                      </td>

                      <td className="px-5 py-4 font-medium text-green-700">
                        {transaction.debit > 0
                          ? formatCurrency(transaction.debit)
                          : "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-red-700">
                        {transaction.credit > 0
                          ? formatCurrency(transaction.credit)
                          : "-"}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-800">
                        {formatCurrency(Math.abs(transaction.balance))}{" "}
                        <span className="text-xs text-slate-400">
                          {getBalanceNature(transaction.balance)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {transaction.source === "opening" ? (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                            رصيد افتتاحي
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                            قيد يومي
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center print:hidden">
                        {transaction.journalId ? (
                          <button
                            onClick={() =>
                              handleViewJournal(transaction.journalId)
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                          >
                            عرض القيد
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-400"
                      >
                        لا توجد حركات خلال الفترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-4 font-bold text-slate-800"
                    >
                      الإجمالي
                    </td>

                    <td className="px-5 py-4 font-bold text-green-700">
                      {formatCurrency(totals.debit)}
                    </td>

                    <td className="px-5 py-4 font-bold text-red-700">
                      {formatCurrency(totals.credit)}
                    </td>

                    <td className="px-5 py-4 font-bold text-blue-700">
                      {formatCurrency(Math.abs(totals.closingBalance))}
                    </td>

                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
