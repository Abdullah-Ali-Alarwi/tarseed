"use client";

import Link from "next/link";
import { FiArrowRight, FiCode, FiHome, FiTool } from "react-icons/fi";

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
    >
      <div className="w-full max-w-2xl text-center">
        {/* الأيقونة */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#0E1F33] shadow-lg">
          <FiTool size={38} className="text-white" />
        </div>

        {/* العنوان */}
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          هذه الصفحة لم تُنشأ بعد
        </h1>

        {/* الوصف */}
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
          الصفحة التي تحاول الوصول إليها غير متوفرة حالياً.
          <br />
          يتم العمل عليها وستكون متاحة في الإصدارات القادمة.
        </p>

        {/* حالة التطوير */}
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-blue-800">
          <FiCode size={22} />

          <div className="text-right">
            <p className="font-semibold">الصفحة قيد التطوير</p>

            <p className="mt-1 text-xs text-blue-600">
              سيتم إضافة هذه الصفحة قريباً
            </p>
          </div>
        </div>

        {/* الأزرار */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {/* الرئيسية */}
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-6 text-sm font-semibold text-white transition hover:bg-[#162d47]"
          >
            <FiHome size={17} />
            الصفحة الرئيسية
          </Link>

          {/* رجوع */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <FiArrowRight size={17} />
            العودة للصفحة السابقة
          </button>
        </div>

        {/* اسم النظام */}
        <p className="mt-10 text-xs text-gray-400">
          نظام شركة الجابري للإدارة والمحاسبة
        </p>
      </div>
    </main>
  );
}
