"use client";

import Link from "next/link";
import { useState } from "react";
import { FiArrowRight, FiPackage, FiSave, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { useProductsStore } from "@/Store/productsStore";

export default function NewProductPage() {
  /* ======================================================
     ZUSTAND
  ====================================================== */

  const products = useProductsStore((state) => state.products);

  const addProduct = useProductsStore((state) => state.addProduct);

  /* ======================================================
     FORM
  ====================================================== */

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  /* ======================================================
     SAVE PRODUCT
  ====================================================== */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanUnit = unit.trim();
    const cleanCategory = category.trim();

    /* ==================================================
       VALIDATION
    ================================================== */

    if (!cleanName) {
      toast.error("يرجى إدخال اسم الصنف.");
      return;
    }

    if (!cleanUnit) {
      toast.error("يرجى إدخال وحدة الصنف.");
      return;
    }

    if (!cleanCategory) {
      toast.error("يرجى إدخال تصنيف الصنف.");
      return;
    }

    /* ==================================================
       DUPLICATE NAME
    ================================================== */

    const duplicateName = products.some(
      (product) =>
        product.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );

    if (duplicateName) {
      toast.error("اسم الصنف موجود بالفعل، يرجى استخدام اسم آخر.");
      return;
    }

    /* ==================================================
       ADD PRODUCT TO ZUSTAND

       الكود يتم إنشاؤه تلقائيًا داخل productsStore
    ================================================== */

    addProduct({
      name: cleanName,
      unit: cleanUnit,
      category: cleanCategory,
      isActive: true,
    });

    /* ==================================================
       CLEAR FORM
    ================================================== */

    setName("");
    setUnit("");
    setCategory("");

    /* ==================================================
       SUCCESS TOAST
    ================================================== */

    toast.success("تم إضافة الصنف بنجاح.", {
      description: "تم حفظ الصنف ويمكنك الآن إضافة صنف آخر.",
      duration: 3000,
    });
  };

  /* ======================================================
     CLEAR FORM
  ====================================================== */

  const handleClear = () => {
    setName("");
    setUnit("");
    setCategory("");

    toast.success("تم تفريغ الحقول.");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-3 sm:p-4">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Breadcrumb */}

          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-gray-400">
            <Link href="/" className="transition hover:text-green-600">
              الرئيسية
            </Link>

            <FiArrowRight size={11} />

            <Link href="/products" className="transition hover:text-green-600">
              الأصناف
            </Link>

            <FiArrowRight size={11} />

            <span className="font-medium text-gray-700">صنف جديد</span>
          </div>

          {/* Title */}

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FiPackage size={18} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">
                إضافة صنف جديد
              </h1>

              <p className="mt-0.5 text-[11px] text-gray-500">
                إضافة البيانات الأساسية للصنف
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            BACK
        ================================================== */}

        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <FiArrowRight size={14} />
          العودة للأصناف
        </Link>
      </div>

      {/* ==================================================
          FORM
      ================================================== */}

      <form onSubmit={handleSubmit}>
        <section className="w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* ==================================================
              FORM HEADER
          ================================================== */}

          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <FiPackage size={17} className="text-green-600" />

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  بيانات الصنف
                </h2>

                <p className="mt-0.5 text-[10px] text-gray-400">
                  أدخل البيانات الأساسية للصنف.
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              FIELDS
          ================================================== */}

          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* ==================================================
                  NAME
              ================================================== */}

              <div>
                <label
                  htmlFor="product-name"
                  className="mb-1.5 block text-xs font-semibold text-gray-700"
                >
                  اسم الصنف
                </label>

                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="مثال: عسل سدر"
                  autoFocus
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-50"
                />
              </div>

              {/* ==================================================
                  UNIT
              ================================================== */}

              <div>
                <label
                  htmlFor="product-unit"
                  className="mb-1.5 block text-xs font-semibold text-gray-700"
                >
                  الوحدة
                </label>

                <input
                  id="product-unit"
                  type="text"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="مثال: كيلو"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-50"
                />
              </div>

              {/* ==================================================
                  CATEGORY
              ================================================== */}

              <div>
                <label
                  htmlFor="product-category"
                  className="mb-1.5 block text-xs font-semibold text-gray-700"
                >
                  التصنيف
                </label>

                <input
                  id="product-category"
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="مثال: العسل"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-50"
                />
              </div>
            </div>

            {/* ==================================================
                PRODUCT CODE INFO
            ================================================== */}

            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                  <FiPackage size={14} />
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-blue-800">
                    ترقيم الصنف
                  </h3>

                  <p className="mt-0.5 text-[10px] leading-5 text-blue-700">
                    يتم إنشاء كود الصنف تلقائيًا بواسطة النظام عند الحفظ، ويبدأ
                    من 1001 دون تكرار الأكواد المستخدمة.
                  </p>
                </div>
              </div>
            </div>

            {/* ==================================================
                PRICE / STOCK INFO
            ================================================== */}

            <div className="mt-2.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                  <FiPackage size={14} />
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-amber-800">
                    الكمية والسعر
                  </h3>

                  <p className="mt-0.5 text-[10px] leading-5 text-amber-700">
                    لا يتم إدخال الكمية أو سعر الشراء عند إنشاء الصنف. يتم
                    تحديدهما عند تسجيل فاتورة المشتريات.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              BUTTONS
          ================================================== */}

          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            {/* CLEAR */}

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              <FiX size={14} />
              تفريغ الحقول
            </button>

            {/* SAVE */}

            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-5 text-xs font-semibold text-white transition hover:bg-green-700"
            >
              <FiSave size={15} />
              حفظ الصنف
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}
