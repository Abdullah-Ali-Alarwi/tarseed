"use client";

import axios from "axios";
import { useEffect, useState } from "react";
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
} from "react-icons/fi";

const API = "http://localhost:3001/users";

const roleNames = {
  owner: "مالك المؤسسة",
  accountant: "محاسب",
  cashier: "كاشير",
  manager: "مدير",
  inventory: "مسؤول المخزون",
  employee: "موظف",
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [companyname, setCompanyname] = useState("");

  // قراءة Cookies
  const getCookie = (name) => {
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(name + "="));

    return cookie
      ? decodeURIComponent(cookie.split("=").slice(1).join("="))
      : "";
  };

  // جلب مستخدمي المؤسسة الحالية
  const getUsers = async () => {
    try {
      setLoading(true);

      const companyId = getCookie("companyId");
      const company = getCookie("companyname");

      if (!companyId) {
        toast.error("لم يتم العثور على معرف المؤسسة");
        setUsers([]);
        return;
      }

      setCompanyname(company);

      const res = await axios.get(API, {
        params: {
          companyId: companyId,
        },
      });

      // التأكد من أن المستخدمين تابعون للمؤسسة الحالية
      const companyUsers = res.data.filter(
        (user) => String(user.companyId) === String(companyId),
      );

      setUsers(companyUsers);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  // الإحصائيات
  const activeUsers = users.filter((user) => user.status !== "غير نشط").length;

  const inactiveUsers = users.filter(
    (user) => user.status === "غير نشط",
  ).length;

  const admins = users.filter(
    (user) => user.role === "owner" || user.role === "manager",
  ).length;

  // البحث والفلاتر
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const userStatus = user.status === "غير نشط" ? "غير نشط" : "نشط";

    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // تغيير حالة المستخدم
  const toggleStatus = async (user) => {
    const newStatus = user.status === "غير نشط" ? "نشط" : "غير نشط";

    try {
      await axios.patch(`${API}/${user.id}`, {
        status: newStatus,
      });

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, status: newStatus } : item,
        ),
      );

      toast.success("تم تحديث حالة المستخدم");
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحديث حالة المستخدم");
    }
  };

  // حذف المستخدم
  const deleteUser = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      return;
    }

    try {
      await axios.delete(`${API}/${id}`);

      setUsers((prev) => prev.filter((user) => user.id !== id));

      toast.success("تم حذف المستخدم بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف المستخدم");
    }
  };

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

          <button
            onClick={() => router.push("/erp/users/create-erp-user")}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#0E1F33] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#193957]"
          >
            <FiPlus size={18} />
            إضافة مستخدم
          </button>
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

        {/* Users Table Container */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Table Header */}

          <div className="border-b border-gray-100 p-5">
            <div className="mb-5">
              <h2 className="font-bold text-[#0E1F33]">قائمة المستخدمين</h2>

              <p className="mt-1 text-xs text-gray-400">
                مستخدمو {companyname || "المؤسسة الحالية"}
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
                    <option value="owner">مالك المؤسسة</option>
                    <option value="accountant">محاسب</option>
                    <option value="cashier">كاشير</option>
                    <option value="manager">مدير</option>
                    <option value="inventory">مسؤول المخزون</option>
                    <option value="employee">موظف</option>
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
                    <td colSpan="5" className="py-12 text-center">
                      <FiLoader className="mx-auto animate-spin text-2xl text-[#0E1F33]" />
                      <p className="mt-3 text-sm text-gray-400">
                        جارٍ تحميل المستخدمين...
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="transition hover:bg-gray-50">
                      {/* User */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9EFF5] text-sm font-bold text-[#0E1F33]">
                            {user.name?.slice(0, 2) || "؟"}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {user.name}
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                              <FiMail size={12} />
                              {user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                          {roleNames[user.role] || user.role || "غير محدد"}
                        </span>
                      </td>

                      {/* Company */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiMapPin size={15} className="text-gray-400" />
                          {user.companyname || companyname}
                        </div>
                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                            user.status !== "غير نشط"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.status !== "غير نشط"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />

                          {user.status || "نشط"}
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            title="تغيير الحالة"
                            onClick={() => toggleStatus(user)}
                            className="text-gray-400 transition hover:text-green-600"
                          >
                            <FiUserCheck size={17} />
                          </button>

                          <button
                            title="حذف المستخدم"
                            onClick={() => deleteUser(user.id)}
                            className="text-gray-400 transition hover:text-red-600"
                          >
                            <FiTrash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
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

// Statistics Card

function StatCard({ title, value, icon, color }) {
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

          <h3 className="mt-3 text-2xl font-bold text-[#0E1F33]">{value}</h3>
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
