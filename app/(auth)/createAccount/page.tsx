"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { getUsers } from "@/lib/api/users";
import { createOwner } from "@/lib/api/services/createOwner";

import {
  FiUser,
  FiLock,
  FiBriefcase,
  FiUserPlus,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

// =====================================================
// HELPERS
// =====================================================

const normalizeUsername = (value: string) => {
  return value.trim().normalize("NFC").toLocaleLowerCase();
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.";
};

// =====================================================
// PAGE
// =====================================================

export default function Page() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    companyname: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // HANDLE SUBMIT
  // =====================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ===============================================
    // 1. VALIDATION
    // ===============================================

    if (
      !form.name.trim() ||
      !form.username.trim() ||
      !form.password.trim() ||
      !form.companyname.trim()
    ) {
      setError("يرجى تعبئة جميع الحقول.");
      return;
    }

    if (form.password.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف.");
      return;
    }

    if (form.username.trim().length < 3) {
      setError("اسم المستخدم يجب ألا يقل عن 3 أحرف.");
      return;
    }

    try {
      setLoading(true);

      const username = normalizeUsername(form.username);
      const companyName = form.companyname.trim();

      // ===============================================
      // 2. CHECK DUPLICATE USERNAME
      // ===============================================

      const users = await getUsers();

      const existingUser = users.find(
        (user) => normalizeUsername(user.username) === username,
      );

      if (existingUser) {
        setError("اسم المستخدم مستخدم بالفعل، اختر اسماً آخر.");
        return;
      }

      // ===============================================
      // 3. GENERATE IDS
      // ===============================================

      const userId = crypto.randomUUID();
      const companyId = crypto.randomUUID();

      const now = new Date().toISOString();

      // ===============================================
      // 4. CREATE OWNER
      // ===============================================

      await createOwner({
        companyData: {
          id: companyId,

          name: companyName,
          nameEn: companyName,

          code: `CMP-${Date.now()}`,

          country: "YE",
          timezone: "Asia/Aden",
          currency: "YER",
          locale: "ar",

          status: "active",
          isActive: true,

          createdAt: now,
        },

        userData: {
          id: userId,

          name: form.name.trim(),
          username,

          password: form.password,
          email: "",

          role: "owner",
          type: "erp",

          companyId,
          companyname: companyName,

          status: "active",
          isActive: true,

          createdAt: now,
          updatedAt: now,
        },
      });

      // ===============================================
      // 5. SUCCESS
      // ===============================================

      setSuccess("تم إنشاء الشركة ودليل الحسابات وحساب المالك بنجاح.");

      setForm({
        name: "",
        username: "",
        password: "",
        companyname: "",
      });

      setShowPassword(false);

      // ===============================================
      // 6. REDIRECT
      // ===============================================

      setTimeout(() => {
        router.push("/erp");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Create owner error:", err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INPUT STYLE
  // =====================================================

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>Wezzan</span>
              <span>/</span>
              <span>مستخدمي المنصة</span>
              <span>/</span>
              <span className="text-blue-600">إضافة Owner</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-800">
              إنشاء حساب مالك شركة
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              إنشاء حساب جديد لمالك شركة وإضافته إلى منصة Wezzan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            <FiArrowRight />
            <span>رجوع</span>
          </button>
        </div>

        {/* FORM CARD */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* CARD HEADER */}

          <div className="border-b border-slate-100 bg-slate-50/70 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-600">
                <FiUserPlus />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">بيانات الحساب</h2>

                <p className="mt-1 text-sm text-slate-500">
                  أدخل بيانات مالك الشركة الجديدة.
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}

          <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8">
            {/* PERSONAL INFORMATION */}

            <div>
              <h3 className="mb-5 font-bold text-slate-700">
                المعلومات الشخصية
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    الاسم الكامل
                  </label>

                  <div className="relative">
                    <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="مثال: أحمد محمد"
                      autoComplete="name"
                      className={`${inputClass} pr-11`}
                    />
                  </div>
                </div>

                {/* USERNAME */}

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label className="block text-sm font-medium text-slate-600">
                      اسم المستخدم
                    </label>

                    <span className="text-xs text-green-500">
                      اسم الدخول للنظام
                    </span>
                  </div>

                  <div className="relative">
                    <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="username"
                      dir="ltr"
                      autoComplete="username"
                      className={`${inputClass} pl-4 pr-11`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* COMPANY INFORMATION */}

            <div>
              <h3 className="mb-5 font-bold text-slate-700">معلومات الشركة</h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  اسم الشركة
                </label>

                <div className="relative">
                  <FiBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    name="companyname"
                    value={form.companyname}
                    onChange={handleChange}
                    placeholder="مثال: شركة الجابري"
                    className={`${inputClass} pr-11`}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  سيتم إنشاء سجل الشركة ودليل الحسابات الخاص بها وربطه بحساب
                  المالك تلقائياً.
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* PASSWORD */}

            <div>
              <h3 className="mb-5 font-bold text-slate-700">
                معلومات تسجيل الدخول
              </h3>

              <label className="mb-2 block text-sm font-medium text-slate-600">
                كلمة المرور
              </label>

              <div className="relative">
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="أدخل كلمة المرور"
                  dir="ltr"
                  autoComplete="new-password"
                  className={`${inputClass} pl-12 pr-11`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.
              </p>
            </div>

            {/* ACCOUNT TYPE */}

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <FiCheckCircle />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700">
                    نوع الحساب: Owner
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    type: erp | role: owner
                  </p>
                </div>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                <FiAlertCircle />
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                <FiCheckCircle />
                {success}
              </div>
            )}

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiUserPlus />

                {loading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب Owner"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
