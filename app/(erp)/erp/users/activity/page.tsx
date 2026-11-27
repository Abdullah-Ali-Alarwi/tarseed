"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUser,
  FiX,
  FiFileText,
  FiPlus,
  FiEdit,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

type ActivityAction = "create" | "update" | "delete";

type ActivityLog = {
  id: string;
  companyId: string;
  userId: string | null;
  userName: string | null;
  username: string | null;
  userRole: string | null;
  action: ActivityAction;
  module: string | null;
  description: string | null;
  recordId: string | null;
  recordName: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  extra: Record<string, unknown> | null;
  createdAt: string;
};

type UserRecord = {
  id: string;
  name?: string;
  username?: string;
  role?: string;
  type?: string;
  companyId?: string;
  status?: string;
  isActive?: boolean;
};

const PAGE_SIZE = 15;

const ACTIONS: {
  value: ActivityAction;
  label: string;
}[] = [
  { value: "create", label: "إنشاء" },
  { value: "update", label: "تعديل" },
  { value: "delete", label: "حذف" },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك الشركة",
  manager: "مدير",
  accountant: "محاسب",
  cashier: "كاشير",
  employee: "موظف",
  admin: "مدير النظام",
};

const MODULE_LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم",
  users: "المستخدمون",
  products: "المنتجات",
  inventory: "المخزون",
  sales: "المبيعات",
  purchases: "المشتريات",
  customers: "العملاء",
  suppliers: "الموردون",
  accounting: "المحاسبة",
  reports: "التقارير",
  settings: "الإعدادات",
  warehouses: "المستودعات",
  categories: "التصنيفات",
  units: "الوحدات",
  accounts: "دليل الحسابات",
  journals: "القيود اليومية",
  expenses: "المصروفات",
  transfers: "التحويلات",
};

function getActionLabel(action: string) {
  return ACTIONS.find((item) => item.value === action)?.label ?? action;
}

function getModuleLabel(module: string | null) {
  if (!module) return "غير محدد";
  return MODULE_LABELS[module] ?? module;
}

function getRoleLabel(role: string | null) {
  if (!role) return "غير محدد";
  return ROLE_LABELS[role] ?? role;
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("ar-YE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  if (!date) return "—";
  return `${formatDate(date)} - ${formatTime(date)}`;
}

function getActionStyle(action: string) {
  switch (action) {
    case "create":
      return {
        label: "إنشاء",
        icon: FiPlus,
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
        iconClass: "bg-emerald-100 text-emerald-700",
      };

    case "update":
      return {
        label: "تعديل",
        icon: FiEdit,
        className: "bg-blue-50 text-blue-700 border-blue-100",
        iconClass: "bg-blue-100 text-blue-700",
      };

    case "delete":
      return {
        label: "حذف",
        icon: FiTrash2,
        className: "bg-red-50 text-red-700 border-red-100",
        iconClass: "bg-red-100 text-red-700",
      };

    default:
      return {
        label: action,
        icon: FiActivity,
        className: "bg-slate-50 text-slate-700 border-slate-200",
        iconClass: "bg-slate-100 text-slate-700",
      };
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return "";

  return decodeURIComponent(cookie.split("=").slice(1).join("="));
}

function safeJson(value: unknown) {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function downloadCSV(rows: ActivityLog[]) {
  if (!rows.length) {
    toast.error("لا توجد بيانات لتصديرها");
    return;
  }

  const headers = [
    "التاريخ",
    "الوقت",
    "المستخدم",
    "اسم المستخدم",
    "الدور",
    "العملية",
    "القسم",
    "الوصف",
    "رقم السجل",
    "اسم السجل",
  ];

  const data = rows.map((row) => [
    formatDate(row.createdAt),
    formatTime(row.createdAt),
    row.userName ?? "",
    row.username ?? "",
    getRoleLabel(row.userRole),
    getActionLabel(row.action),
    getModuleLabel(row.module),
    row.description ?? "",
    row.recordId ?? "",
    row.recordName ?? "",
  ]);

  const escapeCSV = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escapeCSV).join(","),
    ...data.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  // إضافة BOM لدعم اللغة العربية في Excel
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  toast.success("تم تصدير سجل النشاط بنجاح");
}

function DataViewer({
  title,
  data,
  emptyText,
}: {
  title: string;
  data: unknown;
  emptyText: string;
}) {
  const normalizedData = safeJson(data);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h4 className="font-semibold text-sm text-[#0E1F33]">{title}</h4>
      </div>

      <div className="p-4">
        {normalizedData === null ||
        normalizedData === undefined ||
        (typeof normalizedData === "object" &&
          !Array.isArray(normalizedData) &&
          Object.keys(normalizedData as object).length === 0) ? (
          <p className="text-sm text-slate-400 text-center py-5">{emptyText}</p>
        ) : (
          <pre
            dir="ltr"
            className="text-xs leading-6 text-slate-700 whitespace-pre-wrap break-words overflow-x-auto max-h-80"
          >
            {JSON.stringify(normalizedData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const username = readCookie("username");

      if (!username) {
        toast.error("انتهت جلسة الدخول، يرجى تسجيل الدخول مجدداً");
        return;
      }

      const response = await getUserByUsername(username);
      const user = (
        Array.isArray(response) ? response[0] : response
      ) as UserRecord | null;

      if (!user) {
        toast.error("تعذر العثور على بيانات المستخدم");
        return;
      }

      if (
        user.type === "platform" ||
        user.isActive === false ||
        user.status === "inactive" ||
        user.status === "غير نشط"
      ) {
        toast.error("ليس لديك صلاحية الوصول إلى هذه الصفحة");
        return;
      }

      if (!user.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      if (!["owner", "manager"].includes(user.role ?? "")) {
        toast.error("ليس لديك صلاحية عرض سجل النشاط");
        return;
      }

      setCurrentUser(user);
      setCompanyId(user.companyId);

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
            extra,
            createdAt
          `,
        )
        .eq("companyId", user.companyId)
        .order("createdAt", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Activity logs error:", error);
        toast.error("تعذر تحميل سجل النشاط");
        return;
      }

      setLogs((data ?? []) as ActivityLog[]);
    } catch (error) {
      console.error("Activity page error:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    logs.forEach((log) => {
      const id = log.userId || log.username || log.userName || "unknown";

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: log.userName || log.username || "مستخدم غير معروف",
        });
      }
    });

    return Array.from(map.values());
  }, [logs]);

  const uniqueModules = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => log.module).filter(Boolean)),
    ) as string[];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          log.userName,
          log.username,
          log.description,
          log.recordName,
          log.recordId,
          log.module,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;

      const matchesModule =
        moduleFilter === "all" || log.module === moduleFilter;

      const matchesUser =
        userFilter === "all" ||
        (log.userId || log.username || log.userName) === userFilter;

      const logDate = log.createdAt?.slice(0, 10) ?? "";

      const matchesDateFrom = !dateFrom || logDate >= dateFrom;
      const matchesDateTo = !dateTo || logDate <= dateTo;

      return (
        matchesSearch &&
        matchesAction &&
        matchesModule &&
        matchesUser &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [logs, search, actionFilter, moduleFilter, userFilter, dateFrom, dateTo]);

  const statistics = useMemo(() => {
    return {
      total: logs.length,
      create: logs.filter((log) => log.action === "create").length,
      update: logs.filter((log) => log.action === "update").length,
      delete: logs.filter((log) => log.action === "delete").length,
    };
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, moduleFilter, userFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setModuleFilter("all");
    setUserFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters =
    search ||
    actionFilter !== "all" ||
    moduleFilter !== "all" ||
    userFilter !== "all" ||
    dateFrom ||
    dateTo;

  if (loading) {
    return (
      <div dir="rtl" className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="animate-spin text-3xl text-[#0E1F33]" />
          <p className="text-sm text-slate-500">جارٍ تحميل سجل النشاط...</p>
        </div>
      </div>
    );
  }

  if (
    !currentUser ||
    !companyId ||
    !["owner", "manager"].includes(currentUser.role ?? "")
  ) {
    return (
      <div
        dir="rtl"
        className="min-h-[50vh] flex items-center justify-center p-6"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full">
          <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0E1F33] mb-2">
            غير مصرح بالدخول
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            لا تملك الصلاحية اللازمة لعرض سجل نشاط الشركة.
          </p>
          <Link
            href="/erp/dashboard"
            className="inline-flex items-center gap-2 bg-[#0E1F33] text-white rounded-lg px-5 py-2.5 text-sm"
          >
            العودة إلى لوحة التحكم
            <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Link href="/erp/dashboard" className="hover:text-[#0E1F33]">
              لوحة التحكم
            </Link>
            <FiChevronLeft className="text-xs" />
            <Link href="/erp/users" className="hover:text-[#0E1F33]">
              المستخدمون
            </Link>
            <FiChevronLeft className="text-xs" />
            <span className="text-[#0E1F33]">سجل النشاط</span>
          </div>

          <h1 className="text-2xl font-bold text-[#0E1F33] flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <FiActivity size={22} />
            </span>
            سجل نشاط المستخدمين
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            متابعة العمليات التي ينفذها مستخدمو الشركة ومراجعة تفاصيلها.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={() => downloadCSV(filteredLogs)}
            className="inline-flex items-center gap-2 bg-[#0E1F33] hover:bg-[#18334f] text-white rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <FiDownload />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي العمليات"
          value={statistics.total}
          icon={<FiActivity />}
          iconClass="bg-blue-50 text-blue-700"
          description="جميع العمليات المسجلة"
        />

        <StatCard
          title="عمليات الإنشاء"
          value={statistics.create}
          icon={<FiPlus />}
          iconClass="bg-emerald-50 text-emerald-700"
          description="السجلات التي تمت إضافتها"
        />

        <StatCard
          title="عمليات التعديل"
          value={statistics.update}
          icon={<FiEdit />}
          iconClass="bg-indigo-50 text-indigo-700"
          description="السجلات التي تم تحديثها"
        />

        <StatCard
          title="عمليات الحذف"
          value={statistics.delete}
          icon={<FiTrash2 />}
          iconClass="bg-red-50 text-red-700"
          description="السجلات التي تم حذفها"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FiFilter className="text-[#0E1F33]" />
            <h2 className="font-bold text-[#0E1F33]">البحث والتصفية</h2>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <FiX />
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مستخدم أو عملية..."
              className="w-full h-11 pr-10 pl-3 rounded-xl border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-sm"
            />
          </div>

          {/* User */}
          <div className="relative">
            <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full h-11 pr-10 pl-8 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 text-sm appearance-none"
            >
              <option value="all">جميع المستخدمين</option>
              {uniqueUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Action */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full h-11 px-3 pl-8 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 text-sm appearance-none"
            >
              <option value="all">جميع العمليات</option>
              {ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Module */}
          <div className="relative">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full h-11 px-3 pl-8 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 text-sm appearance-none"
            >
              <option value="all">جميع الأقسام</option>
              {uniqueModules.map((module) => (
                <option key={module} value={module}>
                  {getModuleLabel(module)}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date from */}
          <div className="relative">
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-11 pr-10 pl-3 rounded-xl border border-slate-200 outline-none focus:border-blue-400 text-sm"
              aria-label="من تاريخ"
            />
          </div>

          {/* Date to */}
          <div className="relative">
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-11 pr-10 pl-3 rounded-xl border border-slate-200 outline-none focus:border-blue-400 text-sm"
              aria-label="إلى تاريخ"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>
            النتائج:{" "}
            <strong className="text-[#0E1F33]">{filteredLogs.length}</strong>{" "}
            عملية
          </span>

          <span>إجمالي السجلات المحملة: {logs.length}</span>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 md:px-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-[#0E1F33]">تفاصيل سجل النشاط</h2>
            <p className="text-xs text-slate-400 mt-1">
              أحدث العمليات تظهر أولاً
            </p>
          </div>

          <span className="text-xs bg-slate-100 text-slate-600 rounded-lg px-3 py-1.5">
            {filteredLogs.length} سجل
          </span>
        </div>

        {paginatedLogs.length === 0 ? (
          <div className="py-20 px-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FiFileText size={30} />
            </div>

            <h3 className="font-bold text-[#0E1F33] mb-2">
              لا توجد سجلات نشاط
            </h3>

            <p className="text-sm text-slate-400">
              {hasFilters
                ? "لم نعثر على نتائج تطابق معايير البحث."
                : "لم يتم تسجيل أي عمليات لهذه الشركة حتى الآن."}
            </p>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-blue-700 hover:underline"
              >
                مسح عوامل التصفية
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-4 font-semibold">المستخدم</th>
                    <th className="px-5 py-4 font-semibold">العملية</th>
                    <th className="px-5 py-4 font-semibold">القسم</th>
                    <th className="px-5 py-4 font-semibold">التفاصيل</th>
                    <th className="px-5 py-4 font-semibold">التاريخ والوقت</th>
                    <th className="px-5 py-4 font-semibold text-center">
                      التفاصيل
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedLogs.map((log) => {
                    const style = getActionStyle(log.action);
                    const ActionIcon = style.icon;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0E1F33] flex items-center justify-center shrink-0">
                              <FiUser size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0E1F33] truncate">
                                {log.userName || "مستخدم غير معروف"}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                @{log.username || "—"}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {getRoleLabel(log.userRole)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs font-semibold ${style.className}`}
                          >
                            <ActionIcon size={13} />
                            {style.label}
                          </span>
                        </td>

                        {/* Module */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-700">
                            {getModuleLabel(log.module)}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="px-5 py-4 max-w-[300px]">
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {log.description || "لا يوجد وصف"}
                          </p>

                          {log.recordName && (
                            <p className="text-xs text-slate-400 mt-1">
                              السجل: {log.recordName}
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-slate-700">
                            {formatDate(log.createdAt)}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <FiClock size={11} />
                            {formatTime(log.createdAt)}
                          </p>
                        </td>

                        {/* Details */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-3 py-2 text-xs transition-colors"
                          >
                            <FiEye size={14} />
                            عرض
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                عرض {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} من{" "}
                {filteredLogs.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                  aria-label="الصفحة السابقة"
                >
                  <FiChevronRight />
                </button>

                <span className="text-xs text-slate-600 px-2">
                  صفحة {currentPage} من {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                  aria-label="الصفحة التالية"
                >
                  <FiChevronLeft />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-[100] bg-[#0E1F33]/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedLog(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FiFileText size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-[#0E1F33]">تفاصيل العملية</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDateTime(selectedLog.createdAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center"
                aria-label="إغلاق"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-5">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoBox
                  label="المستخدم"
                  value={selectedLog.userName || "غير معروف"}
                  subValue={
                    selectedLog.username
                      ? `@${selectedLog.username}`
                      : undefined
                  }
                />

                <InfoBox
                  label="الدور الوظيفي"
                  value={getRoleLabel(selectedLog.userRole)}
                />

                <InfoBox
                  label="نوع العملية"
                  value={getActionLabel(selectedLog.action)}
                />

                <InfoBox
                  label="القسم"
                  value={getModuleLabel(selectedLog.module)}
                />

                <InfoBox
                  label="اسم السجل"
                  value={selectedLog.recordName || "—"}
                />

                <InfoBox
                  label="رقم السجل"
                  value={selectedLog.recordId || "—"}
                />
              </div>

              {/* Description */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <h4 className="text-sm font-bold text-[#0E1F33] mb-2">
                  وصف العملية
                </h4>
                <p className="text-sm text-slate-600 leading-7">
                  {selectedLog.description || "لا يوجد وصف لهذه العملية"}
                </p>
              </div>

              {/* Old and New Data */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DataViewer
                  title="البيانات القديمة"
                  data={selectedLog.oldData}
                  emptyText="لا توجد بيانات قديمة"
                />

                <DataViewer
                  title="البيانات الجديدة"
                  data={selectedLog.newData}
                  emptyText="لا توجد بيانات جديدة"
                />
              </div>

              {/* Extra */}
              {selectedLog.extra &&
                Object.keys(selectedLog.extra).length > 0 && (
                  <DataViewer
                    title="بيانات إضافية"
                    data={selectedLog.extra}
                    emptyText="لا توجد بيانات إضافية"
                  />
                )}

              {/* Technical Details */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-bold text-[#0E1F33] mb-3">
                  معلومات السجل
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">معرف العملية</span>
                    <p className="text-slate-700 mt-1 break-all" dir="ltr">
                      {selectedLog.id}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400">معرف المستخدم</span>
                    <p className="text-slate-700 mt-1 break-all" dir="ltr">
                      {selectedLog.userId || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400">معرف الشركة</span>
                    <p className="text-slate-700 mt-1 break-all" dir="ltr">
                      {selectedLog.companyId}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400">تاريخ التسجيل</span>
                    <p className="text-slate-700 mt-1" dir="ltr">
                      {selectedLog.createdAt}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-[#0E1F33] hover:bg-[#18334f] text-white rounded-xl px-6 py-2.5 text-sm font-medium"
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

function StatCard({
  title,
  value,
  icon,
  iconClass,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-[#0E1F33] mt-3">
            {value.toLocaleString("ar-YE")}
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">{description}</p>
    </div>
  );
}

function InfoBox({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <p className="text-sm font-semibold text-[#0E1F33] break-words">
        {value}
      </p>
      {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
    </div>
  );
}
