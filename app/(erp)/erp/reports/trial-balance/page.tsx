"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiRefreshCw,
  FiPrinter,
  FiSearch,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiTrendingUp,
  FiBookOpen,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronLeft,
  FiFileText,
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
  status?: string;
  systemKey?: string;
  isActive?: boolean;
  extra?: Record<string, any> | null;
};

type Balance = {
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingNet: number;
};

type AccountRow = {
  account: Account;
  balance: Balance;
  depth: number;
  hasChildren: boolean;
};

type OpeningExtra = {
  date?: string;
  debit?: number;
  credit?: number;
  accountId?: string;
  description?: string;
  reference?: string;
};

const numberValue = (value: any): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getFirstDayOfMonth = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
};

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(roundMoney(value)));
};

const formatDate = (value: string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");

  const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.trim().substring(name.length + 1));
};

const parseExtra = (extra: any): OpeningExtra | null => {
  if (!extra) return null;

  let value = extra;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    return null;
  }

  if (typeof value !== "object") return null;

  return value as OpeningExtra;
};

const emptyBalance = (): Balance => ({
  openingDebit: 0,
  openingCredit: 0,
  periodDebit: 0,
  periodCredit: 0,
  closingNet: 0,
});

const addBalance = (target: Balance, source: Balance) => {
  target.openingDebit += source.openingDebit;
  target.openingCredit += source.openingCredit;
  target.periodDebit += source.periodDebit;
  target.periodCredit += source.periodCredit;
  target.closingNet += source.closingNet;
};

const getDebitCredit = (net: number) => {
  const value = roundMoney(net);

  if (value > 0) {
    return {
      debit: value,
      credit: 0,
    };
  }

  if (value < 0) {
    return {
      debit: 0,
      credit: Math.abs(value),
    };
  }

  return {
    debit: 0,
    credit: 0,
  };
};

const isAccountActive = (account: Account) => {
  return (
    account.isActive !== false &&
    account.status !== "inactive" &&
    account.status !== "disabled"
  );
};

export default function TrialBalancePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [companyId, setCompanyId] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openingEntries, setOpeningEntries] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [journalLines, setJournalLines] = useState<any[]>([]);

  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getLocalDate());

  const [search, setSearch] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );

  // --------------------------------------------------
  // تحميل بيانات المستخدم
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
      throw new Error("لا يمكن لمستخدم المنصة الدخول إلى تقارير الشركة.");
    }

    if (
      user.isActive === false ||
      user.status === "inactive" ||
      user.status === "disabled"
    ) {
      throw new Error("حساب المستخدم غير نشط.");
    }

    if (!user.companyId) {
      throw new Error("هذا المستخدم غير مرتبط بشركة.");
    }

    setCompanyId(user.companyId);

    return user.companyId as string;
  }, []);

  // --------------------------------------------------
  // تحميل البيانات من Supabase
  // --------------------------------------------------

  const loadData = useCallback(async () => {
    setError("");

    try {
      const currentCompanyId = companyId || (await loadUser());

      const [accountsResult, openingResult, journalsResult, linesResult] =
        await Promise.all([
          supabase
            .from("accounts")
            .select("*")
            .eq("companyId", currentCompanyId),

          supabase
            .from("openingEntries")
            .select("*")
            .eq("companyId", currentCompanyId),

          supabase
            .from("journals")
            .select("*")
            .eq("companyId", currentCompanyId),

          supabase
            .from("journalLines")
            .select("*")
            .eq("companyId", currentCompanyId),
        ]);

      if (accountsResult.error) throw accountsResult.error;
      if (openingResult.error) throw openingResult.error;
      if (journalsResult.error) throw journalsResult.error;
      if (linesResult.error) throw linesResult.error;

      setAccounts(
        ((accountsResult.data || []) as Account[]).filter(
          (account) =>
            account.companyId === currentCompanyId && isAccountActive(account),
        ),
      );

      setOpeningEntries(
        (openingResult.data || []).filter(
          (entry: any) => entry.companyId === currentCompanyId,
        ),
      );

      setJournals(
        (journalsResult.data || []).filter(
          (journal: any) =>
            journal.companyId === currentCompanyId &&
            journal.status === "posted",
        ),
      );

      setJournalLines(
        (linesResult.data || []).filter(
          (line: any) => line.companyId === currentCompanyId,
        ),
      );
    } catch (err: any) {
      console.error("Trial Balance Error:", err);

      setError(err?.message || "حدث خطأ أثناء تحميل بيانات ميزان المراجعة.");
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
  // تحديث البيانات
  // --------------------------------------------------

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadData();

    setRefreshing(false);
  };

  // --------------------------------------------------
  // معالجة القيود والحركات المحاسبية
  // --------------------------------------------------

  const calculatedData = useMemo(() => {
    const accountMap = new Map<string, Account>();

    accounts.forEach((account) => {
      accountMap.set(account.id, account);
    });

    const ownBalances = new Map<string, Balance>();

    accounts.forEach((account) => {
      ownBalances.set(account.id, emptyBalance());
    });

    const addOpeningMovement = (
      accountId: string,
      date: string,
      debit: number,
      credit: number,
    ) => {
      const balance = ownBalances.get(accountId);

      if (!balance) return;

      if (date < fromDate) {
        balance.openingDebit += debit;
        balance.openingCredit += credit;
      } else if (date <= toDate) {
        balance.periodDebit += debit;
        balance.periodCredit += credit;
      }
    };

    // الأرصدة الافتتاحية
    openingEntries.forEach((entry) => {
      const extra = parseExtra(entry.extra);

      if (!extra?.accountId) return;

      if (!accountMap.has(extra.accountId)) return;

      const date = String(extra.date || "").slice(0, 10);

      if (!date || date > toDate) return;

      addOpeningMovement(
        extra.accountId,
        date,
        numberValue(extra.debit),
        numberValue(extra.credit),
      );
    });

    // رؤوس القيود المرحلة
    const postedJournalIds = new Set(
      journals
        .filter(
          (journal) =>
            journal.companyId === companyId &&
            journal.status === "posted" &&
            journal.date,
        )
        .filter((journal) => {
          const date = String(journal.date).slice(0, 10);

          return date <= toDate;
        })
        .map((journal) => String(journal.id)),
    );

    const journalDateMap = new Map<string, string>();

    journals.forEach((journal) => {
      if (postedJournalIds.has(String(journal.id))) {
        journalDateMap.set(
          String(journal.id),
          String(journal.date).slice(0, 10),
        );
      }
    });

    // تفاصيل القيود اليومية
    journalLines.forEach((line: any) => {
      const journalId = String(line.journalId);

      if (!postedJournalIds.has(journalId)) return;

      if (!accountMap.has(line.accountId)) return;

      const date = journalDateMap.get(journalId);

      if (!date) return;

      if (date < fromDate) {
        const balance = ownBalances.get(line.accountId);

        if (!balance) return;

        balance.openingDebit += numberValue(line.debit);
        balance.openingCredit += numberValue(line.credit);
      } else if (date <= toDate) {
        const balance = ownBalances.get(line.accountId);

        if (!balance) return;

        balance.periodDebit += numberValue(line.debit);
        balance.periodCredit += numberValue(line.credit);
      }
    });

    // حساب صافي الرصيد لكل حساب
    ownBalances.forEach((balance) => {
      const openingNet = balance.openingDebit - balance.openingCredit;

      const periodNet = balance.periodDebit - balance.periodCredit;

      balance.closingNet = roundMoney(openingNet + periodNet);

      balance.openingDebit = roundMoney(balance.openingDebit);
      balance.openingCredit = roundMoney(balance.openingCredit);
      balance.periodDebit = roundMoney(balance.periodDebit);
      balance.periodCredit = roundMoney(balance.periodCredit);
    });

    // بناء شجرة الحسابات
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

    childrenMap.forEach((children, parentId) => {
      childrenMap.set(parentId, sortAccounts(children));
    });

    const aggregateCache = new Map<string, Balance>();

    const aggregateAccount = (
      accountId: string,
      visited = new Set<string>(),
    ): Balance => {
      const cached = aggregateCache.get(accountId);

      if (cached) return { ...cached };

      if (visited.has(accountId)) {
        return emptyBalance();
      }

      const nextVisited = new Set(visited);
      nextVisited.add(accountId);

      const own = ownBalances.get(accountId) || emptyBalance();

      const result: Balance = { ...own };

      const children = childrenMap.get(accountId) || [];

      children.forEach((child) => {
        const childBalance = aggregateAccount(child.id, nextVisited);

        addBalance(result, childBalance);
      });

      result.openingDebit = roundMoney(result.openingDebit);
      result.openingCredit = roundMoney(result.openingCredit);
      result.periodDebit = roundMoney(result.periodDebit);
      result.periodCredit = roundMoney(result.periodCredit);
      result.closingNet = roundMoney(result.closingNet);

      aggregateCache.set(accountId, result);

      return { ...result };
    };

    // إنشاء الصفوف الهرمية
    const rows: AccountRow[] = [];

    const rendered = new Set<string>();

    const renderAccount = (account: Account, depth: number) => {
      if (rendered.has(account.id)) return;

      rendered.add(account.id);

      const children = childrenMap.get(account.id) || [];

      const balance = aggregateAccount(account.id);

      rows.push({
        account,
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

    // معالجة الحسابات التي لا تظهر بسبب علاقة أب غير سليمة أو دورة
    sortAccounts(accounts).forEach((account) => {
      if (!rendered.has(account.id)) {
        renderAccount(account, 0);
      }
    });

    // الإجماليات: الحسابات القابلة للترحيل فقط
    const totalBalance = emptyBalance();

    accounts.forEach((account) => {
      const accountChildren = childrenMap.get(account.id) || [];

      const allowPosting = account.extra?.allowPosting !== false;

      const isPostingAccount =
        account.isGroup === false &&
        allowPosting &&
        accountChildren.length === 0;

      if (!isPostingAccount) return;

      const balance = ownBalances.get(account.id);

      if (!balance) return;

      addBalance(totalBalance, balance);
    });

    return {
      rows,
      totalBalance,
      childrenMap,
      ownBalances,
    };
  }, [
    accounts,
    openingEntries,
    journals,
    journalLines,
    fromDate,
    toDate,
    companyId,
    expandedAccounts,
  ]);

  // --------------------------------------------------
  // البحث وإظهار الحسابات
  // --------------------------------------------------

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return calculatedData.rows.filter(({ account, balance }) => {
      const matchesSearch =
        !query ||
        String(account.name || "")
          .toLowerCase()
          .includes(query) ||
        String(account.code || "")
          .toLowerCase()
          .includes(query);

      const hasBalance =
        Math.abs(balance.openingDebit) > 0.001 ||
        Math.abs(balance.openingCredit) > 0.001 ||
        Math.abs(balance.periodDebit) > 0.001 ||
        Math.abs(balance.periodCredit) > 0.001 ||
        Math.abs(balance.closingNet) > 0.001;

      return matchesSearch && (showZeroBalances || hasBalance);
    });
  }, [calculatedData.rows, search, showZeroBalances]);

  // --------------------------------------------------
  // إجماليات التقرير
  // --------------------------------------------------

  const totals = useMemo(() => {
    const balance = calculatedData.totalBalance;

    const openingNet = balance.openingDebit - balance.openingCredit;

    const closingNet = balance.closingNet;

    const opening = getDebitCredit(openingNet);
    const closing = getDebitCredit(closingNet);

    const periodDifference = balance.periodDebit - balance.periodCredit;

    const isBalanced =
      Math.abs(periodDifference + openingNet) < 0.01 &&
      Math.abs(closingNet) < 0.01;

    return {
      opening,
      closing,
      periodDebit: roundMoney(balance.periodDebit),
      periodCredit: roundMoney(balance.periodCredit),
      isBalanced,
      difference: roundMoney(Math.abs(closingNet)),
    };
  }, [calculatedData.totalBalance]);

  // --------------------------------------------------
  // فتح وإغلاق الحسابات
  // --------------------------------------------------

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts((previous) => {
      const next = new Set(previous);

      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }

      return next;
    });
  };

  const expandAll = () => {
    setExpandedAccounts(
      new Set(
        accounts
          .filter((account) => {
            return (
              (calculatedData.childrenMap.get(account.id)?.length || 0) > 0
            );
          })
          .map((account) => account.id),
      ),
    );
  };

  const collapseAll = () => {
    setExpandedAccounts(new Set());
  };

  // --------------------------------------------------
  // الطباعة
  // --------------------------------------------------

  const handlePrint = () => {
    window.print();
  };

  // --------------------------------------------------
  // مكون عرض الرصيد
  // --------------------------------------------------

  const AmountCell = ({ value }: { value: number }) => {
    return (
      <span className={value > 0 ? "text-slate-800" : "text-slate-400"}>
        {value > 0 ? formatMoney(value) : "-"}
      </span>
    );
  };

  const BalanceCells = ({ net }: { net: number }) => {
    const value = getDebitCredit(net);

    return (
      <>
        <td className="px-3 py-3 text-left tabular-nums">
          <AmountCell value={value.debit} />
        </td>

        <td className="px-3 py-3 text-left tabular-nums">
          <AmountCell value={value.credit} />
        </td>
      </>
    );
  };

  // --------------------------------------------------
  // حالة التحميل
  // --------------------------------------------------

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="animate-spin text-3xl text-blue-600" />

          <p className="text-sm text-slate-500">جاري تحميل ميزان المراجعة...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // حالة الخطأ
  // --------------------------------------------------

  if (error && accounts.length === 0) {
    return (
      <div dir="rtl" className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-2xl text-red-600" />

            <div>
              <h2 className="font-bold text-red-800">
                تعذر تحميل ميزان المراجعة
              </h2>

              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <FiRefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // الصفحة الرئيسية
  // --------------------------------------------------

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}

        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-center print:hidden">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>التقارير</span>
              <FiChevronLeft size={14} />
              <span className="font-medium text-slate-600">ميزان المراجعة</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <FiBookOpen size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  ميزان المراجعة
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  عرض أرصدة الحسابات والحركات المدينة والدائنة.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={expandAll}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              توسيع الكل
            </button>

            <button
              onClick={collapseAll}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              طي الكل
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
          <h1 className="text-center text-2xl font-bold">ميزان المراجعة</h1>

          <p className="mt-2 text-center text-sm">
            من {formatDate(fromDate)} إلى {formatDate(toDate)}
          </p>
        </div>

        {/* Filters */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <FiCalendar className="text-blue-600" />

            <h2 className="font-bold text-slate-800">خيارات التقرير</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                من تاريخ
              </label>

              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={showZeroBalances}
                  onChange={(e) => setShowZeroBalances(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="text-sm font-medium text-slate-600">
                  إظهار الحسابات ذات الرصيد الصفري
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>الفترة المحددة:</span>

            <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-600">
              {formatDate(fromDate)}
            </span>

            <span>إلى</span>

            <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-600">
              {formatDate(toDate)}
            </span>
          </div>
        </section>

        {/* Error banner */}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <FiAlertCircle />
            {error}
          </div>
        )}

        {/* Summary Cards */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">رصيد أول المدة - مدين</p>

                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {formatMoney(totals.opening.debit)}
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiDollarSign size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">حركة الفترة - مدين</p>

                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {formatMoney(totals.periodDebit)}
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
                <p className="text-sm text-slate-500">حركة الفترة - دائن</p>

                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {formatMoney(totals.periodCredit)}
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FiFileText size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">رصيد آخر المدة - مدين</p>

                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {formatMoney(totals.closing.debit)}
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiBookOpen size={22} />
              </div>
            </div>
          </div>
        </section>

        {/* Balance Status */}

        <div
          className={`mb-6 flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
            totals.isBalanced
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-3">
            {totals.isBalanced ? (
              <FiCheckCircle className="text-xl text-emerald-600" />
            ) : (
              <FiAlertCircle className="text-xl text-amber-600" />
            )}

            <div>
              <h3
                className={`font-bold ${
                  totals.isBalanced ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {totals.isBalanced
                  ? "ميزان المراجعة متوازن"
                  : "يوجد فرق في الأرصدة"}
              </h3>

              <p
                className={`mt-1 text-xs ${
                  totals.isBalanced ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {totals.isBalanced
                  ? "إجمالي الأرصدة المدينة يساوي إجمالي الأرصدة الدائنة."
                  : "يرجى مراجعة الأرصدة الافتتاحية والقيود المحاسبية."}
              </p>
            </div>
          </div>

          <div className="text-sm font-bold">
            الفرق: {formatMoney(totals.difference)}
          </div>
        </div>

        {/* Main Table */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-800">
                تفاصيل ميزان المراجعة
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                عدد الحسابات المعروضة: {filteredRows.length}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 print:hidden">
              <FiEye size={15} />
              <span>الحسابات الرئيسية والفرعية</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-600">
                  <th
                    rowSpan={2}
                    className="border-b border-l border-slate-200 px-4 py-4 text-right"
                  >
                    الحساب
                  </th>

                  <th
                    colSpan={2}
                    className="border-b border-l border-slate-200 px-3 py-3 text-center"
                  >
                    رصيد أول المدة
                  </th>

                  <th
                    colSpan={2}
                    className="border-b border-l border-slate-200 px-3 py-3 text-center"
                  >
                    حركة الفترة
                  </th>

                  <th
                    colSpan={2}
                    className="border-b border-slate-200 px-3 py-3 text-center"
                  >
                    رصيد آخر المدة
                  </th>
                </tr>

                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="border-b border-l border-slate-200 px-3 py-3 text-left">
                    مدين
                  </th>

                  <th className="border-b border-l border-slate-200 px-3 py-3 text-left">
                    دائن
                  </th>

                  <th className="border-b border-l border-slate-200 px-3 py-3 text-left">
                    مدين
                  </th>

                  <th className="border-b border-l border-slate-200 px-3 py-3 text-left">
                    دائن
                  </th>

                  <th className="border-b border-l border-slate-200 px-3 py-3 text-left">
                    مدين
                  </th>

                  <th className="border-b border-slate-200 px-3 py-3 text-left">
                    دائن
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FiFileText className="text-4xl text-slate-300" />

                        <p className="font-semibold text-slate-600">
                          لا توجد حسابات لعرضها
                        </p>

                        <p className="text-xs text-slate-400">
                          جرب تغيير الفترة أو البحث أو تفعيل إظهار الحسابات
                          الصفرية.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ account, balance, depth }) => {
                    const isExpanded = expandedAccounts.has(account.id);

                    const closing = getDebitCredit(balance.closingNet);

                    const isZero =
                      Math.abs(balance.closingNet) < 0.001 &&
                      Math.abs(balance.periodDebit) < 0.001 &&
                      Math.abs(balance.periodCredit) < 0.001;

                    return (
                      <Fragment key={account.id}>
                        <tr
                          className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 ${
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
                              {calculatedData.childrenMap.get(account.id)
                                ?.length ? (
                                <button
                                  onClick={() => toggleAccount(account.id)}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 print:hidden"
                                >
                                  <FiChevronDown
                                    size={15}
                                    className={`transition-transform ${
                                      isExpanded ? "" : "rotate-90"
                                    }`}
                                  />
                                </button>
                              ) : (
                                <span className="w-6 shrink-0" />
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-bold text-slate-400 ${
                                      depth > 0 ? "" : "text-blue-600"
                                    }`}
                                  >
                                    {account.code}
                                  </span>

                                  <span
                                    className={`truncate ${
                                      account.isGroup
                                        ? "font-bold text-slate-800"
                                        : "font-medium text-slate-700"
                                    }`}
                                  >
                                    {account.name}
                                  </span>
                                </div>

                                {account.isGroup && (
                                  <span className="mt-1 block text-[10px] text-slate-400">
                                    حساب رئيسي
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <BalanceCells
                            net={balance.openingDebit - balance.openingCredit}
                          />

                          <td className="px-3 py-3 text-left tabular-nums">
                            <AmountCell value={balance.periodDebit} />
                          </td>

                          <td className="px-3 py-3 text-left tabular-nums">
                            <AmountCell value={balance.periodCredit} />
                          </td>

                          <td className="px-3 py-3 text-left tabular-nums">
                            <AmountCell value={closing.debit} />
                          </td>

                          <td className="px-3 py-3 text-left tabular-nums">
                            <AmountCell value={closing.credit} />
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })
                )}
              </tbody>

              {/* Totals */}

              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-800">
                  <td className="px-4 py-4">الإجمالي</td>

                  <td className="px-3 py-4 text-left tabular-nums">
                    {formatMoney(totals.opening.debit)}
                  </td>

                  <td className="px-3 py-4 text-left tabular-nums">
                    {formatMoney(totals.opening.credit)}
                  </td>

                  <td className="px-3 py-4 text-left tabular-nums">
                    {formatMoney(totals.periodDebit)}
                  </td>

                  <td className="px-3 py-4 text-left tabular-nums">
                    {formatMoney(totals.periodCredit)}
                  </td>

                  <td className="px-3 py-4 text-left tabular-nums">
                    {formatMoney(totals.closing.debit)}
                  </td>

                  <td className="px-3 py-4 text-left tabular-nums">
                    {formatMoney(totals.closing.credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Table Footer */}

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
            <div>تم احتساب الأرصدة بناءً على القيود المرحلة فقط.</div>

            <div>تاريخ التقرير: {formatDate(getLocalDate())}</div>
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
                <li>
                  • رصيد أول المدة يشمل الحركات التي تسبق تاريخ بداية الفترة.
                </li>

                <li>
                  • حركة الفترة تشمل القيود المرحلة والأرصدة الافتتاحية المؤرخة
                  داخل الفترة.
                </li>

                <li>
                  • رصيد آخر المدة يساوي رصيد أول المدة مضافًا إليه صافي حركة
                  الفترة.
                </li>

                <li>
                  • يتم تجميع أرصدة الحسابات الفرعية في الحسابات الرئيسية.
                </li>

                <li>
                  • إجمالي التقرير يعتمد على الحسابات القابلة للترحيل لتجنب
                  تكرار أرصدة الحسابات الرئيسية.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
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

          section {
            break-inside: avoid;
          }

          table {
            font-size: 10px !important;
          }

          th,
          td {
            padding: 6px !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </main>
  );
}
