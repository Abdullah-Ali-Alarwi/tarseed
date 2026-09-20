"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiBox,
  FiCheck,
  FiHash,
  FiLayers,
  FiSave,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";
import { useProductsStore } from "@/Store/productsStore";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const product = useProductsStore((state) =>
    state.products.find((item) => item.id === id),
  );

  const updateProduct = useProductsStore((state) => state.updateProduct);

  const deleteProduct = useProductsStore((state) => state.deleteProduct);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("كيلو");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // تحميل بيانات الصنف
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setUnit(product.unit || "وحدة");
      setCategory(product.category || "");
      setDescription(product.description || "");
      setIsActive(product.isActive !== false);
      setLoading(false);
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [product]);

  // الصنف غير موجود
  if (!loading && !product) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FiBox size={30} />
          </div>

          <h1 className="text-xl font-bold text-gray-900">الصنف غير موجود</h1>

          <p className="mt-2 text-sm text-gray-500">
            لم يتم العثور على الصنف المطلوب أو ربما تم حذفه.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <FiArrowRight />
            العودة إلى الأصناف
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !product) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <div className="text-sm text-gray-500">جاري تحميل بيانات الصنف...</div>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      toast.error("لم يتم حفظ التعديلات", {
        description: "يرجى إدخال اسم الصنف.",
        duration: 4000,
      });

      return;
    }

    try {
      setSaving(true);

      updateProduct(product.id, {
        name: cleanName,
        unit: unit.trim() || "وحدة",
        category: category.trim() || "عام",
        description: description.trim(),
        isActive,
      });

      toast.success("تم تحديث الصنف بنجاح", {
        description: `تم تحديث بيانات "${cleanName}".`,
        duration: 4000,
      });

      router.push("/products");
    } catch (error) {
      console.error("Error updating product:", error);

      toast.error("حدث خطأ أثناء التعديل", {
        description: "تعذر حفظ بيانات الصنف.",
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الصنف "${product.name}"؟`,
    );

    if (!confirmed) return;

    deleteProduct(product.id);

    toast.success("تم حذف الصنف", {
      description: `تم حذف "${product.name}" من النظام.`,
      duration: 4000,
    });

    router.push("/products");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <Link
            href="/products"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-blue-600"
          >
            <FiArrowRight />
            العودة إلى الأصناف
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <FiBox />
                <span>إدارة الأصناف</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                تعديل الصنف
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                تعديل بيانات الصنف مع الاحتفاظ برقم الصنف
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
              <FiHash className="text-blue-600" />

              <div>
                <p className="text-[11px] text-gray-500">رقم الصنف</p>

                <p className="font-mono font-bold text-gray-900">
                  {product.code}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Main form */}
            <div className="space-y-5 lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900">بيانات الصنف</h2>

                  <p className="mt-1 text-xs text-gray-500">
                    قم بتعديل البيانات المطلوبة
                  </p>
                </div>

                <div className="space-y-5 p-5">
                  {/* Code */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      رقم الصنف
                    </label>

                    <div className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-gray-100 px-4">
                      <FiHash className="text-gray-400" />

                      <span className="font-mono font-bold text-gray-700">
                        {product.code}
                      </span>

                      <span className="mr-auto text-xs text-gray-400">
                        لا يمكن تغييره
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      اسم الصنف
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <FiBox
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />

                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: عسل سدر"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Unit + Category */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        الوحدة
                      </label>

                      <div className="relative">
                        <FiLayers
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />

                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white pr-10 pl-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="كيلو">كيلو</option>
                          <option value="جرام">جرام</option>
                          <option value="لتر">لتر</option>
                          <option value="مل">مل</option>
                          <option value="حبة">حبة</option>
                          <option value="علبة">علبة</option>
                          <option value="كرتون">كرتون</option>
                          <option value="عبوة">عبوة</option>
                          <option value="وحدة">وحدة</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        التصنيف
                      </label>

                      <div className="relative">
                        <FiTag
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />

                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="مثال: عسل"
                          className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      وصف الصنف
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="اكتب وصفًا مختصرًا للصنف..."
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Status */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          حالة الصنف
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          يمكنك إيقاف الصنف بدلًا من حذفه
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative h-7 w-12 rounded-full transition ${
                          isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                        aria-label="تغيير حالة الصنف"
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                            isActive ? "right-1" : "right-6"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                      />

                      <span
                        className={isActive ? "text-green-700" : "text-red-700"}
                      >
                        {isActive ? "الصنف نشط" : "الصنف غير نشط"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <FiTrash2 />
                  حذف الصنف
                </button>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    إلغاء
                  </Link>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiSave />

                    {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900">معاينة الصنف</h2>

                  <p className="mt-1 text-xs text-gray-500">
                    الشكل الحالي للبيانات
                  </p>
                </div>

                <div className="p-5">
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                      <FiBox size={36} />
                    </div>

                    <div className="mt-5 text-center">
                      <h3 className="text-xl font-bold text-gray-900">
                        {name.trim() || "اسم الصنف"}
                      </h3>

                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                        <FiHash size={14} className="text-gray-400" />

                        <span className="font-mono text-sm font-bold text-gray-700">
                          {product.code}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-white p-3">
                        <span className="text-xs text-gray-500">الوحدة</span>

                        <span className="text-sm font-semibold text-gray-800">
                          {unit || "وحدة"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-white p-3">
                        <span className="text-xs text-gray-500">التصنيف</span>

                        <span className="text-sm font-semibold text-gray-800">
                          {category.trim() || "عام"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-white p-3">
                        <span className="text-xs text-gray-500">الحالة</span>

                        <span
                          className={`inline-flex items-center gap-2 text-sm font-semibold ${
                            isActive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />

                          {isActive ? "نشط" : "غير نشط"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex gap-3">
                      <FiCheck className="mt-0.5 shrink-0 text-blue-600" />

                      <div>
                        <p className="text-sm font-semibold text-blue-800">
                          ملاحظة
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                          رقم الصنف <strong>{product.code}</strong> ثابت ولا
                          يتغير عند تعديل البيانات.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
