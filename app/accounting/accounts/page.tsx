"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useERPStore } from "@/Store/erpStore";
import type { AccountType as StoreAccountType } from "@/Store/erpStore";

import {
  FiArrowRight,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiChevronDown,
  FiChevronLeft,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";

type AccountType = StoreAccountType;

type AccountNature = "debit" | "credit";

interface AccountForm {
  name: string;
  code: string;
  type: AccountType;
  nature: AccountNature;
  parentId: string;
  description: string;
  isGroup: boolean;
}

const typeLabels: Record<AccountType, string> = {
  asset: "الأصول",
  liability: "الالتزامات",
  equity: "حقوق الملكية",
  revenue: "الإيرادات",
  cogs: "تكلفة المبيعات",
  expense: "المصروفات",
};

const typeColors: Record<AccountType, string> = {
  asset: "bg-blue-50 text-blue-700 border-blue-200",
  liability: "bg-red-50 text-red-700 border-red-200",
  equity: "bg-purple-50 text-purple-700 border-purple-200",
  revenue: "bg-green-50 text-green-700 border-green-200",
  cogs: "bg-yellow-50 text-yellow-700 border-yellow-200",
  expense: "bg-orange-50 text-orange-700 border-orange-200",
};

const natureLabels: Record<AccountNature, string> = {
  debit: "مدين",
  credit: "دائن",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function createEmptyForm(): AccountForm {
  return {
    name: "",
    code: "",
    type: "asset",
    nature: "debit",
    parentId: "",
    description: "",
    isGroup: false,
  };
}

export default function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useERPStore();

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<"all" | AccountType>("all");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<AccountForm>(createEmptyForm());

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /* =========================================================
     الحسابات الرئيسية
  ========================================================= */

  const rootAccounts = useMemo(() => {
    return accounts
      .filter((account) => !account.parentId && !account.parentCode)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts]);

  /* =========================================================
     البحث والتصفية
  ========================================================= */

  const filteredAccounts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesSearch =
        !value ||
        account.code.toLowerCase().includes(value) ||
        account.name.toLowerCase().includes(value) ||
        (account.description || "").toLowerCase().includes(value);

      const matchesType = typeFilter === "all" || account.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && account.isActive !== false) ||
        (statusFilter === "inactive" && account.isActive === false);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, search, typeFilter, statusFilter]);

  const isSearching =
    search.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  /* =========================================================
     الإحصائيات
  ========================================================= */

  const statistics = useMemo(() => {
    const active = accounts.filter(
      (account) => account.isActive !== false,
    ).length;

    const inactive = accounts.filter(
      (account) => account.isActive === false,
    ).length;

    const groups = accounts.filter((account) => account.isGroup).length;

    const details = accounts.filter((account) => !account.isGroup).length;

    return {
      total: accounts.length,
      active,
      inactive,
      groups,
      details,
    };
  }, [accounts]);

  /* =========================================================
     أبناء الحساب
  ========================================================= */

  const getChildren = (accountId: string, accountCode: string) => {
    return accounts
      .filter(
        (account) =>
          account.parentId === accountId || account.parentCode === accountCode,
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  };

  /* =========================================================
     فتح وإغلاق الفروع
  ========================================================= */

  const toggleExpanded = (accountId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [accountId]: !(prev[accountId] ?? true),
    }));
  };

  /* =========================================================
     إضافة حساب
  ========================================================= */

  const handleAdd = (parentId = "") => {
    const parent = parentId
      ? accounts.find((account) => account.id === parentId)
      : undefined;

    setEditingId(null);

    setForm({
      ...createEmptyForm(),
      parentId: parentId || "",
      type: parent?.type || "asset",
      nature:
        parent?.nature ||
        parent?.type === "liability" ||
        parent?.type === "equity" ||
        parent?.type === "revenue"
          ? "credit"
          : "debit",
      isGroup: false,
    });

    setShowModal(true);
  };

  /* =========================================================
     تعديل حساب
  ========================================================= */

  const handleEdit = (account: (typeof accounts)[number]) => {
    setEditingId(account.id);

    setForm({
      name: account.name,
      code: account.code,
      type: account.type,
      nature: account.nature as AccountNature,
      parentId: account.parentId || "",
      description: account.description || "",
      isGroup: Boolean(account.isGroup),
    });

    setShowModal(true);
  };

  /* =========================================================
     حذف حساب
  ========================================================= */

  const handleDelete = (account: (typeof accounts)[number]) => {
    const hasChildren = accounts.some(
      (item) =>
        item.parentId === account.id || item.parentCode === account.code,
    );

    if (hasChildren) {
      toast.error("لا يمكن حذف الحساب لأنه يحتوي على حسابات فرعية");
      return;
    }

    if (account.isSystem) {
      toast.error("لا يمكن حذف حساب أساسي من حسابات النظام");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الحساب "${account.name}"؟`,
    );

    if (!confirmed) return;

    try {
      deleteAccount(account.id);
      toast.success("تم حذف الحساب بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حذف الحساب");
    }
  };

  /* =========================================================
     تغيير نوع الحساب
  ========================================================= */

  const handleTypeChange = (type: AccountType) => {
    let nature: AccountNature = "debit";

    if (type === "liability" || type === "equity" || type === "revenue") {
      nature = "credit";
    }

    setForm((prev) => ({
      ...prev,
      type,
      nature,
    }));
  };

  /* =========================================================
     حفظ الحساب
  ========================================================= */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const code = form.code.trim();

    if (!name) {
      toast.error("يرجى إدخال اسم الحساب");
      return;
    }

    if (!code) {
      toast.error("يرجى إدخال رمز الحساب");
      return;
    }

    const duplicateCode = accounts.find(
      (account) => account.code === code && account.id !== editingId,
    );

    if (duplicateCode) {
      toast.error("رمز الحساب مستخدم مسبقاً");
      return;
    }

    if (editingId && form.parentId === editingId) {
      toast.error("لا يمكن جعل الحساب أباً لنفسه");
      return;
    }
    try {
      if (editingId) {
        // UpdateAccountInput يدعم فقط:
        // name / description / isActive
        updateAccount(editingId, {
          name,
          description: form.description.trim() || undefined,
        });

        toast.success("تم تعديل الحساب بنجاح");
      } else {
        // AddAccountInput يدعم:
        // code / name / type / nature / parentId / isGroup / description
        addAccount({
          code,
          name,
          type: form.type,
          nature: form.nature,
          parentId: form.parentId || undefined,
          isGroup: form.isGroup,
          description: form.description.trim() || undefined,
        });

        toast.success("تم إضافة الحساب بنجاح");
      }

      setShowModal(false);
      setEditingId(null);
      setForm(createEmptyForm());
    } catch {
      toast.error("حدث خطأ أثناء حفظ الحساب");
    }
  };

  /* =========================================================
     إعادة التصفية
  ========================================================= */

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  /* =========================================================
     عرض الحساب
  ========================================================= */

  const renderAccount = (
    account: (typeof accounts)[number],
    level = 0,
  ): React.ReactNode => {
    const children = getChildren(account.id, account.code);

    const hasChildren = children.length > 0;

    const isExpanded = expanded[account.id] !== false;

    const visible = isSearching
      ? filteredAccounts.some((item) => item.id === account.id)
      : true;

    if (!visible) {
      const visibleChild = children.some((child) =>
        filteredAccounts.some((item) => item.id === child.id),
      );

      if (!visibleChild) return null;
    }

    return (
      <div key={account.id}>
        <div
          className={`group flex min-h-[58px] items-center border-b border-gray-100 bg-white transition hover:bg-gray-50 ${
            account.isActive === false ? "opacity-60" : ""
          }`}
        >
          {/* الحساب */}

          <div className="flex min-w-0 flex-1 items-center px-2.5 py-2 sm:px-3">
            <div
              style={{
                marginRight: `${level * 20}px`,
              }}
              className="flex min-w-0 items-center gap-1.5 sm:gap-2"
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(account.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                >
                  {isExpanded ? (
                    <FiChevronDown size={14} />
                  ) : (
                    <FiChevronLeft size={14} />
                  )}
                </button>
              ) : (
                <span className="w-6 shrink-0" />
              )}

              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  account.isGroup
                    ? "bg-slate-100 text-slate-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {account.isGroup ? (
                  <span className="text-xs font-bold">
                    {level === 0 ? "ر" : "ف"}
                  </span>
                ) : (
                  <span className="text-[9px]">حساب</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`truncate text-xs sm:text-sm ${
                      account.isGroup
                        ? "font-bold text-gray-900"
                        : "font-medium text-gray-800"
                    }`}
                  >
                    {account.name}
                  </span>

                  {account.isSystem && (
                    <span className="hidden rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500 sm:inline">
                      أساسي
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-gray-400 sm:text-xs">
                    {account.code}
                  </span>

                  {account.entityType && (
                    <span className="text-[9px] text-gray-400">
                      {account.entityType === "customer"
                        ? "عميل"
                        : account.entityType === "supplier"
                          ? "مورد"
                          : account.entityType === "bank"
                            ? "بنك"
                            : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* النوع */}

          <div className="hidden w-28 px-2 py-2 md:block">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${
                typeColors[account.type] ||
                "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              {typeLabels[account.type] || account.type}
            </span>
          </div>

          {/* الطبيعة */}

          <div className="hidden w-20 px-2 py-2 lg:block">
            <span
              className={`text-[10px] font-medium ${
                account.nature === "debit" ? "text-blue-600" : "text-green-600"
              }`}
            >
              {natureLabels[account.nature as AccountNature] || account.nature}
            </span>
          </div>

          {/* الرصيد */}

          <div className="hidden w-28 px-2 py-2 text-left sm:block">
            <span className="font-mono text-xs text-gray-700">
              {formatMoney(account.balance || 0)}
            </span>
          </div>

          {/* الحالة */}

          <div className="hidden w-20 px-2 py-2 xl:block">
            {account.isActive !== false ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                <FiCheckCircle size={12} />
                نشط
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-red-500">
                <FiXCircle size={12} />
                غير نشط
              </span>
            )}
          </div>

          {/* الإجراءات */}

          <div className="flex w-20 items-center justify-end gap-0.5 px-1.5 py-2 sm:w-24 sm:px-2">
            {account.isGroup && (
              <button
                type="button"
                onClick={() => handleAdd(account.id)}
                title="إضافة حساب فرعي"
                className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
              >
                <FiPlus size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleEdit(account)}
              title="تعديل"
              className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
            >
              <FiEdit2 size={13} />
            </button>

            {!account.isSystem && (
              <button
                type="button"
                onClick={() => handleDelete(account)}
                title="حذف"
                className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderAccount(child, level + 1))}</div>
        )}
      </div>
    );
  };

  /* =========================================================
     الحسابات الظاهرة
  ========================================================= */

  const displayedRootAccounts = isSearching
    ? accounts
        .filter((account) => {
          const directMatch = filteredAccounts.some(
            (item) => item.id === account.id,
          );

          const hasMatchingChild = accounts.some(
            (child) =>
              (child.parentId === account.id ||
                child.parentCode === account.code) &&
              filteredAccounts.some((item) => item.id === child.id),
          );

          return (
            !account.parentId &&
            !account.parentCode &&
            (directMatch || hasMatchingChild)
          );
        })
        .sort((a, b) => a.code.localeCompare(b.code))
    : rootAccounts;

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-gray-50 p-2.5 sm:p-3 md:p-4 lg:p-5"
    >
      <div className="mx-auto max-w-[1450px]">
        {/* =====================================================
            العنوان
        ===================================================== */}

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-xs">
              <Link href="/accounting" className="hover:text-gray-800">
                المحاسبة
              </Link>

              <FiArrowRight size={11} />

              <span className="text-gray-700">دليل الحسابات</span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              دليل الحسابات
            </h1>

            <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
              إدارة وتنظيم الحسابات والشجرة المحاسبية
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleAdd()}
            className="inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#162d47]"
          >
            <FiPlus size={15} />
            إضافة حساب
          </button>
        </div>

        {/* =====================================================
            الإحصائيات
        ===================================================== */}

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
            <p className="text-[10px] text-gray-500">إجمالي الحسابات</p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {statistics.total}
            </p>
          </div>

          <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2.5">
            <p className="text-[10px] text-green-700">الحسابات النشطة</p>

            <p className="mt-1 text-xl font-bold text-green-700">
              {statistics.active}
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
            <p className="text-[10px] text-red-600">غير النشطة</p>

            <p className="mt-1 text-xl font-bold text-red-600">
              {statistics.inactive}
            </p>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2.5">
            <p className="text-[10px] text-purple-700">الحسابات الرئيسية</p>

            <p className="mt-1 text-xl font-bold text-purple-700">
              {statistics.groups}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
            <p className="text-[10px] text-blue-700">الحسابات التفصيلية</p>

            <p className="mt-1 text-xl font-bold text-blue-700">
              {statistics.details}
            </p>
          </div>
        </div>

        {/* =====================================================
            الفلاتر
        ===================================================== */}

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <FiSearch
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث برمز الحساب أو اسم الحساب..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-9 pl-3 text-xs outline-none transition focus:border-[#0E1F33] focus:bg-white"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | AccountType)
              }
              className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs outline-none focus:border-[#0E1F33]"
            >
              <option value="all">جميع أنواع الحسابات</option>
              <option value="asset">الأصول</option>
              <option value="liability">الالتزامات</option>
              <option value="equity">حقوق الملكية</option>
              <option value="revenue">الإيرادات</option>
              <option value="cogs">تكلفة المبيعات</option>
              <option value="expense">المصروفات</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs outline-none focus:border-[#0E1F33]"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">النشطة فقط</option>
              <option value="inactive">غير النشطة فقط</option>
            </select>

            {isSearching && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50"
              >
                <FiRefreshCw size={13} />
                إعادة ضبط
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            جدول الحسابات
        ===================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden border-b border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-500 md:flex">
            <div className="flex-1 px-3 py-2.5">الحساب</div>

            <div className="w-28 px-2.5 py-2.5">النوع</div>

            <div className="hidden w-20 px-2.5 py-2.5 lg:block">الطبيعة</div>

            <div className="hidden w-28 px-2.5 py-2.5 text-left sm:block">
              الرصيد
            </div>

            <div className="hidden w-20 px-2.5 py-2.5 xl:block">الحالة</div>

            <div className="w-24 px-2.5 py-2.5 text-center">الإجراءات</div>
          </div>

          {displayedRootAccounts.length > 0 ? (
            displayedRootAccounts.map((account) => renderAccount(account))
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center">
              <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <FiSearch size={20} className="text-gray-400" />
              </div>

              <h3 className="text-sm font-semibold text-gray-800">
                لا توجد حسابات
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                لم يتم العثور على حسابات مطابقة للبحث أو الفلاتر المحددة
              </p>

              {isSearching && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white"
                >
                  إعادة ضبط البحث
                </button>
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            ملاحظة
        ===================================================== */}

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          <div className="flex gap-2.5">
            <div className="mt-0.5 shrink-0">
              <FiCheckCircle size={15} />
            </div>

            <div>
              <p className="font-semibold">دليل الحسابات</p>

              <p className="mt-0.5 leading-5">
                الحسابات التي تم إنشاؤها تلقائياً للعملاء والموردين والبنوك
                مرتبطة بحساباتها التفصيلية، لذلك يفضل عدم حذف الحسابات الأساسية
                أو تغيير رموزها بعد استخدامها في القيود المحاسبية.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            نافذة إضافة / تعديل حساب
        ===================================================== */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2.5 sm:p-4">
            <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editingId ? "تعديل الحساب" : "إضافة حساب جديد"}
                  </h2>

                  <p className="mt-0.5 text-[10px] text-gray-500">
                    أدخل بيانات الحساب المحاسبي
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setForm(createEmptyForm());
                  }}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                >
                  <FiXCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* اسم الحساب */}

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      اسم الحساب
                    </label>

                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="مثال: صندوق الفرع الرئيسي"
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-[#0E1F33]"
                    />
                  </div>

                  {/* الرمز */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      رمز الحساب
                    </label>

                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      placeholder="مثال: 110101"
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 font-mono text-xs outline-none focus:border-[#0E1F33]"
                    />

                    <p className="mt-1 text-[10px] text-gray-400">
                      يجب أن يكون الرمز فريداً
                    </p>
                  </div>

                  {/* الحساب الأب */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      الحساب الأب
                    </label>

                    <select
                      value={form.parentId}
                      onChange={(e) => {
                        const parentId = e.target.value;

                        const parent = accounts.find(
                          (account) => account.id === parentId,
                        );

                        setForm((prev) => ({
                          ...prev,
                          parentId,
                          type: parent?.type || prev.type,
                          nature: parent?.nature || prev.nature,
                        }));
                      }}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-[#0E1F33]"
                    >
                      <option value="">حساب رئيسي</option>

                      {accounts
                        .filter(
                          (account) =>
                            account.isGroup &&
                            account.id !== editingId &&
                            account.isActive !== false,
                        )
                        .sort((a, b) => a.code.localeCompare(b.code))
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* النوع */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      نوع الحساب
                    </label>

                    <select
                      value={form.type}
                      onChange={(e) =>
                        handleTypeChange(e.target.value as AccountType)
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-[#0E1F33]"
                    >
                      <option value="asset">الأصول</option>
                      <option value="liability">الالتزامات</option>
                      <option value="equity">حقوق الملكية</option>
                      <option value="revenue">الإيرادات</option>
                      <option value="cogs">تكلفة المبيعات</option>
                      <option value="expense">المصروفات</option>
                    </select>
                  </div>

                  {/* الطبيعة */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      طبيعة الحساب
                    </label>

                    <select
                      value={form.nature}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          nature: e.target.value as AccountNature,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-[#0E1F33]"
                    >
                      <option value="debit">مدين</option>
                      <option value="credit">دائن</option>
                    </select>
                  </div>

                  {/* حساب تجميعي */}

                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <input
                        type="checkbox"
                        checked={form.isGroup}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            isGroup: e.target.checked,
                          }))
                        }
                        className="h-3.5 w-3.5 rounded"
                      />

                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          حساب تجميعي / رئيسي
                        </p>

                        <p className="mt-0.5 text-[10px] leading-4 text-gray-500">
                          يستخدم لتجميع الحسابات الفرعية ولا يستخدم عادةً
                          للحركات المباشرة.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* الوصف */}

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      الوصف
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="وصف اختياري للحساب..."
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-[#0E1F33]"
                    />
                  </div>
                </div>

                {/* معلومات الحساب الأب */}

                {form.parentId && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                    {(() => {
                      const parent = accounts.find(
                        (account) => account.id === form.parentId,
                      );

                      if (!parent) return null;

                      return (
                        <>
                          <p className="font-semibold">الحساب الأب</p>

                          <p className="mt-0.5">
                            {parent.code} - {parent.name}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* الأزرار */}

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setForm(createEmptyForm());
                    }}
                    className="h-10 rounded-lg border border-gray-200 px-5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0E1F33] px-6 text-xs font-semibold text-white hover:bg-[#162d47]"
                  >
                    {editingId ? (
                      <>
                        <FiEdit2 size={14} />
                        حفظ التعديلات
                      </>
                    ) : (
                      <>
                        <FiPlus size={15} />
                        إضافة الحساب
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
