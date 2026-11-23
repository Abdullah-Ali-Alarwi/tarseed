"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit,
  FiFileText,
  FiRefreshCw,
  FiUser,
  FiHash,
  FiAlertCircle,
  FiPrinter,
  FiLock,
} from "react-icons/fi";

import { toast } from "sonner";

import { logUpdate, saveActivityLog } from "@/app/(erp)/erp/lib/activity";

// ============================================
// API
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// Types
// ============================================

type JournalStatus = "draft" | "posted" | "cancelled";

interface CurrentUser {
  id: number | string;
  name: string;
  username: string;
  type: string;
  role: string;
  companyId?: string;
  companyname?: string;
}

interface Journal {
  id: number | string;
  journalNumber: string;
  date: string;
  description: string;
  reference?: string;

  status: JournalStatus;

  totalDebit: number;
  totalCredit: number;

  companyId: string;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdAt?: string;

  updatedBy?: string;
  updatedById?: string;
  updatedByName?: string;
  updatedAt?: string;

  postedBy?: string;
  postedById?: string;
  postedByName?: string;
  postedAt?: string;
}

interface JournalLine {
  id: number | string;
  journalId: number | string;
  accountId: number | string;

  debit: number;
  credit: number;

  description?: string;

  companyId: string;

  createdByName?: string;
}

interface Account {
  id: number | string;
  companyId: string;

  code?: string;
  accountCode?: string;

  name?: string;
  accountName?: string;

  type?: string;
  nature?: string;
}

// ============================================
// Helpers
// ============================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(date?: string) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function formatDateTime(date?: string) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getAccountCode(account?: Account) {
  if (!account) return "-";

  return account.code || account.accountCode || "";
}

function getAccountName(account?: Account) {
  if (!account) return "حساب غير معروف";

  return account.name || account.accountName || "حساب بدون اسم";
}

// ============================================
// Status
// ============================================

function getStatusInfo(status: JournalStatus) {
  switch (status) {
    case "posted":
      return {
        label: "مرحّل",
        className: "bg-green-50 text-green-700 border-green-200",
      };

    case "cancelled":
      return {
        label: "ملغي",
        className: "bg-red-50 text-red-700 border-red-200",
      };

    default:
      return {
        label: "مسودة",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
  }
}

// ============================================
// Page
// ============================================

export default function JournalDetailsPage() {
  const router = useRouter();

  const params = useParams<{ id: string }>();

  const journalId = String(params.id);

  // User
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [userLoading, setUserLoading] = useState(true);

  const [userError, setUserError] = useState("");

  // Journal
  const [journal, setJournal] = useState<Journal | null>(null);

  const [lines, setLines] = useState<JournalLine[]>([]);

  const [accounts, setAccounts] = useState<Account[]>([]);

  // Loading
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [posting, setPosting] = useState(false);

  const [activityLogged, setActivityLogged] = useState(false);

  const activityRef = useRef(false);

  // ============================================
  // Load Current User
  // ============================================

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        setUserLoading(true);
        setUserError("");

        const username = getCookie("username");

        if (!username) {
          throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
        }

        const response = await api.get<CurrentUser[]>("/users", {
          params: { username },
        });

        const user = response.data.find((item) => item.username === username);

        if (!user) {
          throw new Error("المستخدم غير موجود");
        }

        if (user.type === "platform") {
          throw new Error("لا يمكن لمستخدم المنصة الوصول إلى قيود الشركة");
        }

        if (!user.companyId) {
          throw new Error("المستخدم غير مرتبط بأي شركة");
        }

        if (!mounted) return;

        setCurrentUser(user);
        setCompanyId(String(user.companyId));
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر الاتصال بالخادم"
          : err instanceof Error
            ? err.message
            : "حدث خطأ غير متوقع";

        if (mounted) setUserError(message);
      } finally {
        if (mounted) setUserLoading(false);
      }
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================
  // Load Journal Details
  // ============================================

  const fetchJournal = useCallback(async () => {
    if (!companyId || !journalId) return;

    try {
      setLoading(true);
      setError("");

      const [journalResponse, linesResponse, accountsResponse] =
        await Promise.all([
          api.get<Journal>(`/journals/${encodeURIComponent(journalId)}`),

          api.get<JournalLine[]>("/journalLines", {
            params: {
              companyId,
              journalId,
            },
          }),

          api.get<Account[]>("/accounts", {
            params: { companyId },
          }),
        ]);

      const journalData = journalResponse.data;

      // التحقق من ملكية القيد للشركة
      if (String(journalData.companyId) !== companyId) {
        throw new Error("هذا القيد لا يتبع الشركة الحالية");
      }

      const companyLines = linesResponse.data.filter(
        (line) =>
          String(line.companyId) === companyId &&
          String(line.journalId) === journalId,
      );

      const companyAccounts = accountsResponse.data.filter(
        (account) => String(account.companyId) === companyId,
      );

      setJournal(journalData);
      setLines(companyLines);
      setAccounts(companyAccounts);
    } catch (err) {
      console.error("Fetch Journal Error:", err);

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر تحميل بيانات القيد"
          : err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل القيد",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId, journalId]);

  useEffect(() => {
    if (companyId) {
      void fetchJournal();
    }
  }, [companyId, fetchJournal]);

  // ============================================
  // Activity: View Journal
  // ============================================

  useEffect(() => {
    if (!currentUser || !journal || !companyId || activityRef.current) {
      return;
    }

    activityRef.current = true;

    void saveActivityLog({
      action: "view",
      module: "accounting.journals",
      description: `عرض تفاصيل القيد ${journal.journalNumber}`,
      recordId: journal.id,
      recordName: journal.journalNumber,
    });

    setActivityLogged(true);
  }, [currentUser, journal, companyId]);

  // ============================================
  // Account Map
  // ============================================

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();

    accounts.forEach((account) => {
      map.set(String(account.id), account);
    });

    return map;
  }, [accounts]);

  // ============================================
  // Totals
  // ============================================

  const totalDebit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  }, [lines]);

  const difference = totalDebit - totalCredit;

  const isBalanced =
    lines.length >= 2 &&
    totalDebit > 0 &&
    totalCredit > 0 &&
    Math.abs(difference) < 0.01;

  // ============================================
  // Edit
  // ============================================

  function handleEdit() {
    if (!journal) return;

    if (String(journal.companyId) !== companyId) {
      toast.error("لا يمكنك تعديل قيد تابع لشركة أخرى");
      return;
    }

    if (journal.status !== "draft") {
      toast.error("يمكن تعديل القيود المسودة فقط");
      return;
    }

    router.push(`/erp/accounting/journals/${journal.id}/edit`);
  }

  // ============================================
  // Post Journal
  // ============================================

  async function handlePost() {
    if (!journal || !currentUser || !companyId) {
      toast.error("بيانات القيد أو المستخدم غير مكتملة");
      return;
    }

    if (posting) return;

    if (String(journal.companyId) !== companyId) {
      toast.error("لا يمكنك ترحيل قيد تابع لشركة أخرى");
      return;
    }

    if (journal.status !== "draft") {
      toast.error("هذا القيد ليس مسودة");
      return;
    }

    if (!isBalanced) {
      toast.error("لا يمكن ترحيل القيد لأنه غير متوازن");
      return;
    }

    const confirmed = window.confirm(
      "هل تريد ترحيل هذا القيد؟ سيصبح معتمدًا ضمن البيانات المحاسبية المستخدمة في القوائم المالية.",
    );

    if (!confirmed) return;

    try {
      setPosting(true);

      const now = new Date().toISOString();

      const updateData = {
        status: "posted" as const,

        totalDebit,
        totalCredit,

        postedBy: String(currentUser.id),
        postedById: String(currentUser.id),

        postedByName: currentUser.name || currentUser.username,

        postedAt: now,

        updatedBy: String(currentUser.id),
        updatedById: String(currentUser.id),

        updatedByName: currentUser.name || currentUser.username,

        updatedAt: now,
      };

      const response = await api.patch<Journal>(
        `/journals/${encodeURIComponent(String(journal.id))}`,
        updateData,
      );

      const updatedJournal = response.data;

      setJournal(updatedJournal);

      await logUpdate(
        "accounting.journals",
        `ترحيل القيد رقم ${journal.journalNumber}`,
        journal.id,
        journal.journalNumber,
        {
          status: journal.status,
        },
        {
          status: "posted",
          postedBy: String(currentUser.id),
          postedByName: currentUser.name || currentUser.username,
          postedAt: now,
        },
      );

      toast.success("تم ترحيل القيد بنجاح");
    } catch (err) {
      console.error("Post Journal Error:", err);

      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر ترحيل القيد"
          : "حدث خطأ أثناء ترحيل القيد",
      );
    } finally {
      setPosting(false);
    }
  }

  // ============================================
  // Print
  // ============================================

  function handlePrint() {
    window.print();

    if (journal) {
      void saveActivityLog({
        action: "view",
        module: "accounting.journals",
        description: `طباعة القيد رقم ${journal.journalNumber}`,
        recordId: journal.id,
        recordName: journal.journalNumber,
      });
    }
  }

  // ============================================
  // Loading
  // ============================================

  if (userLoading || loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">جارٍ تحميل بيانات القيد...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error
  // ============================================

  if (userError || error || !journal || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <FiAlertCircle size={40} className="mx-auto mb-4 text-red-500" />

          <h2 className="font-bold text-red-600">تعذر فتح القيد اليومي</h2>

          <p className="mt-3 text-sm text-slate-600">
            {userError || error || "لم يتم العثور على القيد"}
          </p>

          <button
            onClick={() => router.push("/erp/accounting/journals")}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            العودة إلى القيود اليومية
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusInfo(journal.status);

  // ============================================
  // UI
  // ============================================

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/erp/accounting/journals")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
              title="العودة"
            >
              <FiArrowRight size={18} />
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              تفاصيل القيد اليومي
            </h1>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            عرض ومراجعة تفاصيل العملية المحاسبية
          </p>

          <p className="mt-2 text-sm text-blue-700">
            الشركة:{" "}
            <span className="font-semibold">
              {currentUser?.companyname || "الشركة الحالية"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FiPrinter />
            طباعة
          </button>

          <button
            onClick={() => void fetchJournal()}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          {journal.status === "draft" && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                <FiEdit />
                تعديل
              </button>

              <button
                onClick={() => void handlePost()}
                disabled={posting || !isBalanced}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiCheckCircle />
                )}
                ترحيل القيد
              </button>
            </>
          )}
        </div>
      </div>

      {/* Journal Header Card */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                {journal.journalNumber}
              </h2>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">{journal.description}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">إجمالي القيد</p>

            <p className="mt-1 text-xl font-bold text-blue-700">
              {formatCurrency(totalDebit)}
            </p>

            <p className="mt-1 text-xs text-slate-400">العملة: YER</p>
          </div>
        </div>
      </div>

      {/* Journal Information */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FiHash size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">رقم القيد</p>

              <p className="mt-1 font-bold text-slate-800">
                {journal.journalNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FiCalendar size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">تاريخ القيد</p>

              <p className="mt-1 font-bold text-slate-800">
                {formatDate(journal.date)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FiUser size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">منشئ القيد</p>

              <p className="mt-1 font-bold text-slate-800">
                {journal.createdByName || journal.createdBy || "غير محدد"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FiClock size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">تاريخ الإنشاء</p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatDateTime(journal.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reference */}

      {journal.reference && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">المرجع</p>

          <p className="mt-2 font-semibold text-slate-800">
            {journal.reference}
          </p>
        </div>
      )}

      {/* Posting Information */}

      {journal.status === "posted" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-3">
            <FiCheckCircle size={24} className="text-green-600" />

            <div>
              <h3 className="font-bold text-green-800">تم ترحيل القيد</h3>

              <p className="mt-1 text-sm text-green-700">
                رحّل القيد بواسطة:{" "}
                <strong>
                  {journal.postedByName || journal.postedBy || "غير محدد"}
                </strong>
              </p>

              <p className="mt-1 text-sm text-green-700">
                تاريخ الترحيل: {formatDateTime(journal.postedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {journal.status === "draft" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <FiClock size={24} className="text-amber-600" />

            <div>
              <h3 className="font-bold text-amber-800">القيد محفوظ كمسودة</h3>

              <p className="mt-1 text-sm text-amber-700">
                لن يدخل هذا القيد في القوائم المالية حتى يتم ترحيله.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Journal Lines */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 p-5">
          <FiBookOpen className="text-blue-600" size={21} />

          <div>
            <h2 className="font-bold text-slate-800">تفاصيل الحسابات</h2>

            <p className="mt-1 text-xs text-slate-500">
              السطور المحاسبية المرتبطة بهذا القيد
            </p>
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            لا توجد سطور محاسبية لهذا القيد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">#</th>

                  <th className="px-5 py-4">رمز الحساب</th>

                  <th className="px-5 py-4">اسم الحساب</th>

                  <th className="px-5 py-4">البيان</th>

                  <th className="px-5 py-4">مدين</th>

                  <th className="px-5 py-4">دائن</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {lines.map((line, index) => {
                  const account = accountMap.get(String(line.accountId));

                  return (
                    <tr key={line.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4 text-slate-500">{index + 1}</td>

                      <td className="px-5 py-4 font-semibold text-blue-700">
                        {getAccountCode(account)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {getAccountName(account)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {line.description || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-blue-700">
                        {formatCurrency(Number(line.debit || 0))}
                      </td>

                      <td className="px-5 py-4 font-medium text-green-700">
                        {formatCurrency(Number(line.credit || 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-4 font-bold text-slate-800"
                  >
                    الإجمالي
                  </td>

                  <td className="px-5 py-4 font-bold text-blue-700">
                    {formatCurrency(totalDebit)}
                  </td>

                  <td className="px-5 py-4 font-bold text-green-700">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Balance Summary */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">إجمالي المدين</p>

          <p className="mt-2 text-xl font-bold text-blue-700">
            {formatCurrency(totalDebit)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">إجمالي الدائن</p>

          <p className="mt-2 text-xl font-bold text-green-700">
            {formatCurrency(totalCredit)}
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 shadow-sm ${
            isBalanced
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <FiCheckCircle className="text-green-600" />
            ) : (
              <FiAlertCircle className="text-red-600" />
            )}

            <p className="text-sm text-slate-600">
              {isBalanced ? "القيد متوازن" : "القيد غير متوازن"}
            </p>
          </div>

          <p
            className={`mt-2 text-xl font-bold ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatCurrency(Math.abs(difference))}
          </p>
        </div>
      </div>

      {/* Footer */}

      <div className="flex flex-wrap justify-between gap-3 print:hidden">
        <button
          onClick={() => router.push("/erp/accounting/journals")}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FiArrowRight />
          العودة إلى القيود
        </button>

        {journal.status === "posted" && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FiLock />
            القيد مرحّل ولا يمكن تعديله
          </div>
        )}
      </div>
    </div>
  );
}
