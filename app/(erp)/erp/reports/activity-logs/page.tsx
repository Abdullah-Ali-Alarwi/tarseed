"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import {
  FiActivity,
  FiSearch,
  FiRefreshCw,
  FiCalendar,
  FiDownload,
  FiUser,
  FiClock,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiX,
  FiFileText,
  FiCheckCircle,
  FiDollarSign,
} from "react-icons/fi";

// =====================================================
// TYPES
// =====================================================

interface ActivityLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  username: string;
  userRole: string;
  action: string;
  module: string;
  description: string;
  recordId: string | null;
  recordName: string | null;
  oldData: any;
  newData: any;
  createdAt: string;
  extra?: any;
}

interface ActivityUser {
  userId: string;
  username: string;
  userName: string;
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

function formatDate(value: string): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("ar", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    create: "إضافة",
    insert: "إضافة",
    update: "تعديل",
    delete: "حذف",
    view: "عرض",
    login: "تسجيل دخول",
    logout: "تسجيل خروج",
    approve: "اعتماد",
    cancel: "إلغاء",
    post: "ترحيل",
    print: "طباعة",
  };

  return labels[action?.toLowerCase()] || action || "غير محدد";
}

function getActionStyle(action: string): string {
  switch (action?.toLowerCase()) {
    case "create":
    case "insert":
      return "bg-green-50 text-green-700";

    case "update":
      return "bg-blue-50 text-blue-700";

    case "delete":
      return "bg-red-50 text-red-700";

    case "view":
      return "bg-slate-100 text-slate-600";

    case "login":
      return "bg-purple-50 text-purple-700";

    case "logout":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function escapeCsv(value: any): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

// =====================================================
// FRIENDLY DATA DISPLAY
// =====================================================

const fieldLabels: Record<string, string> = {
  journalNumber: "رقم القيد",
  date: "التاريخ",
  description: "البيان",
  reference: "المرجع",
  status: "الحالة",
  totalDebit: "إجمالي المدين",
  totalCredit: "إجمالي الدائن",
  createdBy: "أنشأه",
  createdByName: "اسم المستخدم",
  postedBy: "اعتمده",
  postedByName: "اسم المعتمد",
  postedAt: "تاريخ الاعتماد",

  invoiceNumber: "رقم الفاتورة",
  quotationNumber: "رقم عرض السعر",
  returnNumber: "رقم المرتجع",
  transferNumber: "رقم التحويل",

  name: "الاسم",
  customerName: "العميل",
  supplierName: "المورد",
  supplier: "المورد",
  productName: "المنتج",
  warehouseName: "المستودع",

  phone: "رقم الهاتف",
  address: "العنوان",
  notes: "ملاحظات",
  reason: "السبب",

  subtotal: "الإجمالي قبل الخصم",
  discount: "الخصم",
  tax: "الضريبة",
  total: "الإجمالي النهائي",
  grandTotal: "الإجمالي النهائي",
  paidAmount: "المبلغ المدفوع",
  remainingAmount: "المبلغ المتبقي",

  quantity: "الكمية",
  totalQuantity: "إجمالي الكمية",
  itemCount: "عدد الأصناف",

  paymentMethod: "طريقة الدفع",
  paymentMethodName: "طريقة الدفع",
  statusName: "الحالة",
};

const hiddenFields = new Set([
  "id",
  "companyId",
  "userId",
  "auth_user_id",
  "createdById",
  "updatedById",
  "postedById",
  "extra",
  "oldData",
  "newData",
  "createdAt",
  "updatedAt",
  "password",
  "token",
  "access_token",
  "refresh_token",
]);

function getFriendlyValue(key: string, value: any): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "date" || key === "postedAt") {
    return formatDate(String(value));
  }

  if (key === "status") {
    const statuses: Record<string, string> = {
      draft: "مسودة",
      posted: "مرحل",
      approved: "معتمد",
      cancelled: "ملغي",
      canceled: "ملغي",
      pending: "قيد الانتظار",
      active: "نشط",
      inactive: "غير نشط",
      completed: "مكتمل",
      paid: "مدفوع",
      unpaid: "غير مدفوع",
      partial: "مدفوع جزئياً",
    };

    return statuses[String(value).toLowerCase()] || String(value);
  }

  if (
    [
      "totalDebit",
      "totalCredit",
      "subtotal",
      "discount",
      "tax",
      "total",
      "grandTotal",
      "paidAmount",
      "remainingAmount",
    ].includes(key)
  ) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
  }

  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }

  if (typeof value === "object") {
    return Array.isArray(value)
      ? `عدد العناصر: ${value.length}`
      : "بيانات إضافية";
  }

  return String(value);
}

// =====================================================
// DATA CARD COMPONENT
// =====================================================

function AuditDataCard({
  title,
  data,
  type,
}: {
  title: string;
  data: any;
  type: "new" | "old";
}) {
  const normalizedData = useMemo(() => {
    if (!data) return null;

    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return { description: data };
      }
    }

    return data;
  }, [data]);

  if (
    !normalizedData ||
    typeof normalizedData !== "object" ||
    Array.isArray(normalizedData)
  ) {
    return null;
  }

  const entries = Object.entries(normalizedData).filter(
    ([key, value]) =>
      !hiddenFields.has(key) &&
      fieldLabels[key] &&
      value !== null &&
      value !== undefined &&
      value !== "",
  );

  if (entries.length === 0) return null;

  const isJournal =
    "journalNumber" in normalizedData ||
    "totalDebit" in normalizedData ||
    "totalCredit" in normalizedData;

  const debit = normalizedData.totalDebit;
  const credit = normalizedData.totalCredit;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div
        className={`flex items-center gap-2 border-b px-4 py-4 ${
          type === "new"
            ? "border-green-100 bg-green-50"
            : "border-orange-100 bg-orange-50"
        }`}
      >
        <FiFileText
          className={type === "new" ? "text-green-700" : "text-orange-700"}
          size={19}
        />

        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>

      <div className="space-y-4 p-4">
        {/* JOURNAL HEADER */}

        {isJournal && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">رقم القيد اليومي</p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {normalizedData.journalNumber || "-"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  normalizedData.status === "posted"
                    ? "bg-green-100 text-green-700"
                    : normalizedData.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {getFriendlyValue("status", normalizedData.status)}
              </span>
            </div>

            {normalizedData.description && (
              <div className="mt-4 border-t border-slate-200 pt-3">
                <p className="text-xs text-slate-500">بيان القيد</p>

                <p className="mt-1 font-semibold text-slate-800">
                  {normalizedData.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* JOURNAL TOTALS */}

        {isJournal && (debit != null || credit != null) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <FiDollarSign size={17} />
                إجمالي المدين
              </div>

              <p className="mt-2 text-xl font-bold text-blue-900">
                {getFriendlyValue("totalDebit", debit)}
              </p>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <FiCheckCircle size={17} />
                إجمالي الدائن
              </div>

              <p className="mt-2 text-xl font-bold text-green-900">
                {getFriendlyValue("totalCredit", credit)}
              </p>
            </div>
          </div>
        )}

        {/* OTHER FIELDS */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entries
            .filter(([key]) => {
              if (isJournal) {
                return ![
                  "journalNumber",
                  "description",
                  "status",
                  "totalDebit",
                  "totalCredit",
                ].includes(key);
              }

              return true;
            })
            .map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <p className="text-xs text-slate-500">{fieldLabels[key]}</p>

                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {getFriendlyValue(key, value)}
                </p>
              </div>
            ))}
        </div>

        {/* JOURNAL INFORMATION */}

        {isJournal && (
          <div className="border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                أنشأ القيد:{" "}
                <strong className="text-slate-700">
                  {normalizedData.createdByName ||
                    normalizedData.createdBy ||
                    "-"}
                </strong>
              </span>

              {normalizedData.reference && (
                <span>
                  المرجع:{" "}
                  <strong className="text-slate-700">
                    {normalizedData.reference}
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// FILTER INTERNAL JOURNAL DETAILS
// =====================================================

function isVisibleActivity(log: ActivityLog): boolean {
  return log.extra?.table !== "journalLines";
}

// =====================================================
// COMPONENT
// =====================================================

export default function ActivityLogsPage() {
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState("all");

  const [selectedAction, setSelectedAction] = useState("all");

  const [selectedModule, setSelectedModule] = useState("all");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const pageSize = 15;

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadLogs = useCallback(async () => {
    setLoading(true);

    try {
      const username = getCurrentUsername();

      if (!username) {
        throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, username, companyId, type, isActive, status")
        .eq("username", username)
        .maybeSingle();

      if (userError) throw userError;

      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      if (user.type === "platform") {
        throw new Error("هذه الصفحة مخصصة لمستخدمي الشركات");
      }

      if (!user.companyId) {
        throw new Error("المستخدم غير مرتبط بشركة");
      }

      if (user.isActive === false || user.status === "inactive") {
        throw new Error("حساب المستخدم غير نشط");
      }

      const currentCompanyId = String(user.companyId);

      const { data, error } = await supabase
        .from("activityLogs")
        .select(
          `
            id,
            companyId,
            userId,
            userName,
            username,
            userRole,
            action,
            module,
            description,
            recordId,
            recordName,
            oldData,
            newData,
            createdAt,
            extra
          `,
        )
        .eq("companyId", currentCompanyId)
        .order("createdAt", { ascending: false })
        .limit(2000);

      if (error) throw error;

      setLogs((data || []) as ActivityLog[]);
      setPage(1);
    } catch (error: any) {
      console.error("Activity Logs Error:", error);

      toast.error(error?.message || "تعذر تحميل سجل العمليات");

      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // ===================================================
  // DISPLAY LOGS
  // ===================================================

  const visibleLogs = useMemo(() => logs.filter(isVisibleActivity), [logs]);

  // ===================================================
  // FILTER OPTIONS
  // ===================================================

  const users = useMemo(() => {
    const map = new Map<string, ActivityUser>();

    visibleLogs.forEach((log) => {
      const id = String(log.userId || log.username || "");

      if (!id) return;

      if (!map.has(id)) {
        map.set(id, {
          userId: id,
          username: log.username || "",
          userName: log.userName || log.username || "مستخدم",
        });
      }
    });

    return Array.from(map.values());
  }, [visibleLogs]);

  const modules = useMemo(
    () =>
      Array.from(
        new Set(visibleLogs.map((log) => log.module).filter(Boolean)),
      ).sort(),
    [visibleLogs],
  );

  // ===================================================
  // FILTER LOGS
  // ===================================================

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visibleLogs.filter((log) => {
      const matchesSearch =
        !query ||
        [
          log.username,
          log.userName,
          log.description,
          log.module,
          log.recordName,
          log.recordId,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesUser =
        selectedUser === "all" ||
        String(log.userId || log.username) === selectedUser;

      const normalizedAction =
        log.action?.toLowerCase() === "insert"
          ? "create"
          : log.action?.toLowerCase();

      const matchesAction =
        selectedAction === "all" || normalizedAction === selectedAction;

      const matchesModule =
        selectedModule === "all" || log.module === selectedModule;

      const logDate = log.createdAt ? String(log.createdAt).slice(0, 10) : "";

      const matchesDateFrom = !dateFrom || logDate >= dateFrom;

      const matchesDateTo = !dateTo || logDate <= dateTo;

      return (
        matchesSearch &&
        matchesUser &&
        matchesAction &&
        matchesModule &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    visibleLogs,
    search,
    selectedUser,
    selectedAction,
    selectedModule,
    dateFrom,
    dateTo,
  ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(
    () => ({
      total: filteredLogs.length,

      create: filteredLogs.filter((log) =>
        ["create", "insert"].includes(log.action?.toLowerCase()),
      ).length,

      update: filteredLogs.filter(
        (log) => log.action?.toLowerCase() === "update",
      ).length,

      delete: filteredLogs.filter(
        (log) => log.action?.toLowerCase() === "delete",
      ).length,
    }),
    [filteredLogs],
  );

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search, selectedUser, selectedAction, selectedModule, dateFrom, dateTo]);

  // ===================================================
  // RESET FILTERS
  // ===================================================

  function resetFilters() {
    setSearch("");
    setSelectedUser("all");
    setSelectedAction("all");
    setSelectedModule("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  // ===================================================
  // EXPORT CSV
  // ===================================================

  function exportCsv() {
    if (filteredLogs.length === 0) {
      toast.error("لا توجد عمليات لتصديرها");
      return;
    }

    const headers = [
      "التاريخ",
      "الوقت",
      "اسم المستخدم",
      "اسم الدخول",
      "الصلاحية",
      "العملية",
      "القسم",
      "الوصف",
      "اسم السجل",
      "رقم السجل",
    ];

    const rows = filteredLogs.map((log) => [
      formatDate(log.createdAt),
      formatTime(log.createdAt),
      log.userName,
      log.username,
      log.userRole,
      getActionLabel(log.action),
      log.module,
      log.description,
      log.recordName,
      log.recordId,
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `activity-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("تم تصدير سجل العمليات");
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <FiRefreshCw className="animate-spin" size={22} />
          <span>جاري تحميل سجل العمليات...</span>
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
            <span className="text-blue-600">سجل العمليات</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            سجل عمليات المستخدمين
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            متابعة العمليات والأنشطة التي قام بها مستخدمو الشركة.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadLogs}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={16} />
            تحديث
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
          >
            <FiDownload size={16} />
            تصدير Excel / CSV
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">إجمالي العمليات</span>

            <FiActivity className="text-blue-600" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {statistics.total.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">عمليات الإضافة</span>

            <span className="rounded-lg bg-green-100 px-2 py-1 text-xs text-green-700">
              إضافة
            </span>
          </div>

          <p className="mt-3 text-2xl font-bold text-green-800">
            {statistics.create.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">عمليات التعديل</span>

            <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs text-blue-700">
              تعديل
            </span>
          </div>

          <p className="mt-3 text-2xl font-bold text-blue-800">
            {statistics.update.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-700">عمليات الحذف</span>

            <span className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-700">
              حذف
            </span>
          </div>

          <p className="mt-3 text-2xl font-bold text-red-800">
            {statistics.delete.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* FILTERS */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-500" />

            <h2 className="font-bold text-slate-800">البحث والتصفية</h2>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            مسح الفلاتر
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              البحث
            </label>

            <div className="relative">
              <FiSearch className="absolute right-3 top-3 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اسم المستخدم أو وصف العملية..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              المستخدم
            </label>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">جميع المستخدمين</option>

              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.userName} ({user.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              نوع العملية
            </label>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">جميع العمليات</option>
              <option value="create">إضافة</option>
              <option value="update">تعديل</option>
              <option value="delete">حذف</option>
              <option value="view">عرض</option>
              <option value="login">تسجيل دخول</option>
              <option value="logout">تسجيل خروج</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              القسم
            </label>

            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">جميع الأقسام</option>

              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              من تاريخ
            </label>

            <div className="relative">
              <FiCalendar className="absolute right-3 top-3 text-slate-400" />

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              إلى تاريخ
            </label>

            <div className="relative">
              <FiCalendar className="absolute right-3 top-3 text-slate-400" />

              <input
                type="date"
                min={dateFrom || undefined}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LOGS TABLE */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">تفاصيل العمليات</h2>

            <p className="mt-1 text-xs text-slate-500">
              عدد النتائج: {filteredLogs.length.toLocaleString("en-US")}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FiUser />
            سجل عمليات الشركة
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4 text-right font-medium">المستخدم</th>

                <th className="px-5 py-4 text-right font-medium">العملية</th>

                <th className="px-5 py-4 text-right font-medium">القسم</th>

                <th className="px-5 py-4 text-right font-medium">الوصف</th>

                <th className="px-5 py-4 text-right font-medium">
                  التاريخ والوقت
                </th>

                <th className="px-5 py-4 text-center font-medium">التفاصيل</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <FiActivity
                      size={34}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-medium text-slate-600">
                      لا توجد عمليات مطابقة
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      جرّب تغيير خيارات البحث والتصفية.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {log.userName || "مستخدم"}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        @{log.username || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getActionStyle(
                          log.action,
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {log.module || "-"}
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate text-slate-700">
                        {log.description || "-"}
                      </p>

                      {log.recordName && (
                        <p className="mt-1 truncate text-xs text-slate-400">
                          السجل: {log.recordName}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <FiCalendar className="text-slate-400" />
                        {formatDate(log.createdAt)}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <FiClock />
                        {formatTime(log.createdAt)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <FiEye size={15} />
                        عرض
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {filteredLogs.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
            <p className="text-xs text-slate-500">
              عرض {(currentPage - 1) * pageSize + 1} إلى{" "}
              {Math.min(currentPage * pageSize, filteredLogs.length)} من{" "}
              {filteredLogs.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronRight />
              </button>

              <span className="px-2 text-sm text-slate-600">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* DETAILS MODAL */}

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  تفاصيل العملية
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  معلومات النشاط المسجل
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* USER INFORMATION */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">المستخدم</p>

                  <p className="mt-2 font-bold text-slate-800">
                    {selectedLog.userName || "-"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    @{selectedLog.username || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">الصلاحية</p>

                  <p className="mt-2 font-bold text-slate-800">
                    {selectedLog.userRole || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">نوع العملية</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getActionStyle(
                      selectedLog.action,
                    )}`}
                  >
                    {getActionLabel(selectedLog.action)}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">القسم</p>

                  <p className="mt-2 font-bold text-slate-800">
                    {selectedLog.module || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">التاريخ</p>

                  <p className="mt-2 font-bold text-slate-800">
                    {formatDate(selectedLog.createdAt)}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">الوقت</p>

                  <p className="mt-2 font-bold text-slate-800">
                    {formatTime(selectedLog.createdAt)}
                  </p>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div>
                <h3 className="mb-2 font-bold text-slate-800">وصف العملية</h3>

                <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
                  {selectedLog.description || "لا يوجد وصف"}
                </div>
              </div>

              {/* RECORD */}

              {(selectedLog.recordName || selectedLog.recordId) && (
                <div>
                  <h3 className="mb-2 font-bold text-slate-800">
                    السجل المرتبط
                  </h3>

                  <div className="rounded-lg border border-slate-200 p-4 text-sm">
                    <p className="text-slate-700">
                      الاسم: {selectedLog.recordName || "-"}
                    </p>

                    <p className="mt-2 break-all text-xs text-slate-400">
                      رقم السجل: {selectedLog.recordId || "-"}
                    </p>
                  </div>
                </div>
              )}

              {/* OLD DATA */}

              {selectedLog.oldData != null && (
                <AuditDataCard
                  title="البيانات قبل التعديل"
                  data={selectedLog.oldData}
                  type="old"
                />
              )}

              {/* NEW DATA */}

              {selectedLog.newData != null && (
                <AuditDataCard
                  title="البيانات بعد العملية"
                  data={selectedLog.newData}
                  type="new"
                />
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="border-t border-slate-100 p-4 text-left">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm text-white hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
