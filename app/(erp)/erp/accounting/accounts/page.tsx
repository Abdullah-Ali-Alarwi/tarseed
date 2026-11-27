"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiSearch, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";

import AccountsStats from "./components/AccountsStats";
import AccountsTable from "./components/AccountsTable";
import AccountModal from "./components/AccountModal";

import { useAccounts } from "./hooks/useAccounts";

import type {
  Account,
  AccountId,
  AccountFilters,
  AccountFormData,
} from "./types";

import type { User } from "@/lib/api/users";
import { getUserByUsername } from "@/lib/api/users";

// ==========================================
// Helpers
// ==========================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function getCurrentUsername(): string | null {
  const cookieUsername = getCookie("username");

  if (cookieUsername) return cookieUsername;

  if (typeof window !== "undefined") {
    try {
      const authUser = localStorage.getItem("authUser");

      if (authUser) {
        const user = JSON.parse(authUser);
        return user.username || null;
      }
    } catch (error) {
      console.error("Read authUser error:", error);
    }
  }

  return null;
}

// ==========================================
// Main Component
// ==========================================

export default function AccountsPage() {
  const router = useRouter();

  // User
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Filters
  const [filters, setFilters] = useState<AccountFilters>({
    search: "",
    type: "all",
    status: "all",
  });

  // ========================================
  // Load Current User
  // ========================================

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        setUserLoading(true);
        setUserError("");

        const username = getCurrentUsername();

        if (!username) {
          throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
        }

        const user = await getUserByUsername(username);

        if (!user) {
          throw new Error("المستخدم غير موجود في قاعدة البيانات");
        }

        if (user.type === "platform") {
          throw new Error(
            "لا يمكن لمستخدم المنصة الوصول إلى دليل حسابات الشركة",
          );
        }

        if (!user.companyId) {
          throw new Error("هذا المستخدم غير مرتبط بأي شركة");
        }

        if (user.isActive === false || user.status === "inactive") {
          throw new Error("حساب المستخدم غير نشط");
        }

        if (!isMounted) return;

        setCurrentUser(user);
        setCompanyId(String(user.companyId));
      } catch (error) {
        console.error("Get Current User Error:", error);

        if (isMounted) {
          setUserError(
            error instanceof Error
              ? error.message
              : "حدث خطأ أثناء تحميل بيانات المستخدم",
          );
        }
      } finally {
        if (isMounted) {
          setUserLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // ========================================
  // Accounts Hook
  // ========================================

  const {
    accounts,
    loading,
    error,
    inventoryValue,
    fetchAccounts,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
  } = useAccounts(companyId);

  // ========================================
  // Company Accounts
  // ========================================

  const companyAccounts = useMemo(() => {
    if (!companyId) return [];

    return accounts.filter(
      (account) => String(account.companyId) === companyId,
    );
  }, [accounts, companyId]);

  // ========================================
  // Search & Filters
  // ========================================

  const filteredAccounts = useMemo(() => {
    return companyAccounts.filter((account) => {
      const search = filters.search.trim().toLowerCase();

      const searchMatch =
        !search ||
        (account.name || "").toLowerCase().includes(search) ||
        String(account.code).toLowerCase().includes(search) ||
        (account.nameEn || "").toLowerCase().includes(search);

      const typeMatch = filters.type === "all" || account.type === filters.type;

      const isActive =
        account.isActive !== false && account.status !== "inactive";

      const statusMatch =
        filters.status === "all" ||
        (filters.status === "active" ? isActive : !isActive);

      return searchMatch && typeMatch && statusMatch;
    });
  }, [companyAccounts, filters]);

  // ========================================
  // Add Account
  // ========================================

  const handleAdd = () => {
    router.push("/erp/accounting/accounts/create");
  };

  // ========================================
  // Edit Account
  // ========================================

  const handleEdit = (account: Account) => {
    if (String(account.companyId) !== companyId) {
      toast.error("لا يمكنك تعديل حساب تابع لشركة أخرى");
      return;
    }

    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  // ========================================
  // Submit Edit
  // ========================================

  const handleSubmit = async (data: AccountFormData) => {
    if (!selectedAccount) return;

    if (!selectedAccount.id) {
      toast.error("لا يمكن تعديل حساب لا يحتوي على معرّف");
      return;
    }

    try {
      if (String(selectedAccount.companyId) !== companyId) {
        throw new Error("الحساب لا يتبع الشركة الحالية");
      }

      await updateAccount(selectedAccount.id, data);

      await fetchAccounts();

      toast.success("تم تعديل الحساب بنجاح");

      setIsModalOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء تعديل الحساب",
      );
    }
  };

  // ========================================
  // Delete Account
  // ========================================

  const handleDelete = (id: AccountId) => {
    const account = companyAccounts.find(
      (item) => String(item.id) === String(id),
    );

    if (!account) {
      toast.error("الحساب غير موجود ضمن الشركة الحالية");
      return;
    }

    if (!account.id) {
      toast.error("لا يمكن حذف حساب لا يحتوي على معرّف");
      return;
    }

    toast("هل أنت متأكد أنك تريد حذف هذا الحساب؟", {
      description: "لا يمكن التراجع عن عملية الحذف بعد تنفيذها.",

      action: {
        label: "نعم، احذف",

        onClick: async () => {
          try {
            await deleteAccount(account.id as AccountId);

            await fetchAccounts();

            toast.success("تم حذف الحساب بنجاح");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "تعذر حذف الحساب",
            );
          }
        },
      },

      cancel: {
        label: "إلغاء",
        onClick: () => {},
      },

      duration: 10000,
    });
  };

  // ========================================
  // Toggle Account Status
  // ========================================

  const handleToggleStatus = async (id: AccountId) => {
    const account = companyAccounts.find(
      (item) => String(item.id) === String(id),
    );

    if (!account) {
      toast.error("الحساب غير موجود ضمن الشركة الحالية");
      return;
    }

    if (!account.id) {
      toast.error("لا يمكن تحديث حساب لا يحتوي على معرّف");
      return;
    }

    try {
      await toggleAccountStatus(account.id as AccountId);

      await fetchAccounts();

      toast.success("تم تحديث حالة الحساب بنجاح");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تعذر تحديث حالة الحساب",
      );
    }
  };

  // ========================================
  // Loading User
  // ========================================

  if (userLoading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            جارٍ تحميل بيانات المستخدم...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // User Error
  // ========================================

  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-bold text-red-600">تعذر فتح دليل الحسابات</h2>

          <p className="mt-3 text-sm text-slate-600">
            {userError || "لم يتم تحديد الشركة الحالية"}
          </p>

          <button
            onClick={() => router.push("/erp/dashboard")}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            العودة إلى الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // Main UI
  // ========================================

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">دليل الحسابات</h1>

          <p className="mt-2 text-sm text-slate-500">
            إدارة وتنظيم الحسابات المالية للشركة
          </p>

          <p className="mt-2 text-sm text-blue-700">
            الشركة:{" "}
            <span className="font-semibold">
              {currentUser?.companyname || "الشركة الحالية"}
            </span>
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus size={18} />
          إضافة حساب جديد
        </button>
      </div>

      {/* Statistics */}
      <AccountsStats
        accounts={companyAccounts}
        inventoryValue={inventoryValue}
      />

      {/* Search & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              placeholder="ابحث برقم أو اسم الحساب..."
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: e.target.value as AccountFilters["type"],
              }))
            }
            className="rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">جميع أنواع الحسابات</option>
            {["asset", "liability", "equity", "revenue", "expense"].map(
              (type) => (
                <option key={type} value={type}>
                  {
                    {
                      asset: "الأصول",
                      liability: "الالتزامات",
                      equity: "حقوق الملكية",
                      revenue: "الإيرادات",
                      expense: "المصروفات",
                    }[type]
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as AccountFilters["status"],
              }))
            }
            className="rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">موقوف</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-600">
          جارٍ تحميل الحسابات...
        </div>
      ) : error ? (
        <div className="space-y-4 rounded-xl border border-red-200 bg-white py-16 text-center">
          <p className="text-red-600">{error}</p>

          <button
            onClick={fetchAccounts}
            className="inline-flex items-center gap-2 font-medium text-blue-600 transition hover:text-blue-800"
          >
            <FiRefreshCw />
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <AccountsTable
          accounts={filteredAccounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Edit Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        accounts={companyAccounts}
        initialData={selectedAccount}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccount(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
