"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FiArrowRight,
  FiPackage,
  FiLayers,
  FiBox,
  FiPlus,
  FiSave,
  FiRefreshCw,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  status?: string;
}

interface Unit {
  id: string;
  name: string;
  symbol?: string;
  status?: string;
}

interface AuthUser {
  id: string;
  name?: string;
  username?: string;
  type: string;
  role?: string;
  companyId?: string;
}

export default function NewProductPage() {
  const router = useRouter();

  const [companyId, setCompanyId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  // =====================================
  // تحميل بيانات المستخدم والتصنيفات والوحدات
  // =====================================

  const initialize = async () => {
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

      await loadData(user.companyId);
    } catch (error) {
      console.error("Initialize error:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // تحميل التصنيفات والوحدات الخاصة بالشركة
  // =====================================

  const loadData = async (currentCompanyId: string) => {
    const [categoriesResult, unitsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, status")
        .eq("companyId", currentCompanyId)
        .order("name"),

      supabase
        .from("units")
        .select("id, name, symbol, status")
        .eq("companyId", currentCompanyId)
        .order("name"),
    ]);

    if (categoriesResult.error) {
      throw categoriesResult.error;
    }

    if (unitsResult.error) {
      throw unitsResult.error;
    }

    setCategories(
      (categoriesResult.data || []).filter(
        (item) => item.status !== "inactive",
      ),
    );

    setUnits(
      (unitsResult.data || []).filter((item) => item.status !== "inactive"),
    );
  };

  // =====================================
  // حفظ المنتج
  // =====================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("الشركة غير محددة");
      return;
    }

    if (!name.trim()) {
      toast.error("يرجى إدخال اسم المنتج");
      return;
    }

    if (!categoryId) {
      toast.error("يرجى اختيار التصنيف");
      return;
    }

    if (!unitId) {
      toast.error("يرجى اختيار الوحدة");
      return;
    }

    const selectedCategory = categories.find((item) => item.id === categoryId);

    const selectedUnit = units.find((item) => item.id === unitId);

    if (!selectedCategory || !selectedUnit) {
      toast.error("التصنيف أو الوحدة غير موجودة");
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const { error } = await supabase.from("products").insert({
        id: crypto.randomUUID(),
        companyId,
        name: name.trim(),

        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,

        unitId: selectedUnit.id,
        unitName: selectedUnit.name,

        status: "active",
        trackInventory: true,
        currentStock: 0,
        minStock: 0,

        createdAt: now,
        updatedAt: now,
        extra: {},
      });

      if (error) throw error;

      toast.success("تمت إضافة المنتج بنجاح");

      router.push("/erp/products");
      router.refresh();
    } catch (error: any) {
      console.error("Create product error:", error);

      toast.error(error?.message || "حدث خطأ أثناء إضافة المنتج");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[400px] items-center justify-center gap-3 text-blue-600"
      >
        <FiRefreshCw className="animate-spin text-xl" />
        <span>جارٍ تحميل البيانات...</span>
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

            <span className="text-blue-600">إضافة منتج</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">إضافة منتج جديد</h1>

          <p className="mt-2 text-sm text-slate-500">
            أدخل اسم المنتج وحدد تصنيفه ووحدة القياس.
          </p>
        </div>

        <Link
          href="/erp/products"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <FiArrowRight />
          العودة للمنتجات
        </Link>
      </div>

      {/* النموذج */}

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiPackage size={22} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">بيانات المنتج</h2>

              <p className="mt-1 text-xs text-slate-500">
                البيانات الأساسية للمنتج.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* اسم المنتج */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                اسم المنتج <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiPackage className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="مثال: عسل سدر"
                  required
                />
              </div>
            </div>

            {/* التصنيف */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-700">
                  التصنيف <span className="text-red-500">*</span>
                </label>

                <Link
                  href="/erp/categories/new"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <FiPlus />
                  إضافة تصنيف
                </Link>
              </div>

              <div className="relative">
                <FiLayers className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`${inputClass} pr-11`}
                  required
                >
                  <option value="">اختر التصنيف</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {categories.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  لا توجد تصنيفات. أضف تصنيفًا جديدًا أولًا.
                </p>
              )}
            </div>

            {/* الوحدة */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                وحدة القياس <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiBox className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className={`${inputClass} pr-11`}
                  required
                >
                  <option value="">اختر الوحدة</option>

                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                      {unit.symbol ? ` (${unit.symbol})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {units.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  لا توجد وحدات قياس مرتبطة بهذه الشركة.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* الأزرار */}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            href="/erp/products"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={saving || categories.length === 0 || units.length === 0}
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
                حفظ المنتج
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
