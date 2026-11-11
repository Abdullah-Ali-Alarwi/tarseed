"use client";

import { useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiShield,
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiX,
  FiCheck,
} from "react-icons/fi";

type Role = {
  id: number;
  name: string;
  code: string;
  scope: "Platform" | "Tenant" | "Location";
  description: string;
  users: number;
  permissions: number;
  system: boolean;
  active: boolean;
};

const initialRoles: Role[] = [
  {
    id: 1,
    name: "مالك الشركة",
    code: "tenant_owner",
    scope: "Tenant",
    description: "صلاحيات كاملة لإدارة الشركة",
    users: 1,
    permissions: 25,
    system: true,
    active: true,
  },
  {
    id: 2,
    name: "مسؤول الشركة",
    code: "tenant_administrator",
    scope: "Tenant",
    description: "إدارة المستخدمين والعمليات",
    users: 2,
    permissions: 18,
    system: true,
    active: true,
  },
  {
    id: 3,
    name: "موظف الشركة",
    code: "tenant_member",
    scope: "Tenant",
    description: "صلاحيات الموظف العادي",
    users: 5,
    permissions: 7,
    system: true,
    active: true,
  },
  {
    id: 4,
    name: "مدير الفرع",
    code: "location_manager",
    scope: "Location",
    description: "إدارة عمليات الفرع",
    users: 3,
    permissions: 8,
    system: true,
    active: true,
  },
  {
    id: 5,
    name: "كاشير",
    code: "location_cashier",
    scope: "Location",
    description: "تنفيذ عمليات البيع",
    users: 4,
    permissions: 4,
    system: true,
    active: true,
  },
  {
    id: 6,
    name: "مدير المنصة",
    code: "platform_admin",
    scope: "Platform",
    description: "إدارة المنصة بالكامل",
    users: 1,
    permissions: 35,
    system: true,
    active: true,
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState(initialRoles);

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    scope: "Location" as Role["scope"],
    description: "",
  });

  const systemRoles = roles.filter((r) => r.system).length;

  const customRoles = roles.filter((r) => !r.system).length;

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.includes(search) ||
      role.code.toLowerCase().includes(search.toLowerCase());

    const matchesScope = scope === "all" || role.scope === scope;

    return matchesSearch && matchesScope;
  });

  function openAddModal() {
    setEditingRole(null);

    setForm({
      name: "",
      code: "",
      scope: "Location",
      description: "",
    });

    setShowModal(true);
  }

  function openEditModal(role: Role) {
    if (role.system) return;

    setEditingRole(role);

    setForm({
      name: role.name,
      code: role.code,
      scope: role.scope,
      description: role.description,
    });

    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingRole) {
      setRoles((prev) =>
        prev.map((role) =>
          role.id === editingRole.id ? { ...role, ...form } : role,
        ),
      );
    } else {
      setRoles((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...form,
          users: 0,
          permissions: 0,
          system: false,
          active: true,
        },
      ]);
    }

    setShowModal(false);
  }

  function deleteRole(id: number) {
    const role = roles.find((r) => r.id === id);

    if (!role || role.system) return;

    if (role.users > 0) {
      alert("لا يمكن حذف دور مرتبط بمستخدمين.");
      return;
    }

    if (confirm("هل تريد حذف هذا الدور؟")) {
      setRoles((prev) => prev.filter((r) => r.id !== id));
    }
  }

  const scopeLabel: Record<string, string> = {
    Platform: "المنصة",
    Tenant: "الشركة",
    Location: "الفرع",
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F7FA] p-5 md:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0E1F33]">إدارة الأدوار</h1>

            <p className="mt-2 text-sm text-gray-500">
              إنشاء وإدارة الأدوار الوظيفية وتحديد نطاق استخدامها
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-[#0E1F33] px-5 py-3 text-sm text-white hover:bg-[#193957]"
          >
            <FiPlus size={18} />
            إنشاء دور جديد
          </button>
        </div>

        {/* Statistics */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="إجمالي الأدوار"
            value={roles.length}
            icon={<FiShield />}
          />

          <StatCard
            title="الأدوار النظامية"
            value={systemRoles}
            icon={<FiCheck />}
          />

          <StatCard
            title="الأدوار المخصصة"
            value={customRoles}
            icon={<FiUsers />}
          />
        </div>

        {/* Roles Table */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
            <div>
              <h2 className="font-bold text-[#0E1F33]">قائمة الأدوار</h2>

              <p className="mt-1 text-xs text-gray-400">
                جميع الأدوار المسجلة في النظام
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن دور..."
                  className="rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-9 pl-3 text-sm outline-none focus:border-[#0E1F33]"
                />
              </div>

              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"
              >
                <option value="all">جميع النطاقات</option>
                <option value="Platform">المنصة</option>
                <option value="Tenant">الشركة</option>
                <option value="Location">الفرع</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">الدور</th>
                  <th className="px-6 py-4 font-medium">النطاق</th>
                  <th className="px-6 py-4 font-medium">المستخدمون</th>
                  <th className="px-6 py-4 font-medium">الصلاحيات</th>
                  <th className="px-6 py-4 font-medium">النوع</th>
                  <th className="px-6 py-4 text-center font-medium">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E9EFF5] text-[#0E1F33]">
                          <FiShield size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {role.name}
                          </p>

                          <p
                            dir="ltr"
                            className="mt-1 text-right text-xs text-gray-400"
                          >
                            {role.code}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-md bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                        {scopeLabel[role.scope]}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {role.users}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {role.permissions}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-3 py-1.5 text-xs ${
                          role.system
                            ? "bg-purple-50 text-purple-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {role.system ? "نظامي" : "مخصص"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          title="تعديل"
                          disabled={role.system}
                          onClick={() => openEditModal(role)}
                          className="text-gray-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <FiEdit2 size={17} />
                        </button>

                        <button
                          title="حذف"
                          disabled={role.system || role.users > 0}
                          onClick={() => deleteRole(role.id)}
                          className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <FiTrash2 size={17} />
                        </button>

                        <button title="المزيد" className="text-gray-400">
                          <FiMoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRoles.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-gray-400"
                    >
                      لا توجد أدوار مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 text-xs text-gray-400">
            عرض {filteredRoles.length} من أصل {roles.length} دور
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-bold text-[#0E1F33]">
                {editingRole ? "تعديل الدور" : "إنشاء دور جديد"}
              </h2>

              <button onClick={() => setShowModal(false)}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm">اسم الدور</label>

                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثلاً: مدير المخزون"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0E1F33]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">رمز الدور</label>

                <input
                  required
                  disabled={!!editingRole}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="inventory_manager"
                  dir="ltr"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none disabled:bg-gray-100 focus:border-[#0E1F33]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">نطاق الدور</label>

                <select
                  value={form.scope}
                  onChange={(e) =>
                    setForm({ ...form, scope: e.target.value as Role["scope"] })
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
                >
                  <option value="Platform">المنصة</option>
                  <option value="Tenant">الشركة</option>
                  <option value="Location">الفرع</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm">الوصف</label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#0E1F33] py-3 text-sm text-white hover:bg-[#193957]"
              >
                {editingRole ? "حفظ التعديلات" : "إنشاء الدور"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold text-[#0E1F33]">{value}</h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
