"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import {
  FiRefreshCw,
  FiPrinter,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiBriefcase,
  FiCalendar,
  FiFileText,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// Types
// ==========================================

type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense"
  | string;

interface CurrentUser {
  id: string | number;
  name?: string;
  fullName?: string;
  username: string;
  type?: string;
  companyId?: string | number;
}

interface Company {
  id: string | number;
  name?: string;
  companyName?: string;
}

interface Account {
  id: string | number;
  companyId: string | number;
  code: string;
  name: string;
  nameEn?: string;

  type: AccountType;
  nature?: "debit" | "credit" | string;

  parentId?: string | number | null;

  isGroup?: boolean;
  allowPosting?: boolean;
  isActive?: boolean;
}

interface OpeningEntry {
  id: string | number;
  companyId: string | number;
  accountId: string | number;

  date?: string;

  debit?: number;
  credit?: number;

  status?: string;
  isPosted?: boolean;
}

interface Journal {
  id: string | number;
  companyId?: string | number;

  date?: string;
  status?: string;
  isPosted?: boolean;
}

interface JournalLine {
  id: string | number;

  companyId?: string | number;
  journalId?: string | number;

  accountId: string | number;

  date?: string;

  debit?: number;
  credit?: number;
}

interface AccountBalance {
  debit: number;
  credit: number;
  net: number;
}

interface ReportAccount extends Account {
  balance: AccountBalance;
  children: ReportAccount[];
}

interface FinancialSection {
  accounts: ReportAccount[];
  total: number;
}

// ==========================================
// Helpers
// ==========================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function getTodayDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function normalizeType(type: unknown): string {
  const value = String(type || "")
    .trim()
    .toLowerCase();

  const types: Record<string, string> = {
    asset: "asset",
    assets: "asset",
    أصل: "asset",
    أصول: "asset",

    liability: "liability",
    liabilities: "liability",
    التزام: "liability",
    الالتزامات: "liability",

    equity: "equity",
    "حقوق الملكية": "equity",
    "حقوق الملكيه": "equity",

    revenue: "revenue",
    income: "revenue",
    إيراد: "revenue",
    الإيرادات: "revenue",

    expense: "expense",
    expenses: "expense",
    مصروف: "expense",
    المصروفات: "expense",
  };

  return types[value] || value;
}

function getAccountTypeName(type: string) {
  const names: Record<string, string> = {
    asset: "الأصول",
    liability: "الالتزامات",
    equity: "حقوق الملكية",
    revenue: "الإيرادات",
    expense: "المصروفات",
  };

  return names[normalizeType(type)] || type;
}

function createEmptyBalance(): AccountBalance {
  return {
    debit: 0,
    credit: 0,
    net: 0,
  };
}

function isPostedStatus(status?: string) {
  if (!status) return true;

  return ["posted", "approved", "مُرحّل", "مرحل", "معتمد"].includes(status);
}

function isValidDate(date?: string, asOfDate?: string) {
  if (!date || !asOfDate) return false;

  return date.substring(0, 10) <= asOfDate;
}

// ==========================================
// Account balance helper
// ==========================================

function calculateAccountNet(account: Account, debit: number, credit: number) {
  const type = normalizeType(account.type);

  // الأصول والمصروفات طبيعتها مدينة
  if (type === "asset" || type === "expense") {
    return debit - credit;
  }

  // الالتزامات وحقوق الملكية والإيرادات طبيعتها دائنة
  return credit - debit;
}

// ==========================================
// Page
// ==========================================

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);

  const [asOfDate, setAsOfDate] = useState(getTodayDate());

  const [search, setSearch] = useState("");

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const [showZeroBalances, setShowZeroBalances] = useState(false);

  // ==========================================
  // Load Data
  // ==========================================

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const username = getCookie("username");

      if (!username) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      const usersResponse = await api.get<CurrentUser[]>("/users", {
        params: { username },
      });

      const user = usersResponse.data.find(
        (item) => item.username === username,
      );

      if (!user) {
        toast.error("تعذر العثور على المستخدم");
        return;
      }

      if (user.type === "platform") {
        toast.error("لا يمكن لمستخدم المنصة الدخول إلى تقارير الشركة");
        return;
      }

      if (!user.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      const currentCompanyId = String(user.companyId);

      setCompanyId(currentCompanyId);

      // الشركة
      const companiesResponse = await api.get<Company[]>("/companies", {
        params: { id: currentCompanyId },
      });

      const company = companiesResponse.data.find(
        (item) => String(item.id) === currentCompanyId,
      );

      setCompanyName(
        company?.name ||
          company?.companyName ||
          user.name ||
          user.fullName ||
          user.username,
      );

      // البيانات المحاسبية
      const [
        accountsResponse,
        openingResponse,
        journalsResponse,
        journalLinesResponse,
      ] = await Promise.all([
        api.get<Account[]>("/accounts", {
          params: { companyId: currentCompanyId },
        }),

        api.get<OpeningEntry[]>("/openingEntries", {
          params: { companyId: currentCompanyId },
        }),

        api.get<Journal[]>("/journals", {
          params: { companyId: currentCompanyId },
        }),

        api.get<JournalLine[]>("/journalLines", {
          params: { companyId: currentCompanyId },
        }),
      ]);

      // تصفية الحسابات حسب الشركة
      const companyAccounts = accountsResponse.data.filter(
        (account) =>
          String(account.companyId) === currentCompanyId &&
          account.isActive !== false,
      );

      // الأرصدة الافتتاحية
      const companyOpeningEntries = openingResponse.data.filter(
        (entry) => String(entry.companyId) === currentCompanyId,
      );

      // القيود الخاصة بالشركة
      const companyJournals = journalsResponse.data.filter(
        (journal) =>
          journal.companyId == null ||
          String(journal.companyId) === currentCompanyId,
      );

      const validJournalIds = new Set(
        companyJournals.map((journal) => String(journal.id)),
      );

      // تفاصيل القيود
      const companyJournalLines = journalLinesResponse.data.filter((line) => {
        if (
          line.companyId != null &&
          String(line.companyId) !== currentCompanyId
        ) {
          return false;
        }

        if (line.journalId != null) {
          return validJournalIds.has(String(line.journalId));
        }

        return (
          line.companyId != null && String(line.companyId) === currentCompanyId
        );
      });

      setAccounts(companyAccounts);
      setOpeningEntries(companyOpeningEntries);
      setJournals(companyJournals);
      setJournalLines(companyJournalLines);

      setExpandedGroups(
        companyAccounts
          .filter((account) => account.isGroup)
          .map((account) => String(account.id)),
      );
    } catch (error) {
      console.error("Balance sheet loading error:", error);

      toast.error("حدث خطأ أثناء تحميل بيانات الميزانية العمومية");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // Journal Map
  // ==========================================

  const journalMap = useMemo(() => {
    const map = new Map<string, Journal>();

    journals.forEach((journal) => {
      map.set(String(journal.id), journal);
    });

    return map;
  }, [journals]);

  // ==========================================
  // Calculate real account balances
  // ==========================================

  const accountBalances = useMemo(() => {
    const balances = new Map<string, AccountBalance>();

    accounts.forEach((account) => {
      balances.set(String(account.id), createEmptyBalance());
    });

    function addMovement(
      accountId: string | number,
      debitValue: number,
      creditValue: number,
    ) {
      const balance = balances.get(String(accountId));

      if (!balance) return;

      balance.debit += toNumber(debitValue);
      balance.credit += toNumber(creditValue);
    }

    // ========================================
    // Opening entries
    // ========================================

    openingEntries.forEach((entry) => {
      if (!isValidDate(entry.date, asOfDate)) {
        return;
      }

      if (entry.isPosted === false) return;

      if (entry.status && !isPostedStatus(entry.status)) {
        return;
      }

      addMovement(entry.accountId, entry.debit || 0, entry.credit || 0);
    });

    // ========================================
    // Posted journal lines
    // ========================================

    journalLines.forEach((line) => {
      let journal: Journal | undefined;

      if (line.journalId != null) {
        journal = journalMap.get(String(line.journalId));

        if (!journal) return;

        if (journal.isPosted === false || !isPostedStatus(journal.status)) {
          return;
        }
      }

      const lineDate = line.date || journal?.date || "";

      if (!isValidDate(lineDate, asOfDate)) {
        return;
      }

      addMovement(line.accountId, line.debit || 0, line.credit || 0);
    });

    // ========================================
    // Calculate net balance
    // ========================================

    accounts.forEach((account) => {
      const balance = balances.get(String(account.id));

      if (!balance) return;

      balance.net = calculateAccountNet(account, balance.debit, balance.credit);
    });

    return balances;
  }, [accounts, openingEntries, journalLines, journalMap, asOfDate]);

  // ==========================================
  // Build account tree
  // ==========================================

  const accountTree = useMemo(() => {
    const accountMap = new Map<string, ReportAccount>();

    accounts.forEach((account) => {
      accountMap.set(String(account.id), {
        ...account,
        balance:
          accountBalances.get(String(account.id)) || createEmptyBalance(),
        children: [],
      });
    });

    const roots: ReportAccount[] = [];

    accountMap.forEach((account) => {
      if (account.parentId != null) {
        const parent = accountMap.get(String(account.parentId));

        if (parent) {
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

    // جمع أرصدة الأبناء في الحسابات الرئيسية
    function aggregate(account: ReportAccount): AccountBalance {
      let debit = account.balance.debit;
      let credit = account.balance.credit;

      account.children.forEach((child) => {
        const childBalance = aggregate(child);

        debit += childBalance.debit;
        credit += childBalance.credit;
      });

      const net = calculateAccountNet(account, debit, credit);

      account.balance = {
        debit,
        credit,
        net,
      };

      return account.balance;
    }

    roots.forEach(aggregate);

    return roots;
  }, [accounts, accountBalances]);

  // ==========================================
  // Get leaf accounts only
  // ==========================================

  const leafAccounts = useMemo(() => {
    const result: Account[] = [];

    function walk(account: ReportAccount) {
      if (account.children.length > 0) {
        account.children.forEach(walk);
      } else {
        result.push(account);
      }
    }

    accountTree.forEach(walk);

    return result;
  }, [accountTree]);

  // ==========================================
  // Financial Sections
  // ==========================================

  const financialData = useMemo(() => {
    const sections = {
      assets: [] as ReportAccount[],
      liabilities: [] as ReportAccount[],
      equity: [] as ReportAccount[],
      revenues: [] as ReportAccount[],
      expenses: [] as ReportAccount[],
    };

    leafAccounts.forEach((account) => {
      const type = normalizeType(account.type);

      const reportAccount = accountTree
        .flatMap(function flatten(item): ReportAccount[] {
          return [item, ...item.children.flatMap(flatten)];
        })
        .find((item) => String(item.id) === String(account.id));

      if (!reportAccount) return;

      if (type === "asset") {
        sections.assets.push(reportAccount);
      } else if (type === "liability") {
        sections.liabilities.push(reportAccount);
      } else if (type === "equity") {
        sections.equity.push(reportAccount);
      } else if (type === "revenue") {
        sections.revenues.push(reportAccount);
      } else if (type === "expense") {
        sections.expenses.push(reportAccount);
      }
    });

    const sum = (items: ReportAccount[]) =>
      items.reduce((total, account) => total + account.balance.net, 0);

    const totalAssets = sum(sections.assets);
    const totalLiabilities = sum(sections.liabilities);
    const totalEquity = sum(sections.equity);

    const totalRevenue = sum(sections.revenues);
    const totalExpenses = sum(sections.expenses);

    const netProfit = totalRevenue - totalExpenses;

    const equityWithProfit = totalEquity + netProfit;

    const totalLiabilitiesAndEquity = totalLiabilities + equityWithProfit;

    const difference = totalAssets - totalLiabilitiesAndEquity;

    return {
      sections,

      totalAssets,
      totalLiabilities,
      totalEquity,

      totalRevenue,
      totalExpenses,

      netProfit,
      equityWithProfit,

      totalLiabilitiesAndEquity,
      difference,

      isBalanced: Math.abs(difference) < 0.01,
    };
  }, [leafAccounts, accountTree]);

  // ==========================================
  // Search and visible tree
  // ==========================================

  const visibleAccounts = useMemo(() => {
    const result: Array<{
      account: ReportAccount;
      level: number;
    }> = [];

    const query = search.trim().toLowerCase();

    function hasMatch(account: ReportAccount): boolean {
      return (
        String(account.code).toLowerCase().includes(query) ||
        account.name.toLowerCase().includes(query) ||
        account.children.some(hasMatch)
      );
    }

    function hasBalance(account: ReportAccount): boolean {
      return Math.abs(account.balance.net) > 0.000001;
    }

    function walk(account: ReportAccount, level: number) {
      if (query && !hasMatch(account)) return;

      if (!showZeroBalances && !query && !hasBalance(account)) {
        return;
      }

      result.push({ account, level });

      const expanded = expandedGroups.includes(String(account.id));

      if (account.children.length > 0 && (expanded || Boolean(query))) {
        account.children.forEach((child) => walk(child, level + 1));
      }
    }

    accountTree.forEach((account) => walk(account, 0));

    return result;
  }, [accountTree, search, showZeroBalances, expandedGroups]);

  // ==========================================
  // Expand / Collapse
  // ==========================================

  function toggleGroup(id: string) {
    setExpandedGroups((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  // ==========================================
  // Print
  // ==========================================

  function handlePrint() {
    window.print();
  }

  // ==========================================
  // Loading
  // ==========================================

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

  // ==========================================
  // UI
  // ==========================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            الميزانية العمومية
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            قائمة المركز المالي للشركة حتى تاريخ محدد.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <FiPrinter />
            طباعة
          </button>
        </div>
      </div>

      {/* Print Header */}

      <div className="hidden text-center print:block">
        <h1 className="text-2xl font-bold">{companyName}</h1>

        <h2 className="mt-2 text-xl font-bold">الميزانية العمومية</h2>

        <p className="mt-2 text-sm">كما في تاريخ {asOfDate}</p>
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 print:hidden">
        <h2 className="mb-4 font-bold text-gray-800">خيارات التقرير</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-gray-600">
              كما في تاريخ
            </label>

            <div className="relative">
              <FiCalendar className="absolute right-3 top-3 text-gray-400" />

              <input
                type="date"
                value={asOfDate}
                max={getTodayDate()}
                onChange={(e) => setAsOfDate(e.target.value)}
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
                onChange={(e) => setSearch(e.target.value)}
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
                onChange={(e) => setShowZeroBalances(e.target.checked)}
                className="h-4 w-4"
              />
              إظهار الحسابات ذات الرصيد الصفري
            </label>
          </div>
        </div>
      </div>

      {/* Company Information */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">الشركة</p>

            <p className="mt-1 font-bold text-gray-800">{companyName}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">تاريخ التقرير</p>

            <p className="mt-1 font-semibold text-gray-800">{asOfDate}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">عدد الحسابات</p>

            <p className="mt-1 font-semibold text-gray-800">
              {accounts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="إجمالي الأصول"
          value={financialData.totalAssets}
          color="blue"
          icon={<FiBriefcase />}
        />

        <SummaryCard
          title="إجمالي الالتزامات"
          value={financialData.totalLiabilities}
          color="orange"
          icon={<FiTrendingDown />}
        />

        <SummaryCard
          title="حقوق الملكية"
          value={financialData.equityWithProfit}
          color="purple"
          icon={<FiDollarSign />}
        />

        <SummaryCard
          title="صافي الربح / الخسارة"
          value={financialData.netProfit}
          color={financialData.netProfit >= 0 ? "green" : "red"}
          icon={<FiTrendingUp />}
        />
      </div>

      {/* Balance Status */}

      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          financialData.isBalanced
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        {financialData.isBalanced ? (
          <FiCheckCircle className="text-2xl text-green-600" />
        ) : (
          <FiAlertCircle className="text-2xl text-red-600" />
        )}

        <div>
          <p
            className={`font-bold ${
              financialData.isBalanced ? "text-green-800" : "text-red-800"
            }`}
          >
            {financialData.isBalanced
              ? "الميزانية العمومية متوازنة"
              : "الميزانية العمومية غير متوازنة"}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            الفرق بين الأصول والالتزامات وحقوق الملكية:{" "}
            {formatMoney(Math.abs(financialData.difference))}
          </p>
        </div>
      </div>

      {/* Assets */}

      <FinancialSectionCard
        title="الأصول"
        subtitle="الموارد الاقتصادية المملوكة للشركة"
        accounts={financialData.sections.assets}
        total={financialData.totalAssets}
        color="blue"
        icon={<FiBriefcase />}
      />

      {/* Liabilities */}

      <FinancialSectionCard
        title="الالتزامات"
        subtitle="الالتزامات المالية المستحقة على الشركة"
        accounts={financialData.sections.liabilities}
        total={financialData.totalLiabilities}
        color="orange"
        icon={<FiTrendingDown />}
      />

      {/* Equity */}

      <FinancialSectionCard
        title="حقوق الملكية"
        subtitle="حقوق المالكين والأرباح المحتجزة"
        accounts={financialData.sections.equity}
        total={financialData.totalEquity}
        color="purple"
        icon={<FiDollarSign />}
      />

      {/* Net Profit */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-green-600" />

          <h2 className="font-bold text-gray-800">
            نتيجة النشاط حتى تاريخ التقرير
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-700">الإيرادات</p>

            <p className="mt-2 text-xl font-bold text-green-800">
              {formatMoney(financialData.totalRevenue)}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-700">المصروفات</p>

            <p className="mt-2 text-xl font-bold text-red-800">
              {formatMoney(financialData.totalExpenses)}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">صافي النتيجة</p>

            <p className="mt-2 text-xl font-bold text-blue-800">
              {formatMoney(financialData.netProfit)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-6 text-gray-500">
          يتم احتساب صافي نتيجة النشاط من أرصدة حسابات الإيرادات والمصروفات حتى
          تاريخ التقرير، ثم إضافته إلى حقوق الملكية لأغراض عرض الميزانية. لا يتم
          إنشاء قيد إقفال تلقائياً.
        </p>
      </div>

      {/* Account Tree */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
          <div>
            <h2 className="font-bold text-gray-800">
              تفاصيل دليل الحسابات والأرصدة
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              الأرصدة الفعلية للحسابات حتى {asOfDate}
            </p>
          </div>

          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {visibleAccounts.length} حساب معروض
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-200 px-4 py-3 text-right">
                  رقم الحساب
                </th>

                <th className="border border-gray-200 px-4 py-3 text-right">
                  اسم الحساب
                </th>

                <th className="border border-gray-200 px-4 py-3 text-right">
                  نوع الحساب
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center">
                  مدين
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center">
                  دائن
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center">
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
                    لا توجد حسابات أو أرصدة لعرضها.
                  </td>
                </tr>
              ) : (
                visibleAccounts.map(({ account, level }) => {
                  const isGroup = account.children.length > 0;

                  const expanded = expandedGroups.includes(String(account.id));

                  const balance = account.balance;

                  return (
                    <tr
                      key={account.id}
                      className={`transition hover:bg-blue-50 ${
                        isGroup ? "bg-gray-50 font-semibold" : "bg-white"
                      }`}
                    >
                      <td className="border-b border-gray-100 px-4 py-3 font-mono text-gray-700">
                        {account.code}
                      </td>

                      <td
                        className="border-b border-gray-100 px-4 py-3"
                        style={{
                          paddingRight: `${16 + level * 24}px`,
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

                      <td className="border-b border-gray-100 px-4 py-3 text-gray-500">
                        {getAccountTypeName(account.type)}
                      </td>

                      <MoneyCell value={balance.debit} />

                      <MoneyCell value={balance.credit} />

                      <MoneyCell value={Math.abs(balance.net)} />
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Summary */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-5 font-bold text-gray-800">
          ملخص الميزانية العمومية
        </h2>

        <div className="space-y-4">
          <FinalRow label="إجمالي الأصول" value={financialData.totalAssets} />

          <FinalRow
            label="إجمالي الالتزامات"
            value={financialData.totalLiabilities}
          />

          <FinalRow label="حقوق الملكية" value={financialData.totalEquity} />

          <FinalRow
            label="صافي الربح / الخسارة"
            value={financialData.netProfit}
          />

          <div className="border-t border-gray-200 pt-4">
            <FinalRow
              label="إجمالي الالتزامات وحقوق الملكية"
              value={financialData.totalLiabilitiesAndEquity}
            />
          </div>

          <div className="rounded-xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">الفرق المحاسبي</p>

            <p className="mt-2 text-2xl font-bold">
              {formatMoney(financialData.difference)}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              يجب أن يساوي الفرق صفراً حتى تكون الميزانية متوازنة.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}

      <div className="flex items-center gap-2 text-xs text-gray-400 print:hidden">
        <FiFileText />
        التقرير مبني على الحسابات والأرصدة الافتتاحية والقيود اليومية المرحلة
        للشركة الحالية.
      </div>
    </div>
  );
}

// ==========================================
// Summary Card
// ==========================================

function SummaryCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-4 inline-flex rounded-lg p-3 ${
          colors[color] || colors.blue
        }`}
      >
        {icon}
      </div>

      <p className="text-sm text-gray-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-gray-800">
        {formatMoney(value)}
      </p>
    </div>
  );
}

// ==========================================
// Financial Section Card
// ==========================================

function FinancialSectionCard({
  title,
  subtitle,
  accounts,
  total,
  color,
  icon,
}: {
  title: string;
  subtitle: string;
  accounts: ReportAccount[];
  total: number;
  color: string;
  icon: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);

  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 p-5 text-right hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-3 ${colors[color] || colors.blue}`}>
            {icon}
          </div>

          <div>
            <h2 className="font-bold text-gray-800">{title}</h2>

            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-800">{formatMoney(total)}</span>

          {expanded ? (
            <FiChevronDown className="text-gray-400" />
          ) : (
            <FiChevronLeft className="text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full min-w-[550px] text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 text-right">الحساب</th>

                <th className="px-5 py-3 text-right">الرصيد</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    لا توجد حسابات في هذا القسم.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-800">
                        {account.name}
                      </div>

                      <div className="mt-1 font-mono text-xs text-gray-400">
                        {account.code}
                      </div>
                    </td>

                    <td className="px-5 py-3 font-semibold text-gray-700">
                      {formatMoney(account.balance.net)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-5 py-4">الإجمالي</td>

                <td className="px-5 py-4">{formatMoney(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

// ==========================================
// Money Cell
// ==========================================

function MoneyCell({ value }: { value: number }) {
  return (
    <td className="border-b border-gray-100 px-4 py-3 text-center font-mono text-gray-700">
      {formatMoney(value)}
    </td>
  );
}

// ==========================================
// Final Row
// ==========================================

function FinalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>

      <span className="font-bold text-gray-800">{formatMoney(value)}</span>
    </div>
  );
}
