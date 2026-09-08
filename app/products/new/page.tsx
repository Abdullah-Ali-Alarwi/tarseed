"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiArrowRight,
  FiPackage,
  FiSave,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function NewProductPage() {
  const products = useERPStore((state) => state.products);

  const addProduct = useERPStore((state) => state.addProduct);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  const [isSaved, setIsSaved] = useState(false);

  // ======================================================
  // حفظ الصنف
  // ======================================================

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanUnit = unit.trim();

    // التحقق من اسم الصنف
    if (!cleanName) {
      alert("يرجى إدخال اسم الصنف.");
      return;
    }

    // التحقق من الوحدة
    if (!cleanUnit) {
      alert("يرجى إدخال وحدة الصنف.");
      return;
    }

    // منع تكرار اسم الصنف
    const duplicateName = products.some(
      (product) =>
        product.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );

    if (duplicateName) {
      alert("اسم الصنف موجود بالفعل، يرجى استخدام اسم آخر.");
      return;
    }

    // ==================================================
    // إضافة الصنف
    //
    // كود الصنف يتم إنشاؤه داخل Zustand
    // ==================================================

    addProduct({
      name: cleanName,
      unit: cleanUnit,
    });

    // تفريغ الحقول بعد الحفظ
    setName("");
    setUnit("");

    // إظهار حالة الحفظ
    setIsSaved(true);

    alert("تم إضافة الصنف بنجاح.");

    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  // ======================================================
  // تفريغ الحقول
  // ======================================================

  const handleClear = () => {
    setName("");
    setUnit("");
    setIsSaved(false);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 sm:p-6">
      {/* ==================================================
          Header
      ================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-green-600 transition">
              الرئيسية
            </Link>

            <FiArrowRight size={14} />

            <Link href="/products" className="hover:text-green-600 transition">
              الأصناف
            </Link>

            <FiArrowRight size={14} />

            <span className="text-gray-800 font-medium">صنف جديد</span>
          </div>

          {/* Title */}

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FiPackage size={21} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                إضافة صنف جديد
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                إضافة البيانات الأساسية للصنف
              </p>
            </div>
          </div>
        </div>

        {/* Back */}

        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg text-sm font-semibold transition"
        >
          <FiArrowRight size={18} />
          العودة للأصناف
        </Link>
      </div>

      {/* ==================================================
          Success message
      ================================================== */}

      {isSaved && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <FiCheckCircle size={17} />
          </div>

          <div>
            <p className="text-sm font-bold text-green-700">
              تم حفظ الصنف بنجاح
            </p>

            <p className="text-xs text-green-600 mt-0.5">
              تم تفريغ الحقول ويمكنك إضافة صنف آخر.
            </p>
          </div>
        </div>
      )}

      {/* ==================================================
          Form
      ================================================== */}

      <form onSubmit={handleSubmit}>
        <section className="max-w-4xl bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}

          <div className="p-5 sm:p-6 border-b-2 border-gray-200">
            <div className="flex items-center gap-2">
              <FiPackage size={20} className="text-green-600" />

              <div>
                <h2 className="font-bold text-gray-900">بيانات الصنف</h2>

                <p className="text-sm text-gray-500 mt-1">
                  أدخل البيانات الأساسية فقط.
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* اسم الصنف */}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  اسم الصنف
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="مثال: اسم المنتج"
                  autoFocus
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                />
              </div>

              {/* الوحدة */}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  الوحدة
                </label>

                <input
                  type="text"
                  value={unit}
                  onChange={(event) => {
                    setUnit(event.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="مثال: كيس"
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition"
                />
              </div>
            </div>

            {/* ==================================================
                معلومات الكود
            ================================================== */}

            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiPackage size={16} />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-blue-800">
                    ترقيم الصنف
                  </h3>

                  <p className="text-[11px] sm:text-xs text-blue-700 leading-6 mt-1">
                    يتم إنشاء كود الصنف تلقائيًا بواسطة النظام عند الحفظ. لا
                    يمكن للمستخدم إدخال الكود أو تعديله.
                  </p>

                  <p className="text-[11px] sm:text-xs text-blue-700 leading-6">
                    يبدأ الترقيم من 1001 ويستمر تلقائيًا دون تكرار.
                  </p>
                </div>
              </div>
            </div>

            {/* ==================================================
                معلومات الأسعار والمخزون
            ================================================== */}

            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <FiPackage size={16} />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-amber-800">
                    الكمية والسعر
                  </h3>

                  <p className="text-[11px] sm:text-xs text-amber-700 leading-6 mt-1">
                    لا يتم إدخال الكمية أو سعر الشراء عند إنشاء الصنف. يتم تحديد
                    هذه البيانات عند تسجيل فاتورة المشتريات.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              Buttons
          ================================================== */}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-5 sm:px-6 py-5 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-sm transition"
            >
              <FiX size={17} />
              تفريغ الحقول
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition"
            >
              <FiSave size={18} />
              حفظ الصنف
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}
