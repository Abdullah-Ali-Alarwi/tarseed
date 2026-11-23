"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

import {
  FiUser,
  FiShield,
  FiBriefcase,
  FiLock,
  FiArrowRight,
  FiCheckCircle,
  FiGlobe,
} from "react-icons/fi";

type AccountType = "platform" | "erp";

interface UserForm {
  name: string;
  username: string;
  password: string;
  companyname: string;
}

interface ExistingUser {
  id: string;
  extra: {
    username?: string;
  } | null;
}

// توحيد اسم المستخدم قبل المقارنة
const normalizeUsername = (value: string) =>
  value.trim().normalize("NFC").toLowerCase();

export default function CreateUser() {
  const router = useRouter();

  const [accountType, setAccountType] = useState<AccountType>("platform");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<UserForm>({
    name: "",
    username: "",
    password: "",
    companyname: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const name = form.name.trim();
    const username = form.username.trim().normalize("NFC");
    const password = form.password;
    const companyname = form.companyname.trim();

    // =====================================
    // 1. التحقق من البيانات
    // =====================================

    if (!name || !username || !password) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    if (accountType === "erp" && !companyname) {
      toast.error("يرجى إدخال اسم المؤسسة");
      return;
    }

    if (username.length < 3) {
      toast.error("اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل");
      return;
    }

    if (password.length < 3) {
      toast.error("كلمة المرور قصيرة جداً");
      return;
    }

    let createdCompanyId: string | null = null;

    try {
      setLoading(true);

      // =====================================
      // 2. التحقق من عدم تكرار اسم المستخدم
      // =====================================

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, extra");

      if (usersError) {
        console.error("Users Fetch Error:", usersError);

        throw new Error(`تعذر قراءة المستخدمين: ${usersError.message}`);
      }

      const existingUsers = (usersData || []) as ExistingUser[];

      const usernameExists = existingUsers.some((user) => {
        const existingUsername = user.extra?.username || "";

        return (
          normalizeUsername(existingUsername) === normalizeUsername(username)
        );
      });

      if (usernameExists) {
        toast.error("اسم المستخدم مستخدم بالفعل");
        return;
      }

      // =====================================
      // 3. تجهيز بيانات المستخدم
      // =====================================

      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      const userData: Record<string, any> = {
        id: userId,

        name,
        username,
        password,

        type: accountType,

        role: accountType === "platform" ? "platform_employee" : "owner",

        companyname: accountType === "platform" ? "WEZZAN" : companyname,

        status: "active",
        isActive: true,

        createdAt: now,
        updatedAt: now,
      };

      // =====================================
      // 4. إنشاء المؤسسة إذا كان الحساب ERP
      // =====================================

      if (accountType === "erp") {
        createdCompanyId = crypto.randomUUID();

        const companyData = {
          id: createdCompanyId,

          name: companyname,
          nameEn: "",

          code: `CMP-${Date.now()}`,

          country: "YE",
          timezone: "Asia/Aden",
          currency: "YER",
          locale: "ar",

          status: "active",
          isActive: true,

          createdAt: now,
          updatedAt: now,
        };

        const { error: companyError } = await supabase
          .from("companies")
          .insert({
            id: createdCompanyId,
            extra: companyData,
          });

        if (companyError) {
          console.error("Company Insert Error:", companyError);

          throw new Error(`فشل إنشاء المؤسسة: ${companyError.message}`);
        }

        // ربط المستخدم بالمؤسسة
        userData.companyId = createdCompanyId;
      }

      // =====================================
      // 5. إنشاء المستخدم في Supabase
      // =====================================

      const { error: userError } = await supabase.from("users").insert({
        id: userId,
        extra: userData,
      });

      if (userError) {
        console.error("User Insert Error:", userError);

        // =====================================
        // 6. حذف المؤسسة إذا فشل إنشاء المستخدم
        // =====================================

        if (createdCompanyId) {
          const { error: deleteError } = await supabase
            .from("companies")
            .delete()
            .eq("id", createdCompanyId);

          if (deleteError) {
            console.error("Company Rollback Error:", deleteError);
          }
        }

        throw new Error(`فشل إنشاء المستخدم: ${userError.message}`);
      }

      // =====================================
      // 7. رسالة النجاح
      // =====================================

      toast.success(
        accountType === "platform"
          ? "تم إنشاء مستخدم المنصة بنجاح"
          : "تم إنشاء المؤسسة والمالك بنجاح",
      );

      // تفريغ النموذج
      setForm({
        name: "",
        username: "",
        password: "",
        companyname: "",
      });

      // الانتقال إلى قائمة المستخدمين
      router.push("/wezzan/platform-users");
      router.refresh();
    } catch (error) {
      console.error("Create User Error:", error);

      const message =
        error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحساب";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4F6FA] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 flex items-center gap-2 text-sm text-gray-500 hover:text-[#0E1F33]"
          >
            <FiArrowRight />
            العودة
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E1F33] text-2xl text-white">
              <FiUser />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#0E1F33]">
                إضافة حساب جديد
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                إنشاء مستخدم منصة أو مالك مؤسسة جديدة
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <h2 className="font-bold text-[#0E1F33]">اختر نوع الحساب</h2>

            <p className="mt-1 text-sm text-gray-500">
              حدد نوع المستخدم الذي تريد إضافته
            </p>
          </div>

          <form onSubmit={createUser} className="space-y-7 p-6 sm:p-8">
            {/* Account Types */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Platform */}
              <button
                type="button"
                onClick={() => setAccountType("platform")}
                className={`relative rounded-2xl border-2 p-5 text-right transition ${
                  accountType === "platform"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                {accountType === "platform" && (
                  <FiCheckCircle className="absolute left-4 top-4 text-xl text-blue-600" />
                )}

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0E1F33] text-xl text-white">
                  <FiGlobe />
                </div>

                <h3 className="font-bold text-[#0E1F33]">مستخدم المنصة</h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  إضافة موظف لإدارة منصة WEZZAN.
                </p>

                <span className="mt-4 inline-block rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
                  Platform User
                </span>
              </button>

              {/* Company Owner */}
              <button
                type="button"
                onClick={() => setAccountType("erp")}
                className={`relative rounded-2xl border-2 p-5 text-right transition ${
                  accountType === "erp"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                {accountType === "erp" && (
                  <FiCheckCircle className="absolute left-4 top-4 text-xl text-blue-600" />
                )}

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
                  <FiBriefcase />
                </div>

                <h3 className="font-bold text-[#0E1F33]">مالك مؤسسة</h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  إنشاء مؤسسة جديدة وإضافة مالك لها.
                </p>

                <span className="mt-4 inline-block rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
                  Company Owner
                </span>
              </button>
            </div>

            <div className="border-t border-gray-100" />

            {/* User Information */}
            <div>
              <h2 className="mb-5 font-bold text-[#0E1F33]">بيانات المستخدم</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    الاسم الكامل
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="أدخل الاسم الكامل"
                    className={inputClass}
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    اسم المستخدم
                  </label>

                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="username"
                    dir="ltr"
                    className={inputClass}
                    required
                  />
                </div>

                {/* Password */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    كلمة المرور
                  </label>

                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="أدخل كلمة المرور"
                      dir="ltr"
                      className={`${inputClass} pl-11`}
                      required
                    />
                  </div>
                </div>

                {/* Company Name */}
                {accountType === "erp" && (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      اسم المؤسسة
                    </label>

                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                      <input
                        name="companyname"
                        value={form.companyname}
                        onChange={handleChange}
                        placeholder="مثال: شركة الجابري"
                        className={`${inputClass} pl-11`}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiShield className="text-blue-600" />

                <h3 className="font-bold text-[#0E1F33]">
                  معاينة بيانات الحساب
                </h3>
              </div>

              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">نوع الحساب</p>

                  <p className="mt-1 font-bold text-[#0E1F33]">
                    {accountType === "platform"
                      ? "مستخدم المنصة"
                      : "مالك مؤسسة"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    نوع المستخدم في قاعدة البيانات
                  </p>

                  <p className="mt-1 font-bold text-[#0E1F33]" dir="ltr">
                    {accountType === "platform" ? "platform" : "erp"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">الدور</p>

                  <p className="mt-1 font-bold text-[#0E1F33]" dir="ltr">
                    {accountType === "platform" ? "platform_employee" : "owner"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">المؤسسة</p>

                  <p className="mt-1 font-bold text-[#0E1F33]">
                    {accountType === "platform"
                      ? "WEZZAN"
                      : form.companyname || "اسم المؤسسة"}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-6 py-3 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          WEZZAN ERP — إدارة المؤسسات والمستخدمين
        </p>
      </div>
    </main>
  );
}
