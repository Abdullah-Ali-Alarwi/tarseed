"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import {
  FiUser,
  FiUserPlus,
  FiLock,
  FiMail,
  FiBriefcase,
  FiArrowRight,
  FiSave,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

// =========================
// Types
// =========================

type UserRole =
  | "owner"
  | "accountant"
  | "cashier"
  | "manager"
  | "inventory"
  | "employee";

type CurrentUser = {
  id: string;
  name?: string;
  username?: string;
  role?: string;
  type?: string;
  companyId?: string;
  companyname?: string;
  ownerId?: string;
  status?: string;
  isActive?: boolean;
};

type FormData = {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  role: UserRole;
};

// =========================
// Constants
// =========================

const roleOptions: {
  value: UserRole;
  label: string;
  description: string;
}[] = [
  {
    value: "accountant",
    label: "محاسب",
    description: "إدارة العمليات والتقارير المحاسبية.",
  },
  {
    value: "cashier",
    label: "كاشير",
    description: "تنفيذ عمليات البيع والتحصيل المسموح بها.",
  },
  {
    value: "manager",
    label: "مدير",
    description: "متابعة وإدارة أعمال المؤسسة.",
  },
  {
    value: "inventory",
    label: "مسؤول المخزون",
    description: "متابعة المنتجات والمخزون.",
  },
  {
    value: "employee",
    label: "موظف",
    description: "صلاحيات الموظف حسب إعدادات النظام.",
  },
];

// =========================
// Helpers
// =========================

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : "";
}

function normalizeUsername(value: string) {
  return value.trim().normalize("NFC").toLowerCase();
}

// =========================
// Main Component
// =========================

export default function CreateERPUserPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    role: "accountant",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");

  // =========================
  // Load Current User
  // =========================

  const loadCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const username = getCookie("username");

      if (!username) {
        throw new Error("لم يتم العثور على بيانات تسجيل الدخول.");
      }

      const result = await getUserByUsername(username);

      const user = (
        Array.isArray(result) ? result[0] : result
      ) as CurrentUser | null;

      if (!user) {
        throw new Error("تعذر العثور على المستخدم الحالي.");
      }

      if (user.type === "platform") {
        throw new Error("لا يمكن لمستخدم المنصة إنشاء مستخدم من هذه الصفحة.");
      }

      if (user.isActive === false || user.status === "inactive") {
        throw new Error("حساب المستخدم غير نشط.");
      }

      if (!user.companyId) {
        throw new Error("المستخدم الحالي غير مرتبط بمؤسسة.");
      }

      // السماح للمالك والمدير بإضافة مستخدمين
      if (user.role !== "owner" && user.role !== "manager") {
        throw new Error("ليس لديك صلاحية إضافة مستخدمين.");
      }

      setCurrentUser(user);
    } catch (err) {
      console.error("Load current user error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل بيانات المستخدم.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // =========================
  // Handle Input Changes
  // =========================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // Validate Form
  // =========================

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم المستخدم.");
      return false;
    }

    if (!formData.username.trim()) {
      toast.error("يرجى إدخال اسم الدخول.");
      return false;
    }

    if (formData.username.trim().length < 3) {
      toast.error("اسم المستخدم يجب أن يكون 3 أحرف على الأقل.");
      return false;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username.trim())) {
      toast.error(
        "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية أو أرقام أو ( _ . - ) فقط.",
      );
      return false;
    }

    if (!formData.password) {
      toast.error("يرجى إدخال كلمة المرور.");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return false;
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      toast.error("البريد الإلكتروني غير صحيح.");
      return false;
    }

    return true;
  };

  // =========================
  // Check Username
  // =========================

  const checkUsername = async (username: string): Promise<boolean> => {
    const normalized = normalizeUsername(username);

    const { data, error } = await supabase
      .from("users")
      .select("id, username")
      .ilike("username", normalized)
      .limit(1);

    if (error) {
      throw error;
    }

    return (data ?? []).length > 0;
  };

  // =========================
  // Create User
  // =========================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("بيانات المستخدم الحالي غير متاحة.");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const normalizedUsername = normalizeUsername(formData.username);

      // التأكد من عدم تكرار اسم المستخدم
      const usernameExists = await checkUsername(normalizedUsername);

      if (usernameExists) {
        toast.error("اسم المستخدم مستخدم بالفعل، اختر اسمًا آخر.");
        return;
      }

      const now = new Date().toISOString();

      // تحديد مالك المستخدم
      const ownerId =
        currentUser.role === "owner"
          ? currentUser.id
          : currentUser.ownerId || currentUser.id;

      // بيانات المستخدم الجديدة
      const newUser = {
        name: formData.name.trim(),

        username: normalizedUsername,

        password: formData.password,

        email: formData.email.trim() || "",

        role: formData.role,

        type: "erp",

        companyId: String(currentUser.companyId),

        companyname: currentUser.companyname || "",

        ownerId,

        status: "active",

        isActive: true,

        createdAt: now,

        updatedAt: now,
      };

      // الحفظ في Supabase
      const { data, error } = await supabase
        .from("users")
        .insert(newUser)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("لم يتم إنشاء المستخدم.");
      }

      toast.success("تم إنشاء المستخدم بنجاح.");

      router.push("/erp/users");
      router.refresh();
    } catch (err) {
      console.error("Create user error:", err);

      const message =
        err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء المستخدم.";

      if (
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("unique")
      ) {
        toast.error("اسم المستخدم موجود مسبقًا.");
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F5F7FA]"
      >
        <div className="text-center">
          <FiLoader className="mx-auto animate-spin text-3xl text-[#0E1F33]" />

          <p className="mt-4 text-sm text-gray-500">
            جارٍ تحميل بيانات المؤسسة...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // Error
  // =========================

  if (error || !currentUser) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#F5F7FA] p-5 md:p-8">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-white p-8 text-center">
          <FiAlertCircle className="mx-auto text-4xl text-red-500" />

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            تعذر فتح صفحة إنشاء المستخدم
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error || "بيانات المستخدم غير متاحة."}
          </p>

          <Link
            href="/erp/users"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0E1F33] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#193957]"
          >
            <FiArrowRight />
            العودة إلى المستخدمين
          </Link>
        </div>
      </main>
    );
  }

  // =========================
  // Main UI
  // =========================

  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F7FA] p-5 md:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9EFF5] text-[#0E1F33]">
                <FiUserPlus size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#0E1F33]">
                  إضافة مستخدم جديد
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  إنشاء حساب جديد لمستخدم في المؤسسة
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/erp/users"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <FiArrowRight size={17} />
            العودة إلى المستخدمين
          </Link>
        </div>

        {/* Company Information */}

        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
              <FiBriefcase size={20} />
            </div>

            <div>
              <p className="text-xs font-medium text-blue-600">
                المؤسسة الحالية
              </p>

              <h3 className="mt-1 font-bold text-[#0E1F33]">
                {currentUser.companyname || "المؤسسة الحالية"}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                سيتم ربط المستخدم الجديد بهذه المؤسسة تلقائيًا.
              </p>
            </div>

            <div className="mr-auto flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-green-700">
              <FiCheckCircle size={13} />
              نشطة
            </div>
          </div>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          {/* Personal Information */}

          <div className="border-b border-gray-100 p-5 md:p-7">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 font-bold text-[#0E1F33]">
                <FiUser className="text-blue-600" />
                المعلومات الشخصية
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                أدخل البيانات الأساسية للمستخدم
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Name */}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  الاسم الكامل
                  <span className="mr-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <FiUser
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={17}
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="أدخل الاسم الكامل"
                    required
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Username */}

              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  اسم المستخدم
                  <span className="mr-1 text-red-500">*</span>
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="مثال: ahmed123"
                  required
                  disabled={saving}
                  autoComplete="off"
                  dir="ltr"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white disabled:opacity-60"
                />

                <p className="mt-1 text-xs text-gray-400">
                  استخدم الأحرف الإنجليزية والأرقام فقط مع _ أو - أو .
                </p>
              </div>

              {/* Email */}

              <div className="md:col-span-2">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  البريد الإلكتروني
                  <span className="mr-1 text-xs text-gray-400">(اختياري)</span>
                </label>

                <div className="relative">
                  <FiMail
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={17}
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    disabled={saving}
                    dir="ltr"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-left text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}

          <div className="border-b border-gray-100 p-5 md:p-7">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 font-bold text-[#0E1F33]">
                <FiLock className="text-blue-600" />
                معلومات تسجيل الدخول
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                حدد كلمة المرور الخاصة بحساب المستخدم
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  كلمة المرور
                  <span className="mr-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <FiLock
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={17}
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="أدخل كلمة المرور"
                    required
                    minLength={6}
                    disabled={saving}
                    autoComplete="new-password"
                    dir="ltr"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pr-10 pl-11 text-left text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    title="إظهار كلمة المرور"
                  >
                    {showPassword ? (
                      <FiEyeOff size={17} />
                    ) : (
                      <FiEye size={17} />
                    )}
                  </button>
                </div>

                <p className="mt-1 text-xs text-gray-400">6 أحرف على الأقل</p>
              </div>

              {/* Confirm Password */}

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  تأكيد كلمة المرور
                  <span className="mr-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <FiLock
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={17}
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="أعد إدخال كلمة المرور"
                    required
                    disabled={saving}
                    autoComplete="new-password"
                    dir="ltr"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pr-10 pl-11 text-left text-sm outline-none transition focus:border-[#0E1F33] focus:bg-white disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    title="إظهار كلمة المرور"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff size={17} />
                    ) : (
                      <FiEye size={17} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Role Information */}

          <div className="p-5 md:p-7">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 font-bold text-[#0E1F33]">
                <FiBriefcase className="text-blue-600" />
                الدور الوظيفي
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                اختر الدور المناسب للمستخدم
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {roleOptions.map((role) => {
                const selected = formData.role === role.value;

                return (
                  <label
                    key={role.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      selected
                        ? "border-[#0E1F33] bg-blue-50/60"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selected}
                      onChange={handleChange}
                      disabled={saving}
                      className="mt-1 h-4 w-4 accent-[#0E1F33]"
                    />

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          selected ? "text-[#0E1F33]" : "text-gray-700"
                        }`}
                      >
                        {role.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-400">
                        {role.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-gray-100 bg-gray-50/70 p-5 sm:flex-row sm:items-center md:px-7">
            <p className="text-xs text-gray-400">
              <span className="text-red-500">*</span> الحقول المطلوبة
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/erp/users"
                className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                إلغاء
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#0E1F33] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#193957] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <FiLoader size={17} className="animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <FiSave size={17} />
                    حفظ المستخدم
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
