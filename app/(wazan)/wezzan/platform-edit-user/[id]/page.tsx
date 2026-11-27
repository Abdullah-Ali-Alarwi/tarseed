"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiRefreshCw,
  FiMail,
  FiUser,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";

// =====================================================
// TYPES
// =====================================================

type PlatformUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  type: string;
  status: string;
  isActive: boolean;
  createdAt: string | null;
};

// =====================================================
// HELPERS
// =====================================================

function getRoleName(role: string) {
  const roles: Record<string, string> = {
    admin: "مدير النظام",
    platform_admin: "مدير المنصة",
    platform_employee: "موظف المنصة",
    manager: "مدير",
    employee: "موظف",
  };

  return roles[role] || role || "غير محدد";
}

function formatDate(date: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function normalizeUser(row: any): PlatformUser {
  const extra = row.extra || {};

  return {
    id: String(row.id ?? extra.id ?? ""),
    name: row.name ?? extra.name ?? "",
    username: row.username ?? extra.username ?? "",
    email: row.email ?? extra.email ?? "",
    role: row.role ?? extra.role ?? "",
    type: row.type ?? extra.type ?? "",
    status: row.status ?? extra.status ?? "",
    isActive: row.isActive ?? extra.isActive ?? true,
    createdAt: row.createdAt ?? extra.createdAt ?? null,
  };
}

function isUserActive(user: PlatformUser) {
  return user.isActive !== false && user.status !== "inactive";
}

// =====================================================
// PAGE
// =====================================================

export default function PlatformUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: supabaseError } = await supabase
        .from("users")
        .select(
          `
          id,
          name,
          username,
          email,
          role,
          type,
          status,
          isActive,
          createdAt,
          extra
          `,
        )
        .order("createdAt", {
          ascending: false,
        });

      if (supabaseError) {
        throw supabaseError;
      }

      // دعم البيانات المخزنة مباشرة أو داخل extra
      const normalizedUsers = (data || [])
        .map(normalizeUser)
        .filter((user) => user.type === "platform");

      setUsers(normalizedUsers);
    } catch (err: any) {
      console.error("Fetch platform users error:", err);

      const message = err?.message || "حدث خطأ أثناء تحميل مستخدمي المنصة";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return users;

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(value) ||
        user.username.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        getRoleName(user.role).toLowerCase().includes(value)
      );
    });
  }, [users, search]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const activeUsers = users.filter(isUserActive).length;

  const inactiveUsers = users.length - activeUsers;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div dir="rtl" className="min-h-screen space-y-6 pb-10">
      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>Wezzan</span>
            <span>/</span>
            <span className="text-slate-300">إدارة المنصة</span>
            <span>/</span>
            <span className="text-cyan-400">مستخدمو المنصة</span>
          </div>

          <h1 className="text-2xl font-bold text-white">مستخدمو المنصة</h1>

          <p className="mt-2 text-sm text-slate-400">
            إدارة حسابات فريق WEZZAN ومتابعة صلاحياتهم وحالة حساباتهم.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={() => router.push("/wezzan/platform-create-user")}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            <FiUserPlus size={17} />
            إضافة مستخدم
          </button>
        </div>
      </div>

      {/* ============================================= */}
      {/* STATISTICS */}
      {/* ============================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total */}

        <div className="rounded-2xl border border-slate-700 bg-[#0E1F33] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">إجمالي المستخدمين</p>

              <h2 className="mt-3 text-3xl font-bold text-white">
                {users.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
              <FiUsers size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">جميع حسابات فريق المنصة</p>
        </div>

        {/* Active */}

        <div className="rounded-2xl border border-slate-700 bg-[#0E1F33] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">المستخدمون النشطون</p>

              <h2 className="mt-3 text-3xl font-bold text-emerald-400">
                {activeUsers}
              </h2>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <FiCheckCircle size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            الحسابات المسموح لها بالدخول
          </p>
        </div>

        {/* Inactive */}

        <div className="rounded-2xl border border-slate-700 bg-[#0E1F33] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">المستخدمون غير النشطين</p>

              <h2 className="mt-3 text-3xl font-bold text-red-400">
                {inactiveUsers}
              </h2>
            </div>

            <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
              <FiXCircle size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">الحسابات المعطلة</p>
        </div>
      </div>

      {/* ============================================= */}
      {/* USERS TABLE */}
      {/* ============================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#0E1F33]">
        {/* TABLE HEADER */}

        <div className="flex flex-col gap-4 border-b border-slate-700 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-white">قائمة المستخدمين</h2>

            <p className="mt-1 text-xs text-slate-400">
              عرض وإدارة حسابات موظفي منصة Wezzan
            </p>
          </div>

          {/* SEARCH */}

          <div className="relative w-full sm:max-w-xs">
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو المستخدم..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pr-10 pl-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
            />
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />

            <p className="text-sm text-slate-400">جاري تحميل المستخدمين...</p>
          </div>
        ) : error ? (
          /* ERROR */

          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <FiAlertCircle size={35} className="text-red-400" />

            <h3 className="mt-4 font-semibold text-white">
              تعذر تحميل المستخدمين
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>

            <button
              onClick={() => fetchUsers()}
              className="mt-5 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          /* EMPTY */

          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-2xl bg-slate-800 p-5 text-slate-500">
              <FiUsers size={35} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search ? "لا توجد نتائج مطابقة" : "لا يوجد مستخدمون حتى الآن"}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {search
                ? "جرّب البحث باستخدام اسم أو اسم مستخدم مختلف."
                : "يمكنك إضافة أول مستخدم لفريق المنصة."}
            </p>

            {!search && (
              <button
                onClick={() => router.push("/wezzan/platform-create-user")}
                className="mt-5 flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600"
              >
                <FiUserPlus />
                إضافة مستخدم
              </button>
            )}
          </div>
        ) : (
          /* TABLE */

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-slate-900/60">
                <tr className="text-xs text-slate-400">
                  <th className="px-5 py-4 font-medium">المستخدم</th>

                  <th className="px-5 py-4 font-medium">اسم المستخدم</th>

                  <th className="px-5 py-4 font-medium">البريد الإلكتروني</th>

                  <th className="px-5 py-4 font-medium">الصلاحية</th>

                  <th className="px-5 py-4 font-medium">تاريخ الإنشاء</th>

                  <th className="px-5 py-4 font-medium">الحالة</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-700/70">
                {filteredUsers.map((user) => {
                  const active = isUserActive(user);

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-800/40"
                    >
                      {/* USER */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                            <FiUser size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {user.name || "بدون اسم"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID: {user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* USERNAME */}

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-300">
                          @{user.username || "—"}
                        </span>
                      </td>

                      {/* EMAIL */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <FiMail size={15} />
                          <span dir="ltr">{user.email || "—"}</span>
                        </div>
                      </td>

                      {/* ROLE */}

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                          <FiShield size={14} />
                          {getRoleName(user.role)}
                        </div>
                      </td>

                      {/* CREATED AT */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <FiCalendar size={14} />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        {active ? (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            غير نشط
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-700 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              عرض {filteredUsers.length} من أصل {users.length} مستخدم
            </p>

            <p>بيانات مستخدمي منصة WEZZAN</p>
          </div>
        )}
      </div>
    </div>
  );
}
