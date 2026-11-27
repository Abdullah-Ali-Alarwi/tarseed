"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FiArrowRight, FiLayers, FiSave, FiRefreshCw } from "react-icons/fi";

import { supabase } from "@/lib/supabase";

interface AuthUser {
  id: string;
  name?: string;
  username?: string;
  type: string;
  role?: string;
  companyId?: string;
}

export default function NewCategoryPage() {
  const router = useRouter();

  const [companyId, setCompanyId] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =====================================
  // التحقق من المستخدم
  // =====================================

  useEffect(() => {
    initialize();
  }, []);

  const initialize = () => {
    try {
      const savedUser = localStorage.getItem("authUser");

      if (!savedUser) {
        toast.error("انتهت جلسة تسجيل الدخول");
        return;
      }

      const user: AuthUser = JSON.parse(savedUser);

      if (user.type === "platform") {
        toast.error("هذه الصفحة مخصصة لمستخدمي الشركات");
        return;
      }

      if (!user.companyId) {
        toast.error("لم يتم العثور على الشركة المرتبطة بالمستخدم");
        return;
      }

      setCompanyId(user.companyId);
    } catch (error) {
      console.error("Initialize error:", error);
      toast.error("حدث خطأ أثناء تحميل الصفحة");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // حفظ التصنيف
  // =====================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("الشركة غير محددة");
      return;
    }

    const categoryName = name.trim();

    if (!categoryName) {
      toast.error("يرجى إدخال اسم التصنيف");
      return;
    }

    try {
      setSaving(true);

      // منع تكرار اسم التصنيف داخل الشركة
      const { data: existingCategory, error: checkError } = await supabase
        .from("categories")
        .select("id")
        .eq("companyId", companyId)
        .ilike("name", categoryName)
        .limit(1);

      if (checkError) throw checkError;

      if (existingCategory && existingCategory.length > 0) {
        toast.error("هذا التصنيف موجود مسبقًا");
        return;
      }

      const now = new Date().toISOString();

      const { error } = await supabase.from("categories").insert({
        id: crypto.randomUUID(),
        companyId,
        name: categoryName,
        status: "active",
        extra: {},
        createdAt: now,
        updatedAt: now,
      });

      if (error) throw error;

      toast.success("تمت إضافة التصنيف بنجاح");

      // العودة إلى صفحة إضافة المنتج
      router.push("/erp/products/new");
      router.refresh();
    } catch (error: any) {
      console.error("Create category error:", error);

      toast.error(error?.message || "حدث خطأ أثناء إضافة التصنيف");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[400px] items-center justify-center gap-3 text-blue-600"
      >
        <FiRefreshCw className="animate-spin text-xl" />
        <span>جارٍ تحميل الصفحة...</span>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="font-bold text-red-700">
          لم يتم العثور على الشركة المرتبطة بالمستخدم.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen space-y-6 p-4 md:p-6">
      {/* العنوان */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/erp/products" className="hover:text-blue-600">
              المنتجات
            </Link>

            <span>/</span>

            <Link href="/erp/products/new" className="hover:text-blue-600">
              إضافة منتج
            </Link>

            <span>/</span>

            <span className="text-blue-600">إضافة تصنيف</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            إضافة تصنيف جديد
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            أنشئ تصنيفًا خاصًا بمنتجات شركتك.
          </p>
        </div>

        <Link
          href="/erp/products/new"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <FiArrowRight />
          العودة للمنتج
        </Link>
      </div>

      {/* النموذج */}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiLayers size={22} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">بيانات التصنيف</h2>

              <p className="mt-1 text-xs text-slate-500">
                أدخل اسم التصنيف الذي تريد إضافته.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              اسم التصنيف <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="مثال: العسل"
              required
              autoFocus
            />
          </div>

          <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link
              href="/erp/products/new"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : (
                <>
                  <FiSave />
                  حفظ التصنيف
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
