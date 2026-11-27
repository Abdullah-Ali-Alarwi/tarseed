"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FiRefreshCw,
  FiPrinter,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

// =====================================================
// TYPES
// =====================================================

type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

interface CurrentUser {
  id: string;
  username: string;
  name?: string;
  fullName?: string;
  type?: string;
  companyId?: string;
  companyName?: string;
  isActive?: boolean;
  status?: string;
}

interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  nature?: "debit" | "credit";
  parentId?: string | null;
  isGroup?: boolean;
  isSystem?: boolean;
  systemKey?: string;
  isActive?: boolean;
  status?: string;
  extra?: Record<string, unknown> | null;
}

interface Journal {
  id: string;
  companyId: string;
  date: string;
  status: string;
  journalNumber?: string;
  description?: string;
}

interface JournalLine {
  id: string;
  journalId: string;
  accountId: string;
  companyId: string;
  debit: number;
  credit: number;
}

interface OpeningEntry {
  id: string;
  companyId: string;
  extra: Record<string, unknown> | null;
}

interface Balance {
  debit: number;
  credit: number;
  net: number;
}

interface ReportAccount extends Account {
  balance: Balance;
  children: ReportAccount[];
}

interface FlatAccount {
  account: ReportAccount;
  level: number;
}

// =====================================================
// HELPERS
// =====================================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const item = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!item) return null;

  return decodeURIComponent(item.substring(name.length + 1));
}

function getTodayDate() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getFirstDayOfYear(date: string) {
  return `${date.substring(0, 4)}-01-01`;
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function createEmptyBalance(): Balance {
  return {
    debit: 0,
    credit: 0,
    net: 0,
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeDate(value: unknown): string {
  if (!value) return "";

  return String(value).substring(0, 10);
}

function getUsername() {
  return getCookie("username")?.trim() || "";
}

function getAccountTypeName(type: string) {
  const names: Record<string, string> = {
    asset: "الأصول",
    liability: "الالتزامات",
    equity: "حقوق الملكية",
    revenue: "الإيرادات",
    expense: "المصروفات",
  };

  return names[type] || type;
}

function getBalanceSheetNature(
  account: Account,
  debit: number,
  credit: number,
) {
  const nature =
    account.nature || (account.type === "asset" ? "debit" : "credit");

  return nature === "debit" ? debit - credit : credit - debit;
}

function isActiveAccount(account: Account) {
  return account.isActive !== false && account.status !== "inactive";
}

function isPostedJournal(journal: Journal) {
  return journal.status === "posted";
}

// =====================================================
// SUPABASE PAGINATION
// =====================================================

async function fetchAllRows<T>(table: string, companyId: string): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  let allRows: T[] = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("companyId", companyId)
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const rows = (data || []) as T[];

    allRows = allRows.concat(rows);

    if (rows.length < pageSize) break;

    from += pageSize;
  }

  return allRows;
}

// =====================================================
// PAGE
// =====================================================

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);

  const [asOfDate, setAsOfDate] = useState(getTodayDate());

  const [search, setSearch] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const username = getUsername();

      if (!username) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      const user = (await getUserByUsername(username)) as CurrentUser | null;

      if (!user) {
        toast.error("تعذر العثور على بيانات المستخدم");
        return;
      }

      if (user.type === "platform") {
        toast.error("لا يمكن لمستخدم المنصة الدخول إلى تقارير الشركة");
        return;
      }

      if (user.isActive === false || user.status === "inactive") {
        toast.error("حساب المستخدم غير نشط");
        return;
      }

      if (!user.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      const currentCompanyId = String(user.companyId);

      setCompanyId(currentCompanyId);

      const [accountsData, journalsData, journalLinesData, openingEntriesData] =
        await Promise.all([
          fetchAllRows<Account>("accounts", currentCompanyId),
          fetchAllRows<Journal>("journals", currentCompanyId),
          fetchAllRows<JournalLine>("journalLines", currentCompanyId),
          fetchAllRows<OpeningEntry>("openingEntries", currentCompanyId),
        ]);

      const companyAccounts = accountsData.filter(
        (account) =>
          String(account.companyId) === currentCompanyId &&
          isActiveAccount(account),
      );

      const companyJournals = journalsData.filter(
        (journal) => String(journal.companyId) === currentCompanyId,
      );

      const companyJournalLines = journalLinesData.filter(
        (line) => String(line.companyId) === currentCompanyId,
      );

      const companyOpeningEntries = openingEntriesData.filter(
        (entry) => String(entry.companyId) === currentCompanyId,
      );

      setAccounts(companyAccounts);
      setJournals(companyJournals);
      setJournalLines(companyJournalLines);
      setOpeningEntries(companyOpeningEntries);

      setCompanyName(
        user.companyName || user.name || user.fullName || "الشركة",
      );

      setExpandedGroups(
        companyAccounts
          .filter((account) => account.isGroup)
          .map((account) => String(account.id)),
      );
    } catch (error) {
      console.error("Balance sheet loading error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الميزانية العمومية",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =====================================================
  // JOURNAL MAP
  // =====================================================

  const journalMap = useMemo(() => {
    const map = new Map<string, Journal>();

    journals.forEach((journal) => {
      map.set(String(journal.id), journal);
    });

    return map;
  }, [journals]);

  // =====================================================
  // CALCULATE ACCOUNT BALANCES
  // =====================================================

  const balanceMap = useMemo(() => {
    const map = new Map<string, Balance>();

    accounts.forEach((account) => {
      map.set(String(account.id), createEmptyBalance());
    });

    function addMovement(accountId: string, debit: number, credit: number) {
      const balance = map.get(String(accountId));

      if (!balance) return;

      balance.debit += toNumber(debit);
      balance.credit += toNumber(credit);
    }

    // -------------------------------------------------
    // Opening entries
    // -------------------------------------------------

    openingEntries.forEach((entry) => {
      if (String(entry.companyId) !== companyId) return;

      const extra = entry.extra;

      if (!extra || typeof extra !== "object") return;

      const accountId = String(extra.accountId || "");

      const date = normalizeDate(extra.date);

      if (!accountId || !date || date > asOfDate) return;

      addMovement(accountId, toNumber(extra.debit), toNumber(extra.credit));
    });

    // -------------------------------------------------
    // Posted journal entries
    // -------------------------------------------------

    journalLines.forEach((line) => {
      if (String(line.companyId) !== companyId) return;

      const journal = journalMap.get(String(line.journalId));

      if (!journal) return;

      if (String(journal.companyId) !== companyId) return;

      if (!isPostedJournal(journal)) return;

      const journalDate = normalizeDate(journal.date);

      if (!journalDate || journalDate > asOfDate) return;

      addMovement(
        String(line.accountId),
        toNumber(line.debit),
        toNumber(line.credit),
      );
    });

    // -------------------------------------------------
    // Net balance
    // -------------------------------------------------

    map.forEach((balance) => {
      balance.net = balance.debit - balance.credit;
    });

    return map;
  }, [accounts, openingEntries, journalLines, journalMap, companyId, asOfDate]);

  // =====================================================
  // BUILD ACCOUNT TREE
  // =====================================================

  const accountTree = useMemo(() => {
    const accountMap = new Map<string, ReportAccount>();

    accounts.forEach((account) => {
      accountMap.set(String(account.id), {
        ...account,
        balance: balanceMap.get(String(account.id)) || createEmptyBalance(),
        children: [],
      });
    });

    const roots: ReportAccount[] = [];

    accountMap.forEach((account) => {
      if (account.parentId) {
        const parent = accountMap.get(String(account.parentId));

        if (parent && parent.id !== account.id) {
          parent.children.push(account);
        } else {
          roots.push(account);
        }
      } else {
        roots.push(account);
      }
    });

    function sortAccounts(items: ReportAccount[]) {
      items.sort((a, b) =>
        String(a.code).localeCompare(String(b.code), undefined, {
          numeric: true,
        }),
      );

      items.forEach((item) => sortAccounts(item.children));
    }

    sortAccounts(roots);

    // Aggregate child balances into parent accounts.
    // Prevent cyclic parent references from causing recursion.
    function aggregate(account: ReportAccount, visited: Set<string>): Balance {
      const id = String(account.id);

      if (visited.has(id)) {
        return createEmptyBalance();
      }

      const nextVisited = new Set(visited);
      nextVisited.add(id);

      const result = { ...account.balance };

      account.children.forEach((child) => {
        const childBalance = aggregate(child, nextVisited);

        result.debit += childBalance.debit;
        result.credit += childBalance.credit;
        result.net += childBalance.net;
      });

      account.balance = result;

      return result;
    }

    roots.forEach((root) => aggregate(root, new Set()));

    return roots;
  }, [accounts, balanceMap]);

  // =====================================================
  // CURRENT YEAR PROFIT
  // =====================================================

  const currentYearProfit = useMemo(() => {
    const yearStart = getFirstDayOfYear(asOfDate);

    let revenue = 0;
    let expenses = 0;

    accounts
      .filter((account) => account.isGroup !== true)
      .forEach((account) => {
        if (account.type !== "revenue" && account.type !== "expense") {
          return;
        }

        const balance = balanceMap.get(String(account.id));

        if (!balance) return;

        // Opening entries and journals before this year
        // are not part of current-year profit.
        let debit = 0;
        let credit = 0;

        openingEntries.forEach((entry) => {
          const extra = entry.extra;

          if (!extra || typeof extra !== "object") return;

          if (String(extra.accountId) !== String(account.id)) return;

          const date = normalizeDate(extra.date);

          if (date < yearStart || date > asOfDate) return;

          debit += toNumber(extra.debit);
          credit += toNumber(extra.credit);
        });

        journalLines.forEach((line) => {
          if (String(line.accountId) !== String(account.id)) return;

          const journal = journalMap.get(String(line.journalId));

          if (!journal || !isPostedJournal(journal)) return;

          const date = normalizeDate(journal.date);

          if (date < yearStart || date > asOfDate) return;

          if (String(journal.companyId) !== companyId) return;

          debit += toNumber(line.debit);
          credit += toNumber(line.credit);
        });

        if (account.type === "revenue") {
          revenue += credit - debit;
        }

        if (account.type === "expense") {
          expenses += debit - credit;
        }
      });

    return {
      revenue,
      expenses,
      netProfit: revenue - expenses,
    };
  }, [
    accounts,
    balanceMap,
    openingEntries,
    journalLines,
    journalMap,
    companyId,
    asOfDate,
  ]);

  // =====================================================
  // CLASSIFY ACCOUNTS
  // =====================================================

  const classifiedAccounts = useMemo(() => {
    const result = {
      assets: [] as ReportAccount[],
      liabilities: [] as ReportAccount[],
      equity: [] as ReportAccount[],
    };

    accountTree.forEach((account) => {
      if (account.type === "asset") {
        result.assets.push(account);
      }

      if (account.type === "liability") {
        result.liabilities.push(account);
      }

      if (account.type === "equity") {
        result.equity.push(account);
      }
    });

    return result;
  }, [accountTree]);

  // =====================================================
  // CALCULATE SECTION TOTALS
  // =====================================================

  function calculateSectionTotal(items: ReportAccount[]): number {
    return items.reduce((total, account) => {
      return total + account.balance.net;
    }, 0);
  }

  const totalAssets = useMemo(
    () => calculateSectionTotal(classifiedAccounts.assets),
    [classifiedAccounts],
  );

  const totalLiabilities = useMemo(
    () => calculateSectionTotal(classifiedAccounts.liabilities),
    [classifiedAccounts],
  );

  const totalEquityAccounts = useMemo(
    () => calculateSectionTotal(classifiedAccounts.equity),
    [classifiedAccounts],
  );

  const totalEquity = totalEquityAccounts + currentYearProfit.netProfit;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const difference = totalAssets - totalLiabilitiesAndEquity;

  const isBalanced = Math.abs(difference) < 0.01;

  // =====================================================
  // FLATTEN TREE
  // =====================================================

  const visibleAccounts = useMemo(() => {
    const result: FlatAccount[] = [];

    const query = search.trim().toLowerCase();

    function hasSearchMatch(account: ReportAccount): boolean {
      const ownMatch =
        String(account.code).toLowerCase().includes(query) ||
        account.name.toLowerCase().includes(query);

      return (
        ownMatch || account.children.some((child) => hasSearchMatch(child))
      );
    }

    function hasBalance(account: ReportAccount): boolean {
      return Math.abs(account.balance.net) > 0.000001;
    }

    function walk(account: ReportAccount, level: number) {
      if (query && !hasSearchMatch(account)) return;

      if (!showZeroBalances && !query && !hasBalance(account)) {
        return;
      }

      result.push({ account, level });

      const expanded = expandedGroups.includes(String(account.id));

      if (account.children.length > 0 && (expanded || query)) {
        account.children.forEach((child) => {
          walk(child, level + 1);
        });
      }
    }

    accountTree.forEach((account) => walk(account, 0));

    return result;
  }, [accountTree, search, showZeroBalances, expandedGroups]);

  // =====================================================
  // ACCOUNT DISPLAY VALUE
  // =====================================================

  function getDisplayBalance(account: ReportAccount) {
    const value = account.balance.net;

    return getBalanceSheetNature(
      account,
      account.balance.debit,
      account.balance.credit,
    ) === 0
      ? 0
      : account.nature === "credit"
        ? -value
        : value;
  }

  // =====================================================
  // TOGGLE GROUP
  // =====================================================

  function toggleGroup(id: string) {
    setExpandedGroups((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  // =====================================================
  // PRINT
  // =====================================================

  function handlePrint() {
    window.print();
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <FiRefreshCw className="animate-spin text-xl" />
          جاري تحميل الميزانية العمومية...
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            الميزانية العمومية
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            عرض المركز المالي للشركة من الأصول والالتزامات وحقوق الملكية.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
          >
            <FiPrinter />
            طباعة
          </button>
        </div>
      </div>

      {/* PRINT HEADER */}

      <div className="hidden text-center print:block">
        <h1 className="text-2xl font-bold">{companyName}</h1>

        <h2 className="mt-2 text-xl font-bold">الميزانية العمومية</h2>

        <p className="mt-2 text-sm">كما في تاريخ: {asOfDate}</p>
      </div>

      {/* FILTERS */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 print:hidden">
        <h2 className="mb-4 font-bold text-gray-800">خيارات التقرير</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-gray-600">
              الميزانية كما في تاريخ
            </label>

            <div className="relative">
              <FiCalendar className="absolute right-3 top-3 text-gray-400" />

              <input
                type="date"
                value={asOfDate}
                max={getTodayDate()}
                onChange={(event) => setAsOfDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pr-9 pl-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-600">
              البحث عن حساب
            </label>

            <div className="relative">
              <FiSearch className="absolute right-3 top-3 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="رقم الحساب أو اسمه"
                className="w-full rounded-lg border border-gray-300 py-2.5 pr-9 pl-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showZeroBalances}
                onChange={(event) => setShowZeroBalances(event.target.checked)}
                className="h-4 w-4"
              />
              إظهار الحسابات ذات الرصيد الصفري
            </label>
          </div>
        </div>
      </section>

      {/* COMPANY INFORMATION */}

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">الشركة</p>

            <p className="mt-1 font-bold text-gray-800">{companyName}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">تاريخ الميزانية</p>

            <p className="mt-1 font-semibold text-gray-800">{asOfDate}</p>
          </div>
        </div>
      </section>

      {/* SUMMARY CARDS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="إجمالي الأصول"
          value={totalAssets}
          icon={<FiDollarSign />}
          color="blue"
        />

        <SummaryCard
          title="إجمالي الالتزامات"
          value={totalLiabilities}
          icon={<FiTrendingDown />}
          color="orange"
        />

        <SummaryCard
          title="إجمالي حقوق الملكية"
          value={totalEquity}
          icon={<FiPieChart />}
          color="purple"
        />

        <SummaryCard
          title="صافي ربح السنة الحالية"
          value={currentYearProfit.netProfit}
          icon={<FiTrendingUp />}
          color="green"
        />
      </section>

      {/* BALANCE STATUS */}

      <section
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          isBalanced
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        {isBalanced ? (
          <FiCheckCircle className="text-2xl text-green-600" />
        ) : (
          <FiAlertCircle className="text-2xl text-red-600" />
        )}

        <div>
          <p
            className={`font-bold ${
              isBalanced ? "text-green-800" : "text-red-800"
            }`}
          >
            {isBalanced
              ? "الميزانية العمومية متوازنة"
              : "الميزانية العمومية غير متوازنة"}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            الفرق بين الأصول والالتزامات وحقوق الملكية:{" "}
            <strong>{formatMoney(difference)}</strong>
          </p>
        </div>
      </section>

      {/* BALANCE SHEET SECTIONS */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ASSETS */}

        <BalanceSection
          title="الأصول"
          subtitle="الموارد الاقتصادية التي تمتلكها الشركة"
          icon={<FiDollarSign />}
          color="blue"
          accounts={classifiedAccounts.assets}
          total={totalAssets}
          search={search}
          showZeroBalances={showZeroBalances}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
        />

        {/* LIABILITIES */}

        <BalanceSection
          title="الالتزامات"
          subtitle="المبالغ والحقوق المستحقة على الشركة"
          icon={<FiTrendingDown />}
          color="orange"
          accounts={classifiedAccounts.liabilities}
          total={totalLiabilities}
          search={search}
          showZeroBalances={showZeroBalances}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
        />

        {/* EQUITY */}

        <div className="xl:col-span-2">
          <BalanceSection
            title="حقوق الملكية"
            subtitle="حقوق أصحاب الشركة والأرباح المحتجزة"
            icon={<FiPieChart />}
            color="purple"
            accounts={classifiedAccounts.equity}
            total={totalEquityAccounts}
            search={search}
            showZeroBalances={showZeroBalances}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
          />

          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-gray-800">
                  صافي ربح السنة الحالية
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  من {getFirstDayOfYear(asOfDate)} إلى {asOfDate}
                </p>
              </div>

              <span
                className={`font-bold ${
                  currentYearProfit.netProfit >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {formatMoney(currentYearProfit.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL TOTALS */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="font-bold text-gray-800">ملخص المركز المالي</h2>
        </div>

        <div className="divide-y divide-gray-100">
          <TotalRow title="إجمالي الأصول" value={totalAssets} />

          <TotalRow title="إجمالي الالتزامات" value={totalLiabilities} />

          <TotalRow
            title="حقوق الملكية قبل صافي ربح السنة"
            value={totalEquityAccounts}
          />

          <TotalRow
            title="صافي ربح السنة الحالية"
            value={currentYearProfit.netProfit}
          />

          <TotalRow
            title="إجمالي الالتزامات وحقوق الملكية"
            value={totalLiabilitiesAndEquity}
            strong
          />

          <TotalRow title="الفرق" value={difference} strong />
        </div>
      </section>

      {/* ACCOUNT DETAILS */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h2 className="font-bold text-gray-800">تفاصيل الحسابات</h2>

            <p className="mt-1 text-xs text-gray-500">
              عدد الحسابات: {accounts.length}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-200 px-3 py-3 text-right">
                  رقم الحساب
                </th>

                <th className="border border-gray-200 px-3 py-3 text-right">
                  اسم الحساب
                </th>

                <th className="border border-gray-200 px-3 py-3 text-center">
                  نوع الحساب
                </th>

                <th className="border border-gray-200 px-3 py-3 text-center">
                  مدين
                </th>

                <th className="border border-gray-200 px-3 py-3 text-center">
                  دائن
                </th>

                <th className="border border-gray-200 px-3 py-3 text-center">
                  الرصيد
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    لا توجد حسابات لعرضها.
                  </td>
                </tr>
              ) : (
                visibleAccounts.map(({ account, level }) => {
                  const isGroup = account.children.length > 0;

                  const expanded = expandedGroups.includes(String(account.id));

                  const balance = account.balance;

                  const displayBalance = getDisplayBalance(account);

                  return (
                    <tr
                      key={account.id}
                      className={`transition hover:bg-blue-50 ${
                        isGroup ? "bg-gray-50 font-semibold" : "bg-white"
                      }`}
                    >
                      <td className="border-b border-gray-100 px-3 py-3 font-mono text-gray-700">
                        {account.code}
                      </td>

                      <td
                        className="border-b border-gray-100 px-3 py-3"
                        style={{
                          paddingRight: `${16 + level * 22}px`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {isGroup && (
                            <button
                              type="button"
                              onClick={() => toggleGroup(String(account.id))}
                              className="rounded p-1 text-gray-500 hover:bg-gray-200"
                            >
                              {expanded ? <FiChevronDown /> : <FiChevronLeft />}
                            </button>
                          )}

                          <span
                            className={
                              isGroup
                                ? "font-bold text-gray-800"
                                : "text-gray-700"
                            }
                          >
                            {account.name}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-3 py-3 text-center text-gray-500">
                        {getAccountTypeName(account.type)}
                      </td>

                      <MoneyCell value={balance.debit} />

                      <MoneyCell value={balance.credit} />

                      <MoneyCell value={displayBalance} />
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* NOTE */}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
        <strong>ملاحظة محاسبية:</strong>

        <p className="mt-1">
          تعتمد الميزانية على الأرصدة الافتتاحية والقيود اليومية المرحلة حتى
          التاريخ المحدد. ويُضاف صافي ربح السنة الحالية إلى حقوق الملكية. يجب
          التأكد من إقفال أرباح السنوات السابقة في حسابات حقوق الملكية قبل
          الاعتماد على التقرير.
        </p>
      </div>
    </main>
  );
}

// =====================================================
// BALANCE SECTION
// =====================================================

interface BalanceSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "blue" | "orange" | "purple";
  accounts: ReportAccount[];
  total: number;
  search: string;
  showZeroBalances: boolean;
  expandedGroups: string[];
  onToggleGroup: (id: string) => void;
}

function BalanceSection({
  title,
  subtitle,
  icon,
  color,
  accounts,
  total,
  search,
  showZeroBalances,
  expandedGroups,
  onToggleGroup,
}: BalanceSectionProps) {
  const colors = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
      header: "text-blue-800",
      total: "bg-blue-50 text-blue-800",
    },
    orange: {
      icon: "bg-orange-100 text-orange-700",
      header: "text-orange-800",
      total: "bg-orange-50 text-orange-800",
    },
    purple: {
      icon: "bg-purple-100 text-purple-700",
      header: "text-purple-800",
      total: "bg-purple-50 text-purple-800",
    },
  };

  const style = colors[color];

  const visibleAccounts = useMemo(() => {
    const result: FlatAccount[] = [];

    const query = search.trim().toLowerCase();

    function hasMatch(account: ReportAccount): boolean {
      return (
        account.name.toLowerCase().includes(query) ||
        String(account.code).toLowerCase().includes(query) ||
        account.children.some(hasMatch)
      );
    }

    function walk(account: ReportAccount, level: number) {
      if (query && !hasMatch(account)) return;

      if (
        !showZeroBalances &&
        !query &&
        Math.abs(account.balance.net) < 0.000001
      ) {
        return;
      }

      result.push({ account, level });

      const expanded = expandedGroups.includes(String(account.id));

      if (account.children.length > 0 && (expanded || query)) {
        account.children.forEach((child) => {
          walk(child, level + 1);
        });
      }
    }

    accounts.forEach((account) => walk(account, 0));

    return result;
  }, [accounts, search, showZeroBalances, expandedGroups]);

  function displayBalance(account: ReportAccount) {
    return account.nature === "credit"
      ? account.balance.credit - account.balance.debit
      : account.balance.debit - account.balance.credit;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-3 ${style.icon}`}>{icon}</div>

          <div>
            <h2 className={`font-bold ${style.header}`}>{title}</h2>

            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-3 py-3 text-right">الحساب</th>

              <th className="px-3 py-3 text-center">الرصيد</th>
            </tr>
          </thead>

          <tbody>
            {visibleAccounts.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-8 text-center text-gray-400">
                  لا توجد حسابات لعرضها
                </td>
              </tr>
            ) : (
              visibleAccounts.map(({ account, level }) => {
                const isGroup = account.children.length > 0;

                const expanded = expandedGroups.includes(String(account.id));

                return (
                  <tr
                    key={account.id}
                    className={`border-t border-gray-100 hover:bg-gray-50 ${
                      isGroup ? "bg-gray-50 font-semibold" : ""
                    }`}
                  >
                    <td
                      className="px-3 py-3"
                      style={{
                        paddingRight: `${12 + level * 18}px`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isGroup && (
                          <button
                            type="button"
                            onClick={() => onToggleGroup(String(account.id))}
                            className="rounded p-1 text-gray-500 hover:bg-gray-200"
                          >
                            {expanded ? <FiChevronDown /> : <FiChevronLeft />}
                          </button>
                        )}

                        <span className="text-gray-800">{account.name}</span>
                      </div>

                      <p className="mt-1 font-mono text-xs text-gray-400">
                        {account.code}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-center font-medium text-gray-700">
                      {formatMoney(displayBalance(account))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          <tfoot>
            <tr className={style.total}>
              <td className="px-3 py-4 font-bold">الإجمالي</td>

              <td className="px-3 py-4 text-center font-bold">
                {formatMoney(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "orange" | "purple" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{title}</p>

        <div className={`rounded-lg p-3 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xl font-bold text-gray-800">
        {formatMoney(value)}
      </p>
    </div>
  );
}

// =====================================================
// MONEY CELL
// =====================================================

function MoneyCell({ value }: { value: number }) {
  return (
    <td className="border-b border-gray-100 px-3 py-3 text-center font-mono text-gray-700">
      {formatMoney(value)}
    </td>
  );
}

// =====================================================
// TOTAL ROW
// =====================================================

function TotalRow({
  title,
  value,
  strong = false,
}: {
  title: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-4 ${
        strong ? "bg-gray-50 font-bold" : ""
      }`}
    >
      <span className="text-gray-700">{title}</span>

      <span
        className={`font-mono ${value < 0 ? "text-red-600" : "text-gray-800"}`}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}
