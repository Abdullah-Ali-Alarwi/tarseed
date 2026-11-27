"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiRefreshCw,
  FiPrinter,
  FiSearch,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiEye,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

type Account = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  parentId: string | null;
  isGroup: boolean;
  isSystem?: boolean;
  systemKey?: string;
  status?: string;
  isActive?: boolean;
  extra?: Record<string, any> | null;
};

type ReportCategory =
  | "revenue"
  | "costOfSales"
  | "operatingExpense"
  | "otherIncome"
  | "otherExpense"
  | "none";

type AccountBalance = {
  debit: number;
  credit: number;
  net: number;
};

type ReportRow = {
  account: Account;
  category: ReportCategory;
  balance: AccountBalance;
  depth: number;
  hasChildren: boolean;
};

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getFirstDayOfMonth = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-01`;
};

const numberValue = (value: any) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(roundMoney(value)));

const formatDate = (value: string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .find((item) => item.trim().startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.trim().substring(name.length + 1));
};

const isAccountActive = (account: Account) =>
  account.isActive !== false &&
  account.status !== "inactive" &&
  account.status !== "disabled";

const emptyBalance = (): AccountBalance => ({
  debit: 0,
  credit: 0,
  net: 0,
});

const addBalance = (target: AccountBalance, source: AccountBalance) => {
  target.debit += source.debit;
  target.credit += source.credit;
  target.net += source.net;
};

const normalize = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const containsAny = (value: string, words: string[]) =>
  words.some((word) => value.includes(normalize(word)));

// --------------------------------------------------
// تصنيف الحسابات
// --------------------------------------------------

const classifyAccount = (account: Account): ReportCategory => {
  const extra = account.extra || {};

  const explicitCategory = normalize(
    extra.reportCategory ??
      extra.accountCategory ??
      extra.statementCategory ??
      extra.financialStatementCategory,
  );

  const systemKey = normalize(account.systemKey);

  const accountType = normalize(account.type);

  const accountName = normalize(account.name);

  const accountCode = String(account.code || "");

  const metadata = [explicitCategory, systemKey, accountType, accountName].join(
    " ",
  );

  // تكلفة البضاعة المباعة
  if (
    extra.isCostOfGoodsSold === true ||
    containsAny(metadata, [
      "cost_of_goods_sold",
      "cost of goods sold",
      "cost_of_sales",
      "cost of sales",
      "cogs",
      "تكلفة البضاعة المباعة",
      "تكلفة المبيعات",
      "تكلفة البضاعة",
      "تكلفة المبيعات",
    ])
  ) {
    return "costOfSales";
  }

  // إيرادات أخرى
  if (
    containsAny(metadata, [
      "other_income",
      "other income",
      "non_operating_income",
      "non operating income",
      "إيرادات أخرى",
      "دخل آخر",
      "إيرادات غير تشغيلية",
    ])
  ) {
    return "otherIncome";
  }

  // مصروفات أخرى
  if (
    containsAny(metadata, [
      "other_expense",
      "other expenses",
      "non_operating_expense",
      "non operating expense",
      "مصروفات أخرى",
      "مصروفات غير تشغيلية",
      "خسائر أخرى",
    ])
  ) {
    return "otherExpense";
  }

  // الإيرادات
  if (
    containsAny(metadata, [
      "revenue",
      "revenues",
      "income",
      "sales",
      "إيراد",
      "إيرادات",
      "دخل",
      "مبيعات",
    ])
  ) {
    return "revenue";
  }

  // المصروفات
  if (
    containsAny(metadata, [
      "expense",
      "expenses",
      "cost",
      "مصروف",
      "مصروفات",
      "تكلفة",
      "تكاليف",
    ])
  ) {
    return "operatingExpense";
  }

  // التصنيف الاحتياطي حسب رمز الحساب
  if (accountCode.startsWith("4")) {
    return "revenue";
  }

  if (accountCode.startsWith("5") || accountCode.startsWith("6")) {
    return "operatingExpense";
  }

  return "none";
};

const categoryLabel = (category: ReportCategory) => {
  switch (category) {
    case "revenue":
      return "إيرادات";

    case "costOfSales":
      return "تكلفة المبيعات";

    case "operatingExpense":
      return "مصروفات تشغيلية";

    case "otherIncome":
      return "إيرادات أخرى";

    case "otherExpense":
      return "مصروفات أخرى";

    default:
      return "غير مصنف";
  }
};

// --------------------------------------------------
// الصفحة
// --------------------------------------------------

export default function IncomeStatementPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [companyId, setCompanyId] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [journalLines, setJournalLines] = useState<any[]>([]);

  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getLocalDate());

  const [search, setSearch] = useState("");

  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );

  // --------------------------------------------------
  // المستخدم الحالي
  // --------------------------------------------------

  const loadUser = useCallback(async () => {
    const username = getCookie("username");

    if (!username) {
      throw new Error("لم يتم العثور على بيانات تسجيل الدخول.");
    }

    const result: any = await getUserByUsername(username);

    const user = result?.data ?? result;

    if (!user) {
      throw new Error("تعذر العثور على المستخدم.");
    }

    if (user.type === "platform") {
      throw new Error("لا يمكن لمستخدم المنصة عرض قائمة دخل الشركة.");
    }

    if (
      user.isActive === false ||
      user.status === "inactive" ||
      user.status === "disabled"
    ) {
      throw new Error("حساب المستخدم غير نشط.");
    }

    if (!user.companyId) {
      throw new Error("المستخدم غير مرتبط بشركة.");
    }

    setCompanyId(user.companyId);

    return user.companyId as string;
  }, []);

  // --------------------------------------------------
  // تحميل البيانات
  // --------------------------------------------------

  const loadData = useCallback(async () => {
    setError("");

    try {
      const currentCompanyId = companyId || (await loadUser());

      const [accountsResult, journalsResult, linesResult] = await Promise.all([
        supabase.from("accounts").select("*").eq("companyId", currentCompanyId),

        supabase.from("journals").select("*").eq("companyId", currentCompanyId),

        supabase
          .from("journalLines")
          .select("*")
          .eq("companyId", currentCompanyId),
      ]);

      if (accountsResult.error) throw accountsResult.error;
      if (journalsResult.error) throw journalsResult.error;
      if (linesResult.error) throw linesResult.error;

      setAccounts(
        ((accountsResult.data || []) as Account[]).filter(
          (account) =>
            account.companyId === currentCompanyId && isAccountActive(account),
        ),
      );

      setJournals(
        (journalsResult.data || []).filter(
          (journal: any) => journal.companyId === currentCompanyId,
        ),
      );

      setJournalLines(
        (linesResult.data || []).filter(
          (line: any) => line.companyId === currentCompanyId,
        ),
      );
    } catch (err: any) {
      console.error("Income Statement Error:", err);

      setError(err?.message || "حدث خطأ أثناء تحميل قائمة الدخل.");
    }
  }, [companyId, loadUser]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    initialize();
  }, [loadData]);

  // --------------------------------------------------
  // تحديث
  // --------------------------------------------------

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // --------------------------------------------------
  // حساب قائمة الدخل
  // --------------------------------------------------

  const report = useMemo(() => {
    const accountMap = new Map<string, Account>();

    accounts.forEach((account) => {
      accountMap.set(account.id, account);
    });

    const journalDateMap = new Map<string, string>();

    journals.forEach((journal) => {
      if (
        journal.status !== "posted" ||
        journal.companyId !== companyId ||
        !journal.date
      ) {
        return;
      }

      const date = String(journal.date).slice(0, 10);

      if (date < fromDate || date > toDate) return;

      journalDateMap.set(String(journal.id), date);
    });

    // الأرصدة المباشرة للحسابات
    const ownBalances = new Map<string, AccountBalance>();

    accounts.forEach((account) => {
      ownBalances.set(account.id, emptyBalance());
    });

    // احتساب سطور القيود المرحلة داخل الفترة
    journalLines.forEach((line: any) => {
      if (!accountMap.has(line.accountId)) return;

      if (line.companyId !== companyId) return;

      const date = journalDateMap.get(String(line.journalId));

      if (!date) return;

      const balance = ownBalances.get(line.accountId);

      if (!balance) return;

      balance.debit += numberValue(line.debit);
      balance.credit += numberValue(line.credit);
    });

    ownBalances.forEach((balance) => {
      balance.debit = roundMoney(balance.debit);
      balance.credit = roundMoney(balance.credit);

      balance.net = roundMoney(balance.credit - balance.debit);
    });

    // شجرة الحسابات
    const childrenMap = new Map<string, Account[]>();

    accounts.forEach((account) => {
      if (!account.parentId) return;

      if (!accountMap.has(account.parentId)) return;

      const children = childrenMap.get(account.parentId) || [];

      children.push(account);

      childrenMap.set(account.parentId, children);
    });

    const sortAccounts = (items: Account[]) =>
      [...items].sort((a, b) =>
        String(a.code || "").localeCompare(String(b.code || ""), "en", {
          numeric: true,
        }),
      );

    childrenMap.forEach((children, id) => {
      childrenMap.set(id, sortAccounts(children));
    });

    // تجميع الأرصدة الهرمية
    const aggregateCache = new Map<string, AccountBalance>();

    const aggregateAccount = (
      accountId: string,
      visited = new Set<string>(),
    ): AccountBalance => {
      const cached = aggregateCache.get(accountId);

      if (cached) return { ...cached };

      if (visited.has(accountId)) return emptyBalance();

      const nextVisited = new Set(visited);
      nextVisited.add(accountId);

      const result = {
        ...(ownBalances.get(accountId) || emptyBalance()),
      };

      const children = childrenMap.get(accountId) || [];

      children.forEach((child) => {
        addBalance(result, aggregateAccount(child.id, nextVisited));
      });

      result.debit = roundMoney(result.debit);
      result.credit = roundMoney(result.credit);
      result.net = roundMoney(result.net);

      aggregateCache.set(accountId, result);

      return { ...result };
    };

    // تصنيف الحسابات القابلة للترحيل فقط
    const accountCategories = new Map<string, ReportCategory>();

    accounts.forEach((account) => {
      const children = childrenMap.get(account.id) || [];

      const allowPosting = account.extra?.allowPosting !== false;

      const canPost =
        account.isGroup === false && allowPosting && children.length === 0;

      accountCategories.set(
        account.id,
        canPost ? classifyAccount(account) : "none",
      );
    });

    const totals = {
      revenue: 0,
      costOfSales: 0,
      operatingExpense: 0,
      otherIncome: 0,
      otherExpense: 0,
    };

    // الإجماليات من الحسابات النهائية فقط
    accounts.forEach((account) => {
      const category = accountCategories.get(account.id);

      if (!category || category === "none") return;

      const balance = ownBalances.get(account.id);

      if (!balance) return;

      const amount = roundMoney(balance.net);

      switch (category) {
        case "revenue":
          totals.revenue += amount;
          break;

        case "costOfSales":
          totals.costOfSales += -amount;
          break;

        case "operatingExpense":
          totals.operatingExpense += -amount;
          break;

        case "otherIncome":
          totals.otherIncome += amount;
          break;

        case "otherExpense":
          totals.otherExpense += -amount;
          break;
      }
    });

    totals.revenue = roundMoney(totals.revenue);
    totals.costOfSales = roundMoney(totals.costOfSales);
    totals.operatingExpense = roundMoney(totals.operatingExpense);
    totals.otherIncome = roundMoney(totals.otherIncome);
    totals.otherExpense = roundMoney(totals.otherExpense);

    const grossProfit = roundMoney(totals.revenue - totals.costOfSales);

    const operatingProfit = roundMoney(grossProfit - totals.operatingExpense);

    const netProfit = roundMoney(
      operatingProfit + totals.otherIncome - totals.otherExpense,
    );

    const profitMargin =
      totals.revenue !== 0 ? roundMoney((netProfit / totals.revenue) * 100) : 0;

    // الصفوف الهرمية
    const rows: ReportRow[] = [];

    const rendered = new Set<string>();

    const renderAccount = (account: Account, depth: number) => {
      if (rendered.has(account.id)) return;

      rendered.add(account.id);

      const children = childrenMap.get(account.id) || [];

      const balance = aggregateAccount(account.id);

      const category = accountCategories.get(account.id) || "none";

      rows.push({
        account,
        category,
        balance,
        depth,
        hasChildren: children.length > 0,
      });

      if (expandedAccounts.has(account.id)) {
        children.forEach((child) => {
          renderAccount(child, depth + 1);
        });
      }
    };

    const roots = sortAccounts(
      accounts.filter(
        (account) => !account.parentId || !accountMap.has(account.parentId),
      ),
    );

    roots.forEach((account) => renderAccount(account, 0));

    // الحسابات اليتيمة أو ذات العلاقة غير السليمة
    sortAccounts(accounts).forEach((account) => {
      if (!rendered.has(account.id)) {
        renderAccount(account, 0);
      }
    });

    return {
      rows,
      totals,
      grossProfit,
      operatingProfit,
      netProfit,
      profitMargin,
      childrenMap,
    };
  }, [
    accounts,
    journals,
    journalLines,
    companyId,
    fromDate,
    toDate,
    expandedAccounts,
  ]);

  // --------------------------------------------------
  // البحث
  // --------------------------------------------------

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return report.rows.filter(({ account, category }) => {
      if (category === "none") return false;

      if (!query) return true;

      return (
        String(account.name || "")
          .toLowerCase()
          .includes(query) ||
        String(account.code || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [report.rows, search]);

  // --------------------------------------------------
  // توسيع وطي الحسابات
  // --------------------------------------------------

  const expandAll = () => {
    setExpandedAccounts(
      new Set(
        accounts
          .filter(
            (account) => (report.childrenMap.get(account.id)?.length || 0) > 0,
          )
          .map((account) => account.id),
      ),
    );
  };

  const collapseAll = () => {
    setExpandedAccounts(new Set());
  };

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

  // --------------------------------------------------
  // الطباعة
  // --------------------------------------------------

  const handlePrint = () => {
    window.print();
  };

  // --------------------------------------------------
  // تحميل
  // --------------------------------------------------

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="animate-spin text-3xl text-blue-600" />
          <p className="text-sm text-slate-500">جاري إعداد قائمة الدخل...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // خطأ
  // --------------------------------------------------

  if (error && accounts.length === 0) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-2xl text-red-600" />

            <div>
              <h2 className="font-bold text-red-800">تعذر تحميل قائمة الدخل</h2>

              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <FiRefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // الصفحة
  // --------------------------------------------------

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-center print:hidden">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>التقارير</span>
              <FiChevronLeft size={14} />
              <span className="text-slate-600">قائمة الدخل</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <FiTrendingUp size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  قائمة الدخل
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  تقرير الإيرادات والمصروفات وصافي الربح أو الخسارة.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={expandAll}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              توسيع الكل
            </button>

            <button
              onClick={collapseAll}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              طي الكل
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              تحديث
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FiPrinter size={16} />
              طباعة
            </button>
          </div>
        </div>

        {/* Print Header */}

        <div className="mb-6 hidden print:block">
          <h1 className="text-center text-2xl font-bold">قائمة الدخل</h1>

          <p className="mt-2 text-center text-sm">
            من {formatDate(fromDate)} إلى {formatDate(toDate)}
          </p>
        </div>

        {/* Filters */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <FiCalendar className="text-blue-600" />

            <h2 className="font-bold text-slate-800">الفترة المحاسبية</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                من تاريخ
              </label>

              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                إلى تاريخ
              </label>

              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={getLocalDate()}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                البحث عن حساب
              </label>

              <div className="relative">
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="اسم الحساب أو رمزه..."
                  className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            الفترة المحددة:
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
              {formatDate(fromDate)}
            </span>
            إلى
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
              {formatDate(toDate)}
            </span>
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <FiAlertCircle />
            {error}
          </div>
        )}

        {/* Main Results */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">إجمالي الإيرادات</p>

                <h3 className="mt-2 text-xl font-bold text-emerald-700">
                  {formatMoney(report.totals.revenue)}
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiTrendingUp size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">تكلفة البضاعة المباعة</p>

                <h3 className="mt-2 text-xl font-bold text-amber-700">
                  {formatMoney(report.totals.costOfSales)}
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiDollarSign size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">المصروفات التشغيلية</p>

                <h3 className="mt-2 text-xl font-bold text-red-700">
                  {formatMoney(report.totals.operatingExpense)}
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <FiTrendingDown size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">صافي الربح / الخسارة</p>

                <h3
                  className={`mt-2 text-xl font-bold ${
                    report.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {formatMoney(report.netProfit)}
                </h3>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  report.netProfit >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {report.netProfit >= 0 ? (
                  <FiTrendingUp size={22} />
                ) : (
                  <FiTrendingDown size={22} />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Profit Summary */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-800">ملخص نتائج الأعمال</h2>

            <p className="mt-1 text-xs text-slate-400">
              النتائج المالية للفترة المحددة
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-sm text-slate-600">إجمالي الإيرادات</span>

              <span className="font-bold text-emerald-700">
                {formatMoney(report.totals.revenue)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-sm text-slate-600">
                (-) تكلفة البضاعة المباعة
              </span>

              <span className="font-semibold text-red-600">
                {formatMoney(report.totals.costOfSales)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-blue-50/60 px-5 py-4">
              <span className="font-bold text-slate-800">مجمل الربح</span>

              <span className="text-lg font-bold text-blue-700">
                {formatMoney(report.grossProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-sm text-slate-600">
                (-) المصروفات التشغيلية
              </span>

              <span className="font-semibold text-red-600">
                {formatMoney(report.totals.operatingExpense)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-slate-50 px-5 py-4">
              <span className="font-bold text-slate-800">الربح التشغيلي</span>

              <span className="font-bold text-slate-800">
                {formatMoney(report.operatingProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-sm text-slate-600">(+) إيرادات أخرى</span>

              <span className="font-semibold text-emerald-700">
                {formatMoney(report.totals.otherIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-sm text-slate-600">(-) مصروفات أخرى</span>

              <span className="font-semibold text-red-600">
                {formatMoney(report.totals.otherExpense)}
              </span>
            </div>

            <div
              className={`flex items-center justify-between gap-3 px-5 py-5 ${
                report.netProfit >= 0 ? "bg-emerald-50" : "bg-red-50"
              }`}
            >
              <div>
                <h3 className="font-bold text-slate-900">
                  صافي الربح / الخسارة
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  هامش صافي الربح: {report.profitMargin}%
                </p>
              </div>

              <span
                className={`text-xl font-bold ${
                  report.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {formatMoney(report.netProfit)}
              </span>
            </div>
          </div>
        </section>

        {/* Account Details */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-800">
                تفاصيل حسابات قائمة الدخل
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                الحسابات التي ساهمت في نتائج الفترة
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FiEye size={15} />
              {filteredRows.length} حساب
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-600">
                  <th className="px-4 py-4 text-right">الحساب</th>

                  <th className="px-4 py-4 text-right">التصنيف</th>

                  <th className="px-4 py-4 text-left">مدين</th>

                  <th className="px-4 py-4 text-left">دائن</th>

                  <th className="px-4 py-4 text-left">صافي الحركة</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FiFileText className="text-4xl text-slate-300" />

                        <p className="font-semibold text-slate-600">
                          لا توجد حسابات إيرادات أو مصروفات
                        </p>

                        <p className="text-xs text-slate-400">
                          تحقق من الفترة المحددة وتصنيف الحسابات والقيود
                          المرحلة.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(
                    ({ account, category, balance, depth, hasChildren }) => {
                      const expanded = expandedAccounts.has(account.id);

                      return (
                        <tr
                          key={account.id}
                          className={`border-b border-slate-100 hover:bg-blue-50/40 ${
                            account.isGroup ? "bg-slate-50/70" : "bg-white"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div
                              className="flex min-w-[230px] items-center gap-2"
                              style={{
                                paddingRight: `${depth * 20}px`,
                              }}
                            >
                              {hasChildren ? (
                                <button
                                  onClick={() => toggleAccount(account.id)}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 print:hidden"
                                >
                                  <FiChevronDown
                                    size={15}
                                    className={`transition-transform ${
                                      expanded ? "" : "rotate-90"
                                    }`}
                                  />
                                </button>
                              ) : (
                                <span className="w-6 shrink-0" />
                              )}

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-blue-600">
                                    {account.code}
                                  </span>

                                  <span
                                    className={
                                      account.isGroup
                                        ? "font-bold text-slate-800"
                                        : "font-medium text-slate-700"
                                    }
                                  >
                                    {account.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              {categoryLabel(category)}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-left tabular-nums text-slate-600">
                            {balance.debit > 0
                              ? formatMoney(balance.debit)
                              : "-"}
                          </td>

                          <td className="px-4 py-3 text-left tabular-nums text-slate-600">
                            {balance.credit > 0
                              ? formatMoney(balance.credit)
                              : "-"}
                          </td>

                          <td
                            className={`px-4 py-3 text-left font-semibold tabular-nums ${
                              balance.net >= 0
                                ? "text-emerald-700"
                                : "text-red-600"
                            }`}
                          >
                            {formatMoney(balance.net)}
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs text-slate-500">
            تم احتساب الحركات من القيود المرحلة خلال الفترة المحددة.
          </div>
        </section>

        {/* Accounting Notes */}

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 print:hidden">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 shrink-0 text-blue-600" />

            <div>
              <h3 className="text-sm font-bold text-blue-900">
                ملاحظات محاسبية
              </h3>

              <ul className="mt-2 space-y-1 text-xs leading-6 text-blue-800/80">
                <li>• يتم احتساب قائمة الدخل من الحركات المرحلة فقط.</li>

                <li>• الإيرادات = الدائن - المدين.</li>

                <li>• المصروفات = المدين - الدائن.</li>

                <li>• لا تدخل الأرصدة الافتتاحية في قائمة الدخل.</li>

                <li>
                  • يتم تجميع أرصدة الحسابات الفرعية في الحسابات الرئيسية.
                </li>

                <li>
                  • تكلفة البضاعة المباعة تحتاج إلى تصنيف حساباتها بشكل صحيح حتى
                  يظهر مجمل الربح بدقة.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          main {
            padding: 0 !important;
            background: white !important;
          }

          button,
          input {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
