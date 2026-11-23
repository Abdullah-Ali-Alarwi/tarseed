"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiBriefcase,
  FiShield,
  FiArrowRight,
  FiSave,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type AuthUser = {
  id: string;
  name?: string;
  fullName?: string;
  username?: string;
  role?: string;
  type?: string;
  companyId?: string;
  companyname?: string;
  company?: {
    id?: string;
    name?: string;
  };
  ownerId?: string;
};

type FormData = {
  name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  role: string;
};

const roles = [
  {
    value: "accountant",
    label: "محاسب",
    description: "إدارة العمليات المحاسبية والفواتير",
  },
  {
    value: "cashier",
    label: "كاشير",
    description: "تنفيذ عمليات البيع والتحصيل",
  },
  {
    value: "manager",
    label: "مدير",
    description: "متابعة وإدارة عمليات الشركة",
  },
  {
    value: "employee",
    label: "موظف",
    description: "مستخدم موظف داخل الشركة",
  },
];

export default function CreateUserPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [form, setForm] = useState<FormData>({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    role: "accountant",
  });

  // تحميل بيانات المستخدم الحالي والشركة
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedUser = localStorage.getItem("authUser");

        if (!storedUser) {
          toast.error("يرجى تسجيل الدخول أولاً");
          router.replace("/login");
          return;
        }

        const user: AuthUser = JSON.parse(storedUser);

        const currentCompanyId = String(
          user.companyId || user.company?.id || "",
        );

        if (!currentCompanyId) {
          toast.error("لم يتم تحديد الشركة المرتبطة بالمستخدم");
          return;
        }

        setCurrentUser(user);
        setCompanyId(currentCompanyId);

        let currentCompanyName = user.companyname || user.company?.name || "";

        // جلب اسم الشركة من قاعدة البيانات
        if (!currentCompanyName) {
          const response = await axios.get(`${API_URL}/companies`);

          const company = response.data.find(
            (item: { id: string; name: string }) =>
              String(item.id) === currentCompanyId,
          );

          currentCompanyName = company?.name || "";
        }

        setCompanyName(currentCompanyName);
      } catch (error) {
        console.error(error);
        toast.error("حدث خطأ أثناء تحميل بيانات الشركة");
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, [router]);

  // تحديث الحقول
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // إضافة المستخدم
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser || !companyId) {
      toast.error("بيانات الشركة غير مكتملة");
      return;
    }

    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }

    if (form.password.length < 3) {
      toast.error("كلمة المرور قصيرة جداً");
      return;
    }

    setLoading(true);

    try {
      // التحقق من عدم تكرار اسم المستخدم داخل الشركة
      const usersResponse = await axios.get(`${API_URL}/users`);

      const usernameExists = usersResponse.data.some(
        (user: { username: string; companyId?: string }) =>
          user.username?.toLowerCase() === form.username.trim().toLowerCase() &&
          String(user.companyId) === companyId,
      );

      if (usernameExists) {
        toast.error("اسم المستخدم مستخدم بالفعل في هذه الشركة");
        setLoading(false);
        return;
      }

      // تحديد مالك الشركة
      const ownerId =
        currentUser.role === "owner"
          ? currentUser.id
          : currentUser.ownerId || currentUser.id;

      // بيانات المستخدم وفق db.json
      const newUser = {
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        phone: form.phone.trim(),

        type: "employee",
        role: form.role,

        companyId,
        companyname: companyName,
        ownerId,

        status: "نشط",
        isActive: true,

        createdAt: new Date().toISOString(),
      };

      await axios.post(`${API_URL}/users`, newUser);

      toast.success("تمت إضافة المستخدم بنجاح");

      router.push("/erp/users/list");
      router.refresh();
    } catch (error) {
      console.error("Create user error:", error);
      toast.error("حدث خطأ أثناء إضافة المستخدم");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#0E1F33]" />
          <p className="text-sm text-slate-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="font-semibold text-red-700">لا يمكن إضافة مستخدم</p>
        <p className="mt-2 text-sm text-red-600">
          لم يتم العثور على الشركة المرتبطة بحسابك.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>المستخدمون</span>
            <span>/</span>
            <span className="text-[#0E1F33]">إضافة مستخدم</span>
          </div>

          <h1 className="text-2xl font-bold text-[#0E1F33]">
            إضافة مستخدم جديد
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إنشاء حساب موظف جديد داخل الشركة
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/erp/users/list")}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <FiArrowRight />
          العودة للمستخدمين
        </button>
      </div>

      {/* Company information */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <FiBriefcase size={21} />
        </div>

        <div>
          <p className="text-xs text-slate-500">
            الشركة التي سيتم إضافة المستخدم إليها
          </p>

          <p className="mt-1 font-bold text-[#0E1F33]">
            {companyName || "الشركة الحالية"}
          </p>
        </div>

        <div className="mr-auto rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-blue-700">
          شركة مرتبطة بحسابك
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal information */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <FiUser size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#0E1F33]">المعلومات الشخصية</h2>
              <p className="text-xs text-slate-500">
                البيانات الأساسية للمستخدم
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiUser className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="أدخل الاسم الكامل"
                  required
                  className="w-full rounded-lg border border-slate-200 py-3 pr-10 pl-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                اسم المستخدم <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiUser className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="مثال: ahmed"
                  required
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-3 pr-10 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                البريد الإلكتروني
              </label>

              <div className="relative">
                <FiMail className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-3 pr-10 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                رقم الهاتف
              </label>

              <div className="relative">
                <FiPhone className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="رقم الهاتف"
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-3 pr-10 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                كلمة المرور <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiLock className="absolute right-3 top-3.5 text-slate-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="أدخل كلمة المرور"
                  required
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-11 pr-10 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                يجب أن تتكون كلمة المرور من 3 أحرف على الأقل.
              </p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <FiShield size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#0E1F33]">الدور الوظيفي</h2>

              <p className="text-xs text-slate-500">
                تحديد طبيعة عمل المستخدم داخل الشركة
              </p>
            </div>
          </div>

          <div className="p-6">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              اختر الدور الوظيفي
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    form.role === role.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={form.role === role.value}
                    onChange={handleChange}
                    className="mt-1 accent-blue-600"
                  />

                  <div>
                    <p className="font-semibold text-[#0E1F33]">{role.label}</p>

                    <p className="mt-1 text-xs text-slate-500">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white p-5">
          <button
            type="button"
            onClick={() => router.push("/erp/users/list")}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={loading || !companyId}
            className="flex items-center gap-2 rounded-lg bg-[#0E1F33] px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave size={17} />

            {loading ? "جاري الحفظ..." : "حفظ المستخدم"}
          </button>
        </div>
      </form>
    </div>
  );
}
