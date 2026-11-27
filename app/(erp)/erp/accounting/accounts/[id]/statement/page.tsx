"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  FiArrowRight,
  FiCalendar,
  FiRefreshCw,
  FiSearch,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiDownload,
  FiPackage,
  FiPrinter,
  FiActivity,
  FiInfo,
} from "react-icons/fi";

import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import { getUserByUsername } from "@/lib/api/users";
import { getAccounts } from "@/lib/api/accounts";
import { getJournals } from "@/lib/api/journals";
import { getJournalLines } from "@/lib/api/journalLines";
import { getInventoryMovements } from "@/lib/api/inventoryMovements";

// =====================================================
// TYPES
// =====================================================

type AccountId = string | number;

type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

type AccountNature = "debit" | "credit";

interface Account {
  id: AccountId;
  code: string;
  name: string;
  nameEn?: string;
  type: AccountType;
  nature: AccountNature;
  parentId?: AccountId | null;
  isGroup?: boolean;
  allowPosting?: boolean;
  isActive?: boolean;
  status?: string;
  companyId: string;
  balance?: number;
}

interface CurrentUser {
  id: AccountId;
  username: string;
  type: string;
  companyId?: AccountId;
  name?: string;
  companyname?: string;
  isActive?: boolean;
  status?: string;
}

interface Journal {
  id: AccountId;
  journalNumber?: string;
  entryNumber?: string;
  date: string;
  description?: string;
  reference?: string;
  referenceNumber?: string;
  status: string;
  companyId: string;
}

interface JournalLine {
  id: AccountId;
  journalId: AccountId;
  accountId: AccountId;
  debit: number;
  credit: number;
  companyId: string;
  status?: string;
  description?: string;
  date?: string;
}

interface OpeningEntry {
  id: AccountId;
  accountId: AccountId;
  date: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
  companyId: string;
}

interface InventoryMovement {
  id: AccountId;
  companyId: string;

  productId?: AccountId;
  productName?: string;

  warehouseId?: AccountId;
  warehouseName?: string;

  date?: string;
  createdAt?: string;

  type?: string;
  movementType?: string;
  transactionType?: string;

  reference?: string;
  referenceNumber?: string;
  documentNumber?: string;

  description?: string;
  notes?: string;

  quantity?: number;
  unitCost?: number;
  purchasePrice?: number;
  totalCost?: number;
  cost?: number;
  amount?: number;

  status?: string;

  [key: string]: unknown;
}

interface StatementRow {
  id: string;
  date: string;
  documentNumber: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  source: "opening" | "journal";
}

interface InventoryRow {
  id: string;
  date: string;
  documentNumber: string;
  description: string;
  productName: string;
  warehouseName: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string;
}

// =====================================================
// AUTH HELPERS
// =====================================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.substring(name.length + 1));
  } catch {
    return cookie.substring(name.length + 1);
  }
}

/**
 * تحديد اسم المستخدم الحالي:
 * 1. البحث في Cookie باسم username.
 * 2. إذا لم يوجد، البحث في localStorage داخل authUser.
 */
function getCurrentUsername(): string | null {
  const cookieUsername = getCookie("username");

  if (cookieUsername) {
    return cookieUsername;
  }

  if (typeof window !== "undefined") {
    try {
      const authUser = localStorage.getItem("authUser");

      if (authUser) {
        const user = JSON.parse(authUser);

        if (user?.username) {
          return String(user.username);
        }
      }
    } catch (error) {
      console.error("Error reading authUser:", error);
    }
  }

  return null;
}

// =====================================================
// GENERAL HELPERS
// =====================================================

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  if (!value) return "-";

  const dateValue = value.substring(0, 10);
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getAccountTypeName(type: AccountType) {
  const types: Record<AccountType, string> = {
    asset: "الأصول",
    liability: "الالتزامات",
    equity: "حقوق الملكية",
    revenue: "الإيرادات",
    expense: "المصروفات",
  };

  return types[type] || "غير محدد";
}

function normalizeDate(value?: string) {
  if (!value) return "";

  return String(value).substring(0, 10);
}

function sameId(
  first: AccountId | null | undefined,
  second: AccountId | null | undefined,
) {
  return String(first ?? "") === String(second ?? "");
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);

  return Number.isFinite(number) ? number : 0;
}

function getBalance(
  previous: number,
  debit: number,
  credit: number,
  nature: AccountNature,
) {
  if (nature === "debit") {
    return previous + debit - credit;
  }

  return previous + credit - debit;
}

/**
 * دعم البيانات المباشرة والبيانات الموجودة داخل extra.
 */
function normalizeRecord<T extends Record<string, unknown>>(
  row: Record<string, unknown>,
): T {
  let extra: Record<string, unknown> = {};

  if (row.extra && typeof row.extra === "object") {
    extra = row.extra as Record<string, unknown>;
  } else if (typeof row.extra === "string") {
    try {
      const parsed = JSON.parse(row.extra);

      if (parsed && typeof parsed === "object") {
        extra = parsed;
      }
    } catch {
      extra = {};
    }
  }

  return {
    ...extra,
    ...row,
  } as T;
}

function getMovementTypeName(type?: string) {
  if (!type) return "حركة مخزنية";

  const value = type.toLowerCase();

  if (value.includes("transfer")) {
    return "تحويل مخزني";
  }

  if (
    value === "purchase_in" ||
    value === "in" ||
    value === "receipt" ||
    value === "transfer_in" ||
    value === "adjustment_in"
  ) {
    return "إضافة للمخزون";
  }

  if (
    value === "sale" ||
    value === "out" ||
    value === "transfer_out" ||
    value === "adjustment_out" ||
    value === "issue"
  ) {
    return "صرف من المخزون";
  }

  if (value.includes("return")) {
    return "مرتجع";
  }

  if (value.includes("adjust")) {
    return "تسوية مخزنية";
  }

  return type;
}

function getMovementAmount(movement: InventoryMovement) {
  if (movement.totalCost !== undefined) {
    return toNumber(movement.totalCost);
  }

  if (movement.amount !== undefined) {
    return toNumber(movement.amount);
  }

  if (movement.cost !== undefined) {
    return toNumber(movement.cost);
  }

  return (
    toNumber(movement.quantity) *
    toNumber(movement.unitCost ?? movement.purchasePrice)
  );
}

function escapeCSV(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function isPosted(status?: string) {
  return String(status || "").toLowerCase() === "posted";
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AccountStatementPage() {
  const router = useRouter();
  const params = useParams();

  const accountId = String(params.id);

  // ===================================================
  // STATE
  // ===================================================

  const [account, setAccount] = useState<Account | null>(null);

  const [journals, setJournals] = useState<Journal[]>([]);

  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);

  const [openingEntries, setOpeningEntries] = useState<OpeningEntry[]>([]);

  const [inventoryMovements, setInventoryMovements] = useState<
    InventoryMovement[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState(getStartOfYear());

  const [endDate, setEndDate] = useState(getToday());

  const [companyId, setCompanyId] = useState("");

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = useCallback(
    async (showRefresh = false, isCurrent: () => boolean = () => true) => {
      if (showRefresh) {
        if (isCurrent()) setRefreshing(true);
      } else {
        if (isCurrent()) setLoading(true);
      }

      if (isCurrent()) setError("");

      try {
        // -----------------------------------------------
        // المستخدم الحالي
        // -----------------------------------------------

        const username = getCurrentUsername();

        if (!username) {
          throw new Error(
            "لم يتم العثور على المستخدم الحالي. يرجى تسجيل الدخول مرة أخرى.",
          );
        }

        const user = await getUserByUsername(username);

        if (!isCurrent()) return;

        if (!user) {
          throw new Error(
            "لم يتم العثور على بيانات المستخدم في قاعدة البيانات",
          );
        }

        if (user.type === "platform") {
          throw new Error("لا يمكن لمستخدم المنصة عرض كشف حساب الشركة");
        }

        if (!user.companyId) {
          throw new Error("المستخدم غير مرتبط بشركة");
        }

        if (
          user.isActive === false ||
          (user.status && user.status !== "active")
        ) {
          throw new Error("حساب المستخدم غير نشط");
        }

        const currentCompanyId = String(user.companyId);

        if (isCurrent()) {
          setCompanyId(currentCompanyId);
        }

        // -----------------------------------------------
        // حسابات الشركة الحالية
        // -----------------------------------------------

        const allAccounts = await getAccounts(currentCompanyId);

        if (!isCurrent()) return;

        const currentAccount = allAccounts.find((item) =>
          sameId(item.id, accountId),
        );

        if (!currentAccount) {
          throw new Error("الحساب غير موجود ضمن حسابات شركتك");
        }

        if (!sameId(currentAccount.companyId, currentCompanyId)) {
          throw new Error("هذا الحساب لا يتبع شركتك");
        }

        if (isCurrent()) {
          setAccount(currentAccount as Account);
        }

        // -----------------------------------------------
        // جلب بيانات الشركة
        // -----------------------------------------------

        const [allJournals, allJournalLines, allInventoryMovements] =
          await Promise.all([
            getJournals(currentCompanyId),
            getJournalLines(currentCompanyId),
            getInventoryMovements(currentCompanyId),
          ]);

        if (!isCurrent()) return;

        // -----------------------------------------------
        // تطبيع بيانات القيود
        // -----------------------------------------------

        const normalizedJournals = (
          (allJournals || []) as unknown as Record<string, unknown>[]
        ).map((row) => normalizeRecord<Journal>(row));

        const normalizedLines = (
          (allJournalLines || []) as unknown as Record<string, unknown>[]
        ).map((row) => normalizeRecord<JournalLine>(row));

        const normalizedMovements = (
          (allInventoryMovements || []) as unknown as Record<string, unknown>[]
        ).map((row) => normalizeRecord<InventoryMovement>(row));

        // -----------------------------------------------
        // قيود الشركة
        // -----------------------------------------------

        const companyJournals = normalizedJournals.filter((journal) =>
          sameId(journal.companyId, currentCompanyId),
        );

        const companyJournalIds = new Set(
          companyJournals.map((journal) => String(journal.id)),
        );

        // -----------------------------------------------
        // تفاصيل القيود الخاصة بالحساب
        // -----------------------------------------------

        const companyLines = normalizedLines.filter(
          (line) =>
            sameId(line.companyId, currentCompanyId) &&
            sameId(line.accountId, accountId) &&
            companyJournalIds.has(String(line.journalId)),
        );

        // -----------------------------------------------
        // الأرصدة الافتتاحية
        // -----------------------------------------------

        const { data: openingData, error: openingError } = await supabase
          .from("openingEntries")
          .select("*")
          .eq("companyId", currentCompanyId);

        if (!isCurrent()) return;

        if (openingError) {
          throw new Error(
            `تعذر تحميل الأرصدة الافتتاحية: ${openingError.message}`,
          );
        }

        const normalizedOpeningEntries = (
          (openingData || []) as unknown as Record<string, unknown>[]
        ).map((row) => normalizeRecord<OpeningEntry>(row));

        const companyOpeningEntries = normalizedOpeningEntries.filter(
          (entry) =>
            sameId(entry.companyId, currentCompanyId) &&
            sameId(entry.accountId, accountId),
        );

        // -----------------------------------------------
        // حركات المخزون التابعة للشركة
        // -----------------------------------------------

        const companyMovements = normalizedMovements.filter((movement) =>
          sameId(movement.companyId, currentCompanyId),
        );

        // -----------------------------------------------
        // تحديث الحالات
        // -----------------------------------------------

        if (!isCurrent()) return;

        setJournals(companyJournals);
        setJournalLines(companyLines);
        setOpeningEntries(companyOpeningEntries);
        setInventoryMovements(companyMovements);
      } catch (err) {
        console.error("Account statement error:", err);

        const message =
          err instanceof Error ? err.message : "تعذر تحميل كشف الحساب";

        if (isCurrent()) {
          setError(message);
          toast.error(message);
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [accountId],
  );

  // ===================================================
  // EFFECT
  // ===================================================

  useEffect(() => {
    let ignore = false;

    void loadData(false, () => !ignore);

    return () => {
      ignore = true;
    };
  }, [loadData]);

  // ===================================================
  // FINANCIAL STATEMENT
  // ===================================================

  const statement = useMemo(() => {
    if (!account) {
      return {
        rows: [] as StatementRow[],
        openingBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        closingBalance: 0,
      };
    }

    const postedJournals = journals.filter(
      (journal) =>
        isPosted(journal.status) && sameId(journal.companyId, companyId),
    );

    const journalMap = new Map(
      postedJournals.map((journal) => [String(journal.id), journal]),
    );

    const events: {
      id: string;
      date: string;
      documentNumber: string;
      description: string;
      reference: string;
      debit: number;
      credit: number;
      source: "opening" | "journal";
    }[] = [];

    // -----------------------------------------------
    // الأرصدة الافتتاحية
    // -----------------------------------------------

    openingEntries.forEach((entry) => {
      const date = normalizeDate(entry.date);

      if (!date) return;

      events.push({
        id: `opening-${entry.id}`,
        date,
        documentNumber: `OPEN-${entry.id}`,
        description: entry.description || "رصيد افتتاحي",
        reference: entry.reference || "-",
        debit: toNumber(entry.debit),
        credit: toNumber(entry.credit),
        source: "opening",
      });
    });

    // -----------------------------------------------
    // القيود المرحلة
    // -----------------------------------------------

    journalLines.forEach((line) => {
      const journal = journalMap.get(String(line.journalId));

      if (!journal) return;

      const date = normalizeDate(journal.date || line.date);

      if (!date) return;

      events.push({
        id: `journal-${line.id}`,
        date,
        documentNumber:
          journal.journalNumber || journal.entryNumber || String(journal.id),
        description: line.description || journal.description || "قيد يومية",
        reference: journal.reference || journal.referenceNumber || "-",
        debit: toNumber(line.debit),
        credit: toNumber(line.credit),
        source: "journal",
      });
    });

    // -----------------------------------------------
    // ترتيب الحركات
    // -----------------------------------------------

    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.id.localeCompare(b.id);
    });

    // -----------------------------------------------
    // الرصيد قبل الفترة
    // -----------------------------------------------

    let openingBalance = 0;

    events.forEach((event) => {
      if (event.date < startDate) {
        openingBalance = getBalance(
          openingBalance,
          event.debit,
          event.credit,
          account.nature,
        );
      }
    });

    // -----------------------------------------------
    // حركات الفترة
    // -----------------------------------------------

    const periodEvents = events.filter(
      (event) => event.date >= startDate && event.date <= endDate,
    );

    let runningBalance = openingBalance;

    let totalDebit = 0;
    let totalCredit = 0;

    const rows: StatementRow[] = periodEvents.map((event) => {
      totalDebit += event.debit;
      totalCredit += event.credit;

      runningBalance = getBalance(
        runningBalance,
        event.debit,
        event.credit,
        account.nature,
      );

      return {
        ...event,
        balance: runningBalance,
      };
    });

    return {
      rows,
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance: runningBalance,
    };
  }, [
    account,
    journals,
    journalLines,
    openingEntries,
    startDate,
    endDate,
    companyId,
  ]);

  // ===================================================
  // INVENTORY STATEMENT
  // ===================================================

  const inventoryStatement = useMemo(() => {
    if (!account || account.code !== "1104") {
      return {
        rows: [] as InventoryRow[],
        totalQuantity: 0,
        totalCost: 0,
      };
    }

    const rows: InventoryRow[] = [];

    inventoryMovements.forEach((movement) => {
      const date = normalizeDate(movement.date || movement.createdAt);

      if (!date) return;

      if (date < startDate || date > endDate) {
        return;
      }

      if (movement.status === "cancelled" || movement.status === "void") {
        return;
      }

      const movementType =
        movement.movementType ||
        movement.transactionType ||
        movement.type ||
        "";

      const quantity = toNumber(movement.quantity);

      const unitCost = toNumber(movement.unitCost ?? movement.purchasePrice);

      const totalCost = getMovementAmount(movement);

      rows.push({
        id: String(movement.id),
        date,
        documentNumber:
          movement.documentNumber ||
          movement.referenceNumber ||
          movement.reference ||
          String(movement.id),
        description:
          movement.description ||
          movement.notes ||
          getMovementTypeName(String(movementType)),
        productName: movement.productName || String(movement.productId || "-"),
        warehouseName:
          movement.warehouseName || String(movement.warehouseId || "-"),
        movementType: getMovementTypeName(String(movementType)),
        quantity,
        unitCost,
        totalCost,
        reference: movement.reference || movement.referenceNumber || "-",
      });
    });

    rows.sort((a, b) => a.date.localeCompare(b.date));

    return {
      rows,
      totalQuantity: rows.reduce(
        (total, row) => total + Math.abs(row.quantity),
        0,
      ),
      totalCost: rows.reduce(
        (total, row) => total + Math.abs(row.totalCost),
        0,
      ),
    };
  }, [account, inventoryMovements, startDate, endDate]);

  // ===================================================
  // BALANCE DISPLAY
  // ===================================================

  function getBalanceSide(balance: number) {
    if (Math.abs(balance) < 0.000001) {
      return "متزن";
    }

    const isDebit = account?.nature === "debit" ? balance > 0 : balance < 0;

    return isDebit ? "مدين" : "دائن";
  }

  function getBalanceAmount(balance: number) {
    return formatNumber(Math.abs(balance));
  }

  // ===================================================
  // DATE VALIDATION
  // ===================================================

  function validateDates() {
    if (!startDate || !endDate) {
      toast.error("يرجى تحديد تاريخ البداية والنهاية");
      return false;
    }

    if (startDate > endDate) {
      toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return false;
    }

    if (endDate > getToday()) {
      toast.error("لا يمكن اختيار تاريخ مستقبلي");
      return false;
    }

    return true;
  }

  function handleSearch() {
    if (!validateDates()) return;

    toast.success("تم تحديث كشف الحساب");
  }

  function resetDates() {
    setStartDate(getStartOfYear());
    setEndDate(getToday());
  }

  // ===================================================
  // EXPORT FINANCIAL CSV
  // ===================================================

  function exportFinancialCSV() {
    if (!account) return;

    const headers = [
      "التاريخ",
      "رقم المستند",
      "البيان",
      "المرجع",
      "مدين",
      "دائن",
      "الرصيد",
      "طبيعة الرصيد",
    ];

    const rows = statement.rows.map((row) => [
      row.date,
      row.documentNumber,
      row.description,
      row.reference,
      row.debit,
      row.credit,
      Math.abs(row.balance),
      getBalanceSide(row.balance),
    ]);

    const content = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `account-${account.code}-statement.csv`;

    link.click();

    URL.revokeObjectURL(url);

    toast.success("تم تصدير الكشف المحاسبي");
  }

  // ===================================================
  // EXPORT INVENTORY CSV
  // ===================================================

  function exportInventoryCSV() {
    const headers = [
      "التاريخ",
      "رقم المستند",
      "المنتج",
      "المستودع",
      "نوع الحركة",
      "الكمية",
      "سعر التكلفة",
      "إجمالي التكلفة",
      "المرجع",
    ];

    const rows = inventoryStatement.rows.map((row) => [
      row.date,
      row.documentNumber,
      row.productName,
      row.warehouseName,
      row.movementType,
      row.quantity,
      row.unitCost,
      row.totalCost,
      row.reference,
    ]);

    const content = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "inventory-movements.csv";

    link.click();

    URL.revokeObjectURL(url);

    toast.success("تم تصدير حركات المخزون");
  }

  // ===================================================
  // PRINT
  // ===================================================

  function handlePrint() {
    window.print();
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <FiRefreshCw size={20} className="animate-spin" />
          جاري تحميل كشف الحساب...
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error || !account) {
    return (
      <div
        dir="rtl"
        className="m-6 rounded-xl border border-red-200 bg-red-50 p-6"
      >
        <h2 className="font-bold text-red-700">تعذر فتح كشف الحساب</h2>

        <p className="mt-2 text-sm text-red-600">
          {error || "الحساب غير موجود"}
        </p>

        <button
          onClick={() => loadData()}
          disabled={refreshing}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6 print:p-0">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>المحاسبة</span>
            <span>/</span>
            <span>دليل الحسابات</span>
            <span>/</span>
            <span className="text-blue-600">كشف الحساب</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-gray-800">كشف حساب</h1>

          <p className="mt-1 text-sm text-gray-500">
            عرض الأرصدة والحركات المحاسبية والمخزنية
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiPrinter />
            طباعة
          </button>

          <button
            onClick={() => router.push("/erp/accounting/accounts")}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FiArrowRight size={17} />
            العودة للحسابات
          </button>
        </div>
      </div>

      {/* ACCOUNT INFORMATION */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-mono text-sm font-bold text-blue-700">
                {account.code}
              </span>

              <h2 className="text-xl font-bold text-gray-800">
                {account.name}
              </h2>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>التصنيف: {getAccountTypeName(account.type)}</span>

              <span>
                الطبيعة:
                {account.nature === "debit" ? " مدين" : " دائن"}
              </span>

              <span>
                الحالة:
                {account.isActive === false || account.status === "inactive"
                  ? " غير نشط"
                  : " نشط"}
              </span>

              <span>الشركة: {companyId}</span>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">نوع الحساب</p>

            <p className="mt-1 font-bold text-gray-800">
              {account.isGroup ? "حساب تجميعي" : "حساب قابل للترحيل"}
            </p>
          </div>
        </div>
      </section>

      {/* DATE FILTER */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
        <div className="mb-5 flex items-center gap-2">
          <FiCalendar className="text-blue-600" />

          <h2 className="font-bold text-gray-800">تحديد الفترة المحاسبية</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              من تاريخ
            </label>

            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              إلى تاريخ
            </label>

            <input
              type="date"
              value={endDate}
              min={startDate}
              max={getToday()}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              <FiSearch size={17} />
              عرض الكشف
            </button>

            <button
              onClick={resetDates}
              title="إعادة تعيين الفترة"
              className="rounded-lg border border-gray-300 p-3 text-gray-600 hover:bg-gray-50"
            >
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* FINANCIAL SUMMARY */}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <FiDollarSign className="text-blue-600" />

          <h2 className="font-bold text-gray-800">الملخص المحاسبي</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="الرصيد الافتتاحي"
            value={getBalanceAmount(statement.openingBalance)}
            subtitle={getBalanceSide(statement.openingBalance)}
            icon={<FiDollarSign />}
            color="blue"
          />

          <SummaryCard
            title="إجمالي المدين"
            value={formatNumber(statement.totalDebit)}
            subtitle="حركة مدين خلال الفترة"
            icon={<FiTrendingUp />}
            color="green"
          />

          <SummaryCard
            title="إجمالي الدائن"
            value={formatNumber(statement.totalCredit)}
            subtitle="حركة دائن خلال الفترة"
            icon={<FiTrendingDown />}
            color="red"
          />

          <SummaryCard
            title="الرصيد الختامي"
            value={getBalanceAmount(statement.closingBalance)}
            subtitle={getBalanceSide(statement.closingBalance)}
            icon={<FiFileText />}
            color="indigo"
          />
        </div>
      </div>

      {/* FINANCIAL STATEMENT */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-gray-800">كشف الحركات المحاسبية</h2>

            <p className="mt-1 text-xs text-gray-500">
              من {formatDate(startDate)} إلى {formatDate(endDate)}
            </p>
          </div>

          <button
            onClick={exportFinancialCSV}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 print:hidden"
          >
            <FiDownload size={15} />
            تصدير CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-right">
            <thead className="bg-gray-50 text-xs font-bold text-gray-600">
              <tr>
                <th className="px-4 py-4">التاريخ</th>
                <th className="px-4 py-4">رقم المستند</th>
                <th className="px-4 py-4">البيان</th>
                <th className="px-4 py-4">المرجع</th>
                <th className="px-4 py-4">مدين</th>
                <th className="px-4 py-4">دائن</th>
                <th className="px-4 py-4">الرصيد</th>
                <th className="px-4 py-4">الطبيعة</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              <tr className="bg-blue-50/60">
                <td colSpan={4} className="px-4 py-4 font-bold text-blue-800">
                  الرصيد الافتتاحي للفترة
                </td>

                <td className="px-4 py-4">-</td>
                <td className="px-4 py-4">-</td>

                <td className="px-4 py-4 font-bold text-blue-800">
                  {getBalanceAmount(statement.openingBalance)}
                </td>

                <td className="px-4 py-4 font-bold text-blue-800">
                  {getBalanceSide(statement.openingBalance)}
                </td>
              </tr>

              {statement.rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                    {formatDate(row.date)}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                      {row.documentNumber}
                    </span>
                  </td>

                  <td className="max-w-[250px] px-4 py-4 text-gray-700">
                    {row.description}

                    {row.source === "opening" && (
                      <span className="mr-2 rounded bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                        رصيد افتتاحي
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-gray-500">{row.reference}</td>

                  <td className="px-4 py-4 font-medium text-green-700">
                    {row.debit > 0 ? formatNumber(row.debit) : "-"}
                  </td>

                  <td className="px-4 py-4 font-medium text-red-700">
                    {row.credit > 0 ? formatNumber(row.credit) : "-"}
                  </td>

                  <td className="px-4 py-4 font-bold text-gray-800">
                    {getBalanceAmount(row.balance)}
                  </td>

                  <td className="px-4 py-4">
                    <BalanceBadge
                      balance={row.balance}
                      side={getBalanceSide(row.balance)}
                    />
                  </td>
                </tr>
              ))}

              {statement.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    لا توجد حركات محاسبية خلال الفترة المحددة.
                  </td>
                </tr>
              )}

              <tr className="bg-gray-50 font-bold">
                <td colSpan={4} className="px-4 py-4 text-gray-800">
                  إجمالي الحركات
                </td>

                <td className="px-4 py-4 text-green-700">
                  {formatNumber(statement.totalDebit)}
                </td>

                <td className="px-4 py-4 text-red-700">
                  {formatNumber(statement.totalCredit)}
                </td>

                <td className="px-4 py-4 text-gray-800">
                  {getBalanceAmount(statement.closingBalance)}
                </td>

                <td className="px-4 py-4 text-gray-700">
                  {getBalanceSide(statement.closingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 bg-gray-50 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">عدد الحركات</p>

            <p className="mt-1 font-bold text-gray-800">
              {statement.rows.length}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">صافي الحركة</p>

            <p className="mt-1 font-bold text-gray-800">
              {formatNumber(
                Math.abs(statement.totalDebit - statement.totalCredit),
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">الرصيد النهائي</p>

            <p className="mt-1 font-bold text-blue-700">
              {getBalanceAmount(statement.closingBalance)}{" "}
              {getBalanceSide(statement.closingBalance)}
            </p>
          </div>
        </div>
      </section>

      {/* INVENTORY STATEMENT */}

      {account.code === "1104" && (
        <section className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/50 p-5">
            <div>
              <div className="flex items-center gap-2">
                <FiPackage className="text-indigo-600" />

                <h2 className="font-bold text-gray-800">حركات المخزون</h2>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                تفاصيل الحركات التشغيلية للمخزون خلال الفترة
              </p>
            </div>

            <button
              onClick={exportInventoryCSV}
              className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 print:hidden"
            >
              <FiDownload size={15} />
              تصدير الحركات
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-5 sm:grid-cols-3">
            <SmallStat
              title="عدد الحركات"
              value={String(inventoryStatement.rows.length)}
            />

            <SmallStat
              title="إجمالي الكميات المتحركة"
              value={formatNumber(inventoryStatement.totalQuantity)}
            />

            <SmallStat
              title="إجمالي تكلفة الحركات"
              value={formatNumber(inventoryStatement.totalCost)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-right">
              <thead className="bg-gray-50 text-xs font-bold text-gray-600">
                <tr>
                  <th className="px-4 py-4">التاريخ</th>
                  <th className="px-4 py-4">رقم المستند</th>
                  <th className="px-4 py-4">المنتج</th>
                  <th className="px-4 py-4">المستودع</th>
                  <th className="px-4 py-4">نوع الحركة</th>
                  <th className="px-4 py-4">الكمية</th>
                  <th className="px-4 py-4">سعر التكلفة</th>
                  <th className="px-4 py-4">إجمالي التكلفة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {inventoryStatement.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {formatDate(row.date)}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs">
                      {row.documentNumber}
                    </td>

                    <td className="px-4 py-4 font-medium text-gray-800">
                      {row.productName}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {row.warehouseName}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {row.movementType}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold text-gray-700">
                      {formatNumber(row.quantity)}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {formatNumber(row.unitCost)}
                    </td>

                    <td className="px-4 py-4 font-bold text-gray-800">
                      {formatNumber(row.totalCost)}
                    </td>
                  </tr>
                ))}

                {inventoryStatement.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      <FiPackage className="mx-auto mb-3 text-3xl text-gray-300" />
                      لا توجد حركات مخزنية خلال الفترة المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-3 border-t border-amber-100 bg-amber-50 p-4">
            <FiInfo className="mt-0.5 shrink-0 text-amber-600" size={18} />

            <p className="text-xs leading-6 text-amber-800">
              حركات المخزون معروضة هنا بصورة مستقلة عن القيود المحاسبية. لا يتم
              إضافتها إلى الرصيد المحاسبي مرة أخرى، لتجنب تكرار احتساب قيمة
              المخزون. الرصيد المحاسبي يعتمد على القيود المرحلة والأرصدة
              الافتتاحية.
            </p>
          </div>
        </section>
      )}

      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <FiActivity className="text-blue-600" />
          كشف الحساب رقم {account.code}
        </div>

        <div>تاريخ الطباعة: {formatDate(getToday())}</div>
      </div>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-xl font-bold text-gray-800">{value}</p>

          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            colors[color] || colors.blue
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// BALANCE BADGE
// =====================================================

function BalanceBadge({ balance, side }: { balance: number; side: string }) {
  const color =
    side === "مدين"
      ? "bg-green-50 text-green-700"
      : side === "دائن"
        ? "bg-red-50 text-red-700"
        : "bg-gray-100 text-gray-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      {side}
    </span>
  );
}

// =====================================================
// SMALL STAT
// =====================================================

function SmallStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs text-gray-500">{title}</p>

      <p className="mt-2 text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}
