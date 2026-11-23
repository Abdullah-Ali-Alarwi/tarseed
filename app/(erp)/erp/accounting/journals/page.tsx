"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import axios from "axios";

import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiBookOpen,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiEdit,
  FiUser,
  FiCalendar,
} from "react-icons/fi";

import { toast } from "sonner";

import { saveActivityLog } from "@/app/(erp)/erp/lib/activity";

// JSON Server
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// أنواع البيانات

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
  companyId: string;
}

type FilterStatus = "all" | JournalStatus;

interface JournalFilters {
  search: string;
  status: FilterStatus;
}

// تنسيق العملة
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// تنسيق التاريخ
const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

// تنسيق الوقت
const formatDateTime = (date?: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

// قراءة Cookie
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

export default function JournalsPage() {
  const router = useRouter();

  // المستخدم الحالي
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [userLoading, setUserLoading] = useState(true);

  const [userError, setUserError] = useState("");

  // القيود
  const [journals, setJournals] = useState<Journal[]>([]);

  // تفاصيل القيود
  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // الفلاتر
  const [filters, setFilters] = useState<JournalFilters>({
    search: "",
    status: "all",
  });

  // منع تكرار تسجيل مشاهدة الصفحة
  const activityLogged = useRef(false);

  // تحديد المستخدم والشركة
  useEffect(() => {
    let mounted = true;

    const getCurrentUser = async () => {
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
          ? err.response?.data?.message || "تعذر الاتصال بـ JSON Server"
          : err instanceof Error
            ? err.message
            : "حدث خطأ غير متوقع";

        if (mounted) {
          setUserError(message);
        }
      } finally {
        if (mounted) {
          setUserLoading(false);
        }
      }
    };

    void getCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  // تسجيل مشاهدة صفحة القيود
  useEffect(() => {
    if (!currentUser || !companyId || activityLogged.current) {
      return;
    }

    activityLogged.current = true;

    void saveActivityLog({
      action: "view",
      module: "accounting.journals",
      description: "عرض صفحة القيود اليومية",
      recordName: "القيود اليومية",
    });
  }, [currentUser, companyId]);

  // جلب القيود وتفاصيلها
  const fetchJournals = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError("");

      const [journalsResponse, linesResponse] = await Promise.all([
        api.get<Journal[]>("/journals", {
          params: { companyId },
        }),

        api.get<JournalLine[]>("/journalLines", {
          params: { companyId },
        }),
      ]);

      // التأكد من الشركة الحالية
      const companyJournals = journalsResponse.data.filter(
        (journal) => String(journal.companyId) === companyId,
      );

      const companyLines = linesResponse.data.filter(
        (line) => String(line.companyId) === companyId,
      );

      setJournals(companyJournals);
      setJournalLines(companyLines);
    } catch (err) {
      console.error("Fetch Journals Error:", err);

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر تحميل القيود اليومية"
          : "حدث خطأ أثناء تحميل القيود",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      void fetchJournals();
    }
  }, [companyId, fetchJournals]);

  // قيود الشركة الحالية
  const companyJournals = useMemo(() => {
    return journals.filter(
      (journal) => String(journal.companyId) === companyId,
    );
  }, [journals, companyId]);

  // القيود المرحلة فقط
  const postedJournals = useMemo(() => {
    return companyJournals.filter((journal) => journal.status === "posted");
  }, [companyJournals]);

  // حساب الإحصائيات من سطور القيود المرحلة
  // حتى تتوافق مع البيانات المستخدمة في القوائم المالية
  const stats = useMemo(() => {
    const total = companyJournals.length;

    const drafts = companyJournals.filter(
      (journal) => journal.status === "draft",
    ).length;

    const posted = postedJournals.length;

    const cancelled = companyJournals.filter(
      (journal) => journal.status === "cancelled",
    ).length;

    const postedIds = new Set(
      postedJournals.map((journal) => String(journal.id)),
    );

    const postedLines = journalLines.filter((line) =>
      postedIds.has(String(line.journalId)),
    );

    const totalDebit = postedLines.reduce(
      (sum, line) => sum + Number(line.debit || 0),
      0,
    );

    const totalCredit = postedLines.reduce(
      (sum, line) => sum + Number(line.credit || 0),
      0,
    );

    return {
      total,
      drafts,
      posted,
      cancelled,
      totalDebit,
      totalCredit,
    };
  }, [companyJournals, postedJournals, journalLines]);

  // البحث والتصفية
  const filteredJournals = useMemo(() => {
    return companyJournals.filter((journal) => {
      const search = filters.search.trim().toLowerCase();

      const searchMatch =
        String(journal.journalNumber || "")
          .toLowerCase()
          .includes(search) ||
        String(journal.description || "")
          .toLowerCase()
          .includes(search) ||
        String(journal.reference || "")
          .toLowerCase()
          .includes(search) ||
        String(journal.createdByName || "")
          .toLowerCase()
          .includes(search) ||
        String(journal.createdBy || "")
          .toLowerCase()
          .includes(search);

      const statusMatch =
        filters.status === "all" || journal.status === filters.status;

      return searchMatch && statusMatch;
    });
  }, [companyJournals, filters]);

  // عدد السطور لكل قيد
  const getJournalLinesCount = (journalId: number | string) => {
    return journalLines.filter(
      (line) => String(line.journalId) === String(journalId),
    ).length;
  };

  // معلومات منشئ القيد
  const getCreatorName = (journal: Journal) => {
    return journal.createdByName || journal.createdBy || "غير محدد";
  };

  // حالة القيد
  const getStatusInfo = (status: JournalStatus) => {
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
  };

  // إنشاء قيد
  const handleCreate = () => {
    router.push("/erp/accounting/journals/create");
  };

  // عرض القيد
  const handleView = (journal: Journal) => {
    if (String(journal.companyId) !== companyId) {
      toast.error("لا يمكنك عرض قيد تابع لشركة أخرى");
      return;
    }

    router.push(`/erp/accounting/journals/${journal.id}`);
  };

  // تعديل القيد
  const handleEdit = (journal: Journal) => {
    if (String(journal.companyId) !== companyId) {
      toast.error("لا يمكنك تعديل قيد تابع لشركة أخرى");
      return;
    }

    if (journal.status !== "draft") {
      toast.error("يمكن تعديل القيود غير المرحلة فقط");
      return;
    }

    router.push(`/erp/accounting/journals/${journal.id}/edit`);
  };

  // تحميل المستخدم
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

  // خطأ المستخدم
  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-bold text-red-600">تعذر فتح القيود اليومية</h2>

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

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* العنوان */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">القيود اليومية</h1>

          <p className="mt-2 text-sm text-slate-500">
            تسجيل ومراجعة وترحيل العمليات المالية للشركة
          </p>

          <p className="mt-2 text-sm text-blue-700">
            الشركة:{" "}
            <span className="font-semibold">
              {currentUser?.companyname || "الشركة الحالية"}
            </span>
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus size={18} />
          إنشاء قيد يومي
        </button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي القيود</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {stats.total}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiBookOpen size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">القيود المرحلة</p>

              <h3 className="mt-2 text-2xl font-bold text-green-600">
                {stats.posted}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <FiCheckCircle size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">القيود المسودة</p>

              <h3 className="mt-2 text-2xl font-bold text-amber-600">
                {stats.drafts}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FiClock size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي المدين المرحّل</p>

              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrency(stats.totalDebit)}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FiFileText size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* ملخص التوازن */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">إجمالي المدين المرحّل</p>

          <p className="mt-2 text-lg font-bold text-blue-700">
            {formatCurrency(stats.totalDebit)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">إجمالي الدائن المرحّل</p>

          <p className="mt-2 text-lg font-bold text-green-700">
            {formatCurrency(stats.totalCredit)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">الفرق بين المدين والدائن</p>

          <p
            className={`mt-2 text-lg font-bold ${
              Math.abs(stats.totalDebit - stats.totalCredit) < 0.01
                ? "text-green-700"
                : "text-red-600"
            }`}
          >
            {formatCurrency(stats.totalDebit - stats.totalCredit)}
          </p>
        </div>
      </div>

      {/* البحث والتصفية */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              placeholder="ابحث برقم القيد أو البيان أو المرجع أو المستخدم..."
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as FilterStatus,
              }))
            }
            className="rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">جميع حالات القيود</option>

            <option value="draft">مسودة</option>

            <option value="posted">مرحّل</option>

            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {/* جدول القيود */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="font-bold text-slate-800">سجل القيود اليومية</h2>

            <p className="mt-1 text-xs text-slate-500">
              عدد النتائج: {filteredJournals.length}
            </p>
          </div>

          <button
            onClick={() => void fetchJournals()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            جارٍ تحميل القيود اليومية...
          </div>
        ) : error ? (
          <div className="space-y-4 py-16 text-center">
            <p className="text-red-600">{error}</p>

            <button
              onClick={() => void fetchJournals()}
              className="inline-flex items-center gap-2 font-medium text-blue-600"
            >
              <FiRefreshCw />
              إعادة المحاولة
            </button>
          </div>
        ) : filteredJournals.length === 0 ? (
          <div className="py-16 text-center">
            <FiBookOpen size={40} className="mx-auto mb-3 text-slate-300" />

            <h3 className="font-semibold text-slate-700">لا توجد قيود يومية</h3>

            <p className="mt-2 text-sm text-slate-400">
              لم يتم تسجيل أي قيود لهذه الشركة حتى الآن
            </p>

            <button
              onClick={handleCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FiPlus />
              إنشاء أول قيد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">رقم القيد</th>

                  <th className="px-5 py-4 font-semibold">التاريخ</th>

                  <th className="px-5 py-4 font-semibold">البيان</th>

                  <th className="px-5 py-4 font-semibold">عدد السطور</th>

                  <th className="px-5 py-4 font-semibold">المدين</th>

                  <th className="px-5 py-4 font-semibold">الدائن</th>

                  <th className="px-5 py-4 font-semibold">منشئ القيد</th>

                  <th className="px-5 py-4 font-semibold">تاريخ الإنشاء</th>

                  <th className="px-5 py-4 font-semibold">الحالة</th>

                  <th className="px-5 py-4 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredJournals.map((journal) => {
                  const status = getStatusInfo(journal.status);

                  return (
                    <tr
                      key={journal.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-blue-700">
                        {journal.journalNumber}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(journal.date)}
                      </td>

                      <td className="max-w-[250px] px-5 py-4">
                        <p className="truncate font-medium text-slate-800">
                          {journal.description}
                        </p>

                        {journal.reference && (
                          <p className="mt-1 text-xs text-slate-400">
                            المرجع: {journal.reference}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {getJournalLinesCount(journal.id)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {formatCurrency(journal.totalDebit)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {formatCurrency(journal.totalCredit)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <FiUser className="text-slate-400" size={15} />

                          <span>{getCreatorName(journal)}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-slate-400" size={14} />

                          {formatDateTime(journal.createdAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(journal)}
                            title="عرض القيد"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                          >
                            <FiEye size={17} />
                          </button>

                          {journal.status === "draft" && (
                            <button
                              onClick={() => handleEdit(journal)}
                              title="تعديل القيد"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                            >
                              <FiEdit size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
