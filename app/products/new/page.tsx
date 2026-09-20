"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  FiArrowRight,
  FiBox,
  FiCheck,
  FiFileText,
  FiHash,
  FiLayers,
  FiSave,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";
import { useProductsStore } from "@/Store/productsStore";

export default function NewProductPage() {
  const addProduct = useProductsStore((state) => state.addProduct);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("كيلو");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState("");

  const generatePreviewCode = useProductsStore(
    (state) => state.generateProductCode,
  );

  const productCode = generatePreviewCode();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();

    // التحقق من اسم المنتج
    if (!cleanName) {
      setError("يرجى إدخال اسم الصنف");

      toast.error("لم تتم إضافة الصنف", {
        description: "يرجى إدخال اسم الصنف أولاً.",
        duration: 4000,
      });

      return;
    }

    try {
      // إضافة المنتج إلى Zustand
      const newProduct = addProduct({
        name: cleanName,
        unit: unit.trim() || "وحدة",
        category: category.trim() || "عام",
        description: description.trim(),
        isActive,
      });

      // التأكد من نجاح الإضافة
      if (!newProduct) {
        setError("حدث خطأ أثناء إضافة الصنف");

        toast.error("فشل إضافة الصنف", {
          description: "حدث خطأ أثناء حفظ بيانات الصنف.",
          duration: 4000,
        });

        return;
      }

      // Toast نجاح الإضافة
      toast.success("تمت إضافة الصنف بنجاح", {
        description: `تم حفظ "${newProduct.name}" برقم الصنف ${newProduct.code}`,
        duration: 4000,
      });

      // تفريغ النموذج بعد نجاح الإضافة
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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Breadcrumb */}
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="transition hover:text-gray-900">
                الرئيسية
              </Link>

              <FiArrowRight className="text-gray-400" />

              <Link href="/products" className="transition hover:text-gray-900">
                الأصناف
              </Link>

              <FiArrowRight className="text-gray-400" />

              <span className="text-gray-800">إضافة صنف</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              إضافة صنف جديد
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              أضف صنفًا جديدًا إلى قائمة الأصناف
            </p>
          </div>

          {/* Back */}
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <FiArrowRight />
            العودة إلى الأصناف
          </Link>
        </div>

        {/* Error داخل الصفحة */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* =====================================================
                Main Form
            ====================================================== */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Card Header */}
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FiBox size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-900">بيانات الصنف</h2>

                      <p className="text-xs text-gray-500">
                        أدخل البيانات الأساسية للصنف
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5 p-5 sm:p-6">
                  {/* =====================================================
                      Product Code
                  ====================================================== */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      كود الصنف
                    </label>

                    <div className="relative">
                      <FiHash className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                      <input
                        type="text"
                        value={productCode}
                        readOnly
                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 py-3 pe-10 ps-4 text-gray-600 outline-none"
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-gray-400">
                      يتم إنشاء الكود تلقائيًا ولا يتم إعادة استخدام الأكواد
                      المحذوفة.
                    </p>
                  </div>

                  {/* =====================================================
                      Product Name
                  ====================================================== */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      اسم الصنف
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError("");
                        }}
                        placeholder="مثال: عسل سدر"
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pe-10 ps-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* =====================================================
                      Unit + Category
                  ====================================================== */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Unit */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        وحدة القياس
                      </label>

                      <div className="relative">
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pe-10 ps-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    </div>

                    {/* Category */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        التصنيف
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="مثال: عسل"
                          className="w-full rounded-xl border border-gray-200 bg-white py-3 pe-10 ps-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* =====================================================
                      Description
                  ====================================================== */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      وصف الصنف
                    </label>

                    <div className="relative">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="اكتب وصفًا مختصرًا للصنف..."
                        rows={5}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white py-3 pe-10 ps-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* =====================================================
                      Active
                  ====================================================== */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          الصنف نشط
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          يمكن استخدام الصنف في المبيعات والمشتريات
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                        aria-label="تفعيل أو تعطيل الصنف"
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                            isActive ? "right-1" : "right-6"
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </div>

                {/* =====================================================
                    Actions
                ====================================================== */}
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-start sm:px-6">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <FiTrash2 />
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                  >
                    <FiSave />
                    حفظ الصنف
                  </button>
                </div>
              </div>
            </div>

            {/* =====================================================
                Side Information
            ====================================================== */}
            <div className="space-y-5">
              {/* Preview */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <FiBox size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900">معاينة الصنف</h2>

                    <p className="text-xs text-gray-500">
                      البيانات التي سيتم حفظها
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Code */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-sm text-gray-500">الكود</span>

                    <span className="font-semibold text-gray-900">
                      {productCode}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                    <span className="text-sm text-gray-500">الصنف</span>

                    <span className="max-w-[180px] truncate font-semibold text-gray-900">
                      {name.trim() || "—"}
                    </span>
                  </div>

                  {/* Unit */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-sm text-gray-500">الوحدة</span>

                    <span className="font-medium text-gray-800">
                      {unit || "—"}
                    </span>
                  </div>

                  {/* Category */}
                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                    <span className="text-sm text-gray-500">التصنيف</span>

                    <span className="max-w-[180px] truncate font-medium text-gray-800">
                      {category.trim() || "عام"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">الحالة</span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
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

              {/* Storage Info */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <FiCheck />
                  </div>

                  <div>
                    <h3 className="font-semibold text-blue-900">
                      الحفظ التلقائي
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-blue-700">
                      عند الضغط على حفظ سيتم إضافة الصنف إلى Zustand وحفظه
                      تلقائيًا في LocalStorage، ويمكن الوصول إليه من صفحات
                      المبيعات والمشتريات والأصناف.
                    </p>
                  </div>
                </div>
              </div>

              {/* Products Link */}
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <FiBox />
                عرض جميع الأصناف
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
