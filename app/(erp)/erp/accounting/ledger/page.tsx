"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FiArrowRight,
  FiSearch,
  FiRefreshCw,
  FiBookOpen,
  FiCalendar,
  FiFilter,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiDollarSign,
  FiTrendingUp,
  FiDownload,
  FiChevronDown,
  FiChevronLeft,
  FiX,
} from "react-icons/fi";

import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

// ==========================================
// Types
// ==========================================

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  type: string;
  role: string;
  companyId: string;
  isActive?: boolean;
  status?: string;
}

interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type?: string;
  nature?: string;
  parentId?: string | null;
  isGroup?: boolean;
  isActive?: boolean;
  status?: string;
  extra?: Record<string, any>;
}

interface Journal {
  id: string;
  journalNumber: string;
  date: string;
  description: string;
  reference?: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  companyId: string;
}

interface JournalLine {
  id: string;
  journalId: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  companyId: string;
}

interface OpeningEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
  date: string;
  reference: string;
}

interface LedgerMovement {
  id: string;
  accountId: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  source: "opening" | "journal";
}

interface LedgerAccount {
  account: Account;

  openingDebit: number;
  openingCredit: number;

  periodDebit: number;
  periodCredit: number;

  closingDebit: number;
  closingCredit: number;

  openingNet: number;
  periodNet: number;
  closingNet: number;

  movements: LedgerMovement[];

  children: LedgerAccount[];

  level: number;
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

  const value = cookie.substring(name.length + 1);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthStart() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(`${value.substring(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getNumericValue(value: any): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getAccountExtra(account: Account) {
  return account.extra || {};
}

function isAccountActive(account: Account) {
  return account.isActive === true || account.status === "active";
}

function getAccountAllowPosting(account: Account) {
  const extra = getAccountExtra(account);

  return extra.allowPosting === true || extra.allowPosting === "true";
}

function isPostableAccount(account: Account) {
  return (
    account.isGroup !== true &&
    isAccountActive(account) &&
    getAccountAllowPosting(account)
  );
}

function getAccountName(account: Account) {
  return `${account.code || ""} - ${account.name || ""}`;
}

function splitBalance(net: number) {
  const rounded = Math.round(net * 100) / 100;

  return {
    debit: rounded > 0 ? rounded : 0,
    credit: rounded < 0 ? Math.abs(rounded) : 0,
  };
}

function normalizeDate(value: any) {
  if (!value) return "";

  return String(value).substring(0, 10);
}

function normalizeOpeningLines(
  records: any[],
  companyId: string,
): OpeningEntryLine[] {
  const result: OpeningEntryLine[] = [];

  for (const record of records) {
    if (String(record.companyId) !== companyId) continue;

    const extra = record.extra || {};

    const entryDate =
      normalizeDate(extra.date) ||
      normalizeDate(extra.entryDate) ||
      normalizeDate(record.createdAt);

    const reference = extra.reference || extra.entryNumber || record.id || "";

    const description =
      extra.description || extra.statement || extra.notes || "رصيد افتتاحي";

    // يدعم تخزين تفاصيل الحسابات داخل lines أو entries أو items
    const nestedLines = Array.isArray(extra.lines)
      ? extra.lines
      : Array.isArray(extra.entries)
        ? extra.entries
        : Array.isArray(extra.items)
          ? extra.items
          : null;

    if (nestedLines) {
      for (const line of nestedLines) {
        const accountId = line.accountId ?? line.account_id ?? "";

        if (!accountId) continue;

        result.push({
          accountId: String(accountId),
          debit: getNumericValue(line.debit),
          credit: getNumericValue(line.credit),
          description: line.description || line.statement || description,
          date: normalizeDate(line.date) || entryDate,
          reference: String(line.reference || reference),
        });
      }

      continue;
    }

    // يدعم أيضًا تخزين حساب واحد مباشرة داخل extra
    const accountId = extra.accountId ?? extra.account_id;

    if (accountId) {
      result.push({
        accountId: String(accountId),
        debit: getNumericValue(extra.debit),
        credit: getNumericValue(extra.credit),
        description,
        date: entryDate,
        reference: String(reference),
      });
    }
  }

  return result;
}

// ==========================================
// Page
// ==========================================

export default function GeneralLedgerPage() {
  const router = useRouter();

  // ========================================
  // User
  // ========================================

  const [user, setUser] = useState<CurrentUser | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [userLoading, setUserLoading] = useState(true);

  const [userError, setUserError] = useState("");

  // ========================================
  // Data
  // ========================================

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [journals, setJournals] = useState<Journal[]>([]);

  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);

  const [openingLines, setOpeningLines] = useState<OpeningEntryLine[]>([]);

  const [loading, setLoading] = useState(false);

  const [dataError, setDataError] = useState("");

  // ========================================
  // Filters
  // ========================================

  const [fromDate, setFromDate] = useState(getMonthStart());

  const [toDate, setToDate] = useState(getToday());

  const [search, setSearch] = useState("");

  const [showZeroBalances, setShowZeroBalances] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState("all");

  // ========================================
  // Expanded Accounts
  // ========================================

  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );

  const [showFilters, setShowFilters] = useState(false);

  // ========================================
  // Load User
  // ========================================

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        setUserLoading(true);
        setUserError("");

        const username = getCookie("username");

        if (!username) {
          throw new Error("يرجى تسجيل الدخول مجدداً");
        }

        const userData = await getUserByUsername(username);

        if (!userData) {
          throw new Error("المستخدم غير موجود");
        }

        if (userData.username !== username) {
          throw new Error("بيانات المستخدم غير صحيحة");
        }

        if (userData.type === "platform") {
          throw new Error(
            "مستخدم المنصة لا يمكنه الوصول إلى دفتر أستاذ الشركة",
          );
        }

        if (!userData.companyId) {
          throw new Error("المستخدم غير مرتبط بشركة");
        }

        if (userData.isActive === false || userData.status === "inactive") {
          throw new Error("هذا الحساب غير نشط");
        }

        if (ignore) return;

        const normalizedUser: CurrentUser = {
          id: String(userData.id),
          username: userData.username,
          name: userData.name || userData.username,
          type: userData.type,
          role: userData.role,
          companyId: String(userData.companyId),
          isActive: userData.isActive,
          status: userData.status,
        };

        setUser(normalizedUser);
        setCompanyId(String(userData.companyId));
      } catch (error) {
        console.error("Load User Error:", error);

        if (!ignore) {
          setUserError(
            error instanceof Error
              ? error.message
              : "تعذر تحميل بيانات المستخدم",
          );
        }
      } finally {
        if (!ignore) {
          setUserLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  // ========================================
  // Fetch Ledger Data
  // ========================================

  const fetchLedgerData = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setDataError("");

      const [
        accountsResult,
        journalsResult,
        journalLinesResult,
        openingEntriesResult,
      ] = await Promise.all([
        supabase.from("accounts").select("*").eq("companyId", companyId),

        supabase
          .from("journals")
          .select("*")
          .eq("companyId", companyId)
          .eq("status", "posted"),

        supabase.from("journalLines").select("*").eq("companyId", companyId),

        supabase.from("openingEntries").select("*").eq("companyId", companyId),
      ]);

      if (accountsResult.error) throw accountsResult.error;

      if (journalsResult.error) throw journalsResult.error;

      if (journalLinesResult.error) {
        throw journalLinesResult.error;
      }

      if (openingEntriesResult.error) {
        throw openingEntriesResult.error;
      }

      const normalizedAccounts = (accountsResult.data || []) as Account[];

      const normalizedJournals = (journalsResult.data || []) as Journal[];

      const normalizedJournalLines = (journalLinesResult.data ||
        []) as JournalLine[];

      // التأكد من أن البيانات تخص الشركة الحالية

      const companyAccounts = normalizedAccounts.filter(
        (account) => String(account.companyId) === companyId,
      );

      const companyJournals = normalizedJournals.filter(
        (journal) =>
          String(journal.companyId) === companyId &&
          journal.status === "posted",
      );

      const postedJournalIds = new Set(
        companyJournals.map((journal) => String(journal.id)),
      );

      const companyJournalLines = normalizedJournalLines.filter(
        (line) =>
          String(line.companyId) === companyId &&
          postedJournalIds.has(String(line.journalId)),
      );

      const normalizedOpeningLines = normalizeOpeningLines(
        openingEntriesResult.data || [],
        companyId,
      );

      setAccounts(companyAccounts);
      setJournals(companyJournals);
      setJournalLines(companyJournalLines);
      setOpeningLines(normalizedOpeningLines);

      setExpandedAccounts(
        new Set(
          companyAccounts
            .filter((account) => account.isGroup)
            .map((account) => String(account.id)),
        ),
      );
    } catch (error) {
      console.error("Fetch Ledger Error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "تعذر تحميل بيانات دفتر الأستاذ";

      setDataError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      void fetchLedgerData();
    }
  }, [companyId, fetchLedgerData]);

  // ========================================
  // Build Movements
  // ========================================

  const movements = useMemo<LedgerMovement[]>(() => {
    const result: LedgerMovement[] = [];

    // Opening Entries

    openingLines.forEach((line, index) => {
      if (!line.accountId) return;

      result.push({
        id: `opening-${index}`,
        accountId: line.accountId,
        date: line.date,
        reference: line.reference,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
        source: "opening",
      });
    });

    // Journal Movements

    const journalsMap = new Map<string, Journal>();

    journals.forEach((journal) => {
      journalsMap.set(String(journal.id), journal);
    });

    journalLines.forEach((line) => {
      const journal = journalsMap.get(String(line.journalId));

      if (!journal) return;

      result.push({
        id: String(line.id),
        accountId: String(line.accountId),
        date: normalizeDate(journal.date),
        reference: journal.journalNumber || journal.reference || "",
        description: line.description || journal.description || "",
        debit: getNumericValue(line.debit),
        credit: getNumericValue(line.credit),
        source: "journal",
      });
    });

    return result;
  }, [openingLines, journals, journalLines]);

  // ========================================
  // Calculate Account Balances
  // ========================================

  const ledgerAccounts = useMemo(() => {
    const accountMap = new Map<string, Account>();

    accounts.forEach((account) => {
      accountMap.set(String(account.id), account);
    });

    const resultMap = new Map<string, LedgerAccount>();

    // حساب أرصدة كل حساب

    accounts.forEach((account) => {
      const accountId = String(account.id);

      const accountMovements = movements.filter(
        (movement) => movement.accountId === accountId,
      );

      let openingNet = 0;
      let periodDebit = 0;
      let periodCredit = 0;

      accountMovements.forEach((movement) => {
        if (!movement.date) return;

        if (movement.date < fromDate) {
          openingNet += movement.debit - movement.credit;
        } else if (movement.date >= fromDate && movement.date <= toDate) {
          periodDebit += movement.debit;
          periodCredit += movement.credit;
        }
      });

      const openingBalance = splitBalance(openingNet);

      const closingNet = openingNet + periodDebit - periodCredit;

      const closingBalance = splitBalance(closingNet);

      resultMap.set(accountId, {
        account,

        openingDebit: openingBalance.debit,
        openingCredit: openingBalance.credit,

        periodDebit,
        periodCredit,

        closingDebit: closingBalance.debit,
        closingCredit: closingBalance.credit,

        openingNet,
        periodNet: periodDebit - periodCredit,
        closingNet,

        movements: accountMovements.filter(
          (movement) => movement.date >= fromDate && movement.date <= toDate,
        ),

        children: [],
        level: 0,
      });
    });

    // بناء شجرة الحسابات

    const roots: LedgerAccount[] = [];

    resultMap.forEach((ledgerAccount) => {
      const parentId = ledgerAccount.account.parentId
        ? String(ledgerAccount.account.parentId)
        : "";

      const parent = parentId ? resultMap.get(parentId) : undefined;

      if (parent && parent.account.id !== ledgerAccount.account.id) {
        parent.children.push(ledgerAccount);
      } else {
        roots.push(ledgerAccount);
      }
    });

    // ترتيب الحسابات

    const sortAccounts = (items: LedgerAccount[]) => {
      items.sort((a, b) =>
        String(a.account.code || "").localeCompare(
          String(b.account.code || ""),
          undefined,
          { numeric: true },
        ),
      );

      items.forEach((item) => sortAccounts(item.children));
    };

    sortAccounts(roots);

    // تجميع أرصدة الحسابات الفرعية في الحسابات الرئيسية

    const calculateTotals = (
      item: LedgerAccount,
      level: number,
    ): LedgerAccount => {
      item.level = level;

      item.children = item.children.map((child) =>
        calculateTotals(child, level + 1),
      );

      if (item.children.length > 0) {
        const childTotals = item.children.reduce(
          (totals, child) => ({
            openingNet: totals.openingNet + child.openingNet,
            periodDebit: totals.periodDebit + child.periodDebit,
            periodCredit: totals.periodCredit + child.periodCredit,
          }),
          {
            openingNet: 0,
            periodDebit: 0,
            periodCredit: 0,
          },
        );

        item.openingNet = childTotals.openingNet;
        item.periodDebit = childTotals.periodDebit;
        item.periodCredit = childTotals.periodCredit;

        item.periodNet = item.periodDebit - item.periodCredit;

        item.closingNet = item.openingNet + item.periodNet;

        const opening = splitBalance(item.openingNet);
        const closing = splitBalance(item.closingNet);

        item.openingDebit = opening.debit;
        item.openingCredit = opening.credit;

        item.closingDebit = closing.debit;
        item.closingCredit = closing.credit;
      }

      return item;
    };

    const tree = roots.map((item) => calculateTotals(item, 0));

    return tree;
  }, [accounts, movements, fromDate, toDate]);

  // ========================================
  // Flatten Accounts
  // ========================================

  const allLedgerAccounts = useMemo(() => {
    const result: LedgerAccount[] = [];

    const visit = (items: LedgerAccount[]) => {
      items.forEach((item) => {
        result.push(item);
        visit(item.children);
      });
    };

    visit(ledgerAccounts);

    return result;
  }, [ledgerAccounts]);

  // ========================================
  // Filter Accounts
  // ========================================

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matchesSearch = (item: LedgerAccount) => {
      const account = item.account;

      return (
        String(account.code || "")
          .toLowerCase()
          .includes(query) ||
        String(account.name || "")
          .toLowerCase()
          .includes(query)
      );
    };

    const hasBalance = (item: LedgerAccount) => {
      return (
        Math.abs(item.openingNet) >= 0.01 ||
        Math.abs(item.periodNet) >= 0.01 ||
        Math.abs(item.periodDebit) >= 0.01 ||
        Math.abs(item.periodCredit) >= 0.01 ||
        Math.abs(item.closingNet) >= 0.01
      );
    };

    const filterTree = (items: LedgerAccount[]): LedgerAccount[] => {
      return items.reduce<LedgerAccount[]>((result, item) => {
        const children = filterTree(item.children);

        const directMatch = matchesSearch(item);

        const accountMatch =
          selectedAccount === "all" ||
          String(item.account.id) === selectedAccount;

        const hasRelevantChild = children.length > 0;

        const visibleByBalance =
          showZeroBalances || hasBalance(item) || hasRelevantChild;

        if (
          (directMatch || hasRelevantChild) &&
          visibleByBalance &&
          accountMatch
        ) {
          result.push({
            ...item,
            children,
          });
        } else if (directMatch && visibleByBalance && !accountMatch) {
          // لا نعرض الحساب عند اختيار حساب مختلف
        }

        return result;
      }, []);
    };

    if (selectedAccount !== "all") {
      const selected = allLedgerAccounts.find(
        (item) => String(item.account.id) === selectedAccount,
      );

      return selected ? [selected] : [];
    }

    return filterTree(ledgerAccounts);
  }, [
    ledgerAccounts,
    allLedgerAccounts,
    search,
    showZeroBalances,
    selectedAccount,
  ]);

  // ========================================
  // Summary Totals
  // ========================================

  const summary = useMemo(() => {
    // إجماليات الحسابات النهائية فقط لتجنب تكرار أرصدة الآباء

    const finalAccounts = allLedgerAccounts.filter(
      (item) => item.children.length === 0,
    );

    return finalAccounts.reduce(
      (totals, item) => ({
        openingDebit: totals.openingDebit + item.openingDebit,

        openingCredit: totals.openingCredit + item.openingCredit,

        periodDebit: totals.periodDebit + item.periodDebit,

        periodCredit: totals.periodCredit + item.periodCredit,

        closingDebit: totals.closingDebit + item.closingDebit,

        closingCredit: totals.closingCredit + item.closingCredit,
      }),
      {
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      },
    );
  }, [allLedgerAccounts]);

  // ========================================
  // Expand / Collapse
  // ========================================

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts((previous) => {
      const updated = new Set(previous);

      if (updated.has(accountId)) {
        updated.delete(accountId);
      } else {
        updated.add(accountId);
      }

      return updated;
    });
  };

  const expandAll = () => {
    setExpandedAccounts(
      new Set(
        allLedgerAccounts
          .filter((item) => item.children.length > 0)
          .map((item) => String(item.account.id)),
      ),
    );
  };

  const collapseAll = () => {
    setExpandedAccounts(new Set());
  };

  // ========================================
  // Render Account Row
  // ========================================

  const renderAccountRows = (items: LedgerAccount[]): React.ReactNode => {
    return items.map((item) => {
      const accountId = String(item.account.id);

      const hasChildren = item.children.length > 0;

      const isExpanded = expandedAccounts.has(accountId);

      const isGroup = hasChildren || item.account.isGroup === true;

      return (
        <Fragment key={accountId}>
          <tr
            className={`border-b border-slate-100 transition hover:bg-blue-50/40 ${
              isGroup ? "bg-slate-50/70 font-semibold" : ""
            }`}
          >
            {/* Account */}

            <td className="px-4 py-3">
              <div
                className="flex items-center gap-2"
                style={{
                  paddingRight: `${item.level * 20}px`,
                }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleAccount(accountId)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                    title={isExpanded ? "طي الحساب" : "توسيع الحساب"}
                  >
                    {isExpanded ? (
                      <FiChevronDown size={15} />
                    ) : (
                      <FiChevronLeft size={15} />
                    )}
                  </button>
                ) : (
                  <span className="w-6 shrink-0" />
                )}

                <div className="min-w-0">
                  <p
                    className={`text-sm ${
                      isGroup
                        ? "font-bold text-slate-800"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {item.account.code}
                  </p>

                  <p className="text-xs text-slate-500">{item.account.name}</p>
                </div>
              </div>
            </td>

            {/* Opening Debit */}

            <td className="px-4 py-3 text-left text-blue-700">
              {formatCurrency(item.openingDebit)}
            </td>

            {/* Opening Credit */}

            <td className="px-4 py-3 text-left text-green-700">
              {formatCurrency(item.openingCredit)}
            </td>

            {/* Period Debit */}

            <td className="px-4 py-3 text-left text-blue-700">
              {formatCurrency(item.periodDebit)}
            </td>

            {/* Period Credit */}

            <td className="px-4 py-3 text-left text-green-700">
              {formatCurrency(item.periodCredit)}
            </td>

            {/* Closing Debit */}

            <td className="px-4 py-3 text-left font-semibold text-blue-800">
              {formatCurrency(item.closingDebit)}
            </td>

            {/* Closing Credit */}

            <td className="px-4 py-3 text-left font-semibold text-green-800">
              {formatCurrency(item.closingCredit)}
            </td>

            {/* Details */}

            <td className="px-4 py-3 text-center">
              {!isGroup && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/erp/accounting/ledger/${accountId}`)
                  }
                  title="عرض حركة الحساب"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                >
                  <FiEye size={16} />
                </button>
              )}
            </td>
          </tr>

          {hasChildren && isExpanded && renderAccountRows(item.children)}
        </Fragment>
      );
    });
  };

  // ========================================
  // Loading User
  // ========================================

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

  // ========================================
  // User Error
  // ========================================

  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <FiAlertCircle size={35} className="mx-auto mb-3 text-red-500" />

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

  // ========================================
  // UI
  // ========================================

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            onClick={() => router.push("/erp/accounting")}
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
          >
            <FiArrowRight />
            العودة إلى المحاسبة
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            دفتر الأستاذ العام
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            متابعة أرصدة الحسابات والحركات المدينة والدائنة خلال الفترة المحددة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <FiBookOpen size={18} />

            <span>
              الشركة: <strong>{user?.name || "الشركة الحالية"}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => void fetchLedgerData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiFilter className="text-blue-600" size={19} />

            <h2 className="font-bold text-slate-800">خيارات دفتر الأستاذ</h2>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {showFilters ? "إخفاء الخيارات" : "عرض الخيارات"}
            <FiChevronDown
              className={`transition ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Search */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              البحث عن حساب
            </label>

            <div className="relative">
              <FiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث برقم الحساب أو اسمه..."
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Account Selection */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              تحديد حساب
            </label>

            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">جميع الحسابات</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {getAccountName(account)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
            {/* From Date */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                من تاريخ
              </label>

              <div className="relative">
                <FiCalendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />

                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* To Date */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                إلى تاريخ
              </label>

              <div className="relative">
                <FiCalendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />

                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={getToday()}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Zero Balances */}

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  الحسابات ذات الأرصدة الصفرية
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  إظهار الحسابات التي لا تحتوي على حركات أو أرصدة
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowZeroBalances((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  showZeroBalances
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 bg-white text-slate-600"
                }`}
              >
                {showZeroBalances ? (
                  <FiEye size={16} />
                ) : (
                  <FiEyeOff size={16} />
                )}

                {showZeroBalances ? "مفعّل" : "غير مفعّل"}
              </button>
            </div>
          </div>
        )}

        {/* Reset Filters */}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFromDate(getMonthStart());
              setToDate(getToday());
              setSearch("");
              setSelectedAccount("all");
              setShowZeroBalances(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <FiX size={14} />
            إعادة ضبط الفلاتر
          </button>

          <span className="text-xs text-slate-400">
            الفترة: {formatDate(fromDate)} - {formatDate(toDate)}
          </span>
        </div>
      </div>

      {/* Loading */}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            جارٍ تحميل بيانات دفتر الأستاذ...
          </p>
        </div>
      ) : dataError ? (
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <FiAlertCircle size={35} className="mx-auto mb-3 text-red-500" />

          <h3 className="font-bold text-red-700">تعذر تحميل دفتر الأستاذ</h3>

          <p className="mt-2 text-sm text-slate-600">{dataError}</p>

          <button
            type="button"
            onClick={() => void fetchLedgerData()}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  إجمالي حركة المدين
                </span>

                <FiTrendingUp size={20} className="text-blue-600" />
              </div>

              <p className="mt-3 text-xl font-bold text-blue-800">
                {formatCurrency(summary.periodDebit)}
              </p>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">
                  إجمالي حركة الدائن
                </span>

                <FiTrendingUp size={20} className="text-green-600" />
              </div>

              <p className="mt-3 text-xl font-bold text-green-800">
                {formatCurrency(summary.periodCredit)}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-indigo-700">رصيد أول المدة</span>

                <FiDollarSign size={20} className="text-indigo-600" />
              </div>

              <p className="mt-3 text-xl font-bold text-indigo-800">
                {formatCurrency(summary.openingDebit - summary.openingCredit)}
              </p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">رصيد آخر المدة</span>

                <FiDollarSign size={20} className="text-purple-600" />
              </div>

              <p className="mt-3 text-xl font-bold text-purple-800">
                {formatCurrency(summary.closingDebit - summary.closingCredit)}
              </p>
            </div>
          </div>

          {/* Ledger Table */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-800">
                  أرصدة وحركات الحسابات
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  الأرصدة الافتتاحية والحركات خلال الفترة ورصيد الإقفال
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  توسيع الكل
                </button>

                <button
                  type="button"
                  onClick={collapseAll}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  طي الكل
                </button>
              </div>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="p-12 text-center">
                <FiBookOpen size={38} className="mx-auto mb-3 text-slate-300" />

                <h3 className="font-semibold text-slate-700">
                  لا توجد حسابات مطابقة
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  لم يتم العثور على حسابات تطابق خيارات البحث والفلاتر المحددة.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] text-right text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-xs text-slate-600">
                      <th
                        rowSpan={2}
                        className="min-w-[240px] border-b border-l border-slate-200 px-4 py-4"
                      >
                        الحساب
                      </th>

                      <th
                        colSpan={2}
                        className="border-b border-l border-slate-200 px-4 py-3 text-center text-indigo-700"
                      >
                        رصيد أول المدة
                      </th>

                      <th
                        colSpan={2}
                        className="border-b border-l border-slate-200 px-4 py-3 text-center text-blue-700"
                      >
                        حركة الفترة
                      </th>

                      <th
                        colSpan={2}
                        className="border-b border-l border-slate-200 px-4 py-3 text-center text-green-700"
                      >
                        رصيد آخر المدة
                      </th>

                      <th
                        rowSpan={2}
                        className="w-20 border-b border-slate-200 px-4 py-4 text-center"
                      >
                        التفاصيل
                      </th>
                    </tr>

                    <tr className="bg-slate-50 text-xs text-slate-500">
                      <th className="border-l border-slate-200 px-4 py-3 text-left">
                        مدين
                      </th>

                      <th className="border-l border-slate-200 px-4 py-3 text-left">
                        دائن
                      </th>

                      <th className="border-l border-slate-200 px-4 py-3 text-left">
                        مدين
                      </th>

                      <th className="border-l border-slate-200 px-4 py-3 text-left">
                        دائن
                      </th>

                      <th className="border-l border-slate-200 px-4 py-3 text-left">
                        مدين
                      </th>

                      <th className="border-l border-slate-200 px-4 py-3 text-left">
                        دائن
                      </th>
                    </tr>
                  </thead>

                  <tbody>{renderAccountRows(filteredAccounts)}</tbody>

                  <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                    <tr>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        الإجمالي
                      </td>

                      <td className="px-4 py-4 text-left font-bold text-indigo-700">
                        {formatCurrency(summary.openingDebit)}
                      </td>

                      <td className="px-4 py-4 text-left font-bold text-indigo-700">
                        {formatCurrency(summary.openingCredit)}
                      </td>

                      <td className="px-4 py-4 text-left font-bold text-blue-700">
                        {formatCurrency(summary.periodDebit)}
                      </td>

                      <td className="px-4 py-4 text-left font-bold text-blue-700">
                        {formatCurrency(summary.periodCredit)}
                      </td>

                      <td className="px-4 py-4 text-left font-bold text-green-700">
                        {formatCurrency(summary.closingDebit)}
                      </td>

                      <td className="px-4 py-4 text-left font-bold text-green-700">
                        {formatCurrency(summary.closingCredit)}
                      </td>

                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Footer */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs text-slate-500">
                عدد الحسابات: {allLedgerAccounts.length}
              </p>

              <p className="text-xs text-slate-500">
                الحركات المعروضة تعتمد على القيود المرحلة فقط.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
