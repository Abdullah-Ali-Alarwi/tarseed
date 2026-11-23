"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/axios";
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
      const value = identifier.trim();

      // البحث باستخدام اسم المستخدم أو البريد الإلكتروني
      const isEmail = value.includes("@");

      const { data } = await api.get("/users", {
        params: {
          select: "*",
          [isEmail ? "email" : "username"]: `eq.${value}`,
          password: `eq.${password}`,
        },
      });

      // التحقق من بيانات الدخول
      if (!data || data.length === 0) {
        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
      }

      const user = data[0];

      // التحقق من حالة الحساب
      if (user.isActive !== true || user.status !== "active") {
        throw new Error("الحساب غير نشط، يرجى التواصل مع المسؤول");
      }

      // التحقق من نوع الحساب
      if (!["platform", "erp", "owner"].includes(user.type)) {
        throw new Error("نوع الحساب غير معروف");
      }

      // تجهيز بيانات المستخدم
      const authUser = {
        id: user.id,
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

      // حفظ بيانات المستخدم
      localStorage.setItem("authUser", JSON.stringify(authUser));

      // حفظ بيانات المصادقة في Cookies ليقرأها proxy.ts
      const cookieOptions = "path=/; max-age=86400; SameSite=Lax";

      document.cookie = `token=${encodeURIComponent(
        String(user.id),
      )}; ${cookieOptions}`;

      document.cookie = `type=${encodeURIComponent(
        user.type,
      )}; ${cookieOptions}`;

      document.cookie = `role=${encodeURIComponent(
        user.role || "",
      )}; ${cookieOptions}`;

      // تحديد الصفحة حسب نوع الحساب
      if (user.type === "platform") {
        router.replace("/wezzan/dashboard");
      } else {
        router.replace("/erp");
      }
    } catch (err) {
      console.error("Login Error:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.details ||
            err.response?.data?.hint ||
            (err.response
              ? `حدث خطأ: ${err.response.status}`
              : "تعذر الاتصال بالخادم"),
        );
      } else {
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول",
        );
      }
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
          {/* Username / Email */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              اسم المستخدم أو البريد الإلكتروني
            </label>

            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
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
