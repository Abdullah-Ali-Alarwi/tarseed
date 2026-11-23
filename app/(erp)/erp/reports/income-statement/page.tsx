"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiRefreshCw,
  FiPrinter,
  FiDownload,
  FiFileText,
  FiBarChart2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { toast } from "sonner";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   TYPES
========================================================= */

type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense"
  | "other";

type AccountCategory =
  | "revenue"
  | "costOfSales"
  | "operatingExpense"
  | "otherIncome"
  | "otherExpense"
  | "other";

interface Account {
  id: string | number;
  code?: string;
  name: string;

  type?: string;
  accountType?: string;
  category?: string;
  nature?: string;

  companyId?: string;

  parentId?: string | number | null;

  isGroup?: boolean;
  allowPosting?: boolean;
  isActive?: boolean;
}

interface Journal {
  id: string | number;

  date?: string;
  journalDate?: string;

  status?: string;
  isPosted?: boolean;

  companyId?: string;
}

interface JournalLine {
  id: string | number;

  journalId?: string | number;
  accountId?: string | number;

  debit?: number;
  credit?: number;

  companyId?: string;
}

interface ReportItem {
  id: string;
  code: string;
  name: string;
  amount: number;
}

interface ReportData {
  revenueItems: ReportItem[];
  costOfSalesItems: ReportItem[];
  operatingExpenseItems: ReportItem[];
  otherIncomeItems: ReportItem[];
  otherExpenseItems: ReportItem[];

  totalRevenue: number;
  totalCostOfSales: number;
  grossProfit: number;

  totalOperatingExpenses: number;
  operatingProfit: number;

  totalOtherIncome: number;
  totalOtherExpenses: number;

  netProfit: number;
  profitMargin: number;

  journalCount: number;
  lineCount: number;

  totalDebit: number;
  totalCredit: number;
}

/* =========================================================
   DATE HELPERS
========================================================= */

const getLocalDate = (date: Date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const currentDate = getLocalDate(new Date());

const firstDayOfMonth = getLocalDate(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
);

/* =========================================================
   FORMATTERS
========================================================= */

const money = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    style: "currency",
    currency: "YER",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const numberValue = (value: unknown) => {
  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
};

const normalizeId = (value: string | number | null | undefined) =>
  String(value ?? "");

const normalizeDate = (value?: string) => {
  if (!value) return "";

  return String(value).substring(0, 10);
};

/* =========================================================
   JOURNAL STATUS
========================================================= */

const isPostedJournal = (journal: Journal) => {
  if (journal.isPosted === true) return true;

  const status = String(journal.status || "")
    .trim()
    .toLowerCase();

  return [
    "posted",
    "approved",
    "مُرحّل",
    "مرحل",
    "مرحّل",
    "معتمد",
    "مُعتمد",
  ].includes(status);
};

/* =========================================================
   ACCOUNT CLASSIFICATION
========================================================= */

const normalizeText = (value: string) => {
  return value.trim().toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
};

const getAccountType = (account: Account): AccountType => {
  const type = normalizeText(
    [account.type, account.accountType, account.category]
      .filter(Boolean)
      .join(" "),
  );

  if (
    type.includes("revenue") ||
    type.includes("income") ||
    type.includes("ايراد") ||
    type.includes("دخل")
  ) {
    return "revenue";
  }

  if (
    type.includes("expense") ||
    type.includes("cost") ||
    type.includes("مصروف") ||
    type.includes("تكلفه")
  ) {
    return "expense";
  }

  if (type.includes("asset") || type.includes("اصل")) {
    return "asset";
  }

  if (type.includes("liability") || type.includes("التزام")) {
    return "liability";
  }

  if (type.includes("equity") || type.includes("حقوق الملكيه")) {
    return "equity";
  }

  const code = String(account.code || "");

  if (code.startsWith("4")) return "revenue";

  if (code.startsWith("5") || code.startsWith("6")) {
    return "expense";
  }

  return "other";
};

/* =========================================================
   INCOME STATEMENT CLASSIFICATION
========================================================= */

const getAccountCategory = (account: Account): AccountCategory => {
  const type = getAccountType(account);

  const name = normalizeText(account.name || "");

  const code = String(account.code || "");

  const classification = normalizeText(
    [account.category, account.accountType, account.type]
      .filter(Boolean)
      .join(" "),
  );

  /* -----------------------------------------
     REVENUE
  ----------------------------------------- */

  if (type === "revenue") {
    return "revenue";
  }

  if (type !== "expense") {
    return "other";
  }

  /* -----------------------------------------
     COST OF SALES
  ----------------------------------------- */

  const costKeywords = [
    "تكلفه المبيعات",
    "تكلفه البضاعه المباعه",
    "تكلفه البضاعة المباعه",
    "تكلفه البضائع المباعه",
    "تكلفه المبيعات",
    "تكلفه المشتريات المباعه",
    "تكلفه البضاعه",
    "cost of goods sold",
    "cost of sales",
    "cogs",
  ];

  const isCostOfSales =
    costKeywords.some((keyword) => name.includes(normalizeText(keyword))) ||
    classification.includes("costofsales") ||
    classification.includes("cost_of_sales") ||
    classification.includes("cogs");

  if (isCostOfSales) {
    return "costOfSales";
  }

  /* -----------------------------------------
     OTHER INCOME
  ----------------------------------------- */

  if (
    classification.includes("otherincome") ||
    classification.includes("other_income")
  ) {
    return "otherIncome";
  }

  /* -----------------------------------------
     OTHER EXPENSE
  ----------------------------------------- */

  const otherExpenseKeywords = [
    "خسائر",
    "غرامات",
    "فروق عملات",
    "خسائر بيع الاصول",
    "مصروفات تمويل",
    "فوائد مدينه",
    "عمولات بنكيه",
    "other expense",
    "financial expense",
  ];

  if (
    otherExpenseKeywords.some((keyword) =>
      name.includes(normalizeText(keyword)),
    ) ||
    classification.includes("otherexpense") ||
    classification.includes("other_expense")
  ) {
    return "otherExpense";
  }

  /* -----------------------------------------
     OTHER INCOME BY NAME
  ----------------------------------------- */

  const otherIncomeKeywords = [
    "ارباح بيع الاصول",
    "ارباح استثمارات",
    "ايرادات اخرى",
    "ايرادات استثماريه",
    "other income",
  ];

  if (
    otherIncomeKeywords.some((keyword) => name.includes(normalizeText(keyword)))
  ) {
    return "otherIncome";
  }

  /* -----------------------------------------
     OPERATING EXPENSES
  ----------------------------------------- */

  if (
    classification.includes("operatingexpense") ||
    classification.includes("operating_expense")
  ) {
    return "operatingExpense";
  }

  return "operatingExpense";
};

/* =========================================================
   EMPTY REPORT
========================================================= */

const emptyReport: ReportData = {
  revenueItems: [],
  costOfSalesItems: [],
  operatingExpenseItems: [],
  otherIncomeItems: [],
  otherExpenseItems: [],

  totalRevenue: 0,
  totalCostOfSales: 0,
  grossProfit: 0,

  totalOperatingExpenses: 0,
  operatingProfit: 0,

  totalOtherIncome: 0,
  totalOtherExpenses: 0,

  netProfit: 0,
  profitMargin: 0,

  journalCount: 0,
  lineCount: 0,

  totalDebit: 0,
  totalCredit: 0,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function IncomeStatementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [journals, setJournals] = useState<Journal[]>([]);

  const [lines, setLines] = useState<JournalLine[]>([]);

  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(firstDayOfMonth);

  const [endDate, setEndDate] = useState(currentDate);

  const [companyId, setCompanyId] = useState("");

  const [error, setError] = useState("");

  /* =========================================================
     LOAD COMPANY
  ========================================================= */

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        setError("لم يتم العثور على المستخدم المسجل.");

        setLoading(false);

        return;
      }

      const user = JSON.parse(storedUser);

      if (user.type === "platform") {
        setError("مستخدم المنصة لا يمكنه الوصول إلى قائمة دخل الشركة.");

        setLoading(false);

        return;
      }

      if (!user.companyId) {
        setError("لم يتم العثور على الشركة المرتبطة بالمستخدم.");

        setLoading(false);

        return;
      }

      setCompanyId(String(user.companyId));
    } catch {
      setError("تعذر قراءة بيانات المستخدم.");

      setLoading(false);
    }
  }, []);

  /* =========================================================
     FETCH DATA
  ========================================================= */

  const fetchData = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      setError("");

      const [accountsResponse, journalsResponse, linesResponse] =
        await Promise.all([
          api.get("/accounts"),
          api.get("/journals"),
          api.get("/journalLines"),
        ]);

      const companyAccounts: Account[] = accountsResponse.data.filter(
        (item: Account) => String(item.companyId) === companyId,
      );

      const companyJournals: Journal[] = journalsResponse.data.filter(
        (item: Journal) => String(item.companyId) === companyId,
      );

      const companyLines: JournalLine[] = linesResponse.data.filter(
        (item: JournalLine) => String(item.companyId) === companyId,
      );

      setAccounts(companyAccounts);

      setJournals(companyJournals);

      setLines(companyLines);
    } catch (error) {
      console.error("Income Statement Error:", error);

      setError("تعذر تحميل بيانات قائمة الدخل.");

      toast.error("تعذر تحميل بيانات قائمة الدخل");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId, fetchData]);

  /* =========================================================
     CALCULATE REPORT
  ========================================================= */

  const report = useMemo<ReportData>(() => {
    if (!companyId || !startDate || !endDate) {
      return emptyReport;
    }

    if (startDate > endDate) {
      return emptyReport;
    }

    /* -----------------------------------------
       1. POSTED JOURNALS
    ----------------------------------------- */

    const postedJournals = journals.filter((journal) => {
      const date = normalizeDate(journal.date || journal.journalDate);

      return (
        String(journal.companyId) === companyId &&
        isPostedJournal(journal) &&
        !!date &&
        date >= startDate &&
        date <= endDate
      );
    });

    const journalIds = new Set(
      postedJournals.map((journal) => normalizeId(journal.id)),
    );

    /* -----------------------------------------
       2. FILTER JOURNAL LINES
    ----------------------------------------- */

    const filteredLines = lines.filter((line) => {
      return (
        String(line.companyId) === companyId &&
        journalIds.has(normalizeId(line.journalId))
      );
    });

    /* -----------------------------------------
       3. ACCOUNT MAP
    ----------------------------------------- */

    const accountMap = new Map<string, Account>();

    accounts.forEach((account) => {
      accountMap.set(normalizeId(account.id), account);
    });

    /* -----------------------------------------
       4. DIRECT ACCOUNT BALANCES

       Each account is calculated once.
       Group accounts are excluded to prevent
       double counting parent and child balances.
    ----------------------------------------- */

    const balances = new Map<
      string,
      {
        debit: number;
        credit: number;
      }
    >();

    filteredLines.forEach((line) => {
      const accountId = normalizeId(line.accountId);

      const account = accountMap.get(accountId);

      if (!account) return;

      // الحسابات التجميعية لا تدخل في التقرير
      if (account.isGroup === true) return;

      // منع الحسابات غير القابلة للترحيل
      if (account.allowPosting === false) return;

      const current = balances.get(accountId) || {
        debit: 0,
        credit: 0,
      };

      balances.set(accountId, {
        debit: current.debit + numberValue(line.debit),

        credit: current.credit + numberValue(line.credit),
      });
    });

    /* -----------------------------------------
       5. PREPARE REPORT ITEMS
    ----------------------------------------- */

    const revenueItems: ReportItem[] = [];

    const costOfSalesItems: ReportItem[] = [];

    const operatingExpenseItems: ReportItem[] = [];

    const otherIncomeItems: ReportItem[] = [];

    const otherExpenseItems: ReportItem[] = [];

    let totalDebit = 0;

    let totalCredit = 0;

    balances.forEach((balance) => {
      totalDebit += balance.debit;

      totalCredit += balance.credit;
    });

    /* -----------------------------------------
       6. CLASSIFY ACCOUNTS
    ----------------------------------------- */

    accounts.forEach((account) => {
      if (String(account.companyId) !== companyId) {
        return;
      }

      if (account.isGroup === true) return;

      if (account.allowPosting === false) return;

      const accountId = normalizeId(account.id);

      const balance = balances.get(accountId);

      if (!balance) return;

      const category = getAccountCategory(account);

      const debit = balance.debit;

      const credit = balance.credit;

      const creditBalance = credit - debit;

      const debitBalance = debit - credit;

      const item: ReportItem = {
        id: accountId,
        code: account.code || "",
        name: account.name,
        amount: 0,
      };

      /* ---------------------------------------
         REVENUE
      --------------------------------------- */

      if (category === "revenue") {
        item.amount = creditBalance;

        if (Math.abs(item.amount) > 0.000001) {
          revenueItems.push(item);
        }

        return;
      }

      /* ---------------------------------------
         COST OF SALES
      --------------------------------------- */

      if (category === "costOfSales") {
        item.amount = debitBalance;

        if (Math.abs(item.amount) > 0.000001) {
          costOfSalesItems.push(item);
        }

        return;
      }

      /* ---------------------------------------
         OPERATING EXPENSE
      --------------------------------------- */

      if (category === "operatingExpense") {
        item.amount = debitBalance;

        if (Math.abs(item.amount) > 0.000001) {
          operatingExpenseItems.push(item);
        }

        return;
      }

      /* ---------------------------------------
         OTHER INCOME
      --------------------------------------- */

      if (category === "otherIncome") {
        item.amount = creditBalance;

        if (Math.abs(item.amount) > 0.000001) {
          otherIncomeItems.push(item);
        }

        return;
      }

      /* ---------------------------------------
         OTHER EXPENSE
      --------------------------------------- */

      if (category === "otherExpense") {
        item.amount = debitBalance;

        if (Math.abs(item.amount) > 0.000001) {
          otherExpenseItems.push(item);
        }
      }
    });

    /* -----------------------------------------
       7. SORT ITEMS
    ----------------------------------------- */

    const sortItems = (items: ReportItem[]) => {
      return items.sort((a, b) =>
        a.code.localeCompare(b.code, "en", {
          numeric: true,
        }),
      );
    };

    sortItems(revenueItems);

    sortItems(costOfSalesItems);

    sortItems(operatingExpenseItems);

    sortItems(otherIncomeItems);

    sortItems(otherExpenseItems);

    /* -----------------------------------------
       8. TOTALS
    ----------------------------------------- */

    const sumItems = (items: ReportItem[]) =>
      items.reduce((sum, item) => sum + item.amount, 0);

    const totalRevenue = sumItems(revenueItems);

    const totalCostOfSales = sumItems(costOfSalesItems);

    const grossProfit = totalRevenue - totalCostOfSales;

    const totalOperatingExpenses = sumItems(operatingExpenseItems);

    const operatingProfit = grossProfit - totalOperatingExpenses;

    const totalOtherIncome = sumItems(otherIncomeItems);

    const totalOtherExpenses = sumItems(otherExpenseItems);

    const netProfit = operatingProfit + totalOtherIncome - totalOtherExpenses;

    const profitMargin =
      totalRevenue !== 0 ? (netProfit / totalRevenue) * 100 : 0;

    /* -----------------------------------------
       9. RETURN REPORT
    ----------------------------------------- */

    return {
      revenueItems,
      costOfSalesItems,
      operatingExpenseItems,
      otherIncomeItems,
      otherExpenseItems,

      totalRevenue,
      totalCostOfSales,
      grossProfit,

      totalOperatingExpenses,
      operatingProfit,

      totalOtherIncome,
      totalOtherExpenses,

      netProfit,
      profitMargin,

      journalCount: postedJournals.length,

      lineCount: filteredLines.length,

      totalDebit,
      totalCredit,
    };
  }, [accounts, journals, lines, companyId, startDate, endDate]);

  /* =========================================================
     DATE VALIDATION
  ========================================================= */

  const validateDates = () => {
    if (!startDate || !endDate) {
      toast.error("يرجى تحديد الفترة المالية.");

      return false;
    }

    if (startDate > endDate) {
      toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية.");

      return false;
    }

    return true;
  };

  /* =========================================================
     EXPORT CSV
  ========================================================= */

  const exportCSV = () => {
    if (!validateDates()) return;

    const rows = [
      ["قائمة الدخل"],
      [`من تاريخ: ${startDate}`, `إلى تاريخ: ${endDate}`],
      [],

      ["الإيرادات"],
      ["رقم الحساب", "اسم الحساب", "المبلغ"],

      ...report.revenueItems.map((item) => [item.code, item.name, item.amount]),

      ["إجمالي الإيرادات", "", report.totalRevenue],

      [],

      ["تكلفة البضاعة المباعة"],
      ["رقم الحساب", "اسم الحساب", "المبلغ"],

      ...report.costOfSalesItems.map((item) => [
        item.code,
        item.name,
        item.amount,
      ]),

      ["إجمالي تكلفة المبيعات", "", report.totalCostOfSales],

      ["مجمل الربح", "", report.grossProfit],

      [],

      ["المصروفات التشغيلية"],
      ["رقم الحساب", "اسم الحساب", "المبلغ"],

      ...report.operatingExpenseItems.map((item) => [
        item.code,
        item.name,
        item.amount,
      ]),

      ["إجمالي المصروفات التشغيلية", "", report.totalOperatingExpenses],

      ["الربح التشغيلي", "", report.operatingProfit],

      [],

      ["الإيرادات الأخرى"],
      ["رقم الحساب", "اسم الحساب", "المبلغ"],

      ...report.otherIncomeItems.map((item) => [
        item.code,
        item.name,
        item.amount,
      ]),

      ["إجمالي الإيرادات الأخرى", "", report.totalOtherIncome],

      [],

      ["المصروفات الأخرى"],
      ["رقم الحساب", "اسم الحساب", "المبلغ"],

      ...report.otherExpenseItems.map((item) => [
        item.code,
        item.name,
        item.amount,
      ]),

      ["إجمالي المصروفات الأخرى", "", report.totalOtherExpenses],

      [],

      ["صافي الربح / الخسارة", "", report.netProfit],

      ["هامش الربح", "", `${report.profitMargin.toFixed(2)}%`],
    ];

    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `income-statement-${startDate}-${endDate}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("تم تصدير التقرير بنجاح");
  };

  /* =========================================================
     STAT CARD
  ========================================================= */

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    subtitle: string;
  }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs text-slate-500">{title}</p>

          <h3 className="text-lg font-bold text-slate-800">{value}</h3>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );

  /* =========================================================
     ACCOUNT TABLE
  ========================================================= */

  const AccountTable = ({
    title,
    items,
    total,
    color,
  }: {
    title: string;
    items: ReportItem[];
    total: number;
    color: string;
  }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>

        <span className="text-xs text-slate-500">{items.length} حساب</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3">رقم الحساب</th>

              <th className="p-3">اسم الحساب</th>

              <th className="p-3">المبلغ</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  لا توجد بيانات خلال هذه الفترة
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-3 text-slate-500">{item.code || "-"}</td>

                  <td className="p-3 font-medium text-slate-700">
                    {item.name}
                  </td>

                  <td className={`p-3 font-semibold ${color}`}>
                    {money(item.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot className="border-t bg-slate-50">
            <tr>
              <td colSpan={2} className="p-3 font-bold">
                الإجمالي
              </td>

              <td className={`p-3 font-bold ${color}`}>{money(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <FiRefreshCw className="animate-spin text-2xl text-slate-500" />

        <span className="mr-3 text-sm text-slate-500">
          جاري تحميل قائمة الدخل...
        </span>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div dir="rtl" className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 text-red-700">
          <FiAlertCircle size={22} />

          <h2 className="font-bold">تعذر تحميل قائمة الدخل</h2>
        </div>

        <p className="mt-3 text-sm text-red-600">{error}</p>

        <button
          onClick={fetchData}
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
        >
          <FiRefreshCw size={15} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div dir="rtl" className="space-y-5 pb-10">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-800 p-2 text-white">
              <FiFileText size={20} />
            </div>

            <h1 className="text-xl font-bold text-slate-800">قائمة الدخل</h1>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            تقرير الإيرادات وتكلفة المبيعات والمصروفات وصافي الربح والخسارة
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            <FiDownload />
            Excel / CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
          >
            <FiPrinter />
            طباعة
          </button>
        </div>
      </div>

      {/* DATE FILTER */}

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <FiCalendar className="text-slate-500" />

          <h3 className="text-sm font-bold text-slate-700">الفترة المالية</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              من تاريخ
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              إلى تاريخ
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                if (!validateDates()) return;

                toast.success("تم تحديث الفترة المالية");
              }}
              className="w-full rounded-lg bg-slate-800 py-2 text-sm text-white hover:bg-slate-700"
            >
              عرض التقرير
            </button>
          </div>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي الإيرادات"
          value={money(report.totalRevenue)}
          icon={FiTrendingUp}
          color="bg-emerald-50 text-emerald-600"
          subtitle="إجمالي حسابات الإيرادات"
        />

        <StatCard
          title="تكلفة المبيعات"
          value={money(report.totalCostOfSales)}
          icon={FiTrendingDown}
          color="bg-orange-50 text-orange-600"
          subtitle="تكلفة البضاعة المباعة"
        />

        <StatCard
          title="مجمل الربح"
          value={money(report.grossProfit)}
          icon={FiDollarSign}
          color="bg-blue-50 text-blue-600"
          subtitle="الإيرادات بعد خصم تكلفة المبيعات"
        />

        <StatCard
          title={report.netProfit >= 0 ? "صافي الربح" : "صافي الخسارة"}
          value={money(Math.abs(report.netProfit))}
          icon={FiBarChart2}
          color={
            report.netProfit >= 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }
          subtitle="النتيجة النهائية للفترة"
        />
      </div>

      {/* PROFIT SUMMARY */}

      <div className="rounded-xl border bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">ملخص الأداء المالي</h3>

            <p className="mt-1 text-xs text-slate-400">
              نتائج النشاط خلال الفترة المحددة
            </p>
          </div>

          <FiBarChart2 className="text-slate-400" size={22} />
        </div>

        <div className="space-y-4">
          {/* REVENUE */}

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-600">الإيرادات</span>

              <strong className="text-emerald-600">
                {money(report.totalRevenue)}
              </strong>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: report.totalRevenue > 0 ? "100%" : "0%",
                }}
              />
            </div>
          </div>

          {/* COST */}

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-600">تكلفة المبيعات</span>

              <strong className="text-orange-600">
                {money(report.totalCostOfSales)}
              </strong>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{
                  width:
                    report.totalRevenue > 0
                      ? `${Math.min(
                          Math.max(
                            (report.totalCostOfSales / report.totalRevenue) *
                              100,
                            0,
                          ),
                          100,
                        )}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          {/* OPERATING EXPENSES */}

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-600">المصروفات التشغيلية</span>

              <strong className="text-red-600">
                {money(report.totalOperatingExpenses)}
              </strong>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width:
                    report.totalRevenue > 0
                      ? `${Math.min(
                          Math.max(
                            (report.totalOperatingExpenses /
                              report.totalRevenue) *
                              100,
                            0,
                          ),
                          100,
                        )}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-between gap-4 border-t pt-4">
          <div>
            <p className="text-xs text-slate-500">هامش صافي الربح</p>

            <p
              className={`mt-1 text-xl font-bold ${
                report.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {report.profitMargin.toFixed(2)}%
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">قيود اليومية المرحلة</p>

            <p className="mt-1 text-xl font-bold text-slate-800">
              {report.journalCount}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">عدد تفاصيل القيود</p>

            <p className="mt-1 text-xl font-bold text-slate-800">
              {report.lineCount}
            </p>
          </div>
        </div>
      </div>

      {/* REVENUE */}

      <AccountTable
        title="الإيرادات"
        items={report.revenueItems}
        total={report.totalRevenue}
        color="text-emerald-600"
      />

      {/* COST OF SALES */}

      <AccountTable
        title="تكلفة البضاعة المباعة"
        items={report.costOfSalesItems}
        total={report.totalCostOfSales}
        color="text-orange-600"
      />

      {/* GROSS PROFIT */}

      <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
        <span className="font-bold text-blue-900">مجمل الربح</span>

        <span className="text-xl font-bold text-blue-700">
          {money(report.grossProfit)}
        </span>
      </div>

      {/* OPERATING EXPENSES */}

      <AccountTable
        title="المصروفات التشغيلية"
        items={report.operatingExpenseItems}
        total={report.totalOperatingExpenses}
        color="text-red-600"
      />

      {/* OPERATING PROFIT */}

      <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <span className="font-bold text-indigo-900">صافي الربح التشغيلي</span>

        <span className="text-xl font-bold text-indigo-700">
          {money(report.operatingProfit)}
        </span>
      </div>

      {/* OTHER INCOME */}

      <AccountTable
        title="الإيرادات الأخرى"
        items={report.otherIncomeItems}
        total={report.totalOtherIncome}
        color="text-emerald-600"
      />

      {/* OTHER EXPENSES */}

      <AccountTable
        title="المصروفات الأخرى"
        items={report.otherExpenseItems}
        total={report.totalOtherExpenses}
        color="text-red-600"
      />

      {/* FINAL RESULT */}

      <div
        className={`rounded-xl border p-5 ${
          report.netProfit >= 0
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">
              النتيجة النهائية للفترة المالية
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-800">
              {report.netProfit >= 0 ? "صافي الربح" : "صافي الخسارة"}
            </h2>
          </div>

          <div className="text-left">
            <p
              className={`text-2xl font-bold ${
                report.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {money(Math.abs(report.netProfit))}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200/70 pt-4 text-sm sm:grid-cols-3">
          <div>
            <span className="text-slate-500">مجمل الربح</span>

            <p className="mt-1 font-bold">{money(report.grossProfit)}</p>
          </div>

          <div>
            <span className="text-slate-500">المصروفات التشغيلية</span>

            <p className="mt-1 font-bold">
              {money(report.totalOperatingExpenses)}
            </p>
          </div>

          <div>
            <span className="text-slate-500">صافي النتيجة</span>

            <p className="mt-1 font-bold">{money(report.netProfit)}</p>
          </div>
        </div>
      </div>

      {/* ACCOUNTING CHECK */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          {Math.abs(report.totalDebit - report.totalCredit) < 0.01 ? (
            <FiCheckCircle className="text-emerald-600" size={20} />
          ) : (
            <FiAlertCircle className="text-red-600" size={20} />
          )}

          <h3 className="font-bold text-slate-800">التحقق من توازن القيود</h3>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">إجمالي المدين</p>

            <p className="mt-2 font-bold text-slate-800">
              {money(report.totalDebit)}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">إجمالي الدائن</p>

            <p className="mt-2 font-bold text-slate-800">
              {money(report.totalCredit)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {Math.abs(report.totalDebit - report.totalCredit) < 0.01
            ? "إجمالي المدين يساوي إجمالي الدائن."
            : "يوجد اختلاف في إجمالي المدين والدائن. يرجى مراجعة القيود المرحلة."}
        </p>
      </div>

      {/* FOOTER */}

      <div className="text-center text-xs text-slate-400">
        تم إعداد التقرير اعتماداً على قيود اليومية المرحلة للفترة من {startDate}{" "}
        إلى {endDate}
      </div>

      {/* PRINT */}

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
