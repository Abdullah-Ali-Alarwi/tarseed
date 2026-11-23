"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import {
  FiShield,
  FiUsers,
  FiSave,
  FiRefreshCw,
  FiCheck,
  FiEye,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiCheckCircle,
  FiFileText,
  FiXCircle,
  FiDownload,
  FiLayout,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiTruck,
  FiBarChart2,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* =========================
   Types
========================= */

type Role = {
  value: string;
  label: string;
  description: string;
};

type PermissionGroup = {
  [key: string]: boolean;
};

type RolePermission = {
  pages: PermissionGroup;
  operations: {
    [module: string]: PermissionGroup;
  };
  reports: PermissionGroup;
};

type RolePermissions = {
  [role: string]: RolePermission;
};

type Company = {
  id: string;
  name: string;
  rolePermissions?: RolePermissions;
};

/* =========================
   Roles
========================= */

const roles: Role[] = [
  {
    value: "owner",
    label: "مالك الشركة",
    description: "إدارة الشركة والإشراف على جميع العمليات",
  },
  {
    value: "admin",
    label: "مدير النظام",
    description: "إدارة المستخدمين والإعدادات والعمليات",
  },
  {
    value: "manager",
    label: "مدير",
    description: "متابعة وإدارة عمليات الشركة",
  },
  {
    value: "accountant",
    label: "محاسب",
    description: "إدارة الحسابات والعمليات المالية",
  },
  {
    value: "cashier",
    label: "كاشير",
    description: "تنفيذ عمليات البيع والتحصيل",
  },
  {
    value: "employee",
    label: "موظف",
    description: "صلاحيات محدودة حسب طبيعة العمل",
  },
];

/* =========================
   Page Permissions
========================= */

const pages = [
  { key: "dashboard", label: "لوحة التحكم", icon: FiLayout },
  { key: "users", label: "المستخدمون", icon: FiUsers },
  { key: "products", label: "المنتجات", icon: FiPackage },
  { key: "inventory", label: "المخزون", icon: FiPackage },
  { key: "sales", label: "المبيعات", icon: FiShoppingCart },
  { key: "purchases", label: "المشتريات", icon: FiShoppingCart },
  { key: "customers", label: "العملاء", icon: FiUsers },
  { key: "suppliers", label: "الموردون", icon: FiTruck },
  { key: "accounting", label: "المحاسبة", icon: FiDollarSign },
  { key: "reports", label: "التقارير", icon: FiBarChart2 },
  { key: "settings", label: "الإعدادات", icon: FiSettings },
];

/* =========================
   Operations
========================= */

const actions = [
  { key: "read", label: "قراءة", icon: FiEye },
  { key: "create", label: "إنشاء", icon: FiPlus },
  { key: "update", label: "تعديل", icon: FiEdit },
  { key: "delete", label: "حذف", icon: FiTrash2 },
  { key: "approve", label: "موافقة", icon: FiCheckCircle },
  { key: "print", label: "طباعة", icon: FiPrinter },
  { key: "post", label: "ترحيل", icon: FiFileText },
  { key: "cancel", label: "إلغاء", icon: FiXCircle },
  { key: "export", label: "تصدير", icon: FiDownload },
];

const operationModules = [
  { key: "users", label: "المستخدمون" },
  { key: "products", label: "المنتجات" },
  { key: "inventory", label: "المخزون" },
  { key: "sales", label: "المبيعات" },
  { key: "purchases", label: "المشتريات" },
  { key: "customers", label: "العملاء" },
  { key: "suppliers", label: "الموردون" },
  { key: "accounting", label: "المحاسبة" },
];

/* =========================
   Reports
========================= */

const reports = [
  { key: "salesReport", label: "تقرير المبيعات" },
  { key: "purchasesReport", label: "تقرير المشتريات" },
  { key: "inventoryReport", label: "تقرير المخزون" },
  { key: "productsReport", label: "تقرير المنتجات" },
  { key: "customersReport", label: "تقرير العملاء" },
  { key: "suppliersReport", label: "تقرير الموردين" },
  { key: "incomeStatement", label: "قائمة الدخل" },
  { key: "balanceSheet", label: "الميزانية العمومية" },
  { key: "cashFlow", label: "التدفقات النقدية" },
  { key: "trialBalance", label: "ميزان المراجعة" },
  { key: "accountStatement", label: "كشف الحساب" },
];

/* =========================
   Default Permissions
========================= */

function createEmptyGroup(keys: string[]) {
  const result: PermissionGroup = {};

  keys.forEach((key) => {
    result[key] = false;
  });

  return result;
}

function createDefaultPermissions(): RolePermissions {
  const result: RolePermissions = {};

  roles.forEach((role) => {
    const rolePermission: RolePermission = {
      pages: createEmptyGroup(pages.map((page) => page.key)),

      operations: {},

      reports: createEmptyGroup(reports.map((report) => report.key)),
    };

    operationModules.forEach((module) => {
      rolePermission.operations[module.key] = createEmptyGroup(
        actions.map((action) => action.key),
      );
    });

    // صلاحيات افتراضية لمالك الشركة ومدير النظام
    if (role.value === "owner" || role.value === "admin") {
      Object.keys(rolePermission.pages).forEach((key) => {
        rolePermission.pages[key] = true;
      });

      Object.keys(rolePermission.reports).forEach((key) => {
        rolePermission.reports[key] = true;
      });

      operationModules.forEach((module) => {
        actions.forEach((action) => {
          rolePermission.operations[module.key][action.key] = true;
        });
      });
    }

    // المدير
    if (role.value === "manager") {
      pages.forEach((page) => {
        rolePermission.pages[page.key] = page.key !== "settings";
      });

      operationModules.forEach((module) => {
        actions.forEach((action) => {
          rolePermission.operations[module.key][action.key] = [
            "read",
            "create",
            "update",
            "approve",
            "print",
            "export",
          ].includes(action.key);
        });
      });

      reports.forEach((report) => {
        rolePermission.reports[report.key] = true;
      });
    }

    // المحاسب
    if (role.value === "accountant") {
      [
        "dashboard",
        "sales",
        "purchases",
        "customers",
        "suppliers",
        "accounting",
        "reports",
      ].forEach((key) => {
        rolePermission.pages[key] = true;
      });

      ["sales", "purchases", "customers", "suppliers", "accounting"].forEach(
        (moduleKey) => {
          ["read", "create", "update", "print", "post", "export"].forEach(
            (actionKey) => {
              rolePermission.operations[moduleKey][actionKey] = true;
            },
          );
        },
      );

      reports.forEach((report) => {
        rolePermission.reports[report.key] = true;
      });
    }

    // الكاشير
    if (role.value === "cashier") {
      ["dashboard", "products", "sales", "customers"].forEach((key) => {
        rolePermission.pages[key] = true;
      });

      ["read", "create", "print"].forEach((actionKey) => {
        rolePermission.operations.sales[actionKey] = true;
      });

      rolePermission.operations.products.read = true;
      rolePermission.operations.customers.read = true;
      rolePermission.operations.customers.create = true;
    }

    // الموظف
    if (role.value === "employee") {
      ["dashboard", "products"].forEach((key) => {
        rolePermission.pages[key] = true;
      });

      rolePermission.operations.products.read = true;
    }

    result[role.value] = rolePermission;
  });

  return result;
}

/* =========================
   Normalize Saved Data
========================= */

function normalizePermissions(saved?: RolePermissions): RolePermissions {
  const defaults = createDefaultPermissions();

  if (!saved) return defaults;

  roles.forEach((role) => {
    const savedRole = saved[role.value];

    if (!savedRole) return;

    defaults[role.value].pages = {
      ...defaults[role.value].pages,
      ...(savedRole.pages || {}),
    };

    defaults[role.value].reports = {
      ...defaults[role.value].reports,
      ...(savedRole.reports || {}),
    };

    operationModules.forEach((module) => {
      defaults[role.value].operations[module.key] = {
        ...defaults[role.value].operations[module.key],
        ...(savedRole.operations?.[module.key] || {}),
      };
    });
  });

  return defaults;
}

/* =========================
   Page Component
========================= */

export default function RolesPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState("");

  const [selectedRole, setSelectedRole] = useState("accountant");

  const [permissions, setPermissions] = useState<RolePermissions>(
    createDefaultPermissions(),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeSection, setActiveSection] = useState("pages");

  /* =========================
     Load Company
  ========================= */

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      const user = JSON.parse(storedUser);

      const id = String(user.companyId || user.company?.id || "");

      if (!id) {
        toast.error("لم يتم العثور على الشركة الحالية");
        return;
      }

      setCompanyId(id);

      const response = await axios.get(`${API_URL}/companies/${id}`);

      setCompany(response.data);

      setPermissions(normalizePermissions(response.data.rolePermissions));
    } catch (error) {
      console.error(error);
      toast.error("تعذر تحميل بيانات الأدوار");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =========================
     Update Permission
  ========================= */

  const updatePermission = (
    section: "pages" | "operations" | "reports",
    itemKey: string,
    actionKey?: string,
  ) => {
    setPermissions((prev) => {
      const updated = structuredClone(prev);
      const role = updated[selectedRole];

      if (section === "pages") {
        role.pages[itemKey] = !role.pages[itemKey];
      }

      if (section === "reports") {
        role.reports[itemKey] = !role.reports[itemKey];
      }

      if (section === "operations" && actionKey) {
        const current = role.operations[itemKey][actionKey];

        role.operations[itemKey][actionKey] = !current;
      }

      return updated;
    });
  };

  /* =========================
     Toggle All
  ========================= */

  const toggleAllPages = (enabled: boolean) => {
    setPermissions((prev) => {
      const updated = structuredClone(prev);

      pages.forEach((page) => {
        updated[selectedRole].pages[page.key] = enabled;
      });

      return updated;
    });
  };

  const toggleAllReports = (enabled: boolean) => {
    setPermissions((prev) => {
      const updated = structuredClone(prev);

      reports.forEach((report) => {
        updated[selectedRole].reports[report.key] = enabled;
      });

      return updated;
    });
  };

  const toggleAllOperations = (enabled: boolean) => {
    setPermissions((prev) => {
      const updated = structuredClone(prev);

      operationModules.forEach((module) => {
        actions.forEach((action) => {
          updated[selectedRole].operations[module.key][action.key] = enabled;
        });
      });

      return updated;
    });
  };

  /* =========================
     Save
  ========================= */

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

      toast.success("تم حفظ الأدوار والصلاحيات بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Loading
  ========================= */

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#0E1F33]" />
      </div>
    );
  }

  if (!companyId || !company) {
    return (
      <div
        dir="rtl"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="font-bold text-red-700">
          لم يتم العثور على بيانات الشركة
        </p>
      </div>
    );
  }

  const currentRole = roles.find((role) => role.value === selectedRole);

  /* =========================
     Render
  ========================= */

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 text-sm text-slate-500">
            المستخدمون / الأدوار الوظيفية
          </div>

          <h1 className="text-2xl font-bold text-[#0E1F33]">
            إدارة الأدوار الوظيفية
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إنشاء وإدارة صلاحيات الأدوار داخل الشركة
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
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
          <p className="text-xs text-slate-500">الشركة الحالية</p>

          <p className="font-bold text-[#0E1F33]">{company.name}</p>
        </div>
      </div>

      {/* Roles */}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-bold text-[#0E1F33]">المجموعات الوظيفية</h2>

          <p className="mt-1 text-xs text-slate-500">
            اختر المجموعة التي تريد إدارة صلاحياتها.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`rounded-xl border p-4 text-right transition ${
                selectedRole === role.value
                  ? "border-[#0E1F33] bg-[#0E1F33] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FiUsers size={20} className="mb-3" />

              <p className="text-sm font-bold">{role.label}</p>

              <p
                className={`mt-2 text-[11px] leading-5 ${
                  selectedRole === role.value
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                {role.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Role */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="font-bold text-[#0E1F33]">
            صلاحيات {currentRole?.label}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            حدد الصفحات والعمليات والتقارير المسموح بها.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#0E1F33] px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <FiSave />
          {saving ? "جاري الحفظ..." : "حفظ الصلاحيات"}
        </button>
      </div>

      {/* Section Navigation */}

      <div className="flex flex-wrap gap-2">
        {[
          { key: "pages", label: "صلاحيات الصفحات" },
          { key: "operations", label: "صلاحيات العمليات" },
          { key: "reports", label: "صلاحيات التقارير" },
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
              activeSection === section.key
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Pages Permissions */}

      {activeSection === "pages" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h3 className="font-bold text-[#0E1F33]">
                صلاحيات الوصول إلى الصفحات
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                تحديد الصفحات التي يمكن لهذا الدور الوصول إليها.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleAllPages(true)}
                className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"
              >
                تحديد الكل
              </button>

              <button
                onClick={() => toggleAllPages(false)}
                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                إلغاء الكل
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const Icon = page.icon;
              const checked = permissions[selectedRole].pages[page.key];

              return (
                <button
                  key={page.key}
                  onClick={() => updatePermission("pages", page.key)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-right transition ${
                    checked
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon size={18} />
                    </div>

                    <span className="text-sm font-semibold text-slate-700">
                      {page.label}
                    </span>
                  </div>

                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      checked
                        ? "bg-green-600 text-white"
                        : "border border-slate-300 text-transparent"
                    }`}
                  >
                    <FiCheck size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Operations Permissions */}

      {activeSection === "operations" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-[#0E1F33]">صلاحيات العمليات</h3>

            <p className="mt-1 text-xs text-slate-500">
              التحكم في العمليات المتاحة لكل قسم.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => toggleAllOperations(true)}
                className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"
              >
                تفعيل جميع العمليات
              </button>

              <button
                onClick={() => toggleAllOperations(false)}
                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                إلغاء جميع العمليات
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-5 py-4">القسم</th>

                  {actions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <th key={action.key} className="px-3 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Icon size={14} />
                          {action.label}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {operationModules.map((module) => (
                  <tr key={module.key} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {module.label}
                    </td>

                    {actions.map((action) => {
                      const checked =
                        permissions[selectedRole].operations[module.key][
                          action.key
                        ];

                      return (
                        <td key={action.key} className="px-3 py-4 text-center">
                          <button
                            onClick={() =>
                              updatePermission(
                                "operations",
                                module.key,
                                action.key,
                              )
                            }
                            className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                              checked
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                            }`}
                          >
                            <FiCheck size={15} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Permissions */}

      {activeSection === "reports" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h3 className="font-bold text-[#0E1F33]">صلاحيات التقارير</h3>

              <p className="mt-1 text-xs text-slate-500">
                تحديد التقارير التي يمكن للمستخدم الاطلاع عليها.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleAllReports(true)}
                className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"
              >
                تحديد الكل
              </button>

              <button
                onClick={() => toggleAllReports(false)}
                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                إلغاء الكل
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const checked = permissions[selectedRole].reports[report.key];

              return (
                <button
                  key={report.key}
                  onClick={() => updatePermission("reports", report.key)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-right transition ${
                    checked
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {report.label}
                  </span>

                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      checked
                        ? "bg-green-600 text-white"
                        : "border border-slate-300 text-transparent"
                    }`}
                  >
                    <FiCheck size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Save */}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <p className="text-sm font-bold text-[#0E1F33]">
            حفظ إعدادات {currentRole?.label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            احفظ التغييرات حتى يتم تطبيقها على إعدادات الشركة.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#0E1F33] px-7 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <FiSave size={17} />
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
}
