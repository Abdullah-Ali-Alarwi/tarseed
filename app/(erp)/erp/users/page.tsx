"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiMail,
  FiMapPin,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

// =========================
// Types
// =========================

type ERPUser = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  type?: string;
  companyId?: string;
  companyname?: string;
  ownerId?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CurrentUser = {
  id: string;
  username?: string;
  name?: string;
  role?: string;
  type?: string;
  companyId?: string;
  companyname?: string;
  ownerId?: string;
  status?: string;
  isActive?: boolean;
};

type UserStatus = "active" | "inactive";

// =========================
// Constants
// =========================

const roleNames: Record<string, string> = {
  owner: "مالك المؤسسة",
  accountant: "محاسب",
  cashier: "كاشير",
  manager: "مدير",
  inventory: "مسؤول المخزون",
  employee: "موظف",
  admin: "مدير النظام",
};

const roleOptions = [
  { value: "owner", label: "مالك المؤسسة" },
  { value: "accountant", label: "محاسب" },
  { value: "cashier", label: "كاشير" },
  { value: "manager", label: "مدير" },
  { value: "inventory", label: "مسؤول المخزون" },
  { value: "employee", label: "موظف" },
];

// =========================
// Helpers
// =========================

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : "";
}

function isUserActive(user: ERPUser): boolean {
  if (user.isActive === false) return false;

  const status = String(user.status ?? "").toLowerCase();

  return !["inactive", "غير نشط"].includes(status);
}

function normalizeStatus(user: ERPUser): UserStatus {
  return isUserActive(user) ? "active" : "inactive";
}

// =========================
// Main Component
// =========================

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<ERPUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [companyname, setCompanyname] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // =========================
  // Get Current User
  // =========================

  const getCurrentUser = useCallback(async () => {
    const username = getCookie("username");

    if (!username) {
      throw new Error("لم يتم العثور على بيانات تسجيل الدخول.");
    }

    const result = await getUserByUsername(username);

    const user = (
      Array.isArray(result) ? result[0] : result
    ) as CurrentUser | null;

    if (!user) {
      throw new Error("تعذر العثور على المستخدم الحالي.");
    }

    if (user.type === "platform") {
      throw new Error("لا يمكن لمستخدم المنصة الوصول إلى مستخدمي المؤسسة.");
    }

    if (user.isActive === false || user.status === "inactive") {
      throw new Error("حساب المستخدم غير نشط.");
    }

    if (!user.companyId) {
      throw new Error("المستخدم الحالي غير مرتبط بأي مؤسسة.");
    }

    return user;
  }, []);

  // =========================
  // Fetch Users By Company
  // =========================

  const getUsers = useCallback(async () => {
    try {
      setLoading(true);

      // أولاً: تحديد المستخدم الحالي
      const currentUser = await getCurrentUser();

      const currentCompanyId = String(currentUser.companyId);

      setCurrentUserId(String(currentUser.id));
      setCompanyId(currentCompanyId);

      setCompanyname(currentUser.companyname || "المؤسسة الحالية");

      // ثانياً: جلب مستخدمي الشركة الحالية فقط
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, name, username, email, role, type, companyId, companyname, ownerId, status, isActive, createdAt, updatedAt",
        )
        .eq("companyId", currentCompanyId)
        .order("createdAt", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      // ثالثاً: تأكيد العزل حسب الشركة
      const companyUsers = (data ?? []).filter(
        (user) =>
          String(user.companyId) === currentCompanyId &&
          user.type !== "platform",
      ) as ERPUser[];

      setUsers(companyUsers);
    } catch (error) {
      console.error("Get company users error:", error);

      setUsers([]);

      toast.error(
        error instanceof Error ? error.message : "تعذر تحميل مستخدمي المؤسسة.",
      );
    } finally {
      setLoading(false);
    }
  }, [getCurrentUser]);

  // =========================
  // Initial Load
  // =========================

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // =========================
  // Statistics
  // =========================

  const activeUsers = users.filter(isUserActive).length;

  const inactiveUsers = users.filter((user) => !isUserActive(user)).length;

  const admins = users.filter(
    (user) =>
      user.role === "owner" || user.role === "manager" || user.role === "admin",
  ).length;

  // =========================
  // Search & Filters
  // =========================

  const filteredUsers = users.filter((user) => {
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      String(user.name ?? "")
        .toLowerCase()
        .includes(searchValue) ||
      String(user.username ?? "")
        .toLowerCase()
        .includes(searchValue) ||
      String(user.email ?? "")
        .toLowerCase()
        .includes(searchValue);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const userStatus = isUserActive(user) ? "نشط" : "غير نشط";

    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // =========================
  // Processing State
  // =========================

  const setProcessing = (id: string, value: boolean) => {
    setProcessingIds((prev) => {
      if (value) {
        return prev.includes(id) ? prev : [...prev, id];
      }

      return prev.filter((item) => item !== id);
    });
  };

  // =========================
  // Toggle User Status
  // =========================

  const toggleStatus = async (user: ERPUser) => {
    if (!companyId) {
      toast.error("لم يتم تحديد المؤسسة الحالية.");
      return;
    }

    const newIsActive = !isUserActive(user);

    const newStatus: UserStatus = newIsActive ? "active" : "inactive";

    try {
      setProcessing(user.id, true);

      const { data, error } = await supabase
        .from("users")
        .update({
          status: newStatus,
          isActive: newIsActive,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", user.id)
        .eq("companyId", companyId)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("لم يتم تحديث المستخدم. تحقق من صلاحيات الوصول.");
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                status: newStatus,
                isActive: newIsActive,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      toast.success(
        newIsActive ? "تم تفعيل المستخدم بنجاح." : "تم إيقاف المستخدم بنجاح.",
      );
    } catch (error) {
      console.error("Toggle user status error:", error);

      toast.error(
        error instanceof Error ? error.message : "تعذر تحديث حالة المستخدم.",
      );
    } finally {
      setProcessing(user.id, false);
    }
  };

  // =========================
  // Delete User
  // =========================

  const deleteUser = async (user: ERPUser) => {
    if (!companyId) {
      toast.error("لم يتم تحديد المؤسسة الحالية.");
      return;
    }

    if (String(user.id) === currentUserId) {
      toast.error("لا يمكنك حذف حسابك الحالي.");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المستخدم "${user.name || user.username}"؟`,
    );

    if (!confirmed) return;

    try {
      setProcessing(user.id, true);

      const { data, error } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id)
        .eq("companyId", companyId)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("لم يتم حذف المستخدم. تحقق من صلاحيات الوصول.");
      }

      setUsers((prev) => prev.filter((item) => item.id !== user.id));

      toast.success("تم حذف المستخدم بنجاح.");
    } catch (error) {
      console.error("Delete user error:", error);

      toast.error(
        error instanceof Error ? error.message : "تعذر حذف المستخدم.",
      );
    } finally {
      setProcessing(user.id, false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F7FA] p-5 md:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0E1F33]">
              إدارة المستخدمين
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              إدارة حسابات مستخدمي {companyname || "المؤسسة"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={getUsers}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              تحديث
            </button>

            <button
              type="button"
              onClick={() => router.push("/erp/users/create-erp-user")}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0E1F33] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#193957]"
            >
              <FiPlus size={18} />
              إضافة مستخدم
            </button>
          </div>
        </div>

        {/* Company Information */}

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600">
            <FiMapPin size={19} />
          </div>

          <div>
            <p className="text-xs text-blue-600">المؤسسة الحالية</p>

            <p className="mt-1 font-bold text-[#0E1F33]">
              {companyname || "المؤسسة"}
            </p>
          </div>

          <span className="mr-auto rounded-full bg-white px-3 py-1 text-xs text-green-700">
            {users.length} مستخدم
          </span>
        </div>

        {/* Statistics */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="إجمالي المستخدمين"
            value={users.length}
            icon={<FiUsers />}
            color="blue"
          />

          <StatCard
            title="المستخدمون النشطون"
            value={activeUsers}
            icon={<FiUserCheck />}
            color="green"
          />

          <StatCard
            title="المستخدمون غير النشطين"
            value={inactiveUsers}
            icon={<FiUserX />}
            color="red"
          />

          <StatCard
            title="المسؤولون"
            value={admins}
            icon={<FiShield />}
            color="purple"
          />
        </div>

        {/* Users Table */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Table Header */}

          <div className="border-b border-gray-100 p-5">
            <div className="mb-5">
              <h2 className="font-bold text-[#0E1F33]">قائمة المستخدمين</h2>

              <p className="mt-1 text-xs text-gray-400">
                المستخدمون المرتبطون بالمؤسسة الحالية فقط
              </p>
            </div>

            {/* Search & Filters */}

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <FiSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  placeholder="ابحث بالاسم أو اسم المستخدم..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <FiFilter
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-3 pr-9 pl-8 text-sm outline-none focus:border-[#0E1F33]"
                  >
                    <option value="all">جميع الأدوار</option>

                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0E1F33]"
                >
                  <option value="all">جميع الحالات</option>

                  <option value="نشط">نشط</option>

                  <option value="غير نشط">غير نشط</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">المستخدم</th>

                  <th className="px-6 py-4 font-medium">الدور الوظيفي</th>

                  <th className="px-6 py-4 font-medium">المؤسسة</th>

                  <th className="px-6 py-4 font-medium">الحالة</th>

                  <th className="px-6 py-4 text-center font-medium">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <FiLoader className="mx-auto animate-spin text-2xl text-[#0E1F33]" />

                      <p className="mt-3 text-sm text-gray-400">
                        جارٍ تحميل المستخدمين...
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const active = isUserActive(user);

                    const processing = processingIds.includes(user.id);

                    return (
                      <tr key={user.id} className="transition hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9EFF5] text-sm font-bold text-[#0E1F33]">
                              {user.name?.slice(0, 2) || "؟"}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {user.name || "بدون اسم"}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                <FiMail size={12} />
                                {user.email || user.username || "غير محدد"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                            {roleNames[user.role ?? ""] ||
                              user.role ||
                              "غير محدد"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMapPin size={15} className="text-gray-400" />

                            {user.companyname || companyname}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                              active
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                active ? "bg-green-500" : "bg-red-500"
                              }`}
                            />

                            {active ? "نشط" : "غير نشط"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              type="button"
                              title={
                                active ? "إيقاف المستخدم" : "تفعيل المستخدم"
                              }
                              disabled={processing}
                              onClick={() => toggleStatus(user)}
                              className="text-gray-400 transition hover:text-green-600 disabled:opacity-40"
                            >
                              {processing ? (
                                <FiLoader size={17} className="animate-spin" />
                              ) : (
                                <FiUserCheck size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              title="حذف المستخدم"
                              disabled={processing || user.id === currentUserId}
                              onClick={() => deleteUser(user)}
                              className="text-gray-400 transition hover:text-red-600 disabled:opacity-30"
                            >
                              <FiTrash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-sm text-gray-400"
                    >
                      لا يوجد مستخدمون تابعون لهذه المؤسسة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}

          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-400">
              عرض {filteredUsers.length} من أصل {users.length} مستخدم
            </p>

            <span className="text-xs text-gray-400">جميع الحقوق محفوظة</span>
          </div>
        </div>
      </div>
    </main>
  );
}

// =========================
// Statistics Card
// =========================

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "purple";
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h3 className="mt-3 text-2xl font-bold text-[#0E1F33]">
            {value.toLocaleString("en-US")}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
