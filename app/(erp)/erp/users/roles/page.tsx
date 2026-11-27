"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

import {
  FiShield,
  FiUsers,
  FiUserCheck,
  FiUser,
  FiBriefcase,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiLock,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiEdit,
  FiEye,
  FiPlus,
  FiTrash2,
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiDollarSign,
  FiBarChart2,
  FiAlertCircle,
} from "react-icons/fi";

// ======================================
// Types
// ======================================

type Permission = {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

type RolePermissions = Record<string, Record<string, Permission>>;

type Company = {
  id: string;
  name: string;
  rolePermissions?: RolePermissions | null;
};

type CurrentUser = {
  id: string;
  name?: string;
  username: string;
  role: string;
  type: string;
  companyId?: string;
  companyname?: string;
  status?: string;
  isActive?: boolean;
};

type RoleDefinition = {
  value: string;
  label: string;
  description: string;
  icon: typeof FiUser;
  color: string;
  bg: string;
  border: string;
  isSystem?: boolean;
  fullAccess?: boolean;
};

type UserRecord = {
  role: string | null;
};

// ======================================
// Roles
// ======================================

const roles: RoleDefinition[] = [
  {
    value: "owner",
    label: "مالك الشركة",
    description:
      "المسؤول الرئيسي عن الشركة، وله صلاحيات الإدارة الكاملة على النظام.",
    icon: FiShield,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    isSystem: true,
    fullAccess: true,
  },
  {
    value: "manager",
    label: "مدير",
    description:
      "إدارة العمليات اليومية ومتابعة الموظفين والأقسام المختلفة في الشركة.",
    icon: FiBriefcase,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    value: "accountant",
    label: "محاسب",
    description:
      "إدارة العمليات المحاسبية والمالية ومتابعة المبيعات والمشتريات والتقارير.",
    icon: FiDollarSign,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    value: "cashier",
    label: "كاشير",
    description:
      "تنفيذ عمليات البيع والتعامل مع العملاء ومتابعة عمليات الصندوق.",
    icon: FiShoppingCart,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    value: "employee",
    label: "موظف",
    description: "الوصول إلى الأقسام والوظائف التي تسمح بها صلاحياته المحددة.",
    icon: FiUser,
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
];

// ======================================
// Modules
// ======================================

const modules = [
  {
    key: "dashboard",
    label: "لوحة التحكم",
    icon: FiBarChart2,
  },
  {
    key: "users",
    label: "المستخدمون",
    icon: FiUsers,
  },
  {
    key: "products",
    label: "المنتجات",
    icon: FiPackage,
  },
  {
    key: "inventory",
    label: "المخزون",
    icon: FiPackage,
  },
  {
    key: "sales",
    label: "المبيعات",
    icon: FiShoppingCart,
  },
  {
    key: "purchases",
    label: "المشتريات",
    icon: FiShoppingCart,
  },
  {
    key: "customers",
    label: "العملاء",
    icon: FiUsers,
  },
  {
    key: "suppliers",
    label: "الموردون",
    icon: FiTruck,
  },
  {
    key: "accounting",
    label: "المحاسبة",
    icon: FiDollarSign,
  },
  {
    key: "reports",
    label: "التقارير",
    icon: FiBarChart2,
  },
  {
    key: "settings",
    label: "الإعدادات",
    icon: FiSettings,
  },
];

// ======================================
// Helpers
// ======================================

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!cookie) return "";

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function normalizeRole(role?: string | null): string {
  return String(role || "")
    .trim()
    .toLowerCase();
}

function isActiveUser(user: CurrentUser): boolean {
  return (
    user.isActive !== false &&
    !["inactive", "غير نشط"].includes(String(user.status || "").toLowerCase())
  );
}

function getRoleLabel(role: string): string {
  return (
    roles.find((item) => item.value === normalizeRole(role))?.label ||
    role ||
    "غير محدد"
  );
}

function createEmptyPermission(): Permission {
  return {
    view: false,
    create: false,
    update: false,
    delete: false,
  };
}

function getPermissionSummary(
  permissions: RolePermissions | null | undefined,
  role: string,
) {
  const rolePermissions = permissions?.[role];

  if (!rolePermissions) {
    return {
      enabledModules: 0,
      totalPermissions: 0,
      view: 0,
      create: 0,
      update: 0,
      delete: 0,
    };
  }

  const summary = {
    enabledModules: 0,
    totalPermissions: 0,
    view: 0,
    create: 0,
    update: 0,
    delete: 0,
  };

  Object.values(rolePermissions).forEach((permission) => {
    if (!permission) return;

    const actions = ["view", "create", "update", "delete"] as const;

    const enabled = actions.filter((action) => permission[action] === true);

    if (enabled.length > 0) {
      summary.enabledModules++;
    }

    summary.totalPermissions += enabled.length;

    enabled.forEach((action) => {
      summary[action]++;
    });
  });

  return summary;
}

// ======================================
// Main Page
// ======================================

export default function RolesPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [company, setCompany] = useState<Company | null>(null);

  const [users, setUsers] = useState<UserRecord[]>([]);

  const [selectedRole, setSelectedRole] = useState("accountant");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ======================================
  // Load Data
  // ======================================

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // المستخدم الحالي

      const username = getCookie("username");

      if (!username) {
        toast.error("يرجى تسجيل الدخول مجددًا");
        window.location.href = "/login";
        return;
      }

      const response = await getUserByUsername(username);

      const user = Array.isArray(response) ? response[0] : response;

      if (!user) {
        toast.error("تعذر العثور على المستخدم الحالي");
        window.location.href = "/login";
        return;
      }

      if (user.type === "platform") {
        toast.error("هذه الصفحة مخصصة لمستخدمي الشركات");
        window.location.href = "/wezzan/dashboard";
        return;
      }

      const normalizedUser: CurrentUser = {
        id: String(user.id),
        name: user.name,
        username: user.username,
        role: user.role,
        type: user.type,
        companyId: user.companyId ? String(user.companyId) : undefined,
        companyname: user.companyname,
        status: user.status,
        isActive: user.isActive,
      };

      if (!isActiveUser(normalizedUser)) {
        toast.error("حسابك غير نشط");
        window.location.href = "/login";
        return;
      }

      if (!normalizedUser.companyId) {
        toast.error("حسابك غير مرتبط بشركة");
        return;
      }

      if (!["owner", "manager"].includes(normalizeRole(normalizedUser.role))) {
        toast.error("ليس لديك صلاحية الوصول إلى المجموعات الوظيفية");
        window.location.href = "/erp/dashboard";
        return;
      }

      setCurrentUser(normalizedUser);

      // ======================================
      // Load Company
      // ======================================

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select('id, name, "rolePermissions"')
        .eq("id", normalizedUser.companyId)
        .maybeSingle();

      if (companyError) {
        console.error("Load company error:", companyError);

        toast.error("تعذر تحميل بيانات الشركة");
        return;
      }

      if (!companyData) {
        toast.error("لم يتم العثور على الشركة");
        return;
      }

      const loadedCompany: Company = {
        id: companyData.id,
        name: companyData.name,
        rolePermissions: companyData.rolePermissions,
      };

      setCompany(loadedCompany);

      // ======================================
      // Load Company Users
      // ======================================

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("role")
        .eq("companyId", normalizedUser.companyId)
        .eq("type", "erp");

      if (usersError) {
        console.error("Load company users error:", usersError);

        toast.error("تعذر تحميل المستخدمين");
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error("Load roles page error:", error);

      toast.error("حدث خطأ أثناء تحميل المجموعات الوظيفية");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ======================================
  // Initial Load
  // ======================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ======================================
  // Search
  // ======================================

  const filteredRoles = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return roles;

    return roles.filter((role) => {
      return (
        role.label.toLowerCase().includes(value) ||
        role.value.toLowerCase().includes(value) ||
        role.description.includes(value)
      );
    });
  }, [search]);

  // ======================================
  // Role Statistics
  // ======================================

  const getRoleUsersCount = (role: string) => {
    return users.filter((user) => normalizeRole(user.role) === role).length;
  };

  const totalUsers = users.length;

  const selectedRoleData = roles.find((role) => role.value === selectedRole);

  const selectedRoleCount = getRoleUsersCount(selectedRole);

  const permissionSummary = getPermissionSummary(
    company?.rolePermissions,
    selectedRole,
  );

  // ======================================
  // Loading
  // ======================================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500"
      >
        <FiRefreshCw className="animate-spin text-3xl" />

        <p className="text-sm">جاري تحميل المجموعات الوظيفية...</p>
      </div>
    );
  }

  // ======================================
  // Error State
  // ======================================

  if (!currentUser || !company) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
      >
        <FiAlertCircle size={38} className="text-rose-500" />

        <h2 className="font-bold text-slate-800">تعذر تحميل بيانات الشركة</h2>

        <button
          type="button"
          onClick={() => loadData()}
          className="rounded-xl bg-[#0E1F33] px-5 py-2.5 text-sm text-white"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ======================================
  // Render
  // ======================================

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>المستخدمون</span>

            <span>/</span>

            <span className="text-slate-600">المجموعات الوظيفية</span>
          </div>

          <h1 className="text-2xl font-bold text-[#0E1F33]">
            المجموعات الوظيفية
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            إدارة الأدوار الوظيفية ومتابعة توزيع المستخدمين والصلاحيات.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/users/permissions"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <FiSettings size={17} />
            إدارة الصلاحيات
          </Link>
        </div>
      </div>

      {/* Company Information */}

      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700">
          <FiBriefcase size={21} />
        </div>

        <div>
          <p className="text-xs text-blue-600">المجموعات الوظيفية للشركة</p>

          <p className="mt-1 font-bold text-[#0E1F33]">{company.name}</p>
        </div>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">المجموعات الوظيفية</p>

              <p className="mt-2 text-3xl font-bold text-[#0E1F33]">
                {roles.length}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FiShield size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي المستخدمين</p>

              <p className="mt-2 text-3xl font-bold text-[#0E1F33]">
                {totalUsers}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FiUsers size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">الأدوار ذات المستخدمين</p>

              <p className="mt-2 text-3xl font-bold text-[#0E1F33]">
                {
                  roles.filter((role) => getRoleUsersCount(role.value) > 0)
                    .length
                }
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <FiUserCheck size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}

      <div className="relative">
        <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن مجموعة وظيفية..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-11 pl-4 text-sm outline-none transition focus:border-blue-400"
        />
      </div>

      {/* Main Content */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Roles List */}

        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-[#0E1F33]">قائمة المجموعات</h2>

            <p className="mt-1 text-xs text-slate-400">
              اختر المجموعة لعرض تفاصيلها
            </p>
          </div>

          <div className="space-y-2 p-3">
            {filteredRoles.map((role) => {
              const Icon = role.icon;

              const count = getRoleUsersCount(role.value);

              const active = selectedRole === role.value;

              return (
                <button
                  type="button"
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`w-full rounded-xl border p-4 text-right transition ${
                    active
                      ? "border-[#0E1F33] bg-[#0E1F33] text-white"
                      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          active
                            ? "bg-white/10 text-white"
                            : `${role.bg} ${role.color}`
                        }`}
                      >
                        <Icon size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {role.label}
                        </p>

                        <p
                          className={`mt-1 text-xs ${
                            active ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {role.value}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        active
                          ? "bg-white/10 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredRoles.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                لا توجد مجموعات مطابقة للبحث
              </p>
            )}
          </div>
        </aside>

        {/* Selected Role Details */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {selectedRoleData && (
            <>
              {/* Role Header */}

              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedRoleData.bg} ${selectedRoleData.color}`}
                  >
                    {(() => {
                      const Icon = selectedRoleData.icon;

                      return <Icon size={23} />;
                    })()}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-[#0E1F33]">
                        {selectedRoleData.label}
                      </h2>

                      {selectedRoleData.isSystem && (
                        <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
                          دور أساسي
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {selectedRoleData.value}
                    </p>
                  </div>
                </div>

                <Link
                  href="/erp/users/permissions"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <FiEdit size={15} />
                  إدارة الصلاحيات
                </Link>
              </div>

              {/* Description */}

              <div className="border-b border-slate-100 p-5">
                <h3 className="text-sm font-bold text-slate-700">
                  وصف المجموعة
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {selectedRoleData.description}
                </p>
              </div>

              {/* Statistics */}

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">عدد المستخدمين</p>

                  <p className="mt-2 text-2xl font-bold text-[#0E1F33]">
                    {selectedRoleCount}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">الأقسام المفعلة</p>

                  <p className="mt-2 text-2xl font-bold text-[#0E1F33]">
                    {selectedRoleData.fullAccess
                      ? modules.length
                      : permissionSummary.enabledModules}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-500">إجمالي الصلاحيات</p>

                  <p className="mt-2 text-2xl font-bold text-[#0E1F33]">
                    {selectedRoleData.fullAccess
                      ? "كاملة"
                      : permissionSummary.totalPermissions}
                  </p>
                </div>
              </div>

              {/* Permissions */}

              <div className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[#0E1F33]">
                      ملخص صلاحيات المجموعة
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      الصلاحيات المحددة حاليًا في إعدادات الشركة
                    </p>
                  </div>

                  <Link
                    href="/erp/users/permissions"
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    تعديل الصلاحيات
                  </Link>
                </div>

                {selectedRoleData.fullAccess ? (
                  <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
                    <FiShield className="mt-0.5 shrink-0 text-purple-700" />

                    <div>
                      <p className="font-bold text-purple-800">
                        صلاحيات إدارية كاملة
                      </p>

                      <p className="mt-1 text-sm leading-6 text-purple-700">
                        يمتلك مالك الشركة صلاحيات الإدارة الكاملة، ولا تُدار
                        صلاحياته من إعدادات الأدوار العادية.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        {
                          key: "view",
                          label: "عرض",
                          icon: FiEye,
                          value: permissionSummary.view,
                        },
                        {
                          key: "create",
                          label: "إضافة",
                          icon: FiPlus,
                          value: permissionSummary.create,
                        },
                        {
                          key: "update",
                          label: "تعديل",
                          icon: FiEdit,
                          value: permissionSummary.update,
                        },
                        {
                          key: "delete",
                          label: "حذف",
                          icon: FiTrash2,
                          value: permissionSummary.delete,
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.key}
                            className="rounded-xl border border-slate-200 p-3"
                          >
                            <div className="flex items-center gap-2 text-slate-500">
                              <Icon size={15} />

                              <span className="text-xs">{item.label}</span>
                            </div>

                            <p className="mt-2 text-xl font-bold text-[#0E1F33]">
                              {item.value}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      {modules.map((module) => {
                        const permission =
                          company.rolePermissions?.[selectedRole]?.[
                            module.key
                          ] || createEmptyPermission();

                        const enabled = [
                          permission.view,
                          permission.create,
                          permission.update,
                          permission.delete,
                        ].filter(Boolean).length;

                        const Icon = module.icon;

                        return (
                          <div
                            key={module.key}
                            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <Icon size={17} />
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {module.label}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {enabled} من 4 صلاحيات
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {[
                                ["view", "عرض"],
                                ["create", "إضافة"],
                                ["update", "تعديل"],
                                ["delete", "حذف"],
                              ].map(([key, label]) => {
                                const active =
                                  permission[key as keyof Permission];

                                return (
                                  <span
                                    key={key}
                                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                      active
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    {active ? (
                                      <FiCheckCircle size={12} />
                                    ) : (
                                      <FiXCircle size={12} />
                                    )}

                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!company.rolePermissions?.[selectedRole] && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />

                        <p className="text-xs leading-6 text-amber-800">
                          لم يتم العثور على إعدادات مخصصة لهذا الدور. قد تكون
                          الصلاحيات الافتراضية هي المستخدمة في النظام. راجع صفحة
                          إدارة الصلاحيات.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FiLock size={14} />
                  إدارة الصلاحيات متاحة من صفحة إعدادات الصلاحيات.
                </div>

                <Link
                  href="/erp/users/permissions"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <FiSettings size={16} />
                  الذهاب إلى إدارة الصلاحيات
                  <FiArrowLeft size={15} />
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
