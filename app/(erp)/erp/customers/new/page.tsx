"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FiArrowRight,
  FiEdit,
  FiPrinter,
  FiPhone,
  FiMapPin,
  FiUser,
  FiCreditCard,
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiArrowDown,
  FiArrowUp,
  FiRefreshCw,
} from "react-icons/fi";

import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getAccounts } from "@/lib/api/accounts";

/* =====================================================
   TYPES
===================================================== */

type RawRow = {
  id: string | number;
  extra?: Record<string, unknown> | null;
  [key: string]: unknown;
};

type CurrentUser = {
  id: string;
  companyId: string;
  type: "erp" | "owner";
};

type Customer = {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  accountCode?: string;
  accountName?: string;
  accountId?: string;
  notes?: string;
  isActive?: boolean;
  status?: string;
};

type Account = {
  id: string;
  companyId: string;
  code?: string;
  name?: string;
  entityType?: string;
  entityId?: string;
  isActive?: boolean;
  isGroup?: boolean;
  allowPosting?: boolean;
  status?: string;
};

type Journal = {
  id: string;
  companyId?: string;
  date?: string;
  description?: string;
  reference?: string;
  referenceNumber?: string;
  referenceType?: string;
  referenceId?: string;
  entryNumber?: string;
  journalNumber?: string;
  status?: string;
};

type JournalLine = {
  id: string;
  companyId?: string;
  journalId?: string;
  accountId?: string;
  date?: string;
  description?: string;
  reference?: string;
  referenceNumber?: string;
  referenceType?: string;
  referenceId?: string;
  entryNumber?: string;
  debit?: number;
  credit?: number;
  status?: string;
};

type OpeningEntry = {
  id: string;
  companyId?: string;
  accountId?: string;
  date?: string;
  description?: string;
  reference?: string;
  debit?: number;
  credit?: number;
};

type Movement = {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  source: "journal" | "opening";
  referenceType?: string;
  referenceId?: string;
};

/* =====================================================
   HELPERS
===================================================== */

function normalizeRow<T>(row: RawRow): T {
  const extra =
    row.extra && typeof row.extra === "object" && !Array.isArray(row.extra)
      ? row.extra
      : {};

  return {
    ...extra,
    ...row,
    id: String(row.id),
  } as T;
}

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ar-SA-u-nu-latn", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getStoredUser(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem("authUser");

    if (!stored) {
      return null;
    }

    const user = JSON.parse(stored);

    if (!user || typeof user !== "object" || Array.isArray(user)) {
      return null;
    }

    if (!user.id || !user.companyId || !["erp", "owner"].includes(user.type)) {
      return null;
    }

    if (
      user.is_active === false ||
      user.isActive === false ||
      (user.status && user.status !== "active")
    ) {
      return null;
    }

    return {
      id: String(user.id),
      companyId: String(user.companyId),
      type: user.type,
    };
  } catch {
    return null;
  }
}

function isPosted(status?: string): boolean {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  return ["posted", "approved", "مُرحّل", "مرحل", "معتمد"].includes(value);
}

function getDateValue(value?: string): string {
  if (!value) {
    return "";
  }

  return String(value).substring(0, 10);
}

function getReference(line: JournalLine, journal?: Journal): string {
  return String(
    line.referenceNumber ||
      line.reference ||
      line.entryNumber ||
      journal?.referenceNumber ||
      journal?.reference ||
      journal?.entryNumber ||
      journal?.journalNumber ||
      "-",
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function CustomerAccountPage() {
  const params = useParams();
  const router = useRouter();

  const customerId = String(params.id);

  /* =====================================================
     STATE
  ===================================================== */

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [accountId, setAccountId] = useState("");

  const [journalMovements, setJournalMovements] = useState<Movement[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const user = getStoredUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const companyId = user.companyId;

        /* =========================================
           1. CUSTOMER
        ========================================= */

        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (!customerData) {
          setCustomer(null);
          setAccountId("");
          setJournalMovements([]);
          return;
        }

        const currentCustomer = normalizeRow<Customer>(customerData as RawRow);

        /* =========================================
           2. VERIFY COMPANY
        ========================================= */

        if (String(currentCustomer.companyId) !== companyId) {
          setCustomer(null);
          setAccountId("");
          setJournalMovements([]);
          return;
        }

        setCustomer(currentCustomer);

        /* =========================================
           3. FIND CUSTOMER ACCOUNT
        ========================================= */

        let resolvedAccountId = String(currentCustomer.accountId || "");

        if (!resolvedAccountId) {
          const accounts = await getAccounts(companyId);

          const companyAccounts = (accounts || []).filter(
            (account: Account) => String(account.companyId) === companyId,
          );

          // الربط المباشر بواسطة entityType و entityId
          let customerAccount = companyAccounts.find(
            (account: Account) =>
              String(account.entityId) === String(currentCustomer.id) &&
              account.entityType === "customer",
          );

          // محاولة الربط بواسطة كود الحساب عند عدم وجود الربط المباشر
          if (!customerAccount && currentCustomer.accountCode) {
            const matchingAccounts = companyAccounts.filter(
              (account: Account) =>
                String(account.code) === String(currentCustomer.accountCode) &&
                account.isGroup !== true &&
                account.isActive !== false &&
                account.status !== "inactive",
            );

            if (matchingAccounts.length === 1) {
              customerAccount = matchingAccounts[0];
            }
          }

          resolvedAccountId = customerAccount ? String(customerAccount.id) : "";
        }

        setAccountId(resolvedAccountId);

        if (!resolvedAccountId) {
          setJournalMovements([]);
          return;
        }

        /* =========================================
           4. FETCH JOURNALS
        ========================================= */

        const { data: journalsData, error: journalsError } = await supabase
          .from("journals")
          .select("*")
          .eq("companyId", companyId);

        if (journalsError) {
          throw journalsError;
        }

        const journals = ((journalsData || []) as RawRow[]).map((row) =>
          normalizeRow<Journal>(row),
        );

        const journalMap = new Map(
          journals.map((journal) => [String(journal.id), journal]),
        );

        /* =========================================
           5. FETCH JOURNAL LINES
        ========================================= */

        const { data: linesData, error: linesError } = await supabase
          .from("journalLines")
          .select("*")
          .eq("accountId", resolvedAccountId)
          .eq("companyId", companyId);

        if (linesError) {
          throw linesError;
        }

        const journalLines = ((linesData || []) as RawRow[]).map((row) =>
          normalizeRow<JournalLine>(row),
        );

        /* =========================================
           6. FETCH OPENING ENTRIES
        ========================================= */

        const { data: openingData, error: openingError } = await supabase
          .from("openingEntries")
          .select("*")
          .eq("accountId", resolvedAccountId)
          .eq("companyId", companyId);

        if (openingError) {
          throw openingError;
        }

        const openingEntries = ((openingData || []) as RawRow[]).map((row) =>
          normalizeRow<OpeningEntry>(row),
        );

        /* =========================================
           7. BUILD JOURNAL MOVEMENTS
        ========================================= */

        const movements: Movement[] = [];

        journalLines.forEach((line) => {
          if (
            String(line.companyId) !== companyId ||
            String(line.accountId) !== resolvedAccountId
          ) {
            return;
          }

          const journal = line.journalId
            ? journalMap.get(String(line.journalId))
            : undefined;

          // لا نعرض حركة مرتبطة بقيد غير موجود في الشركة الحالية
          if (!journal) {
            return;
          }

          if (String(journal.companyId) !== companyId) {
            return;
          }

          // يجب أن يكون القيد مرحلاً أو معتمداً
          if (!isPosted(line.status || journal.status)) {
            return;
          }

          movements.push({
            id: String(line.id),

            date: getDateValue(line.date || journal.date),

            description:
              line.description || journal.description || "قيد محاسبي",

            reference: getReference(line, journal),

            debit: toNumber(line.debit),

            credit: toNumber(line.credit),

            source: "journal",

            referenceType: line.referenceType || journal.referenceType,

            referenceId: line.referenceId || journal.referenceId,
          });
        });

        /* =========================================
           8. BUILD OPENING MOVEMENTS
        ========================================= */

        openingEntries.forEach((entry) => {
          if (
            String(entry.companyId) !== companyId ||
            String(entry.accountId) !== resolvedAccountId
          ) {
            return;
          }

          movements.push({
            id: `opening-${entry.id}`,

            date: getDateValue(entry.date),

            description: entry.description || "رصيد افتتاحي",

            reference: String(entry.reference || "-"),

            debit: toNumber(entry.debit),

            credit: toNumber(entry.credit),

            source: "opening",
          });
        });

        /* =========================================
           9. SORT MOVEMENTS
        ========================================= */

        movements.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);

          if (dateCompare !== 0) {
            return dateCompare;
          }

          return a.id.localeCompare(b.id);
        });

        setJournalMovements(movements);
      } catch (err) {
        console.error("Customer account error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل كشف حساب العميل.",
        );

        toast.error("تعذر تحميل كشف حساب العميل.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId, router],
  );

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     TOTALS
  ===================================================== */

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;

    journalMovements.forEach((movement) => {
      debit += movement.debit;
      credit += movement.credit;
    });

    return {
      debit,
      credit,
      balance: debit - credit,
    };
  }, [journalMovements]);

  /* =====================================================
     RUNNING BALANCE
  ===================================================== */

  const movementsWithBalance = useMemo(() => {
    let runningBalance = 0;

    return journalMovements.map((movement) => {
      runningBalance += movement.debit - movement.credit;

      return {
        ...movement,
        runningBalance,
      };
    });
  }, [journalMovements]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center bg-gray-50"
      >
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <FiRefreshCw className="animate-spin text-lg" />
          جاري تحميل كشف الحساب...
        </div>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50 p-3">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiFileText size={22} />
            </div>

            <h1 className="text-sm font-bold text-gray-800">
              تعذر تحميل البيانات
            </h1>

            <p className="mt-2 text-[11px] text-gray-500">{error}</p>

            <button
              type="button"
              onClick={() => loadData()}
              className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 text-[11px] font-medium text-white transition hover:opacity-90"
            >
              <FiRefreshCw size={13} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     CUSTOMER NOT FOUND
  ===================================================== */

  if (!customer) {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50 p-3">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiUser size={22} />
            </div>

            <h1 className="text-sm font-bold text-gray-800">
              العميل غير موجود
            </h1>

            <p className="mt-1 text-[11px] text-gray-500">
              لم يتم العثور على العميل المطلوب.
            </p>

            <Link
              href="/erp/customers"
              className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 text-[11px] font-medium text-white transition hover:opacity-90"
            >
              <FiArrowRight size={14} />
              العودة إلى العملاء
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     CASH CUSTOMER
  ===================================================== */

  if (customer.id === "CASH-CUSTOMER") {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50 p-3">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <FiCreditCard size={22} />
            </div>

            <h1 className="text-sm font-bold text-gray-800">حساب الصندوق</h1>

            <p className="mt-1 text-[11px] text-gray-500">
              هذا الحساب خاص بالصندوق ولا يعرض كسجل عميل.
            </p>

            <Link
              href="/erp/customers"
              className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 text-[11px] font-medium text-white transition hover:opacity-90"
            >
              <FiArrowRight size={14} />
              العودة إلى العملاء
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     CUSTOMER DATA
  ===================================================== */

  const customerName = customer.name || "العميل";

  const accountCode = customer.accountCode || "-";

  const accountName = customer.accountName || customerName;

  /* =====================================================
     PRINT
  ===================================================== */

  const handlePrint = () => {
    window.print();
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 p-2 sm:p-3 print:bg-white print:p-0"
    >
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <Link
              href="/erp/customers"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              title="العودة"
            >
              <FiArrowRight size={15} />
            </Link>

            <div>
              <h1 className="text-base font-bold text-gray-800">
                كشف حساب العميل
              </h1>

              <p className="text-[9px] text-gray-500">
                عرض جميع الحركات المالية على الحساب المحاسبي للعميل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <FiRefreshCw
                size={13}
                className={refreshing ? "animate-spin" : ""}
              />
              تحديث
            </button>

            <Link
              href={`/erp/customers/${customer.id}/edit`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FiEdit size={13} />
              تعديل
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-3 text-[10px] font-medium text-white transition hover:opacity-90"
            >
              <FiPrinter size={13} />
              طباعة
            </button>
          </div>
        </div>

        {/* CUSTOMER INFORMATION */}

        <section className="mb-2 rounded-xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-b print:shadow-none">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FiUser size={20} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  {customerName}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <FiCreditCard size={11} />
                    الحساب: {accountCode}
                  </span>

                  {customer.phone && (
                    <span className="inline-flex items-center gap-1">
                      <FiPhone size={11} />
                      {customer.phone}
                    </span>
                  )}

                  {customer.address && (
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin size={11} />
                      {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 px-4 py-2 text-center">
              <div className="text-[9px] text-gray-500">الرصيد الحالي</div>

              <div
                className={`mt-0.5 text-base font-bold ${
                  totals.balance > 0
                    ? "text-red-600"
                    : totals.balance < 0
                      ? "text-green-600"
                      : "text-gray-700"
                }`}
              >
                {formatMoney(Math.abs(totals.balance))}
              </div>

              <div className="text-[8px] text-gray-400">
                {totals.balance > 0
                  ? "مدين"
                  : totals.balance < 0
                    ? "دائن"
                    : "متزن"}
              </div>
            </div>
          </div>
        </section>

        {/* STATISTICS */}

        <section className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">إجمالي المدين</p>

                <p className="mt-1 text-sm font-bold text-red-600">
                  {formatMoney(totals.debit)}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <FiArrowDown size={15} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">إجمالي الدائن</p>

                <p className="mt-1 text-sm font-bold text-green-600">
                  {formatMoney(totals.credit)}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-500">
                <FiArrowUp size={15} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">صافي الرصيد</p>

                <p className="mt-1 text-sm font-bold text-gray-800">
                  {formatMoney(Math.abs(totals.balance))}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <FiDollarSign size={15} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">عدد الحركات</p>

                <p className="mt-1 text-sm font-bold text-gray-800">
                  {journalMovements.length}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                <FiFileText size={15} />
              </div>
            </div>
          </div>
        </section>

        {/* ACCOUNT INFORMATION */}

        <section className="mb-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-3 py-2">
            <h3 className="text-[11px] font-bold text-gray-800">
              معلومات الحساب
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="block text-[9px] text-gray-400">اسم العميل</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {customer.name}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400">كود الحساب</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {accountCode}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400">اسم الحساب</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {accountName}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400">رقم الهاتف</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {customer.phone || "-"}
              </span>
            </div>
          </div>
        </section>

        {/* ACCOUNT STATEMENT */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
            <div>
              <h3 className="text-[11px] font-bold text-gray-800">
                كشف الحساب
              </h3>

              <p className="text-[8px] text-gray-400">
                الحركات المالية المسجلة على الحساب المحاسبي للعميل
              </p>
            </div>

            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <FiCalendar size={11} />
              جميع الحركات
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-right text-[10px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                  <th className="whitespace-nowrap px-3 py-2 font-medium">#</th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    التاريخ
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    البيان
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    المرجع
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    مدين
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    دائن
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    الرصيد
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium print:hidden">
                    المصدر
                  </th>
                </tr>
              </thead>

              <tbody>
                {movementsWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                          <FiFileText size={18} />
                        </div>

                        <p className="text-[11px] font-medium text-gray-600">
                          لا توجد حركات مالية
                        </p>

                        <p className="mt-1 text-[9px] text-gray-400">
                          لا توجد قيود محاسبية مسجلة على حساب هذا العميل
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movementsWithBalance.map((movement, index) => (
                    <tr
                      key={movement.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                        {movement.date
                          ? new Date(
                              `${movement.date}T00:00:00`,
                            ).toLocaleDateString("ar-YE-u-nu-latn")
                          : "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="font-medium text-gray-700">
                          {movement.description}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                        {movement.reference}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 font-medium text-red-600">
                        {movement.debit ? formatMoney(movement.debit) : "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 font-medium text-green-600">
                        {movement.credit ? formatMoney(movement.credit) : "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`font-bold ${
                            movement.runningBalance > 0
                              ? "text-red-600"
                              : movement.runningBalance < 0
                                ? "text-green-600"
                                : "text-gray-600"
                          }`}
                        >
                          {formatMoney(Math.abs(movement.runningBalance))}
                        </span>

                        <span className="mr-1 text-[8px] text-gray-400">
                          {movement.runningBalance > 0
                            ? "مدين"
                            : movement.runningBalance < 0
                              ? "دائن"
                              : ""}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 print:hidden">
                        <span
                          className={`rounded-md px-2 py-1 text-[9px] ${
                            movement.source === "opening"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {movement.source === "opening"
                            ? "رصيد افتتاحي"
                            : "قيد يومية"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {movementsWithBalance.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={4} className="px-3 py-2 text-gray-700">
                      الإجمالي
                    </td>

                    <td className="px-3 py-2 text-red-600">
                      {formatMoney(totals.debit)}
                    </td>

                    <td className="px-3 py-2 text-green-600">
                      {formatMoney(totals.credit)}
                    </td>

                    <td className="px-3 py-2 text-gray-800">
                      {formatMoney(Math.abs(totals.balance))}
                    </td>

                    <td className="print:hidden" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* BALANCE SUMMARY */}

        <section className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <div className="text-[9px] text-red-500">على العميل</div>

            <div className="mt-1 text-sm font-bold text-red-700">
              {totals.balance > 0 ? formatMoney(totals.balance) : "0"}
            </div>

            <div className="mt-0.5 text-[8px] text-red-400">
              إجمالي المبلغ المدين على العميل
            </div>
          </div>

          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <div className="text-[9px] text-green-600">للعميل</div>

            <div className="mt-1 text-sm font-bold text-green-700">
              {totals.balance < 0 ? formatMoney(Math.abs(totals.balance)) : "0"}
            </div>

            <div className="mt-0.5 text-[8px] text-green-500">
              المبلغ الدائن لصالح العميل
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[9px] text-gray-500">حالة الحساب</div>

            <div className="mt-1 text-sm font-bold text-gray-800">
              {totals.balance > 0
                ? "رصيد مدين"
                : totals.balance < 0
                  ? "رصيد دائن"
                  : "الحساب متزن"}
            </div>

            <div className="mt-0.5 text-[8px] text-gray-400">
              حسب القيود المحاسبية المسجلة
            </div>
          </div>
        </section>

        {/* PRINT FOOTER */}

        <div className="mt-6 hidden border-t border-gray-200 pt-3 text-center print:block">
          <p className="text-[10px] font-bold text-gray-700">شركة الجابري</p>

          <p className="mt-1 text-[8px] text-gray-500">
            للعسل والزيوت الطبيعية وخدمات العمرة
          </p>

          <p className="mt-1 text-[8px] text-gray-500">
            البيضاء - اليمن | 734 434 443
          </p>

          <p className="mt-2 text-[8px] text-gray-400">
            كشف حساب العميل: {customer.name}
          </p>

          <p className="mt-1 text-[8px] text-gray-400">الحساب: {accountCode}</p>
        </div>
      </div>

      {/* PRINT CSS */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          * {
            box-shadow: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </main>
  );
}
