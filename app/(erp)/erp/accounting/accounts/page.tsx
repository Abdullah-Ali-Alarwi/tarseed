"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { FiPlus, FiSearch, FiRefreshCw } from "react-icons/fi";

import { toast } from "sonner";

import AccountsStats from "./components/AccountsStats";
import AccountsTable from "./components/AccountsTable";
import AccountModal from "./components/AccountModal";

import { useAccounts } from "./hooks/useAccounts";
import { Account, AccountFilters, AccountFormData } from "./types";

import { getAccountTypeName } from "./utils";

// عنوان JSON Server
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// بيانات المستخدم الحالي
interface CurrentUser {
  id: number | string;
  name: string;
  username: string;
  type: string;
  role: string;
  companyId?: string;
  companyname?: string;
}

// قراءة Cookie
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

export default function AccountsPage() {
  const router = useRouter();

  // بيانات المستخدم
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // الشركة الحالية
  const [companyId, setCompanyId] = useState("");

  // تحميل المستخدم
  const [userLoading, setUserLoading] = useState(true);

  // خطأ المستخدم
  const [userError, setUserError] = useState("");

  // نافذة التعديل
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // الفلاتر
  const [filters, setFilters] = useState<AccountFilters>({
    search: "",
    type: "all",
    status: "all",
  });

  // تحديد المستخدم والشركة من Cookie
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setUserLoading(true);
        setUserError("");

        // قراءة اسم المستخدم من Cookie
        const username = getCookie("username");

        if (!username) {
          throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
        }

        // جلب المستخدم من JSON Server
        const response = await axios.get<CurrentUser[]>(`${API_URL}/users`, {
          params: {
            username,
          },
        });

        const user = response.data[0];

        if (!user) {
          throw new Error("المستخدم غير موجود في قاعدة البيانات");
        }

        // منع مستخدمي المنصة
        if (user.type === "platform") {
          throw new Error(
            "لا يمكن لمستخدم المنصة الوصول إلى دليل حسابات الشركة",
          );
        }

        // التأكد من وجود شركة مرتبطة بالمستخدم
        if (!user.companyId) {
          throw new Error("هذا المستخدم غير مرتبط بأي شركة");
        }

        setCurrentUser(user);
        setCompanyId(user.companyId);
      } catch (error) {
        console.error("Get Current User Error:", error);

        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "تعذر الاتصال بـ JSON Server"
          : error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع";

        setUserError(message);
      } finally {
        setUserLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  // جلب حسابات الشركة الحالية
  const {
    accounts,
    loading,
    error,
    inventoryValue,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    addDefaultAccounts,
    getMissingDefaultAccounts,
  } = useAccounts(companyId);

  // حسابات الشركة الحالية فقط
  const companyAccounts = useMemo(() => {
    if (!companyId) return [];

    return accounts.filter((account) => account.companyId === companyId);
  }, [accounts, companyId]);

  // البحث والتصفية
  const filteredAccounts = useMemo(() => {
    return companyAccounts.filter((account) => {
      const search = filters.search.trim().toLowerCase();

      const searchMatch =
        account.name.toLowerCase().includes(search) ||
        String(account.code).toLowerCase().includes(search) ||
        (account.nameEn || "").toLowerCase().includes(search);

      const typeMatch = filters.type === "all" || account.type === filters.type;

      const statusMatch =
        filters.status === "all" ||
        (filters.status === "active" ? account.isActive : !account.isActive);

      return searchMatch && typeMatch && statusMatch;
    });
  }, [companyAccounts, filters]);

  // إضافة حساب جديد
  const handleAdd = () => {
    router.push("/erp/accounting/accounts/create");
  };

  // تعديل حساب
  const handleEdit = (account: Account) => {
    if (account.companyId !== companyId) {
      toast.error("لا يمكنك تعديل حساب تابع لشركة أخرى");
      return;
    }

    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  // حفظ التعديلات
  const handleSubmit = async (data: AccountFormData) => {
    if (!selectedAccount) return;

    try {
      if (selectedAccount.companyId !== companyId) {
        throw new Error("الحساب لا يتبع الشركة الحالية");
      }

      await updateAccount(selectedAccount.id, data);

      toast.success("تم تعديل الحساب بنجاح");

      setIsModalOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "حدث خطأ أثناء تعديل الحساب",
      );
    }
  };

  // حذف حساب
  const handleDelete = (id: number) => {
    const account = companyAccounts.find((item) => item.id === id);

    if (!account) {
      toast.error("الحساب غير موجود ضمن الشركة الحالية");
      return;
    }

    toast("هل أنت متأكد أنك تريد حذف هذا الحساب؟", {
      description: "لا يمكن التراجع عن عملية الحذف بعد تنفيذها.",

      action: {
        label: "نعم، احذف",

        onClick: async () => {
          try {
            await deleteAccount(id);

            toast.success("تم حذف الحساب بنجاح");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "تعذر حذف الحساب");
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

  // تفعيل وإيقاف الحساب
  const handleToggleStatus = async (id: number) => {
    const account = companyAccounts.find((item) => item.id === id);

    if (!account) {
      toast.error("الحساب غير موجود ضمن الشركة الحالية");
      return;
    }

    try {
      await toggleAccountStatus(id);

      toast.success("تم تحديث حالة الحساب بنجاح");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "تعذر تحديث حالة الحساب",
      );
    }
  };

  // تحميل المستخدم
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

  // خطأ المستخدم أو الشركة
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

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* عنوان الصفحة */}
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

      {/* الإحصائيات */}
      <AccountsStats
        accounts={companyAccounts}
        inventoryValue={inventoryValue}
      />

      {/* البحث والتصفية */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* البحث */}
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

          {/* نوع الحساب */}
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
                  {getAccountTypeName(type as Account["type"])}
                </option>
              ),
            )}
          </select>

          {/* حالة الحساب */}
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

      {/* جدول الحسابات */}
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

      {/* نافذة تعديل الحساب */}
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
