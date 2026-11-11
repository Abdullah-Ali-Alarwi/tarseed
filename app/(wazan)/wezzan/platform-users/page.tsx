"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiUsers,
  FiShield,
  FiBriefcase,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";

const API = "http://localhost:3001/users";

export default function Users() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // جلب المستخدمين
  const getUsers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(API);

      setUsers(res.data);
    } catch (error) {
      toast.error("تعذر تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  // أسماء أنواع الحسابات
  const getType = (type) => {
    const types = {
      platform: "مستخدم المنصة",
      owner: "مالك مؤسسة",
      employee: "موظف",
      erp: "مالك مؤسسة",
    };

    return types[type] || "غير معروف";
  };

  // أسماء الوظائف
  const getRole = (role) => {
    const roles = {
      platform: "مدير المنصة",
      owner: "مالك المؤسسة",
      accountant: "محاسب",
      cashier: "كاشير",
      manager: "مدير",
      inventory: "مسؤول المخزون",
      employee: "موظف",
    };

    return roles[role] || role || "غير محدد";
  };

  // لون نوع الحساب
  const getTypeStyle = (type) => {
    if (type === "platform") {
      return "bg-purple-100 text-purple-700";
    }

    if (type === "owner" || type === "erp") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-emerald-100 text-emerald-700";
  };

  // تصفية المستخدمين والبحث
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        (user.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (user.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (user.companyname || "").toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "platform" && user.type === "platform") ||
        (filter === "owner" &&
          (user.type === "owner" || user.type === "erp")) ||
        (filter === "employee" && user.type === "employee");

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  // الإحصائيات
  const platformCount = users.filter((user) => user.type === "platform").length;

  const ownerCount = users.filter(
    (user) => user.type === "owner" || user.type === "erp",
  ).length;

  const employeeCount = users.filter((user) => user.type === "employee").length;

  // حذف المستخدم
  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف حساب ${user.name || user.username}؟`,
    );

    if (!confirmed) return;

    try {
      setDeleting(user.id);

      await axios.delete(`${API}/${user.id}`);

      setUsers((prev) => prev.filter((item) => item.id !== user.id));

      toast.success("تم حذف المستخدم بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف المستخدم");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4F6FA] p-5 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <FiShield />
              <span>إدارة المنصة</span>
            </div>

            <h1 className="text-2xl font-bold text-[#0E1F33]">
              إدارة المستخدمين
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              إدارة حسابات المنصة وملاك المؤسسات والموظفين.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={getUsers}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              تحديث
            </button>

            <button
              onClick={() => router.push("/wezzan/platform-create-user")}
              className="flex items-center gap-2 rounded-xl bg-[#0E1F33] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/10 transition hover:bg-blue-900"
            >
              <FiPlus size={18} />
              إضافة حساب
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="إجمالي المستخدمين"
            value={users.length}
            icon={<FiUsers />}
            color="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="مستخدمو المنصة"
            value={platformCount}
            icon={<FiShield />}
            color="bg-purple-50 text-purple-600"
          />

          <StatCard
            title="ملاك المؤسسات"
            value={ownerCount}
            icon={<FiBriefcase />}
            color="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="موظفو المؤسسات"
            value={employeeCount}
            icon={<FiUser />}
            color="bg-orange-50 text-orange-600"
          />
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Table Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-[#0E1F33]">جميع الحسابات</h2>

              <p className="mt-1 text-xs text-slate-400">
                عرض وإدارة المستخدمين المسجلين في WEZZAN
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              {filteredUsers.length} حساب
            </span>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو المستخدم أو المؤسسة..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-blue-500"
            >
              <option value="all">جميع الحسابات</option>
              <option value="platform">مستخدمو المنصة</option>
              <option value="owner">ملاك المؤسسات</option>
              <option value="employee">موظفو المؤسسات</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">المستخدم</th>

                  <th className="whitespace-nowrap px-5 py-4">اسم المستخدم</th>

                  <th className="whitespace-nowrap px-5 py-4">نوع الحساب</th>

                  <th className="whitespace-nowrap px-5 py-4">الوظيفة</th>

                  <th className="whitespace-nowrap px-5 py-4">المؤسسة</th>

                  <th className="whitespace-nowrap px-5 py-4">الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <FiLoader className="mx-auto animate-spin text-3xl text-blue-600" />

                      <p className="mt-3 text-sm text-slate-500">
                        جارٍ تحميل المستخدمين...
                      </p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <FiUsers className="mx-auto text-4xl text-slate-300" />

                      <p className="mt-3 font-semibold text-slate-600">
                        لا توجد حسابات
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        لم يتم العثور على مستخدمين مطابقين للبحث.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70"
                    >
                      {/* User */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E1F33] text-sm font-bold text-white">
                            {(user.name || user.username || "?").slice(0, 2)}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {user.name || user.username}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              ID: {user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {user.username}
                      </td>

                      {/* Account Type */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getTypeStyle(user.type)}`}
                        >
                          {getType(user.type)}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {getRole(user.role)}
                      </td>

                      {/* Company */}
                      <td className="whitespace-nowrap px-5 py-4">
                        {user.companyname ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {user.companyname}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {user.companyId}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            منصة WEZZAN
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/wezzan/platform-edit-user/${user.id}`,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                            title="تعديل"
                          >
                            <FiEdit size={16} />
                          </button>

                          <button
                            onClick={() => deleteUser(user)}
                            disabled={deleting === user.id}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                            title="حذف"
                          >
                            {deleting === user.id ? (
                              <FiLoader className="animate-spin" />
                            ) : (
                              <FiTrash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && users.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-xs text-slate-400">
              عرض {filteredUsers.length} من أصل {users.length} حساب
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Statistics Card
function StatCard({ title, value, icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <h3 className="mt-3 text-3xl font-bold text-[#0E1F33]">{value}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
