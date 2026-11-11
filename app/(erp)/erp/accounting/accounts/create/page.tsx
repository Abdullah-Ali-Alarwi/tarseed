"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { FiArrowRight, FiPlus, FiLayers } from "react-icons/fi";

import { toast } from "sonner";

import AccountForm from "../components/AccountForm";
import { useAccounts } from "../hooks/useAccounts";
import { AccountFormData } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface CurrentUser {
  id: number | string;
  name: string;
  username: string;
  type: string;
  role: string;
  companyId?: string;
  companyname?: string;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

export default function CreateAccountPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [userLoading, setUserLoading] = useState(true);

  const [userError, setUserError] = useState("");

  const [addingDefaults, setAddingDefaults] = useState(false);

  // تحديد المستخدم والشركة الحالية
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setUserLoading(true);

        const username = getCookie("username");

        if (!username) {
          throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
        }

        const response = await axios.get<CurrentUser[]>(`${API_URL}/users`, {
          params: { username },
        });

        const user = response.data[0];

        if (!user) {
          throw new Error("المستخدم غير موجود");
        }

        if (user.type === "platform") {
          throw new Error("لا يمكن لمستخدم المنصة إضافة حسابات ERP");
        }

        if (!user.companyId) {
          throw new Error("المستخدم غير مرتبط بأي شركة");
        }

        setCurrentUser(user);
        setCompanyId(user.companyId);
      } catch (error) {
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

  // حسابات الشركة
  const {
    accounts,
    loading,
    createAccount,
    fetchAccounts,
    getMissingDefaultAccounts,
    addDefaultAccounts,
  } = useAccounts(companyId);

  // الحسابات الرئيسية الافتراضية الناقصة
  const missingDefaultAccounts = getMissingDefaultAccounts(accounts);

  // إضافة الحسابات الرئيسية الافتراضية
  const handleAddDefaults = async () => {
    try {
      setAddingDefaults(true);

      const addedCount = await addDefaultAccounts();

      await fetchAccounts();

      toast.success(`تمت إضافة ${addedCount} حسابات رئيسية بنجاح`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذرت إضافة الحسابات الرئيسية",
      );

      await fetchAccounts();
    } finally {
      setAddingDefaults(false);
    }
  };

  // إضافة حساب جديد
  const handleSubmit = async (data: AccountFormData) => {
    if (!companyId) {
      toast.error("لم يتم تحديد الشركة الحالية");
      return;
    }

    if (missingDefaultAccounts.length > 0) {
      toast.error("يجب إضافة الحسابات الرئيسية أولاً");
      return;
    }

    try {
      await createAccount(data);

      toast.success("تمت إضافة الحساب بنجاح");

      router.push("/erp/accounting/accounts");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الحساب",
      );
    }
  };

  const handleCancel = () => {
    router.push("/erp/accounting/accounts");
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

  // خطأ المستخدم
  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-bold text-red-600">تعذر فتح صفحة إضافة الحساب</h2>

          <p className="mt-3 text-sm text-slate-600">
            {userError || "لم يتم تحديد الشركة الحالية"}
          </p>

          <button
            onClick={handleCancel}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 text-slate-800"
    >
      {/* العنوان */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
          title="العودة"
        >
          <FiArrowRight size={20} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">إضافة حساب جديد</h1>

          <p className="mt-1 text-sm text-slate-500">
            إضافة حساب جديد إلى دليل الحسابات
          </p>

          <p className="mt-2 text-sm text-blue-700">
            الشركة:{" "}
            <span className="font-semibold">
              {currentUser?.companyname || "الشركة الحالية"}
            </span>
          </p>
        </div>
      </div>

      {/* النموذج */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiPlus size={22} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">بيانات الحساب</h2>

            <p className="mt-1 text-xs text-slate-500">
              سيتم إنشاء رقم الحساب تلقائياً حسب موقعه في شجرة الحسابات
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            جارٍ تحميل الحسابات...
          </div>
        ) : missingDefaultAccounts.length > 0 ? (
          /* الحسابات الرئيسية الناقصة */
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <FiLayers size={22} />
              </div>

              <div>
                <h3 className="font-bold text-amber-900">
                  يجب تجهيز دليل الحسابات أولاً
                </h3>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  لم تتم إضافة بعض الحسابات الرئيسية لهذه الشركة. أضفها أولاً
                  حتى تتمكن من اختيار الحساب الأب عند إنشاء الحسابات الفرعية.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {missingDefaultAccounts.map((account) => (
                <div
                  key={account.code}
                  className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white p-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                    {account.code}
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {account.name}
                    </p>

                    <p className="text-xs text-slate-400">حساب رئيسي</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddDefaults}
              disabled={addingDefaults}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <FiPlus size={18} />

              {addingDefaults
                ? "جارٍ إضافة الحسابات..."
                : "إضافة الحسابات الرئيسية"}
            </button>
          </div>
        ) : (
          /* نموذج الحساب */
          <AccountForm
            accounts={accounts}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
