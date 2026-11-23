"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

import {
  FiRefreshCw,
  FiPrinter,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiBriefcase,
} from "react-icons/fi";

/* =========================================================
   TYPES
========================================================= */

type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

type Account = {
  id: string | number;
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  nature?: "debit" | "credit";
  parentId?: string | number | null;
  level?: number;
  isGroup?: boolean;
  allowPosting?: boolean;
  isActive?: boolean;
};

type OpeningEntry = {
  id: string | number;
  accountId: string | number;
  date: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
  companyId: string;
};

type Journal = {
  id: string | number;
  journalNumber?: string;
  date: string;
  description?: string;
  reference?: string;
  status?: string;
  companyId: string;
};

type JournalLine = {
  id: string | number;
  journalId: string | number;
  accountId: string | number;
  debit: number;
  credit: number;
  companyId: string;
};

type DirectBalance = {
  debit: number;
  credit: number;
};

type AccountBalance = {
  account: Account;
  debit: number;
  credit: number;
  balance: number;
  children: AccountBalance[];
};

type FinancialTotals = {
  assets: number;
  liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
  netProfit: number;
  totalLiabilitiesEquity: number;
  difference: number;
};

/* =========================================================
   CONSTANTS
========================================================= */

const API_URL = "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value: string | number | null | undefined) =>
  String(value ?? "");

const normalizeDate = (value?: string) => {
  if (!value) return "";

  return String(value).substring(0, 10);
};

const toNumber = (value: unknown) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
};

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   ACCOUNT HELPERS
========================================================= */

const isGroupAccount = (account: Account) => {
  return account.isGroup === true;
};

const isDebitNature = (type: AccountType) => {
  return type === "asset" || type === "expense";
};

const getAccountDisplayBalance = (
  debit: number,
  credit: number,
  type: AccountType,
) => {
  const balance = debit - credit;

  return isDebitNature(type) ? balance : -balance;
};

/* =========================================================
   JOURNAL STATUS
========================================================= */

const isPostedJournal = (status?: string) => {
  if (!status) return false;

  const normalizedStatus = status.trim().toLowerCase();

  const postedStatuses = [
    "posted",
    "approved",
    "مُرحّل",
    "مرحل",
    "مُعتمد",
    "معتمد",
    "مرحّل",
  ];

  return postedStatuses.includes(normalizedStatus);
};

/* =========================================================
   COMPONENT
========================================================= */

export default function BalanceSheetPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);

  const [journals, setJournals] = useState<Journal[]>([]);

  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);

  const [companyId, setCompanyId] = useState("");

  const [asOfDate, setAsOfDate] = useState(getToday());

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const username = document.cookie
        .split("; ")
        .find((item) => item.startsWith("username="))
        ?.split("=")[1];

      if (!username) {
        throw new Error("لم يتم العثور على المستخدم المسجل.");
      }

      const decodedUsername = decodeURIComponent(username);

      const usersResponse = await api.get("/users", {
        params: {
          username: decodedUsername,
        },
      });

      const user = usersResponse.data?.[0];

      if (!user) {
        throw new Error("لم يتم العثور على بيانات المستخدم.");
      }

      if (user.type === "platform") {
        throw new Error("لا يمكن لمستخدم المنصة الوصول إلى ميزانية الشركة.");
      }

      if (!user.companyId) {
        throw new Error("لم يتم العثور على الشركة المرتبطة بالمستخدم.");
      }

      const currentCompanyId = String(user.companyId);

      setCompanyId(currentCompanyId);

      const [
        accountsResponse,
        openingResponse,
        journalsResponse,
        linesResponse,
      ] = await Promise.all([
        api.get("/accounts"),
        api.get("/openingEntries"),
        api.get("/journals"),
        api.get("/journalLines"),
      ]);

      /* -----------------------------------------
         COMPANY FILTER
      ----------------------------------------- */

      const companyAccounts: Account[] = accountsResponse.data.filter(
        (item: Account) => String(item.companyId) === currentCompanyId,
      );

      const companyOpeningEntries: OpeningEntry[] = openingResponse.data.filter(
        (item: OpeningEntry) => String(item.companyId) === currentCompanyId,
      );

      const companyJournals: Journal[] = journalsResponse.data.filter(
        (item: Journal) => String(item.companyId) === currentCompanyId,
      );

      const companyJournalLines: JournalLine[] = linesResponse.data.filter(
        (item: JournalLine) => String(item.companyId) === currentCompanyId,
      );

      setAccounts(companyAccounts);

      setOpeningEntries(companyOpeningEntries);

      setJournals(companyJournals);

      setJournalLines(companyJournalLines);

      /* -----------------------------------------
         DEFAULT EXPANDED ACCOUNTS
      ----------------------------------------- */

      setExpandedAccounts(
        new Set(
          companyAccounts
            .filter((account) => isGroupAccount(account))
            .map((account) => normalizeId(account.id)),
        ),
      );
    } catch (err: unknown) {
      console.error("Balance Sheet Error:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "حدث خطأ أثناء تحميل بيانات الميزانية.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل بيانات الميزانية.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================================================
     CALCULATE ACCOUNT BALANCES
  ========================================================= */

  const calculatedData = useMemo(() => {
    const emptyResult = {
      tree: [] as AccountBalance[],

      assets: 0,
      liabilities: 0,
      equity: 0,
      revenue: 0,
      expenses: 0,
      netProfit: 0,

      totalLiabilitiesEquity: 0,

      difference: 0,

      totalDebit: 0,
      totalCredit: 0,
    };

    if (!asOfDate) {
      return emptyResult;
    }

    /* =========================================
       1. ACCOUNT MAP
    ========================================= */

    const accountMap = new Map<string, Account>();

    accounts.forEach((account) => {
      accountMap.set(normalizeId(account.id), account);
    });

    /* =========================================
       2. DIRECT BALANCES
    ========================================= */

    const directBalances = new Map<string, DirectBalance>();

    accounts.forEach((account) => {
      directBalances.set(normalizeId(account.id), {
        debit: 0,
        credit: 0,
      });
    });

    const addAmount = (
      accountId: string | number,
      debit: number,
      credit: number,
    ) => {
      const key = normalizeId(accountId);

      if (!accountMap.has(key)) return;

      const current = directBalances.get(key) || {
        debit: 0,
        credit: 0,
      };

      directBalances.set(key, {
        debit: current.debit + toNumber(debit),
        credit: current.credit + toNumber(credit),
      });
    };

    /* =========================================
       3. OPENING ENTRIES
    ========================================= */

    openingEntries.forEach((entry) => {
      const entryDate = normalizeDate(entry.date);

      if (!entryDate || entryDate > asOfDate) {
        return;
      }

      addAmount(entry.accountId, entry.debit, entry.credit);
    });

    /* =========================================
       4. POSTED JOURNALS
    ========================================= */

    const validJournals = new Set<string>();

    journals.forEach((journal) => {
      const journalDate = normalizeDate(journal.date);

      if (!journalDate || journalDate > asOfDate) {
        return;
      }

      if (!isPostedJournal(journal.status)) {
        return;
      }

      validJournals.add(normalizeId(journal.id));
    });

    /* =========================================
       5. JOURNAL LINES
    ========================================= */

    journalLines.forEach((line) => {
      const journalId = normalizeId(line.journalId);

      if (!validJournals.has(journalId)) {
        return;
      }

      addAmount(line.accountId, line.debit, line.credit);
    });

    /* =========================================
       6. ACCOUNT CHILDREN
    ========================================= */

    const childrenMap = new Map<string, Account[]>();

    accounts.forEach((account) => {
      const parentId = normalizeId(account.parentId);

      if (!parentId || !accountMap.has(parentId)) {
        return;
      }

      const children = childrenMap.get(parentId) || [];

      children.push(account);

      childrenMap.set(parentId, children);
    });

    /* =========================================
       7. BUILD ACCOUNT TREE
    ========================================= */

    const buildTree = (
      account: Account,
      visited: Set<string> = new Set(),
    ): AccountBalance => {
      const id = normalizeId(account.id);

      if (visited.has(id)) {
        return {
          account,
          debit: 0,
          credit: 0,
          balance: 0,
          children: [],
        };
      }

      const nextVisited = new Set(visited);

      nextVisited.add(id);

      const direct = directBalances.get(id) || {
        debit: 0,
        credit: 0,
      };

      const children = (childrenMap.get(id) || [])
        .sort((a, b) =>
          a.code.localeCompare(b.code, "en", {
            numeric: true,
          }),
        )
        .map((child) => buildTree(child, nextVisited));

      const childrenDebit = children.reduce(
        (sum, child) => sum + child.debit,
        0,
      );

      const childrenCredit = children.reduce(
        (sum, child) => sum + child.credit,
        0,
      );

      const totalDebit = direct.debit + childrenDebit;

      const totalCredit = direct.credit + childrenCredit;

      return {
        account,

        debit: totalDebit,

        credit: totalCredit,

        balance: totalDebit - totalCredit,

        children,
      };
    };

    /* =========================================
       8. ROOT ACCOUNTS
    ========================================= */

    const rootAccounts = accounts
      .filter((account) => {
        const parentId = normalizeId(account.parentId);

        return !parentId || !accountMap.has(parentId);
      })
      .sort((a, b) =>
        a.code.localeCompare(b.code, "en", {
          numeric: true,
        }),
      );

    const tree = rootAccounts.map((account) => buildTree(account));

    /* =========================================
       9. CALCULATE ACCOUNT TYPE TOTALS

       IMPORTANT:
       We sum direct balances of each account
       exactly once to avoid double counting
       parent and child accounts.
    ========================================= */

    const getAccountTypeTotal = (type: AccountType) => {
      return accounts.reduce((total, account) => {
        if (account.type !== type) {
          return total;
        }

        const direct = directBalances.get(normalizeId(account.id));

        if (!direct) return total;

        return (
          total + getAccountDisplayBalance(direct.debit, direct.credit, type)
        );
      }, 0);
    };

    /* =========================================
       10. FINANCIAL TOTALS
    ========================================= */

    const assets = getAccountTypeTotal("asset");

    const liabilities = getAccountTypeTotal("liability");

    const equity = getAccountTypeTotal("equity");

    const revenue = getAccountTypeTotal("revenue");

    const expenses = getAccountTypeTotal("expense");

    const netProfit = revenue - expenses;

    const totalLiabilitiesEquity = liabilities + equity + netProfit;

    const difference = assets - totalLiabilitiesEquity;

    /* =========================================
       11. TRIAL BALANCE TOTALS
    ========================================= */

    let totalDebit = 0;
    let totalCredit = 0;

    directBalances.forEach((balance) => {
      totalDebit += balance.debit;
      totalCredit += balance.credit;
    });

    return {
      tree,

      assets,

      liabilities,

      equity,

      revenue,

      expenses,

      netProfit,

      totalLiabilitiesEquity,

      difference,

      totalDebit,

      totalCredit,
    };
  }, [accounts, openingEntries, journals, journalLines, asOfDate]);

  /* =========================================================
     EXPAND / COLLAPSE
  ========================================================= */

  const toggleAccount = (id: string) => {
    setExpandedAccounts((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  /* =========================================================
     RENDER ACCOUNT
  ========================================================= */

  const renderAccount = (
    item: AccountBalance,
    depth = 0,
    sectionType: AccountType,
  ): ReactNode => {
    const accountId = normalizeId(item.account.id);

    const isExpanded = expandedAccounts.has(accountId);

    const hasChildren = item.children.length > 0;

    const balance = getAccountDisplayBalance(
      item.debit,
      item.credit,
      sectionType,
    );

    // إخفاء الحسابات الصفرية غير المجموعة
    if (!isGroupAccount(item.account) && Math.abs(balance) < 0.000001) {
      return null;
    }

    return (
      <div key={accountId}>
        <div
          className={`grid grid-cols-12 items-center border-b border-slate-100 px-3 py-3 text-sm transition hover:bg-slate-50 ${
            isGroupAccount(item.account)
              ? "bg-slate-50/70 font-semibold"
              : "bg-white"
          }`}
        >
          <div
            className="col-span-7 flex min-w-0 items-center gap-2"
            style={{
              paddingRight: `${depth * 20}px`,
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleAccount(accountId)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200"
              >
                {isExpanded ? (
                  <FiChevronDown size={15} />
                ) : (
                  <FiChevronLeft size={15} />
                )}
              </button>
            ) : (
              <span className="h-6 w-6 shrink-0" />
            )}

            <span className="shrink-0 text-xs text-slate-400">
              {item.account.code}
            </span>

            <span className="truncate text-slate-800">{item.account.name}</span>
          </div>

          <div className="col-span-5 text-left font-medium text-slate-700">
            {formatMoney(balance)}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children.map((child) =>
              renderAccount(child, depth + 1, sectionType),
            )}
          </div>
        )}
      </div>
    );
  };

  /* =========================================================
     RENDER SECTION
  ========================================================= */

  const renderSection = (
    title: string,
    type: AccountType,
    icon: ReactNode,
    total: number,
    description: string,
  ) => {
    const sectionAccounts = calculatedData.tree.filter(
      (item) => item.account.type === type,
    );

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
              {icon}
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-slate-800">{title}</h3>

              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>

          <div className="shrink-0 text-left">
            <p className="text-xs text-slate-500">الإجمالي</p>

            <p className="text-lg font-bold text-slate-900">
              {formatMoney(total)}
            </p>
          </div>
        </div>

        {/* TABLE HEADER */}

        <div className="grid grid-cols-12 border-b border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
          <div className="col-span-7">الحساب</div>

          <div className="col-span-5 text-left">الرصيد</div>
        </div>

        {/* ACCOUNTS */}

        {sectionAccounts.length > 0 ? (
          sectionAccounts.map((item) => renderAccount(item, 0, type))
        ) : (
          <div className="py-8 text-center text-sm text-slate-400">
            لا توجد حسابات ضمن هذا القسم.
          </div>
        )}

        {/* FOOTER */}

        <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
          <span className="font-bold text-slate-700">إجمالي {title}</span>

          <span className="font-bold text-slate-900">{formatMoney(total)}</span>
        </div>
      </div>
    );
  };

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="mx-auto mb-3 animate-spin text-3xl text-slate-500" />

          <p className="text-sm text-slate-500">
            جاري تحميل الميزانية العمومية...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div
        dir="rtl"
        className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6"
      >
        <div className="flex items-center gap-3 text-red-700">
          <FiAlertCircle size={24} />

          <h2 className="font-bold">تعذر تحميل الميزانية العمومية</h2>
        </div>

        <p className="mt-3 text-sm text-red-600">{error}</p>

        <button
          onClick={loadData}
          className="mt-5 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <FiRefreshCw size={15} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  /* =========================================================
     BALANCE STATUS
  ========================================================= */

  const isBalanced = Math.abs(calculatedData.difference) < 0.01;

  const isTrialBalanceBalanced =
    Math.abs(calculatedData.totalDebit - calculatedData.totalCredit) < 0.01;

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div dir="rtl" className="space-y-5 pb-10">
      {/* =====================================
          HEADER
      ===================================== */}

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FiBriefcase size={21} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800">
              الميزانية العمومية
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              عرض المركز المالي للشركة من الحسابات والقيود المحاسبية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <FiRefreshCw size={15} />
            تحديث
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <FiPrinter size={15} />
            طباعة
          </button>
        </div>
      </div>

      {/* =====================================
          FILTER
      ===================================== */}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-800">تاريخ الميزانية</h2>

          <p className="mt-1 text-xs text-slate-500">
            يتم احتساب جميع الأرصدة حتى التاريخ المحدد
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-500" />

          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {/* =====================================
          SUMMARY CARDS
      ===================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* ASSETS */}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">إجمالي الأصول</span>

            <FiBriefcase className="text-blue-600" size={20} />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-800">
            {formatMoney(calculatedData.assets)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            مجموع الأصول المتداولة والثابتة
          </p>
        </div>

        {/* LIABILITIES */}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">إجمالي الالتزامات</span>

            <FiTrendingDown className="text-orange-600" size={20} />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-800">
            {formatMoney(calculatedData.liabilities)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            الالتزامات قصيرة وطويلة الأجل
          </p>
        </div>

        {/* EQUITY */}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">حقوق الملكية</span>

            <FiDollarSign className="text-purple-600" size={20} />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-800">
            {formatMoney(calculatedData.equity)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            قبل إضافة نتيجة الفترة الحالية
          </p>
        </div>

        {/* NET PROFIT */}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">صافي الربح / الخسارة</span>

            <FiTrendingUp
              className={
                calculatedData.netProfit >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
              size={20}
            />
          </div>

          <p
            className={`mt-3 text-xl font-bold ${
              calculatedData.netProfit >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatMoney(calculatedData.netProfit)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            الإيرادات ناقص المصروفات
          </p>
        </div>
      </div>

      {/* =====================================
          BALANCE STATUS
      ===================================== */}

      <div
        className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          isBalanced
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <FiCheckCircle size={23} className="shrink-0 text-green-600" />
          ) : (
            <FiXCircle size={23} className="shrink-0 text-red-600" />
          )}

          <div>
            <p
              className={`font-bold ${
                isBalanced ? "text-green-800" : "text-red-800"
              }`}
            >
              {isBalanced ? "الميزانية متوازنة" : "الميزانية غير متوازنة"}
            </p>

            <p
              className={`mt-1 text-xs ${
                isBalanced ? "text-green-700" : "text-red-700"
              }`}
            >
              {isBalanced
                ? "إجمالي الأصول يساوي إجمالي الالتزامات وحقوق الملكية."
                : "يوجد فرق بين الأصول والالتزامات وحقوق الملكية. راجع الأرصدة والقيود المحاسبية."}
            </p>
          </div>
        </div>

        <div className="text-left">
          <p className="text-xs text-slate-500">فرق الميزانية</p>

          <p
            className={`text-lg font-bold ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatMoney(calculatedData.difference)}
          </p>
        </div>
      </div>

      {/* =====================================
          FINANCIAL SECTIONS
      ===================================== */}

      <div className="space-y-4">
        {/* ASSETS */}

        {renderSection(
          "الأصول",
          "asset",
          <FiBriefcase size={18} />,
          calculatedData.assets,
          "الموارد والممتلكات التي تمتلكها الشركة",
        )}

        {/* LIABILITIES */}

        {renderSection(
          "الالتزامات",
          "liability",
          <FiTrendingDown size={18} />,
          calculatedData.liabilities,
          "المبالغ والديون المستحقة على الشركة",
        )}

        {/* EQUITY */}

        {renderSection(
          "حقوق الملكية",
          "equity",
          <FiDollarSign size={18} />,
          calculatedData.equity,
          "رأس المال والأرباح المحتجزة والحسابات المتعلقة بحقوق الملكية",
        )}

        {/* NET PROFIT */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-4">
            <div>
              <h3 className="font-bold text-slate-800">
                نتيجة النشاط حتى التاريخ المحدد
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                صافي الإيرادات بعد خصم المصروفات
              </p>
            </div>

            <div className="text-left">
              <p className="text-xs text-slate-500">صافي النتيجة</p>

              <p
                className={`text-lg font-bold ${
                  calculatedData.netProfit >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {formatMoney(calculatedData.netProfit)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <p className="text-xs text-green-700">إجمالي الإيرادات</p>

              <p className="mt-2 font-bold text-green-800">
                {formatMoney(calculatedData.revenue)}
              </p>
            </div>

            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-xs text-red-700">إجمالي المصروفات</p>

              <p className="mt-2 font-bold text-red-800">
                {formatMoney(calculatedData.expenses)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================
          TOTAL BALANCE
      ===================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-white shadow-sm">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-300">إجمالي الأصول</p>

            <p className="mt-2 text-2xl font-bold">
              {formatMoney(calculatedData.assets)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-300">
              إجمالي الالتزامات وحقوق الملكية وصافي الربح
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatMoney(calculatedData.totalLiabilitiesEquity)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-700 bg-slate-800 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-300">
            تاريخ الميزانية: {asOfDate}
          </span>

          <span className="text-sm font-bold">
            {isBalanced
              ? "الميزانية متوازنة ✓"
              : `الفرق: ${formatMoney(calculatedData.difference)}`}
          </span>
        </div>
      </div>

      {/* =====================================
          TRIAL BALANCE CHECK
      ===================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
          <h3 className="font-bold text-slate-800">
            التحقق من توازن الأرصدة المحاسبية
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            مقارنة إجمالي الحركات المدينة والدائنة
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">إجمالي المدين</p>

            <p className="mt-2 text-xl font-bold text-blue-900">
              {formatMoney(calculatedData.totalDebit)}
            </p>
          </div>

          <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
            <p className="text-sm text-purple-700">إجمالي الدائن</p>

            <p className="mt-2 text-xl font-bold text-purple-900">
              {formatMoney(calculatedData.totalCredit)}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 border-t px-4 py-3 ${
            isTrialBalanceBalanced
              ? "border-green-100 bg-green-50"
              : "border-red-100 bg-red-50"
          }`}
        >
          {isTrialBalanceBalanced ? (
            <FiCheckCircle className="text-green-600" />
          ) : (
            <FiAlertCircle className="text-red-600" />
          )}

          <span
            className={`text-sm font-semibold ${
              isTrialBalanceBalanced ? "text-green-800" : "text-red-800"
            }`}
          >
            {isTrialBalanceBalanced
              ? "إجمالي المدين يساوي إجمالي الدائن."
              : "يوجد اختلاف بين إجمالي المدين والدائن."}
          </span>
        </div>
      </div>

      {/* =====================================
          NOTES
      ===================================== */}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 shrink-0 text-blue-600" size={19} />

          <div className="text-sm leading-7 text-blue-900">
            <p className="font-bold">ملاحظات حول احتساب الميزانية</p>

            <ul className="mt-2 list-inside list-disc text-blue-800">
              <li>يتم احتساب الأرصدة الافتتاحية حتى التاريخ المحدد.</li>

              <li>يتم احتساب القيود اليومية المرحلة والمعتمدة فقط.</li>

              <li>يتم استبعاد القيود المسودة والملغاة.</li>

              <li>يتم تجميع الأرصدة الفرعية داخل الحسابات الرئيسية.</li>

              <li>يتم احتساب صافي الربح من الإيرادات والمصروفات.</li>

              <li>
                تتم إضافة نتيجة النشاط إلى الالتزامات وحقوق الملكية عند احتساب
                معادلة الميزانية.
              </li>

              <li>
                لا يتم احتساب حركات المخزون مباشرة؛ يجب أن تنعكس محاسبياً من
                خلال القيود المحاسبية.
              </li>

              <li>
                إجمالي المدين والدائن يشمل الأرصدة الافتتاحية والحركات المرحلة
                حتى التاريخ المحدد.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* =====================================
          PRINT STYLES
      ===================================== */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          button,
          input,
          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
          }

          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
