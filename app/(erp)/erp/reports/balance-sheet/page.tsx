"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import {
  FiRefreshCw,
  FiCalendar,
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
} from "react-icons/fi";

// =====================================================
// TYPES
// =====================================================

interface CurrentUser {
  id: string | number;
  username: string;
  companyId: string | number;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  isGroup: boolean;
  companyId: string;
  extra?: any;
}

interface BalanceRow {
  accountId: string;
  code: string;
  name: string;
  balance: number;
}

interface BalanceSection {
  title: string;
  rows: BalanceRow[];
  total: number;
}

interface ReportData {
  assets: BalanceSection[];
  liabilities: BalanceSection[];
  equity: BalanceSection[];
  revenue: number;
  expenses: number;
  netProfit: number;
  assetsTotal: number;
  liabilitiesTotal: number;
  equityTotal: number;
  difference: number;
}

// =====================================================
// HELPERS
// =====================================================

function getCurrentUsername(): string {
  if (typeof window === "undefined") return "";

  const cookie = document.cookie
    .split(";")
    .find((item) => item.trim().startsWith("username="));

  let cookieUsername = "";

  try {
    cookieUsername = cookie
      ? decodeURIComponent(cookie.split("=").slice(1).join("="))
      : "";
  } catch {
    cookieUsername = "";
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem("authUser") || "null");

    return cookieUsername || storedUser?.username || "";
  } catch {
    return cookieUsername;
  }
}

function getExtra(value: any): any {
  if (!value) return {};

  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return {};
}

function getDate(value: any): string {
  if (!value) return "";

  return String(value).slice(0, 10);
}

function money(value: number): string {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getAccountType(account: Account): string {
  const extra = getExtra(account.extra);

  const rawType = String(
    account.type || extra.accountType || extra.category || extra.type || "",
  )
    .trim()
    .toLowerCase();

  const normalized = rawType.replace(/\s+/g, "");

  if (["asset", "assets", "أصول", "الاصول", "الأصول"].includes(normalized)) {
    return "asset";
  }

  if (
    ["liability", "liabilities", "الخصوم", "الالتزامات", "خصوم"].includes(
      normalized,
    )
  ) {
    return "liability";
  }

  if (
    ["equity", "capital", "حقوقالملكية", "حقوقملكية", "رأسالمال"].includes(
      normalized,
    )
  ) {
    return "equity";
  }

  if (
    [
      "revenue",
      "income",
      "revenues",
      "إيرادات",
      "الايرادات",
      "الإيرادات",
    ].includes(normalized)
  ) {
    return "revenue";
  }

  if (
    ["expense", "expenses", "cost", "مصروفات", "المصروفات", "تكاليف"].includes(
      normalized,
    )
  ) {
    return "expense";
  }

  // التصنيف الاحتياطي اعتماداً على أول رقم في كود الحساب
  const firstDigit = String(account.code || "").charAt(0);

  switch (firstDigit) {
    case "1":
      return "asset";

    case "2":
      return "liability";

    case "3":
      return "equity";

    case "4":
      return "revenue";

    case "5":
    case "6":
      return "expense";

    default:
      return "unknown";
  }
}

function isPostedJournal(journal: any): boolean {
  if (journal.isPosted === true) return true;

  const status = String(journal.status || "")
    .trim()
    .toLowerCase();

  return ["posted", "approved", "مُرحّل", "مرحل", "معتمد"].includes(status);
}

function createEmptyReport(): ReportData {
  return {
    assets: [],
    liabilities: [],
    equity: [],
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    assetsTotal: 0,
    liabilitiesTotal: 0,
    equityTotal: 0,
    difference: 0,
  };
}

// =====================================================
// COMPONENT
// =====================================================

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true);

  const [companyId, setCompanyId] = useState("");

  const [companyName, setCompanyName] = useState("");

  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [report, setReport] = useState<ReportData>(createEmptyReport());

  const [expanded, setExpanded] = useState({
    assets: true,
    liabilities: true,
    equity: true,
  });

  // ===================================================
  // LOAD REPORT
  // ===================================================

  const loadReport = useCallback(async () => {
    setLoading(true);

    try {
      const username = getCurrentUsername();

      if (!username) {
        throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
      }

      // -------------------------------------------------
      // 1. CURRENT USER
      // -------------------------------------------------

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, username, companyId, companyname, type, status, isActive")
        .eq("username", username)
        .maybeSingle();

      if (userError) throw userError;

      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      if (user.type === "platform") {
        throw new Error("لا يمكن لمستخدم المنصة عرض ميزانية شركة");
      }

      if (!user.companyId) {
        throw new Error("المستخدم غير مرتبط بشركة");
      }

      if (user.isActive === false || user.status === "inactive") {
        throw new Error("حساب المستخدم غير نشط");
      }

      const currentCompanyId = String(user.companyId);

      setCompanyId(currentCompanyId);
      setCompanyName(user.companyname || "");

      // -------------------------------------------------
      // 2. LOAD ACCOUNTS
      // -------------------------------------------------

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("companyId", currentCompanyId)
        .order("code", { ascending: true });

      if (accountsError) throw accountsError;

      const accounts: Account[] = (accountsData || []).map((item: any) => ({
        ...item,
        id: String(item.id),
        code: String(item.code || ""),
        name: String(item.name || ""),
        type: String(item.type || ""),
        parentId: item.parentId ? String(item.parentId) : null,
        companyId: String(item.companyId),
        isGroup: item.isGroup === true,
        extra: getExtra(item.extra),
      }));

      const accountMap = new Map<string, Account>();

      accounts.forEach((account) => {
        accountMap.set(account.id, account);
      });

      // -------------------------------------------------
      // 3. LOAD OPENING ENTRIES
      // -------------------------------------------------

      const { data: openingData, error: openingError } = await supabase
        .from("openingEntries")
        .select("*")
        .eq("companyId", currentCompanyId);

      if (openingError) throw openingError;

      // -------------------------------------------------
      // 4. LOAD JOURNALS
      // -------------------------------------------------

      const { data: journalsData, error: journalsError } = await supabase
        .from("journals")
        .select("*")
        .eq("companyId", currentCompanyId);

      if (journalsError) throw journalsError;

      // -------------------------------------------------
      // 5. LOAD JOURNAL LINES
      // -------------------------------------------------

      const { data: journalLinesData, error: journalLinesError } =
        await supabase
          .from("journalLines")
          .select("*")
          .eq("companyId", currentCompanyId);

      if (journalLinesError) throw journalLinesError;

      // -------------------------------------------------
      // 6. PREPARE BALANCES
      // -------------------------------------------------

      const balances = new Map<string, { debit: number; credit: number }>();

      accounts.forEach((account) => {
        balances.set(account.id, {
          debit: 0,
          credit: 0,
        });
      });

      function addBalance(accountId: string, debit: number, credit: number) {
        const account = accountMap.get(accountId);

        if (!account || account.companyId !== currentCompanyId) return;

        const current = balances.get(accountId) || {
          debit: 0,
          credit: 0,
        };

        current.debit += Number(debit) || 0;
        current.credit += Number(credit) || 0;

        balances.set(accountId, current);
      }

      // -------------------------------------------------
      // 7. APPLY OPENING ENTRIES
      // -------------------------------------------------

      (openingData || []).forEach((entry: any) => {
        const extra = getExtra(entry.extra);

        const entryDate = getDate(extra.date || entry.date);

        if (!entryDate || entryDate > reportDate) return;

        const accountId = String(extra.accountId || entry.accountId || "");

        if (!accountId) return;

        addBalance(
          accountId,
          Number(extra.debit ?? entry.debit) || 0,
          Number(extra.credit ?? entry.credit) || 0,
        );
      });

      // -------------------------------------------------
      // 8. APPLY POSTED JOURNALS
      // -------------------------------------------------

      const journals = (journalsData || []).filter((journal: any) => {
        const journalDate = getDate(
          journal.date || journal.journalDate || journal.createdAt,
        );

        return (
          isPostedJournal(journal) &&
          journalDate !== "" &&
          journalDate <= reportDate
        );
      });

      const postedJournalIds = new Set(
        journals.map((journal: any) => String(journal.id)),
      );

      (journalLinesData || []).forEach((line: any) => {
        const journalId = String(line.journalId || line.journal_id || "");

        if (!postedJournalIds.has(journalId)) return;

        if (line.companyId && String(line.companyId) !== currentCompanyId) {
          return;
        }

        const accountId = String(line.accountId || line.account_id || "");

        if (!accountId) return;

        addBalance(
          accountId,
          Number(line.debit) || 0,
          Number(line.credit) || 0,
        );
      });

      // -------------------------------------------------
      // 9. CALCULATE ACCOUNT BALANCES
      // -------------------------------------------------

      const assetRows: BalanceRow[] = [];
      const liabilityRows: BalanceRow[] = [];
      const equityRows: BalanceRow[] = [];

      let revenue = 0;
      let expenses = 0;

      accounts.forEach((account) => {
        // عدم جمع الحسابات التجميعية مع الحسابات الفرعية
        if (account.isGroup) return;

        const accountBalance = balances.get(account.id);

        if (!accountBalance) return;

        const debit = accountBalance.debit;
        const credit = accountBalance.credit;

        const type = getAccountType(account);

        let balance = 0;

        switch (type) {
          case "asset":
            balance = debit - credit;
            break;

          case "liability":
            balance = credit - debit;
            break;

          case "equity":
            balance = credit - debit;
            break;

          case "revenue":
            revenue += credit - debit;
            return;

          case "expense":
            expenses += debit - credit;
            return;

          default:
            return;
        }

        if (Math.abs(balance) < 0.000001) return;

        const row: BalanceRow = {
          accountId: account.id,
          code: account.code,
          name: account.name,
          balance,
        };

        if (type === "asset") {
          assetRows.push(row);
        } else if (type === "liability") {
          liabilityRows.push(row);
        } else if (type === "equity") {
          equityRows.push(row);
        }
      });

      // -------------------------------------------------
      // 10. BUILD REPORT SECTIONS
      // -------------------------------------------------

      const assetsTotal = assetRows.reduce((sum, row) => sum + row.balance, 0);

      const liabilitiesTotal = liabilityRows.reduce(
        (sum, row) => sum + row.balance,
        0,
      );

      const equityAccountsTotal = equityRows.reduce(
        (sum, row) => sum + row.balance,
        0,
      );

      const netProfit = revenue - expenses;

      const equityTotal = equityAccountsTotal + netProfit;

      const difference = assetsTotal - (liabilitiesTotal + equityTotal);

      const nextReport: ReportData = {
        assets: [
          {
            title: "الأصول",
            rows: assetRows,
            total: assetsTotal,
          },
        ],

        liabilities: [
          {
            title: "الخصوم",
            rows: liabilityRows,
            total: liabilitiesTotal,
          },
        ],

        equity: [
          {
            title: "حقوق الملكية",
            rows: equityRows,
            total: equityAccountsTotal,
          },
        ],

        revenue,
        expenses,
        netProfit,

        assetsTotal,
        liabilitiesTotal,
        equityTotal,

        difference,
      };

      setReport(nextReport);
    } catch (error: any) {
      console.error("Balance Sheet Error:", error);

      toast.error(error?.message || "حدث خطأ أثناء تحميل الميزانية العمومية");

      setReport(createEmptyReport());
    } finally {
      setLoading(false);
    }
  }, [reportDate]);

  // ===================================================
  // EFFECT
  // ===================================================

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ===================================================
  // CALCULATIONS
  // ===================================================

  const isBalanced = useMemo(
    () => Math.abs(report.difference) < 0.01,
    [report.difference],
  );

  // ===================================================
  // EXPAND / COLLAPSE
  // ===================================================

  function toggleSection(section: keyof typeof expanded) {
    setExpanded((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  }

  // ===================================================
  // PRINT
  // ===================================================

  function printReport() {
    window.print();
  }

  // ===================================================
  // SECTION COMPONENT
  // ===================================================

  function renderSection(
    title: string,
    rows: BalanceRow[],
    total: number,
    sectionKey: keyof typeof expanded,
  ) {
    const isOpen = expanded[sectionKey];

    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="flex w-full items-center justify-between bg-slate-50 px-5 py-4 text-right transition hover:bg-slate-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-slate-800">{title}</span>

            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-600">
              {rows.length} حساب
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-800" dir="ltr">
              {money(total)}
            </span>

            {isOpen ? (
              <FiChevronUp className="text-slate-500" />
            ) : (
              <FiChevronDown className="text-slate-500" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-slate-100 bg-white text-slate-500">
                <tr>
                  <th className="w-32 px-5 py-3 text-right font-medium">
                    رقم الحساب
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    اسم الحساب
                  </th>

                  <th className="w-56 px-5 py-3 text-left font-medium">
                    الرصيد
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-7 text-center text-slate-400"
                    >
                      لا توجد أرصدة في هذا القسم
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.accountId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-3 text-slate-500" dir="ltr">
                        {row.code}
                      </td>

                      <td className="px-5 py-3 font-medium text-slate-700">
                        {row.name}
                      </td>

                      <td
                        className={`px-5 py-3 text-left font-semibold ${
                          row.balance < 0 ? "text-red-600" : "text-slate-700"
                        }`}
                        dir="ltr"
                      >
                        {money(row.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-4 font-bold text-slate-700"
                  >
                    إجمالي {title}
                  </td>

                  <td
                    className="px-5 py-4 text-left font-bold text-slate-900"
                    dir="ltr"
                  >
                    {money(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    );
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin" size={22} />

          <span>جاري إعداد الميزانية العمومية...</span>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>التقارير</span>
            <span>/</span>
            <span className="text-blue-600">الميزانية العمومية</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            الميزانية العمومية
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            تقرير يوضح الوضع المالي للشركة من أصول وخصوم وحقوق ملكية.
          </p>

          {companyName && (
            <p className="mt-2 text-sm font-medium text-slate-700">
              الشركة: {companyName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadReport}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={16} />
            تحديث
          </button>

          <button
            type="button"
            onClick={printReport}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiDownload size={16} />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* FILTER */}

      <section className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="w-full max-w-xs">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            الميزانية كما في تاريخ
          </label>

          <div className="relative">
            <FiCalendar className="absolute right-3 top-3 text-slate-400" />

            <input
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          يتم احتساب الأرصدة حتى التاريخ المحدد.
        </p>
      </section>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* ASSETS */}

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-blue-700">
              إجمالي الأصول
            </div>

            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
              <FiTrendingUp size={20} />
            </div>
          </div>

          <div className="mt-4 text-2xl font-bold text-blue-900" dir="ltr">
            {money(report.assetsTotal)}
          </div>

          <p className="mt-2 text-xs text-blue-600">
            ما تملكه الشركة من أموال وممتلكات
          </p>
        </div>

        {/* LIABILITIES */}

        <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-orange-700">
              إجمالي الخصوم
            </div>

            <div className="rounded-lg bg-orange-100 p-2.5 text-orange-700">
              <FiTrendingDown size={20} />
            </div>
          </div>

          <div className="mt-4 text-2xl font-bold text-orange-900" dir="ltr">
            {money(report.liabilitiesTotal)}
          </div>

          <p className="mt-2 text-xs text-orange-600">
            الالتزامات والمبالغ المستحقة على الشركة
          </p>
        </div>

        {/* EQUITY */}

        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-purple-700">
              حقوق الملكية
            </div>

            <div className="rounded-lg bg-purple-100 p-2.5 text-purple-700">
              <FiDollarSign size={20} />
            </div>
          </div>

          <div className="mt-4 text-2xl font-bold text-purple-900" dir="ltr">
            {money(report.equityTotal)}
          </div>

          <p className="mt-2 text-xs text-purple-600">
            رأس المال والأرباح وحقوق أصحاب الشركة
          </p>
        </div>

        {/* NET PROFIT */}

        <div
          className={`rounded-xl border p-5 ${
            report.netProfit >= 0
              ? "border-green-100 bg-green-50"
              : "border-red-100 bg-red-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`text-sm font-medium ${
                report.netProfit >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              صافي الربح / الخسارة
            </div>

            <div
              className={`rounded-lg p-2.5 ${
                report.netProfit >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <FiFileText size={20} />
            </div>
          </div>

          <div
            className={`mt-4 text-2xl font-bold ${
              report.netProfit >= 0 ? "text-green-900" : "text-red-900"
            }`}
            dir="ltr"
          >
            {money(report.netProfit)}
          </div>

          <p
            className={`mt-2 text-xs ${
              report.netProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            الإيرادات ناقص المصروفات
          </p>
        </div>
      </div>

      {/* BALANCE STATUS */}

      <section
        className={`rounded-xl border p-5 ${
          isBalanced
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isBalanced ? (
              <div className="rounded-full bg-green-100 p-2.5 text-green-700">
                <FiCheckCircle size={23} />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 p-2.5 text-red-700">
                <FiAlertCircle size={23} />
              </div>
            )}

            <div>
              <h2
                className={`font-bold ${
                  isBalanced ? "text-green-800" : "text-red-800"
                }`}
              >
                {isBalanced ? "الميزانية متوازنة" : "الميزانية غير متوازنة"}
              </h2>

              <p
                className={`mt-1 text-sm ${
                  isBalanced ? "text-green-700" : "text-red-700"
                }`}
              >
                {isBalanced
                  ? "إجمالي الأصول يساوي إجمالي الخصوم وحقوق الملكية."
                  : "يوجد فرق بين الأصول والخصوم وحقوق الملكية. راجع القيود والأرصدة."}
              </p>
            </div>
          </div>

          <div className="text-left">
            <p className="text-xs text-slate-500">الفرق</p>

            <p
              className={`mt-1 text-xl font-bold ${
                isBalanced ? "text-green-700" : "text-red-700"
              }`}
              dir="ltr"
            >
              {money(Math.abs(report.difference))}
            </p>
          </div>
        </div>
      </section>

      {/* BALANCE SHEET DETAILS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* ASSETS */}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">الأصول</h2>

            <span className="text-sm font-bold text-blue-700" dir="ltr">
              {money(report.assetsTotal)}
            </span>
          </div>

          {renderSection(
            "الأصول",
            report.assets[0]?.rows || [],
            report.assetsTotal,
            "assets",
          )}
        </div>

        {/* LIABILITIES + EQUITY */}

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              الخصوم وحقوق الملكية
            </h2>

            <span className="text-sm font-bold text-orange-700" dir="ltr">
              {money(report.liabilitiesTotal + report.equityTotal)}
            </span>
          </div>

          {renderSection(
            "الخصوم",
            report.liabilities[0]?.rows || [],
            report.liabilitiesTotal,
            "liabilities",
          )}

          {renderSection(
            "حقوق الملكية",
            report.equity[0]?.rows || [],
            report.equity[0]?.total || 0,
            "equity",
          )}

          {/* NET PROFIT */}

          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-green-900">صافي الربح / الخسارة</p>

                <p className="mt-1 text-xs text-green-700">
                  يُضاف إلى حقوق الملكية
                </p>
              </div>

              <span className="text-lg font-bold text-green-800" dir="ltr">
                {money(report.netProfit)}
              </span>
            </div>
          </div>

          {/* EQUITY TOTAL */}

          <div className="flex items-center justify-between rounded-xl bg-slate-900 p-5 text-white">
            <span className="font-bold">إجمالي الخصوم وحقوق الملكية</span>

            <span className="text-xl font-bold" dir="ltr">
              {money(report.liabilitiesTotal + report.equityTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* PROFIT DETAILS */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">
          تفاصيل احتساب صافي الربح
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-700">الإيرادات</p>

            <p className="mt-2 text-xl font-bold text-green-800" dir="ltr">
              {money(report.revenue)}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-700">المصروفات</p>

            <p className="mt-2 text-xl font-bold text-red-800" dir="ltr">
              {money(report.expenses)}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">صافي الربح / الخسارة</p>

            <p className="mt-2 text-xl font-bold text-blue-800" dir="ltr">
              {money(report.netProfit)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium">طريقة الحساب:</p>

          <p className="mt-2" dir="rtl">
            صافي الربح = إجمالي الإيرادات − إجمالي المصروفات
          </p>

          <p className="mt-2" dir="rtl">
            إجمالي الأصول = إجمالي الخصوم + حقوق الملكية + صافي الربح (مع احتساب
            صافي الربح ضمن حقوق الملكية في هذا التقرير).
          </p>
        </div>
      </section>

      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-400">
        <span>تاريخ التقرير: {reportDate}</span>

        <span>تقرير الميزانية العمومية</span>
      </div>

      {/* PRINT STYLE */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          button {
            display: none !important;
          }

          input {
            border: none !important;
          }

          section {
            break-inside: avoid;
          }

          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
