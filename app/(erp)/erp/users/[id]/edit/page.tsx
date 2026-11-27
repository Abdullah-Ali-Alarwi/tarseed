"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

import {
  FiUser,
  FiArrowRight,
  FiSave,
  FiRefreshCw,
  FiMail,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiAlertCircle,
  FiCheckCircle,
  FiBriefcase,
} from "react-icons/fi";

/* =========================
   Types
========================= */

type User = {
  id: string;
  name?: string;
  username: string;
  email?: string;
  role?: string;
  type?: string;
  companyId?: string;
  companyname?: string;
  ownerId?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type FormData = {
  name: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
};

/* =========================
   Constants
========================= */

const roleOptions = [
  { value: "manager", label: "مدير" },
  { value: "accountant", label: "محاسب" },
  { value: "cashier", label: "كاشير" },
  { value: "inventory", label: "مسؤول المخزون" },
  { value: "employee", label: "موظف" },
];

/* =========================
   Helpers
========================= */

const getCookie = (name: string) => {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  return value ? decodeURIComponent(value) : "";
};

const isActiveUser = (user: User) => {
  if (user.isActive === false) return false;

  const status = user.status?.toLowerCase();

  if (status === "inactive" || status === "غير نشط") {
    return false;
  }

  return true;
};

/* =========================
   Page
========================= */

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();

  const userId = String(params.id || "");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    role: "employee",
    isActive: true,
  });

  /* =========================
     Load Current User
  ========================= */

  const loadCurrentUser = useCallback(async () => {
    try {
      const username = getCookie("username");

      if (!username) {
        toast.error("يرجى تسجيل الدخول مجددًا");
        router.replace("/login");
        return null;
      }

      const response = await getUserByUsername(username);

      const user = Array.isArray(response) ? response[0] : response;

      if (!user) {
        toast.error("لم يتم العثور على المستخدم الحالي");
        router.replace("/login");
        return null;
      }

      if (user.type === "platform") {
        toast.error("ليس لديك صلاحية الوصول إلى هذه الصفحة");
        router.replace("/wezzan/dashboard");
        return null;
      }

      if (
        user.isActive === false ||
        user.status === "inactive" ||
        user.status === "غير نشط"
      ) {
        toast.error("حسابك غير نشط");
        router.replace("/login");
        return null;
      }

      if (!user.companyId) {
        toast.error("حسابك غير مرتبط بشركة");
        return null;
      }

      // صلاحية تعديل المستخدمين للمالك والمدير فقط
      if (!["owner", "manager"].includes(user.role?.toLowerCase() || "")) {
        toast.error("ليس لديك صلاحية تعديل المستخدمين");
        router.replace("/erp/users");
        return null;
      }

      const normalizedUser: User = {
        id: String(user.id),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        type: user.type,
        companyId: String(user.companyId),
        companyname: user.companyname,
        ownerId: user.ownerId,
        status: user.status,
        isActive: user.isActive,
      };

      setCurrentUser(normalizedUser);

      return normalizedUser;
    } catch (error) {
      console.error("Load current user error:", error);

      toast.error("تعذر التحقق من بيانات المستخدم");

      return null;
    }
  }, [router]);

  /* =========================
     Load Target User
  ========================= */

  const loadTargetUser = useCallback(
    async (companyId: string) => {
      try {
        setLoading(true);

        // التأكد من وجود المعرفات
        if (!userId || !companyId) {
          console.error("Missing userId or companyId:", {
            userId,
            companyId,
          });

          toast.error("تعذر تحديد المستخدم أو الشركة");
          router.replace("/erp/users");
          return;
        }

        console.log("Loading target user:", {
          userId,
          companyId,
        });

        // جلب المستخدم من نفس الشركة
        const { data, error } = await supabase
          .from("users")
          .select(
            `
          id,
          name,
          username,
          email,
          role,
          type,
          companyId,
          companyname,
          ownerId,
          status,
          isActive,
          createdAt,
          updatedAt
        `,
          )
          .eq("id", userId)
          .eq("companyId", companyId)
          .maybeSingle();

        // فحص خطأ Supabase
        if (error) {
          console.error("Load target user error:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          toast.error(`خطأ في تحميل المستخدم: ${error.message}`);
          router.replace("/erp/users");
          return;
        }

        // تسجيل نتيجة الاستعلام
        console.log("Target user result:", {
          data,
          requestedUserId: userId,
          requestedCompanyId: companyId,
          found: !!data,
        });

        // التأكد من وجود المستخدم
        if (!data) {
          console.error("User not found or inaccessible:", {
            userId,
            companyId,
          });

          toast.error("المستخدم غير موجود ضمن شركتك، أو لا تملك صلاحية عرضه");

          router.replace("/erp/users");
          return;
        }

        // منع تعديل مستخدمي منصة Wezzan
        if (data.type === "platform") {
          toast.error("لا يمكن تعديل مستخدم منصة Wezzan من هذه الصفحة");

          router.replace("/erp/users");
          return;
        }

        // التأكد من أن المستخدم يتبع الشركة الحالية
        if (String(data.companyId) !== String(companyId)) {
          console.error("Company mismatch:", {
            userCompanyId: data.companyId,
            currentCompanyId: companyId,
          });

          toast.error("هذا المستخدم لا يتبع شركتك");
          router.replace("/erp/users");
          return;
        }

        // منع تعديل حساب مالك الشركة
        if (data.role?.toLowerCase() === "owner") {
          toast.error("لا يمكن تعديل حساب مالك الشركة من هذه الصفحة");

          router.replace("/erp/users");
          return;
        }

        // تحويل البيانات إلى نوع User
        const user: User = data;

        // حفظ بيانات المستخدم
        setTargetUser(user);

        // تعبئة النموذج
        setForm({
          name: user.name || "",
          username: user.username || "",
          email: user.email || "",
          role: user.role || "employee",
          isActive: isActiveUser(user),
        });

        console.log("Target user loaded successfully:", user.id);
      } catch (error) {
        console.error("Fetch target user error:", error);

        toast.error(
          error instanceof Error ? error.message : "تعذر تحميل بيانات المستخدم",
        );

        router.replace("/erp/users");
      } finally {
        setLoading(false);
      }
    },
    [userId, router],
  );
  /* =========================
     Initialization
  ========================= */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);

      const user = await loadCurrentUser();

      if (!mounted) return;

      if (!user?.companyId) {
        setLoading(false);
        return;
      }

      await loadTargetUser(user.companyId);
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadCurrentUser, loadTargetUser]);

  /* =========================
     Form Change
  ========================= */

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =========================
     Validation
  ========================= */

  const validateForm = () => {
    const name = form.name.trim();
    const username = form.username.trim().toLowerCase();
    const email = form.email.trim();

    if (!name) {
      toast.error("يرجى إدخال اسم المستخدم");
      return false;
    }

    if (!username) {
      toast.error("يرجى إدخال اسم الدخول");
      return false;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      toast.error(
        "اسم الدخول يجب أن يحتوي على أحرف إنجليزية وأرقام و _ . - فقط",
      );
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return false;
    }

    if (!roleOptions.some((role) => role.value === form.role)) {
      toast.error("الدور الوظيفي غير صحيح");
      return false;
    }

    return true;
  };

  /* =========================
     Save Changes
  ========================= */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser?.companyId || !targetUser) return;

    if (!validateForm()) return;

    // حماية إضافية من تعديل مستخدم خارج الشركة
    if (targetUser.companyId !== currentUser.companyId) {
      toast.error("لا يمكنك تعديل مستخدم من شركة أخرى");
      return;
    }

    if (targetUser.role?.toLowerCase() === "owner") {
      toast.error("لا يمكن تعديل حساب مالك الشركة");
      return;
    }

    const normalizedUsername = form.username.trim().toLowerCase();

    setSaving(true);

    try {
      // التحقق من عدم تكرار اسم الدخول
      const { data: existingUser, error: usernameError } = await supabase
        .from("users")
        .select("id")
        .ilike("username", normalizedUsername)
        .neq("id", targetUser.id)
        .maybeSingle();

      if (usernameError) {
        console.error("Username check error:", usernameError);
        throw usernameError;
      }

      if (existingUser) {
        toast.error("اسم الدخول مستخدم بالفعل، اختر اسمًا آخر");
        return;
      }

      const now = new Date().toISOString();

      const newStatus = form.isActive ? "active" : "inactive";

      const { data, error } = await supabase
        .from("users")
        .update({
          name: form.name.trim(),
          username: normalizedUsername,
          email: form.email.trim() || null,
          role: form.role,
          status: newStatus,
          isActive: form.isActive,
          updatedAt: now,
        })
        .eq("id", targetUser.id)
        .eq("companyId", currentUser.companyId)
        .select(
          `
          id,
          name,
          username,
          email,
          role,
          status,
          isActive,
          companyId
        `,
        )
        .maybeSingle();

      if (error) {
        console.error("Update user error:", error);
        throw error;
      }

      if (!data) {
        console.error("Update returned no rows:", {
          userId: targetUser.id,
          companyId: currentUser.companyId,
          updateResult: data,
          updateError: error,
        });

        toast.error(
          "لم يتم تحديث أي سجل. تحقق من صلاحيات RLS أو ارتباط المستخدم بالشركة.",
        );

        return;
      }

      toast.success("تم تحديث بيانات المستخدم بنجاح");

      setTimeout(() => {
        router.push("/erp/users");
      }, 700);
    } catch (error) {
      console.error("Save user error:", error);

      toast.error("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Loading
  ========================= */

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500"
      >
        <FiRefreshCw className="animate-spin text-3xl" />

        <p className="text-sm">جاري تحميل بيانات المستخدم...</p>
      </div>
    );
  }

  if (!currentUser || !targetUser) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
      >
        <FiAlertCircle size={35} className="text-rose-500" />

        <h2 className="font-bold text-slate-800">
          تعذر الوصول إلى بيانات المستخدم
        </h2>

        <Link
          href="/erp/users"
          className="mt-2 rounded-xl bg-[#0E1F33] px-5 py-2.5 text-sm text-white"
        >
          العودة إلى المستخدمين
        </Link>
      </div>
    );
  }

  /* =========================
     Render
  ========================= */

  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <FiUser size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800">
              تعديل بيانات المستخدم
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              تحديث بيانات وصلاحيات مستخدمي الشركة
            </p>
          </div>
        </div>

        <Link
          href="/erp/users"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <FiArrowRight />
          العودة إلى المستخدمين
        </Link>
      </div>

      {/* Company Information */}

      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700">
          <FiBriefcase size={20} />
        </div>

        <div>
          <p className="text-xs text-blue-600">الشركة الحالية</p>

          <p className="mt-1 font-bold text-slate-800">
            {currentUser.companyname || "الشركة الحالية"}
          </p>
        </div>
      </div>

      {/* Form */}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">المعلومات الأساسية</h2>

            <p className="mt-1 text-xs text-slate-500">
              تعديل بيانات المستخدم الشخصية وبيانات تسجيل الدخول
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            {/* Name */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                الاسم الكامل
              </label>

              <div className="relative">
                <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Username */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                اسم الدخول
              </label>

              <div className="relative">
                <FiUserCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  dir="ltr"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="username"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-left text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  required
                />
              </div>

              <p className="mt-1 text-xs text-slate-400">
                استخدم الأحرف الإنجليزية والأرقام فقط مع _ أو . أو -
              </p>
            </div>

            {/* Email */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                البريد الإلكتروني
              </label>

              <div className="relative">
                <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-left text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>

            {/* Role */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                الدور الوظيفي
              </label>

              <div className="relative">
                <FiShield className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <select
                  value={form.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Account Status */}

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">حالة الحساب</h2>

            <p className="mt-1 text-xs text-slate-500">
              تحديد ما إذا كان المستخدم يستطيع استخدام النظام
            </p>
          </div>

          <div className="p-5">
            <button
              type="button"
              onClick={() => handleChange("isActive", !form.isActive)}
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-right transition ${
                form.isActive
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    form.isActive
                      ? "bg-white text-emerald-600"
                      : "bg-white text-rose-600"
                  }`}
                >
                  {form.isActive ? (
                    <FiUserCheck size={21} />
                  ) : (
                    <FiUserX size={21} />
                  )}
                </div>

                <div>
                  <p className="font-bold text-slate-800">
                    {form.isActive ? "الحساب نشط" : "الحساب موقوف"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {form.isActive
                      ? "المستخدم يستطيع الدخول إلى النظام"
                      : "تم إيقاف دخول المستخدم إلى النظام"}
                  </p>
                </div>
              </div>

              <div
                className={`relative h-6 w-11 rounded-full transition ${
                  form.isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                    form.isActive ? "right-1" : "right-6"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Notice */}

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />

          <p className="text-xs leading-6 text-amber-800">
            سيتم حفظ التعديلات مباشرة في قاعدة بيانات الشركة. إيقاف الحساب يمنع
            المستخدم من الدخول وفق آلية التحقق من حالة الحساب المعتمدة في
            النظام.
          </p>
        </div>

        {/* Actions */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/erp/users"
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <FiRefreshCw className="animate-spin" />
                جاري حفظ التعديلات...
              </>
            ) : (
              <>
                <FiSave />
                حفظ التعديلات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
