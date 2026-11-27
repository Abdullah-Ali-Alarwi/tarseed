"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiEdit,
  FiMail,
  FiShield,
  FiBriefcase,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";

/* =========================
   Types
========================= */

type User = {
  id: string;
  name?: string;
  username: string;
  email?: string;
  phone?: string;
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
  name?: string;
  username: string;
  type?: string;
  role?: string;
  companyId?: string;
  companyname?: string;
  ownerId?: string;
  status?: string;
  isActive?: boolean;
};

/* =========================
   Constants
========================= */

const roleLabels: Record<string, string> = {
  owner: "مالك الشركة",
  admin: "مدير النظام",
  accountant: "محاسب",
  cashier: "كاشير",
  employee: "موظف",
  manager: "مدير",
  inventory: "مسؤول المخزون",
};

/* =========================
   Helpers
========================= */

const getRoleLabel = (role?: string) => {
  if (!role) return "غير محدد";

  return roleLabels[role.toLowerCase()] || role;
};

const isUserActive = (user: User) => {
  if (user.isActive === false) return false;

  const status = user.status?.toLowerCase();

  if (status === "inactive" || status === "غير نشط") {
    return false;
  }

  return true;
};

const getUserName = (user: User) => {
  return user.name || user.username || "مستخدم";
};

/* =========================
   Main Page
========================= */

export default function UsersListPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  /* =========================
     Current User
  ========================= */

  const loadCurrentUser = useCallback(async () => {
    try {
      // قراءة username من Cookie
      const username = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="))
        ?.split("=")
        .slice(1)
        .join("=");

      const decodedUsername = username ? decodeURIComponent(username) : "";

      if (!decodedUsername) {
        toast.error("انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مجددًا");
        router.replace("/login");
        return null;
      }

      // جلب بيانات المستخدم من Supabase
      const response = await getUserByUsername(decodedUsername);

      const user = Array.isArray(response) ? response[0] : response;

      if (!user) {
        toast.error("لم يتم العثور على بيانات المستخدم");
        router.replace("/login");
        return null;
      }

      // منع مستخدمي منصة Wezzan
      if (user.type === "platform") {
        toast.error("ليس لديك صلاحية الوصول إلى مستخدمي الشركة");
        router.replace("/wezzan/dashboard");
        return null;
      }

      // التحقق من حالة المستخدم
      if (
        user.isActive === false ||
        user.status === "inactive" ||
        user.status === "غير نشط"
      ) {
        toast.error("حسابك غير نشط");
        router.replace("/login");
        return null;
      }

      // التأكد من ارتباط المستخدم بشركة
      if (!user.companyId) {
        toast.error("حسابك غير مرتبط بشركة");
        return null;
      }

      const normalizedUser = {
        id: String(user.id),
        name: user.name,
        username: user.username,
        type: user.type,
        role: user.role,
        companyId: String(user.companyId),
        companyname: user.companyname,
        ownerId: user.ownerId,
        status: user.status,
        isActive: user.isActive,
      };

      setCurrentUser(normalizedUser);

      return normalizedUser;
    } catch (error) {
      console.error("Load current user error:", error);
      toast.error("تعذر التحقق من بيانات المستخدم");
      return null;
    }
  }, [router]);
  /* =========================
     Fetch Company Users
  ========================= */

  const fetchData = useCallback(async () => {
    if (!currentUser?.companyId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          name,
          username,
          email,
          role,
          type,
          companyId,
          companyname,
          ownerId,
          status,
          isActive,
          createdAt,
          updatedAt
        `,
        )
        .eq("companyId", currentUser.companyId)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Fetch users error:", error);
        throw error;
      }

      // استبعاد مستخدمي منصة Wezzan
      const companyUsers = (data || []).filter(
        (user) => user.type !== "platform",
      );

      setUsers(companyUsers);
    } catch (error) {
      console.error("Fetch company users error:", error);

      toast.error("تعذر تحميل بيانات المستخدمين");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /* =========================
     Initialization
  ========================= */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setInitializing(true);

      const user = await loadCurrentUser();

      if (!mounted) return;

      if (!user) {
        setInitializing(false);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      setInitializing(false);
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadCurrentUser]);

  /* =========================
     Load Users
  ========================= */

  useEffect(() => {
    if (!initializing && currentUser?.companyId) {
      fetchData();
    }
  }, [initializing, currentUser, fetchData]);

  /* =========================
     Company Name
  ========================= */

  const companyName = currentUser?.companyname || "الشركة الحالية";

  /* =========================
     Statistics
  ========================= */

  const stats = useMemo(() => {
    const active = users.filter(isUserActive).length;

    return {
      total: users.length,
      active,
      inactive: users.length - active,
      owners: users.filter((user) => user.role?.toLowerCase() === "owner")
        .length,
    };
  }, [users]);

  /* =========================
     Available Roles
  ========================= */

  const availableRoles = useMemo(() => {
    return Array.from(
      new Set(
        users
          .map((user) => user.role)
          .filter((role): role is string => Boolean(role)),
      ),
    );
  }, [users]);

  /* =========================
     Search & Filters
  ========================= */

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = getUserName(user);

      const query = search.toLowerCase().trim();

      const matchesSearch =
        name.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query);

      const matchesRole =
        roleFilter === "all" ||
        user.role?.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isUserActive(user)) ||
        (statusFilter === "inactive" && !isUserActive(user));

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /* =========================
     Refresh
  ========================= */

  const handleRefresh = () => {
    fetchData();
  };

  /* =========================
     Delete User
  ========================= */

  const handleDelete = async () => {
    if (!selectedUser || !currentUser?.companyId) return;

    // منع حذف الحساب الحالي
    if (selectedUser.id === currentUser.id) {
      toast.error("لا يمكنك حذف حسابك الحالي");
      return;
    }

    // منع حذف مستخدم من شركة أخرى
    if (selectedUser.companyId !== currentUser.companyId) {
      toast.error("لا يمكنك حذف مستخدم من شركة أخرى");
      return;
    }

    setDeletingId(selectedUser.id);

    try {
      const { data, error } = await supabase
        .from("users")
        .delete()
        .eq("id", selectedUser.id)
        .eq("companyId", currentUser.companyId)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Delete user error:", error);
        throw error;
      }

      if (!data) {
        toast.error("لم يتم حذف المستخدم، قد لا تملك الصلاحية اللازمة");
        return;
      }

      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

      toast.success("تم حذف المستخدم بنجاح");

      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Delete user error:", error);

      toast.error("تعذر حذف المستخدم");
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================
     Delete Modal
  ========================= */

  const openDeleteModal = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("لا يمكنك حذف حسابك الحالي");
      return;
    }

    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  /* =========================
     Loading Screen
  ========================= */

  if (initializing) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500"
      >
        <FiRefreshCw className="animate-spin text-3xl" />
        <p className="text-sm">جاري التحقق من بيانات المستخدم...</p>
      </div>
    );
  }

  if (!currentUser?.companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
      >
        <FiAlertCircle size={35} className="text-rose-500" />

        <h2 className="font-bold text-slate-800">
          تعذر الوصول إلى بيانات الشركة
        </h2>

        <p className="text-sm text-slate-500">
          يرجى تسجيل الدخول بحساب مرتبط بشركة.
        </p>
      </div>
    );
  }

  /* =========================
     Render
  ========================= */

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* العنوان */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <FiUsers size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                إدارة المستخدمين
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                عرض وإدارة مستخدمي {companyName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/users/create-erp-user"
            className="flex items-center gap-2 rounded-xl bg-[#0E1F33] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <FiUserPlus size={17} />
            إضافة مستخدم
          </Link>
        </div>
      </div>

      {/* الإحصائيات */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.total}
          icon={<FiUsers />}
          color="blue"
        />

        <StatCard
          title="المستخدمون النشطون"
          value={stats.active}
          icon={<FiCheckCircle />}
          color="emerald"
        />

        <StatCard
          title="المستخدمون الموقوفون"
          value={stats.inactive}
          icon={<FiXCircle />}
          color="rose"
        />

        <StatCard
          title="ملاك الشركة"
          value={stats.owners}
          icon={<FiShield />}
          color="violet"
        />
      </div>

      {/* البحث والتصفية */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
          <FiFilter />
          البحث والتصفية
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو اسم المستخدم أو البريد..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">جميع الأدوار</option>

            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">موقوف</option>
          </select>
        </div>
      </div>

      {/* جدول المستخدمين */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-800">قائمة المستخدمين</h2>

            <p className="mt-1 text-xs text-slate-500">
              عدد النتائج: {filteredUsers.length}
            </p>
          </div>

          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {users.length} مستخدم
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <FiRefreshCw className="animate-spin text-2xl" />
            <p className="text-sm">جاري تحميل المستخدمين...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FiUsers size={25} />
            </div>

            <h3 className="font-bold text-slate-700">لا يوجد مستخدمون</h3>

            <p className="text-sm text-slate-500">
              لم يتم العثور على مستخدمين يطابقون البحث أو التصفية.
            </p>

            {users.length === 0 && (
              <Link
                href="/erp/users/create-erp-user"
                className="mt-2 rounded-xl bg-[#0E1F33] px-4 py-2 text-sm text-white"
              >
                إضافة أول مستخدم
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-4">المستخدم</th>
                  <th className="px-4 py-4">اسم الدخول</th>
                  <th className="px-4 py-4">الدور الوظيفي</th>
                  <th className="px-4 py-4">الشركة</th>
                  <th className="px-4 py-4">نوع الحساب</th>
                  <th className="px-4 py-4">الحالة</th>
                  <th className="px-5 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const name = getUserName(user);
                  const active = isUserActive(user);

                  return (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      {/* المستخدم */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                            {name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {name}
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <FiMail size={12} />
                              {user.email || "لا يوجد بريد إلكتروني"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* اسم الدخول */}

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                          {user.username}
                        </span>
                      </td>

                      {/* الدور */}

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiShield className="text-slate-400" />
                          {getRoleLabel(user.role)}
                        </div>
                      </td>

                      {/* الشركة */}

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiBriefcase className="text-slate-400" />
                          {user.companyname || companyName}
                        </div>
                      </td>

                      {/* نوع الحساب */}

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700">
                          {user.type === "owner"
                            ? "مالك"
                            : user.type === "employee"
                              ? "موظف"
                              : user.type === "erp"
                                ? "مستخدم ERP"
                                : user.type || "غير محدد"}
                        </span>
                      </td>

                      {/* الحالة */}

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              active ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />

                          {active ? "نشط" : "موقوف"}
                        </span>
                      </td>

                      {/* الإجراءات */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/erp/users/${user.id}/edit`}
                            title="تعديل المستخدم"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                          >
                            <FiEdit size={16} />
                          </Link>

                          <button
                            onClick={() => openDeleteModal(user)}
                            title="حذف المستخدم"
                            disabled={
                              user.id === currentUser.id || deletingId !== null
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <FiTrash2 size={16} />
                          </button>
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

      {/* نافذة تأكيد الحذف */}

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FiAlertCircle size={24} />
              </div>

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <FiX size={20} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              تأكيد حذف المستخدم
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              هل أنت متأكد من حذف المستخدم{" "}
              <span className="font-bold text-slate-800">
                {getUserName(selectedUser)}
              </span>
              ؟ لا يمكن التراجع عن هذه العملية.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <FiTrash2 />
                {deletingId ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                disabled={deletingId !== null}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Statistics Card
========================= */

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "rose" | "violet";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
