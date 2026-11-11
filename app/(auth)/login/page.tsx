"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";

const API_URL = "http://localhost:3001";

interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  role: string;
  type: "platform" | "erp" | "owner";
  companyId?: string;
  companyname?: string;
  status?: string;
  isActive?: boolean;
}

interface Company {
  id: string;
  name: string;
  nameEn?: string;
  status?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // COOKIE HELPER
  // =====================================================

  const setCookie = (name: string, value: string) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  };

  // =====================================================
  // CLEAR OLD SESSION
  // =====================================================

  const clearSession = () => {
    const cookies = [
      "token",
      "userId",
      "username",
      "type",
      "role",
      "companyId",
      "companyname",
    ];

    cookies.forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });

    localStorage.removeItem("authUser");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("type");
    localStorage.removeItem("role");
    localStorage.removeItem("companyId");
    localStorage.removeItem("companyname");
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      // البحث عن المستخدم
      const response = await axios.get<User[]>(`${API_URL}/users`);

      const user = response.data.find(
        (item) =>
          item.username === username.trim() && item.password === password,
      );

      if (!user) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      // التحقق من حالة المستخدم
      if (user.status === "inactive" || user.isActive === false) {
        setError("هذا الحساب غير نشط، يرجى التواصل مع المسؤول");
        return;
      }

      // =================================================
      // COMPANY VALIDATION
      // =================================================

      let company: Company | undefined;

      const isPlatform = user.type === "platform";

      if (!isPlatform) {
        if (!user.companyId) {
          setError("لم يتم ربط هذا المستخدم بشركة");
          return;
        }

        const companiesResponse = await axios.get<Company[]>(
          `${API_URL}/companies`,
        );

        company = companiesResponse.data.find(
          (item) => String(item.id) === String(user.companyId),
        );

        if (!company) {
          setError("لم يتم العثور على الشركة المرتبطة بالمستخدم");
          return;
        }

        if (company.status === "inactive") {
          setError("الشركة غير نشطة");
          return;
        }
      }

      // =================================================
      // AUTH USER
      // =================================================

      const authUser = {
        id: String(user.id),
        name: user.name,
        username: user.username,
        email: user.email || "",
        role: user.role,
        type: user.type,
        companyId: isPlatform ? "" : String(user.companyId),
        companyname: company?.name || user.companyname || "",
      };

      // =================================================
      // CLEAR PREVIOUS SESSION
      // =================================================

      clearSession();

      // =================================================
      // SAVE LOCAL STORAGE
      // =================================================

      localStorage.setItem("authUser", JSON.stringify(authUser));

      localStorage.setItem("userId", authUser.id);
      localStorage.setItem("username", authUser.username);
      localStorage.setItem("type", authUser.type);
      localStorage.setItem("role", authUser.role);
      localStorage.setItem("companyId", authUser.companyId);
      localStorage.setItem("companyname", authUser.companyname);

      // =================================================
      // SAVE COOKIES
      // =================================================

      setCookie("token", authUser.id);
      setCookie("userId", authUser.id);
      setCookie("username", authUser.username);
      setCookie("type", authUser.type);
      setCookie("role", authUser.role);
      setCookie("companyId", authUser.companyId);
      setCookie("companyname", authUser.companyname);

      // =================================================
      // REDIRECT
      // =================================================

      if (isPlatform) {
        router.replace("/wezzan/dashboard");
      } else {
        router.replace("/erp");
      }
    } catch (err) {
      console.error("Login error:", err);

      setError("تعذر الاتصال بالخادم. تأكد من تشغيل JSON Server");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-100 px-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* LOGO */}

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0E1F33]">
            <FiLogIn className="text-4xl text-white" />
          </div>

          <h1 className="text-2xl font-bold text-[#0E1F33]">تسجيل الدخول</h1>

          <p className="mt-2 text-sm text-slate-500">
            مرحباً بك، أدخل بيانات حسابك للمتابعة
          </p>
        </div>

        {/* FORM */}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* USERNAME */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              اسم المستخدم
            </label>

            <div className="relative">
              <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white"
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              كلمة المرور
            </label>

            <div className="relative">
              <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-12 text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label={
                  showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                }
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1F33] py-3 font-semibold text-white transition hover:bg-[#193653] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جارٍ تسجيل الدخول...
              </>
            ) : (
              <>
                <FiLogIn size={18} />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        {/* FOOTER */}

        <div className="mt-8 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs text-slate-400">WEZZAN ERP Management System</p>
        </div>
      </div>
    </main>
  );
}
