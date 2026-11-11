"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiUser,
  FiShield,
  FiBriefcase,
  FiLock,
  FiArrowRight,
  FiCheckCircle,
  FiGlobe,
} from "react-icons/fi";

const API = "http://localhost:3001/users";

export default function CreateUser() {
  const router = useRouter();

  const [accountType, setAccountType] = useState("platform");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    companyname: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createUser = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.username.trim() || !form.password) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    if (accountType === "owner" && !form.companyname.trim()) {
      toast.error("يرجى إدخال اسم المؤسسة");
      return;
    }

    try {
      setLoading(true);

      // التحقق من اسم المستخدم
      const check = await axios.get(API, {
        params: {
          username: form.username.trim(),
        },
      });

      if (check.data.length > 0) {
        toast.error("اسم المستخدم مستخدم بالفعل");
        return;
      }

      // البيانات الأساسية
      const userData = {
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,

        type: accountType,

        role: accountType === "platform" ? "platform_employee" : "owner",

        companyname:
          accountType === "platform" ? "WEZZAN" : form.companyname.trim(),
      };

      // إنشاء معرف المؤسسة للمالك
      if (accountType === "owner") {
        userData.companyId = crypto.randomUUID();
      } else {
        userData.companyId = "wezzan-platform";
      }

      await axios.post(API, userData);

      toast.success(
        accountType === "platform"
          ? "تم إنشاء مستخدم المنصة بنجاح"
          : "تم إنشاء المؤسسة والمالك بنجاح",
      );

      router.push("/wezzan/platform-users");
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء الحساب");
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
                إنشاء مستخدم منصة أو مالك مؤسسة
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

              {/* Owner */}
              <button
                type="button"
                onClick={() => setAccountType("owner")}
                className={`relative rounded-2xl border-2 p-5 text-right transition ${
                  accountType === "owner"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                {accountType === "owner" && (
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
                  />
                </div>

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
                  />
                </div>

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
                    />
                  </div>
                </div>

                {/* Company Name */}
                {accountType === "owner" && (
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
                  <p className="text-xs text-gray-500">الوظيفة</p>
                  <p className="mt-1 font-bold text-[#0E1F33]">
                    {accountType === "platform" ? "موظف منصة" : "مالك المؤسسة"}
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
                className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-6 py-3 font-bold text-white transition hover:bg-blue-900 disabled:opacity-50"
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
