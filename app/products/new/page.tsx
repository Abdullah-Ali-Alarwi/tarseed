"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBox,
  FiCheck,
  FiHash,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";
import { useERPStore } from "@/Store/erpStore";

export default function NewProductPage() {
  /* =========================================================
     ERP Store
  ========================================================= */

  const products = useERPStore((state) => state.products);
  const addProduct = useERPStore((state) => state.addProduct);

  /* =========================================================
     الحالات
  ========================================================= */

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("كيلو");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     حساب الكود المتوقع
  ========================================================= */

  const productCode = useMemo(() => {
    const codes = products
      .map((product) => Number(product.code))
      .filter((code) => Number.isFinite(code));

    if (codes.length === 0) {
      return 1001;
    }

    return Math.max(...codes) + 1;
  }, [products]);

  /* =========================================================
     حفظ المنتج
  ========================================================= */

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();

    if (!cleanName) {
      setError("يرجى إدخال اسم الصنف");

      toast.error("لم تتم إضافة الصنف", {
        description: "يرجى إدخال اسم الصنف أولاً.",
        duration: 4000,
      });

      return;
    }

    try {
      const newProduct = addProduct({
        name: cleanName,
        unit: unit.trim() || "وحدة",
        category: category.trim() || "عام",
        description: description.trim(),
        isActive,
      });

      if (!newProduct) {
        setError("حدث خطأ أثناء إضافة الصنف");

        toast.error("فشل إضافة الصنف", {
          description: "حدث خطأ أثناء حفظ بيانات الصنف.",
          duration: 4000,
        });

        return;
      }

      toast.success("تمت إضافة الصنف بنجاح", {
        description: `تم حفظ "${newProduct.name}" برقم الصنف ${newProduct.code}`,
        duration: 4000,
      });

      setName("");
      setUnit("كيلو");
      setCategory("");
      setDescription("");
      setIsActive(true);
      setError("");
    } catch (error) {
      console.error("Error adding product:", error);

      setError("حدث خطأ أثناء إضافة الصنف");

      toast.error("حدث خطأ أثناء إضافة الصنف", {
        description: "تعذر حفظ بيانات الصنف.",
        duration: 4000,
      });
    }
  };

  /* =========================================================
     إفراغ النموذج
  ========================================================= */

  const handleReset = () => {
    setName("");
    setUnit("كيلو");
    setCategory("");
    setDescription("");
    setIsActive(true);
    setError("");

    toast.info("تم إفراغ النموذج", {
      description: "تمت إعادة جميع الحقول إلى حالتها الافتراضية.",
      duration: 3000,
    });
  };

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-gray-50 p-2.5 sm:p-3 md:p-4 lg:p-5"
    >
      <div className="mx-auto max-w-6xl">
        {/* =====================================================
            Header
        ===================================================== */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-xs">
              <Link href="/" className="transition hover:text-gray-900">
                الرئيسية
              </Link>

              <FiArrowRight size={11} className="text-gray-400" />

              <Link href="/products" className="transition hover:text-gray-900">
                الأصناف
              </Link>

              <FiArrowRight size={11} className="text-gray-400" />

              <span className="text-gray-800">إضافة صنف</span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              إضافة صنف جديد
            </h1>

            <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
              أضف صنفًا جديدًا إلى قائمة الأصناف
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <FiArrowRight size={14} />
            العودة إلى الأصناف
          </Link>
        </div>

        {/* =====================================================
            Error
        ===================================================== */}

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            Form
        ===================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* =================================================
                Main Form
            ================================================= */}

            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Card Header */}

                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FiBox size={18} />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-gray-900">
                        بيانات الصنف
                      </h2>

                      <p className="mt-0.5 text-[10px] text-gray-500">
                        أدخل البيانات الأساسية للصنف
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}

                <div className="space-y-4 p-4">
                  {/* =================================================
                      Product Code
                  ================================================= */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      كود الصنف
                    </label>

                    <div className="relative">
                      <FiHash
                        size={15}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        value={productCode}
                        readOnly
                        className="h-10 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 pe-9 ps-3 text-xs text-gray-600 outline-none"
                      />
                    </div>

                    <p className="mt-1 text-[10px] text-gray-400">
                      يتم إنشاء الكود تلقائيًا بواسطة النظام.
                    </p>
                  </div>

                  {/* =================================================
                      Product Name
                  ================================================= */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      اسم الصنف
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      placeholder="مثال: عسل سدر"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      autoFocus
                    />
                  </div>

                  {/* =================================================
                      Unit + Category
                  ================================================= */}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Unit */}

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        وحدة القياس
                      </label>

                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="كيلو">كيلو</option>

                        <option value="جرام">جرام</option>

                        <option value="لتر">لتر</option>

                        <option value="مل">مل</option>

                        <option value="قطعة">قطعة</option>

                        <option value="كرتون">كرتون</option>

                        <option value="علبة">علبة</option>

                        <option value="عبوة">عبوة</option>

                        <option value="وحدة">وحدة</option>

                        <option value="خدمة">خدمة</option>
                      </select>
                    </div>

                    {/* Category */}

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        التصنيف
                      </label>

                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="مثال: عسل"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* =================================================
                      Description
                  ================================================= */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      وصف الصنف
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اكتب وصفًا مختصرًا للصنف..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* =================================================
                      Active
                  ================================================= */}

                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <label className="flex cursor-pointer items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">
                          الصنف نشط
                        </p>

                        <p className="mt-0.5 text-[10px] text-gray-500">
                          يمكن استخدام الصنف في المبيعات والمشتريات
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                          isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                        aria-label="تفعيل أو تعطيل الصنف"
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                            isActive ? "right-0.5" : "right-4.5"
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </div>

                {/* =================================================
                    Actions
                ================================================= */}

                <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:justify-start">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <FiTrash2 size={14} />
                    إفراغ
                  </button>

                  <button
                    type="submit"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                  >
                    <FiSave size={14} />
                    حفظ الصنف
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================
                Side Information
            ================================================= */}

            <div className="space-y-3">
              {/* =================================================
                  Preview
              ================================================= */}

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <FiBox size={18} />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      معاينة الصنف
                    </h2>

                    <p className="mt-0.5 text-[10px] text-gray-500">
                      البيانات التي سيتم حفظها
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Code */}

                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <span className="text-[11px] text-gray-500">الكود</span>

                    <span className="font-semibold text-xs text-gray-900">
                      {productCode}
                    </span>
                  </div>

                  {/* Name */}

                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
                    <span className="text-[11px] text-gray-500">الصنف</span>

                    <span className="max-w-[160px] truncate text-xs font-semibold text-gray-900">
                      {name.trim() || "—"}
                    </span>
                  </div>

                  {/* Unit */}

                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <span className="text-[11px] text-gray-500">الوحدة</span>

                    <span className="text-xs font-medium text-gray-800">
                      {unit || "—"}
                    </span>
                  </div>

                  {/* Category */}

                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
                    <span className="text-[11px] text-gray-500">التصنيف</span>

                    <span className="max-w-[160px] truncate text-xs font-medium text-gray-800">
                      {category.trim() || "عام"}
                    </span>
                  </div>

                  {/* Status */}

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">الحالة</span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isActive ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================================
                  Storage Info
              ================================================= */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3.5">
                <div className="flex gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <FiCheck size={15} />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-blue-900">
                      الحفظ التلقائي
                    </h3>

                    <p className="mt-1 text-[10px] leading-5 text-blue-700">
                      عند الضغط على حفظ سيتم إضافة الصنف إلى Zustand وحفظه
                      تلقائيًا في LocalStorage.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  Products Link
              ================================================= */}

              <Link
                href="/products"
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <FiBox size={14} />
                عرض جميع الأصناف
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
