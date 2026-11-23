"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

import { getUserByUsername } from "@/lib/api/users";
import { getAccounts } from "@/lib/api/accounts";
import { getInventoryMovements } from "@/lib/api/inventoryMovements";
import { getJournals } from "@/lib/api/journals";
import { getActivityLogs } from "@/lib/api/activityLogs";

import {
  FiBookOpen,
  FiFileText,
  FiLayers,
  FiList,
  FiArrowLeft,
  FiPlusCircle,
  FiGitBranch,
  FiClipboard,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiPackage,
  FiUsers,
  FiRefreshCw,
  FiClock,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiAlertCircle,
} from "react-icons/fi";

/* =====================================================
   TYPES
===================================================== */

type ActivityLog = {
  id?: string | number;
  companyId: string | number;
  userName?: string;
  username?: string;
  userRole?: string;
  action: "create" | "update" | "delete";
  module?: string;
  description?: string;
  recordName?: string;
  createdAt?: string;
};

type WarehouseStock = {
  id?: string | number;
  companyId: string | number;
  productId?: string;
  warehouseId?: string;
  quantity?: number | string;
  currentStock?: number | string;
  availableQuantity?: number | string;
  averageCost?: number | string;
  unitCost?: number | string;
  updatedAt?: string;
};

type DashboardData = {
  accounts: any[];
  warehouseStocks: WarehouseStock[];
  inventoryMovements: any[];
  journals: any[];
  activityLogs: ActivityLog[];
};

/* =====================================================
   ACCOUNTING MODULES
===================================================== */

const accountingModules = [
  {
    title: "دليل الحسابات",
    description: "إدارة الحسابات المالية وتصنيفها وتنظيمها ضمن شجرة الحسابات.",
    href: "/erp/accounting/accounts",
    icon: FiBookOpen,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "إضافة حساب",
    description: "إنشاء حساب مالي جديد وتحديد نوعه ورقمه والحساب الأب.",
    href: "/erp/accounting/accounts/create",
    icon: FiPlusCircle,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "شجرة الحسابات",
    description: "عرض الهيكل الهرمي للحسابات الرئيسية والفرعية.",
    href: "/erp/accounting/accounts/tree",
    icon: FiGitBranch,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "القيود اليومية",
    description: "إدارة القيود المحاسبية ومراجعة العمليات المدينة والدائنة.",
    href: "/erp/accounting/journals",
    icon: FiFileText,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "الأرصدة الافتتاحية",
    description: "إدخال الأرصدة الافتتاحية للحسابات عند بدء استخدام النظام.",
    href: "/erp/accounting/opening-entries",
    icon: FiLayers,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "إضافة أرصدة افتتاحية",
    description: "إدخال أرصدة الحسابات المدينة والدائنة.",
    href: "/erp/accounting/opening-entries/create",
    icon: FiPlusCircle,
    color: "bg-teal-50 text-teal-600",
  },
  {
    title: "دفتر الأستاذ العام",
    description: "متابعة حركة كل حساب ومعرفة الرصيد والحركات المالية.",
    href: "/erp/accounting/ledger",
    icon: FiList,
    color: "bg-rose-50 text-rose-600",
  },
];

/* =====================================================
   QUICK ACTIONS
===================================================== */

const quickActions = [
  {
    title: "قيد يومية جديد",
    description: "تسجيل عملية محاسبية جديدة.",
    href: "/erp/accounting/journals",
    icon: FiFileText,
  },
  {
    title: "إضافة حساب",
    description: "إضافة حساب إلى دليل الحسابات.",
    href: "/erp/accounting/accounts/create",
    icon: FiPlusCircle,
  },
  {
    title: "الأرصدة الافتتاحية",
    description: "إعداد أرصدة بداية الفترة.",
    href: "/erp/accounting/opening-entries",
    icon: FiClipboard,
  },
  {
    title: "المخزون",
    description: "متابعة أرصدة وكميات المخزون.",
    href: "/erp/inventory",
    icon: FiPackage,
  },
  {
    title: "حركات المخزون",
    description: "متابعة حركة دخول وخروج الأصناف.",
    href: "/erp/inventory/movements",
    icon: FiActivity,
  },
  {
    title: "نشاط المستخدمين",
    description: "مراجعة عمليات الإضافة والتعديل والحذف.",
    href: "/erp/users/activity",
    icon: FiUsers,
  },
];

/* =====================================================
   HELPERS
===================================================== */

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (date?: string) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("ar-YE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/* =====================================================
   ACTION INFO
===================================================== */

const actionInfo = (action: string) => {
  switch (action) {
    case "create":
      return {
        label: "إضافة",
        icon: FiPlus,
        color: "bg-emerald-50 text-emerald-700",
      };

    case "update":
      return {
        label: "تعديل",
        icon: FiEdit,
        color: "bg-blue-50 text-blue-700",
      };

    case "delete":
      return {
        label: "حذف",
        icon: FiTrash2,
        color: "bg-red-50 text-red-700",
      };

    default:
      return {
        label: action || "عملية",
        icon: FiActivity,
        color: "bg-slate-100 text-slate-600",
      };
  }
};

/* =====================================================
   GET WAREHOUSE STOCKS
===================================================== */

/*
  لا نعتمد هنا على ملف warehouseStocks.ts
  لأن الدالة getWarehouseStocks غير موجودة فيه.

  نجلب أرصدة المستودعات مباشرة من Supabase،
  مع تقييد النتائج بمعرف الشركة.
*/

async function getCompanyWarehouseStocks(
  companyId: string,
): Promise<WarehouseStock[]> {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .select("*")
    .eq("companyId", companyId);

  if (error) {
    throw error;
  }

  return (data || []) as WarehouseStock[];
}

/* =====================================================
   ACCOUNTING PAGE
===================================================== */

export default function AccountingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState<DashboardData>({
    accounts: [],
    warehouseStocks: [],
    inventoryMovements: [],
    journals: [],
    activityLogs: [],
  });

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      /* -----------------------------------------------
         1. GET AUTH USER
      ----------------------------------------------- */

      const authUser = localStorage.getItem("authUser");

      if (!authUser) {
        throw new Error("لم يتم العثور على المستخدم المسجل.");
      }

      let parsedUser: {
        username?: string;
        type?: string;
      };

      try {
        parsedUser = JSON.parse(authUser);
      } catch {
        throw new Error("بيانات المستخدم المسجل غير صالحة.");
      }

      if (!parsedUser.username) {
        throw new Error("بيانات المستخدم غير مكتملة.");
      }

      /* -----------------------------------------------
         2. GET USER FROM DATABASE
      ----------------------------------------------- */

      const dbUser = await getUserByUsername(parsedUser.username);

      if (!dbUser) {
        throw new Error("تعذر العثور على المستخدم في قاعدة البيانات.");
      }

      if (dbUser.type === "platform") {
        throw new Error("لا يمكن لحساب المنصة الدخول إلى محاسبة الشركات.");
      }

      /* -----------------------------------------------
         3. GET COMPANY ID
      ----------------------------------------------- */

      const currentCompanyId = String(dbUser.companyId || "");

      if (!currentCompanyId) {
        throw new Error("المستخدم غير مرتبط بشركة.");
      }

      /* -----------------------------------------------
         4. GET COMPANY DATA
      ----------------------------------------------- */

      const results = await Promise.allSettled([
        getAccounts(currentCompanyId),
        getCompanyWarehouseStocks(currentCompanyId),
        getInventoryMovements(currentCompanyId),
        getJournals(currentCompanyId),
        getActivityLogs(currentCompanyId),
      ]);

      /* -----------------------------------------------
         5. HANDLE RESULTS
      ----------------------------------------------- */

      const getRecords = <T extends { companyId?: string | number }>(
        index: number,
      ): T[] => {
        const result = results[index];

        if (!result || result.status !== "fulfilled") {
          if (result?.status === "rejected") {
            console.error(
              `تعذر تحميل مصدر البيانات رقم ${index + 1}:`,
              result.reason,
            );
          }

          return [];
        }

        const records: unknown = result.value;

        if (!Array.isArray(records)) {
          return [];
        }

        return (records as T[]).filter(
          (record) => String(record.companyId) === currentCompanyId,
        );
      };

      /* -----------------------------------------------
         6. ACTIVITY LOGS
      ----------------------------------------------- */

      const activityLogs = getRecords<ActivityLog>(4);

      const latestActivityLogs = activityLogs
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        })
        .slice(0, 8);

      /* -----------------------------------------------
         7. UPDATE DASHBOARD DATA
      ----------------------------------------------- */

      setData({
        accounts: getRecords(0),
        warehouseStocks: getRecords(1),
        inventoryMovements: getRecords(2),
        journals: getRecords(3),
        activityLogs: latestActivityLogs,
      });
    } catch (err: unknown) {
      console.error("Accounting dashboard error:", err);

      const error = err as {
        message?: string;
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setError(
        error.response?.data?.message ||
          error.message ||
          "حدث خطأ أثناء تحميل بيانات لوحة المحاسبة.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     USE EFFECT
  ===================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =====================================================
     INVENTORY STATISTICS
  ===================================================== */

  // إجمالي كميات المخزون

  const totalInventoryQuantity = data.warehouseStocks.reduce(
    (total, item) =>
      total +
      Number(item.quantity ?? item.currentStock ?? item.availableQuantity ?? 0),
    0,
  );

  // هل توجد تكلفة محفوظة للمخزون؟

  const hasInventoryCost = data.warehouseStocks.some(
    (item) => item.averageCost !== undefined || item.unitCost !== undefined,
  );

  // قيمة المخزون

  const totalInventoryValue = data.warehouseStocks.reduce((total, item) => {
    const quantity = Number(
      item.quantity ?? item.currentStock ?? item.availableQuantity ?? 0,
    );

    const cost = Number(item.averageCost ?? item.unitCost ?? 0);

    return total + quantity * cost;
  }, 0);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div dir="rtl" className="space-y-6 pb-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <FiDollarSign size={16} />

            <span>النظام المالي</span>

            <span>/</span>

            <span className="text-slate-700">المحاسبة</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            الإدارة المحاسبية
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة الحسابات والقيود ومتابعة المخزون والحركات المالية ونشاط
            المستخدمين.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            تحديث البيانات
          </button>

          <Link
            href="/erp/accounting/journals"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <FiPlusCircle size={17} />
            قيد يومية جديد
          </Link>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle size={20} />

          {error}
        </div>
      )}

      {/* =================================================
          WELCOME CARD
      ================================================= */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0E1F33] to-[#193B5C] p-6 text-white shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <FiTrendingUp size={23} />
          </div>

          <h2 className="text-xl font-bold">مرحباً بك في الإدارة المحاسبية</h2>

          <p className="mt-2 text-sm leading-7 text-slate-200">
            من هنا يمكنك إدارة الحسابات المالية، وتسجيل القيود اليومية، ومتابعة
            أرصدة المخزون وحركاته، ومراجعة سجل نشاط المستخدمين لضمان متابعة جميع
            العمليات التي تتم داخل المنشأة.
          </p>
        </div>

        <div className="pointer-events-none absolute -left-8 -top-12 h-56 w-56 rounded-full border-[30px] border-white/5" />

        <div className="pointer-events-none absolute -left-20 -bottom-32 h-64 w-64 rounded-full border-[30px] border-white/5" />
      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-800">ملخص النظام</h2>

          <p className="mt-1 text-xs text-slate-500">
            بيانات فعلية من قاعدة بيانات الشركة.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* ACCOUNTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiBookOpen size={22} />
              </div>

              <span className="text-xs text-slate-400">الحسابات</span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-800">
              {loading ? "..." : formatNumber(data.accounts.length)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              إجمالي الحسابات المسجلة
            </p>

            <Link
              href="/erp/accounting/accounts"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              دليل الحسابات
              <FiArrowLeft size={14} />
            </Link>
          </div>

          {/* INVENTORY QUANTITY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiPackage size={22} />
              </div>

              <span className="text-xs text-slate-400">المخزون</span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-800">
              {loading ? "..." : formatNumber(totalInventoryQuantity)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              إجمالي كميات الأصناف في المستودعات
            </p>

            <Link
              href="/erp/inventory"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800"
            >
              إدارة المخزون
              <FiArrowLeft size={14} />
            </Link>
          </div>

          {/* INVENTORY VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FiDollarSign size={22} />
              </div>

              <span className="text-xs text-slate-400">قيمة المخزون</span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-800">
              {loading
                ? "..."
                : hasInventoryCost
                  ? formatNumber(totalInventoryValue)
                  : "غير متاحة"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {hasInventoryCost
                ? "القيمة حسب تكلفة المخزون المحفوظة"
                : "تتطلب حفظ تكلفة الوحدة أو متوسط التكلفة"}
            </p>

            <Link
              href="/erp/inventory"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
            >
              تفاصيل المخزون
              <FiArrowLeft size={14} />
            </Link>
          </div>

          {/* INVENTORY MOVEMENTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiActivity size={22} />
              </div>

              <span className="text-xs text-slate-400">حركات المخزون</span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-800">
              {loading ? "..." : formatNumber(data.inventoryMovements.length)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              إجمالي حركات المخزون المسجلة
            </p>

            <Link
              href="/erp/inventory/movements"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800"
            >
              مراجعة الحركات
              <FiArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================
          ACCOUNTING MODULES
      ================================================= */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              الوحدات المحاسبية
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              اختر القسم الذي تريد العمل عليه.
            </p>
          </div>

          <FiActivity className="text-slate-400" size={20} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accountingModules.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={21} />
                  </div>

                  <FiArrowLeft
                    size={18}
                    className="text-slate-300 transition group-hover:-translate-x-1 group-hover:text-slate-700"
                  />
                </div>

                <h3 className="mt-4 font-bold text-slate-800 transition group-hover:text-blue-700">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-[42px] text-xs leading-6 text-slate-500">
                  {item.description}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-500 group-hover:text-blue-600">
                    الانتقال إلى القسم
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">الوصول السريع</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {action.description}
                  </p>
                </div>

                <FiArrowLeft className="shrink-0 text-slate-400" size={17} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* =================================================
          USER ACTIVITY
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FiUsers size={19} />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                آخر نشاطات المستخدمين
              </h2>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              متابعة آخر عمليات الإضافة والتعديل والحذف داخل الشركة.
            </p>
          </div>

          <Link
            href="/erp/users/activity"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            عرض جميع النشاطات
            <FiArrowLeft size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            جاري تحميل النشاطات...
          </div>
        ) : data.activityLogs.length === 0 ? (
          <div className="p-10 text-center">
            <FiActivity size={30} className="mx-auto text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-600">
              لا توجد نشاطات مسجلة حتى الآن.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              ستظهر هنا عمليات المستخدمين بعد تسجيلها في سجل النشاطات.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-right">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">المستخدم</th>

                  <th className="px-5 py-3 font-medium">العملية</th>

                  <th className="px-5 py-3 font-medium">القسم</th>

                  <th className="px-5 py-3 font-medium">التفاصيل</th>

                  <th className="px-5 py-3 font-medium">التاريخ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.activityLogs.map((log, index) => {
                  const action = actionInfo(log.action);
                  const ActionIcon = action.icon;

                  return (
                    <tr
                      key={log.id ?? index}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {log.userName || log.username || "مستخدم"}
                        </div>

                        <div className="mt-1 text-[11px] text-slate-400">
                          {log.userRole || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${action.color}`}
                        >
                          <ActionIcon size={13} />

                          {action.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {log.module || "—"}
                      </td>

                      <td className="max-w-[250px] px-5 py-4">
                        <div className="truncate text-sm text-slate-700">
                          {log.description ||
                            log.recordName ||
                            "عملية داخل النظام"}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <FiClock size={13} />

                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =================================================
          ACCOUNTING NOTE
      ================================================= */}

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-blue-600">
            <FiActivity size={19} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">ملاحظة محاسبية</h3>

            <p className="mt-1 text-xs leading-6 text-slate-600">
              تعتمد التقارير المالية على القيود المحاسبية المعتمدة والمرحلة.
              ويجب أن تكون حركات المخزون مرتبطة بالمعالجة المحاسبية المناسبة حتى
              لا تتكرر قيمة المخزون في التقارير المالية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
