"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FiActivity,
  FiSearch,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiFilter,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiClock,
  FiX,
  FiUsers,
  FiFileText,
  FiEye,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* =====================================================
   Types
===================================================== */

type AppUser = {
  id: string;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  type?: string;
  companyId?: string;
};

type RawRecord = {
  id?: string | number;
  companyId?: string | number;

  name?: string;
  fullName?: string;
  username?: string;

  createdAt?: string;
  updatedAt?: string;
  date?: string;

  createdBy?: string | number;
  updatedBy?: string | number;
  userId?: string | number;
  performedBy?: string | number;

  createdByName?: string;
  updatedByName?: string;
  performedByName?: string;
  userName?: string;

  invoiceNumber?: string;
  transferNumber?: string;
  referenceNumber?: string;
  number?: string;
  reference?: string;

  productName?: string;
  warehouseName?: string;
  type?: string;
  notes?: string;
};

type Activity = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  description: string;
  createdAt: string;
  type: "create" | "update" | "delete" | "other";
};

/* =====================================================
   Resources
===================================================== */

const resources = [
  {
    endpoint: "users",
    module: "المستخدمون",
    label: "مستخدم",
  },
  {
    endpoint: "products",
    module: "المنتجات",
    label: "منتج",
  },
  {
    endpoint: "sales",
    module: "المبيعات",
    label: "فاتورة مبيعات",
  },
  {
    endpoint: "purchases",
    module: "المشتريات",
    label: "فاتورة مشتريات",
  },
  {
    endpoint: "transfers",
    module: "التحويلات",
    label: "تحويل مخزني",
  },
  {
    endpoint: "inventoryMovements",
    module: "حركة المخزون",
    label: "حركة مخزون",
  },
  {
    endpoint: "journals",
    module: "القيود اليومية",
    label: "قيد يومية",
  },
  {
    endpoint: "journalEntries",
    module: "القيود المحاسبية",
    label: "قيد محاسبي",
  },
  {
    endpoint: "openingEntries",
    module: "الأرصدة الافتتاحية",
    label: "رصيد افتتاحي",
  },
  {
    endpoint: "warehouses",
    module: "المستودعات",
    label: "مستودع",
  },
  {
    endpoint: "customers",
    module: "العملاء",
    label: "عميل",
  },
  {
    endpoint: "suppliers",
    module: "الموردون",
    label: "مورد",
  },
  {
    endpoint: "stockAdjustments",
    module: "تسويات المخزون",
    label: "تسوية مخزون",
  },
  {
    endpoint: "stocktakes",
    module: "الجرد",
    label: "عملية جرد",
  },
];

/* =====================================================
   Helpers
===================================================== */

function getUserName(user?: AppUser) {
  if (!user) return "مستخدم غير معروف";

  return user.name || user.fullName || user.username || "مستخدم غير معروف";
}

function getRecordTitle(record: RawRecord, label: string) {
  return (
    record.name ||
    record.fullName ||
    record.invoiceNumber ||
    record.transferNumber ||
    record.referenceNumber ||
    record.number ||
    record.productName ||
    label
  );
}

function getDate(record: RawRecord) {
  return record.createdAt || record.updatedAt || record.date || "";
}

/*
  استخراج هوية منفذ العملية
*/

function getActorId(record: RawRecord, action: "create" | "update") {
  const value =
    action === "update"
      ? (record.updatedBy ??
        record.createdBy ??
        record.userId ??
        record.performedBy)
      : (record.createdBy ?? record.userId ?? record.performedBy);

  return value !== undefined && value !== null ? String(value) : "";
}

/*
  استخراج اسم المنفذ مباشرة إذا كان محفوظًا
*/

function getActorName(record: RawRecord, action: "create" | "update") {
  if (action === "update") {
    return (
      record.updatedByName || record.performedByName || record.userName || ""
    );
  }

  return (
    record.createdByName || record.performedByName || record.userName || ""
  );
}

function getActionIcon(type: string) {
  switch (type) {
    case "create":
      return <FiPlus />;

    case "update":
      return <FiEdit />;

    case "delete":
      return <FiTrash2 />;

    default:
      return <FiActivity />;
  }
}

function getActionLabel(type: string) {
  switch (type) {
    case "create":
      return "إضافة";

    case "update":
      return "تعديل";

    case "delete":
      return "حذف";

    default:
      return "عملية";
  }
}

function getActionStyle(type: string) {
  switch (type) {
    case "create":
      return "bg-emerald-50 text-emerald-700";

    case "update":
      return "bg-blue-50 text-blue-700";

    case "delete":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(date: string) {
  if (!date) return "غير محدد";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("ar-YE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =====================================================
   Page
===================================================== */

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [companyUsers, setCompanyUsers] = useState<AppUser[]>([]);

  const [authUser, setAuthUser] = useState<AppUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  /* =====================================================
     Owner Check
  ===================================================== */

  const isOwner = authUser?.role === "owner" || authUser?.type === "owner";

  /* =====================================================
     Load Activities
  ===================================================== */

  const loadActivities = async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        setActivities([]);
        setCompanyUsers([]);
        return;
      }

      const currentUser: AppUser = JSON.parse(storedUser);

      setAuthUser(currentUser);

      const companyId = currentUser.companyId;

      if (!companyId) {
        setActivities([]);
        setCompanyUsers([]);
        return;
      }

      /* ===============================
         Load Company Users
      =============================== */

      const usersResponse = await axios.get(`${API_URL}/users`);

      const allUsers: AppUser[] = usersResponse.data || [];

      const filteredUsers = allUsers.filter((user) => {
        return (
          String(user.companyId) === String(companyId) &&
          user.type !== "platform"
        );
      });

      setCompanyUsers(filteredUsers);

      /* ===============================
         Users Map
      =============================== */

      const usersMap = new Map<string, string>();

      filteredUsers.forEach((user) => {
        usersMap.set(String(user.id), getUserName(user));
      });

      /*
        إضافة اسم المستخدم الحالي إلى الخريطة
        في حالة عدم وجوده في قائمة المستخدمين
      */

      usersMap.set(String(currentUser.id), getUserName(currentUser));

      /* ===============================
         Load All Resources
      =============================== */

      const responses = await Promise.allSettled(
        resources.map((resource) =>
          axios.get(`${API_URL}/${resource.endpoint}`),
        ),
      );

      const generatedActivities: Activity[] = [];

      responses.forEach((response, index) => {
        if (response.status !== "fulfilled") return;

        const resource = resources[index];

        const records: RawRecord[] = Array.isArray(response.value.data)
          ? response.value.data
          : [];

        const companyRecords = records.filter(
          (record) => String(record.companyId) === String(companyId),
        );

        companyRecords.forEach((record) => {
          const title = getRecordTitle(record, resource.label);

          /* ===============================
             Create Activity
          =============================== */

          if (record.createdAt || record.date) {
            const actorId = getActorId(record, "create");

            const actorName =
              getActorName(record, "create") ||
              usersMap.get(actorId) ||
              "غير محدد";

            generatedActivities.push({
              id: `${resource.endpoint}-${record.id}-create`,
              userId: actorId,
              userName: actorName,
              action: "إضافة",
              module: resource.module,
              description: `تمت إضافة ${resource.label}: ${title}`,
              createdAt: getDate(record),
              type: "create",
            });
          }

          /* ===============================
             Update Activity
          =============================== */

          if (
            record.updatedAt &&
            record.createdAt &&
            record.updatedAt !== record.createdAt
          ) {
            const actorId = getActorId(record, "update");

            const actorName =
              getActorName(record, "update") ||
              usersMap.get(actorId) ||
              "غير محدد";

            generatedActivities.push({
              id: `${resource.endpoint}-${record.id}-update`,
              userId: actorId,
              userName: actorName,
              action: "تعديل",
              module: resource.module,
              description: `تم تعديل ${resource.label}: ${title}`,
              createdAt: record.updatedAt,
              type: "update",
            });
          }
        });
      });

      /* ===============================
         Sort Activities
      =============================== */

      generatedActivities.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setActivities(generatedActivities);
    } catch (error) {
      console.error("Error loading activities:", error);

      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  /* =====================================================
     Filters
  ===================================================== */

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        activity.description.toLowerCase().includes(searchValue) ||
        activity.userName.toLowerCase().includes(searchValue) ||
        activity.module.toLowerCase().includes(searchValue);

      const matchesModule =
        selectedModule === "all" || activity.module === selectedModule;

      const matchesAction =
        selectedAction === "all" || activity.type === selectedAction;

      const matchesUser =
        !isOwner || selectedUser === "all" || activity.userId === selectedUser;

      const activityDate = activity.createdAt
        ? new Date(activity.createdAt)
        : null;

      const matchesStartDate =
        !startDate ||
        (activityDate !== null &&
          activityDate >= new Date(`${startDate}T00:00:00`));

      const matchesEndDate =
        !endDate ||
        (activityDate !== null &&
          activityDate <= new Date(`${endDate}T23:59:59`));

      return (
        matchesSearch &&
        matchesModule &&
        matchesAction &&
        matchesUser &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    activities,
    search,
    selectedModule,
    selectedAction,
    selectedUser,
    startDate,
    endDate,
    isOwner,
  ]);

  /* =====================================================
     Statistics
  ===================================================== */

  const totalActivities = filteredActivities.length;

  const createCount = filteredActivities.filter(
    (item) => item.type === "create",
  ).length;

  const updateCount = filteredActivities.filter(
    (item) => item.type === "update",
  ).length;

  const deleteCount = filteredActivities.filter(
    (item) => item.type === "delete",
  ).length;

  /* =====================================================
     Reset Filters
  ===================================================== */

  const resetFilters = () => {
    setSearch("");
    setSelectedModule("all");
    setSelectedAction("all");
    setSelectedUser("all");
    setStartDate("");
    setEndDate("");
  };

  /* =====================================================
     Export CSV
  ===================================================== */

  const exportCSV = () => {
    const headers = ["المستخدم", "القسم", "العملية", "الوصف", "التاريخ"];

    const rows = filteredActivities.map((activity) => [
      activity.userName,
      activity.module,
      activity.action,
      activity.description,
      formatDate(activity.createdAt),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "activity-log.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <FiActivity size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800">سجل النشاطات</h1>

            <p className="mt-1 text-sm text-slate-500">
              متابعة العمليات والنشاطات داخل الشركة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadActivities}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-[#0E1F33] px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            <FiFileText />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي النشاطات"
          value={totalActivities}
          icon={<FiActivity />}
          color="blue"
        />

        <StatCard
          title="عمليات الإضافة"
          value={createCount}
          icon={<FiPlus />}
          color="green"
        />

        <StatCard
          title="عمليات التعديل"
          value={updateCount}
          icon={<FiEdit />}
          color="orange"
        />

        <StatCard
          title="عمليات الحذف"
          value={deleteCount}
          icon={<FiTrash2 />}
          color="red"
        />
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiFilter className="text-slate-500" />

          <h2 className="font-semibold text-slate-800">تصفية النشاطات</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Search */}

          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن نشاط..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          {/* User Filter: Owner Only */}

          {isOwner && (
            <div className="relative">
              <FiUsers className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="all">جميع المستخدمين</option>

                {companyUsers.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {getUserName(user)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Module */}

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">جميع الأقسام</option>

            {resources.map((resource) => (
              <option key={resource.endpoint} value={resource.module}>
                {resource.module}
              </option>
            ))}
          </select>

          {/* Action */}

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">جميع العمليات</option>
            <option value="create">إضافة</option>
            <option value="update">تعديل</option>
            <option value="delete">حذف</option>
          </select>

          {/* Start Date */}

          <div className="relative">
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          {/* End Date */}

          <div className="relative">
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          {/* Reset */}

          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <FiX />
            إعادة ضبط الفلاتر
          </button>
        </div>
      </div>

      {/* Activities Table */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-800">تفاصيل النشاطات</h2>

          <span className="text-sm text-slate-500">
            {filteredActivities.length} نشاط
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
            <FiRefreshCw className="animate-spin" />
            جاري تحميل النشاطات...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiActivity size={38} className="mb-3 text-slate-300" />

            <p className="font-medium text-slate-600">لا توجد نشاطات</p>

            <p className="mt-1 text-sm text-slate-400">
              لم يتم العثور على نشاطات مطابقة للفلاتر
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">المستخدم</th>

                  <th className="px-4 py-3 font-medium">القسم</th>

                  <th className="px-4 py-3 font-medium">العملية</th>

                  <th className="px-4 py-3 font-medium">التفاصيل</th>

                  <th className="px-4 py-3 font-medium">التاريخ والوقت</th>

                  <th className="px-4 py-3 font-medium">عرض</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <FiUser />
                        </div>

                        <span className="font-medium text-slate-700">
                          {activity.userName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {activity.module}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getActionStyle(
                          activity.type,
                        )}`}
                      >
                        {getActionIcon(activity.type)}
                        {getActionLabel(activity.type)}
                      </span>
                    </td>

                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                      {activity.description}
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center gap-2">
                        <FiClock />
                        {formatDate(activity.createdAt)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedActivity(activity)}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        <FiEye />
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}

      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">تفاصيل النشاط</h2>

              <button
                onClick={() => setSelectedActivity(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <DetailRow label="المستخدم" value={selectedActivity.userName} />

              <DetailRow label="القسم" value={selectedActivity.module} />

              <DetailRow label="العملية" value={selectedActivity.action} />

              <DetailRow label="الوصف" value={selectedActivity.description} />

              <DetailRow
                label="التاريخ والوقت"
                value={formatDate(selectedActivity.createdAt)}
              />
            </div>

            <div className="border-t border-slate-100 p-4">
              <button
                onClick={() => setSelectedActivity(null)}
                className="w-full rounded-lg bg-[#0E1F33] py-2.5 text-sm text-white hover:bg-slate-700"
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

/* =====================================================
   Statistics Card
===================================================== */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

/* =====================================================
   Details Row
===================================================== */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>

      <span className="text-sm font-medium text-slate-700">
        {value || "غير محدد"}
      </span>
    </div>
  );
}
