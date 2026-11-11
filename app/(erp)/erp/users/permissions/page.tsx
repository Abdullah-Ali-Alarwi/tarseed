"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FiShield,
  FiPrinter,
  FiPlus,
  FiTrash2,
  FiBarChart2,
  FiEdit3,
  FiSave,
  FiCheckCircle,
  FiFileText,
} from "react-icons/fi";

const API = "http://localhost:3001/roles";

const permissionList = [
  { key: "print_sales", label: "طباعة", icon: FiPrinter },
  { key: "create_sales", label: "إضافة", icon: FiPlus },
  { key: "delete_sales", label: "حذف", icon: FiTrash2 },
  { key: "view_reports", label: "تقارير", icon: FiBarChart2 },
  { key: "update_sales", label: "تعديل", icon: FiEdit3 },
];

const groups = [
  { name: "Owner", title: "مالك الشركة", color: "blue" },
  { name: "Accountant", title: "محاسب", color: "emerald" },
  { name: "Cashier", title: "كاشير", color: "orange" },
];

interface Role {
  id?: number;
  name: string;
  title: string;
  description: string;
  users: number;
  permissions: string[];
}

export default function Page() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(API)
      .then((res) => {
        setRoles(
          groups.map((group) => {
            const role = res.data.find(
              (r: Role) => r.name.toLowerCase() === group.name.toLowerCase(),
            );

            return (
              role || {
                name: group.name,
                title: group.title,
                description: "",
                users: 0,
                permissions: [],
              }
            );
          }),
        );
      })
      .catch(() => toast.error("فشل تحميل الصلاحيات"))
      .finally(() => setLoading(false));
  }, []);

  const togglePermission = (roleName: string, key: string) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.name === roleName
          ? {
              ...role,
              permissions: role.permissions.includes(key)
                ? role.permissions.filter((p) => p !== key)
                : [...role.permissions, key],
            }
          : role,
      ),
    );
  };

  const savePermissions = async () => {
    setSaving(true);

    try {
      await Promise.all(
        roles.map((role) => {
          const data = { ...role };

          return role.id
            ? axios.put(`${API}/${role.id}`, data)
            : axios.post(API, data);
        }),
      );

      toast.success("تم حفظ الصلاحيات بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-64 items-center justify-center text-slate-500">
        جاري تحميل الصلاحيات...
      </div>
    );

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-5 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <FiShield size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                إدارة الصلاحيات
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                التحكم في صلاحيات المجموعات الوظيفية
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm text-slate-600">
          <FiFileText className="text-blue-600" />
          {roles.length} مجموعات وظيفية
        </div>
      </div>

      {/* Info */}
      <div className="mb-7 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <FiShield className="mt-1 shrink-0 text-blue-600" size={20} />

        <div>
          <h3 className="text-sm font-bold text-blue-900">
            إدارة صلاحيات الفواتير
          </h3>
          <p className="mt-1 text-xs leading-6 text-blue-700">
            حدد العمليات المسموح بها لكل مجموعة وظيفية من خلال تفعيل أو إلغاء
            مربعات الاختيار.
          </p>
        </div>
      </div>

      {/* Roles */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {roles.map((role) => {
          const selected = role.permissions.length;

          return (
            <section
              key={role.name}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {/* Card Header */}
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                      <FiShield size={22} />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-800">{role.title}</h2>

                      <p className="mt-1 text-xs text-slate-400">
                        المجموعة الوظيفية
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    {selected} / {permissionList.length}
                  </span>
                </div>
              </div>

              {/* Invoice */}
              <div className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FiFileText className="text-blue-600" size={19} />
                  <h3 className="font-bold text-slate-700">الفاتورة</h3>
                </div>

                <div className="space-y-2">
                  {permissionList.map((permission) => {
                    const Icon = permission.icon;
                    const checked = role.permissions.includes(permission.key);

                    return (
                      <label
                        key={permission.key}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                          checked
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-100 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              checked
                                ? "bg-blue-100 text-blue-700"
                                : "bg-white text-slate-400"
                            }`}
                          >
                            <Icon size={17} />
                          </div>

                          <span
                            className={`text-sm font-medium ${
                              checked ? "text-blue-900" : "text-slate-600"
                            }`}
                          >
                            {permission.label}
                          </span>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            togglePermission(role.name, permission.key)
                          }
                          className="h-5 w-5 cursor-pointer accent-blue-600"
                        />
                      </label>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">
                    الصلاحيات المفعلة
                  </span>

                  <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                    <FiCheckCircle />
                    {selected} صلاحيات
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Save */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={savePermissions}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#203850] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSave size={18} />
          {saving ? "جاري الحفظ..." : "حفظ الصلاحيات"}
        </button>
      </div>
    </main>
  );
}
