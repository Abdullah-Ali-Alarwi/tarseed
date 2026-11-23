"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import {
  FiShield,
  FiSave,
  FiRefreshCw,
  FiCheck,
  FiEye,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiTruck,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  rolePermissions?: RolePermissions;
};

const roles = [
  { value: "accountant", label: "محاسب" },
  { value: "cashier", label: "كاشير" },
  { value: "manager", label: "مدير" },
  { value: "employee", label: "موظف" },
];

const modules = [
  {
    key: "dashboard",
    label: "لوحة التحكم",
    icon: FiBarChart2,
    actions: ["view"],
  },
  {
    key: "users",
    label: "المستخدمون",
    icon: FiUsers,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "products",
    label: "المنتجات",
    icon: FiPackage,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "inventory",
    label: "المخزون",
    icon: FiPackage,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "sales",
    label: "المبيعات",
    icon: FiShoppingCart,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "purchases",
    label: "المشتريات",
    icon: FiShoppingCart,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "customers",
    label: "العملاء",
    icon: FiUsers,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "suppliers",
    label: "الموردون",
    icon: FiTruck,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "accounting",
    label: "المحاسبة",
    icon: FiDollarSign,
    actions: ["view", "create", "update", "delete"],
  },
  {
    key: "reports",
    label: "التقارير",
    icon: FiBarChart2,
    actions: ["view"],
  },
  {
    key: "settings",
    label: "الإعدادات",
    icon: FiSettings,
    actions: ["view", "update"],
  },
];

const actionLabels: Record<string, string> = {
  view: "عرض",
  create: "إضافة",
  update: "تعديل",
  delete: "حذف",
};

function createDefaultPermissions(): RolePermissions {
  const result: RolePermissions = {};

  roles.forEach((role) => {
    result[role.value] = {};

    modules.forEach((module) => {
      const permission: Permission = {
        view: false,
        create: false,
        update: false,
        delete: false,
      };

      // صلاحيات افتراضية للمحاسب
      if (role.value === "accountant") {
        permission.view = true;

        if (
          [
            "sales",
            "purchases",
            "accounting",
            "customers",
            "suppliers",
          ].includes(module.key)
        ) {
          permission.create = true;
          permission.update = true;
        }

        if (module.key === "reports") {
          permission.view = true;
        }
      }

      // صلاحيات افتراضية للكاشير
      if (role.value === "cashier") {
        permission.view = [
          "dashboard",
          "products",
          "inventory",
          "sales",
          "customers",
        ].includes(module.key);

        if (module.key === "sales") {
          permission.create = true;
        }
      }

      // صلاحيات افتراضية للمدير
      if (role.value === "manager") {
        permission.view = true;
        permission.create = true;
        permission.update = true;

        if (module.key !== "reports") {
          permission.delete = true;
        }
      }

      // صلاحيات افتراضية للموظف
      if (role.value === "employee") {
        permission.view = ["dashboard", "products", "inventory"].includes(
          module.key,
        );
      }

      result[role.value][module.key] = permission;
    });
  });

  return result;
}

function normalizePermissions(saved?: RolePermissions): RolePermissions {
  const defaults = createDefaultPermissions();

  if (!saved) return defaults;

  roles.forEach((role) => {
    modules.forEach((module) => {
      const oldPermission = saved[role.value]?.[module.key];

      if (oldPermission) {
        defaults[role.value][module.key] = {
          ...defaults[role.value][module.key],
          ...oldPermission,
        };
      }
    });
  });

  return defaults;
}

export default function PermissionsPage() {
  const [company, setCompany] = useState<Company | null>(null);

  const [companyId, setCompanyId] = useState("");
  const [selectedRole, setSelectedRole] = useState("accountant");

  const [permissions, setPermissions] = useState<RolePermissions>(
    createDefaultPermissions(),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      const user = JSON.parse(storedUser);

      const id = String(user.companyId || user.company?.id || "");

      if (!id) {
        toast.error("لم يتم تحديد الشركة الحالية");
        return;
      }

      setCompanyId(id);

      const response = await axios.get(`${API_URL}/companies/${id}`);

      const companyData: Company = response.data;

      setCompany(companyData);

      setPermissions(normalizePermissions(companyData.rolePermissions));
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل إعدادات الصلاحيات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // تغيير صلاحية واحدة
  const togglePermission = (moduleKey: string, action: string) => {
    setPermissions((prev) => {
      const updated = structuredClone(prev);

      const current = updated[selectedRole][moduleKey];

      current[action as keyof Permission] =
        !current[action as keyof Permission];

      // لا يمكن منح إضافة أو تعديل أو حذف دون عرض
      if (action === "view" && !current.view) {
        current.create = false;
        current.update = false;
        current.delete = false;
      }

      // منح العمليات يتطلب منح العرض
      if (action !== "view" && current[action as keyof Permission]) {
        current.view = true;
      }

      return updated;
    });
  };

  // تحديد كل صلاحيات القسم
  const toggleAllModule = (moduleKey: string) => {
    const module = modules.find((item) => item.key === moduleKey);

    if (!module) return;

    setPermissions((prev) => {
      const updated = structuredClone(prev);

      const current = updated[selectedRole][moduleKey];

      const allEnabled = module.actions.every(
        (action) => current[action as keyof Permission],
      );

      module.actions.forEach((action) => {
        current[action as keyof Permission] = !allEnabled;
      });

      return updated;
    });
  };

  // تحديد جميع صلاحيات الدور
  const toggleAllPermissions = (enabled: boolean) => {
    setPermissions((prev) => {
      const updated = structuredClone(prev);

      modules.forEach((module) => {
        module.actions.forEach((action) => {
          updated[selectedRole][module.key][action as keyof Permission] =
            enabled;
        });
      });

      return updated;
    });
  };

  // حفظ الصلاحيات داخل سجل الشركة
  const handleSave = async () => {
    if (!companyId || !company) {
      toast.error("بيانات الشركة غير مكتملة");
      return;
    }

    setSaving(true);

    try {
      await axios.patch(`${API_URL}/companies/${companyId}`, {
        rolePermissions: permissions,
      });

      toast.success("تم حفظ الصلاحيات بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  const selectedRoleLabel = roles.find(
    (role) => role.value === selectedRole,
  )?.label;

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#0E1F33]" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6 pb-10 ">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 text-sm text-slate-500">
            المستخدمون / الصلاحيات
          </div>

          <h1 className="text-2xl font-bold text-[#0E1F33]">إدارة الصلاحيات</h1>

          <p className="mt-1 text-sm text-slate-500">
            التحكم في صلاحيات المستخدمين حسب أدوارهم الوظيفية
          </p>
        </div>

        <button
          onClick={fetchPermissions}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <FiRefreshCw />
          تحديث
        </button>
      </div>

      {/* Company */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <FiShield size={22} />
        </div>

        <div>
          <p className="text-xs text-slate-500">إعدادات صلاحيات الشركة</p>

          <p className="font-bold text-[#0E1F33]">
            {company?.name || "الشركة الحالية"}
          </p>
        </div>
      </div>

      {/* Role selection */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-bold text-[#0E1F33]">اختر الدور الوظيفي</h2>

          <p className="mt-1 text-xs text-slate-500">
            الصلاحيات التي تعدلها ستطبق على جميع المستخدمين الذين يحملون هذا
            الدور.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`rounded-xl border p-4 text-center transition ${
                selectedRole === role.value
                  ? "border-[#0E1F33] bg-[#0E1F33] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FiUsers className="mx-auto mb-2" size={20} />

              <span className="text-sm font-bold">{role.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Permission controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h3 className="font-bold text-[#0E1F33]">
            صلاحيات: {selectedRoleLabel}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            حدد العمليات المسموح بها لهذا الدور
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => toggleAllPermissions(true)}
            className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
          >
            تحديد الكل
          </button>

          <button
            onClick={() => toggleAllPermissions(false)}
            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            إلغاء الكل
          </button>
        </div>
      </div>

      {/* Permissions table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-right">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-5 py-4 font-bold">القسم</th>

                {[
                  ["view", FiEye],
                  ["create", FiPlus],
                  ["update", FiEdit],
                  ["delete", FiTrash2],
                ].map(([action, Icon]) => {
                  const ActionIcon = Icon as typeof FiEye;

                  return (
                    <th
                      key={action as string}
                      className="px-4 py-4 text-center font-bold"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ActionIcon size={15} />
                        {actionLabels[action as string]}
                      </div>
                    </th>
                  );
                })}

                <th className="px-4 py-4 text-center font-bold">الكل</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {modules.map((module) => {
                const Icon = module.icon;

                const permission = permissions[selectedRole]?.[module.key];

                const allEnabled = module.actions.every(
                  (action) => permission?.[action as keyof Permission],
                );

                return (
                  <tr key={module.key} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon size={17} />
                        </div>

                        <span className="text-sm font-semibold text-slate-700">
                          {module.label}
                        </span>
                      </div>
                    </td>

                    {["view", "create", "update", "delete"].map((action) => {
                      const available = module.actions.includes(action);

                      const checked =
                        permission?.[action as keyof Permission] || false;

                      return (
                        <td key={action} className="px-4 py-4 text-center">
                          {available ? (
                            <button
                              type="button"
                              onClick={() =>
                                togglePermission(module.key, action)
                              }
                              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                checked
                                  ? "border-green-600 bg-green-600 text-white"
                                  : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                              }`}
                            >
                              <FiCheck size={16} />
                            </button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAllModule(module.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          allEnabled
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {allEnabled ? "مفعل" : "تحديد"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <p className="text-sm font-bold text-[#0E1F33]">
            حفظ إعدادات الصلاحيات
          </p>

          <p className="mt-1 text-xs text-slate-500">
            سيتم حفظ الإعدادات ضمن بيانات الشركة الحالية.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#0E1F33] px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          <FiSave size={17} />

          {saving ? "جاري الحفظ..." : "حفظ الصلاحيات"}
        </button>
      </div>
    </div>
  );
}
