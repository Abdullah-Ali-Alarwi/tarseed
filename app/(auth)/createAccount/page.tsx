"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  FiUser,
  FiLock,
  FiBriefcase,
  FiUserPlus,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

// =====================================================
// HELPERS
// =====================================================

const normalizeUsername = (value: string) =>
  value.trim().normalize("NFC").toLocaleLowerCase();

function getErrorMessage(error: any): string {
  return (
    error?.context?.message ||
    error?.message ||
    error?.error_description ||
    "حدث خطأ أثناء إنشاء الحساب."
  );
}

// =====================================================
// PAGE
// =====================================================

export default function CreateAccountPage() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const username = normalizeUsername(form.username);
    const companyname = form.companyname.trim();
    const password = form.password;

    // =========================================
    // VALIDATION
    // =========================================

    if (!name || !username || !password || !companyname) {
      setError("يرجى تعبئة جميع الحقول.");
      return;
    }

    if (name.length > 150) {
      setError("الاسم طويل جداً.");
      return;
    }

    if (companyname.length > 150) {
      setError("اسم الشركة طويل جداً.");
      return;
    }

    if (username.length < 3 || username.length > 30) {
      setError("اسم المستخدم يجب أن يكون بين 3 و30 حرفاً.");
      return;
    }

    // السماح بالأحرف العربية والإنجليزية والأرقام
    // والنقطة والشرطة والشرطة السفلية.
    if (!/^[\p{L}\p{N}._-]+$/u.test(username)) {
      setError("اسم المستخدم يحتوي على أحرف أو رموز غير مسموحة.");
      return;
    }

    if (password.length < 8) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      return;
    }

    // =========================================
    // CREATE ACCOUNT
    // =========================================

    try {
      setLoading(true);

      const companyData = {
        name: companyname,
        nameEn: companyname,
        country: "YE",
        timezone: "Asia/Aden",
        currency: "YER",
        locale: "ar",
      };

      const userData = {
        name,
        username,
        password,
      };

      // لا نحتاج إلى جلسة سابقة.
      // Edge Function تنشئ حساب Auth والشركة والمالك.

      const { data, error: functionError } = await supabase.functions.invoke(
        "create-owner",
        {
          body: {
            companyData,
            userData,
            registrationType: "public",
          },
        },
      );

      // =========================================
      // FUNCTION ERROR
      // =========================================

      if (functionError) {
        console.error("Create owner function error:", functionError);

        let message = getErrorMessage(functionError);

        if (functionError.context instanceof Response) {
          try {
            const response = await functionError.context.clone().json();

            message = response.message || response.error || message;
          } catch {
            // الاحتفاظ برسالة الخطأ الأصلية.
          }
        }

        throw new Error(message);
      }

      // =========================================
      // CHECK RESULT
      // =========================================

      if (!data?.success || data?.created !== true) {
        throw new Error(data?.message || "لم تكتمل عملية إنشاء الحساب.");
      }

      // =========================================
      // SUCCESS
      // =========================================

      setSuccess(
        "تم إنشاء الشركة وحساب المالك بنجاح. يمكنك تسجيل الدخول الآن.",
      );

      setForm({
        name: "",
        username: "",
        password: "",
        companyname: "",
      });

      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 2500);
    } catch (err) {
      console.error("Public registration error:", err);

      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الحساب.",
      );
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

        <div className="mb-8">
          <div className="mb-2 text-sm text-slate-400">
            Wezzan / إنشاء حساب جديد
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            ابدأ باستخدام Wezzan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            أنشئ حسابك وشركتك وابدأ بإدارة أعمالك بسهولة.
          </p>
        </div>

        {/* CARD */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* CARD HEADER */}

          <div className="border-b border-slate-100 bg-slate-50/70 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-600">
                <FiUserPlus />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  إنشاء حساب مالك شركة
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  أدخل بياناتك لإنشاء حساب جديد.
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
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    اسم المستخدم
                  </label>

                  <div className="relative">
                    <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="أحمد123 أو ahmed123"
                      dir="auto"
                      autoComplete="username"
                      className={`${inputClass} pr-11`}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    يمكنك استخدام الأحرف العربية أو الإنجليزية والأرقام.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* COMPANY INFORMATION */}

            <div>
              <h3 className="mb-5 font-bold text-slate-700">معلومات الشركة</h3>

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
                سيتم إنشاء الشركة وربطها بحسابك تلقائياً.
              </p>
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
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                يجب ألا تقل كلمة المرور عن 8 أحرف.
              </p>
            </div>

            {/* ACCOUNT TYPE */}

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-xl text-blue-600" />

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
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
              >
                <FiAlertCircle className="shrink-0" />
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700"
              >
                <FiCheckCircle className="shrink-0" />
                {success}
              </div>
            )}

            {/* BUTTONS */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/login")}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                تسجيل الدخول
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiUserPlus />

                {loading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب جديد"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
