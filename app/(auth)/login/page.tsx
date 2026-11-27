"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const username = identifier.trim();

      if (!username || !password) {
        throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور");
      }

      // 1. البحث عن البريد الداخلي باستخدام اسم المستخدم
      const { data: authEmail, error: emailError } = await supabase.rpc(
        "get_auth_email_by_username",
        {
          p_username: username,
        },
      );

      if (emailError) {
        console.error("Username Lookup Error:", emailError);
        throw new Error("تعذر التحقق من اسم المستخدم");
      }

      if (!authEmail) {
        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
      }

      // 2. تسجيل الدخول باستخدام Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

      if (authError || !authData.user) {
        console.error("Supabase Auth Details:", {
          message: authError?.message,
          status: authError?.status,
          code: authError?.code,
        });

        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
      }

      // 3. جلب بيانات المستخدم المرتبط بحساب Auth
      const { data: user, error: userError } = await supabase
        .from("users")
        .select(
          `
          id,
          username,
          email,
          name,
          type,
          role,
          companyId,
          companyname,
          ownerId,
          isActive,
          status,
          auth_user_id
        `,
        )
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (userError) {
        console.error("User Data Error:", userError);

        await supabase.auth.signOut();

        throw new Error("تعذر تحميل بيانات المستخدم");
      }

      if (!user) {
        await supabase.auth.signOut();

        throw new Error("لا يوجد سجل مستخدم مرتبط بحساب الدخول");
      }

      // 4. التأكد من تطابق اسم المستخدم
      if (user.username !== username) {
        await supabase.auth.signOut();

        throw new Error("بيانات الحساب غير متطابقة");
      }

      // 5. التحقق من حالة الحساب
      if (user.isActive !== true || user.status !== "active") {
        await supabase.auth.signOut();

        throw new Error("الحساب غير نشط، يرجى التواصل مع المسؤول");
      }

      // 6. التحقق من نوع الحساب
      if (!["platform", "erp", "owner"].includes(user.type)) {
        await supabase.auth.signOut();

        throw new Error("نوع الحساب غير معروف");
      }

      // 7. التحقق من ارتباط مستخدم ERP بالشركة
      if ((user.type === "erp" || user.type === "owner") && !user.companyId) {
        await supabase.auth.signOut();

        throw new Error("هذا الحساب غير مرتبط بأي شركة");
      }

      // 8. تجهيز بيانات المستخدم
      const authUser = {
        id: user.id,
        auth_user_id: authData.user.id,

        username: user.username,
        email: user.email,
        name: user.name,

        type: user.type,
        role: user.role,

        companyId: user.companyId,
        companyname: user.companyname,
        ownerId: user.ownerId,

        is_active: user.isActive,
        status: user.status,
      };

      // 9. حفظ بيانات المستخدم في localStorage
      localStorage.setItem("authUser", JSON.stringify(authUser));

      // 10. إعداد Cookies للتوافق مع proxy.ts الحالي
      // هذه القيم مؤقتة للتوجيه فقط وليست وسيلة حماية أمنية.
      const cookieOptions = "path=/; max-age=86400; SameSite=Lax";

      document.cookie = `token=${encodeURIComponent(
        String(user.id),
      )}; ${cookieOptions}`;

      document.cookie = `username=${encodeURIComponent(
        user.username,
      )}; ${cookieOptions}`;

      document.cookie = `type=${encodeURIComponent(
        user.type,
      )}; ${cookieOptions}`;

      document.cookie = `role=${encodeURIComponent(
        user.role || "",
      )}; ${cookieOptions}`;

      // 11. التوجيه حسب نوع الحساب
      if (user.type === "platform") {
        router.replace("/wezzan/dashboard");
      } else {
        router.replace("/erp");
      }
    } catch (err) {
      console.error("Login Error:", err);

      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-100 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 shadow-lg shadow-slate-200/50">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#0E1F33]">Wezzan</h1>

          <p className="mt-2 text-sm text-gray-500">تسجيل الدخول إلى حسابك</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              اسم المستخدم
            </label>

            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              autoComplete="username"
              required
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-slate-50/50 p-3.5 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-[#0E1F33] focus:bg-white focus:ring-4 focus:ring-[#0E1F33]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              كلمة المرور
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-slate-50/50 p-3.5 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-[#0E1F33] focus:bg-white focus:ring-4 focus:ring-[#0E1F33]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-[#0E1F33] p-3.5 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#193653] hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          {/* Back to Home */}
          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 p-3.5 font-semibold text-[#0E1F33] transition-all duration-200 hover:border-slate-300 hover:bg-slate-200"
          >
            العودة للصفحة الرئيسية
          </Link>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs font-medium tracking-wide text-gray-400">
            WEZZAN ERP Management System
          </p>
        </div>
      </div>
    </main>
  );
}
