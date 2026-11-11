"use client";

import Link from "next/link";
import { FiArrowRight, FiCode, FiHome, FiTool, FiGrid } from "react-icons/fi";

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4"
    >
      <div className="w-full max-w-2xl text-center">
        {/* شعار النظام */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 shadow-xl shadow-slate-900/20">
          <FiGrid size={42} className="text-blue-400" />
        </div>

        {/* اسم النظام */}
        <h2 className="mb-3 text-sm font-bold tracking-widest text-blue-600">
          WEZZAN
        </h2>

        {/* العنوان */}
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          هذه الصفحة غير متوفرة
        </h1>

        {/* الوصف */}
        <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-slate-500 sm:text-base">
          عذراً، الصفحة التي تحاول الوصول إليها غير متوفرة حالياً،
          <br className="hidden sm:block" />
          أو ربما لم تتم إضافتها إلى النظام بعد.
        </p>

        {/* حالة الصفحة */}
        <div className="mx-auto mt-7 flex max-w-md items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-right">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <FiTool size={23} />
          </div>

          <div>
            <p className="font-bold text-slate-800">الصفحة قيد التطوير</p>

            <p className="mt-1 text-xs leading-6 text-slate-500">
              نعمل على تطوير المزيد من الخصائص لتحسين تجربتك مع WEZZAN.
            </p>
          </div>
        </div>

        {/* الأزرار */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
          >
            <FiHome size={18} />
            الصفحة الرئيسية
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <FiArrowRight size={18} />
            العودة للصفحة السابقة
          </button>
        </div>

        {/* التذييل */}
        <div className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-xs font-semibold tracking-wider text-slate-400">
            WEZZAN ERP
          </p>

          <p className="mt-2 text-xs text-slate-400">
            نظام متكامل لإدارة الأعمال والمحاسبة
          </p>
        </div>
      </div>
    </main>
  );
}
